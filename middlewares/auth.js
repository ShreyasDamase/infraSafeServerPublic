import admin from "firebase-admin";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { submitCitizen } from "../controllers/Citizen.js";
import { submitHelper } from "../controllers/Helper.js";
import Citizen from "../models/Citizen.js";
import Helper from "../models/Helper.js";
import { StatusCodes } from "http-status-codes";
import Admin from "../models/Admin.js";
import jwt from "jsonwebtoken";
import SubAdmin from "../models/SubAdmin.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Firebase Admin
const serviceAccount = JSON.parse(
  process.env.FIREBASE_SERVICE_ACCOUNT ||
    fs.readFileSync(
      path.join(__dirname, "firebase-service-account.json"),
      "utf-8"
    )
);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

export const verifyIdToken = async (req, res, next) => {
  console.log("post hit");

  const { idToken, data } = req.body; // This will be the Citizen data
  //cheked pas idToken for fire base verification
  console.log("user data", data);
  if (!idToken) {
    return res.status(400).json({
      success: false,
      error: "Token is required",
    });
  }

  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    console.log(decodedToken);
    // Additional security checks as is phone nuber present in token
    if (!decodedToken.phone_number) {
      return res.status(401).json({
        success: false,
        error: "Invalid token: No phone number",
      });
    }

    // Token is valid - proceed with your business logic
    console.log("Successful verification for:", decodedToken.phone_number);

    req.user = {
      uid: decodedToken.uid,
      phoneNumber: decodedToken.phone_number,
    };
    //firebase logic ends here

    //i am using passed data to get user or create user
    let user =
      (await Citizen.findOne({ phone: data.phone })) ||
      (await Helper.findOne({ phone: data.phone })) ||
      (await Admin.findOne({ phone: data.phone })) ||
      (await SubAdmin.findOne({ phone: data.phone }));

    if (user) {
      console.log(user);
      if (data.role !== user.role) {
        return res.status(400).json({ message: "Invalid token" });
      }
      //allready user return with user and tokens
      const accessToken = user.createAccessToken();
      const refreshToken = user.createRefreshToken();
      console.log("token created");
      if (data.role === "admin" || data.role === "subadmin") {
        res.cookie("access_token", accessToken, {
          httpOnly: true,
          secure: false, // send cookie only over HTTPS
          sameSite: "Strict",
          // maxAge: 15 * 60 * 1000, // 15 min
          maxAge: 2 * 60 * 60 * 1000, // 2 hours
        });

        res.cookie("refresh_token", refreshToken, {
          httpOnly: true,
          secure: false,
          sameSite: "Strict",
          maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        });

        return res.status(StatusCodes.OK).json({
          message: "Admin logged in successfully",
          user,
        });
      }

      return res.status(StatusCodes.OK).json({
        message: "User logged in successfully",
        user,
        access_token: accessToken,
        refresh_token: refreshToken,
      });
    }

    //for if user is not exist so it should used to create user that menase i am signuping
    if (data.role === "citizen") {
      return submitCitizen(req, res);
    } else if (data.role === "helper") {
      return submitHelper(req, res);
    } else {
      return res.status(400).json({ message: "Invalid role" });
    }
  } catch (error) {
    console.error("Token verification failed:", error);

    // Handle specific Firebase errors
    if (error.code === "auth/id-token-expired") {
      return res.status(401).json({
        success: false,
        error: "Token expired",
      });
    }

    return res.status(401).json({
      success: false,
      error: "Unauthorized: Invalid token",
    });
  }
};

export const refreshToken = async (req, res) => {
  console.log("refresh token hit");
  const { refresh_token } = req.body;
  if (!refresh_token) {
    return res.status(400).json({ message: "Invalid token" });
  }

  try {
    const payload = jwt.verify(refresh_token, process.env.REFRESH_TOKEN_SECRET);

    let user = null;
    if (payload.role === "citizen") {
      user = await Citizen.findById(payload.id);
    }
    if (payload.role === "helper") {
      user = await Helper.findById(payload.id);
    }
    if (!user) {
      return res.sendStatus(401);
    }
    const newAccessToken = user.createAccessToken();
    const newRefreshToken = user.createRefreshToken();
    console.log(newAccessToken, newRefreshToken);

    return res.status(200).json({
      access_token: newAccessToken,
      refresh_token: newRefreshToken,
    });
  } catch (error) {
    console.error(error);
    return res.sendStatus(401);
  }
};

export const adminAutoLogin = async (req, res) => {
  console.log(
    process.env.ACCESS_TOKEN_SECRET,
    process.env.REFRESH_TOKEN_SECRET
  );
  console.log("inside auto login ");
  const accessToken = req.cookies.access_token;
  const refreshToken = req.cookies.refresh_token;
  console.log(accessToken);
  console.log(refreshToken);
  if (!refreshToken) {
    return res.sendStatus(401);
  }

  // Try verifying access token
  if (accessToken) {
    try {
      console.log("inside accesstoken  try ");
      const decoded = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET);
      console.log("✅ Access Token Decoded:", decoded);
      const admin =
        (await Admin.findOne({ _id: decoded.id })) ||
        (await SubAdmin.findOne({ _id: decoded.id }));
      console.log(" user,", admin);
      if (!admin) return res.sendStatus(401);
      return res.status(200).json({ user: admin });
    } catch (err) {
      // proceed to refresh logic below
    }
  }

  // Fallback to refresh token
  try {
    console.log("inside refresh   try ", process.env.REFRESH_TOKEN_SECRET);

    const decodedRefresh = jwt.verify(
      refreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );
    console.log(decodedRefresh);
    const admin =
      (await Admin.findOne({ _id: decodedRefresh.id })) ||
      (await SubAdmin.findOne({ _id: decoded.id }));
    console.log(admin);
    if (!admin) return res.sendStatus(401);

    const access_token = admin.createAccessToken();
    const refresh_token = admin.createRefreshToken();

    res.cookie("access_token", access_token, {
      httpOnly: true,
      secure: false,
      sameSite: "Strict",
      // maxAge: 15 * 60 * 1000,
      maxAge: 2 * 60 * 60 * 1000, // 2 hours
    });

    res.cookie("refresh_token", refresh_token, {
      httpOnly: true,
      secure: false,
      sameSite: "Strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.status(200).json({
      user: admin,
      message: "Tokens refreshed",
    });
  } catch (refreshErr) {
    return res.sendStatus(401);
  }
};
