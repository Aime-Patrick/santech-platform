import { PrismaClient } from "@prisma/client";
import { randomBytes, scryptSync } from "node:crypto";

const prisma = new PrismaClient();

function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const derivedKey = scryptSync(password, salt, 64);
  return `scrypt:${salt}:${derivedKey.toString("hex")}`;
}

const permissions = [
  ["dashboard.view", "View dashboard", "Dashboard"],
  ["users.view", "View users", "Users"],
  ["users.manage", "Manage users", "Users"],
  ["roles.view", "View roles", "Roles"],
  ["roles.manage", "Manage roles and permissions", "Roles"],
  ["courses.view", "View courses", "Courses"],
  ["courses.create", "Create courses", "Courses"],
  ["courses.update", "Update courses", "Courses"],
  ["courses.delete", "Delete courses", "Courses"],
  ["lessons.manage", "Manage lessons", "Courses"],
  ["cohorts.manage", "Manage cohorts", "Cohorts"],
  ["enrollments.apply", "Apply for enrollment", "Enrollments"],
  ["enrollments.review", "Review enrollments", "Enrollments"],
  ["attendance.view", "View attendance", "Attendance"],
  ["attendance.mark", "Mark attendance", "Attendance"],
  ["grades.view", "View grades", "Grades"],
  ["grades.manage", "Manage grades", "Grades"],
  ["applications.create", "Create applications", "Applications"],
  ["applications.review", "Review applications", "Applications"],
  ["files.upload", "Upload application files", "Files"],
  ["certificates.view", "View certificates", "Certificates"],
  ["certificates.issue", "Issue certificates", "Certificates"],
  ["certificates.revoke", "Revoke certificates", "Certificates"],
  ["notifications.manage", "Manage notifications", "Notifications"],
  ["appointments.view", "View appointment schedules", "Appointments"],
  ["appointments.manage", "Manage appointment schedules", "Appointments"],
  ["audit_logs.view", "View audit logs", "Audit"],
];

async function main() {
  const permissionRecords = await Promise.all(
    permissions.map(([key, name, group]) =>
      prisma.permission.upsert({
        where: { key },
        update: { name, group },
        create: { key, name, group },
      }),
    ),
  );

  const administrator = await prisma.role.upsert({
    where: { key: "administrator" },
    update: { name: "Administrator", isSystem: true, isActive: true },
    create: {
      key: "administrator",
      name: "Administrator",
      description: "Full platform access.",
      isSystem: true,
    },
  });

  await prisma.rolePermission.createMany({
    data: permissionRecords.map((permission) => ({
      roleId: administrator.id,
      permissionId: permission.id,
    })),
    skipDuplicates: true,
  });

  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (adminEmail && adminPassword) {
    const adminUser = await prisma.user.upsert({
      where: { email: adminEmail },
      update: {
        firstName: process.env.ADMIN_FIRST_NAME || "SAN TECH",
        lastName: process.env.ADMIN_LAST_NAME || "Administrator",
        status: "ACTIVE",
      },
      create: {
        email: adminEmail,
        passwordHash: hashPassword(adminPassword),
        firstName: process.env.ADMIN_FIRST_NAME || "SAN TECH",
        lastName: process.env.ADMIN_LAST_NAME || "Administrator",
        status: "ACTIVE",
      },
    });

    await prisma.userRole.upsert({
      where: { userId_roleId: { userId: adminUser.id, roleId: administrator.id } },
      update: {},
      create: { userId: adminUser.id, roleId: administrator.id },
    });
    console.log(`Seeded administrator account: ${adminEmail}`);
  } else {
    console.warn("ADMIN_EMAIL and ADMIN_PASSWORD are not set; skipped administrator account seeding.");
  }

  const permissionByKey = new Map(permissionRecords.map((permission) => [permission.key, permission]));

  async function seedRole(key, name, description, permissionKeys) {
    const role = await prisma.role.upsert({
      where: { key },
      update: { name, description, isActive: true },
      create: { key, name, description },
    });

    await prisma.rolePermission.createMany({
      data: permissionKeys.map((permissionKey) => ({
        roleId: role.id,
        permissionId: permissionByKey.get(permissionKey).id,
      })),
      skipDuplicates: true,
    });
  }

  await seedRole("learner", "Learner", "Access to learning and personal applications.", [
    "dashboard.view",
    "courses.view",
    "enrollments.apply",
    "attendance.view",
    "grades.view",
    "applications.create",
    "files.upload",
    "certificates.view",
  ]);

  await seedRole("instructor", "Instructor", "Access to assigned courses and cohorts.", [
    "dashboard.view",
    "courses.view",
    "lessons.manage",
    "cohorts.manage",
    "enrollments.review",
    "attendance.view",
    "attendance.mark",
    "grades.view",
    "grades.manage",
  ]);

  console.log(`Seeded ${permissionRecords.length} permissions and the default platform roles.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
