const User = require("../models/User");

async function searchUsers(req, res, next) {
  try {
    const { q } = req.query;
    if (!q || q.trim().length === 0) {
      return res.json({ users: [] });
    }
    const regex = new RegExp(q.trim(), "i");
    const users = await User.find({
      _id: { $ne: req.userId },
      $or: [{ username: regex }, { name: regex }],
    })
      .limit(20)
      .select("name username avatarUrl bio isOnline lastSeen");

    res.json({ users });
  } catch (err) {
    next(err);
  }
}

async function getProfile(req, res, next) {
  try {
    const user = await User.findById(req.params.id).select(
      "name username avatarUrl bio isOnline lastSeen"
    );
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ user });
  } catch (err) {
    next(err);
  }
}

async function updateProfile(req, res, next) {
  try {
    const { name, bio, avatarUrl } = req.body;
    const update = {};
    if (name !== undefined) update.name = name;
    if (bio !== undefined) update.bio = bio;
    if (avatarUrl !== undefined) update.avatarUrl = avatarUrl;

    const user = await User.findByIdAndUpdate(req.userId, update, {
      new: true,
    });
    res.json({ user: user.toSafeObject() });
  } catch (err) {
    next(err);
  }
}

module.exports = { searchUsers, getProfile, updateProfile };
