// BookContent.js - Enhanced social media style Book content component with shared interactions
import React from 'react';
import { Link } from 'react-router-dom';
import '../../styles/ContentStyles/ContentPage.css';
import '../../styles/ContentStyles/BookContent.css';
import ImageDisplay from '../ImageDisplay';
import ContentInteractions from '../Contents/ContentInteractions';

const BookContent = ({ 
  content, 
  currentUser, 
  onEdit, 
  onDelete, 
  onLike, 
  onSave, 
  onRepost, 
  onComment, 
  onShare, 
  showComments, 
  onToggleComments, 
  isSubmitting 
}) => {
  // Extract book-specific fields
  const extraFields = content.extraFields || {};
  const author = extraFields.author || '';
  const description = extraFields.description || '';
  const price = extraFields.price || '';
  const condition = extraFields.condition || '';
  const isbn = extraFields.isbn || '';
  const publication_year = extraFields.publication_year || '';

  // Get title and image
  const title = content.title || extraFields.title || extraFields.bookTitle || 'Untitled Book';
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

      {/* Book Title */}
      <h2 className="post-title">{title}</h2>

      {/* Book Image */}
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

      {/* Book Details */}
      <div className="book-details-card">
        {author && (
          <div className="book-detail-item">
            <div className="detail-label">Author</div>
            <div className="detail-value">{author}</div>
          </div>
        )}
        
        <div className="book-detail-item highlight">
          <div className="detail-label">Price</div>
          <div className="detail-value price">£{price}</div>
        </div>
        
        <div className="book-detail-item">
          <div className="detail-label">Condition</div>
          <div className="detail-value">{condition}</div>
        </div>
        
        {publication_year && (
          <div className="book-detail-item">
            <div className="detail-label">Publication Year</div>
            <div className="detail-value">{publication_year}</div>
          </div>
        )}
        
        {isbn && (
          <div className="book-detail-item">
            <div className="detail-label">ISBN</div>
            <div className="detail-value">{isbn}</div>
          </div>
        )}
      </div>

      {/* Book Description */}
      {description && (
        <div className="post-description">
          <h3 className="section-title">Description</h3>
          <div className="formatted-text">{description}</div>
        </div>
      )}

      {/* Contact Information */}
      <div className="contact-seller">
        <h3 className="section-title">Contact Seller</h3>
        <p>To inquire about this book, please use the comment section below or contact the seller directly.</p>
      </div>

      {/* Content Interactions Component - shared across all content types */}
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
        commentPlaceholder="Ask about this book or leave a comment..."
      />
    </div>
  );
};

export default BookContent;