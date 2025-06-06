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

const CitizenSchema = new Schema({
  name: String,
  role: String,
  gender: String,
  dob: { type: Date },
  phone: String,
  adhaarNo: String,
  country: String,
  states: String,
  pinCode: String,
  address: String,
  profileImage: FileSchema,
  documents: [FileSchema],
});
CitizenSchema.methods.createAccessToken = function () {
  return jwt.sign(
    { id: this._id, phone: this.phone, role: this.role },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: process.env.ACCESS_TOKEN_EXPIRY }
  );
};

CitizenSchema.methods.createRefreshToken = function () {
  console.log("ACCESS_TOKEN_EXPIRY:", process.env.ACCESS_TOKEN_EXPIRY);
  return jwt.sign(
    { id: this._id, phone: this.phone, role: this.role },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: process.env.REFRESH_TOKEN_EXPIRY }
  );
};

const Citizen = mongoose.model("Citizen", CitizenSchema);
export default Citizen;
