import prisma from "../database/prismaClient";
import logger from "../logger";
import CommonUtils from "../utils/common";
import { eReturnCodes } from "../enums/commonEnums";
import RequestModel from "../modules/common/models/requestModel";
import CommonRequestModel from "../modules/common/models/commonRequestModel";
import { TMenuHierarchy } from "../types/common";
import { MenuHierarchylDTO, ConfigGroupDTO, ConfigParamDTO, CountryDTO, StateDTO, DistrictDTO } from "../models/common/dto";

class ConfigManagement {
  public async getConfigGroupList(req: RequestModel): Promise<ConfigGroupDTO> {
    const dto: ConfigGroupDTO = new ConfigGroupDTO(
      CommonUtils.getDataResponse(eReturnCodes.R_SUCCESS)
    );
    const filterModel: CommonRequestModel = { ...req.data };
    const offset = (filterModel.currentPage - 1) * filterModel.pageSize;
    const limit = filterModel.pageSize;

    try {
      filterModel.totalRows = await prisma.configGroup.count();

      const where: any = {};
      if (filterModel.searchText) {
        where.OR = [
          { groupName: { contains: filterModel.searchText, mode: 'insensitive' } },
          { description: { contains: filterModel.searchText, mode: 'insensitive' } },
        ];
      }

      const groups = await prisma.configGroup.findMany({
        where,
        skip: offset,
        take: limit,
        orderBy: { id: "desc" },
      });

      filterModel.filterRowsCount = groups.length;
      dto.data = groups;
      dto.filterModel = filterModel;
      return dto;
    } catch (error: any) {
      logger.info(error.message);
      dto.data = [];
      dto.dataResponse = CommonUtils.getDataResponse(eReturnCodes.R_DB_ERROR);
      return dto;
    }
  }

  public async getSpecificConfigGroup(req: RequestModel): Promise<ConfigGroupDTO> {
    const dto: ConfigGroupDTO = new ConfigGroupDTO(
      CommonUtils.getDataResponse(eReturnCodes.R_SUCCESS)
    );

    try {
      const record = await prisma.configGroup.findUnique({ where: { id: Number(req.data.id) } });
      if (!record) {
        dto.data = [];
        dto.dataResponse = CommonUtils.getDataResponse(eReturnCodes.R_NOT_FOUND);
        return dto;
      }
      dto.data = record;
      return dto;
    } catch (error: any) {
      logger.info(error.message);
      dto.data = [];
      dto.dataResponse = CommonUtils.getDataResponse(eReturnCodes.R_DB_ERROR);
      return dto;
    }
  }

  public async deleteConfigGroup(req: RequestModel): Promise<ConfigGroupDTO> {
    const dto: ConfigGroupDTO = new ConfigGroupDTO(
      CommonUtils.getDataResponse(eReturnCodes.R_SUCCESS)
    );

    try {
      const record = await prisma.configGroup.findUnique({ where: { id: Number(req.data.id) } });
      if (!record) {
        dto.data = [];
        dto.dataResponse = CommonUtils.getDataResponse(eReturnCodes.R_NOT_FOUND);
        return dto;
      }

      await prisma.configGroup.delete({ where: { id: Number(req.data.id) } });
      dto.data = "Config group deleted successfully";
      return dto;
    } catch (error: any) {
      logger.info(error.message);
      dto.data = [];
      dto.dataResponse = CommonUtils.getDataResponse(eReturnCodes.R_DB_ERROR);
      return dto;
    }
  }

  public async addEditConfigGroup(req: RequestModel): Promise<ConfigGroupDTO> {
    const dto: ConfigGroupDTO = new ConfigGroupDTO(
      CommonUtils.getDataResponse(eReturnCodes.R_SUCCESS)
    );

    try {
      if (!req.data.id) {
        await prisma.configGroup.create({
          data: {
            groupName: req.data.name,
            description: req.data.description || "",
          },
        });
      } else {
        const record = await prisma.configGroup.findUnique({ where: { id: Number(req.data.id) } });
        if (!record) {
          dto.data = [];
          dto.dataResponse = CommonUtils.getDataResponse(eReturnCodes.R_NOT_FOUND);
          return dto;
        }

        await prisma.configGroup.update({
          where: { id: Number(req.data.id) },
          data: {
            groupName: req.data.name,
            description: req.data.description || "",
          },
        });
      }

      dto.dataResponse = CommonUtils.getDataResponse(eReturnCodes.R_SUCCESS);
      return dto;
    } catch (error: any) {
      logger.info(error.message);
      dto.data = [];
      dto.dataResponse = CommonUtils.getDataResponse(eReturnCodes.R_DB_ERROR);
      return dto;
    }
  }

  public async getConfigParamList(req: RequestModel): Promise<ConfigParamDTO> {
    const dto: ConfigParamDTO = new ConfigParamDTO(
      CommonUtils.getDataResponse(eReturnCodes.R_SUCCESS)
    );
    const filterModel: CommonRequestModel = { ...req.data };
    const offset = (filterModel.currentPage - 1) * filterModel.pageSize;
    const limit = filterModel.pageSize;

    try {
      filterModel.totalRows = await prisma.configParam.count();

      const where: any = {};
      if (filterModel.searchText) {
        where.OR = [
          { paramName: { contains: filterModel.searchText, mode: 'insensitive' } },
          { description: { contains: filterModel.searchText, mode: 'insensitive' } },
        ];
      }

      const params = await prisma.configParam.findMany({
        where,
        skip: offset,
        take: limit,
        orderBy: { id: "desc" },
      });

      filterModel.filterRowsCount = params.length;
      dto.data = { rows: params };
      dto.filterModel = filterModel;
      return dto;
    } catch (error: any) {
      logger.info(error.message);
      dto.data = [];
      dto.dataResponse = CommonUtils.getDataResponse(eReturnCodes.R_DB_ERROR);
      return dto;
    }
  }

  public async getSpecificConfigParam(req: RequestModel): Promise<ConfigParamDTO> {
    const dto: ConfigParamDTO = new ConfigParamDTO(
      CommonUtils.getDataResponse(eReturnCodes.R_SUCCESS)
    );

    try {
      const record = await prisma.configParam.findUnique({ where: { id: Number(req.data.id) } });
      if (!record) {
        dto.data = [];
        dto.dataResponse = CommonUtils.getDataResponse(eReturnCodes.R_NOT_FOUND);
        return dto;
      }
      dto.data = record;
      return dto;
    } catch (error: any) {
      logger.info(error.message);
      dto.data = [];
      dto.dataResponse = CommonUtils.getDataResponse(eReturnCodes.R_DB_ERROR);
      return dto;
    }
  }

  public async addEditConfigParam(req: RequestModel): Promise<ConfigParamDTO> {
    const dto: ConfigParamDTO = new ConfigParamDTO(
      CommonUtils.getDataResponse(eReturnCodes.R_SUCCESS)
    );

    try {
      if (!req.data.id) {
        await prisma.configParam.create({
          data: {
            groupName: req.data.groupName || "",
            paramName: req.data.name,
            paramValue: req.data.paramValue || "",
            description: req.data.description || "",
          },
        });
      } else {
        const record = await prisma.configParam.findUnique({ where: { id: Number(req.data.id) } });
        if (!record) {
          dto.data = [];
          dto.dataResponse = CommonUtils.getDataResponse(eReturnCodes.R_NOT_FOUND);
          return dto;
        }

        await prisma.configParam.update({
          where: { id: Number(req.data.id) },
          data: {
            paramName: req.data.name,
            paramValue: req.data.paramValue || record.paramValue,
            description: req.data.description || record.description,
          },
        });
      }

      dto.dataResponse = CommonUtils.getDataResponse(eReturnCodes.R_SUCCESS);
      return dto;
    } catch (error: any) {
      logger.info(error.message);
      dto.data = [];
      dto.dataResponse = CommonUtils.getDataResponse(eReturnCodes.R_DB_ERROR);
      return dto;
    }
  }

  public async deleteConfigParam(req: RequestModel): Promise<ConfigParamDTO> {
    const dto: ConfigParamDTO = new ConfigParamDTO(
      CommonUtils.getDataResponse(eReturnCodes.R_SUCCESS)
    );

    try {
      const record = await prisma.configParam.findUnique({ where: { id: Number(req.data.id) } });
      if (!record) {
        dto.data = [];
        dto.dataResponse = CommonUtils.getDataResponse(eReturnCodes.R_NOT_FOUND);
        return dto;
      }

      await prisma.configParam.delete({ where: { id: Number(req.data.id) } });
      dto.data = "Config parameter deleted successfully";
      return dto;
    } catch (error: any) {
      logger.info(error.message);
      dto.data = [];
      dto.dataResponse = CommonUtils.getDataResponse(eReturnCodes.R_DB_ERROR);
      return dto;
    }
  }

  public async createConfigParam(req: RequestModel): Promise<ConfigParamDTO> {
    const dto: ConfigParamDTO = new ConfigParamDTO(
      CommonUtils.getDataResponse(eReturnCodes.R_SUCCESS)
    );

    try {
      const data = { ...req.data };
      await prisma.configParam.create({ data: { groupName: "", paramName: data.name || "", paramValue: data.paramValue || "", description: data.description || "" } });
      return dto;
    } catch (error: any) {
      logger.info(error.message);
      dto.dataResponse = CommonUtils.getDataResponse(eReturnCodes.R_DB_ERROR);
      return dto;
    }
  }

  public async createConfigGroup(req: RequestModel): Promise<ConfigGroupDTO> {
    const dto: ConfigGroupDTO = new ConfigGroupDTO(
      CommonUtils.getDataResponse(eReturnCodes.R_SUCCESS)
    );

    try {
      const data = { ...req.data };
      await prisma.configGroup.create({ data: { groupName: data.name || "", description: data.description || "" } });
      return dto;
    } catch (error: any) {
      logger.info(error.message);
      dto.dataResponse = CommonUtils.getDataResponse(eReturnCodes.R_DB_ERROR);
      return dto;
    }
  }

  public async getDistrict(req: RequestModel): Promise<DistrictDTO> {
    const dto: DistrictDTO = new DistrictDTO(
      CommonUtils.getDataResponse(eReturnCodes.R_NOT_FOUND)
    );

    try {
      const filter = { ...req.data };
      const districts = await prisma.district.findMany({ where: { stateId: Number(filter.stateid) } });
      dto.data = districts;
      dto.dataResponse = CommonUtils.getDataResponse(eReturnCodes.R_SUCCESS);
      return dto;
    } catch (error: any) {
      logger.info(error.message);
      return dto;
    }
  }

  public async getState(req: RequestModel): Promise<StateDTO> {
    const dto: StateDTO = new StateDTO(
      CommonUtils.getDataResponse(eReturnCodes.R_NOT_FOUND)
    );

    try {
      const filter = { ...req.data };
      const states = await prisma.state.findMany({ where: { countryId: Number(filter.countryid) } });
      dto.data = states;
      dto.dataResponse = CommonUtils.getDataResponse(eReturnCodes.R_SUCCESS);
      return dto;
    } catch (error: any) {
      logger.info(error.message);
      return dto;
    }
  }

  public async getCountry(req: RequestModel): Promise<CountryDTO> {
    const dto: CountryDTO = new CountryDTO(
      CommonUtils.getDataResponse(eReturnCodes.R_NOT_FOUND)
    );

    try {
      const filter = { ...req.data };
      const countries = await prisma.country.findMany({ where: { countryCode: filter.countrycode } });
      dto.data = countries;
      dto.dataResponse = CommonUtils.getDataResponse(eReturnCodes.R_SUCCESS);
      return dto;
    } catch (error: any) {
      logger.info(error.message);
      return dto;
    }
  }

  public async getMenuHierarchy(req: RequestModel): Promise<MenuHierarchylDTO> {
    const menuDTO: MenuHierarchylDTO = new MenuHierarchylDTO(
      CommonUtils.getDataResponse(eReturnCodes.R_SUCCESS)
    );

    try {
      const roleId = req?.auth_token?.roleId;
      const { renderMenuRoleWise } = req.data || {};

      const allMenus = await prisma.menuItem.findMany({
        where: { isActive: true },
        orderBy: { displayOrder: "asc" },
      });

      const allPermissions = await prisma.permission.findMany({
        where: { isActive: true, module: "admin" },
      });

      let rolePermissionIds: string[] = [];
      if (roleId) {
        const mappings = await prisma.rolePermission.findMany({
          where: { roleId: String(roleId) },
          select: { permissionId: true },
        });
        rolePermissionIds = mappings.map((m) => m.permissionId);
      }

      const getEntityFromKey = (key: string): string | null => {
        const match = key.match(/^admin\.\w+_(.+)$/);
        return match ? match[1] : null;
      };

      const getPrivilegesForMenu = (menu: typeof allMenus[0]) =>
        menu.permissionKey
          ? (() => {
              const entity = getEntityFromKey(menu.permissionKey!);
              if (!entity) return [];
              return allPermissions
                .filter((p) => {
                  const pEntity = getEntityFromKey(p.key);
                  return pEntity === entity;
                })
                .map((p) => ({
                  id: p.id,
                  name: p.name,
                  menuId: menu.id,
                  groupId: "",
                  privilegeUniqueId: p.key,
                  isAssigned: rolePermissionIds.includes(p.id),
                }));
            })()
          : [];

      let tempMenus: TMenuHierarchy[] = [];

      if (renderMenuRoleWise) {
        const targetMenuIds = new Set(
          allPermissions
            .filter((p) => rolePermissionIds.includes(p.id))
            .flatMap((p) => {
              const entity = getEntityFromKey(p.key);
              if (!entity) return [];
              return allMenus
                .filter((m) => {
                  const mEntity = m.permissionKey ? getEntityFromKey(m.permissionKey) : null;
                  return mEntity === entity;
                })
                .map((m) => m.id);
            })
        );

        const visibleMenuIds = new Set<number>();
        const menuMap = new Map(allMenus.map((m) => [m.id, m]));

        const addMenuAndParents = (menuId: number) => {
          if (visibleMenuIds.has(menuId)) return;
          visibleMenuIds.add(menuId);
          const menu = menuMap.get(menuId);
          if (menu && menu.parentId) {
            addMenuAndParents(menu.parentId);
          }
        };

        targetMenuIds.forEach((id) => addMenuAndParents(id));

        tempMenus = allMenus
          .filter((menu) => visibleMenuIds.has(menu.id))
          .map((menu) => ({
            id: menu.id,
            name: menu.name,
            dispName: menu.displayName,
            parentId: menu.parentId || 0,
            menuUniqueId: `menu-${menu.id}`,
            entityUrl: menu.url || "",
            description: "",
            isActive: menu.isActive ? 1 : 0,
            orgId: 1,
            iconName: menu.icon || "",
            displayOrder: menu.displayOrder,
            children: [],
            privileges: getPrivilegesForMenu(menu),
          }));
      } else {
        tempMenus = allMenus.map((menu) => ({
          id: menu.id,
          name: menu.name,
          dispName: menu.displayName,
          parentId: menu.parentId || 0,
          menuUniqueId: `menu-${menu.id}`,
          entityUrl: menu.url || "",
          description: "",
          isActive: menu.isActive ? 1 : 0,
          orgId: 1,
          iconName: menu.icon || "",
          displayOrder: menu.displayOrder,
          children: [],
          privileges: getPrivilegesForMenu(menu),
        }));
      }

      tempMenus.sort((a, b) => a.parentId - b.parentId);
      let menuFinalList: TMenuHierarchy[] = [];
      tempMenus.forEach((element: TMenuHierarchy) => {
        if (element.parentId === 0) menuFinalList.push(element);
        else {
          this.findAndAddChildren(menuFinalList, element);
        }
      });

      menuDTO.data = menuFinalList.sort((a, b) => a.displayOrder - b.displayOrder);
      return menuDTO;
    } catch (error: any) {
      logger.info(error);
      menuDTO.data = [];
      menuDTO.dataResponse = CommonUtils.getDataResponse(eReturnCodes.R_DB_ERROR);
      menuDTO.dataResponse.description = error.message;
      return menuDTO;
    }
  }

  public findAndAddChildren(
    menuFinalList: TMenuHierarchy[],
    element: TMenuHierarchy
  ) {
    menuFinalList.forEach((menu: TMenuHierarchy) => {
      if (menu.children.length > 0 && menu.id !== element.parentId)
        this.findAndAddChildren(menu.children, element);
      else {
        if (menu.id === element.parentId) {
          menu.children?.push(element);
          menu.children.sort((a, b) => a.displayOrder - b.displayOrder);
        }
      }
    });
    return;
  }

  public async addMenuHierarchy(req: RequestModel): Promise<MenuHierarchylDTO> {
    const menuDTO: MenuHierarchylDTO = new MenuHierarchylDTO(
      CommonUtils.getDataResponse(eReturnCodes.R_DB_ERROR)
    );

    try {
      const payload: TMenuHierarchy[] = req.data;
      await addChildNode(payload);
      menuDTO.dataResponse = CommonUtils.getDataResponse(eReturnCodes.R_SUCCESS);
      return menuDTO;
    } catch (error: any) {
      logger.info(error.message);
      menuDTO.dataResponse = CommonUtils.getDataResponse(eReturnCodes.R_DB_ERROR);
      return menuDTO;
    }
  }
}

export default new ConfigManagement();

async function addChildNode(menuList: TMenuHierarchy[], parentId: number | null = null) {
  for (const menu of menuList) {
    const result = await prisma.menuItem.create({
      data: {
        name: menu.name,
        displayName: menu.dispName,
        parentId: parentId,
        url: menu.entityUrl || null,
        icon: menu.iconName || null,
        displayOrder: menu.displayOrder,
        isActive: !!menu.isActive,
      },
    });
    if (menu.children.length > 0) {
      await addChildNode(menu.children, result.id);
    }
  }
}
