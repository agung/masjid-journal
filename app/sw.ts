import { clientsClaim } from 'workbox-core'
import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching'
import { registerRoute } from 'workbox-routing'
import { NetworkFirst, StaleWhileRevalidate } from 'workbox-strategies'

declare const self: {
  __WB_MANIFEST: Array<{ url: string; revision?: string }>
  addEventListener(type: 'message', listener: (event: MessageEvent) => void): void
  skipWaiting(): Promise<void>
}

clientsClaim()
precacheAndRoute(self.__WB_MANIFEST)
cleanupOutdatedCaches()
registerRoute(({ request }) => request.mode === 'navigate', new NetworkFirst())
registerRoute(({ request }) => ['style', 'script', 'image'].includes(request.destination), new StaleWhileRevalidate())
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting()
})
