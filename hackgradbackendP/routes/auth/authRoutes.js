const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../../models/User");
const admin = require("../../firebaseAdmin");
const { registerValidation, loginValidation } = require("../../validations/validation");
const verifyToken = require("../../middleware/verifyToken");

// Register Route
router.post("/register", async (req, res) => {
  try {
    console.log("Registration attempt:", req.body.username, req.body.email);

    const { error } = registerValidation(req.body);
    if (error) {
      console.log("Validation error:", error.details[0].message);
      return res.status(400).json({ message: error.details[0].message });
    }

    const emailExist = await User.findOne({ email: req.body.email });
    if (emailExist) return res.status(400).json({ message: "Email already exists" });

    const usernameExist = await User.findOne({ username: req.body.username });
    if (usernameExist) return res.status(400).json({ message: "Username already taken" });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(req.body.password, salt);

    const user = new User({
      username: req.body.username,
      fullName: req.body.fullName,
      email: req.body.email,
      password: hashedPassword,
      bio: req.body.bio,
      profileImage: req.body.profileImage,
      skills: req.body.skills,
      areaOfExpertise: req.body.areaOfExpertise,
      education: req.body.education,
      experience: req.body.experience,
      favoriteLanguages: req.body.favoriteLanguages,
      github: req.body.github,
      linkedin: req.body.linkedin,
      portfolio: req.body.portfolio,
    });

    const savedUser = await user.save();

    console.log("User registered successfully:", savedUser._id);
    res.status(201).json({
      message: "Registration successful",
      userId: savedUser._id,
      username: savedUser.username,
    });
  } catch (err) {
    console.error("Registration error:", err);
    res.status(500).json({ message: "Server error", details: err.message });
  }
});

// Login Route
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "User not found" });

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) return res.status(400).json({ message: "Invalid credentials" });

    const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET, { expiresIn: "1h" });
    res.json({ token });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Get All Users
router.get("/all", async (req, res) => {
  try {
    const users = await User.find({}, { password: 0 });
    res.status(200).json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Firebase Token Generator
router.get("/firebase-token", verifyToken, async (req, res) => {
  try {
    const userId = req.user._id.toString();
    const firebaseToken = await admin.auth().createCustomToken(userId);
    res.json({ firebaseToken });
  } catch (err) {
    console.error("Firebase token error:", err);
    res.status(500).json({ message: "Error generating Firebase token", error: err.message });
  }
});

// User Search Route
// GET /api/user/search?q=searchTerm
router.get("/search", async (req, res) => {
  const query = req.query.q;

  if (!query || query.trim() === "") {
    return res.status(400).json({ message: "Query parameter is required" });
  }

  try {
    const regex = new RegExp(query, "i"); // case-insensitive match
    const users = await User.find({
      $or: [
        { username: { $regex: regex } },
        { fullName: { $regex: regex } },
        { areaOfExpertise: { $regex: regex } }
      ]
    }).select("-password");

    res.status(200).json({ users });
  } catch (err) {
    console.error("Search error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;