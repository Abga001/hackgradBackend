// Content.js 

const mongoose = require("mongoose");

const contentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // Reference to content creator
  contentType: { 
    type: String, 
    enum: ["Post", "Job", "Event", "Project", "Tutorial", "Books", "Question"], 
    required: true 
  }, // Defines the type of content
  
  // Common Fields 
  title: { type: String, default: "Untitled" },  // Standardized title field
  image: { type: String, default: "/default-content.gif" },  // Standardized image field
  
  createdAt: { type: Date, default: Date.now }, // Timestamp of content creation
  lastUpdatedAt: { type: Date, default: Date.now }, // Tracks the last update time

  // Visibility Setting
  visibility: { 
    type: String, 
    enum: ["Public", "Connections", "Private"], 
    default: "Public" 
  }, // Controls who can see the content

  // Engagement Features
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }], // Users who liked the content
  dislikes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }], // Users who disliked the content
  comments: {
    type: [
      {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        username: { type: String, default: "Unknown User" },
        text: String,
        createdAt: { type: Date, default: Date.now },
        // New fields for Question-specific comments (answers)
        isAnswer: { type: Boolean, default: false },
        votes: { type: Number, default: 0 },
        acceptedAnswer: { type: Boolean, default: false },
        votedBy: {
          type: [{
            userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
            voteType: { type: String, enum: ["up", "down"] }
          }],
          default: []
        }
      }
    ],
    default: []
  }, 
  
  // Social Features
  reposts: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }], // Users who reposted this content
  saves: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }], // Users who saved this content
  originalContentId: { type: mongoose.Schema.Types.ObjectId, ref: "Content" }, // Reference to original content if this is a repost
  
  // Question-specific fields
  solved: { type: Boolean, default: false }, // Whether the question has an accepted answer
  tags: [{ type: String }], // Tags associated with the question for categorization
  
  // Extra Fields (For content-specific data)
  extraFields: { type: mongoose.Schema.Types.Mixed, default: {} }
});

// Middleware: Update `lastUpdatedAt` when modified
contentSchema.pre("save", function (next) {
  this.lastUpdatedAt = new Date();
  next();
});

contentSchema.index({ userId: 1 });
contentSchema.index({ contentType: 1 });
contentSchema.index({ createdAt: -1 });
contentSchema.index({ "extraFields.tags": 1 });
contentSchema.index({ reposts: 1 }); // Index for reposts
contentSchema.index({ saves: 1 }); // Index for saves
contentSchema.index({ originalContentId: 1 }); // Index for original content reference
contentSchema.index({ tags: 1 }); // Index for question tags
contentSchema.index({ solved: 1 }); // Index for solved questions

module.exports = mongoose.model("Content", contentSchema);