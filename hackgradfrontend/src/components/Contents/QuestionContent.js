// QuestionContent.js - Enhanced social media style Question content component
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import '../../styles/ContentStyles/ContentPage.css';
import '../../styles/ContentStyles/QuestionContent.css';
import ImageDisplay from '../ImageDisplay';
import ContentInteractions from '../Contents/ContentInteractions';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faQuestion, faCode, faTags, faCheck,
  faCaretUp, faCaretDown, faCheckCircle, faComment
} from '@fortawesome/free-solid-svg-icons';

const QuestionContent = ({ 
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
  const [answerText, setAnswerText] = useState('');

  // Extract question-specific fields
  const extraFields = content.extraFields || {};
  const description = extraFields.description || '';
  const code = extraFields.code || '';
  const tags = content.tags || [];

  // Get title and image
  const title = content.title || extraFields.title || extraFields.questionTitle || 'Untitled Question';
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
  
  // Get answer count
  const answerCount = content.comments ? content.comments.filter(c => c.isAnswer).length : 0;
  const commentCount = content.comments ? content.comments.length - answerCount : 0;

  // Handle answer submission
  const handleAnswerSubmit = async (e) => {
    e.preventDefault();
    if (!answerText.trim()) return;
    
    const result = await onComment(answerText.trim(), true); 
    if (result.success) {
      setAnswerText('');
    }
  };

  // Handle accepting an answer
  const handleAcceptAnswer = async (commentIndex) => {
    try {
      await onComment(`accept_${commentIndex}`, true);
    } catch (err) {
      console.error("Failed to accept answer:", err);
    }
  };

  // Handle voting on answers
  const handleVoteAnswer = async (commentIndex, direction) => {
    try {
      await onComment(`vote_${commentIndex}_${direction}`, true);
    } catch (err) {
      console.error("Failed to vote:", err);
    }
  };

  // Render answers section
  const renderAnswers = () => {
    if (!content?.comments || content.comments.length === 0) return null;
  
    // Filter comments to only show answers
    const answers = content.comments.filter(comment => comment.isAnswer);
    
    if (answers.length === 0) return (
      <div className="no-answers">
        <p>No answers yet. Be the first to answer this question!</p>
      </div>
    );
    
    // Sort answers: accepted answer first, then by votes
    const sortedAnswers = [...answers].sort((a, b) => {
      if (a.acceptedAnswer && !b.acceptedAnswer) return -1;
      if (!a.acceptedAnswer && b.acceptedAnswer) return 1;
      return (b.votes || 0) - (a.votes || 0);
    });
    
    return (
      <div className="answers-section">
        {sortedAnswers.map((answer, index) => {
          // Check if current user has voted on this answer
          const userVote = answer.votedBy?.find(vote => 
            vote.userId === currentUser?._id
          );
          const hasUpvoted = userVote?.voteType === "up";
          const hasDownvoted = userVote?.voteType === "down";
          
          return (
            <div key={index} className={`answer-card ${answer.acceptedAnswer ? 'accepted-answer' : ''}`}>
              <div className="answer-vote-controls">
                <button
                  className={`vote-btn up ${hasUpvoted ? 'active' : ''}`}
                  onClick={() => handleVoteAnswer(index, 'up')}
                  disabled={!currentUser || isSubmitting}
                  aria-label="Vote up"
                >
                  <FontAwesomeIcon icon={faCaretUp} />
                </button>
                <span className="vote-count">{answer.votes || 0}</span>
                <button
                  className={`vote-btn down ${hasDownvoted ? 'active' : ''}`}
                  onClick={() => handleVoteAnswer(index, 'down')}
                  disabled={!currentUser || isSubmitting}
                  aria-label="Vote down"
                >
                  <FontAwesomeIcon icon={faCaretDown} />
                </button>
              </div>
              
              <div className="answer-main-content">
                <div className="answer-header">
                  <div className="answer-author">
                    <Link to={`/profile/${answer.userId}`} className="answer-avatar">
                      <img 
                        src={answer.userImage || "/default-avatar.png"} 
                        alt={answer.username}
                        onError={(e) => { e.target.src = "/default-avatar.png" }}
                      />
                    </Link>
                    <div className="answer-meta">
                      <Link to={`/profile/${answer.userId}`} className="author-name">
                        {answer.username || "Unknown User"}
                      </Link>
                      <span className="answer-time">
                        {formatDate(answer.createdAt)}
                      </span>
                    </div>
                  </div>
                  
                  {answer.acceptedAnswer && (
                    <div className="accepted-badge">
                      <FontAwesomeIcon icon={faCheckCircle} />
                      <span>Accepted Answer</span>
                    </div>
                  )}
                  
                  {content.userId === currentUser?._id && !content.solved && !answer.acceptedAnswer && (
                    <button
                      className="accept-answer-btn"
                      onClick={() => handleAcceptAnswer(index)}
                    >
                      <FontAwesomeIcon icon={faCheck} />
                      <span>Accept</span>
                    </button>
                  )}
                </div>
                
                <div className="answer-body">
                  <div className="answer-text">{answer.text}</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
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

      {/* Question Title */}
      <h2 className="post-title">{title}</h2>

      {/* Question Status Banner */}
      <div className={`question-status-banner ${content.solved ? 'solved' : 'unsolved'}`}>
        <span className="status-indicator"></span>
        <span className="status-text">{content.solved ? 'Solved' : 'Unsolved'}</span>
      </div>

      {/* Question Image */}
      {image && image !== '/default-content.gif' && (
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

      {/* Question Description */}
      <div className="post-description">
        <h3 className="section-title">
          <FontAwesomeIcon icon={faQuestion} className="section-icon" />
          Question
        </h3>
        <div className="formatted-text">{description}</div>
      </div>
      
      {/* Code Block (if present) */}
      {code && (
        <div className="code-section">
          <h3 className="section-title">
            <FontAwesomeIcon icon={faCode} className="section-icon" />
            Code
          </h3>
          <pre className="code-block">
            <code>{code}</code>
          </pre>
        </div>
      )}
      
      {/* Tags */}
      {tags && tags.length > 0 && (
        <div className="question-tags-container">
          <h3 className="section-title">
            <FontAwesomeIcon icon={faTags} className="section-icon" />
            Tags
          </h3>
          <div className="question-tags">
            {tags.map((tag, index) => (
              <span key={index} className="tag">
                {tag}
              </span>
            ))}
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

      {/* Answers Section */}
      <div className="answers-container">
        <h3 className="answers-header">
          <FontAwesomeIcon icon={faComment} className="section-icon" />
          {answerCount} {answerCount === 1 ? 'Answer' : 'Answers'}
        </h3>
        
        {/* Post Answer Form */}
        {currentUser && (
          <div className="post-answer-form">
            <div className="answer-form-header">
              <Link to={`/profile/${currentUser._id}`} className="answer-avatar">
                <img 
                  src={currentUser.profileImage || "/default-avatar.png"} 
                  alt={currentUser.username}
                  onError={(e) => { e.target.src = "/default-avatar.png" }}
                />
              </Link>
              <div className="answer-form-label">Your Answer</div>
            </div>
            
            <form onSubmit={handleAnswerSubmit}>
              <textarea
                value={answerText}
                onChange={(e) => setAnswerText(e.target.value)}
                placeholder="Write your answer here..."
                disabled={isSubmitting}
                required
              />
              <button
                type="submit"
                disabled={isSubmitting || !answerText.trim()}
                className="submit-answer-button"
              >
                {isSubmitting ? 'Posting...' : 'Post Your Answer'}
              </button>
            </form>
          </div>
        )}
        
        {/* Login prompt for non-users */}
        {!currentUser && (
          <div className="login-prompt">
            Please <Link to="/login">log in</Link> to answer this question
          </div>
        )}
        
        {/* Answers List */}
        {renderAnswers()}
      </div>
    </div>
  );
};

export default QuestionContent;