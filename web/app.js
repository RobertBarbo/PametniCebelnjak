const DEVICE_ONLINE_TIMEOUT_SECONDS = 150;
const GITHUB_LATEST_RELEASE_URL = "https://api.github.com/repos/RobertBarbo/PametniCebelnjak/releases/latest";
const OTA_IGNORE_STORAGE_KEY = "pametni-cebelnjak-ignored-ota-version";
const CLOUD_DEVICE_QUERY_PARAMETER = "device";
const CLOUD_DEVICE_STORAGE_KEY = "pametni-cebelnjak-cloud-device-id";

const elements = {
  connectionStatus: document.querySelector("#connection-status"),
  connectionText: document.querySelector("#connection-text"),
  authTrigger: document.querySelector("#auth-trigger"),
  authDialog: document.querySelector("#auth-dialog"),
  authForm: document.querySelector("#auth-form"),
  authEmail: document.querySelector("#auth-email"),
  authPassword: document.querySelector("#auth-password"),
  authRegister: document.querySelector("#auth-register"),
  authGoogle: document.querySelector("#auth-google"),
  authClose: document.querySelector("#auth-close"),
  authStatus: document.querySelector("#auth-status"),
  accountSection: document.querySelector("#account-section"),
  accountEmail: document.querySelector("#account-email"),
  authSignout: document.querySelector("#auth-signout"),
  cloudDeviceSelect: document.querySelector("#cloud-device-select"),
  claimDeviceForm: document.querySelector("#claim-device-form"),
  claimDeviceName: document.querySelector("#claim-device-name"),
  claimDeviceId: document.querySelector("#claim-device-id"),
  claimActivationCode: document.querySelector("#claim-activation-code"),
  claimDeviceStatus: document.querySelector("#claim-device-status"),
  temperature: document.querySelector("#temperature-value"),
  humidity: document.querySelector("#humidity-value"),
  weight: document.querySelector("#weight-value"),
  latestTime: document.querySelector("#last-measurement-time"),
  historySummary: document.querySelector("#history-summary"),
  ipAddress: document.querySelector("#ip-address"),
  wifiSignal: document.querySelector("#wifi-signal"),
  uptime: document.querySelector("#uptime"),
  deviceId: document.querySelector("#device-id"),
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
  provisioningSection: document.querySelector("#provisioning-section"),
  provisioningDescription: document.querySelector("#provisioning-description"),
  wifiForm: document.querySelector("#wifi-form"),
  wifiSsid: document.querySelector("#wifi-ssid"),
  wifiPassword: document.querySelector("#wifi-password"),
  wifiFormStatus: document.querySelector("#wifi-form-status"),
  wifiScan: document.querySelector("#wifi-scan"),
  wifiScanStatus: document.querySelector("#wifi-scan-status"),
  wifiNetworks: document.querySelector("#wifi-networks"),
  wifiForget: document.querySelector("#wifi-forget"),
  localDeviceId: document.querySelector("#local-device-id"),
  activationCode: document.querySelector("#activation-code"),
  localActivationCard: document.querySelector("#local-activation-card"),
  localActivationCode: document.querySelector("#local-activation-code"),
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
let highchartsLoading;
let latestHistoryReadings = [];
let latestHistoryAlreadyAggregated = false;
let cloudDevicePath = "";
let firebaseAuth;
let firebaseAuthModule;
let currentCloudUser;
let stopCloudDeviceListListener;
let stopCloudDeviceListeners = [];
let cloudDevices = {};
let authControlsInitialized = false;

function isValidDeviceId(deviceId) {
  return /^CB-[A-F0-9]{12}$/.test(String(deviceId));
}

function isValidActivationCode(activationCode) {
  return /^[A-HJ-NP-Z2-9]{8}$/.test(String(activationCode));
}

function clearCloudDeviceListeners() {
  stopCloudDeviceListeners.forEach((unsubscribe) => unsubscribe());
  stopCloudDeviceListeners = [];
  stopHistoryListener?.();
  stopHistoryListener = undefined;
}

function resetCloudDashboard() {
  latestDeviceStatus = undefined;
  renderLatestMeasurement(null);
  renderDeviceStatus(null);
  renderSDStatus(null);
  renderFirmwareVersion(null);
  elements.otaDeviceStatus.textContent = "Naprava še ni prejela OTA ukaza.";
  elements.otaActions.hidden = true;
  renderHistory([]);
}

function renderCloudDeviceSelector() {
  const deviceIds = Object.keys(cloudDevices);
  const requestedDeviceId = new URLSearchParams(window.location.search).get(CLOUD_DEVICE_QUERY_PARAMETER);
  const storedDeviceId = localStorage.getItem(CLOUD_DEVICE_STORAGE_KEY);
  const preferredDeviceId = [requestedDeviceId, storedDeviceId, cloudDevicePath.replace("devices/", "")]
    .find((deviceId) => deviceIds.includes(deviceId));

  elements.cloudDeviceSelect.replaceChildren();
  if (!deviceIds.length) {
    elements.cloudDeviceSelect.append(new Option("Nobena naprava ni registrirana", ""));
    elements.cloudDeviceSelect.disabled = true;
    selectCloudDevice("");
    return;
  }

  deviceIds.sort().forEach((deviceId) => {
    const device = cloudDevices[deviceId] ?? {};
    elements.cloudDeviceSelect.append(new Option(device.display_name || deviceId, deviceId));
  });
  elements.cloudDeviceSelect.disabled = false;
  selectCloudDevice(preferredDeviceId || deviceIds[0]);
}

function selectCloudDevice(deviceId) {
  clearCloudDeviceListeners();
  cloudDevicePath = deviceId ? `devices/${deviceId}` : "";
  elements.cloudDeviceSelect.value = deviceId;
  elements.otaSection.hidden = !cloudDevicePath;
  if (!cloudDevicePath || !firebaseDatabase) {
    resetCloudDashboard();
    return;
  }

  localStorage.setItem(CLOUD_DEVICE_STORAGE_KEY, deviceId);
  const { database, onValue, ref } = firebaseDatabase;
  const subscribe = (path, renderer) => {
    stopCloudDeviceListeners.push(onValue(ref(database, `${cloudDevicePath}/${path}`), (snapshot) => renderer(snapshot.val()), showDataError));
  };
  subscribe("latest", renderLatestMeasurement);
  subscribe("status/device", renderDeviceStatus);
  subscribe("status/sd_card", renderSDStatus);
  subscribe("status/firmware", renderFirmwareVersion);
  subscribe("status/ota", renderOtaDeviceStatus);
  refreshHistory?.().catch(showDataError);
}

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
  elements.deviceId.textContent = status?.device_id ?? "—";
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

function renderProvisioning(network) {
  elements.provisioningSection.hidden = false;
  elements.localDeviceId.textContent = latestDeviceStatus?.device_id ?? "—";
  elements.activationCode.textContent = network?.activation_code ?? "—";
  elements.localActivationCard.hidden = false;
  elements.localActivationCode.textContent = network?.activation_code ?? "—";
  const accessPointName = network?.access_point_ssid ? ` (${network.access_point_ssid})` : "";
  const connectionState = network?.connection_state ?? "idle";
  const isConnecting = connectionState === "connecting";
  const isUsingAccessPoint = network?.provisioning_active === true;
  const isConnected = network?.station_connected === true;

  if (isConnecting) {
    elements.provisioningDescription.textContent = `ESP32 preverja izbrano Wi‑Fi omrežje. Ostani povezan na dostopni točki${accessPointName}.`;
  } else if (connectionState === "connected") {
    elements.provisioningDescription.textContent = `Povezava z Wi‑Fi je uspela. AP se bo zaprl po prikazu potrditve.`;
  } else if (connectionState === "failed") {
    elements.provisioningDescription.textContent = `Povezava z Wi‑Fi ni uspela. AP${accessPointName} ostaja na voljo za ponoven poskus.`;
  } else if (isUsingAccessPoint) {
    elements.provisioningDescription.textContent = `Povezan si neposredno na dostopno točko ESP32${accessPointName}. Vpiši domače Wi‑Fi omrežje za dostop do clouda.`;
  } else if (isConnected) {
    elements.provisioningDescription.textContent = "ESP32 je povezan v domače Wi‑Fi omrežje. Nastavitve lahko zamenjaš ali izbrišeš brez ponovnega zagona.";
  }

  elements.wifiScan.disabled = isConnecting;
  elements.wifiForget.disabled = isConnecting;
  elements.wifiForm.querySelector("button[type='submit']").disabled = isConnecting;
  if (network?.connection_message) elements.wifiFormStatus.textContent = network.connection_message;
}

async function saveWiFiConfiguration(event) {
  event.preventDefault();
  const ssid = elements.wifiSsid.value.trim();
  const password = elements.wifiPassword.value;
  if (!ssid) {
    elements.wifiFormStatus.textContent = "Vpiši ime Wi‑Fi omrežja.";
    return;
  }

  const submitButton = elements.wifiForm.querySelector("button[type='submit']");
  submitButton.disabled = true;
  elements.wifiFormStatus.textContent = "Preverjam povezavo z Wi‑Fi omrežjem …";
  try {
    const response = await fetch("/api/wifi", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" },
      body: new URLSearchParams({ ssid, password }),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error ?? "Nastavitev Wi‑Fi ni uspela");

    elements.wifiFormStatus.textContent = "ESP32 preverja povezavo. Nastavitve shrani šele po uspehu …";
  } catch (error) {
    elements.wifiFormStatus.textContent = error.message;
    submitButton.disabled = false;
  }
}

function delay(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function renderWiFiNetworks(networks) {
  elements.wifiNetworks.replaceChildren();
  elements.wifiNetworks.hidden = false;
  if (networks.length === 0) {
    elements.wifiNetworks.textContent = "Ni najdenih Wi‑Fi omrežij.";
    return;
  }

  networks
    .sort((first, second) => Number(second.rssi) - Number(first.rssi))
    .forEach((network) => {
      const option = document.createElement("button");
      const name = document.createElement("span");
      const detail = document.createElement("small");
      option.type = "button";
      option.className = "wifi-network-option";
      name.textContent = network.ssid;
      detail.textContent = `${network.rssi} dBm${network.secured ? " · zaščiteno" : " · odprto"}`;
      option.append(name, detail);
      option.addEventListener("click", () => {
        elements.wifiSsid.value = network.ssid;
        elements.wifiPassword.focus();
        elements.wifiFormStatus.textContent = `Izbrano omrežje: ${network.ssid}`;
      });
      elements.wifiNetworks.append(option);
    });
}

async function scanWiFiNetworks() {
  elements.wifiScan.disabled = true;
  elements.wifiScanStatus.textContent = "Iščem omrežja …";
  try {
    for (let attempt = 0; attempt < 24; attempt += 1) {
      const response = await fetch("/api/wifi/networks", { cache: "no-store" });
      const result = await response.json();
      if (response.status === 202) {
        await delay(500);
        continue;
      }
      if (!response.ok) throw new Error(result.error ?? "Skeniranje Wi‑Fi omrežij ni uspelo");

      renderWiFiNetworks(result.networks ?? []);
      elements.wifiScanStatus.textContent = `Najdenih omrežij: ${(result.networks ?? []).length}`;
      return;
    }
    throw new Error("Skeniranje Wi‑Fi omrežij je poteklo");
  } catch (error) {
    elements.wifiScanStatus.textContent = error.message;
  } finally {
    elements.wifiScan.disabled = false;
  }
}

async function forgetWiFiConfiguration() {
  if (!window.confirm("Izbrišem shranjeni Wi‑Fi? ESP32 bo nato odprl svojo dostopno točko.")) return;

  elements.wifiForget.disabled = true;
  elements.wifiFormStatus.textContent = "Odstranjujem shranjeni Wi‑Fi. Nato se poveži na AP ESP32 …";
  try {
    const response = await fetch("/api/wifi", { method: "DELETE" });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error ?? "Brisanje Wi‑Fi nastavitev ni uspelo");
  } catch (error) {
    elements.wifiFormStatus.textContent = error.message;
    elements.wifiForget.disabled = false;
  }
}

function initializeProvisioningForm() {
  elements.wifiForm.addEventListener("submit", saveWiFiConfiguration);
  elements.wifiScan.addEventListener("click", scanWiFiNetworks);
  elements.wifiForget.addEventListener("click", forgetWiFiConfiguration);
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
      elements.otaLabel.textContent = "OTA izdaja ni javno dosegljiva";
      elements.otaVersion.textContent = "—";
      elements.otaDetail.textContent = "Preveri GitHub Release in javni dostop do repozitorija.";
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
    await set(ref(firebaseDatabase.database, `${cloudDevicePath}/commands/firmware_update`), {
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
  latestHistoryReadings = readings;
  latestHistoryAlreadyAggregated = alreadyAggregated;
  elements.historySummary.textContent = chartReadings.length
    ? `Prikazanih je ${chartReadings.length} povprečnih točk. Za približanje povlecite po grafu.`
    : "Za izbrano obdobje še ni meritev.";
  if (!chart) return;

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
}

function createChart() {
  if (chart) return;
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
  renderHistory(latestHistoryReadings, latestHistoryAlreadyAggregated);
}

function loadHighcharts() {
  if (window.Highcharts) return Promise.resolve();
  if (highchartsLoading) return highchartsLoading;

  highchartsLoading = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "vendor/highcharts.js";
    script.onload = resolve;
    script.onerror = () => reject(new Error("Highcharts ni dosegljiv."));
    document.head.append(script);
  });
  return highchartsLoading;
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

function describeAuthError(error) {
  const messages = {
    "auth/invalid-credential": "E-poštni naslov ali geslo ni pravilno.",
    "auth/email-already-in-use": "Za ta e-poštni naslov račun že obstaja.",
    "auth/weak-password": "Geslo mora imeti najmanj šest znakov.",
    "auth/popup-closed-by-user": "Google prijava je bila zaprta.",
    "auth/operation-not-allowed": "Ta način prijave še ni omogočen v Firebase Authentication.",
  };
  return messages[error?.code] ?? "Postopka ni bilo mogoče dokončati. Poskusi znova.";
}

function setAuthStatus(message) {
  elements.authStatus.textContent = message;
}

function openAuthDialog() {
  setAuthStatus("");
  if (!elements.authDialog.open) elements.authDialog.showModal();
}

async function signInWithEmail(event) {
  event.preventDefault();
  const email = elements.authEmail.value.trim();
  const password = elements.authPassword.value;
  if (!email || !password) return;

  elements.authStatus.textContent = "Prijavljam …";
  try {
    await firebaseAuthModule.signInWithEmailAndPassword(firebaseAuth, email, password);
    elements.authDialog.close();
  } catch (error) {
    console.error(error);
    setAuthStatus(describeAuthError(error));
  }
}

async function registerEmailAccount() {
  const email = elements.authEmail.value.trim();
  const password = elements.authPassword.value;
  if (!email || !password) {
    setAuthStatus("Vnesi e-poštni naslov in geslo.");
    return;
  }

  elements.authStatus.textContent = "Ustvarjam račun …";
  try {
    await firebaseAuthModule.createUserWithEmailAndPassword(firebaseAuth, email, password);
    elements.authDialog.close();
  } catch (error) {
    console.error(error);
    setAuthStatus(describeAuthError(error));
  }
}

async function signInWithGoogle() {
  elements.authStatus.textContent = "Odpiram Google prijavo …";
  try {
    const provider = new firebaseAuthModule.GoogleAuthProvider();
    await firebaseAuthModule.signInWithPopup(firebaseAuth, provider);
    elements.authDialog.close();
  } catch (error) {
    console.error(error);
    setAuthStatus(describeAuthError(error));
  }
}

async function signOutCurrentUser() {
  try {
    await firebaseAuthModule.signOut(firebaseAuth);
  } catch (error) {
    console.error(error);
    setConnectionState("Odjava ni uspela", "error");
  }
}

async function claimDevice(event) {
  event.preventDefault();
  if (!currentCloudUser || !firebaseDatabase) return;

  const deviceId = elements.claimDeviceId.value.trim().toUpperCase();
  const activationCode = elements.claimActivationCode.value.trim().toUpperCase();
  const displayName = elements.claimDeviceName.value.trim();
  if (!isValidDeviceId(deviceId) || !isValidActivationCode(activationCode)) {
    elements.claimDeviceStatus.textContent = "Preveri obliko ID-ja in osemmestne aktivacijske kode.";
    return;
  }

  const { database, ref, remove, set } = firebaseDatabase;
  const claimPath = `device_claims/${deviceId}/${currentCloudUser.uid}`;
  elements.claimDeviceStatus.textContent = "Preverjam aktivacijsko kodo …";
  try {
    await set(ref(database, claimPath), {
      activation_code: activationCode,
      requested_at: Date.now(),
    });
    await set(ref(database, `devices/${deviceId}/owner_uid`), currentCloudUser.uid);
    await set(ref(database, `users/${currentCloudUser.uid}/devices/${deviceId}`), {
      display_name: displayName || deviceId,
      claimed_at: Date.now(),
    });
    await remove(ref(database, claimPath));
    elements.claimDeviceForm.reset();
    elements.claimDeviceStatus.textContent = "Naprava je uspešno registrirana na tvoj račun.";
  } catch (error) {
    console.error(error);
    try {
      await remove(ref(database, claimPath));
    } catch {}
    elements.claimDeviceStatus.textContent = "Registracija ni uspela. Preveri ID, kodo in ali je ESP32 že povezan v Firebase.";
  }
}

function handleCloudAuthState(user) {
  clearCloudDeviceListeners();
  stopCloudDeviceListListener?.();
  stopCloudDeviceListListener = undefined;
  cloudDevices = {};
  currentCloudUser = user;

  if (!user) {
    cloudDevicePath = "";
    elements.accountSection.hidden = true;
    elements.authTrigger.hidden = false;
    elements.authTrigger.textContent = "Prijava";
    resetCloudDashboard();
    setConnectionState("Prijava je potrebna", "error");
    return;
  }

  elements.accountSection.hidden = false;
  elements.authTrigger.hidden = true;
  elements.accountEmail.textContent = user.email || "Google račun";
  const { database, onValue, ref } = firebaseDatabase;
  stopCloudDeviceListListener = onValue(ref(database, `users/${user.uid}/devices`), (snapshot) => {
    cloudDevices = snapshot.val() ?? {};
    renderCloudDeviceSelector();
  }, showDataError);
}

function initializeAuthControls() {
  if (authControlsInitialized) return;
  authControlsInitialized = true;
  elements.authTrigger.addEventListener("click", openAuthDialog);
  elements.authForm.addEventListener("submit", signInWithEmail);
  elements.authRegister.addEventListener("click", registerEmailAccount);
  elements.authGoogle.addEventListener("click", signInWithGoogle);
  elements.authClose.addEventListener("click", () => elements.authDialog.close());
  elements.authSignout.addEventListener("click", signOutCurrentUser);
  elements.cloudDeviceSelect.addEventListener("change", () => selectCloudDevice(elements.cloudDeviceSelect.value));
  elements.claimDeviceForm.addEventListener("submit", claimDevice);
}

async function useLocalDataSource() {
  const response = await fetch("/api/status", { cache: "no-store" });
  if (!response.ok) throw new Error("Lokalni API ni dosegljiv");
  isLocalDashboard = true;
  elements.otaSection.hidden = true;
  elements.authTrigger.hidden = true;
  elements.accountSection.hidden = true;

  async function refreshStatus() {
    const status = await (await fetch("/api/status", { cache: "no-store" })).json();
    renderLatestMeasurement(status.latest);
    renderDeviceStatus(status.device, true);
    renderProvisioning(status.network);
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
  const [{ initializeApp }, authModule, databaseModule, configModule] = await Promise.all([
    import("https://www.gstatic.com/firebasejs/12.16.0/firebase-app.js"),
    import("https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js"),
    import("https://www.gstatic.com/firebasejs/12.16.0/firebase-database.js"),
    import("./firebase-config.js"),
  ]);
  const { endAt, getDatabase, onValue, orderByKey, query, ref, remove, set, startAt } = databaseModule;
  const firebaseApp = initializeApp(configModule.firebaseConfig);
  const database = getDatabase(firebaseApp);
  firebaseAuth = authModule.getAuth(firebaseApp);
  firebaseAuthModule = authModule;
  firebaseDatabase = { database, onValue, ref, remove, set };
  elements.otaSection.hidden = true;
  elements.provisioningSection.hidden = true;
  initializeAuthControls();

  onValue(ref(database, ".info/connected"), (snapshot) => {
    if (currentCloudUser) {
      setConnectionState(snapshot.val() === true ? "Povezano v Cloud" : "Brez povezave s Cloud", snapshot.val() === true ? "connected" : "error");
    }
  }, showDataError);

  refreshHistory = async () => {
    stopHistoryListener?.();
    if (!cloudDevicePath) {
      renderHistory([]);
      return;
    }
    const from = Math.floor(appliedRange.from.getTime() / 1000);
    const to = Math.floor(appliedRange.to.getTime() / 1000);
    const historyQuery = query(ref(database, `${cloudDevicePath}/measurements`), orderByKey(), startAt(String(from)), endAt(String(to)));
    stopHistoryListener = onValue(historyQuery, (snapshot) => {
      const readings = Object.entries(snapshot.val() ?? {}).map(([key, value]) => ({ ...value, timestamp: Number(value.timestamp ?? key) }));
      renderHistory(readings);
    }, showDataError);
  };

  authModule.onAuthStateChanged(firebaseAuth, handleCloudAuthState);
}

async function startDashboard() {
  initializeDateRangePicker();
  initializeOtaControls();
  initializeProvisioningForm();
  setInterval(() => {
    if (latestDeviceStatus) renderDeviceStatus(latestDeviceStatus);
  }, 15_000);

  try {
    await useLocalDataSource();
  } catch {
    await useFirebaseDataSource();
  }

  loadHighcharts()
    .then(() => {
      createChart();
      refreshHistory?.().catch(showDataError);
    })
    .catch((error) => {
      console.error(error);
      elements.historySummary.textContent = "Graf trenutno ni dosegljiv.";
    });
}

window.addEventListener("DOMContentLoaded", startDashboard);
