import {
  NavLink,
  useNavigate,
} from "react-router-dom";

import { addSystemLog } from "../utils/systemLogger";

import "./Sidebar.css";

function Sidebar({ isOpen, onClose }) {
  const navigate = useNavigate();

  const menuItems = [
    {
      name: "Dashboard",
      icon: "🏠",
      path: "/admin/dashboard",
    },
    {
      name: "Items",
      icon: "📦",
      path: "/admin/items",
    },
    {
      name: "Categories",
      icon: "📁",
      path: "/admin/categories",
    },
    {
      name: "Suppliers",
      icon: "🚚",
      path: "/admin/suppliers",
    },
    {
      name: "Stock In",
      icon: "📥",
      path: "/admin/stock-in",
    },
    {
      name: "Requests",
      icon: "📋",
      path: "/admin/requests",
    },
    {
      name: "Transactions",
      icon: "🔄",
      path: "/admin/transactions",
    },
    {
      name: "Reports",
      icon: "📊",
      path: "/admin/reports",
    },
    {
      name: "Users",
      icon: "👥",
      path: "/admin/users",
    },
    {
      name: "Logs",
      icon: "📝",
      path: "/admin/logs",
    },
    {
      name: "Profile",
      icon: "👤",
      path: "/admin/profile",
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
        "Admin logged out of the system.",
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
          ? "sidebar sidebar-open"
          : "sidebar"
      }
    >
      <div className="sidebar-brand">
        <div className="sidebar-logo">
          📦
        </div>

        <div>
          <h2>Office Stock</h2>
          <p>Management System</p>
        </div>

        <button
          type="button"
          className="sidebar-close-button"
          aria-label="Close navigation menu"
          onClick={onClose}
        >
          ×
        </button>
      </div>

      <nav className="sidebar-menu">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            onClick={handleLinkClick}
            className={({ isActive }) =>
              isActive
                ? "sidebar-link active"
                : "sidebar-link"
            }
          >
            <span className="sidebar-icon">
              {item.icon}
            </span>

            <span>{item.name}</span>
          </NavLink>
        ))}
      </nav>

      <button
        type="button"
        className="logout-button"
        onClick={handleLogout}
      >
        <span className="sidebar-icon">
          🚪
        </span>

        <span>Logout</span>
      </button>
    </aside>
  );
}

export default Sidebar;