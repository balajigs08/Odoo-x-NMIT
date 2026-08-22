import { z } from "zod";

export const sendOtpSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  purpose: z.enum(["REGISTRATION", "FORGOT_PASSWORD"]).optional().default("REGISTRATION"),
});

export const verifyOtpSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  otp: z.string().length(6, "OTP must be exactly 6 digits"),
  purpose: z.enum(["REGISTRATION", "FORGOT_PASSWORD"]).optional().default("REGISTRATION"),
});

export const registerSchema = z.object({
  employeeId: z.string().min(1, "Employee ID is required"),
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Enter a valid email"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password needs at least one uppercase letter")
    .regex(/[0-9]/, "Password needs at least one number"),
  role: z.enum(["ADMIN", "EMPLOYEE"]).optional().default("EMPLOYEE"),
  otp: z.string().length(6, "OTP must be exactly 6 digits"),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email("Enter a valid email address"),
});

export const resetPasswordSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  otp: z.string().length(6, "OTP must be 6 digits"),
  newPassword: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password needs at least one uppercase letter")
    .regex(/[0-9]/, "Password needs at least one number"),
});

export const googleAuthSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
  googleId: z.string().optional(),
  avatar: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

export const profileUpdateSchema = z.object({
  phone: z.string().optional(),
  address: z.string().optional(),
  profilePictureUrl: z.string().optional(),
});

export const adminProfileUpdateSchema = profileUpdateSchema.extend({
  name: z.string().optional(),
  dob: z.string().optional(),
  jobTitle: z.string().optional(),
  department: z.string().optional(),
});

export const leaveApplySchema = z.object({
  leaveType: z.enum(["PAID", "SICK", "UNPAID"]),
  startDate: z.string(),
  endDate: z.string(),
  remarks: z.string().optional(),
});

export const leaveReviewSchema = z.object({
  status: z.enum(["APPROVED", "REJECTED"]),
  reviewerComment: z.string().optional(),
});

export const payrollUpdateSchema = z.object({
  basic: z.number().nonnegative(),
  hra: z.number().nonnegative(),
  deductions: z.number().nonnegative(),
  effectiveDate: z.string(),
});
