# FreshFlow – Perishable Stock Monitoring & Waste Reduction System

## 1. Project Overview

FreshFlow is a full-stack inventory management system designed to monitor perishable products, track stock quantities, manage expiry dates, and reduce product wastage.

The system helps businesses manage products, suppliers, inventory batches, purchases, alerts, and waste records through a centralized dashboard.

FreshFlow uses a **polyglot database architecture**, combining MySQL for structured transactional data and MongoDB for flexible event history and monitoring records.

## 2. Objectives

- Manage perishable products and suppliers.
- Monitor inventory quantities across multiple storage locations.
- Track manufacturing dates, batch numbers, and expiry dates.
- Identify low-stock and expiry-related alerts.
- Record and monitor product wastage.
- Maintain stock movement and event history.
- Generate inventory and operational reports.
- Provide secure, role-based access to the application.

## 3. Key Features

### Dashboard
- Total products overview.
- Total stock availability.
- Active inventory alerts.
- Total recorded waste.
- Inventory overview and recent alerts.

### Product Management
- Add and view products.
- Maintain product categories.
- Manage units of measurement.
- Configure shelf-life information.
- Associate products with suppliers.

### Inventory Management
- Add inventory batches.
- Track batch numbers.
- Maintain manufacturing and expiry dates.
- Monitor quantities and reorder levels.
- Associate inventory with storage locations.

### Supplier Management
- Add and view suppliers.
- Maintain supplier contact information.
- Manage supplier details.

### Alert Management
- View inventory alerts.
- Monitor low-stock and expiry-related notifications.
- Update alert statuses.

### Waste Management
- Record wasted quantities.
- Maintain waste reasons and disposal information.
- Track waste-related inventory changes.

### Purchase Management
- Maintain purchase records.
- Associate purchases with suppliers.
- Track purchase information.

### Reports
- View inventory and operational statistics.
- Maintain report records.

### Event History
- View stock-related events.
- View alert-related events.
- View system monitoring activities stored in MongoDB.

## 4. Technology Stack

| Component | Technology |
|---|---|
| Frontend | Next.js 15 |
| UI Library | React 19 |
| Styling | Tailwind CSS |
| Backend | Node.js |
| Backend Framework | Express.js |
| SQL Database | MySQL |
| NoSQL Database | MongoDB |
| MySQL Driver | mysql2 |
| MongoDB ODM | Mongoose |
| Authentication | JWT |
| Password Hashing | bcryptjs |
| API Communication | Axios |
| Security | Helmet, CORS, Express Rate Limit |
| Development Tool | Visual Studio Code |

## 5. Database Architecture

FreshFlow uses two database paradigms.

### A. MySQL – Relational Database

MySQL stores structured and transactional application data.

Main tables include:

- supplier
- location
- product
- inventory
- purchase
- purchase_item
- alert
- stock_movement
- waste
- role
- user
- payment
- report

MySQL is responsible for maintaining relational integrity through primary keys, foreign keys, constraints, and transactions.

Advanced database features include:

- Triggers
- Views
- Stored Procedures
- Transactions
- Primary and Foreign Key Constraints

### B. MongoDB – NoSQL Database

MongoDB stores flexible event-history and monitoring information.

Collections:

| Collection | Purpose |
|---|---|
| stock_events | Records stock-related events |
| alert_events | Stores alert-related event history |
| monitoring_logs | Stores system monitoring activities |

MongoDB complements MySQL by maintaining event records without duplicating the main relational product and inventory records.

## 6. System Architecture

```text
                 USER
                  |
                  v
          Next.js Frontend
             React UI
                  |
                  v
          Axios API Requests
                  |
                  v
          Node.js + Express
              Backend
                  |
          +-------+-------+
          |               |
          v               v
       MySQL            MongoDB
   Relational Data    Event History
          |               |
          v               v
   Products, Stock,    Stock Events,
   Suppliers, Waste,   Alert Events,
   Purchases, Alerts   Monitoring Logs
```

## 7. Project Folder Structure

```text
FRESHFLOW2/
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── app/
│   │   ├── components/
│   │   ├── context/
│   │   └── services/
│   ├── package.json
│   └── .env.local.example
│
├── backend/
│   ├── config/
│   │   ├── mysql.js
│   │   └── mongodb.js
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── scripts/
│   │   └── seedAdmin.js
│   ├── services/
│   ├── utils/
│   ├── package.json
│   └── .env.example
│
├── database/
│   └── freshflow.sql
│
├── README.md
└── .gitignore
```

## 8. Installation and Setup

### Prerequisites

Install the following:

- Node.js and npm
- MySQL Server
- MongoDB Server
- MongoDB Compass (optional)
- Visual Studio Code

### Step 1: Clone the Repository

```bash
git clone https://github.com/codewithkeerthanaM/FreshFlow.git
```

Navigate into the project:

```bash
cd FreshFlow
```

### Step 2: Set Up MySQL

Open MySQL Workbench or MySQL Command Line Client.

Create the database:

```sql
CREATE DATABASE freshflow;
USE freshflow;
```

Execute the provided SQL script containing the database schema, sample data, and advanced database features.

Ensure the database contains the required tables, triggers, views, and stored procedures.

### Step 3: Set Up MongoDB

Start your MongoDB server.

Connect using MongoDB Compass:

```text
mongodb://127.0.0.1:27017
```

The application uses the database:

```text
freshflow
```

The backend manages its event-history collections.

### Step 4: Configure the Backend

Navigate to the backend directory:

```bash
cd backend
```

Install dependencies:

```bash
npm install
```

Create the environment file:

```powershell
Copy-Item .env.example .env
```

Configure the following environment variables in `.env`:

```env
NODE_ENV=development
PORT=5000
CLIENT_ORIGIN=http://localhost:3000

MYSQL_HOST=127.0.0.1
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=YOUR_MYSQL_PASSWORD
MYSQL_DATABASE=freshflow
MYSQL_CONNECTION_LIMIT=10

MONGODB_URI=mongodb://127.0.0.1:27017/freshflow

JWT_SECRET=YOUR_SECURE_JWT_SECRET
JWT_EXPIRES_IN=8h

ADMIN_NAME=FreshFlow Administrator
ADMIN_EMAIL=admin@freshflow.local
ADMIN_PASSWORD=YOUR_STRONG_ADMIN_PASSWORD
```

Replace the example credentials with your own values.

Generate a secure JWT secret:

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### Step 5: Create the Administrator Account

Run:

```bash
npm run seed:admin
```

This creates or updates the administrator account using a securely hashed password.

### Step 6: Start the Backend

```bash
npm run dev
```

Backend URL:

```text
http://localhost:5000
```

Health check:

```text
http://localhost:5000/api/health
```

### Step 7: Configure the Frontend

Open another terminal and navigate to:

```bash
cd frontend
```

Install dependencies:

```bash
npm install
```

Create the frontend environment file:

```powershell
Copy-Item .env.local.example .env.local
```

Configure `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

### Step 8: Start the Frontend

```bash
npm run dev
```

Open the application:

```text
http://localhost:3000
```

## 9. API Endpoints

Base URL:

```text
http://localhost:5000/api
```

| Method | Endpoint | Description |
|---|---|---|
| POST | /auth/login | User authentication |
| GET | /auth/me | Retrieve authenticated user |
| GET | /products | View products |
| POST | /products | Add product |
| GET | /suppliers | View suppliers |
| POST | /suppliers | Add supplier |
| GET | /locations | View locations |
| GET | /inventory | View inventory |
| POST | /inventory | Add inventory |
| PUT | /inventory/:id/adjust | Adjust stock |
| GET | /alerts | View alerts |
| PATCH | /alerts/:id/status | Update alert status |
| GET | /waste | View waste records |
| POST | /waste | Record waste |
| GET | /purchases | View purchases |
| POST | /purchases | Create purchase record |
| GET | /reports/dashboard | Dashboard statistics |
| GET | /reports | View reports |
| POST | /reports | Create report record |
| GET | /history/stock | Stock event history |
| GET | /history/alerts | Alert event history |
| GET | /history/monitoring | Monitoring history |

Most application endpoints require JWT authentication.

## 10. Security Features

- JWT-based authentication.
- Password hashing using bcryptjs.
- Role-based authorization.
- Protected API routes.
- Environment-based configuration.
- HTTP security headers using Helmet.
- CORS configuration.
- API rate limiting.
- Input validation.

Never commit actual `.env` or `.env.local` files to GitHub.

## 11. Testing

The application can be tested through the following operations:

1. Administrator login.
2. Product creation and retrieval.
3. Inventory batch creation and retrieval.
4. Supplier management.
5. Alert retrieval and status updates.
6. Waste recording.
7. Purchase record management.
8. Dashboard statistics.
9. MongoDB event-history retrieval.
10. SQL database integrity and trigger execution.

## 12. Future Enhancements

- Automated expiry prediction.
- Advanced inventory analytics.
- Interactive charts and reports.
- Automated email notifications.
- Barcode and QR-code scanning.
- Improved supplier and purchase workflows.
- Advanced waste-reduction recommendations.

## 13. Project Information

**Project Name:** FreshFlow – Perishable Stock Monitoring & Waste Reduction System

**Project Type:** DBMS Level 3 Mini Project

**Database Architecture:** MySQL + MongoDB

**Frontend:** Next.js

**Backend:** Node.js and Express.js



---

**FreshFlow – Reduce Waste. Manage Smarter.**
