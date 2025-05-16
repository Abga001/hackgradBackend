import React, { useState, useEffect } from 'react';
import '../../styles/Calendar.css';

const Calendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [currentView, setCurrentView] = useState('month'); // month, week, day
  const [events, setEvents] = useState([]);
  const [showEventModal, setShowEventModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showYearSelector, setShowYearSelector] = useState(false); // For year selector dropdown
  
  // New event form state
  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    startDate: '',
    startTime: '09:00',
    endDate: '',
    endTime: '10:00',
    color: '#4285F4',
    allDay: false
  });

  // Event categories with colors
  const eventColors = [
    { name: 'Default', color: '#4285F4' }, // Blue
    { name: 'Work', color: '#0F9D58' },    // Green
    { name: 'Personal', color: '#F4B400' }, // Yellow
    { name: 'Important', color: '#DB4437' }, // Red
    { name: 'Travel', color: '#9C27B0' },   // Purple
    { name: 'Meeting', color: '#795548' }   // Brown
  ];
  
  // Load events from localStorage on component mount
  useEffect(() => {
    const savedEvents = localStorage.getItem('calendarEvents');
    if (savedEvents) {
      try {
        setEvents(JSON.parse(savedEvents));
      } catch (e) {
        console.error('Error parsing events from localStorage:', e);
      }
    } else {
      // Add a few sample events if there are none
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const sampleEvents = [
        {
          id: 1,
          title: 'Team Meeting',
          description: 'Weekly team sync',
          startDate: today.toISOString().split('T')[0],
          startTime: '10:00',
          endDate: today.toISOString().split('T')[0],
          endTime: '11:00',
          color: '#4285F4',
          allDay: false
        },
        {
          id: 2,
          title: 'Project Deadline',
          description: 'Submit final project deliverables',
          startDate: tomorrow.toISOString().split('T')[0],
          startTime: '09:00',
          endDate: tomorrow.toISOString().split('T')[0],
          endTime: '17:00',
          color: '#DB4437',
          allDay: true
        }
      ];
      
      setEvents(sampleEvents);
      localStorage.setItem('calendarEvents', JSON.stringify(sampleEvents));
    }
  }, []);
  
  // Save events to localStorage when they change
  useEffect(() => {
    localStorage.setItem('calendarEvents', JSON.stringify(events));
  }, [events]);
  
  // Initialize form when opening for a new event
  useEffect(() => {
    if (selectedDate && showEventModal && !selectedEvent) {
      const formattedDate = selectedDate.toISOString().split('T')[0];
      setNewEvent({
        ...newEvent,
        startDate: formattedDate,
        endDate: formattedDate
      });
    }
  }, [selectedDate, showEventModal, selectedEvent]);
  
  // Initialize form when editing an existing event
  useEffect(() => {
    if (selectedEvent && showEventModal) {
      setNewEvent({
        title: selectedEvent.title,
        description: selectedEvent.description || '',
        startDate: selectedEvent.startDate,
        startTime: selectedEvent.startTime,
        endDate: selectedEvent.endDate,
        endTime: selectedEvent.endTime,
        color: selectedEvent.color,
        allDay: selectedEvent.allDay
      });
    }
  }, [selectedEvent, showEventModal]);
  
  // Calendar navigation functions
  const goToPreviousMonth = () => {
    setCurrentDate(prevDate => {
      const newDate = new Date(prevDate);
      newDate.setMonth(newDate.getMonth() - 1);
      return newDate;
    });
  };
  
  const goToNextMonth = () => {
    setCurrentDate(prevDate => {
      const newDate = new Date(prevDate);
      newDate.setMonth(newDate.getMonth() + 1);
      return newDate;
    });
  };
  
  const goToPreviousYear = () => {
    setCurrentDate(prevDate => {
      const newDate = new Date(prevDate);
      newDate.setFullYear(newDate.getFullYear() - 1);
      return newDate;
    });
  };
  
  const goToNextYear = () => {
    setCurrentDate(prevDate => {
      const newDate = new Date(prevDate);
      newDate.setFullYear(newDate.getFullYear() + 1);
      return newDate;
    });
  };
  
  const goToToday = () => {
    setCurrentDate(new Date());
  };
  
  // Handle opening the event modal for a new event
  const handleDateClick = (date) => {
    setSelectedDate(date);
    setSelectedEvent(null);
    setShowEventModal(true);
  };
  
  // Handle opening the event modal for an existing event
  const handleEventClick = (event, e) => {
    e.stopPropagation();
    setSelectedEvent(event);
    setShowEventModal(true);
  };
  
  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setNewEvent({
      ...newEvent,
      [name]: type === 'checkbox' ? checked : value
    });
  };
  
  // Add or update an event
  const handleSaveEvent = () => {
    const eventData = {
      title: newEvent.title,
      description: newEvent.description,
      startDate: newEvent.startDate,
      startTime: newEvent.startTime,
      endDate: newEvent.endDate || newEvent.startDate,
      endTime: newEvent.endTime,
      color: newEvent.color,
      allDay: newEvent.allDay
    };
    
    if (selectedEvent) {
      // Update existing event
      setEvents(events.map(event => 
        event.id === selectedEvent.id ? { ...eventData, id: event.id } : event
      ));
    } else {
      // Add new event
      const newId = events.length > 0 ? Math.max(...events.map(e => e.id)) + 1 : 1;
      setEvents([...events, { ...eventData, id: newId }]);
    }
    
    // Close modal and reset form
    handleCloseModal();
  };
  
  // Delete an event
  const handleDeleteEvent = () => {
    if (selectedEvent) {
      setEvents(events.filter(event => event.id !== selectedEvent.id));
      handleCloseModal();
    }
  };
  
  // Close the event modal
  const handleCloseModal = () => {
    setShowEventModal(false);
    setSelectedEvent(null);
    setNewEvent({
      title: '',
      description: '',
      startDate: '',
      startTime: '09:00',
      endDate: '',
      endTime: '10:00',
      color: '#4285F4',
      allDay: false
    });
  };
  
  // Generate the days for the current month's calendar
  const generateMonthCalendar = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    // First day of the month
    const firstDayOfMonth = new Date(year, month, 1);
    
    // Last day of the month
    const lastDayOfMonth = new Date(year, month + 1, 0);
    
    // Days in the month
    const daysInMonth = lastDayOfMonth.getDate();
    
    // Day of the week for the first day (0 = Sunday, 1 = Monday, etc.)
    const firstDayOfWeek = firstDayOfMonth.getDay();
    
    // Calculate how many days from the previous month to show
    const daysFromPrevMonth = firstDayOfWeek;
    
    // Calculate the days from the next month to fill out the calendar grid
    const totalCalendarDays = 42; // 6 rows of 7 days
    const daysFromNextMonth = totalCalendarDays - daysInMonth - daysFromPrevMonth;
    
    // Create calendar days array
    const calendarDays = [];
    
    // Previous month's days
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = prevMonthLastDay - daysFromPrevMonth + 1; i <= prevMonthLastDay; i++) {
      const date = new Date(year, month - 1, i);
      calendarDays.push({
        date,
        day: i,
        isCurrentMonth: false,
        isPrevMonth: true
      });
    }
    
    // Current month's days
    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(year, month, i);
      calendarDays.push({
        date,
        day: i,
        isCurrentMonth: true,
        isToday: isToday(date)
      });
    }
    
    // Next month's days
    for (let i = 1; i <= daysFromNextMonth; i++) {
      const date = new Date(year, month + 1, i);
      calendarDays.push({
        date,
        day: i,
        isCurrentMonth: false,
        isNextMonth: true
      });
    }
    
    return calendarDays;
  };
  
  // Check if a date is today
  const isToday = (date) => {
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
  };
  
  // Get events for a specific date
  const getEventsForDate = (date) => {
    const dateString = date.toISOString().split('T')[0];
    return events.filter(event => {
      // Create Date objects for proper comparison
      const eventStart = new Date(`${event.startDate}T00:00:00`);
      const eventEnd = new Date(`${event.endDate}T23:59:59`);
      const checkDate = new Date(`${dateString}T12:00:00`);
      
      // Check if the date is within the event's date range
      return checkDate >= eventStart && checkDate <= eventEnd;
    });
  };
  
  // Format dates for display
  const formatDate = (dateString, includeYear = false) => {
    if (!dateString) return '';
    
    const options = {
      month: 'short',
      day: 'numeric',
      year: includeYear ? 'numeric' : undefined
    };
    
    return new Date(dateString).toLocaleDateString('en-US', options);
  };
  
  // Format time for display
  const formatTime = (timeString) => {
    if (!timeString) return '';
    
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const period = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    
    return `${hour12}:${minutes} ${period}`;
  };
  
  // Generate an array of years for the year selector
  const generateYearOptions = () => {
    const currentYear = new Date().getFullYear();
    const startYear = currentYear - 5;
    const endYear = currentYear + 6;
    
    return Array.from({ length: endYear - startYear }, (_, i) => startYear + i);
  };
  
  return (
    <div className="calendar-container">
      {/* Calendar Header with Year Display */}
      <div className="calendar-header">
        <div className="calendar-title">
          <h2>{currentDate.toLocaleDateString('en-US', { month: 'long' })} {currentDate.getFullYear()}</h2>
          
          {/* Year selector dropdown */}
          <div className="year-selector">
            <div 
              className="year-display"
              onClick={() => setShowYearSelector(prev => !prev)}
            >
              <span>{currentDate.getFullYear()}</span>
              <span>▼</span>
            </div>
            
            {showYearSelector && (
              <div className="year-popover">
                {generateYearOptions().map(year => (
                  <div 
                    key={year}
                    className={`year-option ${currentDate.getFullYear() === year ? 'active' : ''}`}
                    onClick={() => {
                      const newDate = new Date(currentDate);
                      newDate.setFullYear(year);
                      setCurrentDate(newDate);
                      setShowYearSelector(false);
                    }}
                  >
                    {year}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        
        <div className="nav-buttons">
          <button 
            onClick={goToPreviousMonth}
            className="nav-button"
            aria-label="Previous Month"
          >
            &lt;
          </button>
          
          <button 
            onClick={goToToday}
            className="today-button"
          >
            Today
          </button>
          
          <button 
            onClick={goToNextMonth}
            className="nav-button"
            aria-label="Next Month"
          >
            &gt;
          </button>
        </div>
        
        <div className="view-switcher">
          <button 
            onClick={() => setCurrentView('month')}
            className={`view-button ${currentView === 'month' ? 'active' : ''}`}
          >
            Month
          </button>
          
          <button 
            onClick={() => setCurrentView('week')}
            className={`view-button ${currentView === 'week' ? 'active' : ''}`}
          >
            Week
          </button>
          
          <button 
            onClick={() => setCurrentView('day')}
            className={`view-button ${currentView === 'day' ? 'active' : ''}`}
          >
            Day
          </button>
        </div>
      </div>
      
      {/* Month View */}
      {currentView === 'month' && (
        <div className="calendar-grid">
          {/* Day names header */}
          <div className="weekdays-header">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="weekday">
                {day}
              </div>
            ))}
          </div>
          
          {/* Calendar grid */}
          <div className="days-grid">
            {generateMonthCalendar().map((day, index) => {
              const dayEvents = getEventsForDate(day.date);
              
              return (
                <div 
                  key={index} 
                  className={`calendar-day ${
                    day.isCurrentMonth ? '' : 'other-month'
                  } ${day.isToday ? 'today' : ''}`}
                  onClick={() => handleDateClick(day.date)}
                >
                  <div className="day-number">
                    {day.day}
                  </div>
                  
                  <div className="day-events">
                    {dayEvents.slice(0, 3).map(event => (
                      <div
                        key={event.id}
                        className="event-chip"
                        style={{ 
                          backgroundColor: `${event.color}20`, 
                          color: event.color,
                          borderLeft: `3px solid ${event.color}`
                        }}
                        onClick={(e) => handleEventClick(event, e)}
                      >
                        {event.allDay ? '🔄 ' : '🕒 '}
                        {event.title}
                      </div>
                    ))}
                    
                    {dayEvents.length > 3 && (
                      <div className="more-events">
                        +{dayEvents.length - 3} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
      
      {/* Week View - Simple Implementation */}
      {currentView === 'week' && (
        <div className="calendar-grid">
          <div className="weekdays-header">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="weekday">
                {day}
              </div>
            ))}
          </div>
          <div className="text-center p-8">
            <h3 className="text-lg font-medium">Week View Coming Soon</h3>
            <p className="text-gray-500">Please use the Month or Day view for now.</p>
          </div>
        </div>
      )}
      
      {/* Day View - Simple Implementation */}
      {currentView === 'day' && (
        <div className="calendar-grid">
          <div className="text-center p-8">
            <h3 className="text-lg font-medium">Day View Coming Soon</h3>
            <p className="text-gray-500">Please use the Month view for now.</p>
          </div>
        </div>
      )}
      
      {/* Event Summary */}
      <div className="events-list-section">
        <h2 className="events-list-header">Upcoming Events</h2>
        
        {events
          .filter(event => {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const eventStart = new Date(`${event.startDate}T00:00:00`);
            return eventStart >= today;
          })
          .sort((a, b) => {
            const dateA = new Date(`${a.startDate}T${a.startTime}`);
            const dateB = new Date(`${b.startDate}T${b.startTime}`);
            return dateA - dateB;
          })
          .slice(0, 5)
          .map(event => (
            <div 
              key={event.id}
              className="event-item"
              onClick={() => {
                setSelectedEvent(event);
                setShowEventModal(true);
              }}
            >
              <div 
                className="event-color"
                style={{ backgroundColor: event.color }}
              ></div>
              
              <div className="event-content">
                <div className="event-title">{event.title}</div>
                
                <div className="event-details">
                  <div className="event-time">
                    {event.allDay ? (
                      'All day'
                    ) : (
                      `${formatTime(event.startTime)} - ${formatTime(event.endTime)}`
                    )}
                  </div>
                  
                  <div className="event-date">
                    {formatDate(event.startDate, true)}
                  </div>
                </div>
                
                {event.description && (
                  <div className="event-description">{event.description}</div>
                )}
              </div>
            </div>
          ))}
        
        {events.filter(event => {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const eventStart = new Date(`${event.startDate}T00:00:00`);
          return eventStart >= today;
        }).length === 0 && (
          <div className="no-events">No upcoming events</div>
        )}
      </div>
      
      {/* Event Modal */}
      {showEventModal && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2 className="modal-header">
              {selectedEvent ? 'Edit Event' : 'Add New Event'}
            </h2>
            
            <div className="form-group">
              <label className="form-label">Event Title*</label>
              <input
                type="text"
                name="title"
                value={newEvent.title}
                onChange={handleInputChange}
                className="form-input"
                placeholder="Add title"
                required
              />
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Start Date*</label>
                <input
                  type="date"
                  name="startDate"
                  value={newEvent.startDate}
                  onChange={handleInputChange}
                  className="form-input"
                  required
                />
              </div>
              
              <div className="form-group">
                <label className="form-label">End Date</label>
                <input
                  type="date"
                  name="endDate"
                  value={newEvent.endDate || newEvent.startDate}
                  onChange={handleInputChange}
                  className="form-input"
                  min={newEvent.startDate}
                />
              </div>
            </div>
            
            <div className="form-checkbox">
              <input
                type="checkbox"
                id="allDay"
                name="allDay"
                checked={newEvent.allDay}
                onChange={handleInputChange}
              />
              <label htmlFor="allDay">All Day Event</label>
            </div>
            
            {!newEvent.allDay && (
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Start Time</label>
                  <input
                    type="time"
                    name="startTime"
                    value={newEvent.startTime}
                    onChange={handleInputChange}
                    className="form-input"
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">End Time</label>
                  <input
                    type="time"
                    name="endTime"
                    value={newEvent.endTime}
                    onChange={handleInputChange}
                    className="form-input"
                  />
                </div>
              </div>
            )}
            
            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea
                name="description"
                value={newEvent.description}
                onChange={handleInputChange}
                className="form-input"
                rows="3"
                placeholder="Add description (optional)"
              ></textarea>
            </div>
            
            <div className="form-group">
              <label className="form-label">Event Color</label>
              <div className="color-picker-container">
                <input
                  type="color"
                  name="color"
                  value={newEvent.color}
                  onChange={handleInputChange}
                  className="color-input"
                />
                
                <div className="color-options">
                  {eventColors.map(colorOption => (
                    <div
                      key={colorOption.color}
                      className="color-option"
                      style={{ backgroundColor: colorOption.color }}
                      onClick={() => setNewEvent({ ...newEvent, color: colorOption.color })}
                      title={colorOption.name}
                    ></div>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="modal-actions">
              <div>
                {selectedEvent && (
                  <button
                    onClick={handleDeleteEvent}
                    className="delete-button"
                  >
                    Delete
                  </button>
                )}
              </div>
              
              <div className="action-buttons">
                <button
                  onClick={handleCloseModal}
                  className="cancel-button"
                >
                  Cancel
                </button>
                
                <button
                  onClick={handleSaveEvent}
                  className="save-button"
                  disabled={!newEvent.title || !newEvent.startDate}
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Calendar;