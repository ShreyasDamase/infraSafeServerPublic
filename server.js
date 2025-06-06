import express from "express";
import cors from "cors";
import path from "path";
import { createServer } from "http";
import { fileURLToPath } from "url";
import connectDB from "./config/connect.js";
import dotenv from "dotenv";
import { Server as socketIo } from "socket.io";

import multer from "multer";
import fs from "fs";
import authRouter from "./routes/auth.js";
import complaintRouter from "./routes/complaint.js";
import handleSocketConnection from "./controllers/sockets.js";
import EventEmitter from "events";
import notFoundMiddleware from "./middlewares/not-found.js";
import errorHandlerMiddleware from "./middlewares/error-handler.js";
import cookieParser from "cookie-parser";
dotenv.config();
EventEmitter.defaultMaxListeners = 20;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
const app = express();
const PORT = process.env.PORT || 3000;
// app.use(
//   cors({
//     origin: "*", // Allows all origins
//     methods: ["GET", "POST", "PUT", "DELETE"],
//     allowedHeaders: ["Content-Type", "Authorization", "multipart/form-data"],
//     exposedHeaders: ["Content-Disposition"],
//   })
// );
// app.use(
//   cors({
//     origin: "*",
//     methods: ["GET", "POST", "PUT", "DELETE"],
//     allowedHeaders: ["Content-Type", "Authorization"],
//     exposedHeaders: ["Content-Disposition"],
//   })
// );

// const allowedOrigins = [
//   "http://localhost:3000",
//   "http://localhost:5173",
//   "http://192.168.0.119:3000",
// ];

// app.use(
//   cors({
//     origin: allowedOrigins,
//     credentials: true,
//     methods: ["GET", "POST", "PUT", "DELETE"],
//     allowedHeaders: ["Content-Type", "Authorization"],
//     exposedHeaders: ["Content-Disposition"],
//   })
// );

// app.use(
//   cors({
//     origin: function (origin, callback) {
//       if (!origin || allowedOrigins.includes(origin)) {
//         callback(null, true);
//       } else {
//         callback(new Error("CORS not allowed for this origin"));
//       }
//     },
//     credentials: true, // Required to allow cookies (admin login)
//     methods: ["GET", "POST", "PUT", "DELETE"],
//     allowedHeaders: ["Content-Type", "Authorization"],
//     exposedHeaders: ["Content-Disposition"],
//   })
// );

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  "http://wifiIP_if_you_are_using_your_physical_devices_like_mobile:3000",
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
    exposedHeaders: ["Content-Disposition"],
  })
);

app.use(express.json({ limit: "10mb" }));
app.use(cookieParser());

app.use(express.urlencoded({ extended: true, limit: "10mb" }));

app.use(express.static(path.join(__dirname, "public")));
// Serve static files from uploads directory
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
const server = createServer(app);
// const io = new socketIo(server, {
//   cors: {
//     origin: allowedOrigins, // Use same origins as HTTP
//     credentials: true, // Required for cookies
//     methods: ["GET", "POST"],
//   },
//   cookie: true, // Enable cookie support
// });

const io = new socketIo(server, {
  cors: {
    origin: allowedOrigins,
    credentials: true,
    methods: ["GET", "POST"],
  },
  cookie: true,
  transports: ["websocket", "polling"], // Add polling as fallback
  allowEIO3: true, // For Socket.IO v2 compatibility if needed
});
console.log("🔌 WebSocket server initialized");

// Attach the WebSocket instance to the request object
app.use((req, res, next) => {
  req.io = io;
  return next();
});

// Initialize the WebSocket handling logic
handleSocketConnection(io);
app.use("/auth", authRouter);
app.use("/complaint", complaintRouter);

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.use(notFoundMiddleware);
app.use(errorHandlerMiddleware);

const start = async () => {
  try {
    await connectDB(process.env.MONGO_URI)
      .then(() => console.log("MongoDB connected successfully"))
      .catch((err) => console.log("MongoDB connection failed", err));
    server.listen(PORT, "0.0.0.0", () => {
      console.log(`server is runnin on http://0.0.0.0:${PORT}`);
    });
  } catch (error) {
    console.log("error in  initializing server", error);
  }
};
start();
