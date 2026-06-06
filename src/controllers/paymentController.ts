import { Request, Response } from "express";
import paymentService, { CreateOrderSchema, VerifyPaymentSchema } from "../services/paymentService";
import { z } from "zod";
import CommonUtils from "../utils/common";
import BaseResponse from "../modules/common/models/baseResponse";
import { eReturnCodes } from "../enums/commonEnums";

const isSuccess = (dto: BaseResponse) =>
  dto.dataResponse.returnCode === eReturnCodes.R_SUCCESS ||
  dto.dataResponse.returnCode === eReturnCodes.R_CREATED;

export const createOrder = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const data = CreateOrderSchema.parse(req.body);
    const result = await paymentService.createOrder(userId, data);
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

export const verifyPayment = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { salonData, ...paymentData } = req.body;
    const data = VerifyPaymentSchema.parse(paymentData);
    const result = await paymentService.verifyPayment(userId, data, salonData);
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

export const testPaymentSuccess = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const data = CreateOrderSchema.parse(req.body);
    const result = await paymentService.testPaymentSuccess(userId, data);
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

export const handleWebhook = async (req: Request, res: Response) => {
  const signature = req.headers["x-razorpay-signature"] as string;
  if (!signature) {
    const dto = new BaseResponse(CommonUtils.getDataResponse(eReturnCodes.R_INVALID_DATA));
    dto.dataResponse.description = "Missing webhook signature";
    res.status(400).json(dto);
    return;
  }
  const rawBody = JSON.stringify(req.body);
  const result = await paymentService.handleWebhook(rawBody, signature);
  res.status(isSuccess(result) ? 200 : 400).json(result);
};

export const getPaymentHistory = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const result = await paymentService.getPaymentHistory(userId);
  res.status(isSuccess(result) ? 200 : 500).json(result);
};
