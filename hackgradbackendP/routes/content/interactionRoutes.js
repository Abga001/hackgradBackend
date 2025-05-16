const express = require("express");
const router = express.Router();
const Content = require("../../models/Content");
const User = require("../../models/User"); 
const verifyToken = require("../../middleware/verifyToken");
const path = require("path");
const fs = require("fs");
const mongoose = require("mongoose"); 

// GET Saved Content for Current User
router.get("/saved", verifyToken, async (req, res) => {
  try {
    // Find all content where the user's ID is in the saves array
    const savedContent = await Content.find({ saves: req.user._id })
      .sort({ createdAt: -1 });
    
    res.status(200).json(savedContent);
  } catch (err) {
    console.error("Get saved content error:", err);
    res.status(500).json({ message: err.message });
  }
});

// GET Reposted Content for Current User
router.get("/reposted", verifyToken, async (req, res) => {
  try {
    // Find all content created by the user that has an originalContentId
    const repostedContent = await Content.find({ 
      userId: req.user._id,
      originalContentId: { $exists: true, $ne: null }
    }).sort({ createdAt: -1 });
    
    res.status(200).json(repostedContent);
  } catch (err) {
    console.error("Get reposted content error:", err);
    res.status(500).json({ message: err.message });
  }
});

// Post a comment
router.post("/:contentId/comment", verifyToken, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text?.trim()) return res.status(400).json({ message: "Comment text cannot be empty" });
    
    const content = await Content.findById(req.params.contentId);
    if (!content) return res.status(404).json({ message: "Content not found" });
    
    const user = await User.findById(req.user._id);

    content.comments.push({
      userId: req.user._id,
      username: user.username, // Changed from userName to username
      text: text.trim(),
      createdAt: new Date(),
    });
    
    await content.save();
    res.status(200).json({ message: "Comment added", comments: content.comments });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// SAVE Content
router.post("/:contentId/save", verifyToken, async (req, res) => {
  try {
    const { contentId } = req.params;
    const userId = req.user._id.toString();

    const content = await Content.findById(contentId);
    if (!content) return res.status(404).json({ message: "Content not found" });

    // Check if user already saved this content
    const alreadySaved = content.saves && content.saves.includes(userId);
  
    if (alreadySaved) {
      // If already saved, remove the save (toggle behavior)
      content.saves = content.saves.filter(id => id.toString() !== userId);
      await content.save();
      return res.status(200).json({ message: "Content unsaved successfully", content });
    } else {
      // If not saved, add the save
      if (!content.saves) content.saves = [];
      content.saves.push(userId);
      await content.save();
      return res.status(200).json({ message: "Content saved successfully", content });
    }
  } catch (err) {
    console.error("Save content error:", err);
    res.status(500).json({ message: err.message });
  }
});

// REPOST Content
router.post("/:contentId/repost", verifyToken, async (req, res) => {
  try {
    const { contentId } = req.params;
    const userId = req.user._id.toString();

    // Find the original content
    const originalContent = await Content.findById(contentId);
    if (!originalContent) return res.status(404).json({ message: "Content not found" });

    // Check if user already reposted this content
    const alreadyReposted = originalContent.reposts && originalContent.reposts.includes(userId);
    
    if (alreadyReposted) {
      // Find and delete the existing repost
      await Content.deleteOne({ 
        userId: userId, 
        originalContentId: contentId 
      });
      
      // Remove user from reposts array of original content
      originalContent.reposts = originalContent.reposts.filter(id => id.toString() !== userId);
      await originalContent.save();
      
      // Return consistent response structure
      return res.status(200).json({ 
        message: "Content unreposted successfully", 
        content: originalContent 
      });
    } else {
      // Create a new repost
      const repost = new Content({
        userId: userId,
        contentType: originalContent.contentType,
        title: originalContent.title,
        image: originalContent.image,
        visibility: "Public", // Reposts are always public
        originalContentId: originalContent._id,
        extraFields: {
          ...originalContent.extraFields,
          repostNote: req.body.repostNote || "" // Optional note when reposting
        }
      });
      
      const savedRepost = await repost.save();
      
      // Add user to reposts array of original content
      if (!originalContent.reposts) originalContent.reposts = [];
      originalContent.reposts.push(userId);
      await originalContent.save();
      
      // Return consistent response structure
      return res.status(201).json({ 
        message: "Content reposted successfully", 
        content: originalContent,  // Make sure to return 'content' for consistency
        repost: savedRepost
      });
    }
  } catch (err) {
    console.error("Repost content error:", err);
    res.status(500).json({ message: err.message });
  }
});

// LIKE / DISLIKE
router.post("/:contentId/:action", verifyToken, async (req, res) => {
  try {
    const { contentId, action } = req.params;
    if (!["like", "dislike"].includes(action)) return res.status(400).json({ message: "Invalid action" });

    const content = await Content.findById(contentId);
    if (!content) return res.status(404).json({ message: "Content not found" });

    const userId = req.user._id.toString();
    
    if (action === "like") {
      if (content.likes.includes(userId)) {
        // If already liked, remove the like (toggle off)
        content.likes = content.likes.filter(id => id.toString() !== userId);
      } else {
        // If not liked, add the like and remove from dislikes if present
        content.likes.push(userId);
        content.dislikes = content.dislikes.filter(id => id.toString() !== userId);
      }
    } else {
      if (content.dislikes.includes(userId)) {
        // If already disliked, remove the dislike (toggle off)
        content.dislikes = content.dislikes.filter(id => id.toString() !== userId);
      } else {
        // If not disliked, add the dislike and remove from likes if present
        content.dislikes.push(userId);
        content.likes = content.likes.filter(id => id.toString() !== userId);
      }
    }

    await content.save();
    res.status(200).json({ message: `Content ${action} toggled successfully`, content });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;