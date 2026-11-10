export type EnrollmentReportStatus = "PENDING" | "APPROVED" | "ACTIVE" | "COMPLETED" | "REJECTED" | "WITHDRAWN";

export type LearnerProgressRow = {
  id: string;
  learnerName: string;
  email: string;
  courseTitle: string;
  cohortName: string;
  status: EnrollmentReportStatus;
  completedLessons: number;
  totalLessons: number;
  progress: number;
  averageScore: number | null;
  appliedAt: string;
};

export type LearnerProgressFilters = {
  page: number;
  pageSize: number;
  search: string;
  status: EnrollmentReportStatus | "ALL";
};

export type LearnerProgressReport = {
  data: LearnerProgressRow[];
  meta: { page: number; pageSize: number; total: number; pageCount: number };
  stats: { total: number; pending: number; active: number; completed: number };
};
