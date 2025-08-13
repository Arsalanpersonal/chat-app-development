import express from 'express';
import { login, logout, signup, updateProfile, checkAuth, verifyEmail,resendVerificationEmail } from '../controllers/authController.js';
import { authProtecter } from '../middlewares/authMiddleware.js';
import { singleUploader } from "../middlewares/fileHandler.js"

const Router = express.Router();


Router.post('/signup', signup);
Router.post('/login', login);
Router.get('/logout', logout);
Router.put('/update-profile', authProtecter, singleUploader('profilePic'), updateProfile);
Router.get('/check-auth', authProtecter, checkAuth);
Router.post('/email-verification', verifyEmail);
Router.post('/resent-code', resendVerificationEmail);

export default Router;