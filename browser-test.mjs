import assert from "node:assert/strict";
import {spawn} from "node:child_process";
import {readFile, mkdir, realpath} from "node:fs/promises";
import {createServer} from "node:http";
import {resolve, extname} from "node:path";
import {setTimeout as delay} from "node:timers/promises";

if (!process.argv[2] || !process.argv[3]) throw new Error("Usage: node browser-test.mjs <Edge executable> <dedicated temporary profile directory>");
const profile = process.argv[3];
await mkdir(profile, {recursive: true});
const server = createServer(async (req, res) => {
  const path = new URL(req.url, "http://localhost").pathname;
  if (!/^\/(?:[a-z0-9_.-]+\/)*[a-z0-9_.-]*$/i.test(path) || path.includes("..")) {
    res.writeHead(400).end();
    return;
  }
  const file = resolve("." + (path === "/" ? "/index.html" : path));
  try {
    const body = await readFile(file);
    const types = {".html":"text/html", ".css":"text/css", ".mjs":"text/javascript", ".json":"application/json"};
    res.writeHead(200, {"Content-Type": types[extname(file)] ?? "text/plain"});
    res.end(body);
  } catch {
    res.writeHead(404).end();
  }
});
await new Promise((resolve, reject) => server.listen(0, "127.0.0.1", resolve).once("error", reject));
const edge = spawn(process.argv[2], ["--headless=new", "--disable-gpu", "--no-first-run",
  "--remote-debugging-port=0", "--user-data-dir=" + await realpath(profile), "about:blank"],
  {windowsHide:true, stdio:"ignore"});
let startupError;
edge.on("error", error => { startupError = error; });
let socket;
try {
  let port;
  for (let i = 0; i < 60 && !port; i++) {
    if (startupError) throw startupError;
    await delay(250);
    port = (await readFile(resolve(profile, "DevToolsActivePort"), "utf8").catch(() => "")).split(/\r?\n/)[0];
  }
  assert(port, "Edge did not open a debugging port");
  const tabs = await (await fetch("http://127.0.0.1:" + port + "/json/list")).json();
  socket = new WebSocket(tabs.find(tab => tab.type === "page").webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    socket.onopen = resolve;
    socket.onerror = reject;
  });
  let id = 0;
  const call = (method, params) => new Promise((resolve, reject) => {
    const serial = ++id;
    const timeout = setTimeout(() => { socket.removeEventListener("message", receive); reject(new Error("Browser command timed out: " + method)); }, 15000);
    function receive(event) {
      const message = JSON.parse(event.data);
      if (message.id !== serial) return;
      clearTimeout(timeout);
      socket.removeEventListener("message", receive);
      if (message.error) reject(new Error(message.error.message));
      else resolve(message.result);
    }
    socket.addEventListener("message", receive);
    socket.send(JSON.stringify({id:serial, method, params}));
  });
  async function evaluate(expression) {
    const reply = await call("Runtime.evaluate", {expression, returnByValue:true});
    if (reply.exceptionDetails) throw new Error(reply.exceptionDetails.exception.description);
    return reply.result.value;
  }
  async function ready(expression) {
    for (let i = 0; i < 50; i++) {
      if (await evaluate(expression)) return;
      await delay(150);
    }
    assert.fail(expression);
  }
  await call("Page.navigate", {url:"http://127.0.0.1:" + server.address().port});
  await ready("!!document.querySelector('.home-works a')");
  await evaluate("document.querySelector('.home-works a').click()");
  await ready("document.querySelectorAll('.verse').length === 12");
  await evaluate("document.querySelector('.verse [data-token=\"6\"][data-sentence=\"2274106\"]')?.click() || document.querySelector('#verses [data-token=\"6\"][data-sentence=\"2274106\"]').click()");
  assert(await evaluate("document.querySelector('#word').textContent.includes('οὐλόμενος')"));
  assert(await evaluate("document.querySelectorAll('#syntax svg path').length > 0"));
  assert(await evaluate("document.querySelector('#syntax').getBoundingClientRect().right >= document.querySelector('aside').getBoundingClientRect().right - 1"));
  assert(await evaluate("getComputedStyle(document.querySelector('aside')).overflowY === 'auto'"));
  assert(await evaluate("document.querySelector('#syntax .object').textContent === 'Object'"));
  assert(await evaluate("!!document.querySelector('#syntax .agreement') && !document.querySelector('#syntax a')"));
  await evaluate("document.querySelector('#syntax [data-sentence=\"2274106\"][data-token=\"1\"]').click()");
  assert(await evaluate("document.querySelector('#verses [data-token=\"6\"][data-sentence=\"2274106\"]').classList.contains('dependent')"));
  await evaluate("document.querySelector('#work').value='odyssey'; document.querySelector('#book').value='24'; document.querySelector('#line').value='99999'; document.querySelector('form').requestSubmit()");
  await ready("document.querySelector('#heading').textContent === 'Odyssey · Book 24'");
  assert(await evaluate("document.querySelector('.verse-number').textContent === '24.548' && document.querySelector('#line').value === '548'"));
  await call("Emulation.setDeviceMetricsOverride", {width:390,height:844,deviceScaleFactor:1,mobile:true});
  await evaluate("location.hash = 'work=odyssey&book=1&line=99'");
  await ready("document.querySelector('#status').textContent.includes('absent') && !!document.querySelector('.verse')");
  await evaluate("document.querySelector('.verse button').click()");
  assert(await evaluate("document.activeElement.id === 'analysis' && getComputedStyle(document.querySelector('aside')).position === 'static'"));
  console.log("Edge passed passage loading, cross-verse head navigation and highlighting, work/book jumps, missing-verse feedback, and mobile panel focus.");
} finally {
  socket?.close();
  edge.kill();
  server.closeAllConnections();
  server.close();
}
