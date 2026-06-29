const CACHE_NAME = 'hwashin-saju-v3'
const STATIC_ASSETS = [
  '/icon-192x192.png',
  '/icon-512x512.png'
]

// 설치: 아이콘 등 정적 파일만 캐시
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(STATIC_ASSETS))
  )
  self.skipWaiting()
})

// 활성화: 이전 캐시 정리
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  )
  self.clients.claim()
})

// 요청 처리
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url)

  // index.html / 루트: 항상 네트워크 우선 → 실패 시 캐시
  if (url.pathname === '/saju/' || url.pathname === '/saju/index.html') {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          const clone = response.clone()
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone))
          return response
        })
        .catch(() => caches.match('/saju/index.html'))
    )
    return
  }

  // 아이콘 등 정적 파일: 캐시 우선
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached
      return fetch(event.request).then(response => {
        if (!response || response.status !== 200 || response.type !== 'basic') return response
        const clone = response.clone()
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone))
        return response
      })
    })
  )
})
