import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import Login from "./pages/Login";
import Register from "./pages/Register";

import ProtectedRoute from "./routes/ProtectedRoute";

import MainLayout from "./layouts/MainLayout";
import UserLayout from "./layouts/UserLayout";

import AdminDashboard from "./pages/Admin/Dashboard";
import Items from "./pages/Admin/Items";
import Categories from "./pages/Admin/Categories";
import Suppliers from "./pages/Admin/Suppliers";
import StockIn from "./pages/Admin/StockIn";
import Requests from "./pages/Admin/Requests";
import Transactions from "./pages/Admin/Transactions";
import Reports from "./pages/Admin/Reports";
import Users from "./pages/Admin/Users";
import Logs from "./pages/Admin/Logs";
import AdminProfile from "./pages/Admin/Profile";

import UserDashboard from "./pages/User/Dashboard";
import AvailableItems from "./pages/User/AvailableItems";
import CreateRequest from "./pages/User/CreateRequest";
import MyRequests from "./pages/User/MyRequests";
import UserProfile from "./pages/User/Profile";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />

        <Route
          path="/register"
          element={<Register />}
        />

        <Route
          element={
            <ProtectedRoute allowedRole="Admin" />
          }
        >
          <Route
            path="/admin"
            element={<MainLayout />}
          >
            <Route
              index
              element={
                <Navigate
                  to="dashboard"
                  replace
                />
              }
            />

            <Route
              path="dashboard"
              element={<AdminDashboard />}
            />

            <Route
              path="items"
              element={<Items />}
            />

            <Route
              path="categories"
              element={<Categories />}
            />

            <Route
              path="suppliers"
              element={<Suppliers />}
            />

            <Route
              path="stock-in"
              element={<StockIn />}
            />

            <Route
              path="requests"
              element={<Requests />}
            />

            <Route
              path="transactions"
              element={<Transactions />}
            />

            <Route
              path="reports"
              element={<Reports />}
            />

            <Route
              path="users"
              element={<Users />}
            />

            <Route
              path="logs"
              element={<Logs />}
            />

            <Route
              path="profile"
              element={<AdminProfile />}
            />

            <Route
              path="*"
              element={
                <Navigate
                  to="dashboard"
                  replace
                />
              }
            />
          </Route>
        </Route>

        <Route
          element={
            <ProtectedRoute allowedRole="User" />
          }
        >
          <Route
            path="/user"
            element={<UserLayout />}
          >
            <Route
              index
              element={
                <Navigate
                  to="dashboard"
                  replace
                />
              }
            />

            <Route
              path="dashboard"
              element={<UserDashboard />}
            />

            <Route
              path="items"
              element={<AvailableItems />}
            />

            <Route
              path="create-request"
              element={<CreateRequest />}
            />

            <Route
              path="my-requests"
              element={<MyRequests />}
            />

            <Route
              path="profile"
              element={<UserProfile />}
            />

            <Route
              path="*"
              element={
                <Navigate
                  to="dashboard"
                  replace
                />
              }
            />
          </Route>
        </Route>

        <Route
          path="*"
          element={
            <Navigate
              to="/"
              replace
            />
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;