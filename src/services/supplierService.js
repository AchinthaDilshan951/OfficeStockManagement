import { apiRequest } from "./api";

const getAllSuppliers = async () => {
  return await apiRequest(
    "/suppliers",
    {
      method: "GET",
    }
  );
};

const getSupplierById = async (
  supplierId
) => {
  return await apiRequest(
    `/suppliers/${supplierId}`,
    {
      method: "GET",
    }
  );
};

const createSupplier = async (
  supplierData
) => {
  return await apiRequest(
    "/suppliers",
    {
      method: "POST",
      body: JSON.stringify(
        supplierData
      ),
    }
  );
};

const updateSupplier = async (
  supplierId,
  supplierData
) => {
  return await apiRequest(
    `/suppliers/${supplierId}`,
    {
      method: "PUT",
      body: JSON.stringify(
        supplierData
      ),
    }
  );
};

const deleteSupplier = async (
  supplierId
) => {
  return await apiRequest(
    `/suppliers/${supplierId}`,
    {
      method: "DELETE",
    }
  );
};

const supplierService = {
  getAllSuppliers,
  getSupplierById,
  createSupplier,
  updateSupplier,
  deleteSupplier,
};

export default supplierService;