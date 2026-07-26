function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str ?? "";
    return div.innerHTML;
}

function formatGHS(pesewas) {
    return `GHS ${(pesewas / 100).toFixed(2)}`;
}

const errorBox = document.getElementById("admin-error");
function showError(message) {
    errorBox.textContent = message;
    errorBox.style.display = "block";
}

document.querySelectorAll(".admin-tab-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
        document.querySelectorAll(".admin-tab-btn").forEach((b) => b.classList.remove("active"));
        document.querySelectorAll(".admin-panel").forEach((p) => p.classList.remove("active"));
        btn.classList.add("active");
        document.getElementById(btn.dataset.panel).classList.add("active");
    });
});

let editingTourId = null;
let editingEventId = null;

async function loadTours() {
    const tbody = document.getElementById("tours-admin-tbody");
    const tours = await api.get("/tours");
    if (!tours.length) {
        tbody.innerHTML = '<tr><td colspan="4">No tours yet.</td></tr>';
        return;
    }
    tbody.innerHTML = tours
        .map(
            (t) => `
            <tr>
                <td>${escapeHtml(t.date_label)}</td>
                <td>${escapeHtml(t.destination)}</td>
                <td>${formatGHS(t.price_pesewas)}</td>
                <td class="row-actions">
                    <button type="button" data-edit-tour="${t.id}">Edit</button>
                    <button type="button" data-delete-tour="${t.id}">Delete</button>
                </td>
            </tr>`
        )
        .join("");

    tbody.querySelectorAll("[data-edit-tour]").forEach((btn) => {
        btn.addEventListener("click", () => {
            const tour = tours.find((t) => t.id === Number(btn.dataset.editTour));
            editingTourId = tour.id;
            const form = document.getElementById("tour-form");
            form.date_label.value = tour.date_label;
            form.destination.value = tour.destination;
            form.description.value = tour.description || "";
            form.price_pesewas.value = tour.price_pesewas;
            form.querySelector('input[type="submit"]').value = "Update Tour";
            form.scrollIntoView({ behavior: "smooth" });
        });
    });

    tbody.querySelectorAll("[data-delete-tour]").forEach((btn) => {
        btn.addEventListener("click", async () => {
            if (!confirm("Delete this tour?")) return;
            try {
                await api.delete(`/tours/${btn.dataset.deleteTour}`);
                loadTours();
            } catch (err) {
                showError(err.message);
            }
        });
    });
}

async function loadEvents() {
    const tbody = document.getElementById("events-admin-tbody");
    const events = await api.get("/events");
    if (!events.length) {
        tbody.innerHTML = '<tr><td colspan="3">No events yet.</td></tr>';
        return;
    }
    tbody.innerHTML = events
        .map(
            (e) => `
            <tr>
                <td>${escapeHtml(e.title)}</td>
                <td>${escapeHtml(e.description)}</td>
                <td class="row-actions">
                    <button type="button" data-edit-event="${e.id}">Edit</button>
                    <button type="button" data-delete-event="${e.id}">Delete</button>
                </td>
            </tr>`
        )
        .join("");

    tbody.querySelectorAll("[data-edit-event]").forEach((btn) => {
        btn.addEventListener("click", () => {
            const event = events.find((e) => e.id === Number(btn.dataset.editEvent));
            editingEventId = event.id;
            const form = document.getElementById("event-form");
            form.title.value = event.title;
            form.description.value = event.description;
            form.querySelector('input[type="submit"]').value = "Update Event";
            form.scrollIntoView({ behavior: "smooth" });
        });
    });

    tbody.querySelectorAll("[data-delete-event]").forEach((btn) => {
        btn.addEventListener("click", async () => {
            if (!confirm("Delete this event?")) return;
            try {
                await api.delete(`/events/${btn.dataset.deleteEvent}`);
                loadEvents();
            } catch (err) {
                showError(err.message);
            }
        });
    });
}

async function loadBookings() {
    const tbody = document.getElementById("bookings-admin-tbody");
    const bookings = await api.get("/bookings");
    if (!bookings.length) {
        tbody.innerHTML = '<tr><td colspan="5">No bookings yet.</td></tr>';
        return;
    }
    tbody.innerHTML = bookings
        .map(
            (b) => `
            <tr>
                <td>${escapeHtml(b.destination)}</td>
                <td>${escapeHtml(b.user_name)} (${escapeHtml(b.user_email)})</td>
                <td>${formatGHS(b.amount_pesewas)}</td>
                <td>${escapeHtml(b.status)}</td>
                <td>${escapeHtml(b.created_at)}</td>
            </tr>`
        )
        .join("");
}

async function loadMessages() {
    const tbody = document.getElementById("messages-admin-tbody");
    const messages = await api.get("/contact");
    if (!messages.length) {
        tbody.innerHTML = '<tr><td colspan="5">No messages yet.</td></tr>';
        return;
    }
    tbody.innerHTML = messages
        .map(
            (m) => `
            <tr>
                <td>${escapeHtml(m.name)}</td>
                <td>${escapeHtml(m.email)}</td>
                <td>${escapeHtml(m.country)}</td>
                <td>${escapeHtml(m.remarks)}</td>
                <td>${escapeHtml(m.created_at)}</td>
            </tr>`
        )
        .join("");
}

document.getElementById("tour-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const form = e.target;
    const body = new FormData(form);
    try {
        if (editingTourId) {
            await api.put(`/tours/${editingTourId}`, body);
        } else {
            await api.post("/tours", body);
        }
        editingTourId = null;
        form.reset();
        form.querySelector('input[type="submit"]').value = "Add Tour";
        loadTours();
    } catch (err) {
        showError(err.message);
    }
});

document.getElementById("event-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const form = e.target;
    const body = new FormData(form);
    try {
        if (editingEventId) {
            await api.put(`/events/${editingEventId}`, body);
        } else {
            await api.post("/events", body);
        }
        editingEventId = null;
        form.reset();
        form.querySelector('input[type="submit"]').value = "Add Event";
        loadEvents();
    } catch (err) {
        showError(err.message);
    }
});

(async function init() {
    try {
        const me = await api.get("/auth/me");
        if (me.role !== "admin") {
            window.location.href = "index.html";
            return;
        }
    } catch {
        window.location.href = "login.html";
        return;
    }

    loadTours();
    loadEvents();
    loadBookings();
    loadMessages();
})();
