import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    providerId: { type: String, required: true }, // Unique ID from Google or GitHub
    provider: { type: String, required: true }, // e.g., "google" or "github"
    name: { type: String, required: true }, // User's name
    email: { type: String, required: true, unique: true }, // User's email
    profileImage: { type: String }, // URL of the user's profile image
  },
  { timestamps: true }
); // Adds createdAt and updatedAt fields

export default mongoose.model("User", UserSchema);
