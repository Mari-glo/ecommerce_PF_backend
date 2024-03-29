import * as userDao from "../dao/mongo/user.dao.js";

const getAllUsers = async () => {
  const users = await userDao.getAllUsers();
  return users;
};

const createUser = async (user) => {
  const newUser = await userDao.createUser(user);
  return newUser;
};

const getUserByEmail = async (email) => {
  const user = await userDao.getUserByEmail(email);
  return user;
};

const getUserById = async (id) => {
  const user = await userDao.getUserById(id);
  return user;
};

const changePass = async (email, newPassword) => {
  await userDao.changePass(email, newPassword);
};

const changeRole = async (email) => {
  const user = await userDao.changeRole(email);
  return user;
};

const deleteUser = async (id) => {
  await userDao.deleteUser(id);
};

const addLastConnection = async (uid, date) => {
  const user = await userDao.addLastConnection(uid, date);
  return user;
};

const addFiles = async (uid, files) => {
  const user = await userDao.addFiles(uid, files);
  return user;
};

const deleteUsers = async () => {
  await userDao.deleteUsers();
};

export { createUser, getUserByEmail, getUserById, changePass, changeRole, getAllUsers,
  deleteUser, addLastConnection, addFiles, deleteUsers, };