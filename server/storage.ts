import { medicalForms, type MedicalForm, type InsertMedicalForm } from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

export interface IStorage {
  getMedicalForm(id: number): Promise<MedicalForm | undefined>;
  createMedicalForm(form: InsertMedicalForm): Promise<MedicalForm>;
  updateMedicalForm(id: number, form: Partial<InsertMedicalForm>): Promise<MedicalForm | undefined>;
  deleteMedicalForm(id: number): Promise<boolean>;
  getAllMedicalForms(): Promise<MedicalForm[]>;
}

export class DatabaseStorage implements IStorage {
  async getMedicalForm(id: number): Promise<MedicalForm | undefined> {
    const [form] = await db.select().from(medicalForms).where(eq(medicalForms.id, id));
    return form || undefined;
  }

  async createMedicalForm(insertForm: InsertMedicalForm): Promise<MedicalForm> {
    const [form] = await db
      .insert(medicalForms)
      .values(insertForm)
      .returning();
    return form;
  }

  async updateMedicalForm(id: number, updateData: Partial<InsertMedicalForm>): Promise<MedicalForm | undefined> {
    const [updatedForm] = await db
      .update(medicalForms)
      .set({ ...updateData, updatedAt: new Date() })
      .where(eq(medicalForms.id, id))
      .returning();
    return updatedForm || undefined;
  }

  async deleteMedicalForm(id: number): Promise<boolean> {
    const result = await db
      .delete(medicalForms)
      .where(eq(medicalForms.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  async getAllMedicalForms(): Promise<MedicalForm[]> {
    return await db.select().from(medicalForms);
  }
}

export const storage = new DatabaseStorage();
