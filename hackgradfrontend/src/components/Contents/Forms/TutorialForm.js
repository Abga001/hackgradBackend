//Form for creating Tutorial post
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { contentService } from "../../../apiService";
import "../../../styles/CreateContent.css";

const TutorialForm = ({ currentUser, onSubmit, initialData = {}, isEditing = false }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    content: "",
    difficulty: "Beginner", // Default value
    tags: "",
    image: null,
    imagePreview: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Difficulty level options
  const difficultyLevels = [
    "Beginner",
    "Intermediate",
    "Advanced",
    "Expert"
  ];

  // Initialize form with existing data when editing
  useEffect(() => {
    if (initialData && Object.keys(initialData).length > 0) {
      const extraFields = initialData.extraFields || {};
      
      // Handle tags array
      const tagsArray = extraFields.tags || [];
      const tagsString = Array.isArray(tagsArray) ? tagsArray.join(', ') : '';
      
      setFormData({
        title: initialData.title || "",
        description: extraFields.description || "",
        content: extraFields.content || "",
        difficulty: extraFields.difficulty || "Beginner",
        tags: tagsString,
        image: null, // Cannot pre-fill the file input
        imagePreview: initialData.image || ""
      });
      
      console.log("Initialized tutorial form with:", {
        title: initialData.title,
        description: extraFields.description,
        content: extraFields.content,
        difficulty: extraFields.difficulty,
        tags: tagsString,
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
      setError("Please enter a title for your tutorial.");
      return;
    }
    
    try {
      setIsSubmitting(true);
      setError(null);
      
      // Create form data for multipart/form-data
      const submitData = new FormData();
      
      if (!isEditing) {
        // Only set content type when creating new content
        submitData.append("contentType", "Tutorial");
      }
      
      submitData.append("title", formData.title);
      submitData.append("visibility", "Public");
      
      // Convert tags to array if provided
      const tagsArray = formData.tags
        ? formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag !== '')
        : [];
      
      // Add all tutorial fields to extraFields
      const extraFields = { 
        description: formData.description,
        content: formData.content,
        difficulty: formData.difficulty,
        tags: tagsArray
      };
      submitData.append("extraFields", JSON.stringify(extraFields));
      
      // Add image if selected
      if (formData.image) {
        submitData.append("image", formData.image);
      }
      
      // Using the provided onSubmit function or default behavior
      if (onSubmit) {
        await onSubmit(submitData);
      } else {
        // Default behavior based on create/edit
        let response;
        
        if (isEditing) {
          response = await contentService.updateContent(initialData._id, submitData);
          if (response) {
            navigate(`/contents/${initialData._id}`);
          }
        } else {
          response = await contentService.createContent(submitData);
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
      console.error(isEditing ? "Error updating tutorial:" : "Error creating tutorial:", err);
      setError(err.message || `Failed to ${isEditing ? 'update' : 'create'} tutorial. Please try again.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="create-content-form">
      <h2>{isEditing ? 'Edit Tutorial' : 'Create a Tutorial'}</h2>
      
      {error && (
        <div className="form-error">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="title">Tutorial Title *</label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="Enter a title for your tutorial"
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="description">Brief Description</label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Provide a short description of what the tutorial covers"
            rows="3"
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="content">Tutorial Content</label>
          <textarea
            id="content"
            name="content"
            value={formData.content}
            onChange={handleChange}
            placeholder="Write your step-by-step tutorial here. Markdown is supported."
            rows="12"
          />
          <small className="form-help">Markdown formatting is supported for better presentation.</small>
        </div>
        
        <div className="form-group">
          <label htmlFor="difficulty">Difficulty Level</label>
          <select
            id="difficulty"
            name="difficulty"
            value={formData.difficulty}
            onChange={handleChange}
          >
            {difficultyLevels.map(level => (
              <option key={level} value={level}>
                {level}
              </option>
            ))}
          </select>
        </div>
        
        <div className="form-group">
          <label htmlFor="tags">Tags</label>
          <input
            type="text"
            id="tags"
            name="tags"
            value={formData.tags}
            onChange={handleChange}
            placeholder="e.g. javascript, react, web development (comma separated)"
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="image">Cover Image (max 5MB)</label>
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
            disabled={isSubmitting}
          >
            Cancel
          </button>
          
          <button
            type="submit"
            className="submit-button"
            disabled={isSubmitting}
          >
            {isSubmitting 
              ? (isEditing ? 'Updating...' : 'Creating...') 
              : (isEditing ? 'Update Tutorial' : 'Create Tutorial')
            }
          </button>
        </div>
      </form>
    </div>
  );
};

export default TutorialForm;