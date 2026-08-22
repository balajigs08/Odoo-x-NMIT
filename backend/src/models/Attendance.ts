import { Schema, model, Document, Types } from "mongoose";

export type AttendanceStatus = "PRESENT" | "ABSENT" | "HALF_DAY" | "LEAVE";

export interface IAttendance extends Document {
  userId: Types.ObjectId;
  date: string; // YYYY-MM-DD
  checkIn?: Date;
  checkOut?: Date;
  status: AttendanceStatus;
}

const attendanceSchema = new Schema<IAttendance>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    date: { type: String, required: true },
    checkIn: { type: Date },
    checkOut: { type: Date },
    status: { type: String, enum: ["PRESENT", "ABSENT", "HALF_DAY", "LEAVE"], default: "PRESENT" },
  },
  { timestamps: true }
);

attendanceSchema.index({ userId: 1, date: 1 }, { unique: true });

export default model<IAttendance>("Attendance", attendanceSchema);
