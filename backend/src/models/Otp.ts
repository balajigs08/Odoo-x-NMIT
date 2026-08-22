import { Schema, model, Document } from "mongoose";

export type OtpPurpose = "REGISTRATION" | "FORGOT_PASSWORD";

export interface IOtp extends Document {
  email: string;
  otpHash: string;
  purpose: OtpPurpose;
  expiresAt: Date;
  attempts: number;
  createdAt: Date;
}

const otpSchema = new Schema<IOtp>(
  {
    email: { type: String, required: true, lowercase: true, trim: true },
    otpHash: { type: String, required: true },
    purpose: { type: String, enum: ["REGISTRATION", "FORGOT_PASSWORD"], required: true },
    expiresAt: { type: Date, required: true },
    attempts: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Index to expire OTP automatically after expiry
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default model<IOtp>("Otp", otpSchema);
