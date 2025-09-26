import * as jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { config } from "@/config";
import { JWTPayload } from "@/types";

export const generateTokens = (payload: Omit<JWTPayload, "iat" | "exp">) => {
  const tokenPayload = {
    id: payload.id,
    email: payload.email,
    role: payload.role,
  };

  const accessToken = jwt.sign(tokenPayload, config.JWT_SECRET, {
    expiresIn: config.JWT_EXPIRES_IN as any,
  });

  const refreshToken = jwt.sign(tokenPayload, config.JWT_REFRESH_SECRET, {
    expiresIn: config.JWT_REFRESH_EXPIRES_IN as any,
  });

  return { accessToken, refreshToken };
};

export const verifyAccessToken = (token: string): JWTPayload => {
  return jwt.verify(token, config.JWT_SECRET) as JWTPayload;
};

export const verifyRefreshToken = (token: string): JWTPayload => {
  return jwt.verify(token, config.JWT_REFRESH_SECRET) as JWTPayload;
};

export const hashPassword = async (password: string): Promise<string> => {
  const saltRounds = 10;
  return bcrypt.hash(password, saltRounds);
};

export const comparePassword = async (
  password: string,
  hashedPassword: string
): Promise<boolean> => {
  return bcrypt.compare(password, hashedPassword);
};

export const generateRandomToken = (): string => {
  return (
    Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15)
  );
};
