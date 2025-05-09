// ContentInteractions, this component includes Likes, Saves, Reposts, Comments and Share
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faThumbsUp, faBookmark, faRetweet, faComment, faShareAlt } from '@fortawesome/free-solid-svg-icons';
import SharePopup from '../Contents/Share/Share.js';

const ContentInteractions = ({
  content,
  currentUser,
  onLike,
  onSave,
  onRepost,
  onComment,
  onShare,
  onToggleComments,
  isSubmitting,
  showComments,
  children // For rendering comments section
}) => {
  const [repostNote, setRepostNote] = useState('');
  const [showRepostModal, setShowRepostModal] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [showSharePopup, setShowSharePopup] = useState(false);

  // Check if current user has interacted with content
  const hasLiked = currentUser && content.likes && content.likes.includes(currentUser._id);
  const isSaved = content.saves && currentUser && content.saves.includes(currentUser._id);
  const hasReposted = content.reposts && currentUser && content.reposts.includes(currentUser._id);
  
  // Count stats
  const likeCount = content.likes ? content.likes.length : 0;
  const commentCount = content.comments ? content.comments.length : 0;

  // Handle comment submission
  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    
    const result = await onComment(commentText.trim());
    if (result.success) {
      setCommentText('');
    }
  };

  // Handle share button click
  const handleShareClick = () => {
    if (onShare) {
      // If the parent component provides a custom share handler, use it
      onShare();
    } else {
      // Otherwise, show share popup
      setShowSharePopup(true);
    }
  };

  // Repost Modal Component
  const RepostModal = () => {
    if (!showRepostModal) return null;
    
    return (
      <div className="repost-modal-overlay">
        <div className="repost-modal">
          <h3>Repost this content</h3>
          <p>Add an optional note to your repost:</p>
          
          <textarea
            value={repostNote}
            onChange={(e) => setRepostNote(e.target.value)}
            placeholder="What do you think about this? (optional)"
            rows="4"
          />
          
          <div className="modal-actions">
            <button 
              onClick={() => setShowRepostModal(false)}
              className="cancel-button"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            
            <button
              onClick={() => {
                onRepost(repostNote);
                setShowRepostModal(false);
              }}
              className="repost-button"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Reposting...' : 'Repost'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Prepare content information for sharing
  const getContentUrl = () => {
    const baseUrl = window.location.origin;
    return `${baseUrl}/${content.contentType.toLowerCase()}/${content._id}`;
  };

  const getContentTitle = () => {
    return content.title || `${content.contentType} by ${content.authorName}`;
  };

  return (
    <>
      {/* Engagement Stats */}
      <div className="engagement-stats">
        <div className="stat-item likes">
          <span className="stat-count">{likeCount}</span> likes
        </div>
        <div className="stat-divider">•</div>
        <div className="stat-item comments">
          <span className="stat-count">{commentCount}</span> comments
        </div>
        {content.reposts && content.reposts.length > 0 && (
          <>
            <div className="stat-divider">•</div>
            <div className="stat-item reposts">
              <span className="stat-count">{content.reposts.length}</span> reposts
            </div>
          </>
        )}
      </div>

      {/* Interaction Buttons */}
      <div className="interaction-buttons">
        <button
          onClick={onLike}
          className={`interaction-button ${hasLiked ? 'active' : ''}`}
          disabled={isSubmitting || !currentUser}
        >
          <FontAwesomeIcon icon={faThumbsUp} />
          <span>{hasLiked ? 'Unlike' : 'Like'}</span>
        </button>
        
        <button
          onClick={onToggleComments}
          className="interaction-button"
          disabled={isSubmitting}
        >
          <FontAwesomeIcon icon={faComment} />
          <span>Comment</span>
        </button>
        
        <button
          onClick={() => setShowRepostModal(true)}
          className={`interaction-button ${hasReposted ? 'active' : ''}`}
          disabled={isSubmitting || !currentUser}
        >
          <FontAwesomeIcon icon={faRetweet} />
          <span>Repost</span>
        </button>
        
        <button
          onClick={onSave}
          className={`interaction-button ${isSaved ? 'active' : ''}`}
          disabled={isSubmitting || !currentUser}
        >
          <FontAwesomeIcon icon={faBookmark} />
          <span>{isSaved ? 'Saved' : 'Save'}</span>
        </button>
        
        <button
          onClick={handleShareClick}
          className="interaction-button"
        >
          <FontAwesomeIcon icon={faShareAlt} />
          <span>Share</span>
        </button>
      </div>

      {/* Comments Section */}
      {showComments && (
        <div className="comments-section">
          {/* Comment Form */}
          {currentUser && (
            <div className="comment-form-container">
              <Link to={`/profile/${currentUser._id}`} className="commenter-avatar">
                <img 
                  src={currentUser.profileImage || "/default-avatar.png"} 
                  alt={currentUser.username}
                  onError={(e) => { e.target.src = "/default-avatar.png" }}
                />
              </Link>
              <form onSubmit={handleCommentSubmit} className="comment-form">
                <textarea
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Write a comment..."
                  disabled={isSubmitting}
                  required
                />
                <button
                  type="submit"
                  disabled={isSubmitting || !commentText.trim()}
                >
                  {isSubmitting ? 'Posting...' : 'Post'}
                </button>
              </form>
            </div>
          )}
          
          {/* Comments List */}
          {!currentUser && (
            <div className="login-prompt">
              Please <Link to="/login">log in</Link> to comment
            </div>
          )}
          
          <div className="comments-list">
            {content.comments && content.comments.length > 0 ? (
              content.comments.map((comment, index) => (
                <div key={index} className="comment">
                  <Link to={`/profile/${comment.userId}`} className="commenter-avatar">
                    <img 
                      src={comment.userImage || "/default-avatar.png"} 
                      alt={comment.username}
                      onError={(e) => { e.target.src = "/default-avatar.png" }}
                    />
                  </Link>
                  <div className="comment-content">
                    <div className="comment-bubble">
                      <Link to={`/profile/${comment.userId}`} className="commenter-name">
                        {comment.username || "Unknown User"}
                      </Link>
                      <p className="comment-text">{comment.text}</p>
                    </div>
                    <div className="comment-actions">
                      <span className="comment-time">
                        {new Date(comment.createdAt).toLocaleDateString()}
                      </span>
                      <button className="comment-like-button">Like</button>
                      <button className="comment-reply-button">Reply</button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="no-comments">No comments yet. Be the first to comment!</p>
            )}
          </div>
        </div>
      )}
      
      {/* Allow custom content after comments */}
      {children}
      
      {/* Repost Modal */}
      <RepostModal />

      {/* Share Popup */}
      <SharePopup 
        isOpen={showSharePopup}
        onClose={() => setShowSharePopup(false)}
        contentUrl={getContentUrl()}
        contentTitle={getContentTitle()}
      />
    </>
  );
};

export default ContentInteractions;