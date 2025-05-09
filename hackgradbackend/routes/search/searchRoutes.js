// These routes search for both users and content

const express = require("express");
const router = express.Router();
const User = require("../../models/User");
const Content = require("../../models/Content");

// GET /api/search?q=keyword
router.get("/", async (req, res) => {
  const query = req.query.q;

  if (!query || query.trim() === "") {
    return res.status(400).json({ message: "Query parameter is required" });
  }

  try {
    const regex = new RegExp(query, "i"); // Case-insensitive match

    const [users, contents] = await Promise.all([
      // USER SEARCH
      User.find({
        $or: [
          { username: { $regex: regex } },
          { fullName: { $regex: regex } },
          { areaOfExpertise: { $regex: regex } }
        ],
      }).select("-password"),

      // CONTENT SEARCH - Now searching both root fields and extraFields
      Content.find({
        $or: [
          // Root level fields
          { title: { $regex: regex } },
          { contentType: { $regex: regex } },
          
          // ExtraFields
          { "extraFields.description": { $regex: regex } },
          { "extraFields.tags": { $regex: regex } },
          
          // For backward compatibility - search in legacy locations
          { "extraFields.title": { $regex: regex } },
          { "extraFields.postTitle": { $regex: regex } },
          { "extraFields.tutorialTitle": { $regex: regex } }
        ]
      }),
    ]);

    // Standardized format that ensures title and image are always accessible
    const formattedContents = contents.map(content => {
      const fields = content.extraFields || {};
      
      return {
        _id: content._id,
        userId: content.userId,
        // Use root title if available, fallback to legacy locations
        title: content.title || fields.title || fields.postTitle || fields.tutorialTitle || "Untitled",
        // Get description from extraFields
        description: fields.description || "No description",
        // Use root image if available, fallback to legacy locations
        image: content.image || fields.image || fields.postImage || "/default-content.gif",
        // Use contentType for consistent type field
        type: content.contentType,
        contentType: content.contentType,
        createdAt: content.createdAt,
      };
    });

    res.json({ users, contents: formattedContents });
  } catch (err) {
    console.error("Search error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;