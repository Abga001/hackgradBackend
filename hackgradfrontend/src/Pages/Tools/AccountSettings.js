import React, { useState, useEffect } from 'react';
import { User, Bell, Lock, Shield, Zap, LogOut } from 'lucide-react';
import '../../styles/AccountSettings.css'; // Import the CSS file

const AccountSettings = () => {
  // State for active tab
  const [activeTab, setActiveTab] = useState('profile');
  
  // User profile state
  const [profile, setProfile] = useState({
    username: 'johndoe',
    email: 'john.doe@example.com',
    fullName: 'John Doe',
    bio: 'Full-stack developer with a passion for building educational tools.',
    location: 'London, UK',
    website: 'https://johndoe.dev',
    avatarUrl: 'https://i.pravatar.cc/150?u=johndoe'
  });
  
  // State for form input
  const [formData, setFormData] = useState({ ...profile });
  
  // State for unsaved changes
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  
  // State for form submission
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState({ type: '', message: '' });
  
  // Notification settings state
  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    pushNotifications: true,
    marketingEmails: false,
    newFollowers: true,
    newMessages: true,
    newComments: true,
    mentionsAndTags: true,
    weeklyDigest: false
  });
  
  // Privacy settings state
  const [privacy, setPrivacy] = useState({
    profileVisibility: 'public',
    showOnlineStatus: true,
    showLastSeen: true,
    showEmail: false,
    allowTagging: true,
    allowMentions: true,
    showActivity: true
  });
  
  // Security settings state
  const [security, setSecurity] = useState({
    twoFactorAuth: false,
    loginAlerts: true,
    sessionTimeout: '30'
  });
  
  // Password change state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  // Password strength state
  const [passwordStrength, setPasswordStrength] = useState({
    score: 0,
    feedback: 'Enter a new password'
  });
  
  // Preferences state
  const [preferences, setPreferences] = useState({
    theme: 'light',
    language: 'en',
    timeFormat: '12h',
    dateFormat: 'MM/DD/YYYY',
    timezone: 'UTC',
    weekStart: 'monday'
  });
  
  // Reset form data when active tab changes
  useEffect(() => {
    if (activeTab === 'profile') {
      setFormData({ ...profile });
      setHasUnsavedChanges(false);
    }
  }, [activeTab, profile]);
  
  // Check for unsaved changes
  useEffect(() => {
    if (JSON.stringify(formData) !== JSON.stringify(profile)) {
      setHasUnsavedChanges(true);
    } else {
      setHasUnsavedChanges(false);
    }
  }, [formData, profile]);
  
  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };
  
  // Handle notification toggle changes
  const handleNotificationChange = (e) => {
    const { name, checked } = e.target;
    setNotifications({
      ...notifications,
      [name]: checked
    });
  };
  
  // Handle privacy setting changes
  const handlePrivacyChange = (e) => {
    const { name, value, type, checked } = e.target;
    setPrivacy({
      ...privacy,
      [name]: type === 'checkbox' ? checked : value
    });
  };
  
  // Handle security setting changes
  const handleSecurityChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSecurity({
      ...security,
      [name]: type === 'checkbox' ? checked : value
    });
  };
  
  // Handle password input changes
  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData({
      ...passwordData,
      [name]: value
    });
    
    // Check password strength if changing new password
    if (name === 'newPassword') {
      checkPasswordStrength(value);
    }
  };
  
  // Handle preference changes
  const handlePreferenceChange = (e) => {
    const { name, value } = e.target;
    setPreferences({
      ...preferences,
      [name]: value
    });
  };
  
  // Check password strength
  const checkPasswordStrength = (password) => {
    let score = 0;
    let feedback = 'Weak password';
    
    if (password.length >= 8) score += 1;
    if (password.match(/[a-z]/) && password.match(/[A-Z]/)) score += 1;
    if (password.match(/\d/)) score += 1;
    if (password.match(/[^a-zA-Z\d]/)) score += 1;
    
    if (score === 0) feedback = 'Very weak password';
    if (score === 1) feedback = 'Weak password';
    if (score === 2) feedback = 'Moderate password';
    if (score === 3) feedback = 'Strong password';
    if (score === 4) feedback = 'Very strong password';
    
    setPasswordStrength({ score, feedback });
  };
  
  // Submit profile form
  const handleProfileSubmit = (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate API call
    setTimeout(() => {
      setProfile(formData);
      setIsSubmitting(false);
      setSubmitMessage({
        type: 'success',
        message: 'Profile updated successfully!'
      });
      
      // Clear message after 3 seconds
      setTimeout(() => {
        setSubmitMessage({ type: '', message: '' });
      }, 3000);
    }, 1000);
  };
  
  // Submit password change
  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    
    // Validation
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setSubmitMessage({
        type: 'error',
        message: 'New passwords do not match.'
      });
      return;
    }
    
    if (passwordStrength.score < 2) {
      setSubmitMessage({
        type: 'error',
        message: 'Password is too weak. Please choose a stronger password.'
      });
      return;
    }
    
    setIsSubmitting(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitMessage({
        type: 'success',
        message: 'Password changed successfully!'
      });
      
      // Reset password form
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      
      // Clear message after 3 seconds
      setTimeout(() => {
        setSubmitMessage({ type: '', message: '' });
      }, 3000);
    }, 1000);
  };
  
  // Save notification settings
  const handleSaveNotifications = () => {
    setIsSubmitting(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitMessage({
        type: 'success',
        message: 'Notification preferences saved!'
      });
      
      // Clear message after 3 seconds
      setTimeout(() => {
        setSubmitMessage({ type: '', message: '' });
      }, 3000);
    }, 1000);
  };
  
  // Save privacy settings
  const handleSavePrivacy = () => {
    setIsSubmitting(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitMessage({
        type: 'success',
        message: 'Privacy settings saved!'
      });
      
      // Clear message after 3 seconds
      setTimeout(() => {
        setSubmitMessage({ type: '', message: '' });
      }, 3000);
    }, 1000);
  };
  
  // Save security settings
  const handleSaveSecurity = () => {
    setIsSubmitting(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitMessage({
        type: 'success',
        message: 'Security settings saved!'
      });
      
      // Clear message after 3 seconds
      setTimeout(() => {
        setSubmitMessage({ type: '', message: '' });
      }, 3000);
    }, 1000);
  };
  
  // Save preferences
  const handleSavePreferences = () => {
    setIsSubmitting(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitMessage({
        type: 'success',
        message: 'Preferences saved!'
      });
      
      // Clear message after 3 seconds
      setTimeout(() => {
        setSubmitMessage({ type: '', message: '' });
      }, 3000);
    }, 1000);
  };
  
  // Handle account deletion
  const handleDeleteAccount = () => {
    if (window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      // Simulate API call
      setTimeout(() => {
        alert('Account deletion process initiated. You will receive an email with further instructions.');
      }, 1000);
    }
  };
  
  // Handle logout
  const handleLogout = () => {
    if (window.confirm('Are you sure you want to log out?')) {
      // Simulate logout
      alert('You have been logged out');
    }
  };
  
  // Tabs configuration
  const tabs = [
    { id: 'profile', label: 'Profile', icon: <User size={20} /> },
    { id: 'notifications', label: 'Notifications', icon: <Bell size={20} /> },
    { id: 'privacy', label: 'Privacy', icon: <Shield size={20} /> },
    { id: 'security', label: 'Security', icon: <Lock size={20} /> },
    { id: 'preferences', label: 'Preferences', icon: <Zap size={20} /> }
  ];
  
  return (
    <div className="account-settings-container">
      <h1 className="settings-header">Account Settings</h1>
      
      <div className="settings-layout">
        {/* Sidebar */}
        <div className="settings-sidebar">
          <div className="sidebar-profile">
            <img
              src={profile.avatarUrl}
              alt={profile.fullName}
              className="sidebar-profile-image"
            />
            <div className="sidebar-profile-info">
              <div className="sidebar-profile-name">{profile.fullName}</div>
              <div className="sidebar-profile-username">@{profile.username}</div>
            </div>
          </div>
          
          <nav className="settings-nav">
            <ul className="settings-nav-list">
              {tabs.map(tab => (
                <li key={tab.id} className="settings-nav-item">
                  <button
                    onClick={() => setActiveTab(tab.id)}
                    className={`settings-nav-button ${activeTab === tab.id ? 'active' : ''}`}
                  >
                    <span className="settings-nav-icon">{tab.icon}</span>
                    {tab.label}
                  </button>
                </li>
              ))}
              
              <li className="settings-nav-item settings-nav-border">
                <button
                  onClick={handleLogout}
                  className="settings-nav-button logout-button"
                >
                  <span className="settings-nav-icon"><LogOut size={20} /></span>
                  Log Out
                </button>
              </li>
            </ul>
          </nav>
        </div>
        
        {/* Main Content */}
        <div className="settings-content">
          {/* Success/Error Message */}
          {submitMessage.message && (
            <div 
              className={`settings-status-message ${
                submitMessage.type === 'success' 
                  ? 'settings-status-success' 
                  : 'settings-status-error'
              }`}
            >
              {submitMessage.message}
            </div>
          )}
          
          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div>
              <h2 className="settings-section-title">Profile Information</h2>
              <p className="settings-section-subtitle">Update your personal information and how it appears on your profile.</p>
              
              <div className="settings-image-uploader">
                <img 
                  src={formData.avatarUrl} 
                  alt={formData.fullName}
                  className="settings-profile-image"
                />
                <div className="settings-image-actions">
                  <button className="upload-button">
                    Change Photo
                  </button>
                  <p className="upload-hint">
                    JPG, GIF or PNG. Max size of 5MB.
                  </p>
                </div>
              </div>
              
              <div className="settings-row">
                <div className="settings-form-group">
                  <label className="settings-label">Username</label>
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleInputChange}
                    className="settings-input"
                  />
                </div>
                
                <div className="settings-form-group">
                  <label className="settings-label">Email</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="settings-input"
                  />
                </div>
              </div>
              
              <div className="settings-form-group">
                <label className="settings-label">Full Name</label>
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  className="settings-input"
                />
              </div>
              
              <div className="settings-form-group">
                <label className="settings-label">Bio</label>
                <textarea
                  name="bio"
                  value={formData.bio}
                  onChange={handleInputChange}
                  rows="3"
                  className="settings-textarea"
                  placeholder="Tell us about yourself"
                ></textarea>
              </div>
              
              <div className="settings-row">
                <div className="settings-form-group">
                  <label className="settings-label">Location</label>
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                    className="settings-input"
                    placeholder="City, Country"
                  />
                </div>
                
                <div className="settings-form-group">
                  <label className="settings-label">Website</label>
                  <input
                    type="url"
                    name="website"
                    value={formData.website}
                    onChange={handleInputChange}
                    className="settings-input"
                    placeholder="https://yourwebsite.com"
                  />
                </div>
              </div>
              
              <div className="settings-form-footer">
                <button
                  onClick={handleProfileSubmit}
                  disabled={!hasUnsavedChanges || isSubmitting}
                  className="save-button"
                >
                  {isSubmitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          )}
          
          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <div>
              <h2 className="settings-section-title">Notification Settings</h2>
              <p className="settings-section-subtitle">Manage how and when you receive notifications.</p>
              
              <div>
                <h3 className="settings-label">Notification Channels</h3>
                
                <div className="settings-toggle-container">
                  <div>
                    <div className="settings-toggle-label">Email Notifications</div>
                    <div className="settings-toggle-description">Receive notifications via email</div>
                  </div>
                  <label className="settings-toggle-switch">
                    <input
                      type="checkbox"
                      name="emailNotifications"
                      checked={notifications.emailNotifications}
                      onChange={handleNotificationChange}
                    />
                    <span className="settings-toggle-slider"></span>
                  </label>
                </div>
                
                <div className="settings-toggle-container">
                  <div>
                    <div className="settings-toggle-label">Push Notifications</div>
                    <div className="settings-toggle-description">Receive notifications on your device</div>
                  </div>
                  <label className="settings-toggle-switch">
                    <input
                      type="checkbox"
                      name="pushNotifications"
                      checked={notifications.pushNotifications}
                      onChange={handleNotificationChange}
                    />
                    <span className="settings-toggle-slider"></span>
                  </label>
                </div>
                
                <div className="settings-toggle-container">
                  <div>
                    <div className="settings-toggle-label">Marketing Emails</div>
                    <div className="settings-toggle-description">Receive promotional emails and updates</div>
                  </div>
                  <label className="settings-toggle-switch">
                    <input
                      type="checkbox"
                      name="marketingEmails"
                      checked={notifications.marketingEmails}
                      onChange={handleNotificationChange}
                    />
                    <span className="settings-toggle-slider"></span>
                  </label>
                </div>
              </div>
              
              <hr className="settings-divider" />
              
              <div>
                <h3 className="settings-label">Activity Notifications</h3>
                
                <div className="settings-toggle-container">
                  <div className="settings-toggle-label">New Followers</div>
                  <label className="settings-toggle-switch">
                    <input
                      type="checkbox"
                      name="newFollowers"
                      checked={notifications.newFollowers}
                      onChange={handleNotificationChange}
                    />
                    <span className="settings-toggle-slider"></span>
                  </label>
                </div>
                
                <div className="settings-toggle-container">
                  <div className="settings-toggle-label">New Messages</div>
                  <label className="settings-toggle-switch">
                    <input
                      type="checkbox"
                      name="newMessages"
                      checked={notifications.newMessages}
                      onChange={handleNotificationChange}
                    />
                    <span className="settings-toggle-slider"></span>
                  </label>
                </div>
                
                <div className="settings-toggle-container">
                  <div className="settings-toggle-label">Comments on your content</div>
                  <label className="settings-toggle-switch">
                    <input
                      type="checkbox"
                      name="newComments"
                      checked={notifications.newComments}
                      onChange={handleNotificationChange}
                    />
                    <span className="settings-toggle-slider"></span>
                  </label>
                </div>
                
                <div className="settings-toggle-container">
                  <div className="settings-toggle-label">Mentions and tags</div>
                  <label className="settings-toggle-switch">
                    <input
                      type="checkbox"
                      name="mentionsAndTags"
                      checked={notifications.mentionsAndTags}
                      onChange={handleNotificationChange}
                    />
                    <span className="settings-toggle-slider"></span>
                  </label>
                </div>
                
                <div className="settings-toggle-container">
                  <div className="settings-toggle-label">Weekly digest</div>
                  <label className="settings-toggle-switch">
                    <input
                      type="checkbox"
                      name="weeklyDigest"
                      checked={notifications.weeklyDigest}
                      onChange={handleNotificationChange}
                    />
                    <span className="settings-toggle-slider"></span>
                  </label>
                </div>
              </div>
              
              <div className="settings-form-footer">
                <button
                  onClick={handleSaveNotifications}
                  disabled={isSubmitting}
                  className="save-button"
                >
                  {isSubmitting ? 'Saving...' : 'Save Preferences'}
                </button>
              </div>
            </div>
          )}
          
          {/* Privacy Tab */}
          {activeTab === 'privacy' && (
            <div>
              <h2 className="settings-section-title">Privacy Settings</h2>
              <p className="settings-section-subtitle">Control your privacy and what others can see about you.</p>
              
              <div className="settings-form-group">
                <label className="settings-label">Profile Visibility</label>
                <select
                  name="profileVisibility"
                  value={privacy.profileVisibility}
                  onChange={handlePrivacyChange}
                  className="settings-select"
                >
                  <option value="public">Public - Anyone can view your profile</option>
                  <option value="connections">Connections Only - Only your connections can view your profile</option>
                  <option value="private">Private - Only you can view your profile</option>
                </select>
              </div>
              
              <hr className="settings-divider" />
              
              <h3 className="settings-label">Visibility Options</h3>
              
              <div className="settings-toggle-container">
                <div className="settings-toggle-label">Show online status</div>
                <label className="settings-toggle-switch">
                  <input
                    type="checkbox"
                    name="showOnlineStatus"
                    checked={privacy.showOnlineStatus}
                    onChange={handlePrivacyChange}
                  />
                  <span className="settings-toggle-slider"></span>
                </label>
              </div>
              
              <div className="settings-toggle-container">
                <div className="settings-toggle-label">Show last seen</div>
                <label className="settings-toggle-switch">
                  <input
                    type="checkbox"
                    name="showLastSeen"
                    checked={privacy.showLastSeen}
                    onChange={handlePrivacyChange}
                  />
                  <span className="settings-toggle-slider"></span>
                </label>
              </div>
              
              <div className="settings-toggle-container">
                <div className="settings-toggle-label">Show email address</div>
                <label className="settings-toggle-switch">
                  <input
                    type="checkbox"
                    name="showEmail"
                    checked={privacy.showEmail}
                    onChange={handlePrivacyChange}
                  />
                  <span className="settings-toggle-slider"></span>
                </label>
              </div>
              
              <hr className="settings-divider" />
              
              <h3 className="settings-label">Interaction Settings</h3>
              
              <div className="settings-toggle-container">
                <div className="settings-toggle-label">Allow tagging</div>
                <label className="settings-toggle-switch">
                  <input
                    type="checkbox"
                    name="allowTagging"
                    checked={privacy.allowTagging}
                    onChange={handlePrivacyChange}
                  />
                  <span className="settings-toggle-slider"></span>
                </label>
              </div>
              
              <div className="settings-toggle-container">
                <div className="settings-toggle-label">Allow mentions</div>
                <label className="settings-toggle-switch">
                  <input
                    type="checkbox"
                    name="allowMentions"
                    checked={privacy.allowMentions}
                    onChange={handlePrivacyChange}
                  />
                  <span className="settings-toggle-slider"></span>
                </label>
              </div>
              
              <div className="settings-toggle-container">
                <div className="settings-toggle-label">Show activity status</div>
                <label className="settings-toggle-switch">
                  <input
                    type="checkbox"
                    name="showActivity"
                    checked={privacy.showActivity}
                    onChange={handlePrivacyChange}
                  />
                  <span className="settings-toggle-slider"></span>
                </label>
              </div>
              
              <div className="settings-form-footer">
                <button
                  onClick={handleSavePrivacy}
                  disabled={isSubmitting}
                  className="save-button"
                >
                  {isSubmitting ? 'Saving...' : 'Save Settings'}
                </button>
              </div>
            </div>
          )}
          
          {/* Security Tab */}
          {activeTab === 'security' && (
            <div>
              <h2 className="settings-section-title">Security Settings</h2>
              <p className="settings-section-subtitle">Manage your account security and login settings.</p>
              
              <div>
                <h3 className="settings-label">Change Password</h3>
                
                <div className="settings-form-group">
                  <label className="settings-label">Current Password</label>
                  <input
                    type="password"
                    name="currentPassword"
                    value={passwordData.currentPassword}
                    onChange={handlePasswordChange}
                    className="settings-input"
                    placeholder="Enter your current password"
                  />
                </div>
                
                <div className="settings-form-group">
                  <label className="settings-label">New Password</label>
                  <input
                    type="password"
                    name="newPassword"
                    value={passwordData.newPassword}
                    onChange={handlePasswordChange}
                    className="settings-input"
                    placeholder="Enter new password"
                  />
                  
                  {passwordData.newPassword && (
                    <div className="password-strength-container">
                      <div className="password-strength-bar">
                        <div 
                          className={`password-strength-progress ${
                            passwordStrength.score === 0 ? 'password-strength-very-weak' :
                            passwordStrength.score === 1 ? 'password-strength-weak' :
                            passwordStrength.score === 2 ? 'password-strength-moderate' :
                            passwordStrength.score === 3 ? 'password-strength-strong' :
                            'password-strength-very-strong'
                          }`}
                        ></div>
                      </div>
                      <p className="password-strength-text">{passwordStrength.feedback}</p>
                    </div>
                  )}
                </div>
                
                <div className="settings-form-group">
                  <label className="settings-label">Confirm New Password</label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={passwordData.confirmPassword}
                    onChange={handlePasswordChange}
                    className="settings-input"
                    placeholder="Confirm new password"
                  />
                  
                  {passwordData.newPassword && passwordData.confirmPassword && 
                    passwordData.newPassword !== passwordData.confirmPassword && (
                      <p className="settings-toggle-description" style={{color: '#e03131', marginTop: '5px'}}>
                        Passwords do not match
                      </p>
                    )
                  }
                </div>
                
                <button
                  onClick={handlePasswordSubmit}
                  disabled={
                    isSubmitting || 
                    !passwordData.currentPassword || 
                    !passwordData.newPassword || 
                    !passwordData.confirmPassword ||
                    passwordData.newPassword !== passwordData.confirmPassword
                  }
                  className="save-button"
                >
                  {isSubmitting ? 'Updating...' : 'Update Password'}
                </button>
              </div>
              
              <hr className="settings-divider" />
              
              <h3 className="settings-label">Two-Factor Authentication</h3>
              
              <div className="settings-toggle-container">
                <div>
                  <div className="settings-toggle-label">Enable Two-Factor Authentication</div>
                  <div className="settings-toggle-description">Add an extra layer of security to your account</div>
                </div>
                <label className="settings-toggle-switch">
                  <input
                    type="checkbox"
                    name="twoFactorAuth"
                    checked={security.twoFactorAuth}
                    onChange={handleSecurityChange}
                  />
                  <span className="settings-toggle-slider"></span>
                </label>
              </div>
              
              {security.twoFactorAuth && (
                <div className="settings-info-box">
                  <p className="settings-info-text">
                    To enable two-factor authentication, we'll need to verify your identity.
                    Click the button below to start the setup process.
                  </p>
                  <button className="settings-info-button">
                    Set Up Two-Factor Authentication
                  </button>
                </div>
              )}
              
              <hr className="settings-divider" />
              
              <h3 className="settings-label">Security Settings</h3>
              
              <div className="settings-toggle-container">
                <div>
                  <div className="settings-toggle-label">Login Notifications</div>
                  <div className="settings-toggle-description">Get notified when someone logs into your account</div>
                </div>
                <label className="settings-toggle-switch">
                  <input
                    type="checkbox"
                    name="loginAlerts"
                    checked={security.loginAlerts}
                    onChange={handleSecurityChange}
                  />
                  <span className="settings-toggle-slider"></span>
                </label>
              </div>
              
              <div className="settings-form-group">
                <label className="settings-label">Session Timeout (minutes)</label>
                <select
                  name="sessionTimeout"
                  value={security.sessionTimeout}
                  onChange={handleSecurityChange}
                  className="settings-select"
                >
                  <option value="15">15 minutes</option>
                  <option value="30">30 minutes</option>
                  <option value="60">1 hour</option>
                  <option value="120">2 hours</option>
                  <option value="never">Never</option>
                </select>
              </div>
              
              <div className="settings-form-footer">
                <button
                  onClick={handleSaveSecurity}
                  disabled={isSubmitting}
                  className="save-button"
                >
                  {isSubmitting ? 'Saving...' : 'Save Security Settings'}
                </button>
              </div>
              
              <div className="danger-zone">
                <h3 className="danger-zone-title">Danger Zone</h3>
                <p className="danger-zone-description">
                  Once you delete your account, there is no going back. Please be certain.
                </p>
                <button
                  onClick={handleDeleteAccount}
                  className="delete-account-button"
                >
                  Delete Account
                </button>
              </div>
            </div>
          )}
          
          {/* Preferences Tab */}
          {activeTab === 'preferences' && (
            <div>
              <h2 className="settings-section-title">Preferences</h2>
              <p className="settings-section-subtitle">Customize your experience on the platform.</p>
              
              <div className="settings-form-group">
                <label className="settings-label">Theme</label>
                <select
                  name="theme"
                  value={preferences.theme}
                  onChange={handlePreferenceChange}
                  className="settings-select"
                >
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                  <option value="system">System Default</option>
                </select>
              </div>
              
              <div className="settings-form-group">
                <label className="settings-label">Language</label>
                <select
                  name="language"
                  value={preferences.language}
                  onChange={handlePreferenceChange}
                  className="settings-select"
                >
                  <option value="en">English</option>
                  <option value="es">Spanish</option>
                  <option value="fr">French</option>
                  <option value="de">German</option>
                  <option value="zh">Chinese</option>
                  <option value="ja">Japanese</option>
                </select>
              </div>
              
              <div className="settings-row">
                <div className="settings-form-group">
                  <label className="settings-label">Time Format</label>
                  <select
                    name="timeFormat"
                    value={preferences.timeFormat}
                    onChange={handlePreferenceChange}
                    className="settings-select"
                  >
                    <option value="12h">12-hour (AM/PM)</option>
                    <option value="24h">24-hour</option>
                  </select>
                </div>
                
                <div className="settings-form-group">
                  <label className="settings-label">Date Format</label>
                  <select
                    name="dateFormat"
                    value={preferences.dateFormat}
                    onChange={handlePreferenceChange}
                    className="settings-select"
                  >
                    <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                    <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                    <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                  </select>
                </div>
              </div>
              
              <div className="settings-row">
                <div className="settings-form-group">
                  <label className="settings-label">Timezone</label>
                  <select
                    name="timezone"
                    value={preferences.timezone}
                    onChange={handlePreferenceChange}
                    className="settings-select"
                  >
                    <option value="UTC">UTC</option>
                    <option value="GMT">GMT (London)</option>
                    <option value="EST">EST (New York)</option>
                    <option value="CST">CST (Chicago)</option>
                    <option value="MST">MST (Denver)</option>
                    <option value="PST">PST (Los Angeles)</option>
                    <option value="IST">IST (India)</option>
                    <option value="JST">JST (Tokyo)</option>
                  </select>
                </div>
                
                <div className="settings-form-group">
                  <label className="settings-label">First Day of Week</label>
                  <select
                    name="weekStart"
                    value={preferences.weekStart}
                    onChange={handlePreferenceChange}
                    className="settings-select"
                  >
                    <option value="sunday">Sunday</option>
                    <option value="monday">Monday</option>
                  </select>
                </div>
              </div>
              
              <div className="settings-form-footer">
                <button
                  onClick={handleSavePreferences}
                  disabled={isSubmitting}
                  className="save-button"
                >
                  {isSubmitting ? 'Saving...' : 'Save Preferences'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AccountSettings;