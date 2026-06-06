import { Model, DataTypes } from "sequelize";
import { sequelize } from "../../database/db";

class RolePrivilegesMapping extends Model {
  public id!: number;
  public roleId!: number;
  public privilegeId!: number;
  public createdOn!: Date;
  public createdBy!: number;
  public updatedOn!: Date | null;
  public updatedBy!: number;
  public isDeleted!: number;
  public deletedOn!: Date | null;
  public deletedBy!: number;
}

RolePrivilegesMapping.init(
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
    privilegeId: {
      type: DataTypes.BIGINT,
      allowNull: false,
      defaultValue: 0,
      field: "privilege_id",
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
    modelName: "RolePrivilegesMapping",
    tableName: "role_privileges_mapping",
    schema: "userManagement",
    timestamps: false,
  }
);

export default RolePrivilegesMapping;
