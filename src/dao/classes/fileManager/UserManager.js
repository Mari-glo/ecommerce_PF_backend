import fs from "fs";
import {faker} from "@faker-js/faker";
import {enumErrors} from "../../../errors/enumErrors";

export default class CartsManager {
  constructor() {
    this.path = "src/dao/classes/fileManager/users.json";
  }

  async getAll() {
    try {
      const document = await fs.promises.readFile(this.path);
      const users = JSON.parse(document);

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
      const getUsers = await this.getAll();
      if (getUsers.error) return getUsers;
      const users = getUsers.payload;

      const prop = Object.keys(param)[0];
      const value = param[prop];
      const user = users.find((dbUser) => dbUser[prop] === value);

      if (!user)
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
      const getUsers = await this.getAll();
      if (getUsers.error) return getUsers;
      const users = getUsers.payload;

      const existEmail = users.find((dbUser) => dbUser.email === user.email);

      if (existEmail)
        return {
          statusCode: 400,
          error: true,
          name: "Already exist a user with this email",
          cause: "The email sent already exist",
          message: "Change the email and try again",
          code: enumErrors.INVALID_REQUEST,
        };

      const newUser = {id: faker.database.mongodbObjectId(), ...user};

      users.push(newUser);

      await this.writeFile(users);

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

      const documentsToUser = [];

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
      const getUsers = await this.getAll();
      if (getUsers.error) return getUsers;
      const users = getUsers.payload;

      const getUser = await this.getBy(param);
      if (getUser.error) return getUser;
      const user = getUser.payload;

      for (const prop in object) {
        if (object[prop] !== undefined) user[prop] = object[prop];
      }

      const userIndex = users.findIndex((dbUser) => dbUser.id === user.id);

      users.splice(userIndex, 1, user);

      await this.writeFile(users);

      return {
        status: 200,
        message: "User updated successfully",
        payload: user,
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
        return {
          status: 200,
          message: "Role actualiced successfully",
          payload: userUpdated.payload.role,
        };
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

  async deleteBy(param) {
    try {
      const getUsers = await this.getAll();
      if (getUsers.error) return getUsers;
      const users = getUsers.payload;

      const getUser = await this.getBy(param);
      if (getUser.error) return getUser;
      const user = getUser.payload;
      const userIndex = users.findIndex((dbUser) => dbUser.id === user.id);

      users.splice(userIndex, 1);

      await this.writeFile(users);

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

  async writeFile(data) {
    try {
      await fs.promises.writeFile(this.path, JSON.stringify(data));
      return {status: 200, message: "Overwrited successfully"};
    } catch (error) {
      return {
        status: 500,
        error: true,
        name: `Error occurred at moment of overwrite the database`,
        cause: error.toString(),
        message: "We are working to fix this issue",
        code: enumErrors.ERROR_FROM_SERVER,
      };
    }
  }
}