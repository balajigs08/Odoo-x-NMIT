import jwt from "jsonwebtoken";
import { Types } from "mongoose";
import { UserRole } from "../models/User";

export interface TokenPayload {
  sub: string;
  role: UserRole;
}

export function signAccessToken(userId: Types.ObjectId, role: UserRole): string {
  return jwt.sign({ sub: userId.toString(), role }, process.env.JWT_ACCESS_SECRET as string, {
    expiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN || "15m",
  } as jwt.SignOptions);
}

export function signRefreshToken(userId: Types.ObjectId, role: UserRole): string {
  return jwt.sign({ sub: userId.toString(), role }, process.env.JWT_REFRESH_SECRET as string, {
    expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || "7d",
  } as jwt.SignOptions);
}

export function verifyAccessToken(token: string): TokenPayload {
  return jwt.verify(token, process.env.JWT_ACCESS_SECRET as string) as TokenPayload;
}

export function verifyRefreshToken(token: string): TokenPayload {
  return jwt.verify(token, process.env.JWT_REFRESH_SECRET as string) as TokenPayload;
}
