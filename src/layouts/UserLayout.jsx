import { useState } from "react";
import { Outlet } from "react-router-dom";

import UserHeader from "../components/UserHeader";
import UserSidebar from "../components/UserSidebar";

import "./UserLayout.css";

function UserLayout() {
  const [isSidebarOpen, setIsSidebarOpen] =
    useState(false);

  const toggleSidebar = () => {
    setIsSidebarOpen(
      (previousState) => !previousState
    );
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  return (
    <div className="user-layout">
      <UserSidebar
        isOpen={isSidebarOpen}
        onClose={closeSidebar}
      />

      {isSidebarOpen && (
        <button
          type="button"
          className="user-sidebar-overlay"
          aria-label="Close sidebar"
          onClick={closeSidebar}
        />
      )}

      <div className="user-main">
        <UserHeader
          onMenuClick={toggleSidebar}
        />

        <main className="user-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default UserLayout;