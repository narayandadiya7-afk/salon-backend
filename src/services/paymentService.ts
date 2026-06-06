import Razorpay from "razorpay";
import crypto from "crypto";
import prisma from "../database/prismaClient";
import { PlanType, PaymentStatus } from "@prisma/client";
import salonService from "./salonService";
import logger from "../logger";
import { z } from "zod";
import CommonUtils from "../utils/common";
import BaseResponse from "../modules/common/models/baseResponse";
import { eReturnCodes } from "../enums/commonEnums";

// ─── Plan Pricing (in paise — INR × 100) ─────────────────────────────────────

export const PLAN_PRICING: Record<PlanType, { amount: number; label: string; description: string }> = {
  BASIC: { amount: 49900, label: "Basic Monthly", description: "Basic plan - ₹499/month" },
  PRO: { amount: 99900, label: "Pro Monthly", description: "Pro plan - ₹999/month" },
  PRO_YEARLY: { amount: 899900, label: "Pro Yearly", description: "Pro plan - ₹8999/year (save 25%)" },
};

// ─── Validation Schemas ───────────────────────────────────────────────────────

export const CreateOrderSchema = z.object({
  planType: z.nativeEnum(PlanType),
  salonId: z.string().optional(),
  salonData: z.object({
    name: z.string().min(2),
    slug: z.string().min(2).regex(/^[a-z0-9-]+$/),
    description: z.string().optional(),
    city: z.string().optional(),
    phone: z.string().optional(),
  }).optional(),
});

export const VerifyPaymentSchema = z.object({
  razorpayOrderId: z.string(),
  razorpayPaymentId: z.string(),
  razorpaySignature: z.string(),
  paymentId: z.string(),
});

// ─── Service ──────────────────────────────────────────────────────────────────

class PaymentService {
  private razorpay: Razorpay;

  constructor() {
    this.razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID!,
      key_secret: process.env.RAZORPAY_KEY_SECRET!,
    });
  }

  /**
   * Create a Razorpay order for subscription purchase
   */
  async createOrder(userId: string, data: z.infer<typeof CreateOrderSchema>) {
    const dto = new BaseResponse(CommonUtils.getDataResponse(eReturnCodes.R_SUCCESS));
    try {
      const plan = PLAN_PRICING[data.planType];

      const razorpayOrder = await this.razorpay.orders.create({
        amount: plan.amount,
        currency: "INR",
        notes: { userId, planType: data.planType, salonId: data.salonId || "" },
      });

      const payment = await prisma.payment.create({
        data: {
          userId,
          salonId: data.salonId || null,
          tenantId: data.salonId || null,
          razorpayOrderId: razorpayOrder.id,
          amount: plan.amount / 100,
          planType: data.planType,
          status: PaymentStatus.PENDING,
        },
      });

      dto.dataResponse = CommonUtils.getDataResponse(eReturnCodes.R_CREATED);
      dto.data = {
        orderId: razorpayOrder.id,
        amount: plan.amount,
        currency: "INR",
        keyId: process.env.RAZORPAY_KEY_ID,
        paymentId: payment.id,
        planLabel: plan.label,
        description: plan.description,
      };
      return dto;
    } catch (error: any) {
      logger.error("createOrder error:", error.message);
      dto.dataResponse = CommonUtils.getDataResponse(eReturnCodes.R_DB_ERROR);
      dto.dataResponse.description = "Failed to create payment order";
      return dto;
    }
  }

  /**
   * Verify payment signature and activate subscription
   */
  async verifyPayment(userId: string, data: z.infer<typeof VerifyPaymentSchema>, salonData?: any) {
    const dto = new BaseResponse(CommonUtils.getDataResponse(eReturnCodes.R_SUCCESS));
    try {
      const expectedSignature = crypto
        .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
        .update(`${data.razorpayOrderId}|${data.razorpayPaymentId}`)
        .digest("hex");

      if (expectedSignature !== data.razorpaySignature) {
        dto.dataResponse = CommonUtils.getDataResponse(eReturnCodes.R_AUTHENTICATION_FAILED);
        dto.dataResponse.description = "Payment verification failed — invalid signature";
        return dto;
      }

      const payment = await prisma.payment.findFirst({
        where: { id: data.paymentId, userId, razorpayOrderId: data.razorpayOrderId },
      });

      if (!payment) {
        dto.dataResponse = CommonUtils.getDataResponse(eReturnCodes.R_NOT_FOUND);
        dto.dataResponse.description = "Payment record not found";
        return dto;
      }

      if (payment.status === PaymentStatus.COMPLETED) {
        dto.dataResponse = CommonUtils.getDataResponse(eReturnCodes.R_DUPLICATE_DATA);
        dto.dataResponse.description = "Payment already processed";
        return dto;
      }

      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          razorpayPaymentId: data.razorpayPaymentId,
          razorpaySignature: data.razorpaySignature,
          status: PaymentStatus.COMPLETED,
          webhookVerified: true,
        },
      });

      let salon = null;

      if (payment.salonId) {
        const result = await salonService.extendSubscription(payment.salonId, payment.planType);
        salon = result.data;
      } else if (salonData) {
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
          dto.dataResponse = CommonUtils.getDataResponse(eReturnCodes.R_NOT_FOUND);
          dto.dataResponse.description = "User not found";
          return dto;
        }
        const result = await salonService.createSalon(userId, salonData, payment.planType);
        if (result.dataResponse.returnCode !== eReturnCodes.R_CREATED) return result;
        salon = result.data;
        await prisma.payment.update({
          where: { id: payment.id },
          data: { salonId: salon!.id, tenantId: salon!.id },
        });
      }

      dto.data = { payment, salon };
      return dto;
    } catch (error: any) {
      logger.error("verifyPayment error:", error.message);
      dto.dataResponse = CommonUtils.getDataResponse(eReturnCodes.R_DB_ERROR);
      dto.dataResponse.description = "Payment verification failed";
      return dto;
    }
  }

  /**
   * Testing-only payment success flow
   */
  async testPaymentSuccess(userId: string, data: z.infer<typeof CreateOrderSchema>) {
    const dto = new BaseResponse(CommonUtils.getDataResponse(eReturnCodes.R_SUCCESS));
    try {
      const plan = PLAN_PRICING[data.planType];
      let salon = null;

      if (data.salonId) {
        const result = await salonService.extendSubscription(data.salonId, data.planType);
        if (result.dataResponse.returnCode !== eReturnCodes.R_SUCCESS) return result;
        salon = result.data;
      } else if (data.salonData) {
        const result = await salonService.createSalon(userId, data.salonData, data.planType);
        if (result.dataResponse.returnCode !== eReturnCodes.R_CREATED) return result;
        salon = result.data;
      } else {
        dto.dataResponse = CommonUtils.getDataResponse(eReturnCodes.R_INVALID_DATA);
        dto.dataResponse.description = "Salon data is required";
        return dto;
      }

      const payment = await prisma.payment.create({
        data: {
          userId,
          salonId: salon?.id || data.salonId || null,
          tenantId: salon?.id || data.salonId || null,
          razorpayOrderId: `test_order_${crypto.randomUUID()}`,
          razorpayPaymentId: `test_payment_${crypto.randomUUID()}`,
          razorpaySignature: "test_signature",
          amount: plan.amount / 100,
          planType: data.planType,
          status: PaymentStatus.COMPLETED,
          webhookVerified: true,
        },
      });

      dto.data = { payment, salon };
      return dto;
    } catch (error: any) {
      logger.error("testPaymentSuccess error:", error.message);
      dto.dataResponse = CommonUtils.getDataResponse(eReturnCodes.R_DB_ERROR);
      dto.dataResponse.description = "Failed to complete test payment";
      return dto;
    }
  }

  /**
   * Handle Razorpay webhook
   */
  async handleWebhook(body: string, signature: string) {
    const dto = new BaseResponse(CommonUtils.getDataResponse(eReturnCodes.R_SUCCESS));
    try {
      const expectedSignature = crypto
        .createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET!)
        .update(body)
        .digest("hex");

      if (expectedSignature !== signature) {
        logger.warn("Webhook signature mismatch");
        dto.dataResponse = CommonUtils.getDataResponse(eReturnCodes.R_AUTHENTICATION_FAILED);
        dto.dataResponse.description = "Invalid webhook signature";
        return dto;
      }

      const event = JSON.parse(body);
      logger.info(`Webhook event: ${event.event}`);

      if (event.event === "payment.captured") {
        const razorpayOrderId = event.payload.payment.entity.order_id;
        const razorpayPaymentId = event.payload.payment.entity.id;
        await prisma.payment.updateMany({
          where: { razorpayOrderId },
          data: { razorpayPaymentId, status: PaymentStatus.COMPLETED, webhookVerified: true },
        });
      }

      if (event.event === "payment.failed") {
        const razorpayOrderId = event.payload.payment.entity.order_id;
        await prisma.payment.updateMany({
          where: { razorpayOrderId },
          data: { status: PaymentStatus.FAILED },
        });
      }

      return dto;
    } catch (error: any) {
      logger.error("handleWebhook error:", error.message);
      dto.dataResponse = CommonUtils.getDataResponse(eReturnCodes.R_DB_ERROR);
      dto.dataResponse.description = "Webhook processing failed";
      return dto;
    }
  }

  /**
   * Get payment history for a user
   */
  async getPaymentHistory(userId: string) {
    const dto = new BaseResponse(CommonUtils.getDataResponse(eReturnCodes.R_SUCCESS));
    try {
      const payments = await prisma.payment.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        include: { salon: { select: { name: true, slug: true } } },
      });
      dto.data = payments;
      return dto;
    } catch (error: any) {
      logger.error("getPaymentHistory error:", error.message);
      dto.dataResponse = CommonUtils.getDataResponse(eReturnCodes.R_DB_ERROR);
      dto.dataResponse.description = "Failed to fetch payment history";
      return dto;
    }
  }
}

export default new PaymentService();
