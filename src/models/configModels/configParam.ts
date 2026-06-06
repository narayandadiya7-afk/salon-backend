import { Model, DataTypes } from "sequelize";
import { sequelize } from "../../database/db";
import BaseResponse from "../common/baseResponse";

export class ConfigParamDTO extends BaseResponse { }

export class ConfigParam extends Model {
  public id!: bigint;
  public name!: string;
  public description!: string;
  public groupId!: bigint;
  public paramUniqueId!: string;
  public controlId!: number;
  public refGroupId!: number;
  public createdon!: Date;
  public createdby!: number;
  public updatedon!: Date | null;
  public updatedby!: number;
  public isdeleted!: number;
  public deletedon!: Date | null;
  public deletedby!: number;
}

ConfigParam.init(
  {
    id: {
      type: DataTypes.BIGINT,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    description: {
      type: DataTypes.STRING(1000),
      allowNull: true,
    },
    groupId: {
      type: DataTypes.BIGINT,
      field: "group_id"
    },
    paramUniqueId: {
      type: DataTypes.STRING(20),
      allowNull: true,
      field: "param_unique_id"
    },
    controlId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
      field: "control_id"
    },
    refGroupId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      field: "ref_group_id"
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
    modelName: "ConfigParam",
    tableName: "config_param",
    timestamps: false,
  }
);

export default ConfigParam;
