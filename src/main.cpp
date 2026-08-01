#define ENABLE_DATABASE

#include <Arduino.h>
#include <esp_timer.h>
#include <FirebaseClient.h>
#include <HTTPClient.h>
#include <LittleFS.h>
#include <SD.h>
#include <SPI.h>
#include <Update.h>
#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <WebServer.h>
#include <mbedtls/sha256.h>
#include <time.h>

#include "secrets.h"
#include "version.h"

namespace {

// Časovni intervali posameznih opravil v glavni zanki.
constexpr uint32_t MEASUREMENT_INTERVAL_MS = 10'000;
constexpr uint32_t SD_STATUS_INTERVAL_MS = 60'000;
constexpr uint32_t DEVICE_STATUS_INTERVAL_MS = 60'000;
constexpr uint32_t FIRMWARE_COMMAND_INTERVAL_MS = 30'000;
constexpr uint8_t MAX_SD_INITIALIZATION_FAILURES = 5;

// Firebase struktura za en panj; ob podpori več panjev se spremeni skupni koren poti.
constexpr char LATEST_DATABASE_PATH[] = "/hives/panj_1/latest";
constexpr char HISTORY_DATABASE_PATH[] = "/hives/panj_1/measurements";
constexpr char SD_STATUS_DATABASE_PATH[] = "/hives/panj_1/status/sd_card";
constexpr char DEVICE_STATUS_DATABASE_PATH[] = "/hives/panj_1/status/device";
constexpr char FIRMWARE_STATUS_DATABASE_PATH[] = "/hives/panj_1/status/firmware";
constexpr char OTA_STATUS_DATABASE_PATH[] = "/hives/panj_1/status/ota";
constexpr char OTA_COMMAND_DATABASE_PATH[] = "/hives/panj_1/commands/firmware_update";
constexpr char SD_LOG_PATH[] = "/measurements.csv";

// GitHub Release vedno vsebuje manifest.json in firmware.bin za najnovejšo izdajo.
constexpr char OTA_MANIFEST_URL[] = "https://github.com/RobertBarbo/PametniCebelnjak/releases/latest/download/manifest.json";
constexpr size_t OTA_DOWNLOAD_BUFFER_SIZE = 2048;

constexpr int SD_CS_PIN = 10;
constexpr int SD_MOSI_PIN = 11;
constexpr int SD_SCK_PIN = 12;
constexpr int SD_MISO_PIN = 13;

constexpr char TIMEZONE[] = "CET-1CEST,M3.5.0/2,M10.5.0/3";
constexpr char NTP_SERVER_1[] = "pool.ntp.org";
constexpr char NTP_SERVER_2[] = "time.google.com";
constexpr size_t MAX_LOCAL_HISTORY_BUCKETS = 366;
constexpr time_t MAX_LOCAL_HISTORY_DURATION_SECONDS = 366 * 24 * 60 * 60;
constexpr time_t MIN_VALID_UNIX_TIMESTAMP = 1'700'000'000;

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

struct FirmwareManifest {
  char version[24];
  String firmwareUrl;
  char sha256[65];
  size_t size;
};

// Firebase uporablja asinhrone zahteve, da beleženje ne ustavi glavne zanke.
WiFiClientSecure sslClient;
WiFiClientSecure otaClient;
using AsyncClient = AsyncClientClass;
AsyncClient asyncClient(sslClient);
SPIClass sdSpi(FSPI);
WebServer localServer(80);

NoAuth noAuth;
FirebaseApp app;
RealtimeDatabase database;

uint32_t lastMeasurementMillis = 0;
uint32_t lastSDStatusMillis = 0;
uint32_t lastDeviceStatusMillis = 0;
uint32_t lastFirmwareCommandCheckMillis = 0;
bool sdCardReady = false;
uint8_t sdInitializationFailures = 0;
bool sdErrorReported = false;
bool firmwareVersionReported = false;
bool firmwareCommandPending = false;
Measurement latestMeasurement{};
bool hasLatestMeasurement = false;
HistoryBucket localHistoryBuckets[MAX_LOCAL_HISTORY_BUCKETS]{};

void processFirmwareUpdateCommand(const String &payload);

// Obdelava zaključkov vseh asinhronih Firebase zahtev.
void processData(AsyncResult &result)
{
  if (!result.isResult()) {
    return;
  }

  if (result.isError()) {
    Firebase.printf("Firebase error (%s): %s (%d)\n", result.uid().c_str(),
                    result.error().message().c_str(), result.error().code());

    // Neuspešen asinhroni zapis verzije znova poskusimo v naslednji glavni zanki.
    if (result.uid() == "updateFirmwareVersion") {
      firmwareVersionReported = false;
    }
    if (result.uid() == "readFirmwareUpdateCommand") {
      firmwareCommandPending = false;
    }
    return;
  }

  if (result.available()) {
    if (result.uid() == "readFirmwareUpdateCommand") {
      firmwareCommandPending = false;
      processFirmwareUpdateCommand(result.payload());
      return;
    }
    Firebase.printf("Firebase write complete: %s\n", result.uid().c_str());
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

void connectToWiFi()
{
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  Serial.printf("Connecting to Wi-Fi '%s'", WIFI_SSID);
  while (WiFi.status() != WL_CONNECTED) {
    delay(300);
    Serial.print('.');
  }

  Serial.printf("\nConnected. IP address: %s\n", WiFi.localIP().toString().c_str());
}

void initializeTime()
{
  configTzTime(TIMEZONE, NTP_SERVER_1, NTP_SERVER_2);
  Serial.println("Synchronizing time with NTP...");
}

Uptime getUptime()
{
  const uint64_t totalMinutes = static_cast<uint64_t>(esp_timer_get_time()) / (60ULL * 1'000'000ULL);
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
  database.set(asyncClient, OTA_STATUS_DATABASE_PATH, otaStatus, processData, "updateOtaStatus");
}

void clearFirmwareUpdateCommand()
{
  database.remove(asyncClient, OTA_COMMAND_DATABASE_PATH, processData, "clearFirmwareUpdateCommand");
}

bool loadFirmwareManifest(FirmwareManifest &manifest, String &errorMessage)
{
  HTTPClient http;
  http.setFollowRedirects(HTTPC_STRICT_FOLLOW_REDIRECTS);
  http.setTimeout(15'000);
  if (!http.begin(otaClient, OTA_MANIFEST_URL)) {
    errorMessage = "Povezave do OTA manifesta ni bilo mogoče odpreti.";
    return false;
  }

  const int responseCode = http.GET();
  if (responseCode != HTTP_CODE_OK) {
    errorMessage = "Manifest OTA ni dosegljiv.";
    http.end();
    return false;
  }

  const bool manifestValid = parseFirmwareManifest(http.getString(), manifest);
  http.end();
  if (!manifestValid) {
    errorMessage = "Manifest OTA ima neveljavno obliko.";
    return false;
  }
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
  HTTPClient http;
  http.setFollowRedirects(HTTPC_STRICT_FOLLOW_REDIRECTS);
  http.setTimeout(20'000);
  if (!http.begin(otaClient, manifest.firmwareUrl)) {
    errorMessage = "Povezave do firmware datoteke ni bilo mogoče odpreti.";
    return false;
  }

  const int responseCode = http.GET();
  if (responseCode != HTTP_CODE_OK) {
    errorMessage = "Firmware datoteka ni dosegljiva.";
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
  uint8_t buffer[OTA_DOWNLOAD_BUFFER_SIZE];
  size_t downloaded = 0;

  while (downloaded < manifest.size) {
    const size_t available = stream->available();
    if (available == 0) {
      if (!http.connected()) break;
      delay(1);
      continue;
    }

    const size_t bytesToRead = min(available, min(sizeof(buffer), manifest.size - downloaded));
    const size_t bytesRead = stream->readBytes(buffer, bytesToRead);
    if (bytesRead == 0 || Update.write(buffer, bytesRead) != bytesRead) {
      Update.abort();
      mbedtls_sha256_free(&sha256Context);
      http.end();
      errorMessage = "Zapis OTA firmware-a ni uspel.";
      return false;
    }
    mbedtls_sha256_update(&sha256Context, buffer, bytesRead);
    downloaded += bytesRead;
  }

  uint8_t actualHash[32];
  mbedtls_sha256_finish(&sha256Context, actualHash);
  mbedtls_sha256_free(&sha256Context);
  http.end();

  if (downloaded != manifest.size || sha256ToHex(actualHash) != manifest.sha256) {
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
  if (payload == "null" || payload.length() == 0) return;

  String action;
  String targetVersion;
  if (!extractJsonString(payload, "action", action) || !extractJsonString(payload, "target_version", targetVersion)) {
    reportOtaStatus("error", "", "Neveljaven OTA ukaz.");
    clearFirmwareUpdateCommand();
    return;
  }

  if (action == "ignore") {
    reportOtaStatus("ignored", targetVersion.c_str(), "Posodobitev je bila prezrta.");
    clearFirmwareUpdateCommand();
    return;
  }

  if (action != "install" || !isNewerFirmwareVersion(targetVersion.c_str(), FIRMWARE_VERSION)) {
    clearFirmwareUpdateCommand();
    return;
  }

  reportOtaStatus("installing", targetVersion.c_str(), "Prenašam in preverjam firmware.");
  FirmwareManifest manifest{};
  String errorMessage;
  if (!loadFirmwareManifest(manifest, errorMessage) || String(manifest.version) != targetVersion ||
      !isNewerFirmwareVersion(manifest.version, FIRMWARE_VERSION) ||
      !downloadAndInstallFirmware(manifest, errorMessage)) {
    reportOtaStatus("error", targetVersion.c_str(), errorMessage.c_str());
    clearFirmwareUpdateCommand();
    return;
  }

  // Novo sliko aktivira šele Update.end(true); ob naslednjem zagonu firmware pošlje novo verzijo v Firebase.
  ESP.restart();
}

void requestFirmwareUpdateCommand()
{
  firmwareCommandPending = true;
  database.get(asyncClient, OTA_COMMAND_DATABASE_PATH, processData, false, "readFirmwareUpdateCommand");
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
  SD.end();
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
  localServer.sendHeader("Cache-Control", "no-store");
  localServer.streamFile(asset, contentTypeForPath(path));
  asset.close();
  return true;
}

void sendLocalStatus()
{
  const Uptime uptime = getUptime();
  const String ipAddress = WiFi.localIP().toString();
  const time_t lastSeenTimestamp = time(nullptr);
  char measurementJson[220];
  if (hasLatestMeasurement) {
    snprintf(measurementJson, sizeof(measurementJson),
             "{\"temperature_c\":%.1f,\"humidity_percent\":%.1f,\"weight_kg\":%.2f,\"date\":\"%s\",\"time\":\"%s\",\"timestamp\":%lu}",
             latestMeasurement.temperatureC, latestMeasurement.humidityPercent, latestMeasurement.weightKg,
             latestMeasurement.date, latestMeasurement.time, static_cast<unsigned long>(latestMeasurement.timestamp));
  } else {
    snprintf(measurementJson, sizeof(measurementJson), "null");
  }

  char jsonPayload[620];
  snprintf(jsonPayload, sizeof(jsonPayload),
           "{\"latest\":%s,\"device\":{\"ip_address\":\"%s\",\"wifi_rssi_dbm\":%d,\"uptime_days\":%llu,\"uptime_hours\":%llu,\"uptime_minutes\":%llu,\"last_seen_timestamp\":%lu},\"sd_card\":{\"present\":%s,\"initialization_failures\":%u,\"error\":%s},\"firmware\":{\"version\":\"%s\"}}",
           measurementJson, ipAddress.c_str(), WiFi.RSSI(), static_cast<unsigned long long>(uptime.days),
           static_cast<unsigned long long>(uptime.hours), static_cast<unsigned long long>(uptime.minutes),
           static_cast<unsigned long>(lastSeenTimestamp),
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

  File logFile = SD.open(SD_LOG_PATH, FILE_READ);
  if (!logFile) {
    localServer.send(404, "application/json", "{\"error\":\"Measurement log is unavailable\"}");
    return;
  }

  time_t firstTimestamp;
  time_t lastTimestamp;
  uint32_t bucketDuration;
  if (!getLocalHistoryWindow(firstTimestamp, lastTimestamp, bucketDuration)) {
    localServer.send(400, "application/json", "{\"error\":\"Invalid history time range\"}");
    return;
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
    if (sscanf(line, "%*10[^,],%*8[^,],%lu,%f,%f,%f", &timestamp, &temperature, &humidity, &weight) != 4 ||
        timestamp < static_cast<unsigned long>(firstTimestamp) ||
        timestamp > static_cast<unsigned long>(lastTimestamp)) continue;

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
  localServer.on("/measurements.csv", HTTP_GET, serveMeasurementLog);
  localServer.onNotFound([]() {
    if (!serveLocalAsset(localServer.uri())) localServer.send(404, "text/plain", "Not found");
  });
  localServer.on("/", HTTP_GET, []() { serveLocalAsset("/"); });
  localServer.begin();
  Serial.printf("Local dashboard: http://%s/\n", WiFi.localIP().toString().c_str());
}

// --- Meritve ----------------------------------------------------------------

bool createMeasurement(Measurement &measurement)
{
  struct tm timeInfo;
  if (!getLocalTime(&timeInfo)) {
    Serial.println("Time is not synchronized yet; measurement skipped.");
    return false;
  }

  measurement.temperatureC = simulatedTemperatureC();
  measurement.humidityPercent = simulatedHumidityPercent();
  measurement.weightKg = simulatedWeightKg();
  measurement.timestamp = time(nullptr);
  strftime(measurement.date, sizeof(measurement.date), "%Y-%m-%d", &timeInfo);
  strftime(measurement.time, sizeof(measurement.time), "%H:%M:%S", &timeInfo);
  return true;
}

void appendToSDCard(const Measurement &measurement)
{
  if (!sdCardReady) {
    return;
  }

  File logFile = SD.open(SD_LOG_PATH, FILE_APPEND);
  if (!logFile) {
    Serial.println("Could not open measurements.csv for writing.");
    markSDCardUnavailable();
    return;
  }

  logFile.printf("%s,%s,%lu,%.1f,%.1f,%.2f\n", measurement.date, measurement.time,
                 static_cast<unsigned long>(measurement.timestamp), measurement.temperatureC,
                 measurement.humidityPercent, measurement.weightKg);
  logFile.close();
}

// --- Firebase stanja --------------------------------------------------------

void updateSDCardStatus()
{
  if (sdCardReady && SD.cardType() == CARD_NONE) {
    markSDCardUnavailable();
  }

  if (!sdCardReady) {
    if (initializeSDCard()) {
      sdInitializationFailures = 0;
      sdErrorReported = false;
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
  database.set(asyncClient, SD_STATUS_DATABASE_PATH, sdStatus, processData, "updateSDCardStatus");
}

void sendFirmwareVersion()
{
  char jsonPayload[64];
  snprintf(jsonPayload, sizeof(jsonPayload), "{\"version\":\"%s\"}", FIRMWARE_VERSION);
  object_t firmwareStatus(jsonPayload);

  database.set(asyncClient, FIRMWARE_STATUS_DATABASE_PATH, firmwareStatus, processData,
               "updateFirmwareVersion");
}

// --- Nadzor naprave ---------------------------------------------------------

void updateDeviceStatus()
{
  // esp_timer uporablja 64-bitni števec mikrosekund in se ne prelije kot millis().
  const Uptime uptime = getUptime();
  const String ipAddress = WiFi.localIP().toString();

  const time_t lastSeenTimestamp = time(nullptr);
  char jsonPayload[232];
  snprintf(jsonPayload, sizeof(jsonPayload),
           "{\"ip_address\":\"%s\",\"wifi_rssi_dbm\":%d,\"uptime_days\":%llu,\"uptime_hours\":%llu,\"uptime_minutes\":%llu,\"uptime_total_minutes\":%llu,\"last_seen_timestamp\":%lu}",
           ipAddress.c_str(), WiFi.RSSI(), static_cast<unsigned long long>(uptime.days),
           static_cast<unsigned long long>(uptime.hours), static_cast<unsigned long long>(uptime.minutes),
           static_cast<unsigned long long>(uptime.totalMinutes),
           static_cast<unsigned long>(lastSeenTimestamp));
  object_t deviceStatus(jsonPayload);

  database.set(asyncClient, DEVICE_STATUS_DATABASE_PATH, deviceStatus, processData,
               "updateDeviceStatus");
}

void sendMeasurements()
{
  Measurement measurement;
  if (!createMeasurement(measurement)) {
    return;
  }

  latestMeasurement = measurement;
  hasLatestMeasurement = true;

  char jsonPayload[192];
  snprintf(jsonPayload, sizeof(jsonPayload),
           "{\"temperature_c\":%.1f,\"humidity_percent\":%.1f,\"weight_kg\":%.2f,\"date\":\"%s\",\"time\":\"%s\",\"timestamp\":%lu}",
           measurement.temperatureC, measurement.humidityPercent, measurement.weightKg,
           measurement.date, measurement.time, static_cast<unsigned long>(measurement.timestamp));
  object_t measurements(jsonPayload);

  char historyPath[96];
  snprintf(historyPath, sizeof(historyPath), "%s/%lu", HISTORY_DATABASE_PATH,
           static_cast<unsigned long>(measurement.timestamp));

  appendToSDCard(measurement);
  Serial.printf("Sending: %s %s, %.1f C, %.1f %%, %.2f kg\n", measurement.date,
                measurement.time, measurement.temperatureC, measurement.humidityPercent,
                measurement.weightKg);
  database.set(asyncClient, historyPath, measurements, processData, "saveMeasurementHistory");
  database.set(asyncClient, LATEST_DATABASE_PATH, measurements, processData, "updateLatestMeasurement");
}

}  // namespace

void setup()
{
  Serial.begin(115200);
  delay(500);

  initializeSDCard();
  connectToWiFi();
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
  app.loop();

  // Vsako opravilo uporablja svoj interval, zato meritve ne blokirajo spremljanja stanja naprave.
  const uint32_t currentMillis = millis();
  if (app.ready() && !firmwareVersionReported) {
    firmwareVersionReported = true;
    sendFirmwareVersion();
  }

  if (app.ready() && currentMillis - lastSDStatusMillis >= SD_STATUS_INTERVAL_MS) {
    lastSDStatusMillis = currentMillis;
    updateSDCardStatus();
  }

  // Prvi odziv po NTP sinhronizaciji pošljemo takoj, nato pa enkrat na minuto.
  if (app.ready() && time(nullptr) >= MIN_VALID_UNIX_TIMESTAMP &&
      (lastDeviceStatusMillis == 0 || currentMillis - lastDeviceStatusMillis >= DEVICE_STATUS_INTERVAL_MS)) {
    lastDeviceStatusMillis = currentMillis;
    updateDeviceStatus();
  }

  if (app.ready() && time(nullptr) >= MIN_VALID_UNIX_TIMESTAMP && !firmwareCommandPending &&
      (lastFirmwareCommandCheckMillis == 0 ||
       currentMillis - lastFirmwareCommandCheckMillis >= FIRMWARE_COMMAND_INTERVAL_MS)) {
    lastFirmwareCommandCheckMillis = currentMillis;
    requestFirmwareUpdateCommand();
  }

  if (app.ready() && currentMillis - lastMeasurementMillis >= MEASUREMENT_INTERVAL_MS) {
    lastMeasurementMillis = currentMillis;
    sendMeasurements();
  }
}
