const DEVICE_ONLINE_TIMEOUT_SECONDS = 90;
const LOAD_CELL_TARE_TIMEOUT_SECONDS = 90;
const BME680_CALIBRATION_TIMEOUT_SECONDS = 90;
const GITHUB_LATEST_RELEASE_URL = "https://api.github.com/repos/RobertBarbo/PametniCebelnjak/releases/latest";
const CLOUD_DASHBOARD_URL = "https://pametnicebelnjak.web.app/";
const OTA_IGNORE_STORAGE_KEY = "pametni-cebelnjak-ignored-ota-version";
const CLOUD_DEVICE_QUERY_PARAMETER = "device";
const CLOUD_DEVICE_STORAGE_KEY = "pametni-cebelnjak-cloud-device-id";
const THEME_STORAGE_KEY = "pametni-cebelnjak-theme";
const DEFAULT_VIEW = "overview";
const SUPER_ADMIN_UID = "Uv2bGWlFt8h9YTsAFoxsNlNsRK72";
const SHARE_INVITATION_VALIDITY_MS = 24 * 60 * 60 * 1000;
const SHARE_INVITATION_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const CHART_AXIS_HOUR_SECONDS = 60 * 60;
const CHART_AXIS_DAY_SECONDS = 24 * CHART_AXIS_HOUR_SECONDS;
const NATIVE_AUTH_REQUEST_TYPE = "pametni-cebelnjak-native-auth-request";
const NATIVE_AUTH_RESULT_TYPE = "pametni-cebelnjak-native-auth-result";
const NATIVE_AUTH_REQUEST_TIMEOUT_MS = 90_000;
const ANDROID_DASHBOARD_FRAME_NAME = "pametni-cebelnjak-dashboard";
const OPEN_METEO_FORECAST_URL = "https://api.open-meteo.com/v1/forecast";
const OPEN_METEO_GEOCODING_URL = "https://geocoding-api.open-meteo.com/v1/search";
const OPENSTREETMAP_REVERSE_GEOCODING_URL = "https://nominatim.openstreetmap.org/reverse";
const WEATHER_REFRESH_INTERVAL_MS = 15 * 60 * 1000;
const CHART_AXIS_FORMATTERS = new Map();
const isEmbeddedDashboard = window.parent !== window;
const isAndroidAppDashboard =
  new URLSearchParams(window.location.search).get("app") === "android"
  || window.name === ANDROID_DASHBOARD_FRAME_NAME
  || isEmbeddedDashboard;
const UI_TEXT = {
  sl: { resetZoom: "Ponastavi zoom" },
  en: { resetZoom: "Reset zoom" },
};
const chartSeriesVisibility = {
  climate: { 1: true, 2: true },
  weight: { 1: true },
};

const elements = {
  appFavicon: document.querySelector("#app-favicon"),
  brandIcon: document.querySelector("#brand-icon"),
  menuToggle: document.querySelector("#menu-toggle"),
  topNavigation: document.querySelector("#top-navigation"),
  themeToggle: document.querySelector("#theme-toggle"),
  themeLabel: document.querySelector("#theme-label"),
  overviewNavigationItem: document.querySelector("#overview-nav-item"),
  historyNavigationItem: document.querySelector("#history-nav-item"),
  updatesNavigationItem: document.querySelector("#updates-nav-item"),
  cloudUpdatesQuickLink: document.querySelector("#cloud-updates-quick-link"),
  navigationButtons: [...document.querySelectorAll("[data-view-target]")],
  viewPanels: [...document.querySelectorAll("[data-view-panel]")],
  connectionStatus: document.querySelector("#connection-status"),
  connectionText: document.querySelector("#connection-text"),
  hardwareAlertStatus: document.querySelector("#hardware-alert-status"),
  hardwareAlertText: document.querySelector("#hardware-alert-text"),
  componentAlertPanel: document.querySelector("#component-alert-panel"),
  componentAlertList: document.querySelector("#component-alert-list"),
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
  accountAvatar: document.querySelector("#account-avatar"),
  accountAvatarImage: document.querySelector("#account-avatar-image"),
  accountAvatarInitials: document.querySelector("#account-avatar-initials"),
  authTriggerAvatar: document.querySelector("#auth-trigger-avatar"),
  authTriggerLabel: document.querySelector("#auth-trigger-label"),
  authSignout: document.querySelector("#auth-signout"),
  accountManagement: document.querySelector("#account-management"),
  weatherSettingsPanel: document.querySelector("#weather-settings-panel"),
  weatherSettingsForm: document.querySelector("#weather-settings-form"),
  weatherEnabled: document.querySelector("#weather-enabled"),
  weatherSettingsFields: document.querySelector("#weather-settings-fields"),
  weatherForecastDays: document.querySelector("#weather-forecast-days"),
  weatherSavedLocation: document.querySelector("#weather-saved-location"),
  weatherUseLocation: document.querySelector("#weather-use-location"),
  weatherLocationQuery: document.querySelector("#weather-location-query"),
  weatherSearchLocation: document.querySelector("#weather-search-location"),
  weatherLocationResults: document.querySelector("#weather-location-results"),
  weatherSettingsStatus: document.querySelector("#weather-settings-status"),
  sharedWeatherSettingsPanel: document.querySelector("#shared-weather-settings-panel"),
  sharedWeatherEnabled: document.querySelector("#shared-weather-enabled"),
  sharedWeatherSettingsStatus: document.querySelector("#shared-weather-settings-status"),
  accountFormStack: document.querySelector("#account-form-stack"),
  deviceSelectionCard: document.querySelector("#device-selection-card"),
  devicePageSubtitle: document.querySelector("#device-page-subtitle"),
  deviceDetailsPanel: document.querySelector("#device-details-panel"),
  cloudDeviceSelect: document.querySelector("#cloud-device-select"),
  adminDeviceOverview: document.querySelector("#admin-device-overview"),
  adminDeviceList: document.querySelector("#admin-device-list"),
  deviceListEyebrow: document.querySelector("#device-list-eyebrow"),
  selectedDeviceDescription: document.querySelector("#selected-device-description"),
  unclaimDevice: document.querySelector("#unclaim-device"),
  unclaimDeviceStatus: document.querySelector("#unclaim-device-status"),
  deleteDeviceHistory: document.querySelector("#delete-device-history"),
  historyManagementStatus: document.querySelector("#history-management-status"),
  networkResetControl: document.querySelector("#network-reset-control"),
  clearCloudWifiCredentials: document.querySelector("#clear-cloud-wifi-credentials"),
  cloudWifiResetStatus: document.querySelector("#cloud-wifi-reset-status"),
  claimDeviceForm: document.querySelector("#claim-device-form"),
  claimDeviceName: document.querySelector("#claim-device-name"),
  claimDeviceId: document.querySelector("#claim-device-id"),
  claimActivationCode: document.querySelector("#claim-activation-code"),
  claimDeviceStatus: document.querySelector("#claim-device-status"),
  shareDevicePanel: document.querySelector("#share-device-panel"),
  shareDeviceForm: document.querySelector("#share-device-form"),
  shareRecipientEmail: document.querySelector("#share-recipient-email"),
  createShareInvitation: document.querySelector("#create-share-invitation"),
  shareInvitationResult: document.querySelector("#share-invitation-result"),
  shareInvitationCode: document.querySelector("#share-invitation-code"),
  shareInvitationDetail: document.querySelector("#share-invitation-detail"),
  copyShareInvitation: document.querySelector("#copy-share-invitation"),
  sharedViewerList: document.querySelector("#shared-viewer-list"),
  shareDeviceStatus: document.querySelector("#share-device-status"),
  acceptShareForm: document.querySelector("#accept-share-form"),
  acceptShareCode: document.querySelector("#accept-share-code"),
  acceptShareStatus: document.querySelector("#accept-share-status"),
  temperature: document.querySelector("#temperature-value"),
  humidity: document.querySelector("#humidity-value"),
  weight: document.querySelector("#weight-value"),
  latestTime: document.querySelector("#last-measurement-time"),
  weatherOverview: document.querySelector("#weather-overview"),
  weatherOverviewHeading: document.querySelector("#weather-overview-heading"),
  weatherLocationName: document.querySelector("#weather-location-name"),
  weatherUpdated: document.querySelector("#weather-updated"),
  weatherCurrentIcon: document.querySelector("#weather-current-icon"),
  weatherCurrentCondition: document.querySelector("#weather-current-condition"),
  weatherCurrentTemperature: document.querySelector("#weather-current-temperature"),
  weatherCurrentHumidity: document.querySelector("#weather-current-humidity"),
  weatherCurrentPressure: document.querySelector("#weather-current-pressure"),
  weatherCurrentWind: document.querySelector("#weather-current-wind"),
  weatherForecast: document.querySelector("#weather-forecast"),
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
  componentBme680: document.querySelector("#component-bme680"),
  componentHx711: document.querySelector("#component-hx711"),
  componentDs3231: document.querySelector("#component-ds3231"),
  componentSdCard: document.querySelector("#component-sd-card"),
  localLoadCellTare: document.querySelector("#local-load-cell-tare"),
  localLoadCellTareStatus: document.querySelector("#local-load-cell-tare-status"),
  cloudLoadCellTare: document.querySelector("#cloud-load-cell-tare"),
  cloudLoadCellTareStatus: document.querySelector("#cloud-load-cell-tare-status"),
  localBme680CalibrationForm: document.querySelector("#local-bme680-calibration-form"),
  localTemperatureOffset: document.querySelector("#local-temperature-offset"),
  localHumidityOffset: document.querySelector("#local-humidity-offset"),
  localSaveBme680Calibration: document.querySelector("#local-save-bme680-calibration"),
  localBme680CalibrationStatus: document.querySelector("#local-bme680-calibration-status"),
  cloudBme680CalibrationForm: document.querySelector("#cloud-bme680-calibration-form"),
  cloudTemperatureOffset: document.querySelector("#cloud-temperature-offset"),
  cloudHumidityOffset: document.querySelector("#cloud-humidity-offset"),
  cloudSaveBme680Calibration: document.querySelector("#cloud-save-bme680-calibration"),
  cloudBme680CalibrationStatus: document.querySelector("#cloud-bme680-calibration-status"),
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
  otaCurrentVersion: document.querySelector("#ota-current-version"),
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
  otaSafetyNotice: document.querySelector("#ota-safety-notice"),
  localManualUpdateSection: document.querySelector("#local-manual-update-section"),
  localCurrentVersion: document.querySelector("#local-current-version"),
  localElegantOtaLink: document.querySelector("#local-elegantota-link"),
  localOtaWarningDialog: document.querySelector("#local-ota-warning-dialog"),
  localOtaWarningCancel: document.querySelector("#local-ota-warning-cancel"),
  localOtaWarningProceed: document.querySelector("#local-ota-warning-proceed"),
  provisioningSection: document.querySelector("#provisioning-section"),
  provisioningDescription: document.querySelector("#provisioning-description"),
  wifiForm: document.querySelector("#wifi-form"),
  wifiSsid: document.querySelector("#wifi-ssid"),
  wifiPassword: document.querySelector("#wifi-password"),
  wifiPasswordToggle: document.querySelector("#wifi-password-toggle"),
  wifiFormStatus: document.querySelector("#wifi-form-status"),
  wifiScan: document.querySelector("#wifi-scan"),
  wifiScanStatus: document.querySelector("#wifi-scan-status"),
  wifiNetworks: document.querySelector("#wifi-networks"),
  wifiForget: document.querySelector("#wifi-forget"),
  localDeviceId: document.querySelector("#local-device-id"),
  activationCode: document.querySelector("#activation-code"),
  connectedWifiSsid: document.querySelector("#connected-wifi-ssid"),
  wifiConnectionResult: document.querySelector("#wifi-connection-result"),
  wifiConnectionResultEyebrow: document.querySelector("#wifi-connection-result-eyebrow"),
  wifiConnectionResultHeading: document.querySelector("#wifi-connection-result-heading"),
  wifiConnectionResultMessage: document.querySelector("#wifi-connection-result-message"),
  wifiCloudCard: document.querySelector("#wifi-cloud-card"),
  wifiCloudAddress: document.querySelector("#wifi-cloud-address"),
  wifiAddressCard: document.querySelector("#wifi-address-card"),
  wifiAddressLabel: document.querySelector("#wifi-address-label"),
  wifiNewIpAddress: document.querySelector("#wifi-new-ip-address"),
  wifiLocalHostnameRow: document.querySelector("#wifi-local-hostname-row"),
  wifiNewLocalHostname: document.querySelector("#wifi-new-local-hostname"),
  wifiTransitionNotice: document.querySelector("#wifi-transition-notice"),
  wifiCopyAddress: document.querySelector("#wifi-copy-address"),
  wifiOpenAddress: document.querySelector("#wifi-open-address"),
  wifiOpenCloud: document.querySelector("#wifi-open-cloud"),
  wifiCopyStatus: document.querySelector("#wifi-copy-status"),
  localActivationCard: document.querySelector("#local-activation-card"),
  localActivationCode: document.querySelector("#local-activation-code"),
  cloudSyncStatus: document.querySelector("#cloud-sync-status"),
  cloudResync: document.querySelector("#cloud-resync"),
  cloudSyncControls: document.querySelector("#cloud-sync-controls"),
  openMeasurementLog: document.querySelector("#open-measurement-log"),
  downloadMeasurementLog: document.querySelector("#download-measurement-log"),
  deleteLocalMeasurementLog: document.querySelector("#delete-local-measurement-log"),
  localMeasurementLogStatus: document.querySelector("#local-measurement-log-status"),
  deviceCurrentTime: document.querySelector("#device-current-time"),
  deviceTimeSource: document.querySelector("#device-time-source"),
  rtcStatus: document.querySelector("#rtc-status"),
  deviceTimeForm: document.querySelector("#device-time-form"),
  deviceDateTime: document.querySelector("#device-date-time"),
  setDeviceTime: document.querySelector("#set-device-time"),
  syncDeviceTime: document.querySelector("#sync-device-time"),
  deviceTimeStatus: document.querySelector("#device-time-status"),
  confirmationDialog: document.querySelector("#confirmation-dialog"),
  confirmationDialogForm: document.querySelector("#confirmation-dialog-form"),
  confirmationDialogEyebrow: document.querySelector("#confirmation-dialog-eyebrow"),
  confirmationDialogTitle: document.querySelector("#confirmation-dialog-title"),
  confirmationDialogMessage: document.querySelector("#confirmation-dialog-message"),
  confirmationDialogInputLabel: document.querySelector("#confirmation-dialog-input-label"),
  confirmationDialogInputHint: document.querySelector("#confirmation-dialog-input-hint"),
  confirmationDialogInput: document.querySelector("#confirmation-dialog-input"),
  confirmationDialogCancel: document.querySelector("#confirmation-dialog-cancel"),
  confirmationDialogConfirm: document.querySelector("#confirmation-dialog-confirm"),
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
let latestOtaStatus;
let uPlotLoading;
let chartResizeObserver;
let scheduledChartResize = 0;
let latestHistoryReadings = [];
let latestHistoryAlreadyAggregated = false;
let cloudDevicePath = "";
let firebaseAuth;
let firebaseAuthModule;
let currentCloudUser;
let stopCloudDeviceListListener;
let stopCloudSharedDeviceListListener;
let ownedCloudDevicesLoaded = false;
let sharedCloudDevicesLoaded = false;
let stopCloudDeviceListeners = [];
let cloudDevices = {};
let ownedCloudDevices = {};
let sharedCloudDevices = {};
let activeShareInvitationCode = "";
const ownerEmailSyncedDeviceIds = new Set();
let authControlsInitialized = false;
let latestHistoryManagementStatus;
let latestNetworkResetStatus;
let latestLoadCellTareStatus;
let latestBme680CalibrationStatus;
let latestTimeStatus;
let latestNetworkStatus;
let latestSDCardStatus;
let dashboardDataSourceReady = false;
let historyViewLoading;
let localHistoryRequestGeneration = 0;
let bme680CalibrationPendingUntil = 0;
let bme680CalibrationRequestedAt = 0;
let wifiTransitionDeadline = 0;
let wifiTransitionAddress = "";
let wifiTransitionMode = "idle";
let wifiTransitionProbeGeneration = 0;
let latestWeatherSettings;
let weatherFetchController;
let weatherRequestKey = "";
let weatherLastFetchedAt = 0;
let weatherLocationSearchResults = [];
let weatherLocationLookupKey = "";
let weatherPublicPublishKey = "";
let weatherSharedLocationLookupKey = "";
let latestSharedWeatherPublicSettings;
let sharedWeatherEnabled = false;
let confirmationDialogResolver;
let confirmationDialogRequiredText = "";

const OTA_STATE_LABELS = {
  preparing: "Priprava posodobitve",
  installing: "Namestitev posodobitve",
  downloading_filesystem: "Prenašanje lokalne strani",
  installing_filesystem: "Nameščanje lokalne strani",
  downloading: "Prenašanje programske opreme",
  verifying: "Preverjanje programske opreme",
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

const OTA_TERMINAL_STATES = new Set(["installed", "ignored", "error"]);

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
  const climateZoom = climateChartHasUserZoom ? getChartXRange(climateChart) : undefined;
  const weightZoom = weightChartHasUserZoom ? getChartXRange(weightChart) : undefined;
  destroyCharts();
  createCharts({ climateZoom, weightZoom });
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

function applyBrandAssets(useLocalAssets) {
  const source = useLocalAssets ? "assets/favicon2.svg" : "assets/favicon.png";
  elements.appFavicon.href = source;
  elements.appFavicon.type = useLocalAssets ? "image/svg+xml" : "image/png";
  elements.brandIcon.src = source;
}

function showView(viewName, updateLocation = true) {
  const emptyCloudAccount = isCloudAccountWithoutDevices();
  const allowedViewName = emptyCloudAccount || (viewName === "updates" && isSharedCloudDeviceSelected()) ? "device" : viewName;
  const targetPanel = elements.viewPanels.find((panel) => panel.dataset.viewPanel === allowedViewName);
  const selectedView = targetPanel ? allowedViewName : DEFAULT_VIEW;

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
  if (selectedView === "overview") {
    void refreshWeatherForecast();
  }
}

function isHistoryViewActive() {
  return elements.viewPanels.some((panel) => panel.dataset.viewPanel === "history" && !panel.hidden);
}

async function ensureHistoryViewReady() {
  if (!dashboardDataSourceReady || !refreshHistory) return;

  if (!historyViewLoading) {
    elements.historySummary.textContent = "Nalagam grafe in zgodovino meritev …";
    historyViewLoading = loadUPlot()
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
    resizeCharts();
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

function isValidShareInvitationCode(invitationCode) {
  return /^[A-HJ-NP-Z2-9]{8}$/.test(String(invitationCode));
}

function isCloudAdministrator() {
  return currentCloudUser?.uid === SUPER_ADMIN_UID;
}

function isCloudAccountWithoutDevices() {
  return !isLocalDashboard
    && Boolean(currentCloudUser)
    && !isCloudAdministrator()
    && ownedCloudDevicesLoaded
    && sharedCloudDevicesLoaded
    && Object.keys(cloudDevices).length === 0;
}

function getCloudDeviceAccessRole(deviceId = cloudDevicePath.replace("devices/", "")) {
  if (!deviceId) return "";
  if (isCloudAdministrator()) return "administrator";
  return cloudDevices[deviceId]?.access_role ?? "";
}

function isSharedCloudDeviceSelected() {
  return !isLocalDashboard && getCloudDeviceAccessRole() === "viewer";
}

function canManageCloudDevice(deviceId = cloudDevicePath.replace("devices/", "")) {
  const role = getCloudDeviceAccessRole(deviceId);
  return role === "owner" || role === "administrator";
}

function configureCloudAccountView() {
  const isAdministrator = isCloudAdministrator();
  const isEmptyAccount = isCloudAccountWithoutDevices();
  elements.accountHeading.textContent = isAdministrator ? "Vsi panji" : "Moji panji";
  elements.deviceListEyebrow.textContent = isAdministrator ? "Skrbniški pregled" : "Moji panji";
  elements.selectedDeviceDescription.textContent = isAdministrator
    ? "Skrbniški račun ima ogled vseh registriranih panjev."
    : "Izberi panj, katerega podatke želiš pregledovati.";
  elements.claimDeviceForm.hidden = isAdministrator;
  elements.accountFormStack.hidden = isAdministrator;
  elements.adminDeviceOverview.hidden = !isAdministrator;
  elements.deviceSelectionCard.hidden = isAdministrator || isEmptyAccount;
  elements.accountManagement.classList.toggle("admin-mode", isAdministrator);
  elements.accountManagement.classList.toggle("empty-device-state", isEmptyAccount);
  elements.unclaimDevice.hidden = isAdministrator;
}

function configureSelectedCloudDeviceAccess(deviceId) {
  if (isLocalDashboard) return;

  if (isCloudAccountWithoutDevices()) {
    elements.devicePageSubtitle.textContent = "Registriraj svoj panj ali sprejmi povabilo za dostop do deljenega panja.";
    elements.deviceDetailsPanel.hidden = true;
    elements.overviewNavigationItem.hidden = true;
    elements.historyNavigationItem.hidden = true;
    elements.updatesNavigationItem.hidden = true;
    elements.cloudUpdatesQuickLink.hidden = true;
    elements.unclaimDevice.hidden = true;
    elements.shareDevicePanel.hidden = true;
    elements.networkResetControl.hidden = true;
    setCloudDeviceManagementVisibility(false);
    renderWeatherSettings(null);
    resetWeatherOverview();
    showView("device");
    return;
  }

  const role = getCloudDeviceAccessRole(deviceId);
  const isSharedViewer = role === "viewer";
  const isOwner = role === "owner";
  const canManage = role === "owner" || role === "administrator";
  elements.devicePageSubtitle.textContent = isSharedViewer
    ? "Deljeni panj imaš na voljo samo za ogled meritev in grafov."
    : "Omrežje, identiteta, delovanje in stanje SD kartice.";
  elements.deviceDetailsPanel.hidden = isSharedViewer;
  elements.overviewNavigationItem.hidden = false;
  elements.historyNavigationItem.hidden = false;
  elements.updatesNavigationItem.hidden = isSharedViewer;
  elements.cloudUpdatesQuickLink.hidden = isSharedViewer;
  elements.unclaimDevice.hidden = isCloudAdministrator() || (!isOwner && !isSharedViewer);
  elements.unclaimDevice.disabled = !deviceId || (!isOwner && !isSharedViewer);
  elements.unclaimDevice.textContent = isSharedViewer ? "Odstrani deljeni panj" : "Odjavi izbrani panj";
  elements.shareDevicePanel.hidden = !isOwner;
  elements.selectedDeviceDescription.textContent = isSharedViewer
    ? "Deljeni panj · samo ogled. Dostop lahko kadarkoli odstraniš iz svojega računa."
    : "Izberi panj, katerega podatke želiš pregledovati.";
  setCloudDeviceManagementVisibility(Boolean(deviceId && currentCloudUser && canManage));
  elements.networkResetControl.hidden = !(deviceId && currentCloudUser && isCloudAdministrator());
  updateWeatherOverviewVisibility();

  if (isSharedViewer && elements.viewPanels.some((panel) => panel.dataset.viewPanel === "updates" && !panel.hidden)) {
    showView("device");
  }
}

function setCloudDeviceManagementVisibility(isVisible) {
  document.querySelectorAll("[data-cloud-device-management]").forEach((element) => {
    element.hidden = !isVisible;
  });
}

function clearCloudDeviceListeners() {
  weatherFetchController?.abort();
  weatherFetchController = undefined;
  weatherRequestKey = "";
  weatherLastFetchedAt = 0;
  weatherPublicPublishKey = "";
  weatherSharedLocationLookupKey = "";
  latestSharedWeatherPublicSettings = undefined;
  sharedWeatherEnabled = false;
  stopCloudDeviceListeners.forEach((unsubscribe) => unsubscribe());
  stopCloudDeviceListeners = [];
  stopHistoryListener?.();
  stopHistoryListener = undefined;
}

function resetCloudDashboard() {
  setCloudDeviceManagementVisibility(false);
  elements.cloudSyncControls.hidden = true;
  latestDeviceStatus = undefined;
  latestSDCardStatus = undefined;
  latestHistoryManagementStatus = undefined;
  latestNetworkResetStatus = undefined;
  latestOtaStatus = undefined;
  renderLatestMeasurement(null);
  renderDeviceStatus(null);
  renderSDStatus(null);
  renderFirmwareVersion(null);
  renderLoadCellTareStatus(null);
  renderBme680CalibrationStatus(null);
  renderTimeStatus(null);
  renderWeatherSettings(null);
  elements.sharedWeatherSettingsPanel.hidden = true;
  resetWeatherOverview();
  elements.otaDeviceStatus.textContent = "Naprava še ni prejela OTA ukaza.";
  resetOtaProgress();
  elements.otaActions.hidden = true;
  renderHistory([]);
  renderHistoryManagementStatus(null);
  renderCloudWifiResetStatus(null);
}

function rebuildCloudDevices() {
  if (isCloudAdministrator()) return;

  const ownedDevices = Object.fromEntries(Object.entries(ownedCloudDevices).map(([deviceId, registration]) => [
    deviceId,
    { ...registration, access_role: "owner" },
  ]));
  const sharedDevices = Object.fromEntries(Object.entries(sharedCloudDevices)
    .filter(([deviceId]) => !ownedDevices[deviceId])
    .map(([deviceId, registration]) => [deviceId, { ...registration, access_role: "viewer" }]));
  cloudDevices = { ...sharedDevices, ...ownedDevices };
  synchronizeCurrentUserOwnerEmails();
  if (!Object.keys(cloudDevices).length && (!ownedCloudDevicesLoaded || !sharedCloudDevicesLoaded)) return;
  configureCloudAccountView();
  renderCloudDeviceSelector();
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

  if (isCloudAdministrator()) {
    deviceIds.sort().forEach((deviceId) => elements.cloudDeviceSelect.append(new Option(deviceId, deviceId)));
  } else {
    const appendDeviceGroup = (label, role) => {
      const matchingDeviceIds = deviceIds.filter((deviceId) => cloudDevices[deviceId]?.access_role === role).sort();
      if (!matchingDeviceIds.length) return;
      const group = document.createElement("optgroup");
      group.label = label;
      matchingDeviceIds.forEach((deviceId) => {
        const device = cloudDevices[deviceId] ?? {};
        const suffix = role === "viewer" ? " · samo ogled" : "";
        group.append(new Option(`${device.display_name || deviceId}${suffix}`, deviceId));
      });
      elements.cloudDeviceSelect.append(group);
    };
    appendDeviceGroup("Moji panji", "owner");
    appendDeviceGroup("Deljeni z mano", "viewer");
  }
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
    const card = document.createElement("article");
    card.className = `admin-device-option${cloudDevicePath === `devices/${deviceId}` ? " selected" : ""}`;
    const selectButton = document.createElement("button");
    selectButton.type = "button";
    selectButton.className = "admin-device-select";
    selectButton.setAttribute("aria-pressed", String(cloudDevicePath === `devices/${deviceId}`));
    selectButton.setAttribute("aria-label", `Izberi panj ${deviceId}`);
    selectButton.addEventListener("click", () => selectCloudDevice(deviceId));

    const identity = document.createElement("span");
    identity.className = "admin-device-identity";
    const name = document.createElement("strong");
    name.textContent = deviceId;
    const owner = document.createElement("small");
    owner.className = "admin-device-owner";
    owner.textContent = device.owner_email || "Lastnik še ni zabeležen.";
    identity.append(name, owner);
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
    selectButton.append(identity, state, detail);
    card.append(selectButton);

    const actions = document.createElement("div");
    actions.className = "admin-device-actions";
    const actionButtons = document.createElement("div");
    actionButtons.className = "admin-device-action-buttons";
    const actionStatus = document.createElement("small");
    actionStatus.className = "admin-device-action-status";
    actionStatus.setAttribute("aria-live", "polite");

    if (device.owner_uid) {
      const unclaimButton = document.createElement("button");
      unclaimButton.type = "button";
      unclaimButton.className = "secondary-button danger-button admin-unclaim-button";
      unclaimButton.textContent = "Odjavi lastnika";
      unclaimButton.addEventListener("click", () => unclaimDeviceAsAdministrator(deviceId, unclaimButton, actionStatus));
      actionButtons.append(unclaimButton);
    }

    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.className = "secondary-button danger-button admin-delete-button";
    deleteButton.textContent = "Izbriši napravo";
    deleteButton.addEventListener("click", () =>
      deleteDeviceAsAdministrator(deviceId, actionButtons, actionStatus),
    );
    actionButtons.append(deleteButton);
    actions.append(actionButtons, actionStatus);
    card.append(actions);

    elements.adminDeviceList.append(card);
  });
}

async function ensureCloudDeviceOwnerEmail(deviceId) {
  if (!deviceId || !firebaseDatabase || !currentCloudUser?.email || getCloudDeviceAccessRole(deviceId) !== "owner" || ownerEmailSyncedDeviceIds.has(deviceId)) return;

  const { database, ref, set } = firebaseDatabase;
  try {
    await set(ref(database, `devices/${deviceId}/owner_email`), currentCloudUser.email);
    ownerEmailSyncedDeviceIds.add(deviceId);
  } catch (error) {
    console.warn("E-poštnega naslova lastnika ni bilo mogoče posodobiti.", error);
  }
}

function synchronizeCurrentUserOwnerEmails() {
  if (isCloudAdministrator()) return;
  Object.keys(ownedCloudDevices).forEach((deviceId) => void ensureCloudDeviceOwnerEmail(deviceId));
}

function selectCloudDevice(deviceId) {
  clearCloudDeviceListeners();
  bme680CalibrationPendingUntil = 0;
  bme680CalibrationRequestedAt = 0;
  elements.cloudBme680CalibrationForm.dataset.dirty = "false";
  cloudDevicePath = deviceId ? `devices/${deviceId}` : "";
  elements.cloudDeviceSelect.value = deviceId;
  renderAdminDeviceOverview();
  configureSelectedCloudDeviceAccess(deviceId);
  void ensureCloudDeviceOwnerEmail(deviceId);
  elements.unclaimDeviceStatus.textContent = "";
  elements.shareDeviceStatus.textContent = "";
  elements.shareInvitationResult.hidden = true;
  elements.sharedViewerList.replaceChildren();
  activeShareInvitationCode = "";
  const isSharedViewer = getCloudDeviceAccessRole(deviceId) === "viewer";
  elements.otaSection.hidden = !cloudDevicePath || isSharedViewer;
  elements.cloudSyncControls.hidden = !cloudDevicePath || isSharedViewer;
  if (!cloudDevicePath || !firebaseDatabase) {
    resetCloudDashboard();
    return;
  }

  latestSDCardStatus = undefined;
  // Ne prikazuj stanja prej izbranega panja, dokler Firebase ne vrne novega odziva.
  renderDeviceStatus(null);
  renderHistoryManagementStatus(null);
  renderCloudWifiResetStatus(null);
  renderLoadCellTareStatus(null);
  renderBme680CalibrationStatus(null);
  renderTimeStatus(null);
  renderWeatherSettings(null);
  resetWeatherOverview();
  localStorage.setItem(CLOUD_DEVICE_STORAGE_KEY, deviceId);
  const { database, onValue, ref } = firebaseDatabase;
  const subscribe = (path, renderer) => {
    stopCloudDeviceListeners.push(onValue(ref(database, `${cloudDevicePath}/${path}`), (snapshot) => renderer(snapshot.val()), showDataError));
  };
  subscribe("latest", isSharedViewer ? renderSharedLatestMeasurement : renderLatestMeasurement);
  if (!isSharedViewer) {
    subscribe("status/device", renderDeviceStatus);
    subscribe("status/sd_card", renderSDStatus);
    subscribe("status/firmware", renderFirmwareVersion);
    subscribe("status/ota", renderOtaDeviceStatus);
    subscribe("status/history", renderHistoryManagementStatus);
    if (isCloudAdministrator()) subscribe("status/network_reset", renderCloudWifiResetStatus);
    subscribe("status/load_cell", renderLoadCellTareStatus);
    subscribe("status/bme680", renderBme680CalibrationStatus);
    if (canManageCloudDevice(deviceId)) {
      subscribe("weather", renderWeatherSettings);
    }
  } else {
    subscribe("weather_public", renderSharedWeatherSettings);
    stopCloudDeviceListeners.push(onValue(ref(database, `users/${currentCloudUser.uid}/weather_preferences/${deviceId}`), (snapshot) => {
      renderSharedWeatherPreference(snapshot.val());
    }, showDataError));
  }
  if (getCloudDeviceAccessRole(deviceId) === "owner") {
    stopCloudDeviceListeners.push(onValue(ref(database, `device_access/${deviceId}`), (snapshot) => {
      renderSharedViewerList(deviceId, snapshot.val());
    }, showDataError));
  }
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

function parseMeasurementValue(value) {
  if (
    (typeof value !== "number" && typeof value !== "string") ||
    (typeof value === "string" && value.trim() === "")
  ) {
    return null;
  }
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : null;
}

function formatValue(value, decimals = 1) {
  const numericValue = parseMeasurementValue(value);
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
    const match = String(version).match(/^(\d+)\.(\d+)\.(\d+)(?:-(beta|rc)\.(\d+))?$/);
    if (!match) return null;
    const releaseStage = match[4] === undefined ? 2 : match[4] === "rc" ? 1 : 0;
    const prereleaseNumber = match[5] === undefined ? Number.MAX_SAFE_INTEGER : Number(match[5]);
    return [Number(match[1]), Number(match[2]), Number(match[3]), releaseStage, prereleaseNumber];
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

function renderLatestMetric(element, value, decimals, hasMeasurement) {
  const numericValue = parseMeasurementValue(value);
  const unavailable = numericValue === null;
  const valueContainer = element.parentElement;
  valueContainer?.classList.toggle("measurement-unavailable", unavailable && hasMeasurement);
  const unit = valueContainer?.querySelector("small");
  if (unit) unit.hidden = unavailable && hasMeasurement;
  element.textContent = unavailable && hasMeasurement ? "Ni na voljo" : formatValue(value, decimals);
}

function renderLatestMeasurement(measurement) {
  const hasMeasurement = measurement !== null && measurement !== undefined;
  renderLatestMetric(elements.temperature, measurement?.temperature_c, 1, hasMeasurement);
  renderLatestMetric(elements.humidity, measurement?.humidity_percent, 1, hasMeasurement);
  renderLatestMetric(elements.weight, measurement?.weight_kg, 1, hasMeasurement);
  elements.latestTime.textContent = formatDateTime(measurement);
}

function renderSharedLatestMeasurement(measurement) {
  renderLatestMeasurement(measurement);
  const timestamp = Number(measurement?.timestamp);
  latestDeviceStatus = Number.isFinite(timestamp) && timestamp > 0 ? { last_seen_timestamp: timestamp } : undefined;
  renderHeaderDeviceState();
}

function normalizeWeatherSettings(settings) {
  const latitude = Number(settings?.latitude);
  const longitude = Number(settings?.longitude);
  return {
    enabled: settings?.enabled === true,
    forecastDays: Number(settings?.forecast_days) === 5 ? 5 : 3,
    latitude: Number.isFinite(latitude) && latitude >= -90 && latitude <= 90 ? latitude : null,
    longitude: Number.isFinite(longitude) && longitude >= -180 && longitude <= 180 ? longitude : null,
    locationName: String(settings?.location_name || "").trim(),
  };
}

function weatherHasLocation(settings = latestWeatherSettings) {
  return Number.isFinite(settings?.latitude) && Number.isFinite(settings?.longitude);
}

function weatherLocationLabel(settings = latestWeatherSettings) {
  if (!weatherHasLocation(settings)) return "Lokacija še ni nastavljena.";
  return settings.locationName || `Lokacija panja (${settings.latitude.toFixed(4)}, ${settings.longitude.toFixed(4)})`;
}

function weatherPlaceName(settings = latestWeatherSettings) {
  if (!weatherHasLocation(settings)) return "izbrani lokaciji";
  const name = String(settings.locationName || "").split(",")[0].trim();
  return (name || "izbrani lokaciji").replace(/^Občina\s+/iu, "");
}

function updateWeatherOverviewTitle() {
  elements.weatherOverviewHeading.textContent = `Vreme v kraju ${weatherPlaceName()}`;
}

const WEATHER_ICON_SVG = Object.freeze({
  sunny: `<svg viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="32" r="13" fill="#fbbf24"/><g fill="none" stroke="#fbbf24" stroke-linecap="round" stroke-width="4"><path d="M32 7v7M32 50v7M7 32h7M50 32h7M14.3 14.3l5 5M44.7 44.7l5 5M49.7 14.3l-5 5M19.3 44.7l-5 5"/></g></svg>`,
  partlyCloudy: `<svg viewBox="0 0 64 64" aria-hidden="true"><circle cx="25" cy="23" r="12" fill="#fbbf24"/><g fill="none" stroke="#fbbf24" stroke-linecap="round" stroke-width="3"><path d="M25 5v5M8 23h5M12.3 10.3l3.5 3.5M37.7 10.3l-3.5 3.5"/></g><path d="M18 48h29a10 10 0 0 0 .8-20A15 15 0 0 0 20 32a8 8 0 0 0-2 16Z" fill="#d9edf7" stroke="#7fb8d7" stroke-linejoin="round" stroke-width="2.5"/></svg>`,
  cloudy: `<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M13 47h37a11 11 0 0 0 1-22A16 16 0 0 0 21 30a9 9 0 0 0-8 17Z" fill="#d9edf7" stroke="#7fb8d7" stroke-linejoin="round" stroke-width="3"/></svg>`,
  fog: `<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M16 37h31a10 10 0 0 0 .6-20A14 14 0 0 0 22 22a8 8 0 0 0-6 15Z" fill="#d9edf7" stroke="#7fb8d7" stroke-linejoin="round" stroke-width="2.5"/><g fill="none" stroke="#9ab7c6" stroke-linecap="round" stroke-width="3"><path d="M13 45h32M20 52h29"/></g></svg>`,
  rain: `<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M13 39h37a11 11 0 0 0 1-22A16 16 0 0 0 21 22a9 9 0 0 0-8 17Z" fill="#d9edf7" stroke="#7fb8d7" stroke-linejoin="round" stroke-width="3"/><g fill="none" stroke="#45aee8" stroke-linecap="round" stroke-width="4"><path d="m22 47-2 7M34 47l-2 7M46 47l-2 7"/></g></svg>`,
  snow: `<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M13 38h37a11 11 0 0 0 1-22A16 16 0 0 0 21 21a9 9 0 0 0-8 17Z" fill="#d9edf7" stroke="#7fb8d7" stroke-linejoin="round" stroke-width="3"/><g fill="none" stroke="#6ec2ec" stroke-linecap="round" stroke-width="2.8"><path d="M22 47v9m-4.5-4.5h9M34 47v9m-4.5-4.5h9M46 47v9m-4.5-4.5h9"/></g></svg>`,
  thunder: `<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M13 38h37a11 11 0 0 0 1-22A16 16 0 0 0 21 21a9 9 0 0 0-8 17Z" fill="#d9edf7" stroke="#7fb8d7" stroke-linejoin="round" stroke-width="3"/><path d="m34 43-7 10h6l-2 7 9-12h-6l3-5Z" fill="#fbbf24" stroke="#e6a400" stroke-linejoin="round" stroke-width="1.5"/></svg>`,
});

function renderWeatherIcon(element, iconName) {
  element.innerHTML = WEATHER_ICON_SVG[iconName] || WEATHER_ICON_SVG.partlyCloudy;
}

function weatherCodeInfo(weatherCode) {
  const code = Number(weatherCode);
  if (code === 0) return { label: "Jasno", icon: "sunny" };
  if ([1, 2].includes(code)) return { label: "Delno oblačno", icon: "partlyCloudy" };
  if (code === 3) return { label: "Oblačno", icon: "cloudy" };
  if ([45, 48].includes(code)) return { label: "Megla", icon: "fog" };
  if ([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return { label: code < 61 ? "Pršenje" : "Dež", icon: "rain" };
  if ([71, 73, 75, 77, 85, 86].includes(code)) return { label: "Sneg", icon: "snow" };
  if ([95, 96, 99].includes(code)) return { label: "Nevihta", icon: "thunder" };
  return { label: "Spremenljivo", icon: "partlyCloudy" };
}

function formatWindDirection(direction) {
  const degrees = Number(direction);
  if (!Number.isFinite(degrees)) return "—";
  const labels = ["S", "SV", "V", "JV", "J", "JZ", "Z", "SZ"];
  return labels[Math.round((((degrees % 360) + 360) % 360) / 45) % labels.length];
}

function isOverviewViewActive() {
  return elements.viewPanels.some((panel) => panel.dataset.viewPanel === "overview" && !panel.hidden);
}

function updateWeatherOverviewVisibility() {
  const isVisible = !isLocalDashboard && (canManageCloudDevice() || isSharedCloudDeviceSelected()) &&
    latestWeatherSettings?.enabled === true && weatherHasLocation();
  elements.weatherOverview.hidden = !isVisible;
  if (!isVisible) {
    weatherFetchController?.abort();
    return;
  }
  updateWeatherOverviewTitle();
  elements.weatherLocationName.textContent = weatherLocationLabel();
  if (isOverviewViewActive()) void refreshWeatherForecast();
}

function renderWeatherSettings(settings) {
  latestWeatherSettings = normalizeWeatherSettings(settings);
  const hasLocation = weatherHasLocation();
  elements.weatherEnabled.checked = latestWeatherSettings.enabled;
  elements.weatherForecastDays.value = String(latestWeatherSettings.forecastDays);
  elements.weatherSettingsFields.disabled = !latestWeatherSettings.enabled;
  elements.weatherSavedLocation.textContent = weatherLocationLabel();
  elements.weatherLocationQuery.value = "";
  elements.weatherLocationResults.hidden = true;
  elements.weatherLocationResults.replaceChildren();
  weatherLocationSearchResults = [];
  if (latestWeatherSettings.enabled && !hasLocation) {
    elements.weatherSettingsStatus.textContent = "Za prikaz vremena najprej uporabi trenutno lokacijo ali poišči kraj.";
  } else if (elements.weatherSettingsStatus.textContent.startsWith("Za prikaz vremena")) {
    elements.weatherSettingsStatus.textContent = "";
  }
  void updateGenericWeatherLocationName();
  void publishPublicWeatherSettings();
  updateWeatherOverviewVisibility();
}

function createPublicWeatherSettings(settings = latestWeatherSettings, updatedAt = Math.floor(Date.now() / 1000)) {
  return {
    enabled: settings?.enabled === true,
    forecast_days: Number(settings?.forecastDays) === 5 ? 5 : 3,
    location_name: String(settings?.locationName || "").trim(),
    updated_at: updatedAt,
  };
}

function publicWeatherSettingsKey(settings) {
  return `${settings.enabled}:${settings.forecast_days}:${settings.location_name}`;
}

async function publishPublicWeatherSettings(settings = latestWeatherSettings, updatedAt = Math.floor(Date.now() / 1000)) {
  if (!weatherSettingsCanBeChanged()) return;
  const publicSettings = createPublicWeatherSettings(settings, updatedAt);
  if (!publicSettings.location_name) return;
  const publishKey = publicWeatherSettingsKey(publicSettings);
  if (weatherPublicPublishKey === publishKey) return;
  const { database, ref, update } = firebaseDatabase;
  try {
    await update(ref(database), {
      [`${cloudDevicePath}/weather_public`]: publicSettings,
    });
    weatherPublicPublishKey = publishKey;
  } catch (error) {
    console.warn("Javnega prikaza vremena ni bilo mogoče posodobiti.", error);
  }
}

async function renderSharedWeatherSettings(settings) {
  latestSharedWeatherPublicSettings = normalizeWeatherSettings(settings);
  updateSharedWeatherSettings();
}

function renderSharedWeatherPreference(preference) {
  sharedWeatherEnabled = preference?.show_weather === true;
  updateSharedWeatherSettings();
}

async function updateSharedWeatherSettings() {
  const publicSettings = latestSharedWeatherPublicSettings;
  const isSharedViewer = isSharedCloudDeviceSelected();
  elements.sharedWeatherSettingsPanel.hidden = !isSharedViewer;
  if (!isSharedViewer) return;

  const hasPublicLocation = Boolean(publicSettings?.locationName);
  elements.sharedWeatherEnabled.checked = sharedWeatherEnabled;
  elements.sharedWeatherEnabled.disabled = !hasPublicLocation;
  elements.sharedWeatherSettingsStatus.textContent = hasPublicLocation
    ? "Nastavitev velja samo za tvoj pregled deljenega panja."
    : "Lastnik za ta panj še ni nastavil kraja za vreme.";

  latestWeatherSettings = {
    ...publicSettings,
    enabled: sharedWeatherEnabled && hasPublicLocation,
  };
  if (!latestWeatherSettings.enabled) {
    weatherSharedLocationLookupKey = "";
    updateWeatherOverviewVisibility();
    return;
  }

  const lookupKey = `${cloudDevicePath}:${publicSettings.forecastDays}:${publicSettings.locationName}`;
  if (weatherSharedLocationLookupKey === lookupKey) return;
  weatherSharedLocationLookupKey = lookupKey;
  try {
    const url = new URL(OPEN_METEO_GEOCODING_URL);
    url.searchParams.set("name", publicSettings.locationName);
    url.searchParams.set("count", "1");
    url.searchParams.set("language", "sl");
    url.searchParams.set("format", "json");
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Iskanje kraja ni uspelo (${response.status}).`);
    const result = (await response.json()).results?.find((item) =>
      Number.isFinite(Number(item.latitude)) && Number.isFinite(Number(item.longitude)));
    if (!result) throw new Error("Za shranjeni kraj ni koordinat.");
    if (weatherSharedLocationLookupKey !== lookupKey) return;
    latestWeatherSettings = {
      ...publicSettings,
      enabled: true,
      latitude: Number(result.latitude),
      longitude: Number(result.longitude),
    };
    updateWeatherOverviewVisibility();
  } catch (error) {
    console.warn("Kraja za deljeni prikaz vremena ni bilo mogoče določiti.", error);
    weatherSharedLocationLookupKey = "";
    elements.weatherUpdated.textContent = "Vremenskih podatkov za ta kraj ni mogoče pridobiti.";
  }
}

function resetWeatherOverview() {
  elements.weatherUpdated.textContent = "Čakam na podatke …";
  renderWeatherIcon(elements.weatherCurrentIcon, "cloudy");
  elements.weatherCurrentCondition.textContent = "—";
  elements.weatherCurrentTemperature.textContent = "—";
  elements.weatherCurrentHumidity.textContent = "—";
  elements.weatherCurrentPressure.textContent = "—";
  elements.weatherCurrentWind.textContent = "—";
  elements.weatherForecast.replaceChildren();
}

function formatWeatherTemperature(value) {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? `${numericValue.toFixed(0)}°` : "—";
}

function renderWeatherForecast(weather) {
  const current = weather?.current;
  const daily = weather?.daily;
  if (!current || !daily) {
    throw new Error("Vremenska storitev ni vrnila popolnih podatkov.");
  }
  const currentInfo = weatherCodeInfo(current.weather_code);
  renderWeatherIcon(elements.weatherCurrentIcon, currentInfo.icon);
  elements.weatherCurrentCondition.textContent = currentInfo.label;
  elements.weatherCurrentTemperature.textContent = Number.isFinite(Number(current.temperature_2m))
    ? Number(current.temperature_2m).toFixed(1)
    : "—";
  elements.weatherCurrentHumidity.textContent = Number.isFinite(Number(current.relative_humidity_2m))
    ? `${Math.round(Number(current.relative_humidity_2m))} %`
    : "—";
  elements.weatherCurrentPressure.textContent = Number.isFinite(Number(current.pressure_msl))
    ? `${Math.round(Number(current.pressure_msl))} hPa`
    : "—";
  const windSpeed = Number(current.wind_speed_10m);
  elements.weatherCurrentWind.textContent = Number.isFinite(windSpeed)
    ? `${Math.round(windSpeed)} km/h · ${formatWindDirection(current.wind_direction_10m)}`
    : "—";
  elements.weatherUpdated.textContent = current.time
    ? `Posodobljeno: ${String(current.time).replace("T", " ")}`
    : "Posodobljeno";

  elements.weatherForecast.replaceChildren();
  (daily.time ?? []).forEach((date, index) => {
    const info = weatherCodeInfo(daily.weather_code?.[index]);
    const day = document.createElement("article");
    day.className = "weather-forecast-day";
    const dateLabel = new Intl.DateTimeFormat("sl-SI", { weekday: "short", day: "numeric", month: "short" })
      .format(new Date(`${date}T12:00:00`));
    const precipitationProbability = Number(daily.precipitation_probability_max?.[index]);
    const precipitationLabel = Number.isFinite(precipitationProbability)
      ? `${Math.round(precipitationProbability)} % padavin`
      : "Padavine —";
    const dateElement = document.createElement("p");
    dateElement.textContent = dateLabel;
    const icon = document.createElement("span");
    icon.className = "weather-forecast-icon";
    icon.setAttribute("aria-hidden", "true");
    renderWeatherIcon(icon, info.icon);
    const temperatures = document.createElement("strong");
    temperatures.textContent = `${formatWeatherTemperature(daily.temperature_2m_max?.[index])} `;
    const minimumTemperature = document.createElement("small");
    minimumTemperature.textContent = formatWeatherTemperature(daily.temperature_2m_min?.[index]);
    temperatures.append(minimumTemperature);
    const precipitation = document.createElement("small");
    precipitation.textContent = precipitationLabel;
    day.append(dateElement, icon, temperatures, precipitation);
    elements.weatherForecast.append(day);
  });
}

async function refreshWeatherForecast(force = false) {
  const settings = latestWeatherSettings;
  if (!isOverviewViewActive() || elements.weatherOverview.hidden || !settings?.enabled || !weatherHasLocation(settings)) return;
  const deviceId = cloudDevicePath.replace("devices/", "");
  const requestKey = `${deviceId}:${settings.latitude}:${settings.longitude}:${settings.forecastDays}`;
  if (!force && requestKey === weatherRequestKey && Date.now() - weatherLastFetchedAt < WEATHER_REFRESH_INTERVAL_MS) return;

  weatherFetchController?.abort();
  const controller = new AbortController();
  weatherFetchController = controller;
  weatherRequestKey = requestKey;
  elements.weatherUpdated.textContent = "Pridobivam vreme …";
  try {
    const url = new URL(OPEN_METEO_FORECAST_URL);
    url.searchParams.set("latitude", String(settings.latitude));
    url.searchParams.set("longitude", String(settings.longitude));
    url.searchParams.set("current", "temperature_2m,relative_humidity_2m,pressure_msl,wind_speed_10m,wind_direction_10m,weather_code");
    url.searchParams.set("daily", "weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max");
    url.searchParams.set("forecast_days", String(settings.forecastDays));
    url.searchParams.set("timezone", "auto");
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) throw new Error(`Vremenska storitev je vrnila napako ${response.status}.`);
    const weather = await response.json();
    if (controller.signal.aborted || requestKey !== weatherRequestKey) return;
    renderWeatherForecast(weather);
    weatherLastFetchedAt = Date.now();
  } catch (error) {
    if (error.name === "AbortError") return;
    console.warn("Vremenskih podatkov ni bilo mogoče pridobiti.", error);
    elements.weatherUpdated.textContent = "Vremenski podatki trenutno niso dosegljivi.";
  }
}

function weatherSettingsCanBeChanged() {
  return Boolean(firebaseDatabase && cloudDevicePath && canManageCloudDevice());
}

async function saveWeatherSettings(changes, successMessage) {
  if (!weatherSettingsCanBeChanged()) return false;
  const { database, ref, update } = firebaseDatabase;
  const updatedAt = Math.floor(Date.now() / 1000);
  const nextSettings = normalizeWeatherSettings({
    enabled: latestWeatherSettings?.enabled,
    forecast_days: latestWeatherSettings?.forecastDays,
    latitude: latestWeatherSettings?.latitude,
    longitude: latestWeatherSettings?.longitude,
    location_name: latestWeatherSettings?.locationName,
    ...changes,
  });
  const updates = Object.fromEntries(Object.entries({
    ...changes,
    updated_at: updatedAt,
  }).map(([key, value]) => [`${cloudDevicePath}/weather/${key}`, value]));
  const publicSettings = createPublicWeatherSettings(nextSettings, updatedAt);
  if (publicSettings.location_name) {
    updates[`${cloudDevicePath}/weather_public`] = publicSettings;
  }
  try {
    await update(ref(database), updates);
    if (publicSettings.location_name) weatherPublicPublishKey = publicWeatherSettingsKey(publicSettings);
    elements.weatherSettingsStatus.textContent = successMessage;
    return true;
  } catch (error) {
    console.error("Nastavitev vremena ni bilo mogoče shraniti.", error);
    elements.weatherSettingsStatus.textContent = "Nastavitve vremena ni bilo mogoče shraniti.";
    return false;
  }
}

function canChangeSharedWeatherPreference() {
  return Boolean(firebaseDatabase && cloudDevicePath && currentCloudUser && isSharedCloudDeviceSelected());
}

async function saveSharedWeatherPreference(showWeather) {
  if (!canChangeSharedWeatherPreference()) return;
  elements.sharedWeatherEnabled.disabled = true;
  elements.sharedWeatherSettingsStatus.textContent = "Shranjujem nastavitev …";
  try {
    const { database, ref, set } = firebaseDatabase;
    await set(ref(database, `users/${currentCloudUser.uid}/weather_preferences/${cloudDevicePath.replace("devices/", "")}`), {
      show_weather: showWeather === true,
    });
    elements.sharedWeatherSettingsStatus.textContent = showWeather
      ? "Vreme je prikazano na tvojem pregledu."
      : "Vreme je skrito na tvojem pregledu.";
  } catch (error) {
    console.error("Nastavitve vremena za deljeni panj ni bilo mogoče shraniti.", error);
    elements.sharedWeatherEnabled.checked = !showWeather;
    elements.sharedWeatherSettingsStatus.textContent = "Nastavitve vremena ni bilo mogoče shraniti.";
  } finally {
    elements.sharedWeatherEnabled.disabled = !latestSharedWeatherPublicSettings?.locationName;
  }
}

function getBrowserLocation() {
  if (!navigator.geolocation) {
    return Promise.reject(new Error("Brskalnik ne podpira določanja lokacije."));
  }
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: false,
      timeout: 15_000,
      maximumAge: 5 * 60 * 1000,
    });
  });
}

function needsWeatherLocationName(settings = latestWeatherSettings) {
  const name = String(settings?.locationName || "").trim();
  return weatherHasLocation(settings) && (!name || name === "Trenutna lokacija" || name.startsWith("Lokacija brskalnika ("));
}

async function reverseGeocodeWeatherLocation(latitude, longitude) {
  const fallbackName = `Lokacija brskalnika (${latitude.toFixed(3)}, ${longitude.toFixed(3)})`;
  const url = new URL(OPENSTREETMAP_REVERSE_GEOCODING_URL);
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("lat", String(latitude));
  url.searchParams.set("lon", String(longitude));
  url.searchParams.set("zoom", "10");
  url.searchParams.set("addressdetails", "1");
  url.searchParams.set("accept-language", "sl");
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Določanje kraja ni uspelo (${response.status}).`);
  const result = await response.json();
  const address = result?.address ?? {};
  const settlement = address.city || address.town || address.village || address.municipality || address.county;
  return [settlement, address.country].filter(Boolean).join(", ") || fallbackName;
}

async function updateGenericWeatherLocationName() {
  const settings = latestWeatherSettings;
  if (!weatherSettingsCanBeChanged() || !needsWeatherLocationName(settings)) return;
  const lookupKey = `${settings.latitude}:${settings.longitude}`;
  if (weatherLocationLookupKey === lookupKey) return;
  weatherLocationLookupKey = lookupKey;
  try {
    const locationName = await reverseGeocodeWeatherLocation(settings.latitude, settings.longitude);
    if (latestWeatherSettings !== settings || !needsWeatherLocationName(settings)) return;
    await saveWeatherSettings({ location_name: locationName }, `Lokacija ${locationName} je shranjena za ta panj.`);
  } catch (error) {
    console.warn("Kraja za shranjeno lokacijo ni bilo mogoče določiti.", error);
  }
}

async function useBrowserWeatherLocation() {
  if (!weatherSettingsCanBeChanged()) return;
  elements.weatherUseLocation.disabled = true;
  elements.weatherSettingsStatus.textContent = "Brskalnik čaka na dovoljenje za lokacijo …";
  try {
    const position = await getBrowserLocation();
    const latitude = Number(position.coords.latitude.toFixed(5));
    const longitude = Number(position.coords.longitude.toFixed(5));
    let locationName;
    try {
      locationName = await reverseGeocodeWeatherLocation(latitude, longitude);
    } catch (error) {
      console.warn("Kraja za lokacijo brskalnika ni bilo mogoče določiti.", error);
      locationName = `Lokacija brskalnika (${latitude.toFixed(3)}, ${longitude.toFixed(3)})`;
    }
    await saveWeatherSettings({
      latitude,
      longitude,
      location_name: locationName,
    }, `Lokacija ${locationName} je shranjena za ta panj.`);
  } catch (error) {
    console.warn("Lokacije brskalnika ni bilo mogoče pridobiti.", error);
    const message = error?.code === 1
      ? "Dovoljenje za lokacijo je zavrnjeno. Kraj lahko poiščeš ročno."
      : "Lokacije ni bilo mogoče pridobiti. Poskusi znova ali poišči kraj ročno.";
    elements.weatherSettingsStatus.textContent = message;
  } finally {
    elements.weatherUseLocation.disabled = false;
  }
}

function weatherSearchResultLabel(result) {
  return [result.name, result.admin1, result.country].filter(Boolean).join(", ");
}

function renderWeatherLocationResults(results) {
  weatherLocationSearchResults = results;
  elements.weatherLocationResults.replaceChildren();
  elements.weatherLocationResults.hidden = results.length === 0;
  results.forEach((result, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "weather-location-result";
    button.textContent = weatherSearchResultLabel(result);
    button.addEventListener("click", () => saveSearchedWeatherLocation(index));
    elements.weatherLocationResults.append(button);
  });
}

async function searchWeatherLocation() {
  const query = elements.weatherLocationQuery.value.trim();
  if (!query) {
    elements.weatherSettingsStatus.textContent = "Vnesi kraj, ki ga želiš poiskati.";
    return;
  }
  elements.weatherSearchLocation.disabled = true;
  elements.weatherSettingsStatus.textContent = "Iščem kraj …";
  try {
    const url = new URL(OPEN_METEO_GEOCODING_URL);
    url.searchParams.set("name", query);
    url.searchParams.set("count", "5");
    url.searchParams.set("language", "sl");
    url.searchParams.set("format", "json");
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Iskanje kraja ni uspelo (${response.status}).`);
    const data = await response.json();
    const results = (data.results ?? []).filter((result) =>
      Number.isFinite(Number(result.latitude)) && Number.isFinite(Number(result.longitude)));
    renderWeatherLocationResults(results);
    elements.weatherSettingsStatus.textContent = results.length
      ? "Izberi kraj za lokacijo panja."
      : "Za vneseni kraj ni rezultatov.";
  } catch (error) {
    console.warn("Kraja ni bilo mogoče poiskati.", error);
    elements.weatherSettingsStatus.textContent = "Iskanje kraja trenutno ni dosegljivo.";
  } finally {
    elements.weatherSearchLocation.disabled = false;
  }
}

async function saveSearchedWeatherLocation(index) {
  const result = weatherLocationSearchResults[index];
  if (!result) return;
  const saved = await saveWeatherSettings({
    latitude: Number(Number(result.latitude).toFixed(5)),
    longitude: Number(Number(result.longitude).toFixed(5)),
    location_name: weatherSearchResultLabel(result),
  }, `Lokacija ${weatherSearchResultLabel(result)} je shranjena za ta panj.`);
  if (saved) {
    elements.weatherLocationResults.hidden = true;
    elements.weatherLocationResults.replaceChildren();
    weatherLocationSearchResults = [];
  }
}

function initializeWeatherSettings() {
  elements.weatherSettingsForm.addEventListener("submit", (event) => {
    event.preventDefault();
    void searchWeatherLocation();
  });
  elements.weatherEnabled.addEventListener("change", () => {
    void saveWeatherSettings({ enabled: elements.weatherEnabled.checked }, elements.weatherEnabled.checked
      ? "Prikaz vremena je vključen."
      : "Prikaz vremena je izključen.");
  });
  elements.weatherForecastDays.addEventListener("change", () => {
    void saveWeatherSettings({ forecast_days: Number(elements.weatherForecastDays.value) === 5 ? 5 : 3 }, "Dolžina napovedi je shranjena.");
  });
  elements.weatherUseLocation.addEventListener("click", () => void useBrowserWeatherLocation());
  elements.weatherSearchLocation.addEventListener("click", () => void searchWeatherLocation());
  elements.sharedWeatherEnabled.addEventListener("change", () => {
    void saveSharedWeatherPreference(elements.sharedWeatherEnabled.checked);
  });
}

const COMPONENT_DEFINITIONS = [
  { key: "bme680", name: "BME680", element: "componentBme680", description: "Temperatura in vlaga" },
  { key: "hx711", name: "HX711", element: "componentHx711", description: "Merilne celice" },
  { key: "ds3231", name: "DS3231", element: "componentDs3231", description: "RTC ura" },
  { key: "sd_card", name: "SD kartica", element: "componentSdCard", description: "Dnevnik meritev" },
];

function isComponentOperational(componentKey, fallbackStatus) {
  const component = latestDeviceStatus?.components?.[componentKey];
  const status = component ?? fallbackStatus;
  return status?.ready === true && status?.state !== "error";
}

function isSDCardOperational(status = latestSDCardStatus) {
  const component = latestDeviceStatus?.components?.sd_card;
  return status?.present === true && status?.error !== true &&
    component?.ready !== false && component?.state !== "error";
}

function getComponentPresentation(component, key) {
  let state = component?.state ?? "checking";
  const failures = Number(component?.failures ?? 0);
  // Starejši firmware lahko ob prvih neuspelih preverjanjih pošlje state=ok
  // skupaj z ready=false. Takšna komponenta ne sme biti prikazana kot zdrava.
  if (component?.ready === false && state === "ok") state = "checking";
  if (key === "ds3231" && component?.ready === true && component?.time_valid === false) state = "warning";

  const stateLabels = {
    checking: "Čakam na preverjanje",
    ok: "Deluje normalno",
    warning: "Potrebno preverjanje",
    error: "Napaka komponente",
  };
  let detail = state === "checking"
    ? component?.ready === false
      ? "Komponenta trenutno ni dosegljiva; preverjanje se ponavlja."
      : "Komponenta še ni preverjena."
    : state === "ok"
      ? "Deluje normalno."
      : failures > 0
        ? `${failures} zaporednih neuspelih preverjanj.`
        : "Preveri povezavo ali napajanje.";
  if (key === "ds3231" && component?.ready === true && component?.time_valid === false) {
    detail = "RTC ura nima veljavnega časa.";
  }
  return { state, label: stateLabels[state] ?? stateLabels.checking, detail };
}

function renderComponentHealth(components) {
  const alerts = [];
  COMPONENT_DEFINITIONS.forEach((definition) => {
    const presentation = getComponentPresentation(components?.[definition.key], definition.key);
    const card = elements[definition.element];
    card.className = `component-health-card ${presentation.state}`;
    card.querySelector("strong").textContent = presentation.label;
    card.querySelector("small").textContent = presentation.detail;
    if (presentation.state === "warning" || presentation.state === "error") {
      alerts.push({ name: definition.name, ...presentation });
    }
  });

  const hasAlerts = alerts.length > 0;
  const hasError = alerts.some((alert) => alert.state === "error");
  elements.hardwareAlertStatus.hidden = !hasAlerts;
  elements.hardwareAlertStatus.className = `hardware-alert-status ${hasError ? "error" : "warning"}`;
  elements.hardwareAlertText.textContent = hasAlerts
    ? `${alerts.length} ${alerts.length === 1 ? "opozorilo" : "opozorili komponent"}`
    : "";

  elements.componentAlertPanel.hidden = !hasAlerts;
  elements.componentAlertList.replaceChildren();
  alerts.forEach((alert) => {
    const item = document.createElement("p");
    item.className = `component-alert-item ${alert.state}`;
    item.textContent = `${alert.name}: ${alert.detail}`;
    elements.componentAlertList.append(item);
  });
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
  renderComponentHealth(status?.components);
  renderLoadCellTareStatus(latestLoadCellTareStatus);
  renderBme680CalibrationStatus(latestBme680CalibrationStatus);
  if (!localDashboard) {
    renderHistoryManagementStatus(latestHistoryManagementStatus);
    renderCloudWifiResetStatus(latestNetworkResetStatus);
    renderTimeStatus(status);
    renderCloudSynchronization(status?.history_sync, { station_connected: isOnline }, latestSDCardStatus);
  }
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

  const rtcOperational = isComponentOperational("ds3231", {
    ready: rtcPresent,
    state: rtcPresent ? "ok" : "error",
  });
  const cloudDeviceReady = Boolean(cloudDevicePath && currentCloudUser && isDeviceOnline(latestDeviceStatus));
  const canSetTime = (isLocalDashboard || cloudDeviceReady) && rtcOperational;
  const internetAvailable = (isLocalDashboard ? network?.station_connected === true : cloudDeviceReady) && rtcOperational;
  elements.setDeviceTime.disabled = !canSetTime || ntpPending;
  elements.syncDeviceTime.disabled = !internetAvailable || ntpPending;
  if (ntpPending) {
    elements.deviceTimeStatus.textContent = "Čakam na internetno časovno sinhronizacijo …";
  } else if (!rtcOperational) {
    elements.deviceTimeStatus.textContent = "DS3231 ni pripravljen; nastavljanje in sinhronizacija časa trenutno nista mogoča.";
  } else if (!isLocalDashboard && cloudDevicePath && currentCloudUser && !cloudDeviceReady) {
    elements.deviceTimeStatus.textContent = "Panj je offline; nastavljanje datuma in ure trenutno ni možno.";
  } else if (!isLocalDashboard && cloudDeviceReady) {
    elements.deviceTimeStatus.textContent = "Naprava je online; datum in uro lahko nastaviš ali sinhroniziraš z internetom.";
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
  const loadCellReady = isComponentOperational("hx711", status);
  const cloudDeviceReady = Boolean(cloudDevicePath && currentCloudUser && isDeviceOnline(latestDeviceStatus));
  const canTare = (isLocalDashboard || cloudDeviceReady) && loadCellReady;
  const button = isLocalDashboard ? elements.localLoadCellTare : elements.cloudLoadCellTare;
  const statusElement = isLocalDashboard ? elements.localLoadCellTareStatus : elements.cloudLoadCellTareStatus;

  button.disabled = !canTare || isBusy;
  statusElement.textContent = isStaleCloudTare
    ? "Prejšnje tariranje se ni zaključilo. Odstrani uteži in poskusi znova."
    : !isLocalDashboard && !cloudDeviceReady
      ? cloudDevicePath
        ? "Panj je offline; tariranje trenutno ni možno."
        : "Izberi online panj za tariranje."
      : !loadCellReady
        ? "HX711 ni pripravljen; tariranje trenutno ni možno."
       : status?.message ?? messages[state] ?? messages.idle;
}

function formatCalibrationOffset(value, unit) {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) return "—";
  const sign = numericValue >= 0 ? "+" : "";
  return `${sign}${numericValue.toFixed(1).replace(".", ",")} ${unit}`;
}

function renderBme680CalibrationStatus(status) {
  latestBme680CalibrationStatus = status;
  const temperatureOffset = Number(status?.temperature_offset_c ?? 0);
  const humidityOffset = Number(status?.humidity_offset_percent ?? 0);
  const offsetsValid = Number.isFinite(temperatureOffset) && Number.isFinite(humidityOffset);
  const reportedState = status?.state ?? "idle";
  const nowSeconds = Date.now() / 1000;
  const updatedAt = Number(status?.updated_at);
  const calibrationRequestIsPending = bme680CalibrationPendingUntil > nowSeconds;
  const commandAwaitingResponse = calibrationRequestIsPending &&
    (!Number.isFinite(updatedAt) || updatedAt < bme680CalibrationRequestedAt);
  const state = commandAwaitingResponse ? "queued" : reportedState;
  const calibrationRequestFinished = calibrationRequestIsPending && !commandAwaitingResponse &&
    (reportedState === "completed" || reportedState === "error");
  if (calibrationRequestFinished || bme680CalibrationPendingUntil <= nowSeconds) {
    bme680CalibrationPendingUntil = 0;
  }

  const isBusy = state === "queued" || state === "applying";
  const bme680Operational = isComponentOperational("bme680", status);
  const cloudDeviceReady = Boolean(cloudDevicePath && currentCloudUser && isDeviceOnline(latestDeviceStatus));
  const canChange = (isLocalDashboard || cloudDeviceReady) && bme680Operational;
  const controls = isLocalDashboard
    ? [{
      temperature: elements.localTemperatureOffset,
      humidity: elements.localHumidityOffset,
      button: elements.localSaveBme680Calibration,
      status: elements.localBme680CalibrationStatus,
      form: elements.localBme680CalibrationForm,
    }]
    : [{
      temperature: elements.cloudTemperatureOffset,
      humidity: elements.cloudHumidityOffset,
      button: elements.cloudSaveBme680Calibration,
      status: elements.cloudBme680CalibrationStatus,
      form: elements.cloudBme680CalibrationForm,
    }];

  const messages = {
    idle: offsetsValid
      ? `Trenutna odmika: temperatura ${formatCalibrationOffset(temperatureOffset, "°C")}, vlaga ${formatCalibrationOffset(humidityOffset, "%")}.`
      : "Čakam na stanje kalibracije BME680 …",
    queued: "Ukaz za kalibracijo čaka na izvedbo.",
    applying: "Shranjujem kalibracijo BME680 …",
    completed: "Kalibracija BME680 je shranjena in uporabljena pri novih meritvah.",
    error: "Kalibracije BME680 ni bilo mogoče shraniti.",
  };

  controls.forEach((control) => {
    if (calibrationRequestFinished) control.form.dataset.dirty = "false";
    const preserveUserInput = control.form.dataset.dirty === "true";
    if (offsetsValid && !preserveUserInput) {
      control.temperature.value = temperatureOffset.toFixed(1);
      control.humidity.value = humidityOffset.toFixed(1);
    }
    control.temperature.disabled = !canChange || isBusy;
    control.humidity.disabled = !canChange || isBusy;
    control.button.disabled = !canChange || isBusy;
    control.status.textContent = !isLocalDashboard && !cloudDeviceReady
      ? cloudDevicePath
        ? "Panj je offline; kalibracije trenutno ni mogoče nastaviti."
        : "Izberi online panj za kalibracijo."
      : !bme680Operational
        ? "BME680 ni pripravljen; odmikov trenutno ni mogoče nastaviti."
      : (state === "completed" || state === "error") && status?.message
        ? status.message
        : messages[state] ?? messages.idle;
  });
}

function updateWiFiTransitionNotice() {
  if (!elements.wifiTransitionNotice || wifiTransitionMode !== "access_point" || wifiTransitionDeadline === 0) return;

  const remainingSeconds = Math.max(0, Math.ceil((wifiTransitionDeadline - Date.now()) / 1000));
  elements.wifiTransitionNotice.textContent = remainingSeconds > 0
    ? `Dostopna točka bo na voljo še približno ${remainingSeconds} s. Za nadaljnjo uporabo priporočamo spletno nadzorno ploščo; lokalni IP lahko preveriš v usmerjevalniku.`
    : "Dostopna točka se je zaprla. Poveži se z domačim Wi‑Fi omrežjem in nadaljuj v spletni nadzorni plošči; lokalni IP lahko preveriš v usmerjevalniku.";
}

function dashboardUsesProvisioningAddress() {
  return window.location.hostname === "192.168.4.1";
}

function localHostnameUrl(network = latestNetworkStatus) {
  const hostname = network?.local_hostname?.trim();
  return hostname ? `http://${hostname}/` : "";
}

function cloudDashboardUrl() {
  return CLOUD_DASHBOARD_URL;
}

function setWiFiTransitionAddress(address) {
  wifiTransitionAddress = address;
  elements.wifiNewIpAddress.textContent = address || "—";
  elements.wifiNewIpAddress.href = address || "#";
  elements.wifiOpenAddress.href = address || "#";
  elements.wifiOpenAddress.classList.toggle("is-disabled", !address);
  elements.wifiOpenAddress.setAttribute("aria-disabled", String(!address));
}

function showWiFiTransitionResult({ mode, eyebrow, heading, message, addressLabel, address, notice }) {
  wifiTransitionMode = mode;
  wifiTransitionDeadline = 0;
  wifiTransitionProbeGeneration += 1;
  elements.wifiConnectionResult.hidden = false;
  elements.wifiConnectionResult.dataset.transition = mode;
  elements.wifiForm.hidden = true;
  elements.wifiConnectionResultEyebrow.textContent = eyebrow;
  elements.wifiConnectionResultHeading.textContent = heading;
  elements.wifiConnectionResultMessage.textContent = message;
  elements.wifiAddressLabel.textContent = addressLabel;
  elements.wifiLocalHostnameRow.hidden = true;
  elements.wifiTransitionNotice.textContent = notice;
  elements.wifiCopyStatus.textContent = "";
  const showCloudAccess = mode !== "forgotten";
  const cloudUrl = cloudDashboardUrl();
  elements.wifiCloudCard.hidden = !showCloudAccess;
  elements.wifiCloudAddress.href = cloudUrl;
  elements.wifiOpenCloud.hidden = !showCloudAccess;
  elements.wifiOpenCloud.href = cloudUrl;
  elements.wifiOpenCloud.classList.toggle("primary-button", showCloudAccess);
  elements.wifiOpenCloud.classList.toggle("secondary-button", !showCloudAccess);
  elements.wifiOpenAddress.classList.toggle("primary-button", !showCloudAccess);
  elements.wifiOpenAddress.classList.toggle("secondary-button", showCloudAccess);
  setWiFiTransitionAddress(address);
}

async function probeDeviceOnLocalHostname(hostnameUrl, generation) {
  if (!hostnameUrl) return;

  for (let attempt = 0; attempt < 30 && generation === wifiTransitionProbeGeneration; attempt += 1) {
    await delay(2_000);
    try {
      await fetch(hostnameUrl, { mode: "no-cors", cache: "no-store" });
      if (generation !== wifiTransitionProbeGeneration || wifiTransitionMode !== "home_network") return;
      elements.wifiTransitionNotice.textContent = "Naprava je dosegljiva na novem omrežju. Za nadaljnjo uporabo priporočamo spletno nadzorno ploščo; lokalni dostop ostaja na voljo prek stalnega naslova.";
      return;
    } catch {
      // Telefon ali računalnik morda še ni povezan z novim SSID-jem; poskus tiho ponovimo.
    }
  }
}

function showHomeNetworkTransition(ssid) {
  const hostnameUrl = localHostnameUrl();
  showWiFiTransitionResult({
    mode: "home_network",
    eyebrow: "Menjava omrežja",
    heading: "Naprava se povezuje z novim Wi‑Fi omrežjem",
    message: `Naprava prehaja v omrežje ${ssid}. Ko bo povezava vzpostavljena, za pregled meritev in upravljanje panja priporočamo spletno nadzorno ploščo.`,
    addressLabel: "Stalni lokalni naslov naprave",
    address: hostnameUrl,
    notice: hostnameUrl
      ? "Tudi telefon ali računalnik poveži z novim omrežjem. Za lokalni dostop počakaj nekaj sekund in odpri stalni naslov; če .local ne deluje, novi IP preveri v usmerjevalniku."
      : "Tudi telefon ali računalnik poveži z novim omrežjem. Za lokalni dostop novi IP preveri med povezanimi napravami v usmerjevalniku.",
  });
  const generation = wifiTransitionProbeGeneration;
  probeDeviceOnLocalHostname(hostnameUrl, generation);
}

function showForgottenWiFiTransition() {
  const accessPointSsid = latestNetworkStatus?.access_point_ssid || "dostopna točka naprave";
  const accessPointUrl = "http://192.168.4.1/";
  showWiFiTransitionResult({
    mode: "forgotten",
    eyebrow: "Wi‑Fi je odstranjen",
    heading: "Ponovno poveži napravo",
    message: `Shranjeno omrežje bo izbrisano. Naprava bo odprla dostopno točko ${accessPointSsid}.`,
    addressLabel: "Naslov nastavitev na dostopni točki",
    address: accessPointUrl,
    notice: `V nastavitvah Wi‑Fi telefona ali računalnika izberi ${accessPointSsid}, nato odpri ${accessPointUrl} in ponovno vnesi poverilnice.`,
  });
  elements.wifiOpenAddress.textContent = "Odpri nastavitve";
}

function renderWiFiConnectionResult(network, connectionState, isConnected) {
  if (wifiTransitionMode === "home_network" || wifiTransitionMode === "forgotten") return;

  const stationIp = network?.station_ip ?? "";
  const localHostname = network?.local_hostname ?? "";
  const remainingSeconds = Number(network?.access_point_shutdown_remaining_seconds);
  const showResult = connectionState === "connected" && isConnected && stationIp &&
    Number.isFinite(remainingSeconds) && remainingSeconds > 0;

  elements.wifiConnectionResult.hidden = !showResult;
  elements.wifiForm.hidden = showResult;
  if (!showResult) {
    wifiTransitionMode = "idle";
    wifiTransitionDeadline = 0;
    wifiTransitionAddress = "";
    return;
  }

  wifiTransitionMode = "access_point";
  elements.wifiConnectionResult.dataset.transition = "access_point";
  elements.wifiConnectionResultEyebrow.textContent = "Povezava je uspela";
  elements.wifiConnectionResultHeading.textContent = "Naprava je povezana";
  elements.wifiAddressLabel.textContent = "Novi lokalni naslov";
  const cloudUrl = cloudDashboardUrl();
  elements.wifiCloudCard.hidden = false;
  elements.wifiCloudAddress.href = cloudUrl;
  elements.wifiLocalHostnameRow.hidden = false;
  elements.wifiOpenAddress.textContent = "Odpri lokalno";
  elements.wifiOpenCloud.hidden = false;
  elements.wifiOpenCloud.href = cloudUrl;
  elements.wifiOpenCloud.classList.add("primary-button");
  elements.wifiOpenCloud.classList.remove("secondary-button");
  elements.wifiOpenAddress.classList.add("secondary-button");
  elements.wifiOpenAddress.classList.remove("primary-button");
  elements.wifiOpenAddress.classList.remove("is-disabled");
  elements.wifiOpenAddress.setAttribute("aria-disabled", "false");
  const stationUrl = `http://${stationIp}/`;
  const hostnameUrl = localHostname ? `http://${localHostname}/` : "";
  wifiTransitionAddress = stationUrl;
  wifiTransitionDeadline = Date.now() + remainingSeconds * 1000;
  elements.wifiConnectionResultMessage.textContent = network?.station_ssid
    ? `Naprava je povezana z internetom prek omrežja ${network.station_ssid}. Za pregled meritev in upravljanje panja priporočamo spletno nadzorno ploščo.`
    : "Naprava je povezana z internetom. Za pregled meritev in upravljanje panja priporočamo spletno nadzorno ploščo.";
  elements.wifiNewIpAddress.textContent = stationUrl;
  elements.wifiNewIpAddress.href = stationUrl;
  elements.wifiOpenAddress.href = stationUrl;
  elements.wifiNewLocalHostname.textContent = localHostname || "Ni na voljo";
  elements.wifiNewLocalHostname.href = hostnameUrl || stationUrl;
  elements.wifiTransitionNotice.textContent = "Za lokalni dostop poveži telefon ali računalnik z istim Wi‑Fi omrežjem. Če lokalni naslov ni dosegljiv, IP preveri med povezanimi napravami v usmerjevalniku.";
  elements.wifiCopyStatus.textContent = "";
  updateWiFiTransitionNotice();
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
  const hasSavedCredentials = network?.credentials_saved === true;
  elements.connectedWifiSsid.textContent = isConnected && network?.station_ssid ? network.station_ssid : "—";
  renderWiFiConnectionResult(network, connectionState, isConnected);

  if (isConnecting) {
    elements.provisioningDescription.textContent = `Naprava preverja izbrano Wi‑Fi omrežje. Ostani povezan na dostopni točki${accessPointName}.`;
  } else if (isConnected) {
    elements.provisioningDescription.textContent = network?.station_ssid
      ? `Naprava je povezana v Wi‑Fi omrežje ${network.station_ssid}. Nastavitve lahko po potrebi spremeniš ali izbrišeš.`
      : "Naprava je povezana v domače Wi‑Fi omrežje.";
  } else if (connectionState === "connected") {
    elements.provisioningDescription.textContent = "Povezava z Wi‑Fi je uspela. Čakam na potrditev omrežnega naslova.";
  } else if (connectionState === "failed") {
    elements.provisioningDescription.textContent = `Povezava z Wi‑Fi ni uspela. AP${accessPointName} ostaja na voljo za ponoven poskus.`;
  } else if (isUsingAccessPoint) {
    elements.provisioningDescription.textContent = `Povezan si neposredno na dostopno točko naprave${accessPointName}. Vpiši domače Wi‑Fi omrežje za dostop do clouda.`;
  }

  elements.wifiScan.disabled = isConnecting;
  elements.wifiForget.hidden = !hasSavedCredentials;
  elements.wifiForget.disabled = isConnecting || !hasSavedCredentials;
  elements.wifiPasswordToggle.disabled = isConnecting;
  elements.wifiForm.querySelector("button[type='submit']").disabled = isConnecting;
  if (network?.connection_message) elements.wifiFormStatus.textContent = network.connection_message;
}

function renderCloudSynchronization(sync, network, sdCard) {
  const isPending = sync?.pending === true;
  const isCaughtUp = sync?.caught_up === true;
  const hasCloudConnection = network?.station_connected === true;
  const hasSDCard = isSDCardOperational(sdCard);
  const retrySeconds = Number(sync?.retry_seconds);
  const lastSyncedTimestamp = Number(sync?.last_synced_timestamp);
  const reconciliation = sync?.reconciliation ?? {};
  const reconciliationState = reconciliation.state;
  const localDays = Number(reconciliation.local_days);
  const daysToTransfer = Number(reconciliation.days_to_transfer);
  const daysCompleted = Number(reconciliation.days_completed);
  const measurementsToTransfer = Number(reconciliation.measurements_to_transfer);
  const measurementsUploaded = Number(reconciliation.measurements_uploaded);

  if (!hasSDCard) {
    elements.cloudSyncStatus.textContent = sdCard?.error === true
      ? "SD kartica javlja napako; sinhronizacija s Firebase trenutno ni mogoča."
      : "SD kartica ni dosegljiva; sinhronizacija s Firebase trenutno ni mogoča.";
  } else if (!hasCloudConnection) {
    elements.cloudSyncStatus.textContent = "Cloud ni dosegljiv; meritve varno čakajo na SD kartici.";
  } else if (reconciliationState === "preparing") {
    elements.cloudSyncStatus.textContent = "Pripravljam dnevni indeks SD zgodovine …";
  } else if (reconciliationState === "checking") {
    const daysText = Number.isFinite(localDays) && localDays > 0 ? ` (${localDays} dni)` : "";
    elements.cloudSyncStatus.textContent = `Primerjam dnevni indeks SD kartice s Firebase${daysText} …`;
  } else if (reconciliationState === "syncing") {
    const completedText = Number.isFinite(daysCompleted) ? daysCompleted : 0;
    const localDaysText = Number.isFinite(localDays) && localDays > 0 ? localDays : "?";
    const transferText = Number.isFinite(daysToTransfer) ? daysToTransfer : 0;
    const measurementProgress = Number.isFinite(measurementsToTransfer) && measurementsToTransfer > 0
      ? ` Prenesenih meritev: ${Number.isFinite(measurementsUploaded) ? measurementsUploaded : 0}/${measurementsToTransfer}.`
      : "";
    elements.cloudSyncStatus.textContent = transferText > 0
      ? `Pregledujem in obnavljam dneve: ${completedText}/${localDaysText}. Manjkajočih ali neskladnih dni: ${transferText}.${measurementProgress}`
      : "Dopolnjujem dnevni indeks Firebase brez ponovnega prenosa meritev …";
  } else if (reconciliationState === "error") {
    elements.cloudSyncStatus.textContent = "Primerjava SD zgodovine s Firebase ni uspela. Preveri SD kartico in povezavo ter poskusi znova.";
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

  elements.cloudResync.disabled = isPending || !hasSDCard || !hasCloudConnection;
}

function renderLocalMeasurementLogStatus(status, sdCard, sync) {
  const state = status?.deletion_state ?? "idle";
  const hasSDCard = sdCard?.present === true && sdCard?.error !== true;
  const synchronizationActive = sync?.pending === true || ["preparing", "checking", "syncing"].includes(sync?.reconciliation?.state);
  const deletionActive = state === "queued" || state === "deleting";
  const controlsAvailable = isLocalDashboard && hasSDCard && !synchronizationActive && !deletionActive;

  [elements.openMeasurementLog, elements.downloadMeasurementLog].forEach((link) => {
    link.setAttribute("aria-disabled", String(!controlsAvailable));
    if (controlsAvailable) link.href = link.dataset.href;
    else link.removeAttribute("href");
  });
  elements.deleteLocalMeasurementLog.disabled = !controlsAvailable;

  if (!hasSDCard) {
    elements.localMeasurementLogStatus.textContent = "SD kartica ni dosegljiva.";
  } else if (synchronizationActive) {
    elements.localMeasurementLogStatus.textContent = "Počakaj, da se sinhronizacija zgodovine zaključi.";
  } else if (state === "queued") {
    elements.localMeasurementLogStatus.textContent = "Brisanje dnevnika je uvrščeno v čakalno vrsto …";
  } else if (state === "deleting") {
    elements.localMeasurementLogStatus.textContent = "Brišem meritve s SD kartice …";
  } else if (state === "completed") {
    elements.localMeasurementLogStatus.textContent = "Meritve so izbrisane s SD kartice. Zgodovina v Firebase je ostala nespremenjena.";
  } else if (state === "error") {
    elements.localMeasurementLogStatus.textContent = "Brisanje meritev s SD kartice ni uspelo.";
  } else {
    elements.localMeasurementLogStatus.textContent = "Dnevnik meritev je pripravljen.";
  }
}

function renderHistoryManagementStatus(status) {
  latestHistoryManagementStatus = status;
  const hasSelectedDevice = Boolean(cloudDevicePath && currentCloudUser && firebaseDatabase);
  const state = status?.state;
  const updatedAt = Number(status?.updated_at);
  const isDeleting = state === "queued" || state === "deleting";
  const isSelectedDeviceOnline = hasSelectedDevice && isDeviceOnline(latestDeviceStatus);
  const hasOperationalSDCard = isSDCardOperational();
  elements.deleteDeviceHistory.disabled = !isSelectedDeviceOnline || !hasOperationalSDCard || isDeleting;

  if (!hasSelectedDevice) {
    elements.historyManagementStatus.textContent = "Izberi panj za upravljanje zgodovine.";
    return;
  }
  if (!isSelectedDeviceOnline) {
    elements.historyManagementStatus.textContent = "Panj je offline; brisanje merilne zgodovine trenutno ni možno.";
    return;
  }
  if (!hasOperationalSDCard) {
    elements.historyManagementStatus.textContent = "SD kartica ni pripravljena; popoln izbris SD in cloud zgodovine ni dovoljen.";
    return;
  }
  if (!state) {
    elements.historyManagementStatus.textContent = "Naprava je online in pripravljena na brisanje merilne zgodovine.";
    return;
  }

  const messages = {
    queued: "Ukaz za brisanje čaka, da ga naprava prevzame.",
    deleting: "Naprava briše SD dnevnik in cloud zgodovino …",
    completed: Number.isFinite(updatedAt) && updatedAt > 0
      ? `Zadnji ukaz za brisanje je bil uspešno zaključen: ${formatDashboardDateTime(new Date(updatedAt * 1000))}.`
      : "Zadnji ukaz za brisanje je bil uspešno zaključen.",
    error: "Brisanje ni uspelo. Preveri stanje naprave in SD kartice.",
  };
  elements.historyManagementStatus.textContent = state === "completed"
    ? messages.completed
    : status?.message || messages[state] || "Stanje brisanja ni znano.";
}

function renderCloudWifiResetStatus(status) {
  latestNetworkResetStatus = status;
  if (!elements.networkResetControl || !isCloudAdministrator()) return;

  const hasSelectedDevice = Boolean(cloudDevicePath && currentCloudUser && firebaseDatabase);
  const state = status?.state;
  const updatedAt = Number(status?.updated_at);
  const lastSeenAt = Number(latestDeviceStatus?.last_seen_timestamp);
  // Zapis `queued` mora po izbrisu ostati v Firebase, ker se naprava nato odklopi.
  // Nov odziv naprave po poznejši Wi-Fi nastavitvi zato pomeni nov zagon povezave in ne
  // sme trajno blokirati naslednje ponastavitve.
  const resetBelongsToCurrentConnection = !Number.isFinite(updatedAt) || !Number.isFinite(lastSeenAt) ||
    lastSeenAt <= updatedAt;
  const isProcessing = (state === "queued" || state === "resetting") && resetBelongsToCurrentConnection;
  const isSelectedDeviceOnline = hasSelectedDevice && isDeviceOnline(latestDeviceStatus);
  elements.clearCloudWifiCredentials.disabled = !isSelectedDeviceOnline || isProcessing;

  if (!hasSelectedDevice) {
    elements.cloudWifiResetStatus.textContent = "Izberi panj za ponastavitev omrežja.";
  } else if (state === "completed") {
    elements.cloudWifiResetStatus.textContent = Number.isFinite(updatedAt) && updatedAt > 0
      ? `Wi-Fi poverilnice so izbrisane (${formatDashboardDateTime(new Date(updatedAt * 1000))}). Poveži se s provisioning Wi-Fi omrežjem naprave in odpri 192.168.4.1.`
      : "Wi-Fi poverilnice so izbrisane. Poveži se s provisioning Wi-Fi omrežjem naprave in odpri 192.168.4.1.";
  } else if (state === "error") {
    elements.cloudWifiResetStatus.textContent = status?.message || "Brisanje Wi-Fi poverilnic ni uspelo; naprava ostaja povezana.";
  } else if (isProcessing) {
    elements.cloudWifiResetStatus.textContent = status?.message || "Naprava ponastavlja shranjeno Wi-Fi omrežje …";
  } else if (!isSelectedDeviceOnline) {
    elements.cloudWifiResetStatus.textContent = "Panj je offline; ponastavitev omrežja trenutno ni mogoča.";
  } else {
    elements.cloudWifiResetStatus.textContent = "Naprava je online in pripravljena na ponastavitev omrežja.";
  }
}

function updateConfirmationDialogState() {
  const requiresTypedConfirmation = Boolean(confirmationDialogRequiredText);
  elements.confirmationDialogConfirm.disabled = requiresTypedConfirmation &&
    elements.confirmationDialogInput.value !== confirmationDialogRequiredText;
}

function settleConfirmationDialog(confirmed) {
  const resolver = confirmationDialogResolver;
  confirmationDialogResolver = undefined;
  confirmationDialogRequiredText = "";
  if (elements.confirmationDialog.open) {
    elements.confirmationDialog.close();
  }
  resolver?.(confirmed);
}

function initializeConfirmationDialog() {
  elements.confirmationDialogCancel.addEventListener("click", () => settleConfirmationDialog(false));
  elements.confirmationDialogInput.addEventListener("input", updateConfirmationDialogState);
  elements.confirmationDialogForm.addEventListener("submit", (event) => {
    event.preventDefault();
    if (elements.confirmationDialogConfirm.disabled) {
      elements.confirmationDialogInput.focus();
      return;
    }
    settleConfirmationDialog(true);
  });
  elements.confirmationDialog.addEventListener("cancel", (event) => {
    event.preventDefault();
    settleConfirmationDialog(false);
  });
  elements.confirmationDialog.addEventListener("close", () => {
    if (confirmationDialogResolver) {
      settleConfirmationDialog(false);
    }
  });
}

function confirmDashboardAction({
  title,
  message,
  confirmLabel = "Nadaljuj",
  requiredText = "",
  danger = false,
}) {
  if (confirmationDialogResolver) {
    return Promise.resolve(false);
  }

  elements.confirmationDialogEyebrow.textContent = danger ? "Nevarno dejanje" : "Potrditev dejanja";
  elements.confirmationDialogTitle.textContent = title;
  elements.confirmationDialogMessage.textContent = message;
  elements.confirmationDialogConfirm.textContent = confirmLabel;
  elements.confirmationDialog.classList.toggle("confirmation-dialog-danger", danger);
  confirmationDialogRequiredText = requiredText;
  elements.confirmationDialogInput.value = "";
  elements.confirmationDialogInputLabel.hidden = !requiredText;
  elements.confirmationDialogInput.required = Boolean(requiredText);
  elements.confirmationDialogInputHint.textContent = requiredText
    ? `Za potrditev vpiši ${requiredText}.`
    : "";
  updateConfirmationDialogState();

  return new Promise((resolve) => {
    confirmationDialogResolver = resolve;
    elements.confirmationDialog.showModal();
    window.setTimeout(() => {
      if (!elements.confirmationDialog.open) return;
      if (requiredText) {
        elements.confirmationDialogInput.focus();
      } else {
        elements.confirmationDialogConfirm.focus();
      }
    }, 0);
  });
}

function confirmPermanentHistoryDeletion(message) {
  return confirmDashboardAction({
    title: "Trajni izbris meritev",
    message,
    confirmLabel: "Trajno izbriši",
    requiredText: "IZBRIŠI",
    danger: true,
  });
}

function confirmCloudWifiCredentialReset() {
  return confirmDashboardAction({
    title: "Izbriši Wi-Fi poverilnice",
    message: "Naprava bo trajno izbrisala shranjeno domače Wi-Fi omrežje, prekinila cloud povezavo in odprla lokalni nastavitveni dostop. Nato se poveži z njenim provisioning Wi-Fi omrežjem in odpri 192.168.4.1.",
    confirmLabel: "Izbriši Wi-Fi",
    requiredText: "WI-FI",
    danger: true,
  });
}

async function deleteDeviceHistory() {
  if (!cloudDevicePath || !firebaseDatabase) return;
  if (!isDeviceOnline(latestDeviceStatus)) {
    elements.historyManagementStatus.textContent = "Za popoln izbris mora biti naprava online.";
    return;
  }
  if (!isSDCardOperational()) {
    elements.historyManagementStatus.textContent = "SD kartica ni pripravljena; cloud zgodovine brez brisanja SD dnevnika ni dovoljeno izbrisati.";
    elements.deleteDeviceHistory.disabled = true;
    return;
  }
  if (!await confirmPermanentHistoryDeletion("Trajno izbrišem vse meritve iz SD kartice in Firebase? Tega ni mogoče razveljaviti.")) return;

  elements.deleteDeviceHistory.disabled = true;
  elements.historyManagementStatus.textContent = "Ukaz za popoln izbris pošiljam napravi …";
  try {
    const { database, ref, set } = firebaseDatabase;
    await set(ref(database, `${cloudDevicePath}/commands/firmware_update`), {
      action: "delete_history",
      requested_at: Math.floor(Date.now() / 1000),
    });
    elements.historyManagementStatus.textContent = "Ukaz je poslan. Naprava ga preveri v največ 30 sekundah.";
  } catch (error) {
    console.error(error);
    elements.historyManagementStatus.textContent = "Pošiljanje ukaza za brisanje ni uspelo.";
    renderHistoryManagementStatus(latestHistoryManagementStatus);
  }
}

async function clearCloudWifiCredentials() {
  if (!isCloudAdministrator() || !cloudDevicePath || !firebaseDatabase) return;
  if (!isDeviceOnline(latestDeviceStatus)) {
    renderCloudWifiResetStatus(latestNetworkResetStatus);
    return;
  }
  if (!await confirmCloudWifiCredentialReset()) return;

  elements.clearCloudWifiCredentials.disabled = true;
  elements.cloudWifiResetStatus.textContent = "Ukaz za izbris Wi-Fi poverilnic pošiljam napravi …";
  try {
    const { database, ref, set } = firebaseDatabase;
    await set(ref(database, `${cloudDevicePath}/commands/firmware_update`), {
      action: "clear_wifi_credentials",
      requested_at: Math.floor(Date.now() / 1000),
    });
    elements.cloudWifiResetStatus.textContent = "Ukaz je poslan. Naprava ga preveri v največ 30 sekundah.";
  } catch (error) {
    console.error(error);
    elements.cloudWifiResetStatus.textContent = "Pošiljanje ukaza za izbris Wi-Fi poverilnic ni uspelo.";
    renderCloudWifiResetStatus(latestNetworkResetStatus);
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
  const requestFromAccessPoint = dashboardUsesProvisioningAddress();
  submitButton.disabled = true;
  elements.wifiConnectionResult.hidden = true;
  wifiTransitionDeadline = 0;
  wifiTransitionAddress = "";
  elements.wifiFormStatus.textContent = "Preverjam povezavo z Wi‑Fi omrežjem …";
  try {
    const response = await fetch("/api/wifi", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" },
      body: new URLSearchParams({ ssid, password }),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error ?? "Nastavitev Wi‑Fi ni uspela");

    if (requestFromAccessPoint) {
      elements.wifiFormStatus.textContent = "Naprava preverja povezavo. Nastavitve shrani šele po uspehu …";
    } else {
      showHomeNetworkTransition(ssid);
    }
  } catch (error) {
    elements.wifiFormStatus.textContent = error.message;
    submitButton.disabled = false;
  }
}

function toggleWiFiPasswordVisibility() {
  const revealPassword = elements.wifiPassword.type === "password";
  elements.wifiPassword.type = revealPassword ? "text" : "password";
  elements.wifiPasswordToggle.setAttribute("aria-pressed", String(revealPassword));
  const actionLabel = revealPassword ? "Skrij Wi‑Fi geslo" : "Prikaži Wi‑Fi geslo";
  elements.wifiPasswordToggle.setAttribute("aria-label", actionLabel);
  elements.wifiPasswordToggle.title = actionLabel;
  elements.wifiPassword.focus();
}

function delay(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function copyWiFiTransitionAddress() {
  if (!wifiTransitionAddress) return;

  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(wifiTransitionAddress);
    } else {
      const temporaryInput = document.createElement("textarea");
      temporaryInput.value = wifiTransitionAddress;
      temporaryInput.setAttribute("readonly", "");
      temporaryInput.style.position = "fixed";
      temporaryInput.style.opacity = "0";
      document.body.append(temporaryInput);
      temporaryInput.select();
      const copied = document.execCommand("copy");
      temporaryInput.remove();
      if (!copied) throw new Error("Naslova ni bilo mogoče kopirati");
    }
    elements.wifiCopyStatus.textContent = "Novi lokalni naslov je kopiran.";
  } catch (error) {
    elements.wifiCopyStatus.textContent = "Kopiranje ni uspelo. Naslov označi in kopiraj ročno.";
  }
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
  if (!await confirmDashboardAction({
    title: "Izbriši shranjeni Wi‑Fi",
    message: "Naprava bo nato odprla svojo dostopno točko.",
    confirmLabel: "Izbriši Wi‑Fi",
    danger: true,
  })) return;

  elements.wifiForget.disabled = true;
  showForgottenWiFiTransition();
  // Brskalniku omogočimo, da navodila izriše še pred prekinitvijo STA povezave.
  await delay(50);
  try {
    const response = await fetch("/api/wifi", { method: "DELETE" });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error ?? "Brisanje Wi‑Fi nastavitev ni uspelo");
  } catch (error) {
    if (error instanceof TypeError) {
      elements.wifiTransitionNotice.textContent = "Povezava z napravo je bila prekinjena. To je po brisanju omrežja pričakovano; nadaljuj prek prikazane dostopne točke.";
      return;
    }
    wifiTransitionMode = "idle";
    elements.wifiConnectionResult.hidden = true;
    elements.wifiForm.hidden = false;
    elements.wifiFormStatus.textContent = error.message;
    elements.wifiForget.disabled = false;
  }
}

async function resetCloudHistorySynchronization() {
  if (!isSDCardOperational()) {
    elements.cloudSyncStatus.textContent = "SD kartica ni pripravljena; sinhronizacije ni mogoče začeti.";
    elements.cloudResync.disabled = true;
    return;
  }
  if (!await confirmDashboardAction({
    title: "Ponovno sinhroniziraj zgodovino",
    message: "Primerjam dnevne indekse SD kartice in Firebase ter prenesem samo manjkajoče ali neskladne dneve.",
    confirmLabel: "Začni sinhronizacijo",
  })) return;

  elements.cloudResync.disabled = true;
  elements.cloudSyncStatus.textContent = "Pripravljam primerjavo SD zgodovine in Firebase …";
  try {
    if (isLocalDashboard) {
      const response = await fetch("/api/sync/reset", { method: "POST" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Ponastavitev sinhronizacije ni uspela");
      elements.cloudSyncStatus.textContent = "Primerjava dnevne zgodovine se je začela.";
    } else {
      if (!cloudDevicePath || !firebaseDatabase || !currentCloudUser || !isDeviceOnline(latestDeviceStatus)) {
        throw new Error("Za ponovno sinhronizacijo mora biti izbrani panj online.");
      }
      const { database, ref, set } = firebaseDatabase;
      await set(ref(database, `${cloudDevicePath}/commands/firmware_update`), {
        action: "sync_history",
        requested_at: Math.floor(Date.now() / 1000),
      });
      elements.cloudSyncStatus.textContent = "Ukaz je poslan. Naprava ga preveri v največ 30 sekundah.";
    }
  } catch (error) {
    elements.cloudSyncStatus.textContent = error.message;
    const hasCloudConnection = isLocalDashboard
      ? latestNetworkStatus?.station_connected === true
      : isDeviceOnline(latestDeviceStatus);
    elements.cloudResync.disabled = !isSDCardOperational() || !hasCloudConnection;
  }
}

async function deleteLocalMeasurementHistory() {
  if (!isSDCardOperational()) {
    elements.localMeasurementLogStatus.textContent = "SD kartica ni pripravljena; meritev ni mogoče izbrisati.";
    elements.deleteLocalMeasurementLog.disabled = true;
    return;
  }
  if (!await confirmPermanentHistoryDeletion("Trajno izbrišem vse meritve samo s SD kartice? Zgodovina v Firebase bo ostala nespremenjena.")) return;

  elements.deleteLocalMeasurementLog.disabled = true;
  elements.localMeasurementLogStatus.textContent = "Zahtevo za brisanje pošiljam napravi …";
  try {
    const response = await fetch("/api/history", { method: "DELETE" });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error ?? "Brisanje meritev s SD kartice ni uspelo");
    elements.localMeasurementLogStatus.textContent = "Brisanje dnevnika je uvrščeno v čakalno vrsto …";
  } catch (error) {
    elements.localMeasurementLogStatus.textContent = error.message;
    elements.deleteLocalMeasurementLog.disabled = !isSDCardOperational();
  }
}

async function requestLoadCellTare() {
  const statusElement = isLocalDashboard ? elements.localLoadCellTareStatus : elements.cloudLoadCellTareStatus;
  if (!isComponentOperational("hx711", latestLoadCellTareStatus)) {
    statusElement.textContent = "HX711 ni pripravljen; tariranje trenutno ni možno.";
    return;
  }
  if (!await confirmDashboardAction({
    title: "Tariraj tehtnico",
    message: "Odstrani panj in vse uteži s ploščadi. Trenutno stanje bo nastavljeno na 0,00 kg.",
    confirmLabel: "Tariraj",
  })) return;

  const previousStatus = latestLoadCellTareStatus;
  const button = isLocalDashboard ? elements.localLoadCellTare : elements.cloudLoadCellTare;
  button.disabled = true;
  statusElement.textContent = isLocalDashboard
    ? "Tariranje pošiljam napravi …"
    : "Ukaz za tariranje pošiljam napravi …";
  try {
    if (isLocalDashboard) {
      const response = await fetch("/api/sensors/load-cell/tare", { method: "POST" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Tariranja ni bilo mogoče začeti");
    } else {
      if (!cloudDevicePath || !firebaseDatabase || !currentCloudUser || !isDeviceOnline(latestDeviceStatus)) {
        throw new Error("Za tariranje mora biti izbrana naprava online");
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

function readBme680CalibrationInputs() {
  const temperatureInput = isLocalDashboard ? elements.localTemperatureOffset : elements.cloudTemperatureOffset;
  const humidityInput = isLocalDashboard ? elements.localHumidityOffset : elements.cloudHumidityOffset;
  const temperatureOffset = Number(String(temperatureInput.value).replace(",", "."));
  const humidityOffset = Number(String(humidityInput.value).replace(",", "."));
  if (!Number.isFinite(temperatureOffset) || temperatureOffset < -10 || temperatureOffset > 10) {
    throw new Error("Temperaturni odmik mora biti med -10,0 in +10,0 °C.");
  }
  if (!Number.isFinite(humidityOffset) || humidityOffset < -30 || humidityOffset > 30) {
    throw new Error("Odmik vlage mora biti med -30,0 in +30,0 %.");
  }
  return { temperatureOffset, humidityOffset };
}

async function saveBme680Calibration(event) {
  event.preventDefault();
  const statusElement = isLocalDashboard
    ? elements.localBme680CalibrationStatus
    : elements.cloudBme680CalibrationStatus;
  try {
    if (!isComponentOperational("bme680", latestBme680CalibrationStatus)) {
      throw new Error("BME680 ni pripravljen; odmikov trenutno ni mogoče nastaviti.");
    }
    const { temperatureOffset, humidityOffset } = readBme680CalibrationInputs();
    bme680CalibrationRequestedAt = Math.floor(Date.now() / 1000);
    bme680CalibrationPendingUntil = bme680CalibrationRequestedAt + BME680_CALIBRATION_TIMEOUT_SECONDS;
    statusElement.textContent = isLocalDashboard
      ? "Kalibracijo pošiljam napravi …"
      : "Ukaz za kalibracijo pošiljam napravi …";
    if (isLocalDashboard) {
      const body = new URLSearchParams({
        temperature_offset_c: temperatureOffset.toFixed(1),
        humidity_offset_percent: humidityOffset.toFixed(1),
      });
      const response = await fetch("/api/sensors/bme680/calibration", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" },
        body,
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Kalibracije BME680 ni bilo mogoče začeti");
    } else {
      if (!cloudDevicePath || !firebaseDatabase || !currentCloudUser || !isDeviceOnline(latestDeviceStatus)) {
        throw new Error("Za kalibracijo mora biti izbrana naprava online");
      }
      const { database, ref, set } = firebaseDatabase;
      await set(ref(database, `${cloudDevicePath}/commands/firmware_update`), {
        action: "set_bme680_calibration",
        temperature_offset_c: Number(temperatureOffset.toFixed(1)),
        humidity_offset_percent: Number(humidityOffset.toFixed(1)),
        requested_at: bme680CalibrationRequestedAt,
      });
    }
    renderBme680CalibrationStatus({
      ready: latestBme680CalibrationStatus?.ready,
      temperature_offset_c: temperatureOffset,
      humidity_offset_percent: humidityOffset,
      state: "queued",
    });
  } catch (error) {
    bme680CalibrationPendingUntil = 0;
    renderBme680CalibrationStatus(latestBme680CalibrationStatus);
    statusElement.textContent = error.message;
  }
}

async function sendDeviceTimeCommand(action, timestamp) {
  if (!isComponentOperational("ds3231", {
    ready: latestTimeStatus?.rtc_present === true,
    state: latestTimeStatus?.rtc_present === true ? "ok" : "error",
  })) {
    throw new Error("DS3231 ni pripravljen; nastavljanje in sinhronizacija časa trenutno nista mogoča.");
  }
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
      ? "Nastavitev je sprejeta. Naprava bo posodobila sistemsko uro in DS3231."
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
  elements.wifiPasswordToggle.addEventListener("click", toggleWiFiPasswordVisibility);
  elements.wifiScan.addEventListener("click", scanWiFiNetworks);
  elements.wifiForget.addEventListener("click", forgetWiFiConfiguration);
  elements.wifiCopyAddress.addEventListener("click", copyWiFiTransitionAddress);
  elements.cloudResync.addEventListener("click", resetCloudHistorySynchronization);
  elements.deleteLocalMeasurementLog.addEventListener("click", deleteLocalMeasurementHistory);
  elements.localLoadCellTare.addEventListener("click", requestLoadCellTare);
  elements.cloudLoadCellTare.addEventListener("click", requestLoadCellTare);
  elements.localBme680CalibrationForm.addEventListener("submit", saveBme680Calibration);
  elements.cloudBme680CalibrationForm.addEventListener("submit", saveBme680Calibration);
  [elements.localBme680CalibrationForm, elements.cloudBme680CalibrationForm].forEach((form) => {
    form.addEventListener("input", () => {
      form.dataset.dirty = "true";
    });
  });
  elements.deviceTimeForm.addEventListener("submit", setDeviceTime);
  elements.syncDeviceTime.addEventListener("click", synchronizeDeviceTime);
  setInterval(updateWiFiTransitionNotice, 1_000);
}

function renderSDStatus(status) {
  latestSDCardStatus = status;
  const isPresent = status?.present === true;
  const hasError = status?.error === true;
  elements.sdCard.classList.toggle("ok", isPresent && !hasError);
  elements.sdCard.classList.toggle("error", hasError);
  elements.sdStatus.textContent = isPresent ? "Zaznana" : "Ni zaznana";
  elements.sdStatusDetail.textContent = hasError ? "Po petih poskusih ni bila zaznana." : `${status?.initialization_failures ?? 0} neuspelih inicializacij`;
  if (!isLocalDashboard) {
    renderCloudSynchronization(latestDeviceStatus?.history_sync,
      { station_connected: isDeviceOnline(latestDeviceStatus) }, status);
    renderHistoryManagementStatus(latestHistoryManagementStatus);
  }
}

function renderFirmwareVersion(status) {
  latestFirmwareVersion = status?.version ?? "";
  const displayedVersion = latestFirmwareVersion ? `v${latestFirmwareVersion}` : "—";
  elements.otaCurrentVersion.textContent = displayedVersion;
  elements.localCurrentVersion.textContent = displayedVersion;
  if (!isLocalDashboard && latestOtaStatus) renderOtaDeviceStatus(latestOtaStatus);
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
  elements.otaSafetyNotice.hidden = true;
}

function updateOtaActionState() {
  const isOtaActive = otaCommandPending || OTA_ACTIVE_STATES.has(latestOtaState);
  const hasAvailableRelease = Boolean(availableOtaRelease);
  elements.otaInstall.disabled = !hasAvailableRelease || isOtaActive;
  elements.otaIgnore.disabled = !hasAvailableRelease || isOtaActive;
  elements.otaInstall.textContent = isOtaActive ? "Posodobitev poteka" : "Posodobi napravo";
  elements.otaCard.setAttribute("aria-busy", String(isOtaActive));
  elements.otaSafetyNotice.hidden = !isOtaActive;
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
  latestOtaStatus = status;
  if (!status?.state) {
    latestOtaState = "";
    resetOtaProgress();
    updateOtaActionState();
    return;
  }

  const reportedState = String(status.state);
  const targetVersion = String(status.target_version ?? "");
  const message = String(status.message ?? "").trim();
  const installedAfterCloudRestart = reportedState === "restarting"
    && Boolean(targetVersion)
    && targetVersion === latestFirmwareVersion;
  const staleInvalidCommand = reportedState === "error" && message === "Neveljaven OTA ukaz.";
  const state = installedAfterCloudRestart ? "installed" : (staleInvalidCommand ? "" : reportedState);
  const currentVersionInstalled = state === "installed"
    && Boolean(targetVersion)
    && targetVersion === latestFirmwareVersion;
  const requestedVersionAlreadyInstalled = state === "ignored"
    && Boolean(targetVersion)
    && targetVersion === latestFirmwareVersion
    && message === "Zahtevana različica ni novejša.";
  latestOtaState = state;
  if (currentVersionInstalled) {
    const updatedAt = Number(status.updated_at);
    const installedAt = Number.isFinite(updatedAt) && updatedAt > 0
      ? formatDashboardDateTime(new Date(updatedAt * 1000))
      : "neznanem času";
    elements.otaDeviceStatus.textContent = `Zadnja uspešna OTA posodobitev: ${installedAt}.`;
    renderOtaProgress(100);
  } else if (requestedVersionAlreadyInstalled) {
    elements.otaDeviceStatus.textContent = `Različica v${targetVersion} je že nameščena.`;
    renderOtaProgress(100);
    availableOtaRelease = undefined;
    elements.otaActions.hidden = true;
  } else if (staleInvalidCommand) {
    elements.otaDeviceStatus.textContent = "Zadnja cloud OTA posodobitev ni zabeležena.";
    resetOtaProgress();
  } else {
    const stateLabel = OTA_STATE_LABELS[state] ?? state;
    const hasRepeatedPhase = message.toLocaleLowerCase().startsWith(stateLabel.toLocaleLowerCase());
    elements.otaDeviceStatus.textContent = message && hasRepeatedPhase ? message : `${stateLabel}${message ? `: ${message}` : ""}`;
    renderOtaProgress(status.progress_percent, state === "error");
  }

  if (OTA_TERMINAL_STATES.has(state)) {
    otaCommandPending = false;
  }
  if (state === "installed") {
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
  elements.otaDetail.textContent = release.name || "Nova različica naprave je pripravljena na GitHub Releases.";
  elements.otaActions.hidden = isIgnored;
  if (isIgnored) elements.otaDeviceStatus.textContent = "Prezrto v tem brskalniku.";
  updateOtaActionState();
}

async function checkForFirmwareRelease() {
  if (!latestFirmwareVersion || isLocalDashboard) return;
  try {
    const response = await fetch(GITHUB_LATEST_RELEASE_URL, {
      cache: "no-store",
      headers: { Accept: "application/vnd.github+json" },
    });
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
      elements.otaLabel.textContent = "Naprava je posodobljena";
      elements.otaVersion.textContent = `v${latestFirmwareVersion}`;
      elements.otaDetail.textContent = "Ni navoljo novejše različice.";
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
  if (!await confirmDashboardAction({
    title: "Namesti posodobitev",
    message: `Napravo posodobim na verzijo ${availableOtaRelease.version}? Med prenosom naprave ne izklapljaj in ne prekinjaj povezave Wi-Fi.`,
    confirmLabel: "Začni posodobitev",
  })) return;

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
    elements.otaDeviceStatus.textContent = "Ukaz je poslan. Naprava ga preveri v največ 30 sekundah.";
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
  elements.localElegantOtaLink.addEventListener("click", (event) => {
    if (!isLocalDashboard) return;
    event.preventDefault();
    if (!elements.localOtaWarningDialog.open) elements.localOtaWarningDialog.showModal();
  });
  elements.localOtaWarningCancel.addEventListener("click", () => elements.localOtaWarningDialog.close());
  elements.localOtaWarningProceed.addEventListener("click", () => {
    window.location.assign(elements.localElegantOtaLink.href);
  });
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
    const temperature = parseMeasurementValue(reading.temperature_c);
    const humidity = parseMeasurementValue(reading.humidity_percent);
    const weight = parseMeasurementValue(reading.weight_kg);
    if (!Number.isFinite(timestamp) || (temperature === null && humidity === null && weight === null)) return;
    const reportedSampleCount = Math.floor(Number(reading.sample_count));
    const sampleCount = Number.isFinite(reportedSampleCount) && reportedSampleCount > 0
      ? reportedSampleCount
      : 1;
    const getComponentSampleCount = (value) => {
      const count = Math.floor(Number(value));
      return Number.isFinite(count) && count > 0 ? count : sampleCount;
    };

    const bucket = Math.floor(timestamp / bucketSeconds) * bucketSeconds;
    const current = buckets.get(bucket) ?? {
      timestamp: bucket,
      temperature: 0,
      humidity: 0,
      weight: 0,
      temperatureCount: 0,
      humidityCount: 0,
      weightCount: 0,
    };
    if (temperature !== null) {
      const temperatureCount = getComponentSampleCount(reading.temperature_sample_count);
      current.temperature += temperature * temperatureCount;
      current.temperatureCount += temperatureCount;
    }
    if (humidity !== null) {
      const humidityCount = getComponentSampleCount(reading.humidity_sample_count);
      current.humidity += humidity * humidityCount;
      current.humidityCount += humidityCount;
    }
    if (weight !== null) {
      const weightCount = getComponentSampleCount(reading.weight_sample_count);
      current.weight += weight * weightCount;
      current.weightCount += weightCount;
    }
    buckets.set(bucket, current);
  });

  return [...buckets.values()]
    .map((bucket) => ({
      timestamp: bucket.timestamp,
      temperature_c: bucket.temperatureCount > 0 ? bucket.temperature / bucket.temperatureCount : null,
      humidity_percent: bucket.humidityCount > 0 ? bucket.humidity / bucket.humidityCount : null,
      weight_kg: bucket.weightCount > 0 ? bucket.weight / bucket.weightCount : null,
    }))
    .sort((first, second) => first.timestamp - second.timestamp);
}

function getAppliedChartRange() {
  const from = Math.floor(appliedRange.from.getTime() / 1000);
  const to = Math.floor(appliedRange.to.getTime() / 1000);
  return { min: from, max: Math.max(from + 1, to) };
}

function getChartXRange(chart) {
  const minimum = Number(chart?.scales?.x?.min);
  const maximum = Number(chart?.scales?.x?.max);
  return Number.isFinite(minimum) && Number.isFinite(maximum) && maximum > minimum
    ? { min: minimum, max: maximum }
    : undefined;
}

function formatChartAxisNumber(value, decimals = 1) {
  const numericValue = Number(value);
  return Number.isFinite(numericValue)
    ? numericValue.toLocaleString("sl-SI", { maximumFractionDigits: decimals })
    : "";
}

function getDashboardLanguage() {
  return document.documentElement.lang?.toLowerCase().startsWith("en") ? "en" : "sl";
}

function getChartAxisFormatters() {
  const language = getDashboardLanguage();
  const cached = CHART_AXIS_FORMATTERS.get(language);
  if (cached) return cached;

  const locale = language === "en" ? "en-GB" : "sl-SI";
  const formatters = {
    time: new Intl.DateTimeFormat(locale, { hour: "2-digit", minute: "2-digit", hourCycle: "h23" }),
    shortDateTime: new Intl.DateTimeFormat(locale, {
      day: "numeric",
      month: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    }),
    shortDate: new Intl.DateTimeFormat(locale, { day: "numeric", month: "numeric" }),
    month: new Intl.DateTimeFormat(locale, { month: "short", year: "2-digit" }),
    year: new Intl.DateTimeFormat(locale, { year: "numeric" }),
  };
  CHART_AXIS_FORMATTERS.set(language, formatters);
  return formatters;
}

function getVisibleChartSpanSeconds(chart) {
  const minimum = Number(chart?.scales?.x?.min);
  const maximum = Number(chart?.scales?.x?.max);
  return Number.isFinite(minimum) && Number.isFinite(maximum) && maximum > minimum
    ? maximum - minimum
    : CHART_AXIS_DAY_SECONDS;
}

function formatChartTimeAxis(chart, splits) {
  const spanSeconds = getVisibleChartSpanSeconds(chart);
  const formatters = getChartAxisFormatters();
  const formatter = spanSeconds <= CHART_AXIS_DAY_SECONDS
    ? formatters.time
    : spanSeconds <= 7 * CHART_AXIS_DAY_SECONDS
      ? formatters.shortDateTime
      : spanSeconds <= 120 * CHART_AXIS_DAY_SECONDS
        ? formatters.shortDate
        : spanSeconds <= 2 * 365 * CHART_AXIS_DAY_SECONDS
          ? formatters.month
          : formatters.year;

  return splits.map((timestamp) => formatter.format(new Date(timestamp * 1000)));
}

function getChartXAxisSpace(_chart, _axisIndex, minimum, maximum, plotWidth) {
  const requestedSpan = Number(maximum) - Number(minimum);
  const spanSeconds = Number.isFinite(requestedSpan) && requestedSpan > 0
    ? requestedSpan
    : getVisibleChartSpanSeconds(_chart);
  const width = Math.max(1, Number(plotWidth) || 0);
  const targetLabelCount = width < 460 ? 3 : width < 760 ? 5 : 7;
  const labelWidth = spanSeconds <= CHART_AXIS_DAY_SECONDS
    ? 62
    : spanSeconds <= 7 * CHART_AXIS_DAY_SECONDS
      ? 112
      : spanSeconds <= 120 * CHART_AXIS_DAY_SECONDS
        ? 66
        : spanSeconds <= 2 * 365 * CHART_AXIS_DAY_SECONDS
          ? 84
          : 58;
  return Math.max(labelWidth + 14, Math.floor(width / targetLabelCount));
}

function buildUPlotData(readings) {
  const measurementsByTimestamp = new Map();

  for (const reading of Array.isArray(readings) ? readings : []) {
    const timestamp = Number(reading?.timestamp);
    if (!Number.isFinite(timestamp) || timestamp <= 0) continue;
    measurementsByTimestamp.set(timestamp, {
      temperature: parseMeasurementValue(reading?.temperature_c),
      humidity: parseMeasurementValue(reading?.humidity_percent),
      weight: parseMeasurementValue(reading?.weight_kg),
    });
  }

  const timestamps = [...measurementsByTimestamp.keys()].sort((first, second) => first - second);
  const temperatures = new Array(timestamps.length);
  const humidities = new Array(timestamps.length);
  const weights = new Array(timestamps.length);

  timestamps.forEach((timestamp, index) => {
    const measurement = measurementsByTimestamp.get(timestamp);
    temperatures[index] = measurement.temperature;
    humidities[index] = measurement.humidity;
    weights[index] = measurement.weight;
  });

  return {
    climate: [timestamps, temperatures, humidities],
    weight: [timestamps, weights],
  };
}

function countValidChartValues(values) {
  return values.reduce((count, value) => count + (Number.isFinite(value) ? 1 : 0), 0);
}

function isChartSeriesVisible(chartType, seriesIndex) {
  return chartSeriesVisibility[chartType]?.[seriesIndex] !== false;
}

function setChartLegendItemState(item, isVisible) {
  item.classList.toggle("is-hidden", !isVisible);
  item.setAttribute("aria-pressed", String(isVisible));
}

function createChartLegend(container, entries) {
  const legend = document.createElement("div");
  legend.className = "chart-legend";
  const items = entries.map((entry) => {
    const item = document.createElement("button");
    item.type = "button";
    item.className = "chart-legend-item";
    item.dataset.seriesIndex = String(entry.seriesIndex);
    item.setAttribute("aria-label", `${entry.label}: prikaži ali skrij serijo`);
    setChartLegendItemState(item, isChartSeriesVisible(entry.chartType, entry.seriesIndex));
    const marker = document.createElement("span");
    marker.className = "chart-legend-marker";
    marker.style.backgroundColor = entry.color;
    const label = document.createElement("span");
    label.textContent = entry.label;
    item.append(marker, label);
    legend.append(item);
    return { element: item, seriesIndex: entry.seriesIndex };
  });
  container.append(legend);
  return items;
}

function createChartTooltip(chartHost, entries) {
  const tooltip = document.createElement("div");
  tooltip.className = "chart-tooltip";
  tooltip.hidden = true;
  const timestamp = document.createElement("p");
  timestamp.className = "chart-tooltip-time";
  tooltip.append(timestamp);

  const rows = entries.map((entry) => {
    const row = document.createElement("p");
    row.className = "chart-tooltip-row";
    const marker = document.createElement("span");
    marker.className = "chart-tooltip-marker";
    marker.style.backgroundColor = entry.color;
    const label = document.createElement("span");
    label.textContent = `${entry.label}: `;
    const value = document.createElement("strong");
    row.append(marker, label, value);
    tooltip.append(row);
    return { row, value, seriesIndex: entry.seriesIndex };
  });

  chartHost.append(tooltip);
  return { element: tooltip, timestamp, rows, chartHost };
}

function createChartPresentation(containerId, chartType, legendEntries, tooltipEntries) {
  const container = document.querySelector(`#${containerId}`);
  container.replaceChildren();
  const legendItems = createChartLegend(
    container,
    legendEntries.map((entry) => ({ ...entry, chartType })),
  );
  const chartHost = document.createElement("div");
  chartHost.className = "chart-plot";
  container.append(chartHost);
  const resetZoomButton = document.createElement("button");
  resetZoomButton.type = "button";
  resetZoomButton.className = "chart-reset-zoom";
  resetZoomButton.textContent = UI_TEXT[getDashboardLanguage()].resetZoom;
  resetZoomButton.hidden = true;
  chartHost.append(resetZoomButton);
  return {
    chartHost,
    tooltip: createChartTooltip(chartHost, tooltipEntries),
    resetZoomButton,
    legendItems,
  };
}

function hideChartTooltip(tooltip) {
  if (tooltip) tooltip.element.hidden = true;
}

function updateChartTooltip(chart, tooltip) {
  const index = chart.cursor.idx;
  const timestamp = Number.isInteger(index) ? Number(chart.data[0]?.[index]) : NaN;
  if (!Number.isFinite(timestamp)) {
    hideChartTooltip(tooltip);
    return;
  }

  let hasValue = false;
  tooltip.timestamp.textContent = formatDashboardDateTime(new Date(timestamp * 1000));
  tooltip.rows.forEach(({ row, value, seriesIndex }) => {
    const measurement = parseMeasurementValue(chart.data[seriesIndex]?.[index]);
    const isVisible = chart.series[seriesIndex]?.show !== false;
    const isValid = measurement !== null;
    row.hidden = !isVisible || !isValid;
    if (isValid) {
      value.textContent = formatValue(measurement);
      hasValue = true;
    }
  });
  if (!hasValue) {
    hideChartTooltip(tooltip);
    return;
  }

  tooltip.element.hidden = false;
  const desiredLeft = chart.bbox.left + chart.cursor.left + 16;
  const desiredTop = chart.bbox.top + chart.cursor.top + 16;
  const maximumLeft = Math.max(12, tooltip.chartHost.clientWidth - tooltip.element.offsetWidth - 12);
  const maximumTop = Math.max(12, tooltip.chartHost.clientHeight - tooltip.element.offsetHeight - 12);
  tooltip.element.style.left = `${Math.max(12, Math.min(desiredLeft, maximumLeft))}px`;
  tooltip.element.style.top = `${Math.max(12, Math.min(desiredTop, maximumTop))}px`;
}

function updateClimateGridAxis(chart) {
  const temperatureVisible = isChartSeriesVisible("climate", 1);
  const humidityVisible = isChartSeriesVisible("climate", 2);

  chart.axes[1].grid.show = temperatureVisible;
  chart.axes[2].grid.show = !temperatureVisible && humidityVisible;
}

function initializeChartLegend(chart, chartType, legendItems, tooltip) {
  legendItems.forEach(({ element, seriesIndex }) => {
    element.addEventListener("click", () => {
      const isVisible = !isChartSeriesVisible(chartType, seriesIndex);
      chartSeriesVisibility[chartType][seriesIndex] = isVisible;
      if (chartType === "climate") {
        chart.batch(() => {
          chart.setSeries(seriesIndex, { show: isVisible });
          updateClimateGridAxis(chart);
        });
      } else {
        chart.setSeries(seriesIndex, { show: isVisible });
      }
      setChartLegendItemState(element, isVisible);
      updateChartTooltip(chart, tooltip);
    });
  });
}

function getChartSize(chartHost) {
  return {
    width: Math.max(1, Math.floor(chartHost.clientWidth)),
    height: Math.max(1, Math.floor(chartHost.clientHeight)),
  };
}

function setChartZoomState(chartType, isZoomed, resetZoomButton) {
  if (chartType === "climate") climateChartHasUserZoom = isZoomed;
  else weightChartHasUserZoom = isZoomed;
  if (resetZoomButton) resetZoomButton.hidden = !isZoomed;
}

function resetChartZoom(chartType, chart, resetZoomButton) {
  setChartZoomState(chartType, false, resetZoomButton);
  chart.setScale("x", getAppliedChartRange());
}

function createXZoomPlugin(chartType, resetZoomButton) {
  let removeZoomListeners = null;

  return {
    hooks: {
      setSelect: [(chart) => {
        // Native uPlot med vlečenjem sproti riše `.u-select`, ob spustu pa
        // sam nastavi X merilo. Hook samo vključi naš gumb za ponastavitev.
        if (chart.select.width >= 5) {
          setChartZoomState(chartType, true, resetZoomButton);
        }
      }],
      ready: [(chart) => {
        removeZoomListeners?.();
        let panAnimationFrame = 0;
        let panGesture = null;
        let pendingPanClientX = null;
        const reset = () => resetChartZoom(chartType, chart, resetZoomButton);
        const applyPendingPan = () => {
          panAnimationFrame = 0;
          if (!panGesture || pendingPanClientX === null) return;

          const deltaPixels = pendingPanClientX - panGesture.startClientX;
          const shiftedRange = -(deltaPixels / Math.max(1, panGesture.plotWidth)) * panGesture.range;
          const applied = getAppliedChartRange();
          let minimum = panGesture.minimum + shiftedRange;
          let maximum = panGesture.maximum + shiftedRange;
          if (minimum < applied.min) {
            minimum = applied.min;
            maximum = minimum + panGesture.range;
          }
          if (maximum > applied.max) {
            maximum = applied.max;
            minimum = maximum - panGesture.range;
          }

          chart.setScale("x", { min: minimum, max: maximum });
          setChartZoomState(chartType, true, resetZoomButton);
          pendingPanClientX = null;
        };
        const handlePanStart = (event) => {
          if (event.button !== 0 || !event.shiftKey) return;

          const minimum = Number(chart.scales.x.min);
          const maximum = Number(chart.scales.x.max);
          const applied = getAppliedChartRange();
          const range = maximum - minimum;
          const appliedRange = applied.max - applied.min;
          if (!Number.isFinite(range) || range <= 0 || range >= appliedRange) return;

          event.preventDefault();
          event.stopImmediatePropagation();
          panGesture = {
            startClientX: event.clientX,
            minimum,
            maximum,
            range,
            plotWidth: chart.over.getBoundingClientRect().width,
          };
          pendingPanClientX = event.clientX;
          chart.over.classList.add("is-panning");
        };
        const handlePanMove = (event) => {
          if (!panGesture) return;
          event.preventDefault();
          pendingPanClientX = event.clientX;
          if (!panAnimationFrame) panAnimationFrame = requestAnimationFrame(applyPendingPan);
        };
        const stopPan = () => {
          if (!panGesture) return;
          if (panAnimationFrame && pendingPanClientX !== null) applyPendingPan();
          else if (panAnimationFrame) cancelAnimationFrame(panAnimationFrame);
          panAnimationFrame = 0;
          panGesture = null;
          pendingPanClientX = null;
          chart.over.classList.remove("is-panning");
        };
        const handleDoubleClick = (event) => {
          event.preventDefault();
          reset();
        };
        const handleResetClick = (event) => {
          event.preventDefault();
          event.stopPropagation();
          reset();
        };

        chart.over.addEventListener("mousedown", handlePanStart, true);
        document.addEventListener("mousemove", handlePanMove, { passive: false });
        document.addEventListener("mouseup", stopPan);
        window.addEventListener("blur", stopPan);
        chart.over.addEventListener("dblclick", handleDoubleClick);
        resetZoomButton?.addEventListener("click", handleResetClick);

        removeZoomListeners = () => {
          chart.over.removeEventListener("mousedown", handlePanStart, true);
          document.removeEventListener("mousemove", handlePanMove);
          document.removeEventListener("mouseup", stopPan);
          window.removeEventListener("blur", stopPan);
          chart.over.removeEventListener("dblclick", handleDoubleClick);
          resetZoomButton?.removeEventListener("click", handleResetClick);
          stopPan();
        };
      }],
      destroy: [() => {
        removeZoomListeners?.();
        removeZoomListeners = null;
      }],
    },
  };
}

function createTouchChartPlugin(chartType, tooltip, resetZoomButton) {
  let removeTouchListeners = null;

  return {
    hooks: {
      ready: [(chart) => {
        removeTouchListeners?.();

        let animationFrame = 0;
        let gesture = null;
        let pendingCursorTouch = null;
        let pendingTwoFingerTouches = null;

        const copyTouch = (touch) => ({ clientX: touch.clientX, clientY: touch.clientY });
        const copyTouches = (touches) => [copyTouch(touches[0]), copyTouch(touches[1])];
        const clampToPlot = (value, maximum) => Math.max(0, Math.min(maximum, value));
        const getPlotPoint = (touch, rect) => ({
          left: clampToPlot(touch.clientX - rect.left, rect.width),
          top: clampToPlot(touch.clientY - rect.top, rect.height),
        });
        const getTwoFingerGeometry = (touches, rect) => {
          const first = getPlotPoint(touches[0], rect);
          const second = getPlotPoint(touches[1], rect);
          const deltaX = second.left - first.left;
          return {
            midpointLeft: (first.left + second.left) / 2,
            distance: Math.max(1, Math.abs(deltaX)),
          };
        };
        const isZoomedFromAppliedRange = (minimum, maximum) => {
          const applied = getAppliedChartRange();
          const tolerance = Math.max(1, (applied.max - applied.min) * 0.0001);
          return Math.abs(minimum - applied.min) > tolerance
            || Math.abs(maximum - applied.max) > tolerance;
        };
        const applyPendingTouch = () => {
          animationFrame = 0;

          if (pendingTwoFingerTouches && gesture?.mode === "two-finger") {
            const current = getTwoFingerGeometry(pendingTwoFingerTouches, gesture.rect);
            const distanceDelta = current.distance - gesture.distance;
            const midpointDelta = current.midpointLeft - gesture.midpointLeft;
            const zoomThreshold = Math.max(10, gesture.distance * 0.06);
            const panThreshold = 8;

            if (gesture.intent === "pending") {
              const isPinch = Math.abs(distanceDelta) >= zoomThreshold
                && Math.abs(distanceDelta) > Math.abs(midpointDelta) * 1.2;
              const isPan = Math.abs(midpointDelta) >= panThreshold
                && Math.abs(distanceDelta) < Math.max(zoomThreshold, Math.abs(midpointDelta) * 0.35);
              if (isPinch) gesture.intent = "pinch";
              else if (isPan) gesture.intent = "pan";
            }

            if (gesture.intent === "pending") {
              pendingTwoFingerTouches = null;
              return;
            }

            const applied = getAppliedChartRange();
            const appliedRange = applied.max - applied.min;
            const scaleFactor = gesture.intent === "pinch" ? gesture.distance / current.distance : 1;
            const nextRange = Math.min(appliedRange, gesture.range * scaleFactor);
            const midpointRatio = current.midpointLeft / Math.max(1, gesture.rect.width);
            let minimum = gesture.anchorValue - midpointRatio * nextRange;
            let maximum = minimum + nextRange;
            if (minimum < applied.min) {
              minimum = applied.min;
              maximum = minimum + nextRange;
            }
            if (maximum > applied.max) {
              maximum = applied.max;
              minimum = maximum - nextRange;
            }

            if (Number.isFinite(minimum) && Number.isFinite(maximum) && maximum > minimum) {
              chart.setScale("x", { min: minimum, max: maximum });
              setChartZoomState(
                chartType,
                isZoomedFromAppliedRange(minimum, maximum),
                resetZoomButton,
              );
            }
            pendingTwoFingerTouches = null;
            return;
          }

          if (pendingCursorTouch && gesture?.mode === "cursor") {
            const rect = chart.over.getBoundingClientRect();
            const point = getPlotPoint(pendingCursorTouch, rect);
            chart.setCursor(point);
            pendingCursorTouch = null;
          }
        };
        const scheduleTouchUpdate = () => {
          if (!animationFrame) animationFrame = requestAnimationFrame(applyPendingTouch);
        };
        const beginCursorGesture = (touch) => {
          gesture = {
            mode: "cursor",
            startClientX: touch.clientX,
            startClientY: touch.clientY,
            direction: "pending",
          };
          pendingTwoFingerTouches = null;
          pendingCursorTouch = copyTouch(touch);
          scheduleTouchUpdate();
        };
        const beginTwoFingerGesture = (event) => {
          const rect = chart.over.getBoundingClientRect();
          const geometry = getTwoFingerGeometry(event.touches, rect);
          const minimum = Number(chart.scales.x.min);
          const maximum = Number(chart.scales.x.max);
          if (!Number.isFinite(minimum) || !Number.isFinite(maximum) || maximum <= minimum) return;

          gesture = {
            mode: "two-finger",
            intent: "pending",
            rect,
            distance: geometry.distance,
            midpointLeft: geometry.midpointLeft,
            range: maximum - minimum,
            anchorValue: chart.posToVal(geometry.midpointLeft, "x"),
          };
          pendingCursorTouch = null;
          pendingTwoFingerTouches = copyTouches(event.touches);
          chart.setCursor({ left: -10, top: -10 });
          hideChartTooltip(tooltip);
          scheduleTouchUpdate();
        };
        const handleTouchStart = (event) => {
          if (event.touches.length >= 2) {
            event.preventDefault();
            beginTwoFingerGesture(event);
          } else if (event.touches.length === 1) {
            beginCursorGesture(event.touches[0]);
          }
        };
        const handleTouchMove = (event) => {
          if (!gesture) return;

          if (event.touches.length >= 2) {
            event.preventDefault();
            if (gesture.mode !== "two-finger") beginTwoFingerGesture(event);
            pendingTwoFingerTouches = copyTouches(event.touches);
            scheduleTouchUpdate();
            return;
          }

          if (event.touches.length !== 1 || gesture.mode !== "cursor") return;
          const touch = event.touches[0];
          const deltaX = Math.abs(touch.clientX - gesture.startClientX);
          const deltaY = Math.abs(touch.clientY - gesture.startClientY);
          if (gesture.direction === "pending" && Math.max(deltaX, deltaY) >= 6) {
            gesture.direction = deltaX >= deltaY ? "horizontal" : "vertical";
          }
          if (gesture.direction === "vertical") return;

          event.preventDefault();
          pendingCursorTouch = copyTouch(touch);
          scheduleTouchUpdate();
        };
        const handleTouchEnd = (event) => {
          if (event.touches.length >= 2) {
            if (gesture?.mode !== "two-finger") beginTwoFingerGesture(event);
            return;
          }
          if (gesture?.mode === "two-finger" && event.touches.length === 1) {
            gesture = { mode: "wait-for-release" };
            pendingTwoFingerTouches = null;
            return;
          }
          if (event.touches.length === 1) {
            beginCursorGesture(event.touches[0]);
            return;
          }

          gesture = null;
          pendingCursorTouch = null;
          pendingTwoFingerTouches = null;
        };
        const handleTouchCancel = () => {
          gesture = null;
          pendingCursorTouch = null;
          pendingTwoFingerTouches = null;
          if (animationFrame) cancelAnimationFrame(animationFrame);
          animationFrame = 0;
        };

        chart.over.addEventListener("touchstart", handleTouchStart, { passive: false });
        document.addEventListener("touchmove", handleTouchMove, { passive: false });
        document.addEventListener("touchend", handleTouchEnd, { passive: false });
        document.addEventListener("touchcancel", handleTouchCancel, { passive: false });

        removeTouchListeners = () => {
          chart.over.removeEventListener("touchstart", handleTouchStart);
          document.removeEventListener("touchmove", handleTouchMove);
          document.removeEventListener("touchend", handleTouchEnd);
          document.removeEventListener("touchcancel", handleTouchCancel);
          handleTouchCancel();
        };
      }],
      destroy: [() => {
        removeTouchListeners?.();
        removeTouchListeners = null;
      }],
    },
  };
}

function createUPlotOptions(type, chartHost, tooltip, resetZoomButton) {
  const colors = getChartTheme();
  const isClimate = type === "climate";
  const temperatureVisible = isChartSeriesVisible("climate", 1);
  const humidityVisible = isChartSeriesVisible("climate", 2);
  const size = getChartSize(chartHost);
  const xRange = getAppliedChartRange();
  const sharedOptions = {
    width: size.width,
    height: size.height,
    legend: { show: false },
    select: {
      show: true,
      over: true,
    },
    cursor: {
      x: true,
      y: false,
      points: {
        show: () => document.createElement("span"),
        size: 11,
        width: 2,
        fill: (_chart, seriesIndex) => {
          if (!isClimate) return colors.weight;
          return seriesIndex === 1 ? colors.temperature : colors.humidity;
        },
        stroke: colors.surface,
      },
      drag: { x: true, y: false, setScale: true, dist: 5 },
    },
    scales: { x: { time: true, auto: false, min: xRange.min, max: xRange.max } },
    axes: [
      {
        scale: "x",
        side: 2,
        size: 64,
        gap: 8,
        space: getChartXAxisSpace,
        lineGap: 1.35,
        stroke: colors.textSoft,
        font: "600 12px Inter, system-ui, sans-serif",
        values: formatChartTimeAxis,
        ticks: { stroke: colors.border },
        border: { stroke: colors.border },
        grid: { show: false },
      },
    ],
    plugins: [
      createXZoomPlugin(type, resetZoomButton),
      createTouchChartPlugin(type, tooltip, resetZoomButton),
      {
        hooks: {
          setCursor: [(chart) => updateChartTooltip(chart, tooltip)],
          destroy: [() => hideChartTooltip(tooltip)],
        },
      },
    ],
  };

  if (isClimate) {
    return {
      ...sharedOptions,
      scales: {
        ...sharedOptions.scales,
        temperature: { auto: true },
        humidity: { auto: true },
      },
      series: [
        {},
        {
          label: "Temperatura (°C)",
          scale: "temperature",
          show: isChartSeriesVisible("climate", 1),
          stroke: colors.temperature,
          width: 2,
          points: { show: (chart) => countValidChartValues(chart.data[1]) === 1, size: 10, fill: colors.temperature, stroke: colors.temperature },
        },
        {
          label: "Vlaga (%)",
          scale: "humidity",
          show: isChartSeriesVisible("climate", 2),
          stroke: colors.humidity,
          width: 2,
          points: { show: (chart) => countValidChartValues(chart.data[2]) === 1, size: 10, fill: colors.humidity, stroke: colors.humidity },
        },
      ],
      axes: [
        ...sharedOptions.axes,
        {
          scale: "temperature",
          side: 3,
          size: 56,
          gap: 8,
          label: "°C",
          labelSize: 24,
          stroke: colors.textSoft,
          font: "600 12px Inter, system-ui, sans-serif",
          values: (_chart, splits) => splits.map((value) => formatChartAxisNumber(value)),
          ticks: { stroke: colors.border },
          border: { stroke: colors.border },
          grid: { show: temperatureVisible, stroke: colors.grid, width: 1 },
        },
        {
          scale: "humidity",
          side: 1,
          size: 54,
          gap: 8,
          label: "%",
          labelSize: 24,
          stroke: colors.textSoft,
          font: "600 12px Inter, system-ui, sans-serif",
          values: (_chart, splits) => splits.map((value) => formatChartAxisNumber(value)),
          ticks: { stroke: colors.border },
          border: { stroke: colors.border },
          grid: { show: !temperatureVisible && humidityVisible, stroke: colors.grid, width: 1 },
        },
      ],
    };
  }

  return {
    ...sharedOptions,
    scales: { ...sharedOptions.scales, weight: { auto: true } },
    series: [
      {},
      {
        label: "Teža (kg)",
        scale: "weight",
        show: isChartSeriesVisible("weight", 1),
        stroke: colors.weight,
        width: 2,
        points: { show: (chart) => countValidChartValues(chart.data[1]) === 1, size: 10, fill: colors.weight, stroke: colors.weight },
      },
    ],
    axes: [
      ...sharedOptions.axes,
      {
        scale: "weight",
        side: 3,
        size: 56,
        gap: 8,
        label: "kg",
        labelSize: 28,
        stroke: colors.textSoft,
        font: "600 12px Inter, system-ui, sans-serif",
        values: (_chart, splits) => splits.map((value) => formatChartAxisNumber(value)),
        ticks: { stroke: colors.border },
        border: { stroke: colors.border },
        grid: { stroke: colors.grid, width: 1 },
      },
    ],
  };
}

function resizeCharts() {
  [climateChart, weightChart].forEach((chart) => {
    if (!chart?.root?.parentElement) return;
    const size = getChartSize(chart.root.parentElement);
    if (chart.width !== size.width || chart.height !== size.height) chart.setSize(size);
  });
}

function initializeChartResizeObserver() {
  chartResizeObserver?.disconnect();
  chartResizeObserver = new ResizeObserver(() => {
    if (scheduledChartResize) return;
    scheduledChartResize = requestAnimationFrame(() => {
      scheduledChartResize = 0;
      resizeCharts();
    });
  });
  [climateChart, weightChart].forEach((chart) => {
    if (chart?.root?.parentElement) chartResizeObserver.observe(chart.root.parentElement);
  });
}

function destroyCharts() {
  chartResizeObserver?.disconnect();
  chartResizeObserver = undefined;
  if (scheduledChartResize) cancelAnimationFrame(scheduledChartResize);
  scheduledChartResize = 0;
  climateChart?.destroy();
  weightChart?.destroy();
  climateChart = undefined;
  weightChart = undefined;
}

function applyChartData(chart, data, chartType, shouldKeepZoom, zoomRange, resetZoomButton) {
  const preservedRange = zoomRange ?? (shouldKeepZoom ? getChartXRange(chart) : undefined);
  if (!preservedRange) setChartZoomState(chartType, false, resetZoomButton);
  chart.setData(data, true);
  chart.setScale("x", preservedRange ?? getAppliedChartRange());
}

function renderHistory(readings, alreadyAggregated = false, zoomRanges = {}) {
  const sourceReadings = Array.isArray(readings) ? readings : [];
  const chartReadings = alreadyAggregated ? sourceReadings : aggregateReadings(sourceReadings, appliedRange);
  latestHistoryReadings = sourceReadings;
  latestHistoryAlreadyAggregated = alreadyAggregated;
  elements.historySummary.textContent = chartReadings.length
    ? `Prikazanih je ${chartReadings.length} povprečnih točk. Za približanje povlecite po izbranem grafu.`
    : "Za izbrano obdobje še ni meritev.";
  if (!climateChart || !weightChart) return;

  const chartData = buildUPlotData(chartReadings);
  applyChartData(
    climateChart,
    chartData.climate,
    "climate",
    climateChartHasUserZoom,
    zoomRanges.climateZoom,
    climateChart.resetZoomButton,
  );
  applyChartData(
    weightChart,
    chartData.weight,
    "weight",
    weightChartHasUserZoom,
    zoomRanges.weightZoom,
    weightChart.resetZoomButton,
  );
}

function createCharts(zoomRanges = {}) {
  if (climateChart || weightChart || !window.uPlot) return;
  const colors = getChartTheme();
  const climatePresentation = createChartPresentation(
    "climate-chart",
    "climate",
    [
      { label: "Temperatura (°C)", color: colors.temperature, seriesIndex: 1 },
      { label: "Vlaga (%)", color: colors.humidity, seriesIndex: 2 },
    ],
    [
      { label: "Temperatura (°C)", color: colors.temperature, seriesIndex: 1 },
      { label: "Vlaga (%)", color: colors.humidity, seriesIndex: 2 },
    ],
  );
  const weightPresentation = createChartPresentation(
    "weight-chart",
    "weight",
    [{ label: "Teža (kg)", color: colors.weight, seriesIndex: 1 }],
    [{ label: "Teža (kg)", color: colors.weight, seriesIndex: 1 }],
  );
  climateChart = new window.uPlot(
    createUPlotOptions("climate", climatePresentation.chartHost, climatePresentation.tooltip, climatePresentation.resetZoomButton),
    [[], [], []],
    climatePresentation.chartHost,
  );
  weightChart = new window.uPlot(
    createUPlotOptions("weight", weightPresentation.chartHost, weightPresentation.tooltip, weightPresentation.resetZoomButton),
    [[], []],
    weightPresentation.chartHost,
  );
  climateChart.resetZoomButton = climatePresentation.resetZoomButton;
  weightChart.resetZoomButton = weightPresentation.resetZoomButton;
  initializeChartLegend(climateChart, "climate", climatePresentation.legendItems, climatePresentation.tooltip);
  initializeChartLegend(weightChart, "weight", weightPresentation.legendItems, weightPresentation.tooltip);
  initializeChartResizeObserver();
  renderHistory(latestHistoryReadings, latestHistoryAlreadyAggregated, zoomRanges);
}

function loadResource(resource, elementId, url, unavailableMessage) {
  const existing = document.querySelector(`#${elementId}`);
  if (existing?.dataset.loaded === "true" || existing?.sheet) return Promise.resolve();
  if (existing) {
    return new Promise((resolve, reject) => {
      existing.addEventListener("load", resolve, { once: true });
      existing.addEventListener("error", () => {
        existing.remove();
        reject(new Error(unavailableMessage));
      }, { once: true });
    });
  }

  return new Promise((resolve, reject) => {
    const element = document.createElement(resource === "style" ? "link" : "script");
    element.id = elementId;
    if (resource === "style") {
      element.rel = "stylesheet";
      element.href = url;
    } else {
      element.src = url;
      element.async = true;
    }
    element.addEventListener("load", () => {
      element.dataset.loaded = "true";
      resolve();
    }, { once: true });
    element.addEventListener("error", () => {
      element.remove();
      reject(new Error(unavailableMessage));
    }, { once: true });
    document.head.append(element);
  });
}

function loadUPlot() {
  if (window.uPlot) return Promise.resolve();
  if (uPlotLoading) return uPlotLoading;

  uPlotLoading = Promise.all([
    loadResource("style", "uplot-styles", "vendor/uPlot-1.6.32.min.css", "uPlot CSS ni dosegljiv."),
    loadResource("script", "uplot-script", "vendor/uPlot-1.6.32.iife.min.js", "uPlot ni dosegljiv."),
  ]).then(() => {
    if (!window.uPlot) throw new Error("uPlot se ni pravilno naložil.");
  }).catch((error) => {
    uPlotLoading = undefined;
    throw error;
  });
  return uPlotLoading;
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

function getAccountInitials(user) {
  const source = String(user?.displayName || user?.email || "PP").trim();
  const words = source.split(/\s+|@/).filter(Boolean);
  const initials = words.slice(0, 2).map((word) => word[0]).join("");
  return (initials || "PP").toLocaleUpperCase("sl-SI");
}

function renderAccountIdentity(user) {
  const email = user?.email || "Google račun";
  const avatarUrl = String(user?.photoURL || "").trim();
  elements.accountEmail.textContent = email;
  elements.accountAvatarInitials.textContent = getAccountInitials(user);
  elements.accountAvatar.classList.toggle("has-photo", Boolean(avatarUrl));
  elements.accountAvatarImage.hidden = !avatarUrl;
  elements.accountAvatarInitials.hidden = Boolean(avatarUrl);

  if (avatarUrl) {
    elements.accountAvatarImage.src = avatarUrl;
    elements.accountAvatarImage.alt = `Profilna slika uporabnika ${user.displayName || email}`;
    elements.accountAvatarImage.onerror = () => {
      elements.accountAvatar.classList.remove("has-photo");
      elements.accountAvatarImage.hidden = true;
      elements.accountAvatarInitials.hidden = false;
    };
  } else {
    elements.accountAvatarImage.removeAttribute("src");
    elements.accountAvatarImage.alt = "";
    elements.accountAvatarImage.onerror = null;
  }
}

async function renderHeaderAuthIdentity(user) {
  elements.authTriggerLabel.textContent = user ? "Odjava" : "Prijava";
  elements.authTriggerAvatar.hidden = true;

  if (!user) {
    elements.authTriggerAvatar.removeAttribute("src");
    elements.authTriggerAvatar.alt = "";
    elements.authTriggerAvatar.onerror = null;
    return;
  }

  let isGoogleSignIn = false;
  try {
    const tokenResult = await firebaseAuthModule.getIdTokenResult(user);
    isGoogleSignIn = tokenResult.signInProvider === "google.com";
  } catch {
    isGoogleSignIn = false;
  }

  if (currentCloudUser !== user) return;
  const avatarUrl = isGoogleSignIn ? String(user.photoURL || "").trim() : "";
  elements.authTriggerAvatar.hidden = !avatarUrl;

  if (avatarUrl) {
    elements.authTriggerAvatar.src = avatarUrl;
    elements.authTriggerAvatar.alt = `Profilna slika uporabnika ${user.displayName || user.email || "Google"}`;
    elements.authTriggerAvatar.onerror = () => {
      elements.authTriggerAvatar.hidden = true;
    };
  } else {
    elements.authTriggerAvatar.removeAttribute("src");
    elements.authTriggerAvatar.alt = "";
    elements.authTriggerAvatar.onerror = null;
  }
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
    if (isAndroidAppDashboard) {
      const result = await requestNativeAuthentication("google-sign-in");
      const idToken = result?.idToken;
      if (!idToken) {
        throw new Error("Google prijava ni vrnila veljavnega identifikacijskega žetona.");
      }

      const credential = firebaseAuthModule.GoogleAuthProvider.credential(
        idToken,
        result.accessToken || undefined,
      );
      await firebaseAuthModule.signInWithCredential(firebaseAuth, credential);
    } else {
      const provider = new firebaseAuthModule.GoogleAuthProvider();
      await firebaseAuthModule.signInWithPopup(firebaseAuth, provider);
    }
    elements.authDialog.close();
  } catch (error) {
    console.error(error);
    setAuthStatus(describeAuthError(error));
  }
}

function requestNativeAuthentication(action) {
  if (!isAndroidAppDashboard || window.parent === window) {
    return Promise.reject(new Error("Nativna prijava ni na voljo. Posodobi ali znova namesti aplikacijo."));
  }

  try {
    const nativeBridge = window.parent.PametniCebelnjakNativeAuth;
    if (typeof nativeBridge?.request === "function") {
      return Promise.resolve().then(() => nativeBridge.request(action));
    }
  } catch (error) {
    console.warn("Neposredni Android auth most ni dosegljiv; uporabljam rezervni postMessage most.", error);
  }

  const requestId = window.crypto?.randomUUID
    ? window.crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

  return new Promise((resolve, reject) => {
    const timeoutId = window.setTimeout(() => {
      cleanup();
      reject(new Error("Nativna prijava se ni odzvala. Poskusi znova."));
    }, NATIVE_AUTH_REQUEST_TIMEOUT_MS);

    function cleanup() {
      window.clearTimeout(timeoutId);
      window.removeEventListener("message", handleResult);
    }

    function handleResult(event) {
      if (event.source !== window.parent) {
        return;
      }

      const response = event.data;
      if (!response || response.type !== NATIVE_AUTH_RESULT_TYPE || response.requestId !== requestId) {
        return;
      }

      cleanup();
      if (response.ok) {
        resolve(response.payload || {});
        return;
      }

      const error = new Error(response.error?.message || "Nativna prijava ni uspela.");
      if (response.error?.code) {
        error.code = response.error.code;
      }
      reject(error);
    }

    window.addEventListener("message", handleResult);
    window.parent.postMessage({
      type: NATIVE_AUTH_REQUEST_TYPE,
      requestId,
      action,
    }, "*");
  });
}

async function signOutCurrentUser() {
  try {
    await firebaseAuthModule.signOut(firebaseAuth);
    if (isAndroidAppDashboard) {
      try {
        await requestNativeAuthentication("sign-out");
      } catch (nativeError) {
        console.warn("Nativne Google seje ni bilo mogoče počistiti.", nativeError);
      }
    }
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
    if (currentCloudUser.email) {
      await set(ref(database, `devices/${deviceId}/owner_email`), currentCloudUser.email);
    }
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
    elements.claimDeviceStatus.textContent = "Registracija ni uspela. Preveri ID, kodo in ali je naprava že povezana v Firebase.";
  }
}

function normalizeEmail(email) {
  return String(email ?? "").trim().toLowerCase();
}

function generateShareInvitationCode() {
  const randomValues = new Uint8Array(8);
  crypto.getRandomValues(randomValues);
  return [...randomValues].map((value) => SHARE_INVITATION_ALPHABET[value % SHARE_INVITATION_ALPHABET.length]).join("");
}

async function copyText(text) {
  if (navigator.clipboard && window.isSecureContext) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const temporaryInput = document.createElement("textarea");
  temporaryInput.value = text;
  temporaryInput.setAttribute("readonly", "");
  temporaryInput.style.position = "fixed";
  temporaryInput.style.opacity = "0";
  document.body.append(temporaryInput);
  temporaryInput.select();
  const copied = document.execCommand("copy");
  temporaryInput.remove();
  if (!copied) throw new Error("Kopiranje ni uspelo");
}

async function createShareInvitation(event) {
  event.preventDefault();
  if (!currentCloudUser || !firebaseDatabase) return;

  const deviceId = elements.cloudDeviceSelect.value;
  const device = cloudDevices[deviceId];
  const recipientEmail = normalizeEmail(elements.shareRecipientEmail.value);
  const ownerEmail = normalizeEmail(currentCloudUser.email);
  if (!deviceId || device?.access_role !== "owner") {
    elements.shareDeviceStatus.textContent = "Izberi svoj panj, ki ga želiš deliti.";
    return;
  }
  if (!recipientEmail || recipientEmail === ownerEmail) {
    elements.shareDeviceStatus.textContent = recipientEmail
      ? "Povabila ne moreš poslati svojemu računu."
      : "Vnesi veljaven e-poštni naslov prejemnika.";
    return;
  }

  elements.createShareInvitation.disabled = true;
  elements.shareDeviceStatus.textContent = "Ustvarjam varno povabilo …";
  elements.shareInvitationResult.hidden = true;
  const { database, ref, set } = firebaseDatabase;
  const createdAt = Date.now();
  const invitation = {
    device_id: deviceId,
    owner_uid: currentCloudUser.uid,
    recipient_email: recipientEmail,
    display_name: device.display_name || deviceId,
    role: "viewer",
    created_at: createdAt,
    expires_at: createdAt + SHARE_INVITATION_VALIDITY_MS,
  };

  try {
    let invitationCode = "";
    for (let attempt = 0; attempt < 5 && !invitationCode; attempt += 1) {
      const candidateCode = generateShareInvitationCode();
      try {
        await set(ref(database, `share_invites/${candidateCode}`), invitation);
        invitationCode = candidateCode;
      } catch (error) {
        if (attempt === 4) throw error;
      }
    }
    activeShareInvitationCode = invitationCode;
    elements.shareInvitationCode.textContent = invitationCode;
    elements.shareInvitationDetail.textContent = `Za ${recipientEmail}; velja do ${formatDashboardDateTime(new Date(invitation.expires_at))}.`;
    elements.shareInvitationResult.hidden = false;
    elements.shareDeviceStatus.textContent = "Povabilo je pripravljeno. Prejemniku pošlji prikazano kodo.";
  } catch (error) {
    console.error(error);
    elements.shareDeviceStatus.textContent = "Povabila ni bilo mogoče ustvariti. Preveri povezavo in Firebase pravila.";
  } finally {
    elements.createShareInvitation.disabled = false;
  }
}

async function copyShareInvitationCode() {
  if (!activeShareInvitationCode) return;
  try {
    await copyText(activeShareInvitationCode);
    elements.shareDeviceStatus.textContent = "Koda povabila je kopirana.";
  } catch (error) {
    console.error(error);
    elements.shareDeviceStatus.textContent = "Kopiranje ni uspelo. Kodo označi in kopiraj ročno.";
  }
}

async function acceptShareInvitation(event) {
  event.preventDefault();
  if (!currentCloudUser || !firebaseDatabase) return;

  const invitationCode = elements.acceptShareCode.value.trim().toUpperCase();
  const recipientEmail = normalizeEmail(currentCloudUser.email);
  if (!isValidShareInvitationCode(invitationCode) || !recipientEmail) {
    elements.acceptShareStatus.textContent = "Preveri osemmestno kodo povabila in e-poštni naslov računa.";
    return;
  }

  const submitButton = elements.acceptShareForm.querySelector("button[type='submit']");
  submitButton.disabled = true;
  elements.acceptShareStatus.textContent = "Preverjam povabilo …";
  const { database, get, ref, update } = firebaseDatabase;
  try {
    const invitationSnapshot = await get(ref(database, `share_invites/${invitationCode}`));
    const invitation = invitationSnapshot.val();
    const deviceId = String(invitation?.device_id ?? "");
    const createdAt = Number(invitation?.created_at);
    const expiresAt = Number(invitation?.expires_at);
    const effectiveExpiration = Math.min(expiresAt, createdAt + SHARE_INVITATION_VALIDITY_MS);
    if (
      !invitation
      || !isValidDeviceId(deviceId)
      || normalizeEmail(invitation.recipient_email) !== recipientEmail
      || !Number.isFinite(createdAt)
      || !Number.isFinite(expiresAt)
      || effectiveExpiration < Date.now()
    ) {
      throw new Error("Povabilo ni veljavno");
    }

    const sharedAt = Date.now();
    const accessRecord = {
      role: "viewer",
      email: recipientEmail,
      owner_uid: invitation.owner_uid,
      shared_at: sharedAt,
      invite_code: invitationCode,
    };
    await update(ref(database), {
      [`device_access/${deviceId}/${currentCloudUser.uid}`]: accessRecord,
      [`users/${currentCloudUser.uid}/shared_devices/${deviceId}`]: {
        ...accessRecord,
        display_name: invitation.display_name || deviceId,
      },
      [`share_invites/${invitationCode}`]: null,
    });
    elements.acceptShareForm.reset();
    elements.acceptShareStatus.textContent = `Deljeni panj »${invitation.display_name || deviceId}« je dodan v izbirnik.`;
  } catch (error) {
    console.error(error);
    elements.acceptShareStatus.textContent = "Povabilo ni veljavno, je poteklo ali je namenjeno drugemu e-poštnemu naslovu.";
  } finally {
    submitButton.disabled = false;
  }
}

function renderSharedViewerList(deviceId, accessRecords) {
  elements.sharedViewerList.replaceChildren();
  const viewers = Object.entries(accessRecords ?? {}).filter(([, access]) => access?.role === "viewer");
  if (!viewers.length) {
    const emptyState = document.createElement("p");
    emptyState.className = "muted";
    emptyState.textContent = "Panj še ni deljen z nobenim uporabnikom.";
    elements.sharedViewerList.append(emptyState);
    return;
  }

  viewers.sort(([, left], [, right]) => String(left.email).localeCompare(String(right.email))).forEach(([viewerUid, access]) => {
    const row = document.createElement("div");
    row.className = "shared-viewer-row";
    const identity = document.createElement("div");
    const email = document.createElement("strong");
    email.textContent = access.email || "Uporabnik brez e-poštnega naslova";
    const role = document.createElement("small");
    role.textContent = "Samo ogled";
    identity.append(email, role);
    const revokeButton = document.createElement("button");
    revokeButton.type = "button";
    revokeButton.className = "secondary-button danger-button";
    revokeButton.textContent = "Prekliči dostop";
    revokeButton.addEventListener("click", () => revokeSharedViewer(deviceId, viewerUid, access.email, revokeButton));
    row.append(identity, revokeButton);
    elements.sharedViewerList.append(row);
  });
}

async function revokeSharedViewer(deviceId, viewerUid, viewerEmail, button) {
  if (!currentCloudUser || !firebaseDatabase || getCloudDeviceAccessRole(deviceId) !== "owner") return;
  if (!await confirmDashboardAction({
    title: "Prekliči deljeni dostop",
    message: `Prekličem dostop samo za ogled uporabniku ${viewerEmail || viewerUid}?`,
    confirmLabel: "Prekliči dostop",
    danger: true,
  })) return;

  button.disabled = true;
  elements.shareDeviceStatus.textContent = "Preklicujem deljeni dostop …";
  try {
    const { database, ref, update } = firebaseDatabase;
    await update(ref(database), {
      [`device_access/${deviceId}/${viewerUid}`]: null,
      [`users/${viewerUid}/shared_devices/${deviceId}`]: null,
      [`users/${viewerUid}/weather_preferences/${deviceId}`]: null,
    });
    elements.shareDeviceStatus.textContent = "Dostop uporabnika je preklican.";
  } catch (error) {
    console.error(error);
    button.disabled = false;
    elements.shareDeviceStatus.textContent = "Dostopa ni bilo mogoče preklicati.";
  }
}

async function appendSharedViewerRemovalUpdates(deviceId, updates) {
  const { database, get, ref } = firebaseDatabase;
  const accessSnapshot = await get(ref(database, `device_access/${deviceId}`));
  Object.keys(accessSnapshot.val() ?? {}).forEach((viewerUid) => {
    updates[`device_access/${deviceId}/${viewerUid}`] = null;
    updates[`users/${viewerUid}/shared_devices/${deviceId}`] = null;
    updates[`users/${viewerUid}/weather_preferences/${deviceId}`] = null;
  });
}

async function appendDeviceShareInvitationRemovalUpdates(deviceId, updates) {
  const { database, get, ref } = firebaseDatabase;
  const invitationsSnapshot = await get(ref(database, "share_invites"));
  Object.entries(invitationsSnapshot.val() ?? {}).forEach(([invitationCode, invitation]) => {
    if (invitation?.device_id === deviceId) {
      updates[`share_invites/${invitationCode}`] = null;
    }
  });
}

async function unclaimDevice() {
  if (!currentCloudUser || !firebaseDatabase) return;

  const deviceId = elements.cloudDeviceSelect.value;
  if (!deviceId || !cloudDevices[deviceId]) return;

  if (getCloudDeviceAccessRole(deviceId) === "viewer") {
    await removeSharedDeviceAccess(deviceId);
    return;
  }

  const displayName = cloudDevices[deviceId].display_name || deviceId;
  const isConfirmed = await confirmDashboardAction({
    title: "Odregistriraj panj",
    message: `Ali želiš panj »${displayName}« odregistrirati? Meritve in zgodovina ostanejo v bazi, vsi deljeni dostopi pa bodo preklicani. Za ponoven dostop bo panj treba registrirati z aktivacijsko kodo.`,
    confirmLabel: "Odregistriraj",
    danger: true,
  });
  if (!isConfirmed) return;

  const { database, ref, update } = firebaseDatabase;
  elements.unclaimDevice.disabled = true;
  elements.unclaimDeviceStatus.textContent = "Odregistriram panj …";

  try {
    const updates = {
      [`users/${currentCloudUser.uid}/devices/${deviceId}`]: null,
      [`devices/${deviceId}/owner_email`]: null,
      [`devices/${deviceId}/owner_uid`]: null,
    };
    await appendSharedViewerRemovalUpdates(deviceId, updates);
    await update(ref(database), updates);

    localStorage.removeItem(CLOUD_DEVICE_STORAGE_KEY);
    elements.unclaimDeviceStatus.textContent = "Panj je odregistriran in vsi deljeni dostopi so preklicani. Merilni podatki ostanejo shranjeni.";
  } catch (error) {
    console.error(error);
    elements.unclaimDeviceStatus.textContent = "Odregistracija ni uspela. Panj ostaja povezan s tvojim računom.";
    elements.unclaimDevice.disabled = false;
  }
}

async function removeSharedDeviceAccess(deviceId) {
  if (!currentCloudUser || !firebaseDatabase || getCloudDeviceAccessRole(deviceId) !== "viewer") return;

  const displayName = cloudDevices[deviceId]?.display_name || deviceId;
  const isConfirmed = await confirmDashboardAction({
    title: "Odstrani deljeni panj",
    message: `Ali želiš deljeni panj »${displayName}« odstraniti iz svojega računa? Lastnik panja, meritve in zgodovina ostanejo nespremenjeni. Za ponoven dostop boš potreboval novo povabilo lastnika.`,
    confirmLabel: "Odstrani",
    danger: true,
  });
  if (!isConfirmed) return;

  const { database, ref, update } = firebaseDatabase;
  elements.unclaimDevice.disabled = true;
  elements.unclaimDeviceStatus.textContent = "Odstranjujem deljeni panj …";

  try {
    await update(ref(database), {
      [`device_access/${deviceId}/${currentCloudUser.uid}`]: null,
      [`users/${currentCloudUser.uid}/shared_devices/${deviceId}`]: null,
      [`users/${currentCloudUser.uid}/weather_preferences/${deviceId}`]: null,
    });

    if (localStorage.getItem(CLOUD_DEVICE_STORAGE_KEY) === deviceId) {
      localStorage.removeItem(CLOUD_DEVICE_STORAGE_KEY);
    }
    elements.unclaimDeviceStatus.textContent = "Deljeni panj je odstranjen iz tvojega računa.";
  } catch (error) {
    console.error(error);
    elements.unclaimDeviceStatus.textContent = "Deljenega panja ni bilo mogoče odstraniti. Dostop ostaja aktiven.";
    elements.unclaimDevice.disabled = false;
  }
}

function confirmAdministratorUnclaim(deviceId, ownerEmail) {
  const ownerDescription = ownerEmail ? `uporabnika ${ownerEmail}` : "trenutnega uporabnika";
  return confirmDashboardAction({
    title: "Odjavi lastnika",
    message: `Ali želiš panj ${deviceId} odjaviti od ${ownerDescription}? Meritve, SD sinhronizacija in aktivacijska koda ostanejo shranjeni, vsi deljeni dostopi pa bodo preklicani. Panj bo nato mogoče registrirati na drug račun.`,
    confirmLabel: "Odjavi lastnika",
    requiredText: "ODJAVI",
    danger: true,
  });
}

function confirmAdministratorDeviceDeletion(deviceId) {
  return confirmDashboardAction({
    title: "Trajno izbriši napravo",
    message: `Ali želiš napravo ${deviceId} trajno izbrisati iz Firebase? Izbrisani bodo lastništvo, meritve, agregati, stanje naprave, ukazi, aktivacijska koda, zahtevki in deljeni dostopi. Tega ni mogoče razveljaviti. Če je naprava še povezana, lahko z istim firmwareom začne znova pošiljati nove podatke.`,
    confirmLabel: "Trajno izbriši",
    requiredText: "IZBRIŠI",
    danger: true,
  });
}

async function unclaimDeviceAsAdministrator(deviceId, button, statusElement) {
  if (!isCloudAdministrator() || !firebaseDatabase) return;

  const device = cloudDevices[deviceId];
  const ownerUid = String(device?.owner_uid || "");
  if (!ownerUid) {
    statusElement.textContent = "Panj nima registriranega lastnika.";
    return;
  }
  if (!await confirmAdministratorUnclaim(deviceId, device.owner_email)) return;

  button.disabled = true;
  statusElement.textContent = "Odjavljam lastnika …";
  try {
    const { database, ref, update } = firebaseDatabase;
    // Več lokacij posodobimo z enim atomarnim zapisom, da panj ne ostane delno odjavljen.
    const updates = {
      [`devices/${deviceId}/owner_uid`]: null,
      [`devices/${deviceId}/owner_email`]: null,
      [`users/${ownerUid}/devices/${deviceId}`]: null,
    };
    await appendSharedViewerRemovalUpdates(deviceId, updates);
    await update(ref(database), updates);
    statusElement.textContent = "Lastnik in vsi deljeni dostopi so odjavljeni. Merilni podatki ostanejo shranjeni.";
  } catch (error) {
    console.error(error);
    statusElement.textContent = "Odjava lastnika ni uspela. Panj ostaja povezan z računom.";
    button.disabled = false;
  }
}

async function deleteDeviceAsAdministrator(deviceId, actionButtons, statusElement) {
  if (!isCloudAdministrator() || !firebaseDatabase) return;
  if (!await confirmAdministratorDeviceDeletion(deviceId)) return;

  const device = cloudDevices[deviceId] ?? {};
  actionButtons.querySelectorAll("button").forEach((button) => {
    button.disabled = true;
  });
  statusElement.textContent = "Brišem napravo in njene Firebase zapise …";

  try {
    const { database, ref, update } = firebaseDatabase;
    const updates = {
      [`devices/${deviceId}`]: null,
      [`device_secrets/${deviceId}`]: null,
      [`device_claims/${deviceId}`]: null,
    };
    const ownerUid = String(device.owner_uid ?? "");
    if (ownerUid) {
      updates[`users/${ownerUid}/devices/${deviceId}`] = null;
    }
    await appendSharedViewerRemovalUpdates(deviceId, updates);
    await appendDeviceShareInvitationRemovalUpdates(deviceId, updates);
    await update(ref(database), updates);

    ownerEmailSyncedDeviceIds.delete(deviceId);
    if (localStorage.getItem(CLOUD_DEVICE_STORAGE_KEY) === deviceId) {
      localStorage.removeItem(CLOUD_DEVICE_STORAGE_KEY);
    }
    statusElement.textContent = "Naprava in vsi njeni Firebase zapisi so izbrisani.";
  } catch (error) {
    console.error(error);
    statusElement.textContent = "Izbris naprave ni uspel. Firebase zapisi ostanejo nespremenjeni.";
    actionButtons.querySelectorAll("button").forEach((button) => {
      button.disabled = false;
    });
  }
}

function handleCloudAuthState(user) {
  clearCloudDeviceListeners();
  stopCloudDeviceListListener?.();
  stopCloudSharedDeviceListListener?.();
  stopCloudDeviceListListener = undefined;
  stopCloudSharedDeviceListListener = undefined;
  cloudDevices = {};
  ownedCloudDevices = {};
  sharedCloudDevices = {};
  ownedCloudDevicesLoaded = false;
  sharedCloudDevicesLoaded = false;
  ownerEmailSyncedDeviceIds.clear();
  currentCloudUser = user;

  if (!user) {
    document.body.dataset.authState = "signed-out";
    cloudDevicePath = "";
    elements.accountSection.hidden = true;
    elements.accountAvatarImage.removeAttribute("src");
    elements.authTrigger.hidden = false;
    renderHeaderAuthIdentity(undefined);
    resetCloudDashboard();
    setConnectionState("Prijava je potrebna", "error");
    window.requestAnimationFrame(openAuthDialog);
    return;
  }

  document.body.dataset.authState = "signed-in";
  elements.accountSection.hidden = false;
  elements.authTrigger.hidden = false;
  renderHeaderAuthIdentity(user);
  renderAccountIdentity(user);
  configureCloudAccountView();
  showView(DEFAULT_VIEW);
  renderHeaderDeviceState();
  const { database, onValue, ref } = firebaseDatabase;
  if (isCloudAdministrator()) {
    stopCloudDeviceListListener = onValue(ref(database, "devices"), (snapshot) => {
      cloudDevices = snapshot.val() ?? {};
      renderCloudDeviceSelector();
    }, showDataError);
    return;
  }

  stopCloudDeviceListListener = onValue(ref(database, `users/${user.uid}/devices`), (snapshot) => {
    ownedCloudDevices = snapshot.val() ?? {};
    ownedCloudDevicesLoaded = true;
    rebuildCloudDevices();
  }, showDataError);
  stopCloudSharedDeviceListListener = onValue(ref(database, `users/${user.uid}/shared_devices`), (snapshot) => {
    sharedCloudDevices = snapshot.val() ?? {};
    sharedCloudDevicesLoaded = true;
    rebuildCloudDevices();
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
  elements.shareDeviceForm.addEventListener("submit", createShareInvitation);
  elements.copyShareInvitation.addEventListener("click", copyShareInvitationCode);
  elements.acceptShareForm.addEventListener("submit", acceptShareInvitation);
  elements.unclaimDevice.addEventListener("click", unclaimDevice);
  elements.deleteDeviceHistory.addEventListener("click", deleteDeviceHistory);
  elements.clearCloudWifiCredentials.addEventListener("click", clearCloudWifiCredentials);
}

async function useLocalDataSource() {
  const response = await fetch("/api/status", { cache: "no-store" });
  if (!response.ok) throw new Error("Lokalni API ni dosegljiv");
  const initialStatus = await response.json();
  isLocalDashboard = true;
  applyBrandAssets(true);
  document.body.dataset.dashboardMode = "local";
  delete document.body.dataset.authState;
  elements.updatesHeading.textContent = "Ročna posodobitev naprave";
  elements.updatesSubtitle.textContent = "Brez interneta namesti programsko opremo ali lokalni spletni vmesnik.";
  elements.otaSection.hidden = true;
  elements.localManualUpdateSection.hidden = false;
  elements.localElegantOtaLink.href = "/update";
  elements.updatesNavigationItem.hidden = false;
  document.querySelectorAll(".cloud-only-link").forEach((element) => { element.hidden = true; });
  document.querySelectorAll(".local-only-link").forEach((element) => { element.hidden = false; });
  document.querySelectorAll("[data-local-only]").forEach((element) => { element.hidden = false; });
  elements.cloudSyncControls.hidden = false;
  setCloudDeviceManagementVisibility(false);
  elements.authTrigger.hidden = true;
  elements.accountSection.hidden = true;

  function renderLocalStatus(status) {
    renderLatestMeasurement(status.latest);
    renderDeviceStatus(status.device, true);
    renderProvisioning(status.network);
    renderTimeStatus(status.time, status.network);
    renderCloudSynchronization(status.sync, status.network, status.sd_card);
    renderLocalMeasurementLogStatus(status.local_history, status.sd_card, status.sync);
    renderSDStatus(status.sd_card);
    renderFirmwareVersion(status.firmware);
    renderLoadCellTareStatus(status.sensors?.load_cell);
    renderBme680CalibrationStatus(status.sensors?.bme680);
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
      elements.historySummary.textContent = "Lokalne zgodovine ni bilo mogoče prebrati; povezava z napravo ostaja aktivna.";
    }
  };

  renderLocalStatus(initialStatus);
  setInterval(() => refreshStatus().catch(showDataError), 5_000);
}

async function useFirebaseDataSource() {
  isLocalDashboard = false;
  applyBrandAssets(false);
  document.body.dataset.dashboardMode = "cloud";
  document.body.dataset.authState = "loading";
  elements.updatesHeading.textContent = "Posodobitev naprave";
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
  const { endAt, get, getDatabase, onValue, orderByKey, query, ref, remove, set, startAt, update } = databaseModule;
  const firebaseApp = initializeApp(configModule.firebaseConfig);
  const database = getDatabase(firebaseApp);
  firebaseAuth = authModule.getAuth(firebaseApp);
  firebaseAuthModule = authModule;
  firebaseDatabase = { database, get, onValue, ref, remove, set, update };
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
  initializeConfirmationDialog();
  initializeWeatherSettings();
  initializeOtaControls();
  initializeProvisioningForm();
  setInterval(() => {
    if (!latestDeviceStatus) return;
    if (isSharedCloudDeviceSelected()) renderHeaderDeviceState();
    else renderDeviceStatus(latestDeviceStatus);
  }, 15_000);
  setInterval(() => {
    void refreshWeatherForecast();
  }, WEATHER_REFRESH_INTERVAL_MS);

  if (isAndroidAppDashboard) {
    await useFirebaseDataSource();
  } else {
    try {
      await useLocalDataSource();
    } catch {
      await useFirebaseDataSource();
    }
  }
  dashboardDataSourceReady = true;
  refreshVisibleHistory();
}

window.addEventListener("DOMContentLoaded", startDashboard);
