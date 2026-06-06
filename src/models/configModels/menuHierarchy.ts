import { Model, DataTypes } from "sequelize";
import { sequelize } from "../../database/db";
import BaseResponse from "../common/baseResponse";

export class MenuHierarchylDTO extends BaseResponse { }
export class MenuHierarchy extends Model {
  public id!: number;
  public name!: string;
  public dispName!: string;
  public parentId!: number;
  public entityUrl!: string;
  public description!: string;
  public isActive!: number;
  public orgId!: number;
  public displayOrder!: number;
  public iconName!: string;
  public createdon!: Date | null;
  public createdby!: number;
  public updatedon!: Date | null;
  public updatedby!: number;
  public isdeleted!: number;
  public deletedon!: Date | null;
  public deletedby!: number;
}

MenuHierarchy.init(
  {
    id: {
      type: DataTypes.BIGINT,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: "name"
    },
    dispName: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: "disp_name"
    },
    parentId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: "parent_id"
    },
    entityUrl: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: "entity_url"
    },
    description: {
      type: DataTypes.STRING(1000),
      allowNull: true,
    },
    isActive: {
      type: DataTypes.SMALLINT,
      allowNull: false,
      field: "is_active"
    },
    orgId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "org_id"
    },
    iconName: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: "icon_name"
    },
    displayOrder: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: "display_order"
    },
    createdon: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    createdby: {
      type: DataTypes.BIGINT,
      allowNull: true
    },
    updatedon: {
      type: DataTypes.DATE,
      allowNull: true
    },
    updatedby: {
      type: DataTypes.BIGINT,
      allowNull: true
    },
    isdeleted: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 0,
    },
    deletedon: {
      type: DataTypes.DATE,
      allowNull: true
    },
    deletedby: {
      type: DataTypes.BIGINT,
      allowNull: true
    },
  },
  {
    sequelize,
    modelName: "MenuHierarchy",
    tableName: "menuhierarchy",
    timestamps: false,
  }
);
