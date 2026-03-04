export type UserRole = 'jobber' | 'creator';
export type ApplicationStatus = 'pending' | 'accepted' | 'rejected';
export type JobStatus = 'open' | 'closed' | 'filled';

export type DayOfWeek = 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun';

export interface Profile {
  id: string;
  role: UserRole | null;
  full_name: string;
  estate: string;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface JobberProfile {
  id: string;
  date_of_birth: string | null;
  bio: string;
  hours_per_week: number;
  available_days: DayOfWeek[];
  created_at: string;
  updated_at: string;
}

export interface SkillCategory {
  id: string;
  name: string;
  display_order: number;
}

export interface Skill {
  id: string;
  category_id: string;
  name: string;
}

export interface JobberSkill {
  id: string;
  jobber_id: string;
  skill_id: string;
  proficiency: number; // 1-5
}

export interface Job {
  id: string;
  creator_id: string;
  title: string;
  description: string;
  estate: string;
  hours_per_week: number;
  required_days: DayOfWeek[];
  duration_weeks: number | null;
  status: JobStatus;
  created_at: string;
  updated_at: string;
}

export interface JobSkill {
  id: string;
  job_id: string;
  skill_id: string;
  min_proficiency: number; // 1-5
}

export interface Application {
  id: string;
  job_id: string;
  jobber_id: string;
  status: ApplicationStatus;
  created_at: string;
  updated_at: string;
}

// Matching RPC response
export interface MatchedJob {
  job_id: string;
  title: string;
  description: string;
  estate: string;
  hours_per_week: number;
  required_days: DayOfWeek[];
  duration_weeks: number | null;
  creator_name: string;
  skill_score: number;
  location_score: number;
  availability_score: number;
  total_score: number;
}

// Joined types for UI
export interface SkillWithCategory extends Skill {
  category_name: string;
}

export interface JobberSkillWithDetails extends JobberSkill {
  skill_name: string;
  category_name: string;
}

export interface ApplicationWithJob extends Application {
  job: Pick<Job, 'title' | 'estate' | 'hours_per_week' | 'status'>;
}

export interface ApplicationWithJobber extends Application {
  jobber: Pick<Profile, 'full_name' | 'estate' | 'avatar_url'>;
}
