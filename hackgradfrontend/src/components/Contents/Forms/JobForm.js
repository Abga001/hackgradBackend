//Form for creating Job listing
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { contentService } from "../../../apiService";
import "../../../styles/CreateContent.css";

const JobForm = ({ currentUser, onSubmit, initialData = {}, isEditing = false }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: "",
    company: "",
    location: "",
    type: "Full-time", // Default value
    description: "",
    requirements: "",
    salary: "",
    contactEmail: "",
    applicationUrl: "",
    image: null,
    imagePreview: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Job type options
  const jobTypes = [
    "Full-time",
    "Part-time",
    "Contract",
    "Freelance",
    "Internship",
    "Remote"
  ];

  // Initialize form with existing data when editing
  useEffect(() => {
    if (initialData && Object.keys(initialData).length > 0) {
      const extraFields = initialData.extraFields || {};
      
      setFormData({
        title: initialData.title || "",
        company: extraFields.company || "",
        location: extraFields.location || "",
        type: extraFields.type || "Full-time",
        description: extraFields.description || "",
        requirements: extraFields.requirements || "",
        salary: extraFields.salary || "",
        contactEmail: extraFields.contactEmail || "",
        applicationUrl: extraFields.applicationUrl || "",
        image: null, // Cannot pre-fill the file input
        imagePreview: initialData.image || ""
      });
      
      console.log("Initialized job form with:", {
        title: initialData.title,
        company: extraFields.company,
        location: extraFields.location,
        type: extraFields.type,
        description: extraFields.description,
        requirements: extraFields.requirements,
        salary: extraFields.salary,
        contactEmail: extraFields.contactEmail,
        applicationUrl: extraFields.applicationUrl,
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
      setError("Please enter a title for the job posting.");
      return;
    }
    
    if (!formData.company.trim()) {
      setError("Please provide the company name.");
      return;
    }
    
    try {
      setIsSubmitting(true);
      setError(null);
      
      // Create form data for multipart/form-data
      const submitData = new FormData();
      
      if (!isEditing) {
        // Only set content type when creating new content
        submitData.append("contentType", "Job");
      }
      
      submitData.append("title", formData.title);
      submitData.append("visibility", "Public");
      
      // Add all job fields to extraFields
      const extraFields = { 
        company: formData.company,
        location: formData.location,
        type: formData.type,
        description: formData.description,
        requirements: formData.requirements,
        salary: formData.salary,
        contactEmail: formData.contactEmail,
        applicationUrl: formData.applicationUrl
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
      console.error(isEditing ? "Error updating job:" : "Error creating job:", err);
      setError(err.message || `Failed to ${isEditing ? 'update' : 'create'} job posting. Please try again.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="create-content-form">
      <h2>{isEditing ? 'Edit Job Posting' : 'Post a Job'}</h2>
      
      {error && (
        <div className="form-error">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="title">Job Title *</label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="e.g. Senior Frontend Developer"
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="company">Company Name *</label>
          <input
            type="text"
            id="company"
            name="company"
            value={formData.company}
            onChange={handleChange}
            placeholder="Company offering this position"
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="location">Location</label>
          <input
            type="text"
            id="location"
            name="location"
            value={formData.location}
            onChange={handleChange}
            placeholder="e.g. London, UK or Remote"
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="type">Job Type</label>
          <select
            id="type"
            name="type"
            value={formData.type}
            onChange={handleChange}
          >
            {jobTypes.map(type => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>
        
        <div className="form-group">
          <label htmlFor="description">Job Description *</label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Describe the job responsibilities, company culture, benefits, etc."
            rows="8"
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="requirements">Requirements</label>
          <textarea
            id="requirements"
            name="requirements"
            value={formData.requirements}
            onChange={handleChange}
            placeholder="List the skills, education, experience, and other requirements for this role"
            rows="6"
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="salary">Salary/Compensation</label>
          <input
            type="text"
            id="salary"
            name="salary"
            value={formData.salary}
            onChange={handleChange}
            placeholder="e.g. £50,000 - £70,000 per year"
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="contactEmail">Contact Email</label>
          <input
            type="email"
            id="contactEmail"
            name="contactEmail"
            value={formData.contactEmail}
            onChange={handleChange}
            placeholder="Email address for inquiries"
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="applicationUrl">Application URL</label>
          <input
            type="url"
            id="applicationUrl"
            name="applicationUrl"
            value={formData.applicationUrl}
            onChange={handleChange}
            placeholder="Link to apply for this position"
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="image">Company Logo (max 5MB)</label>
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
                <p className="image-note">Current logo. Upload a new one to replace it.</p>
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
              ? (isEditing ? 'Updating...' : 'Posting...') 
              : (isEditing ? 'Update Job' : 'Post Job')
            }
          </button>
        </div>
      </form>
    </div>
  );
};

export default JobForm;