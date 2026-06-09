const crypto = require("crypto");
const fs = require("fs");
import sendMail from "./sendEmail";
import EncryptUtils from "./encrypt";
import { TEmailOptions } from "../types/common";
import { eReturnCodes } from "../enums/commonEnums";
import ResponseModel from "../modules/common/models/responseModel";


class CommonUtils {
  /**
   * Returns a ResponseModel object with a specific return code and description.
   * @param {eReturnCodes} returnCode The return code to be used in the response.
   * @returns {ResponseModel} A ResponseModel object with the specified return code and description.
   */
  static getDataResponse(returnCode: eReturnCodes) {
    const responseModel = new ResponseModel(
      returnCode,
      new Date(),
      "No data found"
    );

    switch (returnCode) {
      case eReturnCodes.R_SUCCESS:
        responseModel.description = "Success";
        break;
      case eReturnCodes.R_NOT_FOUND:
        responseModel.description = "Data not found";
        break;
      case eReturnCodes.R_AUTHENTICATION_FAILED:
        responseModel.description = "Authentication failed";
        break;
      case eReturnCodes.R_DB_ERROR:
        responseModel.description = "Database error";
        break;
      default:
        break;
    }
    return responseModel;
  }


  /**
   * Initializes the email with the appropriate content based on the email purpose.
   * This function is called from the services layer to send an email.
   * @param {TEmailOptions} emailOptions The options for the email to be sent.
   * 
   * The email purpose can be one of the following:
   * - SignIn: The email content is set to the SignIn template.
   */
  static generateUniqueId(text: string): string {
    const randomStr = crypto.randomBytes(3).toString("hex");
    const randomNumber = crypto.randomInt(10, 100);
    const baseText = String(text || "id");
    const cleanText = baseText.replace(/[^a-zA-Z0-9]/g, " ");
    const camelText = cleanText
      .trim()
      .split(/\s+/)
      .map((word: string, index: number) =>
        index === 0
          ? word.toLowerCase()
          : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
      )
      .join("");
    return `${camelText}${randomStr}${randomNumber}`;
  }

  static initializeEmail(emailOptions: TEmailOptions) {
    switch (emailOptions.emailPurpose) {
      case "SignIn":
        // Read the SignIn HTML template from the assets folder
        fs.readFile(
          "assets/html-template/Welcome.html",
          "utf8",
          (err: any, htmlContent: any) => {
            if (err) {
              console.error("Error reading HTML file:", err);
              // Handle error cases here
              return;
            }
            //console.log("htmlContent", htmlContent);
            // Replace placeholders in the HTML template with the actual values
            htmlContent = htmlContent
              .replace("@EMAIL@", emailOptions.receiverEmail)
              .replace(
                "@PASSWORD@",
                EncryptUtils.decrypt(emailOptions.password || "")
              );

            // Create the email options object
            let mailOptions = {
              from: process.env.MAIL_FROM_ADDRESS,
              to: emailOptions.receiverEmail,
              subject: "Welcome",
              html: htmlContent,
            };
            // Send the email
            sendMail(mailOptions, "");
          }
        );
    }
  }
  
}
export default CommonUtils;
