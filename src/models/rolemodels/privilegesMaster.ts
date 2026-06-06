import { Model, DataTypes } from "sequelize";
import { sequelize } from "../../database/db";

class PrivilegesMaster extends Model {
  public id!: bigint;
  public name!: string;
  public privilegeUniqueId!: string;
  public description!: string | null;
  public menuId!: number;
  public createdOn!: Date;
  public createdBy!: number;
  public updatedOn!: Date | null;
  public updatedBy!: number;
  public isDeleted!: number;
  public deletedOn!: Date | null;
  public deletedBy!: number;
}

PrivilegesMaster.init(
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
    privilegeUniqueId: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      field: "privilege_unique_id",
    },
    description: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    menuId: {
      type: DataTypes.BIGINT,
      allowNull: false,
      defaultValue: 0,
      field: "menu_id",
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
    modelName: "PrivilegesMaster",
    tableName: "privileges_master",
    schema: "userManagement",
    timestamps: false,
  }
);

export default PrivilegesMaster;
