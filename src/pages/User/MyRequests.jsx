import {
  useEffect,
  useMemo,
  useState,
} from "react";

import { Link } from "react-router-dom";

import requestService from "../../services/requestService";
import authService from "../../services/authService";

import "./MyRequests.css";

function MyRequests() {
  const [requests, setRequests] =
    useState([]);

  const [searchTerm, setSearchTerm] =
    useState("");

  const [
    selectedStatus,
    setSelectedStatus,
  ] = useState("All");

  const [
    selectedRequest,
    setSelectedRequest,
  ] = useState(null);

  const [isLoading, setIsLoading] =
    useState(true);

  const [
    errorMessage,
    setErrorMessage,
  ] = useState("");

  useEffect(() => {
    const loadRequests = async () => {
      try {
        setIsLoading(true);
        setErrorMessage("");

        const response =
          await requestService.getAllRequests();

        const requestList =
          Array.isArray(response)
            ? response
            : Array.isArray(response.requests)
              ? response.requests
              : Array.isArray(response.data)
                ? response.data
                : [];

        const currentUser =
          authService.getCurrentUser();

        const formattedRequests =
          requestList.map((request) => ({
            databaseId:
              request.request_id ??
              request.id,

            id:
              request.request_code ??
              request.requestCode ??
              request.code ??
              `REQ-${request.request_id ?? request.id}`,

            itemId:
              request.item_id ??
              request.itemId,

            itemCode:
              request.item_code ??
              request.itemCode ??
              "",

            item:
              request.item_name ??
              request.item ??
              request.itemName ??
              "Unknown Item",

            category:
              request.category_name ??
              request.category ??
              "Not Specified",

            quantity: Number(
              request.quantity || 0
            ),

            reason:
              request.reason ||
              "No reason provided.",

            requestDate:
              request.request_date ??
              request.requestDate ??
              request.created_at ??
              request.createdAt ??
              "",

            status:
              request.status ||
              "Pending",

            userId:
              request.user_id ??
              request.userId,

            username:
              request.username ??
              request.user_username ??
              "",

            employee:
              request.full_name ??
              request.employee_name ??
              request.employee ??
              "",
          }));

        const myRequests =
          formattedRequests.filter(
            (request) => {
              if (!currentUser) {
                return true;
              }

              const currentUserId =
                currentUser.user_id ??
                currentUser.id;

              if (
                request.userId != null &&
                currentUserId != null
              ) {
                return (
                  String(request.userId) ===
                  String(currentUserId)
                );
              }

              if (
                request.username &&
                currentUser.username
              ) {
                return (
                  request.username
                    .toLowerCase() ===
                  currentUser.username
                    .toLowerCase()
                );
              }

              return true;
            }
          );

        setRequests(myRequests);
      } catch (error) {
        setRequests([]);

        setErrorMessage(
          error.message ||
            "Failed to load requests."
        );
      } finally {
        setIsLoading(false);
      }
    };

    loadRequests();
  }, []);

  const formatDate = (dateValue) => {
    if (!dateValue) {
      return "-";
    }

    const date =
      new Date(dateValue);

    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      return dateValue;
    }

    return date
      .toISOString()
      .slice(0, 10);
  };

  const filteredRequests =
    useMemo(() => {
      return requests.filter(
        (request) => {
          const search =
            searchTerm
              .trim()
              .toLowerCase();

          const matchesSearch =
            String(
              request.id || ""
            )
              .toLowerCase()
              .includes(search) ||
            String(
              request.item || ""
            )
              .toLowerCase()
              .includes(search) ||
            String(
              request.category || ""
            )
              .toLowerCase()
              .includes(search);

          const matchesStatus =
            selectedStatus ===
              "All" ||
            request.status ===
              selectedStatus;

          return (
            matchesSearch &&
            matchesStatus
          );
        }
      );
    }, [
      requests,
      searchTerm,
      selectedStatus,
    ]);

  const openDetailsModal = (
    request
  ) => {
    setSelectedRequest(request);
  };

  const closeDetailsModal = () => {
    setSelectedRequest(null);
  };

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedStatus("All");
  };

  const totalRequests =
    requests.length;

  const pendingRequests =
    requests.filter(
      (request) =>
        request.status === "Pending"
    ).length;

  const approvedRequests =
    requests.filter(
      (request) =>
        request.status === "Approved"
    ).length;

  const rejectedRequests =
    requests.filter(
      (request) =>
        request.status === "Rejected"
    ).length;

  return (
    <section className="my-requests-page">
      <div className="my-requests-heading">
        <div>
          <h2>
            My Requests
          </h2>

          <p>
            View and track your
            office stock requests.
          </p>
        </div>

        <Link
          to="/user/create-request"
          className="new-request-button"
        >
          + New Request
        </Link>
      </div>

      <div className="my-requests-summary-grid">
        <article className="my-request-summary-card">
          <div className="my-request-summary-icon total">
            📋
          </div>

          <div>
            <span>
              Total Requests
            </span>

            <strong>
              {totalRequests}
            </strong>
          </div>
        </article>

        <article className="my-request-summary-card">
          <div className="my-request-summary-icon pending">
            ⏳
          </div>

          <div>
            <span>
              Pending
            </span>

            <strong>
              {pendingRequests}
            </strong>
          </div>
        </article>

        <article className="my-request-summary-card">
          <div className="my-request-summary-icon approved">
            ✅
          </div>

          <div>
            <span>
              Approved
            </span>

            <strong>
              {approvedRequests}
            </strong>
          </div>
        </article>

        <article className="my-request-summary-card">
          <div className="my-request-summary-icon rejected">
            ❌
          </div>

          <div>
            <span>
              Rejected
            </span>

            <strong>
              {rejectedRequests}
            </strong>
          </div>
        </article>
      </div>

      <div className="my-requests-panel">
        {errorMessage && (
          <div className="request-error-message">
            {errorMessage}
          </div>
        )}

        <div className="my-requests-toolbar">
          <input
            type="text"
            placeholder="Search by request ID, item or category..."
            value={searchTerm}
            onChange={(event) =>
              setSearchTerm(
                event.target.value
              )
            }
          />

          <select
            value={
              selectedStatus
            }
            onChange={(event) =>
              setSelectedStatus(
                event.target.value
              )
            }
          >
            <option value="All">
              All Statuses
            </option>

            <option value="Pending">
              Pending
            </option>

            <option value="Approved">
              Approved
            </option>

            <option value="Rejected">
              Rejected
            </option>
          </select>

          <button
            type="button"
            className="my-requests-clear-button"
            onClick={
              clearFilters
            }
          >
            Clear
          </button>
        </div>

        <div className="my-requests-table-wrapper">
          <table className="my-requests-table">
            <thead>
              <tr>
                <th>
                  Request ID
                </th>

                <th>
                  Item
                </th>

                <th>
                  Category
                </th>

                <th>
                  Quantity
                </th>

                <th>
                  Request Date
                </th>

                <th>
                  Status
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
                    colSpan="7"
                    className="my-requests-empty"
                  >
                    Loading requests...
                  </td>
                </tr>
              ) : (
                <>
                  {filteredRequests.map(
                    (request) => (
                      <tr
                        key={
                          request.databaseId ||
                          request.id
                        }
                      >
                        <td>
                          {request.id}
                        </td>

                        <td className="my-request-item">
                          {
                            request.item
                          }
                        </td>

                        <td>
                          {
                            request.category
                          }
                        </td>

                        <td>
                          {
                            request.quantity
                          }
                        </td>

                        <td>
                          {formatDate(
                            request.requestDate
                          )}
                        </td>

                        <td>
                          <span
                            className={`my-request-status ${request.status.toLowerCase()}`}
                          >
                            {
                              request.status
                            }
                          </span>
                        </td>

                        <td>
                          <div className="my-request-actions">
                            <button
                              type="button"
                              className="my-request-view-button"
                              onClick={() =>
                                openDetailsModal(
                                  request
                                )
                              }
                            >
                              View
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  )}

                  {filteredRequests.length ===
                    0 &&
                    !errorMessage && (
                      <tr>
                        <td
                          colSpan="7"
                          className="my-requests-empty"
                        >
                          No requests
                          found.
                        </td>
                      </tr>
                    )}
                </>
              )}
            </tbody>
          </table>
        </div>

        <div className="my-requests-footer">
          <span>
            Showing{" "}
            {
              filteredRequests.length
            }{" "}
            of {requests.length}{" "}
            requests
          </span>
        </div>
      </div>

      {selectedRequest && (
        <div
          className="my-request-modal-overlay"
          onMouseDown={
            closeDetailsModal
          }
        >
          <div
            className="my-request-modal"
            onMouseDown={(
              event
            ) =>
              event.stopPropagation()
            }
          >
            <div className="my-request-modal-header">
              <div>
                <h3>
                  Request Details
                </h3>

                <p>
                  {
                    selectedRequest.id
                  }
                </p>
              </div>

              <button
                type="button"
                className="my-request-modal-close"
                onClick={
                  closeDetailsModal
                }
              >
                ×
              </button>
            </div>

            <div className="my-request-details-grid">
              <div className="my-request-detail">
                <span>
                  Item Code
                </span>

                <strong>
                  {selectedRequest.itemCode ||
                    "-"}
                </strong>
              </div>

              <div className="my-request-detail">
                <span>
                  Item Name
                </span>

                <strong>
                  {
                    selectedRequest.item
                  }
                </strong>
              </div>

              <div className="my-request-detail">
                <span>
                  Category
                </span>

                <strong>
                  {
                    selectedRequest.category
                  }
                </strong>
              </div>

              <div className="my-request-detail">
                <span>
                  Quantity
                </span>

                <strong>
                  {
                    selectedRequest.quantity
                  }
                </strong>
              </div>

              <div className="my-request-detail">
                <span>
                  Request Date
                </span>

                <strong>
                  {formatDate(
                    selectedRequest.requestDate
                  )}
                </strong>
              </div>

              <div className="my-request-detail">
                <span>
                  Status
                </span>

                <strong>
                  <span
                    className={`my-request-status ${selectedRequest.status.toLowerCase()}`}
                  >
                    {
                      selectedRequest.status
                    }
                  </span>
                </strong>
              </div>
            </div>

            <div className="my-request-reason">
              <span>
                Reason
              </span>

              <p>
                {
                  selectedRequest.reason
                }
              </p>
            </div>

            <div className="my-request-modal-actions">
              <button
                type="button"
                className="my-request-close-button"
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

export default MyRequests;