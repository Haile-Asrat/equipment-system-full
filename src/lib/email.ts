import nodemailer from 'nodemailer';

let transporter: nodemailer.Transporter | null = null;

if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
  try {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
    });
  } catch (e) {
    console.warn('Failed to initialize email transporter:', e);
  }
}

export async function sendMail(to: string, subject: string, text: string) {
  if (!transporter) {
    console.warn('Email not configured. OTP code:', text.match(/\d{6}/)?.[0] || 'N/A');
    return;
  }
  try {
    await transporter.sendMail({ 
      from: process.env.EMAIL_FROM || process.env.SMTP_USER, 
      to, 
      subject, 
      text 
    });
  } catch (e) {
    console.error('Failed to send email:', e);
    throw e;
  }
}
