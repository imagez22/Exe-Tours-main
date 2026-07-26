const express = require("express");
const db = require("../db/db");
const { requireAuth } = require("../middleware/auth");
const upload = require("../middleware/upload");

const router = express.Router();

function getProfile(userId) {
  return db
    .prepare(
      `SELECT id, name, email, role, phone, country, travel_preferences,
              avatar_path, email_notifications, created_at
       FROM users WHERE id = ?`
    )
    .get(userId);
}

router.get("/", requireAuth, (req, res) => {
  const profile = getProfile(req.user.id);
  if (!profile) return res.status(404).json({ error: "Profile not found" });
  res.json(profile);
});

router.put("/", requireAuth, upload.single("avatar"), (req, res) => {
  const current = getProfile(req.user.id);
  if (!current) return res.status(404).json({ error: "Profile not found" });

  const name = String(req.body.name ?? current.name).trim();
  const phone = String(req.body.phone ?? "").trim() || null;
  const country = String(req.body.country ?? "").trim() || null;
  const travelPreferences = String(req.body.travel_preferences ?? "").trim() || null;
  const emailNotifications = req.body.email_notifications === "0" ? 0 : 1;

  if (name.length < 2) {
    return res.status(400).json({ error: "Please enter a valid name" });
  }

  const avatarPath = req.file ? `uploads/${req.file.filename}` : current.avatar_path;
  db.prepare(
    `UPDATE users SET name = ?, phone = ?, country = ?, travel_preferences = ?,
     avatar_path = ?, email_notifications = ? WHERE id = ?`
  ).run(name, phone, country, travelPreferences, avatarPath, emailNotifications, req.user.id);

  res.json(getProfile(req.user.id));
});

module.exports = router;