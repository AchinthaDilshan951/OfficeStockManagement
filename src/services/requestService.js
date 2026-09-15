import { apiRequest } from "./api";

const createRequest = async (
  requestData
) => {
  return await apiRequest(
    "/requests",
    {
      method: "POST",
      body: JSON.stringify(
        requestData
      ),
    }
  );
};

const getAllRequests = async () => {
  return await apiRequest(
    "/requests",
    {
      method: "GET",
    }
  );
};

const updateRequestStatus = async (
  requestId,
  status
) => {
  return await apiRequest(
    `/requests/${requestId}/status`,
    {
      method: "PATCH",
      body: JSON.stringify({
        status,
      }),
    }
  );
};

const requestService = {
  createRequest,
  getAllRequests,
  updateRequestStatus,
};

export default requestService;