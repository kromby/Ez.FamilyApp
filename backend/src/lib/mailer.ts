import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function sendOtpEmail(to: string, otp: string): Promise<void> {
  if (process.env.NODE_ENV === 'development') {
    console.log(`[DEV] OTP for ${to}: ${otp}`);
    return;
  }
  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to,
    subject: 'Your family app sign-in code',
    text: `Your sign-in code is: ${otp}\n\nThis code expires in 10 minutes.`,
  });
}
