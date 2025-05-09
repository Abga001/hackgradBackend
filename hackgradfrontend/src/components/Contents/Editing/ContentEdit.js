// ContentEdit.js - Component for editing existing content
import React, { useEffect, useState, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { UserContext } from '../../../App';
import { contentService } from '../../../apiService';
import NotFoundContent from '../NotFoundContent';

// Import all content type form components
import PostForm from '../Forms/PostForm';
import ProjectForm from '../Forms/ProjectForm';
import QuestionForm from '../Forms/QuestionForm';
import BookForm from '../Forms/BooksForm';
import EventForm from '../Forms/EventForm';
import JobForm from '../Forms/JobForm';
import TutorialForm from '../Forms/TutorialForm';

const ContentEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useContext(UserContext);
  
  const [content, setContent] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [unauthorized, setUnauthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch content data
  useEffect(() => {
    const fetchContent = async () => {
      try {
        setIsLoading(true);
        const result = await contentService.getContentById(id);
        
        if (!result || !result._id) {
          console.error("Content not found");
          setNotFound(true);
          return;
        }
        
        // Check if current user is the owner
        if (!currentUser || result.userId !== currentUser._id) {
          console.error("Unauthorized to edit this content");
          setUnauthorized(true);
          return;
        }
        
        setContent(result);
      } catch (err) {
        console.error("Error fetching content:", err);
        setError("Failed to load content: " + (err.message || "Unknown error"));
        setNotFound(true);
      } finally {
        setIsLoading(false);
      }
    };

    if (id && currentUser) {
      fetchContent();
    }
  }, [id, currentUser]);

  // Handle form submission
  const handleSubmit = async (formData) => {
    try {
      setIsLoading(true);
      const response = await contentService.updateContent(id, formData);
      
      if (response && (response.updatedContent || response.content)) {
        // Navigate back to the content page
        navigate(`/contents/${id}`);
      } else {
        setError("Failed to update content: No response from server");
      }
    } catch (err) {
      console.error("Update error:", err);
      setError("Failed to update content: " + (err.message || "Unknown error"));
    } finally {
      setIsLoading(false);
    }
  };

  // Render form based on content type
  const renderEditForm = () => {
    if (!content) return null;

    // Create an initialData object for the form
    const initialData = {
      _id: content._id,
      title: content.title || '',
      visibility: content.visibility || 'Public',
      image: content.image || null,
      extraFields: content.extraFields || {},
      contentType: content.contentType,
      tags: content.tags || []
    };

    // Render appropriate form based on content type
    switch (content.contentType) {
      case 'Post':
        return (
          <PostForm 
            currentUser={currentUser}
            initialData={initialData}
            isEditing={true}
            onSubmit={handleSubmit}
          />
        );
      case 'Project':
        return (
          <ProjectForm 
            currentUser={currentUser}
            initialData={initialData}
            isEditing={true}
            onSubmit={handleSubmit}
          />
        );
      case 'Question':
        return (
          <QuestionForm 
            currentUser={currentUser}
            initialData={initialData}
            isEditing={true}
            onSubmit={handleSubmit}
          />
        );
      case 'Books':
        return (
          <BookForm 
            currentUser={currentUser}
            initialData={initialData}
            isEditing={true}
            onSubmit={handleSubmit}
          />
        );
      case 'Event':
        return (
          <EventForm 
            currentUser={currentUser}
            initialData={initialData}
            isEditing={true}
            onSubmit={handleSubmit}
          />
        );
      case 'Job':
        return (
          <JobForm 
            currentUser={currentUser}
            initialData={initialData}
            isEditing={true}
            onSubmit={handleSubmit}
          />
        );
      case 'Tutorial':
        return (
          <TutorialForm 
            currentUser={currentUser}
            initialData={initialData}
            isEditing={true}
            onSubmit={handleSubmit}
          />
        );
      default:
        return <div className="content-error">This content type ({content.contentType}) cannot be edited.</div>;
    }
  };

  if (notFound) return <NotFoundContent />;
  if (unauthorized) return <div className="content-error">You don't have permission to edit this content.</div>;
  if (isLoading) return <div className="content-loading">Loading...</div>;

  return (
    <div className="content-edit-container">
      <h1>Edit {content?.contentType}</h1>
      
      {error && (
        <div className="alert alert-error">
          {error}
        </div>
      )}
      
      {renderEditForm()}
    </div>
  );
};

export default ContentEdit;