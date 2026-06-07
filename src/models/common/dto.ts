import BaseResponse from "../../modules/common/models/baseResponse";
import CommonRequestModel from "../../modules/common/models/commonRequestModel";

export class UserMasterModelDTO extends BaseResponse {
  public filterModel: CommonRequestModel | undefined;
}

export class RoleMasterModelDTO extends BaseResponse {
  public filterModel: CommonRequestModel | undefined;
}

export class MenuHierarchylDTO extends BaseResponse {}

export class ConfigGroupDTO extends BaseResponse {
  public filterModel: CommonRequestModel | undefined;
}

export class ConfigParamDTO extends BaseResponse {
  public filterModel: CommonRequestModel | undefined;
}

export class CountryDTO extends BaseResponse {}

export class StateDTO extends BaseResponse {}

export class DistrictDTO extends BaseResponse {}
