import * as messageDao from '../dao/mongo/message.dao.js';

const getMessages = async () => {
  const messages = await messageDao.getMessages();

  return messages;
};

const saveMessage = async (message) => {
  const newMessage = await messageDao.saveMessage(message);

  return newMessage;
};

export { getMessages, saveMessage };