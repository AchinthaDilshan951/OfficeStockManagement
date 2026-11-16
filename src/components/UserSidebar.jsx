import {
  NavLink,
  useNavigate,
} from "react-router-dom";

import { addSystemLog } from "../utils/systemLogger";

import officeStockLogo from "../assets/office-stock-logo.jpg";

import "./UserSidebar.css";

function UserSidebar({ isOpen, onClose }) {
  const navigate = useNavigate();

  const menuItems = [
    {
      name: "Dashboard",
      icon: "🏠",
      path: "/user/dashboard",
    },
    {
      name: "Available Items",
      icon: "📦",
      path: "/user/items",
    },
    {
      name: "Create Request",
      icon: "➕",
      path: "/user/create-request",
    },
    {
      name: "My Requests",
      icon: "📋",
      path: "/user/my-requests",
    },
    {
      name: "Profile",
      icon: "👤",
      path: "/user/profile",
    },
  ];

  const handleLogout = () => {
    const shouldLogout = window.confirm(
      "Are you sure you want to logout?"
    );

    if (!shouldLogout) {
      return;
    }

    let currentUser = null;

    try {
      currentUser = JSON.parse(
        localStorage.getItem("user") || "null"
      );
    } catch {
      currentUser = null;
    }

    addSystemLog({
      action: "Logout",
      module: "Authentication",
      description:
        "User logged out of the system.",
      userData: currentUser,
    });

    localStorage.removeItem("user");
    localStorage.removeItem("token");

    navigate("/", {
      replace: true,
    });
  };

  const handleLinkClick = () => {
    if (onClose) {
      onClose();
    }
  };

  return (
    <aside
      className={
        isOpen
          ? "user-sidebar user-sidebar-open"
          : "user-sidebar"
      }
    >
      <div className="user-sidebar-brand">
        <div className="user-sidebar-logo">
          <img
            src={officeStockLogo}
            alt="Office Stock Management Logo"
          />
        </div>

        <div>
          <h2>Office Stock</h2>
          <p>Employee Portal</p>
        </div>

        <button
          type="button"
          className="user-sidebar-close-button"
          aria-label="Close navigation menu"
          onClick={onClose}
        >
          ×
        </button>
      </div>

      <nav className="user-sidebar-menu">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            onClick={handleLinkClick}
            className={({ isActive }) =>
              isActive
                ? "user-sidebar-link active"
                : "user-sidebar-link"
            }
          >
            <span className="user-sidebar-icon">
              {item.icon}
            </span>

            <span>{item.name}</span>
          </NavLink>
        ))}
      </nav>

      <button
        type="button"
        className="user-logout-button"
        onClick={handleLogout}
      >
        <span className="user-sidebar-icon">
          🚪
        </span>

        <span>Logout</span>
      </button>
    </aside>
  );
}

export default UserSidebar;