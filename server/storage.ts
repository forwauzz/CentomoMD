import { 
  medicalForms, 
  users, 
  savedForms, 
  genericForms,
  type MedicalForm, 
  type InsertMedicalForm, 
  type User, 
  type InsertUser, 
  type SavedForm, 
  type InsertSavedForm,
  type GenericForm,
  type InsertGenericForm
} from "@shared/schema";
import { db } from "./db";
import { eq, lt, and, desc } from "drizzle-orm";

export interface IStorage {
  // Medical forms
  getMedicalForm(id: number): Promise<MedicalForm | undefined>;
  createMedicalForm(form: InsertMedicalForm): Promise<MedicalForm>;
  updateMedicalForm(id: number, form: Partial<InsertMedicalForm>): Promise<MedicalForm | undefined>;
  deleteMedicalForm(id: number): Promise<boolean>;
  getAllMedicalForms(): Promise<MedicalForm[]>;
  
  // User management
  getUserById(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser & { id: string; passwordHash: string }): Promise<User>;
  updateUser(id: string, user: Partial<InsertUser>): Promise<User | undefined>;
  deleteUser(id: string): Promise<boolean>;
  getAllUsers(): Promise<User[]>;

  // Saved forms management
  getSavedForm(id: number): Promise<SavedForm | undefined>;
  getSavedFormsByUserId(userId: string): Promise<SavedForm[]>;
  saveMedicalForm(userId: string, title: string, formData: any, retentionDays: number): Promise<SavedForm>;
  updateSavedForm(id: number, title: string, formData: any, retentionDays: number): Promise<SavedForm | undefined>;
  deleteSavedForm(id: number): Promise<boolean>;
  deleteExpiredForms(): Promise<number>;

  // Generic forms management - Phase 1.2
  getGenericForm(id: number): Promise<GenericForm | undefined>;
  getGenericFormsByType(formType: string, userId?: string): Promise<GenericForm[]>;
  getGenericFormsByUserId(userId: string): Promise<GenericForm[]>;
  createGenericForm(form: InsertGenericForm): Promise<GenericForm>;
  updateGenericForm(id: number, form: Partial<InsertGenericForm>): Promise<GenericForm | undefined>;
  deleteGenericForm(id: number): Promise<boolean>;
  deleteExpiredGenericForms(): Promise<number>;
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

  // User management methods
  async getUserById(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(userData: InsertUser & { id: string; passwordHash: string }): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .returning();
    return user;
  }

  async updateUser(id: string, updateData: Partial<InsertUser>): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ ...updateData, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user || undefined;
  }

  async deleteUser(id: string): Promise<boolean> {
    const result = await db.delete(users).where(eq(users.id, id));
    return (result.rowCount || 0) > 0;
  }

  async getAllUsers(): Promise<User[]> {
    const allUsers = await db.select().from(users);
    return allUsers;
  }

  // Saved forms management
  async getSavedForm(id: number): Promise<SavedForm | undefined> {
    const [form] = await db.select().from(savedForms).where(eq(savedForms.id, id));
    return form || undefined;
  }

  async getSavedFormsByUserId(userId: string): Promise<SavedForm[]> {
    const forms = await db.select().from(savedForms)
      .where(eq(savedForms.userId, userId))
      .orderBy(savedForms.createdAt);
    return forms;
  }

  async saveMedicalForm(userId: string, title: string, formData: any, retentionDays: number): Promise<SavedForm> {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + Math.min(retentionDays, 30)); // Cap at 30 days

    const [savedForm] = await db
      .insert(savedForms)
      .values({
        userId,
        title,
        formData,
        expiresAt,
      })
      .returning();
    return savedForm;
  }

  async updateSavedForm(id: number, title: string, formData: any, retentionDays: number): Promise<SavedForm | undefined> {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + Math.min(retentionDays, 30)); // Cap at 30 days

    const [updatedForm] = await db
      .update(savedForms)
      .set({
        title,
        formData,
        expiresAt,
        updatedAt: new Date(),
      })
      .where(eq(savedForms.id, id))
      .returning();
    return updatedForm || undefined;
  }

  async deleteSavedForm(id: number): Promise<boolean> {
    const result = await db.delete(savedForms).where(eq(savedForms.id, id));
    return (result.rowCount || 0) > 0;
  }

  async deleteExpiredForms(): Promise<number> {
    const now = new Date();
    const result = await db.delete(savedForms).where(
      lt(savedForms.expiresAt, now)
    );
    return result.rowCount || 0;
  }
}

export const storage = new DatabaseStorage();
