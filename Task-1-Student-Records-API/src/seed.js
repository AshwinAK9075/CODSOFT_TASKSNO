'use strict';

/**
 * Populates the database with a small sample dataset.
 * Run with:  npm run seed
 * WARNING: drops and recreates all tables.
 */

const { sequelize, Student, Course, Enrollment } = require('./models');

const students = [
  { rollNumber: '4MT22CS001', firstName: 'Anita', lastName: 'Rao', email: 'anita.rao@example.edu', department: 'Computer Science', dateOfBirth: '2004-03-12' },
  { rollNumber: '4MT22CS002', firstName: 'Rohan', lastName: 'Shetty', email: 'rohan.shetty@example.edu', department: 'Computer Science', dateOfBirth: '2003-11-02' },
  { rollNumber: '4MT22EC010', firstName: 'Meera', lastName: 'Nair', email: 'meera.nair@example.edu', department: 'Electronics', dateOfBirth: '2004-07-25' },
  { rollNumber: '4MT21ME044', firstName: 'Imran', lastName: 'Khan', email: 'imran.khan@example.edu', department: 'Mechanical', status: 'graduated', dateOfBirth: '2002-01-19' },
  { rollNumber: '4MT23CS077', firstName: 'Divya', lastName: 'Pai', email: 'divya.pai@example.edu', department: 'Computer Science', dateOfBirth: '2005-09-08' },
];

const courses = [
  { code: 'CS101', title: 'Introduction to Programming', credits: 4, department: 'Computer Science', instructor: 'Dr. Kamath', capacity: 60 },
  { code: 'CS201', title: 'Data Structures and Algorithms', credits: 4, department: 'Computer Science', instructor: 'Dr. Menon', capacity: 50 },
  { code: 'CS310', title: 'Database Management Systems', credits: 3, department: 'Computer Science', instructor: 'Prof. Bhat', capacity: 45 },
  { code: 'EC205', title: 'Digital Signal Processing', credits: 3, department: 'Electronics', instructor: 'Dr. Iyer', capacity: 40 },
  { code: 'ME150', title: 'Engineering Thermodynamics', credits: 3, department: 'Mechanical', instructor: 'Prof. Desai', capacity: 70, status: 'closed' },
];

async function seed() {
  await sequelize.sync({ force: true });

  const createdStudents = await Student.bulkCreate(students, { validate: true });
  const createdCourses = await Course.bulkCreate(courses, { validate: true });

  const byRoll = Object.fromEntries(createdStudents.map((s) => [s.rollNumber, s.id]));
  const byCode = Object.fromEntries(createdCourses.map((c) => [c.code, c.id]));

  await Enrollment.bulkCreate(
    [
      { studentId: byRoll['4MT22CS001'], courseId: byCode.CS101, semester: '2025-ODD', status: 'completed', grade: 'A' },
      { studentId: byRoll['4MT22CS001'], courseId: byCode.CS201, semester: '2025-ODD' },
      { studentId: byRoll['4MT22CS002'], courseId: byCode.CS201, semester: '2025-ODD' },
      { studentId: byRoll['4MT22CS002'], courseId: byCode.CS310, semester: '2025-ODD', status: 'dropped' },
      { studentId: byRoll['4MT22EC010'], courseId: byCode.EC205, semester: '2025-ODD' },
      { studentId: byRoll['4MT23CS077'], courseId: byCode.CS101, semester: '2025-ODD' },
    ],
    { validate: true }
  );

  console.log(
    `Seeded ${createdStudents.length} students, ${createdCourses.length} courses and 6 enrollments.`
  );
  await sequelize.close();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
