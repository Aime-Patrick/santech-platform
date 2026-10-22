import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function seedDemoData() {
  console.log("Checking existing data...");
  const admin = await prisma.user.findFirst({
    where: { status: "ACTIVE" },
  });

  if (!admin) {
    console.error("No active user found to associate data with. Run seed.mjs first.");
    return;
  }

  // 1. Create or ensure instructors
  const instructorUser = await prisma.user.upsert({
    where: { email: "instructor@santech.dev" },
    update: {},
    create: {
      email: "instructor@santech.dev",
      firstName: "David",
      lastName: "Kareem",
      status: "ACTIVE",
      passwordHash: admin.passwordHash,
    },
  });

  const instructorRole = await prisma.role.findUnique({ where: { key: "instructor" } });
  if (instructorRole) {
    await prisma.userRole.upsert({
      where: { userId_roleId: { userId: instructorUser.id, roleId: instructorRole.id } },
      update: {},
      create: { userId: instructorUser.id, roleId: instructorRole.id },
    });
  }

  // 2. Create sample learners
  const learners = [
    { email: "learner1@santech.dev", firstName: "Sarah", lastName: "Chen" },
    { email: "learner2@santech.dev", firstName: "Marcus", lastName: "Vance" },
    { email: "learner3@santech.dev", firstName: "Amina", lastName: "Diallo" },
  ];

  const learnerRole = await prisma.role.findUnique({ where: { key: "learner" } });
  const createdLearners = [];

  for (const l of learners) {
    const user = await prisma.user.upsert({
      where: { email: l.email },
      update: {},
      create: {
        email: l.email,
        firstName: l.firstName,
        lastName: l.lastName,
        status: "ACTIVE",
        passwordHash: admin.passwordHash,
      },
    });
    if (learnerRole) {
      await prisma.userRole.upsert({
        where: { userId_roleId: { userId: user.id, roleId: learnerRole.id } },
        update: {},
        create: { userId: user.id, roleId: learnerRole.id },
      });
    }
    createdLearners.push(user);
  }

  // 3. Courses
  const coursesData = [
    {
      title: "Full-Stack Web Engineering",
      slug: "full-stack-web-engineering",
      summary: "Modern React, Next.js, TypeScript, PostgreSQL, and scalable microservices architecture.",
      description: "Master comprehensive web application development from frontend responsiveness to production deployments.",
      level: "Intermediate",
      durationWeeks: 12,
      status: "PUBLISHED",
      lessons: [
        { title: "Architectural Foundations & TypeScript Essentials", slug: "arch-foundations", sortOrder: 1, status: "PUBLISHED" },
        { title: "React Server Components & Next.js App Router", slug: "rsc-nextjs", sortOrder: 2, status: "PUBLISHED" },
        { title: "Database Modeling with Prisma & PostgreSQL", slug: "prisma-postgres", sortOrder: 3, status: "PUBLISHED" },
        { title: "Enterprise Authentication & RBAC Patterns", slug: "auth-rbac", sortOrder: 4, status: "PUBLISHED" },
      ],
    },
    {
      title: "Cloud Architecture & DevOps Pipeline",
      slug: "cloud-architecture-devops",
      summary: "Containerization, Kubernetes orchestration, CI/CD automated deployment, and AWS/GCP cloud services.",
      description: "Design high-availability cloud systems with automated recovery, infrastructure-as-code, and continuous integration.",
      level: "Advanced",
      durationWeeks: 10,
      status: "PUBLISHED",
      lessons: [
        { title: "Docker Containerization & Image Optimization", slug: "docker-opt", sortOrder: 1, status: "PUBLISHED" },
        { title: "Kubernetes Cluster Configuration & Ingress", slug: "k8s-cluster", sortOrder: 2, status: "PUBLISHED" },
        { title: "Terraform Infrastructure as Code", slug: "terraform-iac", sortOrder: 3, status: "PUBLISHED" },
      ],
    },
    {
      title: "Applied AI & Machine Learning Systems",
      slug: "applied-ai-ml-systems",
      summary: "Practical LLM integration, embeddings, RAG pipelines, and agentic workflows.",
      description: "Implement real-world artificial intelligence applications leveraging state-of-the-art foundation models.",
      level: "Advanced",
      durationWeeks: 8,
      status: "PUBLISHED",
      lessons: [
        { title: "Vector Databases & Semantic Embeddings", slug: "vector-embeddings", sortOrder: 1, status: "PUBLISHED" },
        { title: "Retrieval-Augmented Generation (RAG) Architecture", slug: "rag-architecture", sortOrder: 2, status: "PUBLISHED" },
        { title: "Autonomous Agent Tool Calling & Workflows", slug: "agent-workflows", sortOrder: 3, status: "PUBLISHED" },
      ],
    },
    {
      title: "Enterprise Cybersecurity & Zero-Trust Defense",
      slug: "enterprise-cybersecurity",
      summary: "Threat modeling, network perimeter security, IAM policies, and penetration testing methodologies.",
      description: "Build robust security postures across organizational infrastructure with Zero-Trust principles.",
      level: "Beginner",
      durationWeeks: 6,
      status: "DRAFT",
      lessons: [
        { title: "Zero Trust Architecture Principles", slug: "zero-trust-principles", sortOrder: 1, status: "DRAFT" },
      ],
    },
  ];

  for (const c of coursesData) {
    const { lessons, ...courseFields } = c;
    const course = await prisma.course.upsert({
      where: { slug: c.slug },
      update: courseFields,
      create: courseFields,
    });

    // Assign instructor
    await prisma.courseInstructor.upsert({
      where: { courseId_instructorId: { courseId: course.id, instructorId: instructorUser.id } },
      update: {},
      create: { courseId: course.id, instructorId: instructorUser.id },
    });

    // Add lessons
    for (const l of lessons) {
      await prisma.lesson.upsert({
        where: { courseId_slug: { courseId: course.id, slug: l.slug } },
        update: { title: l.title, sortOrder: l.sortOrder, status: l.status },
        create: {
          courseId: course.id,
          title: l.title,
          slug: l.slug,
          sortOrder: l.sortOrder,
          status: l.status,
          description: `Core module curriculum for ${l.title}`,
        },
      });
    }

    // Add Cohort for published courses
    if (course.status === "PUBLISHED") {
      const cohort = await prisma.cohort.upsert({
        where: { courseId_name: { courseId: course.id, name: `Cohort 2026-A (${course.level})` } },
        update: {},
        create: {
          courseId: course.id,
          name: `Cohort 2026-A (${course.level})`,
          status: "ACTIVE",
          startsAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          endsAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
        },
      });

      // Add instructor to cohort
      await prisma.cohortInstructor.upsert({
        where: { cohortId_instructorId: { cohortId: cohort.id, instructorId: instructorUser.id } },
        update: {},
        create: { cohortId: cohort.id, instructorId: instructorUser.id },
      });

      // Enroll admin & learners
      const targetLearners = [admin, ...createdLearners];
      for (let i = 0; i < targetLearners.length; i++) {
        const learner = targetLearners[i];
        const enrollment = await prisma.enrollment.upsert({
          where: {
            id: `enr-${course.slug}-${learner.id.substring(0, 8)}`,
          },
          update: {},
          create: {
            id: `enr-${course.slug}-${learner.id.substring(0, 8)}`,
            courseId: course.id,
            learnerId: learner.id,
            cohortId: cohort.id,
            status: i === 0 ? "COMPLETED" : "ACTIVE",
            completedAt: i === 0 ? new Date() : null,
          },
        });

        await prisma.cohortMember.upsert({
          where: { cohortId_learnerId: { cohortId: cohort.id, learnerId: learner.id } },
          update: {},
          create: { cohortId: cohort.id, learnerId: learner.id },
        });

        // If completed, generate Certificate
        if (enrollment.status === "COMPLETED") {
          await prisma.certificate.upsert({
            where: { enrollmentId: enrollment.id },
            update: {},
            create: {
              certificateNo: `SAN-${Math.floor(100000 + Math.random() * 900000)}`,
              learnerId: learner.id,
              courseId: course.id,
              enrollmentId: enrollment.id,
              status: "ISSUED",
              issuedAt: new Date(),
              issuedById: admin.id,
            },
          });
        }
      }
    }
  }

  console.log("Successfully seeded courses, lessons, cohorts, enrollments, and certificates!");
}

seedDemoData()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
