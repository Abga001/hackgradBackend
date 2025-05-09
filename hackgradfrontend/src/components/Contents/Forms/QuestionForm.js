//Form for asking public question
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { contentService } from "../../../apiService";
import "../../../styles/CreateContent.css";

const QuestionForm = ({ currentUser, onSubmit, initialData = {}, isEditing = false }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    code: "",
    tags: "",
    image: null,
    imagePreview: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Initialize form with existing data when editing
  useEffect(() => {
    if (initialData && Object.keys(initialData).length > 0) {
      const extraFields = initialData.extraFields || {};
      
      // Convert tags array to comma-separated string if needed
      const tagsString = Array.isArray(initialData.tags) 
        ? initialData.tags.join(', ') 
        : extraFields.tags || "";
      
      setFormData({
        title: initialData.title || "",
        description: extraFields.description || "",
        code: extraFields.code || "",
        tags: tagsString,
        image: null, // Cannot pre-fill the file input
        imagePreview: initialData.image || ""
      });
      
      console.log("Initialized question form with:", {
        title: initialData.title,
        description: extraFields.description,
        code: extraFields.code,
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
      setError("Please enter a title for your question.");
      return;
    }
    
    try {
      setIsSubmitting(true);
      setError(null);
      
      // Create form data for multipart/form-data
      const submitData = new FormData();
      
      if (!isEditing) {
        // Only set content type when creating new content
        submitData.append("contentType", "Question");
      }
      
      submitData.append("title", formData.title);
      submitData.append("visibility", "Public");
      
      // Convert tags to array if provided
      const tagsArray = formData.tags
        ? formData.tags.split(',').map(tag => tag.trim())
        : [];
      
      // Add all question fields to extraFields
      const extraFields = { 
        description: formData.description,
        code: formData.code
      };
      submitData.append("extraFields", JSON.stringify(extraFields));
      
      // Add tags if provided
      if (tagsArray.length > 0) {
        submitData.append("tags", JSON.stringify(tagsArray));
      }
      
      // Add image if selected
      if (formData.image) {
        submitData.append("image", formData.image);
      }
      
      // Use the provided onSubmit function or default behavior
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
      console.error(isEditing ? "Error updating question:" : "Error creating question:", err);
      setError(err.message || `Failed to ${isEditing ? 'update' : 'create'} question. Please try again.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="create-content-form">
      <h2>{isEditing ? 'Edit Question' : 'Ask a Question'}</h2>
      
      {error && (
        <div className="form-error">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="title">Question Title *</label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="Be specific and imagine you're asking another person"
            required
          />
          <small className="form-help">The title should summarize your problem or question.</small>
        </div>
        
        <div className="form-group">
          <label htmlFor="description">Question Details *</label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Explain your problem in detail, include any error messages or specific requirements..."
            rows="8"
            required
          />
          <small className="form-help">Include all relevant information and context that might help others understand your question.</small>
        </div>
        
        <div className="form-group">
          <label htmlFor="code">Code (Optional)</label>
          <textarea
            id="code"
            name="code"
            value={formData.code}
            onChange={handleChange}
            placeholder="Paste any relevant code here..."
            rows="6"
          />
          <small className="form-help">If your question involves code, include the relevant code snippets here.</small>
        </div>
        
        <div className="form-group">
          <label htmlFor="tags">Tags</label>
          <input
            type="text"
            id="tags"
            name="tags"
            value={formData.tags}
            onChange={handleChange}
            placeholder="e.g. javascript, react, algorithms (comma separated)"
          />
          <small className="form-help">Add up to 5 tags to categorize your question.</small>
        </div>
        
        <div className="form-group">
          <label htmlFor="image">Image (Optional, max 5MB)</label>
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
          <small className="form-help">Upload a screenshot or image that helps explain your question.</small>
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
              ? (isEditing ? 'Updating...' : 'Posting...') 
              : (isEditing ? 'Update Question' : 'Post Question')
            }
          </button>
        </div>
      </form>
    </div>
  );
};

export default QuestionForm;