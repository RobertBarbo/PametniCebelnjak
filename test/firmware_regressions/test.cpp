// Regresijski scenariji uporabljajo dejanske funkcije iz main.cpp in nadomestne IO vmesnike.
#include <algorithm>
#include <cassert>
#include <cmath>
#include <cstdio>
#include <cstring>
#include <ctime>
#include <functional>
#include <map>
#include <memory>
#include <new>
#include <sstream>
#include <string>
#include <vector>
#include "load_cell_sampling.h"
#include "control_stream_root.h"
#include "control_ack_state.h"
using std::min;
using std::isfinite;

class String : public std::string {
 public:
  using std::string::string;
  String() = default;
  String(const std::string &s) : std::string(s) {}
  String(uint32_t n, int) { std::ostringstream s; s << std::hex << n; assign(s.str()); }
  bool isEmpty() const { return empty(); }
};
constexpr int HEX = 16, FILE_READ = 0, FILE_WRITE = 1;
int openHandles = 0;
struct Handle {
  std::shared_ptr<std::string> contents;
  size_t position = 0;
  explicit Handle(std::shared_ptr<std::string> s) : contents(s) { ++openHandles; }
  ~Handle() { --openHandles; }
};
struct File {
  std::shared_ptr<Handle> handle;
  explicit operator bool() const { return bool(handle); }
  bool seek(uint32_t n) { if (!handle || n > handle->contents->size()) return false; handle->position = n; return true; }
  size_t position() const { return handle->position; }
  bool available() const { return handle && position() < handle->contents->size(); }
  size_t readBytesUntil(char c, char *dst, size_t max) {
    size_t n = 0;
    while (available() && n < max) {
      char next = (*handle->contents)[handle->position++];
      if (next == c) break;
      dst[n++] = next;
    }
    return n;
  }
  size_t write(uint8_t *data, size_t n) { handle->contents->append(reinterpret_cast<char *>(data), n); return n; }
  void close() { handle.reset(); }
};
struct FakeSD {
  std::map<std::string, std::shared_ptr<std::string>> files;
  bool failRename = false;
  bool exists(const String &path) { return path == "/" || files.count(path); }
  File open(const String &path, int mode) {
    if (!files.count(path)) {
      if (mode == FILE_READ) return {};
      files[path] = std::make_shared<std::string>();
    }
    File result; result.handle = std::make_shared<Handle>(files[path]); return result;
  }
  bool remove(const String &path) { return files.erase(path) > 0; }
  bool rename(const String &from, const String &to) {
    if (failRename || !files.count(from) || files.count(to)) return false;
    files[to] = files[from]; files.erase(from); return true;
  }
} SD;
struct AsyncWebServerRequest {
  void *_tempObject = nullptr;
  bool authorized = true;
  int response = 0;
  std::function<void()> disconnected;
  String arg(const char *key) { return strcmp(key, "path") == 0 ? "/" : "0"; }
  void onDisconnect(std::function<void()> f) { disconnected = f; }
  void disconnect() { if (disconnected) disconnected(); }
};
struct { template<typename... T> void printf(const char *, T...) {} void println(const char *) {} } Serial;
uint32_t nowMillis = 1000;
uint32_t millis() { return nowMillis; }
bool sdCardReady = true, firmwareUpdateInProgress = false;
bool localElegantOtaSessionActive = false, arduinoOtaActive = false;
struct { bool isRunning() { return false; } } Update;
bool authenticateSdCardRequest(AsyncWebServerRequest *r) { return r->authorized; }
bool normalizeSdCardPath(const String &s, String &out, bool) { out = s; return true; }
bool isValidSdCardFileName(const String &s) { return !s.empty(); }
void sendSdCardError(AsyncWebServerRequest *r, int code, const char *) { r->response = code; }
void sendLocalJsonResponse(AsyncWebServerRequest *r, int code, const char *) { r->response = code; }
constexpr size_t SD_CARD_PATH_MAX_LENGTH = 192;
#include "firmware_types.inc"

constexpr uint32_t HOURLY_AGGREGATE_SECONDS = 3600, DAILY_AGGREGATE_SECONDS = 86400;
constexpr uint8_t RECONCILIATION_MEASUREMENTS_PER_REQUEST = 32;
constexpr uint16_t DAILY_RECONCILIATION_LINES_PER_LOOP = 128;
constexpr uint32_t DAILY_RECONCILIATION_LOOP_BUDGET_MS = 8;
const char *SD_LOG_PATH = "/measurements.csv";
uint32_t dailyReconciliationFileOffset = 0, dailyReconciliationSnapshotFileSize = 0;
uint32_t dailyReconciliationPrefixChecksum = 0, dailyReconciliationDayStartOffset = 0;
uint32_t dailyReconciliationMeasurementsToTransfer = 0, dailyReconciliationMeasurementsUploaded = 0;
uint16_t dailyReconciliationPrefixMeasurementsRead = 0;
Measurement reconciliationPendingMeasurements[RECONCILIATION_MEASUREMENTS_PER_REQUEST];
uint8_t reconciliationPendingMeasurementCount = 0;
MeasurementAggregate reconciliationHourlyAggregate, readyReconciliationHourlyAggregate;
bool reconciliationHourlyAggregateReady = false;
CloudReconciliationState cloudReconciliationState = CloudReconciliationState::ReconcilingDays;
uint16_t dailyReconciliationCurrentIndex = 0, dailyReconciliationManifestCount = 1;
uint32_t dailyReconciliationPendingFileOffset = 0;
bool dailyReconciliationPendingCompletesDay = false, dailyReconciliationDayRawComplete = false;
enum class CloudSyncRequestType { ReconciliationMeasurement, ReconciliationHourlyAggregate, ReconciliationDailyAggregate };
void completeCurrentReconciliationDay() {}
// CSV parser in hash nista predmet teh popravkov; testne vrstice vsebujejo samo čas.
bool parseMeasurementCsvLine(const char *line, Measurement &m) {
  if (*line < '0' || *line > '9') return false;
  m.timestamp = std::stoll(line); m.bme680Valid = true; m.temperatureC = 20;
  return true;
}
uint32_t updateMeasurementChecksum(uint32_t checksum, const Measurement &m) { return checksum + uint32_t(m.timestamp); }

bool historyDeletionQueued = false, historyDeletionRequestPending = false, cloudSyncPending = false;
HistoryDeletionStep historyDeletionStep = HistoryDeletionStep::ReportQueued;
int cancelledReconciliations = 0, deletionReports = 0, deletedLogs = 0;
File reconciliationFile;
bool cloudHistoryReconciliationIsActive() {
  return cloudReconciliationState == CloudReconciliationState::BuildingLocalIndex ||
         cloudReconciliationState == CloudReconciliationState::ReadingCloudIndex ||
         cloudReconciliationState == CloudReconciliationState::ReconcilingDays;
}
void resetCloudHistoryReconciliation() { ++cancelledReconciliations; reconciliationFile.close(); }
void markCloudHistoryReconciliationError() { cloudReconciliationState = CloudReconciliationState::Error; }
bool isFirebaseTransportReady() { return true; }
void reportHistoryDeletionStatus(const char *, const char *, const char *) { ++deletionReports; historyDeletionRequestPending = true; }
bool deleteMeasurementHistoryFromSD() { assert(!reconciliationFile); ++deletedLogs; return true; }
const char *latestDatabasePath = "latest", *historyDatabasePath = "measurements";
const char *hourlyAggregateDatabasePath = "hourly", *dailyAggregateDatabasePath = "daily";
void queueHistoryDeletionRemove(const char *, const char *) { historyDeletionRequestPending = true; }
void clearControlCommand(const char *) {}
uint32_t cloudSyncRequestStartedMillis = 1000;
constexpr uint32_t CLOUD_SYNC_REQUEST_MISSING_GRACE_MS = 3000, CLOUD_SYNC_REQUEST_TIMEOUT_MS = 20000;
struct { size_t tasks = 0; size_t taskCount() { return tasks; } } asyncClient;
int cancelledRequests = 0;
void pauseFirebaseRequestsAfterNetworkError(int) {}
void cancelPendingFirebaseTasks(const char *) { ++cancelledRequests; asyncClient.tasks = 0; }
void markCloudSyncFailure() { cloudSyncPending = false; }

enum class LoadCellSamplingMode { Measuring, Confirming, Taring };
LoadCellSamplingMode loadCellSamplingMode = LoadCellSamplingMode::Measuring;
bool loadCellReferenceAvailable = false, loadCellCandidateAvailable = false;
float lastLoadCellWeightKg = 0, loadCellCandidateWeightKg = 0;
constexpr float HX711_MAX_STEP_CHANGE_KG = 5, HX711_STEP_CONFIRM_TOLERANCE_KG = 1;
constexpr int HX711_DOUT_PIN = 1, HX711_SCK_PIN = 2, LOW = 0, HIGH = 1;
int loadCellReadMux = 0, criticalDepth = 0, pulses = 0, readIndex = 0;
bool adcReady = true;
uint32_t adcBits = 0;
void portENTER_CRITICAL(int *) { ++criticalDepth; }
void portEXIT_CRITICAL(int *) { --criticalDepth; }
void delayMicroseconds(int) {}
void digitalWrite(int, int level) { assert(criticalDepth == 1); if (level == HIGH) ++pulses; }
int digitalRead(int) {
  assert(criticalDepth == 1);
  if (readIndex++ == 0) return adcReady ? LOW : HIGH;
  return (adcBits >> (24 - (readIndex - 1))) & 1;
}
bool loadCellReady = true, loadCellTareQueued = false, loadCellCachedWeightValid = false;
bool loadCellArchiveAwaitingFirstSample = false;
bool loadCellStartupSampling = false, loadCellAutomaticTare = false, nvsWritable = true;
float loadCellCachedWeightKg = 0;
uint32_t loadCellCachedWeightMillis = 0, lastMeasurementMillis = 1;
constexpr uint32_t HX711_CACHE_MAX_AGE_MS = 15000, HX711_STARTUP_TIMEOUT_MS = 1000, HX711_READY_TIMEOUT_MS = 250;
constexpr uint8_t HX711_READ_SAMPLES = 5, HX711_TARE_SAMPLES = 20;
LoadCellSampleWindow loadCellSampleWindow;
int loadCellSamplerMux = 0;
void *loadCellSamplerTaskHandle = nullptr;
LoadCellSamplerResult loadCellSamplerResult;
uint32_t loadCellSamplerGeneration = 1, loadCellSamplerProcessedSequence = 0;
uint32_t loadCellSamplerTimeouts = 0, loadCellSamplerLastAverageMillis = 0;
uint8_t loadCellSamplerRequestedSamples = HX711_READ_SAMPLES;
bool loadCellSamplerStopAfterResult = false;
LoadCellTareState loadCellTareState = LoadCellTareState::Idle;
ComponentStatus loadCellStatus;
struct {
  int32_t offset = 77;
  float scale = 1;
  int32_t get_offset() { return offset; }
  void set_offset(int32_t n) { offset = n; }
  float get_scale() { return scale; }
} loadCell;
int nvsWrites = 0;
bool storeLoadCellOffset(int32_t) { ++nvsWrites; return nvsWritable; }
void reportLoadCellTareStatus(const char *) {}
void reportComponentFailure(ComponentStatus &s, const char *, const char *) { ++s.consecutiveFailures; }
void reportComponentSuccess(ComponentStatus &s, const char *) { s.consecutiveFailures = 0; }
ComponentHealth componentHealth(const ComponentStatus &s) { return s.consecutiveFailures >= 5 ? ComponentHealth::Error : ComponentHealth::Ok; }
constexpr uint32_t HX711_ARCHIVE_RETRY_MS = 2000;
constexpr time_t MIN_VALID_UNIX_TIMESTAMP = 1700000000;
Measurement pendingArchiveMeasurement, latestMeasurement, archivedMeasurement;
uint32_t pendingArchiveStartedMillis = 0, pendingArchiveCycleMillis = 0;
bool pendingArchiveMeasurementActive = false, archiveRefreshAttempted = false;
bool hasLatestMeasurement = false, latestMeasurementUploadPending = false;
int archivedMeasurements = 0;
void archiveMeasurement(const Measurement &measurement, uint32_t) {
  archivedMeasurement = measurement;
  ++archivedMeasurements;
  archiveRefreshAttempted = false;
}
#include "firmware_functions.inc"

void testControlRoot() {
  std::vector<std::string> commands, settings;
  int resets = 0;
  auto dispatch = [&](const std::string &payload, bool put = true) {
    return processControlRootEvent(payload.c_str(), put,
      [&](const char *s) { settings.emplace_back(s); },
      [&](const char *s) { commands.emplace_back(s); }, [&]() { ++resets; });
  };
  assert(dispatch(R"({"ack":{"request_id":"old"},"command":{"action":"sync_ntp","request_id":"new"},"settings":{"measurement_interval_seconds":60}})"));
  assert(commands.size() == 1 && commands[0].find("old") == std::string::npos);
  assert(commands[0].find("new") != std::string::npos && settings.size() == 1);
  assert(dispatch(R"({"ack":{"request_id":"old"}})", false));
  assert(commands.size() == 1 && resets == 0);
  assert(dispatch(R"({"ack":{"request_id":"old"},"command":null})", false) && resets == 1);
  assert(dispatch("{}") && resets == 2);
  assert(dispatch("null") && resets == 3);
  assert(!dispatch("{broken") && !dispatch("[]") && !dispatch("{} garbage"));
  std::string large = "{\"ack\":{\"text\":\"" + std::string(6000, 'a') +
      "\"},\"command\":{\"request_id\":\"fresh\",\"action\":\"sync_ntp\"}}";
  assert(dispatch(large) && commands.back().size() < 100);
  assert(dispatch(R"({"command":{"request_id":"quoted\"id","action":"sync_ntp"},"ack":{"request_id":"old"}})"));
  cJSON *parsed = cJSON_Parse(commands.back().c_str());
  assert(std::string(cJSON_GetObjectItemCaseSensitive(parsed, "request_id")->valuestring) == "quoted\"id");
  cJSON_Delete(parsed);
  puts("H-05: ACK, PUT/PATCH/null, neveljaven JSON, velik ACK in JSON escaping: OK");
}

void testLoadCell() {
  // Izpad pred poljubnim vzorcem običajnega branja in 20-vzorčnega tariranja.
  for (uint8_t count : {5, 20}) for (uint8_t stop = 0; stop < count; ++stop) {
    LoadCellSampleWindow window; window.begin(1000, count);
    uint32_t now = 1000; int32_t average = 987;
    for (uint8_t n = 0; n < stop; ++n) {
      now += 100;
      assert(window.poll(now, 250, [](int32_t &s) { s = 10; return true; }, average) == SampleProgress::Pending);
    }
    int calls = 0;
    auto missing = [&](int32_t &) { ++calls; return false; };
    assert(window.poll(now + 249, 250, missing, average) == SampleProgress::Pending);
    assert(window.poll(now + 250, 250, missing, average) == SampleProgress::Timeout);
    assert(calls == 2 && average == 987);
  }
  LoadCellSampleWindow window; int32_t average = 0;
  window.begin(UINT32_MAX - 99, 1);
  assert(window.poll(149, 250, [](int32_t &) { return false; }, average) == SampleProgress::Pending);
  assert(window.poll(150, 250, [](int32_t &) { return false; }, average) == SampleProgress::Timeout);
  window.begin(0, 20);
  for (int n = 1; n <= 20; ++n) {
    auto result = window.poll(n * 100, 250, [](int32_t &s) { s = -8388608; return true; }, average);
    assert(result == (n == 20 ? SampleProgress::Complete : SampleProgress::Pending));
  }
  assert(average == -8388608);
  for (uint32_t bits : {0U, 0x7fffffU, 0x800000U, 0xffffffU}) {
    adcBits = bits; adcReady = true; readIndex = pulses = 0;
    assert(tryReadLoadCellRaw(average) && pulses == 25 && criticalDepth == 0);
    assert(average == (bits >= 0x800000 ? int32_t(bits) - 0x1000000 : int32_t(bits)));
  }
  adcReady = false; readIndex = pulses = 0;
  assert(!tryReadLoadCellRaw(average) && pulses == 0 && criticalDepth == 0);
  float accepted = 0; resetLoadCellWeightFilter();
  assert(acceptLoadCellWeight(10, accepted));
  assert(!acceptLoadCellWeight(30, accepted));
  assert(loadCellSamplingMode == LoadCellSamplingMode::Confirming);
  assert(acceptLoadCellConfirmation(30.5F, accepted) && accepted == 30.25F);
  assert(!acceptLoadCellWeight(70, accepted));
  assert(acceptLoadCellConfirmation(30, accepted) && accepted == 30);
  auto feed = [&](bool ready, uint32_t bits, uint32_t elapsed) {
    adcReady = ready; adcBits = bits; readIndex = pulses = 0;
    nowMillis += elapsed; processLoadCellSampling();
  };
  loadCellTareQueued = true; processPendingLoadCellTare();
  assert(loadCellTareState == LoadCellTareState::Taring);
  feed(true, 100, 100); feed(false, 0, 250);
  assert(loadCellTareState == LoadCellTareState::Error && nvsWrites == 0 && loadCell.offset == 77);
  assert(!readLoadCell(accepted));
  // Neuspešen NVS zapis ohrani prejšnjo ničlo tudi po vseh 20 uspešnih vzorcih.
  nvsWritable = false; loadCellTareQueued = true; processPendingLoadCellTare();
  for (int i = 0; i < 20; ++i) feed(true, 100, 100);
  assert(loadCellTareState == LoadCellTareState::Error && loadCell.offset == 77);
  nvsWritable = true; loadCellTareQueued = true; processPendingLoadCellTare();
  for (int i = 0; i < 20; ++i) feed(true, 100, 100);
  assert(loadCellTareState == LoadCellTareState::Completed && loadCell.offset == 100);
  assert(!readLoadCell(accepted));
  for (int i = 0; i < 5; ++i) feed(true, 110, 100);
  assert(readLoadCell(accepted) && accepted == 10);
  // Kratek timeout ne sme izbrisati še svežega potrjenega odčitka.
  loadCellSampleWindow.begin(nowMillis, 1);
  feed(false, 0, HX711_READY_TIMEOUT_MS);
  assert(readLoadCell(accepted) && accepted == 10 && loadCellReady);
  // Potrjena napaka senzorja zavrne predpomnilnik takoj, tudi znotraj daljšega
  // časovnega okna, ki je namenjeno samo zastojem omrežnih opravil.
  loadCellStatus.consecutiveFailures = 5;
  assert(!readLoadCell(accepted));
  loadCellStatus.consecutiveFailures = 0;
  assert(readLoadCell(accepted));
  nowMillis += HX711_CACHE_MAX_AGE_MS + 1;
  assert(!readLoadCell(accepted));
  // Glavna zanka lahko obstane dlje od starosti cache-a, merilno opravilo pa
  // medtem objavi novo povprečje, ki ga prevzamemo ob prvem naslednjem prehodu.
  loadCellSamplerTaskHandle = reinterpret_cast<void *>(1);
  loadCellSamplerResult = {};
  loadCellSamplerGeneration = 10;
  loadCellSamplerProcessedSequence = 0;
  loadCellSamplerResult.generation = 10;
  loadCellSamplerResult.sequence = 1;
  loadCellSamplerResult.sampledMillis = nowMillis;
  loadCellSamplerResult.average = 110;
  loadCellStatus.consecutiveFailures = 0;
  processLoadCellSampling();
  assert(readLoadCell(accepted) && accepted == 10);
  assert(loadCellCachedWeightMillis == nowMillis);
  // Zastarel rezultat iz prejšnje generacije po ukazu za tariranje ni dovoljen.
  beginLoadCellSampleWindow(HX711_TARE_SAMPLES, true);
  loadCellSamplerResult.sequence = 2;
  loadCellSamplerResult.generation = 10;
  loadCellSamplerResult.average = 999;
  processLoadCellSampling();
  assert(loadCell.offset == 100);
  loadCellSamplerTaskHandle = nullptr;
  puts("H-08: izpad med vsakim vzorcem, preliv ure, ADC znak/impulzi in filter skokov: OK");
  puts("H-08: asinhrono tariranje, napaka NVS, ohranjena nicla in starost meritve: OK");
}

void testArchiveRetry() {
  nowMillis = 50000;
  loadCellReady = true;
  loadCellTareQueued = false;
  loadCellSamplingMode = LoadCellSamplingMode::Measuring;
  loadCellStatus.consecutiveFailures = 0;
  loadCellCachedWeightValid = true;
  loadCellCachedWeightKg = 58.2F;
  loadCellCachedWeightMillis = nowMillis - HX711_CACHE_MAX_AGE_MS - 1;
  pendingArchiveMeasurement = {};
  pendingArchiveMeasurement.timestamp = MIN_VALID_UNIX_TIMESTAMP + 1;
  pendingArchiveMeasurement.bme680Valid = true;
  pendingArchiveStartedMillis = nowMillis;
  pendingArchiveMeasurementActive = true;
  hasLatestMeasurement = true;
  latestMeasurement = pendingArchiveMeasurement;
  archivedMeasurements = 0;
  processPendingArchiveMeasurement();
  assert(pendingArchiveMeasurementActive && archivedMeasurements == 0);
  nowMillis += 1500;
  loadCellCachedWeightMillis = nowMillis;
  processPendingArchiveMeasurement();
  assert(!pendingArchiveMeasurementActive && archivedMeasurements == 1);
  assert(archivedMeasurement.loadCellValid && archivedMeasurement.weightKg == 58.2F);
  assert(latestMeasurement.loadCellValid && latestMeasurementUploadPending);

  pendingArchiveMeasurementActive = true;
  pendingArchiveStartedMillis = nowMillis;
  loadCellCachedWeightValid = false;
  nowMillis += HX711_ARCHIVE_RETRY_MS + 1;
  processPendingArchiveMeasurement();
  assert(archivedMeasurements == 2 && !archivedMeasurement.loadCellValid);

  pendingArchiveMeasurementActive = true;
  pendingArchiveStartedMillis = nowMillis;
  loadCellCachedWeightValid = true;
  nowMillis += 20000;
  loadCellCachedWeightMillis = nowMillis;
  lastMeasurementMillis = 1234;
  processPendingArchiveMeasurement();
  assert(!pendingArchiveMeasurementActive && archivedMeasurements == 2);
  assert(archiveRefreshAttempted && lastMeasurementMillis == 0);
  pendingArchiveMeasurementActive = true;
  pendingArchiveStartedMillis = nowMillis;
  processPendingArchiveMeasurement();
  assert(archivedMeasurements == 3 && archivedMeasurement.loadCellValid);
  puts("HX711: kratek retry, prava napaka in osvezitev po 20 s zastoju: OK");
}

void testReconciliation(uint32_t interval, uint32_t count, uint16_t prefix = 0, bool badPrefix = false) {
  const time_t start = 86400 * 20000LL;
  std::string csv = "header\n";
  std::map<time_t, unsigned> expected, published;
  uint32_t prefixChecksum = 0;
  for (uint32_t n = 0; n < count; ++n) {
    time_t timestamp = start + n * interval;
    if (n == 3) csv += "invalid\n";
    csv += std::to_string(timestamp) + "\n";
    ++expected[timestamp - timestamp % 3600];
    if (n < prefix) prefixChecksum += uint32_t(timestamp);
  }
  // Vrstica naslednjega dne se ne sme vključiti v ta dan.
  csv += std::to_string(start + 86400) + "\n";
  SD.files[SD_LOG_PATH] = std::make_shared<std::string>(csv);
  dailyReconciliationFileOffset = dailyReconciliationDayStartOffset = 0;
  dailyReconciliationSnapshotFileSize = uint32_t(csv.size());
  dailyReconciliationPrefixMeasurementsRead = 0; dailyReconciliationPrefixChecksum = 0;
  dailyReconciliationMeasurementsUploaded = 0;
  reconciliationHourlyAggregate = {}; readyReconciliationHourlyAggregate = {};
  reconciliationHourlyAggregateReady = false;
  cloudReconciliationState = CloudReconciliationState::ReconcilingDays;
  dailyReconciliationDayRawComplete = false;
  DailyReconciliationManifest manifest{};
  manifest.aggregate.timestamp = start; manifest.aggregate.count = count;
  manifest.lastFileEndOffset = uint32_t(csv.size());
  manifest.cloudPrefixSampleCount = prefix;
  manifest.cloudPrefixChecksum = prefixChecksum + (badPrefix ? 1 : 0);
  int loops = 0;
  while (!dailyReconciliationDayRawComplete) {
    assert(++loops < 2000);
    uint32_t next; bool finished;
    assert(readNextReconciliationMeasurementBatch(manifest, next, finished));
    if (reconciliationHourlyAggregateReady) {
      published[readyReconciliationHourlyAggregate.timestamp] = readyReconciliationHourlyAggregate.count;
      completeCloudHistoryReconciliationRequest(CloudSyncRequestType::ReconciliationHourlyAggregate);
    }
    if (reconciliationPendingMeasurementCount) {
      const uint8_t batchSize = reconciliationPendingMeasurementCount;
      const time_t first = reconciliationPendingMeasurements[0].timestamp;
      for (uint8_t i = 0; i < batchSize; ++i) assert(reconciliationPendingMeasurements[i].timestamp / 3600 == first / 3600);
      // Neuspešen prenos: brez ACK se offset ne premakne in naslednji poskus vrne isti paket.
      uint32_t retryNext; bool retryFinished;
      assert(readNextReconciliationMeasurementBatch(manifest, retryNext, retryFinished));
      assert(retryNext == next && retryFinished == finished && reconciliationPendingMeasurementCount == batchSize);
      assert(reconciliationPendingMeasurements[0].timestamp == first);
      dailyReconciliationPendingFileOffset = next; dailyReconciliationPendingCompletesDay = finished;
      completeCloudHistoryReconciliationRequest(CloudSyncRequestType::ReconciliationMeasurement);
      if (reconciliationHourlyAggregateReady) {
        published[readyReconciliationHourlyAggregate.timestamp] = readyReconciliationHourlyAggregate.count;
        completeCloudHistoryReconciliationRequest(CloudSyncRequestType::ReconciliationHourlyAggregate);
      }
    } else if (finished) dailyReconciliationDayRawComplete = true;
  }
  if (reconciliationHourlyAggregate.count) published[reconciliationHourlyAggregate.timestamp] = reconciliationHourlyAggregate.count;
  assert(expected == published);
  assert(dailyReconciliationMeasurementsUploaded == count - (badPrefix ? 0 : prefix));
  assert(openHandles == 0);
}

void testDeletion() {
  for (auto state : {CloudReconciliationState::BuildingLocalIndex, CloudReconciliationState::ReadingCloudIndex,
                     CloudReconciliationState::ReconcilingDays}) {
    cloudReconciliationState = state; historyDeletionQueued = true;
    historyDeletionStep = HistoryDeletionStep::ReportQueued; historyDeletionRequestPending = false;
    cloudSyncPending = true; reconciliationFile = SD.open(SD_LOG_PATH, FILE_READ);
    int previous = cancelledReconciliations, reports = deletionReports;
    processPendingHistoryDeletion();
    assert(cancelledReconciliations == previous && deletionReports == reports && reconciliationFile);
    cloudSyncPending = false; processPendingHistoryDeletion();
    assert(cancelledReconciliations == previous + 1 && !reconciliationFile && deletionReports == reports + 1);
    historyDeletionRequestPending = false; historyDeletionStep = HistoryDeletionStep::DeleteSd;
    processPendingHistoryDeletion();
    assert(historyDeletionStep == HistoryDeletionStep::DeleteLatest);
  }
  cloudSyncPending = true; cloudSyncRequestStartedMillis = 1000; asyncClient.tasks = 0; nowMillis = 3999;
  assert(!recoverStalledCloudSynchronization()); nowMillis = 4000;
  assert(recoverStalledCloudSynchronization() && !cloudSyncPending);
  cloudSyncPending = true; asyncClient.tasks = 1; nowMillis = 20999;
  assert(!recoverStalledCloudSynchronization()); nowMillis = 21000;
  assert(recoverStalledCloudSynchronization() && !cloudSyncPending && cancelledRequests == 1);
  historyDeletionQueued = false;
  puts("H-07: brisanje v treh fazah obnove, cakanje na ACK, zaprtje SD in izgubljeni ACK/timeout: OK");
}

void testUploads() {
  SD.files.clear(); assert(openHandles == 0);
  uint8_t bytes[] = {1, 2, 3};
  for (int n = 0; n < 100; ++n) {
    AsyncWebServerRequest request;
    handleSdCardUpload(&request, "test.bin", 0, bytes, sizeof(bytes), false);
    assert(openHandles == 1 && request._tempObject);
    request.disconnect(); request.disconnect();
    assert(openHandles == 0 && !request._tempObject && SD.files.empty());
  }
  AsyncWebServerRequest a, b;
  handleSdCardUpload(&a, "test.bin", 0, bytes, 3, false);
  handleSdCardUpload(&b, "test.bin", 0, bytes, 3, false);
  assert(SD.files.size() == 2 && openHandles == 2);
  a.disconnect(); assert(SD.files.size() == 1 && openHandles == 1);
  handleSdCardUpload(&b, "test.bin", 3, bytes, 3, true);
  finishSdCardUpload(&b); b.disconnect();
  assert(b.response == 201 && !b._tempObject && openHandles == 0 && SD.files.size() == 1);
  assert(SD.files["/test.bin"]->size() == 6);
  SD.files.clear();
  AsyncWebServerRequest denied;
  handleSdCardUpload(&denied, "x", 0, bytes, 3, false);
  denied.authorized = false; finishSdCardUpload(&denied);
  assert(!denied._tempObject && openHandles == 0 && SD.files.empty());
  AsyncWebServerRequest failed; SD.failRename = true;
  handleSdCardUpload(&failed, "x", 0, bytes, 3, true); finishSdCardUpload(&failed); failed.disconnect();
  assert(failed.response == 500 && openHandles == 0 && SD.files.empty()); SD.failRename = false;
  AsyncWebServerRequest multiple;
  handleSdCardUpload(&multiple, "x", 0, bytes, 3, false);
  void *original = multiple._tempObject;
  handleSdCardUpload(&multiple, "y", 0, bytes, 3, false);
  assert(multiple._tempObject == original); finishSdCardUpload(&multiple);
  assert(multiple.response == 400 && openHandles == 0 && SD.files.empty());
  puts("H-10: 100 prekinitev, idempotentno ciscenje, socasna uploada, uspeh/napake in multipart: OK");
}

void testControlAcknowledgement() {
  ControlAcknowledgementState<72, 56> acknowledgement;
  char request[72], result[56];
  assert(acknowledgement.schedule("first", "clearControlCommand"));
  assert(acknowledgement.begin(request, result));
  assert(std::string(request) == "first" && std::string(result) == "clearControlCommand");
  // Uspešen callback zaključi točno oddani ID; pozni SSE ukaz istega ID-ja ga ne obudi.
  assert(acknowledgement.complete("clearControlCommand"));
  assert(acknowledgement.wasCompleted("first"));
  assert(acknowledgement.schedule("first", "clearControlCommand"));
  assert(!acknowledgement.hasPending() && !acknowledgement.hasInFlight());
  // Izgubljeni callback se ponovi, nov ukaz med tem pa ostane ločeno čakati.
  assert(acknowledgement.schedule("second", "clearSecond"));
  assert(acknowledgement.begin(request, result));
  assert(acknowledgement.schedule("third", "clearThird"));
  assert(acknowledgement.fail("clearSecond"));
  assert(acknowledgement.begin(request, result));
  assert(std::string(request) == "third" && std::string(result) == "clearThird");
  assert(acknowledgement.complete("clearThird"));
  assert(acknowledgement.schedule("second", "clearSecond"));
  assert(acknowledgement.begin(request, result));
  assert(std::string(request) == "second" && acknowledgement.complete("clearSecond"));
  puts("F-02: uspesen ACK, pozen SSE, izgubljeni callback in nov ukaz: OK");
}

int main() {
  testControlRoot(); testLoadCell(); testArchiveRetry();
  testReconciliation(300, 288); testReconciliation(60, 1440);
  testReconciliation(7200, 12); testReconciliation(300, 288, 18);
  testReconciliation(300, 288, 18, true);
  puts("H-06: cel dan pri 1/5 minutah, vrzeli, polnoc, retry in veljavna/neveljavna predpona: OK");
  testDeletion(); testUploads(); testControlAcknowledgement();
  puts("Vsi regresijski scenariji so uspesni.");
}
