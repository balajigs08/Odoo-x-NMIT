import { Response, NextFunction } from "express";
import PDFDocument from "pdfkit";
import User from "../models/User";
import Payroll from "../models/Payroll";
import Attendance from "../models/Attendance";
import { AuthRequest } from "../middleware/auth";
import { ApiError } from "../middleware/errorHandler";

export async function salarySlip(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const targetId = req.params.userId;
    // Employees may only download their own slip; admins may download anyone's.
    if (req.user!.role !== "ADMIN" && req.user!.id !== targetId) {
      throw new ApiError(403, "You can only download your own salary slip");
    }

    const user = await User.findById(targetId);
    const payroll = await Payroll.findOne({ userId: targetId }).sort({ effectiveDate: -1 });
    if (!user || !payroll) throw new ApiError(404, "Payroll record not found");

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=salary-slip-${user.employeeId}.pdf`);

    const doc = new PDFDocument({ margin: 50 });
    doc.pipe(res);

    doc.fontSize(20).text("Dayflow — Salary Slip", { align: "center" });
    doc.moveDown();
    doc.fontSize(12).text(`Employee: ${user.name} (${user.employeeId})`);
    doc.text(`Effective date: ${payroll.effectiveDate}`);
    doc.moveDown();
    doc.text(`Basic: ${payroll.basic}`);
    doc.text(`HRA: ${payroll.hra}`);
    doc.text(`Deductions: ${payroll.deductions}`);
    doc.moveDown();
    doc.fontSize(14).text(`Net Salary: ${payroll.netSalary}`, { underline: true });

    doc.end();
  } catch (err) {
    next(err);
  }
}

export async function attendanceSummary(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { from, to } = req.query as { from?: string; to?: string };
    const filter: Record<string, unknown> = {};
    if (from || to) {
      filter.date = {};
      if (from) (filter.date as Record<string, unknown>).$gte = from;
      if (to) (filter.date as Record<string, unknown>).$lte = to;
    }
    const records = await Attendance.find(filter).populate("userId", "name employeeId").sort({ date: -1 });

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment; filename=attendance-summary.csv");

    const rows = [["Employee", "Employee ID", "Date", "Status", "Check In", "Check Out"]];
    for (const r of records as any[]) {
      rows.push([
        r.userId?.name || "",
        r.userId?.employeeId || "",
        r.date,
        r.status,
        r.checkIn ? new Date(r.checkIn).toLocaleTimeString() : "",
        r.checkOut ? new Date(r.checkOut).toLocaleTimeString() : "",
      ]);
    }
    const csv = rows.map((row) => row.map((cell) => `"${cell}"`).join(",")).join("\n");
    res.send(csv);
  } catch (err) {
    next(err);
  }
}
