export async function notify(event, payload) {
  const url = process.env.N8N_WEBHOOK_URL;

  if (!url) {
    console.log("[notify:mock]", event, payload);
    return;
  }

  try {
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event, ...payload }),
    });
  } catch (e) {
    console.error("Notify failed:", e.message);
  }
}
