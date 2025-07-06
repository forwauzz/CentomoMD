// Add this with your other imports at the top
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
// Add this after your existing imports, around line 10
async function backupSessionToLocal(sessionData: any) {
  console.log("🔍 DEBUG: Attempting backup...", sessionData.id);

  try {
    console.log("🔍 DEBUG: Sending to localhost:4444...");

    const response = await fetch(
      "http://localhost:4444/save-complete-session",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sessionData),
        signal: AbortSignal.timeout(5000),
      },
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

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup initial users
  await setupInitialUsers();

  // Setup session middleware
  app.use(getSessionConfig());

  // Authentication routes
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        return res
          .status(400)
          .json({ message: "Username and password are required" });
      }

      const user = await storage.getUserByUsername(username);
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const isValidPassword = await verifyPassword(password, user.passwordHash);
      if (!isValidPassword) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      req.session.userId = user.id;
      req.session.userRole = user.role;

      // Return user without password hash
      const { passwordHash, ...userWithoutPassword } = user;
      res.json({ user: userWithoutPassword });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy(() => {
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
    try {
      const validatedData = insertMedicalFormSchema.parse(req.body);
      const newForm = await storage.createMedicalForm(validatedData);
      res.status(201).json(newForm);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: "Validation error",
          errors: error.errors,
        });
      }
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

  // Update a saved form
  app.put("/api/saved-forms/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid form ID" });
      }

      const { title, formData, retentionDays = 7 } = req.body;

      if (!title || !formData) {
        return res
          .status(400)
          .json({ message: "Title and form data are required" });
      }

      // Check if the form exists and belongs to the user
      const existingForm = await storage.getSavedForm(id);
      if (!existingForm) {
        return res.status(404).json({ message: "Saved form not found" });
      }

      if (existingForm.userId !== req.session.userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      // Validate retention days (1-30 days)
      const validRetentionDays = Math.min(
        Math.max(parseInt(retentionDays) || 7, 1),
        30,
      );

      const updatedForm = await storage.updateSavedForm(
        id,
        title,
        formData,
        validRetentionDays,
      );

      if (!updatedForm) {
        return res.status(404).json({ message: "Form not found" });
      }

      res.json(updatedForm);
    } catch (error) {
      console.error("Update saved form error:", error);
      res.status(500).json({ message: "Failed to update saved form" });
    }
  });

  // Delete a saved form
  app.delete("/api/saved-forms/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid form ID" });
      }

      // Check if the form exists and belongs to the user
      const existingForm = await storage.getSavedForm(id);
      if (!existingForm) {
        return res.status(404).json({ message: "Saved form not found" });
      }

      if (existingForm.userId !== req.session.userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      const deleted = await storage.deleteSavedForm(id);
      if (!deleted) {
        return res.status(404).json({ message: "Form not found" });
      }

      res.status(204).send();
    } catch (error) {
      console.error("Delete saved form error:", error);
      res.status(500).json({ message: "Failed to delete saved form" });
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
        id: crypto.randomUUID(), // You'll need to import crypto at the top
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
        id: crypto.randomUUID(),
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

  const httpServer = createServer(app);
  return httpServer;
}
