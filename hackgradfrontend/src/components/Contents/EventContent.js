// EventContent.js - Enhanced social media style Event content component
import React from 'react';
import { Link } from 'react-router-dom';
import '../../styles/ContentStyles/ContentPage.css';
import '../../styles/ContentStyles/EventContent.css';
import ImageDisplay from '../ImageDisplay';
import ContentInteractions from '../Contents/ContentInteractions';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendarAlt, faMapMarkerAlt, faUserTie } from '@fortawesome/free-solid-svg-icons';

const EventContent = ({ 
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
  // Extract event-specific fields
  const extraFields = content.extraFields || {};
  const description = extraFields.description || '';
  const location = extraFields.location || '';
  const virtual = extraFields.virtual || false;
  const organizer = extraFields.organizer || '';
  const registrationUrl = extraFields.registrationUrl || '';
  const startDateTime = extraFields.startDateTime || '';
  const endDateTime = extraFields.endDateTime || '';

  // Get title and image
  const title = content.title || extraFields.title || extraFields.eventTitle || 'Untitled Event';
  const image = content.image || extraFields.image || '/default-content.gif';

  // Author info
  const authorName = content.authorName || content.username || "Unknown User";
  const authorAvatar = content.authorAvatar || content.profileImage || "/default-avatar.png";
  
  // Format date
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Format date and time for event
  const formatDateTime = (datetime) => {
    if (!datetime) return '';
    const options = { 
      weekday: 'long',
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(datetime).toLocaleString(undefined, options);
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

      {/* Event Title */}
      <h2 className="post-title">{title}</h2>

      {/* Event Image */}
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

      {/* Event Details Card */}
      <div className="event-details-card">
        <div className="event-detail-item">
          <div className="event-icon">
            <FontAwesomeIcon icon={faCalendarAlt} />
          </div>
          <div className="event-detail-content">
            <div className="event-detail-label">When</div>
            <div className="event-detail-value">
              <div><strong>Starts:</strong> {formatDateTime(startDateTime)}</div>
              {endDateTime && <div><strong>Ends:</strong> {formatDateTime(endDateTime)}</div>}
            </div>
          </div>
        </div>
        
        <div className="event-detail-item">
          <div className="event-icon">
            <FontAwesomeIcon icon={faMapMarkerAlt} />
          </div>
          <div className="event-detail-content">
            <div className="event-detail-label">Where</div>
            <div className="event-detail-value">
              <div>{location || (virtual ? 'Virtual Event' : 'Location not specified')}</div>
              {virtual && <span className="virtual-badge">Virtual Event</span>}
            </div>
          </div>
        </div>
        
        {organizer && (
          <div className="event-detail-item">
            <div className="event-icon">
              <FontAwesomeIcon icon={faUserTie} />
            </div>
            <div className="event-detail-content">
              <div className="event-detail-label">Organizer</div>
              <div className="event-detail-value">{organizer}</div>
            </div>
          </div>
        )}
      </div>

      {/* Event Description */}
      {description && (
        <div className="post-description">
          <h3 className="section-title">About this Event</h3>
          <div className="formatted-text">{description}</div>
        </div>
      )}

      {/* Registration Button */}
      {registrationUrl && (
        <div className="event-registration-button">
          <a href={registrationUrl} target="_blank" rel="noopener noreferrer" className="registration-btn">
            Register for this Event
          </a>
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

export default EventContent;