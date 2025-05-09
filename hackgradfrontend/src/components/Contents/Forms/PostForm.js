//Form for creating generic posts
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { contentService } from "../../../apiService";
import "../../../styles/CreateContent.css";

const FixedPostForm = ({ currentUser, onSubmit, initialData = {}, isEditing = false, isSubmitting: externalSubmitting = false }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    visibility: "Public",
    image: null,
    imagePreview: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Visibility options
  const visibilityOptions = [
    "Public",
    "Followers",
    "Private"
  ];

  // Initialize form with existing data when editing
  useEffect(() => {
    if (initialData && Object.keys(initialData).length > 0) {
      const extraFields = initialData.extraFields || {};
      
      setFormData({
        title: initialData.title || "",
        description: extraFields.description || "",
        visibility: initialData.visibility || "Public",
        image: null, // Cannot pre-fill the file input
        imagePreview: initialData.image || ""
      });
      
      console.log("Initialized post form with:", {
        title: initialData.title,
        description: extraFields.description,
        visibility: initialData.visibility,
        image: initialData.image
      });
    }
  }, [initialData]);

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle file selection
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Check file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        setError('Image file is too large. Maximum size is 5MB.');
        return;
      }
      
      setFormData(prev => ({
        ...prev,
        image: file,
        imagePreview: URL.createObjectURL(file)
      }));
    }
  };

  // Submit form
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      setError("Please enter a title for your post.");
      return;
    }
    
    try {
      setIsSubmitting(true);
      setError(null);
      
      // Create form data for multipart/form-data
      const submitData = new FormData();
      
      // setting the content type!
      submitData.append("contentType", "Post");
      
      submitData.append("title", formData.title);
      submitData.append("visibility", formData.visibility);
      
      // Description to extraFields
      const extraFields = { 
        description: formData.description,
        // Additional fields for better compatibility with filter functions
        title: formData.title,
        postTitle: formData.title,
        tags: ""
      };
      submitData.append("extraFields", JSON.stringify(extraFields));
      
      // Add image if selected
      if (formData.image) {
        submitData.append("image", formData.image);
      }
      
      // Log the form data being sent
      console.log("Form data entries:", [...submitData.entries()].map(entry => ({ key: entry[0], value: entry[1] })));
      
      // Use the provided onSubmit function or default behavior
      if (onSubmit) {
        console.log("Using provided onSubmit function");
        await onSubmit(submitData);
      } else {
        console.log("Using default submission behavior");
        // Default behavior based on create/edit
        let response;
        
        if (isEditing) {
          response = await contentService.updateContent(initialData._id, submitData);
          console.log("Edit response:", response);
          if (response) {
            navigate(`/contents/${initialData._id}`);
          }
        } else {
          console.log("Creating new content");
          response = await contentService.createContent(submitData);
          console.log("Create response:", response);
          if (response && response.saved) {
            navigate(`/contents/${response.saved._id}`);
          }
        }
      }
      
      // Clean up any object URLs
      if (formData.imagePreview && formData.imagePreview.startsWith('blob:')) {
        URL.revokeObjectURL(formData.imagePreview);
      }
    } catch (err) {
      console.error(isEditing ? "Error updating post:" : "Error creating post:", err);
      setError(err.message || `Failed to ${isEditing ? 'update' : 'create'} post. Please try again.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Use either external or internal submitting state
  const isFormSubmitting = externalSubmitting || isSubmitting;

  return (
    <div className="create-content-form">
      <h2>{isEditing ? 'Edit Post' : 'Create a Post'}</h2>
      
      {error && (
        <div className="form-error">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="title">Title *</label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="Enter a title for your post"
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="description">Content</label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Share your thoughts, ideas, or updates..."
            rows="8"
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="visibility">Visibility</label>
          <select
            id="visibility"
            name="visibility"
            value={formData.visibility}
            onChange={handleChange}
          >
            {visibilityOptions.map(option => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
        
        <div className="form-group">
          <label htmlFor="image">Image (max 5MB)</label>
          <input
            type="file"
            id="image"
            accept="image/*"
            onChange={handleFileChange}
          />
          
          {formData.imagePreview && (
            <div className="image-preview">
              <img 
                src={formData.imagePreview} 
                alt="Preview" 
                onError={(e) => { e.target.src = '/default-content.gif' }}
                style={{ maxWidth: '100%', maxHeight: '300px' }}
              />
              {isEditing && !formData.image && (
                <p className="image-note">Current image. Upload a new one to replace it.</p>
              )}
            </div>
          )}
        </div>
        
        <div className="form-actions">
          <button
            type="button"
            onClick={() => navigate(isEditing ? `/contents/${initialData._id}` : '/dashboard')}
            className="cancel-button"
            disabled={isFormSubmitting}
          >
            Cancel
          </button>
          
          <button
            type="submit"
            className="submit-button"
            disabled={isFormSubmitting}
          >
            {isFormSubmitting 
              ? (isEditing ? 'Updating...' : 'Creating...') 
              : (isEditing ? 'Update Post' : 'Create Post')
            }
          </button>
        </div>
      </form>
    </div>
  );
};

export default FixedPostForm;