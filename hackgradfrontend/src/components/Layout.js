//Component for organizing general Layout
import React from 'react';
import { Outlet } from 'react-router-dom';
import LeftSidebar from './Sidebar/LeftSidebar';
import RightSidebar from './Sidebar/RightSidebar';

import '../styles/layout.css'; 

const Layout = () => {
  return (
    <div className="layout">
      <div className="left-sidebar">
        <LeftSidebar />
      </div>

      <div className="center-content">


        <div className="main-content">
          <Outlet />
        </div>
      </div>

      <div className="right-sidebar">
        <RightSidebar />
      </div>
    </div>
  );
};

export default Layout;