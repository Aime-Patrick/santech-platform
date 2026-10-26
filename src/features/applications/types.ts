export const applicationDecisionStatuses = [
  "UNDER_REVIEW",
  "SHORTLISTED",
  "ACCEPTED",
  "REJECTED",
  "WITHDRAWN",
] as const;

export type ApplicationDecisionStatus = (typeof applicationDecisionStatuses)[number];

export type UpdateApplicationStatusInput = {
  applicationId: string;
  status: ApplicationDecisionStatus;
  reviewNotes?: string;
};

export type UpdateApplicationStatusResponse = {
  data: {
    id: string;
    status: ApplicationDecisionStatus;
    reviewNotes: string | null;
    reviewedAt: string;
  };
};
