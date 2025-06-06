// models/Complaint.js
import mongoose from "mongoose";

const { Schema, model } = mongoose;

const FileSchema = new Schema({
  filename: String,
  originalname: String,
  mimetype: String,
  size: Number,
  path: String,
});

const ComplaintSchema = new Schema({
  complaintName: { type: String, required: false },
  complaintDepartment: { type: String, required: true },
  complaintDetail: { type: String, required: false },
  address: { type: String, required: true },
  user: {
    name: { type: String, required: false },
    phone: { type: String, required: true },
    aadhaar: { type: String, required: false },
    userId: { type: String, required: false },
  },
  picture: FileSchema,
  video: FileSchema,
  coords: {
    latitude: { type: Number },
    longitude: { type: Number },
  },
  createdAt: { type: Date, default: Date.now },
  zone: { type: String, required: true },
  assignedHelper: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Helper", // Link to Helper model
  },
  status: {
    type: String,
    enum: ["pending", "assigned", "in_progress", "completed", "canceled"],
    default: "pending",
  },
});

export default model("Complaint", ComplaintSchema);
