import { apiRequest } from "./api";

const getSummary = async () => {
  return await apiRequest(
    "/reports/summary",
    {
      method: "GET",
    }
  );
};

const getDailyReport = async (
  date
) => {
  return await apiRequest(
    `/reports/daily?date=${encodeURIComponent(
      date
    )}`,
    {
      method: "GET",
    }
  );
};

const getMonthlyReport = async (
  year,
  month
) => {
  return await apiRequest(
    `/reports/monthly?year=${year}&month=${month}`,
    {
      method: "GET",
    }
  );
};

const getLowStockReport =
  async () => {
    return await apiRequest(
      "/reports/low-stock",
      {
        method: "GET",
      }
    );
  };

const getTransactions = async (
  filters = {}
) => {
  const params =
    new URLSearchParams();

  if (filters.type) {
    params.append(
      "type",
      filters.type
    );
  }

  if (filters.fromDate) {
    params.append(
      "fromDate",
      filters.fromDate
    );
  }

  if (filters.toDate) {
    params.append(
      "toDate",
      filters.toDate
    );
  }

  const queryString =
    params.toString();

  return await apiRequest(
    `/transactions${
      queryString
        ? `?${queryString}`
        : ""
    }`,
    {
      method: "GET",
    }
  );
};

const reportService = {
  getSummary,
  getDailyReport,
  getMonthlyReport,
  getLowStockReport,
  getTransactions,
};

export default reportService;