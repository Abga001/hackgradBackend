import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { contentService } from "../../../apiService";
import "../../../styles/CreateContent.css";

const JobForm = ({ currentUser, onSubmit, initialData = {}, isEditing = false }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    // Basic job information
    title: "",
    company: "",
    location: "",
    locationType: "Onsite", // Default value
    type: "Full-time", // Default value
    
    // Contract details
    contractLength: "",
    workingHours: "",
    startDate: "ASAP",
    specificStartDate: "",
    
    // Job details
    description: "",
    requirements: "",
    experienceLevel: "",
    minimumExperience: "",
    educationRequirements: "",
    department: "",
    
    // Compensation
    salary: "",
    salaryRange: {
      min: "",
      max: ""
    },
    salaryCurrency: "GBP",
    salaryFrequency: "per annum",
    
    // Company information
    companyDescription: "",
    companySize: "",
    companyIndustry: "",
    companyWebsite: "",
    yearEstablished: "",
    
    // Application information
    contactEmail: "",
    applicationUrl: "",
    applicationDeadline: "",
    applicationInstructions: "",
    referenceNumber: "",
    
    // Benefits
    benefits: [],
    
    // Skills & Tags
    skillsTags: "",
    keywordTags: "",
    
    // Other
    image: null,
    imagePreview: "",
    visibility: "Public"
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
    "Temporary"
  ];
  
  // Location type options
  const locationTypes = [
    "Onsite",
    "Remote",
    "Hybrid"
  ];
  
  // Experience level options
  const experienceLevels = [
    "Entry",
    "Junior",
    "Mid-Level",
    "Senior",
    "Lead",
    "Executive"
  ];
  
  // Company size options
  const companySizes = [
    "1-10",
    "11-50",
    "51-200",
    "201-500",
    "501-1000",
    "1001+"
  ];
  
  // Common benefits
  const commonBenefits = [
    "Health Insurance",
    "Dental Insurance",
    "Vision Insurance",
    "401(k)/Pension",
    "Paid Time Off",
    "Remote Work",
    "Flexible Hours",
    "Professional Development",
    "Gym Membership",
    "Company Events",
    "Free Lunch/Snacks",
    "Childcare",
    "Stock Options",
    "Commuter Benefits"
  ];

  // Initialize form with existing data when editing
  useEffect(() => {
    if (initialData && Object.keys(initialData).length > 0) {
      const extraFields = initialData.extraFields || {};
      
      // Parse string arrays back into arrays
      const skillsTagsArray = extraFields.skillsTags || [];
      const keywordTagsArray = extraFields.keywordTags || [];
      const benefitsArray = extraFields.benefits || [];
      
      setFormData({
        // Basic job information
        title: initialData.title || "",
        company: extraFields.company || "",
        location: extraFields.location || "",
        locationType: extraFields.locationType || "Onsite",
        type: extraFields.type || "Full-time",
        
        // Contract details
        contractLength: extraFields.contractLength || "",
        workingHours: extraFields.workingHours || "",
        startDate: extraFields.startDate || "ASAP",
        specificStartDate: extraFields.specificStartDate || "",
        
        // Job details
        description: extraFields.description || "",
        requirements: extraFields.requirements || "",
        experienceLevel: extraFields.experienceLevel || "",
        minimumExperience: extraFields.minimumExperience || "",
        educationRequirements: extraFields.educationRequirements || "",
        department: extraFields.department || "",
        
        // Compensation
        salary: extraFields.salary || "",
        salaryRange: {
          min: extraFields.salaryRange?.min || "",
          max: extraFields.salaryRange?.max || ""
        },
        salaryCurrency: extraFields.salaryCurrency || "GBP",
        salaryFrequency: extraFields.salaryFrequency || "per annum",
        
        // Company information
        companyDescription: extraFields.companyDescription || "",
        companySize: extraFields.companySize || "",
        companyIndustry: extraFields.companyIndustry || "",
        companyWebsite: extraFields.companyWebsite || "",
        yearEstablished: extraFields.yearEstablished || "",
        
        // Application information
        contactEmail: extraFields.contactEmail || "",
        applicationUrl: extraFields.applicationUrl || "",
        applicationDeadline: extraFields.applicationDeadline 
          ? new Date(extraFields.applicationDeadline).toISOString().slice(0, 10) 
          : "",
        applicationInstructions: extraFields.applicationInstructions || "",
        referenceNumber: extraFields.referenceNumber || "",
        
        // Benefits & Tags
        benefits: benefitsArray,
        skillsTags: Array.isArray(skillsTagsArray) ? skillsTagsArray.join(", ") : "",
        keywordTags: Array.isArray(keywordTagsArray) ? keywordTagsArray.join(", ") : "",
        
        // Other
        image: null, // Cannot pre-fill the file input
        imagePreview: initialData.image || "",
        visibility: initialData.visibility || "Public"
      });
    }
  }, [initialData]);

  // Handle input changes
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name.includes('.')) {
      // Handle nested property (like salaryRange.min)
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else if (name === 'benefits') {
      // Handle benefits checkbox array
      const benefit = value;
      if (checked) {
        setFormData(prev => ({
          ...prev,
          benefits: [...prev.benefits, benefit]
        }));
      } else {
        setFormData(prev => ({
          ...prev,
          benefits: prev.benefits.filter(item => item !== benefit)
        }));
      }
    } else {
      // Handle regular form input
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
      submitData.append("visibility", formData.visibility);
      
      // Process arrays or complex objects for API submission
      const skillsTagsArray = formData.skillsTags.split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);
        
      const keywordTagsArray = formData.keywordTags.split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);
      
      // Add all job fields to extraFields
      const extraFields = { 
        // Basic job information
        company: formData.company,
        location: formData.location,
        locationType: formData.locationType,
        type: formData.type,
        
        // Contract details
        contractLength: formData.contractLength,
        workingHours: formData.workingHours,
        startDate: formData.startDate,
        specificStartDate: formData.specificStartDate,
        
        // Job details
        description: formData.description,
        requirements: formData.requirements,
        experienceLevel: formData.experienceLevel,
        minimumExperience: formData.minimumExperience,
        educationRequirements: formData.educationRequirements,
        department: formData.department,
        
        // Compensation
        salary: formData.salary,
        salaryRange: {
          min: formData.salaryRange.min,
          max: formData.salaryRange.max
        },
        salaryCurrency: formData.salaryCurrency,
        salaryFrequency: formData.salaryFrequency,
        
        // Company information
        companyDescription: formData.companyDescription,
        companySize: formData.companySize,
        companyIndustry: formData.companyIndustry,
        companyWebsite: formData.companyWebsite,
        yearEstablished: formData.yearEstablished,
        
        // Application information
        contactEmail: formData.contactEmail,
        applicationUrl: formData.applicationUrl,
        applicationDeadline: formData.applicationDeadline,
        applicationInstructions: formData.applicationInstructions,
        referenceNumber: formData.referenceNumber,
        
        // Benefits & Tags
        benefits: formData.benefits,
        skillsTags: skillsTagsArray,
        keywordTags: keywordTagsArray
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
        {/* Basic Job Information Section */}
        <div className="form-section">
          <h3 className="section-title">Basic Job Information</h3>
          
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
          
          <div className="form-row">
            <div className="form-group half">
              <label htmlFor="locationType">Location Type</label>
              <select
                id="locationType"
                name="locationType"
                value={formData.locationType}
                onChange={handleChange}
              >
                {locationTypes.map(type => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="form-group half">
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
          </div>
        </div>
        
        {/* Contract Details Section */}
        <div className="form-section">
          <h3 className="section-title">Contract Details</h3>
          
          <div className="form-row">
            <div className="form-group half">
              <label htmlFor="contractLength">Contract Length</label>
              <input
                type="text"
                id="contractLength"
                name="contractLength"
                value={formData.contractLength}
                onChange={handleChange}
                placeholder="e.g. 6 months, Permanent"
              />
            </div>
            
            <div className="form-group half">
              <label htmlFor="workingHours">Working Hours</label>
              <input
                type="text"
                id="workingHours"
                name="workingHours"
                value={formData.workingHours}
                onChange={handleChange}
                placeholder="e.g. 9am-5pm, Flexible"
              />
            </div>
          </div>
          
          <div className="form-row">
            <div className="form-group half">
              <label htmlFor="startDate">Start Date</label>
              <select
                id="startDate"
                name="startDate"
                value={formData.startDate}
                onChange={handleChange}
              >
                <option value="ASAP">As Soon As Possible</option>
                <option value="Specific Date">Specific Date</option>
              </select>
            </div>
            
            {formData.startDate === "Specific Date" && (
              <div className="form-group half">
                <label htmlFor="specificStartDate">Specific Start Date</label>
                <input
                  type="date"
                  id="specificStartDate"
                  name="specificStartDate"
                  value={formData.specificStartDate}
                  onChange={handleChange}
                />
              </div>
            )}
          </div>
        </div>
        
        {/* Compensation Section */}
        <div className="form-section">
          <h3 className="section-title">Compensation</h3>
          
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
            <small>This will be displayed as the main salary on the job post.</small>
          </div>
          
          <div className="form-row">
            <div className="form-group half">
              <label htmlFor="salaryRange.min">Minimum Salary</label>
              <input
                type="number"
                id="salaryRange.min"
                name="salaryRange.min"
                value={formData.salaryRange.min}
                onChange={handleChange}
                placeholder="e.g. 50000"
              />
            </div>
            
            <div className="form-group half">
              <label htmlFor="salaryRange.max">Maximum Salary</label>
              <input
                type="number"
                id="salaryRange.max"
                name="salaryRange.max"
                value={formData.salaryRange.max}
                onChange={handleChange}
                placeholder="e.g. 70000"
              />
            </div>
          </div>
          
          <div className="form-row">
            <div className="form-group half">
              <label htmlFor="salaryCurrency">Currency</label>
              <select
                id="salaryCurrency"
                name="salaryCurrency"
                value={formData.salaryCurrency}
                onChange={handleChange}
              >
                <option value="GBP">GBP (£)</option>
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
              </select>
            </div>
            
            <div className="form-group half">
              <label htmlFor="salaryFrequency">Frequency</label>
              <select
                id="salaryFrequency"
                name="salaryFrequency"
                value={formData.salaryFrequency}
                onChange={handleChange}
              >
                <option value="per annum">Per Annum</option>
                <option value="per hour">Per Hour</option>
                <option value="per day">Per Day</option>
              </select>
            </div>
          </div>
        </div>
        
        {/* Job Details Section */}
        <div className="form-section">
          <h3 className="section-title">Job Details</h3>
          
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
          
          <div className="form-row">
            <div className="form-group half">
              <label htmlFor="experienceLevel">Experience Level</label>
              <select
                id="experienceLevel"
                name="experienceLevel"
                value={formData.experienceLevel}
                onChange={handleChange}
              >
                <option value="">Select experience level</option>
                {experienceLevels.map(level => (
                  <option key={level} value={level}>
                    {level}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="form-group half">
              <label htmlFor="minimumExperience">Minimum Experience (years)</label>
              <input
                type="number"
                id="minimumExperience"
                name="minimumExperience"
                value={formData.minimumExperience}
                onChange={handleChange}
                placeholder="e.g. 2"
              />
            </div>
          </div>
          
          <div className="form-group">
            <label htmlFor="educationRequirements">Education Requirements</label>
            <input
              type="text"
              id="educationRequirements"
              name="educationRequirements"
              value={formData.educationRequirements}
              onChange={handleChange}
              placeholder="e.g. Bachelor's in Computer Science or equivalent"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="department">Department</label>
            <input
              type="text"
              id="department"
              name="department"
              value={formData.department}
              onChange={handleChange}
              placeholder="e.g. Engineering, Marketing"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="skillsTags">Skills Tags (comma separated)</label>
            <input
              type="text"
              id="skillsTags"
              name="skillsTags"
              value={formData.skillsTags}
              onChange={handleChange}
              placeholder="e.g. JavaScript, React, Node.js"
            />
            <small>These will be used for search and filtering</small>
          </div>
        </div>
        
        {/* Company Information Section */}
        <div className="form-section">
          <h3 className="section-title">Company Information</h3>
          
          <div className="form-group">
            <label htmlFor="companyDescription">Company Description</label>
            <textarea
              id="companyDescription"
              name="companyDescription"
              value={formData.companyDescription}
              onChange={handleChange}
              placeholder="Brief overview of the company"
              rows="4"
            />
          </div>
          
          <div className="form-row">
            <div className="form-group half">
              <label htmlFor="companySize">Company Size</label>
              <select
                id="companySize"
                name="companySize"
                value={formData.companySize}
                onChange={handleChange}
              >
                <option value="">Select company size</option>
                {companySizes.map(size => (
                  <option key={size} value={size}>
                    {size} employees
                  </option>
                ))}
              </select>
            </div>
            
            <div className="form-group half">
              <label htmlFor="companyIndustry">Industry</label>
              <input
                type="text"
                id="companyIndustry"
                name="companyIndustry"
                value={formData.companyIndustry}
                onChange={handleChange}
                placeholder="e.g. Technology, Healthcare"
              />
            </div>
          </div>
          
          <div className="form-row">
            <div className="form-group half">
              <label htmlFor="companyWebsite">Company Website</label>
              <input
                type="url"
                id="companyWebsite"
                name="companyWebsite"
                value={formData.companyWebsite}
                onChange={handleChange}
                placeholder="https://company.com"
              />
            </div>
            
            <div className="form-group half">
              <label htmlFor="yearEstablished">Year Established</label>
              <input
                type="number"
                id="yearEstablished"
                name="yearEstablished"
                value={formData.yearEstablished}
                onChange={handleChange}
                placeholder="e.g. 2010"
              />
            </div>
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
        </div>
        
        {/* Application Information Section */}
        <div className="form-section">
          <h3 className="section-title">Application Information</h3>
          
          <div className="form-row">
            <div className="form-group half">
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
            
            <div className="form-group half">
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
          </div>
          
          <div className="form-row">
            <div className="form-group half">
              <label htmlFor="applicationDeadline">Application Deadline</label>
              <input
                type="date"
                id="applicationDeadline"
                name="applicationDeadline"
                value={formData.applicationDeadline}
                onChange={handleChange}
              />
            </div>
            
            <div className="form-group half">
              <label htmlFor="referenceNumber">Reference Number</label>
              <input
                type="text"
                id="referenceNumber"
                name="referenceNumber"
                value={formData.referenceNumber}
                onChange={handleChange}
                placeholder="Job reference ID"
              />
            </div>
          </div>
          
          <div className="form-group">
            <label htmlFor="applicationInstructions">Application Instructions</label>
            <textarea
              id="applicationInstructions"
              name="applicationInstructions"
              value={formData.applicationInstructions}
              onChange={handleChange}
              placeholder="Any special instructions for applicants"
              rows="4"
            />
          </div>
        </div>
        
        {/* Benefits Section */}
        <div className="form-section">
          <h3 className="section-title">Benefits</h3>
          
          <div className="benefits-checkboxes">
            {commonBenefits.map(benefit => (
              <div key={benefit} className="benefit-checkbox">
                <input
                  type="checkbox"
                  id={`benefit-${benefit.replace(/\s+/g, '-').toLowerCase()}`}
                  name="benefits"
                  value={benefit}
                  checked={formData.benefits.includes(benefit)}
                  onChange={handleChange}
                />
                <label htmlFor={`benefit-${benefit.replace(/\s+/g, '-').toLowerCase()}`}>
                  {benefit}
                </label>
              </div>
            ))}
          </div>
        </div>
        
        {/* Visibility and Additional Keywords */}
        <div className="form-section">
          <h3 className="section-title">Visibility and Search Optimization</h3>
          
          <div className="form-group">
            <label htmlFor="visibility">Visibility</label>
            <select
              id="visibility"
              name="visibility"
              value={formData.visibility}
              onChange={handleChange}
            >
              <option value="Public">Public - Visible to everyone</option>
              <option value="Connections">Connections - Visible to your connections only</option>
              <option value="Private">Private - Visible to only specified users</option>
            </select>
          </div>
          
          <div className="form-group">
            <label htmlFor="keywordTags">Additional Keywords (comma separated)</label>
            <input
              type="text"
              id="keywordTags"
              name="keywordTags"
              value={formData.keywordTags}
              onChange={handleChange}
              placeholder="Additional keywords to improve searchability"
            />
            <small>These help improve search results</small>
          </div>
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