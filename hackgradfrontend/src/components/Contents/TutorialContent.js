// TutorialContent.js - Enhanced social media style Tutorial content component
import React from 'react';
import { Link } from 'react-router-dom';
import '../../styles/ContentStyles/ContentPage.css';
import '../../styles/ContentStyles/TutorialContent.css';
import ImageDisplay from '../ImageDisplay';
import ContentInteractions from '../Contents/ContentInteractions';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faGraduationCap, faTags, faBook, faLayerGroup
} from '@fortawesome/free-solid-svg-icons';

const TutorialContent = ({ 
  content, 
  currentUser, 
  onEdit, 
  onDelete,
  onLike,
  onSave,
  onRepost,
  onComment,
  onShare,
  onToggleComments,
  showComments,
  isSubmitting,
  error
}) => {
  // Extract tutorial-specific fields from extraFields
  const extraFields = content.extraFields || {};
  const description = extraFields.description || '';
  const tutorialContent = extraFields.content || '';
  const difficulty = extraFields.difficulty || '';
  const tags = extraFields.tags || [];

  // Get title and image
  const title = content.title || extraFields.title || extraFields.tutorialTitle || 'Untitled Tutorial';
  const image = content.image || extraFields.image || '/default-content.gif';

  // Author info
  const authorName = content.authorName || content.username || "Unknown User";
  const authorAvatar = content.authorAvatar || content.profileImage || "/default-avatar.png";
  
  // Format date
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Check if current user is the owner
  const isOwner = () => {
    if (!content || !currentUser) return false;
    return content.userId === currentUser._id;
  };

  // Get difficulty level color
  const getDifficultyColor = (level) => {
    switch (level?.toLowerCase()) {
      case 'beginner':
        return '#4CAF50'; // Green
      case 'intermediate':
        return '#2196F3'; // Blue
      case 'advanced':
        return '#FF9800'; // Orange
      case 'expert':
        return '#F44336'; // Red
      default:
        return '#9E9E9E'; // Gray
    }
  };

  return (
    <div className="social-card">
      {/* Author Header */}
      <div className="card-header">
        <div className="author-info">
          <Link to={`/profile/${content.userId}`} className="author-avatar">
            <img 
              src={authorAvatar} 
              alt={authorName}
              onError={(e) => { e.target.src = "/default-avatar.png" }}
            />
          </Link>
          <div className="author-meta">
            <Link to={`/profile/${content.userId}`} className="author-name">
              {authorName}
            </Link>
            <div className="post-meta">
              <span className="post-date">{formatDate(content.createdAt)}</span>
              <span className="post-visibility">{content.visibility || 'Public'}</span>
            </div>
          </div>
        </div>
        {isOwner() && (
          <div className="post-actions">
            <button className="action-menu-button">⋯</button>
            <div className="action-menu-dropdown">
              <button onClick={onEdit}>Edit</button>
              <button onClick={onDelete}>Delete</button>
            </div>
          </div>
        )}
      </div>

      {/* Tutorial Title */}
      <h2 className="post-title">{title}</h2>

      {/* Tutorial Image */}
      {image && (
        <div className="post-image">
          <ImageDisplay 
            src={image}
            alt={title}
            onError={(e) => {
              console.log("Image failed to load:", e.target.src);
              e.target.src = "/default-content.gif";
            }}
          />
        </div>
      )}

      {/* Tutorial Info Card */}
      <div className="tutorial-info-card">
        {difficulty && (
          <div className="tutorial-difficulty">
            <div className="info-label">
              <FontAwesomeIcon icon={faGraduationCap} />
              <span>Difficulty:</span>
            </div>
            <div 
              className="difficulty-badge"
              style={{ 
                backgroundColor: getDifficultyColor(difficulty),
                color: 'white'
              }}
            >
              {difficulty}
            </div>
          </div>
        )}

        {tags && tags.length > 0 && (
          <div className="tutorial-tags-row">
            <div className="info-label">
              <FontAwesomeIcon icon={faTags} />
              <span>Topics:</span>
            </div>
            <div className="tags-container">
              {tags.map((tag, index) => (
                <span key={index} className="tutorial-tag">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Brief Description */}
      {description && (
        <div className="post-description">
          <h3 className="section-title">
            <FontAwesomeIcon icon={faBook} className="section-icon" />
            Overview
          </h3>
          <div className="tutorial-description-text">{description}</div>
        </div>
      )}

      {/* Main Tutorial Content */}
      {tutorialContent && (
        <div className="post-description">
          <h3 className="section-title">
            <FontAwesomeIcon icon={faLayerGroup} className="section-icon" />
            Tutorial Content
          </h3>
          <div className="tutorial-content-wrapper">
            <div className="tutorial-content-text">{tutorialContent}</div>
          </div>
        </div>
      )}

      {/* Common Interactions Component */}
      <ContentInteractions
        content={content}
        currentUser={currentUser}
        onLike={onLike}
        onSave={onSave}
        onRepost={onRepost}
        onComment={onComment}
        onShare={onShare}
        onToggleComments={onToggleComments}
        isSubmitting={isSubmitting}
        showComments={showComments}
      />
    </div>
  );
};

export default TutorialContent;