import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Link,
} from "react-router-dom";

import itemService from "../../services/itemService";
import requestService from "../../services/requestService";
import authService from "../../services/authService";

import "./Dashboard.css";

function Dashboard() {
  const [
    stockItems,
    setStockItems,
  ] = useState([]);

  const [
    allRequests,
    setAllRequests,
  ] = useState([]);

  const [
    currentUser,
    setCurrentUser,
  ] = useState(null);

  const [
    isLoading,
    setIsLoading,
  ] = useState(true);

  const [
    errorMessage,
    setErrorMessage,
  ] = useState("");

  const normalizeItem = (
    item
  ) => {
    return {
      id:
        item.item_id ??
        item.id,

      code:
        item.item_code ??
        item.code ??
        "",

      name:
        item.item_name ??
        item.name ??
        "Unknown Item",

      quantity:
        Number(
          item.quantity ?? 0
        ),

      status:
        item.status ??
        "Active",
    };
  };

  const normalizeRequest = (
    request
  ) => {
    const databaseId =
      request.request_id ??
      request.id;

    const requestCode =
      request.request_code ??
      request.requestCode ??
      request.code ??
      `REQ-${String(
        databaseId || ""
      ).padStart(3, "0")}`;

    return {
      databaseId,

      id:
        requestCode,

      userId:
        request.user_id ??
        request.employee_id ??
        request.requested_by ??
        request.userId ??
        null,

      username:
        request.username ??
        request.user_username ??
        request.employee_username ??
        "",

      employee:
        request.employee_name ??
        request.user_name ??
        request.requested_by_name ??
        request.employee ??
        request.full_name ??
        "Unknown User",

      item:
        request.item_name ??
        request.item ??
        request.itemName ??
        "Unknown Item",

      quantity:
        Number(
          request.quantity ??
            request.requested_quantity ??
            0
        ),

      status:
        request.status ??
        "Pending",

      requestDate:
        request.request_date ??
        request.requestDate ??
        request.created_at ??
        request.createdAt ??
        "",
    };
  };

  const loadDashboardData =
    async () => {
      try {
        setIsLoading(true);
        setErrorMessage("");

        const loggedInUser =
          authService.getCurrentUser();

        setCurrentUser(
          loggedInUser
        );

        const [
          itemResponse,
          requestResponse,
        ] = await Promise.all([
          itemService.getAllItems(),

          requestService.getAllRequests(),
        ]);

        const itemList =
          Array.isArray(
            itemResponse
          )
            ? itemResponse
            : Array.isArray(
                  itemResponse?.items
                )
              ? itemResponse.items
              : Array.isArray(
                    itemResponse?.data
                  )
                ? itemResponse.data
                : [];

        const requestList =
          Array.isArray(
            requestResponse
          )
            ? requestResponse
            : Array.isArray(
                  requestResponse?.requests
                )
              ? requestResponse.requests
              : Array.isArray(
                    requestResponse?.data
                  )
                ? requestResponse.data
                : [];

        setStockItems(
          itemList.map(
            normalizeItem
          )
        );

        setAllRequests(
          requestList.map(
            normalizeRequest
          )
        );
      } catch (error) {
        setStockItems([]);
        setAllRequests([]);

        setErrorMessage(
          error.message ||
            "Failed to load dashboard data."
        );
      } finally {
        setIsLoading(false);
      }
    };

  useEffect(() => {
    loadDashboardData();

    const handleFocus = () => {
      loadDashboardData();
    };

    window.addEventListener(
      "focus",
      handleFocus
    );

    return () => {
      window.removeEventListener(
        "focus",
        handleFocus
      );
    };
  }, []);

  const myRequests =
    useMemo(() => {
      if (!currentUser) {
        return [];
      }

      const currentUserId =
        String(
          currentUser.user_id ??
            currentUser.userId ??
            currentUser.id ??
            ""
        );

      const currentUsername =
        String(
          currentUser.username ??
            ""
        )
          .trim()
          .toLowerCase();

      const currentFullName =
        String(
          currentUser.full_name ??
            currentUser.fullName ??
            ""
        )
          .trim()
          .toLowerCase();

      return allRequests.filter(
        (request) => {
          const requestUserId =
            String(
              request.userId ??
                ""
            );

          const requestUsername =
            String(
              request.username ??
                ""
            )
              .trim()
              .toLowerCase();

          const requestEmployee =
            String(
              request.employee ??
                ""
            )
              .trim()
              .toLowerCase();

          const matchesId =
            currentUserId !== "" &&
            requestUserId ===
              currentUserId;

          const matchesUsername =
            currentUsername !==
              "" &&
            requestUsername ===
              currentUsername;

          const matchesName =
            currentFullName !==
              "" &&
            requestEmployee ===
              currentFullName;

          return (
            matchesId ||
            matchesUsername ||
            matchesName
          );
        }
      );
    }, [
      allRequests,
      currentUser,
    ]);

  const getRequestTime = (
    request
  ) => {
    if (
      !request.requestDate
    ) {
      return 0;
    }

    const date =
      new Date(
        request.requestDate
      );

    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      return 0;
    }

    return date.getTime();
  };

  const recentRequests =
    useMemo(() => {
      return [
        ...myRequests,
      ]
        .sort(
          (
            firstRequest,
            secondRequest
          ) =>
            getRequestTime(
              secondRequest
            ) -
            getRequestTime(
              firstRequest
            )
        )
        .slice(0, 5);
    }, [myRequests]);

  const availableStockQuantity =
    useMemo(() => {
      return stockItems.reduce(
        (
          total,
          item
        ) => {
          if (
            item.status ===
            "Inactive"
          ) {
            return total;
          }

          return (
            total +
            Math.max(
              Number(
                item.quantity ||
                  0
              ),
              0
            )
          );
        },
        0
      );
    }, [stockItems]);

  const pendingRequests =
    useMemo(() => {
      return myRequests.filter(
        (request) =>
          String(
            request.status
          )
            .trim()
            .toLowerCase() ===
          "pending"
      ).length;
    }, [myRequests]);

  const approvedRequests =
    useMemo(() => {
      return myRequests.filter(
        (request) =>
          String(
            request.status
          )
            .trim()
            .toLowerCase() ===
          "approved"
      ).length;
    }, [myRequests]);

  const formattedDate =
    new Intl.DateTimeFormat(
      "en-GB",
      {
        day: "2-digit",
        month: "long",
        year: "numeric",
      }
    ).format(
      new Date()
    );

  const getRequestDate = (
    request
  ) => {
    const dateValue =
      request.requestDate;

    if (!dateValue) {
      return "Not available";
    }

    if (
      typeof dateValue ===
      "string"
    ) {
      const dateOnly =
        dateValue.slice(
          0,
          10
        );

      if (
        /^\d{4}-\d{2}-\d{2}$/.test(
          dateOnly
        )
      ) {
        const [
          year,
          month,
          day,
        ] = dateOnly.split(
          "-"
        );

        return `${day}/${month}/${year}`;
      }
    }

    const parsedDate =
      new Date(
        dateValue
      );

    if (
      Number.isNaN(
        parsedDate.getTime()
      )
    ) {
      return String(
        dateValue
      );
    }

    return parsedDate.toLocaleDateString(
      "en-GB"
    );
  };

  const getStatusClass = (
    status
  ) => {
    const normalizedStatus =
      String(
        status || "Pending"
      )
        .trim()
        .toLowerCase();

    if (
      normalizedStatus ===
        "approved" ||
      normalizedStatus ===
        "rejected" ||
      normalizedStatus ===
        "pending"
    ) {
      return normalizedStatus;
    }

    return "pending";
  };

  return (
    <section className="user-dashboard-page">
      <div className="user-dashboard-heading">
        <div>
          <h2>
            Dashboard
          </h2>

          <p>
            Welcome back! View
            your stock request
            summary.
          </p>
        </div>

        <span className="user-dashboard-date">
          {formattedDate}
        </span>
      </div>

      {errorMessage && (
        <div
          style={{
            background:
              "#fee2e2",
            color:
              "#b91c1c",
            padding:
              "12px 16px",
            borderRadius:
              "8px",
            marginBottom:
              "20px",
          }}
        >
          {errorMessage}
        </div>
      )}

      <div className="user-summary-grid">
        <article className="user-summary-card">
          <div className="user-summary-icon available">
            📦
          </div>

          <div>
            <span>
              Available Stock
            </span>

            <strong>
              {isLoading
                ? "..."
                : availableStockQuantity}
            </strong>
          </div>
        </article>

        <article className="user-summary-card">
          <div className="user-summary-icon total">
            📋
          </div>

          <div>
            <span>
              My Requests
            </span>

            <strong>
              {isLoading
                ? "..."
                : myRequests.length}
            </strong>
          </div>
        </article>

        <article className="user-summary-card">
          <div className="user-summary-icon pending">
            ⏳
          </div>

          <div>
            <span>
              Pending Requests
            </span>

            <strong>
              {isLoading
                ? "..."
                : pendingRequests}
            </strong>
          </div>
        </article>

        <article className="user-summary-card">
          <div className="user-summary-icon approved">
            ✅
          </div>

          <div>
            <span>
              Approved Requests
            </span>

            <strong>
              {isLoading
                ? "..."
                : approvedRequests}
            </strong>
          </div>
        </article>
      </div>

      <div className="user-dashboard-content">
        <div className="user-recent-requests">
          <div className="user-section-header">
            <div>
              <h3>
                Recent Requests
              </h3>

              <p>
                Your latest office
                stock requests
              </p>
            </div>

            <Link to="/user/my-requests">
              View All
            </Link>
          </div>

          <div className="user-request-table-wrapper">
            <table className="user-request-table">
              <thead>
                <tr>
                  <th>
                    Request ID
                  </th>

                  <th>
                    Item
                  </th>

                  <th>
                    Quantity
                  </th>

                  <th>
                    Date
                  </th>

                  <th>
                    Status
                  </th>
                </tr>
              </thead>

              <tbody>
                {isLoading ? (
                  <tr>
                    <td
                      colSpan="5"
                      style={{
                        padding:
                          "28px",
                        textAlign:
                          "center",
                        color:
                          "#6b7280",
                      }}
                    >
                      Loading
                      requests...
                    </td>
                  </tr>
                ) : (
                  <>
                    {recentRequests.map(
                      (
                        request
                      ) => (
                        <tr
                          key={
                            request.databaseId ||
                            request.id
                          }
                        >
                          <td>
                            {
                              request.id
                            }
                          </td>

                          <td>
                            {
                              request.item
                            }
                          </td>

                          <td>
                            {
                              request.quantity
                            }
                          </td>

                          <td>
                            {getRequestDate(
                              request
                            )}
                          </td>

                          <td>
                            <span
                              className={`user-request-status ${getStatusClass(
                                request.status
                              )}`}
                            >
                              {
                                request.status
                              }
                            </span>
                          </td>
                        </tr>
                      )
                    )}

                    {recentRequests.length ===
                      0 && (
                      <tr>
                        <td
                          colSpan="5"
                          style={{
                            padding:
                              "28px",
                            textAlign:
                              "center",
                            color:
                              "#6b7280",
                          }}
                        >
                          You have not
                          submitted any
                          requests yet.
                        </td>
                      </tr>
                    )}
                  </>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <aside className="user-quick-actions">
          <div className="user-section-header">
            <div>
              <h3>
                Quick Actions
              </h3>

              <p>
                Common actions
              </p>
            </div>
          </div>

          <div className="user-action-list">
            <Link
              to="/user/items"
              className="user-action-card"
            >
              <span>
                📦
              </span>

              <div>
                <strong>
                  Available Items
                </strong>

                <p>
                  View current
                  stock items
                </p>
              </div>
            </Link>

            <Link
              to="/user/create-request"
              className="user-action-card"
            >
              <span>
                ➕
              </span>

              <div>
                <strong>
                  Create Request
                </strong>

                <p>
                  Request an
                  office item
                </p>
              </div>
            </Link>

            <Link
              to="/user/my-requests"
              className="user-action-card"
            >
              <span>
                📋
              </span>

              <div>
                <strong>
                  My Requests
                </strong>

                <p>
                  Track your
                  request status
                </p>
              </div>
            </Link>

            <Link
              to="/user/profile"
              className="user-action-card"
            >
              <span>
                👤
              </span>

              <div>
                <strong>
                  My Profile
                </strong>

                <p>
                  Manage account
                  details
                </p>
              </div>
            </Link>
          </div>
        </aside>
      </div>
    </section>
  );
}

export default Dashboard;