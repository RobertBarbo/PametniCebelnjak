const HIVE_PATH = "hives/panj_1";
const DEVICE_ONLINE_TIMEOUT_SECONDS = 150;
const GITHUB_LATEST_RELEASE_URL = "https://api.github.com/repos/RobertBarbo/PametniCebelnjak/releases/latest";
const OTA_IGNORE_STORAGE_KEY = "pametni-cebelnjak-ignored-ota-version";

const elements = {
  connectionStatus: document.querySelector("#connection-status"),
  connectionText: document.querySelector("#connection-text"),
  temperature: document.querySelector("#temperature-value"),
  humidity: document.querySelector("#humidity-value"),
  weight: document.querySelector("#weight-value"),
  latestTime: document.querySelector("#last-measurement-time"),
  historySummary: document.querySelector("#history-summary"),
  ipAddress: document.querySelector("#ip-address"),
  wifiSignal: document.querySelector("#wifi-signal"),
  uptime: document.querySelector("#uptime"),
  deviceStateCard: document.querySelector("#device-state-card"),
  deviceOnlineStatus: document.querySelector("#device-online-status"),
  deviceLastSeen: document.querySelector("#device-last-seen"),
  firmwareVersion: document.querySelector("#firmware-version"),
  sdStatus: document.querySelector("#sd-status"),
  sdStatusDetail: document.querySelector("#sd-status-detail"),
  sdCard: document.querySelector(".sd-card"),
  rangeTrigger: document.querySelector("#date-range-trigger"),
  rangeValue: document.querySelector("#date-range-value"),
  rangeDialog: document.querySelector("#date-range-dialog"),
  rangeDialogValue: document.querySelector("#date-range-dialog-value"),
  calendarMonthLabel: document.querySelector("#calendar-month-label"),
  calendarDays: document.querySelector("#calendar-days"),
  startTime: document.querySelector("#range-start-time"),
  endTime: document.querySelector("#range-end-time"),
  otaSection: document.querySelector("#ota-section"),
  otaLabel: document.querySelector("#ota-label"),
  otaVersion: document.querySelector("#ota-version"),
  otaDetail: document.querySelector("#ota-detail"),
  otaDeviceStatus: document.querySelector("#ota-device-status"),
  otaActions: document.querySelector("#ota-actions"),
  otaInstall: document.querySelector("#ota-install"),
  otaIgnore: document.querySelector("#ota-ignore"),
};

let chart;
let chartHasUserZoom = false;
let stopHistoryListener;
let refreshHistory;
let latestDeviceStatus;
let isLocalDashboard = false;
let appliedRange;
let draftRange;
let calendarMonth;
let selectingRangeEnd = false;
let firebaseDatabase;
let latestFirmwareVersion = "";
let availableOtaRelease;
let otaCommandPending = false;

function setConnectionState(text, state = "connected") {
  elements.connectionStatus.className = `connection-status ${state}`;
  elements.connectionText.textContent = text;
}

function formatValue(value, decimals = 1) {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue.toFixed(decimals) : "—";
}

function formatDateTime(record) {
  if (record?.date && record?.time) return `${record.date} ob ${record.time}`;

  const timestamp = Number(record?.timestamp);
  return Number.isFinite(timestamp)
    ? formatDate(new Date(timestamp * 1000), { dateStyle: "medium", timeStyle: "medium" })
    : "Čakam na podatke …";
}

function formatDate(date, options) {
  return new Intl.DateTimeFormat("sl-SI", options).format(date);
}

function compareFirmwareVersions(candidateVersion, currentVersion) {
  const parseVersion = (version) => {
    const match = String(version).match(/^(\d+)\.(\d+)\.(\d+)(?:-beta\.(\d+))?$/);
    if (!match) return null;
    return [Number(match[1]), Number(match[2]), Number(match[3]), match[4] === undefined ? Number.MAX_SAFE_INTEGER : Number(match[4])];
  };
  const candidate = parseVersion(candidateVersion);
  const current = parseVersion(currentVersion);
  if (!candidate || !current) return 0;
  for (let index = 0; index < candidate.length; index += 1) {
    if (candidate[index] !== current[index]) return candidate[index] > current[index] ? 1 : -1;
  }
  return 0;
}

function formatRange(range) {
  const options = { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" };
  return `${formatDate(range.from, options)} – ${formatDate(range.to, options)}`;
}

function renderLatestMeasurement(measurement) {
  elements.temperature.textContent = formatValue(measurement?.temperature_c);
  elements.humidity.textContent = formatValue(measurement?.humidity_percent);
  elements.weight.textContent = formatValue(measurement?.weight_kg, 2);
  elements.latestTime.textContent = formatDateTime(measurement);
}

function renderDeviceStatus(status, localDashboard = isLocalDashboard) {
  latestDeviceStatus = status;
  elements.ipAddress.textContent = status?.ip_address ?? "—";
  elements.wifiSignal.textContent = Number.isFinite(Number(status?.wifi_rssi_dbm)) ? `${status.wifi_rssi_dbm} dBm` : "—";
  const values = [status?.uptime_days, status?.uptime_hours, status?.uptime_minutes];
  elements.uptime.textContent = values.every((value) => value !== undefined)
    ? `${values[0]} dni ${String(values[1]).padStart(2, "0")} h ${String(values[2]).padStart(2, "0")} min`
    : "—";

  const lastSeenTimestamp = Number(status?.last_seen_timestamp);
  const secondsSinceLastSeen = Math.floor(Date.now() / 1000) - lastSeenTimestamp;
  const isOnline = localDashboard || (Number.isFinite(lastSeenTimestamp) && secondsSinceLastSeen <= DEVICE_ONLINE_TIMEOUT_SECONDS);
  elements.deviceStateCard.classList.toggle("online", isOnline);
  elements.deviceStateCard.classList.toggle("offline", !isOnline);
  elements.deviceOnlineStatus.textContent = isOnline ? "Online" : "Brez povezave";
  elements.deviceLastSeen.textContent = localDashboard
    ? "Dosegljiv prek lokalnega IP-ja."
    : Number.isFinite(lastSeenTimestamp) && lastSeenTimestamp > 0
      ? `Zadnji odziv: ${formatDate(new Date(lastSeenTimestamp * 1000), { dateStyle: "short", timeStyle: "short" })}`
      : "Čakam na prvi odziv naprave.";
}

function renderSDStatus(status) {
  const isPresent = status?.present === true;
  const hasError = status?.error === true;
  elements.sdCard.classList.toggle("ok", isPresent && !hasError);
  elements.sdCard.classList.toggle("error", hasError);
  elements.sdStatus.textContent = isPresent ? "Zaznana" : "Ni zaznana";
  elements.sdStatusDetail.textContent = hasError ? "Po petih poskusih ni bila zaznana." : `${status?.initialization_failures ?? 0} neuspelih inicializacij`;
}

function renderFirmwareVersion(status) {
  latestFirmwareVersion = status?.version ?? "";
  elements.firmwareVersion.textContent = latestFirmwareVersion || "—";
  if (!isLocalDashboard && latestFirmwareVersion) checkForFirmwareRelease();
}

function renderOtaDeviceStatus(status) {
  if (!status?.state) return;
  const target = status.target_version ? ` ${status.target_version}` : "";
  elements.otaDeviceStatus.textContent = `${status.state}${target}: ${status.message ?? ""}`.trim();
}

function showOtaAvailability(release) {
  availableOtaRelease = release;
  const ignoredVersion = localStorage.getItem(OTA_IGNORE_STORAGE_KEY);
  const isIgnored = ignoredVersion === release.version;
  elements.otaLabel.textContent = isIgnored ? "Posodobitev prezrta" : "Na voljo je nova različica";
  elements.otaVersion.textContent = `v${release.version}`;
  elements.otaDetail.textContent = release.name || "Nova firmware izdaja je pripravljena na GitHub Releases.";
  elements.otaActions.hidden = isIgnored;
  if (isIgnored) elements.otaDeviceStatus.textContent = "Prezrto v tem brskalniku.";
}

async function checkForFirmwareRelease() {
  if (!latestFirmwareVersion || isLocalDashboard) return;
  try {
    const response = await fetch(GITHUB_LATEST_RELEASE_URL, { headers: { Accept: "application/vnd.github+json" } });
    if (response.status === 404) {
      elements.otaLabel.textContent = "Ni objavljene OTA izdaje";
      elements.otaVersion.textContent = "—";
      elements.otaDetail.textContent = "Ko bo GitHub Release objavljen, se bo prikazal tukaj.";
      elements.otaActions.hidden = true;
      return;
    }
    if (!response.ok) throw new Error("GitHub Release ni dosegljiv");

    const release = await response.json();
    const releaseVersion = String(release.tag_name ?? "").replace(/^v/, "");
    if (compareFirmwareVersions(releaseVersion, latestFirmwareVersion) > 0) {
      showOtaAvailability({ version: releaseVersion, name: release.name });
    } else {
      availableOtaRelease = undefined;
      elements.otaLabel.textContent = "Firmware je posodobljen";
      elements.otaVersion.textContent = `v${latestFirmwareVersion}`;
      elements.otaDetail.textContent = "Na GitHub Releases ni novejše različice.";
      elements.otaActions.hidden = true;
    }
  } catch (error) {
    console.error(error);
    elements.otaLabel.textContent = "Preverjanje OTA ni uspelo";
    elements.otaVersion.textContent = "—";
    elements.otaDetail.textContent = "GitHub Release trenutno ni dosegljiv.";
    elements.otaActions.hidden = true;
  }
}

async function requestFirmwareUpdate() {
  if (!firebaseDatabase || !availableOtaRelease || otaCommandPending) return;
  if (!window.confirm(`Ali želiš napravo posodobiti na verzijo ${availableOtaRelease.version}? Med prenosom se bo naprava ponovno zagnala.`)) return;

  otaCommandPending = true;
  elements.otaInstall.disabled = true;
  elements.otaIgnore.disabled = true;
  elements.otaDeviceStatus.textContent = "OTA ukaz pošiljam napravi …";
  try {
    const { ref, set } = firebaseDatabase;
    await set(ref(firebaseDatabase.database, `${HIVE_PATH}/commands/firmware_update`), {
      action: "install",
      target_version: availableOtaRelease.version,
      requested_at: Math.floor(Date.now() / 1000),
    });
    elements.otaDeviceStatus.textContent = "Ukaz je poslan. ESP32 ga preveri v največ 30 sekundah.";
  } catch (error) {
    console.error(error);
    elements.otaDeviceStatus.textContent = "Pošiljanje OTA ukaza ni uspelo.";
    otaCommandPending = false;
    elements.otaInstall.disabled = false;
    elements.otaIgnore.disabled = false;
  }
}

function ignoreFirmwareUpdate() {
  if (!availableOtaRelease) return;
  localStorage.setItem(OTA_IGNORE_STORAGE_KEY, availableOtaRelease.version);
  showOtaAvailability(availableOtaRelease);
}

function initializeOtaControls() {
  elements.otaInstall.addEventListener("click", requestFirmwareUpdate);
  elements.otaIgnore.addEventListener("click", ignoreFirmwareUpdate);
}

function getBucketSeconds(range) {
  const rangeSeconds = (range.to.getTime() - range.from.getTime()) / 1000;
  if (rangeSeconds <= 24 * 60 * 60) return 5 * 60;
  if (rangeSeconds <= 7 * 24 * 60 * 60) return 60 * 60;
  if (rangeSeconds <= 31 * 24 * 60 * 60) return 6 * 60 * 60;
  return 24 * 60 * 60;
}

function aggregateReadings(readings, range) {
  const bucketSeconds = getBucketSeconds(range);
  const buckets = new Map();

  readings.forEach((reading) => {
    const timestamp = Number(reading.timestamp);
    const temperature = Number(reading.temperature_c);
    const humidity = Number(reading.humidity_percent);
    const weight = Number(reading.weight_kg);
    if (![timestamp, temperature, humidity, weight].every(Number.isFinite)) return;

    const bucket = Math.floor(timestamp / bucketSeconds) * bucketSeconds;
    const current = buckets.get(bucket) ?? { timestamp: bucket, count: 0, temperature: 0, humidity: 0, weight: 0 };
    current.count += 1;
    current.temperature += temperature;
    current.humidity += humidity;
    current.weight += weight;
    buckets.set(bucket, current);
  });

  return [...buckets.values()]
    .map((bucket) => ({
      timestamp: bucket.timestamp,
      temperature_c: bucket.temperature / bucket.count,
      humidity_percent: bucket.humidity / bucket.count,
      weight_kg: bucket.weight / bucket.count,
    }))
    .sort((first, second) => first.timestamp - second.timestamp);
}

function renderHistory(readings, alreadyAggregated = false) {
  const chartReadings = alreadyAggregated ? readings : aggregateReadings(readings, appliedRange);
  const series = [
    { name: "Temperatura (°C)", data: chartReadings.map((item) => [item.timestamp * 1000, item.temperature_c]), color: "#e6a32d", yAxis: 0 },
    { name: "Vlaga (%)", data: chartReadings.map((item) => [item.timestamp * 1000, item.humidity_percent]), color: "#317da4", yAxis: 1 },
    { name: "Teža (kg)", data: chartReadings.map((item) => [item.timestamp * 1000, item.weight_kg]), color: "#2f7851", yAxis: 2 },
  ];

  chart.update({ series }, false, true);
  if (!chartHasUserZoom) {
    chart.xAxis[0].setExtremes(appliedRange.from.getTime(), appliedRange.to.getTime(), false, false);
  }
  chart.redraw();
  elements.historySummary.textContent = chartReadings.length
    ? `Prikazanih je ${chartReadings.length} povprečnih točk. Za približanje povlecite po grafu.`
    : "Za izbrano obdobje še ni meritev.";
}

function createChart() {
  chart = Highcharts.chart("measurement-chart", {
    chart: {
      backgroundColor: "transparent",
      spacing: [16, 8, 8, 0],
      zoomType: "x",
      panning: { enabled: true, type: "x" },
      panKey: "shift",
    },
    title: { text: null },
    credits: { enabled: false },
    time: { useUTC: false },
    xAxis: {
      type: "datetime",
      lineColor: "#dce4dc",
      events: {
        setExtremes(event) {
          if (event.trigger === "zoom") chartHasUserZoom = event.min !== undefined;
        },
      },
    },
    yAxis: [
      { title: { text: "°C" }, gridLineColor: "rgba(25, 53, 42, 0.08)" },
      { title: { text: "%" }, opposite: true, gridLineWidth: 0 },
      { title: { text: "kg" }, visible: false },
    ],
    tooltip: { shared: true, xDateFormat: "%d. %m. %Y %H:%M" },
    legend: { align: "left", verticalAlign: "top", itemStyle: { fontWeight: "600" } },
    plotOptions: { series: { marker: { enabled: false }, lineWidth: 2, states: { hover: { lineWidth: 3 } } } },
    series: [],
  });
}

function showDataError(error) {
  console.error(error);
  setConnectionState("Napaka pri branju podatkov", "error");
}

function startOfDay(date) {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
}

function endOfDay(date) {
  const result = new Date(date);
  result.setHours(23, 59, 59, 999);
  return result;
}

function getPresetRange(preset) {
  const now = new Date();
  const today = startOfDay(now);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const weekStart = new Date(today);
  weekStart.setDate(weekStart.getDate() - ((weekStart.getDay() + 6) % 7));
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const yearStart = new Date(now.getFullYear(), 0, 1);
  const ago = (milliseconds) => new Date(now.getTime() - milliseconds);

  const presets = {
    today: { from: today, to: now },
    yesterday: { from: yesterday, to: endOfDay(yesterday) },
    week: { from: weekStart, to: now },
    month: { from: monthStart, to: now },
    year: { from: yearStart, to: now },
    hour: { from: ago(60 * 60 * 1000), to: now },
    hours12: { from: ago(12 * 60 * 60 * 1000), to: now },
    hours24: { from: ago(24 * 60 * 60 * 1000), to: now },
    days7: { from: ago(7 * 24 * 60 * 60 * 1000), to: now },
    days30: { from: ago(30 * 24 * 60 * 60 * 1000), to: now },
  };
  return presets[preset];
}

function cloneRange(range) {
  return { from: new Date(range.from), to: new Date(range.to) };
}

function toTimeInputValue(date) {
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

function dateKey(date) {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

function setDateTime(date, timeValue) {
  const [hours, minutes] = timeValue.split(":").map(Number);
  const result = new Date(date);
  result.setHours(hours, minutes, 0, 0);
  return result;
}

function syncRangeControls() {
  elements.rangeDialogValue.textContent = draftRange.to ? formatRange(draftRange) : "Izberite končni datum";
  elements.startTime.value = toTimeInputValue(draftRange.from);
  elements.endTime.value = toTimeInputValue(draftRange.to ?? draftRange.from);
}

function isSameDay(first, second) {
  return dateKey(first) === dateKey(second);
}

function renderCalendar() {
  const year = calendarMonth.getFullYear();
  const month = calendarMonth.getMonth();
  const firstDay = new Date(year, month, 1);
  const numberOfDays = new Date(year, month + 1, 0).getDate();
  const leadingEmptyCells = (firstDay.getDay() + 6) % 7;
  elements.calendarMonthLabel.textContent = formatDate(firstDay, { month: "long", year: "numeric" });
  elements.calendarDays.replaceChildren(...Array.from({ length: leadingEmptyCells }, () => document.createElement("span")));

  for (let day = 1; day <= numberOfDays; day += 1) {
    const date = new Date(year, month, day);
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = day;
    button.dataset.date = date.toISOString();
    button.className = "calendar-day";
    if (isSameDay(date, new Date())) button.classList.add("today");
    if (draftRange.to && date >= startOfDay(draftRange.from) && date <= startOfDay(draftRange.to)) button.classList.add("in-range");
    if (isSameDay(date, draftRange.from)) button.classList.add("range-start");
    if (draftRange.to && isSameDay(date, draftRange.to)) button.classList.add("range-end");
    elements.calendarDays.append(button);
  }
}

function selectCalendarDate(date) {
  if (!selectingRangeEnd) {
    draftRange.from = setDateTime(date, elements.startTime.value);
    draftRange.to = null;
    selectingRangeEnd = true;
  } else {
    const selectedEnd = setDateTime(date, elements.endTime.value);
    if (selectedEnd < draftRange.from) {
      draftRange.to = new Date(draftRange.from);
      draftRange.from = setDateTime(date, elements.startTime.value);
    } else {
      draftRange.to = selectedEnd;
    }
    selectingRangeEnd = false;
  }
  syncRangeControls();
  renderCalendar();
}

function openRangeDialog() {
  draftRange = cloneRange(appliedRange);
  calendarMonth = new Date(draftRange.from.getFullYear(), draftRange.from.getMonth(), 1);
  selectingRangeEnd = false;
  syncRangeControls();
  renderCalendar();
  elements.rangeDialog.showModal();
}

function applyRange() {
  if (!draftRange.to || draftRange.to <= draftRange.from) {
    elements.rangeDialogValue.textContent = "Končni datum mora biti po začetnem datumu.";
    return;
  }

  appliedRange = cloneRange(draftRange);
  chartHasUserZoom = false;
  elements.rangeValue.textContent = formatRange(appliedRange);
  elements.rangeDialog.close();
  refreshHistory?.().catch(showDataError);
}

function initializeDateRangePicker() {
  appliedRange = getPresetRange("hours24");
  elements.rangeValue.textContent = formatRange(appliedRange);
  elements.rangeTrigger.addEventListener("click", openRangeDialog);
  document.querySelector("#date-range-cancel").addEventListener("click", () => elements.rangeDialog.close());
  document.querySelector("#date-range-apply").addEventListener("click", applyRange);
  document.querySelector("#calendar-previous").addEventListener("click", () => {
    calendarMonth.setMonth(calendarMonth.getMonth() - 1);
    renderCalendar();
  });
  document.querySelector("#calendar-next").addEventListener("click", () => {
    calendarMonth.setMonth(calendarMonth.getMonth() + 1);
    renderCalendar();
  });
  elements.calendarDays.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-date]");
    if (button) selectCalendarDate(new Date(button.dataset.date));
  });
  elements.startTime.addEventListener("change", () => {
    draftRange.from = setDateTime(draftRange.from, elements.startTime.value);
    syncRangeControls();
  });
  elements.endTime.addEventListener("change", () => {
    draftRange.to = setDateTime(draftRange.to ?? draftRange.from, elements.endTime.value);
    syncRangeControls();
  });
  document.querySelectorAll("[data-preset]").forEach((button) => button.addEventListener("click", () => {
    draftRange = getPresetRange(button.dataset.preset);
    calendarMonth = new Date(draftRange.from.getFullYear(), draftRange.from.getMonth(), 1);
    selectingRangeEnd = false;
    syncRangeControls();
    renderCalendar();
  }));
}

async function useLocalDataSource() {
  const response = await fetch("/api/status", { cache: "no-store" });
  if (!response.ok) throw new Error("Lokalni API ni dosegljiv");
  isLocalDashboard = true;
  elements.otaSection.hidden = true;

  async function refreshStatus() {
    const status = await (await fetch("/api/status", { cache: "no-store" })).json();
    renderLatestMeasurement(status.latest);
    renderDeviceStatus(status.device, true);
    renderSDStatus(status.sd_card);
    renderFirmwareVersion(status.firmware);
    setConnectionState("Lokalna povezava z ESP32");
  }

  refreshHistory = async () => {
    const from = Math.floor(appliedRange.from.getTime() / 1000);
    const to = Math.floor(appliedRange.to.getTime() / 1000);
    const historyResponse = await fetch(`/api/history?from=${from}&to=${to}`, { cache: "no-store" });
    if (!historyResponse.ok) throw new Error("Lokalna zgodovina ni dosegljiva");
    const history = await historyResponse.json();
    renderHistory(history.readings ?? [], true);
  };

  await refreshStatus();
  await refreshHistory();
  setInterval(() => refreshStatus().catch(showDataError), 5_000);
}

async function useFirebaseDataSource() {
  isLocalDashboard = false;
  const [{ initializeApp }, databaseModule, configModule] = await Promise.all([
    import("https://www.gstatic.com/firebasejs/12.16.0/firebase-app.js"),
    import("https://www.gstatic.com/firebasejs/12.16.0/firebase-database.js"),
    import("./firebase-config.js"),
  ]);
  const { endAt, getDatabase, onValue, orderByKey, query, ref, set, startAt } = databaseModule;
  const database = getDatabase(initializeApp(configModule.firebaseConfig));
  firebaseDatabase = { database, ref, set };
  elements.otaSection.hidden = false;

  onValue(ref(database, ".info/connected"), (snapshot) => {
    setConnectionState(snapshot.val() === true ? "Povezano v Cloud" : "Brez povezave s Cloud", snapshot.val() === true ? "connected" : "error");
  }, showDataError);
  onValue(ref(database, `${HIVE_PATH}/latest`), (snapshot) => renderLatestMeasurement(snapshot.val()), showDataError);
  onValue(ref(database, `${HIVE_PATH}/status/device`), (snapshot) => renderDeviceStatus(snapshot.val()), showDataError);
  onValue(ref(database, `${HIVE_PATH}/status/sd_card`), (snapshot) => renderSDStatus(snapshot.val()), showDataError);
  onValue(ref(database, `${HIVE_PATH}/status/firmware`), (snapshot) => renderFirmwareVersion(snapshot.val()), showDataError);
  onValue(ref(database, `${HIVE_PATH}/status/ota`), (snapshot) => renderOtaDeviceStatus(snapshot.val()), showDataError);

  refreshHistory = async () => {
    stopHistoryListener?.();
    const from = Math.floor(appliedRange.from.getTime() / 1000);
    const to = Math.floor(appliedRange.to.getTime() / 1000);
    const historyQuery = query(ref(database, `${HIVE_PATH}/measurements`), orderByKey(), startAt(String(from)), endAt(String(to)));
    stopHistoryListener = onValue(historyQuery, (snapshot) => {
      const readings = Object.entries(snapshot.val() ?? {}).map(([key, value]) => ({ ...value, timestamp: Number(value.timestamp ?? key) }));
      renderHistory(readings);
    }, showDataError);
  };

  await refreshHistory();
}

async function startDashboard() {
  initializeDateRangePicker();
  initializeOtaControls();
  createChart();
  setInterval(() => {
    if (latestDeviceStatus) renderDeviceStatus(latestDeviceStatus);
  }, 15_000);

  try {
    await useLocalDataSource();
  } catch {
    await useFirebaseDataSource();
  }
}

window.addEventListener("DOMContentLoaded", startDashboard);
