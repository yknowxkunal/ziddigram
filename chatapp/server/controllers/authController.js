const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const ACCESS_EXPIRES = process.env.JWT_ACCESS_EXPIRES || "15m";
const REFRESH_EXPIRES = process.env.JWT_REFRESH_EXPIRES || "7d";

function signAccessToken(userId) {
  return jwt.sign({ userId }, process.env.JWT_ACCESS_SECRET, {
    expiresIn: ACCESS_EXPIRES,
  });
}

function signRefreshToken(userId) {
  return jwt.sign({ userId }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: REFRESH_EXPIRES,
  });
}

function setAuthCookies(res, accessToken, refreshToken) {
  const isProd = process.env.NODE_ENV === "production";
  const cookieBase = {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "none" : "lax",
  };
  res.cookie("accessToken", accessToken, {
    ...cookieBase,
    maxAge: 15 * 60 * 1000, // 15 min
  });
  res.cookie("refreshToken", refreshToken, {
    ...cookieBase,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
}

async function signup(req, res, next) {
  try {
    const { name, username, email, password } = req.body;

    const existing = await User.findOne({
      $or: [{ email: email.toLowerCase() }, { username: username.toLowerCase() }],
    });
    if (existing) {
      return res.status(409).json({ message: "Email or username already in use" });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({
      name,
      username: username.toLowerCase(),
      email: email.toLowerCase(),
      passwordHash,
    });

    const accessToken = signAccessToken(user._id);
    const refreshToken = signRefreshToken(user._id);
    setAuthCookies(res, accessToken, refreshToken);

    res.status(201).json({ user: user.toSafeObject() });
  } catch (err) {
    next(err);
  }
}

async function login(req, res, next) {
  try {
    const { emailOrUsername, password } = req.body;

    const user = await User.findOne({
      $or: [
        { email: emailOrUsername.toLowerCase() },
        { username: emailOrUsername.toLowerCase() },
      ],
    });
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    user.isOnline = true;
    user.lastSeen = new Date();
    await user.save();

    const accessToken = signAccessToken(user._id);
    const refreshToken = signRefreshToken(user._id);
    setAuthCookies(res, accessToken, refreshToken);

    res.json({ user: user.toSafeObject() });
  } catch (err) {
    next(err);
  }
}

async function refresh(req, res, next) {
  try {
    const token = req.cookies?.refreshToken;
    if (!token) return res.status(401).json({ message: "No refresh token" });

    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    const accessToken = signAccessToken(decoded.userId);
    const newRefreshToken = signRefreshToken(decoded.userId);
    setAuthCookies(res, accessToken, newRefreshToken);

    res.json({ message: "Token refreshed" });
  } catch (err) {
    res.status(401).json({ message: "Invalid refresh token" });
  }
}

async function logout(req, res, next) {
  try {
    if (req.userId) {
      await User.findByIdAndUpdate(req.userId, {
        isOnline: false,
        lastSeen: new Date(),
      });
    }
    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");
    res.json({ message: "Logged out" });
  } catch (err) {
    next(err);
  }
}

async function me(req, res, next) {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ user: user.toSafeObject() });
  } catch (err) {
    next(err);
  }
}

module.exports = { signup, login, refresh, logout, me, signAccessToken };
