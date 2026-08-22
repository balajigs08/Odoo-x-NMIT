import { Schema, model, Document, Types } from "mongoose";

export interface IPayroll extends Document {
  userId: Types.ObjectId;
  basic: number;
  hra: number;
  deductions: number;
  netSalary: number;
  effectiveDate: string;
}

const payrollSchema = new Schema<IPayroll>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    basic: { type: Number, required: true, default: 0 },
    hra: { type: Number, required: true, default: 0 },
    deductions: { type: Number, required: true, default: 0 },
    netSalary: { type: Number, required: true, default: 0 },
    effectiveDate: { type: String, required: true },
  },
  { timestamps: true }
);

export default model<IPayroll>("Payroll", payrollSchema);
