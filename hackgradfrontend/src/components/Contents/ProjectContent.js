// ProjectContent.js for project content
import React from 'react';
import { Link } from 'react-router-dom';
import '../../styles/ContentStyles/ContentPage.css';
import '../../styles/ContentStyles/ProjectContent.css';
import ImageDisplay from '../ImageDisplay';
import ContentInteractions from '../Contents/ContentInteractions';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faInfoCircle, faCode, faGlobe, faExternalLinkSquareAlt
} from '@fortawesome/free-solid-svg-icons';

const ProjectContent = ({ 
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
  // Extract project-specific fields
  const extraFields = content.extraFields || {};
  const technologies = extraFields.technologies || [];
  const repoUrl = extraFields.repoUrl || '';
  const demoUrl = extraFields.demoUrl || '';
  const description = extraFields.description || '';

  // Get title and image
  const title = content.title || extraFields.title || extraFields.projectTitle || 'Untitled Project';
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

      {/* Project Title */}
      <h2 className="post-title">{title}</h2>

      {/* Project Image */}
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

      {/* Project Description */}
      {description && (
        <div className="post-description">
          <h3 className="section-title">
            <FontAwesomeIcon icon={faInfoCircle} className="section-icon" />
            About This Project
          </h3>
          <div className="project-description-text">{description}</div>
        </div>
      )}

      {/* Technologies Used */}
      {technologies && technologies.length > 0 && (
        <div className="project-tech-section">
          <h3 className="section-title">
            <FontAwesomeIcon icon={faCode} className="section-icon" />
            Technologies Used
          </h3>
          <div className="tech-tags">
            {technologies.map((tech, index) => (
              <span key={index} className="tech-tag">{tech}</span>
            ))}
          </div>
        </div>
      )}

      {/* Project Links */}
      {(repoUrl || demoUrl) && (
        <div className="project-links-container">
          <h3 className="section-title">
            <FontAwesomeIcon icon={faExternalLinkSquareAlt} className="section-icon" />
            Project Links
          </h3>
          <div className="project-links">
            {repoUrl && (
              <a href={repoUrl} target="_blank" rel="noopener noreferrer" className="project-link repo-link">
                <FontAwesomeIcon icon={faCode} />
                Repository
              </a>
            )}
            {demoUrl && (
              <a href={demoUrl} target="_blank" rel="noopener noreferrer" className="project-link demo-link">
                <FontAwesomeIcon icon={faGlobe} />
                Live Demo
              </a>
            )}
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

export default ProjectContent;