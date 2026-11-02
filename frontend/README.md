# FreshFlow Next.js frontend

## Setup
1. Open terminal in frontend.
2. Run `npm install`.
3. Copy `.env.local.example` to `.env.local`.
4. Run `npm run dev`.
5. Open http://localhost:3000.

Uses Next.js App Router, JavaScript, Tailwind CSS, Axios and Lucide React.
API base URL defaults to http://localhost:5000/api. The Express backend must implement the routes in `src/services/api.js`.
The SQL database remains `freshflow_d`; MongoDB database is `freshflow`.
The backend must not reduce inventory twice when inserting waste: the final MySQL trigger already performs that action.
