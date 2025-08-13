import express from 'express';
import { authProtecter } from '../middlewares/authMiddleware.js';
import { deleteMessage, getMessages, getUsersForSidebar, sendMessage, unseenMessagesCountForPerson, updateMessageAsSeen, getLastMessageForAllUsers, clearChats } from '../controllers/messageController.js';
import { multipleUploader, singleUploader } from '../middlewares/fileHandler.js';


const Router = express.Router();

Router.get("/users", authProtecter, getUsersForSidebar);
Router.get("/chat-view/:id", authProtecter, getMessages);
Router.post("/send-message/:id", authProtecter, multipleUploader('attachments'), sendMessage);

Router.patch("/messages-seen/:selectedUserId", authProtecter, updateMessageAsSeen);
Router.get("/unseen-messages", authProtecter, unseenMessagesCountForPerson);
Router.get("/my-users-last-message", authProtecter, getLastMessageForAllUsers);
Router.delete("/delete-message/:messageId", authProtecter, deleteMessage);
Router.delete("/clear-user-chats/:selectedUserId", authProtecter, clearChats);


export default Router;