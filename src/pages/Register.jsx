import { useState } from "react";

import {
  Link,
  useNavigate,
} from "react-router-dom";

import authService from "../services/authService";

import "./Register.css";

function Register() {
  const navigate = useNavigate();

  const [formData, setFormData] =
    useState({
      fullName: "",
      username: "",
      email: "",
      phone: "",
      department: "",
      password: "",
      confirmPassword: "",
    });

  const [
    showPassword,
    setShowPassword,
  ] = useState(false);

  const [
    showConfirmPassword,
    setShowConfirmPassword,
  ] = useState(false);

  const [
    errorMessage,
    setErrorMessage,
  ] = useState("");

  const [
    successMessage,
    setSuccessMessage,
  ] = useState("");

  const [
    isLoading,
    setIsLoading,
  ] = useState(false);

  const handleInputChange = (
    event
  ) => {
    const {
      name,
      value,
    } = event.target;

    setErrorMessage("");
    setSuccessMessage("");

    setFormData(
      (previousData) => ({
        ...previousData,
        [name]: value,
      })
    );
  };

  const handleSubmit = async (
    event
  ) => {
    event.preventDefault();

    const cleanedData = {
      fullName:
        formData.fullName.trim(),

      username:
        formData.username.trim(),

      email:
        formData.email
          .trim()
          .toLowerCase(),

      phone:
        formData.phone.trim(),

      department:
        formData.department.trim(),

      password:
        formData.password,

      confirmPassword:
        formData.confirmPassword,
    };

    if (
      !cleanedData.fullName ||
      !cleanedData.username ||
      !cleanedData.email ||
      !cleanedData.phone ||
      !cleanedData.department ||
      !cleanedData.password ||
      !cleanedData.confirmPassword
    ) {
      setErrorMessage(
        "Please complete all required fields."
      );

      return;
    }

    if (
      cleanedData.fullName.length <
      3
    ) {
      setErrorMessage(
        "Full name must contain at least 3 characters."
      );

      return;
    }

    if (
      cleanedData.username.length <
      3
    ) {
      setErrorMessage(
        "Username must contain at least 3 characters."
      );

      return;
    }

    const usernamePattern =
      /^[a-zA-Z0-9_]+$/;

    if (
      !usernamePattern.test(
        cleanedData.username
      )
    ) {
      setErrorMessage(
        "Username can only contain letters, numbers and underscores."
      );

      return;
    }

    const emailPattern =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (
      !emailPattern.test(
        cleanedData.email
      )
    ) {
      setErrorMessage(
        "Please enter a valid email address."
      );

      return;
    }

    const phonePattern =
      /^[0-9]{10}$/;

    if (
      !phonePattern.test(
        cleanedData.phone
      )
    ) {
      setErrorMessage(
        "Phone number must contain exactly 10 digits."
      );

      return;
    }

    if (
      cleanedData.password.length <
      6
    ) {
      setErrorMessage(
        "Password must contain at least 6 characters."
      );

      return;
    }

    if (
      cleanedData.password !==
      cleanedData.confirmPassword
    ) {
      setErrorMessage(
        "Password and confirm password do not match."
      );

      return;
    }

    setIsLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const response =
        await authService.register({
          fullName:
            cleanedData.fullName,

          username:
            cleanedData.username,

          email:
            cleanedData.email,

          phone:
            cleanedData.phone,

          department:
            cleanedData.department,

          password:
            cleanedData.password,
        });

      if (!response?.user) {
        throw new Error(
          "Invalid registration response."
        );
      }

      setSuccessMessage(
        "Account created successfully. Redirecting to login..."
      );

      setTimeout(() => {
        navigate("/", {
          replace: true,

          state: {
            registeredUsername:
              response.user.username,
          },
        });
      }, 1000);
    } catch (error) {
      setErrorMessage(
        error.message ||
          "Registration failed. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="register-page">
      <section className="register-card">
        <div className="register-logo">
          📦
        </div>

        <div className="register-brand">
          <h1>
            Office Stock
          </h1>

          <h2>
            Management System
          </h2>
        </div>

        <div className="register-heading">
          <h3>
            Create Account
          </h3>

          <p>
            Register to access
            the stock system
          </p>
        </div>

        {errorMessage && (
          <div className="register-error-message">
            {errorMessage}
          </div>
        )}

        {successMessage && (
          <div className="register-success-message">
            {successMessage}
          </div>
        )}

        <form
          className="register-form"
          onSubmit={handleSubmit}
        >
          <div className="register-form-group">
            <label htmlFor="fullName">
              Full Name
            </label>

            <input
              id="fullName"
              name="fullName"
              type="text"
              placeholder="Enter your full name"
              value={
                formData.fullName
              }
              onChange={
                handleInputChange
              }
              autoComplete="name"
            />
          </div>

          <div className="register-form-group">
            <label htmlFor="username">
              Username
            </label>

            <input
              id="username"
              name="username"
              type="text"
              placeholder="Enter a username"
              value={
                formData.username
              }
              onChange={
                handleInputChange
              }
              autoComplete="username"
            />
          </div>

          <div className="register-form-group">
            <label htmlFor="email">
              Email Address
            </label>

            <input
              id="email"
              name="email"
              type="email"
              placeholder="Enter your email address"
              value={
                formData.email
              }
              onChange={
                handleInputChange
              }
              autoComplete="email"
            />
          </div>

          <div className="register-form-group">
            <label htmlFor="phone">
              Phone Number
            </label>

            <input
              id="phone"
              name="phone"
              type="tel"
              placeholder="Example: 0771234567"
              value={
                formData.phone
              }
              onChange={
                handleInputChange
              }
              maxLength="10"
              autoComplete="tel"
            />
          </div>

          <div className="register-form-group">
            <label htmlFor="department">
              Department
            </label>

            <select
              id="department"
              name="department"
              value={
                formData.department
              }
              onChange={
                handleInputChange
              }
            >
              <option value="">
                Select department
              </option>

              <option value="Administration">
                Administration
              </option>

              <option value="Accounts">
                Accounts
              </option>

              <option value="IT">
                IT
              </option>

              <option value="Human Resources">
                Human Resources
              </option>

              <option value="Marketing">
                Marketing
              </option>
            </select>
          </div>

          <div className="register-form-group">
            <label htmlFor="password">
              Password
            </label>

            <div className="register-password-wrapper">
              <input
                id="password"
                name="password"
                type={
                  showPassword
                    ? "text"
                    : "password"
                }
                placeholder="Minimum 6 characters"
                value={
                  formData.password
                }
                onChange={
                  handleInputChange
                }
                autoComplete="new-password"
              />

              <button
                type="button"
                className="register-show-password"
                onClick={() =>
                  setShowPassword(
                    (
                      previousValue
                    ) =>
                      !previousValue
                  )
                }
              >
                {showPassword
                  ? "Hide"
                  : "Show"}
              </button>
            </div>
          </div>

          <div className="register-form-group">
            <label htmlFor="confirmPassword">
              Confirm Password
            </label>

            <div className="register-password-wrapper">
              <input
                id="confirmPassword"
                name="confirmPassword"
                type={
                  showConfirmPassword
                    ? "text"
                    : "password"
                }
                placeholder="Enter password again"
                value={
                  formData
                    .confirmPassword
                }
                onChange={
                  handleInputChange
                }
                autoComplete="new-password"
              />

              <button
                type="button"
                className="register-show-password"
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

          <button
            type="submit"
            className="register-submit-button"
            disabled={
              isLoading
            }
          >
            {isLoading
              ? "Creating Account..."
              : "Create Account"}
          </button>
        </form>

        <div className="register-login-section">
          <span>
            Already have an
            account?
          </span>

          <Link to="/">
            Login
          </Link>
        </div>
      </section>
    </main>
  );
}

export default Register;