// Vercel Serverless Function
// Aktifkan integrasi hanya jika Anda memiliki izin menggunakan API penyedia.
// Jangan menaruh signature, token, atau kredensial rahasia di frontend.

function json(res, status, body) {
  res.status(status).setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  return res.send(JSON.stringify(body));
}

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return json(res, 405, { error: "Method tidak diizinkan." });
  }

  const gameId = String(req.body?.gameId ?? "").trim();
  if (!/^\d{5,24}$/.test(gameId)) {
    return json(res, 400, { error: "Game ID tidak valid." });
  }

  // Default aman: integrasi eksternal tidak aktif sampai pemilik mengonfigurasikannya.
  if (process.env.ENABLE_CEKSKIN_API !== "true") {
    return json(res, 503, {
      error: "API belum dikonfigurasi. Atur ENABLE_CEKSKIN_API=true hanya jika penggunaan API ini sudah diizinkan."
    });
  }

  const base = (process.env.CEKSKIN_BASE_URL || "https://cekskin.com").replace(/\/$/, "");
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  try {
    // Alur ini mengikuti endpoint yang teramati pada frontend:
    // POST /api/encrypt -> POST /api/players/{id}/lookup -> GET /api/players/{id}/skins
    // Tidak ada upaya melewati autentikasi, kredit, atau pembatasan provider.
    const signResponse = await fetch(`${base}/api/encrypt`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Accept": "application/json" },
      body: JSON.stringify({ gameId }),
      signal: controller.signal
    });
    const signData = await signResponse.json().catch(() => ({}));
    if (!signResponse.ok || !signData.sig || signData.ts === undefined) {
      return json(res, signResponse.status || 502, {
        error: signData.error || "Penyedia API tidak memberikan signature. Integrasi mungkin membutuhkan akses atau autentikasi tambahan."
      });
    }

    const signedHeaders = {
      "x-signature": String(signData.sig),
      "x-timestamp": String(signData.ts),
      "Accept": "application/json"
    };

    const lookupResponse = await fetch(`${base}/api/players/${encodeURIComponent(gameId)}/lookup`, {
      method: "POST",
      headers: signedHeaders,
      signal: controller.signal
    });
    const lookupData = await lookupResponse.json().catch(() => ({}));
    if (!lookupResponse.ok) {
      const message = lookupResponse.status === 401
        ? "Penyedia API meminta autentikasi (401)."
        : lookupResponse.status === 402
          ? "Penyedia API melaporkan kuota/kredit tidak tersedia (402)."
          : (lookupData.error || `Lookup gagal (${lookupResponse.status}).`);
      return json(res, lookupResponse.status, { error: message });
    }

    const skinsResponse = await fetch(`${base}/api/players/${encodeURIComponent(gameId)}/skins`, {
      method: "GET",
      headers: signedHeaders,
      signal: controller.signal
    });
    const skinsData = await skinsResponse.json().catch(() => ({}));
    if (!skinsResponse.ok) {
      return json(res, skinsResponse.status, {
        error: skinsData.error || `Pengambilan koleksi gagal (${skinsResponse.status}).`
      });
    }

    const skins = Array.isArray(skinsData.skins) ? skinsData.skins : [];
    const heroes = new Set(skins.map(s => s.heroName || s.hero).filter(Boolean));
    return json(res, 200, {
      gameId,
      nickname: lookupData.nickname || skinsData.nickname || "Nama tidak tersedia",
      heroCount: heroes.size,
      skinCount: skins.length,
      hasBattleStats: Boolean(skinsData.collection?.battleStats),
      skins: skins.map(s => ({
        id: s.id,
        hero: s.heroName || s.hero || "",
        skinName: s.skinName || "",
        rarity: s.rarity || "",
        imageUrl: s.imageUrl || ""
      }))
    });
  } catch (error) {
    const timedOut = error.name === "AbortError";
    return json(res, 502, {
      error: timedOut
        ? "Penyedia API tidak merespons dalam 15 detik."
        : "Tidak dapat terhubung ke penyedia API. Periksa konfigurasi dan aksesnya."
    });
  } finally {
    clearTimeout(timeout);
  }
};
