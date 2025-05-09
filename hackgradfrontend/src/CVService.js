// cvProfileService.js - Frontend service for CV Profile API
import axios from 'axios';

const API_URL = 'http://localhost:3000/api';

// Helper function for caching
const getFromCache = (cacheKey) => {
  const cachedItem = localStorage.getItem(cacheKey);
  if (!cachedItem) return null;
  
  try {
    const { data, timestamp } = JSON.parse(cachedItem);
    // Cache valid for 5 minutes
    if (Date.now() - timestamp < 5 * 60 * 1000) {
      return data;
    }
  } catch (e) {
    localStorage.removeItem(cacheKey);
  }
  return null;
};

const saveToCache = (cacheKey, data) => {
  try {
    localStorage.setItem(cacheKey, JSON.stringify({
      data,
      timestamp: Date.now()
    }));
  } catch (e) {
    console.warn("Caching failed:", e);
  }
};

// Create axios instance with default config
const api = axios.create({
  baseURL: `${API_URL}/cv-profile`,
  timeout: 30000,
  withCredentials: true
});

// Add request interceptor to attach auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Debug helper - log if token exists
const logTokenStatus = () => {
  const token = localStorage.getItem('token');
  console.log(`Token exists: ${!!token}`);
  if (token) {
    console.log(`Token preview: ${token.substring(0, 10)}...`);
  }
};

// CVService.js
export const cvProfileService = {
  // Get all CV profiles for current user
  getAllCVProfiles: async (retries = 3) => {
    logTokenStatus();
    console.log("Attempting to fetch all CV profiles", retries ? `(${retries} attempts left)` : '');
    
    try {
      const response = await api.get('/all');
      console.log("CV profiles fetched successfully:", response.data);
      return response.data;
    } catch (error) {
      console.error("Get all CVs error:", error.response?.data || error.message);
      
      // Retry logic for timeout errors
      if (retries > 0 && error.code === 'ECONNABORTED') {
        console.log(`Request timed out. Retrying... (${retries} attempts left)`);
        // Recursive call with one less retry
        return cvProfileService.getAllCVProfiles(retries - 1);
      }
      
      throw error;
    }
  },
  // Create a new CV profile with title
  createCVProfile: async (title = 'My CV') => {
    try {
      const initialProfile = {
        title: title,
        isPublic: false,
        headline: '',
        summary: '',
        contact: {
          email: '',
          phone: '',
          location: '',
          website: ''
        },
        workExperience: [],
        education: [],
        skills: [],
        languages: [],
        projects: [],
        certifications: [],
        publications: [],
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
            'projects', 'certifications', 'languages', 'publications'
          ],
          hiddenSections: []
        }
      };
      
      const response = await api.post('/', initialProfile);
      return response.data;
    } catch (error) {
      console.error("Create CV profile error:", error.response?.data || error.message);
      throw error;
    }
  },
  
  // Set a CV profile as default
  setDefaultCVProfile: async (id) => {
    try {
      const response = await api.put(`/default/${id}`);
      return response.data;
    } catch (error) {
      console.error("Set default CV error:", error.response?.data || error.message);
      throw error;
    }
  },
  
  // Duplicate a CV profile
  duplicateCVProfile: async (id) => {
    try {
      const response = await api.post(`/duplicate/${id}`);
      return response.data;
    } catch (error) {
      console.error("Duplicate CV error:", error.response?.data || error.message);
      throw error;
    }
  },
  
  // Get current user's CV profile
getCurrentCVProfile: async () => {
  const cacheKey = 'cache_current_cv_profile';
  const cachedData = getFromCache(cacheKey);
  
  if (cachedData) return cachedData;

  try {
    // Log authentication status
    const token = localStorage.getItem('token');
    console.log("Authentication token:", token ? "Present" : "Missing");
    
    const response = await api.get('/');
    console.log("CV profile response:", response);
    saveToCache(cacheKey, response.data);
    return response.data;
  } catch (error) {
    console.error("Error details:", {
      status: error.response?.status,
      message: error.response?.data?.message || error.message,
      config: error.config
    });
    
    if (error.response?.status === 404) {
      return null;
    }
    throw error;
  }
},

  // Get specific CV profile by ID

getCVProfileById: async (id) => {
  try {
    console.log(`Fetching CV profile with ID: ${id}`);
    const response = await api.get(`/${id}`);
    return response.data;
  } catch (error) {
    console.error("Get CV by ID error:", error.response?.data || error.message);
    throw error;
  }
},

  // Get public CV profile by user ID
  getPublicCVProfile: async (userId) => {
    const cacheKey = `cache_public_cv_profile_${userId}`;
    const cachedData = getFromCache(cacheKey);
    
    if (cachedData) return cachedData;

    try {
      const response = await api.get(`/public/${userId}`);
      saveToCache(cacheKey, response.data);
      return response.data;
    } catch (error) {
      if (error.response?.status === 404) {
        return null; // No public profile exists
      }
      console.error("Get public CV error:", error.response?.data || error.message);
      throw error;
    }
  },

  uploadProfileImage: async (id, formData) => {
    try {
      const response = await api.put(`/${id}/image`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return response;
    } catch (error) {
      console.error("Profile image upload error:", error);
      throw error;
    }
  },
  
  removeProfileImage: async (id) => {
    try {
      const response = await api.delete(`/${id}/image`);
      return response;
    } catch (error) {
      console.error("Profile image removal error:", error);
      throw error;
    }
  },
  
  // Save CV profile 
  // Fix for the saveCVProfile method
saveCVProfile: async (id, cvProfileData) => {
  try {
    // Log ID for debugging
    console.log("Attempting to save CV with ID:", id);
    
    // If no ID, we need to create a new CV profile first
    if (!id) {
      console.log("No ID provided - creating new CV profile");
      const newProfile = await cvProfileService.createCVProfile(cvProfileData.title || 'My CV');
      
      // Now update it with the full data
      const response = await api.put(`/${newProfile._id}`, {
        ...cvProfileData,
        _id: newProfile._id
      });
      
      localStorage.removeItem('cache_current_cv_profile');
      return response.data;
    }
    
    // If we have an ID, proceed with normal update
    const response = await api.put(`/${id}`, cvProfileData);
    localStorage.removeItem('cache_current_cv_profile');
    return response.data;
  } catch (error) {
    if (error.response?.status === 404) {
      console.error("CV not found:", error.response?.data);
      throw new Error("CV profile not found. It may have been deleted or you don't have permission to edit it.");
    }
    console.error("Save error:", error);
    throw error;
  }
},
  
  // Make profile public
  makePublic: async (id) => {
    try {
      const response = await api.put(`/public/${id}`);
      
      // Invalidate cache
      localStorage.removeItem('cache_current_cv_profile');
      
      return response.data;
    } catch (error) {
      console.error("Make public error:", error.response?.data || error.message);
      throw error;
    }
  },

  // Make profile private
  makePrivate: async (id) => {
    try {
      const response = await api.put(`/private/${id}`);
      
      // Invalidate cache
      localStorage.removeItem('cache_current_cv_profile');
      
      return response.data;
    } catch (error) {
      console.error("Make private error:", error.response?.data || error.message);
      throw error;
    }
  },
  
  // Toggle CV profile privacy setting
  togglePrivacy: async (id) => {
    try {
      // First get the current status
      const profile = await this.getCVProfileById(id);
      
      if (profile.isPublic) {
        return this.makePrivate(id);
      } else {
        return this.makePublic(id);
      }
    } catch (error) {
      console.error("Toggle privacy error:", error.response?.data || error.message);
      throw error;
    }
  },
  
  // Delete CV profile
  deleteCVProfile: async (id) => {
    try {
      // Log the ID being deleted
      console.log("Deleting CV profile with ID:", id);
      
      const response = await api.delete(`/${id}`);
      
      // Invalidate cache
      localStorage.removeItem('cache_current_cv_profile');
      
      return response.data;
    } catch (error) {
      console.error("Delete CV profile error:", error.response?.data || error.message);
      throw error;
    }
  },
  
  // Generate PDF for CV profile
  generatePDF: async (cvProfileId) => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('Authentication required');
      }
      
      // Correct URL that matches your backend route
      const url = `${API_URL}/cv-profile/${cvProfileId}/pdf?token=${token}`;
      
      // Open the PDF in a new tab/window with token
      window.open(url, '_blank');
      
      return true;
    } catch (error) {
      console.error("PDF generation error:", error.response?.data || error.message);
      throw error;
    }
  },
  
  // Sync with user profile
  syncWithUserProfile: async (sections) => {
    try {
      const response = await api.post('/sync', { sections });
      
      // Invalidate cache
      localStorage.removeItem('cache_current_cv_profile');
      
      return response.data;
    } catch (error) {
      console.error("Sync with profile error:", error.response?.data || error.message);
      throw error;
    }
  }
};