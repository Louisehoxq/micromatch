# MicroMatch

A mobile app that matches senior micro-jobbers (50+) in Singapore with available micro jobs based on skills, location, and availability.

## Features

- **Role-based auth** — Sign up as a Job Seeker (50+) or Job Creator
- **Smart matching** — Weighted algorithm ranks top 3 jobs by skill fit (50%), estate proximity (25%), and availability overlap (25%)
- **Skill profiles** — 30 predefined skills across 6 categories (Culinary, Fitness, Healthcare, Education, Handyman, Admin) with proficiency ratings
- **Location-aware** — 25 Singapore estates with neighbor adjacency for proximity scoring
- **Job management** — Creators post jobs with required skills, review and accept/reject applicants
- **Application tracking** — Jobbers apply to matched jobs and track application status

## Tech Stack

- **Frontend**: React Native + Expo (managed workflow), expo-router, TypeScript
- **Backend**: Supabase (PostgreSQL, Auth, Storage, RLS, RPC)

## Project Structure

```
app/
├── (auth)/          # Login, signup screens
├── (jobber)/        # Feed (matches), applications, profile
└── (creator)/       # My jobs, create job, job detail, profile
src/
├── components/      # SkillPicker, JobCard, DayPicker, ui/
├── hooks/           # useProfile, useSkills, useJobs, useMatchedJobs, useApplications
├── lib/             # Supabase client, estates + adjacency map
├── providers/       # AuthProvider
└── types/           # TypeScript interfaces
supabase/
└── migrations/      # SQL schema, RLS policies, matching function, seed data
```

## Setup

1. **Clone and install**
   ```bash
   git clone https://github.com/nwai90/micromatch.git
   cd micromatch
   npm install
   ```

2. **Supabase**
   - Create a project at [supabase.com](https://supabase.com)
   - Link: `npx supabase link --project-ref <your-ref>`
   - Run migrations: `npx supabase db push`
   - Copy your project URL and anon key to `.env`:
     ```
     EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
     EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
     ```

3. **Run**
   ```bash
   npx expo start
   ```

## Matching Algorithm

The `get_matched_jobs` SQL function scores each open job for a jobber:

| Factor | Weight | Scoring |
|---|---|---|
| Skills | 50% | Avg proficiency overlap across required skills |
| Location | 25% | 1.0 same estate, 0.5 neighboring estate, 0.0 far |
| Availability | 25% | 0.5 × hours ratio + 0.5 × days overlap ratio |

Returns the top 3 jobs by composite score, excluding already-applied jobs.
