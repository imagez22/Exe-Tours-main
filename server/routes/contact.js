const express = require("express");
const db = require("../db/db");
const { sendMail } = require("../utils/mailer");
const { requireAdmin } = require("../middleware/auth");

const router = express.Router();

router.get("/", requireAdmin, (_req, res) => {
  const messages = db.prepare("SELECT * FROM contact_messages ORDER BY created_at DESC").all();
  res.json(messages);
});

router.post("/", async (req, res) => {
  const { name, email, country, remarks } = req.body;
  if (!name || !email) {
    return res.status(400).json({ error: "Name and email are required" });
  }

  db.prepare(
    "INSERT INTO contact_messages (name, email, country, remarks) VALUES (?, ?, ?, ?)"
  ).run(name, email, country || null, remarks || null);

  try {
    await sendMail({
      to: process.env.CONTACT_INBOX || "admin@exetours.world",
      subject: "New contact message - EXE Tours",
      text: `Name: ${name}\nEmail: ${email}\nCountry: ${country || "-"}\n\nRemarks:\n${remarks || "-"}`,
    });
  } catch (err) {
    console.error("Failed to send contact email:", err.message);
  }

  res.status(201).json({ ok: true });
});

module.exports = router;
