import { loadEnvConfig } from "@next/env";
import dbConnect from "../lib/mongodb";
import { User } from "../models/User";
import bcrypt from "bcryptjs";

loadEnvConfig(process.cwd());

async function seedAdmin() {
  try {
    await dbConnect();
    console.log("Connected to MongoDB");

    const adminEmail = process.env.ADMIN_EMAIL || "admin@landplatform.com";
    const adminPassword = process.env.ADMIN_PASSWORD || "Admin@123";

    const existingAdmin = await User.findOne({ email: adminEmail });

    if (!existingAdmin) {
      const hashedPassword = await bcrypt.hash(adminPassword, 10);
      await User.create({
        name: "Admin",
        email: adminEmail,
        password: hashedPassword,
        role: "admin",
      });
      console.log(`✓ Admin user created: ${adminEmail}`);
    } else {
      // Update password if changed
      const isPasswordValid = await bcrypt.compare(adminPassword, existingAdmin.password);
      if (!isPasswordValid) {
        const hashedPassword = await bcrypt.hash(adminPassword, 10);
        await User.findByIdAndUpdate(existingAdmin._id, { password: hashedPassword });
        console.log(`✓ Admin password updated: ${adminEmail}`);
      } else {
        console.log(`✓ Admin user already exists: ${adminEmail}`);
      }
    }

    console.log("\n=== Admin Credentials ===");
    console.log(`Email: ${adminEmail}`);
    console.log(`Password: ${adminPassword}`);
    console.log("========================\n");

    process.exit(0);
  } catch (error) {
    console.error("Error seeding admin:", error);
    process.exit(1);
  }
}

seedAdmin();
