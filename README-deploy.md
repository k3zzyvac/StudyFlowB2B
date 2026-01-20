# TurboLearn-lite Deployment Guide

## Prerequisites
1. **Supabase Account:** For Database & Auth.
2. **Google AI Studio Key:** Get a Gemini API Key (replaces Groq for this implementation).
3. **Render Account:** For Backend.
4. **Vercel Account:** For Frontend.

## 1. Database Setup (Supabase)
1. Create a new project.
2. Go to **SQL Editor** and paste the content of `infra/supabase_migrations.sql`. Run it.
3. Go to **Project Settings > API** and copy `SUPABASE_URL` and `SUPABASE_ANON_KEY`.

## 2. Backend Deployment (Render)
1. Push the `backend` folder to a GitHub repository.
2. Create a **Web Service** on Render connected to that repo.
3. **Build Command:** `npm install && npm run build` (or just `npm install` if running raw ts-node).
4. **Start Command:** `npm start`.
5. **Environment Variables:**
   - `BACKEND_PORT`: 8080
   - `API_KEY`: [Your Google Gemini API Key]
   - `SUPABASE_URL`: [From Step 1]
   - `SUPABASE_SERVICE_KEY`: [From Supabase Settings > Service Role]

## 3. Frontend Deployment (Vercel)
1. Push the root folder (frontend) to GitHub.
2. Import project into Vercel.
3. **Framework Preset:** Create React App (or Vite).
4. **Environment Variables:**
   - `NEXT_PUBLIC_API_BASE`: [Your Render Backend URL, e.g., https://turbolearn-backend.onrender.com]
   - `VITE_SUPABASE_URL`: [Your Supabase URL]
   - `VITE_SUPABASE_ANON_KEY`: [Your Supabase Anon Key]

## 4. Local Development
1. **Backend:**
   ```bash
   cd backend
   npm install
   export API_KEY="your_key"
   npm start
   ```
2. **Frontend:**
   This generated code is a React SPA structure. If running via Vite:
   ```bash
   npm install
   npm run dev
   ```
