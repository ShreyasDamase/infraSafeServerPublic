import multer from "multer";
import path from "path";

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/"); // make sure this folder exists
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,
  fileFilter: function (req, file, cb) {
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/jpg",

      "application/pdf",
      "video/mp4",
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only JPG, PNG, PDF and MP4 files are allowed!"));
    }
  },
  // limits: {
  //   fileSize: 10 * 1024 * 1024, // Increased to 10MB to accommodate videos
  //   files: 10, // Maximum of 10 files
  // },
});

export default upload;

// const storage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, "uploads");
//   },
//   filename: (req, file, cb) => {
//     const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
//     const extension = path.extname(file.originalname);
//     cb(null, `${uniqueSuffix}${extension}`);
//   },
// });

// const upload = multer({ storage });
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
