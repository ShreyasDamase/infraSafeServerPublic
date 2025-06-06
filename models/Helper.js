import mongoose, { Schema } from "mongoose";
import jwt from "jsonwebtoken";

const FileSchema = new Schema({
  name: String,
  path: String,
  mimeType: String,
  size: Number,
  lastModified: Number,
  uploadedAt: {
    type: Date,
    default: Date.now,
  },
});

const HelperSchema = new Schema({
  name: String,
  role: String,
  gender: String,
  dob: { type: Date },
  phone: String,
  adhaarNo: String,
  country: String,
  pinCode: String,
  address: String,
  profileImage: FileSchema,
  documents: [FileSchema],
  department: String,
  departmentPost: String,
  status: {
    type: String,
    enum: ["available", "busy", "offlne"],
    default: "available",
  },
  location: {
    latitude: { type: Number, required: false },
    longitude: { type: Number, required: false },
  },
  lastActiveAt: Date,
});
HelperSchema.methods.createAccessToken = function () {
  console.log("ACCESS_TOKEN_EXPIRY:", process.env.ACCESS_TOKEN_EXPIRY);
  return jwt.sign(
    { id: this._id, phone: this.phone, role: this.role },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: process.env.ACCESS_TOKEN_EXPIRY }
  );
};

HelperSchema.methods.createRefreshToken = function () {
  return jwt.sign(
    { id: this._id, phone: this.phone, role: this.role },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: process.env.REFRESH_TOKEN_EXPIRY }
  );
};

const Helper = mongoose.model("Helper", HelperSchema);
export default Helper;
