import { apiRequest } from "./api";

const getAllItems = async () => {
  return await apiRequest(
    "/items",
    {
      method: "GET",
    }
  );
};

const getItemById = async (
  itemId
) => {
  return await apiRequest(
    `/items/${itemId}`,
    {
      method: "GET",
    }
  );
};

const createItem = async (
  itemData
) => {
  return await apiRequest(
    "/items",
    {
      method: "POST",
      body: JSON.stringify(
        itemData
      ),
    }
  );
};

const updateItem = async (
  itemId,
  itemData
) => {
  return await apiRequest(
    `/items/${itemId}`,
    {
      method: "PUT",
      body: JSON.stringify(
        itemData
      ),
    }
  );
};

const deleteItem = async (
  itemId
) => {
  return await apiRequest(
    `/items/${itemId}`,
    {
      method: "DELETE",
    }
  );
};

const itemService = {
  getAllItems,
  getItemById,
  createItem,
  updateItem,
  deleteItem,
};

export default itemService;