import { apiRequest } from "./api";

const getAllStockIn = async () => {
  return await apiRequest(
    "/stock-in",
    {
      method: "GET",
    }
  );
};

const createStockIn = async (
  stockData
) => {
  return await apiRequest(
    "/stock-in",
    {
      method: "POST",
      body: JSON.stringify(
        stockData
      ),
    }
  );
};

const getStockInById = async (
  stockInId
) => {
  return await apiRequest(
    `/stock-in/${stockInId}`,
    {
      method: "GET",
    }
  );
};

const stockInService = {
  getAllStockIn,
  createStockIn,
  getStockInById,
};

export default stockInService;