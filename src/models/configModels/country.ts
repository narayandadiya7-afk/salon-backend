import { Model, DataTypes } from "sequelize";
import { sequelize } from "../../database/db";
import BaseResponse from "../common/baseResponse";

export class CountryDTO extends BaseResponse { }

export class Country extends Model {
  public id!: bigint;
  public countryCode!: number;
  public name!: string;
  public shortName!: string;
  public createdon!: Date;
  public createdby!: number;
  public updatedon!: Date | null;
  public updatedby!: number;
  public isdeleted!: number;
  public deletedon!: Date | null;
  public deletedby!: number;
}

Country.init(
  {
    id: {
      type: DataTypes.BIGINT,
      autoIncrement: true,
      primaryKey: true,
    },
    countryCode: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: "country_code"
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    shortName: {
      type: DataTypes.STRING(20),
      allowNull: true,
      field: "short_name"
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
    modelName: "Country",
    tableName: "country",
    timestamps: false,
  }
);

export default Country;
