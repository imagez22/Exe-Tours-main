const express = require("express");
const bcrypt = require("bcryptjs");
const db = require("../db/db");
const { issueToken, clearToken, requireAuth } = require("../middleware/auth");
const { sendMail } = require("../utils/mailer");

const router = express.Router();

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

router.post("/signup", async (req, res) => {
  const name = String(req.body.name || "").trim();
  const email = normalizeEmail(req.body.email);
  const password = String(req.body.password || "");

  if (!name || !email || !password) {
    return res.status(400).json({ error: "Name, email and password are required" });
  }
  if (name.length < 2) {
    return res.status(400).json({ error: "Please enter a valid name" });
  }
  if (!isValidEmail(email)) {
    return res.status(400).json({ error: "Please enter a valid email address" });
  }
  if (password.length < 8) {
    return res.status(400).json({ error: "Password must be at least 8 characters" });
  }

  const existing = db.prepare("SELECT id FROM users WHERE email = ?").get(email);
  if (existing) {
    return res.status(409).json({ error: "An account with this email already exists" });
  }

  const hash = bcrypt.hashSync(password, 10);
  const result = db
    .prepare("INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, 'user')")
    .run(name, email, hash);

  const user = { id: result.lastInsertRowid, role: "user" };
  issueToken(res, user);

  try {
    await sendMail({
      to: email,
      subject: "Welcome to EXE TOURS",
      text: `Hi ${name},\n\nWelcome to EXE TOURS! Your account is ready and you can now book unforgettable tours and experiences with us.\n\nIf you need help, reply to this email or contact us at admin@exetours.world.\n\nHappy exploring!\nEXE TOURS`,
    });
  } catch (error) {
    console.error("Signup email failed", error);
  }

  res.status(201).json({ id: user.id, name, email, role: "user" });
});

router.post("/login", (req, res) => {
  const email = normalizeEmail(req.body.email);
  const password = String(req.body.password || "");
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  const user = db.prepare("SELECT * FROM users WHERE email = ?").get(email);
  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ error: "Invalid email or password" });
  }

  issueToken(res, user);
  res.json({ id: user.id, name: user.name, email: user.email, role: user.role });
});

router.post("/logout", (_req, res) => {
  clearToken(res);
  res.json({ ok: true });
});

router.get("/me", requireAuth, (req, res) => {
  const user = db
    .prepare("SELECT id, name, email, role FROM users WHERE id = ?")
    .get(req.user.id);
  if (!user) return res.status(401).json({ error: "Not authenticated" });
  res.json(user);
});

module.exports = router;
