export type CourseContentSection = {
  title: string;
  description: string;
};

export function courseContentSections(lessons: Array<{ title: string; description: string | null; content: string | null }>): CourseContentSection[] {
  return lessons.map((lesson) => ({ title: lesson.title, description: lesson.description || lesson.content || "Lesson content will be available in the learning workspace." }));
}
