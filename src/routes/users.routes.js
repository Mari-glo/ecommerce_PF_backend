import { Router } from "express";
import { addFiles, changeRole, deleteUser, deleteUsers, getAllUsers, getUserByEmail, getUserById, } from "../controller/users.controller.js";
import { uploaderFiles } from "../utils/uploadFiles.js";
import { checkUserDocuments } from "../middlewares/checkUserDocuments.js";
import { createUser } from "../dao/mongo/user.dao.js";

const routerUsers = Router();

routerUsers.get("/", getAllUsers);
routerUsers.get("/email/:email", getUserByEmail);
routerUsers.get("/:uid", getUserById);
routerUsers.get("/premium/:uid", checkUserDocuments, changeRole);
routerUsers.delete("/:uid", deleteUser);
routerUsers.delete("/", deleteUsers);
routerUsers.post("/:uid/documents", uploaderFiles, addFiles);
routerUsers.post("/", createUser);

export { routerUsers };