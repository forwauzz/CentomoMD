import type { Express } from "express";
import { createServer, type Server } from "http";
import { z } from "zod";
import { storage } from "./storage";
import { insertMedicalFormSchema } from "@shared/schema";
import { formatSection7Text, enhanceSection7Dictation } from "./ai-formatter";

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Get all medical forms
  app.get("/api/medical-forms", async (req, res) => {
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

  // AI formatting for Section 7
  app.post("/api/format-section7", async (req, res) => {
    try {
      const { text, language = 'fr' } = req.body;
      
      if (!text) {
        return res.status(400).json({ message: "Text is required" });
      }

      const formattedText = await formatSection7Text(text, language);
      res.json({ formatted: formattedText });
    } catch (error) {
      console.error('Format Section 7 error:', error);
      res.status(500).json({ message: "Failed to format text" });
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

  const httpServer = createServer(app);
  return httpServer;
}
