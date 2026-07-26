require("dotenv").config();
const path = require("path");
const express = require("express");
const cookieParser = require("cookie-parser");
const multer = require("multer");

const authRoutes = require("./routes/auth");
const tourRoutes = require("./routes/tours");
const eventRoutes = require("./routes/events");
const contactRoutes = require("./routes/contact");
const bookingRoutes = require("./routes/bookings");
const profileRoutes = require("./routes/profile");
const { router: paymentRoutes, webhookHandler } = require("./routes/payments");

if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = "exetours-dev-secret";
  console.warn("JWT_SECRET was not set, using a development fallback for local testing.");
}

const app = express();
const ROOT = path.join(__dirname, "..");

app.use(cookieParser());

// Paystack webhook needs the raw body for signature verification, so it's
// registered before the global JSON body parser below.
app.post("/api/payments/webhook", express.raw({ type: "application/json" }), webhookHandler);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api/auth", authRoutes);
app.use("/api/tours", tourRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/contact", contactRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/payments", paymentRoutes);

app.use("/uploads", express.static(path.join(ROOT, "uploads")));
app.use(express.static(ROOT));

app.use((err, _req, res, next) => {
  if (err instanceof multer.MulterError || err.message?.includes("images are allowed")) {
    return res.status(400).json({ error: err.message });
  }
  next(err);
});

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`EXE Tours server running at http://localhost:${PORT}`);
});
