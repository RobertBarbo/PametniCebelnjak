const { test } = require("node:test");
const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const vm = require("node:vm");

const source = readFileSync("web/app.js", "utf8");
const helper = source.slice(
  source.indexOf("function createSingleFlightTask("),
  source.indexOf("const TRANSLATIONS ="),
);

test("sočasni osvežitvi lokalnega statusa uporabita isto zahtevo", async () => {
  let calls = 0;
  let finish;
  const waiting = new Promise((resolve) => { finish = resolve; });
  const context = vm.createContext({ Promise });
  vm.runInContext(helper, context);
  const task = context.createSingleFlightTask(async () => {
    calls += 1;
    await waiting;
    return calls;
  });

  const first = task();
  const second = task();
  assert.equal(first, second);
  assert.equal(calls, 0);
  await Promise.resolve();
  assert.equal(calls, 1);
  finish();
  assert.equal(await first, 1);

  assert.equal(await task(), 2);
  assert.equal(calls, 2);
});

test("lokalne statusne in zgodovinske zahteve imajo omejen čas", () => {
  assert.match(source, /fetch\("\/api\/status", \{[\s\S]*?AbortSignal\.timeout\(LOCAL_STATUS_REQUEST_TIMEOUT_MS\)/);
  assert.match(source, /fetch\(`\/api\/history\?[\s\S]*?AbortSignal\.timeout\(LOCAL_HISTORY_REQUEST_TIMEOUT_MS\)/);
});
