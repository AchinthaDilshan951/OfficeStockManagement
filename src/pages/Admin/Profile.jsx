import {
  useEffect,
  useState,
} from "react";

import userService from "../../services/userService";
import authService from "../../services/authService";

import "./Profile.css";

function Profile() {
  const [
    profileData,
    setProfileData,
  ] = useState({
    fullName: "",
    username: "",
    email: "",
    phone: "",
    department: "",
    role: "Admin",
    status: "Active",
  });

  const [
    passwordData,
    setPasswordData,
  ] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [
    isLoading,
    setIsLoading,
  ] = useState(true);

  const [
    isSavingProfile,
    setIsSavingProfile,
  ] = useState(false);

  const [
    isChangingPassword,
    setIsChangingPassword,
  ] = useState(false);

  const [
    errorMessage,
    setErrorMessage,
  ] = useState("");

  const [
    showCurrentPassword,
    setShowCurrentPassword,
  ] = useState(false);

  const [
    showNewPassword,
    setShowNewPassword,
  ] = useState(false);

  const [
    showConfirmPassword,
    setShowConfirmPassword,
  ] = useState(false);

  const getStoredUser = () => {
    try {
      return JSON.parse(
        localStorage.getItem("user") ||
          "null"
      );
    } catch {
      return null;
    }
  };

  const normalizeUser = (user) => {
    return {
      userId:
        user?.user_id ??
        user?.userId ??
        user?.id ??
        null,

      userCode:
        user?.user_code ??
        user?.userCode ??
        "",

      fullName:
        user?.full_name ??
        user?.fullName ??
        "",

      username:
        user?.username ??
        "",

      email:
        user?.email ??
        "",

      phone:
        user?.phone ??
        "",

      department:
        user?.department ??
        "",

      role:
        user?.role ??
        "Admin",

      status:
        user?.status ??
        "Active",
    };
  };

  const loadProfile = async () => {
    try {
      setIsLoading(true);
      setErrorMessage("");

      const storedUser =
        getStoredUser();

      if (!storedUser) {
        setErrorMessage(
          "Logged-in user information could not be found."
        );

        return;
      }

      const storedProfile =
        normalizeUser(
          storedUser
        );

      if (
        !storedProfile.userId
      ) {
        setErrorMessage(
          "User ID could not be found."
        );

        return;
      }

      const response =
        await userService.getUserById(
          storedProfile.userId
        );

      const backendUser =
        response?.user ??
        response?.data ??
        response;

      const normalizedUser =
        normalizeUser(
          backendUser
        );

      setProfileData({
        fullName:
          normalizedUser.fullName,

        username:
          normalizedUser.username,

        email:
          normalizedUser.email,

        phone:
          normalizedUser.phone,

        department:
          normalizedUser.department,

        role:
          normalizedUser.role,

        status:
          normalizedUser.status,
      });

      const updatedStoredUser = {
        ...storedUser,

        user_id:
          normalizedUser.userId,

        user_code:
          normalizedUser.userCode,

        full_name:
          normalizedUser.fullName,

        username:
          normalizedUser.username,

        email:
          normalizedUser.email,

        phone:
          normalizedUser.phone,

        department:
          normalizedUser.department,

        role:
          normalizedUser.role,

        status:
          normalizedUser.status,
      };

      authService.updateCurrentUser(
        updatedStoredUser
      );
    } catch (error) {
      setErrorMessage(
        error.message ||
          "Failed to load profile information."
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const getInitials = (name) => {
    const words = String(
      name || ""
    )
      .trim()
      .split(/\s+/)
      .filter(Boolean);

    if (
      words.length === 0
    ) {
      return "AD";
    }

    if (
      words.length === 1
    ) {
      return words[0]
        .charAt(0)
        .toUpperCase();
    }

    return (
      words[0].charAt(0) +
      words[
        words.length - 1
      ].charAt(0)
    ).toUpperCase();
  };

  const handleProfileChange = (
    event
  ) => {
    const {
      name,
      value,
    } = event.target;

    setProfileData(
      (previousData) => ({
        ...previousData,
        [name]: value,
      })
    );
  };

  const handlePasswordChange = (
    event
  ) => {
    const {
      name,
      value,
    } = event.target;

    setPasswordData(
      (previousData) => ({
        ...previousData,
        [name]: value,
      })
    );
  };

  const handleProfileSubmit =
    async (event) => {
      event.preventDefault();

      const storedUser =
        getStoredUser();

      const userId =
        storedUser?.user_id ??
        storedUser?.userId ??
        storedUser?.id;

      if (!userId) {
        window.alert(
          "User ID could not be found."
        );

        return;
      }

      const cleanedFullName =
        profileData.fullName.trim();

      const cleanedUsername =
        profileData.username
          .trim()
          .toLowerCase();

      const cleanedEmail =
        profileData.email
          .trim()
          .toLowerCase();

      const cleanedPhone =
        profileData.phone.trim();

      const cleanedDepartment =
        profileData.department.trim();

      if (
        cleanedFullName.length <
        3
      ) {
        window.alert(
          "Full name must contain at least 3 characters."
        );

        return;
      }

      if (
        cleanedUsername.length <
        3
      ) {
        window.alert(
          "Username is invalid."
        );

        return;
      }

      const emailPattern =
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      if (
        !emailPattern.test(
          cleanedEmail
        )
      ) {
        window.alert(
          "Please enter a valid email address."
        );

        return;
      }

      if (cleanedPhone) {
        const phonePattern =
          /^[0-9+\-\s]{7,15}$/;

        if (
          !phonePattern.test(
            cleanedPhone
          )
        ) {
          window.alert(
            "Please enter a valid phone number."
          );

          return;
        }
      }

      if (
        !cleanedDepartment
      ) {
        window.alert(
          "Department is required."
        );

        return;
      }

      try {
        setIsSavingProfile(true);

        const response =
          await userService.updateUser(
            userId,
            {
              fullName:
                cleanedFullName,

              username:
                cleanedUsername,

              email:
                cleanedEmail,

              phone:
                cleanedPhone,

              department:
                cleanedDepartment,
            }
          );

        const updatedUser =
          response?.user ??
          response?.data ??
          null;

        const normalizedUpdatedUser =
          updatedUser
            ? normalizeUser(
                updatedUser
              )
            : {
                ...normalizeUser(
                  storedUser
                ),

                fullName:
                  cleanedFullName,

                username:
                  cleanedUsername,

                email:
                  cleanedEmail,

                phone:
                  cleanedPhone,

                department:
                  cleanedDepartment,
              };

        const newStoredUser = {
          ...storedUser,

          user_id:
            normalizedUpdatedUser.userId ??
            userId,

          user_code:
            normalizedUpdatedUser.userCode ??
            storedUser.user_code,

          full_name:
            normalizedUpdatedUser.fullName,

          username:
            normalizedUpdatedUser.username ||
            cleanedUsername,

          email:
            normalizedUpdatedUser.email,

          phone:
            normalizedUpdatedUser.phone,

          department:
            normalizedUpdatedUser.department,

          role:
            normalizedUpdatedUser.role ||
            profileData.role,

          status:
            normalizedUpdatedUser.status ||
            profileData.status,
        };

        authService.updateCurrentUser(
          newStoredUser
        );

        setProfileData(
          (previousData) => ({
            ...previousData,

            fullName:
              normalizedUpdatedUser.fullName,

            username:
              normalizedUpdatedUser.username ||
              cleanedUsername,

            email:
              normalizedUpdatedUser.email,

            phone:
              normalizedUpdatedUser.phone,

            department:
              normalizedUpdatedUser.department,
          })
        );

        window.alert(
          response?.message ||
            "Admin profile updated successfully."
        );

        window.location.reload();
      } catch (error) {
        window.alert(
          error.message ||
            "Failed to update profile."
        );
      } finally {
        setIsSavingProfile(false);
      }
    };

  const handlePasswordSubmit =
    async (event) => {
      event.preventDefault();

      if (
        !passwordData.currentPassword
          .trim()
      ) {
        window.alert(
          "Please enter your current password."
        );

        return;
      }

      if (
        passwordData.newPassword
          .length < 6
      ) {
        window.alert(
          "New password must contain at least 6 characters."
        );

        return;
      }

      if (
        passwordData.newPassword !==
        passwordData.confirmPassword
      ) {
        window.alert(
          "New passwords do not match."
        );

        return;
      }

      if (
        passwordData.currentPassword ===
        passwordData.newPassword
      ) {
        window.alert(
          "New password must be different from the current password."
        );

        return;
      }

      try {
        setIsChangingPassword(
          true
        );

        const response =
          await authService.changePassword(
            {
              currentPassword:
                passwordData.currentPassword,

              newPassword:
                passwordData.newPassword,

              confirmPassword:
                passwordData.confirmPassword,
            }
          );

        window.alert(
          response?.message ||
            "Password changed successfully."
        );

        setPasswordData({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });

        setShowCurrentPassword(
          false
        );

        setShowNewPassword(
          false
        );

        setShowConfirmPassword(
          false
        );
      } catch (error) {
        window.alert(
          error.message ||
            "Failed to change password."
        );
      } finally {
        setIsChangingPassword(
          false
        );
      }
    };

  const departmentOptions = [
    "Administration",
    "Accounts",
    "Finance Department",
    "IT",
    "IT Department",
    "Human Resources",
    "Marketing",
  ];

  const visibleDepartments =
    profileData.department &&
    !departmentOptions.includes(
      profileData.department
    )
      ? [
          profileData.department,
          ...departmentOptions,
        ]
      : departmentOptions;

  const initials =
    getInitials(
      profileData.fullName
    );

  if (isLoading) {
    return (
      <section className="profile-page">
        <div className="profile-heading">
          <div>
            <h2>
              Admin Profile
            </h2>

            <p>
              Loading account
              information...
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="profile-page">
      <div className="profile-heading">
        <div>
          <h2>
            Admin Profile
          </h2>

          <p>
            Manage your account
            information and password.
          </p>
        </div>

        <span className="profile-account-status">
          {profileData.status ===
          "Active"
            ? "Active Account"
            : "Inactive Account"}
        </span>
      </div>

      {errorMessage && (
        <div className="profile-card">
          {errorMessage}
        </div>
      )}

      <div className="profile-content">
        <aside className="profile-summary-card">
          <div className="profile-avatar">
            {initials}
          </div>

          <h3>
            {profileData.fullName}
          </h3>

          <p>
            @{profileData.username}
          </p>

          <span className="profile-role">
            {profileData.role ===
            "Admin"
              ? "Administrator"
              : profileData.role}
          </span>

          <div className="profile-summary-details">
            <div>
              <span>
                Department
              </span>

              <strong>
                {
                  profileData.department
                }
              </strong>
            </div>

            <div>
              <span>
                Email
              </span>

              <strong>
                {profileData.email}
              </strong>
            </div>

            <div>
              <span>
                Phone
              </span>

              <strong>
                {profileData.phone ||
                  "Not provided"}
              </strong>
            </div>
          </div>
        </aside>

        <div className="profile-forms">
          <form
            className="profile-card"
            onSubmit={
              handleProfileSubmit
            }
          >
            <div className="profile-card-header">
              <div>
                <h3>
                  Personal Information
                </h3>

                <p>
                  Update your profile
                  details.
                </p>
              </div>
            </div>

            <div className="profile-form-grid">
              <div className="profile-form-group">
                <label htmlFor="fullName">
                  Full Name
                </label>

                <input
                  id="fullName"
                  name="fullName"
                  type="text"
                  value={
                    profileData.fullName
                  }
                  onChange={
                    handleProfileChange
                  }
                  required
                />
              </div>

              <div className="profile-form-group">
                <label htmlFor="username">
                  Username
                </label>

                <input
                  id="username"
                  name="username"
                  type="text"
                  value={
                    profileData.username
                  }
                  readOnly
                />
              </div>

              <div className="profile-form-group">
                <label htmlFor="email">
                  Email Address
                </label>

                <input
                  id="email"
                  name="email"
                  type="email"
                  value={
                    profileData.email
                  }
                  onChange={
                    handleProfileChange
                  }
                  required
                />
              </div>

              <div className="profile-form-group">
                <label htmlFor="phone">
                  Phone Number
                </label>

                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={
                    profileData.phone
                  }
                  onChange={
                    handleProfileChange
                  }
                  maxLength="15"
                />
              </div>

              <div className="profile-form-group">
                <label htmlFor="department">
                  Department
                </label>

                <select
                  id="department"
                  name="department"
                  value={
                    profileData.department
                  }
                  onChange={
                    handleProfileChange
                  }
                  required
                >
                  {visibleDepartments.map(
                    (department) => (
                      <option
                        key={department}
                        value={department}
                      >
                        {department}
                      </option>
                    )
                  )}
                </select>
              </div>

              <div className="profile-form-group">
                <label htmlFor="role">
                  Role
                </label>

                <input
                  id="role"
                  name="role"
                  type="text"
                  value={
                    profileData.role ===
                    "Admin"
                      ? "Administrator"
                      : profileData.role
                  }
                  readOnly
                />
              </div>
            </div>

            <div className="profile-card-actions">
              <button
                type="submit"
                className="profile-save-button"
                disabled={
                  isSavingProfile
                }
              >
                {isSavingProfile
                  ? "Saving..."
                  : "Save Changes"}
              </button>
            </div>
          </form>

          <form
            className="profile-card"
            onSubmit={
              handlePasswordSubmit
            }
          >
            <div className="profile-card-header">
              <div>
                <h3>
                  Change Password
                </h3>

                <p>
                  Use a secure password
                  for your account.
                </p>
              </div>
            </div>

            <div className="password-form">
              <div className="profile-form-group">
                <label htmlFor="currentPassword">
                  Current Password
                </label>

                <div className="password-input-wrapper">
                  <input
                    id="currentPassword"
                    name="currentPassword"
                    type={
                      showCurrentPassword
                        ? "text"
                        : "password"
                    }
                    placeholder="Enter current password"
                    value={
                      passwordData.currentPassword
                    }
                    onChange={
                      handlePasswordChange
                    }
                    required
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowCurrentPassword(
                        (
                          previousValue
                        ) =>
                          !previousValue
                      )
                    }
                  >
                    {showCurrentPassword
                      ? "Hide"
                      : "Show"}
                  </button>
                </div>
              </div>

              <div className="profile-form-grid">
                <div className="profile-form-group">
                  <label htmlFor="newPassword">
                    New Password
                  </label>

                  <div className="password-input-wrapper">
                    <input
                      id="newPassword"
                      name="newPassword"
                      type={
                        showNewPassword
                          ? "text"
                          : "password"
                      }
                      placeholder="Enter new password"
                      value={
                        passwordData.newPassword
                      }
                      onChange={
                        handlePasswordChange
                      }
                      required
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setShowNewPassword(
                          (
                            previousValue
                          ) =>
                            !previousValue
                        )
                      }
                    >
                      {showNewPassword
                        ? "Hide"
                        : "Show"}
                    </button>
                  </div>
                </div>

                <div className="profile-form-group">
                  <label htmlFor="confirmPassword">
                    Confirm Password
                  </label>

                  <div className="password-input-wrapper">
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={
                        showConfirmPassword
                          ? "text"
                          : "password"
                      }
                      placeholder="Confirm new password"
                      value={
                        passwordData.confirmPassword
                      }
                      onChange={
                        handlePasswordChange
                      }
                      required
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword(
                          (
                            previousValue
                          ) =>
                            !previousValue
                        )
                      }
                    >
                      {showConfirmPassword
                        ? "Hide"
                        : "Show"}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="profile-card-actions">
              <button
                type="submit"
                className="password-save-button"
                disabled={
                  isChangingPassword
                }
              >
                {isChangingPassword
                  ? "Changing..."
                  : "Change Password"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}

export default Profile;