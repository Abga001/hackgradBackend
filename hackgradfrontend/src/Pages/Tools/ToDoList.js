import React, { useState, useEffect } from 'react';
import '../../styles/TodoList.css'; // Import the CSS file

const SimpleTodoList = () => {
  // List names with defaults
  const defaultLists = [
    { id: 1, name: "Work" },
    { id: 2, name: "Personal" },
    { id: 3, name: "Shopping" }
  ];
  
  // Load lists from localStorage on initial render
  const [lists, setLists] = useState(() => {
    const savedLists = localStorage.getItem('simpleTodoLists');
    return savedLists ? JSON.parse(savedLists) : defaultLists;
  });
  
  // Load tasks from localStorage on initial render
  const [tasks, setTasks] = useState(() => {
    const savedTasks = localStorage.getItem('simpleTodoTasks');
    return savedTasks ? JSON.parse(savedTasks) : [];
  });
  
  const [activeListId, setActiveListId] = useState(() => {
    const savedActiveList = localStorage.getItem('simpleTodoActiveList');
    return savedActiveList ? parseInt(savedActiveList) : 1;
  });
  
  const [newTask, setNewTask] = useState('');
  const [editingListId, setEditingListId] = useState(null);
  const [editingListName, setEditingListName] = useState('');

  // Save to localStorage whenever data changes
  useEffect(() => {
    localStorage.setItem('simpleTodoTasks', JSON.stringify(tasks));
  }, [tasks]);
  
  useEffect(() => {
    localStorage.setItem('simpleTodoLists', JSON.stringify(lists));
  }, [lists]);
  
  useEffect(() => {
    localStorage.setItem('simpleTodoActiveList', activeListId.toString());
  }, [activeListId]);

  // Add a new task
  const addTask = () => {
    if (newTask.trim() === '') return;
    
    const task = {
      id: Date.now(),
      text: newTask,
      completed: false,
      listId: activeListId
    };
    
    setTasks([...tasks, task]);
    setNewTask('');
  };

  // Toggle task completion status
  const toggleComplete = (id) => {
    setTasks(
      tasks.map(task => 
        task.id === id ? { ...task, completed: !task.completed } : task
      )
    );
  };

  // Delete a task
  const deleteTask = (id) => {
    setTasks(tasks.filter(task => task.id !== id));
  };

  // Handle Enter key press in input
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      addTask();
    }
  };
  
  // Start editing list name
  const startEditingList = (list) => {
    setEditingListId(list.id);
    setEditingListName(list.name);
  };
  
  // Save list name
  const saveListName = () => {
    if (editingListName.trim() === '') return;
    
    setLists(
      lists.map(list => 
        list.id === editingListId ? { ...list, name: editingListName } : list
      )
    );
    setEditingListId(null);
  };
  
  // Handle Enter key for list name edit
  const handleListNameKeyPress = (e) => {
    if (e.key === 'Enter') {
      saveListName();
    }
  };
  
  // Get filtered tasks for current list
  const filteredTasks = tasks.filter(task => task.listId === activeListId);
  
  // Get active list name
  const activeListName = lists.find(list => list.id === activeListId)?.name || "Tasks";

  return (
    <div className="todo-container">
      <h1 className="todo-title">Simple To-Do List</h1>
      
      {/* List tabs */}
      <div className="todo-tabs">
        {lists.map(list => (
          <div 
            key={list.id}
            className={`todo-tab ${list.id === activeListId ? 'active' : ''}`}
            onClick={() => list.id !== editingListId && setActiveListId(list.id)}
          >
            {list.id === editingListId ? (
              <input
                type="text"
                value={editingListName}
                onChange={(e) => setEditingListName(e.target.value)}
                onBlur={saveListName}
                onKeyPress={handleListNameKeyPress}
                className="todo-tab-input"
                autoFocus
              />
            ) : (
              <>
                <span>{list.name}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    startEditingList(list);
                  }}
                  className="todo-tab-edit"
                >
                  ✎
                </button>
              </>
            )}
          </div>
        ))}
      </div>
      
      {/* Add task input */}
      <div className="todo-form">
        <input
          type="text"
          className="todo-input"
          placeholder={`Add a task to ${activeListName}...`}
          value={newTask}
          onChange={(e) => setNewTask(e.target.value)}
          onKeyPress={handleKeyPress}
        />
        <button 
          onClick={addTask}
          className="todo-button"
        >
          Add
        </button>
      </div>
      
      {/* Task list */}
      <ul className="todo-list">
        {filteredTasks.length > 0 ? (
          filteredTasks.map(task => (
            <li key={task.id} className="todo-item">
              <input
                type="checkbox"
                checked={task.completed}
                onChange={() => toggleComplete(task.id)}
                className="todo-checkbox"
              />
              <span 
                className={`todo-text ${task.completed ? 'completed' : ''}`}
              >
                {task.text}
              </span>
              <button
                onClick={() => deleteTask(task.id)}
                className="todo-delete"
              >
                ×
              </button>
            </li>
          ))
        ) : (
          <li className="todo-empty">Your {activeListName.toLowerCase()} list is empty</li>
        )}
      </ul>
      
      {/* Footer with count and clear button */}
      {filteredTasks.length > 0 && (
        <div className="todo-footer">
          <div className="todo-count">
            {filteredTasks.filter(task => !task.completed).length} tasks remaining
          </div>
          
          {filteredTasks.some(task => task.completed) && (
            <button
              onClick={() => setTasks(tasks.filter(task => !task.completed || task.listId !== activeListId))}
              className="todo-clear"
            >
              Clear completed
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default SimpleTodoList;