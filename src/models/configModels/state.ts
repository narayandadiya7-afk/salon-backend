import { Model, DataTypes } from "sequelize";
import { sequelize } from "../../database/db";
import BaseResponse from "../common/baseResponse";

export class StateDTO extends BaseResponse { }


export class State extends Model {
  public id!: bigint;
  public countryId!: number;
  public stateCode!: string;
  public name!: string;
  public createdon!: Date;
  public createdby!: number;
  public updatedon!: Date | null;
  public updatedby!: number;
  public isdeleted!: number;
  public deletedon!: Date | null;
  public deletedby!: number;
}

State.init(
  {
    id: {
      type: DataTypes.BIGINT,
      autoIncrement: true,
      primaryKey: true,
    },
    countryId: {
      type: DataTypes.BIGINT,
      allowNull: false,
      field: "country_id"
    },
    stateCode: {
      type: DataTypes.STRING(20),
      allowNull: true,
      field: "state_code"
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
    modelName: "State",
    tableName: "state",
    timestamps: false,
  }
);

export default State;
