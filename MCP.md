# Phone Information MCP endpoint

Endpoint after deployment: https://phone-information-tawny.vercel.app/api/mcp

This is a stateless Streamable HTTP-style MCP endpoint supporting JSON-RPC initialize, ping, tools/list, and tools/call.

## Available tools

- format_phone_information_report — format browser/device details explicitly supplied by the caller.
- get-phone-location — report coordinates supplied by a consent-based client after permission is granted.
- get-phone-time — report phone-local time and timezone supplied by the device client.
- get-location-time — combine client-supplied coordinates, time, and timezone with explicit location permission.
- get-phone-gmail — report an email address provided by the user or an authorized Google OAuth integration; does not read Gmail messages.
- get-phone-number — report a phone number explicitly supplied by the user or authorized integration.
- get_device_info — report device manufacturer/model, Android/app version, resolution, language, and timezone supplied by the client.
- get_battery_status — report battery level, charging state, health, and temperature supplied by the client.
- get_storage_info — report internal/external storage and RAM figures supplied by the client.
- get_network_type — report connection type, cellular generation, carrier, signal level, and optional Wi-Fi SSID supplied by the client.
- get_connection_status — report online, internet, Wi-Fi, cellular, and VPN status supplied by the client.

## Important limitations and privacy

The MCP server runs remotely and cannot inspect the Android device, browser session, GPS, battery, storage, SIM, or network by itself. Device-dependent values must be explicitly supplied by a trusted client, with permission where applicable. Values are not independently verified. Do not send passwords, IMEI, serial numbers, or other sensitive identifiers. Share precise location and Wi-Fi network names only when necessary.

## Connecting

In a client that supports custom remote MCP servers, add the endpoint URL above using Streamable HTTP. Some ChatGPT custom MCP features may be desktop-only; adding this endpoint does not override client-side restrictions.
