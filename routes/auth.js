import express from "express";
import {
  adminAutoLogin,
  refreshToken,
  verifyIdToken,
} from "../middlewares/auth.js";
import {
  getAllCitizens,
  getCitizenById,
  submitCitizen,
} from "../controllers/Citizen.js";

import { submitHelper } from "../controllers/Helper.js";
import { registerSubadmin } from "../controllers/SubAdmin.js";
import upload from "../middlewares/upload.js";

const router = express.Router();

// Handle the POST request to /verify-token
router.post(
  "/verify-token",
  verifyIdToken, // Token verification middleware after file upload
  submitCitizen,
  submitHelper // Business logic for submitting citizen data
);
router.post("/refresh-token", refreshToken);
router.get("/auto-login", adminAutoLogin);

router.get("/citizen/:id", getCitizenById);
router.get("/citizens", getAllCitizens);

router.post(
  "/register-subadmin",
  upload.fields([
    { name: "profileImage", maxCount: 1 },
    { name: "documents", maxCount: 10 },
  ]),
  registerSubadmin
);
export default router;
