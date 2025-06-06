import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import Helper from "../models/Helper.js";
import { StatusCodes } from "http-status-codes";
import jwt from "jsonwebtoken";

// Get __dirname in ES Module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const submitHelper = async (req, res) => {
  try {
    console.log("🔸 Incoming helper submission");
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
    if (!base64) {
      console.log("⛔ Base64 string is missing in profile image");
      return res
        .status(400)
        .json({ message: "Base64 string is required for profile image" });
    }

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
    const newHelper = new Helper({
      role: data.role,
      name: data.name,
      gender: data.gender,
      dob: data.dob,
      phone: data.phone || phoneNumber,
      adhaarNo: data.adhaarNo,
      country: data.country,
      status: data.status,
      pinCode: data.pinCode,
      address: data.address,
      profileImage,
      documents: savedDocuments,
      department: data.department,
      departmentPost: data.departmentPost,
    });

    console.log("🧾 Saving citizen to DB:", newHelper);

    await newHelper.save();

    const accessToken = newHelper.createAccessToken();
    const refreshToken = newHelper.createRefreshToken();
    const user = {
      _id: newHelper._id,
      role: newHelper.role,
      name: newHelper.name,
      gender: newHelper.gender,
      dob: newHelper.dob,
      phone: newHelper.phone,

      country: newHelper.country,
      states: newHelper.states,
      pinCode: newHelper.pinCode,

      address: newHelper.address,

      profileImage: newHelper.profileImage.path.split("\\").pop(), // just filename
      documents: newHelper.documents.map((doc) => ({
        name: doc.name,
        mimeType: doc.mimeType,
        size: doc.size,
        path: doc.path.split("\\").pop(),
      })),
      department: newHelper.department,
      departmentPost: newHelper.departmentPost,
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

export const refreshToken = async (req, res) => {
  const { refresh_token } = req.body;
  if (!refresh_token) {
    throw new BadRequestError("Refresh token is required");
  }

  try {
    const payload = jwt.verify(refresh_token, process.env.REFRESH_TOKEN_SECRET);
    const user = await Helper.findById(payload.id); // ✅ Use correct model

    if (!user) {
      throw new UnauthenticatedError("Invalid refresh token");
    }

    const newAccessToken = user.createAccessToken();
    const newRefreshToken = user.createRefreshToken();

    res.status(StatusCodes.OK).json({
      access_token: newAccessToken,
      refresh_token: newRefreshToken,
    });
  } catch (error) {
    console.error(error);
    throw new UnauthenticatedError("Invalid refresh token");
  }
};

export const getHelperById = async (req, res) => {
  try {
    const { id } = req.params;
    console.log("🔍 Fetching citizen with ID:", id);

    const helper = await Helper.findById(id);
    if (!helper) {
      return res.status(404).json({ message: "Citizen not found" });
    }

    // Modify profile image path to return only the filename, not the full path
    if (helper.profileImage && helper.profileImage.path) {
      helper.profileImage.path = helper.profileImage.path.split("\\").pop(); // Extract file name
    }

    console.log("✅ Helper found:", helper._id);
    res.status(200).json(helper);
  } catch (err) {
    console.error("❌ Error fetching helper:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

export const getAllHelper = async (req, res) => {
  try {
    console.log("📥 Fetching all helper");
    const helpers = await helper.find({});

    // Modify profile image paths to return only the filename, not the full path
    helpers.forEach((helper) => {
      if (helper.profileImage && helper.profileImage.path) {
        helper.profileImage.path = helper.profileImage.path.split("\\").pop(); // Extract file name
      }
    });

    res.status(200).json(helpers);
  } catch (err) {
    console.error("❌ Error fetching helpers:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};
