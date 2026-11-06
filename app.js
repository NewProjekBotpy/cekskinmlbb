const form = document.querySelector("#lookup-form");
const gameIdInput = document.querySelector("#game-id");
const checkButton = document.querySelector("#check-button");
const buttonLabel = document.querySelector("#button-label");
const spinner = document.querySelector("#button-spinner");
const statusBox = document.querySelector("#status");
const resultBox = document.querySelector("#result");
const skinList = document.querySelector("#skin-list");
const showMoreButton = document.querySelector("#show-more");

let currentSkins = [];
let visibleSkins = 12;

function showStatus(message, isError = false) {
  statusBox.textContent = message;
  statusBox.classList.toggle("error", isError);
  statusBox.hidden = false;
}
function setLoading(loading) {
  checkButton.disabled = loading;
  buttonLabel.textContent = loading ? "Memeriksa..." : "Cek akun";
  spinner.hidden = !loading;
}
function safeText(value, fallback = "—") {
  return value === null || value === undefined || value === "" ? fallback : String(value);
}
function renderSkins() {
  skinList.replaceChildren();
  const items = currentSkins.slice(0, visibleSkins);
  for (const skin of items) {
    const item = document.createElement("article");
    item.className = "skin-item";
    const imageUrl = typeof skin.imageUrl === "string" ? skin.imageUrl : "";
    if (imageUrl && /^https:\/\//i.test(imageUrl)) {
      const img = document.createElement("img");
      img.src = imageUrl;
      img.alt = "";
      img.loading = "lazy";
      img.referrerPolicy = "no-referrer";
      img.onerror = () => img.replaceWith(makePlaceholder());
      item.append(img);
    } else {
      item.append(makePlaceholder());
    }
    const meta = document.createElement("div");
    meta.className = "skin-meta";
    const name = document.createElement("div");
    name.className = "skin-name";
    name.textContent = safeText(skin.skinName, "Skin tanpa nama");
    const hero = document.createElement("div");
    hero.className = "skin-hero";
    hero.textContent = safeText(skin.hero || skin.heroName, "Hero tidak diketahui");
    meta.append(name, hero);
    const rarity = document.createElement("span");
    rarity.className = "skin-rarity";
    rarity.textContent = safeText(skin.rarity, "");
    item.append(meta, rarity);
    skinList.append(item);
  }
  showMoreButton.hidden = currentSkins.length <= visibleSkins;
}
function makePlaceholder() {
  const el = document.createElement("div");
  el.className = "skin-placeholder";
  el.textContent = "✦";
  return el;
}
function renderResult(data, demo = false) {
  document.querySelector("#nickname").textContent = safeText(data.nickname, "Nama tidak tersedia");
  document.querySelector("#account-id").textContent = `Game ID ${safeText(data.gameId)}`;
  document.querySelector("#hero-count").textContent = safeText(data.heroCount, "0");
  document.querySelector("#skin-count").textContent = safeText(data.skinCount, "0");
  document.querySelector("#battle-count").textContent = data.hasBattleStats ? "Ada" : "—";
  document.querySelector("#result-badge").textContent = demo ? "CONTOH" : "DATA API";
  currentSkins = Array.isArray(data.skins) ? data.skins : [];
  visibleSkins = 12;
  document.querySelector("#skin-caption").textContent = `${currentSkins.length} skin`;
  renderSkins();
  resultBox.hidden = false;
}
form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const gameId = gameIdInput.value.trim();
  if (!/^\d{5,24}$/.test(gameId)) {
    showStatus("Game ID harus berupa angka dengan panjang 5–24 digit.", true);
    return;
  }
  resultBox.hidden = true;
  statusBox.hidden = true;
  setLoading(true);
  try {
    const response = await fetch("/api/check", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ gameId })
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || "Permintaan gagal.");
    renderResult(data);
    showStatus("Data berhasil diterima dari penyedia API.");
  } catch (error) {
    showStatus(error.message || "Terjadi kesalahan saat memeriksa akun.", true);
  } finally {
    setLoading(false);
  }
});
document.querySelector("#demo-button").addEventListener("click", () => {
  gameIdInput.value = "123456789";
  renderResult({
    gameId: "123456789",
    nickname: "Contoh Player",
    heroCount: 3,
    skinCount: 4,
    hasBattleStats: true,
    skins: [
      { skinName: "Epic Showcase", hero: "Hero A", rarity: "Epic" },
      { skinName: "Special Edition", hero: "Hero B", rarity: "Special" },
      { skinName: "Elite Style", hero: "Hero C", rarity: "Elite" },
      { skinName: "Basic Look", hero: "Hero A", rarity: "Normal" }
    ]
  }, true);
  showStatus("Ini hanya data contoh untuk melihat tampilan. Bukan data akun asli.");
});
showMoreButton.addEventListener("click", () => {
  visibleSkins += 12;
  renderSkins();
});