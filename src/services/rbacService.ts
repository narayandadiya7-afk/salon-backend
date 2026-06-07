import prisma from "../database/prismaClient";
import { z } from "zod";
import logger from "../logger";
import CommonUtils from "../utils/common";
import BaseResponse from "../modules/common/models/baseResponse";
import { eReturnCodes } from "../enums/commonEnums";

export const RolePayloadSchema = z.object({
  name: z.string().min(2).max(80),
  description: z.string().max(300).optional(),
  permissions: z.array(z.string().min(2)).default([]),
});

class RbacService {
  async listRoles(tenantId: string) {
    const dto = new BaseResponse(CommonUtils.getDataResponse(eReturnCodes.R_SUCCESS));
    try {
      const roles = await prisma.role.findMany({
        where: { tenantId, deletedAt: null },
        include: { permissions: { include: { permission: true } } },
        orderBy: { name: "asc" },
      });
      dto.data = roles;
      return dto;
    } catch (error: any) {
      logger.error("listRoles error:", error.message);
      dto.dataResponse = CommonUtils.getDataResponse(eReturnCodes.R_DB_ERROR);
      dto.dataResponse.description = "Failed to fetch roles";
      return dto;
    }
  }

  async upsertRole(tenantId: string, roleId: string | undefined, payload: z.infer<typeof RolePayloadSchema>) {
    const dto = new BaseResponse(CommonUtils.getDataResponse(eReturnCodes.R_SUCCESS));
    try {
      const permissions = await Promise.all(
        payload.permissions.map((key) =>
          prisma.permission.upsert({ where: { key }, create: { key, name: key }, update: {} })
        )
      );

      const role = roleId
        ? await prisma.role.update({
            where: { id: roleId },
            data: {
              name: payload.name,
              description: payload.description,
              permissions: {
                deleteMany: {},
                create: permissions.map((p) => ({ permissionId: p.id })),
              },
            },
            include: { permissions: { include: { permission: true } } },
          })
        : await prisma.role.create({
            data: {
              tenantId,
              name: payload.name,
              description: payload.description,
              permissions: {
                create: permissions.map((p) => ({ permissionId: p.id })),
              },
            },
            include: { permissions: { include: { permission: true } } },
          });

      dto.data = role;
      return dto;
    } catch (error: any) {
      logger.error("upsertRole error:", error.message);
      dto.dataResponse = CommonUtils.getDataResponse(eReturnCodes.R_DB_ERROR);
      dto.dataResponse.description = "Failed to save role";
      return dto;
    }
  }

  async assignRole(userId: string, roleId: string) {
    const dto = new BaseResponse(CommonUtils.getDataResponse(eReturnCodes.R_SUCCESS));
    try {
      await prisma.user.update({
        where: { id: userId },
        data: { roleId },
      });

      return dto;
    } catch (error: any) {
      logger.error("assignRole error:", error.message);
      dto.dataResponse = CommonUtils.getDataResponse(eReturnCodes.R_DB_ERROR);
      dto.dataResponse.description = "Failed to assign role";
      return dto;
    }
  }
}

export default new RbacService();
