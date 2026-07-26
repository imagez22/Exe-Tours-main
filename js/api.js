const API_BASE = window.EXE_TOURS_API_URL || "/api";

const api = {
    async request(path, { method = "GET", body } = {}) {
        const isFormData = body instanceof FormData;
        let res;
        try {
            res = await fetch(`${API_BASE}${path}`, {
                method,
                credentials: API_BASE.startsWith("/") ? "same-origin" : "include",
                headers: isFormData ? undefined : { "Content-Type": "application/json" },
                body: body ? (isFormData ? body : JSON.stringify(body)) : undefined,
            });
        } catch {
            throw new Error("Unable to connect to EXE TOURS. Start the server with npm start or check the API URL.");
        }

        let data = null;
        try {
            data = await res.json();
        } catch {
            /* no JSON body */
        }

        if (!res.ok) {
            throw new Error((data && data.error) || res.statusText);
        }
        return data;
    },
    get(path) {
        return this.request(path);
    },
    post(path, body) {
        return this.request(path, { method: "POST", body });
    },
    put(path, body) {
        return this.request(path, { method: "PUT", body });
    },
    delete(path) {
        return this.request(path, { method: "DELETE" });
    },
};
