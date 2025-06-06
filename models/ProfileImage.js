import mongoose, { Schema } from "mongoose";

const profileImageSchema = new Schema({
  filename: String,
  path: String,
  mimetype: String,
  size: Number,
  uploadedAt: {
    type: Date,
    default: Date.now,
  },
});
const ProfileImage = mongoose.model("ProfileImage", profileImageSchema);
export default ProfileImage;
