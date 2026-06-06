import { Request, Response } from "express";
import salonService, { CreateSalonSchema, UpdateSalonSchema, WorkingHoursSchema } from "../services/salonService";
import serviceManagementService, { CreateServiceSchema, UpdateServiceSchema } from "../services/serviceManagementService";
import appointmentService, { BookAppointmentSchema } from "../services/appointmentService";
import { AppointmentStatus } from "@prisma/client";
import { z } from "zod";
import CommonUtils from "../utils/common";
import BaseResponse from "../modules/common/models/baseResponse";
import { eReturnCodes } from "../enums/commonEnums";

const isSuccess = (dto: BaseResponse) =>
  dto.dataResponse.returnCode === eReturnCodes.R_SUCCESS ||
  dto.dataResponse.returnCode === eReturnCodes.R_CREATED;

// ─── Salon CRUD ───────────────────────────────────────────────────────────────

export const getSalonBySlug = async (req: Request, res: Response) => {
  const { slug } = req.params;
  const result = await salonService.getSalonBySlug(slug);
  res.status(isSuccess(result) ? 200 : 404).json(result);
};

export const getOwnerSalon = async (req: Request, res: Response) => {
  const ownerId = req.user!.id;
  const result = await salonService.getSalonByOwner(ownerId);
  res.status(isSuccess(result) ? 200 : 404).json(result);
};

export const updateSalon = async (req: Request, res: Response) => {
  try {
    const salonId = req.params.salonId;
    const ownerId = req.user!.id;
    const data = UpdateSalonSchema.parse(req.body);
    const result = await salonService.updateSalon(salonId, ownerId, data);
    res.status(isSuccess(result) ? 200 : 400).json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const dto = new BaseResponse(CommonUtils.getDataResponse(eReturnCodes.R_INVALID_DATA));
      dto.dataResponse.description = error.issues[0]?.message || "Validation error";
      dto.data = error.issues;
      res.status(400).json(dto);
    } else {
      const dto = new BaseResponse(CommonUtils.getDataResponse(eReturnCodes.R_DB_ERROR));
      res.status(500).json(dto);
    }
  }
};

export const updateWorkingHours = async (req: Request, res: Response) => {
  try {
    const salonId = req.params.salonId;
    const ownerId = req.user!.id;
    const data = WorkingHoursSchema.parse(req.body);
    const result = await salonService.updateWorkingHours(salonId, ownerId, data);
    res.status(isSuccess(result) ? 200 : 400).json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const dto = new BaseResponse(CommonUtils.getDataResponse(eReturnCodes.R_INVALID_DATA));
      dto.dataResponse.description = error.issues[0]?.message || "Validation error";
      dto.data = error.issues;
      res.status(400).json(dto);
    } else {
      const dto = new BaseResponse(CommonUtils.getDataResponse(eReturnCodes.R_DB_ERROR));
      res.status(500).json(dto);
    }
  }
};

export const getAllSalons = async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const pageSize = parseInt(req.query.pageSize as string) || 20;
  const result = await salonService.getAllSalons(page, pageSize);
  res.status(isSuccess(result) ? 200 : 500).json(result);
};

// ─── Services ─────────────────────────────────────────────────────────────────

export const createService = async (req: Request, res: Response) => {
  try {
    const salonId = req.params.salonId;
    const ownerId = req.user!.id;
    const data = CreateServiceSchema.parse(req.body);
    const result = await serviceManagementService.createService(salonId, ownerId, data);
    res.status(isSuccess(result) ? 201 : 400).json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const dto = new BaseResponse(CommonUtils.getDataResponse(eReturnCodes.R_INVALID_DATA));
      dto.dataResponse.description = error.issues[0]?.message || "Validation error";
      dto.data = error.issues;
      res.status(400).json(dto);
    } else {
      const dto = new BaseResponse(CommonUtils.getDataResponse(eReturnCodes.R_DB_ERROR));
      res.status(500).json(dto);
    }
  }
};

export const getServices = async (req: Request, res: Response) => {
  const salonId = req.params.salonId;
  const includeInactive = req.query.includeInactive === "true";
  const result = await serviceManagementService.getServices(salonId, includeInactive);
  res.status(isSuccess(result) ? 200 : 404).json(result);
};

export const updateService = async (req: Request, res: Response) => {
  try {
    const { salonId, serviceId } = req.params;
    const ownerId = req.user!.id;
    const data = UpdateServiceSchema.parse(req.body);
    const result = await serviceManagementService.updateService(serviceId, salonId, ownerId, data);
    res.status(isSuccess(result) ? 200 : 400).json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const dto = new BaseResponse(CommonUtils.getDataResponse(eReturnCodes.R_INVALID_DATA));
      dto.dataResponse.description = error.issues[0]?.message || "Validation error";
      dto.data = error.issues;
      res.status(400).json(dto);
    } else {
      const dto = new BaseResponse(CommonUtils.getDataResponse(eReturnCodes.R_DB_ERROR));
      res.status(500).json(dto);
    }
  }
};

export const deleteService = async (req: Request, res: Response) => {
  const { salonId, serviceId } = req.params;
  const ownerId = req.user!.id;
  const result = await serviceManagementService.deleteService(serviceId, salonId, ownerId);
  res.status(isSuccess(result) ? 200 : 400).json(result);
};

// ─── Appointments ─────────────────────────────────────────────────────────────

export const getAvailableSlots = async (req: Request, res: Response) => {
  const { salonId } = req.params;
  const { date } = req.query;
  if (!date || typeof date !== "string") {
    const dto = new BaseResponse(CommonUtils.getDataResponse(eReturnCodes.R_INVALID_DATA));
    dto.dataResponse.description = "Date is required (YYYY-MM-DD)";
    res.status(400).json(dto);
    return;
  }
  const result = await appointmentService.getAvailableSlots(salonId, date);
  res.status(isSuccess(result) ? 200 : 400).json(result);
};

export const bookAppointment = async (req: Request, res: Response) => {
  try {
    const data = BookAppointmentSchema.parse(req.body);
    const customerId = req.user?.id;
    const result = await appointmentService.bookAppointment(data, customerId);
    res.status(isSuccess(result) ? 201 : 400).json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const dto = new BaseResponse(CommonUtils.getDataResponse(eReturnCodes.R_INVALID_DATA));
      dto.dataResponse.description = error.issues[0]?.message || "Validation error";
      dto.data = error.issues;
      res.status(400).json(dto);
    } else {
      const dto = new BaseResponse(CommonUtils.getDataResponse(eReturnCodes.R_DB_ERROR));
      res.status(500).json(dto);
    }
  }
};

export const getSalonAppointments = async (req: Request, res: Response) => {
  const salonId = req.params.salonId;
  const ownerId = req.user!.id;
  const { status, date, page, pageSize } = req.query;
  const result = await appointmentService.getSalonAppointments(salonId, ownerId, {
    status: status as AppointmentStatus,
    date: date as string,
    page: page ? parseInt(page as string) : undefined,
    pageSize: pageSize ? parseInt(pageSize as string) : undefined,
  });
  res.status(isSuccess(result) ? 200 : 400).json(result);
};

export const updateAppointmentStatus = async (req: Request, res: Response) => {
  const { salonId, appointmentId } = req.params;
  const ownerId = req.user!.id;
  const { status } = req.body;
  if (!Object.values(AppointmentStatus).includes(status)) {
    const dto = new BaseResponse(CommonUtils.getDataResponse(eReturnCodes.R_INVALID_DATA));
    dto.dataResponse.description = "Invalid status";
    res.status(400).json(dto);
    return;
  }
  const result = await appointmentService.updateAppointmentStatus(appointmentId, salonId, ownerId, status);
  res.status(isSuccess(result) ? 200 : 400).json(result);
};

export const cancelAppointment = async (req: Request, res: Response) => {
  const { appointmentId } = req.params;
  const { customerEmail } = req.body;
  if (!customerEmail) {
    const dto = new BaseResponse(CommonUtils.getDataResponse(eReturnCodes.R_INVALID_DATA));
    dto.dataResponse.description = "Customer email required";
    res.status(400).json(dto);
    return;
  }
  const result = await appointmentService.cancelAppointment(appointmentId, customerEmail);
  res.status(isSuccess(result) ? 200 : 400).json(result);
};
