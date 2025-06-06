import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import SubAdmin from "../models/SubAdmin.js";

export const registerSubadmin = async (req, res) => {
  try {
    const {
      name,
      role,
      gender,
      dob,
      phone,
      adhaarNo,
      country,
      states,
      pinCode,
      address,
      zone,
    } = req.body;

    // Parse the zone object if it's a string
    const zoneObj = typeof zone === "string" ? JSON.parse(zone) : zone;

    // Handle file uploads
    const profileImageFile = req.files?.profileImage?.[0] || null;
    const documentFiles = req.files?.documents || [];

    const profileImage = profileImageFile
      ? {
          name: profileImageFile.originalname,
          path: profileImageFile.path,
          mimeType: profileImageFile.mimetype,
          size: profileImageFile.size,
          lastModified: Date.now(),
        }
      : null;

    const documents = documentFiles.map((file) => ({
      name: file.originalname,
      path: file.path,
      mimeType: file.mimetype,
      size: file.size,
      lastModified: Date.now(),
    }));

    // Create new subadmin
    const subAdmin = new SubAdmin({
      name,
      role,
      gender,
      dob: new Date(dob),
      phone,
      adhaarNo,
      country,
      states,
      pinCode,
      address,
      zone: zoneObj,
      profileImage,
      documents,
    });

    // Validate the subadmin data
    await subAdmin.validate();

    // Save to database
    await subAdmin.save();

    // Generate tokens
    const accessToken = subAdmin.createAccessToken();
    const refreshToken = subAdmin.createRefreshToken();

    res.status(201).json({
      success: true,
      message: "SubAdmin registered successfully",
      data: {
        subAdmin,
        tokens: {
          accessToken,
          refreshToken,
        },
      },
    });
  } catch (error) {
    console.error("Error registering subadmin:", error);

    if (error instanceof mongoose.Error.ValidationError) {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: error.errors,
      });
    }

    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};
