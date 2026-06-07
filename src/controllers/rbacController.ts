import { Request, Response } from "express";
import { z } from "zod";
import rbacService, { RolePayloadSchema } from "../services/rbacService";
import CommonUtils from "../utils/common";
import BaseResponse from "../modules/common/models/baseResponse";
import { eReturnCodes } from "../enums/commonEnums";

const isSuccess = (dto: BaseResponse) =>
  dto.dataResponse.returnCode === eReturnCodes.R_SUCCESS ||
  dto.dataResponse.returnCode === eReturnCodes.R_CREATED;

const getTenantId = (req: Request) =>
  req.tenant?.id || req.salon?.id || req.params.tenantId || req.params.salonId || req.user?.tenantId;

export const listTenantRoles = async (req: Request, res: Response) => {
  const tenantId = getTenantId(req);
  if (!tenantId) {
    const dto = new BaseResponse(CommonUtils.getDataResponse(eReturnCodes.R_INVALID_REQUEST));
    dto.dataResponse.description = "Tenant context is required";
    res.status(400).json(dto);
    return;
  }
  const result = await rbacService.listRoles(tenantId);
  res.status(isSuccess(result) ? 200 : 500).json(result);
};

export const saveTenantRole = async (req: Request, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    if (!tenantId) {
      const dto = new BaseResponse(CommonUtils.getDataResponse(eReturnCodes.R_INVALID_REQUEST));
      dto.dataResponse.description = "Tenant context is required";
      res.status(400).json(dto);
      return;
    }
    const payload = RolePayloadSchema.parse(req.body);
    const result = await rbacService.upsertRole(tenantId, req.params.roleId, payload);
    res.status(isSuccess(result) ? 200 : 400).json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const dto = new BaseResponse(CommonUtils.getDataResponse(eReturnCodes.R_INVALID_DATA));
      dto.dataResponse.description = error.issues[0]?.message || "Validation error";
      dto.data = error.issues;
      res.status(400).json(dto);
      return;
    }
    const dto = new BaseResponse(CommonUtils.getDataResponse(eReturnCodes.R_DB_ERROR));
    res.status(500).json(dto);
  }
};

export const assignRole = async (req: Request, res: Response) => {
  const { userId, roleId } = req.body;
  if (!userId || !roleId) {
    const dto = new BaseResponse(CommonUtils.getDataResponse(eReturnCodes.R_INVALID_DATA));
    dto.dataResponse.description = "userId and roleId are required";
    res.status(400).json(dto);
    return;
  }
  const result = await rbacService.assignRole(userId, roleId);
  res.status(isSuccess(result) ? 200 : 400).json(result);
};
