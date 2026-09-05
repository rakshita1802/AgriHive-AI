// ---------------- api hook ----------------
function useApi(base) {
  return useCallback(async (path, opts = {}, data = null) => {
    let fetchOpts = {};
    if (typeof opts === "string") {
      fetchOpts = { method: opts };
      if (data !== null) {
        fetchOpts.body = JSON.stringify(data);
      }
    } else {
      fetchOpts = { ...opts };
    }
    fetchOpts.headers = { "Content-Type": "application/json", ...(fetchOpts.headers || {}) };
    const token = localStorage.getItem("agri_token");
    if (token) {
      fetchOpts.headers["Authorization"] = `Bearer ${token}`;
    }
    const res = await fetch(base + path, fetchOpts);
    let body = null;
    try { body = await res.json(); } catch (e) {}
    if (!res.ok) {
      const detail = body && body.detail ? (Array.isArray(body.detail) ? JSON.stringify(body.detail) : body.detail) : (res.statusText || "HTTP " + res.status);
      throw new Error(detail);
    }
    return body;
  }, [base]);
}
