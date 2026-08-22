import { Schema, model, Document, Types } from "mongoose";

export type LeaveType = "PAID" | "SICK" | "UNPAID";
export type LeaveStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface ILeaveRequest extends Document {
  userId: Types.ObjectId;
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  remarks?: string;
  status: LeaveStatus;
  reviewedBy?: Types.ObjectId;
  reviewerComment?: string;
  reviewToken?: string;
  reviewTokenExpiresAt?: Date;
}

const leaveRequestSchema = new Schema<ILeaveRequest>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    leaveType: { type: String, enum: ["PAID", "SICK", "UNPAID"], required: true },
    startDate: { type: String, required: true },
    endDate: { type: String, required: true },
    remarks: { type: String },
    status: { type: String, enum: ["PENDING", "APPROVED", "REJECTED"], default: "PENDING" },
    reviewedBy: { type: Schema.Types.ObjectId, ref: "User" },
    reviewerComment: { type: String },
    reviewToken: { type: String, select: false },
    reviewTokenExpiresAt: { type: Date },
  },
  { timestamps: true }
);

export default model<ILeaveRequest>("LeaveRequest", leaveRequestSchema);
