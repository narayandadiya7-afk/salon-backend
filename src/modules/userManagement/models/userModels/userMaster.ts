import { Model, DataTypes } from "sequelize";
import { sequelize } from "../../../../database/db";
import BaseResponse from "../../../common/models/baseResponse";
import CommonRequestModel from "../../../common/models/commonRequestModel";

export class UserMasterModelDTO extends BaseResponse {
  public filterModel: CommonRequestModel | undefined;
}

export class UserMaster extends Model {
  public id!: number;
  public roleId!: number;
  public fullName!: string;
  public emailId!: string;
  public mobileNumber!: string;
  public password!: string;
  public isActive!: number;
  public createdOn?: Date;
  public createdBy?: number;
  public updatedOn?: Date;
  public updatedBy?: number;
  public isDeleted!: number;
  public deletedOn?: Date;
  public deletedBy?: number;

  // Legacy fields (kept for backward compatibility)
  public userName?: string;
  public displayName?: string;
  public orgId?: number;
  public isMaster?: number;
}

UserMaster.init(
  {
    id: {
      type: DataTypes.BIGINT,
      autoIncrement: true,
      primaryKey: true,
    },
    roleId: {
      type: DataTypes.BIGINT,
      allowNull: false,
      defaultValue: 0,
      field: "role_id",
    },
    fullName: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: "full_name",
    },
    emailId: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: "email_id",
    },
    mobileNumber: {
      type: DataTypes.STRING(100),
      allowNull: false,
      field: "mobile_number",
    },
    password: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },
    isActive: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 1,
      field: "is_active",
    },
    createdOn: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: "created_on",
    },
    createdBy: {
      type: DataTypes.BIGINT,
      allowNull: false,
      defaultValue: 0,
      field: "created_by",
    },
    updatedOn: {
      type: DataTypes.DATE,
      allowNull: true,
      field: "updated_on",
    },
    updatedBy: {
      type: DataTypes.BIGINT,
      allowNull: false,
      defaultValue: 0,
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
      allowNull: false,
      defaultValue: 0,
      field: "deleted_by",
    },
  },
  {
    sequelize,
    modelName: "UserMaster",
    tableName: "user_master",
    schema: "userManagement",
    timestamps: false,
  }
);
