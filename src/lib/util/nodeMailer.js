import nodeMailer from "nodemailer";

const transporter = nodeMailer.createTransport({
    service: "gmail", // fixed typo from "gamil" to "gmail"
    port: 465,
    secure: true,
    // logger: true,
    debug: true,
    tls: {
        rejectUnauthorized: true
    },
    auth: {
        user: process.env.APP_EMAIL,
        pass: process.env.APP_PASSWORD,
    }
});

/**
 * Send an email using nodemailer.
 * @param {Object} options - Email options.
 * @param {string} options.to - Recipient email address.
 * @param {string} options.subject - Email subject.
 * @param {string} options.html - Email HTML content.
 * @returns {Promise<boolean>} - Returns true if sent, false otherwise.
 */
export const sendEmail = async function ({ to, subject, html }) {
    try {
        await transporter.sendMail({
            from: process.env.APP_EMAIL,
            to,
            subject,
            html
        });
        return true;
    } catch (error) {
        console.error("Email send error:", error);
        return false;
    }
};