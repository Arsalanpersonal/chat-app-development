
const appName = 'Chat Box';
const primaryColor = '#161213';
const secondaryColor = '#1FB855';
const primaryTextColor = '#A6ADBB';

export const Templates = {
  EmailVerificationCodeTemplate: (code) => `
    <div style="background:${primaryColor};color:${primaryTextColor};padding:40px 0;font-family:sans-serif;">
      <div style="max-width:420px;margin:0 auto;background:#fff;border-radius:12px;box-shadow:0 2px 12px #0001;padding:32px;">
        <h2 style="color:${secondaryColor};margin-bottom:16px;">Verify Your Email</h2>
        <p style="color:#333;font-size:16px;">Welcome to <b>${appName}</b>! Please use the code below to verify your email address:</p>
        <div style="background:${secondaryColor};color:#fff;font-size:2rem;font-weight:bold;letter-spacing:4px;padding:18px 0;border-radius:8px;text-align:center;margin:24px 0;">
          ${code}
        </div>
        <p style="color:#555;">If you did not request this, you can safely ignore this email.</p>
        <div style="margin-top:32px;text-align:center;">
          <span style="font-size:12px;color:#bbb;">&copy; ${new Date().getFullYear()} ${appName}</span>
        </div>
      </div>
    </div>
    `,
  PasswordResetTemplate: () => `
    <div style="background:${primaryColor};color:${primaryTextColor};padding:40px 0;font-family:sans-serif;">
      <div style="max-width:420px;margin:0 auto;background:#fff;border-radius:12px;box-shadow:0 2px 12px #0001;padding:32px;">
        <h2 style="color:${secondaryColor};margin-bottom:16px;">Password Reset Request</h2>
        <p style="color:#333;font-size:16px;">We received a request to reset your password for your <b>${appName}</b> account.</p>
        <a href="{{resetLink}}" style="display:inline-block;background:${secondaryColor};color:#fff;text-decoration:none;padding:14px 32px;border-radius:8px;font-weight:bold;font-size:16px;margin:24px 0;">Reset Password</a>
        <p style="color:#555;">If you did not request a password reset, please ignore this email.</p>
        <div style="margin-top:32px;text-align:center;">
          <span style="font-size:12px;color:#bbb;">&copy; ${new Date().getFullYear()} ${appName}</span>
        </div>
      </div>
    </div>
    `
};


// ...existing code...
