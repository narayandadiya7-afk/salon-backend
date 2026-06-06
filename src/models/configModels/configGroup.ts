import { Model, DataTypes } from "sequelize";
import { sequelize } from "../../database/db";
import BaseResponse from "../common/baseResponse";

export class ConfigGroupDTO extends BaseResponse { }


export class ConfigGroup extends Model {
    public id!: bigint;
    public name!: string;
    public description!: string;
    public groupUniqueId!: string;
    public createdon!: Date;
    public createdby!: number;
    public updatedon!: Date | null;
    public updatedby!: number;
    public isdeleted!: number;
    public deletedon!: Date | null;
    public deletedby!: number;
}

ConfigGroup.init(
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
        groupUniqueId: {
            type: DataTypes.STRING(20),
            allowNull: true,
            field: "group_unique_id"
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
        modelName: "ConfigGroup",
        tableName: "config_group",
        timestamps: false,
    }
);

export default ConfigGroup;
