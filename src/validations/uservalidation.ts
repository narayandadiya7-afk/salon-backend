import { body } from "express-validator";

class UserValidations {
  public static signInValidation = [
    body("data.username")
      .isLength({ min: 3 })
      .withMessage("Username must be at least 3 characters long."),
    body("data.emailid")
      .isEmail()
      .withMessage("Please enter a valid email address."),
  ];
}
export default UserValidations;
