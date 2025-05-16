import React, { useState, useEffect } from 'react';
import '../../styles/StudyScheduler.css';

const StudyScheduler = () => {
  // State for courses/subjects
  const [courses, setCourses] = useState([
    { id: 1, name: 'Mathematics', color: '#FF5252', priority: 'High' },
    { id: 2, name: 'Computer Science', color: '#4CAF50', priority: 'Medium' },
    { id: 3, name: 'Physics', color: '#2196F3', priority: 'Low' }
  ]);
  
  // State for study sessions
  const [scheduledSessions, setScheduledSessions] = useState([]);
  
  // State for new course form
  const [newCourse, setNewCourse] = useState({
    name: '',
    color: '#4CAF50',
    priority: 'Medium'
  });
  
  // State for new session form
  const [newSession, setNewSession] = useState({
    courseId: '',
    day: 'Monday',
    startTime: '09:00',
    endTime: '10:30',
    location: '',
    recurring: true
  });
  
  // State for showing course form
  const [showCourseForm, setShowCourseForm] = useState(false);
  
  // Days of the week
  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  
  // Priority options
  const priorityOptions = ['Low', 'Medium', 'High'];
  
  // Sort courses by priority
  const sortedCourses = [...courses].sort((a, b) => {
    const priorityOrder = { 'High': 0, 'Medium': 1, 'Low': 2 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });
  
  // Load data from localStorage on component mount
  useEffect(() => {
    const savedCourses = localStorage.getItem('studySchedulerCourses');
    const savedSessions = localStorage.getItem('studySchedulerSessions');
    
    if (savedCourses) {
      setCourses(JSON.parse(savedCourses));
    }
    
    if (savedSessions) {
      setScheduledSessions(JSON.parse(savedSessions));
    }
  }, []);
  
  // Save data to localStorage when state changes
  useEffect(() => {
    localStorage.setItem('studySchedulerCourses', JSON.stringify(courses));
  }, [courses]);
  
  useEffect(() => {
    localStorage.setItem('studySchedulerSessions', JSON.stringify(scheduledSessions));
  }, [scheduledSessions]);
  
  // Handle course form input changes
  const handleCourseInputChange = (e) => {
    const { name, value } = e.target;
    setNewCourse({
      ...newCourse,
      [name]: value
    });
  };
  
  // Handle session form input changes
  const handleSessionInputChange = (e) => {
    const { name, value } = e.target;
    setNewSession({
      ...newSession,
      [name]: name === 'recurring' ? e.target.checked : value
    });
  };
  
  // Add a new course
  const handleAddCourse = (e) => {
    if (e) e.preventDefault();
    
    if (!newCourse.name.trim()) return;
    
    const newCourseId = courses.length > 0 ? Math.max(...courses.map(c => c.id)) + 1 : 1;
    
    setCourses([
      ...courses,
      {
        id: newCourseId,
        name: newCourse.name,
        color: newCourse.color,
        priority: newCourse.priority
      }
    ]);
    
    // Reset form
    setNewCourse({
      name: '',
      color: '#4CAF50',
      priority: 'Medium'
    });
    
    setShowCourseForm(false);
  };
  
  // Add a new study session
  const handleAddSession = (e) => {
    if (e) e.preventDefault();
    
    if (!newSession.courseId || !newSession.startTime || !newSession.endTime) return;
    
    const newSessionId = scheduledSessions.length > 0 
      ? Math.max(...scheduledSessions.map(s => s.id)) + 1 
      : 1;
    
    setScheduledSessions([
      ...scheduledSessions,
      {
        id: newSessionId,
        courseId: parseInt(newSession.courseId),
        day: newSession.day,
        startTime: newSession.startTime,
        endTime: newSession.endTime,
        location: newSession.location,
        recurring: newSession.recurring
      }
    ]);
    
    // Reset form but keep selected course
    setNewSession({
      ...newSession,
      startTime: '09:00',
      endTime: '10:30',
      location: ''
    });
  };
  
  // Delete a course
  const handleDeleteCourse = (courseId) => {
    // Delete course
    setCourses(courses.filter(course => course.id !== courseId));
    
    // Delete associated sessions
    setScheduledSessions(scheduledSessions.filter(session => session.courseId !== courseId));
  };
  
  // Delete a session
  const handleDeleteSession = (sessionId) => {
    setScheduledSessions(scheduledSessions.filter(session => session.id !== sessionId));
  };
  
  // Get course by ID
  const getCourseById = (courseId) => {
    return courses.find(course => course.id === courseId) || { name: 'Unknown', color: '#CCCCCC' };
  };
  
  // Sessions organized by day
  const sessionsByDay = daysOfWeek.map(day => {
    return {
      day,
      sessions: scheduledSessions
        .filter(session => session.day === day)
        .sort((a, b) => a.startTime.localeCompare(b.startTime))
    };
  });
  
  // Format time (24h to 12h)
  const formatTime = (time24h) => {
    const [hours, minutes] = time24h.split(':');
    const hour = parseInt(hours);
    const period = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${period}`;
  };
  
  return (
    <div className="study-scheduler">
      <h1>Study Scheduler</h1>
      
      <div className="grid-container">
        {/* Courses Section */}
        <div className="course-section">
          <div className="section-header">
            <h2 className="section-title">My Courses</h2>
            <button 
              className="add-button"
              onClick={() => setShowCourseForm(!showCourseForm)}
            >
              {showCourseForm ? 'Cancel' : '+ Add Course'}
            </button>
          </div>
          
          {/* Course Form */}
          {showCourseForm && (
            <div className="form-container">
              <div className="form-group">
                <label className="form-label">Course Name*</label>
                <input
                  type="text"
                  name="name"
                  value={newCourse.name}
                  onChange={handleCourseInputChange}
                  className="form-input"
                  required
                />
              </div>
              
              <div className="form-group">
                <label className="form-label">Color</label>
                <div className="color-picker-container">
                  <input
                    type="color"
                    name="color"
                    value={newCourse.color}
                    onChange={handleCourseInputChange}
                    className="form-input"
                  />
                  <span className="color-value">{newCourse.color}</span>
                </div>
              </div>
              
              <div className="form-group">
                <label className="form-label">Priority</label>
                <select
                  name="priority"
                  value={newCourse.priority}
                  onChange={handleCourseInputChange}
                  className="form-select"
                >
                  {priorityOptions.map(priority => (
                    <option key={priority} value={priority}>{priority}</option>
                  ))}
                </select>
              </div>
              
              <button 
                onClick={handleAddCourse}
                className="submit-button"
              >
                Add Course
              </button>
            </div>
          )}
          
          {/* Course List */}
          {sortedCourses.length > 0 ? (
            <div className="course-list">
              {sortedCourses.map(course => (
                <div 
                  key={course.id} 
                  className="course-item"
                  style={{ backgroundColor: `${course.color}20` }}
                >
                  <div className="course-name-container">
                    <div 
                      className="course-color-indicator" 
                      style={{ backgroundColor: course.color }}
                    ></div>
                    <span>{course.name}</span>
                  </div>
                  
                  <div className="course-actions">
                    <span className="priority-badge">{course.priority}</span>
                    <button 
                      onClick={() => handleDeleteCourse(course.id)}
                      className="delete-button"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="empty-message">No courses added yet</p>
          )}
          
          {/* Session Form */}
          <div className="form-section">
            <h2 className="section-title">Schedule New Session</h2>
            
            <div className="form-content">
              <div className="form-group">
                <label className="form-label">Course*</label>
                <select
                  name="courseId"
                  value={newSession.courseId}
                  onChange={handleSessionInputChange}
                  className="form-select"
                  required
                >
                  <option value="">Select a course</option>
                  {courses.map(course => (
                    <option key={course.id} value={course.id}>
                      {course.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="form-group">
                <label className="form-label">Day</label>
                <select
                  name="day"
                  value={newSession.day}
                  onChange={handleSessionInputChange}
                  className="form-select"
                >
                  {daysOfWeek.map(day => (
                    <option key={day} value={day}>{day}</option>
                  ))}
                </select>
              </div>
              
              <div className="form-time-container">
                <div className="form-group">
                  <label className="form-label">Start Time*</label>
                  <input
                    type="time"
                    name="startTime"
                    value={newSession.startTime}
                    onChange={handleSessionInputChange}
                    className="form-input"
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">End Time*</label>
                  <input
                    type="time"
                    name="endTime"
                    value={newSession.endTime}
                    onChange={handleSessionInputChange}
                    className="form-input"
                    required
                  />
                </div>
              </div>
              
              <div className="form-group">
                <label className="form-label">Location</label>
                <input
                  type="text"
                  name="location"
                  value={newSession.location}
                  onChange={handleSessionInputChange}
                  placeholder="e.g., Library, Room 101"
                  className="form-input"
                />
              </div>
              
              <div className="form-checkbox-container">
                <input
                  type="checkbox"
                  id="recurring"
                  name="recurring"
                  checked={newSession.recurring}
                  onChange={handleSessionInputChange}
                  className="form-checkbox"
                />
                <label htmlFor="recurring">Weekly recurring</label>
              </div>
              
              <button 
                onClick={handleAddSession}
                className="session-submit-button"
                disabled={courses.length === 0}
              >
                Add to Schedule
              </button>
              
              {courses.length === 0 && (
                <p className="error-text">Please add a course first</p>
              )}
            </div>
          </div>
        </div>
        
        {/* Schedule Section */}
        <div className="schedule-container">
          <div className="schedule-section">
            <h2 className="section-title">Weekly Schedule</h2>
            
            <div className="days-grid">
              {sessionsByDay.map(({ day, sessions }) => (
                <div key={day} className="day-card">
                  <h3 className="day-title">{day}</h3>
                  
                  {sessions.length > 0 ? (
                    <div className="sessions-container">
                      {sessions.map(session => {
                        const course = getCourseById(session.courseId);
                        return (
                          <div 
                            key={session.id} 
                            className="session-card"
                            style={{ backgroundColor: `${course.color}20` }}
                          >
                            <div className="session-title" style={{ color: course.color }}>
                              {course.name}
                            </div>
                            
                            <div className="session-time">
                              {formatTime(session.startTime)} - {formatTime(session.endTime)}
                            </div>
                            
                            {session.location && (
                              <div className="session-location">
                                📍 {session.location}
                              </div>
                            )}
                            
                            <div className="session-footer">
                              {session.recurring && (
                                <span className="recurring-badge">Recurring</span>
                              )}
                              
                              <button 
                                onClick={() => handleDeleteSession(session.id)}
                                className="remove-button"
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="no-sessions">No sessions</p>
                  )}
                </div>
              ))}
            </div>
            
            {scheduledSessions.length === 0 && (
              <div className="empty-schedule">
                <p className="empty-title">No study sessions scheduled yet</p>
                <p className="empty-subtitle">
                  Add courses and schedule study sessions to see them here
                </p>
              </div>
            )}
          </div>
          
          {/* Weekly Summary */}
          {scheduledSessions.length > 0 && (
            <div className="summary-section">
              <h2 className="section-title">Weekly Summary</h2>
              
              <div className="summary-grid">
                {courses.map(course => {
                  const courseSessionsFiltered = scheduledSessions.filter(session => session.courseId === course.id);
                  
                  // Skip if no sessions for this course
                  if (courseSessionsFiltered.length === 0) return null;
                  
                  // Calculate total hours
                  const totalMinutes = courseSessionsFiltered.reduce((total, session) => {
                    const start = new Date(`2000-01-01T${session.startTime}`);
                    const end = new Date(`2000-01-01T${session.endTime}`);
                    const diffMs = end - start;
                    const diffMinutes = diffMs / (1000 * 60);
                    return total + diffMinutes;
                  }, 0);
                  
                  const hours = Math.floor(totalMinutes / 60);
                  const minutes = Math.round(totalMinutes % 60);
                  
                  return (
                    <div 
                      key={course.id} 
                      className="summary-card"
                      style={{ backgroundColor: `${course.color}15` }}
                    >
                      <div className="summary-header">
                        <div 
                          className="summary-color" 
                          style={{ backgroundColor: course.color }}
                        ></div>
                        <h3 className="summary-title">{course.name}</h3>
                      </div>
                      
                      <div className="summary-content">
                        <p className="summary-hours">
                          {hours}h {minutes > 0 ? `${minutes}m` : ''}
                        </p>
                        <p className="summary-sessions">
                          {courseSessionsFiltered.length} session{courseSessionsFiltered.length !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                  );
                }).filter(Boolean)}
                
                {/* Total hours */}
                <div className="total-card">
                  <h3 className="summary-title">Total Study Time</h3>
                  
                  <div className="summary-content">
                    {(() => {
                      const totalMinutes = scheduledSessions.reduce((total, session) => {
                        const start = new Date(`2000-01-01T${session.startTime}`);
                        const end = new Date(`2000-01-01T${session.endTime}`);
                        const diffMs = end - start;
                        const diffMinutes = diffMs / (1000 * 60);
                        return total + diffMinutes;
                      }, 0);
                      
                      const hours = Math.floor(totalMinutes / 60);
                      const minutes = Math.round(totalMinutes % 60);
                      
                      return (
                        <>
                          <p className="summary-hours">
                            {hours}h {minutes > 0 ? `${minutes}m` : ''}
                          </p>
                          <p className="summary-sessions">
                            {scheduledSessions.length} session{scheduledSessions.length !== 1 ? 's' : ''}
                          </p>
                        </>
                      );
                    })()}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudyScheduler;