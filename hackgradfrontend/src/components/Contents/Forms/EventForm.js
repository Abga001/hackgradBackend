//Form for creating Events
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { contentService } from "../../../apiService";
import "../../../styles/CreateContent.css";

const EventForm = ({ currentUser, onSubmit, initialData = {}, isEditing = false }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    location: "",
    virtual: false,
    organizer: "",
    registrationUrl: "",
    startDateTime: "",
    endDateTime: "",
    image: null,
    imagePreview: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Initialize form with existing data when editing
  useEffect(() => {
    if (initialData && Object.keys(initialData).length > 0) {
      const extraFields = initialData.extraFields || {};
      
      setFormData({
        title: initialData.title || "",
        description: extraFields.description || "",
        location: extraFields.location || "",
        virtual: extraFields.virtual || false,
        organizer: extraFields.organizer || "",
        registrationUrl: extraFields.registrationUrl || "",
        startDateTime: extraFields.startDateTime || "",
        endDateTime: extraFields.endDateTime || "",
        image: null, // Cannot pre-fill the file input
        imagePreview: initialData.image || ""
      });
      
      console.log("Initialized event form with:", {
        title: initialData.title,
        description: extraFields.description,
        location: extraFields.location,
        virtual: extraFields.virtual,
        organizer: extraFields.organizer,
        registrationUrl: extraFields.registrationUrl,
        startDateTime: extraFields.startDateTime,
        endDateTime: extraFields.endDateTime,
        image: initialData.image
      });
    }
  }, [initialData]);

  // Handle input changes
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
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
      setError("Please enter a title for your event.");
      return;
    }
    
    if (!formData.startDateTime) {
      setError("Please provide a start date and time for the event.");
      return;
    }
    
    try {
      setIsSubmitting(true);
      setError(null);
      
      // Create form data for multipart/form-data
      const submitData = new FormData();
      
      if (!isEditing) {
        // Only set content type when creating new content
        submitData.append("contentType", "Event");
      }
      
      submitData.append("title", formData.title);
      submitData.append("visibility", "Public");
      
      // Add all event fields to extraFields
      const extraFields = { 
        description: formData.description,
        location: formData.location,
        virtual: formData.virtual,
        organizer: formData.organizer,
        registrationUrl: formData.registrationUrl,
        startDateTime: formData.startDateTime,
        endDateTime: formData.endDateTime
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
      console.error(isEditing ? "Error updating event:" : "Error creating event:", err);
      setError(err.message || `Failed to ${isEditing ? 'update' : 'create'} event. Please try again.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="create-content-form">
      <h2>{isEditing ? 'Edit Event' : 'Create an Event'}</h2>
      
      {error && (
        <div className="form-error">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="title">Event Title *</label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="Enter a title for your event"
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="description">Event Description</label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Describe what the event is about..."
            rows="6"
          />
        </div>
        
        <div className="form-group">
          <label>
            <input
              type="checkbox"
              name="virtual"
              checked={formData.virtual}
              onChange={handleChange}
            />
            This is a virtual event
          </label>
        </div>
        
        <div className="form-group">
          <label htmlFor="location">Location</label>
          <input
            type="text"
            id="location"
            name="location"
            value={formData.location}
            onChange={handleChange}
            placeholder={formData.virtual ? "Virtual meeting link or platform" : "Physical location address"}
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="startDateTime">Start Date and Time *</label>
          <input
            type="datetime-local"
            id="startDateTime"
            name="startDateTime"
            value={formData.startDateTime}
            onChange={handleChange}
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="endDateTime">End Date and Time</label>
          <input
            type="datetime-local"
            id="endDateTime"
            name="endDateTime"
            value={formData.endDateTime}
            onChange={handleChange}
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="organizer">Organizer</label>
          <input
            type="text"
            id="organizer"
            name="organizer"
            value={formData.organizer}
            onChange={handleChange}
            placeholder="Who is organizing this event?"
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="registrationUrl">Registration URL</label>
          <input
            type="url"
            id="registrationUrl"
            name="registrationUrl"
            value={formData.registrationUrl}
            onChange={handleChange}
            placeholder="Link to register for the event (if applicable)"
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="image">Event Image (max 5MB)</label>
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
              : (isEditing ? 'Update Event' : 'Create Event')
            }
          </button>
        </div>
      </form>
    </div>
  );
};

export default EventForm;