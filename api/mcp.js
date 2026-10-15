const PROTOCOL_VERSION = "2025-03-26";

function jsonRpcError(id, code, message) {
  return { jsonrpc: "2.0", id: id ?? null, error: { code, message } };
}
function textResult(text, data = {}) {
  return { content: [{ type: "text", text }], structuredContent: { report: text, ...data }, isError: false };
}
const tools = [
  { name: "format_phone_information_report", description: "Format device details explicitly supplied by the caller; cannot inspect the phone itself. Never include passwords, IMEI, or serial numbers.", inputSchema: { type: "object", properties: { platform: {type:"string"}, browser:{type:"string"}, screen:{type:"string"}, language:{type:"string"}, online:{type:"string"}, battery:{type:"string"}, memory:{type:"string"}, storage:{type:"string"}, network:{type:"string"}, userAgent:{type:"string"} }, additionalProperties:false } },
  { name: "get-phone-location", description: "Report coordinates supplied by a consent-based browser/app client after the user grants location permission. This remote server cannot access GPS by itself.", inputSchema: { type:"object", properties:{ latitude:{type:"number"}, longitude:{type:"number"}, accuracyMeters:{type:"number"}, permissionGranted:{type:"boolean"} }, required:["permissionGranted"], additionalProperties:false } },
  { name: "get-phone-time", description: "Report phone-local time and timezone supplied by the device client. The remote server cannot read the phone clock directly.", inputSchema: { type:"object", properties:{ deviceTime:{type:"string",description:"Phone-local ISO 8601 date/time supplied by the client"}, timeZone:{type:"string",description:"IANA timezone, e.g. Asia/Jerusalem"} }, additionalProperties:false } },
  { name: "get-location-time", description: "Combine coordinates, local time, and timezone explicitly supplied by a consent-based device client. Does not infer the caller's location.", inputSchema: { type:"object", properties:{ latitude:{type:"number"}, longitude:{type:"number"}, timeZone:{type:"string"}, deviceTime:{type:"string"}, permissionGranted:{type:"boolean"} }, required:["permissionGranted"], additionalProperties:false } },
  { name: "get-phone-gmail", description: "Report an email address supplied by the user or an authorized Google OAuth integration. Does not automatically discover accounts or read Gmail messages.", inputSchema: { type:"object", properties:{ email:{type:"string"}, source:{type:"string",enum:["user-provided","google-oauth"]}, consentGranted:{type:"boolean"} }, required:["consentGranted"], additionalProperties:false } },
  { name: "get-phone-number", description: "Report a phone number explicitly supplied by the user or an authorized integration with consent. Web browsers generally cannot read the SIM number.", inputSchema: { type:"object", properties:{ phoneNumber:{type:"string"}, consentGranted:{type:"boolean"} }, required:["consentGranted"], additionalProperties:false } }
  { name: "get_device_info", description: "Format device details supplied by the Phone Information client; this server cannot inspect hardware directly.", inputSchema: { type:"object", properties:{ manufacturer:{type:"string"}, model:{type:"string"}, androidVersion:{type:"string"}, appVersion:{type:"string"}, screenResolution:{type:"string"}, language:{type:"string"}, timeZone:{type:"string"} }, additionalProperties:false } },
  { name: "get_battery_status", description: "Report battery values supplied by the device client; no direct server-side battery access.", inputSchema: { type:"object", properties:{ levelPercent:{type:"number"}, charging:{type:"boolean"}, chargingType:{type:"string"}, batteryHealth:{type:"string"}, temperatureC:{type:"number"}, estimatedTimeRemaining:{type:"string"} }, additionalProperties:false } },
  { name: "get_storage_info", description: "Report storage and RAM figures supplied by the device client. Values are not independently verified.", inputSchema: { type:"object", properties:{ internalTotalBytes:{type:"number"}, internalFreeBytes:{type:"number"}, externalTotalBytes:{type:"number"}, externalFreeBytes:{type:"number"}, ramTotalBytes:{type:"number"}, ramAvailableBytes:{type:"number"} }, additionalProperties:false } },
  { name: "get_network_type", description: "Report network type and signal details supplied by the device client. Does not scan networks or collect data itself.", inputSchema: { type:"object", properties:{ connectionType:{type:"string"}, cellularGeneration:{type:"string"}, carrier:{type:"string"}, signalStrengthPercent:{type:"number"}, wifiSsid:{type:"string"} }, additionalProperties:false } },
  { name: "get_connection_status", description: "Report internet and connection status supplied by the device client. Does not test connectivity unless the client supplies the result.", inputSchema: { type:"object", properties:{ online:{type:"boolean"}, internetReachable:{type:"boolean"}, wifiConnected:{type:"boolean"}, cellularConnected:{type:"boolean"}, vpnActive:{type:"boolean"}, checkedAt:{type:"string"} }, additionalProperties:false } }

];
function handleTool(name, a) {
  if (name === "format_phone_information_report") {
    const keys=["platform","browser","screen","language","online","battery","memory","storage","network","userAgent"];
    const lines=keys.filter(k=>typeof a[k]==="string"&&a[k].trim()).map(k=>k+": "+a[k].trim().slice(0,500));
    return textResult(lines.length ? "Phone Information report (provided by caller; not independently verified):\n"+lines.join("\n")+"\n\nThis tool did not access the device directly." : "No device details were supplied. Open Phone Information on the device and provide the visible details.");
  }
  if (name === "get-phone-location") {
    if(a.permissionGranted!==true) return textResult("Location not returned. Explicit location permission is required.");
    if(!Number.isFinite(a.latitude)||!Number.isFinite(a.longitude)) return textResult("Location unavailable: no coordinates were supplied by the consent-based browser/app client. This server cannot read GPS by itself.");
    if(a.latitude < -90 || a.latitude > 90 || a.longitude < -180 || a.longitude > 180) return textResult("Invalid coordinates.");
    const d={latitude:a.latitude,longitude:a.longitude}; if(Number.isFinite(a.accuracyMeters)&&a.accuracyMeters>=0)d.accuracyMeters=a.accuracyMeters;
    return textResult("Location supplied by the consent-based client (not independently verified): "+JSON.stringify(d)+". Coordinates are sensitive; share only when needed.",d);
  }
  if (name === "get-phone-time") {
    if(typeof a.deviceTime!=="string"||!a.deviceTime.trim()) return textResult("Phone-local time unavailable: the device client did not supply it. This server cannot read the phone clock directly.");
    const d={deviceTime:a.deviceTime.trim().slice(0,100)}; if(typeof a.timeZone==="string"&&a.timeZone.trim())d.timeZone=a.timeZone.trim().slice(0,100);
    return textResult("Phone time supplied by the client (not independently verified): "+JSON.stringify(d),d);
  }
  if (name === "get-location-time") {
    if(a.permissionGranted!==true)return textResult("Location-time not returned. Explicit location permission is required.");
    if(!Number.isFinite(a.latitude)||!Number.isFinite(a.longitude))return textResult("Location-time unavailable: no coordinates were supplied after permission.");
    if(a.latitude < -90 || a.latitude > 90 || a.longitude < -180 || a.longitude > 180)return textResult("Invalid coordinates.");
    const d={latitude:a.latitude,longitude:a.longitude}; if(typeof a.timeZone==="string"&&a.timeZone.trim())d.timeZone=a.timeZone.trim().slice(0,100); if(typeof a.deviceTime==="string"&&a.deviceTime.trim())d.deviceTime=a.deviceTime.trim().slice(0,100);
    const missing=[];if(!d.timeZone)missing.push("timezone");if(!d.deviceTime)missing.push("phone-local time");
    return textResult("Location/time supplied by the client (not independently verified): "+JSON.stringify(d)+(missing.length?". Missing: "+missing.join(", "):""),d);
  }
  if (name === "get-phone-gmail") {
    if(a.consentGranted!==true)return textResult("Email not returned. Explicit user consent is required.");
    if(typeof a.email!=="string"||!a.email.trim())return textResult("No email supplied. Configure Google OAuth with appropriate consent, or have the user provide the address. This tool cannot discover the account automatically.");
    const d={email:a.email.trim().slice(0,254),source:a.source==="google-oauth"?"google-oauth":"user-provided"};
    return textResult("Email supplied with user consent: "+JSON.stringify(d)+". Gmail messages were not accessed.",d);
  }
  if (name === "get-phone-number") {
    if(a.consentGranted!==true)return textResult("Phone number not returned. Explicit user consent is required.");
    if(typeof a.phoneNumber!=="string"||!a.phoneNumber.trim())return textResult("No number supplied. A website generally cannot read the SIM phone number; the user must enter it or an authorized native integration must provide it.");
    const d={phoneNumber:a.phoneNumber.trim().slice(0,40)};
    return textResult("Phone number supplied with user consent: "+JSON.stringify(d)+". It was not read from the SIM by this server.",d);
  }

  if (name === "get_device_info") {
    const fields={manufacturer:"Manufacturer",model:"Model",androidVersion:"Android version",appVersion:"App version",screenResolution:"Screen resolution",language:"Language",timeZone:"Timezone"};
    const d={}; for(const [k,label] of Object.entries(fields)) if(typeof a[k]==="string"&&a[k].trim())d[k]=a[k].trim().slice(0,200);
    return textResult(Object.keys(d).length ? "Device info supplied by client (not independently verified):\n"+Object.entries(d).map(([k,v])=>fields[k]+": "+v).join("\n") : "No device details supplied. A device client must provide these values.",d);
  }
  if (name === "get_battery_status") {
    const d={}; if(Number.isFinite(a.levelPercent))d.levelPercent=Math.max(0,Math.min(100,a.levelPercent)); if(typeof a.charging==="boolean")d.charging=a.charging;
    for(const k of ["chargingType","batteryHealth","estimatedTimeRemaining"])if(typeof a[k]==="string"&&a[k].trim())d[k]=a[k].trim().slice(0,200);
    if(Number.isFinite(a.temperatureC))d.temperatureC=a.temperatureC;
    return textResult(Object.keys(d).length ? "Battery data supplied by client (not independently verified): "+JSON.stringify(d) : "Battery status unavailable: no values supplied.",d);
  }
  if (name === "get_storage_info") {
    const d={}; for(const k of ["internalTotalBytes","internalFreeBytes","externalTotalBytes","externalFreeBytes","ramTotalBytes","ramAvailableBytes"])if(Number.isFinite(a[k])&&a[k]>=0)d[k]=a[k];
    return textResult(Object.keys(d).length ? "Storage/RAM data supplied by client in bytes (not independently verified): "+JSON.stringify(d) : "Storage/RAM data unavailable: no values supplied.",d);
  }
  if (name === "get_network_type") {
    const d={}; for(const k of ["connectionType","cellularGeneration","carrier","wifiSsid"])if(typeof a[k]==="string"&&a[k].trim())d[k]=a[k].trim().slice(0,200);
    if(Number.isFinite(a.signalStrengthPercent))d.signalStrengthPercent=Math.max(0,Math.min(100,a.signalStrengthPercent));
    return textResult(Object.keys(d).length ? "Network data supplied by client (not independently verified): "+JSON.stringify(d) : "Network details unavailable: no values supplied.",d);
  }
  if (name === "get_connection_status") {
    const d={}; for(const k of ["online","internetReachable","wifiConnected","cellularConnected","vpnActive"])if(typeof a[k]==="boolean")d[k]=a[k];
    if(typeof a.checkedAt==="string"&&a.checkedAt.trim())d.checkedAt=a.checkedAt.trim().slice(0,100);
    return textResult(Object.keys(d).length ? "Connection status supplied by client (not independently verified): "+JSON.stringify(d) : "Connection status unavailable: no values supplied.",d);
  }
  return null;
}
function handleRpc(body) {
  if(!body||typeof body!=="object"||Array.isArray(body))return {status:400,body:jsonRpcError(null,-32600,"Invalid JSON-RPC request")};
  const {id,method,params}=body;
  if(body.jsonrpc!=="2.0"||typeof method!=="string")return {status:400,body:jsonRpcError(id,-32600,"Invalid JSON-RPC request")};
  if(method==="notifications/initialized"||method==="notifications/cancelled")return {status:202,body:null};
  if(method==="initialize")return {status:200,body:{jsonrpc:"2.0",id,result:{protocolVersion:PROTOCOL_VERSION,capabilities:{tools:{}},serverInfo:{name:"phone-information-mcp",version:"1.2.0"},instructions:"Tools report only values explicitly supplied by the caller or a consent-based client. The server cannot independently access Android GPS, the phone clock, SIM phone number, or Google account."}}};
  if(method==="ping")return {status:200,body:{jsonrpc:"2.0",id,result:{}}};
  if(method==="tools/list")return {status:200,body:{jsonrpc:"2.0",id,result:{tools}}};
  if(method==="tools/call"){
    const result=handleTool(params&&params.name,(params&&params.arguments)||{});
    return {status:200,body:{jsonrpc:"2.0",id,result:result||{...textResult("Unknown tool."),isError:true}}};
  }
  if(id===undefined)return {status:202,body:null};
  return {status:200,body:jsonRpcError(id,-32601,"Method not found")};
}
module.exports=function handler(req,res){
  res.setHeader("Access-Control-Allow-Origin","*");
  res.setHeader("Access-Control-Allow-Methods","POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers","Content-Type, Accept, MCP-Protocol-Version, Mcp-Session-Id");
  res.setHeader("Cache-Control","no-store");
  if(req.method==="OPTIONS")return res.status(204).end();
  if(req.method!=="POST"){res.setHeader("Allow","POST, OPTIONS");return res.status(405).json({error:"Use POST with a JSON-RPC MCP request."});}
  const result=handleRpc(req.body);
  if(result.body===null)return res.status(result.status).end();
  return res.status(result.status).json(result.body);
};
