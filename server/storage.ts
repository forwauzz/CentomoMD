import { medicalForms, type MedicalForm, type InsertMedicalForm } from "@shared/schema";

export interface IStorage {
  getMedicalForm(id: number): Promise<MedicalForm | undefined>;
  createMedicalForm(form: InsertMedicalForm): Promise<MedicalForm>;
  updateMedicalForm(id: number, form: Partial<InsertMedicalForm>): Promise<MedicalForm | undefined>;
  deleteMedicalForm(id: number): Promise<boolean>;
  getAllMedicalForms(): Promise<MedicalForm[]>;
}

export class MemStorage implements IStorage {
  private medicalForms: Map<number, MedicalForm>;
  private currentId: number;

  constructor() {
    this.medicalForms = new Map();
    this.currentId = 1;
  }

  async getMedicalForm(id: number): Promise<MedicalForm | undefined> {
    return this.medicalForms.get(id);
  }

  async createMedicalForm(insertForm: InsertMedicalForm): Promise<MedicalForm> {
    const id = this.currentId++;
    const now = new Date();
    const form: MedicalForm = { 
      ...insertForm, 
      id, 
      createdAt: now,
      updatedAt: now
    };
    this.medicalForms.set(id, form);
    return form;
  }

  async updateMedicalForm(id: number, updateData: Partial<InsertMedicalForm>): Promise<MedicalForm | undefined> {
    const existingForm = this.medicalForms.get(id);
    if (!existingForm) {
      return undefined;
    }

    const updatedForm: MedicalForm = {
      ...existingForm,
      ...updateData,
      updatedAt: new Date()
    };
    
    this.medicalForms.set(id, updatedForm);
    return updatedForm;
  }

  async deleteMedicalForm(id: number): Promise<boolean> {
    return this.medicalForms.delete(id);
  }

  async getAllMedicalForms(): Promise<MedicalForm[]> {
    return Array.from(this.medicalForms.values());
  }
}

export const storage = new MemStorage();
