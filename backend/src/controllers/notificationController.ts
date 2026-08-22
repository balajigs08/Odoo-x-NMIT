import { Response, NextFunction } from "express";
import Notification from "../models/Notification";
import { AuthRequest } from "../middleware/auth";

export async function myNotifications(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const notifications = await Notification.find({ userId: req.user!.id }).sort({ createdAt: -1 }).limit(50);
    res.json({ notifications });
  } catch (err) {
    next(err);
  }
}

export async function markRead(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: req.user!.id },
      { $set: { read: true } },
      { new: true }
    );
    res.json({ notification });
  } catch (err) {
    next(err);
  }
}
