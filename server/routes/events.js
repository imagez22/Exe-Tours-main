const express = require("express");
const db = require("../db/db");
const { requireAdmin } = require("../middleware/auth");
const upload = require("../middleware/upload");

const router = express.Router();

router.get("/", (_req, res) => {
  const events = db.prepare("SELECT * FROM events ORDER BY created_at ASC").all();
  res.json(events);
});

router.post("/", requireAdmin, upload.single("image"), (req, res) => {
  const { title, description } = req.body;
  if (!title || !description) {
    return res.status(400).json({ error: "title and description are required" });
  }
  const imagePath = req.file ? `uploads/${req.file.filename}` : null;
  const result = db
    .prepare("INSERT INTO events (title, description, image_path) VALUES (?, ?, ?)")
    .run(title, description, imagePath);
  res.status(201).json(db.prepare("SELECT * FROM events WHERE id = ?").get(result.lastInsertRowid));
});

router.put("/:id", requireAdmin, upload.single("image"), (req, res) => {
  const existing = db.prepare("SELECT * FROM events WHERE id = ?").get(req.params.id);
  if (!existing) return res.status(404).json({ error: "Event not found" });

  const { title, description } = req.body;
  const imagePath = req.file ? `uploads/${req.file.filename}` : existing.image_path;

  db.prepare("UPDATE events SET title = ?, description = ?, image_path = ? WHERE id = ?").run(
    title ?? existing.title,
    description ?? existing.description,
    imagePath,
    req.params.id
  );

  res.json(db.prepare("SELECT * FROM events WHERE id = ?").get(req.params.id));
});

router.delete("/:id", requireAdmin, (req, res) => {
  const result = db.prepare("DELETE FROM events WHERE id = ?").run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: "Event not found" });
  res.json({ ok: true });
});

module.exports = router;
