class RequestModel {
  public data!: any;
  public auth_token!: AuthorizationModel;
  public sourcePlatform!: number;
  constructor() {}
}

class AuthorizationModel {
  public userId!: number;
  public roleId!: number;
  public fullName!: string;
  public mobileNumber!: string;
  public emailId!: string;
}

export default RequestModel;
