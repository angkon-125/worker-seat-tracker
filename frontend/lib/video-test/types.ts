export enum AnalysisMode {
  SEAT_OCCUPANCY_ONLY = 'seat_occupancy_only',
  VIDEO_PERSON_TRACKING = 'video_person_tracking',
  HYBRID_DEBUG = 'hybrid_debug',
}

export interface SeatZone {
  seat_id: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  label?: string;
}

export interface VideoConfig {
  mode: AnalysisMode;
  frame_skip: number;
  frame_width: number;
  frame_height: number;
  use_motion_gating: boolean;
  occupancy_threshold: number;
  confirmation_frames: number;
  exit_delay_seconds: number;
  enable_person_tracking: boolean;
  save_annotated_video: boolean;
}

export interface FrontendSeatZone {
  seatId: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  label?: string;
}

export interface OccupancySession {
  session_id: string;
  start_time: number;
  end_time: number | null;
  duration_seconds: number | null;
  person_id: string | null;
}

export interface SeatSummary {
  seat_id: string;
  total_occupied_time_seconds: number;
  total_sessions: number;
  sessions: OccupancySession[];
  occupancy_rate: number | null;
}

export interface PersonTracking {
  person_id: string;
  first_seen: number;
  last_seen: number;
  total_visible_time_seconds: number;
  seat_interactions: string[];
  path_points_count: number;
}

export interface VideoSummary {
  video_name: string;
  duration_seconds: number;
  fps: number;
  total_frames: number;
  processed_frames: number;
  skipped_frames: number;
  analysis_mode: AnalysisMode;
  processing_time_seconds: number;
}

export interface VideoAnalysisResult {
  job_id: string;
  status: string;
  video_summary: VideoSummary;
  seat_summaries: SeatSummary[];
  person_tracking: PersonTracking[] | null;
  annotated_video_path: string | null;
  created_at: string;
  error: string | null;
}

export interface AnalysisJobStatus {
  job_id: string;
  status: string;
  progress: number;
  current_frame: number;
  total_frames: number;
  message: string | null;
  result: VideoAnalysisResult | null;
  created_at: string;
  completed_at: string | null;
}

export interface VideoAnalysisRequest {
  video_filename: string;
  seat_zones: SeatZone[];
  config: VideoConfig;
}

export interface VideoMetadata {
  duration: number;
  fps: number;
  totalFrames: number;
  resolution: { width: number; height: number };
}
