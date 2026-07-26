const db = require("../db/db");
const { sendMail } = require("./mailer");

function getBookingDetails(bookingId) {
  return db
    .prepare(
      `SELECT bookings.*, users.name, users.email, users.email_notifications,
              tours.destination, tours.date_label
       FROM bookings
       JOIN users ON users.id = bookings.user_id
       JOIN tours ON tours.id = bookings.tour_id
       WHERE bookings.id = ?`
    )
    .get(bookingId);
}

function formatAmount(pesewas) {
  return `GHS ${(Number(pesewas || 0) / 100).toFixed(2)}`;
}

async function sendBookingCreatedEmail(bookingId, paymentUrl) {
  const booking = getBookingDetails(bookingId);
  if (!booking || !booking.email_notifications) return;

  await sendMail({
    to: booking.email,
    subject: `Tour booking started: ${booking.destination}`,
    text: `Hi ${booking.name},

We have reserved a pending booking for your tour plan:
Tour: ${booking.destination}
Date: ${booking.date_label}
Amount: ${formatAmount(booking.amount_pesewas)}
Payment status: Pending

Complete payment here:
${paymentUrl}

We will email you again when payment is confirmed.
EXE TOURS`,
  });
}

async function sendPaymentConfirmedEmail(bookingId) {
  const booking = getBookingDetails(bookingId);
  if (!booking || !booking.email_notifications) return;

  await sendMail({
    to: booking.email,
    subject: `Payment confirmed: ${booking.destination}`,
    text: `Hi ${booking.name},

Your EXE TOURS payment has been confirmed.
Tour: ${booking.destination}
Date: ${booking.date_label}
Amount paid: ${formatAmount(booking.amount_pesewas)}
Reference: ${booking.paystack_reference}

Please keep this email for your records. We will send important tour-date updates to this address.
EXE TOURS`,
  });
}

module.exports = { sendBookingCreatedEmail, sendPaymentConfirmedEmail };