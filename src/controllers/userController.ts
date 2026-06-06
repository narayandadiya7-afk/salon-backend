import CommonUtils from "../utils/common";
import { Request, Response } from "express";
import { eReturnCodes } from "../enums/commonEnums";
import UserManagement from "../services/userService";
import { validationResult } from "express-validator";

export const addEditUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const data = CommonUtils.getDataResponse(eReturnCodes.R_NOT_FOUND);
      data.description = errors.array()[0].msg;
      res.status(400).json({ data });
    } else res.json(await UserManagement.addEditUser(req.body));
  } catch (err) {
    console.error((err as Error).message);
    res.status(500).send("Server Error");
  }
};

export const getUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    res.json(await UserManagement.getUsers(req.body));
  } catch (err) {
    console.error((err as Error).message);
    res.status(500).send("Server Error");
  }
};

export const getSpecificUserData = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await UserManagement.getSpecificUserData(req.body);
    if (user) {
      res.status(200).json(user);
    } else {
      res.status(404).send("User not found");
    }
  } catch (err) {
    console.error((err as Error).message);
    res.status(500).send("Server Error");
  }
};

export const deleteUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await UserManagement.deleteUser(req.body);
    res.status(200).json(result);
  } catch (err) {
    console.error((err as Error).message);
    res.status(500).send("Server Error");
  }
};

export const signIn = async (req: Request, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const data = CommonUtils.getDataResponse(eReturnCodes.R_NOT_FOUND);
      data.description = errors.array()[0].msg;
      res.status(400).json({ data });
      return;
    } else res.json(await UserManagement.signIn(req.body.data));
  } catch (err) {
    console.error((err as Error).message);
    res.status(500).send("Server Error");
  }
};

export const signUp = async (req: Request, res: Response): Promise<void> => {
  try {
    res.json(await UserManagement.signUp(req.body.data));
  } catch (err) {
    console.error((err as Error).message);
    res.status(500).send("Server Error");
  }
};
