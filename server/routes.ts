import { randomUUID } from "crypto";
import type { Express } from "express";
import { createServer, type Server } from "http";
import { z } from "zod";
import { storage } from "./storage";
import { insertMedicalFormSchema } from "@shared/schema";
import {
  formatSection7Text,
  enhanceSection7Dictation,
  formatSection8Text,
  enhanceSection8Dictation,
  generateSection11Conclusion,
} from "./ai-formatter";
import {
  enhancedFormatSection7Text,
  enhancedEnhanceSection7Dictation,
} from "./ai-formatter-enhanced";
import { aiProcessingEngine } from "./ai-processing-engine";
import {
  hashPassword,
  verifyPassword,
  generateUserId,
  getSessionConfig,
  requireAuth,
  requireAdmin,
} from "./auth";
import { setupInitialUsers } from "./setup-users";
import {
  transcribeAudioWithWhisper,
  transcribeAudioChunk,
  validateAudioFormat,
} from "./whisper-service";
import type { UploadedFile } from "express-fileupload";
import "./types";
import logger, { LogCategory, logApiRequest, logAuthEvent, logFormEvent, logVoiceEvent } from "@shared/logger";

// Backup function for session data
async function backupSessionToLocal(sessionData: any) {
  console.log("🔍 DEBUG: Attempting backup...", sessionData.id);

  try {
    console.log(
      "🔍 DEBUG: Sending to https://60b0-76-66-187-191.ngrok-free.app..."
    );

    const response = await fetch(
      "https://60b0-76-66-187-191.ngrok-free.app/save-complete-session",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(sessionData),
      }
    );

    console.log("🔍 DEBUG: Response status:", response.status);

    if (response.ok) {
      const result = await response.json();
      console.log(`💾 Backup successful: ${result.sessionId}`);
    } else {
      console.warn("Backup server responded with error:", response.status);
    }
  } catch (error) {
    console.warn("🔍 DEBUG: Backup failed:", error.message);
  }
}
// Helper function for safe error handling
function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}

// API request logging middleware
function logRequest(req: any, res: any, next: any) {
  const startTime = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const userId = req.user?.id;
    
    logApiRequest(
      req.method,
      req.path,
      res.statusCode,
      duration,
      userId
    );
  });
  
  next();
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Initialize logging
  logger.info(LogCategory.SYSTEM, 'server', 'ROUTES_INITIALIZATION_START', {
    nodeEnv: process.env.NODE_ENV,
    timestamp: new Date().toISOString()
  });

  // Setup initial users
  await setupInitialUsers();

  // Setup session middleware
  app.use(getSessionConfig());
  
  // Add request logging middleware to all routes
  app.use(logRequest);

  // Authentication routes
  app.post("/api/auth/login", async (req, res) => {
    const startTime = Date.now();
    const { username } = req.body;
    
    try {
      if (!username || !req.body.password) {
        logAuthEvent('LOGIN_FAILED', undefined, {
          reason: 'MISSING_CREDENTIALS',
          username: username || 'NOT_PROVIDED',
          duration: Date.now() - startTime
        });
        return res
          .status(400)
          .json({ message: "Username and password are required" });
      }

      const user = await storage.getUserByUsername(username);
      if (!user) {
        logAuthEvent('LOGIN_FAILED', undefined, {
          reason: 'USER_NOT_FOUND',
          username,
          duration: Date.now() - startTime
        });
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const isValidPassword = await verifyPassword(req.body.password, user.passwordHash);
      if (!isValidPassword) {
        logAuthEvent('LOGIN_FAILED', user.id, {
          reason: 'INVALID_PASSWORD',
          username,
          duration: Date.now() - startTime
        });
        return res.status(401).json({ message: "Invalid credentials" });
      }

      req.session.userId = user.id;
      req.session.userRole = user.role;

      logAuthEvent('LOGIN_SUCCESS', user.id, {
        username,
        role: user.role,
        duration: Date.now() - startTime
      });

      // Return user without password hash
      const { passwordHash, ...userWithoutPassword } = user;
      res.json({ user: userWithoutPassword });
    } catch (error) {
      logger.error(LogCategory.AUTH, 'auth-service', 'LOGIN_ERROR', {
        username,
        duration: Date.now() - startTime
      }, error as Error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    const userId = req.session.userId;
    
    req.session.destroy(() => {
      logAuthEvent('LOGOUT_SUCCESS', userId, {
        sessionDestroyed: true
      });
      res.json({ message: "Logged out successfully" });
    });
  });

  app.get("/api/auth/me", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId;
      if (!userId) {
        return res.status(401).json({ message: "Authentication required" });
      }
      const user = await storage.getUserById(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const { passwordHash, ...userWithoutPassword } = user;
      res.json({ user: userWithoutPassword });
    } catch (error) {
      console.error("Get current user error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Protected medical forms routes
  app.get("/api/medical-forms", requireAuth, async (req, res) => {
    try {
      const forms = await storage.getAllMedicalForms();
      res.json(forms);
    } catch (error) {
      res.status(500).json({ message: "Failed to retrieve medical forms" });
    }
  });

  // Get a specific medical form
  app.get("/api/medical-forms/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid form ID" });
      }

      const form = await storage.getMedicalForm(id);
      if (!form) {
        return res.status(404).json({ message: "Medical form not found" });
      }

      res.json(form);
    } catch (error) {
      res.status(500).json({ message: "Failed to retrieve medical form" });
    }
  });

  // Create a new medical form
  app.post("/api/medical-forms", async (req, res) => {
    const startTime = Date.now();
    const userId = req.session?.userId;
    
    try {
      const validatedData = insertMedicalFormSchema.parse(req.body);
      
      logFormEvent('FORM_CREATE_ATTEMPT', 'new_form', {
        userId,
        fieldCount: Object.keys(validatedData).length,
        hasContent: !!validatedData.patientName || !!validatedData.employerName
      });
      
      const newForm = await storage.createMedicalForm(validatedData);
      
      logFormEvent('FORM_CREATE_SUCCESS', 'new_form', {
        userId,
        formId: newForm.id,
        duration: Date.now() - startTime
      });
      
      res.status(201).json(newForm);
    } catch (error) {
      if (error instanceof z.ZodError) {
        logFormEvent('FORM_CREATE_VALIDATION_ERROR', 'new_form', {
          userId,
          errorCount: error.errors.length,
          duration: Date.now() - startTime
        });
        return res.status(400).json({
          message: "Validation error",
          errors: error.errors,
        });
      }
      
      logger.error(LogCategory.FORM, 'form-handler', 'FORM_CREATE_ERROR', {
        userId,
        duration: Date.now() - startTime
      }, error as Error);
      
      res.status(500).json({ message: "Failed to create medical form" });
    }
  });

  // Update a medical form
  app.put("/api/medical-forms/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid form ID" });
      }

      const validatedData = insertMedicalFormSchema.partial().parse(req.body);
      const updatedForm = await storage.updateMedicalForm(id, validatedData);

      if (!updatedForm) {
        return res.status(404).json({ message: "Medical form not found" });
      }

      res.json(updatedForm);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: "Validation error",
          errors: error.errors,
        });
      }
      res.status(500).json({ message: "Failed to update medical form" });
    }
  });

  // Delete a medical form
  app.delete("/api/medical-forms/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid form ID" });
      }

      const deleted = await storage.deleteMedicalForm(id);
      if (!deleted) {
        return res.status(404).json({ message: "Medical form not found" });
      }

      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete medical form" });
    }
  });

  // Saved forms routes (authentication required)

  // Get all saved forms for the authenticated user, optionally filtered by type
  app.get("/api/saved-forms", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId;
      if (!userId) {
        return res.status(401).json({ message: "Authentication required" });
      }
      const { formType } = req.query;

      let savedForms;
      if (formType && (formType === "draft" || formType === "copy")) {
        savedForms = await storage.getSavedFormsByType(
          userId,
          formType as "draft" | "copy",
        );
      } else {
        savedForms = await storage.getSavedFormsByUserId(userId);
      }

      // Ensure consistent data format
      const processedForms = savedForms.map((form) => ({
        ...form,
        formData:
          typeof form.formData === "string"
            ? JSON.parse(form.formData)
            : form.formData,
      }));

      res.json(processedForms);
    } catch (error) {
      console.error("Get saved forms error:", error);
      res.status(500).json({ message: "Failed to fetch saved forms" });
    }
  });

  // Create a new saved form
  app.post("/api/saved-forms", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId;
      if (!userId) {
        return res.status(401).json({ message: "Authentication required" });
      }
      const {
        title,
        formData,
        retentionDays = 7,
        formType = "draft",
      } = req.body;

      if (!title || !formData) {
        return res
          .status(400)
          .json({ message: "Title and form data are required" });
      }

      if (retentionDays < 1 || retentionDays > 365) {
        return res
          .status(400)
          .json({ message: "Retention days must be between 1 and 365" });
      }

      if (!["draft", "copy"].includes(formType)) {
        return res
          .status(400)
          .json({ message: "Form type must be 'draft' or 'copy'" });
      }

      const savedForm = await storage.saveForm(
        userId,
        title,
        formData,
        retentionDays,
        formType,
      );
      res.status(201).json(savedForm);
    } catch (error) {
      console.error("Save form error:", error);
      res.status(500).json({ message: "Failed to save form" });
    }
  });

  // Get a specific saved form
  app.get("/api/saved-forms/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid form ID" });
      }

      const savedForm = await storage.getSavedForm(id);
      if (!savedForm) {
        return res.status(404).json({ message: "Saved form not found" });
      }

      // Check if the form belongs to the authenticated user
      if (savedForm.userId !== req.session.userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      res.json(savedForm);
    } catch (error) {
      console.error("Get saved form error:", error);
      res.status(500).json({ message: "Failed to fetch saved form" });
    }
  });

  // Delete a saved form
  app.delete("/api/saved-forms/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid form ID" });
      }

      const savedForm = await storage.getSavedForm(id);
      if (!savedForm) {
        return res.status(404).json({ message: "Saved form not found" });
      }

      // Check if the form belongs to the authenticated user
      if (savedForm.userId !== req.session.userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      await storage.deleteSavedForm(id);
      res.status(204).end();
    } catch (error) {
      console.error("Delete saved form error:", error);
      res.status(500).json({ message: "Failed to delete saved form" });
    }
  });

  // Cleanup expired forms (can be called periodically)
  app.post("/api/saved-forms/cleanup", requireAuth, async (req, res) => {
    try {
      await storage.cleanupExpiredForms();
      res.json({ message: "Cleanup completed" });
    } catch (error) {
      console.error("Cleanup error:", error);
      res.status(500).json({ message: "Failed to cleanup expired forms" });
    }
  });

  

  // Clean up expired forms (admin only)
  app.post("/api/cleanup-expired-forms", requireAdmin, async (req, res) => {
    try {
      const deletedCount = await storage.deleteExpiredForms();
      res.json({ deletedCount });
    } catch (error) {
      console.error("Cleanup expired forms error:", error);
      res.status(500).json({ message: "Failed to cleanup expired forms" });
    }
  });

  // Recent patients routes (authentication required)

  // Get recent patients for the authenticated user
  app.get("/api/recent-patients", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId;
      if (!userId) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const limit = parseInt(req.query.limit as string) || 10;
      const recentPatients = await storage.getRecentPatientsByUserId(
        userId,
        limit,
      );

      res.json(recentPatients);
    } catch (error) {
      console.error("Get recent patients error:", error);
      res.status(500).json({ message: "Failed to fetch recent patients" });
    }
  });

  // Create or update a recent patient entry
  app.post("/api/recent-patients", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId;
      if (!userId) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const {
        patientName,
        visitType,
        formType,
        formData,
        savedFormId,
        patientAge,
        patientGender,
        diagnosis,
      } = req.body;

      if (!patientName || !visitType) {
        return res
          .status(400)
          .json({ message: "Patient name and visit type are required" });
      }

      const recentPatient = await storage.createRecentPatient({
        userId,
        patientName,
        visitType,
        formType: formType || "cnesst-medical",
        formData,
        savedFormId,
        patientAge,
        patientGender,
        diagnosis,
        lastAccessedAt: new Date(),
      });

      // Cleanup old entries to maintain reasonable list size
      await storage.cleanupOldRecentPatients(userId, 20);

      res.status(201).json(recentPatient);
    } catch (error) {
      console.error("Create recent patient error:", error);
      res
        .status(500)
        .json({ message: "Failed to create recent patient entry" });
    }
  });

  // Update last accessed time for a patient
  app.patch("/api/recent-patients/access", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId;
      if (!userId) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const { patientName } = req.body;
      if (!patientName) {
        return res.status(400).json({ message: "Patient name is required" });
      }

      await storage.updateRecentPatientAccess(userId, patientName);
      res.status(204).send();
    } catch (error) {
      console.error("Update recent patient access error:", error);
      res.status(500).json({ message: "Failed to update patient access" });
    }
  });

  // Delete a recent patient entry
  app.delete("/api/recent-patients/:id", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId;
      if (!userId) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid patient ID" });
      }

      const deleted = await storage.deleteRecentPatient(id);
      if (!deleted) {
        return res.status(404).json({ message: "Recent patient not found" });
      }

      res.status(204).send();
    } catch (error) {
      console.error("Delete recent patient error:", error);
      res.status(500).json({ message: "Failed to delete recent patient" });
    }
  });

  // AI formatting for Section 7
  app.post("/api/format-section7", async (req, res) => {
    try {
      const { text, language = "fr" } = req.body;

      if (!text) {
        return res.status(400).json({ message: "Text is required" });
      }

      if (!process.env.OPENAI_API_KEY) {
        return res.status(500).json({
          message: "OpenAI API key not configured",
          error: "API_KEY_MISSING",
        });
      }

      const formattedText = await formatSection7Text(text, language);
      res.json({ formatted: formattedText });
    } catch (error) {
      console.error("Format Section 7 error:", error);

      // Check if it's an OpenAI API error
      if (error instanceof Error && error.message.includes("API")) {
        return res.status(500).json({
          message: "OpenAI API error - please check your API key",
          error: "API_ERROR",
        });
      }

      res.status(500).json({
        message: "Failed to format text",
        error: error.message || "Unknown error",
      });
    }
  });

  // AI enhancement for Section 7 dictation
  app.post("/api/enhance-section7-dictation", async (req, res) => {
    try {
      const { transcript, language = "fr" } = req.body;

      if (!transcript) {
        return res.status(400).json({ message: "Transcript is required" });
      }

      const enhanced = await enhanceSection7Dictation(transcript, language);
      res.json(enhanced);
    } catch (error) {
      console.error("Enhance Section 7 dictation error:", error);
      res.status(500).json({ message: "Failed to enhance dictation" });
    }
  });

  // AI formatting for Section 8
  app.post("/api/format-section8", async (req, res) => {
    try {
      const { text, language = "fr" } = req.body;

      if (!text) {
        return res.status(400).json({ message: "Text is required" });
      }

      if (!process.env.OPENAI_API_KEY) {
        return res.status(500).json({
          message: "OpenAI API key not configured",
          error: "API_KEY_MISSING",
        });
      }

      const formattedText = await formatSection8Text(text, language);
      res.json({ formatted: formattedText });
    } catch (error) {
      console.error("Format Section 8 error:", error);

      // Check if it's an OpenAI API error
      if (error.message && error.message.includes("API")) {
        return res.status(500).json({
          message: "OpenAI API error - please check your API key",
          error: "API_ERROR",
        });
      }

      res.status(500).json({
        message: "Failed to format text",
        error: error.message || "Unknown error",
      });
    }
  });

  // AI enhancement for Section 8 dictation
  app.post("/api/enhance-section8-dictation", async (req, res) => {
    try {
      const { transcript, language = "fr" } = req.body;

      if (!transcript) {
        return res.status(400).json({ message: "Transcript is required" });
      }

      const enhanced = await enhanceSection8Dictation(transcript, language);
      res.json(enhanced);
    } catch (error) {
      console.error("Enhance Section 8 dictation error:", error);
      res.status(500).json({ message: "Failed to enhance dictation" });
    }
  });

  // Legacy AI generation for Section 11 - redirects to modular endpoint
  app.post("/api/generate-section11", async (req, res) => {
    try {
      const { formData, language = "fr" } = req.body;

      // Redirect to modular AI processing endpoint
      const response = await fetch(
        `${req.protocol}://${req.get("host")}/api/ai/process-field`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            fieldId: "section11",
            processingType: "generate",
            formType: "cnesst-medical-evaluation",
            formData,
            language,
          }),
        },
      );

      const result = await response.json();
      res.json(result);
    } catch (error) {
      console.error("Generate Section 11 error:", error);
      res.status(500).json({
        message: "Failed to generate conclusion",
        error: error.message || "Unknown error",
      });
    }
  });

  // New modular AI processing endpoint
  app.post("/api/ai/process-field", async (req, res) => {
    try {
      const {
        fieldId,
        processingType,
        formType,
        formData,
        language = "fr",
        contextFields,
        targetFields,
        prompt,
      } = req.body;

      if (!fieldId || !processingType || !formType || !formData) {
        return res.status(400).json({ message: "Missing required parameters" });
      }

      if (!process.env.OPENAI_API_KEY) {
        return res.status(500).json({
          message: "OpenAI API key not configured",
          error: "API_KEY_MISSING",
        });
      }

      const rule = {
        fieldId,
        processingType,
        language,
        contextFields,
        targetFields,
        prompt,
      };

      const context = {
        formData,
        formType,
        language,
      };

      const result = await aiProcessingEngine.processField(rule, context);

      if (result.success) {
        res.json({
          success: true,
          processedData: result.processedData,
        });
      } else {
        res.status(400).json({
          success: false,
          error: result.error || "Processing failed",
        });
      }
    } catch (error) {
      console.error("AI processing error:", error);

      if (error.message && error.message.includes("API")) {
        return res.status(500).json({
          message: "OpenAI API error - please check your API key",
          error: "API_ERROR",
        });
      }

      res.status(500).json({
        message: "Failed to process field with AI",
        error: error.message || "Unknown error",
      });
    }
  });

  // Section 8 medical history distribution endpoint
  app.post("/api/ai/distribute-section8", async (req, res) => {
    try {
      const { text, language = "fr" } = req.body;

      if (!text) {
        return res.status(400).json({ message: "Text is required" });
      }

      if (!process.env.OPENAI_API_KEY) {
        return res.status(500).json({
          message: "OpenAI API key not configured",
          error: "API_KEY_MISSING",
        });
      }

      // Import the AI formatter function
      const { distributeSection8MedicalHistory } = await import(
        "./ai-formatter-v2"
      );

      const result = await distributeSection8MedicalHistory(text, language);

      if (result.success) {
        // Map the distributions to the correct field names
        const mappedDistributions = {
          appreciation: result.distributions.appreciation || "",
          plaintes: result.distributions.plaintes || "",
          impact: result.distributions.impact || "",
        };

        res.json({
          success: true,
          ...mappedDistributions,
        });
      } else {
        res.status(500).json({
          success: false,
          message: "Failed to distribute Section 8 content",
        });
      }
    } catch (error) {
      console.error("Section 8 distribution error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error during Section 8 distribution",
      });
    }
  });

  // Enhanced physical examination distribution endpoint
  app.post("/api/ai/distribute-physical-exam", async (req, res) => {
    try {
      const { text, language = "fr", contextData = {} } = req.body;

      if (!text) {
        return res.status(400).json({ message: "Text is required" });
      }

      if (!process.env.OPENAI_API_KEY) {
        return res.status(500).json({
          message: "OpenAI API key not configured",
          error: "API_KEY_MISSING",
        });
      }

      const rule = {
        fieldId: "examen_physique_input",
        processingType: "distribute" as const,
        language: language as "fr" | "en",
        targetFields: [
          "examen_attitude_marche",
          "examen_inspection_palpation",
          "examen_amplitudes_articulaires",
          "examen_force_musculaire",
          "examen_reflexes",
          "examen_tests_speciaux",
          "examen_membre_sain",
        ],
        contextFields: ["diagnostic_principal", "histoire_evolution"],
        prompt:
          "Distribute this physical examination description into the appropriate subsections. Analyze the text and place relevant content in each category.",
      };

      const context = {
        formData: {
          examen_physique_input: text,
          ...contextData,
        },
        formType: "cnesst-medical",
        language: language as "fr" | "en",
      };

      const result = await aiProcessingEngine.processField(rule, context);

      if (result.success) {
        res.json({
          success: true,
          distributions: result.processedData || {},
        });
      } else {
        res.status(400).json({
          success: false,
          error: result.error || "Distribution failed",
        });
      }
    } catch (error) {
      console.error("Section 8 distribution error:", error);

      if (error.message && error.message.includes("API")) {
        return res.status(500).json({
          message: "OpenAI API error - please check your API key",
          error: "API_ERROR",
        });
      }

      res.status(500).json({
        message: "Failed to distribute Section 8 content",
        error: error.message || "Unknown error",
      });
    }
  });

  // Enhanced Section 7 formatting with Quebec medical training
  app.post("/api/ai/enhanced-format-section7", async (req, res) => {
    try {
      const { text, language = "fr" } = req.body;

      if (!text) {
        return res.status(400).json({ message: "Text is required" });
      }

      const formattedText = await enhancedFormatSection7Text(text, language);
      res.json({ formattedText });
    } catch (error: any) {
      console.error("Enhanced Section 7 formatting error:", error);
      res.status(500).json({
        message: "Failed to format Section 7 text",
        error: error.message || "Unknown error",
      });
    }
  });

  // Enhanced Section 7 dictation improvement with Quebec standards
  app.post("/api/ai/enhanced-enhance-section7-dictation", async (req, res) => {
    try {
      const { transcript, language = "fr" } = req.body;

      if (!transcript) {
        return res.status(400).json({ message: "Transcript is required" });
      }

      const result = await enhancedEnhanceSection7Dictation(
        transcript,
        language,
      );
      res.json({
        enhancedText: result.formatted,
        suggestions: result.suggestions,
      });
    } catch (error: any) {
      console.error("Enhanced Section 7 dictation enhancement error:", error);
      res.status(500).json({
        message: "Failed to enhance Section 7 dictation",
        error: error.message || "Unknown error",
      });
    }
  });

  // Whisper API transcription endpoint with backup
  app.post("/api/transcribe-whisper", async (req, res) => {
    const startTime = Date.now();

    try {
      const {
        language = "auto",
        enhanceText = true,
        section,
        fieldName,
        formData,
      } = req.body;

      if (!req.files || !req.files.audio) {
        return res.status(400).json({ message: "Audio file is required" });
      }

      if (!process.env.OPENAI_API_KEY) {
        return res.status(500).json({
          message: "OpenAI API key not configured",
          error: "API_KEY_MISSING",
        });
      }

      const audioFile = req.files.audio as UploadedFile;

      // Validate audio format
      if (!validateAudioFormat(audioFile.mimetype)) {
        return res.status(400).json({
          message:
            "Unsupported audio format. Supported formats: webm, wav, mp3, mp4, m4a, ogg, flac",
          error: "INVALID_FORMAT",
        });
      }

      console.log(
        `🎤 Processing Whisper transcription: ${audioFile.name} (${audioFile.size} bytes)`,
      );

      // Your existing transcription logic
      const result = await transcribeAudioWithWhisper(audioFile.data, {
        language: language as "fr" | "en" | "auto",
        enhanceText,
      });

      // 🆕 BACKUP SESSION DATA
      const sessionData = {
        id: randomUUID(),
        timestamp: new Date().toISOString(),
        userId: req.session?.userId || "anonymous",

        // Audio data
        audio: {
          data: audioFile.data.toString("base64"),
          duration: result.duration,
          fileSize: audioFile.size,
          originalName: audioFile.name,
        },

        // Transcription chain
        transcription: {
          raw: result.text,
          enhanced: result.enhanced,
          confidence: result.confidence || 0.95,
        },

        // Form context
        form: {
          section: section,
          fieldName: fieldName,
          currentData: formData,
        },

        // Performance metrics
        performance: {
          transcriptionTime: Date.now() - startTime,
          totalTime: Date.now() - startTime,
        },

        // Session info
        session: {
          sessionId: req.sessionID,
          language: language,
          enhanceText: enhanceText,
        },
      };

      // Send to backup server (non-blocking)
      backupSessionToLocal(sessionData).catch(console.warn);

      // Your existing response
      res.json({
        success: true,
        transcription: result.text,
        enhanced: result.enhanced,
        duration: result.duration,
        language: result.language,
        confidence: result.confidence || 0.95,
      });
    } catch (error) {
      // Backup error info too
      const errorData = {
        id: randomUUID(),
        timestamp: new Date().toISOString(),
        userId: req.session?.userId || "anonymous",
        error: {
          message: error.message,
          type: "transcription_error",
          processingTime: Date.now() - startTime,
        },
        form: {
          section: req.body.section,
          fieldName: req.body.fieldName,
        },
      };

      backupSessionToLocal(errorData).catch(console.warn);

      console.error("Whisper transcription error:", error);

      if (error instanceof Error && error.message.includes("API")) {
        return res.status(500).json({
          message: "OpenAI Whisper API error - please check your API key",
          error: "WHISPER_API_ERROR",
        });
      }

      res.status(500).json({
        message: "Failed to transcribe audio",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  // Whisper chunk transcription endpoint for long recordings
  // Whisper chunk transcription endpoint for long recordings
  app.post("/api/transcribe-whisper-chunk", async (req, res) => {
    try {
      const {
        chunkIndex: rawChunkIndex = 0,
        language = "auto",
        enhanceText = true,
        sessionId,
        totalChunks: rawTotalChunks,
      } = req.body;

      if (!req.files || !req.files.audio) {
        return res.status(400).json({ message: "Audio chunk is required" });
      }

      if (!process.env.OPENAI_API_KEY) {
        return res.status(500).json({
          message: "OpenAI API key not configured",
          error: "API_KEY_MISSING",
        });
      }

      // Convert and validate chunk parameters
      const chunkIndex = parseInt(rawChunkIndex.toString(), 10);
      const totalChunks = rawTotalChunks
        ? parseInt(rawTotalChunks.toString(), 10)
        : undefined;

      if (isNaN(chunkIndex) || chunkIndex < 0) {
        return res.status(400).json({
          message: `Invalid chunk index: ${rawChunkIndex}`,
          error: "INVALID_CHUNK_INDEX",
        });
      }

      const audioFile = req.files.audio as UploadedFile;

      console.log(
        `🎵 Processing Whisper chunk ${chunkIndex + 1}: ${audioFile.name} (${audioFile.size} bytes)`,
      );

      if (
        totalChunks &&
        (isNaN(totalChunks) || totalChunks <= 0 || chunkIndex >= totalChunks)
      ) {
        return res.status(400).json({
          message: `Invalid chunk parameters: ${chunkIndex}/${totalChunks}`,
          error: "INVALID_CHUNK_PARAMS",
        });
      }

      // Validate audio file
      if (!audioFile.size || audioFile.size === 0) {
        return res.status(400).json({
          message: "Empty audio file received",
          error: "EMPTY_AUDIO_FILE",
        });
      }

      if (audioFile.size < 1024) {
        // Less than 1KB
        return res.status(400).json({
          message: `Audio file too small (${audioFile.size} bytes). Recording may have failed.`,
          error: "AUDIO_FILE_TOO_SMALL",
        });
      }

      // Log session tracking information
      if (sessionId) {
        console.log(
          `📋 Session ${sessionId}: Processing chunk ${chunkIndex + 1}${totalChunks ? `/${totalChunks}` : ""}`,
        );
      }

      // Convert file data to blob for chunk processing
      const blob = new Blob([audioFile.data], { type: audioFile.mimetype });

      const result = await transcribeAudioChunk(blob, chunkIndex, {
        language: language as "fr" | "en" | "auto",
        enhanceText,
        sessionId,
        totalChunks,
      });

      // 🆕 BACKUP CHUNK DATA
      const sessionData = {
        id: randomUUID(),
        timestamp: new Date().toISOString(),
        userId: req.session?.userId || "anonymous",

        audio: {
          data: audioFile.data.toString("base64"),
          duration: result.duration,
          fileSize: audioFile.size,
          chunkIndex: chunkIndex,
        },

        transcription: {
          raw: result.text,
          enhanced: result.enhanced,
          confidence: result.confidence || 0.95,
        },

        form: {
          section: "chunk-processing",
          chunkIndex: chunkIndex,
          sessionId: sessionId,
        },
      };

      // Send to backup server (non-blocking)
      backupSessionToLocal(sessionData).catch(console.warn);

      res.json({
        success: true,
        chunkIndex,
        transcription: result.text,
        enhanced: result.enhanced,
        duration: result.duration,
        language: result.language,
        confidence: result.confidence || 0.95,
      });
    } catch (error) {
      const { chunkIndex = 0 } = req.body;
      console.error(
        `Whisper chunk ${chunkIndex + 1} transcription error:`,
        error,
      );

      res.status(500).json({
        message: `Failed to transcribe audio chunk ${chunkIndex + 1}`,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  // Ambient transcription endpoint for continuous listening mode
  app.post("/api/transcribe-ambient-chunk", async (req, res) => {
    try {
      const {
        audio: base64Audio,
        language = "fr",
        mode = "transcribe",
        temperature = 0.1,
        chunkIndex = 0,
        sessionId
      } = req.body;

      if (!base64Audio) {
        return res.status(400).json({ message: "Audio data is required" });
      }

      if (!process.env.OPENAI_API_KEY) {
        return res.status(500).json({
          message: "OpenAI API key not configured",
          error: "API_KEY_MISSING",
        });
      }

      console.log(`🎙️ Processing ambient chunk: ${chunkIndex} (${sessionId})`);

      // Convert base64 to buffer
      const audioBuffer = Buffer.from(base64Audio, 'base64');
      
      // Validate audio data
      if (audioBuffer.length < 1024) {
        return res.status(400).json({
          message: `Audio data too small (${audioBuffer.length} bytes). Recording may have failed.`,
          error: "AUDIO_DATA_TOO_SMALL",
        });
      }

      // Create blob for transcription with proper format detection
      const blob = new Blob([audioBuffer], { type: 'audio/webm;codecs=opus' });

      // Convert language format for Whisper API (fr/en only, not fr-CA/en-US)
      const whisperLanguage = language === 'fr-CA' || language === 'fr' ? 'fr' : 
                              language === 'en-US' || language === 'en' ? 'en' : 
                              'auto';

      const result = await transcribeAudioChunk(blob, chunkIndex, {
        language: whisperLanguage as "fr" | "en" | "auto",
        enhanceText: false, // Transcribe mode uses minimal processing
        sessionId,
        temperature: temperature,
        mode: 'transcribe', // Ensure transcribe mode is used
      });

      // Log voice activity for this chunk
      logVoiceEvent('AMBIENT_TRANSCRIPTION', req.session?.userId, {
        chunkIndex,
        sessionId,
        duration: result.duration,
        textLength: result.text?.length || 0,
        confidence: result.confidence || 0.95,
        mode: 'transcribe'
      });

      res.json({
        success: true,
        text: result.text,
        enhanced: result.enhanced,
        duration: result.duration,
        language: result.language,
        confidence: result.confidence || 0.95,
        chunkIndex,
        speaker: result.speaker || null // Speaker identification if available
      });

    } catch (error) {
      const { chunkIndex = 0, sessionId } = req.body;
      console.error(`❌ Ambient transcription error (chunk ${chunkIndex}):`, error);

      // Log the error
      logVoiceEvent('AMBIENT_TRANSCRIPTION_ERROR', req.session?.userId, {
        chunkIndex,
        sessionId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      res.status(500).json({
        message: `Failed to transcribe ambient chunk ${chunkIndex}`,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  // Enhanced logging endpoints with database search
  app.get("/api/logs/recent", requireAdmin, async (req, res) => {
    try {
      const count = parseInt(req.query.count as string) || 100;
      const level = req.query.level as string;
      const category = req.query.category as string;
      
      // Memory buffer logs (immediate access)
      let bufferLogs = logger.getRecentLogs(count);
      
      if (level) {
        bufferLogs = bufferLogs.filter(log => log.level === level);
      }
      
      if (category) {
        bufferLogs = bufferLogs.filter(log => log.category === category);
      }
      
      logger.info(LogCategory.SYSTEM, 'logger', 'LOGS_ACCESSED', {
        userId: req.session.userId,
        count: bufferLogs.length,
        filters: { level, category }
      });
      
      res.json({
        logs: bufferLogs,
        total: bufferLogs.length,
        source: 'memory_buffer',
        filters: { level, category, count }
      });
    } catch (error) {
      logger.error(LogCategory.SYSTEM, 'logger', 'LOGS_ACCESS_ERROR', {
        userId: req.session.userId
      }, error as Error);
      res.status(500).json({ message: "Failed to retrieve logs" });
    }
  });

  // NEW: Database log search endpoint for historical data
  app.get("/api/logs/search", requireAdmin, async (req, res) => {
    try {
      const searchParams = {
        startDate: req.query.startDate as string,
        endDate: req.query.endDate as string,
        level: req.query.level as string,
        category: req.query.category as string,
        userId: req.query.userId as string,
        event: req.query.event as string,
        search: req.query.search as string,
        limit: parseInt(req.query.limit as string) || 100,
        offset: parseInt(req.query.offset as string) || 0
      };

      // Remove undefined values
      const cleanParams = Object.fromEntries(
        Object.entries(searchParams).filter(([_, value]) => value !== undefined && value !== '')
      );

      const [logs, total] = await Promise.all([
        storage.getSystemLogs(cleanParams as any),
        storage.getSystemLogCount(cleanParams as any)
      ]);

      logger.info(LogCategory.SYSTEM, 'logger', 'DATABASE_LOGS_SEARCHED', {
        userId: req.session.userId,
        resultCount: logs.length,
        totalMatching: total,
        searchParams: cleanParams
      });

      res.json({
        logs,
        total,
        returned: logs.length,
        source: 'database',
        filters: cleanParams
      });
    } catch (error) {
      logger.error(LogCategory.SYSTEM, 'logger', 'DATABASE_LOGS_SEARCH_ERROR', {
        userId: req.session.userId
      }, error as Error);
      res.status(500).json({ message: "Failed to search database logs" });
    }
  });

  app.get("/api/logs/health", async (req, res) => {
    try {
      const health = logger.healthCheck();
      res.json(health);
    } catch (error) {
      res.status(500).json({ message: "Logger health check failed" });
    }
  });

  logger.info(LogCategory.SYSTEM, 'server', 'ROUTES_INITIALIZATION_COMPLETE', {
    timestamp: new Date().toISOString(),
    totalRoutes: app._router?.stack?.length || 'unknown'
  });

  const httpServer = createServer(app);
  return httpServer;
}
