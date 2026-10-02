const APP_URL = "http://localhost:3000/app";

const loading = document.getElementById("loading");
const offline = document.getElementById("offline");
const retry = document.getElementById("retry");
const app = document.getElementById("app");

// A network error means nothing is listening. Any HTTP answer, even the
// password page, means the app is up and the iframe can take it from there.
async function load() {
  loading.hidden = false;
  offline.hidden = true;
  retry.disabled = true;
  try {
    await fetch(APP_URL, { method: "HEAD", cache: "no-store" });
    app.src = APP_URL;
    app.hidden = false;
    loading.hidden = true;
  } catch {
    loading.hidden = true;
    offline.hidden = false;
  } finally {
    retry.disabled = false;
  }
}

retry.addEventListener("click", load);
load();
