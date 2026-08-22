import { Response, NextFunction } from "express";
import Payroll from "../models/Payroll";
import { payrollUpdateSchema } from "../utils/validators";
import { AuthRequest } from "../middleware/auth";

export async function myPayroll(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const payroll = await Payroll.findOne({ userId: req.user!.id }).sort({ effectiveDate: -1 });
    res.json({ payroll });
  } catch (err) {
    next(err);
  }
}

export async function allPayroll(_req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const rawRecords = await Payroll.find().populate("userId", "name employeeId email").sort({ effectiveDate: -1 });
    // Filter out orphan payroll records with missing user references
    const records = rawRecords.filter((r) => r.userId != null);
    res.json({ records });
  } catch (err) {
    next(err);
  }
}

export async function updatePayroll(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const parsed = payrollUpdateSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: parsed.error.errors[0].message });
    }
    const { basic, hra, deductions, effectiveDate } = parsed.data;
    const netSalary = basic + hra - deductions;

    const payroll = await Payroll.findOneAndUpdate(
      { userId: req.params.userId },
      { $set: { basic, hra, deductions, netSalary, effectiveDate } },
      { new: true, upsert: true }
    );
    res.json({ payroll });
  } catch (err) {
    next(err);
  }
}
