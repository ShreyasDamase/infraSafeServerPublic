import express from "express";

import { getComplaint, submiteComplaint } from "../controllers/Complaint.js";
import upload from "../middlewares/upload.js";
const router = express.Router();

// Handle the POST request to /verify-token
router.post(
  "/complaint",
  upload.fields([
    { name: "pictureData", maxCount: 1 },
    { name: "videoData", maxCount: 1 },
  ]),
  submiteComplaint // Token verification middleware after file upload
);

router.get("/complaint", getComplaint);
export default router;
// app.post(
//   "/complaint",
//   upload.fields([
//     { name: "pictureData", maxCount: 1 },
//     { name: "videoData", maxCount: 1 },
//   ]),
//   (req, res) => {
//     try {
//       const title = req.body.title;
//       const picture = req.files["pictureData"]?.[0];
//       const video = req.files["videoData"]?.[0];

//       console.log("Title:", title);
//       console.log("Picture:", picture);
//       console.log("Video:", video);

//       res.status(200).json({
//         message: "Complaint received",
//         title,
//         picture: picture?.filename,
//         video: video?.filename,
//       });
//     } catch (error) {
//       console.error("Upload failed:", error);
//       res.status(500).json({ message: "Server Error" });
//     }
//   }
// );
