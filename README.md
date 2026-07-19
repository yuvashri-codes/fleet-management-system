# FleetGuard - Enterprise Fleet Management System (Sprint 1)

Welcome to Sprint 1 of the enterprise-grade Fleet Management System (**FleetGuard**). This repository contains the foundation, database schemas, API models, JWT authentication framework, and responsive Dashboard UI.

---

## 1. Folder Tree Structure

```text
Fleet-Final/
├── .env.example              # Global environment variables template
├── README.md                 # Project architecture & setup documentation
├── analytics/                # Flask Microservice (Analytics)
│   ├── app.py                # Flask entry point and health checks
│   └── requirements.txt      # Flask dependencies
├── backend/                  # Django REST Framework (Backend Core)
│   ├── accounts/             # Authentication & User Management app
│   │   ├── management/       # Seeding commands
│   │   │   └── commands/
│   │   │       └── seed_admin.py
│   │   ├── migrations/       # Database migrations
│   │   ├── models.py         # Custom User model (Admin, Manager, Driver)
│   │   ├── serializers.py    # Custom User & Token payload serializers
│   │   ├── urls.py           # Authentication routing
│   │   ├── views.py          # DRF views (Register, Login, Profile, Logout)
│   │   └── apps.py
│   ├── config/               # Settings & routing configuration
│   │   ├── settings.py
│   │   └── urls.py
│   ├── core/                 # Shared core utilities (future sprints)
│   ├── dashboard/            # Backend dashboard logic (future sprints)
│   ├── manage.py             # Django admin CLI
│   └── requirements.txt      # Django dependencies
└── frontend/                 # Next.js 15 App Router (Frontend)
    ├── app/                  # App routes & layout entry
    │   ├── dashboard/        # Dashboard layout & content
    │   │   ├── layout.tsx
    │   │   └── page.tsx
    │   ├── login/            # Interactive Login page
    │   │   └── page.tsx
    │   ├── register/         # Form validation Register page
    │   │   └── page.tsx
    │   ├── layout.tsx        # Global html layout & query client
    │   ├── loading.tsx       # Routing loaders
    │   ├── not-found.tsx     # Custom 404 page
    │   ├── page.tsx          # Client-side router gateway
    │   └── providers.tsx     # TanStack Query & Toast providers
    ├── components/           # Reusable UI component library
    │   └── ui/
    │       ├── button.tsx
    │       ├── card.tsx
    │       ├── checkbox.tsx
    │       ├── input.tsx
    │       ├── select.tsx
    │       ├── skeleton.tsx
    │       └── toast.tsx
    ├── lib/                  # Utility libraries & Axios clients
    │   ├── api.ts            # JWT auto-refresh interceptors
    │   └── utils.ts          # Styling helper
    ├── package.json          # Next.js dependencies & scripts
    ├── postcss.config.mjs    # CSS configuration
    └── tsconfig.json         # TypeScript compiler preferences
```

---

## 2. PostgreSQL Database Setup

1. **Install PostgreSQL**: Ensure PostgreSQL 14+ is installed and running on your system.
2. **Create Database**: Open `psql` or pgAdmin and run:
   ```sql
   CREATE DATABASE fleetguard_db;
   ```
3. **Configure Environment Variables**:
   Create a `.env` file in the project root directory by copying the template:
   ```bash
   cp .env.example .env
   ```
   Open `.env` and fill in your local database credentials:
   ```text
   DB_NAME=fleetguard_db
   DB_USER=postgres
   DB_PASSWORD=your_secure_password
   DB_HOST=localhost
   DB_PORT=5432
   ```

---

## 3. Installation Guide

### Backend Setup
1. Open a terminal and navigate to the `backend/` directory:
   ```bash
   cd backend
   ```
2. Create a Python virtual environment:
   ```bash
   python -m venv venv
   ```
3. Activate the virtual environment:
   - **Windows PowerShell**: `.\venv\Scripts\Activate.ps1`
   - **Windows CMD**: `.\venv\Scripts\activate.bat`
   - **macOS/Linux**: `source venv/bin/activate`
4. Install python dependencies:
   ```bash
   pip install -r requirements.txt
   ```

### Frontend Setup
1. Open a terminal and navigate to the `frontend/` directory:
   ```bash
   cd frontend
   ```
2. Install npm packages:
   ```bash
   npm install
   ```

### Analytics Setup
1. Open a terminal and navigate to the `analytics/` directory:
   ```bash
   cd analytics
   ```
2. Create a Python virtual environment:
   ```bash
   python -m venv venv
   ```
3. Activate the virtual environment:
   - **Windows PowerShell**: `.\venv\Scripts\Activate.ps1`
   - **macOS/Linux**: `source venv/bin/activate`
4. Install python dependencies:
   ```bash
   pip install -r requirements.txt
   ```

---

## 4. Run Commands

### Run Backend (Django)
Ensure you are in the `backend/` folder and your virtual environment is activated:
1. **Generate Migrations**:
   ```bash
   python manage.py makemigrations accounts
   ```
2. **Execute Migrations**:
   ```bash
   python manage.py migrate
   ```
3. **Seed Admin Account**:
   To create the default administrator user (`admin@fleetmanagement.com` with password `AdminPassword123!`):
   ```bash
   python manage.py seed_admin
   ```
4. **Start Dev Server**:
   ```bash
   python manage.py runserver 8000
   ```

### Run Frontend (Next.js)
Ensure you are in the `frontend/` folder:
1. **Start Dev Server**:
   ```bash
   npm run dev
   ```
   *The client will start running at `http://localhost:3000`.*

### Run Analytics (Flask)
Ensure you are in the `analytics/` folder and your virtual environment is activated:
1. **Start Microservice**:
   ```bash
   python app.py
   ```
   *The server will start running at `http://localhost:5001`.*

---

## 5. API Endpoints Summary

All request payloads and response bodies utilize clean, REST-compliant JSON formatting.

| Method | Endpoint | Auth | Description | Payload Schema |
| :--- | :--- | :--- | :--- | :--- |
| **POST** | `/api/auth/register` | AllowAny | Creates user and signs in immediately | `{"fullName", "email", "password", "confirm_password", "role"}` |
| **POST** | `/api/auth/login` | AllowAny | Obtains JWT access & refresh tokens | `{"email", "password"}` |
| **POST** | `/api/auth/refresh` | AllowAny | Obtains fresh access token via refresh token | `{"refresh"}` |
| **POST** | `/api/auth/logout` | IsAuthenticated | Blacklists refresh token | `{"refresh"}` |
| **GET** | `/api/auth/profile` | IsAuthenticated | Retrieves details of authenticated user | *None (Requires Bearer Token header)* |

---

## 6. Testing Instructions

### Django API Validation
To execute automated test suites built inside Django verifying endpoint security and role validators:
```bash
cd backend
python manage.py test
```

### Next.js Compile Verification
To compile-check all routes, components, and schemas:
```bash
cd frontend
npm run build
```

### Analytics Service Check
To inspect the health of the Flask microservice, run:
- **cURL**: `curl http://localhost:5001/health`
- **Response**: `{"status": "running"}`
