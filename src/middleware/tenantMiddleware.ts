import { Request, Response, NextFunction } from "express";
import authService from "../services/authService";
import prisma from "../database/prismaClient";
import { SubscriptionStatus } from "@prisma/client";

// Role name constants for authorization (replaces UserRole enum dependency)
export const ROLES = {
  SUPER_ADMIN: "SUPER_ADMIN",
  ADMIN: "ADMIN",
  OWNER: "OWNER",
  SALON_OWNER: "SALON_OWNER",
  TENANT_ADMIN: "TENANT_ADMIN",
  STAFF: "STAFF",
  USER: "USER",
  CUSTOMER: "CUSTOMER",
} as const;
import CommonUtils from "../utils/common";
import { eReturnCodes } from "../enums/commonEnums";

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: string;
        tenantId?: string | null;
        roles?: string[];
        permissions?: string[];
      };
      tenant?: {
        id: string;
        slug: string;
        subdomain?: string | null;
        customDomain?: string | null;
        ownerId: string;
        subscriptionStatus?: SubscriptionStatus;
        isActive?: boolean;
      };
      salon?: { id: string; slug: string; ownerId: string };
    }
  }
}

const PLATFORM_DOMAIN = process.env.PLATFORM_DOMAIN || "mysalonplatform.com";

const getBearerToken = (req: Request) => {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith("Bearer ")) return authHeader.split(" ")[1];

  const cookieHeader = req.headers.cookie;
  if (!cookieHeader) return null;

  const accessTokenKey = process.env.ACCESS_TOKEN_COOKIE_NAME || "access_token";
  const cookies = Object.fromEntries(
    cookieHeader.split(";").map((cookie) => {
      const [key, ...value] = cookie.trim().split("=");
      return [key, decodeURIComponent(value.join("="))];
    })
  );

  const cookieToken = cookies[accessTokenKey];
  if (!cookieToken) return null;
  return cookieToken.startsWith("Bearer ") ? cookieToken.slice(7) : cookieToken;
};

const extractTenantLookup = (req: Request) => {
  const host = (req.headers["x-forwarded-host"] || req.headers.host || "").toString().split(":")[0].toLowerCase();
  const customDomain = host && !host.endsWith(PLATFORM_DOMAIN) && host !== "localhost" ? host : undefined;
  const subdomain = host.endsWith(`.${PLATFORM_DOMAIN}`) ? host.replace(`.${PLATFORM_DOMAIN}`, "") : undefined;
  const slug =
    req.params.slug ||
    req.params.tenantSlug ||
    (req.query.slug as string | undefined) ||
    (req.query.tenantSlug as string | undefined) ||
    (req.headers["x-tenant-slug"] as string | undefined);
  const tenantId = req.params.tenantId || (req.query.tenantId as string | undefined) || (req.headers["x-tenant-id"] as string | undefined);

  if (customDomain) return { customDomain };
  if (subdomain && subdomain !== "www" && subdomain !== "app") return { subdomain };
  if (slug) return { slug };
  if (tenantId) return { id: tenantId };
  return null;
};

/**
 * JWT Authentication middleware (Prisma-based)
 */
export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  const token = getBearerToken(req);
  if (!token) {
    const dto = { dataResponse: CommonUtils.getDataResponse(eReturnCodes.R_AUTHENTICATION_FAILED), data: [] };
    dto.dataResponse.description = "Authorization token required";
    res.status(401).json(dto);
    return;
  }
  const decoded = authService.verifyToken(token);
  if (!decoded) {
    const dto = { dataResponse: CommonUtils.getDataResponse(eReturnCodes.R_AUTHENTICATION_FAILED), data: [] };
    dto.dataResponse.description = "Invalid or expired token";
    res.status(401).json(dto);
    return;
  }
  req.user = decoded;
  next();
};

export const optionalAuthenticate = (req: Request, _res: Response, next: NextFunction) => {
  const token = getBearerToken(req);
  if (token) {
    const decoded = authService.verifyToken(token);
    if (decoded) req.user = decoded;
  }
  next();
};

/**
 * Role-based authorization middleware
 * Accepts role name strings (e.g. "SALON_OWNER", "ADMIN")
 */
export const authorize = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      const dto = { dataResponse: CommonUtils.getDataResponse(eReturnCodes.R_AUTHENTICATION_FAILED), data: [] };
      res.status(401).json(dto);
      return;
    }
    // Check both the primary role and the roles array
    const hasRole = roles.includes(req.user.role) ||
                    req.user.roles?.some((r) => roles.includes(r));
    if (!hasRole) {
      const dto = { dataResponse: CommonUtils.getDataResponse(eReturnCodes.R_UNAUTHORIZED), data: [] };
      dto.dataResponse.description = "Insufficient permissions";
      res.status(403).json(dto);
      return;
    }
    next();
  };
};

export const requirePermission = (...permissions: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      const dto = { dataResponse: CommonUtils.getDataResponse(eReturnCodes.R_AUTHENTICATION_FAILED), data: [] };
      res.status(401).json(dto);
      return;
    }
    // Power roles bypass permission checks
    const powerRoles: string[] = [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.OWNER, ROLES.SALON_OWNER];
    if (powerRoles.includes(req.user.role) || req.user.roles?.some((r) => powerRoles.includes(r))) {
      next();
      return;
    }
    const granted = new Set(req.user.permissions || []);
    const allowed = permissions.every((permission) => granted.has(permission));
    if (!allowed) {
      const dto = { dataResponse: CommonUtils.getDataResponse(eReturnCodes.R_UNAUTHORIZED), data: permissions };
      dto.dataResponse.description = "Missing required permission";
      res.status(403).json(dto);
      return;
    }
    next();
  };
};

/**
 * Tenant resolver middleware — extracts slug from URL and attaches salon to request
 */
export const resolveTenant = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const lookup = extractTenantLookup(req);
    if (!lookup) {
      const dto = { dataResponse: CommonUtils.getDataResponse(eReturnCodes.R_INVALID_REQUEST), data: [] };
      dto.dataResponse.description = "Tenant could not be resolved";
      res.status(400).json(dto);
      return;
    }

    const salon = await prisma.salon.findFirst({
      where: { ...lookup, isActive: true, deletedAt: null },
      select: {
        id: true, slug: true, subdomain: true, customDomain: true,
        ownerId: true, subscriptionExpiry: true, subscriptionStatus: true, isActive: true,
      },
    });

    if (!salon) {
      const dto = { dataResponse: CommonUtils.getDataResponse(eReturnCodes.R_NOT_FOUND), data: [] };
      res.status(404).json(dto);
      return;
    }

    if (
      salon.subscriptionStatus === SubscriptionStatus.SUSPENDED ||
      (salon.subscriptionExpiry && salon.subscriptionExpiry < new Date())
    ) {
      const dto = { dataResponse: CommonUtils.getDataResponse(eReturnCodes.R_UNAUTHORIZED), data: { salonId: salon.id, tenantId: salon.id } };
      dto.dataResponse.description = "Tenant subscription is not active";
      res.status(402).json(dto);
      return;
    }

    req.tenant = salon;
    req.salon = { id: salon.id, slug: salon.slug, ownerId: salon.ownerId };
    next();
  } catch (error) {
    const dto = { dataResponse: CommonUtils.getDataResponse(eReturnCodes.R_DB_ERROR), data: [] };
    dto.dataResponse.description = "Failed to resolve tenant";
    res.status(500).json(dto);
  }
};

export const requireTenant = (req: Request, res: Response, next: NextFunction) => {
  if (!req.tenant && !req.salon) {
    res.status(400).json({ success: false, message: "Tenant context is required" });
    return;
  }
  next();
};

/**
 * Verify the authenticated user owns the salon
 */
export const verifySalonOwner = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: "Not authenticated" });
      return;
    }

    const salonId = req.params.salonId || req.params.tenantId || req.body.salonId || req.body.tenantId || req.tenant?.id;

    if (!salonId) {
      res.status(400).json({ success: false, message: "Salon ID required" });
      return;
    }

    const salon = await prisma.salon.findFirst({
      where: { id: salonId, ownerId: req.user.id },
      select: { id: true, slug: true, ownerId: true },
    });

    if (!salon) {
      res.status(403).json({ success: false, message: "You do not own this salon" });
      return;
    }

    req.salon = salon;
    req.tenant = { id: salon.id, slug: salon.slug, ownerId: salon.ownerId };
    next();
  } catch (error) {
    res.status(500).json({ success: false, message: "Authorization check failed" });
  }
};
