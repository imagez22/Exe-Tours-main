const express = require("express");
const crypto = require("crypto");
const db = require("../db/db");
const { requireAuth } = require("../middleware/auth");
const { verifyTransaction } = require("../utils/paystack");
const { sendPaymentConfirmedEmail } = require("../utils/notifications");

const router = express.Router();

async function markBookingPaidIfNeeded(reference, paystackStatus) {
  if (paystackStatus !== "success") return;
  const booking = db.prepare("SELECT id, status, payment_notified_at FROM bookings WHERE paystack_reference = ?").get(reference);
  if (!booking) return;
  if (booking.status !== "paid") {
    db.prepare("UPDATE bookings SET status = 'paid' WHERE id = ?").run(booking.id);
  }
  if (booking.payment_notified_at) return;
  try {
    await sendPaymentConfirmedEmail(booking.id);
    db.prepare("UPDATE bookings SET payment_notified_at = CURRENT_TIMESTAMP WHERE id = ?").run(booking.id);
  } catch (err) {
    console.error("Payment notification failed", err.message);
  }
}

router.get("/verify/:reference", requireAuth, async (req, res) => {
  const booking = db
    .prepare("SELECT * FROM bookings WHERE paystack_reference = ?")
    .get(req.params.reference);
  if (!booking) return res.status(404).json({ error: "Booking not found" });
  if (booking.user_id !== req.user.id && req.user.role !== "admin") {
    return res.status(403).json({ error: "Not your booking" });
  }

  try {
    const transaction = await verifyTransaction(req.params.reference);
    await markBookingPaidIfNeeded(req.params.reference, transaction.status);
    const updated = db.prepare("SELECT * FROM bookings WHERE id = ?").get(booking.id);
    res.json(updated);
  } catch (err) {
    res.status(502).json({ error: `Payment verification failed: ${err.message}` });
  }
});

async function webhookHandler(req, res) {
  const signature = req.get("x-paystack-signature");
  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret || !signature) return res.sendStatus(400);

  const expected = crypto.createHmac("sha512", secret).update(req.body).digest("hex");
  if (expected !== signature) return res.sendStatus(401);

  const event = JSON.parse(req.body.toString("utf8"));
  if (event.event === "charge.success") {
    await markBookingPaidIfNeeded(event.data.reference, "success");
  }
  res.sendStatus(200);
}

module.exports = { router, webhookHandler };
