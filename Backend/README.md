# Telecom Project Backend

This is the Express.js + PostgreSQL backend for the Telecom Services Dashboard.

## Prerequisites

1.  **Node.js**: Ensure Node.js is installed.
2.  **PostgreSQL**: Install PostgreSQL and pgAdmin (optional).

## Setup Instructions

### 1. Database Setup

1.  Open your PostgreSQL terminal (psql) or pgAdmin.
2.  Create a new database named `telecom_db`:
    ```sql
    CREATE DATABASE telecom_db;
    ```
3.  Connect to the database and run the `database.sql` script included in this directory to create the tables.
    ```bash
    psql -U postgres -d telecom_db -f database.sql
    ```
    (Or copy-paste the contents of `database.sql` into a query window in pgAdmin).

### 2. Configuration

1.  Copy `.env.example` to a new file named `.env`:
    ```bash
    cp .env.example .env
    ```
2.  Open `.env` and fill in your PostgreSQL credentials:
    ```
    DB_USER=postgres
    DB_PASSWORD=your_password
    DB_HOST=localhost
    DB_PORT=5432
    DB_NAME=telecom_db
    PORT=5000
    ```

### 3. Installation & Running

1.  Install dependencies:
    ```bash
    npm install
    ```
2.  Start the development server:
    ```bash
    npm run dev
    ```

## API Endpoints

-   **GET /api/customers**: List all customers
-   **POST /api/customers**: Create a new customer
-   **PUT /api/customers/:id**: Update a customer
-   **DELETE /api/customers/:id**: Delete a customer

## Project Structure

-   `src/server.ts`: Entry point.
-   `src/db.ts`: Database connection configuration.
-   `src/controllers`: Request handlers.
-   `src/routes`: API route definitions.
-   `database.sql`: SQL schema for creating tables.
