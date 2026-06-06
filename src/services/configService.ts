import logger from "../logger";
const { Op } = require("sequelize");
import { QueryTypes } from "sequelize";
import CommonUtils from "../utils/common";
const db = require("../database/dbAccess");
import { sequelize } from "../database/db";
import { eReturnCodes } from "../enums/commonEnums";
import RequestModel from "../modules/common/models/requestModel";
import { TMenuHierarchy, TPrivilege } from "../types/common";
import State, { StateDTO } from "../models/configModels/state";
import { Country, CountryDTO } from "../models/configModels/country";
import District, { DistrictDTO } from "../models/configModels/district";
import ConfigGroup, { ConfigGroupDTO } from "../models/configModels/configGroup";
import ConfigParam, { ConfigParamDTO } from "../models/configModels/configParam";
import { MenuHierarchy, MenuHierarchylDTO, } from "../models/configModels/menuHierarchy";



class ConfigManagement {


  public async createConfigParam(req: RequestModel): Promise<ConfigParamDTO> {
    const configParamDTO: ConfigParamDTO = new ConfigParamDTO(
      CommonUtils.getDataResponse(eReturnCodes.R_SUCCESS)
    )

    try {
      const data = { ...req.data };
      await ConfigParam.create(data);
      return configParamDTO;

    } catch (error: any) {
      logger.info(error.message);
      configParamDTO.dataResponse = CommonUtils.getDataResponse(eReturnCodes.R_DB_ERROR)
      return configParamDTO;
    }
  }

  public async createConfigGroup(req: RequestModel): Promise<ConfigGroupDTO> {
    const configGroupDTO: ConfigGroupDTO = new ConfigGroupDTO(
      CommonUtils.getDataResponse(eReturnCodes.R_SUCCESS)
    )

    try {
      const data = { ...req.data };
      await ConfigGroup.create(data);
      return configGroupDTO;

    } catch (error: any) {
      logger.info(error.message);
      configGroupDTO.dataResponse = CommonUtils.getDataResponse(eReturnCodes.R_DB_ERROR)
      return configGroupDTO;
    }
  }

  public async getDistrict(req: RequestModel): Promise<DistrictDTO> {

    const districtDTO: DistrictDTO = new DistrictDTO(
      CommonUtils.getDataResponse(eReturnCodes.R_NOT_FOUND)
    )

    try {
      const filter = { ...req.data };

      const district: District[] = await District.findAll({ where: { stateid: filter.stateid } })

      districtDTO.data = district;
      districtDTO.dataResponse = CommonUtils.getDataResponse(eReturnCodes.R_SUCCESS)
      return districtDTO;

    } catch (error: any) {
      logger.info(error.message);
      return districtDTO;
    }

  }

  public async getState(req: RequestModel): Promise<StateDTO> {

    const stateDTO: StateDTO = new StateDTO(
      CommonUtils.getDataResponse(eReturnCodes.R_NOT_FOUND)
    )

    try {
      const filter = { ...req.data };

      const state: State[] = await State.findAll({ where: { countryid: filter.countryid } })

      stateDTO.data = state;
      stateDTO.dataResponse = CommonUtils.getDataResponse(eReturnCodes.R_SUCCESS)
      return stateDTO;

    } catch (error: any) {
      logger.info(error.message);
      return stateDTO;
    }

  }

  public async getCountry(req: RequestModel): Promise<CountryDTO> {

    const countryDTO: CountryDTO = new CountryDTO(
      CommonUtils.getDataResponse(eReturnCodes.R_NOT_FOUND)
    )

    try {
      const filter = { ...req.data };

      const country: Country[] = await Country.findAll({ where: { countrycode: filter.countrycode } })

      countryDTO.data = country;
      countryDTO.dataResponse = CommonUtils.getDataResponse(eReturnCodes.R_SUCCESS)
      return countryDTO;

    } catch (error: any) {
      logger.info(error.message);
      return countryDTO;
    }

  }

  public async getMenuHierarchy(): Promise<MenuHierarchylDTO> {
    const menuDTO: MenuHierarchylDTO = new MenuHierarchylDTO(
      CommonUtils.getDataResponse(eReturnCodes.R_NOT_FOUND)
    );
    try {

      const menus: MenuHierarchy[] = await MenuHierarchy.findAll({
        where: {
          isdeleted: 0,
        },
        order: ["id"],
      });

      let tempMenus: TMenuHierarchy[] = menus.map((menu: MenuHierarchy) => ({
        id: menu.id,
        name: menu.name,
        dispName: menu.dispName,
        parentId: menu.parentId,
        entityUrl: menu.entityUrl,
        description: menu.description,
        isActive: menu.isActive,
        orgId: menu.orgId,
        iconName: menu.iconName,
        displayOrder: menu.displayOrder,
        children: [],
        privileges: [],
      }));

      const results: TPrivilege[] = await sequelize.query(
        "SELECT id,name,privilege_unique_id,menuid FROM privileges",
        {
          type: QueryTypes.SELECT, // or QueryTypes.INSERT, QueryTypes.UPDATE, etc.
        }
      );
      for (const element of tempMenus) {
        element.privileges = results.filter((x: TPrivilege) => x.menuId == element.id);
      }

      // for (const element of tempMenus) {
      //   const privilege: TPrivilege[] = await db.query(
      //     "SELECT id,name,groupid,menuid FROM privileges where menuid=" +
      //       element.id
      //   );
      //   element.privileges = privilege;
      // }

      tempMenus.sort((a, b) => a.parentId - b.parentId);
      let menuFinalList: TMenuHierarchy[] = [];
      tempMenus.forEach((element: TMenuHierarchy) => {
        if (element.parentId == 0) menuFinalList.push(element);
        else {
          this.findAndAddChildren(menuFinalList, element);
        }
      });

      menuDTO.data = menuFinalList.sort((a, b) => a.parentId - b.parentId);

      //menuDTO.data = metadata;

      menuDTO.dataResponse = CommonUtils.getDataResponse(
        eReturnCodes.R_SUCCESS
      );
      return menuDTO;
    } catch (error) {
      logger.info(error);
      return menuDTO;
    }
  }

  public findAndAddChildren(
    menuFinalList: TMenuHierarchy[],
    element: TMenuHierarchy
  ) {
    menuFinalList.forEach((menu: TMenuHierarchy) => {
      if (menu.children.length > 0 && menu.id != element.parentId)
        this.findAndAddChildren(menu.children, element);
      else {
        if (menu.id == element.parentId) {
          menu.children?.push(element);
          menu.children.sort((a, b) => a.displayOrder - b.displayOrder);
        }
      }
    });
    return;
  }

  //Add/Edit roles
  public async addMenuHierarchy(req: RequestModel): Promise<MenuHierarchylDTO> {
    // Initialize DTO object
    const menuDTO: MenuHierarchylDTO = new MenuHierarchylDTO(
      CommonUtils.getDataResponse(eReturnCodes.R_DB_ERROR)
    );
    try {

      const payload: TMenuHierarchy[] = req.data;

      await addChildNode(payload);

      //menuDTO.data = menus;

      menuDTO.dataResponse = CommonUtils.getDataResponse(
        eReturnCodes.R_SUCCESS
      );
      return menuDTO;
    } catch (error: any) {
      logger.info(error.message);
      menuDTO.dataResponse = CommonUtils.getDataResponse(
        eReturnCodes.R_DB_ERROR
      );
      return menuDTO;
    }
  }
}

export default new ConfigManagement();
async function addChildNode(menuList: TMenuHierarchy[], parentid = 0) {
  for (const menu of menuList) {
    let element = {
      name: menu.name,
      dispname: menu.dispName,
      parentid: parentid,
      entityurl: menu.entityUrl,
      description: menu.description,
      isactive: menu.isActive,
      orgid: menu.orgId,
      iconname: menu.iconName,
      displayorder: menu.displayOrder,
      isdeleted: 0
    }
    const result = await MenuHierarchy.create(element);
    if (menu.children.length > 0)
      await addChildNode(menu.children, result.id);
  }

}

