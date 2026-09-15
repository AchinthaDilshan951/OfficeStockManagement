import { apiRequest } from "./api";

const getAllLogs = async () => {
  return await apiRequest(
    "/logs",
    {
      method: "GET",
    }
  );
};

const getLogById = async (
  logId
) => {
  return await apiRequest(
    `/logs/${logId}`,
    {
      method: "GET",
    }
  );
};

const logService = {
  getAllLogs,
  getLogById,
};

export default logService;