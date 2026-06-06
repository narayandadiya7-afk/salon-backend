import { Model, DataTypes } from "sequelize";
import { sequelize } from "../../database/db";
import BaseResponse from "../common/baseResponse";

export class DistrictDTO extends BaseResponse { }


export class District extends Model {
  public id!: bigint;
  public stateId!: number;
  public countryId!: number;
  public name!: string;
  public createdon!: Date;
  public createdby!: number;
  public updatedon!: Date | null;
  public updatedby!: number;
  public isdeleted!: number;
  public deletedon!: Date | null;
  public deletedby!: number;
}

District.init(
  {
    id: {
      type: DataTypes.BIGINT,
      autoIncrement: true,
      primaryKey: true,
    },
    stateId: {
      type: DataTypes.BIGINT,
      allowNull: false,
      field: "state_id"
    },
    countryId: {
      type: DataTypes.BIGINT,
      allowNull: false,
      field: "country_id"
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: true,
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
    modelName: "District",
    tableName: "district",
    timestamps: false,
  }
);

export default District;
