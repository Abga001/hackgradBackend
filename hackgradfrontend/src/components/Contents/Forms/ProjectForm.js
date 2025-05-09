//Form for creating Projects
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { contentService } from "../../../apiService";
import "../../../styles/CreateContent.css";

const ProjectForm = ({ currentUser, onSubmit, initialData = {}, isEditing = false }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    technologiesInput: "", 
    technologies: [], 
    repoUrl: "",
    demoUrl: "",
    image: null,
    imagePreview: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Initialize form with existing data when editing
  useEffect(() => {
    if (initialData && Object.keys(initialData).length > 0) {
      const extraFields = initialData.extraFields || {};
      
 
      const technologiesArray = extraFields.technologies || [];
      const technologiesString = technologiesArray.join(', ');
      
      setFormData({
        title: initialData.title || "",
        description: extraFields.description || "",
        technologiesInput: technologiesString,
        technologies: technologiesArray,
        repoUrl: extraFields.repoUrl || "",
        demoUrl: extraFields.demoUrl || "",
        image: null, // Cannot pre-fill the file input
        imagePreview: initialData.image || ""
      });
      
      console.log("Initialized project form with:", {
        title: initialData.title,
        description: extraFields.description,
        technologies: technologiesArray,
        repoUrl: extraFields.repoUrl,
        demoUrl: extraFields.demoUrl,
        image: initialData.image
      });
    }
  }, [initialData]);

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'technologiesInput') {

      const techArray = value.split(',').map(tech => tech.trim()).filter(tech => tech !== '');
      setFormData(prev => ({
        ...prev,
        technologiesInput: value,
        technologies: techArray
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
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
      setError("Please enter a title for your project.");
      return;
    }
    
    try {
      setIsSubmitting(true);
      setError(null);
      
      // Create form data for multipart/form-data
      const submitData = new FormData();
      
      if (!isEditing) {
        // Only set content type when creating new content
        submitData.append("contentType", "Project");
      }
      
      submitData.append("title", formData.title);
      submitData.append("visibility", "Public");
      
      // Add all project fields to extraFields
      const extraFields = { 
        description: formData.description,
        technologies: formData.technologies,
        repoUrl: formData.repoUrl,
        demoUrl: formData.demoUrl
      };
      submitData.append("extraFields", JSON.stringify(extraFields));
      
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
      console.error(isEditing ? "Error updating project:" : "Error creating project:", err);
      setError(err.message || `Failed to ${isEditing ? 'update' : 'create'} project. Please try again.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="create-content-form">
      <h2>{isEditing ? 'Edit Project' : 'Create a Project'}</h2>
      
      {error && (
        <div className="form-error">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="title">Project Title *</label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="Enter a title for your project"
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="description">Project Description</label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Describe your project, its purpose, features, and achievements..."
            rows="8"
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="technologiesInput">Technologies Used</label>
          <input
            type="text"
            id="technologiesInput"
            name="technologiesInput"
            value={formData.technologiesInput}
            onChange={handleChange}
            placeholder="e.g. React, Node.js, MongoDB (comma separated)"
          />
          
          {formData.technologies.length > 0 && (
            <div className="technologies-preview">
              {formData.technologies.map((tech, index) => (
                <span key={index} className="technology-tag">
                  {tech}
                </span>
              ))}
            </div>
          )}
        </div>
        
        <div className="form-group">
          <label htmlFor="repoUrl">Repository URL</label>
          <input
            type="url"
            id="repoUrl"
            name="repoUrl"
            value={formData.repoUrl}
            onChange={handleChange}
            placeholder="Link to the project's code repository (GitHub, GitLab, etc.)"
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="demoUrl">Demo URL</label>
          <input
            type="url"
            id="demoUrl"
            name="demoUrl"
            value={formData.demoUrl}
            onChange={handleChange}
            placeholder="Link to a live demo of your project"
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="image">Project Image (max 5MB)</label>
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
              : (isEditing ? 'Update Project' : 'Create Project')
            }
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProjectForm;