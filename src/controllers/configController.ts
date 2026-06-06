import { Request, Response } from "express";
import ConfigManagement from "../services/configService";

export const getMenuHierarchy = async (req: Request, res: Response): Promise<void> => {
  try {
    res.json(await ConfigManagement.getMenuHierarchy());
  } catch (err) {
    console.error((err as Error).message);
    res.status(500);
  }
};

export const addMenuHierarchy = async (req: Request, res: Response): Promise<void> => {
  try {
    res.json(await ConfigManagement.addMenuHierarchy(req.body));
  } catch (err) {
    console.error((err as Error).message);
    res.status(500);
  }
};

export const getCountry = async (req: Request, res: Response): Promise<void> => {
  try {
    res.json(await ConfigManagement.getCountry(req.body));
  } catch (err) {
    console.error((err as Error).message);
    res.status(500);
  }
}

export const getState = async (req: Request, res: Response): Promise<void> => {
  try {
    res.json(await ConfigManagement.getState(req.body));
  } catch (err) {
    console.error((err as Error).message);
    res.status(500);
  }
}

export const getDistrict = async (req: Request, res: Response): Promise<void> => {
  try {
    res.json(await ConfigManagement.getDistrict(req.body));
  } catch (err) {
    console.error((err as Error).message);
    res.status(500);
  }
}

export const createConfigGroup = async (req: Request, res: Response): Promise<void> => {
  try {
    res.json(await ConfigManagement.createConfigGroup(req.body));
  } catch (err) {
    console.error((err as Error).message);
    res.status(500);
  }
}

export const createConfigParam = async (req: Request, res: Response): Promise<void> => {
  try {
    res.json(await ConfigManagement.createConfigParam(req.body));
  } catch (err) {
    console.error((err as Error).message);
    res.status(500);
  }
}