# Phone Information

An installable, mobile-first Progressive Web App (PWA) showing device information exposed by the current browser.

## Features
- Install button with browser-native prompt support and manual install instructions.
- Responsive dark dashboard.
- Browser-accessible battery, approximate RAM, origin storage estimate, connection hints, screen size, platform, and language when supported.
- Service worker for basic offline caching.
- Privacy note: this demo does not send device information to a server.

## Publish with GitHub Pages
1. Open repository **Settings → Pages**.
2. Select **Deploy from a branch**, branch `main`, folder `/ (root)`.
3. Save and wait for Pages to publish.

## Limits
A PWA cannot access all Android system information. API support varies by browser. For richer system diagnostics, a separately installed Android companion app with explicit permissions and a secure authenticated connection is required.
