
import jwt from 'jsonwebtoken';

export const generateToken = (userId, res) => {


    const token = jwt.sign({ userId }, process.env.APP_SECRET, {
        expiresIn: "7d"
    });

    res.cookie("jwt", token, {
        maxAge: 7 * 24 * 60 * 60 * 1000, //ms
        httpOnly: true,
        sameSite: "strict",
        secure: process.env.NODE_ENV !== 'development'
    })


    return token;

}

<<<<<<< HEAD
=======
export const decodeHash = (hash) => {
    try {
        return jwt.verify(hash, process.env.APP_SECRET);
    } catch (error) {
        return null;
    }
}

>>>>>>> e5b5186 (fresh commit)
export const generateEmailHash = (user, otp_code) => {

    const hash = jwt.sign({ user, otp_code: otp_code }, process.env.EMAIL_HASHER, { expiresIn: "1d" });

    return hash;
}

export const decodeEmailHash = (hash) => {
    try {
        // Decode without verifying expiration
        const decoded = jwt.verify(hash, process.env.EMAIL_HASHER, { ignoreExpiration: true });

        // Check expiration
        const now = Math.floor(Date.now() / 1000); // current time in seconds
        if (decoded.exp && decoded.exp < now) {
            // Expired
            return { expired: true, data: null };
        }
        // Not expired
        return { expired: false, data: decoded };
    } catch (error) {
        return { expired: true, data: null };
    }
}