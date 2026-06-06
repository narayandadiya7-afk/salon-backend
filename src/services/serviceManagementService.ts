import prisma from "../database/prismaClient";
import { z } from "zod";
import logger from "../logger";
import CommonUtils from "../utils/common";
import BaseResponse from "../modules/common/models/baseResponse";
import { eReturnCodes } from "../enums/commonEnums";

// ─── Validation Schemas ───────────────────────────────────────────────────────

export const CreateServiceSchema = z.object({
  name: z.string().min(2).max(100),
  description: z.string().max(500).optional(),
  price: z.number().positive(),
  duration: z.number().int().min(5).max(480), // minutes
  category: z.string().max(50).optional(),
  imageUrl: z.string().url().optional(),
});

export const UpdateServiceSchema = CreateServiceSchema.partial();

// ─── Service ──────────────────────────────────────────────────────────────────

class ServiceManagementService {
  /**
   * Create a new service for a salon
   */
  async createService(salonId: string, ownerId: string, data: z.infer<typeof CreateServiceSchema>) {
    const dto = new BaseResponse(CommonUtils.getDataResponse(eReturnCodes.R_SUCCESS));
    try {
      const salon = await prisma.salon.findFirst({ where: { id: salonId, ownerId } });
      if (!salon) {
        dto.dataResponse = CommonUtils.getDataResponse(eReturnCodes.R_NOT_FOUND);
        dto.dataResponse.description = "Salon not found or unauthorized";
        return dto;
      }

      const service = await prisma.service.create({
        data: { tenantId: salonId, salonId, ...data },
      });

      dto.dataResponse = CommonUtils.getDataResponse(eReturnCodes.R_CREATED);
      dto.data = service;
      return dto;
    } catch (error: any) {
      logger.error("createService error:", error.message);
      dto.dataResponse = CommonUtils.getDataResponse(eReturnCodes.R_DB_ERROR);
      dto.dataResponse.description = "Failed to create service";
      return dto;
    }
  }

  /**
   * Get all services for a salon
   */
  async getServices(salonId: string, includeInactive = false) {
    const dto = new BaseResponse(CommonUtils.getDataResponse(eReturnCodes.R_SUCCESS));
    try {
      const services = await prisma.service.findMany({
        where: {
          tenantId: salonId,
          salonId,
          deletedAt: null,
          ...(includeInactive ? {} : { isActive: true }),
        },
        orderBy: [{ category: "asc" }, { name: "asc" }],
      });

      dto.data = services;
      return dto;
    } catch (error: any) {
      logger.error("getServices error:", error.message);
      dto.dataResponse = CommonUtils.getDataResponse(eReturnCodes.R_DB_ERROR);
      dto.dataResponse.description = "Failed to fetch services";
      return dto;
    }
  }

  /**
   * Update a service
   */
  async updateService(serviceId: string, salonId: string, ownerId: string, data: z.infer<typeof UpdateServiceSchema>) {
    const dto = new BaseResponse(CommonUtils.getDataResponse(eReturnCodes.R_SUCCESS));
    try {
      const salon = await prisma.salon.findFirst({ where: { id: salonId, ownerId } });
      if (!salon) {
        dto.dataResponse = CommonUtils.getDataResponse(eReturnCodes.R_UNAUTHORIZED);
        return dto;
      }

      const service = await prisma.service.findFirst({ where: { id: serviceId, tenantId: salonId, salonId } });
      if (!service) {
        dto.dataResponse = CommonUtils.getDataResponse(eReturnCodes.R_NOT_FOUND);
        return dto;
      }

      const updated = await prisma.service.update({ where: { id: serviceId }, data });
      dto.data = updated;
      return dto;
    } catch (error: any) {
      logger.error("updateService error:", error.message);
      dto.dataResponse = CommonUtils.getDataResponse(eReturnCodes.R_DB_ERROR);
      dto.dataResponse.description = "Failed to update service";
      return dto;
    }
  }

  /**
   * Delete (soft-delete) a service
   */
  async deleteService(serviceId: string, salonId: string, ownerId: string) {
    const dto = new BaseResponse(CommonUtils.getDataResponse(eReturnCodes.R_SUCCESS));
    try {
      const salon = await prisma.salon.findFirst({ where: { id: salonId, ownerId } });
      if (!salon) {
        dto.dataResponse = CommonUtils.getDataResponse(eReturnCodes.R_UNAUTHORIZED);
        return dto;
      }

      const service = await prisma.service.findFirst({ where: { id: serviceId, tenantId: salonId, salonId } });
      if (!service) {
        dto.dataResponse = CommonUtils.getDataResponse(eReturnCodes.R_NOT_FOUND);
        return dto;
      }

      await prisma.service.update({
        where: { id: serviceId },
        data: { isActive: false, deletedAt: new Date() },
      });

      dto.dataResponse.description = "Service deleted";
      return dto;
    } catch (error: any) {
      logger.error("deleteService error:", error.message);
      dto.dataResponse = CommonUtils.getDataResponse(eReturnCodes.R_DB_ERROR);
      dto.dataResponse.description = "Failed to delete service";
      return dto;
    }
  }
}

export default new ServiceManagementService();
