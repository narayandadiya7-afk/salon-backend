import { Model, DataTypes } from "sequelize";
import { sequelize } from "../../../../database/db";
import BaseResponse from "../../../common/models/baseResponse";
import CommonRequestModel from "../../../common/models/commonRequestModel";

export class RoleMasterModelDTO extends BaseResponse {
  public filterModel: CommonRequestModel | undefined;
}

export class RoleMaster extends Model {
  public id!: number;
  public name!: string;
  public roleUniqueId!: string;
  public description!: string;
  public createdOn?: Date;
  public createdBy?: number;
  public updatedOn?: Date;
  public updatedBy?: number;
  public isDeleted!: number;
  public deletedOn?: Date;
  public deletedBy?: number;
}

RoleMaster.init(
  {
    id: {
      type: DataTypes.BIGINT,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    roleUniqueId: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      field: "role_unique_id",
    },
    description: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    createdOn: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: "created_on",
    },
    createdBy: {
      type: DataTypes.BIGINT,
      allowNull: true,
      field: "created_by",
    },
    updatedOn: {
      type: DataTypes.DATE,
      allowNull: true,
      field: "updated_on",
    },
    updatedBy: {
      type: DataTypes.BIGINT,
      allowNull: true,
      field: "updated_by",
    },
    isDeleted: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 0,
      field: "is_deleted",
    },
    deletedOn: {
      type: DataTypes.DATE,
      allowNull: true,
      field: "deleted_on",
    },
    deletedBy: {
      type: DataTypes.BIGINT,
      allowNull: true,
      field: "deleted_by",
    },
  },
  {
    sequelize,
    modelName: "RoleMaster",
    tableName: "role_master",
    schema: "userManagement",
    timestamps: false,
  }
);
