import { apiRequest } from "./api";

const getAllUsers = async () => {
  return await apiRequest(
    "/users",
    {
      method: "GET",
    }
  );
};

const getUserById = async (
  userId
) => {
  return await apiRequest(
    `/users/${userId}`,
    {
      method: "GET",
    }
  );
};

const updateUser = async (
  userId,
  userData
) => {
  return await apiRequest(
    `/users/${userId}`,
    {
      method: "PUT",
      body: JSON.stringify(
        userData
      ),
    }
  );
};

const updateUserRole = async (
  userId,
  role
) => {
  return await apiRequest(
    `/users/${userId}/role`,
    {
      method: "PATCH",
      body: JSON.stringify({
        role,
      }),
    }
  );
};

const updateUserStatus = async (
  userId,
  status
) => {
  return await apiRequest(
    `/users/${userId}/status`,
    {
      method: "PATCH",
      body: JSON.stringify({
        status,
      }),
    }
  );
};

const userService = {
  getAllUsers,
  getUserById,
  updateUser,
  updateUserRole,
  updateUserStatus,
};

export default userService;