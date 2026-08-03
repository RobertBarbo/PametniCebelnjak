#define ENABLE_DATABASE

#include <Arduino.h>
#include <esp_timer.h>
#include <FirebaseClient.h>
#include <HTTPClient.h>
#include <LittleFS.h>
#include <Preferences.h>
#include <SD.h>
#include <SPI.h>
#include <Update.h>
#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <WebServer.h>
#include <esp_system.h>
#include <mbedtls/sha256.h>
#include <time.h>

#include "project_config.h"
#include "version.h"

namespace {

// Časovni intervali posameznih opravil v glavni zanki.
constexpr uint32_t MEASUREMENT_INTERVAL_MS = 5 * 60 * 1000;
constexpr uint32_t SD_STATUS_INTERVAL_MS = 60000;
constexpr uint32_t DEVICE_STATUS_INTERVAL_MS = 60000;
constexpr uint32_t FIRMWARE_COMMAND_INTERVAL_MS = 30000;
constexpr uint32_t ACTIVATION_SECRET_REFRESH_INTERVAL_MS = MEASUREMENT_INTERVAL_MS;
constexpr uint32_t CLOUD_SYNC_INTERVAL_MS = 1500;
constexpr uint32_t CLOUD_SYNC_MAX_RETRY_INTERVAL_MS = 60000;
constexpr uint32_t CLOUD_AGGREGATE_REFRESH_INTERVAL_MS = 30 * 60 * 1000;
constexpr uint32_t WIFI_CONNECT_TIMEOUT_MS = 20000;
constexpr uint32_t ACCESS_POINT_SHUTDOWN_DELAY_MS = 10000;
constexpr uint32_t WIFI_SETTINGS_CLEAR_DELAY_MS = 500;
constexpr uint8_t MAX_SD_INITIALIZATION_FAILURES = 5;
constexpr uint8_t CLOUD_SYNC_STATE_SAVE_INTERVAL = 12;

// Firebase poti se ob zagonu sestavijo iz trajnega device_id naprave.
constexpr char DEVICE_DATABASE_ROOT[] = "/devices";
constexpr size_t DATABASE_PATH_LENGTH = 96;
constexpr char SD_LOG_PATH[] = "/measurements.csv";
constexpr char SD_HISTORY_INDEX_PATH[] = "/measurements.idx";
constexpr char SD_HISTORY_INDEX_TEMP_PATH[] = "/measurements.tmp";
constexpr uint32_t HOURLY_AGGREGATE_SECONDS = 60 * 60;
constexpr uint32_t DAILY_AGGREGATE_SECONDS = 24 * 60 * 60;

// GitHub Release vedno vsebuje manifest.json in firmware.bin za najnovejšo izdajo.
constexpr char OTA_MANIFEST_URL[] = "https://github.com/RobertBarbo/PametniCebelnjak/releases/latest/download/manifest.json";
constexpr size_t OTA_DOWNLOAD_BUFFER_SIZE = 2048;
constexpr size_t OTA_COMMAND_PAYLOAD_LENGTH = 256;
constexpr uint32_t OTA_MANIFEST_TIMEOUT_MS = 15000;
constexpr uint32_t OTA_FIRMWARE_TIMEOUT_MS = 20000;
constexpr uint32_t OTA_STREAM_IDLE_TIMEOUT_MS = 15000;

constexpr int SD_CS_PIN = 10;
constexpr int SD_MOSI_PIN = 11;
constexpr int SD_SCK_PIN = 12;
constexpr int SD_MISO_PIN = 13;

constexpr char TIMEZONE[] = "CET-1CEST,M3.5.0/2,M10.5.0/3";
constexpr char NTP_SERVER_1[] = "pool.ntp.org";
constexpr char NTP_SERVER_2[] = "time.google.com";
constexpr size_t MAX_LOCAL_HISTORY_BUCKETS = 366;
constexpr time_t MAX_LOCAL_HISTORY_DURATION_SECONDS = 366 * 24 * 60 * 60;
constexpr time_t MIN_VALID_UNIX_TIMESTAMP = 1700000000;
constexpr char DEVICE_SETTINGS_NAMESPACE[] = "device";
constexpr char WIFI_SETTINGS_NAMESPACE[] = "wifi";
constexpr char DEVICE_ID_KEY[] = "device_id";
constexpr char ACTIVATION_CODE_KEY[] = "activation";
constexpr char CLOUD_SYNC_OFFSET_KEY[] = "cloud_offset";
constexpr char CLOUD_SYNC_TIMESTAMP_KEY[] = "cloud_time";
constexpr char CLOUD_AGGREGATE_SCHEMA_KEY[] = "agg_schema";
constexpr uint8_t CLOUD_AGGREGATE_SCHEMA_VERSION = 1;
constexpr char WIFI_SSID_KEY[] = "ssid";
constexpr char WIFI_PASSWORD_KEY[] = "password";
constexpr char ACTIVATION_ALPHABET[] = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
constexpr size_t DEVICE_ID_LENGTH = 16;
constexpr size_t ACTIVATION_CODE_LENGTH = 8;
constexpr size_t ACCESS_POINT_SSID_LENGTH = 24;

struct Measurement {
  float temperatureC;
  float humidityPercent;
  float weightKg;
  time_t timestamp;
  char date[11];
  char time[9];
};

struct Uptime {
  uint64_t totalMinutes;
  uint64_t days;
  uint64_t hours;
  uint64_t minutes;
};

struct HistoryBucket {
  time_t timestamp;
  float temperatureSum;
  float humiditySum;
  float weightSum;
  uint16_t count;
};

struct MeasurementAggregate {
  time_t timestamp;
  float temperatureSum;
  float humiditySum;
  float weightSum;
  uint16_t count;
};

struct FirmwareManifest {
  char version[24];
  String firmwareUrl;
  char sha256[65];
  size_t size;
};

enum class WiFiProvisioningState : uint8_t {
  Idle,
  Connecting,
  Connected,
  Failed,
};

enum class CloudSyncRequestType : uint8_t {
  None,
  Measurement,
  HourlyAggregate,
  DailyAggregate,
};

// Firebase uporablja asinhrone zahteve, da beleženje ne ustavi glavne zanke.
WiFiClientSecure sslClient;
WiFiClientSecure otaClient;
using AsyncClient = AsyncClientClass;
AsyncClient asyncClient(sslClient);
SPIClass sdSpi(FSPI);
WebServer localServer(80);
Preferences preferences;

NoAuth noAuth;
FirebaseApp app;
RealtimeDatabase database;

uint32_t lastMeasurementMillis = 0;
uint32_t lastSDStatusMillis = 0;
uint32_t lastDeviceStatusMillis = 0;
uint32_t lastFirmwareCommandCheckMillis = 0;
uint32_t lastActivationSecretAttemptMillis = 0;
uint32_t lastCloudSyncAttemptMillis = 0;
uint32_t cloudSyncRetryIntervalMs = CLOUD_SYNC_INTERVAL_MS;
uint32_t lastCloudAggregateRefreshMillis = 0;
uint32_t accessPointShutdownMillis = 0;
uint32_t scheduledWiFiSettingsClearMillis = 0;
uint32_t wifiConnectionStartedMillis = 0;
uint32_t cloudSyncFileOffset = 0;
uint32_t cloudSyncPendingFileOffset = 0;
uint8_t cloudSyncWritesSincePersist = 0;
bool sdCardReady = false;
uint8_t sdInitializationFailures = 0;
bool sdErrorReported = false;
bool firmwareVersionReported = false;
bool firmwareCommandPending = false;
bool firmwareCommandQueued = false;
bool firmwareUpdateInProgress = false;
bool queuedFirmwareCommandInvalid = false;
bool activationSecretPublishPending = false;
bool activationSecretRegistrationReported = false;
bool validTimeWasAvailable = false;
bool cloudSyncPending = false;
bool cloudSyncCaughtUp = false;
bool cloudSyncStateSavePending = false;
bool hourlyAggregateReady = false;
bool dailyAggregateReady = false;
bool historyIndexReady = false;
bool stationConnected = false;
bool accessPointActive = false;
bool savedWiFiCredentialsAvailable = false;
bool stationGotIpAddress = false;
WiFiProvisioningState wifiProvisioningState = WiFiProvisioningState::Idle;
String pendingWiFiSsid;
String pendingWiFiPassword;
time_t lastCloudSyncedTimestamp = 0;
Measurement latestMeasurement{};
Measurement cloudSyncPendingMeasurement{};
MeasurementAggregate hourlyCloudAggregate{};
MeasurementAggregate dailyCloudAggregate{};
MeasurementAggregate readyHourlyCloudAggregate{};
MeasurementAggregate readyDailyCloudAggregate{};
MeasurementAggregate cloudSyncPendingAggregate{};
bool hasLatestMeasurement = false;
HistoryBucket localHistoryBuckets[MAX_LOCAL_HISTORY_BUCKETS]{};
char deviceId[DEVICE_ID_LENGTH]{};
char activationCode[ACTIVATION_CODE_LENGTH + 1]{};
char accessPointSsid[ACCESS_POINT_SSID_LENGTH]{};
char deviceDatabasePath[DATABASE_PATH_LENGTH]{};
char latestDatabasePath[DATABASE_PATH_LENGTH]{};
char historyDatabasePath[DATABASE_PATH_LENGTH]{};
char hourlyAggregateDatabasePath[DATABASE_PATH_LENGTH]{};
char dailyAggregateDatabasePath[DATABASE_PATH_LENGTH]{};
char sdStatusDatabasePath[DATABASE_PATH_LENGTH]{};
char deviceStatusDatabasePath[DATABASE_PATH_LENGTH]{};
char firmwareStatusDatabasePath[DATABASE_PATH_LENGTH]{};
char otaStatusDatabasePath[DATABASE_PATH_LENGTH]{};
char otaCommandDatabasePath[DATABASE_PATH_LENGTH]{};
char activationSecretDatabasePath[DATABASE_PATH_LENGTH]{};
char queuedFirmwareCommandPayload[OTA_COMMAND_PAYLOAD_LENGTH]{};
uint8_t otaDownloadBuffer[OTA_DOWNLOAD_BUFFER_SIZE]{};
time_t lastIndexedDayTimestamp = 0;
time_t lastPublishedHourlyBucket = 0;
time_t lastPublishedDailyBucket = 0;
uint16_t lastPublishedHourlyCount = 0;
uint16_t lastPublishedDailyCount = 0;
CloudSyncRequestType cloudSyncRequestType = CloudSyncRequestType::None;

void processFirmwareUpdateCommand(const String &payload);
void queueFirmwareUpdateCommand(const String &payload);
void processQueuedFirmwareUpdateCommand();
bool persistCloudSyncState();
bool parseMeasurementCsvLine(const char *line, Measurement &measurement);
void resetCloudAggregateState();
void rebuildCloudAggregateState();

bool isCloudSyncRequest(const String &requestId)
{
  return requestId == "syncMeasurementHistory" || requestId == "syncHourlyAggregate" ||
         requestId == "syncDailyAggregate";
}

void markCloudSyncFailure()
{
  cloudSyncPending = false;
  cloudSyncRequestType = CloudSyncRequestType::None;
  cloudSyncRetryIntervalMs = min(cloudSyncRetryIntervalMs * 2, CLOUD_SYNC_MAX_RETRY_INTERVAL_MS);
  Serial.print("Cloud sync retry delayed to ");
  Serial.print(cloudSyncRetryIntervalMs / 1000);
  Serial.println(" seconds.");
}

void addMeasurementToCloudAggregate(MeasurementAggregate &aggregate, MeasurementAggregate &readyAggregate,
                                    bool &ready, const Measurement &measurement, uint32_t periodSeconds,
                                    bool queueCompletedAggregate)
{
  const time_t bucketTimestamp = measurement.timestamp - (measurement.timestamp % periodSeconds);
  if (aggregate.count > 0 && aggregate.timestamp != bucketTimestamp) {
    if (queueCompletedAggregate) {
      readyAggregate = aggregate;
      ready = true;
    }
    aggregate = {};
  }

  if (aggregate.count == 0) {
    aggregate.timestamp = bucketTimestamp;
  }
  aggregate.temperatureSum += measurement.temperatureC;
  aggregate.humiditySum += measurement.humidityPercent;
  aggregate.weightSum += measurement.weightKg;
  ++aggregate.count;
}

void recordSynchronizedMeasurement()
{
  cloudSyncFileOffset = cloudSyncPendingFileOffset;
  lastCloudSyncedTimestamp = cloudSyncPendingMeasurement.timestamp;
  addMeasurementToCloudAggregate(hourlyCloudAggregate, readyHourlyCloudAggregate, hourlyAggregateReady,
                                 cloudSyncPendingMeasurement, HOURLY_AGGREGATE_SECONDS, true);
  addMeasurementToCloudAggregate(dailyCloudAggregate, readyDailyCloudAggregate, dailyAggregateReady,
                                 cloudSyncPendingMeasurement, DAILY_AGGREGATE_SECONDS, true);

  if (++cloudSyncWritesSincePersist >= CLOUD_SYNC_STATE_SAVE_INTERVAL) {
    if (hourlyAggregateReady || dailyAggregateReady) {
      cloudSyncStateSavePending = true;
    } else {
      persistCloudSyncState();
    }
  }
}

void completeCloudAggregateRequest(CloudSyncRequestType requestType)
{
  if (requestType == CloudSyncRequestType::HourlyAggregate) {
    hourlyAggregateReady = false;
    lastPublishedHourlyBucket = cloudSyncPendingAggregate.timestamp;
    lastPublishedHourlyCount = cloudSyncPendingAggregate.count;
  } else if (requestType == CloudSyncRequestType::DailyAggregate) {
    dailyAggregateReady = false;
    lastPublishedDailyBucket = cloudSyncPendingAggregate.timestamp;
    lastPublishedDailyCount = cloudSyncPendingAggregate.count;
  }

  if (cloudSyncStateSavePending && !hourlyAggregateReady && !dailyAggregateReady) {
    cloudSyncStateSavePending = !persistCloudSyncState();
  }
}

// Obdelava zaključkov vseh asinhronih Firebase zahtev.
void processData(AsyncResult &result)
{
  if (!result.isResult()) {
    return;
  }

  if (result.isError()) {
    // Formatirani izpis v Firebase povratnem klicu lahko preseže stack loopTask.
    Serial.print("Firebase error (");
    Serial.print(result.uid());
    Serial.print("): ");
    Serial.print(result.error().message());
    Serial.print(" (");
    Serial.print(result.error().code());
    Serial.println(")");

    // Neuspešen asinhroni zapis verzije znova poskusimo v naslednji glavni zanki.
    if (result.uid() == "updateFirmwareVersion") {
      firmwareVersionReported = false;
    }
    if (result.uid() == "readFirmwareUpdateCommand") {
      firmwareCommandPending = false;
    }
    if (result.uid() == "publishActivationSecret") {
      activationSecretPublishPending = false;
    }
    if (isCloudSyncRequest(result.uid())) {
      markCloudSyncFailure();
    }
    return;
  }

  if (result.available()) {
    if (result.uid() == "readFirmwareUpdateCommand") {
      firmwareCommandPending = false;
      queueFirmwareUpdateCommand(result.payload());
      return;
    }
    if (result.uid() == "publishActivationSecret") {
      activationSecretPublishPending = false;
      const String responsePayload = result.payload();
      if (responsePayload.indexOf("error") >= 0 || responsePayload.indexOf("unauthorized") >= 0) {
        return;
      }
      if (!activationSecretRegistrationReported) {
        activationSecretRegistrationReported = true;
        Serial.println("Device activation secret was registered.");
      }
      return;
    }
    if (isCloudSyncRequest(result.uid())) {
      const String responsePayload = result.payload();
      if (responsePayload.indexOf("error") >= 0 || responsePayload.indexOf("unauthorized") >= 0) {
        markCloudSyncFailure();
        return;
      }

      const CloudSyncRequestType completedRequestType = cloudSyncRequestType;
      cloudSyncPending = false;
      cloudSyncRequestType = CloudSyncRequestType::None;
      cloudSyncRetryIntervalMs = CLOUD_SYNC_INTERVAL_MS;
      if (completedRequestType == CloudSyncRequestType::Measurement) {
        recordSynchronizedMeasurement();
      } else {
        completeCloudAggregateRequest(completedRequestType);
      }
      return;
    }
    Serial.print("Firebase write complete: ");
    Serial.println(result.uid());
  }
}

// --- Simulirani vir meritev -------------------------------------------------

float simulatedTemperatureC()
{
  return random(300, 361) / 10.0F;
}

float simulatedHumidityPercent()
{
  return random(450, 751) / 10.0F;
}

float simulatedWeightKg()
{
  return random(3500, 4501) / 100.0F;
}

// --- Omrežje in čas ---------------------------------------------------------

void initializeWiFiEventHandlers()
{
  WiFi.onEvent([](WiFiEvent_t event, WiFiEventInfo_t) {
    switch (event) {
      case ARDUINO_EVENT_WIFI_STA_GOT_IP:
        stationGotIpAddress = true;
        Serial.printf("Wi-Fi station received IP address: %s\n", WiFi.localIP().toString().c_str());
        break;
      case ARDUINO_EVENT_WIFI_STA_DISCONNECTED:
        stationGotIpAddress = false;
        Serial.println("Wi-Fi station disconnected.");
        break;
      case ARDUINO_EVENT_WIFI_AP_STACONNECTED:
        Serial.println("Phone or computer connected to the provisioning AP.");
        break;
      case ARDUINO_EVENT_WIFI_AP_STADISCONNECTED:
        Serial.println("Client disconnected from the provisioning AP.");
        break;
      default:
        break;
    }
  });
}

void createDeviceIdentity()
{
  const uint64_t chipMac = ESP.getEfuseMac() & 0xFFFFFFFFFFFFULL;
  snprintf(deviceId, sizeof(deviceId), "CB-%012llX", static_cast<unsigned long long>(chipMac));

  bool aggregateMigrationRequired = false;
  preferences.begin(DEVICE_SETTINGS_NAMESPACE, false);
  const String storedActivationCode = preferences.getString(ACTIVATION_CODE_KEY, "");
  if (storedActivationCode.length() == ACTIVATION_CODE_LENGTH) {
    storedActivationCode.toCharArray(activationCode, sizeof(activationCode));
  } else {
    for (size_t index = 0; index < ACTIVATION_CODE_LENGTH; ++index) {
      activationCode[index] = ACTIVATION_ALPHABET[esp_random() % (sizeof(ACTIVATION_ALPHABET) - 1)];
    }
    activationCode[ACTIVATION_CODE_LENGTH] = '\0';
    preferences.putString(ACTIVATION_CODE_KEY, activationCode);
  }
  preferences.putString(DEVICE_ID_KEY, deviceId);
  cloudSyncFileOffset = preferences.isKey(CLOUD_SYNC_OFFSET_KEY)
                          ? preferences.getULong(CLOUD_SYNC_OFFSET_KEY, 0)
                          : 0;
  lastCloudSyncedTimestamp = preferences.isKey(CLOUD_SYNC_TIMESTAMP_KEY)
                               ? static_cast<time_t>(preferences.getULong(CLOUD_SYNC_TIMESTAMP_KEY, 0))
                               : 0;
  const uint8_t aggregateSchemaVersion = preferences.isKey(CLOUD_AGGREGATE_SCHEMA_KEY)
                                             ? preferences.getUChar(CLOUD_AGGREGATE_SCHEMA_KEY, 0)
                                             : 0;
  if (aggregateSchemaVersion < CLOUD_AGGREGATE_SCHEMA_VERSION) {
    // Enkratni ponovni prehod izdela agregate tudi iz zgodovine, ki je bila sinhronizirana s starejšim firmware-om.
    cloudSyncFileOffset = 0;
    lastCloudSyncedTimestamp = 0;
    preferences.putULong(CLOUD_SYNC_OFFSET_KEY, 0);
    preferences.putULong(CLOUD_SYNC_TIMESTAMP_KEY, 0);
    preferences.putUChar(CLOUD_AGGREGATE_SCHEMA_KEY, CLOUD_AGGREGATE_SCHEMA_VERSION);
    aggregateMigrationRequired = true;
  }
  preferences.end();

  if (aggregateMigrationRequired) {
    Serial.println("Cloud history will be replayed once to create aggregate data.");
  }

  snprintf(accessPointSsid, sizeof(accessPointSsid), "Cebelnjak-%s", deviceId + 9);
}

void printDeviceRegistrationData()
{
  Serial.printf("Device ID: %s\n", deviceId);
  Serial.printf("Activation code: %s\n", activationCode);
}

void initializeDeviceDatabasePaths()
{
  snprintf(deviceDatabasePath, sizeof(deviceDatabasePath), "%s/%s", DEVICE_DATABASE_ROOT, deviceId);
  snprintf(latestDatabasePath, sizeof(latestDatabasePath), "%s/latest", deviceDatabasePath);
  snprintf(historyDatabasePath, sizeof(historyDatabasePath), "%s/measurements", deviceDatabasePath);
  snprintf(hourlyAggregateDatabasePath, sizeof(hourlyAggregateDatabasePath), "%s/aggregates/hourly", deviceDatabasePath);
  snprintf(dailyAggregateDatabasePath, sizeof(dailyAggregateDatabasePath), "%s/aggregates/daily", deviceDatabasePath);
  snprintf(sdStatusDatabasePath, sizeof(sdStatusDatabasePath), "%s/status/sd_card", deviceDatabasePath);
  snprintf(deviceStatusDatabasePath, sizeof(deviceStatusDatabasePath), "%s/status/device", deviceDatabasePath);
  snprintf(firmwareStatusDatabasePath, sizeof(firmwareStatusDatabasePath), "%s/status/firmware", deviceDatabasePath);
  snprintf(otaStatusDatabasePath, sizeof(otaStatusDatabasePath), "%s/status/ota", deviceDatabasePath);
  snprintf(otaCommandDatabasePath, sizeof(otaCommandDatabasePath), "%s/commands/firmware_update", deviceDatabasePath);
  snprintf(activationSecretDatabasePath, sizeof(activationSecretDatabasePath), "/device_secrets/%s", deviceId);
}

bool loadWiFiCredentials(String &ssid, String &password)
{
  if (!preferences.begin(WIFI_SETTINGS_NAMESPACE, false)) {
    Serial.println("Wi-Fi settings could not be opened.");
    return false;
  }
  if (!preferences.isKey(WIFI_SSID_KEY)) {
    preferences.end();
    return false;
  }

  ssid = preferences.getString(WIFI_SSID_KEY, "");
  password = preferences.isKey(WIFI_PASSWORD_KEY)
                 ? preferences.getString(WIFI_PASSWORD_KEY, "")
                 : "";
  preferences.end();
  return ssid.length() > 0;
}

void startProvisioningAccessPoint(bool keepStationEnabled);

const char *wifiProvisioningStateName()
{
  switch (wifiProvisioningState) {
    case WiFiProvisioningState::Connecting:
      return "connecting";
    case WiFiProvisioningState::Connected:
      return "connected";
    case WiFiProvisioningState::Failed:
      return "failed";
    case WiFiProvisioningState::Idle:
    default:
      return "idle";
  }
}

const char *wifiProvisioningMessage()
{
  switch (wifiProvisioningState) {
    case WiFiProvisioningState::Connecting:
      return "Povezovanje z izbranim Wi-Fi omrežjem ...";
    case WiFiProvisioningState::Connected:
      return "Wi-Fi je povezan in nastavitve so shranjene.";
    case WiFiProvisioningState::Failed:
      return "Povezava ni uspela. Preveri ime omrežja in geslo.";
    case WiFiProvisioningState::Idle:
    default:
      return "";
  }
}

bool storeWiFiCredentials(const String &ssid, const String &password)
{
  if (!preferences.begin(WIFI_SETTINGS_NAMESPACE, false)) {
    Serial.println("Wi-Fi settings could not be saved.");
    return false;
  }

  const size_t storedSsidLength = preferences.putString(WIFI_SSID_KEY, ssid);
  const size_t storedPasswordLength = preferences.putString(WIFI_PASSWORD_KEY, password);
  preferences.end();
  return storedSsidLength == ssid.length() && storedPasswordLength == password.length();
}

void startWiFiConnectionAttempt(const String &ssid, const String &password)
{
  pendingWiFiSsid = ssid;
  pendingWiFiPassword = password;
  wifiProvisioningState = WiFiProvisioningState::Connecting;
  wifiConnectionStartedMillis = millis();
  accessPointShutdownMillis = 0;

  // AP ostane aktiven, zato telefon med preverjanjem ne izgubi lokalne strani.
  WiFi.mode(WIFI_AP_STA);
  WiFi.setSleep(false);
  WiFi.persistent(false);
  WiFi.setAutoReconnect(false);
  stationGotIpAddress = false;
  WiFi.begin(pendingWiFiSsid.c_str(), pendingWiFiPassword.c_str());
  Serial.printf("Testing Wi-Fi '%s' without restarting.\n", pendingWiFiSsid.c_str());
}

void updateWiFiConnectionAttempt()
{
  if (wifiProvisioningState != WiFiProvisioningState::Connecting) return;

  if (stationGotIpAddress) {
    stationConnected = true;
    WiFi.setAutoReconnect(true);
    if (storeWiFiCredentials(pendingWiFiSsid, pendingWiFiPassword)) {
      savedWiFiCredentialsAvailable = true;
      wifiProvisioningState = WiFiProvisioningState::Connected;
      accessPointShutdownMillis = millis() + ACCESS_POINT_SHUTDOWN_DELAY_MS;
      Serial.printf("Wi-Fi connected. IP address: %s\n", WiFi.localIP().toString().c_str());
    } else {
      wifiProvisioningState = WiFiProvisioningState::Failed;
      stationConnected = false;
      WiFi.disconnect(false, false);
    }
    pendingWiFiSsid = "";
    pendingWiFiPassword = "";
    return;
  }

  if (millis() - wifiConnectionStartedMillis >= WIFI_CONNECT_TIMEOUT_MS) {
    WiFi.disconnect(false, false);
    wifiProvisioningState = WiFiProvisioningState::Failed;
    pendingWiFiSsid = "";
    pendingWiFiPassword = "";
    Serial.println("Wi-Fi connection test timed out.");
  }
}

void clearStoredWiFiCredentials()
{
  if (preferences.begin(WIFI_SETTINGS_NAMESPACE, false)) {
    preferences.remove(WIFI_SSID_KEY);
    preferences.remove(WIFI_PASSWORD_KEY);
    preferences.end();
  }

  WiFi.persistent(false);
  WiFi.disconnect(false, true);
  stationConnected = false;
  stationGotIpAddress = false;
  savedWiFiCredentialsAvailable = false;
  wifiProvisioningState = WiFiProvisioningState::Idle;
  accessPointShutdownMillis = 0;
  accessPointActive = false;
  startProvisioningAccessPoint(false);
  Serial.println("Saved Wi-Fi settings were removed.");
}

void maintainProvisioningAccessPoint()
{
  if (scheduledWiFiSettingsClearMillis != 0 &&
      static_cast<int32_t>(millis() - scheduledWiFiSettingsClearMillis) >= 0) {
    scheduledWiFiSettingsClearMillis = 0;
    clearStoredWiFiCredentials();
  }

  if (accessPointShutdownMillis != 0 &&
      static_cast<int32_t>(millis() - accessPointShutdownMillis) >= 0) {
    WiFi.softAPdisconnect(true);
    accessPointActive = false;
    accessPointShutdownMillis = 0;
    WiFi.mode(WIFI_STA);
    Serial.println("Provisioning access point closed after successful Wi-Fi connection.");
  }
}

void startProvisioningAccessPoint(bool keepStationEnabled)
{
  WiFi.mode(keepStationEnabled ? WIFI_AP_STA : WIFI_AP);
  WiFi.setSleep(false);
  accessPointActive = WiFi.softAP(accessPointSsid);
  if (!accessPointActive) {
    Serial.println("Provisioning access point could not be started.");
    return;
  }

  Serial.printf("Provisioning AP: %s\n", accessPointSsid);
  Serial.println("Provisioning AP is open without a password (beta testing only).");
  Serial.printf("Open local dashboard: http://%s/\n", WiFi.softAPIP().toString().c_str());
}

bool connectToStoredWiFi()
{
  String ssid;
  String password;
  if (!loadWiFiCredentials(ssid, password)) return false;

  savedWiFiCredentialsAvailable = true;
  WiFi.mode(WIFI_STA);
  WiFi.persistent(false);
  WiFi.setAutoReconnect(true);
  stationGotIpAddress = false;
  WiFi.begin(ssid.c_str(), password.c_str());
  Serial.printf("Connecting to saved Wi-Fi '%s'", ssid.c_str());

  const uint32_t startedAt = millis();
  while (!stationGotIpAddress && millis() - startedAt < WIFI_CONNECT_TIMEOUT_MS) {
    delay(300);
    Serial.print('.');
  }

  stationConnected = stationGotIpAddress;
  if (stationConnected) {
    Serial.printf("\nConnected. IP address: %s\n", WiFi.localIP().toString().c_str());
  } else {
    Serial.println("\nSaved Wi-Fi is unavailable.");
  }
  return stationConnected;
}

void connectToWiFi()
{
  createDeviceIdentity();
  initializeDeviceDatabasePaths();
  printDeviceRegistrationData();
  if (!connectToStoredWiFi()) startProvisioningAccessPoint(savedWiFiCredentialsAvailable);
}

void maintainNetworkConnection()
{
  if (stationConnected && !stationGotIpAddress) {
    stationConnected = false;
    Serial.println("Wi-Fi connection was lost; enabling provisioning access point.");
    if (!accessPointActive) startProvisioningAccessPoint(true);
    return;
  }

  if (!stationConnected && savedWiFiCredentialsAvailable &&
      wifiProvisioningState != WiFiProvisioningState::Connecting && stationGotIpAddress) {
    stationConnected = true;
    if (accessPointActive) {
      WiFi.softAPdisconnect(true);
      accessPointActive = false;
      WiFi.mode(WIFI_STA);
    }
    Serial.printf("Wi-Fi connection restored. IP address: %s\n", WiFi.localIP().toString().c_str());
  }
}

void initializeTime()
{
  configTzTime(TIMEZONE, NTP_SERVER_1, NTP_SERVER_2);
  Serial.println("Synchronizing time with NTP...");
}

bool isFirebaseReady()
{
  return stationConnected && app.ready();
}

Uptime getUptime()
{
  const uint64_t totalMinutes = static_cast<uint64_t>(esp_timer_get_time()) / (60ULL * 1000000ULL);
  return {
      totalMinutes,
      totalMinutes / (24ULL * 60ULL),
      (totalMinutes / 60ULL) % 24ULL,
      totalMinutes % 60ULL,
  };
}

// --- OTA posodobitve --------------------------------------------------------

bool extractJsonString(const String &json, const char *key, String &value)
{
  const String keyPrefix = String('"') + key + "\":";
  const int keyPosition = json.indexOf(keyPrefix);
  if (keyPosition < 0) return false;

  const int valueStart = json.indexOf('"', keyPosition + keyPrefix.length());
  if (valueStart < 0) return false;
  const int valueEnd = json.indexOf('"', valueStart + 1);
  if (valueEnd < 0) return false;
  value = json.substring(valueStart + 1, valueEnd);
  return true;
}

bool extractJsonSize(const String &json, const char *key, size_t &value)
{
  const String keyPrefix = String('"') + key + "\":";
  const int keyPosition = json.indexOf(keyPrefix);
  if (keyPosition < 0) return false;

  const int valueStart = keyPosition + keyPrefix.length();
  const int valueEnd = json.indexOf(',', valueStart);
  const String number = json.substring(valueStart, valueEnd < 0 ? json.length() : valueEnd);
  const unsigned long parsed = strtoul(number.c_str(), nullptr, 10);
  if (parsed == 0) return false;
  value = parsed;
  return true;
}

bool parseFirmwareManifest(const String &json, FirmwareManifest &manifest)
{
  String version;
  String sha256;
  if (!extractJsonString(json, "version", version) || !extractJsonString(json, "firmware_url", manifest.firmwareUrl) ||
      !extractJsonString(json, "sha256", sha256) || !extractJsonSize(json, "size", manifest.size) ||
      version.length() >= sizeof(manifest.version) || sha256.length() != 64) {
    return false;
  }

  version.toCharArray(manifest.version, sizeof(manifest.version));
  sha256.toLowerCase();
  sha256.toCharArray(manifest.sha256, sizeof(manifest.sha256));
  return true;
}

bool isNewerFirmwareVersion(const char *candidateVersion, const char *currentVersion)
{
  int candidateMajor;
  int candidateMinor;
  int candidatePatch;
  int candidateBeta;
  int currentMajor;
  int currentMinor;
  int currentPatch;
  int currentBeta;
  const int candidateParts = sscanf(candidateVersion, "%d.%d.%d-beta.%d", &candidateMajor, &candidateMinor,
                                    &candidatePatch, &candidateBeta);
  const int currentParts = sscanf(currentVersion, "%d.%d.%d-beta.%d", &currentMajor, &currentMinor,
                                  &currentPatch, &currentBeta);
  if (candidateParts != 4 || currentParts != 4) return false;

  if (candidateMajor != currentMajor) return candidateMajor > currentMajor;
  if (candidateMinor != currentMinor) return candidateMinor > currentMinor;
  if (candidatePatch != currentPatch) return candidatePatch > currentPatch;
  return candidateBeta > currentBeta;
}

void reportOtaStatus(const char *state, const char *targetVersion, const char *message)
{
  char jsonPayload[320];
  snprintf(jsonPayload, sizeof(jsonPayload),
           "{\"state\":\"%s\",\"current_version\":\"%s\",\"target_version\":\"%s\",\"message\":\"%s\",\"updated_at\":%lu}",
           state, FIRMWARE_VERSION, targetVersion, message, static_cast<unsigned long>(time(nullptr)));
  object_t otaStatus(jsonPayload);
  database.set(asyncClient, otaStatusDatabasePath, otaStatus, processData, "updateOtaStatus");
}

void clearFirmwareUpdateCommand()
{
  database.remove(asyncClient, otaCommandDatabasePath, processData, "clearFirmwareUpdateCommand");
}

// Firebase povratni klic ostane kratek; počasno OTA omrežno delo se izvede pozneje v glavni zanki.
void queueFirmwareUpdateCommand(const String &payload)
{
  queuedFirmwareCommandInvalid = payload.length() >= sizeof(queuedFirmwareCommandPayload);
  if (queuedFirmwareCommandInvalid) {
    queuedFirmwareCommandPayload[0] = '\0';
    Serial.println("OTA command rejected: payload is too large.");
  } else {
    payload.toCharArray(queuedFirmwareCommandPayload, sizeof(queuedFirmwareCommandPayload));
    Serial.println("OTA command queued.");
  }
  firmwareCommandQueued = true;
}

bool loadFirmwareManifest(FirmwareManifest &manifest, String &errorMessage)
{
  Serial.println("OTA: downloading manifest.");
  HTTPClient http;
  http.setFollowRedirects(HTTPC_STRICT_FOLLOW_REDIRECTS);
  http.setTimeout(OTA_MANIFEST_TIMEOUT_MS);
  if (!http.begin(otaClient, OTA_MANIFEST_URL)) {
    errorMessage = "Povezave do OTA manifesta ni bilo mogoče odpreti.";
    return false;
  }

  const int responseCode = http.GET();
  if (responseCode != HTTP_CODE_OK) {
    Serial.print("OTA: manifest HTTP ");
    Serial.println(responseCode);
    errorMessage = String("Manifest OTA ni dosegljiv (HTTP ") + responseCode + ").";
    http.end();
    return false;
  }

  const bool manifestValid = parseFirmwareManifest(http.getString(), manifest);
  http.end();
  if (!manifestValid) {
    errorMessage = "Manifest OTA ima neveljavno obliko.";
    return false;
  }

  Serial.print("OTA: manifest v");
  Serial.print(manifest.version);
  Serial.print(", ");
  Serial.print(manifest.size);
  Serial.println(" bytes.");
  return true;
}

String sha256ToHex(const uint8_t hash[32])
{
  char hexHash[65];
  for (size_t index = 0; index < 32; ++index) {
    snprintf(hexHash + index * 2, 3, "%02x", hash[index]);
  }
  return String(hexHash);
}

bool downloadAndInstallFirmware(const FirmwareManifest &manifest, String &errorMessage)
{
  Serial.println("OTA: downloading firmware.");
  HTTPClient http;
  http.setFollowRedirects(HTTPC_STRICT_FOLLOW_REDIRECTS);
  http.setTimeout(OTA_FIRMWARE_TIMEOUT_MS);
  if (!http.begin(otaClient, manifest.firmwareUrl)) {
    errorMessage = "Povezave do firmware datoteke ni bilo mogoče odpreti.";
    return false;
  }

  const int responseCode = http.GET();
  if (responseCode != HTTP_CODE_OK) {
    Serial.print("OTA: firmware HTTP ");
    Serial.println(responseCode);
    errorMessage = String("Firmware datoteka ni dosegljiva (HTTP ") + responseCode + ").";
    http.end();
    return false;
  }

  if (http.getSize() > 0 && static_cast<size_t>(http.getSize()) != manifest.size) {
    errorMessage = "Velikost firmware datoteke se ne ujema z manifestom.";
    http.end();
    return false;
  }

  if (!Update.begin(manifest.size, U_FLASH)) {
    errorMessage = "Za OTA ni dovolj prostora v neaktivni particiji.";
    http.end();
    return false;
  }

  mbedtls_sha256_context sha256Context;
  mbedtls_sha256_init(&sha256Context);
  mbedtls_sha256_starts(&sha256Context, 0);
  WiFiClient *stream = http.getStreamPtr();
  if (stream == nullptr) {
    mbedtls_sha256_free(&sha256Context);
    Update.abort();
    http.end();
    errorMessage = "Podatkovnega toka OTA firmware-a ni bilo mogoče odpreti.";
    return false;
  }

  stream->setTimeout(1000);
  size_t downloaded = 0;
  uint32_t lastDataReceivedMillis = millis();
  uint8_t lastReportedProgress = 0;

  while (downloaded < manifest.size) {
    const size_t available = stream->available();
    if (available == 0) {
      if (!http.connected()) {
        errorMessage = "Povezava med prenosom firmware-a se je prekinila.";
        break;
      }
      if (millis() - lastDataReceivedMillis >= OTA_STREAM_IDLE_TIMEOUT_MS) {
        errorMessage = "Prenos firmware-a je potekel brez prejetih podatkov.";
        break;
      }
      yield();
      continue;
    }

    const size_t bytesToRead = min(available, min(sizeof(otaDownloadBuffer), manifest.size - downloaded));
    const size_t bytesRead = stream->readBytes(otaDownloadBuffer, bytesToRead);
    if (bytesRead == 0) {
      errorMessage = "Branje OTA firmware-a ni uspelo.";
      break;
    }
    if (Update.write(otaDownloadBuffer, bytesRead) != bytesRead) {
      errorMessage = "Zapis OTA firmware-a ni uspel.";
      break;
    }
    mbedtls_sha256_update(&sha256Context, otaDownloadBuffer, bytesRead);
    downloaded += bytesRead;
    lastDataReceivedMillis = millis();

    const uint8_t progress = static_cast<uint8_t>((downloaded * 100U) / manifest.size);
    if (progress == 100 || progress >= lastReportedProgress + 25) {
      lastReportedProgress = progress;
      Serial.print("OTA: ");
      Serial.print(progress);
      Serial.println("% downloaded.");
    }
  }

  uint8_t actualHash[32];
  mbedtls_sha256_finish(&sha256Context, actualHash);
  mbedtls_sha256_free(&sha256Context);
  http.end();

  if (downloaded != manifest.size) {
    Update.abort();
    if (errorMessage.length() == 0) {
      errorMessage = "Prenos OTA firmware-a ni popoln.";
    }
    return false;
  }

  if (sha256ToHex(actualHash) != manifest.sha256) {
    Update.abort();
    errorMessage = "SHA-256 firmware datoteke se ne ujema z manifestom.";
    return false;
  }

  if (!Update.end(true)) {
    errorMessage = "Zaključek OTA posodobitve ni uspel.";
    return false;
  }
  return true;
}

void processFirmwareUpdateCommand(const String &payload)
{
  if (payload == "null" || payload.length() == 0) {
    Serial.println("OTA: no update command available.");
    return;
  }

  String action;
  String targetVersion;
  if (!extractJsonString(payload, "action", action) || !extractJsonString(payload, "target_version", targetVersion)) {
    Serial.println("OTA error: invalid update command.");
    reportOtaStatus("error", "", "Neveljaven OTA ukaz.");
    clearFirmwareUpdateCommand();
    return;
  }

  if (action == "ignore") {
    Serial.println("OTA: update command ignored.");
    reportOtaStatus("ignored", targetVersion.c_str(), "Posodobitev je bila prezrta.");
    clearFirmwareUpdateCommand();
    return;
  }

  if (action != "install") {
    Serial.println("OTA: unsupported update action.");
    clearFirmwareUpdateCommand();
    return;
  }

  if (targetVersion == FIRMWARE_VERSION) {
    Serial.println("OTA: requested firmware is already installed.");
    reportOtaStatus("installed", targetVersion.c_str(), "Firmware je že nameščen.");
    clearFirmwareUpdateCommand();
    return;
  }

  if (!isNewerFirmwareVersion(targetVersion.c_str(), FIRMWARE_VERSION)) {
    Serial.println("OTA: requested firmware is not newer.");
    reportOtaStatus("ignored", targetVersion.c_str(), "Zahtevana različica ni novejša.");
    clearFirmwareUpdateCommand();
    return;
  }

  Serial.print("OTA: installation requested for v");
  Serial.println(targetVersion);
  reportOtaStatus("installing", targetVersion.c_str(), "Prenašam in preverjam firmware.");
  FirmwareManifest manifest{};
  String errorMessage;
  if (!loadFirmwareManifest(manifest, errorMessage)) {
    Serial.print("OTA error: ");
    Serial.println(errorMessage);
    reportOtaStatus("error", targetVersion.c_str(), errorMessage.c_str());
    clearFirmwareUpdateCommand();
    return;
  }
  if (String(manifest.version) != targetVersion) {
    errorMessage = "Različica manifesta se ne ujema z OTA ukazom.";
    Serial.print("OTA error: ");
    Serial.println(errorMessage);
    reportOtaStatus("error", targetVersion.c_str(), errorMessage.c_str());
    clearFirmwareUpdateCommand();
    return;
  }
  if (!isNewerFirmwareVersion(manifest.version, FIRMWARE_VERSION)) {
    errorMessage = "Različica v manifestu ni novejša od nameščene.";
    Serial.print("OTA error: ");
    Serial.println(errorMessage);
    reportOtaStatus("error", targetVersion.c_str(), errorMessage.c_str());
    clearFirmwareUpdateCommand();
    return;
  }
  if (!downloadAndInstallFirmware(manifest, errorMessage)) {
    Serial.print("OTA error: ");
    Serial.println(errorMessage);
    reportOtaStatus("error", targetVersion.c_str(), errorMessage.c_str());
    clearFirmwareUpdateCommand();
    return;
  }

  // Novo sliko aktivira šele Update.end(true); ob naslednjem zagonu firmware pošlje novo verzijo v Firebase.
  Serial.println("OTA: firmware verified, restarting device.");
  ESP.restart();
}

void processQueuedFirmwareUpdateCommand()
{
  if (!firmwareCommandQueued || firmwareUpdateInProgress) return;

  firmwareCommandQueued = false;
  firmwareUpdateInProgress = true;
  if (queuedFirmwareCommandInvalid) {
    queuedFirmwareCommandInvalid = false;
    Serial.println("OTA error: update command payload is too large.");
    reportOtaStatus("error", "", "OTA ukaz je predolg.");
    clearFirmwareUpdateCommand();
  } else {
    const String payload(queuedFirmwareCommandPayload);
    queuedFirmwareCommandPayload[0] = '\0';
    processFirmwareUpdateCommand(payload);
  }
  firmwareUpdateInProgress = false;
}

void requestFirmwareUpdateCommand()
{
  firmwareCommandPending = true;
  database.get(asyncClient, otaCommandDatabasePath, processData, false, "readFirmwareUpdateCommand");
}

// --- SD kartica -------------------------------------------------------------

bool initializeSDCard()
{
  SD.end();
  sdSpi.begin(SD_SCK_PIN, SD_MISO_PIN, SD_MOSI_PIN, SD_CS_PIN);
  sdCardReady = SD.begin(SD_CS_PIN, sdSpi);

  if (!sdCardReady || SD.cardType() == CARD_NONE) {
    sdCardReady = false;
    Serial.println("SD card initialization failed.");
    return false;
  }

  if (SD.exists(SD_LOG_PATH)) {
    Serial.println("SD card initialized.");
    return true;
  }

  File logFile = SD.open(SD_LOG_PATH, FILE_WRITE);
  if (!logFile) {
    Serial.println("Could not create measurements.csv on the SD card.");
    sdCardReady = false;
    return false;
  }

  logFile.println("date,time,unix_timestamp,temperature_c,humidity_percent,weight_kg");
  logFile.close();
  Serial.println("SD card initialized.");
  return true;
}

void markSDCardUnavailable()
{
  if (sdCardReady) {
    Serial.println("SD card is unavailable.");
  }

  sdCardReady = false;
  cloudSyncCaughtUp = false;
  historyIndexReady = false;
  SD.end();
}

time_t historyIndexDay(time_t timestamp)
{
  return timestamp - (timestamp % DAILY_AGGREGATE_SECONDS);
}

bool buildMeasurementHistoryIndex()
{
  File logFile = SD.open(SD_LOG_PATH, FILE_READ);
  if (!logFile) {
    Serial.println("Could not open measurements.csv while building the history index.");
    return false;
  }

  SD.remove(SD_HISTORY_INDEX_TEMP_PATH);
  File indexFile = SD.open(SD_HISTORY_INDEX_TEMP_PATH, FILE_WRITE);
  if (!indexFile) {
    logFile.close();
    Serial.println("Could not create the temporary history index.");
    return false;
  }

  indexFile.println("day_timestamp,file_offset");
  time_t indexedDay = 0;
  char line[128];
  uint16_t processedLines = 0;
  while (logFile.available()) {
    const uint32_t lineOffset = static_cast<uint32_t>(logFile.position());
    const size_t lineLength = logFile.readBytesUntil('\n', line, sizeof(line) - 1);
    line[lineLength] = '\0';

    Measurement measurement{};
    if (parseMeasurementCsvLine(line, measurement)) {
      const time_t measurementDay = historyIndexDay(measurement.timestamp);
      if (measurementDay > indexedDay) {
        indexFile.printf("%lu,%lu\n", static_cast<unsigned long>(measurementDay),
                         static_cast<unsigned long>(lineOffset));
        indexedDay = measurementDay;
      }
    }

    if (++processedLines % 64 == 0) {
      yield();
    }
  }
  logFile.close();
  indexFile.close();

  SD.remove(SD_HISTORY_INDEX_PATH);
  if (!SD.rename(SD_HISTORY_INDEX_TEMP_PATH, SD_HISTORY_INDEX_PATH)) {
    Serial.println("Could not activate the rebuilt history index.");
    return false;
  }

  lastIndexedDayTimestamp = indexedDay;
  Serial.println("SD history index was rebuilt.");
  return true;
}

bool extendMeasurementHistoryIndex(uint32_t fileOffset)
{
  File logFile = SD.open(SD_LOG_PATH, FILE_READ);
  if (!logFile || fileOffset > logFile.size() || !logFile.seek(fileOffset)) {
    if (logFile) logFile.close();
    return false;
  }

  File indexFile = SD.open(SD_HISTORY_INDEX_PATH, FILE_APPEND);
  if (!indexFile) {
    logFile.close();
    return false;
  }

  char line[128];
  uint16_t processedLines = 0;
  while (logFile.available()) {
    const uint32_t lineOffset = static_cast<uint32_t>(logFile.position());
    const size_t lineLength = logFile.readBytesUntil('\n', line, sizeof(line) - 1);
    line[lineLength] = '\0';

    Measurement measurement{};
    if (parseMeasurementCsvLine(line, measurement)) {
      const time_t measurementDay = historyIndexDay(measurement.timestamp);
      if (measurementDay > lastIndexedDayTimestamp) {
        indexFile.printf("%lu,%lu\n", static_cast<unsigned long>(measurementDay),
                         static_cast<unsigned long>(lineOffset));
        lastIndexedDayTimestamp = measurementDay;
      }
    }
    if (++processedLines % 64 == 0) {
      yield();
    }
  }
  logFile.close();
  indexFile.close();
  return true;
}

bool initializeMeasurementHistoryIndex()
{
  historyIndexReady = false;
  lastIndexedDayTimestamp = 0;
  if (!sdCardReady) {
    return false;
  }

  const bool indexExists = SD.exists(SD_HISTORY_INDEX_PATH);
  if (!indexExists) {
    if (!buildMeasurementHistoryIndex()) {
      return false;
    }
    historyIndexReady = true;
    return true;
  }

  File indexFile = SD.open(SD_HISTORY_INDEX_PATH, FILE_READ);
  if (!indexFile) {
    Serial.println("Could not open the SD history index.");
    return false;
  }

  char line[64];
  uint32_t lastIndexedFileOffset = 0;
  bool invalidIndex = false;
  while (indexFile.available()) {
    const size_t lineLength = indexFile.readBytesUntil('\n', line, sizeof(line) - 1);
    line[lineLength] = '\0';
    unsigned long dayTimestamp = 0;
    unsigned long fileOffset = 0;
    if (sscanf(line, "%lu,%lu", &dayTimestamp, &fileOffset) == 2) {
      if (dayTimestamp < static_cast<unsigned long>(lastIndexedDayTimestamp) ||
          fileOffset < lastIndexedFileOffset) {
        invalidIndex = true;
        break;
      }
      lastIndexedDayTimestamp = static_cast<time_t>(dayTimestamp);
      lastIndexedFileOffset = static_cast<uint32_t>(fileOffset);
    }
  }
  indexFile.close();

  if (invalidIndex || !extendMeasurementHistoryIndex(lastIndexedFileOffset)) {
    SD.remove(SD_HISTORY_INDEX_PATH);
    if (!buildMeasurementHistoryIndex()) {
      return false;
    }
  }
  historyIndexReady = true;
  return true;
}

bool appendMeasurementHistoryIndex(const Measurement &measurement, uint32_t fileOffset)
{
  if (!historyIndexReady || measurement.timestamp < MIN_VALID_UNIX_TIMESTAMP) {
    return historyIndexReady;
  }

  const time_t measurementDay = historyIndexDay(measurement.timestamp);
  if (measurementDay <= lastIndexedDayTimestamp) {
    return true;
  }

  File indexFile = SD.open(SD_HISTORY_INDEX_PATH, FILE_APPEND);
  if (!indexFile) {
    historyIndexReady = false;
    Serial.println("Could not update the SD history index; local history will use a full scan.");
    return false;
  }
  indexFile.printf("%lu,%lu\n", static_cast<unsigned long>(measurementDay),
                   static_cast<unsigned long>(fileOffset));
  indexFile.close();
  lastIndexedDayTimestamp = measurementDay;
  return true;
}

uint32_t findHistoryFileOffset(time_t firstTimestamp)
{
  if (!historyIndexReady) {
    return 0;
  }

  File indexFile = SD.open(SD_HISTORY_INDEX_PATH, FILE_READ);
  if (!indexFile) {
    historyIndexReady = false;
    return 0;
  }

  const time_t requestedDay = historyIndexDay(firstTimestamp);
  uint32_t selectedOffset = 0;
  char line[64];
  while (indexFile.available()) {
    const size_t lineLength = indexFile.readBytesUntil('\n', line, sizeof(line) - 1);
    line[lineLength] = '\0';
    unsigned long dayTimestamp = 0;
    unsigned long fileOffset = 0;
    if (sscanf(line, "%lu,%lu", &dayTimestamp, &fileOffset) != 2) {
      continue;
    }
    if (dayTimestamp > static_cast<unsigned long>(requestedDay)) {
      break;
    }
    selectedOffset = static_cast<uint32_t>(fileOffset);
  }
  indexFile.close();
  return selectedOffset;
}

// --- Lokalni web strežnik ---------------------------------------------------

const char *contentTypeForPath(const String &path)
{
  if (path.endsWith(".html")) return "text/html; charset=utf-8";
  if (path.endsWith(".css")) return "text/css; charset=utf-8";
  if (path.endsWith(".js")) return "application/javascript; charset=utf-8";
  return "application/octet-stream";
}

bool serveLocalAsset(String path)
{
  if (path == "/") path = "/index.html";
  if (!LittleFS.exists(path)) return false;

  File asset = LittleFS.open(path, FILE_READ);
  if (!asset) return false;
  localServer.sendHeader("Cache-Control", path.startsWith("/vendor/")
                                            ? "public, max-age=86400"
                                            : "no-cache");
  localServer.streamFile(asset, contentTypeForPath(path));
  asset.close();
  return true;
}

void appendJsonEscaped(String &json, const String &value)
{
  for (size_t index = 0; index < value.length(); ++index) {
    const char character = value[index];
    if (character == '"' || character == '\\') {
      json += '\\';
      json += character;
    } else if (character == '\n') {
      json += "\\n";
    } else if (character == '\r') {
      json += "\\r";
    } else if (character == '\t') {
      json += "\\t";
    } else if (static_cast<uint8_t>(character) >= 0x20) {
      json += character;
    }
  }
}

void sendAvailableWiFiNetworks()
{
  if (wifiProvisioningState == WiFiProvisioningState::Connecting) {
    localServer.send(409, "application/json", "{\"error\":\"Wi-Fi connection test is in progress\"}");
    return;
  }

  const int scanResult = WiFi.scanComplete();
  if (scanResult == WIFI_SCAN_RUNNING) {
    localServer.send(202, "application/json", "{\"state\":\"scanning\"}");
    return;
  }

  if (scanResult == WIFI_SCAN_FAILED) {
    // Skeniranje potrebuje tudi STA vmesnik, AP pa ostane aktiven za telefon.
    WiFi.mode(WIFI_AP_STA);
    WiFi.setSleep(false);
    WiFi.scanNetworks(true, true);
    localServer.send(202, "application/json", "{\"state\":\"scanning\"}");
    return;
  }

  String jsonPayload = "{\"state\":\"ready\",\"networks\":[";
  bool firstNetwork = true;
  for (int index = 0; index < scanResult; ++index) {
    const String ssid = WiFi.SSID(index);
    if (ssid.length() == 0) continue;
    if (!firstNetwork) jsonPayload += ',';
    firstNetwork = false;
    jsonPayload += "{\"ssid\":\"";
    appendJsonEscaped(jsonPayload, ssid);
    jsonPayload += "\",\"rssi\":" + String(WiFi.RSSI(index));
    jsonPayload += ",\"secured\":" + String(WiFi.encryptionType(index) == WIFI_AUTH_OPEN ? "false" : "true") + '}';
  }
  jsonPayload += "]}";
  WiFi.scanDelete();
  localServer.send(200, "application/json; charset=utf-8", jsonPayload);
}

void saveWiFiConfiguration()
{
  const String ssid = localServer.arg("ssid");
  const String password = localServer.arg("password");
  if (ssid.length() == 0 || ssid.length() > 32 || password.length() > 63) {
    localServer.send(400, "application/json", "{\"error\":\"Invalid Wi-Fi configuration\"}");
    return;
  }
  if (wifiProvisioningState == WiFiProvisioningState::Connecting) {
    localServer.send(409, "application/json", "{\"error\":\"Wi-Fi connection test is in progress\"}");
    return;
  }

  startWiFiConnectionAttempt(ssid, password);
  localServer.send(202, "application/json", "{\"state\":\"connecting\"}");
}

void deleteWiFiConfiguration()
{
  if (wifiProvisioningState == WiFiProvisioningState::Connecting) {
    localServer.send(409, "application/json", "{\"error\":\"Wi-Fi connection test is in progress\"}");
    return;
  }

  localServer.send(202, "application/json", "{\"state\":\"clearing\"}");
  scheduledWiFiSettingsClearMillis = millis() + WIFI_SETTINGS_CLEAR_DELAY_MS;
}

void sendLocalStatus()
{
  const Uptime uptime = getUptime();
  const String ipAddress = stationConnected ? WiFi.localIP().toString() : WiFi.softAPIP().toString();
  const String accessPointIp = WiFi.softAPIP().toString();
  const String wifiSignal = stationConnected ? String(WiFi.RSSI()) : "null";
  const time_t lastSeenTimestamp = time(nullptr);
  const bool cloudSynchronizationComplete = cloudSyncCaughtUp && !cloudSyncPending &&
                                             !hourlyAggregateReady && !dailyAggregateReady;
  static char measurementJson[220];
  if (hasLatestMeasurement) {
    snprintf(measurementJson, sizeof(measurementJson),
             "{\"temperature_c\":%.1f,\"humidity_percent\":%.1f,\"weight_kg\":%.2f,\"date\":\"%s\",\"time\":\"%s\",\"timestamp\":%lu}",
             latestMeasurement.temperatureC, latestMeasurement.humidityPercent, latestMeasurement.weightKg,
             latestMeasurement.date, latestMeasurement.time, static_cast<unsigned long>(latestMeasurement.timestamp));
  } else {
    snprintf(measurementJson, sizeof(measurementJson), "null");
  }

  static char jsonPayload[1280];
  snprintf(jsonPayload, sizeof(jsonPayload),
           "{\"latest\":%s,\"device\":{\"device_id\":\"%s\",\"ip_address\":\"%s\",\"wifi_rssi_dbm\":%s,\"uptime_days\":%llu,\"uptime_hours\":%llu,\"uptime_minutes\":%llu,\"last_seen_timestamp\":%lu},\"network\":{\"mode\":\"%s\",\"station_connected\":%s,\"provisioning_active\":%s,\"access_point_ssid\":\"%s\",\"access_point_ip\":\"%s\",\"connection_state\":\"%s\",\"connection_message\":\"%s\",\"activation_code\":\"%s\"},\"sync\":{\"pending\":%s,\"caught_up\":%s,\"last_synced_timestamp\":%lu,\"retry_seconds\":%lu},\"sd_card\":{\"present\":%s,\"initialization_failures\":%u,\"error\":%s},\"firmware\":{\"version\":\"%s\"}}",
           measurementJson, deviceId, ipAddress.c_str(), wifiSignal.c_str(), static_cast<unsigned long long>(uptime.days),
           static_cast<unsigned long long>(uptime.hours), static_cast<unsigned long long>(uptime.minutes),
           static_cast<unsigned long>(lastSeenTimestamp),
           stationConnected ? "station" : "access_point", stationConnected ? "true" : "false",
           accessPointActive ? "true" : "false", accessPointSsid, accessPointIp.c_str(),
           wifiProvisioningStateName(), wifiProvisioningMessage(), activationCode,
           cloudSyncPending ? "true" : "false", cloudSynchronizationComplete ? "true" : "false",
           static_cast<unsigned long>(lastCloudSyncedTimestamp),
           static_cast<unsigned long>(cloudSyncRetryIntervalMs / 1000),
           sdCardReady ? "true" : "false", sdInitializationFailures,
           sdErrorReported ? "true" : "false", FIRMWARE_VERSION);
  localServer.sendHeader("Cache-Control", "no-store");
  localServer.send(200, "application/json; charset=utf-8", jsonPayload);
}

bool getLocalHistoryWindow(time_t &firstTimestamp, time_t &lastTimestamp, uint32_t &bucketDuration)
{
  const time_t now = time(nullptr);
  firstTimestamp = localServer.hasArg("from")
                       ? static_cast<time_t>(localServer.arg("from").toInt())
                       : now - 24 * 60 * 60;
  lastTimestamp = localServer.hasArg("to")
                      ? static_cast<time_t>(localServer.arg("to").toInt())
                      : now;

  const time_t duration = lastTimestamp - firstTimestamp;
  if (firstTimestamp <= 0 || lastTimestamp <= firstTimestamp || duration > MAX_LOCAL_HISTORY_DURATION_SECONDS) {
    return false;
  }

  if (duration <= 24 * 60 * 60) {
    bucketDuration = 5 * 60;
  } else if (duration <= 7 * 24 * 60 * 60) {
    bucketDuration = 60 * 60;
  } else if (duration <= 31 * 24 * 60 * 60) {
    bucketDuration = 6 * 60 * 60;
  } else {
    bucketDuration = 24 * 60 * 60;
  }
  return true;
}

void sendLocalHistory()
{
  if (!sdCardReady) {
    localServer.send(503, "application/json", "{\"error\":\"SD card is unavailable\"}");
    return;
  }

  time_t firstTimestamp;
  time_t lastTimestamp;
  uint32_t bucketDuration;
  if (!getLocalHistoryWindow(firstTimestamp, lastTimestamp, bucketDuration)) {
    localServer.send(400, "application/json", "{\"error\":\"Invalid history time range\"}");
    return;
  }

  File logFile = SD.open(SD_LOG_PATH, FILE_READ);
  if (!logFile) {
    localServer.send(404, "application/json", "{\"error\":\"Measurement log is unavailable\"}");
    return;
  }

  const uint32_t historyStartOffset = findHistoryFileOffset(firstTimestamp);
  if (historyStartOffset > 0 && !logFile.seek(historyStartOffset)) {
    logFile.seek(0);
  }
  memset(localHistoryBuckets, 0, sizeof(localHistoryBuckets));

  char line[128];
  while (logFile.available()) {
    const size_t length = logFile.readBytesUntil('\n', line, sizeof(line) - 1);
    line[length] = '\0';
    unsigned long timestamp;
    float temperature;
    float humidity;
    float weight;
    if (sscanf(line, "%*10[^,],%*8[^,],%lu,%f,%f,%f", &timestamp, &temperature, &humidity, &weight) != 4) {
      continue;
    }
    if (timestamp > static_cast<unsigned long>(lastTimestamp)) {
      break;
    }
    if (timestamp < static_cast<unsigned long>(firstTimestamp)) {
      continue;
    }

    const size_t bucketIndex = (timestamp - static_cast<unsigned long>(firstTimestamp)) / bucketDuration;
    if (bucketIndex >= MAX_LOCAL_HISTORY_BUCKETS) continue;
    HistoryBucket &bucket = localHistoryBuckets[bucketIndex];
    bucket.timestamp = (timestamp / bucketDuration) * bucketDuration;
    bucket.temperatureSum += temperature;
    bucket.humiditySum += humidity;
    bucket.weightSum += weight;
    ++bucket.count;
  }
  logFile.close();

  String jsonPayload = "{\"readings\":[";
  bool firstReading = true;
  for (const HistoryBucket &bucket : localHistoryBuckets) {
    if (bucket.count == 0) continue;
    if (!firstReading) jsonPayload += ',';
    firstReading = false;
    jsonPayload += "{\"timestamp\":" + String(static_cast<unsigned long>(bucket.timestamp));
    jsonPayload += ",\"temperature_c\":" + String(bucket.temperatureSum / bucket.count, 2);
    jsonPayload += ",\"humidity_percent\":" + String(bucket.humiditySum / bucket.count, 2);
    jsonPayload += ",\"weight_kg\":" + String(bucket.weightSum / bucket.count, 2) + '}';
  }
  jsonPayload += "]}";
  localServer.sendHeader("Cache-Control", "no-store");
  localServer.send(200, "application/json; charset=utf-8", jsonPayload);
}

void resetCloudSynchronization()
{
  if (cloudSyncPending) {
    localServer.send(409, "application/json", "{\"error\":\"Cloud synchronization is in progress\"}");
    return;
  }

  cloudSyncFileOffset = 0;
  cloudSyncPendingFileOffset = 0;
  lastCloudSyncedTimestamp = 0;
  cloudSyncWritesSincePersist = 0;
  cloudSyncStateSavePending = false;
  cloudSyncCaughtUp = false;
  cloudSyncRetryIntervalMs = CLOUD_SYNC_INTERVAL_MS;
  lastCloudSyncAttemptMillis = 0;
  resetCloudAggregateState();

  if (!persistCloudSyncState()) {
    localServer.send(500, "application/json", "{\"error\":\"Cloud synchronization state could not be saved\"}");
    return;
  }

  Serial.println("Cloud history synchronization was reset from the local dashboard.");
  localServer.send(202, "application/json", "{\"state\":\"resynchronizing\"}");
}

void serveMeasurementLog()
{
  if (!sdCardReady) {
    localServer.send(503, "text/plain", "SD card is unavailable.");
    return;
  }
  File logFile = SD.open(SD_LOG_PATH, FILE_READ);
  if (!logFile) {
    localServer.send(404, "text/plain", "Measurement log is unavailable.");
    return;
  }
  localServer.sendHeader("Content-Disposition", "attachment; filename=measurements.csv");
  localServer.streamFile(logFile, "text/csv; charset=utf-8");
  logFile.close();
}

void initializeLocalWebServer()
{
  if (!LittleFS.begin()) {
    Serial.println("LittleFS initialization failed. Upload web assets with 'pio run -t uploadfs'.");
  }

  localServer.on("/api/status", HTTP_GET, sendLocalStatus);
  localServer.on("/api/history", HTTP_GET, sendLocalHistory);
  localServer.on("/api/sync/reset", HTTP_POST, resetCloudSynchronization);
  localServer.on("/api/wifi", HTTP_POST, saveWiFiConfiguration);
  localServer.on("/api/wifi", HTTP_DELETE, deleteWiFiConfiguration);
  localServer.on("/api/wifi/networks", HTTP_GET, sendAvailableWiFiNetworks);
  localServer.on("/measurements.csv", HTTP_GET, serveMeasurementLog);
  localServer.onNotFound([]() {
    if (!serveLocalAsset(localServer.uri())) localServer.send(404, "text/plain", "Not found");
  });
  localServer.on("/", HTTP_GET, []() { serveLocalAsset("/"); });
  localServer.begin();
  const String dashboardIp = stationConnected ? WiFi.localIP().toString() : WiFi.softAPIP().toString();
  Serial.printf("Local dashboard: http://%s/\n", dashboardIp.c_str());
}

// --- Meritve ----------------------------------------------------------------

bool createMeasurement(Measurement &measurement)
{
  struct tm timeInfo;
  measurement.temperatureC = simulatedTemperatureC();
  measurement.humidityPercent = simulatedHumidityPercent();
  measurement.weightKg = simulatedWeightKg();
  measurement.timestamp = time(nullptr);

  if (measurement.timestamp >= MIN_VALID_UNIX_TIMESTAMP && getLocalTime(&timeInfo)) {
    strftime(measurement.date, sizeof(measurement.date), "%Y-%m-%d", &timeInfo);
    strftime(measurement.time, sizeof(measurement.time), "%H:%M:%S", &timeInfo);
    return true;
  }

  // Brez interneta ob prvem zagonu absolutni čas ni znan, meritve pa morajo ostati lokalno dostopne.
  measurement.timestamp = 0;
  strcpy(measurement.date, "offline");
  const Uptime uptime = getUptime();
  snprintf(measurement.time, sizeof(measurement.time), "%02lluh%02llum",
           static_cast<unsigned long long>(uptime.hours), static_cast<unsigned long long>(uptime.minutes));
  return true;
}

bool appendToSDCard(const Measurement &measurement)
{
  if (!sdCardReady) {
    return false;
  }

  File logFile = SD.open(SD_LOG_PATH, FILE_APPEND);
  if (!logFile) {
    Serial.println("Could not open measurements.csv for writing.");
    markSDCardUnavailable();
    return false;
  }

  const uint32_t fileOffset = static_cast<uint32_t>(logFile.size());
  const size_t bytesWritten = logFile.printf("%s,%s,%lu,%.1f,%.1f,%.2f\n", measurement.date, measurement.time,
                                             static_cast<unsigned long>(measurement.timestamp),
                                             measurement.temperatureC, measurement.humidityPercent,
                                             measurement.weightKg);
  logFile.close();
  if (bytesWritten == 0) {
    Serial.println("Could not write the measurement to measurements.csv.");
    markSDCardUnavailable();
    return false;
  }

  appendMeasurementHistoryIndex(measurement, fileOffset);
  return true;
}

bool persistCloudSyncState()
{
  if (!preferences.begin(DEVICE_SETTINGS_NAMESPACE, false)) {
    Serial.println("Cloud sync state could not be saved.");
    return false;
  }

  const bool offsetSaved = preferences.putULong(CLOUD_SYNC_OFFSET_KEY, cloudSyncFileOffset) == sizeof(uint32_t);
  const bool timestampSaved = preferences.putULong(CLOUD_SYNC_TIMESTAMP_KEY,
                                                    static_cast<uint32_t>(lastCloudSyncedTimestamp)) == sizeof(uint32_t);
  preferences.end();

  if (offsetSaved && timestampSaved) {
    cloudSyncWritesSincePersist = 0;
    cloudSyncStateSavePending = false;
    return true;
  }

  Serial.println("Cloud sync state could not be saved.");
  return false;
}

bool parseMeasurementCsvLine(const char *line, Measurement &measurement)
{
  unsigned long timestamp = 0;
  const int valueCount = sscanf(line, "%10[^,],%8[^,],%lu,%f,%f,%f", measurement.date, measurement.time,
                                &timestamp, &measurement.temperatureC, &measurement.humidityPercent,
                                &measurement.weightKg);
  if (valueCount != 6 || timestamp < static_cast<unsigned long>(MIN_VALID_UNIX_TIMESTAMP)) {
    return false;
  }

  measurement.timestamp = static_cast<time_t>(timestamp);
  return true;
}

void resetCloudAggregateState()
{
  hourlyCloudAggregate = {};
  dailyCloudAggregate = {};
  readyHourlyCloudAggregate = {};
  readyDailyCloudAggregate = {};
  cloudSyncPendingAggregate = {};
  hourlyAggregateReady = false;
  dailyAggregateReady = false;
  lastPublishedHourlyBucket = 0;
  lastPublishedDailyBucket = 0;
  lastPublishedHourlyCount = 0;
  lastPublishedDailyCount = 0;
  lastCloudAggregateRefreshMillis = 0;
}

void rebuildCloudAggregateState()
{
  resetCloudAggregateState();
  if (!sdCardReady || cloudSyncFileOffset == 0 ||
      lastCloudSyncedTimestamp < MIN_VALID_UNIX_TIMESTAMP) {
    return;
  }

  File logFile = SD.open(SD_LOG_PATH, FILE_READ);
  if (!logFile) {
    return;
  }
  if (cloudSyncFileOffset > logFile.size()) {
    logFile.close();
    cloudSyncFileOffset = 0;
    lastCloudSyncedTimestamp = 0;
    persistCloudSyncState();
    return;
  }

  const uint32_t rebuildOffset = findHistoryFileOffset(lastCloudSyncedTimestamp);
  if (rebuildOffset > 0 && !logFile.seek(rebuildOffset)) {
    logFile.seek(0);
  }

  char line[128];
  uint16_t processedLines = 0;
  while (logFile.available()) {
    const size_t lineLength = logFile.readBytesUntil('\n', line, sizeof(line) - 1);
    line[lineLength] = '\0';
    if (logFile.position() > cloudSyncFileOffset) {
      break;
    }

    Measurement measurement{};
    if (parseMeasurementCsvLine(line, measurement)) {
      addMeasurementToCloudAggregate(hourlyCloudAggregate, readyHourlyCloudAggregate, hourlyAggregateReady,
                                     measurement, HOURLY_AGGREGATE_SECONDS, false);
      addMeasurementToCloudAggregate(dailyCloudAggregate, readyDailyCloudAggregate, dailyAggregateReady,
                                     measurement, DAILY_AGGREGATE_SECONDS, false);
    }
    if (++processedLines % 64 == 0) {
      yield();
    }
  }
  logFile.close();
}

bool readNextSDMeasurementForCloudSync(Measurement &measurement, uint32_t &nextFileOffset)
{
  if (!sdCardReady) {
    return false;
  }

  File logFile = SD.open(SD_LOG_PATH, FILE_READ);
  if (!logFile) {
    Serial.println("Could not open measurements.csv for cloud synchronization.");
    markSDCardUnavailable();
    return false;
  }

  const size_t fileSize = logFile.size();
  if (cloudSyncFileOffset > fileSize) {
    // Nova oziroma zamenjana SD kartica ne more uporabljati starega položaja v datoteki.
    cloudSyncFileOffset = 0;
    lastCloudSyncedTimestamp = 0;
    resetCloudAggregateState();
    cloudSyncWritesSincePersist = CLOUD_SYNC_STATE_SAVE_INTERVAL;
    persistCloudSyncState();
  }

  if (!logFile.seek(cloudSyncFileOffset)) {
    logFile.close();
    Serial.println("Could not seek to the cloud sync position on the SD card.");
    return false;
  }

  char line[128];
  while (logFile.available()) {
    const size_t lineLength = logFile.readBytesUntil('\n', line, sizeof(line) - 1);
    line[lineLength] = '\0';
    const uint32_t lineEndOffset = static_cast<uint32_t>(logFile.position());

    Measurement parsedMeasurement{};
    if (!parseMeasurementCsvLine(line, parsedMeasurement)) {
      cloudSyncFileOffset = lineEndOffset;
      continue;
    }

    logFile.close();
    measurement = parsedMeasurement;
    nextFileOffset = lineEndOffset;
    return true;
  }
  logFile.close();

  cloudSyncCaughtUp = true;
  return false;
}

void queueSDMeasurementForCloudSync(const Measurement &measurement, uint32_t nextFileOffset)
{
  char jsonPayload[192];
  snprintf(jsonPayload, sizeof(jsonPayload),
           "{\"temperature_c\":%.1f,\"humidity_percent\":%.1f,\"weight_kg\":%.2f,\"date\":\"%s\",\"time\":\"%s\",\"timestamp\":%lu}",
           measurement.temperatureC, measurement.humidityPercent, measurement.weightKg,
           measurement.date, measurement.time, static_cast<unsigned long>(measurement.timestamp));
  object_t measurements(jsonPayload);

  char historyPath[96];
  snprintf(historyPath, sizeof(historyPath), "%s/%lu", historyDatabasePath,
           static_cast<unsigned long>(measurement.timestamp));

  cloudSyncPendingMeasurement = measurement;
  cloudSyncPendingFileOffset = nextFileOffset;
  cloudSyncPending = true;
  cloudSyncRequestType = CloudSyncRequestType::Measurement;
  database.set(asyncClient, historyPath, measurements, processData, "syncMeasurementHistory");
}

void queueCloudAggregate(const MeasurementAggregate &aggregate, const char *databasePath,
                         CloudSyncRequestType requestType, const char *requestId,
                         uint32_t periodSeconds)
{
  if (aggregate.count == 0) {
    return;
  }

  char jsonPayload[224];
  snprintf(jsonPayload, sizeof(jsonPayload),
           "{\"temperature_c\":%.2f,\"humidity_percent\":%.2f,\"weight_kg\":%.2f,\"timestamp\":%lu,\"sample_count\":%u,\"period_seconds\":%lu}",
           aggregate.temperatureSum / aggregate.count, aggregate.humiditySum / aggregate.count,
           aggregate.weightSum / aggregate.count, static_cast<unsigned long>(aggregate.timestamp),
           aggregate.count, static_cast<unsigned long>(periodSeconds));
  object_t aggregateData(jsonPayload);

  char aggregatePath[DATABASE_PATH_LENGTH];
  snprintf(aggregatePath, sizeof(aggregatePath), "%s/%lu", databasePath,
           static_cast<unsigned long>(aggregate.timestamp));
  cloudSyncPendingAggregate = aggregate;
  cloudSyncPending = true;
  cloudSyncRequestType = requestType;
  database.set(asyncClient, aggregatePath, aggregateData, processData, requestId);
}

bool currentCloudAggregatesNeedRefresh(uint32_t currentMillis)
{
  const bool refreshIntervalElapsed = lastCloudAggregateRefreshMillis == 0 ||
                                      currentMillis - lastCloudAggregateRefreshMillis >=
                                          CLOUD_AGGREGATE_REFRESH_INTERVAL_MS;
  const bool hourlyBucketChanged = hourlyCloudAggregate.count > 0 &&
                                   lastPublishedHourlyBucket != hourlyCloudAggregate.timestamp;
  const bool dailyBucketChanged = dailyCloudAggregate.count > 0 &&
                                  lastPublishedDailyBucket != dailyCloudAggregate.timestamp;
  const bool hourlyValuesChanged = hourlyCloudAggregate.count > 0 &&
                                   lastPublishedHourlyCount != hourlyCloudAggregate.count;
  const bool dailyValuesChanged = dailyCloudAggregate.count > 0 &&
                                  lastPublishedDailyCount != dailyCloudAggregate.count;
  return hourlyBucketChanged || dailyBucketChanged ||
         (refreshIntervalElapsed && (hourlyValuesChanged || dailyValuesChanged));
}

void prepareCurrentCloudAggregates(uint32_t currentMillis)
{
  if (!currentCloudAggregatesNeedRefresh(currentMillis)) {
    return;
  }

  if (hourlyCloudAggregate.count > 0 &&
      (lastPublishedHourlyBucket != hourlyCloudAggregate.timestamp ||
       lastPublishedHourlyCount != hourlyCloudAggregate.count)) {
    readyHourlyCloudAggregate = hourlyCloudAggregate;
    hourlyAggregateReady = true;
  }
  if (dailyCloudAggregate.count > 0 &&
      (lastPublishedDailyBucket != dailyCloudAggregate.timestamp ||
       lastPublishedDailyCount != dailyCloudAggregate.count)) {
    readyDailyCloudAggregate = dailyCloudAggregate;
    dailyAggregateReady = true;
  }
  if (hourlyAggregateReady || dailyAggregateReady) {
    lastCloudAggregateRefreshMillis = currentMillis;
  }
}

void synchronizeSDMeasurements(uint32_t currentMillis)
{
  if (!isFirebaseReady() || !sdCardReady || cloudSyncPending) {
    return;
  }

  if (cloudSyncCaughtUp && !hourlyAggregateReady && !dailyAggregateReady) {
    prepareCurrentCloudAggregates(currentMillis);
    if (!hourlyAggregateReady && !dailyAggregateReady) {
      return;
    }
  }

  if (currentMillis - lastCloudSyncAttemptMillis < cloudSyncRetryIntervalMs) {
    return;
  }
  lastCloudSyncAttemptMillis = currentMillis;

  if (hourlyAggregateReady) {
    queueCloudAggregate(readyHourlyCloudAggregate, hourlyAggregateDatabasePath,
                        CloudSyncRequestType::HourlyAggregate, "syncHourlyAggregate",
                        HOURLY_AGGREGATE_SECONDS);
    return;
  }
  if (dailyAggregateReady) {
    queueCloudAggregate(readyDailyCloudAggregate, dailyAggregateDatabasePath,
                        CloudSyncRequestType::DailyAggregate, "syncDailyAggregate",
                        DAILY_AGGREGATE_SECONDS);
    return;
  }

  Measurement measurement{};
  uint32_t nextFileOffset = cloudSyncFileOffset;
  if (readNextSDMeasurementForCloudSync(measurement, nextFileOffset)) {
    queueSDMeasurementForCloudSync(measurement, nextFileOffset);
    return;
  }

  prepareCurrentCloudAggregates(currentMillis);
  if (hourlyAggregateReady) {
    queueCloudAggregate(readyHourlyCloudAggregate, hourlyAggregateDatabasePath,
                        CloudSyncRequestType::HourlyAggregate, "syncHourlyAggregate",
                        HOURLY_AGGREGATE_SECONDS);
  } else if (dailyAggregateReady) {
    queueCloudAggregate(readyDailyCloudAggregate, dailyAggregateDatabasePath,
                        CloudSyncRequestType::DailyAggregate, "syncDailyAggregate",
                        DAILY_AGGREGATE_SECONDS);
  }
}

// --- Firebase stanja --------------------------------------------------------

void publishActivationSecret()
{
  char jsonPayload[64];
  snprintf(jsonPayload, sizeof(jsonPayload), "{\"activation_code\":\"%s\"}", activationCode);
  object_t activationSecret(jsonPayload);
  activationSecretPublishPending = true;
  database.set(asyncClient, activationSecretDatabasePath, activationSecret, processData,
               "publishActivationSecret");
}

void updateSDCardStatus()
{
  if (sdCardReady && SD.cardType() == CARD_NONE) {
    markSDCardUnavailable();
  }

  if (!sdCardReady) {
    if (initializeSDCard()) {
      sdInitializationFailures = 0;
      sdErrorReported = false;
      initializeMeasurementHistoryIndex();
      rebuildCloudAggregateState();
      cloudSyncCaughtUp = false;
    } else if (sdInitializationFailures < MAX_SD_INITIALIZATION_FAILURES) {
      ++sdInitializationFailures;
    }
  } else {
    sdInitializationFailures = 0;
    sdErrorReported = false;
  }

  const bool hasError = sdInitializationFailures >= MAX_SD_INITIALIZATION_FAILURES;
  if (hasError && !sdErrorReported) {
    Serial.println("SD card error: card was not detected after five initialization attempts.");
    sdErrorReported = true;
  }

  char jsonPayload[96];
  snprintf(jsonPayload, sizeof(jsonPayload),
           "{\"present\":%s,\"initialization_failures\":%u,\"error\":%s}",
           sdCardReady ? "true" : "false", sdInitializationFailures,
           hasError ? "true" : "false");
  object_t sdStatus(jsonPayload);
  if (isFirebaseReady()) {
    database.set(asyncClient, sdStatusDatabasePath, sdStatus, processData, "updateSDCardStatus");
  }
}

void sendFirmwareVersion()
{
  char jsonPayload[64];
  snprintf(jsonPayload, sizeof(jsonPayload), "{\"version\":\"%s\"}", FIRMWARE_VERSION);
  object_t firmwareStatus(jsonPayload);

  database.set(asyncClient, firmwareStatusDatabasePath, firmwareStatus, processData,
               "updateFirmwareVersion");
}

// --- Nadzor naprave ---------------------------------------------------------

void updateDeviceStatus()
{
  // esp_timer uporablja 64-bitni števec mikrosekund in se ne prelije kot millis().
  const Uptime uptime = getUptime();
  const String ipAddress = WiFi.localIP().toString();

  const time_t lastSeenTimestamp = time(nullptr);
  char jsonPayload[280];
  snprintf(jsonPayload, sizeof(jsonPayload),
           "{\"device_id\":\"%s\",\"ip_address\":\"%s\",\"wifi_rssi_dbm\":%d,\"uptime_days\":%llu,\"uptime_hours\":%llu,\"uptime_minutes\":%llu,\"uptime_total_minutes\":%llu,\"last_seen_timestamp\":%lu}",
           deviceId, ipAddress.c_str(), WiFi.RSSI(), static_cast<unsigned long long>(uptime.days),
           static_cast<unsigned long long>(uptime.hours), static_cast<unsigned long long>(uptime.minutes),
           static_cast<unsigned long long>(uptime.totalMinutes),
           static_cast<unsigned long>(lastSeenTimestamp));
  object_t deviceStatus(jsonPayload);

  database.set(asyncClient, deviceStatusDatabasePath, deviceStatus, processData,
               "updateDeviceStatus");
}

void sendMeasurements()
{
  Measurement measurement;
  if (!createMeasurement(measurement)) {
    return;
  }

  // NTP se lahko potrdi med enim prehodom zanke; tak zapis je že veljavna prva cloud meritev.
  if (measurement.timestamp >= MIN_VALID_UNIX_TIMESTAMP) {
    validTimeWasAvailable = true;
  }

  latestMeasurement = measurement;
  hasLatestMeasurement = true;

  char jsonPayload[192];
  snprintf(jsonPayload, sizeof(jsonPayload),
           "{\"temperature_c\":%.1f,\"humidity_percent\":%.1f,\"weight_kg\":%.2f,\"date\":\"%s\",\"time\":\"%s\",\"timestamp\":%lu}",
           measurement.temperatureC, measurement.humidityPercent, measurement.weightKg,
           measurement.date, measurement.time, static_cast<unsigned long>(measurement.timestamp));
  object_t measurements(jsonPayload);

  const bool savedToSDCard = appendToSDCard(measurement);
  if (savedToSDCard) {
    cloudSyncCaughtUp = false;
  }
  Serial.printf("Measurement: %s %s, %.1f C, %.1f %%, %.2f kg\n", measurement.date,
                measurement.time, measurement.temperatureC, measurement.humidityPercent,
                measurement.weightKg);
  if (isFirebaseReady() && measurement.timestamp >= MIN_VALID_UNIX_TIMESTAMP) {
    // SD sinhronizacija je običajna pot zgodovine; neposredni zapis je le rezerva ob napaki SD.
    if (!savedToSDCard) {
      char historyPath[DATABASE_PATH_LENGTH];
      snprintf(historyPath, sizeof(historyPath), "%s/%lu", historyDatabasePath,
               static_cast<unsigned long>(measurement.timestamp));
      database.set(asyncClient, historyPath, measurements, processData, "saveMeasurementHistory");
    }
    database.set(asyncClient, latestDatabasePath, measurements, processData, "updateLatestMeasurement");
  }
}

}  // namespace

void setup()
{
  Serial.begin(115200);
  delay(500);

  initializeWiFiEventHandlers();
  initializeSDCard();
  initializeMeasurementHistoryIndex();
  connectToWiFi();
  rebuildCloudAggregateState();
  initializeLocalWebServer();
  initializeTime();
  sslClient.setInsecure();
  otaClient.setInsecure();

  initializeApp(asyncClient, app, getAuth(noAuth));
  app.getApp<RealtimeDatabase>(database);
  database.url(FIREBASE_DATABASE_URL);

  Serial.println("Firebase initialized.");
}

void loop()
{
  localServer.handleClient();
  updateWiFiConnectionAttempt();
  maintainProvisioningAccessPoint();
  maintainNetworkConnection();
  if (stationConnected) {
    app.loop();
  }

  processQueuedFirmwareUpdateCommand();

  // Vsako opravilo uporablja svoj interval, zato meritve ne blokirajo spremljanja stanja naprave.
  const uint32_t currentMillis = millis();
  const bool validTimeAvailable = time(nullptr) >= MIN_VALID_UNIX_TIMESTAMP;

  // Če prva meritev nastane pred NTP sinhronizacijo, po pridobitvi pravega časa
  // ustvarimo še eno takojšnjo meritev, primerno za SD dnevnik in Firebase.
  if (validTimeAvailable && !validTimeWasAvailable) {
    validTimeWasAvailable = true;
    lastMeasurementMillis = 0;
    Serial.println("Time synchronized; sending the first timestamped measurement.");
  } else if (!validTimeAvailable) {
    validTimeWasAvailable = false;
  }

  if (isFirebaseReady() && !activationSecretPublishPending &&
      (lastActivationSecretAttemptMillis == 0 ||
       currentMillis - lastActivationSecretAttemptMillis >= ACTIVATION_SECRET_REFRESH_INTERVAL_MS)) {
    lastActivationSecretAttemptMillis = currentMillis;
    publishActivationSecret();
  }

  if (isFirebaseReady() && !firmwareVersionReported) {
    firmwareVersionReported = true;
    sendFirmwareVersion();
  }

  if (currentMillis - lastSDStatusMillis >= SD_STATUS_INTERVAL_MS) {
    lastSDStatusMillis = currentMillis;
    updateSDCardStatus();
  }

  // Prvi odziv po NTP sinhronizaciji pošljemo takoj, nato pa enkrat na minuto.
  if (isFirebaseReady() && validTimeAvailable &&
      (lastDeviceStatusMillis == 0 || currentMillis - lastDeviceStatusMillis >= DEVICE_STATUS_INTERVAL_MS)) {
    lastDeviceStatusMillis = currentMillis;
    updateDeviceStatus();
  }

  if (isFirebaseReady() && validTimeAvailable && !firmwareCommandPending && !firmwareCommandQueued &&
      !firmwareUpdateInProgress &&
      (lastFirmwareCommandCheckMillis == 0 ||
       currentMillis - lastFirmwareCommandCheckMillis >= FIRMWARE_COMMAND_INTERVAL_MS)) {
    lastFirmwareCommandCheckMillis = currentMillis;
    requestFirmwareUpdateCommand();
  }

  synchronizeSDMeasurements(currentMillis);

  if (lastMeasurementMillis == 0 || currentMillis - lastMeasurementMillis >= MEASUREMENT_INTERVAL_MS) {
    lastMeasurementMillis = currentMillis;
    sendMeasurements();
  }

}
