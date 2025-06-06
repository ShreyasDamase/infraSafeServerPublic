import mongoose from "mongoose";
import bcrypt from "bcrypt";
import Admin from "./models/Admin.js";
import connectDB from "./config/connect.js";
import dotenv from "dotenv";
dotenv.config();
const seedAdmin = async () => {
  try {
    await connectDB(process.env.MONGO_URI)
      .then(() => console.log("MongoDB connected successfully"))
      .catch((err) => console.log("MongoDB connection failed", err));
    const existing = await Admin.findOne({ phone: "9075481652" });
    if (existing) {
      console.log("Admin already exist");
      process.exit(0);
    }

    const hashedPassword = await bcrypt.hash("admin123", 10);
    const admin = new Admin({
      name: "Tom cruise",
      phone: "9075481652",
      password: hashedPassword,
      role: "admin",
    });
    await admin.save();
    console.log("admin save succesfully ");
  } catch (error) {
    console.log(error);
  } finally {
    process.exit(0);
  }
};
seedAdmin();
