require("dotenv").config();
const bcrypt = require("bcryptjs");
const db = require("./db");

const eventCount = db.prepare("SELECT COUNT(*) AS n FROM events").get().n;
if (eventCount === 0) {
  const insertEvent = db.prepare(
    "INSERT INTO events (title, description, image_path) VALUES (?, ?, ?)"
  );
  insertEvent.run(
    "Mountain camp trek",
    "Experience the thrill and excitement of climbing the tallest height in the country!!.... In the safest possible company with a team dedicated to your safety and comfort",
    "img/img1.jfif"
  );
  insertEvent.run(
    "Walking holidays",
    "Join small guided group walks, enjoy a challenging trek, or a luxury private guided walk which can be made especially for you. Take pride in the simplicity of this lovely activity thats better than a doctors visit.",
    "img/img2.jfif"
  );
  insertEvent.run(
    "Serene Beaches",
    "Discover the stunning beaches of West Africa, especially in Ghana's Aflao and Keta. Enjoy pristine sands, vibrant culture, and warm hospitality, making these coastal gems perfect for relaxation and adventure.",
    "img/img2.jfif"
  );
  console.log("Seeded events.");
}

const tourCount = db.prepare("SELECT COUNT(*) AS n FROM tours").get().n;
if (tourCount === 0) {
  const insertTour = db.prepare(
    "INSERT INTO tours (date_label, destination, description, image_path, price_pesewas) VALUES (?, ?, ?, ?, ?)"
  );
  insertTour.run("Sat 7th June 2026", "Eli Beach Hotel Tour", null, "img/img3.png", 15000);
  insertTour.run("Sat 5th July 2026", "Independence Square Tour", null, "img/img4.png", 10000);
  insertTour.run("Sat 2nd August 2026", "Wli Waterfalls", null, "img/img5.png", 20000);
  console.log("Seeded tours.");
}

const adminEmail = process.env.ADMIN_EMAIL || "admin@exetours.world";
const admin = db.prepare("SELECT id FROM users WHERE email = ?").get(adminEmail);
if (!admin) {
  const adminPassword = process.env.ADMIN_PASSWORD || "changeme123";
  const hash = bcrypt.hashSync(adminPassword, 10);
  db.prepare(
    "INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, 'admin')"
  ).run("Admin", adminEmail, hash);
  console.log(`Seeded admin user: ${adminEmail} / ${adminPassword} (change this password after first login)`);
}

console.log("Seed complete.");
