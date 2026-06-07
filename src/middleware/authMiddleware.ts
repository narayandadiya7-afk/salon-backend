const jwt = require("jsonwebtoken");
import { TAuthorizationModel } from "../types/common";
import { Request, Response, NextFunction } from "express";
import prisma from "../database/prismaClient";

const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    res.status(401).send("Authorization header is missing");
    return;
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded: any = jwt.verify(token, process.env.JWT_SECRET_KEY);

    let roleId = decoded?.roleId;
    if (!roleId) {
      const roleName = decoded?.roles?.[0] || decoded?.role;
      if (roleName) {
        const role = await prisma.role.findFirst({
          where: { name: roleName, deletedAt: null },
          select: { id: true },
        });
        roleId = role?.id || undefined;
      }
    }

    const auth_token: TAuthorizationModel = {
      userId: decoded?.id,
      roleId: roleId,
      emailId: decoded?.emailId || decoded?.email,
      mobileNumber: decoded?.mobileNumber,
      fullName: decoded?.fullName || decoded?.name,
    };

    req.body = { ...req.body, auth_token };
  } catch (err) {
    res.status(401).send("Invalid jwt Token");
    return;
  }

  next();
};

export default authMiddleware;
