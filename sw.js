/* Ad-racer 업무톡 — 서비스 워커
 * 앱 화면 파일만 보관해서 빨리 열리게 해요. 대화 데이터는 저장하지 않아요.
 * 화면 파일을 고쳐 올릴 때 VERSION 숫자를 하나 올리면 모든 폰이 새 버전을 받아요.
 */
const VERSION = 'adracer-talk-v4';
const SHELL = ['./', 'index.html', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png', 'apple-touch-icon.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;                       // 서버 호출(POST)은 건드리지 않음
  const url = new URL(req.url);

  // 앱 화면: 인터넷이 되면 항상 최신, 안 되면 보관본
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req.url, {cache: 'no-cache', credentials: 'same-origin'}).then(res => {   // 항상 서버에 새 버전 확인
        const copy = res.clone();
        caches.open(VERSION).then(c => c.put('index.html', copy));
        return res;
      }).catch(() => caches.match('index.html'))
    );
    return;
  }

  // 아이콘·글꼴: 보관본 먼저
  if (url.origin === location.origin || /fonts\.(googleapis|gstatic)\.com$/.test(url.hostname)) {
    e.respondWith(
      caches.match(req).then(hit => hit || fetch(req).then(res => {
        if (res.ok || res.type === 'opaque') { const copy = res.clone(); caches.open(VERSION).then(c => c.put(req, copy)); }
        return res;
      }))
    );
  }
});
