# Phone Information MCP endpoint

Endpoint after deployment:

`https://phone-information-tawny.vercel.app/api/mcp`

This is a stateless Streamable HTTP-style MCP endpoint with JSON-RPC support for `initialize`, `ping`, `tools/list`, and `tools/call`.

## Tool

- `format_phone_information_report`: formats device details explicitly supplied by the caller.

## Important limitation

The MCP server runs remotely and cannot inspect the Android device or browser session that is viewing the PWA. The caller must explicitly provide the browser-exposed details. The endpoint does not collect or persist device details. Never send passwords, IMEI, serial numbers, or other sensitive identifiers.

## Connecting

In a client that supports custom remote MCP servers, add the endpoint URL above using Streamable HTTP. Some ChatGPT custom MCP features may be limited to desktop; adding this endpoint does not override a ChatGPT client-side `Desktop only` restriction.
