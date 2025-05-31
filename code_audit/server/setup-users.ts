import { storage } from "./storage";
import { hashPassword, generateUserId } from "./auth";

export async function setupInitialUsers() {
  try {
    console.log("Setting up initial users...");
    
    // Check if users already exist
    const existingUsers = await storage.getAllUsers();
    if (existingUsers.length > 0) {
      console.log("Users already exist, skipping setup.");
      return;
    }
    
    // Create Dr. Centomo's account
    const drCentomoId = generateUserId();
    const drCentomoPassword = await hashPassword("centomo2025!");
    
    await storage.createUser({
      id: drCentomoId,
      email: "dr.centomo@centomomd.com",
      username: "drcentomo",
      passwordHash: drCentomoPassword,
      firstName: "Dr.",
      lastName: "Centomo",
      role: "admin"
    });
    
    console.log("✓ Created Dr. Centomo's account");
    console.log("  Username: drcentomo");
    console.log("  Password: centomo2025!");
    
    // Create developer account
    const developerId = generateUserId();
    const developerPassword = await hashPassword("dev2025!");
    
    await storage.createUser({
      id: developerId,
      email: "developer@centomomd.com",
      username: "developer",
      passwordHash: developerPassword,
      firstName: "Developer",
      lastName: "Admin",
      role: "admin"
    });
    
    console.log("✓ Created Developer account");
    console.log("  Username: developer");
    console.log("  Password: dev2025!");
    
    console.log("\n🎉 Initial users setup completed!");
    
  } catch (error) {
    console.error("Error setting up users:", error);
    throw error;
  }
}