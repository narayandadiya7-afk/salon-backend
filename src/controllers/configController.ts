import { Request, Response } from "express";
import ConfigManagement from "../services/configService";

export const getMenuHierarchy = async (req: Request, res: Response): Promise<void> => {
  try {
    res.json(await ConfigManagement.getMenuHierarchy(req.body));
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

export const getConfigGroupList = async (req: Request, res: Response): Promise<void> => {
  try {
    res.json(await ConfigManagement.getConfigGroupList(req.body));
  } catch (err) {
    console.error((err as Error).message);
    res.status(500);
  }
}

export const getSpecificConfigGroup = async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await ConfigManagement.getSpecificConfigGroup(req.body);
    if (result) res.status(200).json(result);
    else res.status(404).send("Config group not found");
  } catch (err) {
    console.error((err as Error).message);
    res.status(500);
  }
}

export const deleteConfigGroup = async (req: Request, res: Response): Promise<void> => {
  try {
    res.json(await ConfigManagement.deleteConfigGroup(req.body));
  } catch (err) {
    console.error((err as Error).message);
    res.status(500);
  }
}

export const addEditConfigGroup = async (req: Request, res: Response): Promise<void> => {
  try {
    res.json(await ConfigManagement.addEditConfigGroup(req.body));
  } catch (err) {
    console.error((err as Error).message);
    res.status(500);
  }
}

export const getConfigParamList = async (req: Request, res: Response): Promise<void> => {
  try {
    res.json(await ConfigManagement.getConfigParamList(req.body));
  } catch (err) {
    console.error((err as Error).message);
    res.status(500);
  }
}

export const getSpecificConfigParam = async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await ConfigManagement.getSpecificConfigParam(req.body);
    if (result) res.status(200).json(result);
    else res.status(404).send("Config param not found");
  } catch (err) {
    console.error((err as Error).message);
    res.status(500);
  }
}

export const addEditConfigParam = async (req: Request, res: Response): Promise<void> => {
  try {
    res.json(await ConfigManagement.addEditConfigParam(req.body));
  } catch (err) {
    console.error((err as Error).message);
    res.status(500);
  }
}

export const deleteConfigParam = async (req: Request, res: Response): Promise<void> => {
  try {
    res.json(await ConfigManagement.deleteConfigParam(req.body));
  } catch (err) {
    console.error((err as Error).message);
    res.status(500);
  }
}