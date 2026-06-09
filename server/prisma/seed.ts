import { PrismaClient, Level, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function hash(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

async function main(): Promise<void> {
  const lecturer = await prisma.user.upsert({
    where: { email: 'lecturer@bowen.edu.ng' },
    update: {},
    create: {
      name: 'Dr. Adeola Fashina',
      email: 'lecturer@bowen.edu.ng',
      passwordHash: await hash('Lecturer123!'),
      role: Role.LECTURER,
      level: null,
    },
  });

  const studentSeeds = [
    { name: 'Tobi Adewale', email: 'tobi.adewale@bowen.edu.ng', level: Level.L100 },
    { name: 'Ngozi Eze', email: 'ngozi.eze@bowen.edu.ng', level: Level.L200 },
    { name: 'Kelechi Obi', email: 'kelechi.obi@bowen.edu.ng', level: Level.L300 },
    { name: 'Fatima Bello', email: 'fatima.bello@bowen.edu.ng', level: Level.L400 },
    { name: 'Samuel Okon', email: 'samuel.okon@bowen.edu.ng', level: Level.L200 },
  ];

  const students = [];
  for (const seed of studentSeeds) {
    const student = await prisma.user.upsert({
      where: { email: seed.email },
      update: {},
      create: {
        name: seed.name,
        email: seed.email,
        passwordHash: await hash('Student123!'),
        role: Role.STUDENT,
        level: seed.level,
      },
    });
    students.push(student);
  }

  const courseSeeds = [
    {
      code: 'CSC101',
      title: 'Introduction to Computer Science',
      description: 'Foundational concepts of computing, problem-solving and algorithms.',
    },
    {
      code: 'CSC201',
      title: 'Data Structures and Algorithms',
      description: 'Study of core data structures, algorithm design and analysis.',
    },
    {
      code: 'CSC301',
      title: 'Operating Systems',
      description: 'Principles of process management, memory management and concurrency.',
    },
    {
      code: 'CSC401',
      title: 'Software Engineering',
      description: 'Software development lifecycle, design patterns and team collaboration.',
    },
  ];

  const courses = [];
  for (const seed of courseSeeds) {
    const course = await prisma.course.upsert({
      where: { code: seed.code },
      update: {},
      create: {
        title: seed.title,
        code: seed.code,
        description: seed.description,
        lecturerId: lecturer.id,
      },
    });
    courses.push(course);

    await prisma.forum.upsert({
      where: { id: `${course.id}-general` },
      update: {},
      create: {
        id: `${course.id}-general`,
        courseId: course.id,
        title: `${course.code} General Discussion`,
        description: `Ask questions and discuss topics related to ${course.title}.`,
      },
    });
  }

  // Enroll each student in two courses (their level-appropriate course plus CSC101)
  for (let i = 0; i < students.length; i += 1) {
    const student = students[i];
    const primaryCourse = courses[i % courses.length];

    await prisma.enrollment.upsert({
      where: { userId_courseId: { userId: student.id, courseId: primaryCourse.id } },
      update: {},
      create: { userId: student.id, courseId: primaryCourse.id },
    });

    if (primaryCourse.id !== courses[0].id) {
      await prisma.enrollment.upsert({
        where: { userId_courseId: { userId: student.id, courseId: courses[0].id } },
        update: {},
        create: { userId: student.id, courseId: courses[0].id },
      });
    }
  }

  console.log('Seed complete:');
  console.log(`  - 1 lecturer (${lecturer.email})`);
  console.log(`  - ${students.length} students across levels 100-400`);
  console.log(`  - ${courses.length} CS courses with general discussion forums`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
