import {
  useEffect,
  useState,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import reportService from "../../services/reportService";
import requestService from "../../services/requestService";

import "./Dashboard.css";

function Dashboard() {
  const navigate =
    useNavigate();

  const [
    dashboardData,
    setDashboardData,
  ] = useState({
    totalStock: 0,
    totalStockIn: 0,
    pendingRequests: 0,
    lowStockItems: 0,
    recentRequests: [],
  });

  const [
    isLoading,
    setIsLoading,
  ] = useState(true);

  const [
    errorMessage,
    setErrorMessage,
  ] = useState("");

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

      item:
        request.item_name ??
        request.itemName ??
        request.item ??
        "Unknown Item",

      employee:
        request.employee_name ??
        request.user_name ??
        request.requested_by_name ??
        request.employee ??
        request.full_name ??
        "Unknown User",

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

  const loadDashboardData =
    async () => {
      try {
        setIsLoading(true);
        setErrorMessage("");

        const [
          summaryResponse,
          requestResponse,
        ] = await Promise.all([
          reportService.getSummary(),

          requestService.getAllRequests(),
        ]);

        const summary =
          summaryResponse?.summary ??
          {};

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

        const normalizedRequests =
          requestList.map(
            normalizeRequest
          );

        const recentRequests = [
          ...normalizedRequests,
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

        setDashboardData({
          totalStock:
            Number(
              summary.total_quantity ??
                0
            ),

          totalStockIn:
            Number(
              summary.total_stock_in ??
                0
            ),

          pendingRequests:
            Number(
              summary.pending_requests ??
                0
            ),

          lowStockItems:
            Number(
              summary.low_stock_items ??
                0
            ),

          recentRequests,
        });
      } catch (error) {
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

    const handleWindowFocus =
      () => {
        loadDashboardData();
      };

    window.addEventListener(
      "focus",
      handleWindowFocus
    );

    return () => {
      window.removeEventListener(
        "focus",
        handleWindowFocus
      );
    };
  }, []);

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

  const getStatusClass = (
    status
  ) => {
    return String(
      status || ""
    )
      .trim()
      .toLowerCase();
  };

  return (
    <section className="dashboard-page">
      <div className="dashboard-heading">
        <div>
          <h2>
            Dashboard
          </h2>

          <p>
            Welcome back! Here is
            your stock overview.
          </p>
        </div>

        <span className="dashboard-date">
          {formattedDate}
        </span>
      </div>

      {errorMessage && (
        <div className="dashboard-empty-message">
          {errorMessage}
        </div>
      )}

      <div className="summary-grid">
        <article className="summary-card">
          <div className="summary-icon">
            📦
          </div>

          <div>
            <p>
              Total Stock Quantity
            </p>

            <h3>
              {isLoading
                ? "..."
                : dashboardData.totalStock}
            </h3>
          </div>
        </article>

        <article className="summary-card">
          <div className="summary-icon green">
            📥
          </div>

          <div>
            <p>
              Total Stock In
            </p>

            <h3>
              {isLoading
                ? "..."
                : dashboardData.totalStockIn}
            </h3>
          </div>
        </article>

        <article className="summary-card">
          <div className="summary-icon orange">
            📋
          </div>

          <div>
            <p>
              Pending Requests
            </p>

            <h3>
              {isLoading
                ? "..."
                : dashboardData.pendingRequests}
            </h3>
          </div>
        </article>

        <article className="summary-card">
          <div className="summary-icon red">
            ⚠️
          </div>

          <div>
            <p>
              Low Stock Items
            </p>

            <h3>
              {isLoading
                ? "..."
                : dashboardData.lowStockItems}
            </h3>
          </div>
        </article>
      </div>

      <div className="dashboard-panel">
        <div className="panel-heading">
          <h3>
            Recent Requests
          </h3>

          <button
            type="button"
            onClick={() =>
              navigate(
                "/admin/requests"
              )
            }
          >
            View All
          </button>
        </div>

        <div className="dashboard-table-wrapper">
          <table>
            <thead>
              <tr>
                <th>
                  Request ID
                </th>

                <th>
                  Item
                </th>

                <th>
                  Requested By
                </th>

                <th>
                  Quantity
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
                    className="dashboard-empty-message"
                  >
                    Loading dashboard
                    data...
                  </td>
                </tr>
              ) : (
                <>
                  {dashboardData.recentRequests.map(
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
                            request.employee
                          }
                        </td>

                        <td>
                          {
                            request.quantity
                          }
                        </td>

                        <td>
                          <span
                            className={getStatusClass(
                              request.status
                            )}
                          >
                            {
                              request.status
                            }
                          </span>
                        </td>
                      </tr>
                    )
                  )}

                  {dashboardData
                    .recentRequests
                    .length ===
                    0 && (
                    <tr>
                      <td
                        colSpan="5"
                        className="dashboard-empty-message"
                      >
                        No user
                        requests found.
                      </td>
                    </tr>
                  )}
                </>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

export default Dashboard;