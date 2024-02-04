import * as messageDao from '../dao/mongo/message.dao.js';

const getMessages = async () => {
  const messages = await messageDao.find();

  return messages;
};

const saveMessage = async (message) => {
  const newMessage = await messageDao.create(message);

  return newMessage;
};

export { getMessages, saveMessage };