// Browser regression test using Chrome DevTools Protocol; no extra dependencies.
// Run against a disposable Chrome profile with --remote-debugging-port=9222.
import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
const base = process.env.DEMO_TEST_URL || "http://127.0.0.1:3001";
const tabs = await (await fetch("http://127.0.0.1:9222/json")).json();
const ws = new WebSocket(tabs.find(t => t.type === "page").webSocketDebuggerUrl);
await new Promise(resolve => ws.addEventListener("open", resolve, { once: true }));
let id = 0;
const pending = new Map();
const authRequests = [];
const writes = [];
const exceptions = [];
ws.addEventListener("message", event => {
  const message = JSON.parse(event.data);
  if (message.method === "Network.requestWillBeSent") {
    const request = message.params.request;
    if (/\/auth\/v1\//.test(request.url)) authRequests.push(request.url);
    if (/supabase\.co|\/api\//.test(request.url) && !["GET", "HEAD", "OPTIONS"].includes(request.method)) writes.push(new URL(request.url).pathname);
  }
  if (message.method === "Runtime.exceptionThrown") exceptions.push(message.params.exceptionDetails.text);
  if (message.id) { const callback = pending.get(message.id); pending.delete(message.id); message.error ? callback.reject(message.error) : callback.resolve(message.result); }
});
function send(method, params = {}) { return new Promise((resolve, reject) => { const next = ++id; pending.set(next, { resolve, reject }); ws.send(JSON.stringify({ id: next, method, params })); }); }
async function evaluate(expression) { const result = await send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true }); if (result.exceptionDetails) throw Error(result.exceptionDetails.text); return result.result.value; }
async function waitFor(expression) { for (let n = 0; n < 120; n++) { if (await evaluate(`Boolean(${expression})`)) return; await new Promise(resolve => setTimeout(resolve, 100)); } throw Error(`Timed out: ${expression}`); }
async function click(text, scope = "document") { const expression = `[...${scope}.querySelectorAll('button')].find(b => b.textContent.trim() === ${JSON.stringify(text)} && !b.disabled)`; await waitFor(expression); await evaluate(`${expression}.click()`); }
const sessionKey = "jansamvad.demo.session.v1";
const workspaceKey = "jansamvad.demo.workspace.v1";
const session = `JSON.parse(sessionStorage.getItem('${sessionKey}') || 'null')`;
const project = `JSON.parse(sessionStorage.getItem('${workspaceKey}')).projects[0]`;
const roles = [
  ["admin", "Admin", "/admin", "Government dashboard"],
  ["officer", "Officer", "/officer", "Officer dashboard"],
  ["university_admin", "University", "/university", "University dashboard"],
  ["industry_partner", "Industry", "/industry", "Industry dashboard"],
  ["citizen", "Citizen", "/dashboard", "Citizen dashboard"],
];
async function openModal() {
  await waitFor(`[...document.querySelectorAll('button')].some(b => /Portal|Officer Mode|Admin HQ/.test(b.textContent))`);
  await evaluate(`[...document.querySelectorAll('button')].find(b => /Portal|Officer Mode|Admin HQ/.test(b.textContent)).click()`);
  await waitFor(`document.querySelector('[role="dialog"]')`);
}
async function login(role, label, route, title) {
  await openModal();
  await click(label, `document.querySelector('[role="dialog"]')`);
  const selected = role === "admin" ? "ADMIN / SUPER_ADMIN" : role.toUpperCase();
  await waitFor(`document.querySelector('[role="dialog"]').innerText.includes(${JSON.stringify(selected)})`);
  assert.equal(await evaluate(`document.querySelector('input[type="password"]').value`), "JansamvadDemo@2026!");
  assert.equal(await evaluate(`document.querySelector('input[type="email"]').value`), `${label.toLowerCase()}@jansamvad.gov.in`);
  // A demo role is selected by the UI, never by validating these credentials.
  if (role === "officer") await evaluate(`document.querySelector('input[type="password"]').value = 'not-a-real-password'`);
  await click(`Sign in as ${role.replaceAll("_", " ").toUpperCase()}`, `document.querySelector('[role="dialog"]')`);
  await waitFor(`location.pathname === '${route}' && document.querySelector('h1')?.textContent === '${title}'`);
  await waitFor(`!document.querySelector('[role="dialog"]')`);
  assert.equal(await evaluate(`${session}.role`), role);
  assert.equal(await evaluate(`${session}.mode`), "demo");
  assert.deepEqual(await evaluate(`Object.keys(${session}).sort()`), ["mode", "role"]);
  assert.equal(await evaluate(`Object.keys(localStorage).some(k => k.endsWith('-auth-token'))`), false);
  assert.equal(await evaluate(`document.body.innerText.includes('No University Profile Associated')`), false);
  if (role === "university_admin") assert.equal(await evaluate(`document.body.innerText.includes('Jharkhand Institute of Innovation & Technology') && document.querySelector('[data-testid="demo-entity-link"]').innerText.includes('demo-university')`), true);
  if (role === "industry_partner") assert.equal(await evaluate(`document.body.innerText.includes('Jharkhand Civic Innovation Labs') && document.querySelector('[data-testid="demo-entity-link"]').innerText.includes('demo-industry')`), true);
}
try {
  await send("Page.enable"); await send("Runtime.enable"); await send("Network.enable");
  // Supabase is deliberately unreachable throughout every test.
  await send("Network.setBlockedURLs", { urls: ["*supabase.co/*"] });
  await send("Page.navigate", { url: base + "/demo/citizen" });
  await waitFor(`document.querySelector('h1')`);
  await evaluate(`sessionStorage.removeItem('${sessionKey}'); sessionStorage.removeItem('${workspaceKey}')`);
  await send("Page.navigate", { url: base + "/" });
  for (const args of roles) {
    await login(...args);
    await send("Page.reload");
    await waitFor(`location.pathname === '${args[2]}' && document.querySelector('h1')?.textContent === '${args[3]}'`);
    assert.equal(await evaluate(`${session}.role`), args[0]);
    await click("Log out demo");
    await waitFor(`location.pathname === '/' && !sessionStorage.getItem('${sessionKey}')`);
    console.log(`${args[1]}: login → ${args[2]} → dashboard/profile → refresh → logout PASS`);
  }
  await login(...roles[2]);
  await click("Accept assignment"); await click("Add student"); await click("Assign mentor"); await click("Submit proposal");
  await click("Complete milestone");
  await click("Resign mentor");
  await waitFor(`document.body.innerText.includes('mentor_vacant')`);
  await click("Assign mentor");
  assert.equal(await evaluate(`${project}.mentors.length`), 2);
  assert.equal(await evaluate(`${project}.mentors[0].reason`), "resigned");
  await login(...roles[3]); await click("Express interest & offer support");
  await login(...roles[0]); await click("Review legal case"); await click("Approve");
  assert.equal(await evaluate(`[...document.querySelectorAll('button')].filter(b=>b.textContent==='Record demo disbursement' && !b.disabled).length`), 1);
  await click("Record demo disbursement");
  await login(...roles[4]); await click("Vote for this project");
  assert.equal(await evaluate(`${project}.votes`), 1);
  assert.equal(await evaluate(`document.querySelector('[data-testid="demo-vote"]').disabled`), true);
  await send("Page.reload"); await waitFor(`document.querySelector('[data-testid="demo-vote"]')?.disabled`);
  assert.equal(await evaluate(`${project}.votes`), 1);
  assert.equal(await evaluate(`${project}.milestones[0].released && ${project}.collaboration`), true);
  console.log("Cross-role demo: assignment → team → proposal → milestone → mentor replacement/history → industry support → legal approval → milestone disbursement → persistent vote PASS");
  for (const [role, label] of roles) {
    await send("Page.navigate", { url: `${base}/demo/${role}` });
    await waitFor(`document.body.innerText.includes('DEMO PREVIEW')`);
    assert.equal(await evaluate(`${session}.role`), "citizen");
    console.log(`${label}: separate read-only preview preserves active demo session PASS`);
  }
  await send("Page.navigate", { url: base + "/dashboard" });
  await waitFor(`document.querySelector('[data-testid="demo-logout"]')`);
  await login(...roles[2]);
  await send("Emulation.setDeviceMetricsOverride", { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false });
  await mkdir("tmp", { recursive: true });
  await writeFile("tmp/demo-login-university.png", Buffer.from((await send("Page.captureScreenshot", { format: "png" })).data, "base64"));
  await send("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  assert.equal(await evaluate(`document.documentElement.scrollWidth <= window.innerWidth`), true);
  await click("Log out demo");
  await waitFor(`!sessionStorage.getItem('${sessionKey}')`);
  await send("Page.navigate", { url: base + "/university" });
  await waitFor(`location.pathname === '/'`);
  assert.equal(authRequests.length, 0, `Unexpected Auth requests: ${authRequests.length}`);
  assert.equal(writes.length, 0, `Unexpected protected mutations: ${JSON.stringify(writes)}`);
  assert.deepEqual(exceptions, []);
  console.log("Mobile layout, logged-out protected route, ZERO Supabase Auth calls and ZERO API/database writes PASS");
} finally { await send("Network.setBlockedURLs", { urls: [] }); ws.close(); }
