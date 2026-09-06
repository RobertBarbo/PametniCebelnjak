const { test } = require("node:test");
const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const vm = require("node:vm");

// Izvedemo dejansko funkcijo vmesnika z nadzorovanim API-jem in uro, brez DOM knjižnic.
const source = readFileSync("web/app.js", "utf8");
const action = source.slice(source.indexOf("async function requestLocalReboot()"),
  source.indexOf("function initializeProvisioningForm()"));

async function runScenario({ confirm = true, local = true, responses = [] } = {}) {
  let now = 0;
  const calls = [];
  const elements = { localReboot: { disabled: false }, localRebootStatus: { textContent: "" } };
  const context = vm.createContext({
    elements, isLocalDashboard: local,
    translateText: (text) => text,
    confirmDashboardAction: async () => confirm,
    AbortSignal: { timeout: () => ({}) },
    performance: { now: () => now },
    window: { setTimeout: (callback, delay) => { now += delay; callback(); } },
    fetch: async (url, options) => {
      calls.push({ url, options });
      const next = responses.shift();
      if (next instanceof Error || !next) throw next || new Error("offline");
      return { ok: next.code >= 200 && next.code < 300, status: next.code, json: async () => next.body };
    },
  });
  vm.runInContext(action, context);
  await context.requestLocalReboot();
  return { calls, elements, now };
}

const status = (bootId, state = "idle") => ({ code: 200, body: { reboot: { boot_id: bootId, state } } });
const accepted = () => ({ code: 202 });

test("Preklic in cloud pogled ne pošljeta ukaza", async () => {
  assert.equal((await runScenario({ confirm: false })).calls.length, 0);
  assert.equal((await runScenario({ local: false })).calls.length, 0);
});

test("Potrditev vsebuje ID zagona; star odziv in izpad še nista uspeh", async () => {
  const result = await runScenario({ responses: [status(123), accepted(), status(123, "queued"),
    new Error("offline"), status(456)] });
  assert.equal(result.calls[1].url, "/api/reboot");
  assert.equal(result.calls[1].options.method, "POST");
  assert.equal(result.calls[1].options.headers["X-Device-Reboot"], "123");
  assert.equal(result.elements.localRebootStatus.textContent, "Naprava je znova zagnana in dosegljiva.");
  assert.equal(result.elements.localReboot.disabled, false);
  assert.equal(result.calls.length, 5);
});

test("Starejši firmware ne prejme nezdružljivega ukaza", async () => {
  const result = await runScenario({ responses: [{ code: 200, body: {} }] });
  assert.equal(result.calls.length, 1);
  assert.equal(result.elements.localRebootStatus.textContent, "Ponovni zagon zahteva novejši firmware.");
});

test("Zasedena naprava ob sprejemu ali izvedbi ne prikaže uspeha", async () => {
  for (const responses of [[status(1), { code: 409 }], [status(1), accepted(), status(1, "busy")]]) {
    const result = await runScenario({ responses });
    assert.match(result.elements.localRebootStatus.textContent, /Naprava je zasedena/);
    assert.equal(result.elements.localReboot.disabled, false);
  }
});

test("Napaka shranjevanja prekliče čakanje in omogoči nov poskus", async () => {
  const result = await runScenario({ responses: [status(1), accepted(), status(1, "error")] });
  assert.match(result.elements.localRebootStatus.textContent, /Ponovni zagon ni uspel/);
  assert.equal(result.elements.localReboot.disabled, false);
});

test("Trajen izpad ima omejeno čakanje brez ponovnega POST ukaza", async () => {
  const result = await runScenario({ responses: [status(1), accepted()] });
  assert.match(result.elements.localRebootStatus.textContent, /Ponovna povezava še ni potrjena/);
  assert.equal(result.now, 60_000);
  assert.equal(result.calls.filter((call) => call.options.method === "POST").length, 1);
  assert.equal(result.elements.localReboot.disabled, false);
});

test("Zavrnjena potrditev in omrežne napake imajo prevedljivo napako", async () => {
  for (const responses of [[status(1), { code: 403 }], [new Error("Network error")]]) {
    const result = await runScenario({ responses });
    assert.equal(result.elements.localRebootStatus.textContent, "Ponovni zagon ni uspel. Preveri povezavo in poskusi znova.");
    assert.equal(result.elements.localReboot.disabled, false);
  }
});
