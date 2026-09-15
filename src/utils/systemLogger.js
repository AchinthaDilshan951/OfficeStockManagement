export const addSystemLog = ({
  action,
  module,
  description,
  userData,
}) => {
  let currentUser = userData || null;

  if (!currentUser) {
    try {
      currentUser = JSON.parse(
        localStorage.getItem("user") || "null"
      );
    } catch {
      currentUser = null;
    }
  }

  let savedLogs = [];

  try {
    savedLogs = JSON.parse(
      localStorage.getItem("systemLogs") || "[]"
    );

    if (!Array.isArray(savedLogs)) {
      savedLogs = [];
    }
  } catch {
    savedLogs = [];
  }

  const now = new Date();

  const newLog = {
    id: `LOG-${Date.now()}`,

    user:
      currentUser?.fullName ||
      currentUser?.username ||
      "Unknown User",

    role:
      currentUser?.role ||
      "User",

    action:
      action ||
      "Unknown",

    module:
      module ||
      "System",

    description:
      description ||
      "No description available.",

    date: now
      .toISOString()
      .slice(0, 10),

    time: now.toLocaleTimeString(
      "en-US",
      {
        hour: "2-digit",
        minute: "2-digit",
      }
    ),

    createdAt:
      now.toISOString(),
  };

  localStorage.setItem(
    "systemLogs",
    JSON.stringify([
      newLog,
      ...savedLogs,
    ])
  );

  window.dispatchEvent(
    new Event("systemLogsUpdated")
  );

  return newLog;
};