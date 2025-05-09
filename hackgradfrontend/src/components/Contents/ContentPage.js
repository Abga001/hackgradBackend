// ContentPage.js - Fully revised with improved Back to Dashboard button
import React, { useEffect, useState, useContext } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { userService, contentService } from '../../apiService';
import { UserContext } from '.././../App';
import NotFoundContent from './NotFoundContent';
import ProjectContent from './ProjectContent';
import QuestionContent from './QuestionContent';
import PostContent from './PostContent';
import BookContent from './BookContent';
import EventContent from './EventContent';
import JobContent from './JobContent';
import TutorialContent from './TutorialContent';
import '../../styles/ContentStyles/ContentPage.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faEdit, faTrash } from '@fortawesome/free-solid-svg-icons';

const ContentPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useContext(UserContext);
  const [content, setContent] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch content data
  useEffect(() => {
    const fetchSingle = async () => {
      try {
        setIsLoading(true);
        
        const result = await contentService.getContentById(id);
        if (!result || !result._id) {
          setNotFound(true);
          return;
        }
        
        const contentData = result.content || result;
        
        // Only set content once we have both content and author data
        if (contentData.userId) {
          try {
            const authorData = await userService.getUserProfile(contentData.userId);
            
            // Set complete content with author data
            setContent({
              ...contentData,
              authorName: authorData.username || authorData.fullName,
              authorAvatar: authorData.profileImage || "/default-avatar.png"
            });
          } catch (userErr) {
            console.error("Error fetching author data:", userErr);
            setContent({
              ...contentData,
              authorName: "Unknown User",
              authorAvatar: "/default-avatar.png"
            });
          }
        } else {
          setContent(contentData);
        }
      } catch (err) {
        console.error("Error fetching content:", err);
        setNotFound(true);
        setError("Failed to load content");
      } finally {
        setIsLoading(false);
      }
    };

    fetchSingle();
  }, [id, currentUser]);

  const refreshAuthorData = async () => {
    if (content && content.userId) {
      try {
        const authorData = await userService.getUserProfile(content.userId);
        
        setContent(prev => ({
          ...prev,
          authorName: authorData.username || authorData.fullName,
          authorAvatar: authorData.profileImage || "/default-avatar.png"
        }));
      } catch (err) {
        console.error("Error refreshing author data:", err);
      }
    }
  };

  const [showComments, setShowComments] = useState(false);

  // Add a function to toggle comments
  const toggleComments = () => {
    setShowComments(!showComments);
  };

  // Check if current user is the owner
  const isOwner = () => {
    if (!content || !currentUser) return false;
    return content.userId === currentUser._id;
  };

  // Handle edit/delete actions
  const handleEdit = () => {
    setIsEditMode(true);
  };

  const handleDelete = async () => {
    const confirmed = window.confirm("Are you sure you want to delete this content? This action cannot be undone.");
    if (!confirmed) return;
  
    try {
      setIsSubmitting(true);
      const response = await contentService.deleteContent(id);
      if (response) {
        navigate('/dashboard');
      }
    } catch (err) {
      setError(`Failed to delete content: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle like/dislike actions
  const handleLike = async () => {
    if (!currentUser) {
      setError("Please log in to like content");
      return;
    }
    
    try {
      setIsSubmitting(true);
      const response = await contentService.performAction(id, 'like');
      
      if (response && response.content) {
        // Make sure we're using the updated content from the response
        setContent(prevContent => ({
          ...response.content,
          
          // Preserve author data which might not be in the response
          authorName: prevContent.authorName,
          authorAvatar: prevContent.authorAvatar
          
        }));
        
        // Add debugging to see what's happening
        console.log("Like response:", response);
        console.log("Updated content:", response.content);
        console.log("Likes array:", response.content.likes);
      }
    } catch (err) {
      // Change error message to be more generic since we don't know if it's a like or unlike action
      setError(`Failed to update like status. ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDislike = async () => {
    if (!currentUser) {
      setError("Please log in to dislike content");
      return;
    }
    
    try {
      setIsSubmitting(true);
      const response = await contentService.performAction(id, 'dislike');
      if (response) {
        setContent(response.content);
        await refreshAuthorData();
      }
    } catch (err) {
      setError(`Failed to dislike content. ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle save action
  const handleSave = async () => {
    if (!currentUser) {
      setError("Please log in to save content");
      return;
    }
    
    try {
      setIsSubmitting(true);
      setError(null);
      
      const response = await contentService.saveContent(id);
      
      if (response) {
        setContent(response.content);
        await refreshAuthorData();
      }
    } catch (err) {
      console.error("Save error:", err);
      setError("Failed to save content: " + (err.message || "Unknown error"));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle repost action
  const handleRepost = async (repostNote = "") => {
    if (!currentUser) {
      setError("Please log in to repost content");
      return;
    }
    
    try {
      setIsSubmitting(true);
      setError(null);
      
      const response = await contentService.repostContent(id, repostNote);
      
      if (response) {
        setContent(response.originalContent || response.content);
        await refreshAuthorData();
      }
    } catch (err) {
      console.error("Repost error:", err);
      setError("Failed to repost content: " + (err.message || "Unknown error"));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Enhanced comment handler for questions
  const handleComment = async (commentText, isAnswer = false) => {
    if (!currentUser) {
      setError("Please log in to comment");
      return { success: false, error: "Please log in to comment" };
    }
    
    try {
      setIsSubmitting(true);
      setError(null);
      
      // Handle special question-related actions
      if (commentText.startsWith('accept_')) {
        const commentIndex = parseInt(commentText.split('_')[1]);
        const response = await contentService.acceptAnswer(id, commentIndex);
        
        if (response) {
          setContent(response.content);
          return { success: true };
        }
        return { success: false, error: "Failed to accept answer" };
      }
      
      if (commentText.startsWith('vote_')) {
        const [_, commentIndex, direction] = commentText.split('_');
        const response = await contentService.voteAnswer(id, parseInt(commentIndex), direction);
        
        if (response) {
          setContent(response.content);
          return { success: true };
        }
        return { success: false, error: "Failed to vote" };
      }
      
      // For questions, use addAnswer instead of addComment
      if (content.contentType === 'Question' && isAnswer) {
        const response = await contentService.addAnswer(id, commentText.trim());
        
        if (response && response.comments) {
          setContent({
            ...content,
            comments: response.comments
          });
          return { success: true };
        }
        return { success: false, error: "Failed to add answer" };
      } else {
        // Normal comment for non-question content
        const response = await contentService.addComment(id, commentText.trim());
        
        if (response && response.comments) {
          setContent({
            ...content,
            comments: response.comments
          });
          return { success: true };
        }
        return { success: false, error: "Failed to add comment" };
      }
    } catch (err) {
      console.error("Comment error:", err);
      const errorMessage = err.message || "Unknown error";
      setError("Failed to add comment: " + errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBackToDashboard = () => {
    // Get saved dashboard state
    const savedStateJson = localStorage.getItem('dashboardState');
    
    if (savedStateJson) {
      try {
        const savedState = JSON.parse(savedStateJson);
        
        // Navigate back to dashboard with the saved state
        if (savedState.activeFilter !== 'All') {
          // If a specific filter was active, include it in the URL
          navigate(`/?filter=${savedState.activeFilter}&page=${savedState.currentPage}`);
        } else {
          // Otherwise just include the page
          navigate(`/?page=${savedState.currentPage}`);
        }
      } catch (error) {
        console.error("Error parsing saved dashboard state:", error);
        // Fallback to simple navigation
        navigate('/');
      }
    } else {
      // No saved state, just go back to dashboard
      navigate('/');
    }
  };
  
  // Render the appropriate content component based on content type
  const renderContentType = () => {
    if (!content) return null;

    const commonProps = {
      content,
      currentUser,
      onEdit: handleEdit,
      onDelete: handleDelete,
      onLike: handleLike,
      onDislike: handleDislike,
      onSave: handleSave,
      onRepost: handleRepost,
      onComment: handleComment,
      onToggleComments: toggleComments,
      showComments,
      isSubmitting,
      error
    };

    // Switch statement in renderContentType()
    switch (content.contentType) {
      case 'Project':
        return <ProjectContent {...commonProps} />;
      
      case 'Question':
        return <QuestionContent {...commonProps} />;
      
      case 'Post':
        return <PostContent {...commonProps} />;
      
      case 'Books':
        return <BookContent {...commonProps} />;
      
      case 'Event':
        return <EventContent {...commonProps} />;
      
      case 'Job':
        return <JobContent {...commonProps} />;
      
      case 'Tutorial':
        return <TutorialContent {...commonProps} />;
      
      default:
        // If no specific component for content type, render the existing content display
        return renderDefaultContent();
    }
  };

  // Default content renderer for unsupported content types
  const renderDefaultContent = () => {
    // Extract common data
    const extraFields = content.extraFields || {};
    const title = content.title || extraFields.title || extraFields.postTitle || extraFields.tutorialTitle || 'Untitled';
    const description = extraFields.description || '';
    const image = content.image || extraFields.image || '/default-content.gif';

    return (
      <div className="default-content">
        <h2>{title}</h2>
        <div className="content-metadata">
          <span><strong>Type:</strong> {content.contentType}</span>
          <span><strong>Created:</strong> {new Date(content.createdAt).toLocaleString()}</span>
        </div>

        {image && (
          <div className="content-image">
            <img
              src={image} 
              alt={title}
              onError={(e) => {
                console.log("Image failed to load:", e.target.src);
                e.target.src = "/default-content.gif";
              }}
            />
          </div>
        )}

        <div className="content-description">
          {description}
        </div>
      </div>
    );
  };

  if (notFound) return <NotFoundContent />;
  if (!content) return <div className="content-loading">Loading...</div>;

  return (
    <div className="content-page-container">
      {error && (
        <div className="alert alert-error">
          {error}
        </div>
      )}
      
      {/* Content Header with Edit/Delete Actions */}
      {/* Content Header with Edit/Delete Actions */}
<div className="content-header">
<button 
  onClick={handleBackToDashboard}
  style={{
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    backgroundColor: '#000',
    color: 'white',
    padding: '10px 20px',
    minWidth: '160px',
    borderRadius: '4px',
    fontWeight: '500',
    fontSize: '14px',
    border: 'none',
    cursor: 'pointer',
    textDecoration: 'none',
    whiteSpace: 'nowrap',
    boxShadow: '0 4px 8px rgba(24, 119, 242, 0.3)'
  }}
>
  <FontAwesomeIcon icon={faArrowLeft} /> Back to Dashboard
</button>
  
  {isOwner() && (
    <div className="content-actions">
      <Link 
        to={`/edit/${content._id}`} 
        className="edit-button"
      >
        <FontAwesomeIcon icon={faEdit} /> Edit
      </Link>
      
      <button
        onClick={handleDelete}
        className="delete-button"
        disabled={isSubmitting}
      >
        <FontAwesomeIcon icon={faTrash} /> Delete
      </button>
    </div>
  )}
</div>

      {/* Render the appropriate content type */}
      {renderContentType()}
    </div>
  );
};

export default ContentPage;