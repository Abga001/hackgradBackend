const express = require("express");
const router = express.Router();
const Content = require("../../models/Content");
const User = require("../../models/User"); 
const verifyToken = require("../../middleware/verifyToken");
const path = require("path");
const fs = require("fs");
const mongoose = require("mongoose"); 

// Get questions with specific tags
router.get("/tags", verifyToken, async (req, res) => {
  try {
    const { tags } = req.query;
    
    if (!tags) {
      return res.status(400).json({ message: "Tags parameter is required" });
    }
    
    const tagArray = tags.split(',').map(tag => tag.trim());
    
    const questions = await Content.find({
      contentType: "Question",
      tags: { $in: tagArray }
    }).sort({ createdAt: -1 });
    
    res.status(200).json(questions);
  } catch (err) {
    console.error("Get questions by tags error:", err);
    res.status(500).json({ message: err.message });
  }
});


// Get unanswered questions
router.get("/questions/unanswered", verifyToken, async (req, res) => {
  try {
    const questions = await Content.find({
      contentType: "Question",
      solved: false,
      // Either no comments or no answers among comments
      $or: [
        { comments: { $size: 0 } },
        { "comments.isAnswer": { $ne: true } }
      ]
    }).sort({ createdAt: -1 });
    
    res.status(200).json(questions);
  } catch (err) {
    console.error("Get unanswered questions error:", err);
    res.status(500).json({ message: err.message });
  }
});

// Get trending questions (most interactions)
router.get("/questions/trending", verifyToken, async (req, res) => {
  try {
    // Find questions with most interactions (combination of likes, comments, etc)
    const questions = await Content.aggregate([
      { $match: { contentType: "Question" } },
      { $addFields: {
        interactionScore: {
          $add: [
            { $size: { $ifNull: ["$likes", []] } },
            { $size: { $ifNull: ["$comments", []] } },
            { $size: { $ifNull: ["$saves", []] } }
          ]
        }
      }},
      { $sort: { interactionScore: -1, createdAt: -1 } },
      { $limit: 20 }
    ]);
    
    res.status(200).json(questions);
  } catch (err) {
    console.error("Get trending questions error:", err);
    res.status(500).json({ message: err.message });
  }
});

// Add an answer to a question
router.post("/:contentId/answer", verifyToken, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text?.trim()) return res.status(400).json({ message: "Answer text cannot be empty" });
    
    const content = await Content.findById(req.params.contentId);
    if (!content) return res.status(404).json({ message: "Content not found" });
    
    // Verify this is a question
    if (content.contentType !== "Question") {
      return res.status(400).json({ message: "This content is not a question" });
    }
    
    const user = await User.findById(req.user._id);

    // Create answer with isAnswer flag and initial vote count
    content.comments.push({
      userId: req.user._id,
      username: user.username,
      text: text.trim(),
      createdAt: new Date(),
      isAnswer: true,
      votes: 0,
      acceptedAnswer: false
    });
    
    await content.save();
    res.status(200).json({ message: "Answer added", comments: content.comments });
  } catch (err) {
    console.error("Add answer error:", err);
    res.status(500).json({ message: err.message });
  }
});

// Accept an answer for a question
router.post("/:contentId/accept-answer", verifyToken, async (req, res) => {
  try {
    const { commentIndex } = req.body;
    if (commentIndex === undefined) {
      return res.status(400).json({ message: "Comment index is required" });
    }
    
    const content = await Content.findById(req.params.contentId);
    if (!content) return res.status(404).json({ message: "Question not found" });
    
    // Verify this is a question
    if (content.contentType !== "Question") {
      return res.status(400).json({ message: "This content is not a question" });
    }
    
    // Check if user is the question owner
    if (content.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Only the question owner can accept an answer" });
    }
    
    // Check if comment index is valid
    if (commentIndex < 0 || commentIndex >= content.comments.length) {
      return res.status(400).json({ message: "Invalid comment index" });
    }
    
    // Verify the comment is an answer
    if (!content.comments[commentIndex].isAnswer) {
      return res.status(400).json({ message: "The selected comment is not an answer" });
    }
    
    // Remove accepted flag from all other answers
    content.comments.forEach((comment, index) => {
      if (index !== commentIndex) {
        comment.acceptedAnswer = false;
      }
    });
    
    // Set the selected answer as accepted
    content.comments[commentIndex].acceptedAnswer = true;
    
    // Mark the question as solved
    content.solved = true;
    
    await content.save();
    
    res.status(200).json({ 
      message: "Answer accepted", 
      content: content
    });
  } catch (err) {
    console.error("Accept answer error:", err);
    res.status(500).json({ message: err.message });
  }
});

// Vote on an answer
router.post("/:contentId/vote-answer", verifyToken, async (req, res) => {
  try {
    const { commentIndex, direction } = req.body;
    
    if (commentIndex === undefined) {
      return res.status(400).json({ message: "Comment index is required" });
    }
    
    if (!["up", "down"].includes(direction)) {
      return res.status(400).json({ message: "Direction must be 'up' or 'down'" });
    }
    
    const content = await Content.findById(req.params.contentId);
    if (!content) return res.status(404).json({ message: "Question not found" });
    
    // Verify this is a question
    if (content.contentType !== "Question") {
      return res.status(400).json({ message: "This content is not a question" });
    }
    
    // Check if comment index is valid
    if (commentIndex < 0 || commentIndex >= content.comments.length) {
      return res.status(400).json({ message: "Invalid comment index" });
    }
    
    // Verify the comment is an answer
    const answer = content.comments[commentIndex];
    if (!answer.isAnswer) {
      return res.status(400).json({ message: "The selected comment is not an answer" });
    }
    
    // Check if user has already voted on this answer
    const userId = req.user._id.toString();
    const existingVote = answer.votedBy.find(vote => vote.userId.toString() === userId);
    
    if (existingVote) {
      // If user is voting in the same direction, return error
      if (existingVote.voteType === direction) {
        return res.status(400).json({ 
          message: `You have already ${direction === "up" ? "upvoted" : "downvoted"} this answer` 
        });
      }
      
      // If user is changing their vote, update the existing vote
      existingVote.voteType = direction;
      
      // Adjust the vote count (remove the old vote and add the new one)
      if (direction === "up") {
        answer.votes += 2; // From -1 to +1 is a change of 2
      } else {
        answer.votes -= 2; // From +1 to -1 is a change of 2
      }
    } else {
      // Add new vote
      answer.votedBy.push({
        userId: userId,
        voteType: direction
      });
      
      // Update the vote count
      if (direction === "up") {
        answer.votes += 1;
      } else {
        answer.votes -= 1;
      }
    }
    
    await content.save();
    
    res.status(200).json({ 
      message: `Vote ${direction} registered successfully`,
      content: content
    });
  } catch (err) {
    console.error("Vote answer error:", err);
    res.status(500).json({ message: err.message });
  }
});
module.exports = router;