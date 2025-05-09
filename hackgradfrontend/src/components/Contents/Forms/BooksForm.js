//Form for creating Books to sell on platform
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { contentService } from "../../../apiService";
import "../../../styles/CreateContent.css";

const BookForm = ({ currentUser, onSubmit, initialData = {}, isEditing = false }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: "",
    author: "",
    description: "",
    price: "",
    condition: "New", // Default value
    isbn: "",
    publication_year: "",
    image: null,
    imagePreview: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Book condition options
  const bookConditions = [
    "New",
    "Like New",
    "Very Good",
    "Good",
    "Acceptable",
    "Poor"
  ];

  // Initialize form with existing data when editing
  useEffect(() => {
    if (initialData && Object.keys(initialData).length > 0) {
      const extraFields = initialData.extraFields || {};
      
      setFormData({
        title: initialData.title || "",
        author: extraFields.author || "",
        description: extraFields.description || "",
        price: extraFields.price || "",
        condition: extraFields.condition || "New",
        isbn: extraFields.isbn || "",
        publication_year: extraFields.publication_year || "",
        image: null, // Cannot pre-fill the file input
        imagePreview: initialData.image || ""
      });
      
      console.log("Initialized book form with:", {
        title: initialData.title,
        author: extraFields.author,
        description: extraFields.description,
        price: extraFields.price,
        condition: extraFields.condition,
        isbn: extraFields.isbn,
        publication_year: extraFields.publication_year,
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
      setError("Please enter a title for the book.");
      return;
    }
    
    if (!formData.price.trim()) {
      setError("Please provide a price for the book.");
      return;
    }
    
    try {
      setIsSubmitting(true);
      setError(null);
      
      // Create form data for multipart/form-data
      const submitData = new FormData();
      
      if (!isEditing) {
        // Only set content type when creating new content
        submitData.append("contentType", "Books");
      }
      
      submitData.append("title", formData.title);
      submitData.append("visibility", "Public");
      
      // Add all book fields to extraFields
      const extraFields = { 
        author: formData.author,
        description: formData.description,
        price: formData.price,
        condition: formData.condition,
        isbn: formData.isbn,
        publication_year: formData.publication_year
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
      console.error(isEditing ? "Error updating book:" : "Error creating book:", err);
      setError(err.message || `Failed to ${isEditing ? 'update' : 'create'} book listing. Please try again.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="create-content-form">
      <h2>{isEditing ? 'Edit Book Listing' : 'List a Book'}</h2>
      
      {error && (
        <div className="form-error">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="title">Book Title *</label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="Enter the title of the book"
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="author">Author</label>
          <input
            type="text"
            id="author"
            name="author"
            value={formData.author}
            onChange={handleChange}
            placeholder="Author of the book"
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Describe the book, its content, and condition details"
            rows="6"
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="price">Price *</label>
          <input
            type="text"
            id="price"
            name="price"
            value={formData.price}
            onChange={handleChange}
            placeholder="How much are you selling the book for? (e.g. 15.99)"
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="condition">Condition</label>
          <select
            id="condition"
            name="condition"
            value={formData.condition}
            onChange={handleChange}
          >
            {bookConditions.map(condition => (
              <option key={condition} value={condition}>
                {condition}
              </option>
            ))}
          </select>
        </div>
        
        <div className="form-group">
          <label htmlFor="isbn">ISBN</label>
          <input
            type="text"
            id="isbn"
            name="isbn"
            value={formData.isbn}
            onChange={handleChange}
            placeholder="ISBN number (if available)"
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="publication_year">Publication Year</label>
          <input
            type="text"
            id="publication_year"
            name="publication_year"
            value={formData.publication_year}
            onChange={handleChange}
            placeholder="Year the book was published"
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="image">Book Cover Image (max 5MB)</label>
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
              ? (isEditing ? 'Updating...' : 'Listing...') 
              : (isEditing ? 'Update Book' : 'List Book')
            }
          </button>
        </div>
      </form>
    </div>
  );
};

export default BookForm;