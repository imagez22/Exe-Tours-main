const express = require("express");
const db = require("../db/db");
const { requireAdmin } = require("../middleware/auth");
const upload = require("../middleware/upload");

const router = express.Router();

router.get("/", (_req, res) => {
  const tours = db.prepare("SELECT * FROM tours ORDER BY created_at ASC").all();
  res.json(tours);
});

router.get("/:id", (req, res) => {
  const tour = db.prepare("SELECT * FROM tours WHERE id = ?").get(req.params.id);
  if (!tour) return res.status(404).json({ error: "Tour not found" });
  res.json(tour);
});

router.post("/", requireAdmin, upload.single("image"), (req, res) => {
  const { date_label, destination, description, price_pesewas } = req.body;
  if (!date_label || !destination) {
    return res.status(400).json({ error: "date_label and destination are required" });
  }
  const imagePath = req.file ? `uploads/${req.file.filename}` : null;
  const result = db
    .prepare(
      "INSERT INTO tours (date_label, destination, description, image_path, price_pesewas) VALUES (?, ?, ?, ?, ?)"
    )
    .run(date_label, destination, description || null, imagePath, Number(price_pesewas) || 0);
  const tour = db.prepare("SELECT * FROM tours WHERE id = ?").get(result.lastInsertRowid);
  res.status(201).json(tour);
});

router.put("/:id", requireAdmin, upload.single("image"), (req, res) => {
  const existing = db.prepare("SELECT * FROM tours WHERE id = ?").get(req.params.id);
  if (!existing) return res.status(404).json({ error: "Tour not found" });

  const { date_label, destination, description, price_pesewas } = req.body;
  const imagePath = req.file ? `uploads/${req.file.filename}` : existing.image_path;

  db.prepare(
    "UPDATE tours SET date_label = ?, destination = ?, description = ?, image_path = ?, price_pesewas = ? WHERE id = ?"
  ).run(
    date_label ?? existing.date_label,
    destination ?? existing.destination,
    description ?? existing.description,
    imagePath,
    price_pesewas !== undefined ? Number(price_pesewas) : existing.price_pesewas,
    req.params.id
  );

  res.json(db.prepare("SELECT * FROM tours WHERE id = ?").get(req.params.id));
});

router.delete("/:id", requireAdmin, (req, res) => {
  const result = db.prepare("DELETE FROM tours WHERE id = ?").run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: "Tour not found" });
  res.json({ ok: true });
});

module.exports = router;
