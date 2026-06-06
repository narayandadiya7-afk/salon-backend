import { Request, Response, NextFunction } from "express";
import { eSourcePlatform, eReturnCodes } from "../enums/commonEnums";
import CommonUtils from "../utils/common";

/**
 * Middleware to identify the source platform of the request.
 * Expected Header: 'x-api-source' (Numeric ID: 1 for Portal, 2 for Web, 3 for Mobile)
 */
export const sourcePlatformMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const sourceToken = req.headers["x-api-source"] as string;
  const platformId = parseInt(sourceToken);

  if (sourceToken && Object.values(eSourcePlatform).includes(platformId)) {
    (req as any).sourcePlatform = platformId;
    req.body.sourcePlatform = platformId;
    next();
  } else if (!sourceToken) {
    (req as any).sourcePlatform = 0; // Default to Unknown
    req.body.sourcePlatform = 0;
    next();
  } else {
    const response = CommonUtils.getDataResponse(eReturnCodes.R_AUTHENTICATION_FAILED);
    response.description = "Invalid API Source Header";
    return res.status(401).json({ dataResponse: response, data: [] });
  }
};
