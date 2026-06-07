import prisma from "../database/prismaClient";
import { PlanType, SubscriptionStatus } from "@prisma/client";
import { z } from "zod";
import logger from "../logger";
import CommonUtils from "../utils/common";
import BaseResponse from "../modules/common/models/baseResponse";
import { eReturnCodes } from "../enums/commonEnums";

// ─── Validation Schemas ───────────────────────────────────────────────────────

export const CreateSalonSchema = z.object({
  name: z.string().min(2).max(100),
  slug: z.string().min(2).max(50).regex(/^[a-z0-9-]+$/, "Slug must be lowercase alphanumeric with hyphens"),
  description: z.string().max(500).optional(),
  address: z.string().max(200).optional(),
  city: z.string().max(100).optional(),
  state: z.string().max(100).optional(),
  phone: z.string().max(20).optional(),
  email: z.string().email().optional(),
  primaryColor: z.string().optional(),
  customDomain: z.string().optional(),
});

export const UpdateSalonSchema = CreateSalonSchema.partial();

export const WorkingHoursSchema = z.object({
  workingHours: z.array(z.object({
    dayOfWeek: z.number().min(0).max(6),
    startTime: z.string().regex(/^\d{2}:\d{2}$/),
    endTime: z.string().regex(/^\d{2}:\d{2}$/),
    isAvailable: z.boolean(),
  })),
  slotDurationMinutes: z.number().min(15).max(120).optional(),
});

// ─── Service ──────────────────────────────────────────────────────────────────

class SalonService {
  /**
   * Create a new salon (tenant) after successful payment
   */
  async createSalon(ownerId: string, data: z.infer<typeof CreateSalonSchema>, planType: PlanType = PlanType.BASIC) {
    const dto = new BaseResponse(CommonUtils.getDataResponse(eReturnCodes.R_SUCCESS));
    try {
      const existing = await prisma.salon.findUnique({ where: { slug: data.slug } });
      if (existing) {
        dto.dataResponse = CommonUtils.getDataResponse(eReturnCodes.R_DUPLICATE_DATA);
        dto.dataResponse.description = "Slug already taken. Please choose another.";
        return dto;
      }

      const expiry = this.calculateExpiry(planType);

      const salon = await prisma.salon.create({
        data: {
          ownerId,
          name: data.name,
          slug: data.slug,
          subdomain: data.slug,
          customDomain: data.customDomain,
          description: data.description,
          address: data.address,
          city: data.city,
          state: data.state,
          phone: data.phone,
          email: data.email,
          primaryColor: data.primaryColor || "#1890ff",
          planType,
          subscriptionStatus: SubscriptionStatus.ACTIVE,
          subscriptionExpiry: expiry,
        },
        include: { owner: { select: { id: true, name: true, email: true } } },
      });

      await prisma.user.update({ where: { id: ownerId }, data: { tenantId: salon.id } });
      await this.initializeDefaultRoles(salon.id, ownerId);
      await this.createDefaultWorkingHours(salon.id);

      dto.dataResponse = CommonUtils.getDataResponse(eReturnCodes.R_CREATED);
      dto.data = salon;
      return dto;
    } catch (error: any) {
      logger.error("createSalon error:", error.message);
      dto.dataResponse = CommonUtils.getDataResponse(eReturnCodes.R_DB_ERROR);
      dto.dataResponse.description = "Failed to create salon";
      return dto;
    }
  }

  /**
   * Get salon by slug (public — for tenant website)
   */
  async getSalonBySlug(slug: string) {
    const dto = new BaseResponse(CommonUtils.getDataResponse(eReturnCodes.R_SUCCESS));
    try {
      const salon = await prisma.salon.findUnique({
        where: { slug, isActive: true },
        include: {
          services: { where: { isActive: true }, orderBy: { name: "asc" } },
          timeSlots: { orderBy: { dayOfWeek: "asc" } },
          owner: { select: { name: true, email: true } },
        },
      });

      if (!salon) {
        dto.dataResponse = CommonUtils.getDataResponse(eReturnCodes.R_NOT_FOUND);
        return dto;
      }

      if (salon.subscriptionExpiry && salon.subscriptionExpiry < new Date()) {
        dto.dataResponse = CommonUtils.getDataResponse(eReturnCodes.R_UNAUTHORIZED);
        dto.dataResponse.description = "Salon subscription has expired";
        return dto;
      }

      dto.data = salon;
      return dto;
    } catch (error: any) {
      logger.error("getSalonBySlug error:", error.message);
      dto.dataResponse = CommonUtils.getDataResponse(eReturnCodes.R_DB_ERROR);
      dto.dataResponse.description = "Failed to fetch salon";
      return dto;
    }
  }

  /**
   * Get salon by owner ID (for dashboard)
   */
  async getSalonByOwner(ownerId: string) {
    const dto = new BaseResponse(CommonUtils.getDataResponse(eReturnCodes.R_SUCCESS));
    try {
      const salon = await prisma.salon.findUnique({
        where: { ownerId },
        include: {
          services: { where: { isActive: true } },
          timeSlots: { orderBy: { dayOfWeek: "asc" } },
          _count: { select: { appointments: true } },
        },
      });

      if (!salon) {
        dto.dataResponse = CommonUtils.getDataResponse(eReturnCodes.R_NOT_FOUND);
        dto.dataResponse.description = "No salon found for this owner";
        return dto;
      }

      dto.data = salon;
      return dto;
    } catch (error: any) {
      logger.error("getSalonByOwner error:", error.message);
      dto.dataResponse = CommonUtils.getDataResponse(eReturnCodes.R_DB_ERROR);
      dto.dataResponse.description = "Failed to fetch salon";
      return dto;
    }
  }

  /**
   * Update salon details
   */
  async updateSalon(salonId: string, ownerId: string, data: z.infer<typeof UpdateSalonSchema>) {
    const dto = new BaseResponse(CommonUtils.getDataResponse(eReturnCodes.R_SUCCESS));
    try {
      const salon = await prisma.salon.findFirst({ where: { id: salonId, ownerId } });
      if (!salon) {
        dto.dataResponse = CommonUtils.getDataResponse(eReturnCodes.R_NOT_FOUND);
        dto.dataResponse.description = "Salon not found or unauthorized";
        return dto;
      }

      if (data.slug && data.slug !== salon.slug) {
        const existing = await prisma.salon.findUnique({ where: { slug: data.slug } });
        if (existing) {
          dto.dataResponse = CommonUtils.getDataResponse(eReturnCodes.R_DUPLICATE_DATA);
          dto.dataResponse.description = "Slug already taken";
          return dto;
        }
      }

      const updated = await prisma.salon.update({ where: { id: salonId }, data });
      dto.data = updated;
      return dto;
    } catch (error: any) {
      logger.error("updateSalon error:", error.message);
      dto.dataResponse = CommonUtils.getDataResponse(eReturnCodes.R_DB_ERROR);
      dto.dataResponse.description = "Failed to update salon";
      return dto;
    }
  }

  /**
   * Update working hours
   */
  async updateWorkingHours(salonId: string, ownerId: string, payload: z.infer<typeof WorkingHoursSchema>) {
    const dto = new BaseResponse(CommonUtils.getDataResponse(eReturnCodes.R_SUCCESS));
    try {
      const salon = await prisma.salon.findFirst({ where: { id: salonId, ownerId } });
      if (!salon) {
        dto.dataResponse = CommonUtils.getDataResponse(eReturnCodes.R_NOT_FOUND);
        dto.dataResponse.description = "Salon not found or unauthorized";
        return dto;
      }

      const upserts = payload.workingHours.map((slot) =>
        prisma.timeSlot.upsert({
          where: { salonId_dayOfWeek: { salonId, dayOfWeek: slot.dayOfWeek } },
          create: { tenantId: salonId, salonId, ...slot },
          update: { startTime: slot.startTime, endTime: slot.endTime, isAvailable: slot.isAvailable },
        })
      );
      await prisma.$transaction(upserts);

      if (payload.slotDurationMinutes) {
        await prisma.salon.update({ where: { id: salonId }, data: { slotDurationMinutes: payload.slotDurationMinutes } });
      }

      dto.dataResponse.description = "Working hours updated";
      return dto;
    } catch (error: any) {
      logger.error("updateWorkingHours error:", error.message);
      dto.dataResponse = CommonUtils.getDataResponse(eReturnCodes.R_DB_ERROR);
      dto.dataResponse.description = "Failed to update working hours";
      return dto;
    }
  }

  /**
   * Get all salons (admin only)
   */
  async getAllSalons(page = 1, pageSize = 20) {
    const dto = new BaseResponse(CommonUtils.getDataResponse(eReturnCodes.R_SUCCESS));
    try {
      const skip = (page - 1) * pageSize;
      const [salons, total] = await prisma.$transaction([
        prisma.salon.findMany({
          skip,
          take: pageSize,
          include: {
            owner: { select: { name: true, email: true } },
            _count: { select: { appointments: true, services: true } },
          },
          orderBy: { createdAt: "desc" },
        }),
        prisma.salon.count(),
      ]);

      dto.data = { salons, total, page, pageSize };
      return dto;
    } catch (error: any) {
      logger.error("getAllSalons error:", error.message);
      dto.dataResponse = CommonUtils.getDataResponse(eReturnCodes.R_DB_ERROR);
      dto.dataResponse.description = "Failed to fetch salons";
      return dto;
    }
  }

  /**
   * Extend subscription after payment
   */
  async extendSubscription(salonId: string, planType: PlanType) {
    const dto = new BaseResponse(CommonUtils.getDataResponse(eReturnCodes.R_SUCCESS));
    try {
      const salon = await prisma.salon.findUnique({ where: { id: salonId } });
      if (!salon) {
        dto.dataResponse = CommonUtils.getDataResponse(eReturnCodes.R_NOT_FOUND);
        return dto;
      }

      const newExpiry = this.calculateExpiry(planType, salon.subscriptionExpiry);
      const updated = await prisma.salon.update({
        where: { id: salonId },
        data: { planType, subscriptionStatus: SubscriptionStatus.ACTIVE, subscriptionExpiry: newExpiry },
      });

      dto.data = updated;
      return dto;
    } catch (error: any) {
      logger.error("extendSubscription error:", error.message);
      dto.dataResponse = CommonUtils.getDataResponse(eReturnCodes.R_DB_ERROR);
      dto.dataResponse.description = "Failed to extend subscription";
      return dto;
    }
  }

  // ─── Private Helpers ────────────────────────────────────────────────────────

  private calculateExpiry(planType: PlanType, currentExpiry?: Date | null): Date {
    const base = currentExpiry && currentExpiry > new Date() ? currentExpiry : new Date();
    const expiry = new Date(base);
    if (planType === PlanType.PRO_YEARLY) {
      expiry.setFullYear(expiry.getFullYear() + 1);
    } else {
      expiry.setMonth(expiry.getMonth() + 1);
    }
    return expiry;
  }

  private async createDefaultWorkingHours(salonId: string) {
    const defaults = [
      { dayOfWeek: 1, startTime: "09:00", endTime: "19:00", isAvailable: true },
      { dayOfWeek: 2, startTime: "09:00", endTime: "19:00", isAvailable: true },
      { dayOfWeek: 3, startTime: "09:00", endTime: "19:00", isAvailable: true },
      { dayOfWeek: 4, startTime: "09:00", endTime: "19:00", isAvailable: true },
      { dayOfWeek: 5, startTime: "09:00", endTime: "19:00", isAvailable: true },
      { dayOfWeek: 6, startTime: "09:00", endTime: "17:00", isAvailable: true },
      { dayOfWeek: 0, startTime: "10:00", endTime: "15:00", isAvailable: false },
    ];
    await prisma.timeSlot.createMany({
      data: defaults.map((d) => ({ tenantId: salonId, salonId, ...d })),
      skipDuplicates: true,
    });
  }

  private async initializeDefaultRoles(tenantId: string, ownerId: string) {
    const permissionKeys = [
      "bookings.create", "bookings.edit", "bookings.delete",
      "services.manage", "customers.view", "staff.manage",
      "reports.view", "cms.manage", "payments.manage",
      "subscription.manage", "roles.manage",
    ];

    const permissions = await Promise.all(
      permissionKeys.map((key) =>
        prisma.permission.upsert({ where: { key }, create: { key, name: key }, update: {} })
      )
    );

    const role = await prisma.role.upsert({
      where: { tenantId_name: { tenantId, name: "SALON_OWNER" } },
      create: {
        tenantId,
        name: "SALON_OWNER",
        isSystem: true,
        permissions: { create: permissions.map((p) => ({ permissionId: p.id })) },
      },
      update: {},
    });

    await prisma.user.update({
      where: { id: ownerId },
      data: { roleId: role.id },
    });
  }
}

export default new SalonService();
