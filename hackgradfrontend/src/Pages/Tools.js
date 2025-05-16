import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faCalculator, 
  faFileWord, 
  faStopwatch, 
  faCalendarAlt,
  faClipboardList, 
  faCog, 
  faMoneyBillWave,
  faBook
} from '@fortawesome/free-solid-svg-icons';

const ToolsUtilitiesPage = () => {
  const navigate = useNavigate();

  // Function to handle navigation to specific tool pages
  const navigateToTool = (toolPath) => {
    navigate(`/tools/${toolPath}`);
  };

  return (
    <div className="p-6">
      <div className="border-l-4 border-red-500 pl-4 mb-6">
        <h1 className="text-xl font-bold">Tools & Utilities</h1>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {/* Pomodoro Timer */}
        <div 
          className="bg-gray-100 p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer flex flex-col items-center justify-center gap-2"
          onClick={() => navigateToTool('pomodoro-timer')}
        >
          <div className="w-10 h-10 flex items-center justify-center text-gray-700">
            <FontAwesomeIcon icon={faStopwatch} className="w-6 h-6" />
          </div>
          <div className="text-center text-sm font-medium">Pomodoro Timer</div>
        </div>

        {/* Calculator */}
        <div 
          className="bg-gray-100 p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer flex flex-col items-center justify-center gap-2"
          onClick={() => navigateToTool('calculator')}
        >
          <div className="w-10 h-10 flex items-center justify-center text-gray-700">
            <FontAwesomeIcon icon={faCalculator} className="w-6 h-6" />
          </div>
          <div className="text-center text-sm font-medium">Calculator</div>
        </div>

        {/* Study Scheduler */}
        <div 
          className="bg-gray-100 p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer flex flex-col items-center justify-center gap-2"
          onClick={() => navigateToTool('study-scheduler')}
        >
          <div className="w-10 h-10 flex items-center justify-center text-gray-700">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
              <path d="M19 3h-4.18C14.4 1.84 13.3 1 12 1c-1.3 0-2.4.84-2.82 2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm-2 14l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z"/>
            </svg>
          </div>
          <div className="text-center text-sm font-medium">Study Scheduler</div>
        </div>

        {/* To-Do List */}
        <div 
          className="bg-gray-100 p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer flex flex-col items-center justify-center gap-2"
          onClick={() => navigateToTool('todo-list')}
        >
          <div className="w-10 h-10 flex items-center justify-center text-gray-700">
            <FontAwesomeIcon icon={faClipboardList} className="w-6 h-6" />
          </div>
          <div className="text-center text-sm font-medium">To-Do List</div>
        </div>

        {/* Calendar */}
        <div 
          className="bg-gray-100 p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer flex flex-col items-center justify-center gap-2"
          onClick={() => navigateToTool('calendar')}
        >
          <div className="w-10 h-10 flex items-center justify-center text-gray-700">
            <FontAwesomeIcon icon={faCalendarAlt} className="w-6 h-6" />
          </div>
          <div className="text-center text-sm font-medium">Calendar</div>
        </div>

        {/* Account Settings */}
        <div 
          className="bg-gray-100 p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer flex flex-col items-center justify-center gap-2"
          onClick={() => navigateToTool('account-settings')}
        >
          <div className="w-10 h-10 flex items-center justify-center text-gray-700">
            <FontAwesomeIcon icon={faCog} className="w-6 h-6" />
          </div>
          <div className="text-center text-sm font-medium">Account Settings</div>
        </div>

        {/* Wage Calculator */}
        <div 
          className="bg-gray-100 p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer flex flex-col items-center justify-center gap-2"
          onClick={() => navigateToTool('wage-calculator')}
        >
          <div className="w-10 h-10 flex items-center justify-center text-gray-700">
            <FontAwesomeIcon icon={faMoneyBillWave} className="w-6 h-6" />
          </div>
          <div className="text-center text-sm font-medium">Wage Calculator</div>
        </div>

        {/* Word Counter */}
        <div 
          className="bg-gray-100 p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer flex flex-col items-center justify-center gap-2"
          onClick={() => navigateToTool('word-counter')}
        >
          <div className="w-10 h-10 flex items-center justify-center text-gray-700">
            <FontAwesomeIcon icon={faFileWord} className="w-6 h-6" />
          </div>
          <div className="text-center text-sm font-medium">Word Counter</div>
        </div>

        {/* Flashcards */}
        <div 
          className="bg-gray-100 p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer flex flex-col items-center justify-center gap-2"
          onClick={() => navigateToTool('flashcards')}
        >
          <div className="w-10 h-10 flex items-center justify-center text-gray-700">
            <FontAwesomeIcon icon={faBook} className="w-6 h-6" />
          </div>
          <div className="text-center text-sm font-medium">Flashcards</div>
        </div>
      </div>
    </div>
  );
};

export default ToolsUtilitiesPage;