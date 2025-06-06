import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import Citizen from "../models/Citizen.js";
import { StatusCodes } from "http-status-codes";
import jwt from "jsonwebtoken";

// Get __dirname in ES Module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const submitCitizen = async (req, res) => {
  try {
    console.log("🔸 Incoming citizen submission");
    const { data } = req.body;
    const { uid, phoneNumber } = req.user;
    console.log("🔹 User:", { uid, phoneNumber });

    if (!data) {
      console.log("⛔ No data received in request body");
      return res.status(400).json({ message: "Missing data" });
    }

    if (!data.profileImage) {
      console.log("⛔ Profile image not provided");
      return res.status(400).json({ message: "Missing profile image" });
    }

    const saveBase64ToFile = (base64, name, folder) => {
      const buffer = Buffer.from(base64, "base64");
      const filePath = path.join(__dirname, "..", "uploads", folder, name);
      fs.writeFileSync(filePath, buffer);
      console.log(`✅ Saved file to ${filePath}`);
      return filePath;
    };

    // Save profile image
    const { base64, name, mimeType, size } = data.profileImage;
    console.log("📷 Profile image details:", { name, mimeType, size });
    const profileImagePath = saveBase64ToFile(base64, name, "profileImages");

    const profileImage = {
      name,
      mimeType,
      size,
      path: profileImagePath,
    };

    // Save documents
    const savedDocuments = [];
    if (Array.isArray(data.documents)) {
      console.log(`📄 Found ${data.documents.length} document(s) to save`);
      for (const doc of data.documents) {
        const { base64, name, mimeType, size, lastModified } = doc;
        console.log("📎 Saving document:", {
          name,
          mimeType,
          size,
          lastModified,
        });
        const docPath = saveBase64ToFile(base64, name, "documents");

        savedDocuments.push({
          name,
          mimeType,
          size,
          lastModified,
          path: docPath,
        });
      }
    } else {
      console.log("ℹ️ No documents to save");
    }

    // Create new citizen
    const newCitizen = new Citizen({
      role: data.role,
      name: data.name,
      gender: data.gender,
      dob: data.dob,
      phone: data.phone || phoneNumber,
      adhaarNo: data.adhaarNo,
      country: data.country,
      states: data.states,
      pinCode: data.pinCode,
      address: data.address,
      profileImage,
      documents: savedDocuments,
    });

    console.log("🧾 Saving citizen to DB:", newCitizen);

    await newCitizen.save();

    const accessToken = newCitizen.createAccessToken();
    const refreshToken = newCitizen.createRefreshToken();
    const user = {
      _id: newCitizen._id,
      name: newCitizen.name,
      role: newCitizen.role,
      gender: newCitizen.gender,
      dob: newCitizen.dob,
      phone: newCitizen.phone,

      country: newCitizen.country,
      states: newCitizen.states,
      pinCode: newCitizen.pinCode,

      address: newCitizen.address,

      profileImage: newCitizen.profileImage.path.split("\\").pop(), // just filename
      documents: newCitizen.documents.map((doc) => ({
        name: doc.name,
        mimeType: doc.mimeType,
        size: doc.size,
        path: doc.path.split("\\").pop(),
      })),
    };

    res.status(StatusCodes.CREATED).json({
      message: "Citizen registered successfully",
      user,
      access_token: accessToken,
      refresh_token: refreshToken,
    });
    //
  } catch (err) {
    console.error("❌ Save error:", err);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: err.message,
    });
  }
};

export const getCitizenById = async (req, res) => {
  try {
    const { id } = req.params;
    console.log("🔍 Fetching citizen with ID:", id);

    const citizen = await Citizen.findById(id);
    if (!citizen) {
      return res.status(404).json({ message: "Citizen not found" });
    }

    // Modify profile image path to return only the filename, not the full path
    if (citizen.profileImage && citizen.profileImage.path) {
      citizen.profileImage.path = citizen.profileImage.path.split("\\").pop(); // Extract file name
    }

    console.log("✅ Citizen found:", citizen._id);
    res.status(200).json(citizen);
  } catch (err) {
    console.error("❌ Error fetching citizen:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

export const getAllCitizens = async (req, res) => {
  try {
    console.log("📥 Fetching all citizens");
    const citizens = await Citizen.find({});

    // Modify profile image paths to return only the filename, not the full path
    citizens.forEach((citizen) => {
      if (citizen.profileImage && citizen.profileImage.path) {
        citizen.profileImage.path = citizen.profileImage.path.split("\\").pop(); // Extract file name
      }
    });

    res.status(200).json(citizens);
  } catch (err) {
    console.error("❌ Error fetching citizens:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};
