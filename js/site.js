function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str ?? "";
    return div.innerHTML;
}

function formatGHS(pesewas) {
    return `GHS ${(pesewas / 100).toFixed(2)}`;
}

async function renderEvents() {
    const row = document.getElementById("events-row");
    try {
        const events = await api.get("/events");
        if (!events.length) {
            row.innerHTML = '<p class="font-color">No events yet — check back soon.</p>';
            return;
        }
        row.innerHTML = events
            .map(
                (event) => `
                <article class="card col">
                    <img class="card-img" src="${escapeHtml(event.image_path || "img/img1.jfif")}" />
                    <h4 class="dark">${escapeHtml(event.title)}</h4>
                    <p class="font-color">${escapeHtml(event.description)}</p>
                </article>`
            )
            .join("");
    } catch (err) {
        row.innerHTML = '<p class="font-color">Could not load events right now.</p>';
    }
}

async function renderTours() {
    const tbody = document.getElementById("tours-tbody");
    try {
        const tours = await api.get("/tours");
        if (!tours.length) {
            tbody.innerHTML = '<tr><td colspan="3">No upcoming tours yet.</td></tr>';
            return;
        }
        tbody.innerHTML = tours
            .map(
                (tour) => `
                <tr>
                    <td>${escapeHtml(tour.date_label)}</td>
                    <td>${escapeHtml(tour.destination)}${tour.price_pesewas ? ` (${formatGHS(tour.price_pesewas)})` : ""}</td>
                    <td><button type="button" class="book-btn" data-tour-id="${tour.id}">Book</button></td>
                </tr>`
            )
            .join("");

        tbody.querySelectorAll(".book-btn").forEach((btn) => {
            btn.addEventListener("click", () => handleBook(Number(btn.dataset.tourId)));
        });
    } catch (err) {
        tbody.innerHTML = '<tr><td colspan="3">Could not load tours right now.</td></tr>';
    }
}

async function handleBook(tourId) {
    try {
        const result = await api.post("/bookings", { tourId });
        window.location.href = result.authorizationUrl;
    } catch (err) {
        if (err.message === "Not authenticated") {
            window.location.href = "login.html";
        } else {
            alert(err.message);
        }
    }
}

async function renderAuthNav() {
    const link = document.getElementById("auth-nav-link");
    const item = document.getElementById("auth-nav-item");
    try {
        const me = await api.get("/auth/me");
        item.innerHTML =
            (me.role === "admin" ? '<a href="admin.html" class="cir_border">Admin</a> ' : "") +
            '<a href="account.html" class="cir_border">My Bookings</a> ' +
            '<a href="#" id="logout-link" class="cir_border">Logout</a>';
        document.getElementById("logout-link").addEventListener("click", async (e) => {
            e.preventDefault();
            await api.post("/auth/logout");
            window.location.reload();
        });
    } catch {
        link.href = "login.html";
        link.textContent = "Login";
    }
}

document.addEventListener("DOMContentLoaded", () => {
    if (document.getElementById("events-row")) renderEvents();
    if (document.getElementById("tours-tbody")) renderTours();
    if (document.getElementById("auth-nav-item")) renderAuthNav();
});

if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
        navigator.serviceWorker.register("/sw.js").catch(() => {});
    });
}
