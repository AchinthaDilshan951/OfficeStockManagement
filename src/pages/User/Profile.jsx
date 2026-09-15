import {
  useEffect,
  useState,
} from "react";

import userService from "../../services/userService";
import authService from "../../services/authService";

import "./Profile.css";

function Profile() {
  const [profileData, setProfileData] =
    useState({
      fullName: "",
      username: "",
      email: "",
      phone: "",
      department: "",
      role: "Employee",
      status: "Active",
    });

  const [passwordData, setPasswordData] =
    useState({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });

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

  useEffect(() => {
    const loadProfile = async () => {
      try {
        setIsLoading(true);
        setErrorMessage("");

        const currentUser =
          authService.getCurrentUser();

        const userId =
          currentUser?.user_id ??
          currentUser?.id;

        if (!userId) {
          throw new Error(
            "Logged-in user information could not be found."
          );
        }

        const response =
          await userService.getUserById(
            userId
          );

        const user =
          response.user ??
          response.data ??
          response;

        setProfileData({
          fullName:
            user.full_name ??
            user.fullName ??
            "",

          username:
            user.username ??
            "",

          email:
            user.email ??
            "",

          phone:
            user.phone ??
            "",

          department:
            user.department ??
            "",

          role:
            user.role === "User"
              ? "Employee"
              : user.role ||
                "Employee",

          status:
            user.status ||
            "Active",
        });
      } catch (error) {
        setErrorMessage(
          error.message ||
            "Failed to load profile."
        );
      } finally {
        setIsLoading(false);
      }
    };

    loadProfile();
  }, []);

  const getInitials = (
    name
  ) => {
    const words = String(
      name || ""
    )
      .trim()
      .split(/\s+/)
      .filter(Boolean);

    if (
      words.length === 0
    ) {
      return "U";
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

    setErrorMessage("");

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

    setErrorMessage("");

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
        2
      ) {
        window.alert(
          "Full name must contain at least 2 characters."
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

      if (
        cleanedDepartment.length <
        2
      ) {
        window.alert(
          "Department is required."
        );
        return;
      }

      try {
        setIsSavingProfile(
          true
        );

        setErrorMessage("");

        const currentUser =
          authService.getCurrentUser();

        const userId =
          currentUser?.user_id ??
          currentUser?.id;

        if (!userId) {
          throw new Error(
            "Logged-in user information could not be found."
          );
        }

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
          response.user ??
          response.data ??
          response;

        const updatedProfile = {
          fullName:
            updatedUser.full_name ??
            updatedUser.fullName ??
            cleanedFullName,

          username:
            updatedUser.username ??
            cleanedUsername,

          email:
            updatedUser.email ??
            cleanedEmail,

          phone:
            updatedUser.phone ??
            cleanedPhone,

          department:
            updatedUser.department ??
            cleanedDepartment,

          role:
            updatedUser.role ===
            "User"
              ? "Employee"
              : updatedUser.role ||
                profileData.role,

          status:
            updatedUser.status ??
            profileData.status,
        };

        setProfileData(
          updatedProfile
        );

        const updatedLocalUser = {
          ...(currentUser || {}),

          user_id:
            updatedUser.user_id ??
            userId,

          id:
            updatedUser.user_id ??
            currentUser?.id ??
            userId,

          full_name:
            updatedProfile.fullName,

          fullName:
            updatedProfile.fullName,

          username:
            updatedProfile.username,

          email:
            updatedProfile.email,

          phone:
            updatedProfile.phone,

          department:
            updatedProfile.department,

          role:
            updatedUser.role ??
            currentUser?.role ??
            "User",

          status:
            updatedProfile.status,
        };

        authService.updateCurrentUser(
          updatedLocalUser
        );

        window.dispatchEvent(
          new Event(
            "userUpdated"
          )
        );

        window.alert(
          "Profile updated successfully."
        );
      } catch (error) {
        setErrorMessage(
          error.message ||
            "Failed to update profile."
        );
      } finally {
        setIsSavingProfile(
          false
        );
      }
    };

  const handlePasswordSubmit =
    async (event) => {
      event.preventDefault();

      if (
        !passwordData.currentPassword.trim()
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

        setErrorMessage("");

        await authService.changePassword({
          currentPassword:
            passwordData.currentPassword,

          newPassword:
            passwordData.newPassword,

          confirmPassword:
            passwordData.confirmPassword,
        });

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

        window.alert(
          "Password changed successfully."
        );
      } catch (error) {
        setErrorMessage(
          error.message ||
            "Failed to change password."
        );
      } finally {
        setIsChangingPassword(
          false
        );
      }
    };

  const initials =
    getInitials(
      profileData.fullName
    );

  if (isLoading) {
    return (
      <section className="user-profile-page">
        <div className="user-profile-heading">
          <div>
            <h2>
              My Profile
            </h2>

            <p>
              Loading profile...
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="user-profile-page">
      <div className="user-profile-heading">
        <div>
          <h2>
            My Profile
          </h2>

          <p>
            Manage your account
            information and
            password.
          </p>
        </div>

        <span className="user-profile-status">
          {profileData.status ===
          "Active"
            ? "Active Account"
            : "Inactive Account"}
        </span>
      </div>

      {errorMessage && (
        <div className="request-error-message">
          {errorMessage}
        </div>
      )}

      <div className="user-profile-content">
        <aside className="user-profile-summary-card">
          <div className="user-profile-avatar">
            {initials}
          </div>

          <h3>
            {profileData.fullName ||
              "User"}
          </h3>

          <p>
            @
            {profileData.username}
          </p>

          <span className="user-profile-role">
            {profileData.role}
          </span>

          <div className="user-profile-summary-details">
            <div>
              <span>
                Department
              </span>

              <strong>
                {profileData.department ||
                  "-"}
              </strong>
            </div>

            <div>
              <span>
                Email
              </span>

              <strong>
                {profileData.email ||
                  "-"}
              </strong>
            </div>

            <div>
              <span>
                Phone
              </span>

              <strong>
                {profileData.phone ||
                  "-"}
              </strong>
            </div>
          </div>
        </aside>

        <div className="user-profile-forms">
          <form
            className="user-profile-card"
            onSubmit={
              handleProfileSubmit
            }
          >
            <div className="user-profile-card-header">
              <div>
                <h3>
                  Personal Information
                </h3>

                <p>
                  Update your
                  account
                  information.
                </p>
              </div>
            </div>

            <div className="user-profile-form-grid">
              <div className="user-profile-form-group">
                <label htmlFor="userFullName">
                  Full Name
                </label>

                <input
                  id="userFullName"
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

              <div className="user-profile-form-group">
                <label htmlFor="userUsername">
                  Username
                </label>

                <input
                  id="userUsername"
                  name="username"
                  type="text"
                  value={
                    profileData.username
                  }
                  readOnly
                />
              </div>

              <div className="user-profile-form-group">
                <label htmlFor="userEmail">
                  Email Address
                </label>

                <input
                  id="userEmail"
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

              <div className="user-profile-form-group">
                <label htmlFor="userPhone">
                  Phone Number
                </label>

                <input
                  id="userPhone"
                  name="phone"
                  type="tel"
                  value={
                    profileData.phone
                  }
                  onChange={
                    handleProfileChange
                  }
                  required
                />
              </div>

              <div className="user-profile-form-group">
                <label htmlFor="userDepartment">
                  Department
                </label>

                <input
                  id="userDepartment"
                  name="department"
                  type="text"
                  value={
                    profileData.department
                  }
                  onChange={
                    handleProfileChange
                  }
                  placeholder="Enter department"
                  required
                />
              </div>

              <div className="user-profile-form-group">
                <label htmlFor="userRole">
                  Role
                </label>

                <input
                  id="userRole"
                  name="role"
                  type="text"
                  value={
                    profileData.role
                  }
                  readOnly
                />
              </div>
            </div>

            <div className="user-profile-card-actions">
              <button
                type="submit"
                className="user-profile-save-button"
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
            className="user-profile-card"
            onSubmit={
              handlePasswordSubmit
            }
          >
            <div className="user-profile-card-header">
              <div>
                <h3>
                  Change Password
                </h3>

                <p>
                  Create a secure
                  password for your
                  account.
                </p>
              </div>
            </div>

            <div className="user-password-form">
              <div className="user-profile-form-group">
                <label htmlFor="userCurrentPassword">
                  Current Password
                </label>

                <div className="user-password-input-wrapper">
                  <input
                    id="userCurrentPassword"
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
                        (previousValue) =>
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

              <div className="user-profile-form-grid">
                <div className="user-profile-form-group">
                  <label htmlFor="userNewPassword">
                    New Password
                  </label>

                  <div className="user-password-input-wrapper">
                    <input
                      id="userNewPassword"
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

                <div className="user-profile-form-group">
                  <label htmlFor="userConfirmPassword">
                    Confirm Password
                  </label>

                  <div className="user-password-input-wrapper">
                    <input
                      id="userConfirmPassword"
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

            <div className="user-profile-card-actions">
              <button
                type="submit"
                className="user-password-save-button"
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