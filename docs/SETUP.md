# Environment Setup Guide

## Prerequisites

Install the following tools:

1. **Node.js** v20 or later
2. **Python** 3.12 or later
3. **PostgreSQL** 16 or later
4. **Git**

## Frontend Setup

### 1. Install Dependencies

```bash
cd frontend
npm install
```

### 2. Configure Environment

Copy the example environment file:

```bash
cp .env.example .env.local
```

Required environment variables:

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk publishable key |
| `CLERK_SECRET_KEY` | Clerk secret key |
| `DATABASE_URL` | PostgreSQL connection string |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key |

### 3. Run Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:3000`.

## Backend Setup

### 1. Create Virtual Environment

```bash
cd backend
python -m venv venv

# Windows
venv\Scripts\activate

# macOS/Linux
source venv/bin/activate
```

### 2. Install Dependencies

```bash
pip install -r requirements.txt
```

### 3. Configure Environment

```bash
cp .env.example .env
```

### 4. Run Database Migrations

```bash
alembic upgrade head
```

### 5. Run Development Server

```bash
uvicorn app.main:app --reload
```

The API will be available at `http://localhost:8000`.

## Database Setup

### Option 1: Local PostgreSQL

1. Install PostgreSQL
2. Create database:
   ```sql
   CREATE DATABASE builderweb;
   ```

3. Update `DATABASE_URL` in both `.env` files

### Option 2: Supabase (Recommended)

1. Create a Supabase project
2. Copy the connection string from Project Settings > Database
3. Update `DATABASE_URL` in both `.env` files

## Clerk Setup

1. Create an account at [clerk.com](https://clerk.com)
2. Create a new application
3. Configure social login providers (Google, GitHub)
4. Copy API keys to `.env.local`

## Deployment

### Frontend (Vercel)

```bash
npx vercel --prod
```

### Backend (Railway)

1. Connect GitHub repository to Railway
2. Set environment variables
3. Deploy

## Common Issues

### Frontend Build Fails

- Ensure all environment variables are set
- Run `npm install` and try again
- Check Node.js version (20+)

### Backend Connection Error

- Verify PostgreSQL is running
- Check `DATABASE_URL` format
- Ensure database exists

### Clerk Authentication Issues

- Verify API keys are correct
- Check allowed redirect URLs in Clerk dashboard
- Ensure JWT template is configured
