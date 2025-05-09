//Base skeleton form to create different types of content
import React, { useState, useContext, useEffect } from "react";
import { UserContext, ModalContext } from "../../App";
import { Navigate, useNavigate } from "react-router-dom";
import { contentService } from "../../apiService";
import PostForm from "./Forms/PostForm";
import ProjectForm from "./Forms/ProjectForm";
import JobForm from "./Forms/JobForm";
import TutorialForm from "./Forms/TutorialForm";
import EventForm from "./Forms/EventForm";
import BooksForm from "./Forms/BooksForm";
import QuestionForm from "./Forms/QuestionForm";
import "../../styles/CreateContent.css";

const FixedCreateContent = ({ initialContentType = null, isModal = false }) => {
  const { currentUser } = useContext(UserContext);
  const { closeCreateModal } = useContext(ModalContext);
  const navigate = useNavigate();
  const [selectedType, setSelectedType] = useState(initialContentType || "Post");
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [submissionError, setSubmissionError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Update content type if prop changes
  useEffect(() => {
    if (initialContentType && initialContentType !== selectedType) {
      setSelectedType(initialContentType);
    }
  }, [initialContentType]);

  // If not logged in and not modal, redirect
  if (!currentUser && !isModal) {
    return <Navigate to="/login" />;
  }

  // Handler for successful form submission
  const handleFormSubmit = async (formData) => {
    setIsSubmitting(true);
    setSubmissionError(null);
    
    console.log("Submitting form data:", Object.fromEntries(formData.entries()));
    
    try {
      // Actually submit the form data to the API
      const response = await contentService.createContent(formData);
      
      console.log("API Response:", response);
      
      if (response && (response.saved || response.message === "Content created")) {
        // Show success message
        setFormSubmitted(true);
        
        // If in modal mode, close the modal after form submission
        if (isModal && closeCreateModal) {
          setTimeout(() => {
            closeCreateModal();
          }, 1500);
        } else {
          // If not in modal mode, navigate back to dashboard
          setTimeout(() => {
            navigate('/');
          }, 1500);
        }
      } else {
        // Handle other success scenarios
        setFormSubmitted(true);
        setTimeout(() => {
          if (isModal && closeCreateModal) {
            closeCreateModal();
          } else {
            navigate('/');
          }
        }, 1500);
      }
    } catch (error) {
      console.error("Error submitting content:", error);
      setSubmissionError(error.message || "Failed to create content. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Render the appropriate form based on content type
  const renderForm = () => {
    // Pass both the current user and onSubmit handler
    const formProps = { 
      currentUser,
      onSubmit: handleFormSubmit, 
      isModal,
      isSubmitting
    };

    switch (selectedType) {
      case "Post":
        return <PostForm {...formProps} />;
      case "Project":
        return <ProjectForm {...formProps} />;
      case "Job":
        return <JobForm {...formProps} />;
      case "Tutorial":
        return <TutorialForm {...formProps} />;
      case "Event":
        return <EventForm {...formProps} />;
      case "Books":
        return <BooksForm {...formProps} />;
      case "Question":
        return <QuestionForm {...formProps} />;
      default:
        return <PostForm {...formProps} />;
    }
  };

  // Success message after submission
  const renderSuccessMessage = () => (
    <div className="success-message">
      <div className="success-icon">✓</div>
      <h3>Content Created Successfully!</h3>
      <p>You'll be redirected to the dashboard momentarily...</p>
    </div>
  );
  
  // Error message
  const renderErrorMessage = () => (
    <div className="error-message">
      <div className="error-icon">⚠</div>
      <h3>Error Creating Content</h3>
      <p>{submissionError}</p>
      <button 
        onClick={() => setSubmissionError(null)}
        className="try-again-button"
      >
        Try Again
      </button>
    </div>
  );

  return (
    <div className={`create-content-container ${isModal ? 'in-modal' : ''}`}>
      {formSubmitted ? (
        renderSuccessMessage()
      ) : submissionError ? (
        renderErrorMessage()
      ) : (
        <>
          <div className="content-type-selector">
            {!isModal && <h2>Create New Content</h2>}
            <p>Select the type of content you want to create:</p>

            <div className="type-buttons">
              <button
                className={selectedType === "Post" ? "active" : ""}
                onClick={() => setSelectedType("Post")}
              >
                Post
              </button>
              <button
                className={selectedType === "Project" ? "active" : ""}
                onClick={() => setSelectedType("Project")}
              >
                Project
              </button>
              <button
                className={selectedType === "Job" ? "active" : ""}
                onClick={() => setSelectedType("Job")}
              >
                Job
              </button>
              <button
                className={selectedType === "Tutorial" ? "active" : ""}
                onClick={() => setSelectedType("Tutorial")}
              >
                Tutorial
              </button>
              <button
                className={selectedType === "Event" ? "active" : ""}
                onClick={() => setSelectedType("Event")}
              >
                Event
              </button>
              <button
                className={selectedType === "Books" ? "active" : ""}
                onClick={() => setSelectedType("Books")}
              >
                Books
              </button>
              <button
                className={selectedType === "Question" ? "active" : ""}
                onClick={() => setSelectedType("Question")}
              >
                Question
              </button>
            </div>
          </div>



          {renderForm()}
        </>
      )}
    </div>
  );
};

export default FixedCreateContent;