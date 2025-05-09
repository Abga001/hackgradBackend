// apiService.js

import axios from 'axios';

const API_URL = 'http://localhost:3000/api';

// Cache configuration
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds
const CACHE_ENABLED = true; // Toggle for easy cache disabling during debugging

// Create a reusable axios instance for authentication requests
const authAxios = axios.create({
  baseURL: `${API_URL}/auth`,
  timeout: 10000,
});

// Create a reusable axios instance for authenticated requests
const apiAxios = axios.create({
  baseURL: API_URL,
  timeout: 10000,
});


// Helper function for caching
const getFromCache = (cacheKey) => {
  if (!CACHE_ENABLED) return null;
  
  const cachedItem = localStorage.getItem(cacheKey);
  if (!cachedItem) return null;
  
  try {
    const { data, timestamp } = JSON.parse(cachedItem);
    // Check if cache is still valid
    if (Date.now() - timestamp < CACHE_DURATION) {
      return data;
    }
  } catch (e) {
    // If parsing fails, invalidate cache
    localStorage.removeItem(cacheKey);
  }
  
  return null;
};

// Helper function to save to cache
const saveToCache = (cacheKey, data) => {
  if (!CACHE_ENABLED) return;
  
  try {
    localStorage.setItem(cacheKey, JSON.stringify({
      data,
      timestamp: Date.now()
    }));
  } catch (e) {
    console.warn("Caching failed, likely localStorage is full", e);
    // Attempt to clear old cache entries
    clearOldCacheEntries();
  }
};

// Helper to clear older cache entries if storage is full
const clearOldCacheEntries = () => {
  const keysToRemove = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key.startsWith('cache_')) {
      keysToRemove.push(key);
    }
  }
  
  // Sort by age and remove oldest 50%
  const keysToKeep = keysToRemove.length / 2;
  keysToRemove.forEach((key, index) => {
    if (index >= keysToKeep) {
      localStorage.removeItem(key);
    }
  });
};

// Create axios instance with default config
const api = axios.create({
  baseURL: API_URL,
  timeout: 10000, // 10 second timeout
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

// Auth Service
export const authService = {
  // Register new user
  register: async (userData) => {
    try {
      const response = await api.post('/user/register', userData);
      return response.data;
    } catch (error) {
      console.error("Registration error:", error.response?.data || error.message);
      throw error;
    }
  },

  // Login user
  login: async (credentials) => {
    try {
      const response = await api.post('/user/login', credentials);
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        return true;
      }
      return false;
    } catch (error) {
      console.error("Login error:", error.response?.data || error.message);
      throw error;
    }
  },

  // Logout user
  logout: () => {
    // Clear all app data including cached items
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('cache_') || key === 'token') {
        localStorage.removeItem(key);
      }
    });
  },

  // Check if user is authenticated
  isAuthenticated: () => {
    return localStorage.getItem('token') !== null;
  },

  // Get current user data with caching
  getCurrentUser: async () => {
    const cacheKey = 'cache_current_user';
    const cachedData = getFromCache(cacheKey);
    
    if (cachedData) {
      return cachedData;
    }
    
    try {
      const token = localStorage.getItem('token');
      if (!token) return null;

      const response = await api.get('/user/profile');
      const userData = response.data;
      
      // Cache the user data
      saveToCache(cacheKey, userData);
      
      return userData;
    } catch (error) {
      console.error("Get current user error:", error.response?.data || error.message);
      throw error;
    }
  },

  // Get Firebase token for chat
  getFirebaseToken: async () => {
    try {
      const response = await api.get('/user/firebase-token');
      return response.data.firebaseToken;
    } catch (error) {
      console.error("Get Firebase token error:", error.response?.data || error.message);
      throw error;
    }
  }
};

// User Service
export const userService = {
  // Get user profile by ID with caching
  getUserProfile: async (userId) => {
    const cacheKey = `cache_user_profile_${userId}`;
    const cachedData = getFromCache(cacheKey);
    
    if (cachedData) {
      return cachedData;
    }
    
    try {
      const response = await api.get(`/user/profile/${userId}`);
      const userData = response.data;
      
      // Cache the profile data
      saveToCache(cacheKey, userData);
      
      return userData;
    } catch (error) {
      console.error("Get user profile error:", error.response?.data || error.message);
      throw error;
    }
  },

  // Get user followers
  getUserFollowers: async (userId) => {
    const cacheKey = `cache_user_followers_${userId}`;
    const cachedData = getFromCache(cacheKey);
    
    if (cachedData) {
      return cachedData;
    }
    
    try {
      const response = await api.get(`/user/followers/${userId}`);
      const followers = response.data;
      
      // Cache the followers data
      saveToCache(cacheKey, followers);
      
      return followers;
    } catch (error) {
      console.error("Get user followers error:", error.response?.data || error.message);
      return [];
    }
  },

  // Follow a user (invalidates caches)
  followUser: async (userId) => {
    try {
      const response = await api.post(`/user/follow/${userId}`, {});
      
      // Invalidate relevant caches
      localStorage.removeItem(`cache_user_followers_${userId}`);
      localStorage.removeItem('cache_current_user');
      localStorage.removeItem('cache_user_following');
      
      return response.data;
    } catch (error) {
      console.error("Follow user error:", error.response?.data || error.message);
      throw error;
    }
  },

  // Unfollow a user (invalidates caches)
  unfollowUser: async (userId) => {
    try {
      const response = await api.post(`/user/unfollow/${userId}`, {});
      
      // Invalidate relevant caches
      localStorage.removeItem(`cache_user_followers_${userId}`);
      localStorage.removeItem('cache_current_user');
      localStorage.removeItem('cache_user_following');
      
      return response.data;
    } catch (error) {
      console.error("Unfollow user error:", error.response?.data || error.message);
      throw error;
    }
  },

  // Get user's following list with caching
  getFollowing: async () => {
    const cacheKey = 'cache_user_following';
    const cachedData = getFromCache(cacheKey);
    
    if (cachedData) {
      return cachedData;
    }
    
    try {
      const response = await api.get('/user/following');
      const following = response.data;
      
      // Cache the following data
      saveToCache(cacheKey, following);
      
      return following;
    } catch (error) {
      console.error("Get following error:", error.response?.data || error.message);
      return [];
    }
  },



  // Get user's following list with caching
  getUserFollowing: async (userId) => {
    const cacheKey = `cache_user_following_${userId}`;
    const cachedData = getFromCache(cacheKey);
    
    if (cachedData) {
      return cachedData;
    }
    
    try {
      const response = await api.get(`/user/following/${userId}`);
      const following = response.data;
      
      // Cache the following data
      saveToCache(cacheKey, following);
      
      return following;
    } catch (error) {
      console.error(`Get following for user ${userId} error:`, error.response?.data || error.message);
      return [];
    }
  },
  
  // Update user profile (invalidates caches)
  updateProfile: async (profileData) => {
    try {
      const response = await api.put('/user/profile', profileData);
      
      // Invalidate user cache
      localStorage.removeItem('cache_current_user');
      
      return response.data;
    } catch (error) {
      console.error("Update profile error:", error.response?.data || error.message);
      throw error;
    }
  },
  
  // Upload profile image
  uploadProfileImage: async (formData) => {
    try {
      const response = await api.post('/user/profile/image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      // Invalidate user cache
      localStorage.removeItem('cache_current_user');
      
      return response.data;
    } catch (error) {
      console.error("Upload profile image error:", error.response?.data || error.message);
      throw error;
    }
  }
};

// Content Service
export const contentService = {
  // Create new content
  createContent: async (contentData) => {
    try {
      let response;
      
      if (contentData instanceof FormData) {
        // For FormData, let Axios set the proper Content-Type with boundary
        response = await api.post('/contents', contentData);
      } else {
        // For JSON data
        response = await api.post('/contents', contentData, {
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      // Invalidate content list cache
      localStorage.removeItem('cache_contents');
      
      return response.data;
    } catch (error) {
      console.error("Create content error:", error.response?.data || error.message);
      throw error;
    }
  },

    // Get user's posts/content with caching
    getUserPosts: async (userId, page = 1, limit = 10) => {
      const cacheKey = `cache_user_posts_${userId}_page${page}_limit${limit}`;
      const cachedData = getFromCache(cacheKey);
      
      if (cachedData) {
        return cachedData;
      }
      
      try {
        const response = await api.get(`/contents/user/${userId}?page=${page}&limit=${limit}`);
        
        // Cache the user posts data
        saveToCache(cacheKey, response.data);
        
        return response.data;
      } catch (error) {
        console.error("Get user posts error:", error.response?.data || error.message);
        return [];
      }
    },  

  // Get all contents with pagination
  getAllContents: async (page = 1, limit = 10) => {
    const cacheKey = `cache_contents_page${page}_limit${limit}`;
    const cachedData = getFromCache(cacheKey);
    
    if (cachedData) {
      return cachedData;
    }
    
    try {
      const response = await api.get(`/contents?page=${page}&limit=${limit}`);
      const contents = response.data.contents || [];
      
      // Cache the paginated content data
      saveToCache(cacheKey, contents);
      
      return contents;
    } catch (error) {
      console.error("Get contents error:", error.response?.data || error.message);
      return [];
    }
  },

  // Get content by ID with caching
  getContentById: async (contentId) => {
    const cacheKey = `cache_content_${contentId}`;
    const cachedData = getFromCache(cacheKey);
    
    if (cachedData) {
      return cachedData;
    }
    
    try {
      const response = await api.get(`/contents/${contentId}`);
      
      // Cache the content data
      saveToCache(cacheKey, response.data);
      
      return response.data;
    } catch (error) {
      console.error("Get content error:", error.response?.data || error.message);
      throw error;
    }
  },

  // Update content (invalidates caches)
  updateContent: async (contentId, updateData) => {
    try {
      let response;
      
      if (updateData instanceof FormData) {
        // For FormData, let Axios set the proper Content-Type with boundary
        response = await api.patch(`/contents/${contentId}`, updateData);
      } else {
        // For JSON data
        response = await api.patch(`/contents/${contentId}`, updateData);
      }
      
      // Invalidate content caches
      localStorage.removeItem(`cache_content_${contentId}`);
      localStorage.removeItem('cache_contents');
      
      return response.data;
    } catch (error) {
      console.error("Update content error:", error.response?.data || error.message);
      throw error;
    }
  },

  // Save content
  saveContent: async (contentId) => {
    try {
      const response = await api.post(`/contents/${contentId}/save`, {});
      
      // Invalidate content cache
      localStorage.removeItem(`cache_content_${contentId}`);
      
      return response.data;
    } catch (error) {
      console.error("Save content error:", error.response?.data || error.message);
      throw error;
    }
  },
  
  // Repost content
  repostContent: async (contentId, repostNote = "") => {
    try {
      const response = await api.post(`/contents/${contentId}/repost`, { repostNote });
      
      // Invalidate content and contents caches
      localStorage.removeItem(`cache_content_${contentId}`);
      localStorage.removeItem('cache_contents');
      
      return response.data;
    } catch (error) {
      console.error("Repost content error:", error.response?.data || error.message);
      throw error;
    }
  },
  
  // Get saved content
  getSavedContent: async () => {
    const cacheKey = 'cache_saved_content';
    const cachedData = getFromCache(cacheKey);
    
    if (cachedData) {
      return cachedData;
    }
    
    try {
      const response = await api.get('/contents/saved');
      
      // Cache the saved content data
      saveToCache(cacheKey, response.data);
      
      return response.data;
    } catch (error) {
      console.error("Get saved content error:", error.response?.data || error.message);
      return [];
    }
  },
  
  // Get reposted content
  getRepostedContent: async () => {
    const cacheKey = 'cache_reposted_content';
    const cachedData = getFromCache(cacheKey);
    
    if (cachedData) {
      return cachedData;
    }
    
    try {
      const response = await api.get('/contents/reposted');
      
      // Cache the reposted content data
      saveToCache(cacheKey, response.data);
      
      return response.data;
    } catch (error) {
      console.error("Get reposted content error:", error.response?.data || error.message);
      return [];
    }
  },

    // Add an answer to a question
    addAnswer: async (contentId, answerText) => {
      try {
        const response = await api.post(`/contents/questions/${contentId}/answer`, { text: answerText });
        
        // Invalidate content cache
        localStorage.removeItem(`cache_content_${contentId}`);
        
        return response.data;
      } catch (error) {
        console.error("Add answer error:", error.response?.data || error.message);
        throw error;
      }
    },
    // Accept an answer for a question
    acceptAnswer: async (contentId, commentIndex) => {
      try {
        const response = await api.post(`/contents/questions/${contentId}/accept-answer`, { commentIndex });
        return response.data;
      } catch (error) {
        throw new Error(error.response?.data?.message || 'Failed to accept answer');
      }
    },
  
    // Vote on an answer
    voteAnswer: async (contentId, commentIndex, direction) => {
      try {
        const response = await api.post(`/contents/questions/${contentId}/vote-answer`, {
          commentIndex,
          direction
        });
        return response.data;
      } catch (error) {
        if (error.response?.status === 400) {
          // Handle specific error for already voted
          if (error.response.data.message.includes("already")) {
            return { error: "already-voted", message: error.response.data.message };
          }
        }
        throw new Error(error.response?.data?.message || 'Failed to vote on answer');
      }
    },


  // Add comment to content (invalidates caches)
  addComment: async (contentId, commentText) => {
    try {
      const response = await api.post(`/contents/${contentId}/comment`, { text: commentText });
      
      // Invalidate content cache
      localStorage.removeItem(`cache_content_${contentId}`);
      
      return response.data;
    } catch (error) {
      console.error("Add comment error:", error.response?.data || error.message);
      throw error;
    }
  },

    // Delete content (invalidates caches)
    deleteContent: async (contentId) => {
      try {
        const response = await api.delete(`/contents/${contentId}`);
        
        // Invalidate content caches
        localStorage.removeItem(`cache_content_${contentId}`);
        localStorage.removeItem('cache_contents');
        
        return response.data;
      } catch (error) {
        console.error("Delete content error:", error.response?.data || error.message);
        throw error;
      }
    },

    // Like/Dislike content (invalidates caches)
performAction: async (contentId, action) => {
  try {
    const response = await api.post(`/contents/${contentId}/${action}`, {});
    
    // Invalidate content cache
    localStorage.removeItem(`cache_content_${contentId}`);
    
    // Also invalidate user profile cache for content owner
    if (response.data.content && response.data.content.userId) {
      localStorage.removeItem(`cache_user_profile_${response.data.content.userId}`);
    }
    
    return response.data;
  } catch (error) {
    console.error(`${action} content error:`, error.response?.data || error.message);
    throw error;
  }
}
};

// Search Service
export const searchService = {
  // Search for users and content
  search: async (query) => {
    // Don't cache search results as they're likely to change
    try {
      const response = await api.get(`/search?q=${encodeURIComponent(query)}`);
      return response.data;
    } catch (error) {
      console.error("Search error:", error.response?.data || error.message);
      return { users: [], contents: [] };
    }
  }
};

// Message Service
export const messageService = {
  // Get conversations
  getConversations: async () => {
    try {
      const response = await api.get('/messages');
      return response.data;
    } catch (error) {
      console.error("Get conversations error:", error.response?.data || error.message);
      return [];
    }
  },

  // Get conversation messages
  getConversation: async (conversationId) => {
    try {
      const response = await api.get(`/messages/${conversationId}`);
      return response.data;
    } catch (error) {
      console.error("Get conversation error:", error.response?.data || error.message);
      return { messages: [] };
    }
  },

  // Send message
  sendMessage: async (conversationId, messageText) => {
    try {
      const response = await api.post(`/messages/${conversationId}`, { text: messageText });
      return response.data;
    } catch (error) {
      console.error("Send message error:", error.response?.data || error.message);
      throw error;
    }
  },

  // Start new conversation
  startConversation: async (recipientId, initialMessage) => {
    try {
      const response = await api.post('/messages/new', { recipientId, message: initialMessage });
      return response.data;
    } catch (error) {
      console.error("Start conversation error:", error.response?.data || error.message);
      throw error;
    }
  }
};

