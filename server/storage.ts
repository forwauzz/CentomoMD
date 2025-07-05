import { 
  medicalForms, 
  users, 
  savedForms, 
  genericForms,
  recentPatients,
  type MedicalForm, 
  type InsertMedicalForm, 
  type User, 
  type InsertUser, 
  type SavedForm, 
  type InsertSavedForm,
  type GenericForm,
  type InsertGenericForm,
  type RecentPatient,
  type InsertRecentPatient
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
  getSavedFormsByType(userId: string, formType: 'draft' | 'copy'): Promise<SavedForm[]>;
  saveMedicalForm(userId: string, title: string, formData: any, retentionDays: number, formType?: 'draft' | 'copy'): Promise<SavedForm>;
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

  // Recent patients management
  getRecentPatientsByUserId(userId: string, limit?: number): Promise<RecentPatient[]>;
  createRecentPatient(patient: InsertRecentPatient): Promise<RecentPatient>;
  updateRecentPatientAccess(userId: string, patientName: string): Promise<void>;
  deleteRecentPatient(id: number): Promise<boolean>;
  cleanupOldRecentPatients(userId: string, keepCount?: number): Promise<number>;
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
      .orderBy(desc(savedForms.createdAt));
    return forms.map(form => ({
      ...form,
      formData: typeof form.formData === 'string' ? JSON.parse(form.formData) : form.formData
    }));
  }

  async getSavedFormsByType(userId: string, formType: 'draft' | 'copy'): Promise<SavedForm[]> {
    const forms = await db
      .select()
      .from(savedForms)
      .where(and(eq(savedForms.userId, userId), eq(savedForms.formType, formType)))
      .orderBy(desc(savedForms.createdAt));
    return forms.map(form => ({
      ...form,
      formData: typeof form.formData === 'string' ? JSON.parse(form.formData) : form.formData
    }));
  }

  async saveMedicalForm(userId: string, title: string, formData: any, retentionDays: number, formType: 'draft' | 'copy' = 'copy'): Promise<SavedForm> {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + Math.min(retentionDays, 30)); // Cap at 30 days

    const [savedForm] = await db
      .insert(savedForms)
      .values({
        userId,
        title,
        formData: typeof formData === 'object' ? JSON.stringify(formData) : formData,
        formType,
        expiresAt,
      })
      .returning();
    return {
      ...savedForm,
      formData: typeof savedForm.formData === 'string' ? JSON.parse(savedForm.formData) : savedForm.formData
    };
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

  // Generic forms management implementation - Phase 1.2
  async getGenericForm(id: number): Promise<GenericForm | undefined> {
    const [form] = await db.select().from(genericForms).where(eq(genericForms.id, id));
    return form;
  }

  async getGenericFormsByType(formType: string, userId?: string): Promise<GenericForm[]> {
    const conditions = [eq(genericForms.formType, formType)];
    if (userId) {
      conditions.push(eq(genericForms.userId, userId));
    }
    
    return await db
      .select()
      .from(genericForms)
      .where(and(...conditions))
      .orderBy(desc(genericForms.updatedAt));
  }

  async getGenericFormsByUserId(userId: string): Promise<GenericForm[]> {
    return await db
      .select()
      .from(genericForms)
      .where(eq(genericForms.userId, userId))
      .orderBy(desc(genericForms.updatedAt));
  }

  async createGenericForm(insertForm: InsertGenericForm): Promise<GenericForm> {
    const [form] = await db
      .insert(genericForms)
      .values({
        ...insertForm,
        expiresAt: insertForm.retentionDays ? 
          new Date(Date.now() + insertForm.retentionDays * 24 * 60 * 60 * 1000) : 
          new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // Default 1 year
      })
      .returning();
    return form;
  }

  async updateGenericForm(id: number, updateData: Partial<InsertGenericForm>): Promise<GenericForm | undefined> {
    const [updatedForm] = await db
      .update(genericForms)
      .set({ 
        ...updateData, 
        updatedAt: new Date(),
        expiresAt: updateData.retentionDays ? 
          new Date(Date.now() + updateData.retentionDays * 24 * 60 * 60 * 1000) : 
          undefined
      })
      .where(eq(genericForms.id, id))
      .returning();
    return updatedForm;
  }

  async deleteGenericForm(id: number): Promise<boolean> {
    const deletedForm = await db
      .delete(genericForms)
      .where(eq(genericForms.id, id))
      .returning();
    return deletedForm.length > 0;
  }

  async deleteExpiredGenericForms(): Promise<number> {
    const now = new Date();
    const deletedForms = await db
      .delete(genericForms)
      .where(lt(genericForms.expiresAt, now))
      .returning();
    return deletedForms.length;
  }

  // Save a form with expiration
  async saveForm(userId: string, title: string, formData: any, retentionDays: number = 7, formType: 'draft' | 'copy' = 'draft') {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + retentionDays);

    const result = await db.insert(savedForms).values({
      userId,
      title,
      formData: JSON.stringify(formData),
      expiresAt,
      formType,
      createdAt: new Date(),
      updatedAt: new Date()
    }).returning();

    return result[0];
  }

  // Get all saved forms for a user
  async getSavedFormsByUserId_new(userId: string) {
    const forms = await db.select().from(savedForms)
      .where(eq(savedForms.userId, userId))
      .orderBy(savedForms.createdAt);

    return forms.map(form => ({
      ...form,
      formData: JSON.parse(form.formData)
    }));
  }

  // Get saved forms by type
  async getSavedFormsByType_new(userId: string, formType: 'draft' | 'copy') {
    const forms = await db.select().from(savedForms)
      .where(and(
        eq(savedForms.userId, userId),
        eq(savedForms.formType, formType)
      ))
      .orderBy(savedForms.createdAt);

    return forms.map(form => ({
      ...form,
      formData: JSON.parse(form.formData)
    }));
  }

  // Get a specific saved form
  async getSavedForm_new(id: number) {
    const forms = await db.select().from(savedForms)
      .where(eq(savedForms.id, id))
      .limit(1);

    if (forms.length === 0) return null;

    const form = forms[0];
    return {
      ...form,
      formData: JSON.parse(form.formData)
    };
  }

  // Delete a saved form
  async deleteSavedForm_new(id: number) {
    await db.delete(savedForms).where(eq(savedForms.id, id));
  }

  // Clean up expired forms
  async cleanupExpiredForms() {
    const now = new Date();
    await db.delete(savedForms).where(lt(savedForms.expiresAt, now));
  }

  // Recent patients management
  async getRecentPatientsByUserId(userId: string, limit: number = 10): Promise<RecentPatient[]> {
    try {
      const patients = await db.select()
        .from(recentPatients)
        .where(eq(recentPatients.userId, userId))
        .orderBy(desc(recentPatients.lastAccessedAt))
        .limit(limit);
      
      return patients;
    } catch (error) {
      console.error('Error fetching recent patients:', error);
      return [];
    }
  }

  async createRecentPatient(patient: InsertRecentPatient): Promise<RecentPatient> {
    const [newPatient] = await db.insert(recentPatients).values(patient).returning();
    return newPatient;
  }

  async updateRecentPatientAccess(userId: string, patientName: string): Promise<void> {
    try {
      // Update existing patient's last accessed time or create new entry
      const existingPatients = await db.select()
        .from(recentPatients)
        .where(and(
          eq(recentPatients.userId, userId),
          eq(recentPatients.patientName, patientName)
        ))
        .limit(1);

      if (existingPatients.length > 0) {
        // Update existing patient
        await db.update(recentPatients)
          .set({ lastAccessedAt: new Date() })
          .where(eq(recentPatients.id, existingPatients[0].id));
      }
      // If patient doesn't exist, it will be created when form is saved
    } catch (error) {
      console.error('Error updating recent patient access:', error);
    }
  }

  async deleteRecentPatient(id: number): Promise<boolean> {
    try {
      await db.delete(recentPatients).where(eq(recentPatients.id, id));
      return true;
    } catch (error) {
      console.error('Error deleting recent patient:', error);
      return false;
    }
  }

  async cleanupOldRecentPatients(userId: string, keepCount: number = 20): Promise<number> {
    try {
      // Get patients beyond the keep count
      const oldPatients = await db.select()
        .from(recentPatients)
        .where(eq(recentPatients.userId, userId))
        .orderBy(desc(recentPatients.lastAccessedAt))
        .offset(keepCount);

      if (oldPatients.length === 0) return 0;

      const oldPatientIds = oldPatients.map(p => p.id);
      
      for (const id of oldPatientIds) {
        await db.delete(recentPatients).where(eq(recentPatients.id, id));
      }

      return oldPatients.length;
    } catch (error) {
      console.error('Error cleaning up old recent patients:', error);
      return 0;
    }
  }
}

export const storage = new DatabaseStorage();