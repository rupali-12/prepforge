import nodemailer from 'nodemailer'

// Create Gmail transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
})

// Verify transporter on startup
transporter.verify((error) => {
  if (error) {
    console.error('Gmail connection failed:', error)
  } else {
    console.log('Gmail SMTP ready to send emails')
  }
})

export const sendVerificationEmail = async (
  email: string,
  name: string,
  otp: string
): Promise<void> => {
  const mailOptions = {
    from: `"PrepForge" <${process.env.FROM_EMAIL}>`,
    to: email,
    subject: 'Verify your PrepForge account',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;
                  padding: 32px; background: #f9fafb; border-radius: 12px;">
        <h1 style="color: #1e40af; font-size: 28px; margin-bottom: 4px;">PrepForge</h1>
        <p style="color: #6b7280; margin-top: 0;">AI-Powered Interview Preparation</p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
        <h2 style="color: #111827; font-size: 20px;">Hi ${name}, verify your email</h2>
        <p style="color: #374151; line-height: 1.6;">
          Thanks for signing up! Use the OTP below to verify your email address.
          This code expires in <strong>15 minutes</strong>.
        </p>
        <div style="background: #1e40af; color: white; font-size: 36px; font-weight: bold;
                    letter-spacing: 12px; text-align: center; padding: 24px;
                    border-radius: 12px; margin: 24px 0;">
          ${otp}
        </div>
        <p style="color: #6b7280; font-size: 13px;">
          If you didn't create a PrepForge account, you can safely ignore this email.
        </p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
        <p style="color: #9ca3af; font-size: 12px; text-align: center;">
          © 2025 PrepForge. All rights reserved.
        </p>
      </div>
    `,
  }

  const info = await transporter.sendMail(mailOptions)
  console.log('Verification email sent:', info.messageId)
}

export const sendPasswordResetEmail = async (
  email: string,
  name: string,
  otp: string
): Promise<void> => {
  const mailOptions = {
    from: `"PrepForge" <${process.env.FROM_EMAIL}>`,
    to: email,
    subject: 'Reset your PrepForge password',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;
                  padding: 32px; background: #f9fafb; border-radius: 12px;">
        <h1 style="color: #1e40af; font-size: 28px; margin-bottom: 4px;">PrepForge</h1>
        <p style="color: #6b7280; margin-top: 0;">AI-Powered Interview Preparation</p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
        <h2 style="color: #111827; font-size: 20px;">Password Reset Request</h2>
        <p style="color: #374151; line-height: 1.6;">
          We received a request to reset your PrepForge password.
          Use the OTP below. This code expires in <strong>15 minutes</strong>.
        </p>
        <div style="background: #dc2626; color: white; font-size: 36px; font-weight: bold;
                    letter-spacing: 12px; text-align: center; padding: 24px;
                    border-radius: 12px; margin: 24px 0;">
          ${otp}
        </div>
        <p style="color: #6b7280; font-size: 13px;">
          If you didn't request a password reset, you can safely ignore this email.
        </p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
        <p style="color: #9ca3af; font-size: 12px; text-align: center;">
          © 2025 PrepForge. All rights reserved.
        </p>
      </div>
    `,
  }

  const info = await transporter.sendMail(mailOptions)
  console.log('Password reset email sent:', info.messageId)
}