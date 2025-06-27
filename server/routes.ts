import type { Express } from "express";
import { createServer, type Server } from "http";
import { z } from "zod";
import { storage } from "./storage";
import { insertMedicalFormSchema } from "@shared/schema";
import { formatSection7Text, enhanceSection7Dictation, formatSection8Text, enhanceSection8Dictation, generateSection11Conclusion } from "./ai-formatter";
import { aiProcessingEngine } from "./ai-processing-engine";
import { hashPassword, verifyPassword, generateUserId, getSessionConfig, requireAuth, requireAdmin } from "./auth";
import { setupInitialUsers } from "./setup-users";
import "./types";

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
        return res.status(400).json({ message: "Username and password are required" });
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
      console.error('Login error:', error);
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
      const user = await storage.getUserById(req.session.userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const { passwordHash, ...userWithoutPassword } = user;
      res.json({ user: userWithoutPassword });
    } catch (error) {
      console.error('Get current user error:', error);
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
          errors: error.errors 
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
          errors: error.errors 
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
  
  // Get all saved forms for the authenticated user
  app.get("/api/saved-forms", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId;
      const savedForms = await storage.getSavedFormsByUserId(userId);
      res.json(savedForms);
    } catch (error) {
      console.error('Get saved forms error:', error);
      res.status(500).json({ message: "Failed to fetch saved forms" });
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
      console.error('Get saved form error:', error);
      res.status(500).json({ message: "Failed to fetch saved form" });
    }
  });

  // Save a medical form temporarily
  app.post("/api/saved-forms", requireAuth, async (req, res) => {
    try {
      const { title, formData, retentionDays = 7 } = req.body;
      
      if (!title || !formData) {
        return res.status(400).json({ message: "Title and form data are required" });
      }

      // Validate retention days (1-30 days)
      const validRetentionDays = Math.min(Math.max(parseInt(retentionDays) || 7, 1), 30);
      
      const userId = req.session.userId;
      const savedForm = await storage.saveMedicalForm(userId, title, formData, validRetentionDays);
      
      res.status(201).json(savedForm);
    } catch (error) {
      console.error('Save form error:', error);
      res.status(500).json({ message: "Failed to save form" });
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
        return res.status(400).json({ message: "Title and form data are required" });
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
      const validRetentionDays = Math.min(Math.max(parseInt(retentionDays) || 7, 1), 30);
      
      const updatedForm = await storage.updateSavedForm(id, title, formData, validRetentionDays);
      
      if (!updatedForm) {
        return res.status(404).json({ message: "Form not found" });
      }

      res.json(updatedForm);
    } catch (error) {
      console.error('Update saved form error:', error);
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
      console.error('Delete saved form error:', error);
      res.status(500).json({ message: "Failed to delete saved form" });
    }
  });

  // Clean up expired forms (admin only)
  app.post("/api/cleanup-expired-forms", requireAdmin, async (req, res) => {
    try {
      const deletedCount = await storage.deleteExpiredForms();
      res.json({ deletedCount });
    } catch (error) {
      console.error('Cleanup expired forms error:', error);
      res.status(500).json({ message: "Failed to cleanup expired forms" });
    }
  });

  // AI formatting for Section 7
  app.post("/api/format-section7", async (req, res) => {
    try {
      const { text, language = 'fr' } = req.body;
      
      if (!text) {
        return res.status(400).json({ message: "Text is required" });
      }

      if (!process.env.OPENAI_API_KEY) {
        return res.status(500).json({ 
          message: "OpenAI API key not configured",
          error: "API_KEY_MISSING"
        });
      }

      const formattedText = await formatSection7Text(text, language);
      res.json({ formatted: formattedText });
    } catch (error) {
      console.error('Format Section 7 error:', error);
      
      // Check if it's an OpenAI API error
      if (error.message && error.message.includes('API')) {
        return res.status(500).json({ 
          message: "OpenAI API error - please check your API key",
          error: "API_ERROR"
        });
      }
      
      res.status(500).json({ 
        message: "Failed to format text", 
        error: error.message || "Unknown error"
      });
    }
  });

  // AI enhancement for Section 7 dictation
  app.post("/api/enhance-section7-dictation", async (req, res) => {
    try {
      const { transcript, language = 'fr' } = req.body;
      
      if (!transcript) {
        return res.status(400).json({ message: "Transcript is required" });
      }

      const enhanced = await enhanceSection7Dictation(transcript, language);
      res.json(enhanced);
    } catch (error) {
      console.error('Enhance Section 7 dictation error:', error);
      res.status(500).json({ message: "Failed to enhance dictation" });
    }
  });

  // AI formatting for Section 8
  app.post("/api/format-section8", async (req, res) => {
    try {
      const { text, language = 'fr' } = req.body;
      
      if (!text) {
        return res.status(400).json({ message: "Text is required" });
      }

      if (!process.env.OPENAI_API_KEY) {
        return res.status(500).json({ 
          message: "OpenAI API key not configured",
          error: "API_KEY_MISSING"
        });
      }

      const formattedText = await formatSection8Text(text, language);
      res.json({ formatted: formattedText });
    } catch (error) {
      console.error('Format Section 8 error:', error);
      
      // Check if it's an OpenAI API error
      if (error.message && error.message.includes('API')) {
        return res.status(500).json({ 
          message: "OpenAI API error - please check your API key",
          error: "API_ERROR"
        });
      }
      
      res.status(500).json({ 
        message: "Failed to format text", 
        error: error.message || "Unknown error"
      });
    }
  });

  // AI enhancement for Section 8 dictation
  app.post("/api/enhance-section8-dictation", async (req, res) => {
    try {
      const { transcript, language = 'fr' } = req.body;
      
      if (!transcript) {
        return res.status(400).json({ message: "Transcript is required" });
      }

      const enhanced = await enhanceSection8Dictation(transcript, language);
      res.json(enhanced);
    } catch (error) {
      console.error('Enhance Section 8 dictation error:', error);
      res.status(500).json({ message: "Failed to enhance dictation" });
    }
  });

  // Legacy AI generation for Section 11 - redirects to modular endpoint
  app.post("/api/generate-section11", async (req, res) => {
    try {
      const { formData, language = 'fr' } = req.body;
      
      // Redirect to modular AI processing endpoint
      const response = await fetch(`${req.protocol}://${req.get('host')}/api/ai/process-field`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fieldId: 'section11',
          processingType: 'generate',
          formType: 'cnesst-medical-evaluation',
          formData,
          language,
        }),
      });
      
      const result = await response.json();
      res.json(result);
    } catch (error) {
      console.error('Generate Section 11 error:', error);
      res.status(500).json({ 
        message: "Failed to generate conclusion", 
        error: error.message || "Unknown error"
      });
    }
  });

  // New modular AI processing endpoint
  app.post("/api/ai/process-field", async (req, res) => {
    try {
      const { fieldId, processingType, formType, formData, language = 'fr', contextFields, targetFields, prompt } = req.body;
      
      if (!fieldId || !processingType || !formType || !formData) {
        return res.status(400).json({ message: "Missing required parameters" });
      }

      if (!process.env.OPENAI_API_KEY) {
        return res.status(500).json({ 
          message: "OpenAI API key not configured",
          error: "API_KEY_MISSING"
        });
      }

      const rule = {
        fieldId,
        processingType,
        language,
        contextFields,
        targetFields,
        prompt
      };

      const context = {
        formData,
        formType,
        language
      };

      const result = await aiProcessingEngine.processField(rule, context);
      
      if (result.success) {
        res.json({ 
          success: true, 
          processedData: result.processedData 
        });
      } else {
        res.status(400).json({ 
          success: false, 
          error: result.error || "Processing failed" 
        });
      }
    } catch (error) {
      console.error('AI processing error:', error);
      
      if (error.message && error.message.includes('API')) {
        return res.status(500).json({ 
          message: "OpenAI API error - please check your API key",
          error: "API_ERROR"
        });
      }
      
      res.status(500).json({ 
        message: "Failed to process field with AI", 
        error: error.message || "Unknown error"
      });
    }
  });

  // Enhanced Section 8 distribution endpoint
  app.post("/api/ai/distribute-section8", async (req, res) => {
    try {
      const { text, language = 'fr', contextData = {} } = req.body;
      
      if (!text) {
        return res.status(400).json({ message: "Text is required" });
      }

      if (!process.env.OPENAI_API_KEY) {
        return res.status(500).json({ 
          message: "OpenAI API key not configured",
          error: "API_KEY_MISSING"
        });
      }

      const rule = {
        fieldId: 'examen_physique_input',
        processingType: 'distribute' as const,
        language: language as 'fr' | 'en',
        targetFields: [
          'examen_attitude_marche',
          'examen_inspection_palpation',
          'examen_amplitudes_articulaires',
          'examen_force_musculaire',
          'examen_reflexes',
          'examen_tests_speciaux',
          'examen_membre_sain'
        ],
        contextFields: ['diagnostic_principal', 'histoire_evolution'],
        prompt: 'Distribute this physical examination description into the appropriate subsections. Analyze the text and place relevant content in each category.'
      };

      const context = {
        formData: { 
          'examen_physique_input': text,
          ...contextData
        },
        formType: 'cnesst-medical',
        language: language as 'fr' | 'en'
      };

      const result = await aiProcessingEngine.processField(rule, context);
      
      if (result.success) {
        res.json({ 
          success: true, 
          distributions: result.processedData || {}
        });
      } else {
        res.status(400).json({ 
          success: false, 
          error: result.error || "Distribution failed"
        });
      }
    } catch (error) {
      console.error('Section 8 distribution error:', error);
      
      if (error.message && error.message.includes('API')) {
        return res.status(500).json({ 
          message: "OpenAI API error - please check your API key",
          error: "API_ERROR"
        });
      }
      
      res.status(500).json({ 
        message: "Failed to distribute Section 8 content", 
        error: error.message || "Unknown error"
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
