import { Request, Response } from "express";
import RoleManagement from "../services/roleService";

export const getRoles = async (req: Request, res: Response): Promise<void> => {
  try {
    res.json(await RoleManagement.getRoleList(req.body));
  } catch (err) {
    console.error((err as Error).message);
    res.status(500);
  }
};

export const addEditRole = async (req: Request, res: Response): Promise<void> => {
  try {
    res.json(await RoleManagement.addEditRole(req.body));
  } catch (err) {
    console.error((err as Error).message);
    res.status(500);
  }
};

export const deleteRole = async (req: Request, res: Response): Promise<void> => {
  try {
    res.json(await RoleManagement.deleteRole(req.body));
  } catch (err) {
    console.error((err as Error).message);
    res.status(500);
  }
};

export const getSpecificRole = async (req: Request, res: Response): Promise<void> => {
  try {
    const role = await RoleManagement.getSpecificRole(req.body);
    if (role) {
      res.status(200).json(role);
    } else {
      res.status(404).send("User not found");
    }
  } catch (err) {
    console.error((err as Error).message);
    res.status(500).send("Server Error");
  }
};
