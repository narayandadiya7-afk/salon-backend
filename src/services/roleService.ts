import prisma from "../database/prismaClient";
import logger from "../logger";
import CommonUtils from "../utils/common";
import { eReturnCodes } from "../enums/commonEnums";
import RequestModel from "../modules/common/models/requestModel";
import CommonRequestModel from "../modules/common/models/commonRequestModel";
import { RoleMasterModelDTO } from "../models/common/dto";

class RoleManagement {
  public async getRoleList(req: RequestModel): Promise<RoleMasterModelDTO> {
    const roleDTO: RoleMasterModelDTO = new RoleMasterModelDTO(
      CommonUtils.getDataResponse(eReturnCodes.R_SUCCESS)
    );

    const filterModel: CommonRequestModel = { ...req.data };
    const offset = (filterModel.currentPage - 1) * filterModel.pageSize;
    const limit = filterModel.pageSize;

    try {
      filterModel.totalRows = await prisma.role.count({ where: { deletedAt: null } });

      const where: any = { deletedAt: null };
      if (filterModel.searchText) {
        where.OR = [
          { name: { contains: filterModel.searchText, mode: 'insensitive' } },
          { description: { contains: filterModel.searchText, mode: 'insensitive' } },
        ];
      }

      const roles = await prisma.role.findMany({
        where,
        skip: offset,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: { permissions: { include: { permission: true } } },
      });

      filterModel.filterRowsCount = roles.length;
      roleDTO.data = roles;
      roleDTO.filterModel = filterModel;
      return roleDTO;
    } catch (error: any) {
      logger.info(error.message);
      roleDTO.data = [];
      roleDTO.dataResponse = CommonUtils.getDataResponse(eReturnCodes.R_DB_ERROR);
      return roleDTO;
    }
  }

  public async addEditRole(req: RequestModel): Promise<RoleMasterModelDTO> {
    const roleDTO: RoleMasterModelDTO = new RoleMasterModelDTO(
      CommonUtils.getDataResponse(eReturnCodes.R_SUCCESS)
    );

    const roleId = req.data.id;
    const rolePrivilegesArray: { id: string }[] = req.data.rolePrivileges || [];

    try {
      if (!roleId) {
        const newRole = await prisma.role.create({
          data: {
            name: req.data.name,
            description: req.data.description || "",
            displayName: req.data.name,
            isSystem: false,
            createdBy: String(req.auth_token.userId),
          },
        });

        if (rolePrivilegesArray.length > 0) {
          await prisma.rolePermission.createMany({
            data: rolePrivilegesArray.map((p: any) => ({
              roleId: newRole.id,
              permissionId: String(p.id),
            })),
          });
        }

        roleDTO.data = { newRole };
      } else {
        const existingRole = await prisma.role.findUnique({ where: { id: String(roleId) } });

        if (!existingRole) {
          roleDTO.data = [];
          roleDTO.dataResponse = CommonUtils.getDataResponse(eReturnCodes.R_NOT_FOUND);
          return roleDTO;
        }

        await prisma.role.update({
          where: { id: String(roleId) },
          data: {
            name: req.data.name,
            description: req.data.description || "",
            displayName: req.data.name,
            updatedBy: String(req.auth_token.userId),
          },
        });

        await prisma.rolePermission.deleteMany({ where: { roleId: String(roleId) } });

        if (rolePrivilegesArray.length > 0) {
          await prisma.rolePermission.createMany({
            data: rolePrivilegesArray.map((p: any) => ({
              roleId: String(roleId),
              permissionId: String(p.id),
            })),
          });
        }

        roleDTO.data = { updatedRole: existingRole };
      }

      roleDTO.dataResponse = CommonUtils.getDataResponse(eReturnCodes.R_SUCCESS);
      return roleDTO;
    } catch (error: any) {
      logger.info(error.message);
      roleDTO.data = [];
      roleDTO.dataResponse = CommonUtils.getDataResponse(eReturnCodes.R_DB_ERROR);
      return roleDTO;
    }
  }

  public async getSpecificRole(req: RequestModel): Promise<RoleMasterModelDTO> {
    const roleDTO: RoleMasterModelDTO = new RoleMasterModelDTO(
      CommonUtils.getDataResponse(eReturnCodes.R_NOT_FOUND)
    );

    try {
      const role = await prisma.role.findUnique({
        where: { id: String(req.data.id) },
        include: {
          permissions: {
            include: { permission: true },
            orderBy: { permission: { createdAt: "asc" } },
          },
        },
      });

      if (!role) {
        roleDTO.data = [];
        roleDTO.dataResponse = CommonUtils.getDataResponse(eReturnCodes.R_NOT_FOUND);
        return roleDTO;
      }

      roleDTO.data = role;
      roleDTO.dataResponse = CommonUtils.getDataResponse(eReturnCodes.R_SUCCESS);
      return roleDTO;
    } catch (error: any) {
      logger.info(error.message);
      roleDTO.dataResponse = CommonUtils.getDataResponse(eReturnCodes.R_DB_ERROR);
      return roleDTO;
    }
  }

  public async deleteRole(req: RequestModel): Promise<RoleMasterModelDTO> {
    const roleDTO: RoleMasterModelDTO = new RoleMasterModelDTO(
      CommonUtils.getDataResponse(eReturnCodes.R_SUCCESS)
    );

    try {
      const existingRole = await prisma.role.findUnique({ where: { id: String(req.data.id) } });

      if (!existingRole) {
        roleDTO.data = [];
        roleDTO.dataResponse = CommonUtils.getDataResponse(eReturnCodes.R_NOT_FOUND);
        return roleDTO;
      }

      await prisma.role.update({
        where: { id: String(req.data.id) },
        data: { deletedAt: new Date(), updatedBy: String(req.auth_token?.userId) },
      });

      roleDTO.data = "Role deleted successfully";
      return roleDTO;
    } catch (error: any) {
      logger.info(error.message);
      roleDTO.data = [];
      roleDTO.dataResponse = CommonUtils.getDataResponse(eReturnCodes.R_DB_ERROR);
      return roleDTO;
    }
  }
}

export default new RoleManagement();
