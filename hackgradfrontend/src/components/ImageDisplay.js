// components/ImageDisplay.js
import React, { useState } from 'react';

const ImageDisplay = ({ src, alt, className, style, onError }) => {
  const [imgError, setImgError] = useState(false);
  
  // Function to handle image load errors
  const handleImageError = (e) => {
    console.error("Image failed to load:", src);
    setImgError(true);
    
    // Set a default fallback image
    e.target.src = '/default-content.gif';
    
    // Call the parent's onError handler if provided
    if (onError && typeof onError === 'function') {
      onError(e);
    }
  };

  // Normalize the image source URL
  const normalizeImageSrc = (imgSrc) => {
    if (!imgSrc) return '/default-content.gif';
    
    // If it's already a full URL, use it as is
    if (imgSrc.startsWith('http://') || imgSrc.startsWith('https://') || imgSrc.startsWith('data:')) {
      return imgSrc;
    }
    
    // If it's the default image, return it directly
    if (imgSrc === '/default-content.gif') {
      return imgSrc;
    }
    
    // Make sure path starts with /
    if (!imgSrc.startsWith('/')) {
      imgSrc = `/${imgSrc}`;
    }
    
    // Ensure uploads directory is in the path if not already
    if (!imgSrc.includes('/uploads/') && !imgSrc.startsWith('/uploads/')) {
      imgSrc = `/uploads${imgSrc}`;
    }
    
    // For local development, prefix with base URL if needed
    const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:3000';
    
    // Check if the path is already absolute (e.g., starts with baseUrl)
    if (!imgSrc.startsWith(baseUrl)) {
      return `${baseUrl}${imgSrc}`;
    }
    
    return imgSrc;
  };

  // If the image has an error and we're showing the fallback div
  if (imgError) {
    return (
      <div 
        className={`image-fallback ${className || ''}`}
        style={{
          backgroundColor: '#f0f0f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '200px',
          width: '100%',
          color: '#666',
          fontSize: '14px',
          ...style
        }}
      >
        <span>Image unavailable</span>
      </div>
    );
  }

  return (
    <img
      src={normalizeImageSrc(src)}
      alt={alt || "Content image"}
      className={className}
      style={{
        maxWidth: '100%',
        height: 'auto',
        objectFit: 'contain',
        ...style
      }}
      onError={handleImageError}
    />
  );
};

export default ImageDisplay;