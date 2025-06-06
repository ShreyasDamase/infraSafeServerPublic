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

const SubAdminSchema = new Schema({
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
  zone: {
    name: String,
    area: {
      type: {
        type: String,
        enum: ["Polygon"],
        required: true,
      },
      coordinates: {
        type: [[[Number]]],
        required: true,
        validate: {
          validator: function (coords) {
            // Validate Polygon coordinates
            if (!coords || coords.length === 0) return false;
            const ring = coords[0];
            return (
              ring.length >= 4 &&
              ring[0][0] === ring[ring.length - 1][0] &&
              ring[0][1] === ring[ring.length - 1][1]
            );
          },
          message: "Coordinates must form a closed Polygon ring",
        },
      },
    },
  },
  profileImage: FileSchema,
  documents: [FileSchema],
});

// Create geospatial index for efficient queries
SubAdminSchema.index({ "zone.area": "2dsphere" });

SubAdminSchema.methods.createAccessToken = function () {
  if (!process.env.ACCESS_TOKEN_SECRET) {
    throw new Error("ACCESS_TOKEN_SECRET is not defined");
  }
  return jwt.sign(
    { id: this._id, phone: this.phone, role: this.role },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: process.env.ACCESS_TOKEN_EXPIRY || "2h" }
  );
};

SubAdminSchema.methods.createRefreshToken = function () {
  if (!process.env.REFRESH_TOKEN_SECRET) {
    throw new Error("REFRESH_TOKEN_SECRET is not defined");
  }
  return jwt.sign(
    { id: this._id, phone: this.phone, role: this.role },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: process.env.REFRESH_TOKEN_EXPIRY || "7d" }
  );
};

const SubAdmin = mongoose.model("SubAdmin", SubAdminSchema);
export default SubAdmin;
