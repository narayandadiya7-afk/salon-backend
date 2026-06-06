import { Model, DataTypes } from "sequelize";
import { sequelize } from "../../../../database/db";
import BaseResponse from "../../../common/models/baseResponse";

export class UserDetailsDTO extends BaseResponse {}

export class UserDetails extends Model {
  public id!: number;
  public userId!: number;
  public fullName!: string;
  public emailId!: string;
  public mobileNumber!: string;
  public countryId?: number;
  public stateId?: number;
  public districtId?: number;
  public gender?: number;
  public dateOfBirth?: Date;
  public zipCode?: string;
  public address?: string;
  public createdOn?: Date;
  public createdBy?: number;
  public updatedOn?: Date;
  public updatedBy?: number;
  public isDeleted!: number;
  public deletedOn?: Date;
  public deletedBy?: number;
}

UserDetails.init(
  {
    id: {
      type: DataTypes.BIGINT,
      autoIncrement: true,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.BIGINT,
      allowNull: false,
      defaultValue: 0,
      field: "user_id",
    },
    fullName: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: "full_name",
    },
    emailId: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: "email_id",
    },
    mobileNumber: {
      type: DataTypes.STRING(30),
      allowNull: true,
      field: "mobile_number",
    },
    countryId: {
      type: DataTypes.BIGINT,
      allowNull: true,
      field: "country_id",
    },
    stateId: {
      type: DataTypes.BIGINT,
      allowNull: true,
      field: "state_id",
    },
    districtId: {
      type: DataTypes.BIGINT,
      allowNull: true,
      field: "district_id",
    },
    gender: {
      type: DataTypes.TINYINT,
      allowNull: true,
    },
    dateOfBirth: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      field: "date_of_birth",
    },
    zipCode: {
      type: DataTypes.STRING(20),
      allowNull: true,
      field: "zip_code",
    },
    address: {
      type: DataTypes.STRING(500),
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
    modelName: "UserDetails",
    tableName: "user_details",
    schema: "userManagement",
    timestamps: false,
  }
);

export default UserDetails;
