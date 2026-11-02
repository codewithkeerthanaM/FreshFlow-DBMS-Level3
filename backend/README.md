# FreshFlow Backend

Express REST API for FreshFlow, using MySQL (`freshflow_d`) for operational data and MongoDB (`freshflow`) for event history.

## Requirements
- Node.js 20+
- MySQL 8+
- MongoDB Community Server running locally or a MongoDB URI

## Setup
1. Copy `.env.example` to `.env`.
2. Set your MySQL password, MongoDB URI and a random JWT secret (at least 32 characters).
3. Confirm the final SQL script has already been executed against the MySQL database `freshflow_d`.
4. Run `npm install`.
5. Create the first admin account with `npm run seed:admin`. Set `ADMIN_NAME`, `ADMIN_EMAIL` and `ADMIN_PASSWORD` in `.env` first. This command hashes the password and uses the existing ADMIN role.
6. Run `npm run dev`.
7. Check `http://localhost:5000/api/health`.

## Frontend
Set the Next.js `.env.local`:
`NEXT_PUBLIC_API_URL=http://localhost:5000/api`

## API routes
- `POST /api/auth/login`, `GET /api/auth/me`
- `/api/products`, `/api/suppliers`, `/api/inventory`, `/api/alerts`
- `/api/waste`, `/api/purchases`, `/api/locations`, `/api/reports`
- `/api/history/stock`, `/api/history/alerts`, `/api/history/monitoring`

All successful responses use `{ "success": true, "data": ... }`. Errors use `{ "success": false, "message": ... }`.

## Database design rules
- MySQL schema is the source of truth. The database name is `freshflow_d`.
- MongoDB database is `freshflow`; collections are created when first used.
- The MySQL `trg_after_waste_insert` trigger decreases inventory and creates the OUT stock movement. Therefore the waste controller inserts only into `waste`; it must NOT decrement inventory or insert another stock_movement row.
- Inventory adjustment runs in a MySQL transaction and records one stock_movement row.
- MongoDB is an event-history store. Failure to write an event after a successful MySQL commit is logged; it must not falsely report that the MySQL operation rolled back.

## Initial user data
The SQL sample users contain demo placeholder password hashes. They cannot log in. Use the one-time admin seed command to create a real bcrypt-hashed administrator account. Do not expose public admin registration.

## Security notes
- Never commit `.env`.
- Use a long random JWT secret.
- Change default CORS origin for deployment.
- This is a local academic project starter; review and harden before production deployment.
