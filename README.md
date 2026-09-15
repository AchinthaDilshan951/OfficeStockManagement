# Office Stock Management System

Office Stock Management System is a web-based application developed to manage office stock, item requests, stock transactions, users, suppliers, categories, reports, and system activities.

The system provides separate interfaces for Administrators and Employees. It uses a React frontend, Node.js/Express backend, and MySQL relational database.

---

## Technologies Used

### Frontend
- React
- Vite
- JavaScript
- CSS
- React Router

### Backend
- Node.js
- Express.js
- REST API

### Database
- MySQL

### Security and Validation
- JWT Authentication
- bcrypt Password Hashing
- Express Validator
- Role-Based Access Control
- Parameterized SQL Queries

### API Documentation
- Swagger / OpenAPI

---

## Main Features

### Admin Portal

Administrators can:

- View dashboard summary
- Manage items
- Manage categories
- Manage suppliers
- Record stock-in transactions
- View employee stock requests
- Approve or reject requests
- View stock transactions
- Generate reports
- Manage users
- View system logs
- Update profile information
- Change password

### Employee Portal

Employees can:

- View dashboard
- View available stock items
- Create stock requests
- View their own requests
- Track request status
- Update profile information
- Change password

---

## Stock Request Process

1. Employee logs into the system.
2. Employee selects an available item.
3. Employee enters the required quantity and reason.
4. A new request is created with `Pending` status.
5. Administrator reviews the request.
6. Administrator can approve or reject the request.
7. If approved:
   - Stock quantity is automatically reduced.
   - A Stock Out transaction is created.
   - Request status changes to `Approved`.
   - The activity is recorded in the system logs.
8. If rejected:
   - Request status changes to `Rejected`.
   - Stock quantity is not changed.

---

## Stock Management

The system supports:

- Item creation and updating
- Category management
- Supplier management
- Stock In records
- Stock Out through approved requests
- Current stock quantity tracking
- Low stock identification
- Out-of-stock identification

---

## Reports

The system provides:

- Stock summary
- Daily transaction reports
- Monthly transaction reports
- Low stock reports
- Stock In totals
- Stock Out totals
- CSV export
- Print / PDF support

---

## User Roles

### Admin

Admin users have permission to manage the complete system.

### User

Normal users are treated as employees and can access only employee functions.

Users can view and update only their own profile information.

---

## Security Features

The system includes:

- Password hashing using bcrypt
- JWT-based authentication
- Protected API routes
- Role-based authorization
- Input validation
- SQL injection protection using parameterized queries
- User account status checking
- Secure password change
- System activity logging

Passwords are never stored as plain text in the database.

---

## System Logs

Important system activities are recorded automatically.

Examples include:

- Login activities
- User updates
- Stock requests
- Request approval
- Request rejection
- Stock transactions
- Failed operations
- Errors and warnings

---

## Database

Database name:

```text
office_stock_management

## Main Database Tables

The MySQL database contains the following main tables:

- users
- categories
- suppliers
- items
- stock_in
- requests
- transactions
- system_logs

## Project Structure

```text
OfficeStockManagement/
│
├── backend/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── routes/
│   │   └── utils/
│   ├── package.json
│   └── server.js
│
├── public/
│
├── src/
│   ├── assets/
│   ├── components/
│   ├── layouts/
│   ├── pages/
│   ├── routes/
│   ├── services/
│   ├── styles/
│   └── utils/
│
├── package.json
├── vite.config.js
└── README.md

## Database Setup

A MySQL database structure file is included in the project:

```text
database/office_stock_management.sql

To create the database:

1.Open MySQL Workbench.
2.Go to Server → Data Import.
3.Select Import from Self-Contained File.
4.Select:database/office_stock_management.sql

5.Start the import.

The SQL file creates the office_stock_management database and its required tables.

The exported SQL file contains only the database structure and does not contain application user data or passwords.