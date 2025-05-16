import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { UserContext } from '../App';
import { cvProfileService } from '../CVService';
import ProfileNotification from '../components/ProfileNotification';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faSave, faTimes, faPlus, faTrash, faEye, faEyeSlash, 
  faFileDownload, faExclamationTriangle, faInfoCircle, faUndo,
  faSyncAlt
} from '@fortawesome/free-solid-svg-icons';
import '../styles/CVProfileEditor.css';

const CVProfileEditor = () => {
  const navigate = useNavigate();
  const { currentUser } = useContext(UserContext);
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [cvProfile, setCVProfile] = useState(null);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('basic');
  const [unsavedChanges, setUnsavedChanges] = useState(false);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [prepopulatedFields, setPrepopulatedFields] = useState([]);
  const { id } = useParams();
  const [notification, setNotification] = useState({
    show: false,
    message: '',
  });

  // Load CV profile on component mount
  useEffect(() => {
    const loadCVProfile = async () => {
      try {
        setIsLoading(true);
        let profileData;
        let isNewProfile = false;
        
        if (id) {
          // If we have an ID, load that specific CV
          try {
            profileData = await cvProfileService.getCVProfileById(id);
            console.log(`Loaded CV with ID: ${id}`, profileData);
          } catch (err) {
            console.error(`Error loading CV with ID ${id}:`, err);
            throw err;
          }
        } else {
          // No ID, try to get default CV
          try {
            profileData = await cvProfileService.getCurrentCVProfile();
          } catch (err) {
            // If 404, create a new one
            if (err.response && err.response.status === 404) {
              profileData = await cvProfileService.createCVProfile();
              isNewProfile = true;
            } else {
              throw err;
            }
          }
        }
        
        if (profileData) {
          setCVProfile(profileData);
          
          // If this is a new profile, remember which fields were pre-populated
          if (isNewProfile) {
            // These are fields that typically come from the user profile
            setPrepopulatedFields([
              'basicInfo.fullName',
              'basicInfo.bio',
              'basicInfo.email',
              'basicInfo.headline',
              'education',
              'experience',
              'skills',
              'languages'
            ]);
            
            setShowWelcomeModal(true);
          }
        } else {
          // Initialize with empty profile structure
          setCVProfile({
            isPublic: false,
            basicInfo: {
              fullName: '',
              headline: '',
              bio: '',
              profileImage: '',
              email: '',
              contact: {
                phone: '',
                location: '',
                website: ''
              }
            },
            education: [],
            experience: [],
            skills: [],
            languages: [],
            projects: [],
            certifications: [],
            publications: [],
            customSections: [],
            theme: {
              primaryColor: '#4e54c8',
              secondaryColor: '#8f94fb',
              fontFamily: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif',
              layout: 'standard'
            },
            displayOptions: {
              showProfileImage: true,
              showContact: true,
              sectionsOrder: [
                'summary', 'workExperience', 'education', 'skills', 
                'projects', 'certifications', 'languages', 'publications', 'customSections'
              ],
              hiddenSections: []
            }
          });
        }
      } catch (err) {
        setError("Failed to load CV profile. Please try again.");
        console.error("Load CV profile error:", err);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadCVProfile();
    
    // Check if this is a new profile from route state
    if (location.state?.isNewProfile) {
      setShowWelcomeModal(true);
    }
    
    // Prompt user when trying to leave with unsaved changes
    const handleBeforeUnload = (e) => {
      if (unsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
        return '';
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [location.state, id]);

  // Check if a field was pre-populated from user profile
  const isPrepopulated = (fieldPath) => {
    if (prepopulatedFields.length === 0) return false;
    
    // Check if the parent array is prepopulated
    if (fieldPath.includes('[')) {
      const arrayPath = fieldPath.split('[')[0];
      return prepopulatedFields.includes(arrayPath);
    }
    
    return prepopulatedFields.includes(fieldPath);
  };

  // Handle input changes
  const handleInputChange = (field, value) => {
    setCVProfile(prev => {
      const newProfile = { ...prev };
      
      // Handle nested fields
      if (field.includes('.')) {
        const fields = field.split('.');
        let current = newProfile;
        
        for (let i = 0; i < fields.length - 1; i++) {
          if (!current[fields[i]]) {
            current[fields[i]] = {};
          }
          current = current[fields[i]];
        }
        
        current[fields[fields.length - 1]] = value;
      } else {
        newProfile[field] = value;
      }
      
      return newProfile;
    });
    
    setUnsavedChanges(true);
  };

  // Handle array item changes
  const handleArrayItemChange = (arrayName, index, field, value) => {
    setCVProfile(prev => {
      const newArray = [...prev[arrayName]];
      newArray[index] = { ...newArray[index], [field]: value };
      
      return {
        ...prev,
        [arrayName]: newArray
      };
    });
    
    setUnsavedChanges(true);
  };

  // Add new item to an array field
  const handleAddItem = (field, newItem) => {
    setCVProfile(prev => ({
      ...prev,
      [field]: [...(prev[field] || []), newItem]
    }));
    
    setUnsavedChanges(true);
  };

  // Remove an item from an array field
  const handleRemoveItem = (field, index) => {
    setCVProfile(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }));
    
    setUnsavedChanges(true);
  };

  // Toggle CV profile privacy
  const handleTogglePrivacy = async () => {
    try {
      setIsSaving(true);
      const updatedProfile = await cvProfileService.togglePrivacy(cvProfile._id);
      
      setCVProfile(updatedProfile);
      setUnsavedChanges(false);
    } catch (err) {
      setError("Failed to toggle privacy setting. Please try again.");
      console.error("Toggle privacy error:", err);
    } finally {
      setIsSaving(false);
    }
  };

  // Sync with user profile
  const handleSyncWithProfile = async () => {
    try {
      setIsSaving(true);
      const sections = ['basicInfo', 'education', 'experience', 'skills', 'languages'];
      const updatedProfile = await cvProfileService.syncWithUserProfile(sections);
      
      setCVProfile(updatedProfile);
      setUnsavedChanges(false);
      
      // Show which fields were updated
      setPrepopulatedFields(sections);
      alert('Your CV has been updated with the latest information from your profile.');
    } catch (err) {
      setError("Failed to sync with profile. Please try again.");
      console.error("Sync error:", err);
    } finally {
      setIsSaving(false);
    }
  };

  // Save CV profile
// Updated handleSave function
const handleSave = async () => {
  try {
    setIsSaving(true);
    // Pass the profile ID if it exists, otherwise pass null
    const updatedProfile = await cvProfileService.saveCVProfile(cvProfile?._id || null, cvProfile);
    setCVProfile(updatedProfile);
    setUnsavedChanges(false);
    setError(null);
    
    // Show notification instead of alert
    setNotification({
      show: true,
      message: 'CV profile saved successfully!',
      theme: {
        primaryColor: cvProfile.theme?.primaryColor || '#4e54c8',
        secondaryColor: cvProfile.theme?.secondaryColor || '#8f94fb'
      }
    });
  } catch (err) {
    setError("Failed to save CV profile. Please try again.");
    console.error("Save CV profile error:", err);
  } finally {
    setIsSaving(false);
  }
};
  

  // Generate and download PDF
  const handleGeneratePDF = async () => {
    try {
      setIsSaving(true);
      // Save current state first if there are unsaved changes
      if (unsavedChanges) {
        await cvProfileService.saveCVProfile(cvProfile._id, cvProfile);
        setUnsavedChanges(false);
      }
      
      await cvProfileService.generatePDF(cvProfile._id);
    } catch (err) {
      setError("Failed to generate PDF. Please try again.");
      console.error("PDF generation error:", err);
    } finally {
      setIsSaving(false);
    }
  };

  // Cancel editing and go back
  const handleCancel = () => {
    if (unsavedChanges) {
      if (window.confirm("You have unsaved changes. Are you sure you want to leave?")) {
        navigate('/cv');
      }
    } else {
      navigate('/cv');
    }
  };

  // Reset form to last saved state
  const handleReset = () => {
    if (window.confirm("Discard all unsaved changes?")) {
      window.location.reload();
    }
  };

  if (isLoading) {
    return <div className="cv-loading">Loading CV profile editor...</div>;
  }

  if (!cvProfile) {
    return <div className="cv-error">Failed to load CV profile.</div>;
  }

  // Template for a new work experience entry
  const newWorkExperience = {
    title: '',
    company: '',
    location: '',
    startDate: '',
    endDate: '',
    current: false,
    description: '',
    highlights: [],
    technologies: []
  };

  // Template for a new education entry
  const newEducation = {
    institution: '',
    degree: '',
    fieldOfStudy: '',
    startYear: new Date().getFullYear(),
    endYear: '',
    current: false,
    description: '',
    achievements: []
  };

  // Template for a new skill
  const newSkill = {
    name: '',
    level: 'Intermediate',
    yearsOfExperience: 1
  };

  // Template for a new language
  const newLanguage = {
    name: '',
    proficiency: 'Professional Working'
  };

  // Template for a new project
  const newProject = {
    title: '',
    description: '',
    startDate: '',
    endDate: '',
    current: false,
    url: '',
    repositoryUrl: '',
    technologies: [],
    highlights: []
  };

  // Template for a new certification
  const newCertification = {
    name: '',
    issuer: '',
    date: '',
    expires: '',
    hasExpiry: false,
    credentialId: '',
    credentialURL: ''
  };

  // Template for a new publication
  const newPublication = {
    title: '',
    publisher: '',
    date: '',
    url: '',
    description: ''
  };

  return (
    <div className="cv-profile-editor">
      {/* Welcome Modal for New Profiles */}
      {showWelcomeModal && (
        <div className="cv-welcome-modal">
          <div className="cv-welcome-content">
            <h3>Welcome to Your CV Profile</h3>
            <p>We've created your CV profile and pre-filled it with information from your user profile.</p>
            <p>Fields marked with a <span className="prepopulated-indicator">•</span> were automatically filled. Feel free to edit or add more details.</p>
            <button onClick={() => setShowWelcomeModal(false)}>Got it</button>
          </div>
        </div>
      )}

      <div className="cv-editor-header">
        <h2>Edit CV Profile</h2>
        <div className="cv-editor-actions">
          <button 
            className="cv-sync-button" 
            onClick={handleSyncWithProfile} 
            disabled={isSaving}
            title="Update CV with latest profile information"
          >
            <FontAwesomeIcon icon={faSyncAlt} /> Sync with Profile
          </button>
          
          <button 
            className="cv-privacy-toggle" 
            onClick={handleTogglePrivacy} 
            disabled={isSaving}
          >
            <FontAwesomeIcon icon={cvProfile.isPublic ? faEye : faEyeSlash} />
            {cvProfile.isPublic ? ' Public CV' : ' Private CV'}
          </button>
          
          <button 
            className="cv-pdf-button" 
            onClick={handleGeneratePDF} 
            disabled={isSaving}
          >
            <FontAwesomeIcon icon={faFileDownload} /> Download PDF
          </button>
          
          <button 
            className="cv-save-button" 
            onClick={handleSave} 
            disabled={isSaving || !unsavedChanges}
          >
            <FontAwesomeIcon icon={faSave} /> {isSaving ? 'Saving...' : 'Save'}
          </button>
          
          <button 
            className="cv-cancel-button" 
            onClick={handleCancel} 
            disabled={isSaving}
          >
            <FontAwesomeIcon icon={faTimes} /> Cancel
          </button>
        </div>
      </div>
      
      {error && (
        <div className="cv-error-message">
          <FontAwesomeIcon icon={faExclamationTriangle} /> {error}
        </div>
      )}
      
      {unsavedChanges && (
        <div className="cv-unsaved-changes">
          <FontAwesomeIcon icon={faInfoCircle} /> You have unsaved changes.
        </div>
      )}
      
      <div className="cv-editor-tabs">
        <button 
          className={activeTab === 'basic' ? 'active' : ''} 
          onClick={() => setActiveTab('basic')}
        >
          Basic Info
        </button>
        <button 
          className={activeTab === 'experience' ? 'active' : ''} 
          onClick={() => setActiveTab('experience')}
        >
          Experience
        </button>
        <button 
          className={activeTab === 'education' ? 'active' : ''} 
          onClick={() => setActiveTab('education')}
        >
          Education
        </button>
        <button 
          className={activeTab === 'skills' ? 'active' : ''} 
          onClick={() => setActiveTab('skills')}
        >
          Skills
        </button>
        <button 
          className={activeTab === 'projects' ? 'active' : ''} 
          onClick={() => setActiveTab('projects')}
        >
          Projects
        </button>
        <button 
          className={activeTab === 'other' ? 'active' : ''} 
          onClick={() => setActiveTab('other')}
        >
          Other
        </button>
        <button 
          className={activeTab === 'display' ? 'active' : ''} 
          onClick={() => setActiveTab('display')}
        >
          Display
        </button>
      </div>
      
      <div className="cv-editor-content">
        {/* Basic Info Tab */}
        {activeTab === 'basic' && (
  <div className="cv-basic-info">
  {/* User Profile Image Display */}
  <div className="cv-form-group">
    <label>Profile Image</label>
    <div className="cv-profile-image-container">
      <img 
        src={currentUser?.profileImage || '/default-avatar.png'} 
        alt="Profile"
        className="cv-profile-image-preview"
        onError={(e) => { e.target.src = '/default-avatar.png' }}
      />
      <p className="cv-image-note">
        Your profile image is used from your main profile. 
        To change it, please update your main profile settings.
      </p>
    </div>
  </div>
            <div className="cv-form-group">
              <label>
                Full Name
                {isPrepopulated('basicInfo.fullName') && <span className="prepopulated-indicator">•</span>}
              </label>
              <input 
                type="text" 
                value={cvProfile.fullName || ''} 
                onChange={(e) => handleInputChange('fullName', e.target.value)}
                placeholder="e.g., Steve Jobs"
              />
            </div>
            
            <div className="cv-form-group">
              <label>
                Headline
                {isPrepopulated('basicInfo.headline') && <span className="prepopulated-indicator">•</span>}
              </label>
              <input 
                type="text" 
                value={cvProfile.headline || cvProfile.basicInfo?.headline || ''} 
                onChange={(e) => handleInputChange('headline', e.target.value)}
                placeholder="e.g., Senior Front-End Developer with 5+ years experience"
                maxLength={150}
              />
              <span className="cv-char-count">{(cvProfile.headline || cvProfile.basicInfo?.headline || '').length}/150</span>
            </div>
            
            <div className="cv-form-group">
              <label>
                Summary
                {isPrepopulated('basicInfo.bio') && <span className="prepopulated-indicator">•</span>}
              </label>
              <textarea 
                value={cvProfile.summary || cvProfile.basicInfo?.bio || ''} 
                onChange={(e) => handleInputChange('summary', e.target.value)}
                placeholder="Write a professional summary highlighting your expertise, experience, and key skills..."
                rows={6}
                maxLength={1000}
              />
              <span className="cv-char-count">{(cvProfile.summary || cvProfile.basicInfo?.bio || '').length}/1000</span>
            </div>
            
            <h3>Contact Information</h3>
            <div className="cv-form-row">
              <div className="cv-form-group">
                <label>
                  Email
                  {isPrepopulated('basicInfo.email') && <span className="prepopulated-indicator">•</span>}
                </label>
                <input 
                  type="email" 
                  value={cvProfile.contact?.email || ''} 
                  onChange={(e) => handleInputChange('contact.email', e.target.value)}
                  placeholder="your.email@example.com"
                />
              </div>
              
              <div className="cv-form-group">
                <label>Phone</label>
                <input 
                  type="tel" 
                  value={cvProfile.contact?.phone || ''} 
                  onChange={(e) => handleInputChange('contact.phone', e.target.value)}
                  placeholder="+44 234 567 890"
                />
              </div>
            </div>
            
            <div className="cv-form-row">
              <div className="cv-form-group">
                <label>Location</label>
                <input 
                  type="text" 
                  value={cvProfile.contact?.location || ''} 
                  onChange={(e) => handleInputChange('contact.location', e.target.value)}
                  placeholder="City, Country"
                />
              </div>
              
              <div className="cv-form-group">
                <label>
                  Website
                  {isPrepopulated('basicInfo.contact.website') && <span className="prepopulated-indicator">•</span>}
                </label>
                <input 
                  type="url" 
                  value={cvProfile.contact?.website || ''} 
                  onChange={(e) => handleInputChange('contact.website', e.target.value)}
                  placeholder="https://yourwebsite.com"
                />
              </div>
            </div>
          </div>
        )}
        
        {/* Work Experience Tab */}
        {activeTab === 'experience' && (
          <div className="cv-experience">
            <h3>
              Work Experience
              {isPrepopulated('experience') && <span className="prepopulated-indicator">•</span>}
            </h3>
            <p className="cv-section-description">Add your professional experience, starting with your most recent position.</p>
            
            {cvProfile.workExperience && cvProfile.workExperience.map((job, index) => (
              <div key={index} className="cv-item-card">
                <div className="cv-item-header">
                  <h4>{job.title || 'Position'} at {job.company || 'Company'}</h4>
                  <div className="cv-item-actions">
                    <button 
                      className="cv-delete-button" 
                      onClick={() => handleRemoveItem('workExperience', index)}
                      title="Remove this entry"
                    >
                      <FontAwesomeIcon icon={faTrash} />
                    </button>
                  </div>
                </div>
                
                <div className="cv-form-row">
                  <div className="cv-form-group">
                    <label>Job Title*</label>
                    <input 
                      type="text" 
                      value={job.title || ''} 
                      onChange={(e) => handleArrayItemChange('workExperience', index, 'title', e.target.value)}
                      placeholder="e.g., Software Engineer"
                      required
                    />
                  </div>
                  
                  <div className="cv-form-group">
                    <label>Company*</label>
                    <input 
                      type="text" 
                      value={job.company || ''} 
                      onChange={(e) => handleArrayItemChange('workExperience', index, 'company', e.target.value)}
                      placeholder="e.g., Tech Company Inc."
                      required
                    />
                  </div>
                </div>
                
                <div className="cv-form-row">
                  <div className="cv-form-group">
                    <label>Location</label>
                    <input 
                      type="text" 
                      value={job.location || ''} 
                      onChange={(e) => handleArrayItemChange('workExperience', index, 'location', e.target.value)}
                      placeholder="e.g., London, UK"
                    />
                  </div>
                </div>
                
                <div className="cv-form-row">
                  <div className="cv-form-group">
                    <label>Start Date</label>
                    <input 
                      type="date" 
                      value={job.startDate ? new Date(job.startDate).toISOString().split('T')[0] : ''} 
                      onChange={(e) => handleArrayItemChange('workExperience', index, 'startDate', e.target.value)}
                    />
                  </div>
                  
                  <div className="cv-form-group">
                    <label>End Date</label>
                    <input 
                      type="date" 
                      value={job.endDate ? new Date(job.endDate).toISOString().split('T')[0] : ''} 
                      onChange={(e) => handleArrayItemChange('workExperience', index, 'endDate', e.target.value)}
                      disabled={job.current}
                    />
                  </div>
                  
                  <div className="cv-form-group checkbox">
                    <input 
                      type="checkbox" 
                      id={`current-job-${index}`}
                      checked={job.current || false} 
                      onChange={(e) => handleArrayItemChange('workExperience', index, 'current', e.target.checked)}
                    />
                    <label htmlFor={`current-job-${index}`}>I currently work here</label>
                  </div>
                </div>
                
                <div className="cv-form-group">
                  <label>Description</label>
                  <textarea 
                    value={job.description || ''} 
                    onChange={(e) => handleArrayItemChange('workExperience', index, 'description', e.target.value)}
                    placeholder="Describe your responsibilities and achievements..."
                    rows={4}
                  />
                </div>
                
                <h5>Highlights</h5>
                <div className="cv-tag-list">
                  {(job.highlights || []).map((highlight, highlightIndex) => (
                    <div key={highlightIndex} className="cv-tag">
                      {highlight}
                      <button 
                        className="cv-tag-remove" 
                        onClick={() => {
                          const updatedHighlights = (job.highlights || []).filter((_, i) => i !== highlightIndex);
                          handleArrayItemChange('workExperience', index, 'highlights', updatedHighlights);
                        }}
                      >
                        &times;
                      </button>
                    </div>
                  ))}
                  <input 
                    type="text" 
                    className="cv-tag-input" 
                    placeholder="Add key achievement..."
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && e.target.value.trim()) {
                        const updatedHighlights = [...(job.highlights || []), e.target.value.trim()];
                        handleArrayItemChange('workExperience', index, 'highlights', updatedHighlights);
                        e.target.value = '';
                      }
                    }}
                  />
                </div>
                
                <h5>Technologies Used</h5>
                <div className="cv-tag-list">
                  {(job.technologies || []).map((tech, techIndex) => (
                    <div key={techIndex} className="cv-tag">
                      {tech}
                      <button 
                        className="cv-tag-remove" 
                        onClick={() => {
                          const updatedTechnologies = (job.technologies || []).filter((_, i) => i !== techIndex);
                          handleArrayItemChange('workExperience', index, 'technologies', updatedTechnologies);
                        }}
                      >
                        &times;
                      </button>
                    </div>
                  ))}
                  <input 
                    type="text" 
                    className="cv-tag-input" 
                    placeholder="Add technology..."
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && e.target.value.trim()) {
                        const updatedTechnologies = [...(job.technologies || []), e.target.value.trim()];
                        handleArrayItemChange('workExperience', index, 'technologies', updatedTechnologies);
                        e.target.value = '';
                      }
                    }}
                  />
                </div>
              </div>
            ))}
            
            <button 
              className="cv-add-item" 
              onClick={() => handleAddItem('workExperience', newWorkExperience)}
            >
              <FontAwesomeIcon icon={faPlus} /> Add Work Experience
            </button>
          </div>
        )}
        
        {/* Education Tab */}
        {activeTab === 'education' && (
          <div className="cv-education">
            <h3>
              Education
              {isPrepopulated('education') && <span className="prepopulated-indicator">•</span>}
            </h3>
            <p className="cv-section-description">Add your educational background, degrees, and certifications.</p>
            
            {cvProfile.education && cvProfile.education.map((edu, index) => (
              <div key={index} className="cv-item-card">
                <div className="cv-item-header">
                  <h4>{edu.degree || 'Degree'} {edu.fieldOfStudy ? `in ${edu.fieldOfStudy}` : ''} at {edu.institution || 'Institution'}</h4>
                  <div className="cv-item-actions">
                    <button 
                      className="cv-delete-button" 
                      onClick={() => handleRemoveItem('education', index)}
                      title="Remove this entry"
                    >
                      <FontAwesomeIcon icon={faTrash} />
                    </button>
                  </div>
                </div>
                
                <div className="cv-form-row">
                  <div className="cv-form-group">
                    <label>Institution*</label>
                    <input 
                      type="text" 
                      value={edu.institution || ''} 
                      onChange={(e) => handleArrayItemChange('education', index, 'institution', e.target.value)}
                      placeholder="e.g., University of Technology"
                      required
                    />
                  </div>
                </div>
                
                <div className="cv-form-row">
                  <div className="cv-form-group">
                    <label>Degree</label>
                    <input 
                      type="text" 
                      value={edu.degree || ''} 
                      onChange={(e) => handleArrayItemChange('education', index, 'degree', e.target.value)}
                      placeholder="e.g., Bachelor of Science"
                    />
                  </div>
                  
                  <div className="cv-form-group">
                    <label>Field of Study</label>
                    <input 
                      type="text" 
                      value={edu.fieldOfStudy || ''} 
                      onChange={(e) => handleArrayItemChange('education', index, 'fieldOfStudy', e.target.value)}
                      placeholder="e.g., Computer Science"
                    />
                  </div>
                </div>
                
                <div className="cv-form-row">
                  <div className="cv-form-group">
                    <label>Start Year</label>
                    <input 
                      type="number" 
                      value={edu.startYear || ''} 
                      onChange={(e) => handleArrayItemChange('education', index, 'startYear', parseInt(e.target.value))}
                      placeholder={new Date().getFullYear()}
                      min="1900"
                      max={new Date().getFullYear()}
                    />
                  </div>
                  
                  <div className="cv-form-group">
                    <label>End Year</label>
                    <input 
                      type="number" 
                      value={edu.endYear || ''} 
                      onChange={(e) => handleArrayItemChange('education', index, 'endYear', parseInt(e.target.value))}
                      placeholder={new Date().getFullYear()}
                      min="1900"
                      max={new Date().getFullYear() + 10}
                      disabled={edu.current}
                    />
                  </div>
                  
                  <div className="cv-form-group checkbox">
                    <input 
                      type="checkbox" 
                      id={`current-edu-${index}`}
                      checked={edu.current || false} 
                      onChange={(e) => handleArrayItemChange('education', index, 'current', e.target.checked)}
                    />
                    <label htmlFor={`current-edu-${index}`}>I currently study here</label>
                  </div>
                </div>
                
                <div className="cv-form-group">
                  <label>Description</label>
                  <textarea 
                    value={edu.description || ''} 
                    onChange={(e) => handleArrayItemChange('education', index, 'description', e.target.value)}
                    placeholder="Describe your studies, research, or academic achievements..."
                    rows={3}
                  />
                </div>
                
                <h5>Achievements</h5>
                <div className="cv-tag-list">
                  {(edu.achievements || []).map((achievement, achievementIndex) => (
                    <div key={achievementIndex} className="cv-tag">
                      {achievement}
                      <button 
                        className="cv-tag-remove" 
                        onClick={() => {
                          const updatedAchievements = (edu.achievements || []).filter((_, i) => i !== achievementIndex);
                          handleArrayItemChange('education', index, 'achievements', updatedAchievements);
                        }}
                      >
                        &times;
                      </button>
                    </div>
                  ))}
                  <input 
                    type="text" 
                    className="cv-tag-input" 
                    placeholder="Add achievement..."
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && e.target.value.trim()) {
                        const updatedAchievements = [...(edu.achievements || []), e.target.value.trim()];
                        handleArrayItemChange('education', index, 'achievements', updatedAchievements);
                        e.target.value = '';
                      }
                    }}
                  />
                </div>
              </div>
            ))}
            
            <button 
              className="cv-add-item" 
              onClick={() => handleAddItem('education', newEducation)}
            >
              <FontAwesomeIcon icon={faPlus} /> Add Education
            </button>
          </div>
        )}
        
        {/* Skills Tab */}
        {activeTab === 'skills' && (
          <div className="cv-skills">
            <h3>Skills & Languages</h3>
            <p className="cv-section-description">Add your technical and professional skills, as well as languages you speak.</p>
            
            <div className="cv-subsection">
              <h4>
                Professional Skills
                {isPrepopulated('skills') && <span className="prepopulated-indicator">•</span>}
              </h4>
              
              {cvProfile.skills && cvProfile.skills.map((skill, index) => (
                <div key={index} className="cv-item-card">
                  <div className="cv-item-header">
                    <h4>{skill.name || 'Skill'}</h4>
                    <div className="cv-item-actions">
                      <button 
                        className="cv-delete-button" 
                        onClick={() => handleRemoveItem('skills', index)}
                        title="Remove this skill"
                      >
                        <FontAwesomeIcon icon={faTrash} />
                      </button>
                    </div>
                  </div>
                  
                  <div className="cv-form-row">
                    <div className="cv-form-group">
                      <label>Skill Name*</label>
                      <input 
                        type="text" 
                        value={skill.name || ''} 
                        onChange={(e) => handleArrayItemChange('skills', index, 'name', e.target.value)}
                        placeholder="e.g., JavaScript"
                        required
                      />
                    </div>
                    
                    <div className="cv-form-group">
                      <label>Proficiency Level</label>
                      <select 
                        value={skill.level || 'Intermediate'} 
                        onChange={(e) => handleArrayItemChange('skills', index, 'level', e.target.value)}
                      >
                        <option value="Beginner">Beginner</option>
                        <option value="Intermediate">Intermediate</option>
                        <option value="Advanced">Advanced</option>
                        <option value="Expert">Expert</option>
                      </select>
                    </div>
                    
                    <div className="cv-form-group">
                      <label>Years of Experience</label>
                      <input 
                        type="number" 
                        value={skill.yearsOfExperience || 0} 
                        onChange={(e) => handleArrayItemChange('skills', index, 'yearsOfExperience', parseInt(e.target.value))}
                        min="0"
                        max="50"
                      />
                    </div>
                  </div>
                </div>
              ))}
              
              <button 
                className="cv-add-item" 
                onClick={() => handleAddItem('skills', newSkill)}
              >
                <FontAwesomeIcon icon={faPlus} /> Add Skill
              </button>
            </div>
            
            <div className="cv-subsection">
              <h4>
                Languages
                {isPrepopulated('languages') && <span className="prepopulated-indicator">•</span>}
              </h4>
              
              {cvProfile.languages && cvProfile.languages.map((language, index) => (
                <div key={index} className="cv-item-card">
                  <div className="cv-item-header">
                    <h4>{language.name || 'Language'}</h4>
                    <div className="cv-item-actions">
                      <button 
                        className="cv-delete-button" 
                        onClick={() => handleRemoveItem('languages', index)}
                        title="Remove this language"
                      >
                        <FontAwesomeIcon icon={faTrash} />
                      </button>
                    </div>
                  </div>
                  
                  <div className="cv-form-row">
                    <div className="cv-form-group">
                      <label>Language Name*</label>
                      <input 
                        type="text" 
                        value={language.name || ''} 
                        onChange={(e) => handleArrayItemChange('languages', index, 'name', e.target.value)}
                        placeholder="e.g., English"
                        required
                      />
                    </div>
                    
                    <div className="cv-form-group">
                      <label>Proficiency</label>
                      <select 
                        value={language.proficiency || 'Professional Working'} 
                        onChange={(e) => handleArrayItemChange('languages', index, 'proficiency', e.target.value)}
                      >
                        <option value="Elementary">Elementary</option>
                        <option value="Limited Working">Limited Working</option>
                        <option value="Professional Working">Professional Working</option>
                        <option value="Full Professional">Full Professional</option>
                        <option value="Native/Bilingual">Native/Bilingual</option>
                      </select>
                    </div>
                  </div>
                </div>
              ))}
              
              <button 
                className="cv-add-item" 
                onClick={() => handleAddItem('languages', newLanguage)}
              >
                <FontAwesomeIcon icon={faPlus} /> Add Language
              </button>
            </div>
          </div>
        )}
        
        {/* Projects Tab */}
        {activeTab === 'projects' && (
          <div className="cv-projects">
            <h3>Projects</h3>
            <p className="cv-section-description">Add your personal or professional projects to showcase your work.</p>
            
            {cvProfile.projects && cvProfile.projects.map((project, index) => (
                <div key={index} className="cv-item-card">
                  <div className="cv-item-header">
                    <h4>{project.title || 'Project'}</h4>
                    <div className="cv-item-actions">
                      <button 
                        className="cv-delete-button" 
                        onClick={() => handleRemoveItem('projects', index)}
                        title="Remove this project"
                      >
                        <FontAwesomeIcon icon={faTrash} />
                      </button>
                    </div>
                  </div>
                  
                  <div className="cv-form-row">
                    <div className="cv-form-group">
                      <label>Project Title*</label>
                      <input 
                        type="text" 
                        value={project.title || ''} 
                        onChange={(e) => handleArrayItemChange('projects', index, 'title', e.target.value)}
                        placeholder="e.g., E-commerce Website"
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="cv-form-row">
                    <div className="cv-form-group">
                      <label>Start Date</label>
                      <input 
                        type="date" 
                        value={project.startDate ? new Date(project.startDate).toISOString().split('T')[0] : ''} 
                        onChange={(e) => handleArrayItemChange('projects', index, 'startDate', e.target.value)}
                      />
                    </div>
                    
                    <div className="cv-form-group">
                      <label>End Date</label>
                      <input 
                        type="date" 
                        value={project.endDate ? new Date(project.endDate).toISOString().split('T')[0] : ''} 
                        onChange={(e) => handleArrayItemChange('projects', index, 'endDate', e.target.value)}
                        disabled={project.current}
                      />
                    </div>
                    
                    <div className="cv-form-group checkbox">
                      <input 
                        type="checkbox" 
                        id={`current-project-${index}`}
                        checked={project.current || false} 
                        onChange={(e) => handleArrayItemChange('projects', index, 'current', e.target.checked)}
                      />
                      <label htmlFor={`current-project-${index}`}>Ongoing project</label>
                    </div>
                  </div>
                  
                  <div className="cv-form-group">
                    <label>Description</label>
                    <textarea 
                      value={project.description || ''} 
                      onChange={(e) => handleArrayItemChange('projects', index, 'description', e.target.value)}
                      placeholder="Describe the project, its purpose, and your role..."
                      rows={4}
                    />
                  </div>
                  
                  <div className="cv-form-row">
                    <div className="cv-form-group">
                      <label>Project URL</label>
                      <input 
                        type="url" 
                        value={project.url || ''} 
                        onChange={(e) => handleArrayItemChange('projects', index, 'url', e.target.value)}
                        placeholder="https://example.com"
                      />
                    </div>
                    
                    <div className="cv-form-group">
                      <label>Repository URL</label>
                      <input 
                        type="url" 
                        value={project.repositoryUrl || ''} 
                        onChange={(e) => handleArrayItemChange('projects', index, 'repositoryUrl', e.target.value)}
                        placeholder="https://github.com/username/repo"
                      />
                    </div>
                  </div>
                  
                  <h5>Key Features</h5>
                  <div className="cv-tag-list">
                    {(project.highlights || []).map((highlight, highlightIndex) => (
                      <div key={highlightIndex} className="cv-tag">
                        {highlight}
                        <button 
                          className="cv-tag-remove" 
                          onClick={() => {
                            const updatedHighlights = (project.highlights || []).filter((_, i) => i !== highlightIndex);
                            handleArrayItemChange('projects', index, 'highlights', updatedHighlights);
                          }}
                        >
                          &times;
                        </button>
                      </div>
                    ))}
                    <input 
                      type="text" 
                      className="cv-tag-input" 
                      placeholder="Add feature..."
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && e.target.value.trim()) {
                          const updatedHighlights = [...(project.highlights || []), e.target.value.trim()];
                          handleArrayItemChange('projects', index, 'highlights', updatedHighlights);
                          e.target.value = '';
                        }
                      }}
                    />
                  </div>
                  
                  <h5>Technologies Used</h5>
                  <div className="cv-tag-list">
                    {(project.technologies || []).map((tech, techIndex) => (
                      <div key={techIndex} className="cv-tag">
                        {tech}
                        <button 
                          className="cv-tag-remove" 
                          onClick={() => {
                            const updatedTechnologies = (project.technologies || []).filter((_, i) => i !== techIndex);
                            handleArrayItemChange('projects', index, 'technologies', updatedTechnologies);
                          }}
                        >
                          &times;
                        </button>
                      </div>
                    ))}
                    <input 
                      type="text" 
                      className="cv-tag-input" 
                      placeholder="Add technology..."
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && e.target.value.trim()) {
                          const updatedTechnologies = [...(project.technologies || []), e.target.value.trim()];
                          handleArrayItemChange('projects', index, 'technologies', updatedTechnologies);
                          e.target.value = '';
                        }
                      }}
                    />
                  </div>
                </div>
              ))}
              
              <button 
                className="cv-add-item" 
                onClick={() => handleAddItem('projects', newProject)}
              >
                <FontAwesomeIcon icon={faPlus} /> Add Project
              </button>
          </div>
        )}
        
        {/* Other Tab (Certifications & Publications) */}
        {activeTab === 'other' && (
          <div className="cv-other">
            <h3>Certifications & Publications</h3>
            <p className="cv-section-description">Add your professional certifications and publications to showcase your expertise.</p>
            
            <div className="cv-subsection">
              <h4>Certifications</h4>
              
              {cvProfile.certifications && cvProfile.certifications.map((cert, index) => (
                <div key={index} className="cv-item-card">
                  <div className="cv-item-header">
                    <h4>{cert.name || 'Certification'}</h4>
                    <div className="cv-item-actions">
                      <button 
                        className="cv-delete-button" 
                        onClick={() => handleRemoveItem('certifications', index)}
                        title="Remove this certification"
                      >
                        <FontAwesomeIcon icon={faTrash} />
                      </button>
                    </div>
                  </div>
                  
                  <div className="cv-form-row">
                    <div className="cv-form-group">
                      <label>Certification Name*</label>
                      <input 
                        type="text" 
                        value={cert.name || ''} 
                        onChange={(e) => handleArrayItemChange('certifications', index, 'name', e.target.value)}
                        placeholder="e.g., AWS Certified Solutions Architect"
                        required
                      />
                    </div>
                    
                    <div className="cv-form-group">
                      <label>Issuing Organization</label>
                      <input 
                        type="text" 
                        value={cert.issuer || ''} 
                        onChange={(e) => handleArrayItemChange('certifications', index, 'issuer', e.target.value)}
                        placeholder="e.g., Amazon Web Services"
                      />
                    </div>
                  </div>
                  
                  <div className="cv-form-row">
                    <div className="cv-form-group">
                      <label>Issue Date</label>
                      <input 
                        type="date" 
                        value={cert.date ? new Date(cert.date).toISOString().split('T')[0] : ''} 
                        onChange={(e) => handleArrayItemChange('certifications', index, 'date', e.target.value)}
                      />
                    </div>
                    
                    <div className="cv-form-group checkbox">
                      <input 
                        type="checkbox" 
                        id={`cert-has-expiry-${index}`}
                        checked={cert.hasExpiry || false} 
                        onChange={(e) => handleArrayItemChange('certifications', index, 'hasExpiry', e.target.checked)}
                      />
                      <label htmlFor={`cert-has-expiry-${index}`}>Has expiration date</label>
                    </div>
                    
                    {cert.hasExpiry && (
                      <div className="cv-form-group">
                        <label>Expiry Date</label>
                        <input 
                          type="date" 
                          value={cert.expires ? new Date(cert.expires).toISOString().split('T')[0] : ''} 
                          onChange={(e) => handleArrayItemChange('certifications', index, 'expires', e.target.value)}
                        />
                      </div>
                    )}
                  </div>
                  
                  <div className="cv-form-row">
                    <div className="cv-form-group">
                      <label>Credential ID</label>
                      <input 
                        type="text" 
                        value={cert.credentialId || ''} 
                        onChange={(e) => handleArrayItemChange('certifications', index, 'credentialId', e.target.value)}
                        placeholder="e.g., AWS-ASA-12345"
                      />
                    </div>
                    
                    <div className="cv-form-group">
                      <label>Credential URL</label>
                      <input 
                        type="url" 
                        value={cert.credentialURL || ''} 
                        onChange={(e) => handleArrayItemChange('certifications', index, 'credentialURL', e.target.value)}
                        placeholder="https://verify.example.com/cert/12345"
                      />
                    </div>
                  </div>
                </div>
              ))}
              
              <button 
                className="cv-add-item" 
                onClick={() => handleAddItem('certifications', newCertification)}
              >
                <FontAwesomeIcon icon={faPlus} /> Add Certification
              </button>
            </div>
            
            <div className="cv-subsection">
              <h4>Publications</h4>
              
              {cvProfile.publications && cvProfile.publications.map((pub, index) => (
                <div key={index} className="cv-item-card">
                  <div className="cv-item-header">
                    <h4>{pub.title || 'Publication'}</h4>
                    <div className="cv-item-actions">
                      <button 
                        className="cv-delete-button" 
                        onClick={() => handleRemoveItem('publications', index)}
                        title="Remove this publication"
                      >
                        <FontAwesomeIcon icon={faTrash} />
                      </button>
                    </div>
                  </div>
                  
                  <div className="cv-form-row">
                    <div className="cv-form-group">
                      <label>Publication Title*</label>
                      <input 
                        type="text" 
                        value={pub.title || ''} 
                        onChange={(e) => handleArrayItemChange('publications', index, 'title', e.target.value)}
                        placeholder="e.g., Advanced Techniques in Web Development"
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="cv-form-row">
                    <div className="cv-form-group">
                      <label>Publisher</label>
                      <input 
                        type="text" 
                        value={pub.publisher || ''} 
                        onChange={(e) => handleArrayItemChange('publications', index, 'publisher', e.target.value)}
                        placeholder="e.g., Tech Journal"
                      />
                    </div>
                    
                    <div className="cv-form-group">
                      <label>Publication Date</label>
                      <input 
                        type="date" 
                        value={pub.date ? new Date(pub.date).toISOString().split('T')[0] : ''} 
                        onChange={(e) => handleArrayItemChange('publications', index, 'date', e.target.value)}
                      />
                    </div>
                  </div>
                  
                  <div className="cv-form-group">
                    <label>Description</label>
                    <textarea 
                      value={pub.description || ''} 
                      onChange={(e) => handleArrayItemChange('publications', index, 'description', e.target.value)}
                      placeholder="Brief description of the publication and its impact..."
                      rows={3}
                    />
                  </div>
                  
                  <div className="cv-form-group">
                    <label>URL</label>
                    <input 
                      type="url" 
                      value={pub.url || ''} 
                      onChange={(e) => handleArrayItemChange('publications', index, 'url', e.target.value)}
                      placeholder="https://journal.example.com/article/12345"
                    />
                  </div>
                </div>
              ))}
              
              <button 
                className="cv-add-item" 
                onClick={() => handleAddItem('publications', newPublication)}
              >
                <FontAwesomeIcon icon={faPlus} /> Add Publication
              </button>
            </div>
          </div>
        )}
        
        {/* Display Options Tab */}
        {activeTab === 'display' && (
          <div className="cv-display">
            <h3>Display & Customization</h3>
            <p className="cv-section-description">Customize how your CV is displayed to others.</p>
            
            {/* Theme Settings */}
            <div className="cv-subsection">
              <h4>Theme Settings</h4>
              
              <div className="cv-form-row">
                <div className="cv-form-group">
                  <label>Primary Color</label>
                  <input 
                    type="color" 
                    value={cvProfile.theme?.primaryColor || '#4e54c8'} 
                    onChange={(e) => handleInputChange('theme.primaryColor', e.target.value)}
                    className="cv-color-picker"
                  />
                </div>
                
                <div className="cv-form-group">
                  <label>Secondary Color</label>
                  <input 
                    type="color" 
                    value={cvProfile.theme?.secondaryColor || '#8f94fb'} 
                    onChange={(e) => handleInputChange('theme.secondaryColor', e.target.value)}
                    className="cv-color-picker"
                  />
                </div>
              </div>
              
              <div className="cv-form-group">
                <label>Font Family</label>
                <select 
                  value={cvProfile.theme?.fontFamily || 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif'} 
                  onChange={(e) => handleInputChange('theme.fontFamily', e.target.value)}
                >
                  <option value="Segoe UI, Tahoma, Geneva, Verdana, sans-serif">Segoe UI (Default)</option>
                  <option value="Arial, sans-serif">Arial</option>
                  <option value="Helvetica, Arial, sans-serif">Helvetica</option>
                  <option value="Georgia, serif">Georgia</option>
                  <option value="'Times New Roman', Times, serif">Times New Roman</option>
                  <option value="'Courier New', Courier, monospace">Courier New</option>
                  <option value="'Open Sans', sans-serif">Open Sans</option>
                  <option value="'Roboto', sans-serif">Roboto</option>
                  <option value="'Montserrat', sans-serif">Montserrat</option>
                </select>
              </div>
              
              <div className="cv-form-group">
                <label>Layout Style</label>
                <select 
                  value={cvProfile.theme?.layout || 'standard'} 
                  onChange={(e) => handleInputChange('theme.layout', e.target.value)}
                >
                  <option value="standard">Standard</option>
                  <option value="modern">Modern</option>
                  <option value="creative">Creative</option>
                  <option value="minimal">Minimal</option>
                </select>
              </div>
            </div>
            
            {/* Display Options */}
            <div className="cv-subsection">
              <h4>Display Options</h4>
              
              <div className="cv-form-group checkbox">
                <input 
                  type="checkbox" 
                  id="show-profile-image"
                  checked={cvProfile.displayOptions?.showProfileImage !== false} 
                  onChange={(e) => handleInputChange('displayOptions.showProfileImage', e.target.checked)}
                />
                <label htmlFor="show-profile-image">Show profile image</label>
              </div>
              
              <div className="cv-form-group checkbox">
                <input 
                  type="checkbox" 
                  id="show-contact"
                  checked={cvProfile.displayOptions?.showContact !== false} 
                  onChange={(e) => handleInputChange('displayOptions.showContact', e.target.checked)}
                />
                <label htmlFor="show-contact">Show contact information</label>
              </div>
              
              <h5>Hidden Sections</h5>
              <p className="cv-note">Select which sections to hide from your public CV:</p>
              
              <div className="cv-hidden-sections">
                {['summary', 'workExperience', 'education', 'skills', 'projects', 'certifications', 'languages', 'publications'].map((section) => (
                  <div key={section} className="cv-form-group checkbox">
                    <input 
                      type="checkbox" 
                      id={`hide-${section}`}
                      checked={(cvProfile.displayOptions?.hiddenSections || []).includes(section)} 
                      onChange={(e) => {
                        let updatedHiddenSections;
                        if (e.target.checked) {
                          updatedHiddenSections = [...(cvProfile.displayOptions?.hiddenSections || []), section];
                        } else {
                          updatedHiddenSections = (cvProfile.displayOptions?.hiddenSections || []).filter(s => s !== section);
                        }
                        
                        handleInputChange('displayOptions.hiddenSections', updatedHiddenSections);
                      }}
                    />
                    <label htmlFor={`hide-${section}`}>
                      {section.charAt(0).toUpperCase() + section.slice(1).replace(/([A-Z])/g, ' £1')}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
        )}
      </div>
      
      <div className="cv-editor-footer">
        <button 
          className="cv-save-button" 
          onClick={handleSave} 
          disabled={isSaving || !unsavedChanges}
        >
          <FontAwesomeIcon icon={faSave} /> {isSaving ? 'Saving...' : 'Save CV Profile'}
        </button>
        <button 
          className="cv-cancel-button" 
          onClick={handleCancel} 
          disabled={isSaving}
        >
          <FontAwesomeIcon icon={faTimes} /> Cancel
        </button>
        {unsavedChanges && (
          <button 
            className="cv-reset-button" 
            onClick={handleReset} 
            disabled={isSaving}
          >
            <FontAwesomeIcon icon={faUndo} /> Reset
          </button>
        )}
      </div>

          {/* Notification Component */}
    {notification.show && (
      <ProfileNotification
        message={notification.message}
        primaryColor={cvProfile.theme?.primaryColor || '#4e54c8'}
        secondaryColor={cvProfile.theme?.secondaryColor || '#8f94fb'}
        onClose={() => setNotification({ ...notification, show: false })}
      />
    )}
    </div>
  );
  
};

export default CVProfileEditor;