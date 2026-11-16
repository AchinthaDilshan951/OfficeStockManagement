import {
  useEffect,
  useState,
} from "react";

import {
  Link,
  useNavigate,
} from "react-router-dom";

import authService from "../services/authService";

import officeStockLogo from "../assets/office-stock-logo.jpg";

import "./Login.css";

function Login() {
  const navigate =
    useNavigate();

  const [formData, setFormData] =
    useState({
      username: "",
      password: "",
    });

  const [
    isLoading,
    setIsLoading,
  ] = useState(false);

  const [
    errorMessage,
    setErrorMessage,
  ] = useState("");

  const [
    successMessage,
    setSuccessMessage,
  ] = useState("");

  useEffect(() => {
    const token =
      localStorage.getItem(
        "token"
      );

    const storedUser =
      authService.getCurrentUser();

    if (
      token &&
      storedUser
    ) {
      if (
        storedUser.role ===
        "Admin"
      ) {
        navigate(
          "/admin/dashboard",
          {
            replace: true,
          }
        );
      } else {
        navigate(
          "/user/dashboard",
          {
            replace: true,
          }
        );
      }
    }
  }, [navigate]);

  const handleChange = (
    event
  ) => {
    const {
      name,
      value,
    } = event.target;

    setFormData(
      (previousData) => ({
        ...previousData,
        [name]: value,
      })
    );

    setErrorMessage("");
    setSuccessMessage("");
  };

  const handleSubmit =
    async (event) => {
      event.preventDefault();

      const username =
        formData.username.trim();

      const password =
        formData.password;

      if (!username) {
        setErrorMessage(
          "Please enter your username."
        );

        return;
      }

      if (!password) {
        setErrorMessage(
          "Please enter your password."
        );

        return;
      }

      try {
        setIsLoading(true);
        setErrorMessage("");

        const response =
          await authService.login(
            username,
            password
          );

        const user =
          response?.user;

        if (!user) {
          throw new Error(
            "User information could not be loaded."
          );
        }

        setSuccessMessage(
          "Login successful."
        );

        if (
          user.role ===
          "Admin"
        ) {
          navigate(
            "/admin/dashboard",
            {
              replace: true,
            }
          );
        } else {
          navigate(
            "/user/dashboard",
            {
              replace: true,
            }
          );
        }
      } catch (error) {
        setErrorMessage(
          error.message ||
            "Login failed. Please try again."
        );
      } finally {
        setIsLoading(false);
      }
    };

  return (
    <main className="login-page">
      <div className="login-container">
        <div className="login-logo">
          <img
            src={officeStockLogo}
            alt="Office Stock Management Logo"
          />
        </div>

        <div className="login-brand">
          <h1>
            Office Stock Management
          </h1>

          <p>
            Management System
          </p>
        </div>

        <section className="login-card">
          <div className="login-heading">
            <h2>
              Welcome Back
            </h2>

            <p>
              Sign in to continue to
              your account.
            </p>
          </div>

          <form
            className="login-form"
            onSubmit={
              handleSubmit
            }
          >
            <div className="login-form-group">
              <label htmlFor="username">
                Username
              </label>

              <input
                id="username"
                name="username"
                type="text"
                placeholder="Enter username"
                value={
                  formData.username
                }
                onChange={
                  handleChange
                }
                autoComplete="username"
                disabled={
                  isLoading
                }
                required
              />
            </div>

            <div className="login-form-group">
              <label htmlFor="password">
                Password
              </label>

              <input
                id="password"
                name="password"
                type="password"
                placeholder="Enter password"
                value={
                  formData.password
                }
                onChange={
                  handleChange
                }
                autoComplete="current-password"
                disabled={
                  isLoading
                }
                required
              />
            </div>

            {errorMessage && (
              <div className="login-error-message">
                {errorMessage}
              </div>
            )}

            {successMessage && (
              <div className="login-success-message">
                {successMessage}
              </div>
            )}

            <button
              type="submit"
              className="login-submit-button"
              disabled={
                isLoading
              }
            >
              {isLoading
                ? "Signing In..."
                : "Sign In"}
            </button>
          </form>

          <div className="login-register-section">
            <span>
              Don't have an account?
            </span>

            <Link to="/register">
              Register
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}

export default Login;