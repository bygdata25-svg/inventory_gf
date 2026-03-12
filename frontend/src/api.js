import { clearAuth, getToken } from "./auth";
import { showGlobalToast } from "./toast";

export function makeApiClient({ onUnauthorized } = {}) {
  async function request(url, options = {}) {
    const token = getToken();
    const isFormData = options.body instanceof FormData;

    const headers = {
      ...(options.headers || {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    };

    // Nunca forzar Content-Type cuando el body es FormData
    if (isFormData) {
      delete headers["Content-Type"];
    }

    const r = await fetch(url, {
      ...options,
      headers
    });

    if (r.status === 401) {
      clearAuth();
      onUnauthorized?.();
      throw { status: 401, detail: "unauthorized" };
    }

    if (r.status === 204) {
      return null;
    }

    let data = null;
    const ct = r.headers.get("content-type") || "";

    if (ct.includes("application/json")) {
      data = await r.json();
    } else {
      data = await r.text();
    }
	if (!r.ok) {
	  const message =
	    typeof data === "string"
	      ? data
	      : data?.detail || "Error en la operación";

	  showGlobalToast(message, "error");

	  throw { status: r.status, detail: data };
	}

	if (options.method && options.method !== "GET") {
	  showGlobalToast("Operación realizada correctamente", "success");
	}

	return data;

	}
