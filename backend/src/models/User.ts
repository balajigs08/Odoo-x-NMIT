import { Schema, model, Document, Types } from "mongoose";

export type UserRole = "ADMIN" | "EMPLOYEE";
export type InvitationStatus = "pending" | "active";
export type UserAccountStatus = "active" | "inactive";

export interface IUser extends Document {
  _id: Types.ObjectId;
  employeeId: string;
  name: string;
  email: string;
  passwordHash?: string;
  role: UserRole;
  emailVerified: boolean;
  verificationToken?: string;
  invitationStatus: InvitationStatus;
  invitationTokenHash?: string;
  invitationExpiresAt?: Date;
  status: UserAccountStatus;
  googleId?: string;
  avatar?: string;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    employeeId: { type: String, required: true, unique: true, trim: true },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: false, select: false },
    role: { type: String, enum: ["ADMIN", "EMPLOYEE"], default: "EMPLOYEE" },
    emailVerified: { type: Boolean, default: false },
    verificationToken: { type: String, select: false },
    invitationStatus: { type: String, enum: ["pending", "active"], default: "active" },
    invitationTokenHash: { type: String, select: false },
    invitationExpiresAt: { type: Date },
    status: { type: String, enum: ["active", "inactive"], default: "active" },
    googleId: { type: String, unique: true, sparse: true },
    avatar: { type: String },
  },
  { timestamps: true }
);

export default model<IUser>("User", userSchema);
