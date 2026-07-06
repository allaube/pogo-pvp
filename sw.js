// 포켓몬고 PVP 계산기 서비스워커
// 전략: 페이지(HTML)는 네트워크 우선(항상 최신) + 오프라인 시 캐시, 정적 파일은 캐시 우선
const CACHE = "pogo-pvp-v1";
const ASSETS = ["./", "./manifest.webmanifest", "./icon-192.png", "./icon-512.png", "./apple-touch-icon.png"];

self.addEventListener("install", e => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)));
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET" || !req.url.startsWith(self.location.origin)) return;
  if (req.mode === "navigate") {
    // 네트워크 우선: 업데이트 즉시 반영, 실패 시(오프라인) 캐시
    e.respondWith(
      fetch(req).then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put("./", copy));
        return res;
      }).catch(() => caches.match("./"))
    );
    return;
  }
  e.respondWith(
    caches.match(req).then(hit => hit || fetch(req).then(res => {
      const copy = res.clone();
      caches.open(CACHE).then(c => c.put(req, copy));
      return res;
    }))
  );
});
