function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str ?? "";
    return div.innerHTML;
}

function formatGHS(pesewas) {
    return `GHS ${(pesewas / 100).toFixed(2)}`;
}

async function openPayment(path, button) {
    button.disabled = true;
    const originalText = button.textContent;
    button.textContent = "Opening payment...";
    try {
        const result = await api.post(path);
        window.location.href = result.authorizationUrl;
    } catch (err) {
        button.disabled = false;
        button.textContent = originalText;
        alert(err.message || "Could not start payment.");
    }
}

async function loadTours() {
    const catalog = document.getElementById("tour-catalog");
    try {
        const tours = await api.get("/tours");
        if (!tours.length) {
            catalog.innerHTML = '<p class="tour-catalog-message">No upcoming tours are available yet.</p>';
            return;
        }
        catalog.innerHTML = tours
            .map(
                (tour) => `
                <article class="tour-option">
                    <img src="${escapeHtml(tour.image_path || "img/img1.jfif")}" alt="${escapeHtml(tour.destination)}" />
                    <div class="tour-option-body">
                        <h3>${escapeHtml(tour.destination)}</h3>
                        <p class="tour-option-date"><i class="fa fa-calendar"></i> ${escapeHtml(tour.date_label)}</p>
                        <p class="tour-option-price">${formatGHS(tour.price_pesewas)}</p>
                        <button class="book-btn" type="button" data-tour-id="${tour.id}">Book and pay</button>
                    </div>
                </article>`
            )
            .join("");

        catalog.querySelectorAll("[data-tour-id]").forEach((button) => {
            button.addEventListener("click", async (event) => {
                button.disabled = true;
                const originalText = button.textContent;
                button.textContent = "Opening payment...";
                try {
                    const result = await api.post("/bookings", { tourId: Number(button.dataset.tourId) });
                    window.location.href = result.authorizationUrl;
                } catch (err) {
                    button.disabled = false;
                    button.textContent = originalText;
                    alert(err.message || "Could not start payment.");
                }
            });
        });
    } catch (err) {
        catalog.innerHTML = `<p class="tour-catalog-message">Could not load tours: ${escapeHtml(err.message)}</p>`;
    }
}

function setProfileMessage(message, isError = false) {
    const box = document.getElementById("profile-message");
    box.textContent = message;
    box.style.color = isError ? "#ff9b9b" : "#b7f7c2";
}

function renderProfile(profile) {
    document.getElementById("profile-name").value = profile.name || "";
    document.getElementById("profile-phone").value = profile.phone || "";
    document.getElementById("profile-country").value = profile.country || "";
    document.getElementById("profile-preferences").value = profile.travel_preferences || "";
    document.getElementById("email-notifications").checked = Boolean(profile.email_notifications);
    if (profile.avatar_path) {
        document.getElementById("profile-avatar").src = profile.avatar_path;
    }
}

async function loadProfile() {
    const profile = await api.get("/profile");
    renderProfile(profile);
}

async function saveProfile(event) {
    event.preventDefault();
    const form = document.getElementById("profile-form");
    const submit = form.querySelector("button[type='submit']");
    const body = new FormData(form);
    body.set("email_notifications", document.getElementById("email-notifications").checked ? "1" : "0");
    submit.disabled = true;
    setProfileMessage("Saving...");

    try {
        const profile = await api.put("/profile", body);
        renderProfile(profile);
        form.querySelector("input[type='file']").value = "";
        setProfileMessage("Planning details saved.");
    } catch (err) {
        setProfileMessage(err.message || "Could not save your details.", true);
    } finally {
        submit.disabled = false;
    }
}

document.getElementById("profile-avatar-input").addEventListener("change", (event) => {
    const file = event.target.files[0];
    if (file) document.getElementById("profile-avatar").src = URL.createObjectURL(file);
});

document.getElementById("profile-form").addEventListener("submit", saveProfile);

(async function loadAccount() {
    try {
        await Promise.all([api.get("/auth/me"), loadProfile()]);
    } catch {
        window.location.href = "login.html";
        return;
    }

    loadTours();
    const tbody = document.getElementById("bookings-tbody");
    try {
        const bookings = await api.get("/bookings/mine");
        if (!bookings.length) {
            tbody.innerHTML = '<tr><td colspan="5">You have no bookings yet.</td></tr>';
            return;
        }
        tbody.innerHTML = bookings
            .map(
                (b) => `
                <tr>
                    <td data-label="Tour">${escapeHtml(b.destination)}</td>
                    <td data-label="Date">${escapeHtml(b.date_label)}</td>
                    <td data-label="Amount">${formatGHS(b.amount_pesewas)}</td>
                    <td data-label="Status"><span class="status-pill status-${b.status}">${b.status}</span></td>
                    <td data-label="Next step">${b.status === "pending" ? `<button class="booking-pay-btn" type="button" data-booking-id="${b.id}">Pay now</button>` : '<span aria-label="No action needed">Complete</span>'}</td>
                </tr>`
            )
            .join("");
    } catch (err) {
        tbody.innerHTML = `<tr><td colspan="5">Could not load bookings: ${escapeHtml(err.message)}</td></tr>`;
    }

    tbody.querySelectorAll("[data-booking-id]").forEach((button) => {
        button.addEventListener("click", () => openPayment(`/bookings/${button.dataset.bookingId}/pay`, button));
    });
})();
