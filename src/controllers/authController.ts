import { Request, Response } from "express";
import authService, { RegisterSchema, LoginSchema } from "../services/authService";
import { z } from "zod";
import CommonUtils from "../utils/common";
import BaseResponse from "../modules/common/models/baseResponse";
import { eReturnCodes } from "../enums/commonEnums";

const ACCESS_TOKEN_COOKIE_NAME = process.env.ACCESS_TOKEN_COOKIE_NAME || "access_token";
const REFRESH_TOKEN_COOKIE_NAME = process.env.REFRESH_TOKEN_COOKIE_NAME || "refresh_token";

const setSessionCookies = (res: Response, data?: any) => {
  if (!data?.accessToken || !data?.refreshToken) return;
  const secure = process.env.NODE_ENV === "production";
  res.cookie(ACCESS_TOKEN_COOKIE_NAME, data.accessToken, {
    httpOnly: true, secure, sameSite: "lax", maxAge: 1000 * 60 * 60 * 5,
  });
  res.cookie(REFRESH_TOKEN_COOKIE_NAME, data.refreshToken, {
    httpOnly: true, secure, sameSite: "lax", maxAge: 1000 * 60 * 60 * 24 * 30,
  });
};

const getCookie = (req: Request, name: string) => {
  const header = req.headers.cookie;
  if (!header) return undefined;
  const cookies = Object.fromEntries(
    header.split(";").map((cookie) => {
      const [key, ...value] = cookie.trim().split("=");
      return [key, decodeURIComponent(value.join("="))];
    })
  );
  return cookies[name];
};

const isSuccess = (dto: BaseResponse) =>
  dto.dataResponse.returnCode === eReturnCodes.R_SUCCESS ||
  dto.dataResponse.returnCode === eReturnCodes.R_CREATED;

export const register = async (req: Request, res: Response) => {
  try {
    const data = RegisterSchema.parse(req.body);
    const result = await authService.register(data);
    if (isSuccess(result)) setSessionCookies(res, result.data);
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

export const login = async (req: Request, res: Response) => {
  try {
    const data = LoginSchema.parse(req.body);
    const result = await authService.login(data);
    if (isSuccess(result)) setSessionCookies(res, result.data);
    res.status(isSuccess(result) ? 200 : 401).json(result);
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

export const refresh = async (req: Request, res: Response) => {
  const refreshToken =
    getCookie(req, REFRESH_TOKEN_COOKIE_NAME) ||
    req.body?.refreshToken ||
    req.headers["x-refresh-token"];

  if (!refreshToken || typeof refreshToken !== "string") {
    const dto = new BaseResponse(CommonUtils.getDataResponse(eReturnCodes.R_AUTHENTICATION_FAILED));
    dto.dataResponse.description = "Refresh token required";
    res.status(401).json(dto);
    return;
  }

  const result = await authService.refresh(refreshToken);
  if (isSuccess(result)) setSessionCookies(res, result.data);
  res.status(isSuccess(result) ? 200 : 401).json(result);
};

export const logout = async (req: Request, res: Response) => {
  const refreshToken = getCookie(req, REFRESH_TOKEN_COOKIE_NAME) || req.body?.refreshToken;
  if (refreshToken) await authService.revokeRefreshToken(refreshToken);

  res.clearCookie(ACCESS_TOKEN_COOKIE_NAME);
  res.clearCookie(REFRESH_TOKEN_COOKIE_NAME);

  const dto = new BaseResponse(CommonUtils.getDataResponse(eReturnCodes.R_SUCCESS));
  res.status(200).json(dto);
};

export const getProfile = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const result = await authService.getProfile(userId);
  res.status(isSuccess(result) ? 200 : 404).json(result);
};
