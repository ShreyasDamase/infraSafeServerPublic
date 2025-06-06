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

const AdminSchema = new Schema({
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
  password: String,

  profileImage: FileSchema,
  documents: [FileSchema],
});
AdminSchema.methods.createAccessToken = function () {
  return jwt.sign(
    { id: this._id, phone: this.phone, role: this.role },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: "1d" }
  );
};

AdminSchema.methods.createRefreshToken = function () {
  console.log("REFRESH_TOKEN_SECRET:", process.env.REFRESH_TOKEN_SECRET);
  return jwt.sign(
    { id: this._id, phone: this.phone, role: this.role },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: "1d" }
  );
};

const Admin = mongoose.model("Admin", AdminSchema);
export default Admin;
