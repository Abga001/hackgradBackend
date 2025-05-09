//Component for editing user profiles
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const ProfileEdit = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [profileImage, setProfileImage] = useState('');
  
  // State for user profile data
  const [profileData, setProfileData] = useState({
    username: '',
    fullName: '',
    email: '',
    bio: '',
    skills: [],
    areaOfExpertise: '',
    education: [],
    experience: [],
    favoriteLanguages: [],
    github: '',
    linkedin: '',
    portfolio: ''
  });

  // Fetch user profile data
  useEffect(() => {
    const fetchProfileData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/login');
          return;
        }
        
        const response = await axios.get('http://localhost:3000/api/user/profile', {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        // Format education and experience dates for form inputs if needed
        const userData = response.data;
        
        if (userData.education) {
          userData.education = userData.education.map(edu => ({
            ...edu,
            startYear: edu.startYear || '',
            endYear: edu.endYear || ''
          }));
        } else {
          userData.education = [];
        }
        
        if (userData.experience) {
          userData.experience = userData.experience.map(exp => ({
            ...exp,
            startDate: exp.startDate ? new Date(exp.startDate).toISOString().split('T')[0] : '',
            endDate: exp.endDate ? new Date(exp.endDate).toISOString().split('T')[0] : ''
          }));
        } else {
          userData.experience = [];
        }
        
        // Converts skills and languages arrays to strings for easier editing
        setProfileData({
          ...userData,
          skills: userData.skills ? userData.skills.join(', ') : '',
          favoriteLanguages: userData.favoriteLanguages ? userData.favoriteLanguages.join(', ') : ''
        });
        
        if (userData.profileImage) {
          setProfileImage(userData.profileImage);
        }
        
      } catch (err) {
        console.error('Error fetching profile:', err);
        
        if (err.response && err.response.status === 401) {
          setError('Authentication expired. Please log in again.');
          setTimeout(() => navigate('/login'), 2000);
        } else {
          setError('Failed to load profile data. Please try again.');
        }
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchProfileData();
  }, [navigate]);

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfileData(prev => ({ ...prev, [name]: value }));
  };
  
  // Handle changes to education fields
  const handleEducationChange = (index, field, value) => {
    const updatedEducation = [...profileData.education];
    updatedEducation[index] = { ...updatedEducation[index], [field]: value };
    setProfileData(prev => ({ ...prev, education: updatedEducation }));
  };
  
  // Add new education entry
  const addEducation = () => {
    setProfileData(prev => ({
      ...prev,
      education: [
        ...prev.education, 
        { institution: '', degree: '', fieldOfStudy: '', startYear: '', endYear: '' }
      ]
    }));
  };
  
  // Remove education entry
  const removeEducation = (index) => {
    const updatedEducation = [...profileData.education];
    updatedEducation.splice(index, 1);
    setProfileData(prev => ({ ...prev, education: updatedEducation }));
  };
  
  // Handle changes to experience fields
  const handleExperienceChange = (index, field, value) => {
    const updatedExperience = [...profileData.experience];
    updatedExperience[index] = { ...updatedExperience[index], [field]: value };
    setProfileData(prev => ({ ...prev, experience: updatedExperience }));
  };
  
  // Add new experience entry
  const addExperience = () => {
    setProfileData(prev => ({
      ...prev,
      experience: [
        ...prev.experience, 
        { company: '', position: '', startDate: '', endDate: '', description: '' }
      ]
    }));
  };
  
  // Remove experience entry
  const removeExperience = (index) => {
    const updatedExperience = [...profileData.experience];
    updatedExperience.splice(index, 1);
    setProfileData(prev => ({ ...prev, experience: updatedExperience }));
  };

  // To resize and compress images
const resizeImage = (file, maxWidth = 800, maxHeight = 800, quality = 0.7) => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        // Create canvas
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        
        // Calculate new dimensions
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        
        // Draw image on canvas and compress
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        
        resolve(dataUrl);
      };
    };
  });
};
  
  // Handle profile image upload
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      // Define max size (5MB = 5 * 1024 * 1024 bytes)
      const maxSize = 5 * 1024 * 1024;
      
      // Check file size
      if (file.size > maxSize) {
        setError(`Profile image is too large (${(file.size / 1024 / 1024).toFixed(2)}MB). Maximum size allowed is 5MB.`);
        return;
      }
      
      try {
        // Resize and compress the image
        const resizedImage = await resizeImage(file);
        setProfileImage(resizedImage);
        
        // Log the size of the compressed image (for debugging) MAY REMOVE LATER
        const sizeInBytes = Math.ceil((resizedImage.length * 3) / 4);
        console.log(`Compressed image size: ${(sizeInBytes / 1024 / 1024).toFixed(2)}MB`);
      } catch (err) {
        setError("Failed to process image. Please try a different image.");
      }
    }
  };
  
  // Handle removing profile image
  const handleRemoveImage = () => {
    setProfileImage(''); // Set to empty string to remove the image
    setSuccess('Profile image removed. Save changes to update your profile.');
  };
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }
      
      // Format data for submission
      const formattedData = {
        ...profileData,
        skills: profileData.skills ? 
          (typeof profileData.skills === 'string' ? 
            profileData.skills.split(',').map(skill => skill.trim()) : 
            profileData.skills) : 
          [],
        favoriteLanguages: profileData.favoriteLanguages ? 
          (typeof profileData.favoriteLanguages === 'string' ? 
            profileData.favoriteLanguages.split(',').map(lang => lang.trim()) : 
            profileData.favoriteLanguages) : 
          [],
        profileImage: profileImage
      };
      
      console.log("Sending profile update:", formattedData);
      
      try {
        const response = await axios.put('http://localhost:3000/api/user/profile', formattedData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        setSuccess('Profile updated successfully!');
        console.log("Profile update successful:", response.data);
        
        // Scroll to top to show success message
        window.scrollTo(0, 0);
        
        // Navigate to profile view after a delay
        setTimeout(() => {
          navigate('/profile');
        }, 2000);
        
      } catch (err) {
        console.error('Error response:', err.response);
        
        // Handle specific error cases
        if (err.response) {
          // The request was made and the server responded with a status code
          // that falls out of the range of 2xx
          if (err.response.status === 400 && err.response.data.errors) {
            // Validation errors
            const errorDetails = err.response.data.errors.join(', ');
            setError(`Validation errors: ${errorDetails}`);
          } else if (err.response.status === 401) {
            setError('Authentication expired. Please log in again.');
            setTimeout(() => navigate('/login'), 2000);
          } else if (err.response.status === 413) {
            setError('Profile image is too large. Please use a smaller image.');
          } else {
            setError(err.response.data.message || 'Failed to update profile. Server rejected the request.');
          }
        } else if (err.request) {
          // The request was made but no response was received
          setError('Network error. Please check your internet connection and try again.');
        } else {
          // Something happened in setting up the request
          setError(`Error: ${err.message}`);
        }
        
        // Scroll to top to show error message
        window.scrollTo(0, 0);
      }
    } catch (err) {
      console.error('Local error in form submission:', err);
      setError(`Unexpected error: ${err.message}`);
      window.scrollTo(0, 0);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Simple URL validation
  const isValidUrl = (url) => {
    if (!url) return true; // Empty URLs are valid (optional fields)
    try {
      new URL(url);
      return true;
    } catch (_) {
      return false;
    }
  };

  // Client-side validation before submission
  const validateForm = () => {
    const errors = [];
    
    // Check image size
    if (profileImage && profileImage.length > 5 * 1024 * 1024) {
      errors.push(`Profile image is too large. Maximum size allowed is 5MB. Please resize your image or choose a smaller one.`);
    }
    
    // Validate URLs
    if (profileData.github && !isValidUrl(profileData.github)) {
      errors.push("GitHub URL is not valid");
    }
    if (profileData.linkedin && !isValidUrl(profileData.linkedin)) {
      errors.push("LinkedIn URL is not valid");
    }
    if (profileData.portfolio && !isValidUrl(profileData.portfolio)) {
      errors.push("Portfolio URL is not valid");
    }
    
    // Validate education years
    profileData.education.forEach((edu, index) => {
      if (edu.startYear && edu.endYear && parseInt(edu.startYear) > parseInt(edu.endYear)) {
        errors.push(`Education #${index + 1}: End year must be after start year`);
      }
    });
    
    // Validate experience dates
    profileData.experience.forEach((exp, index) => {
      if (exp.startDate && exp.endDate && new Date(exp.startDate) > new Date(exp.endDate)) {
        errors.push(`Experience #${index + 1}: End date must be after start date`);
      }
    });
    
    return errors;
  };

  if (isLoading) {
    return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '300px' }}>Loading profile data...</div>;
  }

  return (
    <div style={{ maxWidth: '800px', margin: '30px auto', backgroundColor: 'white', borderRadius: '10px', boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)', padding: '30px' }}>
      <h2 style={{ fontSize: '1.8rem', color: '#333', marginBottom: '20px' }}>Edit Your Profile</h2>
      
      {error && (
        <div style={{ backgroundColor: '#f8d7da', color: '#721c24', padding: '15px', borderRadius: '4px', marginBottom: '20px' }}>
          {error}
        </div>
      )}
      
      {success && (
        <div style={{ backgroundColor: '#d4edda', color: '#155724', padding: '15px', borderRadius: '4px', marginBottom: '20px' }}>
          {success}
        </div>
      )}
      
      <form onSubmit={(e) => {
        const errors = validateForm();
        if (errors.length > 0) {
          e.preventDefault();
          setError(errors.join('; '));
          window.scrollTo(0, 0);
        } else {
          handleSubmit(e);
        }
      }}>
        {/* Basic Information Section */}
        <section style={{ marginBottom: '30px', borderBottom: '1px solid #eee', paddingBottom: '20px' }}>
          <h3 style={{ fontSize: '1.3rem', color: '#333', marginBottom: '15px' }}>Basic Information</h3>
          
          <div style={{ marginBottom: '20px' }}>
  <div style={{ width: '150px', height: '150px', marginBottom: '15px', position: 'relative', margin: '0 auto' }}>
    {profileImage ? (
      <img 
        src={profileImage} 
        alt="Profile" 
        style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} 
      />
    ) : (
      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f1f1f1', borderRadius: '50%', fontSize: '50px', color: '#ccc' }}>
        👤
      </div>
    )}
  </div>
  <div style={{ textAlign: 'center', display: 'flex', justifyContent: 'center', gap: '10px' }}>
    <label 
      htmlFor="profileImageUpload" 
      style={{ display: 'inline-block', padding: '8px 16px', backgroundColor: '#f1f1f1', color: '#333', borderRadius: '4px', cursor: 'pointer' }}
    >
      Change Profile Picture
    </label>
    <input
      type="file"
      id="profileImageUpload"
      accept="image/*"
      onChange={handleImageUpload}
      style={{ display: 'none' }}
    />
    {profileImage && (
      <button
        type="button"
        onClick={handleRemoveImage}
        style={{ padding: '8px 16px', backgroundColor: '#f8d7da', color: '#721c24', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
      >
        Remove Picture
      </button>
    )}
  </div>
</div>
          
          <div style={{ display: 'flex', gap: '20px', marginBottom: '15px' }}>
            <div style={{ flex: 1 }}>
              <label htmlFor="username" style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Username</label>
              <input
                type="text"
                id="username"
                name="username"
                value={profileData.username}
                onChange={handleChange}
                required
                disabled
                style={{ width: '100%', padding: '12px 15px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '1rem' }}
              />
              <small style={{ display: 'block', color: '#666', marginTop: '5px' }}>Username cannot be changed</small>
            </div>
            
            <div style={{ flex: 1 }}>
              <label htmlFor="fullName" style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Full Name</label>
              <input
                type="text"
                id="fullName"
                name="fullName"
                value={profileData.fullName || ''}
                onChange={handleChange}
                style={{ width: '100%', padding: '12px 15px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '1rem' }}
              />
            </div>
          </div>
          
          <div style={{ marginBottom: '15px' }}>
            <label htmlFor="email" style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={profileData.email}
              onChange={handleChange}
              required
              disabled
              style={{ width: '100%', padding: '12px 15px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '1rem' }}
            />
            <small style={{ display: 'block', color: '#666', marginTop: '5px' }}>Email cannot be changed</small>
          </div>
          
          <div style={{ marginBottom: '15px' }}>
            <label htmlFor="bio" style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Bio</label>
            <textarea
              id="bio"
              name="bio"
              value={profileData.bio || ''}
              onChange={handleChange}
              rows="4"
              maxLength="500"
              placeholder="Tell others about yourself..."
              style={{ width: '100%', padding: '12px 15px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '1rem', resize: 'vertical' }}
            />
            <small style={{ display: 'block', color: '#666', marginTop: '5px' }}>{(profileData.bio || '').length}/500 characters</small>
          </div>
        </section>
        
        {/* Skills & Expertise Section */}
        <section style={{ marginBottom: '30px', borderBottom: '1px solid #eee', paddingBottom: '20px' }}>
          <h3 style={{ fontSize: '1.3rem', color: '#333', marginBottom: '15px' }}>Skills & Expertise</h3>
          
          <div style={{ marginBottom: '15px' }}>
            <label htmlFor="skills" style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Skills (comma separated)</label>
            <input
              type="text"
              id="skills"
              name="skills"
              value={profileData.skills || ''}
              onChange={handleChange}
              placeholder="E.g., React, Node.js, UI Design"
              style={{ width: '100%', padding: '12px 15px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '1rem' }}
            />
          </div>
          
          <div style={{ marginBottom: '15px' }}>
            <label htmlFor="areaOfExpertise" style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Area of Expertise</label>
            <input
              type="text"
              id="areaOfExpertise"
              name="areaOfExpertise"
              value={profileData.areaOfExpertise || ''}
              onChange={handleChange}
              placeholder="E.g., Frontend Development"
              style={{ width: '100%', padding: '12px 15px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '1rem' }}
            />
          </div>
          
          <div style={{ marginBottom: '15px' }}>
            <label htmlFor="favoriteLanguages" style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Favorite Programming Languages (comma separated)</label>
            <input
              type="text"
              id="favoriteLanguages"
              name="favoriteLanguages"
              value={profileData.favoriteLanguages || ''}
              onChange={handleChange}
              placeholder="E.g., JavaScript, Python, Java"
              style={{ width: '100%', padding: '12px 15px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '1rem' }}
            />
          </div>
        </section>
        
        {/* Education Section */}
        <section style={{ marginBottom: '30px', borderBottom: '1px solid #eee', paddingBottom: '20px' }}>
          <h3 style={{ fontSize: '1.3rem', color: '#333', marginBottom: '15px' }}>Education</h3>
          
          {profileData.education.map((edu, index) => (
            <div key={index} style={{ backgroundColor: '#f9f9f9', padding: '20px', borderRadius: '8px', marginBottom: '20px' }}>
              <h4 style={{ marginBottom: '15px' }}>Education #{index + 1}</h4>
              
              <div style={{ display: 'flex', gap: '20px', marginBottom: '15px' }}>
                <div style={{ flex: 1 }}>
                  <label htmlFor={`institution-${index}`} style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Institution</label>
                  <input
                    type="text"
                    id={`institution-${index}`}
                    value={edu.institution || ''}
                    onChange={(e) => handleEducationChange(index, 'institution', e.target.value)}
                    placeholder="E.g., University of California"
                    style={{ width: '100%', padding: '12px 15px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '1rem' }}
                  />
                </div>
                
                <div style={{ flex: 1 }}>
                  <label htmlFor={`degree-${index}`} style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Degree</label>
                  <input
                    type="text"
                    id={`degree-${index}`}
                    value={edu.degree || ''}
                    onChange={(e) => handleEducationChange(index, 'degree', e.target.value)}
                    placeholder="E.g., Bachelor of Science"
                    style={{ width: '100%', padding: '12px 15px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '1rem' }}
                  />
                </div>
              </div>
              
              <div style={{ display: 'flex', gap: '20px', marginBottom: '15px' }}>
                <div style={{ flex: 1 }}>
                  <label htmlFor={`fieldOfStudy-${index}`} style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Field of Study</label>
                  <input
                    type="text"
                    id={`fieldOfStudy-${index}`}
                    value={edu.fieldOfStudy || ''}
                    onChange={(e) => handleEducationChange(index, 'fieldOfStudy', e.target.value)}
                    placeholder="E.g., Computer Science"
                    style={{ width: '100%', padding: '12px 15px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '1rem' }}
                  />
                </div>
                
                <div style={{ flex: 1 }}>
                  <label htmlFor={`startYear-${index}`} style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Start Year</label>
                  <input
                    type="number"
                    id={`startYear-${index}`}
                    value={edu.startYear || ''}
                    onChange={(e) => handleEducationChange(index, 'startYear', e.target.value)}
                    min="1900"
                    max={new Date().getFullYear() + 10}
                    style={{ width: '100%', padding: '12px 15px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '1rem' }}
                  />
                </div>
                
                <div style={{ flex: 1 }}>
                  <label htmlFor={`endYear-${index}`} style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>End Year (or expected)</label>
                  <input
                    type="number"
                    id={`endYear-${index}`}
                    value={edu.endYear || ''}
                    onChange={(e) => handleEducationChange(index, 'endYear', e.target.value)}
                    min="1900"
                    max={new Date().getFullYear() + 10}
                    placeholder="Leave blank if studying"
                    style={{ width: '100%', padding: '12px 15px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '1rem' }}
                  />
                </div>
              </div>
              
              <button 
                type="button" 
                onClick={() => removeEducation(index)}
                style={{ backgroundColor: '#e74c3c', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer' }}
              >
                Remove Education
              </button>
            </div>
          ))}
          
          <button 
            type="button" 
            onClick={addEducation}
            style={{ backgroundColor: '#f1f1f1', color: '#333', border: 'none', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer' }}
          >
            Add Education
          </button>
        </section>
        
        {/* Experience Section */}
        <section style={{ marginBottom: '30px', borderBottom: '1px solid #eee', paddingBottom: '20px' }}>
          <h3 style={{ fontSize: '1.3rem', color: '#333', marginBottom: '15px' }}>Experience</h3>
          
          {profileData.experience.map((exp, index) => (
            <div key={index} style={{ backgroundColor: '#f9f9f9', padding: '20px', borderRadius: '8px', marginBottom: '20px' }}>
              <h4 style={{ marginBottom: '15px' }}>Experience #{index + 1}</h4>
              
              <div style={{ display: 'flex', gap: '20px', marginBottom: '15px' }}>
                <div style={{ flex: 1 }}>
                  <label htmlFor={`company-${index}`} style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Company</label>
                  <input
                    type="text"
                    id={`company-${index}`}
                    value={exp.company || ''}
                    onChange={(e) => handleExperienceChange(index, 'company', e.target.value)}
                    placeholder="E.g., Google"
                    style={{ width: '100%', padding: '12px 15px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '1rem' }}
                  />
                </div>
                
                <div style={{ flex: 1 }}>
                  <label htmlFor={`position-${index}`} style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Position</label>
                  <input
                    type="text"
                    id={`position-${index}`}
                    value={exp.position || ''}
                    onChange={(e) => handleExperienceChange(index, 'position', e.target.value)}
                    placeholder="E.g., Software Engineer"
                    style={{ width: '100%', padding: '12px 15px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '1rem' }}
                  />
                </div>
              </div>
              
              <div style={{ display: 'flex', gap: '20px', marginBottom: '15px' }}>
                <div style={{ flex: 1 }}>
                  <label htmlFor={`startDate-${index}`} style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Start Date</label>
                  <input
                    type="date"
                    id={`startDate-${index}`}
                    value={exp.startDate || ''}
                    onChange={(e) => handleExperienceChange(index, 'startDate', e.target.value)}
                    style={{ width: '100%', padding: '12px 15px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '1rem' }}
                  />
                </div>
                
                <div style={{ flex: 1 }}>
                  <label htmlFor={`endDate-${index}`} style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>End Date</label>
                  <input
                    type="date"
                    id={`endDate-${index}`}
                    value={exp.endDate || ''}
                    onChange={(e) => handleExperienceChange(index, 'endDate', e.target.value)}
                    style={{ width: '100%', padding: '12px 15px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '1rem' }}
                  />
                  <small style={{ display: 'block', color: '#666', marginTop: '5px' }}>Leave blank if currently working here</small>
                </div>
              </div>
              
              <div style={{ marginBottom: '15px' }}>
                <label htmlFor={`description-${index}`} style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Description</label>
                <textarea
                  id={`description-${index}`}
                  value={exp.description || ''}
                  onChange={(e) => handleExperienceChange(index, 'description', e.target.value)}
                  rows="3"
                  placeholder="Describe your responsibilities and achievements"
                  style={{ width: '100%', padding: '12px 15px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '1rem', resize: 'vertical' }}
                />
              </div>
              
              <button 
                type="button" 
                onClick={() => removeExperience(index)}
                style={{ backgroundColor: '#e74c3c', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer' }}
              >
                Remove Experience
              </button>
            </div>
          ))}
          
          <button 
            type="button" 
            onClick={addExperience}
            style={{ backgroundColor: '#f1f1f1', color: '#333', border: 'none', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer' }}
          >
            Add Experience
          </button>
        </section>
        
        {/* Social Links Section */}
        <section style={{ marginBottom: '30px' }}>
          <h3 style={{ fontSize: '1.3rem', color: '#333', marginBottom: '15px' }}>Social Links</h3>
          
          <div style={{ marginBottom: '15px' }}>
            <label htmlFor="github" style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>GitHub Profile</label>
            <input
              type="url"
              id="github"
              name="github"
              value={profileData.github || ''}
              onChange={handleChange}
              placeholder="https://github.com/yourusername"
              style={{ 
                width: '100%', 
                padding: '12px 15px', 
                border: `1px solid ${!profileData.github || isValidUrl(profileData.github) ? '#ddd' : '#e74c3c'}`, 
                borderRadius: '4px', 
                fontSize: '1rem' 
              }}
            />
            {profileData.github && !isValidUrl(profileData.github) && (
              <small style={{ color: '#e74c3c' }}>Please enter a valid URL</small>
            )}
          </div>
          
          <div style={{ marginBottom: '15px' }}>
            <label htmlFor="linkedin" style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>LinkedIn Profile</label>
            <input
              type="url"
              id="linkedin"
              name="linkedin"
              value={profileData.linkedin || ''}
              onChange={handleChange}
              placeholder="https://linkedin.com/in/yourusername"
              style={{ 
                width: '100%', 
                padding: '12px 15px', 
                border: `1px solid ${!profileData.linkedin || isValidUrl(profileData.linkedin) ? '#ddd' : '#e74c3c'}`, 
                borderRadius: '4px', 
                fontSize: '1rem' 
              }}
            />
            {profileData.linkedin && !isValidUrl(profileData.linkedin) && (
              <small style={{ color: '#e74c3c' }}>Please enter a valid URL</small>
            )}
          </div>
          
          <div style={{ marginBottom: '15px' }}>
            <label htmlFor="portfolio" style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Portfolio Website</label>
            <input
              type="url"
              id="portfolio"
              name="portfolio"
              value={profileData.portfolio || ''}
              onChange={handleChange}
              placeholder="https://yourportfolio.com"
              style={{ 
                width: '100%', 
                padding: '12px 15px', 
                border: `1px solid ${!profileData.portfolio || isValidUrl(profileData.portfolio) ? '#ddd' : '#e74c3c'}`, 
                borderRadius: '4px', 
                fontSize: '1rem' 
              }}
            />
            {profileData.portfolio && !isValidUrl(profileData.portfolio) && (
              <small style={{ color: '#e74c3c' }}>Please enter a valid URL</small>
            )}
          </div>
        </section>
        
        {/* Form Buttons */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '15px', marginTop: '30px' }}>
          <button 
            type="button" 
            onClick={() => navigate('/profile')}
            disabled={isSubmitting}
            style={{ 
              padding: '10px 20px', 
              backgroundColor: '#f1f1f1', 
              color: '#333', 
              border: 'none', 
              borderRadius: '4px', 
              fontSize: '1rem', 
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              opacity: isSubmitting ? 0.7 : 1
            }}
          >
            Cancel
          </button>
          <button 
            type="submit" 
            disabled={isSubmitting}
            style={{ 
              padding: '10px 20px', 
              backgroundColor: '#4e54c8', 
              color: 'white', 
              border: 'none', 
              borderRadius: '4px', 
              fontSize: '1rem', 
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              opacity: isSubmitting ? 0.7 : 1
            }}
          >
            {isSubmitting ? 'Saving...' : 'Save Profile'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProfileEdit;