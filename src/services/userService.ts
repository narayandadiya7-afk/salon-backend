import logger from "../logger";
const jwt = require("jsonwebtoken");
const { Op } = require("sequelize");
import CommonUtils from "../utils/common";
import { TEmailOptions } from "../types/common";
import { eReturnCodes } from "../enums/commonEnums";
import RequestModel from "../modules/common/models/requestModel";
import { UserDetails } from "../modules/userManagement/models/userModels/userDetails";
import { RoleMaster } from "../modules/userManagement/models/roleModels/roleMaster";
import CommonRequestModel from "../modules/common/models/commonRequestModel";
import { UserMasterModelDTO, UserMaster } from "../modules/userManagement/models/userModels/userMaster";


class UserManagement {
  /**
   * @description Get users list
   * @param {RequestModel} req - Request data
   * @returns {Promise<UserMasterModelDTO>} - UserMasterModelDTO containing list of users
   */
  public async getUsers(req: RequestModel): Promise<UserMasterModelDTO> {
    const userDTO: UserMasterModelDTO = new UserMasterModelDTO(
      CommonUtils.getDataResponse(eReturnCodes.R_SUCCESS)
    );

    // Initialize filter model
    const filterModel: CommonRequestModel = { ...req.data };
    // Calculate offset and limit
    const offset = (filterModel.currentPage - 1) * filterModel.pageSize;
    const limit = filterModel.pageSize;

    try {

      // Get total count of records
      filterModel.totalRows = await UserMaster.count();

      // Get records based on search text
      const users = filterModel.searchText
        ? await UserMaster.findAndCountAll({
          where: {
            userName: {
              [Op.like]: filterModel.searchText + "%",
            },
            displayName: {
              [Op.like]: filterModel.searchText + "%",
            },
            isdeleted: 0
          },
          offset,
          limit,
        })
        : await UserMaster.findAndCountAll({ where: { isdeleted: 0 }, offset, limit });

      filterModel.filterRowsCount = users.rows.length;
      userDTO.data = users.rows;
      userDTO.filterModel = filterModel;
      return userDTO;
    } catch (error: any) {
      logger.info(error.message);
      userDTO.data = [];
      userDTO.dataResponse = CommonUtils.getDataResponse(eReturnCodes.R_DB_ERROR);
      return userDTO;
    }
  }

  /**
   * @description Add or edit user
   * @param {RequestModel} req - Request data
   * @returns {Promise<UserMasterModelDTO>} - UserMasterModelDTO containing user data
   */
  public async addEditUser(req: RequestModel): Promise<UserMasterModelDTO> {
    const userDTO: UserMasterModelDTO = new UserMasterModelDTO(
      CommonUtils.getDataResponse(eReturnCodes.R_SUCCESS)
    );

    const id = req.data.id;

    try {

      if (!id) {
        // Create a new user
        const newUser = await UserMaster.create({
          userName: req.data.userName,
          displayName: req.data.displayName,
          emailId: req.data.emailId,
          mobileNumber: req.data.mobileNumber,
          password: req.data.password,
          createdby: req.auth_token.userId //AdminId
        });

        // Create a new user details
        const newUserDetails = await UserDetails.create({
          userName: req.data.userName,
          displayName: req.data.displayName,
          emailId: req.data.emailId,
          mobileNumber: req.data.mobileNumber,
          password: req.data.password,
          createdby: req.auth_token.userId //AdminId
        });

        userDTO.data = { newUser, newUserDetails };
      } else if (id > 0) {

        const existingUser = await UserMaster.findOne({ where: { id: id, isdeleted: 0 } });
        const existingUserDetails = await UserDetails.findOne({ where: { userId: id, isdeleted: 0 } });

        if (!existingUser || !existingUserDetails) {
          userDTO.data = [];
          userDTO.dataResponse = CommonUtils.getDataResponse(eReturnCodes.R_NOT_FOUND);
          // Return error if user is not found
          return userDTO;
        }

        const updateExistingUser = await existingUser.update({
          userName: req.data.userName,
          displayName: req.data.displayName,
          emailId: req.data.emailId,
          mobileNumber: req.data.mobileNumber,
          password: req.data.password,
          updatedby: req.auth_token.userId, //AdminId
          updatedon: new Date()
        })


        const updateExistingUserDetails = await existingUserDetails.update({
          userName: req.data.userName,
          displayName: req.data.displayName,
          emailId: req.data.emailId,
          mobileNumber: req.data.mobileNumber,
          password: req.data.password,
          updatedby: req.auth_token.userId, //AdminId
          updatedon: new Date()
        })


        userDTO.data = { updateExistingUser, updateExistingUserDetails }

      }
      return userDTO;
    } catch (error: any) {
      logger.info(error.message);
      userDTO.data = [];
      userDTO.dataResponse = CommonUtils.getDataResponse(eReturnCodes.R_DB_ERROR);
      return userDTO;
    }
  }


  /*************  ✨ Codeium Command 🌟  *************/
  /**
   * @description Get user details by id
   * @param {RequestModel} req - Request data
   * @returns {Promise<UserMasterModelDTO>} - UserMasterModelDTO containing user details
   */
  public async getSpecificUserData(req: RequestModel): Promise<UserMasterModelDTO> {
    const userDTO: UserMasterModelDTO = new UserMasterModelDTO(
      CommonUtils.getDataResponse(eReturnCodes.R_SUCCESS)
    );

    // If no id is present then take userId from token
    const id = req.data.id ? req.data.id : req.auth_token.userId;

    try {

      // Get details of a particular user and his roles
      //Get details of a paritcular user and his roles
      const specificUser: UserMaster | null = await UserMaster.findByPk(
        id,
        {
          include: [
            {
              model: RoleMaster,
              as: "roles",
              through: {
                attributes: [],
              },
            },
            {
              model: UserDetails,
              as: "userdetails",
            }
          ],
          order: [[{ model: RoleMaster, as: "roles" }, "id", "ASC"]],
        }
      );

      if (!specificUser) {
        // Return error if user is not found
        userDTO.data = [];
        userDTO.dataResponse = CommonUtils.getDataResponse(eReturnCodes.R_NOT_FOUND);
        return userDTO;
      }

      // Return user details with roles
      userDTO.data = specificUser.dataValues;
      userDTO.dataResponse = CommonUtils.getDataResponse(eReturnCodes.R_SUCCESS);

      return userDTO;
    } catch (error: any) {
      logger.info(error.message);
      // Return error if database error occurs
      userDTO.data = [];
      userDTO.dataResponse = CommonUtils.getDataResponse(eReturnCodes.R_DB_ERROR);
      return userDTO;
    }
  }


  /**
   * @description Retrieves the roles of a user by user ID.
   * @param {number} id - The ID of the user whose roles are to be retrieved.
   * @returns {Promise<UserMasterModelDTO>} - A promise resolving to a UserMasterModelDTO containing user roles data.
   */
  public async getUserRoles(id: number): Promise<UserMasterModelDTO> {
    // Initialize UserMasterModelDTO with a success response
    const userDTO: UserMasterModelDTO = new UserMasterModelDTO(
      CommonUtils.getDataResponse(eReturnCodes.R_SUCCESS)
    );


    try {
      // Fetch user roles by user ID with associated roles

      const userRoles = await UserMaster.findByPk(id, {
        include: [
          {
            model: RoleMaster,
            as: "roles",
            through: {
              attributes: [], // Exclude attributes from the join table
            },
          },
        ],
        order: [[{ model: RoleMaster, as: "roles" }, "id", "ASC"]], // Order roles by ID in ascending order
      });

      if (!userRoles) {
        userDTO.data = [];
        // Return not found response if user roles are not found
        userDTO.dataResponse = CommonUtils.getDataResponse(eReturnCodes.R_NOT_FOUND);
        return userDTO;
      }

      userDTO.data = userRoles;
      // Set user roles data in response
      return userDTO;
    } catch (error: any) {
      logger.info(error.message);
      // Log the error and set error response in case of a database error
      userDTO.data = [];
      userDTO.dataResponse = CommonUtils.getDataResponse(eReturnCodes.R_DB_ERROR);
      return userDTO
    }
  }


  /**
   * @description Edits user details based on the provided request data.
   * @param {RequestModel} req - Request data containing user details to be updated.
   * @returns {Promise<UserMasterModelDTO>} - UserMasterModelDTO containing the result of the update operation.
   */
  public async editUserDetails(req: RequestModel): Promise<UserMasterModelDTO> {
    const userDTO: UserMasterModelDTO = new UserMasterModelDTO(
      CommonUtils.getDataResponse(eReturnCodes.R_SUCCESS)
    );

    try {
      // Find existing user and user details records
      const existingUser = await UserMaster.findOne({ where: { isdeleted: 0, id: req.data.id } });
      const existingUserDetails = await UserDetails.findOne({ where: { isdeleted: 0, userId: req.data.id } });


      if (!existingUser || !existingUserDetails) {
        userDTO.data = [];
        userDTO.dataResponse = CommonUtils.getDataResponse(eReturnCodes.R_NOT_FOUND);
        return userDTO;
      }

      // Update existing user information
      const updateExistingUser = await existingUser.update({
        userName: req.data.userName,
        displayName: req.data.displayName,
        emailId: req.data.emailId,
        mobileNumber: req.data.mobileNumber,
        updatedon: new Date(),
        updatedby: req.auth_token.userId, //AdminId who is updating the user  
      });


      const updateExistingUserDetails = await existingUserDetails.update({
        // Update existing user details information
        userName: req.data.userName,
        displayName: req.data.displayName,
        emailId: req.data.emailId,
        mobileNumber: req.data.mobileNumber,
        updatedon: new Date(),
        updatedby: req.auth_token.userId, //AdminId who is updating the user  
      });

      userDTO.data = { updateExistingUser, updateExistingUserDetails }
      return userDTO;
    } catch (error: any) {
      logger.info(error.message);
      // Log the error and return a database error response
      userDTO.data = [];
      userDTO.dataResponse = CommonUtils.getDataResponse(eReturnCodes.R_DB_ERROR);
      return userDTO;
    }

  }

  /**
   * @description Deletes a user based on the provided request data.
   * @param {RequestModel} req - Request data containing user details to be deleted.
   * @returns {Promise<UserMasterModelDTO>} - UserMasterModelDTO containing the result of the deletion operation.
   */
  public async deleteUser(req: RequestModel): Promise<UserMasterModelDTO> {
    const userDTO: UserMasterModelDTO = new UserMasterModelDTO(
      CommonUtils.getDataResponse(eReturnCodes.R_SUCCESS)
    )

    try {

      const existingUser = await UserMaster.findOne({ where: { isdeleted: 0, id: req.data.id } })
      const existingUserDetails = await UserDetails.findOne({ where: { isdeleted: 0, userId: req.data.id } })

      if (!existingUser || !existingUserDetails) {
        userDTO.data = [];
        userDTO.dataResponse = CommonUtils.getDataResponse(eReturnCodes.R_NOT_FOUND);
        return userDTO;
      }

      await existingUser.update({
        isdeleted: 1,
        deletedon: new Date(),
        deletedby: req.auth_token.userId, //AdminId who is deleting the user
      })

      await existingUserDetails.update({
        isdeleted: 1,
        deletedon: new Date(),
        deletedby: req.auth_token.userId, //AdminId who is deleting the user
      })

      userDTO.data = "User Is Deleted Successfully";
      return userDTO;
    } catch (error: any) {
      logger.info(error.message);
      userDTO.data = [];
      userDTO.dataResponse = CommonUtils.getDataResponse(eReturnCodes.R_DB_ERROR);
      return userDTO;
    }
  }


  /**
   * @description Sign in a user
   * @param {RequestModel} req - Request data containing emailId and password
   * @returns {Promise<UserMasterModelDTO>} - UserMasterModelDTO containing a newly created token
   */
  public async signIn(req: RequestModel): Promise<UserMasterModelDTO> {
    const userDTO: UserMasterModelDTO = new UserMasterModelDTO(
      CommonUtils.getDataResponse(eReturnCodes.R_SUCCESS)
    );

    try {

      // Find a user by emailId and password
      const specificUser: UserMaster | null = await UserMaster.findOne({
        where: {
          emailId: req.data.emailId,
          password: req.data.password,
          isdeleted: 0,
        },
      });

      if (!specificUser) {
        userDTO.data = [];
        userDTO.dataResponse = CommonUtils.getDataResponse(eReturnCodes.R_NOT_FOUND);
        return userDTO;
      }

      // Create a partial user object to be used to generate a token
      // It contains the user's id, userName, orgId and isMaster flag
      const verifiedUser: Partial<UserMaster> = {
        id: specificUser.id,
        userName: specificUser.userName,
        orgId: specificUser.orgId,
        isMaster: specificUser.isMaster,
      };

      // Generate a token using the JWT_SECRET_KEY and the partial user object
      // The token is valid for 5 hours
      const token = jwt.sign({ ...verifiedUser }, process.env.JWT_SECRET_KEY, {
        expiresIn: "5h",
      });

      // Return the token as the response
      userDTO.data = token;
      return userDTO;
    } catch (error: any) {
      logger.info(error.message);
      userDTO.data = [];
      userDTO.dataResponse = CommonUtils.getDataResponse(eReturnCodes.R_DB_ERROR);
      return userDTO;
    }
  }


  /**
   * @description Sign up a new user
   * @param {RequestModel} req - Request data
   * @returns {Promise<UserMasterModelDTO>} - UserMasterModelDTO containing a newly created user
   */
  public async signUp(req: RequestModel): Promise<UserMasterModelDTO> {
    const userDTO: UserMasterModelDTO = new UserMasterModelDTO(
      CommonUtils.getDataResponse(eReturnCodes.R_SUCCESS)
    );

    try {

      // Create a new user
      const newUser: UserMaster | null = await UserMaster.create({
        userName: req.data.userName,
        displayName: req.data.displayName,
        emailId: req.data.emailId,
        mobileNumber: req.data.mobileNo,
        password: req.data.password,
      });

      const newUserDetails = await UserDetails.create({
        userId: newUser.id,
        userName: req.data.userName,
        displayName: req.data.displayName,
        emailId: req.data.emailId,
        mobileNumber: req.data.mobileNo
      })

      // Send a welcome email to the user
      const emailPurpose: TEmailOptions = {
        receiverEmail: req.data.emailId,
        password: req.data.password,
        emailPurpose: "SignIn",
      };

      CommonUtils.initializeEmail(emailPurpose);

      userDTO.data = { newUser, newUserDetails };
      return userDTO;
    } catch (error: any) {
      // Log the error and return an error response
      logger.info(error.message);
      userDTO.data = [];
      userDTO.dataResponse = CommonUtils.getDataResponse(eReturnCodes.R_DB_ERROR);
      return userDTO;
    }
  }
}


export default new UserManagement();
