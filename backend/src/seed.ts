import "dotenv/config";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { connectDB } from "./config/db";
import User from "./models/User";
import Profile from "./models/Profile";
import Attendance from "./models/Attendance";
import LeaveRequest from "./models/LeaveRequest";
import Payroll from "./models/Payroll";
import Notification from "./models/Notification";

async function seed() {
  await connectDB();
  console.log("[seed] Clearing existing data...");
  await Promise.all([
    User.deleteMany({}),
    Profile.deleteMany({}),
    Attendance.deleteMany({}),
    LeaveRequest.deleteMany({}),
    Payroll.deleteMany({}),
    Notification.deleteMany({}),
  ]);

  const passwordHash = await bcrypt.hash("Password123", 10);

  const admin = await User.create({
    employeeId: "EMP-000",
    name: "Asha Rao",
    email: "admin@dayflow.io",
    passwordHash,
    role: "ADMIN",
    emailVerified: true,
  });
  await Profile.create({
    userId: admin._id,
    phone: "9876500000",
    jobTitle: "HR Officer",
    department: "People Ops",
  });

  const employeeSeed = [
    { employeeId: "EMP-001", name: "Rahul Mehta", dept: "Engineering", title: "Software Engineer" },
    { employeeId: "EMP-002", name: "Priya Nair", dept: "Design", title: "Product Designer" },
    { employeeId: "EMP-003", name: "Karan Shah", dept: "Sales", title: "Account Executive" },
    { employeeId: "EMP-004", name: "Divya Iyer", dept: "Engineering", title: "QA Engineer" },
  ];

  const employees = [];
  for (const e of employeeSeed) {
    const user = await User.create({
      employeeId: e.employeeId,
      name: e.name,
      email: `${e.employeeId.toLowerCase()}@dayflow.io`,
      passwordHash,
      role: "EMPLOYEE",
      emailVerified: true,
    });
    await Profile.create({
      userId: user._id,
      phone: "98765" + Math.floor(10000 + Math.random() * 89999),
      jobTitle: e.title,
      department: e.dept,
      address: "Bengaluru, India",
    });
    await Payroll.create({
      userId: user._id,
      basic: 45000,
      hra: 15000,
      deductions: 4000,
      netSalary: 56000,
      effectiveDate: "2026-08-01",
    });
    employees.push(user);
  }

  console.log("[seed] Creating attendance history...");
  const today = new Date();
  for (const user of employees) {
    for (let i = 0; i < 7; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().slice(0, 10);
      const isWeekend = d.getDay() === 0 || d.getDay() === 6;
      if (isWeekend) continue;
      const checkIn = new Date(d);
      checkIn.setHours(9, Math.floor(Math.random() * 30), 0, 0);
      const checkOut = new Date(d);
      checkOut.setHours(18, Math.floor(Math.random() * 30), 0, 0);
      await Attendance.create({
        userId: user._id,
        date: dateStr,
        checkIn,
        checkOut,
        status: "PRESENT",
      });
    }
  }

  console.log("[seed] Creating sample leave requests...");
  await LeaveRequest.create({
    userId: employees[0]._id,
    leaveType: "SICK",
    startDate: "2026-08-25",
    endDate: "2026-08-26",
    remarks: "Fever, need rest",
    status: "PENDING",
  });
  await LeaveRequest.create({
    userId: employees[1]._id,
    leaveType: "PAID",
    startDate: "2026-09-01",
    endDate: "2026-09-03",
    remarks: "Family trip",
    status: "APPROVED",
    reviewedBy: admin._id,
    reviewerComment: "Enjoy your trip!",
  });

  console.log("[seed] Done.");
  console.log("");
  console.log("Login with:");
  console.log("  Admin:    admin@dayflow.io / Password123");
  console.log("  Employee: emp-001@dayflow.io / Password123");

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
