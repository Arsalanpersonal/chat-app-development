import jwt from 'jsonwebtoken';
import User from '../models/User.model.js';


export const authProtecter = async (req, res, next) => {


    const token = req.cookies.jwt || req.headers.authorization?.split(" ")[1];

    // console.log("Token:", token);
    

    try {

        if (!token) return res.status(401).json({ error: 1, message: "Unauthorized, No Token Provided" });


        const decodeData = jwt.verify(token, process.env.APP_SECRET);

        if (!decodeData) return res.status(401).json({ error: 1, message: "Unauthorized, Invalid Token" });


        const user = await User.findById(decodeData.userId).select('-password');

        if (!user) return res.status(404).json({
            error: 1,
            message: "You are not login"

        });


        req.user = user;

        next();
    } catch (error) {
        res.status(500).json({
            error: 1,
            messages: process.env.NODE_env === "development" ? error.message : "Internal Server Error"
        });
    }
}