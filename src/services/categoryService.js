import { apiRequest } from "./api";

const getAllCategories = async () => {
  return await apiRequest(
    "/categories",
    {
      method: "GET",
    }
  );
};

const getCategoryById = async (
  categoryId
) => {
  return await apiRequest(
    `/categories/${categoryId}`,
    {
      method: "GET",
    }
  );
};

const createCategory = async (
  categoryData
) => {
  return await apiRequest(
    "/categories",
    {
      method: "POST",
      body: JSON.stringify(
        categoryData
      ),
    }
  );
};

const updateCategory = async (
  categoryId,
  categoryData
) => {
  return await apiRequest(
    `/categories/${categoryId}`,
    {
      method: "PUT",
      body: JSON.stringify(
        categoryData
      ),
    }
  );
};

const deleteCategory = async (
  categoryId
) => {
  return await apiRequest(
    `/categories/${categoryId}`,
    {
      method: "DELETE",
    }
  );
};

const categoryService = {
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
};

export default categoryService;