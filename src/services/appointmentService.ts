import prisma from "../database/prismaClient";
import { AppointmentStatus } from "@prisma/client";
import { z } from "zod";
import logger from "../logger";
import CommonUtils from "../utils/common";
import BaseResponse from "../modules/common/models/baseResponse";
import { eReturnCodes } from "../enums/commonEnums";

// ─── Validation Schemas ───────────────────────────────────────────────────────

export const BookAppointmentSchema = z.object({
  salonId: z.string().optional(),
  tenantId: z.string().optional(),
  serviceId: z.string(),
  customerName: z.string().min(2).max(100),
  customerEmail: z.string().email(),
  customerPhone: z.string().min(7).max(20),
  appointmentDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD"),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, "Time must be HH:MM"),
  notes: z.string().max(500).optional(),
}).refine((data) => data.salonId || data.tenantId, {
  message: "tenantId or salonId is required",
  path: ["tenantId"],
});

// ─── Service ──────────────────────────────────────────────────────────────────

class AppointmentService {
  /**
   * Get available time slots for a salon on a given date
   */
  async getAvailableSlots(salonId: string, date: string) {
    const dto = new BaseResponse(CommonUtils.getDataResponse(eReturnCodes.R_SUCCESS));
    try {
      const salon = await prisma.salon.findUnique({
        where: { id: salonId, isActive: true },
        include: { timeSlots: true },
      });

      if (!salon) {
        dto.dataResponse = CommonUtils.getDataResponse(eReturnCodes.R_NOT_FOUND);
        return dto;
      }

      if (salon.subscriptionExpiry && salon.subscriptionExpiry < new Date()) {
        dto.dataResponse = CommonUtils.getDataResponse(eReturnCodes.R_UNAUTHORIZED);
        dto.dataResponse.description = "Salon subscription expired";
        return dto;
      }

      const dateObj = new Date(date);
      const dayOfWeek = dateObj.getDay();
      const daySlot = salon.timeSlots.find(
        (s: { dayOfWeek: number; isAvailable: boolean; startTime: string; endTime: string }) =>
          s.dayOfWeek === dayOfWeek
      );

      if (!daySlot || !daySlot.isAvailable) {
        dto.dataResponse.description = "Salon is closed on this day";
        dto.data = [];
        return dto;
      }

      const allSlots = this.generateTimeSlots(daySlot.startTime, daySlot.endTime, salon.slotDurationMinutes);

      const bookedAppointments = await prisma.appointment.findMany({
        where: {
          tenantId: salonId,
          salonId,
          appointmentDate: {
            gte: new Date(`${date}T00:00:00.000Z`),
            lt: new Date(`${date}T23:59:59.999Z`),
          },
          status: { in: [AppointmentStatus.BOOKED] },
        },
        select: { startTime: true, endTime: true },
      });

      const bookedTimes = new Set(bookedAppointments.map((a: { startTime: string }) => a.startTime));
      dto.data = allSlots.map((slot) => ({
        startTime: slot.start,
        endTime: slot.end,
        available: !bookedTimes.has(slot.start),
      }));
      return dto;
    } catch (error: any) {
      logger.error("getAvailableSlots error:", error.message);
      dto.dataResponse = CommonUtils.getDataResponse(eReturnCodes.R_DB_ERROR);
      dto.dataResponse.description = "Failed to fetch available slots";
      return dto;
    }
  }

  /**
   * Book an appointment — prevents double booking
   */
  async bookAppointment(data: z.infer<typeof BookAppointmentSchema>, customerId?: string) {
    const dto = new BaseResponse(CommonUtils.getDataResponse(eReturnCodes.R_SUCCESS));
    try {
      const { serviceId, appointmentDate, startTime } = data;
      const salonId = data.tenantId || data.salonId!;

      const salon = await prisma.salon.findUnique({ where: { id: salonId, isActive: true } });
      if (!salon) {
        dto.dataResponse = CommonUtils.getDataResponse(eReturnCodes.R_NOT_FOUND);
        return dto;
      }

      if (salon.subscriptionExpiry && salon.subscriptionExpiry < new Date()) {
        dto.dataResponse = CommonUtils.getDataResponse(eReturnCodes.R_UNAUTHORIZED);
        dto.dataResponse.description = "Salon subscription expired";
        return dto;
      }

      const service = await prisma.service.findFirst({
        where: { id: serviceId, tenantId: salonId, salonId, isActive: true, deletedAt: null },
      });
      if (!service) {
        dto.dataResponse = CommonUtils.getDataResponse(eReturnCodes.R_NOT_FOUND);
        dto.dataResponse.description = "Service not found";
        return dto;
      }

      const endTime = this.addMinutes(startTime, service.duration);

      const conflict = await prisma.appointment.findFirst({
        where: {
          salonId,
          appointmentDate: {
            gte: new Date(`${appointmentDate}T00:00:00.000Z`),
            lt: new Date(`${appointmentDate}T23:59:59.999Z`),
          },
          startTime,
          status: AppointmentStatus.BOOKED,
        },
      });

      if (conflict) {
        dto.dataResponse = CommonUtils.getDataResponse(eReturnCodes.R_DUPLICATE_DATA);
        dto.dataResponse.description = "This time slot is already booked. Please choose another.";
        return dto;
      }

      const dateObj = new Date(appointmentDate);
      const dayOfWeek = dateObj.getDay();
      const timeSlot = await prisma.timeSlot.findUnique({
        where: { salonId_dayOfWeek: { salonId, dayOfWeek } },
      });

      if (!timeSlot || !timeSlot.isAvailable) {
        dto.dataResponse = CommonUtils.getDataResponse(eReturnCodes.R_INVALID_REQUEST);
        dto.dataResponse.description = "Salon is closed on this day";
        return dto;
      }

      if (startTime < timeSlot.startTime || endTime > timeSlot.endTime) {
        dto.dataResponse = CommonUtils.getDataResponse(eReturnCodes.R_INVALID_REQUEST);
        dto.dataResponse.description = "Selected time is outside working hours";
        return dto;
      }

      const appointment = await prisma.appointment.create({
        data: {
          salonId, tenantId: salonId, serviceId,
          customerId: customerId || null,
          customerName: data.customerName,
          customerEmail: data.customerEmail,
          customerPhone: data.customerPhone,
          appointmentDate: new Date(`${appointmentDate}T00:00:00.000Z`),
          startTime, endTime,
          notes: data.notes,
          status: AppointmentStatus.BOOKED,
        },
        include: {
          service: { select: { name: true, price: true, duration: true } },
          salon: { select: { name: true, address: true, phone: true } },
        },
      });

      dto.dataResponse = CommonUtils.getDataResponse(eReturnCodes.R_CREATED);
      dto.data = appointment;
      return dto;
    } catch (error: any) {
      logger.error("bookAppointment error:", error.message);
      dto.dataResponse = CommonUtils.getDataResponse(eReturnCodes.R_DB_ERROR);
      dto.dataResponse.description = "Failed to book appointment";
      return dto;
    }
  }

  /**
   * Get appointments for a salon (owner dashboard)
   */
  async getSalonAppointments(
    salonId: string,
    ownerId: string,
    filters: { status?: AppointmentStatus; date?: string; page?: number; pageSize?: number }
  ) {
    const dto = new BaseResponse(CommonUtils.getDataResponse(eReturnCodes.R_SUCCESS));
    try {
      const salon = await prisma.salon.findFirst({ where: { id: salonId, ownerId } });
      if (!salon) {
        dto.dataResponse = CommonUtils.getDataResponse(eReturnCodes.R_UNAUTHORIZED);
        return dto;
      }

      const page = filters.page || 1;
      const pageSize = filters.pageSize || 20;
      const skip = (page - 1) * pageSize;
      const where: any = { tenantId: salonId, salonId, deletedAt: null };
      if (filters.status) where.status = filters.status;
      if (filters.date) {
        where.appointmentDate = {
          gte: new Date(`${filters.date}T00:00:00.000Z`),
          lt: new Date(`${filters.date}T23:59:59.999Z`),
        };
      }

      const [appointments, total] = await prisma.$transaction([
        prisma.appointment.findMany({
          where, skip, take: pageSize,
          include: { service: { select: { name: true, price: true } } },
          orderBy: [{ appointmentDate: "desc" }, { startTime: "asc" }],
        }),
        prisma.appointment.count({ where }),
      ]);

      dto.data = { appointments, total, page, pageSize };
      return dto;
    } catch (error: any) {
      logger.error("getSalonAppointments error:", error.message);
      dto.dataResponse = CommonUtils.getDataResponse(eReturnCodes.R_DB_ERROR);
      dto.dataResponse.description = "Failed to fetch appointments";
      return dto;
    }
  }

  /**
   * Update appointment status
   */
  async updateAppointmentStatus(appointmentId: string, salonId: string, ownerId: string, status: AppointmentStatus) {
    const dto = new BaseResponse(CommonUtils.getDataResponse(eReturnCodes.R_SUCCESS));
    try {
      const salon = await prisma.salon.findFirst({ where: { id: salonId, ownerId } });
      if (!salon) {
        dto.dataResponse = CommonUtils.getDataResponse(eReturnCodes.R_UNAUTHORIZED);
        return dto;
      }

      const appointment = await prisma.appointment.findFirst({
        where: { id: appointmentId, tenantId: salonId, salonId, deletedAt: null },
      });
      if (!appointment) {
        dto.dataResponse = CommonUtils.getDataResponse(eReturnCodes.R_NOT_FOUND);
        return dto;
      }

      const updated = await prisma.appointment.update({ where: { id: appointmentId }, data: { status } });
      dto.data = updated;
      return dto;
    } catch (error: any) {
      logger.error("updateAppointmentStatus error:", error.message);
      dto.dataResponse = CommonUtils.getDataResponse(eReturnCodes.R_DB_ERROR);
      dto.dataResponse.description = "Failed to update appointment";
      return dto;
    }
  }

  /**
   * Cancel appointment (by customer)
   */
  async cancelAppointment(appointmentId: string, customerEmail: string) {
    const dto = new BaseResponse(CommonUtils.getDataResponse(eReturnCodes.R_SUCCESS));
    try {
      const appointment = await prisma.appointment.findFirst({
        where: { id: appointmentId, customerEmail, status: AppointmentStatus.BOOKED, deletedAt: null },
      });

      if (!appointment) {
        dto.dataResponse = CommonUtils.getDataResponse(eReturnCodes.R_NOT_FOUND);
        dto.dataResponse.description = "Appointment not found or already cancelled";
        return dto;
      }

      const updated = await prisma.appointment.update({
        where: { id: appointmentId },
        data: { status: AppointmentStatus.CANCELLED },
      });
      dto.data = updated;
      return dto;
    } catch (error: any) {
      logger.error("cancelAppointment error:", error.message);
      dto.dataResponse = CommonUtils.getDataResponse(eReturnCodes.R_DB_ERROR);
      dto.dataResponse.description = "Failed to cancel appointment";
      return dto;
    }
  }

  // ─── Private Helpers ────────────────────────────────────────────────────────

  private generateTimeSlots(startTime: string, endTime: string, durationMinutes: number) {
    const slots: { start: string; end: string }[] = [];
    let current = this.timeToMinutes(startTime);
    const end = this.timeToMinutes(endTime);
    while (current + durationMinutes <= end) {
      slots.push({ start: this.minutesToTime(current), end: this.minutesToTime(current + durationMinutes) });
      current += durationMinutes;
    }
    return slots;
  }

  private timeToMinutes(time: string): number {
    const [h, m] = time.split(":").map(Number);
    return h * 60 + m;
  }

  private minutesToTime(minutes: number): string {
    const h = Math.floor(minutes / 60).toString().padStart(2, "0");
    const m = (minutes % 60).toString().padStart(2, "0");
    return `${h}:${m}`;
  }

  private addMinutes(time: string, minutes: number): string {
    return this.minutesToTime(this.timeToMinutes(time) + minutes);
  }
}

export default new AppointmentService();
