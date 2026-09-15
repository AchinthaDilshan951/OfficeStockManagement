import {
  useEffect,
  useMemo,
  useState,
} from "react";

import requestService from "../../services/requestService";

import "./Requests.css";

function Requests() {
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

  const [
    isLoading,
    setIsLoading,
  ] = useState(true);

  const [
    processingId,
    setProcessingId,
  ] = useState(null);

  const [
    errorMessage,
    setErrorMessage,
  ] = useState("");

  const formatDate = (
    dateValue
  ) => {
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
      return String(
        dateValue
      ).slice(0, 10);
    }

    return date
      .toISOString()
      .slice(0, 10);
  };

  const normalizeRequest = (
    request
  ) => {
    return {
      databaseId:
        request.request_id ??
        request.id,

      id:
        request.request_code ??
        request.requestCode ??
        request.code ??
        `REQ-${
          request.request_id ??
          request.id
        }`,

      userId:
        request.user_id ??
        request.userId,

      employee:
        request.full_name ??
        request.employee_name ??
        request.employee ??
        request.user_name ??
        request.username ??
        "Unknown User",

      username:
        request.username ??
        request.user_username ??
        "",

      department:
        request.department ??
        request.user_department ??
        "Not Specified",

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
        request.name ??
        "Unknown Item",

      category:
        request.category_name ??
        request.category ??
        "Not Specified",

      quantity: Number(
        request.quantity || 0
      ),

      requestDate:
        request.request_date ??
        request.created_at ??
        request.requestDate ??
        "",

      reason:
        request.reason ||
        "No reason provided.",

      status:
        request.status ||
        "Pending",

      reviewedAt:
        request.reviewed_at ??
        request.reviewedAt ??
        null,
    };
  };

  const loadRequests = async () => {
    try {
      setIsLoading(true);
      setErrorMessage("");

      const response =
        await requestService.getAllRequests();

      const requestList =
        Array.isArray(response)
          ? response
          : Array.isArray(
                response.requests
              )
            ? response.requests
            : Array.isArray(
                  response.data
                )
              ? response.data
              : [];

      setRequests(
        requestList.map(
          normalizeRequest
        )
      );
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

  useEffect(() => {
    loadRequests();
  }, []);

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
              request.employee || ""
            )
              .toLowerCase()
              .includes(search) ||
            String(
              request.department ||
                ""
            )
              .toLowerCase()
              .includes(search) ||
            String(
              request.item || ""
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

  const updateStatus = async (
    request,
    newStatus
  ) => {
    if (
      request.status !==
      "Pending"
    ) {
      window.alert(
        "This request has already been processed."
      );

      return;
    }

    const actionText =
      newStatus === "Approved"
        ? "approve"
        : "reject";

    const confirmed =
      window.confirm(
        `Are you sure you want to ${actionText} this request?`
      );

    if (!confirmed) {
      return;
    }

    try {
      setProcessingId(
        request.databaseId
      );

      setErrorMessage("");

      await requestService.updateRequestStatus(
        request.databaseId,
        newStatus
      );

      setRequests(
        (previousRequests) =>
          previousRequests.map(
            (currentRequest) =>
              currentRequest.databaseId ===
              request.databaseId
                ? {
                    ...currentRequest,

                    status:
                      newStatus,

                    reviewedAt:
                      new Date()
                        .toISOString(),
                  }
                : currentRequest
          )
      );

      setSelectedRequest(
        (previousRequest) => {
          if (
            !previousRequest ||
            previousRequest.databaseId !==
              request.databaseId
          ) {
            return previousRequest;
          }

          return {
            ...previousRequest,

            status:
              newStatus,

            reviewedAt:
              new Date()
                .toISOString(),
          };
        }
      );

      if (
        newStatus ===
        "Approved"
      ) {
        window.alert(
          "Request approved successfully. Stock quantity and transaction were updated."
        );
      } else {
        window.alert(
          "Request rejected successfully."
        );
      }
    } catch (error) {
      setErrorMessage(
        error.message ||
          `Failed to ${actionText} request.`
      );

      window.alert(
        error.message ||
          `Failed to ${actionText} request.`
      );

      await loadRequests();
    } finally {
      setProcessingId(null);
    }
  };

  const handleApprove = (
    request
  ) => {
    updateStatus(
      request,
      "Approved"
    );
  };

  const handleReject = (
    request
  ) => {
    updateStatus(
      request,
      "Rejected"
    );
  };

  const openDetailsModal = (
    request
  ) => {
    setSelectedRequest(
      request
    );
  };

  const closeDetailsModal =
    () => {
      setSelectedRequest(
        null
      );
    };

  const pendingCount =
    requests.filter(
      (request) =>
        request.status ===
        "Pending"
    ).length;

  return (
    <section className="requests-page">
      <div className="requests-heading">
        <div>
          <h2>
            Requests Management
          </h2>

          <p>
            Review and manage
            office stock requests.
          </p>
        </div>

        <div className="request-summary">
          <span>
            Pending:{" "}
            {pendingCount}
          </span>
        </div>
      </div>

      <div className="requests-panel">
        {errorMessage && (
          <div className="requests-empty-message">
            {errorMessage}
          </div>
        )}

        <div className="requests-toolbar">
          <input
            type="text"
            placeholder="Search by request, employee, department or item..."
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
        </div>

        <div className="requests-table-wrapper">
          <table className="requests-table">
            <thead>
              <tr>
                <th>
                  Request ID
                </th>

                <th>
                  Employee
                </th>

                <th>
                  Department
                </th>

                <th>
                  Item
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
                    colSpan="8"
                    className="requests-empty-message"
                  >
                    Loading
                    requests...
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
                          {
                            request.id
                          }
                        </td>

                        <td className="request-employee">
                          {
                            request.employee
                          }
                        </td>

                        <td>
                          {
                            request.department
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
                          {formatDate(
                            request.requestDate
                          )}
                        </td>

                        <td>
                          <span
                            className={`request-status ${String(
                              request.status
                            ).toLowerCase()}`}
                          >
                            {
                              request.status
                            }
                          </span>
                        </td>

                        <td>
                          <div className="request-action-buttons">
                            <button
                              type="button"
                              className="request-view-button"
                              onClick={() =>
                                openDetailsModal(
                                  request
                                )
                              }
                            >
                              View
                            </button>

                            {request.status ===
                              "Pending" && (
                              <>
                                <button
                                  type="button"
                                  className="request-approve-button"
                                  disabled={
                                    processingId ===
                                    request.databaseId
                                  }
                                  onClick={() =>
                                    handleApprove(
                                      request
                                    )
                                  }
                                >
                                  {processingId ===
                                  request.databaseId
                                    ? "Processing..."
                                    : "Approve"}
                                </button>

                                <button
                                  type="button"
                                  className="request-reject-button"
                                  disabled={
                                    processingId ===
                                    request.databaseId
                                  }
                                  onClick={() =>
                                    handleReject(
                                      request
                                    )
                                  }
                                >
                                  Reject
                                </button>
                              </>
                            )}
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
                          colSpan="8"
                          className="requests-empty-message"
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

        <div className="requests-footer">
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
          className="request-modal-overlay"
          onMouseDown={
            closeDetailsModal
          }
        >
          <div
            className="request-modal"
            onMouseDown={(
              event
            ) =>
              event.stopPropagation()
            }
          >
            <div className="request-modal-header">
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
                className="request-modal-close"
                onClick={
                  closeDetailsModal
                }
                aria-label="Close modal"
              >
                ×
              </button>
            </div>

            <div className="request-details-grid">
              <div className="request-detail">
                <span>
                  Employee
                </span>

                <strong>
                  {
                    selectedRequest.employee
                  }
                </strong>
              </div>

              <div className="request-detail">
                <span>
                  Department
                </span>

                <strong>
                  {
                    selectedRequest.department
                  }
                </strong>
              </div>

              <div className="request-detail">
                <span>
                  Item
                </span>

                <strong>
                  {
                    selectedRequest.item
                  }
                </strong>
              </div>

              <div className="request-detail">
                <span>
                  Quantity
                </span>

                <strong>
                  {
                    selectedRequest.quantity
                  }
                </strong>
              </div>

              <div className="request-detail">
                <span>
                  Request Date
                </span>

                <strong>
                  {formatDate(
                    selectedRequest.requestDate
                  )}
                </strong>
              </div>

              <div className="request-detail">
                <span>
                  Status
                </span>

                <strong>
                  <span
                    className={`request-status ${String(
                      selectedRequest.status
                    ).toLowerCase()}`}
                  >
                    {
                      selectedRequest.status
                    }
                  </span>
                </strong>
              </div>
            </div>

            <div className="request-reason">
              <span>
                Reason
              </span>

              <p>
                {
                  selectedRequest.reason
                }
              </p>
            </div>

            <div className="request-modal-actions">
              <button
                type="button"
                className="request-close-button"
                onClick={
                  closeDetailsModal
                }
              >
                Close
              </button>

              {selectedRequest.status ===
                "Pending" && (
                <>
                  <button
                    type="button"
                    className="request-reject-modal-button"
                    disabled={
                      processingId ===
                      selectedRequest.databaseId
                    }
                    onClick={() =>
                      handleReject(
                        selectedRequest
                      )
                    }
                  >
                    Reject
                  </button>

                  <button
                    type="button"
                    className="request-approve-modal-button"
                    disabled={
                      processingId ===
                      selectedRequest.databaseId
                    }
                    onClick={() =>
                      handleApprove(
                        selectedRequest
                      )
                    }
                  >
                    {processingId ===
                    selectedRequest.databaseId
                      ? "Processing..."
                      : "Approve"}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

export default Requests;