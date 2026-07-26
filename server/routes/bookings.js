const express = require("express");
const crypto = require("crypto");
const db = require("../db/db");
const { requireAuth, requireAdmin } = require("../middleware/auth");
const { initializeTransaction } = require("../utils/paystack");
const { sendBookingCreatedEmail } = require("../utils/notifications");

const router = express.Router();

async function createPaymentSession(user, tour, reference) {
  const clientUrl = process.env.CLIENT_URL || "http://localhost:3000";
  return initializeTransaction({
    email: user.email,
    amountPesewas: tour.price_pesewas,
    reference,
    callbackUrl: `${clientUrl}/booking-confirmation.html?reference=${reference}`,
  });
}

router.post("/", requireAuth, async (req, res) => {
  const { tourId } = req.body;
  const tour = db.prepare("SELECT * FROM tours WHERE id = ?").get(tourId);
  if (!tour) return res.status(404).json({ error: "Tour not found" });

  const user = db.prepare("SELECT * FROM users WHERE id = ?").get(req.user.id);
  const reference = `exetours_${crypto.randomUUID()}`;

  const booking = db
    .prepare(
      "INSERT INTO bookings (user_id, tour_id, amount_pesewas, paystack_reference) VALUES (?, ?, ?, ?)"
    )
    .run(user.id, tour.id, tour.price_pesewas, reference);

  try {
    const transaction = await createPaymentSession(user, tour, reference);
    sendBookingCreatedEmail(booking.lastInsertRowid, transaction.authorization_url).catch((err) => {
      console.error("Booking notification failed", err.message);
    });

    res.status(201).json({
      bookingId: booking.lastInsertRowid,
      authorizationUrl: transaction.authorization_url,
      reference,
    });
  } catch (err) {
    res.status(502).json({ error: `Payment initialization failed: ${err.message}` });
  }
});

router.post("/:id/pay", requireAuth, async (req, res) => {
  const booking = db
    .prepare(
      `SELECT bookings.*, tours.destination, tours.date_label, tours.price_pesewas,
              users.email
       FROM bookings
       JOIN tours ON tours.id = bookings.tour_id
       JOIN users ON users.id = bookings.user_id
       WHERE bookings.id = ? AND bookings.user_id = ?`
    )
    .get(req.params.id, req.user.id);

  if (!booking) return res.status(404).json({ error: "Booking not found" });
  if (booking.status === "paid") return res.status(409).json({ error: "This booking is already paid" });
  if (booking.status === "cancelled") return res.status(409).json({ error: "This booking is cancelled" });

  try {
    const transaction = await createPaymentSession(booking, booking, booking.paystack_reference);
    res.json({ bookingId: booking.id, authorizationUrl: transaction.authorization_url, reference: booking.paystack_reference });
  } catch (err) {
    res.status(502).json({ error: `Payment initialization failed: ${err.message}` });
  }
});

router.get("/mine", requireAuth, (req, res) => {
  const bookings = db
    .prepare(
      `SELECT bookings.*, tours.destination, tours.date_label
       FROM bookings JOIN tours ON tours.id = bookings.tour_id
       WHERE bookings.user_id = ? ORDER BY bookings.created_at DESC`
    )
    .all(req.user.id);
  res.json(bookings);
});

router.get("/", requireAdmin, (_req, res) => {
  const bookings = db
    .prepare(
      `SELECT bookings.*, tours.destination, users.name AS user_name, users.email AS user_email
       FROM bookings
       JOIN tours ON tours.id = bookings.tour_id
       JOIN users ON users.id = bookings.user_id
       ORDER BY bookings.created_at DESC`
    )
    .all();
  res.json(bookings);
});

module.exports = router;
