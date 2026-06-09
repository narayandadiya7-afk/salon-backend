import prisma from "../database/prismaClient";
import { z } from "zod";
import * as jwt from "jsonwebtoken";
import crypto from "crypto";
import EncryptUtils from "../utils/encrypt";
import logger from "../logger";
import CommonUtils from "../utils/common";
import BaseResponse from "../modules/common/models/baseResponse";
import { eReturnCodes } from "../enums/commonEnums";

// ─── Validation Schemas ───────────────────────────────────────────────────────

export const RegisterSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(6),
  phone: z.string().max(20).optional(),
  tenantId: z.string().optional(),
});

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
  tenantSlug: z.string().optional(),
  tenantId: z.string().optional(),
});

// ─── Service ──────────────────────────────────────────────────────────────────

class AuthService {
  private readonly JWT_SECRET = process.env.JWT_SECRET_KEY || "SALON_SAAS_SECRET";
  private readonly JWT_EXPIRES = process.env.JWT_EXPIRES_IN || "5h";
  private readonly REFRESH_TOKEN_DAYS = Number(process.env.REFRESH_TOKEN_DAYS || 30);

  /**
   * Register a new user
   */
  async register(data: z.infer<typeof RegisterSchema>) {
    const dto = new BaseResponse(CommonUtils.getDataResponse(eReturnCodes.R_SUCCESS));
    try {
      const whereClauses: any[] = [{ email: data.email }];
      if (data.phone) whereClauses.push({ phone: data.phone });

      const duplicates = await prisma.user.findMany({
        where: { OR: whereClauses, deletedAt: null },
        select: { email: true, phone: true },
      });

      if (duplicates.length > 0) {
        dto.dataResponse = CommonUtils.getDataResponse(eReturnCodes.R_DUPLICATE_DATA);
        const fields: string[] = [];
        duplicates.forEach((r) => {
          if (r.email === data.email) fields.push("Email");
          if (data.phone && r.phone === data.phone) fields.push("Phone number");
        });
        dto.dataResponse.description = `${fields.join(" and ")} already registered`;
        return dto;
      }

      const user = await prisma.user.create({
        data: {
          name: data.name,
          email: data.email,
          password: data.password,
          phone: data.phone,
          tenantId: data.tenantId,
        },
        select: { id: true, name: true, email: true, tenantId: true, createdAt: true },
      });

      const session = await this.createSession(user.id);

      dto.dataResponse = CommonUtils.getDataResponse(eReturnCodes.R_CREATED);
      dto.data = { user, ...session };
      return dto;
    } catch (error: any) {
      const detail = this.formatPrismaError(error);
      logger.error("register error:", detail);
      dto.dataResponse = CommonUtils.getDataResponse(eReturnCodes.R_DB_ERROR);
      dto.dataResponse.description = detail || "Registration failed";
      return dto;
    }
  }

  /**
   * Login user
   */
  async login(data: z.infer<typeof LoginSchema>) {
    const dto = new BaseResponse(CommonUtils.getDataResponse(eReturnCodes.R_SUCCESS));
    try {
      const user = await prisma.user.findFirst({
        where: { email: data.email },
        include: {
          salon: { select: { id: true, slug: true, name: true, subscriptionStatus: true, subscriptionExpiry: true } },
          tenant: { select: { id: true, slug: true, name: true, subscriptionStatus: true, subscriptionExpiry: true } },
        },
      });

      if (!user) {
        dto.dataResponse = CommonUtils.getDataResponse(eReturnCodes.R_AUTHENTICATION_FAILED);
        dto.dataResponse.description = "Invalid email or password";
        return dto;
      }

      if (user.password !== data.password) {
        dto.dataResponse = CommonUtils.getDataResponse(eReturnCodes.R_AUTHENTICATION_FAILED);
        dto.dataResponse.description = "Invalid email or password";
        return dto;
      }

      if (
        data.tenantId && user.tenantId && user.tenantId !== data.tenantId &&
        !user.salon
      ) {
        dto.dataResponse = CommonUtils.getDataResponse(eReturnCodes.R_UNAUTHORIZED);
        dto.dataResponse.description = "Invalid tenant for this account";
        return dto;
      }

      const session = await this.createSession(user.id);

      const sessionRole = session.role || "USER";
      dto.data = {
        ...session,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: sessionRole,
          roleId: user.roleId,
          tenantId: user.tenantId || user.salon?.id || null,
          salon: user.salon,
          tenant: user.tenant || user.salon,
        },
      };
      return dto;
    } catch (error: any) {
      const detail = this.formatPrismaError(error);
      logger.error("login error:", detail);
      dto.dataResponse = CommonUtils.getDataResponse(eReturnCodes.R_DB_ERROR);
      dto.dataResponse.description = detail || "Login failed";
      return dto;
    }
  }

  /**
   * Get current user profile
   */
  async getProfile(userId: string) {
    const dto = new BaseResponse(CommonUtils.getDataResponse(eReturnCodes.R_SUCCESS));
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          tenantId: true,
          roleId: true,
          createdAt: true,
          salon: {
            select: {
              id: true, name: true, slug: true, planType: true,
              subscriptionStatus: true, subscriptionExpiry: true, isActive: true,
            },
          },
          tenant: {
            select: {
              id: true, name: true, slug: true, planType: true,
              subscriptionStatus: true, subscriptionExpiry: true, isActive: true,
            },
          },
          roleRef: {
            include: { permissions: { include: { permission: true } } },
          },
        },
      });

      if (!user) {
        dto.dataResponse = CommonUtils.getDataResponse(eReturnCodes.R_NOT_FOUND);
        return dto;
      }

      dto.data = user;
      return dto;
    } catch (error: any) {
      logger.error("getProfile error:", error.message);
      dto.dataResponse = CommonUtils.getDataResponse(eReturnCodes.R_DB_ERROR);
      dto.dataResponse.description = "Failed to fetch profile";
      return dto;
    }
  }

  /**
   * Generate JWT token
   */
  generateToken(user: {
    id: string; email: string; role: string;
    tenantId?: string | null; roles?: string[]; permissions?: string[];
  }) {
    const payload = {
      id: user.id,
      email: user.email,
      role: user.role,
      tenantId: user.tenantId || null,
      roles: user.roles || [],
      permissions: user.permissions || [],
    };
    return jwt.sign(payload, this.JWT_SECRET, {
      expiresIn: this.JWT_EXPIRES as any,
      issuer: process.env.JWT_ISSUER,
      audience: process.env.JWT_AUDIENCE,
    });
  }

  /**
   * Verify JWT token
   */
  verifyToken(token: string): {
    id: string; email: string; role: string;
    tenantId?: string | null; roles?: string[]; permissions?: string[];
  } | null {
    try {
      return jwt.verify(token, this.JWT_SECRET) as any;
    } catch {
      return null;
    }
  }

  async refresh(refreshToken: string) {
    const dto = new BaseResponse(CommonUtils.getDataResponse(eReturnCodes.R_SUCCESS));
    try {
      const tokenHash = this.hashToken(refreshToken);
      const stored = await prisma.refreshToken.findUnique({
        where: { tokenHash },
        include: { user: true },
      });

      if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
        dto.dataResponse = CommonUtils.getDataResponse(eReturnCodes.R_AUTHENTICATION_FAILED);
        dto.dataResponse.description = "Invalid refresh token";
        return dto;
      }

      const session = await this.createSession(stored.userId);
      await prisma.refreshToken.update({
        where: { id: stored.id },
        data: { revokedAt: new Date(), replacedById: session.refreshTokenId },
      });

      dto.data = session;
      return dto;
    } catch (error: any) {
      logger.error("refresh token error:", error.message);
      dto.dataResponse = CommonUtils.getDataResponse(eReturnCodes.R_DB_ERROR);
      dto.dataResponse.description = "Failed to refresh session";
      return dto;
    }
  }

  async revokeRefreshToken(refreshToken: string) {
    const dto = new BaseResponse(CommonUtils.getDataResponse(eReturnCodes.R_SUCCESS));
    try {
      await prisma.refreshToken.updateMany({
        where: { tokenHash: this.hashToken(refreshToken), revokedAt: null },
        data: { revokedAt: new Date() },
      });
      return dto;
    } catch (error: any) {
      logger.error("revoke refresh token error:", error.message);
      dto.dataResponse = CommonUtils.getDataResponse(eReturnCodes.R_DB_ERROR);
      return dto;
    }
  }

  private roleNameToEnum(roleName: string): string {
    return roleName || "USER";
  }

  private async createSession(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        salon: { select: { id: true } },
        roleRef: {
          include: { permissions: { include: { permission: true } } },
        },
      },
    });

    if (!user) throw new Error("User not found");

    const roleName = user.roleRef?.name || "USER";
    const permissions = user.roleRef
      ? Array.from(new Set(user.roleRef.permissions.map((p) => p.permission.key)))
      : [];

    const primaryRole = this.roleNameToEnum(roleName);

    const accessToken = this.generateToken({
      id: user.id,
      email: user.email,
      role: primaryRole,
      tenantId: user.tenantId || user.salon?.id || null,
      roles: [roleName],
      permissions,
    });

    const refreshToken = crypto.randomBytes(48).toString("base64url");
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + this.REFRESH_TOKEN_DAYS);

    const stored = await prisma.refreshToken.create({
      data: { userId: user.id, tokenHash: this.hashToken(refreshToken), expiresAt },
      select: { id: true },
    });

    return { accessToken, token: accessToken, refreshToken, refreshTokenId: stored.id, role: primaryRole };
  }

  private hashToken(token: string) {
    return crypto.createHash("sha256").update(token).digest("hex");
  }

  private formatPrismaError(error: any) {
    const message = [error?.code, error?.message, error?.meta?.message].filter(Boolean).join(" ");
    if (
      message.includes("does not exist") ||
      message.includes("Unknown argument") ||
      message.includes("not found in the database")
    ) {
      return "Database schema is not up to date. Run `npm run db:push` or `npm run db:migrate` in salon-backend.";
    }
    if (error?.code === "P2002") return "Email already registered";
    return process.env.NODE_ENV === "production" ? "Operation failed" : message;
  }
}

export default new AuthService();
