import { LearnersReport } from "@/components/reports/learners-report";

export const metadata = {
  title: "Reports - Learners Progress | SAN TECH",
  description: "View and track learning progress by learner, cohort, and course.",
};

export default function ReportsPage() {
  return (
    <section className="space-y-6">
      <LearnersReport />
    </section>
  );
}
