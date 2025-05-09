// JobContent.js - Enhanced social media style Job content component
import React from 'react';
import { Link } from 'react-router-dom';
import '../../styles/ContentStyles/ContentPage.css';
import '../../styles/ContentStyles/JobContent.css';
import ImageDisplay from '../ImageDisplay';
import ContentInteractions from '../Contents/ContentInteractions';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faBriefcase, faMapMarkerAlt, faBuilding, faDollarSign, 
  faEnvelope, faExternalLinkAlt, faListUl
} from '@fortawesome/free-solid-svg-icons';

const JobContent = ({ 
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
  // Extract job-specific fields
  const extraFields = content.extraFields || {};
  const company = extraFields.company || '';
  const location = extraFields.location || '';
  const type = extraFields.type || '';
  const description = extraFields.description || '';
  const requirements = extraFields.requirements || '';
  const salary = extraFields.salary || '';
  const contactEmail = extraFields.contactEmail || '';
  const applicationUrl = extraFields.applicationUrl || '';

  // Get title and image
  const title = content.title || extraFields.title || extraFields.jobTitle || 'Untitled Job';
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

      {/* Job Title */}
      <h2 className="post-title">{title}</h2>

      {/* Job Header Card */}
      <div className="job-header-card">
        {company && (
          <div className="company-info">
            {image && image !== '/default-content.gif' && (
              <div className="company-logo">
                <ImageDisplay 
                  src={image}
                  alt={company}
                  onError={(e) => {
                    console.log("Image failed to load:", e.target.src);
                    e.target.src = "/default-content.gif";
                  }}
                />
              </div>
            )}
            <div className="company-name">
              <FontAwesomeIcon icon={faBuilding} />
              <span>{company}</span>
            </div>
          </div>
        )}
        
        <div className="job-quick-info">
          {type && (
            <div className="job-badge job-type-badge">
              <FontAwesomeIcon icon={faBriefcase} />
              <span>{type}</span>
            </div>
          )}
          
          {location && (
            <div className="job-badge job-location-badge">
              <FontAwesomeIcon icon={faMapMarkerAlt} />
              <span>{location}</span>
            </div>
          )}
          
          {salary && (
            <div className="job-badge job-salary-badge">
              <FontAwesomeIcon icon={faDollarSign} />
              <span>{salary}</span>
            </div>
          )}
        </div>
      </div>

      {/* Job Description */}
      {description && (
        <div className="post-description">
          <h3 className="section-title">
            <FontAwesomeIcon icon={faBriefcase} className="section-icon" />
            Job Description
          </h3>
          <div className="formatted-text job-description-text">{description}</div>
        </div>
      )}

      {/* Requirements */}
      {requirements && (
        <div className="post-description">
          <h3 className="section-title">
            <FontAwesomeIcon icon={faListUl} className="section-icon" />
            Requirements
          </h3>
          <div className="formatted-text job-requirements-text">{requirements}</div>
        </div>
      )}

      {/* Application Buttons */}
      <div className="job-application-buttons">
        {applicationUrl && (
          <a 
            href={applicationUrl} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="apply-button"
          >
            <FontAwesomeIcon icon={faExternalLinkAlt} />
            Apply for this Position
          </a>
        )}
        
        {contactEmail && (
          <a 
            href={`mailto:${contactEmail}`} 
            className="contact-button"
          >
            <FontAwesomeIcon icon={faEnvelope} />
            Contact via Email
          </a>
        )}
      </div>

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

export default JobContent;