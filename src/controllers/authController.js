import { isEmail } from "../lib/util/common.js";
import { generateEmailHash, decodeEmailHash, generateToken } from "../lib/util/appHasher.js";
import User from "../models/User.model.js";
import { deleteImage, uploadSingleImage } from "../lib/util/cloudinary.js"
// import jwt from 'jsonwebtoken';

import { sendEmail } from "../lib/util/nodeMailer.js";
import { Templates } from "../lib/util/emailTemplate.js";
import bcrypt from "bcryptjs"

// testing purpose
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

export const signup = async (req, res) => {

    const { fullName, email, password } = req.body;

    try {
        await delay(5000);

        if (!fullName || !email || !password) return res.status(400).json({
            error: 1,
            messages: "All fields are required"
        });


        if (!isEmail(email)) return res.status(400).json({

            error: 1,
            messages: "Invalid email address"
        });


        if (password.length < 6) {
            return res.status(400).json({
                error: 1,
                messages: "Password must be at least 6 characters"
            });
        }

        const user = await User.findOne({ email });

        if (user) return res.status(409).json({
            error: 1,
            messages: "Email already exists"
        });


        // const salt = await bcrypt.genSalt(10);
        // const hashPass = await bcrypt.hash(password, salt);
        // console.log(hashPass)
        // return;



        // const token = generateToken(newUser._id, res);
        // await newUser.save();
        // const { password, ...user } = newUser.toObject();

        // res.status(201).json({
        //     error: 0,
        //     messages: "Success fully register",
        //     user,
        //     token
        // });




        // Generate a 4-digit OTP
        const newUser = req.body;

        const otp_code = Math.floor(1000 + Math.random() * 9000);
        const hash = generateEmailHash(newUser, otp_code);
        console.log(hash);
        console.log(otp_code);
        const sent = await sendEmail({
            to: newUser.email,
            subject: "Email Verification From Real Time Chat App",
            html: Templates.EmailVerificationCodeTemplate(otp_code)
        });

        // console.log(sent);

        if (!sent) {
            return res.status(500).json({
                error: 1,
                messages: "Failed to send verification email"
            });
        }
        res.status(200).json({
            error: 0,
            hash,
            messages: "please check your email for verification",
        });




        // const testHash = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjp7ImVtYWlsIjoiYXJzYTEyM0BnbWFpbC5jb20iLCJmdWxsTmFtZSI6ImFyc2EiLCJwYXNzd29yZCI6IjEyMzQ1NiIsInByb2ZpbGVQaWMiOiIiLCJfaWQiOiI2ODgwYWE5YThkMzBjYzViODhlZDY4MmYifSwib3RwX2NvZGUiOjY2MjUsImlhdCI6MTc1MzI2Mjc0NiwiZXhwIjoxNzUzMzQ5MTQ2fQ.A4vZi-zofngq7S-eeblvHVppbj2k2aLfemzsFCCo-Cg`
        // const decodedHash = jwt.verify(hash, process.env.EMAIL_HASHER);

        // console.log(hash);
        // console.log(``);
        // console.log(``);
        // console.log(decodedHash);
    } catch (error) {
        console.log(error);

        res.status(500).json({
            error: 1,
            messages: process.env.NODE_env === 'development' ? error.messages : "Internal Server Error"
        })

    }
};

export const login = async (req, res) => {
    const { email, password } = req.body;

    try {
        await delay(5000);
        // Validate input
        if (!email || !password) {
            return res.status(400).json({
                error: 1,
                messages: "All fields are required"
            });
        }

        // Check if user exists
        const existUser = await User.findOne({ email });
        if (!existUser) {
            return res.status(401).json({
                error: 1,
                messages: "Invalid credentials"
            });
        }

        // console.log(existUser);


        // Check if password is correct
        const isCorrectPass = await bcrypt.compare(password, existUser.password);
        if (!isCorrectPass) {
            return res.status(401).json({
                error: 1,
                messages: "Invalid credentials"
            });
        }
        // console.log(password);
        // console.log(isCorrectPass);

        // Generate token
        const token = generateToken(existUser._id, res);

        // Exclude password from response
        const { password: _, ...userDetails } = existUser.toObject();

        // Send response
        res.status(200).json({
            error: 0,
            messages: "Successfully logged in",
            user: userDetails,
            token
        });

    } catch (error) {
        console.log('Error in login controller', error);
        res.status(500).json({
            error: 1,
            messages: process.env.NODE_env === "development" ? error.messages : "Internal Server Error"
        });
    }
};

export const logout = (req, res) => {
    try {

        res.cookie("jwt", "", { maxAge: 0 });
        res.status(200).json({
            error: 0,
            messages: "Success fully logout"
        })

    } catch (error) {
        res.status(500).json({
            error: 1,
            messages: process.env.NODE_env === "development" ? error.messages : "Internal Server Error"
        });
    }
}

export const updateProfile = async (req, res) => {
    const { file, user } = req;

    try {

        if (!file) return res.status(400).json({ error: 1, messages: "Profile image required" });

        // If the user already has a profile picture, handle deletion
        let exist_file_id = null;
        if (user.profilePic) {
            exist_file_id = `${user.profilePic.split('/').pop().split('.')[0]}.${user.profilePic.split('/').pop().split('.')[1]}`;
        }

        const result = await uploadSingleImage(file.buffer, `prof_${file.originalname}`);

        // console.log(result);

        if (result) {

            const updatedUser = await User.findByIdAndUpdate(
                user._id,
                { profilePic: result.secure_url },
                { new: true }
            ).select('-password');


            if (exist_file_id !== null) {

                await deleteImage(exist_file_id);

            }

            return res.status(200).json({
                error: 0,
                messages: "Profile has been updated",
                user: updatedUser,
            });
        }

    } catch (error) {
        res.status(500).json({
            error: 1,
            messages: process.env.NODE_ENV === "development" ? error.messages : "Internal Server Error",
        });
    }
};

export const checkAuth = (req, res) => {
    try {
        res.status(200).json(req.user);
    } catch (error) {
        console.log('Error in checkAuth controller', error.messages);
        res.status(500).json({
            error: 1,
            messages: process.env.NODE_ENV === "development" ? error.messages : "Internal Server Error",
        });
    }
}


export const verifyEmail = async (req, res) => {
    const { hash, otp_code } = req.body;

    try {
        await delay(5000);

        if (!hash || !otp_code) {
            return res.status(400).json({
                error: 1,
                messages: "OTP code and hash are required"
            });
        }

        const result = decodeEmailHash(hash);

        // console.log(result);
        // return;
        if (!result.data) {
            return res.status(400).json({
                error: 1,
                messages: "Invalid hash or OTP code"
            });
        }

        if (result.expired) {

            return res.status(400).json({
                error: 1,
                messages: "OTP code has expired"
            });

        }

        const userDetail = result.data;
        if (userDetail.otp_code !== otp_code) {
            return res.status(400).json({
                error: 1,
                messages: "OTP code does not match"
            });
        }

        // Check if user already exists

        const existingUser = await User.find({ email: userDetail.user.email });

        if (existingUser.length > 0) {
            return res.status(409).json({
                error: 1,
                messages: "User Already Registered !"
            });
        }

        // Create new user
        const newUser = new User({
            fullName: userDetail.user.fullName,
            email: userDetail.user.email,
            password: userDetail.user.password, // Ensure this is hashed in the User model or before saving
        });

        await newUser.save();

        // Generate token
        const token = generateToken(newUser._id, res);

        const { password, ...user } = newUser.toObject();

        res.status(201).json({
            error: 0,
            messages: "Email verified successfully",
            user,
            token
        });

    } catch (error) {
        console.log('Error in verifyEmail controller', error);

        res.status(500).json({
            error: 1,
            messages: process.env.NODE_ENV === "development" ? error.messages : "Internal Server Error"
        });
    }
}

export const resendVerificationEmail = async (req, res) => {
    const { pre_hash } = req.body;

    try {
        await delay(5000);
        if (!pre_hash) {
            return res.status(400).json({
                error: 1,
                messages: "Required hash data"
            });
        }

        const result = decodeEmailHash(pre_hash);
        const user = result.data ? result.data.user : null;

        // console.log(result);

        if (!user) {
            return res.status(400).json({
                error: 1,
                messages: "Invalid pre-hash"
            });
        }

        // Generate a new OTP code and hash
        const otp_code = Math.floor(1000 + Math.random() * 9000);
        const hash = generateEmailHash(user, otp_code);

        const sent = await sendEmail({
            to: user.email,
            subject: "Resend Email Verification Code",
            html: Templates.EmailVerificationCodeTemplate(otp_code)
        });

        if (!sent) {
            return res.status(500).json({
                error: 1,
                messages: "Failed to send email verification code"
            });
        }

        res.status(200).json({
            error: 0,
            hash,
            messages: "Verification code resent successfully."
        });

    } catch (error) {
        console.log('Error in resendVerificationEmail controller', error);

        res.status(500).json({
            error: 1,
            messages: process.env.NODE_ENV === "development" ? error.messages : "Internal Server Error"
        });
    }
}