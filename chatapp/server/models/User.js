const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 60 },
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      minlength: 3,
      maxlength: 24,
      index: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    passwordHash: { type: String, required: true },
    avatarUrl: { type: String, default: "" },
    bio: { type: String, default: "", maxlength: 160 },
    isOnline: { type: Boolean, default: false },
    lastSeen: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

userSchema.methods.toSafeObject = function () {
  return {
    id: this._id,
    name: this.name,
    username: this.username,
    email: this.email,
    avatarUrl: this.avatarUrl,
    bio: this.bio,
    isOnline: this.isOnline,
    lastSeen: this.lastSeen,
  };
};

module.exports = mongoose.model("User", userSchema);
