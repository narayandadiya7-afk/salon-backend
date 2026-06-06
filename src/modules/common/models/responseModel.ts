import { eReturnCodes } from "../../../enums/commonEnums";

class ResponseModel {
  public returnCode!: eReturnCodes;
  public responseDateTime!: Date;
  public description!: string;
  constructor(
    returnCode: eReturnCodes,
    responseDateTime: Date,
    description: string
  ) {
    this.returnCode = returnCode;
    this.responseDateTime = responseDateTime;
    this.description = description;
  }
}

export default ResponseModel;
