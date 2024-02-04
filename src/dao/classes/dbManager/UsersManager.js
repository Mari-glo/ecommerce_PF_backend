
import {enumErrors} from "../../../errors/enumErrors.js";
import usersModel from "../../models/users.model.js";
import nodemailer from "nodemailer";

const transport = nodemailer.createTransport({
  service: "gmail",
  port: 5087,
  auth: {
    user: "marigloria@gmail.com",
    pass: "xjrcbyzarjhlmnts",
  },
});


export default class UsersManager {
  constructor() {}



  async getAll() {
    try {
      const users = await usersModel.find().lean();

      if (!users.length)
        return {status: 204, message: "No users", payload: users};
      return {
        status: 200,
        message: "Users obtained successfully",
        payload: users,
      };
    } catch (error) {
      return {
        statusCode: 500,
        error: true,
        name: "Error occurred at moment of get users",
        cause: error.toString(),
        message: "We are working to fix this issue",
        code: enumErrors.ERROR_FROM_SERVER,
      };
    }
  }



  async getBy(param) {
    try {
      if (Object.keys(param).includes("id")) param = {_id: param.id};

      const user = await usersModel.findOne(param).lean();
      if (user === null)
        return {
          statusCode: 404,
          error: true,
          name: "User not found",
          message: `The user not found, check the filter and try again`,
          cause: "The user not exist in the db",
          code: enumErrors.NOT_FOUND,
        };

      return {status: 200, message: "User obtained succesfully", payload: user};
    } catch (error) {
      return {
        statusCode: 500,
        error: true,
        name: `Error occurred at moment of get the user`,
        cause: error.toString(),
        message: "We are working to fix this issue",
        code: enumErrors.ERROR_FROM_SERVER,
      };
    }
  }



  async post(user) {
    try {
      const newUser = await usersModel.create(user);
      return {
        status: 201,
        message: "User created successfully",
        payload: newUser,
      };
    } catch (error) {
      return {
        statusCode: 500,
        error: true,
        name: "Error occurred at moment of create the user",
        casue: error.toString(),
        message: "We are working to fix this issue",
        code: enumErrors.ERROR_FROM_SERVER,
      };
    }
  }



  async postDocuments(param, documents) {
    try {
      const getUser = await this.getBy(param);
      if (getUser.error) return getUser;
      const user = getUser.payload;

      let documentsToUser = [];

      for (const document in documents) {
        const name = documents[document].fieldname;
        const path = documents[document].path.split("\\");
        const reference = `/${path[path.length - 3]}/${path[path.length - 2]}/${
          path[path.length - 1]
        }`;
        const documentToUser = {name, reference};
        documentsToUser.push(documentToUser);
      }

      if (user.documents?.length)
        documentsToUser = [...user.documents, documentsToUser];

      const userUpdated = await this.putBy(param, {
        documents: documentsToUser,
      });
      if (userUpdated.error) return userUpdated;
      return {
        status: 200,
        message: "Documents sent successfully",
        payload: userUpdated.payload.documents,
      };
    } catch (error) {
      console.log(error);
      return {
        statusCode: 500,
        error: true,
        name: "Error occurred at moment of post documents",
        cause: error.toString(),
        message: "We are working for fix this issue",
        code: enumErrors.ERROR_FROM_SERVER,
      };
    }
  }



  async putBy(param, object) {
    try {
      const userUpdated = await usersModel.findOneAndUpdate(param, object, {
        new: true,
      });

      if (userUpdated === null)
        return {
          statusCode: 404,
          error: true,
          name: "User not found",
          cause: `User with ${param} not found`,
          message: "Check the filter and try again",
          code: enumErrors.NOT_FOUND,
        };

      return {
        status: 200,
        message: "User updated successfully",
        payload: userUpdated,
      };
    } catch (error) {
      return {
        statusCode: 500,
        error: true,
        name: "Error occurred at moment of update the user",
        cause: error.toString(),
        message: "We are working for fix this issue",
        code: enumErrors.ERROR_FROM_SERVER,
      };
    }
  }



  async putPremiumRole(param) {
    try {
      const getUser = await this.getBy(param);
      if (getUser.error) return getUser;
      const user = getUser.payload;

      if (!user.role.includes("premium") && !user.role.includes("user"))
        return {
          statusCode: 400,
          error: true,
          name: "User or premium role required",
          cause: "The role of the user is different of user or premium",
          message: "Try change the role of user or premium user",
          code: enumErrors.INVALID_REQUEST,
        };

      if (user.role === "premium") {
        const userUpdated = await this.putBy(param, {role: "user"});
        if (userUpdated.error) return userUpdated;
        return userUpdated;
      }

      if (user.documents?.length !== 3)
        return {
          statusCode: 400,
          error: true,
          name: "Documents missing",
          cause: "Not found all documents",
          message: "Send all documents for change to premium user",
          code: enumErrors.MISSING_VALUES,
        };

      const userUpdated = await this.putBy(param, {role: "premium"});
      if (userUpdated.error) return userUpdated;

      return {
        status: 200,
        message: "Role actualiced successfully",
        payload: userUpdated.payload.role,
      };
    } catch (error) {
      return {
        status: 500,
        error: true,
        name: `Error at moment of update the premium rol of the user`,
        cause: error.toString(),
        message: "We are working to fix this issue",
        code: enumErrors.ERROR_FROM_SERVER,
      };
    }
  }



  async deleteBy(id) {
    try {
      const userDeleted = await usersModel.findIdAndDelete({_id: id});
      if (userDeleted === null)
        return {
          statusCode: 404,
          error: true,
          name: `User not found`,
          cause: "The filter not match with anyone user",
          message: "Check the filter and try again",
        };
      return {status: 204, message: `User deleted succesfully`};
    } catch (error) {
      return {
        status: 500,
        error: true,
        name: `Error occurred at moment of delete the user`,
        cause: error.toString(),
        message: "We are working to fix this issue",
        code: enumErrors.ERROR_FROM_SERVER,
      };
    }
  }


  //DELETE ALL USERS FOR OFFTIME
  async deleteAllOffTime() {
    try{
      let currentDate = new Date();
      let offTimeMin = 30;
      const diffOldTime = new Date( currentDate - ( offTimeMin * 60 * 1000 )).toLocaleString();

      const usersOffTimeDeleted = await usersModel.find( { lastConnection: {$lte: diffOldTime} } )

      if (usersOffTimeDeleted === null)
      return {
        statusCode: 404,
        error: true,
        name: `Users not found`,
        cause: "There is no user out of time.",
        message: "Check the filter and try again",
      };
      
      usersOffTimeDeleted.forEach( async ( user ) => {
        await transport.sendMail({ 
          from: "marigloria@gmail.com",
          to: `${user.email}`,
          subject: "Aviso eliminacion de Usuario",
          text: `Usuario elimado de la pagina MAITEE ACCESORIOS: Email: ${user.email}`,
        })
        
        let borrar = await usersModel.findByIdAndDelete( user._id )
      });
      
      return {status: 204, menssage: 'Delete users offtime succesfully'}

    } catch (error) {
      return {
        status: 500,
        error: true,
        name: `Error occurred at moment of delete all users for offTime`,
        cause: error.toString(),
        message: "We are working to fix this issue",
        code: enumErrors.ERROR_FROM_SERVER,
      };
    }
  }
}