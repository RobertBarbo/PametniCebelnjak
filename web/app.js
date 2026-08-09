const DEVICE_ONLINE_TIMEOUT_SECONDS = 90;
const LOAD_CELL_TARE_TIMEOUT_SECONDS = 90;
const GITHUB_LATEST_RELEASE_URL = "https://api.github.com/repos/RobertBarbo/PametniCebelnjak/releases/latest";
const OTA_IGNORE_STORAGE_KEY = "pametni-cebelnjak-ignored-ota-version";
const CLOUD_DEVICE_QUERY_PARAMETER = "device";
const CLOUD_DEVICE_STORAGE_KEY = "pametni-cebelnjak-cloud-device-id";
const THEME_STORAGE_KEY = "pametni-cebelnjak-theme";
const DEFAULT_VIEW = "overview";
const SUPER_ADMIN_UID = "Uv2bGWlFt8h9YTsAFoxsNlNsRK72";

const elements = {
  menuToggle: document.querySelector("#menu-toggle"),
  topNavigation: document.querySelector("#top-navigation"),
  themeToggle: document.querySelector("#theme-toggle"),
  themeLabel: document.querySelector("#theme-label"),
  updatesNavigationItem: document.querySelector("#updates-nav-item"),
  navigationButtons: [...document.querySelectorAll("[data-view-target]")],
  viewPanels: [...document.querySelectorAll("[data-view-panel]")],
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
  accountHeading: document.querySelector("#account-heading"),
  accountEmail: document.querySelector("#account-email"),
  authSignout: document.querySelector("#auth-signout"),
  cloudDeviceSelect: document.querySelector("#cloud-device-select"),
  adminDeviceOverview: document.querySelector("#admin-device-overview"),
  adminDeviceList: document.querySelector("#admin-device-list"),
  deviceListEyebrow: document.querySelector("#device-list-eyebrow"),
  selectedDeviceDescription: document.querySelector("#selected-device-description"),
  unclaimDevice: document.querySelector("#unclaim-device"),
  unclaimDeviceStatus: document.querySelector("#unclaim-device-status"),
  deleteDeviceHistory: document.querySelector("#delete-device-history"),
  historyManagementStatus: document.querySelector("#history-management-status"),
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
  cloudWifiSsidCard: document.querySelector("#cloud-wifi-ssid-card"),
  cloudWifiSsid: document.querySelector("#cloud-wifi-ssid"),
  wifiSignal: document.querySelector("#wifi-signal"),
  uptime: document.querySelector("#uptime"),
  deviceId: document.querySelector("#device-id"),
  deviceStateCard: document.querySelector("#device-state-card"),
  deviceStatusDot: document.querySelector("#device-status-dot"),
  deviceOnlineStatus: document.querySelector("#device-online-status"),
  deviceLastSeen: document.querySelector("#device-last-seen"),
  firmwareVersion: document.querySelector("#firmware-version"),
  sdStatus: document.querySelector("#sd-status"),
  sdStatusDetail: document.querySelector("#sd-status-detail"),
  sdCard: document.querySelector(".sd-card"),
  localLoadCellTare: document.querySelector("#local-load-cell-tare"),
  localLoadCellTareStatus: document.querySelector("#local-load-cell-tare-status"),
  cloudLoadCellTare: document.querySelector("#cloud-load-cell-tare"),
  cloudLoadCellTareStatus: document.querySelector("#cloud-load-cell-tare-status"),
  rangeTrigger: document.querySelector("#date-range-trigger"),
  rangeValue: document.querySelector("#date-range-value"),
  rangeDialog: document.querySelector("#date-range-dialog"),
  rangeDialogValue: document.querySelector("#date-range-dialog-value"),
  calendarMonthLabel: document.querySelector("#calendar-month-label"),
  calendarDays: document.querySelector("#calendar-days"),
  startTime: document.querySelector("#range-start-time"),
  endTime: document.querySelector("#range-end-time"),
  updatesHeading: document.querySelector("#updates-heading"),
  updatesSubtitle: document.querySelector("#updates-subtitle"),
  otaSection: document.querySelector("#ota-section"),
  otaCard: document.querySelector("#ota-card"),
  otaLabel: document.querySelector("#ota-label"),
  otaVersion: document.querySelector("#ota-version"),
  otaDetail: document.querySelector("#ota-detail"),
  otaDeviceStatus: document.querySelector("#ota-device-status"),
  otaProgress: document.querySelector("#ota-progress"),
  otaProgressTrack: document.querySelector("#ota-progress-track"),
  otaProgressBar: document.querySelector("#ota-progress-bar"),
  otaProgressText: document.querySelector("#ota-progress-text"),
  otaActions: document.querySelector("#ota-actions"),
  otaInstall: document.querySelector("#ota-install"),
  otaIgnore: document.querySelector("#ota-ignore"),
  localManualUpdateSection: document.querySelector("#local-manual-update-section"),
  localElegantOtaLink: document.querySelector("#local-elegantota-link"),
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
  connectedWifiSsid: document.querySelector("#connected-wifi-ssid"),
  localActivationCard: document.querySelector("#local-activation-card"),
  localActivationCode: document.querySelector("#local-activation-code"),
  cloudSyncStatus: document.querySelector("#cloud-sync-status"),
  cloudResync: document.querySelector("#cloud-resync"),
  deviceCurrentTime: document.querySelector("#device-current-time"),
  deviceTimeSource: document.querySelector("#device-time-source"),
  rtcStatus: document.querySelector("#rtc-status"),
  deviceTimeForm: document.querySelector("#device-time-form"),
  deviceDateTime: document.querySelector("#device-date-time"),
  setDeviceTime: document.querySelector("#set-device-time"),
  syncDeviceTime: document.querySelector("#sync-device-time"),
  deviceTimeStatus: document.querySelector("#device-time-status"),
};

let climateChart;
let weightChart;
let climateChartHasUserZoom = false;
let weightChartHasUserZoom = false;
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
let latestOtaState = "";
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
let latestHistoryManagementStatus;
let latestLoadCellTareStatus;
let latestTimeStatus;
let latestNetworkStatus;
let dashboardDataSourceReady = false;
let historyViewLoading;
let localHistoryRequestGeneration = 0;

const OTA_STATE_LABELS = {
  preparing: "Priprava posodobitve",
  installing: "Namestitev posodobitve",
  downloading_filesystem: "Prenašanje lokalne strani",
  installing_filesystem: "Nameščanje lokalne strani",
  downloading: "Prenašanje firmware-a",
  verifying: "Preverjanje firmware-a",
  restarting: "Ponovni zagon naprave",
  installed: "Posodobitev je uspešna",
  ignored: "Posodobitev je prezrta",
  error: "Napaka OTA",
};

const OTA_ACTIVE_STATES = new Set([
  "preparing",
  "downloading_filesystem",
  "installing_filesystem",
  "downloading",
  "verifying",
  "restarting",
]);

function getCssColor(variableName) {
  return getComputedStyle(document.documentElement).getPropertyValue(variableName).trim();
}

function getChartTheme() {
  return {
    text: getCssColor("--text"),
    textSoft: getCssColor("--text-soft"),
    border: getCssColor("--border"),
    surface: getCssColor("--surface-solid"),
    grid: document.documentElement.dataset.theme === "dark" ? "rgba(237, 246, 239, 0.09)" : "rgba(21, 56, 43, 0.08)",
    temperature: getCssColor("--temperature"),
    humidity: getCssColor("--humidity"),
    weight: getCssColor("--weight"),
  };
}

function updateChartTheme() {
  if (!climateChart && !weightChart) return;
  const colors = getChartTheme();
  const commonOptions = {
    chart: { backgroundColor: "transparent" },
    xAxis: {
      lineColor: colors.border,
      tickColor: colors.border,
      labels: { style: { color: colors.textSoft } },
    },
    legend: { itemStyle: { color: colors.text, fontWeight: "600" }, itemHoverStyle: { color: colors.text } },
    tooltip: { backgroundColor: colors.surface, borderColor: colors.border, style: { color: colors.text } },
  };

  climateChart?.update({
    ...commonOptions,
    yAxis: [
      { title: { text: "°C", style: { color: colors.textSoft } }, labels: { style: { color: colors.textSoft } }, gridLineColor: colors.grid },
      { title: { text: "%", style: { color: colors.textSoft } }, labels: { style: { color: colors.textSoft } }, gridLineWidth: 0, opposite: true },
    ],
  }, false);
  weightChart?.update({
    ...commonOptions,
    yAxis: [{ title: { text: "kg", style: { color: colors.textSoft } }, labels: { style: { color: colors.textSoft } }, gridLineColor: colors.grid }],
  }, false);
  renderHistory(latestHistoryReadings, latestHistoryAlreadyAggregated);
}

function applyTheme(theme, persist = true) {
  const selectedTheme = theme === "dark" ? "dark" : "light";
  document.documentElement.dataset.theme = selectedTheme;
  elements.themeLabel.textContent = selectedTheme === "dark" ? "Svetla tema" : "Temna tema";
  elements.themeToggle.setAttribute("aria-pressed", String(selectedTheme === "dark"));
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", selectedTheme === "dark" ? "#0e1713" : "#f4f1e8");
  if (persist) localStorage.setItem(THEME_STORAGE_KEY, selectedTheme);
  updateChartTheme();
}

function initializeTheme() {
  applyTheme(document.documentElement.dataset.theme, false);
  elements.themeToggle.addEventListener("click", () => {
    applyTheme(document.documentElement.dataset.theme === "dark" ? "light" : "dark");
  });

  const colorSchemeQuery = window.matchMedia("(prefers-color-scheme: dark)");
  const handleColorSchemeChange = (event) => {
    if (!localStorage.getItem(THEME_STORAGE_KEY)) applyTheme(event.matches ? "dark" : "light", false);
  };
  if (colorSchemeQuery.addEventListener) colorSchemeQuery.addEventListener("change", handleColorSchemeChange);
  else colorSchemeQuery.addListener(handleColorSchemeChange);
}

function showView(viewName, updateLocation = true) {
  const targetPanel = elements.viewPanels.find((panel) => panel.dataset.viewPanel === viewName);
  const selectedView = targetPanel ? viewName : DEFAULT_VIEW;

  elements.viewPanels.forEach((panel) => {
    const isActive = panel.dataset.viewPanel === selectedView;
    panel.hidden = !isActive;
    panel.classList.toggle("active", isActive);
  });
  elements.navigationButtons.forEach((button) => {
    const isActive = button.dataset.viewTarget === selectedView && button.classList.contains("nav-link");
    button.classList.toggle("active", isActive);
    if (isActive) button.setAttribute("aria-current", "page");
    else button.removeAttribute("aria-current");
  });

  elements.topNavigation.classList.remove("open");
  elements.menuToggle.setAttribute("aria-expanded", "false");
  if (updateLocation) history.replaceState(null, "", `#${selectedView}`);
  window.scrollTo({ top: 0, behavior: "smooth" });

  if (selectedView === "history") {
    ensureHistoryViewReady().catch(showDataError);
  }
}

function isHistoryViewActive() {
  return elements.viewPanels.some((panel) => panel.dataset.viewPanel === "history" && !panel.hidden);
}

async function ensureHistoryViewReady() {
  if (!dashboardDataSourceReady || !refreshHistory) return;

  if (!historyViewLoading) {
    elements.historySummary.textContent = "Nalagam grafe in zgodovino meritev …";
    historyViewLoading = loadHighcharts()
      .then(async () => {
        createCharts();
        await refreshHistory();
      })
      .finally(() => {
        historyViewLoading = undefined;
      });
  }

  await historyViewLoading;
  requestAnimationFrame(() => {
    climateChart?.reflow();
    weightChart?.reflow();
  });
}

function refreshVisibleHistory() {
  if (isHistoryViewActive()) ensureHistoryViewReady().catch(showDataError);
}

function initializeNavigation() {
  elements.navigationButtons.forEach((button) => {
    button.addEventListener("click", () => showView(button.dataset.viewTarget));
  });
  elements.menuToggle.addEventListener("click", () => {
    const isOpen = elements.topNavigation.classList.toggle("open");
    elements.menuToggle.setAttribute("aria-expanded", String(isOpen));
  });
  window.addEventListener("hashchange", () => showView(window.location.hash.slice(1), false));
  showView(window.location.hash.slice(1) || DEFAULT_VIEW, false);
}

function isValidDeviceId(deviceId) {
  return /^CB-[A-F0-9]{12}$/.test(String(deviceId));
}

function isValidActivationCode(activationCode) {
  return /^[A-HJ-NP-Z2-9]{8}$/.test(String(activationCode));
}

function isCloudAdministrator() {
  return currentCloudUser?.uid === SUPER_ADMIN_UID;
}

function configureCloudAccountView() {
  const isAdministrator = isCloudAdministrator();
  elements.accountHeading.textContent = isAdministrator ? "Vsi panji" : "Moji panji";
  elements.deviceListEyebrow.textContent = isAdministrator ? "Skrbniški pregled" : "Moji panji";
  elements.selectedDeviceDescription.textContent = isAdministrator
    ? "Skrbniški račun ima ogled vseh registriranih panjev."
    : "Izberi panj, katerega podatke želiš pregledovati.";
  elements.claimDeviceForm.hidden = isAdministrator;
  elements.adminDeviceOverview.hidden = !isAdministrator;
  elements.unclaimDevice.hidden = isAdministrator;
}

function setCloudDeviceManagementVisibility(isVisible) {
  document.querySelectorAll("[data-cloud-device-management]").forEach((element) => {
    element.hidden = !isVisible;
  });
}

function clearCloudDeviceListeners() {
  stopCloudDeviceListeners.forEach((unsubscribe) => unsubscribe());
  stopCloudDeviceListeners = [];
  stopHistoryListener?.();
  stopHistoryListener = undefined;
}

function resetCloudDashboard() {
  setCloudDeviceManagementVisibility(false);
  latestDeviceStatus = undefined;
  latestHistoryManagementStatus = undefined;
  renderLatestMeasurement(null);
  renderDeviceStatus(null);
  renderSDStatus(null);
  renderFirmwareVersion(null);
  renderLoadCellTareStatus(null);
  renderTimeStatus(null);
  elements.otaDeviceStatus.textContent = "Naprava še ni prejela OTA ukaza.";
  resetOtaProgress();
  elements.otaActions.hidden = true;
  renderHistory([]);
  renderHistoryManagementStatus(null);
}

function renderCloudDeviceSelector() {
  const deviceIds = Object.keys(cloudDevices);
  const requestedDeviceId = new URLSearchParams(window.location.search).get(CLOUD_DEVICE_QUERY_PARAMETER);
  const storedDeviceId = localStorage.getItem(CLOUD_DEVICE_STORAGE_KEY);
  const preferredDeviceId = [requestedDeviceId, storedDeviceId, cloudDevicePath.replace("devices/", "")]
    .find((deviceId) => deviceIds.includes(deviceId));

  elements.cloudDeviceSelect.replaceChildren();
  if (!deviceIds.length) {
    elements.cloudDeviceSelect.append(new Option("Noben panj ni registriran", ""));
    elements.cloudDeviceSelect.disabled = true;
    selectCloudDevice("");
    renderAdminDeviceOverview([]);
    return;
  }

  deviceIds.sort().forEach((deviceId) => {
    const device = cloudDevices[deviceId] ?? {};
    const displayName = isCloudAdministrator() ? deviceId : device.display_name || deviceId;
    elements.cloudDeviceSelect.append(new Option(displayName, deviceId));
  });
  elements.cloudDeviceSelect.disabled = false;
  const nextDeviceId = preferredDeviceId || deviceIds[0];
  elements.cloudDeviceSelect.value = nextDeviceId;
  renderAdminDeviceOverview(deviceIds);
  if (cloudDevicePath === `devices/${nextDeviceId}`) return;
  selectCloudDevice(nextDeviceId);
}

function renderAdminDeviceOverview(deviceIds = Object.keys(cloudDevices)) {
  if (!isCloudAdministrator()) return;

  elements.adminDeviceList.replaceChildren();
  if (!deviceIds.length) {
    const emptyState = document.createElement("p");
    emptyState.className = "muted";
    emptyState.textContent = "V Firebase še ni zaznan noben panj.";
    elements.adminDeviceList.append(emptyState);
    return;
  }

  deviceIds.sort().forEach((deviceId) => {
    const device = cloudDevices[deviceId] ?? {};
    const status = device.status?.device;
    const isOnline = isDeviceOnline(status);
    const card = document.createElement("button");
    card.type = "button";
    card.className = `admin-device-option${cloudDevicePath === `devices/${deviceId}` ? " selected" : ""}`;
    card.setAttribute("aria-pressed", String(cloudDevicePath === `devices/${deviceId}`));
    card.addEventListener("click", () => selectCloudDevice(deviceId));

    const name = document.createElement("strong");
    name.textContent = deviceId;
    const state = document.createElement("span");
    state.className = `admin-device-option-state ${isOnline ? "online" : "offline"}`;
    const dot = document.createElement("span");
    dot.className = "device-status-dot";
    dot.setAttribute("aria-hidden", "true");
    const stateText = document.createElement("span");
    stateText.textContent = isOnline ? "Online" : "Offline";
    state.append(dot, stateText);

    const detail = document.createElement("small");
    const lastSeenTimestamp = Number(status?.last_seen_timestamp);
    detail.textContent = Number.isFinite(lastSeenTimestamp) && lastSeenTimestamp > 0
      ? `Zadnji odziv: ${formatDashboardDateTime(new Date(lastSeenTimestamp * 1000))}`
      : "Naprava še ni poslala stanja.";
    card.append(name, state, detail);
    elements.adminDeviceList.append(card);
  });
}

function selectCloudDevice(deviceId) {
  clearCloudDeviceListeners();
  cloudDevicePath = deviceId ? `devices/${deviceId}` : "";
  setCloudDeviceManagementVisibility(Boolean(cloudDevicePath && currentCloudUser));
  elements.cloudDeviceSelect.value = deviceId;
  renderAdminDeviceOverview();
  elements.unclaimDevice.disabled = !cloudDevicePath || isCloudAdministrator();
  elements.unclaimDeviceStatus.textContent = "";
  elements.otaSection.hidden = !cloudDevicePath;
  if (!cloudDevicePath || !firebaseDatabase) {
    resetCloudDashboard();
    return;
  }

  // Ne prikazuj stanja prej izbranega panja, dokler Firebase ne vrne novega odziva.
  renderDeviceStatus(null);
  renderHistoryManagementStatus(null);
  renderLoadCellTareStatus(null);
  renderTimeStatus(null);
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
  subscribe("status/history", renderHistoryManagementStatus);
  subscribe("status/load_cell", renderLoadCellTareStatus);
  historyViewLoading = undefined;
  refreshVisibleHistory();
}

function setConnectionState(text, state = "connected") {
  elements.connectionStatus.className = `connection-status ${state}`;
  elements.connectionStatus.setAttribute("aria-label", text);
  elements.connectionText.textContent = text;
}

function isDeviceOnline(status) {
  const lastSeenTimestamp = Number(status?.last_seen_timestamp);
  const secondsSinceLastSeen = Math.floor(Date.now() / 1000) - lastSeenTimestamp;
  return Number.isFinite(lastSeenTimestamp) && lastSeenTimestamp > 0
    && secondsSinceLastSeen <= DEVICE_ONLINE_TIMEOUT_SECONDS;
}

function renderHeaderDeviceState() {
  if (isLocalDashboard) {
    setConnectionState("Lokalna povezava", "connected");
    return;
  }
  if (!currentCloudUser) {
    setConnectionState("Prijava je potrebna", "error");
    return;
  }
  if (!cloudDevicePath) {
    setConnectionState("Izberi panj", "connecting");
    return;
  }
  if (isDeviceOnline(latestDeviceStatus)) {
    setConnectionState("Naprava online", "connected");
    return;
  }

  const lastSeenTimestamp = Number(latestDeviceStatus?.last_seen_timestamp);
  setConnectionState(
    Number.isFinite(lastSeenTimestamp) && lastSeenTimestamp > 0 ? "Naprava offline" : "Čakam na odziv naprave …",
    Number.isFinite(lastSeenTimestamp) && lastSeenTimestamp > 0 ? "error" : "connecting",
  );
}

function formatValue(value, decimals = 1) {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue.toFixed(decimals) : "—";
}

function formatDashboardDate(date) {
  return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
}

function formatDashboardTime(date, includeSeconds = false) {
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");
  return includeSeconds ? `${hours}:${minutes}:${seconds}` : `${hours}:${minutes}`;
}

function formatDashboardDateTime(date, includeSeconds = false) {
  return `${formatDashboardDate(date)} ob ${formatDashboardTime(date, includeSeconds)}`;
}

function formatDateTimeInput(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
}

function formatStoredDate(dateValue) {
  const match = String(dateValue).match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  return match ? `${Number(match[3])}/${Number(match[2])}/${Number(match[1])}` : String(dateValue);
}

function formatDateTime(record) {
  if (record?.date && record?.time) return `${formatStoredDate(record.date)} ob ${record.time}`;

  const timestamp = Number(record?.timestamp);
  return Number.isFinite(timestamp)
    ? formatDashboardDateTime(new Date(timestamp * 1000), true)
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
  return `${formatDashboardDateTime(range.from)} – ${formatDashboardDateTime(range.to)}`;
}

function renderLatestMeasurement(measurement) {
  elements.temperature.textContent = formatValue(measurement?.temperature_c);
  elements.humidity.textContent = formatValue(measurement?.humidity_percent);
  elements.weight.textContent = formatValue(measurement?.weight_kg, 1);
  elements.latestTime.textContent = formatDateTime(measurement);
}

function renderDeviceStatus(status, localDashboard = isLocalDashboard) {
  latestDeviceStatus = status;
  elements.deviceId.textContent = status?.device_id ?? "—";
  elements.cloudWifiSsidCard.hidden = localDashboard;
  elements.cloudWifiSsid.textContent = status?.station_ssid || "—";
  elements.ipAddress.textContent = status?.ip_address ?? "—";
  elements.wifiSignal.textContent = Number.isFinite(Number(status?.wifi_rssi_dbm)) ? `${status.wifi_rssi_dbm} dBm` : "—";
  const values = [status?.uptime_days, status?.uptime_hours, status?.uptime_minutes];
  elements.uptime.textContent = values.every((value) => value !== undefined)
    ? `${values[0]} dni ${String(values[1]).padStart(2, "0")} h ${String(values[2]).padStart(2, "0")} min`
    : "—";

  const lastSeenTimestamp = Number(status?.last_seen_timestamp);
  const isOnline = localDashboard || isDeviceOnline(status);
  elements.deviceStateCard.classList.toggle("online", isOnline);
  elements.deviceStateCard.classList.toggle("offline", !isOnline);
  elements.deviceStatusDot.classList.toggle("online", isOnline);
  elements.deviceStatusDot.classList.toggle("offline", !isOnline);
  elements.deviceOnlineStatus.textContent = isOnline ? "Online" : "Offline";
  elements.deviceLastSeen.textContent = localDashboard
    ? "Dosegljiv prek lokalnega IP-ja."
    : Number.isFinite(lastSeenTimestamp) && lastSeenTimestamp > 0
      ? `Zadnji odziv: ${formatDashboardDateTime(new Date(lastSeenTimestamp * 1000))}`
       : "Čakam na prvi odziv naprave.";

  renderHeaderDeviceState();
  renderLoadCellTareStatus(latestLoadCellTareStatus);
  if (!localDashboard) renderTimeStatus(status);
}

function renderTimeStatus(status, network = latestNetworkStatus) {
  latestTimeStatus = status;
  const timestamp = Number(status?.timestamp ?? status?.current_time_timestamp);
  const source = status?.source ?? status?.time_source ?? "unavailable";
  const rtcPresent = status?.rtc_present === true;
  const rtcValid = status?.rtc_valid === true;
  const ntpPending = status?.ntp_sync_pending === true;
  const lastSyncTimestamp = Number(status?.last_sync_timestamp ?? status?.last_time_sync_timestamp);
  const sourceLabels = {
    rtc: "Vir časa: DS3231 RTC",
    ntp: "Vir časa: internetna NTP ura",
    manual_local: "Vir časa: ročna lokalna nastavitev",
    manual_cloud: "Vir časa: ročna cloud nastavitev",
    unavailable: "Veljaven čas še ni na voljo",
  };

  elements.deviceCurrentTime.textContent = Number.isFinite(timestamp) && timestamp > 0
    ? formatDashboardDateTime(new Date(timestamp * 1000), true)
    : "—";
  elements.deviceTimeSource.textContent = sourceLabels[source] ?? sourceLabels.unavailable;
  if (!rtcPresent) {
    elements.rtcStatus.textContent = "DS3231 ni zaznan. Ročna ali NTP ura se ob izpadu napajanja ne bo ohranila.";
  } else if (!rtcValid) {
    elements.rtcStatus.textContent = "DS3231 je zaznan, vendar nima veljavnega časa. Preveri baterijo in nastavi uro.";
  } else if (Number.isFinite(lastSyncTimestamp) && lastSyncTimestamp > 0) {
    elements.rtcStatus.textContent = `DS3231 je pripravljen. Zadnja nastavitev: ${formatDashboardDateTime(new Date(lastSyncTimestamp * 1000), true)}.`;
  } else {
    elements.rtcStatus.textContent = "DS3231 je zaznan in vsebuje veljaven čas.";
  }

  if (document.activeElement !== elements.deviceDateTime && Number.isFinite(timestamp) && timestamp > 0) {
    elements.deviceDateTime.value = formatDateTimeInput(new Date(timestamp * 1000));
  }

  const cloudDeviceReady = Boolean(cloudDevicePath && currentCloudUser && isDeviceOnline(latestDeviceStatus));
  const canSetTime = isLocalDashboard || cloudDeviceReady;
  const internetAvailable = isLocalDashboard ? network?.station_connected === true : cloudDeviceReady;
  elements.setDeviceTime.disabled = !canSetTime || ntpPending;
  elements.syncDeviceTime.disabled = !internetAvailable || ntpPending;
  if (ntpPending) {
    elements.deviceTimeStatus.textContent = "Čakam na internetno časovno sinhronizacijo …";
  } else if (!isLocalDashboard && cloudDevicePath && currentCloudUser && !cloudDeviceReady) {
    elements.deviceTimeStatus.textContent = "Panj je offline; nastavljanje datuma in ure trenutno ni možno.";
  }
}

function renderLoadCellTareStatus(status) {
  latestLoadCellTareStatus = status;
  const reportedState = status?.state ?? status?.tare_state ?? "idle";
  const updatedAt = Number(status?.updated_at);
  const isStaleCloudTare = !isLocalDashboard &&
    (reportedState === "queued" || reportedState === "taring") &&
    (!Number.isFinite(updatedAt) || (Date.now() / 1000) - updatedAt > LOAD_CELL_TARE_TIMEOUT_SECONDS);
  const state = isStaleCloudTare ? "error" : reportedState;
  const messages = {
    idle: "S ploščadi odstrani vse in nato tariraj tehtnico.",
    queued: "Ukaz za tariranje čaka na izvedbo.",
    taring: "Nastavljam prazno ploščad na 0,00 kg …",
    completed: "Tariranje je uspešno; nova ničla je shranjena.",
    error: "Tariranje ni uspelo. Preveri povezavo HX711.",
  };
  const isBusy = state === "queued" || state === "taring";
  const loadCellReady = status?.ready !== false;
  const cloudDeviceReady = Boolean(cloudDevicePath && currentCloudUser && isDeviceOnline(latestDeviceStatus));
  const canTare = isLocalDashboard ? loadCellReady : cloudDeviceReady;
  const button = isLocalDashboard ? elements.localLoadCellTare : elements.cloudLoadCellTare;
  const statusElement = isLocalDashboard ? elements.localLoadCellTareStatus : elements.cloudLoadCellTareStatus;

  button.disabled = !canTare || isBusy;
  statusElement.textContent = isStaleCloudTare
    ? "Prejšnje tariranje se ni zaključilo. Odstrani uteži in poskusi znova."
    : !isLocalDashboard && !cloudDeviceReady
      ? cloudDevicePath
        ? "Panj je offline; tariranje trenutno ni možno."
        : "Izberi online panj za tariranje."
    : status?.message ?? messages[state] ?? messages.idle;
}

function renderProvisioning(network) {
  latestNetworkStatus = network;
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
  elements.connectedWifiSsid.textContent = isConnected && network?.station_ssid ? network.station_ssid : "—";

  if (isConnecting) {
    elements.provisioningDescription.textContent = `ESP32 preverja izbrano Wi‑Fi omrežje. Ostani povezan na dostopni točki${accessPointName}.`;
  } else if (isConnected) {
    elements.provisioningDescription.textContent = network?.station_ssid
      ? `Naprava je povezana v Wi‑Fi omrežje ${network.station_ssid}. Nastavitve lahko po potrebi spremeniš ali izbrišeš.`
      : "Naprava je povezana v domače Wi‑Fi omrežje.";
  } else if (connectionState === "connected") {
    elements.provisioningDescription.textContent = "Povezava z Wi‑Fi je uspela. Čakam na potrditev omrežnega naslova.";
  } else if (connectionState === "failed") {
    elements.provisioningDescription.textContent = `Povezava z Wi‑Fi ni uspela. AP${accessPointName} ostaja na voljo za ponoven poskus.`;
  } else if (isUsingAccessPoint) {
    elements.provisioningDescription.textContent = `Povezan si neposredno na dostopno točko ESP32${accessPointName}. Vpiši domače Wi‑Fi omrežje za dostop do clouda.`;
  }

  elements.wifiScan.disabled = isConnecting;
  elements.wifiForget.disabled = isConnecting;
  elements.wifiForm.querySelector("button[type='submit']").disabled = isConnecting;
  if (network?.connection_message) elements.wifiFormStatus.textContent = network.connection_message;
}

function renderCloudSynchronization(sync, network, sdCard) {
  const isPending = sync?.pending === true;
  const isCaughtUp = sync?.caught_up === true;
  const hasCloudConnection = network?.station_connected === true;
  const hasSDCard = sdCard?.present === true;
  const retrySeconds = Number(sync?.retry_seconds);
  const lastSyncedTimestamp = Number(sync?.last_synced_timestamp);

  if (!hasSDCard) {
    elements.cloudSyncStatus.textContent = "SD kartica ni dosegljiva.";
  } else if (!hasCloudConnection) {
    elements.cloudSyncStatus.textContent = "Cloud ni dosegljiv; meritve varno čakajo na SD kartici.";
  } else if (isPending) {
    const lastRecordText = Number.isFinite(lastSyncedTimestamp) && lastSyncedTimestamp > 0
      ? ` Zadnji potrjen zapis: ${formatDashboardDateTime(new Date(lastSyncedTimestamp * 1000))}.`
      : " Čakam na potrditev prvega zapisa.";
    elements.cloudSyncStatus.textContent = `Pošiljam zgodovino v Firebase …${lastRecordText}`;
  } else if (isCaughtUp) {
    elements.cloudSyncStatus.textContent = "SD kartica in Firebase sta sinhronizirana.";
  } else if (Number.isFinite(lastSyncedTimestamp) && lastSyncedTimestamp > 0) {
    const retryText = Number.isFinite(retrySeconds) && retrySeconds > 2 ? ` Razmik ponovnih poskusov: ${retrySeconds} s.` : "";
    elements.cloudSyncStatus.textContent = `Zadnji preneseni zapis: ${formatDashboardDateTime(new Date(lastSyncedTimestamp * 1000))}.${retryText}`;
  } else {
    elements.cloudSyncStatus.textContent = "Zgodovina čaka na prvi prenos v Firebase.";
  }

  elements.cloudResync.disabled = isPending || !hasSDCard;
}

function renderHistoryManagementStatus(status) {
  latestHistoryManagementStatus = status;
  const hasSelectedDevice = Boolean(cloudDevicePath && currentCloudUser && firebaseDatabase);
  const state = status?.state;
  const isDeleting = state === "queued" || state === "deleting";
  const isSelectedDeviceOnline = hasSelectedDevice && isDeviceOnline(latestDeviceStatus);
  elements.deleteDeviceHistory.disabled = !isSelectedDeviceOnline || isDeleting;

  if (!hasSelectedDevice) {
    elements.historyManagementStatus.textContent = "Izberi panj za upravljanje zgodovine.";
    return;
  }
  if (!isSelectedDeviceOnline) {
    elements.historyManagementStatus.textContent = "Panj je offline; brisanje merilne zgodovine trenutno ni možno.";
    return;
  }
  if (!state) {
    elements.historyManagementStatus.textContent = "Naprava je online in pripravljena na brisanje merilne zgodovine.";
    return;
  }

  const messages = {
    queued: "Ukaz za brisanje čaka, da ga ESP32 prevzame.",
    deleting: "ESP32 briše SD dnevnik in cloud zgodovino …",
    completed: "SD dnevnik in cloud zgodovina sta izbrisana.",
    error: "Brisanje ni uspelo. Preveri stanje naprave in SD kartice.",
  };
  elements.historyManagementStatus.textContent = status?.message || messages[state] || "Stanje brisanja ni znano.";
}

function confirmPermanentHistoryDeletion(message) {
  return window.prompt(`${message}\n\nZa potrditev vpiši IZBRIŠI.`) === "IZBRIŠI";
}

async function deleteDeviceHistory() {
  if (!cloudDevicePath || !firebaseDatabase) return;
  if (!isDeviceOnline(latestDeviceStatus)) {
    elements.historyManagementStatus.textContent = "Za popoln izbris mora biti ESP32 online.";
    return;
  }
  if (!confirmPermanentHistoryDeletion("Trajno izbrišem vse meritve iz SD kartice in Firebase? Tega ni mogoče razveljaviti.")) return;

  elements.deleteDeviceHistory.disabled = true;
  elements.historyManagementStatus.textContent = "Ukaz za popoln izbris pošiljam ESP32 napravi …";
  try {
    const { database, ref, set } = firebaseDatabase;
    await set(ref(database, `${cloudDevicePath}/commands/firmware_update`), {
      action: "delete_history",
      requested_at: Math.floor(Date.now() / 1000),
    });
    elements.historyManagementStatus.textContent = "Ukaz je poslan. ESP32 ga preveri v največ 30 sekundah.";
  } catch (error) {
    console.error(error);
    elements.historyManagementStatus.textContent = "Pošiljanje ukaza za brisanje ni uspelo.";
    renderHistoryManagementStatus(latestHistoryManagementStatus);
  }
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

async function resetCloudHistorySynchronization() {
  if (!window.confirm("Ponovno pošljem celoten SD dnevnik v Firebase? Obstoječi zapisi z istim časom bodo varno prepisani.")) return;

  elements.cloudResync.disabled = true;
  elements.cloudSyncStatus.textContent = "Ponastavljam položaj sinhronizacije …";
  try {
    const response = await fetch("/api/sync/reset", { method: "POST" });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error ?? "Ponastavitev sinhronizacije ni uspela");
    elements.cloudSyncStatus.textContent = "Ponovni prenos celotne zgodovine se je začel.";
  } catch (error) {
    elements.cloudSyncStatus.textContent = error.message;
    elements.cloudResync.disabled = false;
  }
}

async function requestLoadCellTare() {
  if (!window.confirm("Odstrani panj in vse uteži s ploščadi. Trenutno stanje bo nastavljeno na 0,00 kg. Nadaljujem?")) return;

  const previousStatus = latestLoadCellTareStatus;
  const button = isLocalDashboard ? elements.localLoadCellTare : elements.cloudLoadCellTare;
  const statusElement = isLocalDashboard ? elements.localLoadCellTareStatus : elements.cloudLoadCellTareStatus;
  button.disabled = true;
  statusElement.textContent = isLocalDashboard
    ? "Tariranje pošiljam ESP32 …"
    : "Ukaz za tariranje pošiljam napravi …";
  try {
    if (isLocalDashboard) {
      const response = await fetch("/api/sensors/load-cell/tare", { method: "POST" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Tariranja ni bilo mogoče začeti");
    } else {
      if (!cloudDevicePath || !firebaseDatabase || !currentCloudUser || !isDeviceOnline(latestDeviceStatus)) {
        throw new Error("Za tariranje mora biti izbrani ESP32 online");
      }
      const { database, ref, set } = firebaseDatabase;
      await set(ref(database, `${cloudDevicePath}/commands/firmware_update`), {
        action: "tare_load_cell",
        requested_at: Math.floor(Date.now() / 1000),
      });
    }
    renderLoadCellTareStatus({ state: "queued" });
  } catch (error) {
    latestLoadCellTareStatus = previousStatus;
    renderLoadCellTareStatus(previousStatus);
    statusElement.textContent = error.message;
  }
}

async function sendDeviceTimeCommand(action, timestamp) {
  if (isLocalDashboard) {
    const body = new URLSearchParams({ action });
    if (timestamp !== undefined) body.set("timestamp", String(timestamp));
    const response = await fetch("/api/time", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" },
      body,
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error ?? "Nastavitev časa ni uspela");
    return;
  }

  if (!cloudDevicePath || !firebaseDatabase || !currentCloudUser || !isDeviceOnline(latestDeviceStatus)) {
    throw new Error("Za nastavitev časa mora biti izbrana naprava online");
  }
  const { database, ref, set } = firebaseDatabase;
  const command = { action, requested_at: Math.floor(Date.now() / 1000) };
  if (timestamp !== undefined) command.timestamp = timestamp;
  await set(ref(database, `${cloudDevicePath}/commands/time`), command);
}

async function setDeviceTime(event) {
  event.preventDefault();
  const selectedDate = new Date(elements.deviceDateTime.value);
  const timestamp = Math.floor(selectedDate.getTime() / 1000);
  if (!Number.isFinite(timestamp) || selectedDate.getFullYear() < 2023 || selectedDate.getFullYear() > 2099) {
    elements.deviceTimeStatus.textContent = "Izberi veljaven datum med letoma 2023 in 2099.";
    return;
  }

  elements.setDeviceTime.disabled = true;
  elements.syncDeviceTime.disabled = true;
  elements.deviceTimeStatus.textContent = isLocalDashboard
    ? "Ročno nastavitev pošiljam napravi …"
    : "Ročno nastavitev pošiljam izbranemu panju …";
  try {
    await sendDeviceTimeCommand("set", timestamp);
    elements.deviceTimeStatus.textContent = isLocalDashboard
      ? "Nastavitev je sprejeta. ESP32 bo posodobil sistemsko uro in DS3231."
      : "Ukaz je poslan. Naprava ga prevzame v največ 15 sekundah.";
  } catch (error) {
    elements.deviceTimeStatus.textContent = error.message;
    renderTimeStatus(latestTimeStatus);
  }
}

async function synchronizeDeviceTime() {
  elements.setDeviceTime.disabled = true;
  elements.syncDeviceTime.disabled = true;
  elements.deviceTimeStatus.textContent = "Zahtevam sinhronizacijo z internetno uro …";
  try {
    await sendDeviceTimeCommand("sync_ntp");
    elements.deviceTimeStatus.textContent = isLocalDashboard
      ? "NTP sinhronizacija je uvrščena."
      : "Ukaz je poslan. Naprava ga prevzame v največ 15 sekundah.";
  } catch (error) {
    elements.deviceTimeStatus.textContent = error.message;
    renderTimeStatus(latestTimeStatus);
  }
}

function initializeProvisioningForm() {
  elements.wifiForm.addEventListener("submit", saveWiFiConfiguration);
  elements.wifiScan.addEventListener("click", scanWiFiNetworks);
  elements.wifiForget.addEventListener("click", forgetWiFiConfiguration);
  elements.cloudResync.addEventListener("click", resetCloudHistorySynchronization);
  elements.localLoadCellTare.addEventListener("click", requestLoadCellTare);
  elements.cloudLoadCellTare.addEventListener("click", requestLoadCellTare);
  elements.deviceTimeForm.addEventListener("submit", setDeviceTime);
  elements.syncDeviceTime.addEventListener("click", synchronizeDeviceTime);
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

function resetOtaProgress() {
  elements.otaProgress.hidden = true;
  elements.otaProgressBar.style.width = "0%";
  elements.otaProgressTrack.setAttribute("aria-valuenow", "0");
  elements.otaProgressTrack.removeAttribute("aria-valuetext");
  elements.otaProgressText.textContent = "Skupaj 0 %";
  elements.otaCard.classList.remove("ota-error");
}

function updateOtaActionState() {
  const isOtaActive = otaCommandPending || OTA_ACTIVE_STATES.has(latestOtaState);
  const hasAvailableRelease = Boolean(availableOtaRelease);
  elements.otaInstall.disabled = !hasAvailableRelease || isOtaActive;
  elements.otaIgnore.disabled = !hasAvailableRelease || isOtaActive;
  elements.otaInstall.textContent = isOtaActive ? "Posodobitev poteka" : "Posodobi napravo";
  elements.otaCard.setAttribute("aria-busy", String(isOtaActive));
}

function renderOtaProgress(progressPercent, hasError = false) {
  const numericProgress = Number(progressPercent);
  const hasProgress = Number.isFinite(numericProgress);
  elements.otaCard.classList.toggle("ota-error", hasError);
  elements.otaProgress.hidden = !hasProgress;
  if (!hasProgress) return;

  const clampedProgress = Math.max(0, Math.min(100, Math.round(numericProgress)));
  elements.otaProgressBar.style.width = `${clampedProgress}%`;
  elements.otaProgressTrack.setAttribute("aria-valuenow", String(clampedProgress));
  elements.otaProgressTrack.setAttribute("aria-valuetext", `Skupni napredek OTA: ${clampedProgress} %`);
  elements.otaProgressText.textContent = `Skupaj ${clampedProgress} %`;
}

function renderOtaDeviceStatus(status) {
  if (!status?.state) {
    latestOtaState = "";
    resetOtaProgress();
    updateOtaActionState();
    return;
  }

  const state = String(status.state);
  latestOtaState = state;
  const stateLabel = OTA_STATE_LABELS[state] ?? state;
  const message = String(status.message ?? "").trim();
  const hasRepeatedPhase = message.toLocaleLowerCase().startsWith(stateLabel.toLocaleLowerCase());
  elements.otaDeviceStatus.textContent = message && hasRepeatedPhase ? message : `${stateLabel}${message ? `: ${message}` : ""}`;
  renderOtaProgress(status.progress_percent, state === "error");

  if (state === "error") {
    otaCommandPending = false;
  } else if (state === "installed") {
    otaCommandPending = false;
    elements.otaActions.hidden = true;
  }
  if (state === "error" && availableOtaRelease) elements.otaActions.hidden = false;
  updateOtaActionState();
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
  updateOtaActionState();
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
  updateOtaActionState();
  renderOtaProgress(0);
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
    updateOtaActionState();
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
  if (rangeSeconds <= 24 * 60 * 60) return 60;
  if (rangeSeconds <= 7 * 24 * 60 * 60) return 60 * 60;
  if (rangeSeconds <= 31 * 24 * 60 * 60) return 6 * 60 * 60;
  return 24 * 60 * 60;
}

function getCloudHistorySource(from, to) {
  const duration = to - from;
  if (duration <= 7 * 24 * 60 * 60) {
    return { path: "measurements", periodSeconds: 0 };
  }
  if (duration <= 31 * 24 * 60 * 60) {
    return { path: "aggregates/hourly", periodSeconds: 60 * 60 };
  }
  return { path: "aggregates/daily", periodSeconds: 24 * 60 * 60 };
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
    const sampleCount = Math.max(1, Number(reading.sample_count) || 1);

    const bucket = Math.floor(timestamp / bucketSeconds) * bucketSeconds;
    const current = buckets.get(bucket) ?? { timestamp: bucket, count: 0, temperature: 0, humidity: 0, weight: 0 };
    current.count += sampleCount;
    current.temperature += temperature * sampleCount;
    current.humidity += humidity * sampleCount;
    current.weight += weight * sampleCount;
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
    ? `Prikazanih je ${chartReadings.length} povprečnih točk. Za približanje povlecite po izbranem grafu.`
    : "Za izbrano obdobje še ni meritev.";
  if (!climateChart || !weightChart) return;

  const colors = getChartTheme();
  const climateSeries = [
    {
      name: "Temperatura (°C)",
      data: chartReadings.map((item) => [item.timestamp * 1000, item.temperature_c]),
      color: colors.temperature,
      yAxis: 0,
      tooltip: { valueDecimals: 1 },
    },
    {
      name: "Vlaga (%)",
      data: chartReadings.map((item) => [item.timestamp * 1000, item.humidity_percent]),
      color: colors.humidity,
      yAxis: 1,
      tooltip: { valueDecimals: 1 },
    },
  ];
  const weightSeries = [
    {
      name: "Teža (kg)",
      data: chartReadings.map((item) => [item.timestamp * 1000, item.weight_kg]),
      color: colors.weight,
      yAxis: 0,
      tooltip: { valueDecimals: 1 },
    },
  ];

  climateChart.update({ series: climateSeries }, false, true);
  weightChart.update({ series: weightSeries }, false, true);
  if (!climateChartHasUserZoom) {
    climateChart.xAxis[0].setExtremes(appliedRange.from.getTime(), appliedRange.to.getTime(), false, false);
  }
  if (!weightChartHasUserZoom) {
    weightChart.xAxis[0].setExtremes(appliedRange.from.getTime(), appliedRange.to.getTime(), false, false);
  }
  climateChart.redraw();
  weightChart.redraw();
}

function createTimeAxis(colors, onSetExtremes) {
  return {
    type: "datetime",
    lineColor: colors.border,
    tickColor: colors.border,
    labels: {
      style: { color: colors.textSoft },
      formatter() {
        const date = new Date(this.value);
        return `${formatDashboardDate(date)}<br>${formatDashboardTime(date)}`;
      },
    },
    events: { setExtremes: onSetExtremes },
  };
}

function createChartOptions(colors, onSetExtremes) {
  return {
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
    xAxis: createTimeAxis(colors, onSetExtremes),
    tooltip: { shared: true, xDateFormat: "%e/%m/%Y %H:%M", backgroundColor: colors.surface, borderColor: colors.border, style: { color: colors.text } },
    legend: { align: "left", verticalAlign: "top", itemStyle: { color: colors.text, fontWeight: "600" }, itemHoverStyle: { color: colors.text } },
    plotOptions: { series: { marker: { enabled: false }, lineWidth: 2, states: { hover: { lineWidth: 3 } } } },
    series: [],
  };
}

function createCharts() {
  if (climateChart || weightChart) return;
  const colors = getChartTheme();
  climateChart = Highcharts.chart("climate-chart", {
    ...createChartOptions(colors, (event) => {
      if (event.trigger === "zoom") climateChartHasUserZoom = event.min !== undefined;
    }),
    yAxis: [
      { title: { text: "°C", style: { color: colors.textSoft } }, labels: { style: { color: colors.textSoft } }, gridLineColor: colors.grid },
      { title: { text: "%", style: { color: colors.textSoft } }, labels: { style: { color: colors.textSoft } }, opposite: true, gridLineWidth: 0 },
    ],
  });

  weightChart = Highcharts.chart("weight-chart", {
    ...createChartOptions(colors, (event) => {
      if (event.trigger === "zoom") weightChartHasUserZoom = event.min !== undefined;
    }),
    yAxis: [{ title: { text: "kg", style: { color: colors.textSoft } }, labels: { style: { color: colors.textSoft } }, gridLineColor: colors.grid }],
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

function getCalendarDayRange(date) {
  const dayStart = startOfDay(date);
  const now = new Date();
  return {
    from: dayStart,
    to: isSameDay(dayStart, now) ? now : endOfDay(dayStart),
  };
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
  const selectedRange = getCalendarDayRange(date);
  if (!selectingRangeEnd) {
    draftRange = selectedRange;
    selectingRangeEnd = true;
  } else {
    if (selectedRange.from < startOfDay(draftRange.from)) {
      const previousEnd = new Date(draftRange.to);
      draftRange.from = selectedRange.from;
      draftRange.to = isSameDay(previousEnd, new Date()) ? new Date() : endOfDay(previousEnd);
    } else {
      draftRange.to = selectedRange.to;
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
  climateChartHasUserZoom = false;
  weightChartHasUserZoom = false;
  elements.rangeValue.textContent = formatRange(appliedRange);
  elements.rangeDialog.close();
  historyViewLoading = undefined;
  refreshVisibleHistory();
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
    elements.claimDeviceStatus.textContent = "Panj je uspešno registriran na tvoj račun.";
  } catch (error) {
    console.error(error);
    try {
      await remove(ref(database, claimPath));
    } catch {}
    elements.claimDeviceStatus.textContent = "Registracija ni uspela. Preveri ID, kodo in ali je ESP32 že povezan v Firebase.";
  }
}

async function unclaimDevice() {
  if (!currentCloudUser || !firebaseDatabase) return;

  const deviceId = elements.cloudDeviceSelect.value;
  if (!deviceId || !cloudDevices[deviceId]) return;

  const displayName = cloudDevices[deviceId].display_name || deviceId;
  const isConfirmed = window.confirm(
    `Ali želiš odregistrirati panj »${displayName}«?\n\nMeritve in zgodovina ostanejo v bazi, panj pa ne bo več viden v tvojem računu. Za ponoven dostop ga bo treba registrirati z aktivacijsko kodo.`,
  );
  if (!isConfirmed) return;

  const { database, ref, remove, set } = firebaseDatabase;
  const userDevicePath = `users/${currentCloudUser.uid}/devices/${deviceId}`;
  const ownerPath = `devices/${deviceId}/owner_uid`;
  const registration = cloudDevices[deviceId];
  elements.unclaimDevice.disabled = true;
  elements.unclaimDeviceStatus.textContent = "Odregistriram panj …";

  try {
    await remove(ref(database, userDevicePath));
    try {
      await remove(ref(database, ownerPath));
    } catch (error) {
      await set(ref(database, userDevicePath), registration);
      throw error;
    }

    localStorage.removeItem(CLOUD_DEVICE_STORAGE_KEY);
    elements.unclaimDeviceStatus.textContent = "Panj je odregistriran. Merilni podatki ostanejo shranjeni.";
  } catch (error) {
    console.error(error);
    elements.unclaimDeviceStatus.textContent = "Odregistracija ni uspela. Panj ostaja povezan s tvojim računom.";
    elements.unclaimDevice.disabled = false;
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
  elements.authTrigger.hidden = false;
  elements.authTrigger.textContent = "Odjava";
  elements.accountEmail.textContent = user.email || "Google račun";
  configureCloudAccountView();
  renderHeaderDeviceState();
  const { database, onValue, ref } = firebaseDatabase;
  const deviceListPath = isCloudAdministrator() ? "devices" : `users/${user.uid}/devices`;
  stopCloudDeviceListListener = onValue(ref(database, deviceListPath), (snapshot) => {
    cloudDevices = snapshot.val() ?? {};
    renderCloudDeviceSelector();
  }, showDataError);
}

function initializeAuthControls() {
  if (authControlsInitialized) return;
  authControlsInitialized = true;
  elements.authTrigger.addEventListener("click", () => {
    if (currentCloudUser) signOutCurrentUser();
    else openAuthDialog();
  });
  elements.authForm.addEventListener("submit", signInWithEmail);
  elements.authRegister.addEventListener("click", registerEmailAccount);
  elements.authGoogle.addEventListener("click", signInWithGoogle);
  elements.authClose.addEventListener("click", () => elements.authDialog.close());
  elements.authSignout.addEventListener("click", signOutCurrentUser);
  elements.cloudDeviceSelect.addEventListener("change", () => selectCloudDevice(elements.cloudDeviceSelect.value));
  elements.claimDeviceForm.addEventListener("submit", claimDevice);
  elements.unclaimDevice.addEventListener("click", unclaimDevice);
  elements.deleteDeviceHistory.addEventListener("click", deleteDeviceHistory);
}

async function useLocalDataSource() {
  const response = await fetch("/api/status", { cache: "no-store" });
  if (!response.ok) throw new Error("Lokalni API ni dosegljiv");
  const initialStatus = await response.json();
  isLocalDashboard = true;
  document.body.dataset.dashboardMode = "local";
  elements.updatesHeading.textContent = "Lokalna posodobitev";
  elements.updatesSubtitle.textContent = "Odpri ElegantOTA za lokalno posodobitev firmware-a ali LittleFS.";
  elements.otaSection.hidden = true;
  elements.localManualUpdateSection.hidden = false;
  elements.localElegantOtaLink.href = "/update";
  elements.updatesNavigationItem.hidden = false;
  document.querySelectorAll(".cloud-only-link").forEach((element) => { element.hidden = true; });
  document.querySelectorAll(".local-only-link").forEach((element) => { element.hidden = false; });
  document.querySelectorAll("[data-local-only]").forEach((element) => { element.hidden = false; });
  setCloudDeviceManagementVisibility(false);
  elements.authTrigger.hidden = true;
  elements.accountSection.hidden = true;

  function renderLocalStatus(status) {
    renderLatestMeasurement(status.latest);
    renderDeviceStatus(status.device, true);
    renderProvisioning(status.network);
    renderTimeStatus(status.time, status.network);
    renderCloudSynchronization(status.sync, status.network, status.sd_card);
    renderSDStatus(status.sd_card);
    renderFirmwareVersion(status.firmware);
    renderLoadCellTareStatus(status.sensors?.load_cell);
    setConnectionState("Lokalna povezava");
  }

  async function refreshStatus() {
    const statusResponse = await fetch("/api/status", { cache: "no-store" });
    if (!statusResponse.ok) throw new Error("Lokalno stanje ni dosegljivo");
    renderLocalStatus(await statusResponse.json());
  }

  refreshHistory = async () => {
    const from = Math.floor(appliedRange.from.getTime() / 1000);
    const to = Math.floor(appliedRange.to.getTime() / 1000);
    const requestGeneration = ++localHistoryRequestGeneration;
    try {
      for (let attempt = 0; attempt < 120; attempt += 1) {
        const historyResponse = await fetch(`/api/history?from=${from}&to=${to}`, { cache: "no-store" });
        if (requestGeneration !== localHistoryRequestGeneration) return;
        if (historyResponse.status === 202) {
          elements.historySummary.textContent = "Pripravljam lokalno zgodovino s SD kartice …";
          await delay(250);
          continue;
        }
        if (!historyResponse.ok) {
          renderHistory([], true);
          elements.historySummary.textContent = historyResponse.status === 503
            ? "SD kartica trenutno ni dosegljiva; lokalno stanje naprave ostaja na voljo."
            : "Lokalna zgodovina trenutno ni dosegljiva.";
          return;
        }
        const history = await historyResponse.json();
        renderHistory(history.readings ?? [], true);
        return;
      }
      renderHistory([], true);
      elements.historySummary.textContent = "Priprava lokalne zgodovine je trajala predolgo.";
    } catch (error) {
      console.error(error);
      renderHistory([], true);
      elements.historySummary.textContent = "Lokalne zgodovine ni bilo mogoče prebrati; povezava z ESP32 ostaja aktivna.";
    }
  };

  renderLocalStatus(initialStatus);
  setInterval(() => refreshStatus().catch(showDataError), 5_000);
}

async function useFirebaseDataSource() {
  isLocalDashboard = false;
  document.body.dataset.dashboardMode = "cloud";
  elements.updatesHeading.textContent = "Firmware OTA";
  elements.updatesSubtitle.textContent = "Varna namestitev nove različice na izbrano napravo.";
  elements.updatesNavigationItem.hidden = false;
  elements.localManualUpdateSection.hidden = true;
  document.querySelectorAll(".cloud-only-link").forEach((element) => { element.hidden = false; });
  document.querySelectorAll(".local-only-link").forEach((element) => { element.hidden = true; });
  document.querySelectorAll("[data-local-only]").forEach((element) => { element.hidden = true; });
  setCloudDeviceManagementVisibility(false);
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

  refreshHistory = async () => {
    stopHistoryListener?.();
    if (!cloudDevicePath) {
      renderHistory([]);
      return;
    }
    const from = Math.floor(appliedRange.from.getTime() / 1000);
    const to = Math.floor(appliedRange.to.getTime() / 1000);
    const source = getCloudHistorySource(from, to);
    const queryFrom = source.periodSeconds > 0 ? Math.floor(from / source.periodSeconds) * source.periodSeconds : from;
    const historyQuery = query(ref(database, `${cloudDevicePath}/${source.path}`), orderByKey(), startAt(String(queryFrom)), endAt(String(to)));
    stopHistoryListener = onValue(historyQuery, (snapshot) => {
      const readings = Object.entries(snapshot.val() ?? {}).map(([key, value]) => ({ ...value, timestamp: Number(value.timestamp ?? key) }));
      renderHistory(readings);
    }, showDataError);
  };

  authModule.onAuthStateChanged(firebaseAuth, handleCloudAuthState);
}

async function startDashboard() {
  initializeTheme();
  initializeNavigation();
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
  dashboardDataSourceReady = true;
  refreshVisibleHistory();
}

window.addEventListener("DOMContentLoaded", startDashboard);
