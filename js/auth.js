const tabLogin = document.getElementById("tab-login");
const tabSignup = document.getElementById("tab-signup");
const loginForm = document.getElementById("login-form");
const signupForm = document.getElementById("signup-form");
const messageBox = document.getElementById("auth-message");
const toggleButtons = document.querySelectorAll("[data-toggle]");

function showTab(tab) {
    clearMessage();
    const isLogin = tab === "login";
    tabLogin.classList.toggle("active", isLogin);
    tabSignup.classList.toggle("active", !isLogin);
    loginForm.classList.toggle("active", isLogin);
    signupForm.classList.toggle("active", !isLogin);
}

function clearMessage() {
    messageBox.className = "auth-message";
    messageBox.textContent = "";
}

function showMessage(type, message) {
    messageBox.className = `auth-message ${type}`;
    messageBox.textContent = message;
}

function setBusy(form, isBusy) {
    const button = form.querySelector("button[type='submit']");
    if (button) {
        button.disabled = isBusy;
        button.textContent = isBusy ? "Working..." : form.id === "login-form" ? "Login" : "Create account";
    }
}

function afterAuth(user) {
    window.location.href = user.role === "admin" ? "admin.html" : "account.html";
}

function togglePassword(inputId) {
    const input = document.getElementById(inputId);
    if (!input) return;
    input.type = input.type === "password" ? "text" : "password";
}

tabLogin.addEventListener("click", () => showTab("login"));
tabSignup.addEventListener("click", () => showTab("signup"));

toggleButtons.forEach((button) => {
    button.addEventListener("click", () => togglePassword(button.getAttribute("data-toggle")));
});

(async function bootAuth() {
    try {
        const user = await api.get("/auth/me");
        if (user) {
            afterAuth(user);
        }
    } catch {
        // Not signed in yet; stay on the page.
    }
})();

loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    clearMessage();
    setBusy(loginForm, true);
    try {
        const user = await api.post("/auth/login", {
            email: document.getElementById("login-email").value.trim(),
            password: document.getElementById("login-password").value,
        });
        showMessage("success", `Welcome back, ${user.name || "traveler"}!`);
        setTimeout(() => afterAuth(user), 400);
    } catch (err) {
        showMessage("error", err.message || "Unable to sign you in right now.");
    } finally {
        setBusy(loginForm, false);
    }
});

signupForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    clearMessage();
    const password = document.getElementById("signup-password").value;
    const confirmPassword = document.getElementById("signup-confirm-password").value;

    if (password !== confirmPassword) {
        showMessage("error", "Passwords do not match.");
        return;
    }

    setBusy(signupForm, true);
    try {
        const user = await api.post("/auth/signup", {
            name: document.getElementById("signup-name").value.trim(),
            email: document.getElementById("signup-email").value.trim(),
            password,
        });
        showMessage("success", `Account created. Welcome, ${user.name || "traveler"}!`);
        setTimeout(() => afterAuth(user), 400);
    } catch (err) {
        showMessage("error", err.message || "Unable to create your account right now.");
    } finally {
        setBusy(signupForm, false);
    }
});
