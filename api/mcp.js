// Stateless MCP endpoint for Vercel serverless functions.
// This endpoint formats device details explicitly supplied by the caller.
// It cannot inspect a visitor's phone automatically.
const PROTOCOL_VERSION = "2025-03-26";

function jsonRpcError(id, code, message) {
  return { jsonrpc: "2.0", id: id ?? null, error: { code, message } };
}

function textResult(text) {
  return {
    content: [{ type: "text", text }],
    structuredContent: { report: text },
    isError: false
  };
}

const tools = [
  {
    name: "format_phone_information_report",
    description: "Format device information that the caller explicitly provides. This tool cannot detect or access the caller's phone by itself. Do not include passwords, IMEI, serial numbers, or other sensitive identifiers.",
    inputSchema: {
      type: "object",
      properties: {
        platform: { type: "string", description: "Platform reported by the device browser, for example Android" },
        browser: { type: "string", description: "Browser name, if known" },
        screen: { type: "string", description: "Screen dimensions and pixel ratio, if known" },
        language: { type: "string", description: "Browser language, if known" },
        online: { type: "string", description: "Online status reported by the browser" },
        battery: { type: "string", description: "Battery level/status only if the browser exposed it" },
        memory: { type: "string", description: "Approximate browser-reported memory, if available" },
        storage: { type: "string", description: "Origin storage estimate, if available" },
        network: { type: "string", description: "Browser-reported network type, if available" },
        userAgent: { type: "string", description: "Optional browser user-agent string; omit if not needed" }
      },
      additionalProperties: false
    }
  }
];

function handleRpc(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return { status: 400, body: jsonRpcError(null, -32600, "Invalid JSON-RPC request") };
  }
  const { id, method, params } = body;
  if (body.jsonrpc !== "2.0" || typeof method !== "string") {
    return { status: 400, body: jsonRpcError(id, -32600, "Invalid JSON-RPC request") };
  }

  if (method === "notifications/initialized" || method === "notifications/cancelled") {
    return { status: 202, body: null };
  }

  if (method === "initialize") {
    return {
      status: 200,
      body: {
        jsonrpc: "2.0",
        id,
        result: {
          protocolVersion: PROTOCOL_VERSION,
          capabilities: { tools: {} },
          serverInfo: { name: "phone-information-mcp", version: "1.0.0" },
          instructions: "This server only formats device details explicitly provided by the caller. It does not automatically access a phone or the Phone Information website."
        }
      }
    };
  }

  if (method === "ping") {
    return { status: 200, body: { jsonrpc: "2.0", id, result: {} } };
  }

  if (method === "tools/list") {
    return { status: 200, body: { jsonrpc: "2.0", id, result: { tools } } };
  }

  if (method === "tools/call") {
    const name = params && params.name;
    const args = (params && params.arguments) || {};
    if (name !== "format_phone_information_report") {
      return { status: 200, body: { jsonrpc: "2.0", id, result: { ...textResult("Unknown tool."), isError: true } } };
    }
    const allowed = ["platform", "browser", "screen", "language", "online", "battery", "memory", "storage", "network", "userAgent"];
    const lines = allowed
      .filter((key) => typeof args[key] === "string" && args[key].trim())
      .map((key) => key + ": " + args[key].trim().slice(0, 500));
    const report = lines.length
      ? "Phone Information report (provided by caller; not independently verified):\n" + lines.join("\n") + "\n\nPrivacy note: browser-based information can be incomplete. This tool did not access the device directly."
      : "No device details were supplied. Open Phone Information on the device and provide the visible details to the caller first.";
    return { status: 200, body: { jsonrpc: "2.0", id, result: textResult(report) } };
  }

  if (id === undefined) {
    return { status: 202, body: null };
  }
  return { status: 200, body: jsonRpcError(id, -32601, "Method not found") };
}

module.exports = function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Accept, MCP-Protocol-Version, Mcp-Session-Id");
  res.setHeader("Cache-Control", "no-store");

  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST, OPTIONS");
    return res.status(405).json({ error: "Use POST with a JSON-RPC MCP request." });
  }

  const body = req.body;
  const result = handleRpc(body);
  if (result.body === null) return res.status(result.status).end();
  return res.status(result.status).json(result.body);
};
