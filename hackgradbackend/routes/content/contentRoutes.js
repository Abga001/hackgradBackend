const express = require("express");
const router = express.Router();
const User = require('../../models/User');
const Content = require("../../models/Content");
const verifyToken = require("../../middleware/verifyToken");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const mongoose = require("mongoose");

// Setup file storage
// Configure multer for file storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '..', 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'content-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });


router.get("/", verifyToken, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    const contents = await Content.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
      
    const total = await Content.countDocuments();
    
    res.json({ 
      contents,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET Content by User ID
router.get("/user/:userId", verifyToken, async (req, res) => {
  try {
    const { userId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    // Validate userId format
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid user ID format" });
    }
    
    // Find all content created by this user
    const contents = await Content.find({ userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    const total = await Content.countDocuments({ userId });
    
    res.status(200).json({
      contents,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    console.error("Error fetching user content:", err);
    res.status(500).json({ message: err.message });
  }
});

// CREATE Content
router.post("/", verifyToken, upload.single("image"), async (req, res) => {
  try {
    const { contentType, visibility, title } = req.body;
    
    // Parse extraFields
    let extraFields = {};
    
    // Option 1: If extraFields is provided as a JSON string
    if (req.body.extraFields) {
      try {
        extraFields = typeof req.body.extraFields === 'string' 
          ? JSON.parse(req.body.extraFields) 
          : req.body.extraFields;
      } catch (e) {
        console.error("Error parsing extraFields:", e);
      }
    } 
    // Option 2: Extract fields from request body that aren't standard Content model fields
    else {
      // Create a list of fields that are part of the Content model (not extraFields)
      const contentModelFields = ['contentType', 'visibility', 'title', 'image'];
      
      // Loop through all fields in the request body
      Object.keys(req.body).forEach(key => {
        // If the field is not part of the standard Content model fields, add it to extraFields
        if (!contentModelFields.includes(key)) {
          // Check if the value is a JSON string that needs parsing (arrays, objects)
          try {
            if (req.body[key] && 
                (req.body[key].startsWith('[') || req.body[key].startsWith('{'))) {
              extraFields[key] = JSON.parse(req.body[key]);
            } else {
              extraFields[key] = req.body[key];
            }
          } catch (e) {
            // If parsing fails, use the original value
            extraFields[key] = req.body[key];
          }
        }
      });
    }

    // Create relative URL for the uploaded image
    const imageUrl = req.file 
      ? `/uploads/${req.file.filename}` 
      : "/default-content.gif";

    const newContent = new Content({
      userId: req.user._id,
      contentType,
      visibility: visibility || "Public",
      title: title || "Untitled",
      image: imageUrl, 
      extraFields: extraFields
    });

    const saved = await newContent.save();
    res.status(201).json({ message: "Content created", saved });
  } catch (err) {
    console.error("Create content error:", err.message);
    res.status(500).json({ message: "Failed to create content", error: err.message });
  }
})

// For postman testing purposes
router.post("/bulk", verifyToken, async (req, res) => {
  try {
      const createdContents = await Content.insertMany(req.body);
      res.status(201).json(createdContents);
  } catch (error) {
      res.status(500).json({ error: error.message });
  }
});


// GET by Type (Post, Job, Event, Project, Tutorial)
router.get("/type/:contentType", verifyToken, async (req, res) => {
  try {
    const contents = await Content.find({ contentType: req.params.contentType });
    if (!contents.length) return res.status(404).json({ message: "No content found for this type" });
    res.status(200).json(contents);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET Content by ID
router.get("/:contentId", verifyToken, async (req, res) => {
  try {
    const content = await Content.findById(req.params.contentId);
    if (!content) return res.status(404).json({ message: "Content not found" });
    
    // Get author data in the same request
    if (content.userId) {
      try {
        const authorData = await User.findById(content.userId)
          .select('username fullName profileImage');
          
        return res.status(200).json({
          ...content.toObject(),
          authorName: authorData.username || authorData.fullName,
          authorAvatar: authorData.profileImage || "/default-avatar.png"
        });
      } catch (userErr) {
        console.error("Error fetching author data:", userErr);
      }
    }
    
    res.status(200).json(content);
  } catch (err) {
    res.status(500).json({ message: "Invalid Content ID or Server Error" });
  }
});

// UPDATE
// update content
router.patch("/:contentId", verifyToken, upload.single("image"), async (req, res) => {
  try {
    const { contentId } = req.params;
    const content = await Content.findById(contentId);
    
    if (!content) return res.status(404).json({ message: "Content not found" });

    if (content.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Unauthorized to update this content" });
    }

    // Update basic fields
    if (req.body.title) content.title = req.body.title;
    if (req.body.visibility) content.visibility = req.body.visibility;
    
    // Handle image upload
    if (req.file) {
      content.image = `/uploads/${req.file.filename}`;
    }
    
    // Update extraFields
    if (req.body.extraFields) {
      const extraFields = typeof req.body.extraFields === 'string' 
        ? JSON.parse(req.body.extraFields) 
        : req.body.extraFields;
      content.extraFields = { ...content.extraFields, ...extraFields };
    }

    content.lastUpdatedAt = new Date();
    const updated = await content.save();
    res.status(200).json({ message: "Content updated", updatedContent: updated });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE
router.delete("/:contentId", verifyToken, async (req, res) => {
  try {
    const content = await Content.findById(req.params.contentId);
    if (!content) return res.status(404).json({ message: "Content not found" });

    if (content.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Unauthorized to delete this content" });
    }

    await content.deleteOne();
    res.status(200).json({ message: "Content deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});




module.exports = router;