import prisma from "../database/prismaClient";
import logger from "../logger";
const jwt = require("jsonwebtoken");
import CommonUtils from "../utils/common";
import { TEmailOptions } from "../types/common";
import { eReturnCodes } from "../enums/commonEnums";
import RequestModel from "../modules/common/models/requestModel";
import CommonRequestModel from "../modules/common/models/commonRequestModel";
import { UserMasterModelDTO } from "../models/common/dto";


class UserManagement {
  public async getUsers(req: RequestModel): Promise<UserMasterModelDTO> {
    const userDTO: UserMasterModelDTO = new UserMasterModelDTO(
      CommonUtils.getDataResponse(eReturnCodes.R_SUCCESS)
    );

    const filterModel: CommonRequestModel = { ...req.data };
    const offset = (filterModel.currentPage - 1) * filterModel.pageSize;
    const limit = filterModel.pageSize;

    try {
      filterModel.totalRows = await prisma.user.count({ where: { deletedAt: null } });

      const where: any = { deletedAt: null };
      if (filterModel.searchText) {
        where.OR = [
          { name: { contains: filterModel.searchText, mode: 'insensitive' } },
          { email: { contains: filterModel.searchText, mode: 'insensitive' } },
        ];
      }

      const users = await prisma.user.findMany({
        where,
        skip: offset,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: { roleRef: { select: { id: true, name: true, displayName: true } } },
      });

      filterModel.filterRowsCount = users.length;
      userDTO.data = users.map(({ password, roleRef, ...rest }) => ({
        id: rest.id,
        userName: rest.name,
        emailId: rest.email,
        mobileNumber: rest.phone || "",

        roleName: roleRef?.name || "USER",
        roleId: rest.roleId,
      }));
      userDTO.filterModel = filterModel;
      return userDTO;
    } catch (error: any) {
      logger.info(error.message);
      userDTO.data = [];
      userDTO.dataResponse = CommonUtils.getDataResponse(eReturnCodes.R_DB_ERROR);
      return userDTO;
    }
  }

  public async addEditUser(req: RequestModel): Promise<UserMasterModelDTO> {
    const userDTO: UserMasterModelDTO = new UserMasterModelDTO(
      CommonUtils.getDataResponse(eReturnCodes.R_SUCCESS)
    );

    const id = req.data.id;
    let adminId: string | undefined;

    try {
      if (req.auth_token.emailId) {
        const admin = await prisma.user.findFirst({ where: { email: req.auth_token.emailId } });
        if (admin) adminId = admin.id;
      }
    } catch {}

    try {
      if (!id) {
        const existingEmail = await prisma.user.findFirst({ where: { email: req.data.emailId, deletedAt: null } });
        if (existingEmail) {
          userDTO.data = [];
          userDTO.dataResponse = CommonUtils.getDataResponse(eReturnCodes.R_DUPLICATE_DATA);
          userDTO.dataResponse.description = "A user with this email already exists";
          return userDTO;
        }
        if (req.data.mobileNumber) {
          const existingMobile = await prisma.user.findFirst({ where: { phone: req.data.mobileNumber, deletedAt: null } });
          if (existingMobile) {
            userDTO.data = [];
            userDTO.dataResponse = CommonUtils.getDataResponse(eReturnCodes.R_DUPLICATE_DATA);
            userDTO.dataResponse.description = "A user with this mobile number already exists";
            return userDTO;
          }
        }

        const roleRec = req.data.roleId
          ? await prisma.role.findUnique({ where: { id: String(req.data.roleId) } })
          : null;

        await prisma.user.create({
          data: {
            email: req.data.emailId,
            name: req.data.fullName,
            phone: req.data.mobileNumber || "",
            password: req.data.password,
            roleId: roleRec?.id || null,
            createdBy: adminId,
          },
        });

        userDTO.data = "User created successfully";
      } else {
        const existingUser = await prisma.user.findUnique({ where: { id: String(id) } });

        if (!existingUser) {
          userDTO.data = [];
          userDTO.dataResponse = CommonUtils.getDataResponse(eReturnCodes.R_NOT_FOUND);
          return userDTO;
        }

        const dupEmail = await prisma.user.findFirst({
          where: { email: req.data.emailId, id: { not: String(id) }, deletedAt: null },
        });
        if (dupEmail) {
          userDTO.data = [];
          userDTO.dataResponse = CommonUtils.getDataResponse(eReturnCodes.R_DUPLICATE_DATA);
          userDTO.dataResponse.description = "A user with this email already exists";
          return userDTO;
        }
        if (req.data.mobileNumber) {
          const dupMobile = await prisma.user.findFirst({
            where: { phone: req.data.mobileNumber, id: { not: String(id) }, deletedAt: null },
          });
          if (dupMobile) {
            userDTO.data = [];
            userDTO.dataResponse = CommonUtils.getDataResponse(eReturnCodes.R_DUPLICATE_DATA);
            userDTO.dataResponse.description = "A user with this mobile number already exists";
            return userDTO;
          }
        }

        const roleRec = req.data.roleId
          ? await prisma.role.findUnique({ where: { id: String(req.data.roleId) } })
          : null;

        const updateData: any = {
          name: req.data.fullName,
          email: req.data.emailId,
          phone: req.data.mobileNumber || "",
          roleId: roleRec?.id || null,
          updatedBy: adminId,
          ...(req.data.password ? { password: req.data.password } : {}),
        };

        await prisma.user.update({ where: { id: String(id) }, data: updateData });

        userDTO.data = "User updated successfully";
      }
      return userDTO;
    } catch (error: any) {
      logger.info(error.message);
      userDTO.data = [];
      userDTO.dataResponse = CommonUtils.getDataResponse(eReturnCodes.R_DB_ERROR);
      return userDTO;
    }
  }

  public async getSpecificUserData(req: RequestModel): Promise<UserMasterModelDTO> {
    const userDTO: UserMasterModelDTO = new UserMasterModelDTO(
      CommonUtils.getDataResponse(eReturnCodes.R_SUCCESS)
    );

    const id = req.data.id ? String(req.data.id) : String(req.auth_token.userId);

    try {
      const user = await prisma.user.findUnique({
        where: { id },
        include: { roleRef: { select: { id: true, name: true, displayName: true } } },
      });

      if (!user) {
        userDTO.data = [];
        userDTO.dataResponse = CommonUtils.getDataResponse(eReturnCodes.R_NOT_FOUND);
        return userDTO;
      }

      const { password, roleRef, ...userData } = user as any;
      userDTO.data = { ...userData, roleName: roleRef?.name || "USER", roleId: user.roleId };
      userDTO.dataResponse = CommonUtils.getDataResponse(eReturnCodes.R_SUCCESS);

      return userDTO;
    } catch (error: any) {
      logger.info(error.message);
      userDTO.data = [];
      userDTO.dataResponse = CommonUtils.getDataResponse(eReturnCodes.R_DB_ERROR);
      return userDTO;
    }
  }

  public async getUserRoles(id: number): Promise<UserMasterModelDTO> {
    const userDTO: UserMasterModelDTO = new UserMasterModelDTO(
      CommonUtils.getDataResponse(eReturnCodes.R_SUCCESS)
    );

    try {
      const user = await prisma.user.findUnique({
        where: { id: String(id) },
        include: {
          roleRef: { select: { id: true, name: true, displayName: true } },
        },
      });

      if (!user) {
        userDTO.data = [];
        userDTO.dataResponse = CommonUtils.getDataResponse(eReturnCodes.R_NOT_FOUND);
        return userDTO;
      }

      userDTO.data = user;
      return userDTO;
    } catch (error: any) {
      logger.info(error.message);
      userDTO.data = [];
      userDTO.dataResponse = CommonUtils.getDataResponse(eReturnCodes.R_DB_ERROR);
      return userDTO;
    }
  }

  public async editUserDetails(req: RequestModel): Promise<UserMasterModelDTO> {
    const userDTO: UserMasterModelDTO = new UserMasterModelDTO(
      CommonUtils.getDataResponse(eReturnCodes.R_SUCCESS)
    );

    try {
      const existingUser = await prisma.user.findUnique({ where: { id: String(req.data.id) } });

      if (!existingUser) {
        userDTO.data = [];
        userDTO.dataResponse = CommonUtils.getDataResponse(eReturnCodes.R_NOT_FOUND);
        return userDTO;
      }

      const updated = await prisma.user.update({
        where: { id: String(req.data.id) },
        data: {
          name: req.data.fullName,
          email: req.data.emailId,
          phone: req.data.mobileNumber || "",
          updatedBy: String(req.auth_token.userId),
        },
      });

      userDTO.data = updated;
      return userDTO;
    } catch (error: any) {
      logger.info(error.message);
      userDTO.data = [];
      userDTO.dataResponse = CommonUtils.getDataResponse(eReturnCodes.R_DB_ERROR);
      return userDTO;
    }
  }

  public async deleteUser(req: RequestModel): Promise<UserMasterModelDTO> {
    const userDTO: UserMasterModelDTO = new UserMasterModelDTO(
      CommonUtils.getDataResponse(eReturnCodes.R_SUCCESS)
    );

    try {
      const existingUser = await prisma.user.findUnique({ where: { id: String(req.data.id) } });

      if (!existingUser) {
        userDTO.data = [];
        userDTO.dataResponse = CommonUtils.getDataResponse(eReturnCodes.R_NOT_FOUND);
        return userDTO;
      }

      await prisma.user.update({
        where: { id: String(req.data.id) },
        data: { deletedAt: new Date(), updatedBy: String(req.auth_token.userId) },
      });

      userDTO.data = "User Is Deleted Successfully";
      return userDTO;
    } catch (error: any) {
      logger.info(error.message);
      userDTO.data = [];
      userDTO.dataResponse = CommonUtils.getDataResponse(eReturnCodes.R_DB_ERROR);
      return userDTO;
    }
  }

  public async signIn(req: RequestModel): Promise<UserMasterModelDTO> {
    const userDTO: UserMasterModelDTO = new UserMasterModelDTO(
      CommonUtils.getDataResponse(eReturnCodes.R_SUCCESS)
    );

    try {
      const user = await prisma.user.findFirst({
        where: { email: req.data.emailId, password: req.data.password, deletedAt: null },
        include: { roleRef: { select: { name: true } } },
      });

      if (!user) {
        userDTO.data = [];
        userDTO.dataResponse = CommonUtils.getDataResponse(eReturnCodes.R_NOT_FOUND);
        return userDTO;
      }

      const verifiedUser = {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.roleRef?.name || "USER",
        roleId: user.roleId,
      };

      const token = jwt.sign(verifiedUser, process.env.JWT_SECRET_KEY, { expiresIn: "5h" });

      userDTO.data = token;
      return userDTO;
    } catch (error: any) {
      logger.info(error.message);
      userDTO.data = [];
      userDTO.dataResponse = CommonUtils.getDataResponse(eReturnCodes.R_DB_ERROR);
      return userDTO;
    }
  }

  public async signUp(req: RequestModel): Promise<UserMasterModelDTO> {
    const userDTO: UserMasterModelDTO = new UserMasterModelDTO(
      CommonUtils.getDataResponse(eReturnCodes.R_SUCCESS)
    );

    try {
      const newUser = await prisma.user.create({
        data: {
          name: req.data.fullName,
          email: req.data.emailId,
          phone: req.data.mobileNo || "",
          password: req.data.password,
        },
      });

      const emailPurpose: TEmailOptions = {
        receiverEmail: req.data.emailId,
        password: req.data.password,
        emailPurpose: "SignIn",
      };

      CommonUtils.initializeEmail(emailPurpose);

      userDTO.data = newUser;
      return userDTO;
    } catch (error: any) {
      logger.info(error.message);
      userDTO.data = [];
      userDTO.dataResponse = CommonUtils.getDataResponse(eReturnCodes.R_DB_ERROR);
      return userDTO;
    }
  }
}

export default new UserManagement();
