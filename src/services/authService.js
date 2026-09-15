import {
  apiRequest,
} from "./api";

const login = async (
  username,
  password
) => {
  const data =
    await apiRequest(
      "/auth/login",
      {
        method: "POST",
        body: JSON.stringify({
          username,
          password,
        }),
      }
    );

  if (data.token) {
    localStorage.setItem(
      "token",
      data.token
    );

    localStorage.setItem(
      "user",
      JSON.stringify(
        data.user
      )
    );
  }

  return data;
};

const register = async (
  userData
) => {
  return await apiRequest(
    "/auth/register",
    {
      method: "POST",
      body: JSON.stringify(
        userData
      ),
    }
  );
};

const changePassword = async (
  passwordData
) => {
  return await apiRequest(
    "/auth/change-password",
    {
      method: "PATCH",
      body: JSON.stringify({
        currentPassword:
          passwordData.currentPassword,

        newPassword:
          passwordData.newPassword,

        confirmPassword:
          passwordData.confirmPassword,
      }),
    }
  );
};

const logout = () => {
  localStorage.removeItem(
    "token"
  );

  localStorage.removeItem(
    "user"
  );
};

const getCurrentUser = () => {
  const user =
    localStorage.getItem(
      "user"
    );

  if (!user) {
    return null;
  }

  try {
    return JSON.parse(
      user
    );
  } catch {
    return null;
  }
};

const updateCurrentUser = (
  userData
) => {
  localStorage.setItem(
    "user",
    JSON.stringify(
      userData
    )
  );
};

const getToken = () => {
  return localStorage.getItem(
    "token"
  );
};

const isAuthenticated = () => {
  return Boolean(
    localStorage.getItem(
      "token"
    )
  );
};

const authService = {
  login,
  register,
  changePassword,
  logout,
  getCurrentUser,
  updateCurrentUser,
  getToken,
  isAuthenticated,
};

export default authService;