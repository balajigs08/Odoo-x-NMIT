import { Request, Response, NextFunction } from "express";

export class ApiError extends Error {
  statusCode: number;
  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
  }
}

export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
}

export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction) {
  console.error("[error]", err);
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({ message: err.message });
  }
  const message = err instanceof Error ? err.message : "Unexpected server error";
  res.status(500).json({ message });
}
