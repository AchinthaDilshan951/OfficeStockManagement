import {
  useEffect,
  useRef,
  useState,
} from "react";

import { useNavigate } from "react-router-dom";

import "./Header.css";

function Header({ onMenuClick }) {
  const navigate = useNavigate();

  const notificationRef = useRef(null);

  const [isNotificationOpen, setIsNotificationOpen] =
    useState(false);

  const [pendingRequests, setPendingRequests] =
    useState([]);

  let currentUser = null;

  try {
    currentUser = JSON.parse(
      localStorage.getItem("user") || "null"
    );
  } catch {
    currentUser = null;
  }

  const fullName =
    currentUser?.fullName || "Admin User";

  const role =
    currentUser?.role === "Admin"
      ? "Administrator"
      : currentUser?.role || "Administrator";

  const getInitials = (name) => {
    const words = String(name)
      .trim()
      .split(/\s+/)
      .filter(Boolean);

    if (words.length === 0) {
      return "AD";
    }

    if (words.length === 1) {
      return words[0]
        .charAt(0)
        .toUpperCase();
    }

    return (
      words[0].charAt(0) +
      words[words.length - 1].charAt(0)
    ).toUpperCase();
  };

  const loadNotifications = () => {
    try {
      const savedRequests = JSON.parse(
        localStorage.getItem("userRequests") ||
          "[]"
      );

      if (!Array.isArray(savedRequests)) {
        setPendingRequests([]);
        return;
      }

      const pending = savedRequests
        .filter(
          (request) =>
            String(request.status || "")
              .trim()
              .toLowerCase() === "pending"
        )
        .sort((firstRequest, secondRequest) => {
          const firstDate = new Date(
            firstRequest.createdAt ||
              firstRequest.requestDate ||
              0
          ).getTime();

          const secondDate = new Date(
            secondRequest.createdAt ||
              secondRequest.requestDate ||
              0
          ).getTime();

          return secondDate - firstDate;
        });

      setPendingRequests(pending);
    } catch {
      setPendingRequests([]);
    }
  };

  useEffect(() => {
    loadNotifications();

    const handleRequestsUpdated = () => {
      loadNotifications();
    };

    window.addEventListener(
      "storage",
      handleRequestsUpdated
    );

    window.addEventListener(
      "requestsUpdated",
      handleRequestsUpdated
    );

    return () => {
      window.removeEventListener(
        "storage",
        handleRequestsUpdated
      );

      window.removeEventListener(
        "requestsUpdated",
        handleRequestsUpdated
      );
    };
  }, []);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(
          event.target
        )
      ) {
        setIsNotificationOpen(false);
      }
    };

    document.addEventListener(
      "mousedown",
      handleOutsideClick
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleOutsideClick
      );
    };
  }, []);

  const initials = getInitials(fullName);

  const openRequestsPage = () => {
    setIsNotificationOpen(false);
    navigate("/admin/requests");
  };

  const getEmployeeName = (request) => {
    return (
      request.employee ||
      request.employeeName ||
      request.fullName ||
      request.requestedBy ||
      "Unknown User"
    );
  };

  return (
    <header className="admin-header">
      <div className="header-left-section">
        <button
          type="button"
          className="mobile-menu-button"
          aria-label="Open navigation menu"
          onClick={onMenuClick}
        >
          ☰
        </button>

        <div className="header-title">
          <h1>Office Stock Management</h1>
          <p>Admin Panel</p>
        </div>
      </div>

      <div className="header-actions">
        <div
          className="notification-wrapper"
          ref={notificationRef}
        >
          <button
            className="notification-button"
            type="button"
            aria-label="Notifications"
            aria-expanded={isNotificationOpen}
            onClick={() =>
              setIsNotificationOpen(
                (previousState) =>
                  !previousState
              )
            }
          >
            🔔

            {pendingRequests.length > 0 && (
              <span className="notification-count">
                {pendingRequests.length > 99
                  ? "99+"
                  : pendingRequests.length}
              </span>
            )}
          </button>

          {isNotificationOpen && (
            <div className="notification-dropdown">
              <div className="notification-dropdown-header">
                <div>
                  <h3>Notifications</h3>

                  <p>
                    Pending stock requests
                  </p>
                </div>

                <span>
                  {pendingRequests.length}
                </span>
              </div>

              <div className="notification-list">
                {pendingRequests
                  .slice(0, 5)
                  .map((request) => (
                    <button
                      type="button"
                      className="notification-item"
                      key={request.id}
                      onClick={openRequestsPage}
                    >
                      <div className="notification-item-icon">
                        📋
                      </div>

                      <div className="notification-item-content">
                        <strong>
                          {request.item ||
                            "Unknown Item"}
                        </strong>

                        <p>
                          {getEmployeeName(
                            request
                          )}{" "}
                          requested{" "}
                          {request.quantity || 0}
                        </p>

                        <span>
                          {request.requestDate ||
                            request.date ||
                            "Pending"}
                        </span>
                      </div>
                    </button>
                  ))}

                {pendingRequests.length === 0 && (
                  <div className="notification-empty">
                    <span>✅</span>

                    <strong>
                      No pending requests
                    </strong>

                    <p>
                      You are all caught up.
                    </p>
                  </div>
                )}
              </div>

              {pendingRequests.length > 0 && (
                <button
                  type="button"
                  className="notification-view-all"
                  onClick={openRequestsPage}
                >
                  View all requests
                </button>
              )}
            </div>
          )}
        </div>

        <div className="admin-profile">
          <div className="admin-avatar">
            {initials}
          </div>

          <div className="admin-info">
            <strong>{fullName}</strong>
            <span>{role}</span>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header;