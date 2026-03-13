import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export function verifyAdminPassword(password: string): boolean {
  const adminPassword = process.env.ADMIN_PASSWORD || "admin123";
  return password === adminPassword;
}

export function createToken(): string {
  return jwt.sign(
    { role: "admin", iat: Date.now() },
    process.env.JWT_SECRET || "secret",
    { expiresIn: "8h" }
  );
}

export function verifyToken(token: string): boolean {
  try {
    jwt.verify(token, process.env.JWT_SECRET || "secret");
    return true;
  } catch {
    return false;
  }
}
