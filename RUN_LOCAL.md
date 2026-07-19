# Telemetry Guide - Step-by-Step Local Setup & Execution

This guide provides step-by-step instructions to configure and execute the Fleet Management System locally on your PC.

---

## 1. Pre-Required Applications to Install on your PC

Ensure you have the following applications installed on your system before beginning:

1. **Python (version 3.10 or 3.11)**
   - Download from: [https://www.python.org/downloads/](https://www.python.org/downloads/)
   - **CRITICAL**: During installation, check the box that says **"Add Python to PATH"**.
2. **Node.js (version 20 or higher)**
   - Download from: [https://nodejs.org/](https://nodejs.org/) (Choose the LTS version).
3. **PostgreSQL Database Server (version 15, 16 or 17)**
   - Download from: [https://www.postgresql.org/download/windows/](https://www.postgresql.org/download/windows/)
   - Default Port: `5432`
   - Default Username: `postgres`
   - Default Password: Set this to `2004` during the installation setup steps.
4. **Git**
   - Download from: [https://git-scm.com/](https://git-scm.com/)

---

## 2. Step-by-Step Local Setup

Follow these steps sequentially to run the backend core, analytical services, and frontend interface:

### Step A: Configure PostgreSQL Database
1. Open **pgAdmin 4** (installed with PostgreSQL) or any SQL shell.
2. Connect to your PostgreSQL server using username `postgres` and password `2004`.
3. Create a new database named `fleet_management_db`:
   ```sql
   CREATE DATABASE fleet_management_db;
   ```

### Step B: Build & Seed Django Backend
1. Open a new terminal in the `backend/` folder:
   ```bash
   cd backend
   ```
2. Create a virtual environment:
   ```bash
   python -m venv venv
   ```
3. Activate the virtual environment:
   - **On Windows**:
     ```bash
     venv\Scripts\activate
     ```
   - **On macOS/Linux**:
     ```bash
     source venv/bin/activate
     ```
4. Install the required Python packages:
   ```bash
   pip install -r requirements.txt
   ```
5. Apply database migrations:
   ```bash
   python manage.py makemigrations accounts fleet
   python manage.py migrate
   ```
6. Seed the default Administrator account:
   ```bash
   python manage.py seed_admin
   ```
7. Start the Django development server:
   ```bash
   python manage.py runserver 0.0.0.0:8000
   ```

### Step C: Run Flask AI Analytics Service
1. Open a **second separate terminal window** in the `analytics/` folder:
   ```bash
   cd analytics
   ```
2. Create and activate a virtual environment:
   ```bash
   python -m venv venv
   # Windows:
   venv\Scripts\activate
   # macOS/Linux:
   source venv/bin/activate
   ```
3. Install the dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Run the Machine Learning model training pipeline to generate `.joblib` models:
   ```bash
   python train.py
   ```
5. Start the Flask server:
   ```bash
   python app.py
   ```
   *(The AI service will run on port `5001`).*

### Step D: Run Next.js Frontend Client
1. Open a **third separate terminal window** in the `frontend/` folder:
   ```bash
   cd frontend
   ```
2. Install Node package dependencies:
   ```bash
   npm install --legacy-peer-deps
   ```
3. Launch the Next.js development client:
   ```bash
   npm run dev
   ```
4. Open your web browser and navigate to [http://localhost:3000](http://localhost:3000).
5. Log in with the administrator credentials:
   - **Email**: `yuvashrim28@gmail.com`
   - **Password**: `admin@123`

---

## 3. Verification Commands

Run these command lists to verify the status of components:

- **Verify Backend Tests**:
  ```bash
  cd backend
  python manage.py test fleet
  ```
- **Verify Frontend Types**:
  ```bash
  cd frontend
  npx tsc --noEmit
  ```
