import { Response, NextFunction } from "express";
import Attendance from "../models/Attendance";
import { AuthRequest } from "../middleware/auth";
import { ApiError } from "../middleware/errorHandler";

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

function startOfWeekStr(): string {
  const d = new Date();
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday start
  const monday = new Date(d.setDate(diff));
  return monday.toISOString().slice(0, 10);
}

export async function checkIn(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const date = todayStr();
    const existing = await Attendance.findOne({ userId: req.user!.id, date });
    if (existing?.checkIn) {
      throw new ApiError(409, "You've already checked in today");
    }
    const record = await Attendance.findOneAndUpdate(
      { userId: req.user!.id, date },
      { $set: { checkIn: new Date(), status: "PRESENT" } },
      { new: true, upsert: true }
    );
    res.json({ attendance: record });
  } catch (err) {
    next(err);
  }
}

export async function checkOut(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const date = todayStr();
    const existing = await Attendance.findOne({ userId: req.user!.id, date });
    if (!existing?.checkIn) {
      throw new ApiError(400, "Check in before checking out");
    }
    if (existing.checkOut) {
      throw new ApiError(409, "You've already checked out today");
    }

    const checkOutTime = new Date();
    existing.checkOut = checkOutTime;

    // Calculate working hours: full hours -> PRESENT, partial hours (<4 hours) -> HALF_DAY
    if (existing.checkIn) {
      const hours = (checkOutTime.getTime() - new Date(existing.checkIn).getTime()) / (1000 * 60 * 60);
      existing.status = hours < 4 ? "HALF_DAY" : "PRESENT";
    }

    await existing.save();
    res.json({ attendance: existing });
  } catch (err) {
    next(err);
  }
}

export async function myAttendance(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const range = (req.query.range as string) || "weekly";
    const status = req.query.status as string | undefined;
    const from = range === "daily" ? todayStr() : startOfWeekStr();

    const filter: Record<string, unknown> = { userId: req.user!.id, date: { $gte: from } };
    if (status) filter.status = status;

    const records = await Attendance.find(filter).sort({ date: -1 });
    res.json({ records });
  } catch (err) {
    next(err);
  }
}

export async function adminAttendance(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { userId, range, status } = req.query as { userId?: string; range?: string; status?: string };
    const from = range === "daily" ? todayStr() : startOfWeekStr();
    const filter: Record<string, unknown> = { date: { $gte: from } };
    if (userId) filter.userId = userId;
    if (status) filter.status = status;

    const rawRecords = await Attendance.find(filter).populate("userId", "name employeeId").sort({ date: -1 });
    const records = rawRecords.filter((r) => r.userId != null);
    res.json({ records });
  } catch (err) {
    next(err);
  }
}
