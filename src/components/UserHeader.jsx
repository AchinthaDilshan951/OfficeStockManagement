import {
  useEffect,
  useState,
} from "react";

import authService from "../services/authService";

import "./UserHeader.css";

function UserHeader({
  onMenuClick,
}) {
  const [
    currentUser,
    setCurrentUser,
  ] = useState(
    authService.getCurrentUser()
  );

  useEffect(() => {
    const updateHeaderUser =
      () => {
        setCurrentUser(
          authService.getCurrentUser()
        );
      };

    window.addEventListener(
      "userUpdated",
      updateHeaderUser
    );

    window.addEventListener(
      "storage",
      updateHeaderUser
    );

    return () => {
      window.removeEventListener(
        "userUpdated",
        updateHeaderUser
      );

      window.removeEventListener(
        "storage",
        updateHeaderUser
      );
    };
  }, []);

  const fullName =
    currentUser?.full_name ??
    currentUser?.fullName ??
    currentUser?.name ??
    "User";

  const role =
    currentUser?.role === "User"
      ? "Employee"
      : currentUser?.role ||
        "Employee";

  const getInitials = (
    name
  ) => {
    const words = String(
      name || ""
    )
      .trim()
      .split(/\s+/)
      .filter(Boolean);

    if (
      words.length === 0
    ) {
      return "U";
    }

    if (
      words.length === 1
    ) {
      return words[0]
        .charAt(0)
        .toUpperCase();
    }

    return (
      words[0].charAt(0) +
      words[
        words.length - 1
      ].charAt(0)
    ).toUpperCase();
  };

  const initials =
    getInitials(fullName);

  return (
    <header className="user-header">
      <div className="user-header-left">
        <button
          type="button"
          className="user-mobile-menu-button"
          aria-label="Open navigation menu"
          onClick={
            onMenuClick
          }
        >
          ☰
        </button>

        <div className="user-header-title">
          <h1>
            Office Stock Management
          </h1>

          <p>
            Employee Portal
          </p>
        </div>
      </div>

      <div className="user-header-actions">
        <button
          type="button"
          className="user-notification-button"
          aria-label="Notifications"
        >
          🔔

          
        </button>

        <div className="user-header-profile">
          <div className="user-header-avatar">
            {initials}
          </div>

          <div className="user-header-info">
            <strong>
              {fullName}
            </strong>

            <span>
              {role}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}

export default UserHeader;