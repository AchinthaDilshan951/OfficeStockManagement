import { apiRequest } from "./api";

const getAllTransactions = async () => {
  return await apiRequest(
    "/transactions",
    {
      method: "GET",
    }
  );
};

const getTransactionById = async (
  transactionId
) => {
  return await apiRequest(
    `/transactions/${transactionId}`,
    {
      method: "GET",
    }
  );
};

const transactionService = {
  getAllTransactions,
  getTransactionById,
};

export default transactionService;