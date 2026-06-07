import { eReturnCodes } from "../enums/commonEnums";

export type TRequest = {
  orgId?: number;
  requestDateTime: Date;
  requestSource?: number;
  request: string;
  ipAddress: string;
  originName: string;
  isdeleted: number;
};

export type TResponse = {
  resultCode: eReturnCodes;
  responseDateTime: Date;
};

export type TAuthorizationModel = {
  userId: number;
  roleId: number;
  fullName: string;
  mobileNumber: string;
  emailId: string;
};

export type TEmailOptions = {
  receiverEmail?: string;
  password?: string;
  emailPurpose: string;
};

export type TMenuHierarchy = {
  id: number;
  name: string;
  dispName: string;
  parentId: number;
  menuUniqueId: string;
  entityUrl: string;
  description: string;
  isActive: number;
  orgId: number;  
  iconName: string;
  displayOrder: number;
  children: TMenuHierarchy[];
  privileges: TPrivilege[];
};

export type TPrivilege = {
  id?: string;
  name: string;
  groupId: string;
  menuId: number;  
};

export type TRolePrivilege = {
  id?: number;
  roleId: number;
  privilegeId: number; 
};
