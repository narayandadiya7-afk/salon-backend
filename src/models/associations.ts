import { MenuHierarchy } from "./configModels/menuHierarchy";
import { RoleMaster } from "../modules/userManagement/models/roleModels/roleMaster";
import { UserDetails } from "../modules/userManagement/models/userModels/userDetails";
import { UserMaster } from "../modules/userManagement/models/userModels/userMaster";

const setupAssociations = () => {
  // UserMaster to UserDetails [ one to one relation ]
  UserMaster.hasOne(UserDetails, { foreignKey: "userId", as: "userdetails" });
  UserDetails.belongsTo(UserMaster, { foreignKey: "userId", as: "user" });

  // UserMaster to RoleMaster [ many to one relation ]
  UserMaster.belongsTo(RoleMaster, { foreignKey: "roleId", as: "role" });
  RoleMaster.hasMany(UserMaster, { foreignKey: "roleId", as: "users" });
};

export default setupAssociations;
