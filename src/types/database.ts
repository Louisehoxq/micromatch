export type UserRole = 'jobber' | 'creator';
export type ApplicationStatus = 'pending' | 'under_review' | 'offer_pending' | 'accepted' | 'withdrawn_by_creator' | 'withdrawn_by_jobber';
export type JobStatus = 'open' | 'closed' | 'filled';

export type DayOfWeek = 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun';
export type TimeSlotPeriod = 'morning' | 'afternoon' | 'evening';
export type TimeSlot = `${DayOfWeek}_${TimeSlotPeriod}`;

export const APPLICATION_STATUS_LABELS: Record<ApplicationStatus, string> = {
  pending: 'Submitted',
  under_review: 'Under Review',
  offer_pending: 'Offer Sent',
  accepted: 'Committed',
  withdrawn_by_creator: 'Rejected by Creator',
  withdrawn_by_jobber: 'Withdrawn by You',
};

export const JOBBER_STATUS_LABELS: Record<ApplicationStatus, string> = {
  ...APPLICATION_STATUS_LABELS,
  offer_pending: 'Offer Received',
  withdrawn_by_creator: 'Rejected',
};

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
  available_slots: TimeSlot[];
  photo_id_url: string | null;
  phone_number: string;
  created_at: string;
  updated_at: string;
}

export interface CreatorProfile {
  id: string;
  bio: string;
  contact_number: string;
  avatar_url: string | null;
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
  proficiency: 1 | 2 | 3;
}

export interface Job {
  id: string;
  creator_id: string;
  title: string;
  description: string;
  estate: string;
  required_slots: TimeSlot[];
  duration_weeks: number | null;
  status: JobStatus;
  remuneration_per_hour_min: number | null;
  remuneration_per_hour_max: number | null;
  created_at: string;
  updated_at: string;
}

export interface JobSkill {
  id: string;
  job_id: string;
  skill_id: string;
  min_proficiency: 1 | 2 | 3;
}

export interface JobPhoto {
  id: string;
  job_id: string;
  photo_url: string;
  display_order: number;
  created_at: string;
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
  required_slots: TimeSlot[];
  duration_weeks: number | null;
  creator_name: string;
  skill_score: number;
  location_score: number;
  availability_score: number;
  total_score: number;
  creator_bio: string;
  contact_number: string;
  remuneration_per_hour_min: number | null;
  remuneration_per_hour_max: number | null;
  job_photos: { photo_url: string; display_order: number }[];
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
  job: Pick<Job, 'title' | 'estate' | 'required_slots' | 'status'>;
}

export interface ApplicationWithJobber extends Application {
  jobber: Pick<Profile, 'full_name' | 'estate' | 'avatar_url'>;
}

export interface ApplicationWithJobberDetail extends Application {
  jobber: Pick<Profile, 'full_name' | 'estate' | 'avatar_url'>;
  jobberProfile: { bio: string; available_slots: TimeSlot[] } | null;
  jobberSkills: { name: string; proficiency: number }[];
}
