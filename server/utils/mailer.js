const nodemailer = require("nodemailer");

function buildTransport() {
  if (!process.env.SMTP_HOST) {
    return nodemailer.createTransport({ jsonTransport: true });
  }
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: process.env.SMTP_USER
      ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
      : undefined,
  });
}

const transport = buildTransport();

async function sendMail({ to, subject, text }) {
  const from = process.env.SMTP_FROM || "EXE TOURS <no-reply@exetours.world>";
  const info = await transport.sendMail({ from, to, subject, text });
  if (!process.env.SMTP_HOST) {
    console.log(`[mailer] SMTP not configured, logging email instead of sending:\nTo: ${to}\nSubject: ${subject}\n${text}`);
  }
  return info;
}

module.exports = { sendMail };
