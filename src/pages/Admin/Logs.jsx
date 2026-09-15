import {
  useEffect,
  useMemo,
  useState,
} from "react";

import logService from "../../services/logService";

import "./Logs.css";

function Logs() {
  const [logs, setLogs] =
    useState([]);

  const [
    searchTerm,
    setSearchTerm,
  ] = useState("");

  const [
    selectedAction,
    setSelectedAction,
  ] = useState("All");

  const [
    selectedDate,
    setSelectedDate,
  ] = useState("");

  const [
    selectedLog,
    setSelectedLog,
  ] = useState(null);

  const [
    isLoading,
    setIsLoading,
  ] = useState(true);

  const [
    errorMessage,
    setErrorMessage,
  ] = useState("");

  const formatDate = (
    dateValue
  ) => {
    if (!dateValue) {
      return "Not available";
    }

    const date =
      new Date(dateValue);

    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      return String(
        dateValue
      ).slice(0, 10);
    }

    return date
      .toISOString()
      .slice(0, 10);
  };

  const formatTime = (
    dateValue
  ) => {
    if (!dateValue) {
      return "Not available";
    }

    const date =
      new Date(dateValue);

    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      return "Not available";
    }

    return date.toLocaleTimeString(
      "en-US",
      {
        hour: "2-digit",
        minute: "2-digit",
      }
    );
  };

  const normalizeLog = (
    log
  ) => {
    const createdAt =
      log.created_at ??
      log.createdAt ??
      "";

    const logId =
      log.log_id ??
      log.id;

    const userName =
      log.user_name ??
      log.full_name ??
      log.userName ??
      "";

    const userCode =
      log.user_code ??
      log.userCode ??
      "";

    const hasUser =
      log.user_id != null ||
      userName !== "";

    return {
      id: logId,

      displayId:
        `LOG-${String(
          logId || ""
        ).padStart(3, "0")}`,

      userId:
        log.user_id ??
        null,

      userCode,

      user:
        hasUser
          ? userName ||
            userCode ||
            "Unknown User"
          : "System",

      role:
        log.role ??
        (hasUser
          ? "N/A"
          : "System"),

      action:
        log.action ??
        "Unknown",

      module:
        log.module ??
        "System",

      description:
        log.description ??
        "No description available.",

      logLevel:
        log.log_level ??
        log.logLevel ??
        "INFO",

      ipAddress:
        log.ip_address ??
        log.ipAddress ??
        "Not available",

      createdAt,

      date:
        formatDate(
          createdAt
        ),

      time:
        formatTime(
          createdAt
        ),
    };
  };

  const loadLogs = async () => {
    try {
      setIsLoading(true);
      setErrorMessage("");

      const response =
        await logService.getAllLogs();

      const logList =
        Array.isArray(response)
          ? response
          : Array.isArray(
                response.logs
              )
            ? response.logs
            : Array.isArray(
                  response.data
                )
              ? response.data
              : [];

      const normalizedLogs =
        logList
          .map(normalizeLog)
          .sort(
            (
              firstLog,
              secondLog
            ) => {
              const firstDate =
                new Date(
                  firstLog.createdAt
                ).getTime();

              const secondDate =
                new Date(
                  secondLog.createdAt
                ).getTime();

              const safeFirstDate =
                Number.isNaN(
                  firstDate
                )
                  ? 0
                  : firstDate;

              const safeSecondDate =
                Number.isNaN(
                  secondDate
                )
                  ? 0
                  : secondDate;

              return (
                safeSecondDate -
                safeFirstDate
              );
            }
          );

      setLogs(
        normalizedLogs
      );
    } catch (error) {
      setLogs([]);

      setErrorMessage(
        error.message ||
          "Failed to load system logs."
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  const actionOptions =
    useMemo(() => {
      const actions =
        logs
          .map(
            (log) =>
              log.action
          )
          .filter(Boolean);

      return [
        ...new Set(actions),
      ].sort();
    }, [logs]);

  const filteredLogs =
    useMemo(() => {
      return logs.filter(
        (log) => {
          const search =
            searchTerm
              .trim()
              .toLowerCase();

          const matchesSearch =
            String(
              log.displayId || ""
            )
              .toLowerCase()
              .includes(search) ||
            String(
              log.user || ""
            )
              .toLowerCase()
              .includes(search) ||
            String(
              log.userCode || ""
            )
              .toLowerCase()
              .includes(search) ||
            String(
              log.action || ""
            )
              .toLowerCase()
              .includes(search) ||
            String(
              log.module || ""
            )
              .toLowerCase()
              .includes(search) ||
            String(
              log.description || ""
            )
              .toLowerCase()
              .includes(search) ||
            String(
              log.logLevel || ""
            )
              .toLowerCase()
              .includes(search);

          const matchesAction =
            selectedAction ===
              "All" ||
            log.action ===
              selectedAction;

          const matchesDate =
            selectedDate ===
              "" ||
            log.date ===
              selectedDate;

          return (
            matchesSearch &&
            matchesAction &&
            matchesDate
          );
        }
      );
    }, [
      logs,
      searchTerm,
      selectedAction,
      selectedDate,
    ]);

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedAction(
      "All"
    );
    setSelectedDate("");
  };

  const openDetailsModal = (
    log
  ) => {
    setSelectedLog(log);
  };

  const closeDetailsModal =
    () => {
      setSelectedLog(null);
    };

  const getRoleClass = (
    role
  ) => {
    const normalizedRole =
      String(role || "")
        .trim()
        .toLowerCase();

    if (
      normalizedRole ===
      "admin"
    ) {
      return "log-role admin";
    }

    return "log-role user";
  };

  const getActionClass = (
    action
  ) => {
    const normalizedAction =
      String(action || "")
        .trim()
        .toLowerCase()
        .replaceAll(
          " ",
          "-"
        )
        .replaceAll(
          "_",
          "-"
        );

    return `log-action ${normalizedAction}`;
  };

  return (
    <section className="logs-page">
      <div className="logs-heading">
        <div>
          <h2>
            System Logs
          </h2>

          <p>
            View user activities
            and system actions.
          </p>
        </div>

        <div className="logs-summary">
          Total Logs:{" "}
          {logs.length}
        </div>
      </div>

      <div className="logs-panel">
        {errorMessage && (
          <div className="logs-empty-message">
            {errorMessage}
          </div>
        )}

        <div className="logs-toolbar">
          <input
            type="text"
            placeholder="Search by user, module or description..."
            value={
              searchTerm
            }
            onChange={(event) =>
              setSearchTerm(
                event.target.value
              )
            }
          />

          <select
            value={
              selectedAction
            }
            onChange={(event) =>
              setSelectedAction(
                event.target.value
              )
            }
          >
            <option value="All">
              All Actions
            </option>

            {actionOptions.map(
              (action) => (
                <option
                  key={action}
                  value={action}
                >
                  {action}
                </option>
              )
            )}
          </select>

          <input
            type="date"
            className="logs-date-filter"
            value={
              selectedDate
            }
            onChange={(event) =>
              setSelectedDate(
                event.target.value
              )
            }
          />

          <button
            type="button"
            className="logs-clear-button"
            onClick={
              clearFilters
            }
          >
            Clear
          </button>
        </div>

        <div className="logs-table-wrapper">
          <table className="logs-table">
            <thead>
              <tr>
                <th>
                  Log ID
                </th>

                <th>
                  User
                </th>

                <th>
                  Role
                </th>

                <th>
                  Action
                </th>

                <th>
                  Module
                </th>

                <th>
                  Date
                </th>

                <th>
                  Time
                </th>

                <th>
                  Actions
                </th>
              </tr>
            </thead>

            <tbody>
              {isLoading ? (
                <tr>
                  <td
                    colSpan="8"
                    className="logs-empty-message"
                  >
                    Loading system
                    logs...
                  </td>
                </tr>
              ) : (
                <>
                  {filteredLogs.map(
                    (log) => (
                      <tr
                        key={
                          log.id ||
                          log.displayId
                        }
                      >
                        <td>
                          {
                            log.displayId
                          }
                        </td>

                        <td className="log-user">
                          {
                            log.user
                          }
                        </td>

                        <td>
                          <span
                            className={getRoleClass(
                              log.role
                            )}
                          >
                            {
                              log.role
                            }
                          </span>
                        </td>

                        <td>
                          <span
                            className={getActionClass(
                              log.action
                            )}
                          >
                            {
                              log.action
                            }
                          </span>
                        </td>

                        <td>
                          {
                            log.module
                          }
                        </td>

                        <td>
                          {
                            log.date
                          }
                        </td>

                        <td>
                          {
                            log.time
                          }
                        </td>

                        <td>
                          <button
                            type="button"
                            className="log-view-button"
                            onClick={() =>
                              openDetailsModal(
                                log
                              )
                            }
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    )
                  )}

                  {filteredLogs.length ===
                    0 &&
                    !errorMessage && (
                      <tr>
                        <td
                          colSpan="8"
                          className="logs-empty-message"
                        >
                          No system
                          logs found.
                        </td>
                      </tr>
                    )}
                </>
              )}
            </tbody>
          </table>
        </div>

        <div className="logs-footer">
          <span>
            Showing{" "}
            {
              filteredLogs.length
            }{" "}
            of {logs.length} logs
          </span>
        </div>
      </div>

      {selectedLog && (
        <div
          className="log-modal-overlay"
          onMouseDown={
            closeDetailsModal
          }
        >
          <div
            className="log-modal"
            onMouseDown={(event) =>
              event.stopPropagation()
            }
          >
            <div className="log-modal-header">
              <div>
                <h3>
                  Log Details
                </h3>

                <p>
                  {
                    selectedLog.displayId
                  }
                </p>
              </div>

              <button
                type="button"
                className="log-modal-close"
                onClick={
                  closeDetailsModal
                }
                aria-label="Close modal"
              >
                ×
              </button>
            </div>

            <div className="log-details-grid">
              <div className="log-detail">
                <span>
                  User
                </span>

                <strong>
                  {
                    selectedLog.user
                  }
                </strong>
              </div>

              <div className="log-detail">
                <span>
                  User Code
                </span>

                <strong>
                  {selectedLog.userCode ||
                    "Not available"}
                </strong>
              </div>

              <div className="log-detail">
                <span>
                  Role
                </span>

                <strong>
                  {
                    selectedLog.role
                  }
                </strong>
              </div>

              <div className="log-detail">
                <span>
                  Action
                </span>

                <strong>
                  {
                    selectedLog.action
                  }
                </strong>
              </div>

              <div className="log-detail">
                <span>
                  Module
                </span>

                <strong>
                  {
                    selectedLog.module
                  }
                </strong>
              </div>

              <div className="log-detail">
                <span>
                  Log Level
                </span>

                <strong>
                  {
                    selectedLog.logLevel
                  }
                </strong>
              </div>

              <div className="log-detail">
                <span>
                  IP Address
                </span>

                <strong>
                  {
                    selectedLog.ipAddress
                  }
                </strong>
              </div>

              <div className="log-detail">
                <span>
                  Date
                </span>

                <strong>
                  {
                    selectedLog.date
                  }
                </strong>
              </div>

              <div className="log-detail">
                <span>
                  Time
                </span>

                <strong>
                  {
                    selectedLog.time
                  }
                </strong>
              </div>
            </div>

            <div className="log-description">
              <span>
                Description
              </span>

              <p>
                {
                  selectedLog.description
                }
              </p>
            </div>

            <div className="log-modal-actions">
              <button
                type="button"
                className="log-close-button"
                onClick={
                  closeDetailsModal
                }
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

export default Logs;