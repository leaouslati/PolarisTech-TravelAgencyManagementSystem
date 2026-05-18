const nodemailer = require('nodemailer');
const dns = require('dns').promises;
require('dotenv').config();

let cachedHost = null;

const getSmtpHost = async () => {
  if (cachedHost) return cachedHost;
  try {
    const addrs = await dns.resolve4('smtp.gmail.com');
    if (addrs.length > 0) {
      cachedHost = addrs[0];
      return cachedHost;
    }
  } catch {}
  return 'smtp.gmail.com';
};

const sendEmail = async (to, subject, html) => {
  try {
    const host = await getSmtpHost();
    const transporter = nodemailer.createTransport({
      host,
      port: 587,
      secure: false,
      connectionTimeout: 10000,
      socketTimeout: 10000,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });
    await transporter.sendMail({
      from: `"PolarisTech" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html
    });
  } catch (err) {
    console.error('Email error:', err.message);
  }
};

module.exports = sendEmail;