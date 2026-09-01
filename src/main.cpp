#define ENABLE_DATABASE

#include <Arduino.h>
#include <dirent.h>
#include <Adafruit_BME680.h>
#include <ArduinoOTA.h>
#include <ElegantOTA.h>
#include <ESPAsyncWebServer.h>
#include <esp_timer.h>
#include <FirebaseClient.h>
#include <HTTPClient.h>
#include <HX711.h>
#include <LittleFS.h>
#include <Preferences.h>
#include <SD.h>
#include <SPI.h>
#include <Update.h>
#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <Wire.h>
#include <esp_heap_caps.h>
#include <esp_sntp.h>
#include <esp_system.h>
#include <esp_wifi.h>
#include <mbedtls/sha256.h>
#include <time.h>
#include <sys/stat.h>

#include "project_config.h"
#include "version.h"

namespace {

constexpr char SD_CARD_SETTINGS_NAMESPACE[] = "sd_card";  // NVS prostor za izključno lokalno geslo raziskovalca SD kartice.
constexpr char SD_CARD_PASSWORD_KEY[] = "password";  // Ime ključa gesla lokalnega raziskovalca v NVS prostoru `sd_card`.
constexpr char SD_CARD_USERNAME[] = "admin";  // Fiksno uporabniško ime Basic Auth za lokalni raziskovalec SD kartice.

// === Intervali glavne zanke (v milisekundah) =================================
// Spremeni jih samo, če razumeš vpliv na porabo, SD kartico in Firebase promet.
constexpr uint32_t DEFAULT_MEASUREMENT_INTERVAL_MS = 10 * 1000;  // Privzeti čas med branji BME680 in HX711 za prikaz trenutnih meritev.
constexpr uint32_t DEFAULT_SD_MEASUREMENT_INTERVAL_MS = 5 * 60 * 1000;  // Privzeti čas med zapisi meritve v SD CSV dnevnik in cloud zgodovino.
constexpr uint16_t MEASUREMENT_INTERVAL_MIN_SECONDS = 5;  // Najkrajši dovoljeni interval meritev za posamezen panj.
constexpr uint16_t MEASUREMENT_INTERVAL_MAX_SECONDS = 120;  // Najdaljši dovoljeni interval meritev za posamezen panj.
constexpr uint8_t SD_ARCHIVE_INTERVAL_MIN_MINUTES = 1;  // Najkrajši dovoljeni interval zapisa zgodovine na SD kartico.
constexpr uint8_t SD_ARCHIVE_INTERVAL_MAX_MINUTES = 30;  // Najdaljši dovoljeni interval zapisa zgodovine na SD kartico.
constexpr uint8_t DEFAULT_WEIGHT_DISPLAY_DECIMALS = 2;  // Privzeto število prikazanih decimalk teže na lokalnem in cloud pogledu.
constexpr uint32_t SD_STATUS_INTERVAL_MS = 60 * 1000;  // Čas med fizičnim preverjanjem in recoveryjem SD kartice.
constexpr uint32_t SD_STATUS_CLOUD_RETRY_INTERVAL_MS = 30 * 1000;  // Najkrajši premor pred ponovnim cloud zapisom neuspešnega SD statusa.
constexpr uint32_t DEVICE_HEARTBEAT_INTERVAL_MS = 60 * 1000;  // Čas med majhnimi cloud heartbeat zapisi RSSI-ja in odziva naprave.
constexpr uint32_t DEVICE_STATUS_SNAPSHOT_INTERVAL_MS = 6UL * 60UL * 60UL * 1000UL;  // Varnostni interval celotnega cloud posnetka stanja naprave.
constexpr uint32_t DEVICE_STATUS_RETRY_INTERVAL_MS = 30 * 1000;  // Najkrajši premor pred ponovnim poskusom neuspelega heartbeat-a ali celotnega statusnega posnetka.
constexpr uint32_t COMPONENT_RECOVERY_INTERVAL_MS = 60 * 1000;  // Čas med ponovnimi poskusi nedosegljivega senzorja ali SD kartice.
constexpr uint8_t COMPONENT_WARNING_FAILURES = 3;  // Zaporedne napake pred opozorilnim stanjem komponente.
constexpr uint8_t COMPONENT_ERROR_FAILURES = 5;  // Zaporedne napake pred stanjem napake komponente.
constexpr uint32_t ACTIVATION_SECRET_RETRY_INTERVAL_MS = 30 * 1000;  // Najkrajši premor pred ponovnim poskusom neuspešne objave aktivacijske kode.

// === Firebase in sinhronizacija SD zgodovine ==================================
constexpr uint32_t CLOUD_SYNC_INTERVAL_MS = 10 * 1000;  // Najkrajši čas med običajnimi prenosi SD zgodovine v Firebase.
constexpr uint32_t CLOUD_SYNC_MAX_RETRY_INTERVAL_MS = 60 * 1000;  // Najdaljši zamik ponovnega poskusa po cloud napaki.
constexpr uint32_t CLOUD_RECONCILIATION_INTERVAL_MS = 250;  // Premor med paketi pri ročni obnovi zgodovine.
constexpr uint8_t RECONCILIATION_MEASUREMENTS_PER_REQUEST = 32;  // Število meritev v enem Firebase paketu ročne obnove.
constexpr uint8_t DAILY_RAW_SYNC_VERSION = 4;  // Različica formata oznake dnevne sinhronizacije; spremeni ob spremembi modela.
constexpr uint32_t CLOUD_SYNC_REQUEST_MISSING_GRACE_MS = 3 * 1000;  // Čas za asinhroni Firebase rezultat, preden zahtevo obravnavamo kot izgubljeno.
constexpr uint32_t CLOUD_SYNC_REQUEST_TIMEOUT_MS = 20 * 1000;  // Najdaljše čakanje na posamezno Firebase zahtevo.
constexpr uint32_t FIREBASE_NETWORK_RETRY_INITIAL_MS = 30 * 1000;  // Začetni premor pred novim Firebase poskusom po omrežni napaki.
constexpr uint32_t CONTROL_COMMAND_ACK_RETRY_INTERVAL_MS = 30 * 1000;  // Najkrajši premor po zavrnjenem ali neuspelem Firebase ACK-u ukaza; prepreči tesno zanko zahtev.
constexpr uint32_t FIREBASE_APP_LOOP_INTERVAL_MS = 50;  // Perioda obdelave FirebaseClient; 50 ms pomeni največ 20 klicev na sekundo.
constexpr uint32_t FIREBASE_TASK_TIMEOUT_MS = 12 * 1000;  // Najdaljše dovoljeno trajanje Firebase opravila.
constexpr size_t MAX_FIREBASE_ASYNC_TASKS = 1;  // Največ hkratnih Firebase opravil; 1 preprečuje zasičenje RAM-a in TCP-ja.
constexpr uint32_t SYSTEM_DIAGNOSTIC_INTERVAL_MS = 15 * 1000;  // Čas med internimi pregledi zasedenosti RAM-a in omrežja.
constexpr uint32_t CLOUD_AGGREGATE_REFRESH_INTERVAL_MS = 30 * 60 * 1000;  // Čas med obnovami urnih in dnevnih cloud agregatov.

// === Prednost lokalne strani pred cloud prometom ===============================
constexpr uint32_t LOCAL_ASSET_PRIORITY_WINDOW_MS = 3 * 1000;  // Čas, ko ima nalaganje HTML/CSS/JS prednost pred Firebase prometom.
constexpr uint32_t LOCAL_HISTORY_PRIORITY_WINDOW_MS = 10 * 1000;  // Daljše prednostno okno za pripravo večjega JSON odgovora zgodovine s SD.
constexpr uint16_t LOCAL_HISTORY_LINES_PER_LOOP = 128;  // Največ CSV vrstic prebranih v enem prehodu zanke.
constexpr uint16_t LOCAL_HISTORY_BUCKETS_PER_LOOP = 128;  // Največ časovnih košev obdelanih v enem prehodu zanke.
constexpr uint32_t LOCAL_HISTORY_LOOP_BUDGET_MS = 8;  // Najdaljši čas obdelave zgodovine v enem prehodu, da Wi-Fi ostane odziven.

// === Wi-Fi, fallback AP in čas =================================================
constexpr uint32_t WIFI_CONNECT_TIMEOUT_MS = 20 * 1000;  // Najdaljši čas začetnega povezovanja na shranjeni domači Wi-Fi.
constexpr uint32_t WIFI_RECONNECT_INTERVAL_MS = 30 * 1000;  // Čas med nadzorovanimi poskusi ponovne povezave domačega Wi-Fi-ja.
constexpr uint32_t WIFI_RECONNECT_ATTEMPT_TIMEOUT_MS = 8 * 1000;  // Najdaljši čas enega ponovnega STA poskusa.
constexpr uint32_t NETWORK_SERVICE_STABILIZATION_MS = 2 * 1000;  // Čas po pridobitvi IP-ja pred zagonom NTP in Firebase prometa.
constexpr uint32_t NTP_FIREBASE_GUARD_MS = 3 * 1000;  // Dodatni premor med NTP sinhronizacijo in prvim Firebase dostopom.
constexpr uint32_t NTP_SYNC_TIMEOUT_MS = 30 * 1000;  // Najdaljši čas čakanja na prvo veljavno NTP uro.
constexpr uint32_t ACCESS_POINT_SHUTDOWN_DELAY_MS = 30 * 1000;  // Prehodni čas AP-ja velja samo za nastavitev prek naslova 192.168.4.1.
constexpr uint32_t WIFI_SETTINGS_CLEAR_DELAY_MS = 1200;  // Zamik omogoči prikaz navodil za AP, preden se prekine trenutna STA povezava.
constexpr uint32_t WIFI_CONNECTION_REQUEST_DELAY_MS = 500;  // Zamik po HTTP odgovoru, preden glavni program začne preklop Wi-Fi-ja.
constexpr uint32_t WIFI_RADIO_RESTART_DELAY_MS = 1 * 1000;  // Premor med izklopom in ponovnim zagonom Wi-Fi radia.
constexpr uint32_t ACCESS_POINT_START_RETRY_MS = 5 * 1000;  // Čas do novega poskusa zagona AP-ja, če prvi poskus ne uspe.
constexpr uint32_t ACCESS_POINT_HEALTH_CHECK_INTERVAL_MS = 30 * 1000;  // Čas med preverjanji, ali fallback AP še res oddaja.
constexpr uint8_t PROVISIONING_ACCESS_POINT_CHANNEL = 6;  // Wi-Fi kanal odprte provisioning AP točke; spremeni le ob motnjah kanala.
constexpr uint8_t PROVISIONING_ACCESS_POINT_MAX_CLIENTS = 4;  // Največ hkratnih telefonov/računalnikov na provisioning AP-ju.
constexpr int8_t PROVISIONING_ACCESS_POINT_TX_POWER = 78;  // Oddajna moč AP: 78 × 0,25 dBm = 19,5 dBm.
constexpr uint8_t WIFI_RECONNECTS_BEFORE_RESTART = 3;  // Neuspešni poskusi pred popolnim ponovnim zagonom STA povezave.

// === SD dnevnik in lokalna zgodovina ===========================================
constexpr uint8_t MAX_SD_INITIALIZATION_FAILURES = 5;  // Neuspele inicializacije SD pred objavo trajne napake v Firebase.
constexpr uint8_t CLOUD_SYNC_STATE_SAVE_INTERVAL = 12;  // Število uspešnih cloud zapisov pred shranitvijo kazalca sinhronizacije v NVS.
constexpr uint16_t DAILY_RECONCILIATION_LINES_PER_LOOP = 128;  // Največ SD vrstic preverjenih v enem prehodu dnevne obnove.
constexpr uint32_t DAILY_RECONCILIATION_LOOP_BUDGET_MS = 8;  // Časovni proračun enega prehoda dnevne obnove.
constexpr size_t MAX_DAILY_RECONCILIATION_DAYS = 1461;  // Največ dni (približno štiri leta), ki jih lahko ročno obnovimo iz zgodovine.

constexpr uint16_t SD_CARD_DIRECTORY_ENTRY_LIMIT = 128;  // Največ prikazanih datotek ene mape v lokalnem raziskovalcu SD kartice.
constexpr size_t SD_CARD_PATH_MAX_LENGTH = 128;  // Največja dovoljena dolžina poti v lokalnem raziskovalcu SD kartice.
constexpr size_t SD_CARD_PASSWORD_MIN_LENGTH = 8;  // Najkrajše lokalno geslo za dostop do raziskovalca SD kartice.
constexpr size_t SD_CARD_PASSWORD_MAX_LENGTH = 63;  // Najdaljše lokalno geslo za dostop do raziskovalca SD kartice.

// === Datoteke na SD in Firebase poti ===========================================
constexpr char DEVICE_DATABASE_ROOT[] = "/devices";  // Koren Firebase poti, pod katerim je ločena mapa vsake naprave.
constexpr size_t DATABASE_PATH_LENGTH = 96;  // Velikost medpomnilnika za sestavljene Firebase poti; ne zmanjšuj brez preverjanja.
constexpr char SD_LOG_PATH[] = "/measurements.csv";  // Glavni CSV dnevnik surovih meritev na SD kartici.
constexpr char SD_HISTORY_INDEX_PATH[] = "/measurements.idx";  // Dnevni indeks CSV dnevnika za hitrejše lokalne grafe.
constexpr char SD_HISTORY_INDEX_TEMP_PATH[] = "/measurements.tmp";  // Začasna datoteka med varnim ponovnim ustvarjanjem indeksa.
constexpr char SD_HISTORY_RESPONSE_PATH[] = "/history-response.json";  // Začasni JSON odgovor na SD; prepreči porabo RAM-a pri 24-urnem grafu.
constexpr uint32_t HOURLY_AGGREGATE_SECONDS = 60 * 60;  // Dolžina enega urnega agregacijskega koša.
constexpr uint32_t DAILY_AGGREGATE_SECONDS = 24 * 60 * 60;  // Dolžina enega dnevnega agregacijskega koša.

// === Cloud OTA iz GitHub Release ===============================================
constexpr char OTA_MANIFEST_URL[] = "https://github.com/RobertBarbo/PametniCebelnjak/releases/latest/download/manifest.json";  // URL manifesta zadnje GitHub izdaje.
constexpr char OTA_LITTLEFS_STAGE_PATH[] = "/ota-littlefs.bin";  // Začasna SD datoteka, v katero se pred namestitvijo prenese LittleFS slika.
constexpr size_t OTA_DOWNLOAD_BUFFER_SIZE = 2048;  // Velikost RAM medpomnilnika za HTTPS OTA prenos.
constexpr size_t OTA_COMMAND_PAYLOAD_LENGTH = 256;  // Največja dolžina Firebase OTA ukaza.
constexpr size_t FIRMWARE_VERSION_LENGTH = 24;  // Največja dolžina besedila verzije firmware-a skupaj z ničelnim znakom.
constexpr uint32_t OTA_MANIFEST_TIMEOUT_MS = 15 * 1000;  // Najdaljši čas čakanja na GitHub manifest.
constexpr uint32_t OTA_FIRMWARE_TIMEOUT_MS = 20 * 1000;  // Najdaljši čas vzpostavljanja HTTPS povezave za OTA datoteko.
constexpr uint32_t OTA_STREAM_IDLE_TIMEOUT_MS = 15 * 1000;  // Najdaljši dovoljeni premor brez OTA podatkov med prenosom.
constexpr uint32_t OTA_RESTART_DELAY_MS = 1500;  // Kratek zamik pred ponovnim zagonom po uspešnem cloud OTA.
constexpr uint32_t LOCAL_ELEGANT_OTA_START_TIMEOUT_MS = 5 * 1000;  // Čas čakanja, da ElegantOTA po HTTP zahtevi dejansko začne zapisovati flash.
constexpr uint32_t LOCAL_ELEGANT_OTA_RESTART_DELAY_MS = 2 * 1000;  // Zamik pred ponovnim zagonom po uspešnem ElegantOTA prenosu.
constexpr size_t LOCAL_ELEGANT_OTA_REPORT_INTERVAL_BYTES = 128 * 1024;  // Korak serijskega izpisa napredka ElegantOTA v bajtih.
constexpr uint8_t ARDUINO_OTA_PROGRESS_REPORT_INTERVAL_PERCENT = 10;  // Korak serijskega izpisa napredka PlatformIO Wi-Fi OTA.
constexpr uint8_t OTA_PROGRESS_REPORT_INTERVAL_PERCENT = 10;  // Korak objave napredka cloud OTA v Firebase.
constexpr uint16_t OTA_HTTPS_PORT = 443;  // Standardna HTTPS vrata za GitHub OTA prenos.
constexpr uint8_t OTA_MAX_REDIRECTS = 4;  // Največ GitHub HTTP preusmeritev, ki jim firmware varno sledi.
constexpr uint32_t OTA_HEADER_TIMEOUT_MS = 15 * 1000;  // Najdaljši čas čakanja na HTTP glave OTA strežnika.
constexpr size_t OTA_HTTP_LINE_MAX_LENGTH = 2048;  // Največja obdelana dolžina ene HTTP glave.
constexpr uint8_t OTA_LITTLEFS_DOWNLOAD_PROGRESS_END = 45;  // Cloud UI odstotek ob zaključku prenosa LittleFS slike.
constexpr uint8_t OTA_LITTLEFS_INSTALL_PROGRESS_END = 60;  // Cloud UI odstotek ob zaključku zapisa LittleFS v flash.
constexpr uint8_t OTA_FIRMWARE_DOWNLOAD_PROGRESS_END = 95;  // Cloud UI odstotek ob zaključku prenosa firmware slike.

// === Priklop strojne opreme ESP32-S3 ============================================
constexpr int SD_CS_PIN = 10;  // SD SPI CS pin; ne spreminjaj brez spremembe ožičenja.
constexpr int SD_MOSI_PIN = 11;  // SD SPI MOSI pin; ne spreminjaj brez spremembe ožičenja.
constexpr int SD_SCK_PIN = 12;  // SD SPI SCK pin; ne spreminjaj brez spremembe ožičenja.
constexpr int SD_MISO_PIN = 13;  // SD SPI MISO pin; ne spreminjaj brez spremembe ožičenja.
constexpr int BME680_SDA_PIN = 8;  // I2C SDA pin za BME680 in DS3231.
constexpr int BME680_SCL_PIN = 9;  // I2C SCL pin za BME680 in DS3231.
constexpr uint8_t BME680_PRIMARY_ADDRESS = 0x76;  // Privzeti I2C naslov BME680, če je SDO vezan na GND.
constexpr uint8_t BME680_SECONDARY_ADDRESS = 0x77;  // Alternativni I2C naslov BME680, če je SDO vezan na VCC.
constexpr uint8_t DS3231_ADDRESS = 0x68;  // Fiksni I2C naslov modula ure DS3231.
constexpr uint8_t DS3231_TIME_REGISTER = 0x00;  // Prvi DS3231 register za datum in uro.
constexpr uint8_t DS3231_STATUS_REGISTER = 0x0F;  // DS3231 statusni register za preverjanje veljavnosti ure.
constexpr uint8_t DS3231_OSCILLATOR_STOP_FLAG = 0x80;  // Bit, ki pove, da je DS3231 ob izgubi napajanja ustavil uro.
constexpr int HX711_DOUT_PIN = 4;  // HX711 DOUT pin; ne spreminjaj brez spremembe ožičenja.
constexpr int HX711_SCK_PIN = 5;  // HX711 SCK pin; ne spreminjaj brez spremembe ožičenja.
constexpr uint8_t HX711_TARE_SAMPLES = 20;  // Število vzorcev ob tariranju prazne tehtnice.
constexpr uint8_t HX711_READ_SAMPLES = 5;  // Število vzorcev za eno redno meritev; višje število zmanjša šum, a upočasni zanko.
constexpr uint32_t HX711_READY_TIMEOUT_MS = 250;  // Najdaljši čas čakanja, da HX711 pripravi nov vzorec.
constexpr float HX711_MAX_STEP_CHANGE_KG = 5.0F;  // Večji skok teže zahteva še eno potrdilno meritev.
constexpr float HX711_STEP_CONFIRM_TOLERANCE_KG = 1.0F;  // Največja razlika med dvema meritvama za potrditev velikega skoka.
constexpr float HX711_CALIBRATION_FACTOR = 22845.060F;  // Faktor umerjanja HX711; spremeni ga šele po postopku kalibracije z znano utežjo.

// === Datum, ura in lokalna zgodovina ============================================
constexpr char TIMEZONE[] = "CET-1CEST,M3.5.0/2,M10.5.0/3";  // Slovenija: CET pozimi in CEST poleti s samodejnim poletnim časom.
constexpr char NTP_SERVER_1[] = "pool.ntp.org";  // Primarni javni NTP strežnik za sinhronizacijo ure.
constexpr char NTP_SERVER_2[] = "time.google.com";  // Rezervni NTP strežnik, če primarni ni dosegljiv.
constexpr size_t MAX_LOCAL_HISTORY_BUCKETS = 1441;  // Največ minutnih točk za 24 ur grafa, vključno s končnim trenutkom.
constexpr time_t MAX_LOCAL_HISTORY_DURATION_SECONDS = 366 * 24 * 60 * 60;  // Najdaljše dovoljeno obdobje lokalnega grafa: 366 dni.
constexpr time_t MIN_VALID_UNIX_TIMESTAMP = 1700000000;  // Najstarejši čas, ki ga štejemo za veljaven po NTP/DS3231 sinhronizaciji.
constexpr time_t MAX_SETTABLE_UNIX_TIMESTAMP = 4102444799LL;  // Zadnji dovoljeni čas: 31. 12. 2099 23:59:59 UTC.

// === NVS ključi, identiteta in kalibracija ======================================
constexpr char DEVICE_SETTINGS_NAMESPACE[] = "device";  // NVS prostor za trajni ID in aktivacijsko kodo naprave.
constexpr char WIFI_SETTINGS_NAMESPACE[] = "wifi";  // NVS prostor za Wi-Fi SSID in geslo.
constexpr char SENSOR_SETTINGS_NAMESPACE[] = "sensors";  // NVS prostor za taro tehtnice in BME680 odmike.
constexpr char DEVICE_ID_KEY[] = "device_id";  // NVS ključ trajnega ID-ja naprave.
constexpr char ACTIVATION_CODE_KEY[] = "activation";  // NVS ključ lokalne aktivacijske kode.
constexpr char CLOUD_SYNC_OFFSET_KEY[] = "cloud_offset";  // NVS ključ položaja v SD datoteki, do katerega je zgodovina že sinhronizirana.
constexpr char CLOUD_SYNC_TIMESTAMP_KEY[] = "cloud_time";  // NVS ključ časa zadnje uspešne cloud sinhronizacije.
constexpr char CLOUD_AGGREGATE_SCHEMA_KEY[] = "agg_schema";  // NVS ključ različice modela cloud agregatov.
constexpr char MEASUREMENT_INTERVAL_KEY[] = "measure_int";  // NVS ključ intervala meritev v sekundah, pridobljenega iz cloud nastavitev panja.
constexpr char SD_ARCHIVE_INTERVAL_KEY[] = "sd_archive";  // NVS ključ intervala zapisa zgodovine na SD v minutah.
constexpr char WEIGHT_DISPLAY_DECIMALS_KEY[] = "weight_dec";  // NVS ključ števila prikazanih decimalk teže.
constexpr char CONTROL_REQUEST_NAMESPACE[] = "control";  // NVS prostor enkratnih cloud ukazov za varno nadaljevanje po ponovnem zagonu.
constexpr char CONTROL_LAST_REQUEST_ID_KEY[] = "last_request";  // NVS ključ identifikatorja ukaza, ki je že prešel v izvedbo.
constexpr char CONTROL_PENDING_REQUEST_ID_KEY[] = "pending_request";  // NVS ključ ukaza, ki čaka na izvedbo in se po rebootu znova prevzame iz realtime toka.
constexpr size_t CONTROL_REQUEST_ID_LENGTH = 72;  // Največja dolžina identifikatorja enkratnega ukaza skupaj z ničelnim znakom.
constexpr size_t CONTROL_COMMAND_ACK_RESULT_ID_LENGTH = 56;  // Največja dolžina interne oznake asinhrone potrditve cloud ukaza.
constexpr char HX711_OFFSET_KEY[] = "hx_offset";  // NVS ključ tare (odmika) HX711 tehtnice.
constexpr char BME680_TEMPERATURE_OFFSET_KEY[] = "bme_temp_off";  // NVS ključ ročnega temperaturnega odmika BME680.
constexpr char BME680_HUMIDITY_OFFSET_KEY[] = "bme_hum_off";  // NVS ključ ročnega odmika vlage BME680.
constexpr uint8_t CLOUD_AGGREGATE_SCHEMA_VERSION = 2;  // Trenutna različica strukture cloud agregatov.
constexpr float BME680_TEMPERATURE_OFFSET_MIN_C = -10.0F;  // Najnižji dovoljeni ročni temperaturni odmik BME680.
constexpr float BME680_TEMPERATURE_OFFSET_MAX_C = 10.0F;  // Najvišji dovoljeni ročni temperaturni odmik BME680.
constexpr float BME680_HUMIDITY_OFFSET_MIN_PERCENT = -30.0F;  // Najnižji dovoljeni ročni odmik relativne vlage BME680.
constexpr float BME680_HUMIDITY_OFFSET_MAX_PERCENT = 30.0F;  // Najvišji dovoljeni ročni odmik relativne vlage BME680.
constexpr char WIFI_SSID_KEY[] = "ssid";  // Ime ključa Wi-Fi omrežja v NVS prostoru `wifi`.
constexpr char WIFI_PASSWORD_KEY[] = "password";  // Ime ključa Wi-Fi gesla v NVS prostoru `wifi`.
constexpr char ACTIVATION_ALPHABET[] = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";  // Znaki za kodo brez dvoumnih 0/O in 1/I.
constexpr size_t DEVICE_ID_LENGTH = 16;  // Velikost medpomnilnika za ID oblike `CB-XXXXXXXXXXXX` z ničelnim znakom.
constexpr size_t ACTIVATION_CODE_LENGTH = 8;  // Dolžina uporabnikove aktivacijske kode.
constexpr size_t ACCESS_POINT_SSID_LENGTH = 24;  // Velikost medpomnilnika za ime AP točke oblike `Cebelnjak-XXXXXX`.
constexpr size_t ARDUINO_OTA_HOSTNAME_LENGTH = DEVICE_ID_LENGTH + 6;  // Velikost medpomnilnika za ArduinoOTA ime `panj-<device_id>`.

struct Measurement {
  float temperatureC = 0.0F;
  float humidityPercent = 0.0F;
  float weightKg = 0.0F;
  bool bme680Valid = false;
  bool loadCellValid = false;
  time_t timestamp = 0;
  char date[11]{};
  char time[9]{};
};

struct Uptime {
  uint64_t totalMinutes;
  uint64_t days;
  uint64_t hours;
  uint64_t minutes;
};

struct ComponentStatus {
  uint8_t consecutiveFailures = 0;
  bool verified = false;
  bool hasSucceeded = false;
};

struct HistoryBucket {
  time_t timestamp = 0;
  float temperatureSum = 0.0F;
  float humiditySum = 0.0F;
  float weightSum = 0.0F;
  uint16_t count = 0;
  uint16_t temperatureCount = 0;
  uint16_t humidityCount = 0;
  uint16_t weightCount = 0;
};

struct MeasurementAggregate {
  time_t timestamp = 0;
  float temperatureSum = 0.0F;
  float humiditySum = 0.0F;
  float weightSum = 0.0F;
  uint16_t count = 0;
  uint16_t temperatureCount = 0;
  uint16_t humidityCount = 0;
  uint16_t weightCount = 0;
  uint32_t syncChecksum = 0;
};

struct DailyReconciliationManifest {
  MeasurementAggregate aggregate;
  uint32_t firstFileOffset;
  uint32_t lastFileEndOffset;
  uint16_t cloudPrefixSampleCount;
  uint32_t cloudPrefixChecksum;
  bool measurementsNeedSync;
  bool aggregateNeedsUpdate;
};

struct RemoteDailyReconciliationManifest {
  time_t timestamp;
  uint16_t sampleCount;
  uint32_t syncChecksum;
  uint8_t rawSyncVersion;
  bool hasSyncChecksum;
};

struct OtaArtifact {
  String url;
  char sha256[65];
  size_t size;
};

struct FirmwareManifest {
  char version[FIRMWARE_VERSION_LENGTH];
  OtaArtifact firmware;
  OtaArtifact littlefs;
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
  DailyReconciliationIndex,
  ReconciliationMeasurement,
  ReconciliationHourlyAggregate,
  ReconciliationDailyAggregate,
};

enum class OtaUpdateState : uint8_t {
  Idle,
  LoadManifest,
  StartLittlefsDownload,
  DownloadLittlefs,
  VerifyLittlefsDownload,
  StartLittlefsInstall,
  InstallLittlefs,
  VerifyLittlefsInstall,
  StartFirmwareDownload,
  DownloadFirmware,
  VerifyFirmware,
  RestartDevice,
};

enum class LoadCellTareState : uint8_t {
  Idle,
  Queued,
  Taring,
  Completed,
  Error,
};

enum class Bme680CalibrationState : uint8_t {
  Idle,
  Queued,
  Applying,
  Completed,
  Error,
};

enum class TimeSource : uint8_t {
  Unavailable,
  Rtc,
  Ntp,
  ManualLocal,
  ManualCloud,
};

enum class ComponentHealth : uint8_t {
  Checking,
  Ok,
  Warning,
  Error,
};

enum class TimeCommandType : uint8_t {
  None,
  SetManual,
  SynchronizeNtp,
};

enum class HistoryDeletionStep : uint8_t {
  Idle,
  ReportQueued,
  ReportDeleting,
  DeleteSd,
  DeleteLatest,
  DeleteMeasurements,
  DeleteHourlyAggregates,
  DeleteDailyAggregates,
  ReportCompleted,
  ClearCommand,
  ReportError,
  ClearCommandAfterError,
};

enum class WiFiCredentialResetStep : uint8_t {
  Idle,
  ReportQueued,
  ClearCommand,
  ResetCredentials,
  ReportError,
};

enum class LocalHistoryDeletionState : uint8_t {
  Idle,
  Queued,
  Deleting,
  Completed,
  Error,
};

enum class LocalHistoryState : uint8_t {
  Idle,
  Queued,
  Reading,
  Writing,
  Ready,
  Error,
};

enum class CloudReconciliationState : uint8_t {
  Idle,
  BuildingLocalIndex,
  ReadingCloudIndex,
  ReconcilingDays,
  Completed,
  Error,
};

// Firebase uporablja asinhrone zahteve, da beleženje ne ustavi glavne zanke.
struct SdCardUploadContext {
  File file;
  String temporaryPath;
  String targetPath;
  String error;
  int statusCode = 500;
  bool overwrite = false;
  bool failed = false;
};

// Delni SSE dogodki lahko posodobijo posamezno polje ukaza. Posnetek jih združi,
// dokler ukaz nima vseh parametrov, potrebnih za varno čakalno vrsto v glavni zanki.
struct ControlCommandSnapshot {
  char action[32]{};
  char requestId[CONTROL_REQUEST_ID_LENGTH]{};
  char targetVersion[FIRMWARE_VERSION_LENGTH]{};
  time_t timestamp = 0;
  float temperatureOffsetC = 0.0F;
  float humidityOffsetPercent = 0.0F;
  bool hasAction = false;
  bool hasRequestId = false;
  bool hasTargetVersion = false;
  bool hasTimestamp = false;
  bool hasTemperatureOffset = false;
  bool hasHumidityOffset = false;
};

WiFiClientSecure sslClient;
WiFiClientSecure controlStreamSslClient;
WiFiClientSecure otaClient;
WiFiClientSecure otaDownloadClient;
using AsyncClient = AsyncClientClass;
AsyncClient asyncClient(sslClient);
AsyncClient controlStreamClient(controlStreamSslClient);
SPIClass sdSpi(FSPI);
AsyncWebServer localServer(80);
Preferences preferences;
Adafruit_BME680 bme680;
HX711 loadCell;

NoAuth noAuth;
FirebaseApp app;
RealtimeDatabase database;

uint32_t lastMeasurementMillis = 0;
uint32_t lastSDMeasurementMillis = 0;
uint32_t lastSDStatusMillis = 0;
uint32_t lastSDStatusCloudAttemptMillis = 0;
uint32_t lastDeviceHeartbeatMillis = 0;
uint32_t lastDeviceStatusMillis = 0;
uint32_t lastDeviceHeartbeatAttemptMillis = 0;
uint32_t lastDeviceStatusAttemptMillis = 0;
uint32_t lastComponentRecoveryMillis = 0;
uint32_t lastActivationSecretAttemptMillis = 0;
uint32_t lastFirebaseAppLoopMillis = 0;
uint32_t firebaseTaskStartedMillis = 0;
uint32_t lastSystemDiagnosticMillis = 0;
uint32_t lastCloudSyncAttemptMillis = 0;
uint32_t cloudSyncRequestStartedMillis = 0;
uint32_t cloudSyncRetryIntervalMs = CLOUD_SYNC_INTERVAL_MS;
uint32_t lastCloudAggregateRefreshMillis = 0;
uint32_t firebaseRequestsPausedUntilMillis = 0;
uint32_t lastControlCommandClearAttemptMillis = 0;
volatile uint32_t localAssetsHavePriorityUntilMillis = 0;
volatile uint32_t localHistoryHavePriorityUntilMillis = 0;
uint32_t accessPointShutdownMillis = 0;
uint32_t scheduledWiFiSettingsClearMillis = 0;
uint32_t queuedWiFiConnectionStartMillis = 0;
uint32_t scheduledAccessPointStartMillis = 0;
uint32_t lastAccessPointHealthCheckMillis = 0;
uint32_t wifiConnectionStartedMillis = 0;
uint32_t lastWiFiReconnectAttemptMillis = 0;
uint32_t wifiConnectionLostMillis = 0;
uint32_t savedWiFiReconnectStartedMillis = 0;
uint32_t cloudSyncFileOffset = 0;
uint32_t cloudSyncPendingFileOffset = 0;
uint8_t cloudSyncWritesSincePersist = 0;
uint8_t firebaseConsecutiveNetworkFailures = 0;
bool sdCardReady = false;
uint8_t sdInitializationFailures = 0;
bool sdErrorReported = false;
bool sdCardStatusCloudPublished = false;
bool sdCardStatusCloudPublishedPresent = false;
uint8_t sdCardStatusCloudPublishedInitializationFailures = 0;
bool sdCardStatusCloudPublishedError = false;
bool sdCardStatusCloudInFlight = false;
bool sdCardStatusCloudPending = false;
bool sdCardStatusCloudDirtyDuringFlight = false;
bool sdCardStatusCloudInFlightPresent = false;
uint8_t sdCardStatusCloudInFlightInitializationFailures = 0;
bool sdCardStatusCloudInFlightError = false;
bool firmwareVersionReported = false;
bool firebaseConnectionWasReady = false;
bool deviceHeartbeatPending = false;
bool deviceHeartbeatInFlight = false;
bool deviceStatusPending = false;
bool deviceStatusInFlight = false;
bool deviceStatusDirtyDuringFlight = false;
bool firmwareCommandQueued = false;
bool timeCommandQueued = false;
bool controlStreamStarted = false;
bool controlCommandDispatchPending = false;
bool controlCommandClearPending = false;
bool timeCommandFromCloud = false;
volatile bool ntpSynchronizationCompleted = false;
bool ntpSynchronizationPending = false;
bool firmwareUpdateInProgress = false;
bool queuedFirmwareCommandInvalid = false;
bool historyDeletionQueued = false;
bool historyDeletionRequestPending = false;
bool wifiCredentialResetQueued = false;
bool wifiCredentialResetRequestPending = false;
volatile bool localHistoryDeletionQueued = false;
// Nastavlja ga lokalni HTTP zahtevek ali Firebase ukaz; obdelava ostane v glavni zanki.
volatile bool loadCellTareQueued = false;
volatile bool bme680CalibrationQueued = false;
bool loadCellTareStatusReported = false;
bool bme680CalibrationStatusReported = false;
bool otaHashActive = false;
bool otaFlashUpdateActive = false;
bool littlefsUnmountedForOta = false;
bool localElegantOtaSessionActive = false;
bool localElegantOtaAwaitingUpdateStart = false;
bool littlefsUnmountedForLocalElegantOta = false;
bool localElegantOtaRestartScheduled = false;
bool arduinoOtaInitialized = false;
bool littlefsUnmountedForArduinoOta = false;
bool activationSecretPublishPending = false;
bool activationSecretPublishInFlight = false;
bool activationSecretRegistrationReported = false;
bool validTimeWasAvailable = false;
// Firebase uporablja en asinhroni kanal. Med drugimi opravili hranimo samo
// najnovejšo trenutno meritev, da cloud po sprostitvi kanala ne zaostaja.
bool latestMeasurementUploadPending = false;
bool latestMeasurementUploadInFlight = false;
bool cloudSyncPending = false;
bool cloudSyncCaughtUp = false;
bool cloudSyncStateSavePending = false;
bool hourlyAggregateReady = false;
bool dailyAggregateReady = false;
bool historyIndexReady = false;
bool stationConnected = false;
bool accessPointActive = false;
bool savedWiFiCredentialsAvailable = false;
volatile bool stationGotIpAddress = false;
volatile uint32_t stationGotIpMillis = 0;
bool timeSynchronizationInitialized = false;
uint32_t timeSynchronizationStartedMillis = 0;
bool scheduledAccessPointKeepsStationEnabled = false;
// Dogodek AP_START potrdi radijski zagon, periodično preverjanje pa uporablja dejanski način in IP.
volatile bool accessPointExpected = false;
bool bme680Ready = false;
bool loadCellReady = false;
bool loadCellReferenceAvailable = false;
float lastLoadCellWeightKg = 0.0F;
bool loadCellCandidateAvailable = false;
float loadCellCandidateWeightKg = 0.0F;
bool rtcReady = false;
bool rtcTimeValid = false;
ComponentStatus bme680Status;
ComponentStatus loadCellStatus;
ComponentStatus rtcStatus;
ComponentStatus sdCardStatus;
uint8_t wifiReconnectAttempts = 0;
bool savedWiFiReconnectAttemptActive = false;
WiFiProvisioningState wifiProvisioningState = WiFiProvisioningState::Idle;
String pendingWiFiSsid;
String pendingWiFiPassword;
bool pendingWiFiRequestFromAccessPoint = false;
volatile bool wifiConnectionRequestQueued = false;
char queuedWiFiSsid[33] = {};
char queuedWiFiPassword[64] = {};
bool queuedWiFiRequestFromAccessPoint = false;
time_t lastCloudSyncedTimestamp = 0;
Measurement latestMeasurement{};
Measurement cloudSyncPendingMeasurement{};
MeasurementAggregate hourlyCloudAggregate{};
MeasurementAggregate dailyCloudAggregate{};
MeasurementAggregate readyHourlyCloudAggregate{};
MeasurementAggregate readyDailyCloudAggregate{};
MeasurementAggregate cloudSyncPendingAggregate{};
MeasurementAggregate reconciliationHourlyAggregate{};
MeasurementAggregate readyReconciliationHourlyAggregate{};
DailyReconciliationManifest *dailyReconciliationManifests = nullptr;
RemoteDailyReconciliationManifest *remoteDailyReconciliationManifests = nullptr;
File dailyReconciliationLogFile;
CloudReconciliationState cloudReconciliationState = CloudReconciliationState::Idle;
uint16_t dailyReconciliationManifestCount = 0;
uint16_t remoteDailyReconciliationManifestCount = 0;
uint16_t dailyReconciliationCurrentIndex = 0;
uint16_t dailyReconciliationDaysToTransfer = 0;
uint16_t dailyReconciliationDaysCompleted = 0;
uint32_t dailyReconciliationMeasurementsToTransfer = 0;
uint32_t dailyReconciliationMeasurementsUploaded = 0;
uint32_t dailyReconciliationFileOffset = 0;
uint32_t dailyReconciliationPendingFileOffset = 0;
uint32_t dailyReconciliationDayStartOffset = 0;
// Ročna primerjava obravnava nespremenljiv posnetek dnevnika. Zapisi, dodani
// med primerjavo, ostanejo za običajno inkrementalno sinhronizacijo.
uint32_t dailyReconciliationSnapshotFileSize = 0;
time_t dailyReconciliationSnapshotLastTimestamp = 0;
bool dailyReconciliationDayStarted = false;
bool dailyReconciliationDayRawComplete = false;
bool dailyReconciliationPendingCompletesDay = false;
bool reconciliationHourlyAggregateReady = false;
uint16_t dailyReconciliationPrefixMeasurementsRead = 0;
uint32_t dailyReconciliationPrefixChecksum = 0;
Measurement reconciliationPendingMeasurements[RECONCILIATION_MEASUREMENTS_PER_REQUEST]{};
uint8_t reconciliationPendingMeasurementCount = 0;
time_t lastDailyReconciliationTimestamp = 0;
bool hasLatestMeasurement = false;
HistoryBucket *localHistoryBuckets = nullptr;
File localHistoryLogFile;
File localHistoryResponseFile;
LocalHistoryState localHistoryState = LocalHistoryState::Idle;
time_t localHistoryFirstTimestamp = 0;
time_t localHistoryLastTimestamp = 0;
uint32_t localHistoryBucketDuration = 0;
size_t localHistoryWriteBucketIndex = 0;
bool localHistoryFirstReading = true;
char localHistoryError[96]{};
portMUX_TYPE localHistoryStateMux = portMUX_INITIALIZER_UNLOCKED;
char deviceId[DEVICE_ID_LENGTH]{};
char activationCode[ACTIVATION_CODE_LENGTH + 1]{};
char accessPointSsid[ACCESS_POINT_SSID_LENGTH]{};
char arduinoOtaHostname[ARDUINO_OTA_HOSTNAME_LENGTH]{};
char deviceDatabasePath[DATABASE_PATH_LENGTH]{};
char latestDatabasePath[DATABASE_PATH_LENGTH]{};
char historyDatabasePath[DATABASE_PATH_LENGTH]{};
char hourlyAggregateDatabasePath[DATABASE_PATH_LENGTH]{};
char dailyAggregateDatabasePath[DATABASE_PATH_LENGTH]{};
char sdStatusDatabasePath[DATABASE_PATH_LENGTH]{};
char deviceStatusDatabasePath[DATABASE_PATH_LENGTH]{};
char firmwareStatusDatabasePath[DATABASE_PATH_LENGTH]{};
char otaStatusDatabasePath[DATABASE_PATH_LENGTH]{};
char loadCellStatusDatabasePath[DATABASE_PATH_LENGTH]{};
char bme680StatusDatabasePath[DATABASE_PATH_LENGTH]{};
char controlDatabasePath[DATABASE_PATH_LENGTH]{};
char controlCommandDatabasePath[DATABASE_PATH_LENGTH]{};
char historyStatusDatabasePath[DATABASE_PATH_LENGTH]{};
char networkResetStatusDatabasePath[DATABASE_PATH_LENGTH]{};
char activationSecretDatabasePath[DATABASE_PATH_LENGTH]{};
char queuedFirmwareCommandPayload[OTA_COMMAND_PAYLOAD_LENGTH]{};
char queuedTimeCommandPayload[OTA_COMMAND_PAYLOAD_LENGTH]{};
char pendingControlCommandPayload[OTA_COMMAND_PAYLOAD_LENGTH]{};
char lastProcessedControlRequestId[CONTROL_REQUEST_ID_LENGTH]{};
char pendingControlRequestId[CONTROL_REQUEST_ID_LENGTH]{};
char pendingTimeControlRequestId[CONTROL_REQUEST_ID_LENGTH]{};
char controlCommandClearRequestId[CONTROL_REQUEST_ID_LENGTH]{};
char controlCommandClearResultId[CONTROL_COMMAND_ACK_RESULT_ID_LENGTH]{};
ControlCommandSnapshot controlCommandSnapshot{};
char otaTargetVersion[FIRMWARE_VERSION_LENGTH]{};
uint8_t otaDownloadBuffer[OTA_DOWNLOAD_BUFFER_SIZE]{};
FirmwareManifest otaManifest{};
WiFiClient *otaDownloadStream = nullptr;

// Enotni sprožilec celotnega cloud posnetka. Sprememba med asinhronim zapisom
// ostane označena, zato je uspešen odgovor starega posnetka ne more izgubiti.
void requestDeviceStatusUpdate()
{
  if (deviceStatusInFlight) {
    deviceStatusDirtyDuringFlight = true;
    return;
  }
  deviceStatusPending = true;
}

void setRtcTimeValid(bool valid)
{
  if (rtcTimeValid == valid) return;
  rtcTimeValid = valid;
  requestDeviceStatusUpdate();
}

void setNtpSynchronizationPending(bool pending)
{
  if (ntpSynchronizationPending == pending) return;
  ntpSynchronizationPending = pending;
  requestDeviceStatusUpdate();
}

// Ločen sprožilec za /status/sd_card. Fizični pregled SD kartice ostaja periodičen,
// cloud posnetek pa pošiljamo le ob spremembi, reconnectu ali neuspelem prejšnjem zapisu.
void requestSDCardStatusUpdate()
{
  if (sdCardStatusCloudInFlight) {
    sdCardStatusCloudDirtyDuringFlight = true;
    return;
  }
  sdCardStatusCloudPending = true;
}

ComponentHealth componentHealth(const ComponentStatus &status)
{
  if (!status.verified) return ComponentHealth::Checking;
  // Komponenta, ki v trenutnem zagonu še nikoli ni odgovorila, ni kratkotrajna
  // motnja že delujoče strojne opreme in mora biti takoj označena kot napaka.
  if (!status.hasSucceeded) return ComponentHealth::Error;
  if (status.consecutiveFailures >= COMPONENT_ERROR_FAILURES) return ComponentHealth::Error;
  if (status.consecutiveFailures >= COMPONENT_WARNING_FAILURES) return ComponentHealth::Warning;
  return ComponentHealth::Ok;
}

const char *componentHealthName(const ComponentStatus &status)
{
  switch (componentHealth(status)) {
    case ComponentHealth::Ok: return "ok";
    case ComponentHealth::Warning: return "warning";
    case ComponentHealth::Error: return "error";
    case ComponentHealth::Checking:
    default: return "checking";
  }
}

void reportComponentSuccess(ComponentStatus &status, const char *componentName)
{
  const ComponentHealth previousHealth = componentHealth(status);
  status.verified = true;
  status.hasSucceeded = true;
  status.consecutiveFailures = 0;
  if (previousHealth != ComponentHealth::Ok) {
    Serial.printf("[KOMPONENTA] %s: deluje normalno.\n", componentName);
    requestDeviceStatusUpdate();
  }
}

void reportComponentFailure(ComponentStatus &status, const char *componentName, const char *reason)
{
  const ComponentHealth previousHealth = componentHealth(status);
  status.verified = true;
  if (status.consecutiveFailures < UINT8_MAX) ++status.consecutiveFailures;
  const ComponentHealth currentHealth = componentHealth(status);

  // Serijski monitor opozori ob prvi zaznavi ter ob prehodu v opozorilo ali napako.
  if (status.consecutiveFailures == 1 || previousHealth != currentHealth) {
    Serial.printf("[KOMPONENTA] %s: %s (zaporedne napake: %u, stanje: %s).\n",
                  componentName, reason, status.consecutiveFailures, componentHealthName(status));
  }
  if (previousHealth != currentHealth || status.consecutiveFailures == 1) {
    requestDeviceStatusUpdate();
  }
}
File otaLittlefsStageFile;
mbedtls_sha256_context otaSha256Context;
size_t otaDownloadedBytes = 0;
uint32_t otaLastDataReceivedMillis = 0;
uint32_t otaRestartScheduledMillis = 0;
uint32_t localElegantOtaStartedMillis = 0;
uint32_t localElegantOtaRestartScheduledMillis = 0;
uint8_t otaLastReportedProgress = 0;
uint8_t arduinoOtaLastReportedProgress = 0;
size_t localElegantOtaLastReportedBytes = 0;
time_t lastIndexedDayTimestamp = 0;
time_t lastPublishedHourlyBucket = 0;
time_t lastPublishedDailyBucket = 0;
uint16_t lastPublishedHourlyCount = 0;
uint16_t lastPublishedDailyCount = 0;
CloudSyncRequestType cloudSyncRequestType = CloudSyncRequestType::None;
OtaUpdateState otaUpdateState = OtaUpdateState::Idle;
LoadCellTareState loadCellTareState = LoadCellTareState::Idle;
Bme680CalibrationState bme680CalibrationState = Bme680CalibrationState::Idle;
HistoryDeletionStep historyDeletionStep = HistoryDeletionStep::Idle;
WiFiCredentialResetStep wifiCredentialResetStep = WiFiCredentialResetStep::Idle;
volatile LocalHistoryDeletionState localHistoryDeletionState = LocalHistoryDeletionState::Idle;
TimeSource currentTimeSource = TimeSource::Unavailable;
TimeCommandType pendingTimeCommandType = TimeCommandType::None;
time_t pendingTimeCommandTimestamp = 0;
time_t lastTimeSynchronizationTimestamp = 0;
portMUX_TYPE timeCommandMux = portMUX_INITIALIZER_UNLOCKED;
portMUX_TYPE bme680CalibrationMux = portMUX_INITIALIZER_UNLOCKED;
portMUX_TYPE wifiProvisioningRequestMux = portMUX_INITIALIZER_UNLOCKED;
float bme680TemperatureOffsetC = 0.0F;
float bme680HumidityOffsetPercent = 0.0F;
float pendingBme680TemperatureOffsetC = 0.0F;
float pendingBme680HumidityOffsetPercent = 0.0F;
bool bme680CalibrationFromCloud = false;
uint32_t measurementIntervalMs = DEFAULT_MEASUREMENT_INTERVAL_MS;
uint32_t sdMeasurementIntervalMs = DEFAULT_SD_MEASUREMENT_INTERVAL_MS;
uint8_t weightDisplayDecimals = DEFAULT_WEIGHT_DISPLAY_DECIMALS;

void processFirmwareUpdateCommand(const String &payload);
bool queueFirmwareUpdateCommand(const String &payload);
void processQueuedFirmwareUpdateCommand();
void processQueuedTimeCommand();
void processPendingTimeCommand();
void processPendingControlCommand();
void processControlStreamData(AsyncResult &result);
void maintainControlStream();
void enqueueControlCommand(const String &payload);
bool controlRequestWasProcessed(const String &requestId);
bool controlRequestIsPending(const String &requestId);
bool rememberPendingControlRequest(const String &requestId);
bool markControlRequestProcessed(const String &requestId);
void queueHistoryDeleteAction();
void processPendingHistoryDeletion();
void queueWiFiCredentialResetAction();
void processPendingWiFiCredentialReset();
void processPendingLocalHistoryDeletion();
bool isHistoryDeletionRequest(const String &requestId);
void completeHistoryDeletionRequest();
bool isWiFiCredentialResetRequest(const String &requestId);
void completeWiFiCredentialResetRequest();
bool queueLoadCellTare(bool publishCloudStatus = true);
void processPendingLoadCellTare();
bool queueBme680Calibration(float temperatureOffsetC, float humidityOffsetPercent, bool fromCloud);
void processPendingBme680Calibration();
void processOtaUpdate();
void processLocalHistory();
void printSystemDiagnostics();
void appendJsonEscaped(String &json, const String &value);
bool persistCloudSyncState();
bool parseMeasurementCsvLine(const char *line, Measurement &measurement);
void resetCloudAggregateState();
void rebuildCloudAggregateState();
void processCloudHistoryReconciliation();
bool startCloudHistoryReconciliation();
void resetCloudHistoryReconciliation();
void completeCloudHistoryReconciliationRequest(CloudSyncRequestType requestType);
bool processCloudHistoryReconciliationIndex(const String &payload);
void appendJsonEscaped(String &json, const String &value);
bool extractJsonUnsignedValue(const String &json, const char *key, uint32_t &value);
void processMeasurementSettings(const String &payload);

bool isCloudSyncRequest(const String &requestId)
{
  return requestId == "syncMeasurementHistory" || requestId == "syncHourlyAggregate" ||
         requestId == "syncDailyAggregate" || requestId == "readDailyCloudIndex" ||
         requestId == "syncReconciliationMeasurement" ||
         requestId == "syncReconciliationHourlyAggregate" ||
         requestId == "syncReconciliationDailyAggregate";
}

bool cloudHistoryReconciliationIsActive()
{
  return cloudReconciliationState == CloudReconciliationState::BuildingLocalIndex ||
         cloudReconciliationState == CloudReconciliationState::ReadingCloudIndex ||
         cloudReconciliationState == CloudReconciliationState::ReconcilingDays;
}

void markCloudHistoryReconciliationError()
{
  if (cloudReconciliationState == CloudReconciliationState::Error) return;
  cloudReconciliationState = CloudReconciliationState::Error;
  requestDeviceStatusUpdate();
}

const char *cloudReconciliationStateName()
{
  switch (cloudReconciliationState) {
    case CloudReconciliationState::BuildingLocalIndex:
      return "preparing";
    case CloudReconciliationState::ReadingCloudIndex:
      return "checking";
    case CloudReconciliationState::ReconcilingDays:
      return "syncing";
    case CloudReconciliationState::Completed:
      return "completed";
    case CloudReconciliationState::Error:
      return "error";
    case CloudReconciliationState::Idle:
    default:
      return "idle";
  }
}

bool firebaseRequestsArePaused()
{
  const uint32_t currentMillis = millis();
  const bool networkBackoffActive = firebaseRequestsPausedUntilMillis != 0 &&
                                    static_cast<int32_t>(currentMillis - firebaseRequestsPausedUntilMillis) < 0;
  const bool localAssetTransferActive = localAssetsHavePriorityUntilMillis != 0 &&
                                        static_cast<int32_t>(currentMillis - localAssetsHavePriorityUntilMillis) < 0;
  const bool localHistoryTransferActive = localHistoryHavePriorityUntilMillis != 0 &&
                                          static_cast<int32_t>(currentMillis - localHistoryHavePriorityUntilMillis) < 0;
  return networkBackoffActive || localAssetTransferActive || localHistoryTransferActive;
}

bool stationNetworkReady()
{
  return stationConnected && stationGotIpAddress && WiFi.status() == WL_CONNECTED &&
         WiFi.localIP() != IPAddress();
}

bool stationNetworkIsStable()
{
  const uint32_t gotIpMillis = stationGotIpMillis;
  return stationNetworkReady() && gotIpMillis != 0 &&
         millis() - gotIpMillis >= NETWORK_SERVICE_STABILIZATION_MS;
}

bool cloudNetworkReady()
{
  return stationNetworkIsStable() && timeSynchronizationInitialized &&
         millis() - timeSynchronizationStartedMillis >= NTP_FIREBASE_GUARD_MS;
}

void pauseFirebaseRequestsAfterNetworkError(int errorCode)
{
  if (errorCode >= 0) return;

  if (firebaseConsecutiveNetworkFailures < 8) {
    ++firebaseConsecutiveNetworkFailures;
  }
  const uint8_t retryShift = firebaseConsecutiveNetworkFailures > 4
                                 ? 3
                                 : firebaseConsecutiveNetworkFailures - 1;
  const uint32_t retryDelay = FIREBASE_NETWORK_RETRY_INITIAL_MS << retryShift;
  firebaseRequestsPausedUntilMillis = millis() + retryDelay;
  Serial.printf("Firebase network error (%d); requests paused for %lu s.\n", errorCode,
                static_cast<unsigned long>(retryDelay / 1000));
}

void clearFirebaseNetworkErrorBackoff()
{
  firebaseConsecutiveNetworkFailures = 0;
  firebaseRequestsPausedUntilMillis = 0;
}

void cancelPendingFirebaseTasks(const char *reason)
{
  const size_t taskCount = asyncClient.taskCount();
  if (taskCount > 0) {
    asyncClient.stopAsync(true);
    sslClient.stop();
    Serial.printf("Firebase: cancelled %u pending task(s): %s\n", static_cast<unsigned>(taskCount), reason);
  }

  firebaseTaskStartedMillis = 0;
  if (latestMeasurementUploadInFlight) {
    latestMeasurementUploadPending = true;
    latestMeasurementUploadInFlight = false;
  }
  if (activationSecretPublishInFlight) {
    activationSecretPublishInFlight = false;
    activationSecretPublishPending = true;
  }
  historyDeletionRequestPending = false;
  wifiCredentialResetRequestPending = false;
  firmwareVersionReported = false;
  if (deviceHeartbeatInFlight) {
    deviceHeartbeatInFlight = false;
    deviceHeartbeatPending = true;
  }
  if (deviceStatusInFlight) {
    deviceStatusInFlight = false;
    deviceStatusDirtyDuringFlight = false;
    requestDeviceStatusUpdate();
  }
  if (sdCardStatusCloudInFlight) {
    sdCardStatusCloudInFlight = false;
    sdCardStatusCloudDirtyDuringFlight = false;
    requestSDCardStatusUpdate();
  }
  cloudSyncPending = false;
  cloudSyncRequestStartedMillis = 0;
  cloudSyncRequestType = CloudSyncRequestType::None;
}

void maintainFirebaseClient()
{
  const uint32_t currentMillis = millis();
  if (!stationNetworkReady() && asyncClient.taskCount() > 0) {
    cancelPendingFirebaseTasks("Wi-Fi association or IP address lost");
  }

  if (!cloudNetworkReady()) {
    // Ob naslednji uspešni Firebase povezavi objavimo celoten posnetek, ne le heartbeat-a.
    firebaseConnectionWasReady = false;
    return;
  }

  // app.loop() mora teči tudi med premorom za nove zahteve, da FirebaseClient zaključi ali odstrani
  // že obstoječe opravilo. Premor zato prepreči le dodajanje novih zahtev.
  if (lastFirebaseAppLoopMillis == 0 ||
      currentMillis - lastFirebaseAppLoopMillis >= FIREBASE_APP_LOOP_INTERVAL_MS) {
    lastFirebaseAppLoopMillis = currentMillis;
    app.loop();
  }

  if (app.ready()) {
    if (!firebaseConnectionWasReady) {
      firebaseConnectionWasReady = true;
      // Ob prvi oziroma znova vzpostavljeni seji zahtevamo aktualen celoten posnetek.
      lastDeviceStatusAttemptMillis = 0;
      requestDeviceStatusUpdate();
      requestSDCardStatusUpdate();
      activationSecretPublishPending = true;
    }
  } else {
    // Wi-Fi je lahko še povezan, Firebase seja pa se je že prekinila. Naslednja uspešna seja
    // potrebuje nov celoten posnetek, ne samo minutnega heartbeat-a.
    firebaseConnectionWasReady = false;
  }

  const size_t taskCount = asyncClient.taskCount();
  if (taskCount == 0) {
    firebaseTaskStartedMillis = 0;
    return;
  }

  if (firebaseTaskStartedMillis == 0) {
    firebaseTaskStartedMillis = currentMillis;
    return;
  }

  if (currentMillis - firebaseTaskStartedMillis >= FIREBASE_TASK_TIMEOUT_MS) {
    Serial.println("Firebase task timed out; closing the TLS connection before retrying.");
    pauseFirebaseRequestsAfterNetworkError(-1);
    cancelPendingFirebaseTasks("task timeout");
  }
}

void markCloudSyncFailure()
{
  cloudSyncPending = false;
  cloudSyncRequestStartedMillis = 0;
  cloudSyncRequestType = CloudSyncRequestType::None;
  cloudSyncRetryIntervalMs = min(cloudSyncRetryIntervalMs * 2, CLOUD_SYNC_MAX_RETRY_INTERVAL_MS);
  Serial.print("Cloud sync retry delayed to ");
  Serial.print(cloudSyncRetryIntervalMs / 1000);
  Serial.println(" seconds.");
}

bool measurementHasSensorValue(const Measurement &measurement)
{
  return measurement.bme680Valid || measurement.loadCellValid;
}

void formatOptionalMeasurementValue(char *buffer, size_t bufferSize, float value, bool valid,
                                    uint8_t decimals)
{
  if (!valid) {
    strlcpy(buffer, "null", bufferSize);
    return;
  }
  snprintf(buffer, bufferSize, "%.*f", static_cast<int>(decimals), value);
}

void formatOptionalCsvMeasurementValue(char *buffer, size_t bufferSize, float value, bool valid,
                                       uint8_t decimals)
{
  if (!valid) {
    buffer[0] = '\0';
    return;
  }
  snprintf(buffer, bufferSize, "%.*f", static_cast<int>(decimals), value);
}

void serializeMeasurementJson(const Measurement &measurement, char *buffer, size_t bufferSize)
{
  char temperatureValue[32];
  char humidityValue[32];
  char weightValue[32];
  formatOptionalMeasurementValue(temperatureValue, sizeof(temperatureValue), measurement.temperatureC,
                                 measurement.bme680Valid, 1);
  formatOptionalMeasurementValue(humidityValue, sizeof(humidityValue), measurement.humidityPercent,
                                 measurement.bme680Valid, 1);
  formatOptionalMeasurementValue(weightValue, sizeof(weightValue), measurement.weightKg,
                                 measurement.loadCellValid, 2);

  const int written = snprintf(buffer, bufferSize,
                               "{\"temperature_c\":%s,\"humidity_percent\":%s,\"weight_kg\":%s,\"date\":\"%s\",\"time\":\"%s\",\"timestamp\":%lu}",
                               temperatureValue, humidityValue, weightValue, measurement.date,
                               measurement.time, static_cast<unsigned long>(measurement.timestamp));
  if (written < 0 || static_cast<size_t>(written) >= bufferSize) {
    strlcpy(buffer, "null", bufferSize);
  }
}

bool serializeMeasurementCsvLine(const Measurement &measurement, char *buffer, size_t bufferSize)
{
  char temperatureValue[32];
  char humidityValue[32];
  char weightValue[32];
  formatOptionalCsvMeasurementValue(temperatureValue, sizeof(temperatureValue), measurement.temperatureC,
                                    measurement.bme680Valid, 1);
  formatOptionalCsvMeasurementValue(humidityValue, sizeof(humidityValue), measurement.humidityPercent,
                                    measurement.bme680Valid, 1);
  formatOptionalCsvMeasurementValue(weightValue, sizeof(weightValue), measurement.weightKg,
                                    measurement.loadCellValid, 2);

  const int written = snprintf(buffer, bufferSize, "%s,%s,%lu,%s,%s,%s\n", measurement.date,
                               measurement.time, static_cast<unsigned long>(measurement.timestamp),
                               temperatureValue, humidityValue, weightValue);
  return written >= 0 && static_cast<size_t>(written) < bufferSize;
}

void serializeHistoryBucketJson(const HistoryBucket &bucket, char *buffer, size_t bufferSize)
{
  char temperatureValue[32];
  char humidityValue[32];
  char weightValue[32];
  formatOptionalMeasurementValue(temperatureValue, sizeof(temperatureValue),
                                 bucket.temperatureCount > 0
                                     ? bucket.temperatureSum / bucket.temperatureCount
                                     : 0.0F,
                                 bucket.temperatureCount > 0, 2);
  formatOptionalMeasurementValue(humidityValue, sizeof(humidityValue),
                                 bucket.humidityCount > 0 ? bucket.humiditySum / bucket.humidityCount : 0.0F,
                                 bucket.humidityCount > 0, 2);
  formatOptionalMeasurementValue(weightValue, sizeof(weightValue),
                                 bucket.weightCount > 0 ? bucket.weightSum / bucket.weightCount : 0.0F,
                                 bucket.weightCount > 0, 2);

  const int written = snprintf(buffer, bufferSize,
                               "{\"timestamp\":%lu,\"temperature_c\":%s,\"humidity_percent\":%s,\"weight_kg\":%s}",
                               static_cast<unsigned long>(bucket.timestamp), temperatureValue,
                               humidityValue, weightValue);
  if (written < 0 || static_cast<size_t>(written) >= bufferSize) {
    strlcpy(buffer, "null", bufferSize);
  }
}

void serializeMeasurementAggregateJson(const MeasurementAggregate &aggregate, bool includeRawSync,
                                       uint32_t periodSeconds, char *buffer, size_t bufferSize)
{
  char temperatureValue[32];
  char humidityValue[32];
  char weightValue[32];
  formatOptionalMeasurementValue(temperatureValue, sizeof(temperatureValue),
                                 aggregate.temperatureCount > 0
                                     ? aggregate.temperatureSum / aggregate.temperatureCount
                                     : 0.0F,
                                 aggregate.temperatureCount > 0, 2);
  formatOptionalMeasurementValue(humidityValue, sizeof(humidityValue),
                                 aggregate.humidityCount > 0
                                     ? aggregate.humiditySum / aggregate.humidityCount
                                     : 0.0F,
                                 aggregate.humidityCount > 0, 2);
  formatOptionalMeasurementValue(weightValue, sizeof(weightValue),
                                 aggregate.weightCount > 0 ? aggregate.weightSum / aggregate.weightCount : 0.0F,
                                 aggregate.weightCount > 0, 2);

  const int written = includeRawSync
                          ? snprintf(buffer, bufferSize,
                                     "{\"temperature_c\":%s,\"humidity_percent\":%s,\"weight_kg\":%s,\"timestamp\":%lu,\"sample_count\":%u,\"temperature_sample_count\":%u,\"humidity_sample_count\":%u,\"weight_sample_count\":%u,\"period_seconds\":%lu,\"sync_checksum\":%lu,\"raw_sample_count\":%u,\"raw_sync_checksum\":\"%lu\",\"raw_sync_version\":%u}",
                                     temperatureValue, humidityValue, weightValue,
                                     static_cast<unsigned long>(aggregate.timestamp), aggregate.count,
                                     aggregate.temperatureCount, aggregate.humidityCount,
                                     aggregate.weightCount, static_cast<unsigned long>(periodSeconds),
                                     static_cast<unsigned long>(aggregate.syncChecksum), aggregate.count,
                                     static_cast<unsigned long>(aggregate.syncChecksum), DAILY_RAW_SYNC_VERSION)
                          : snprintf(buffer, bufferSize,
                                     "{\"temperature_c\":%s,\"humidity_percent\":%s,\"weight_kg\":%s,\"timestamp\":%lu,\"sample_count\":%u,\"temperature_sample_count\":%u,\"humidity_sample_count\":%u,\"weight_sample_count\":%u,\"period_seconds\":%lu,\"sync_checksum\":%lu}",
                                     temperatureValue, humidityValue, weightValue,
                                     static_cast<unsigned long>(aggregate.timestamp), aggregate.count,
                                     aggregate.temperatureCount, aggregate.humidityCount,
                                     aggregate.weightCount, static_cast<unsigned long>(periodSeconds),
                                     static_cast<unsigned long>(aggregate.syncChecksum));
  if (written < 0 || static_cast<size_t>(written) >= bufferSize) {
    strlcpy(buffer, "null", bufferSize);
  }
}

uint32_t updateMeasurementChecksum(uint32_t checksum, const Measurement &measurement)
{
  constexpr uint32_t FNV_OFFSET_BASIS = 2166136261UL;
  constexpr uint32_t FNV_PRIME = 16777619UL;
  char temperatureValue[32];
  char humidityValue[32];
  char weightValue[32];
  char normalizedMeasurement[112];
  formatOptionalMeasurementValue(temperatureValue, sizeof(temperatureValue), measurement.temperatureC,
                                 measurement.bme680Valid, 1);
  formatOptionalMeasurementValue(humidityValue, sizeof(humidityValue), measurement.humidityPercent,
                                 measurement.bme680Valid, 1);
  formatOptionalMeasurementValue(weightValue, sizeof(weightValue), measurement.weightKg,
                                 measurement.loadCellValid, 2);
  snprintf(normalizedMeasurement, sizeof(normalizedMeasurement), "%lu,%s,%s,%s",
           static_cast<unsigned long>(measurement.timestamp), temperatureValue, humidityValue, weightValue);

  uint32_t result = checksum == 0 ? FNV_OFFSET_BASIS : checksum;
  for (const char *character = normalizedMeasurement; *character != '\0'; ++character) {
    result ^= static_cast<uint8_t>(*character);
    result *= FNV_PRIME;
  }
  return result;
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
  if (measurement.bme680Valid) {
    aggregate.temperatureSum += measurement.temperatureC;
    aggregate.humiditySum += measurement.humidityPercent;
    ++aggregate.temperatureCount;
    ++aggregate.humidityCount;
  }
  if (measurement.loadCellValid) {
    aggregate.weightSum += measurement.weightKg;
    ++aggregate.weightCount;
  }
  ++aggregate.count;
  aggregate.syncChecksum = updateMeasurementChecksum(aggregate.syncChecksum, measurement);
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

    pauseFirebaseRequestsAfterNetworkError(result.error().code());

    // Neuspešen asinhroni zapis verzije znova poskusimo v naslednji glavni zanki.
    if (result.uid() == "updateFirmwareVersion") {
      firmwareVersionReported = false;
    }
    if (result.uid() == "updateLatestMeasurement") {
      latestMeasurementUploadInFlight = false;
      latestMeasurementUploadPending = true;
    }
    if (result.uid() == "updateDeviceHeartbeat") {
      deviceHeartbeatInFlight = false;
      deviceHeartbeatPending = true;
    }
    if (result.uid() == "updateDeviceStatus") {
      deviceStatusInFlight = false;
      deviceStatusPending = true;
      // Ob napaki mora ponovitev istega posnetka vključiti tudi morebitne vmesne spremembe.
      deviceStatusDirtyDuringFlight = false;
    }
    if (result.uid() == "updateSDCardStatus") {
      // Potrjenega posnetka ne spreminjamo; isto trenutno stanje ostane pending za omejen retry.
      sdCardStatusCloudInFlight = false;
      sdCardStatusCloudPending = true;
      sdCardStatusCloudDirtyDuringFlight = false;
    }
    if (result.uid() == "updateLoadCellTareStatus") {
      loadCellTareStatusReported = false;
    }
    if (result.uid() == "updateBme680CalibrationStatus") {
      bme680CalibrationStatusReported = false;
    }
    if (result.uid() == "publishActivationSecret") {
      activationSecretPublishInFlight = false;
      activationSecretPublishPending = true;
    }
    if (result.uid() == "clearControlCommand") {
      controlCommandClearPending = true;
    }
    if (isCloudSyncRequest(result.uid())) {
      const CloudSyncRequestType failedRequestType = cloudSyncRequestType;
      markCloudSyncFailure();
      if (result.error().code() == 401 &&
          (failedRequestType == CloudSyncRequestType::DailyReconciliationIndex ||
           failedRequestType == CloudSyncRequestType::ReconciliationMeasurement ||
           failedRequestType == CloudSyncRequestType::ReconciliationHourlyAggregate ||
           failedRequestType == CloudSyncRequestType::ReconciliationDailyAggregate)) {
        markCloudHistoryReconciliationError();
        Serial.println("Cloud history reconciliation stopped: Firebase access was denied.");
      }
    }
    if (isHistoryDeletionRequest(result.uid())) {
      historyDeletionRequestPending = false;
    }
    if (isWiFiCredentialResetRequest(result.uid())) {
      wifiCredentialResetRequestPending = false;
    }
    return;
  }

  if (result.available()) {
    clearFirebaseNetworkErrorBackoff();
    if (result.uid() == "updateLatestMeasurement") {
      latestMeasurementUploadInFlight = false;
    }
    if (result.uid() == "updateDeviceHeartbeat") {
      deviceHeartbeatInFlight = false;
      deviceHeartbeatPending = false;
      lastDeviceHeartbeatMillis = millis();
    }
    if (result.uid() == "updateDeviceStatus") {
      const bool currentStateNeedsNewSnapshot = deviceStatusDirtyDuringFlight;
      deviceStatusInFlight = false;
      deviceStatusDirtyDuringFlight = false;
      deviceStatusPending = currentStateNeedsNewSnapshot;
      lastDeviceStatusMillis = millis();
      // Po uspehu je naslednja dejansko nova sprememba lahko poslana takoj; 30 s velja le za retry po napaki.
      lastDeviceStatusAttemptMillis = 0;
      // Celotni posnetek vključuje tudi strežniški heartbeat in zato potrdi oba časovnika.
      lastDeviceHeartbeatMillis = lastDeviceStatusMillis;
      deviceHeartbeatPending = false;
    }
    if (result.uid() == "updateSDCardStatus") {
      const bool currentError = sdInitializationFailures >= MAX_SD_INITIALIZATION_FAILURES;
      const bool currentStateNeedsNewSnapshot = sdCardStatusCloudDirtyDuringFlight ||
                                                sdCardReady != sdCardStatusCloudInFlightPresent ||
                                                sdInitializationFailures !=
                                                    sdCardStatusCloudInFlightInitializationFailures ||
                                                currentError != sdCardStatusCloudInFlightError;
      sdCardStatusCloudPublished = true;
      sdCardStatusCloudPublishedPresent = sdCardStatusCloudInFlightPresent;
      sdCardStatusCloudPublishedInitializationFailures =
          sdCardStatusCloudInFlightInitializationFailures;
      sdCardStatusCloudPublishedError = sdCardStatusCloudInFlightError;
      sdCardStatusCloudInFlight = false;
      sdCardStatusCloudDirtyDuringFlight = false;
      sdCardStatusCloudPending = currentStateNeedsNewSnapshot;
      // Uspešen zapis omogoči takojšnjo objavo novega snapshot-a; 30 s velja le po napaki.
      lastSDStatusCloudAttemptMillis = 0;
    }
    if (result.uid() == "publishActivationSecret") {
      activationSecretPublishInFlight = false;
      const String responsePayload = result.payload();
      if (responsePayload.indexOf("error") >= 0 || responsePayload.indexOf("unauthorized") >= 0) {
        activationSecretPublishPending = true;
        return;
      }
      activationSecretPublishPending = false;
      lastActivationSecretAttemptMillis = 0;
      if (!activationSecretRegistrationReported) {
        activationSecretRegistrationReported = true;
        Serial.println("Device activation secret was registered.");
      }
      return;
    }
    if (isCloudSyncRequest(result.uid())) {
      const String responsePayload = result.payload();
      if (responsePayload.indexOf("error") >= 0 || responsePayload.indexOf("unauthorized") >= 0) {
        const CloudSyncRequestType failedRequestType = cloudSyncRequestType;
        markCloudSyncFailure();
        if (failedRequestType == CloudSyncRequestType::DailyReconciliationIndex ||
            failedRequestType == CloudSyncRequestType::ReconciliationMeasurement ||
            failedRequestType == CloudSyncRequestType::ReconciliationHourlyAggregate ||
            failedRequestType == CloudSyncRequestType::ReconciliationDailyAggregate) {
          markCloudHistoryReconciliationError();
          Serial.println("Cloud history reconciliation stopped: Firebase rejected the request.");
        }
        return;
      }

      const CloudSyncRequestType completedRequestType = cloudSyncRequestType;
      const bool staleReconciliationResult =
          (completedRequestType == CloudSyncRequestType::DailyReconciliationIndex &&
           cloudReconciliationState != CloudReconciliationState::ReadingCloudIndex) ||
          ((completedRequestType == CloudSyncRequestType::ReconciliationMeasurement ||
            completedRequestType == CloudSyncRequestType::ReconciliationHourlyAggregate ||
            completedRequestType == CloudSyncRequestType::ReconciliationDailyAggregate) &&
           cloudReconciliationState != CloudReconciliationState::ReconcilingDays);
      cloudSyncPending = false;
      cloudSyncRequestStartedMillis = 0;
      cloudSyncRequestType = CloudSyncRequestType::None;
      cloudSyncRetryIntervalMs = CLOUD_SYNC_INTERVAL_MS;
      // Reconciliation se je med asinhronim GET/PATCH-om lahko že varno zaključil z napako.
      // Tak pozni odgovor samo zaključi opravilo odjemalca in ne sme obuditi state machine-a.
      if (staleReconciliationResult) return;
      if (completedRequestType == CloudSyncRequestType::DailyReconciliationIndex) {
        if (!processCloudHistoryReconciliationIndex(responsePayload)) {
          markCloudHistoryReconciliationError();
        }
      } else if (completedRequestType == CloudSyncRequestType::Measurement) {
        recordSynchronizedMeasurement();
      } else if (completedRequestType == CloudSyncRequestType::ReconciliationMeasurement ||
                 completedRequestType == CloudSyncRequestType::ReconciliationHourlyAggregate ||
                 completedRequestType == CloudSyncRequestType::ReconciliationDailyAggregate) {
        completeCloudHistoryReconciliationRequest(completedRequestType);
      } else {
        completeCloudAggregateRequest(completedRequestType);
      }
      return;
    }
    if (isHistoryDeletionRequest(result.uid())) {
      result.payload();
      historyDeletionRequestPending = false;
      completeHistoryDeletionRequest();
      return;
    }
    if (isWiFiCredentialResetRequest(result.uid())) {
      result.payload();
      wifiCredentialResetRequestPending = false;
      completeWiFiCredentialResetRequest();
      return;
    }
    // Preberemo odgovor, da knjižnica zaključene asinhrone zahteve ne vrne še enkrat.
    result.payload();
    Serial.print("Firebase write complete: ");
    Serial.println(result.uid());
  }
}

// --- Senzorji ---------------------------------------------------------------

uint8_t decimalToBcd(uint8_t value)
{
  return static_cast<uint8_t>(((value / 10U) << 4U) | (value % 10U));
}

bool decodeBcd(uint8_t encoded, uint8_t mask, uint8_t minimum, uint8_t maximum, uint8_t &value)
{
  const uint8_t bcd = encoded & mask;
  const uint8_t high = bcd >> 4U;
  const uint8_t low = bcd & 0x0FU;
  if (high > 9 || low > 9) return false;

  value = static_cast<uint8_t>(high * 10U + low);
  return value >= minimum && value <= maximum;
}

bool isLeapYear(int year)
{
  return year % 4 == 0 && (year % 100 != 0 || year % 400 == 0);
}

uint8_t daysInMonth(int year, uint8_t month)
{
  static constexpr uint8_t DAYS_PER_MONTH[] = {31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31};
  if (month < 1 || month > 12) return 0;
  if (month == 2 && isLeapYear(year)) return 29;
  return DAYS_PER_MONTH[month - 1];
}

int64_t daysFromCivil(int year, unsigned month, unsigned day)
{
  year -= month <= 2;
  const int era = (year >= 0 ? year : year - 399) / 400;
  const unsigned yearOfEra = static_cast<unsigned>(year - era * 400);
  const unsigned adjustedMonth = month > 2 ? month - 3U : month + 9U;
  const unsigned dayOfYear = (153U * adjustedMonth + 2U) / 5U + day - 1U;
  const unsigned dayOfEra = yearOfEra * 365U + yearOfEra / 4U - yearOfEra / 100U + dayOfYear;
  return static_cast<int64_t>(era) * 146097LL + static_cast<int64_t>(dayOfEra) - 719468LL;
}

bool utcDateTimeToTimestamp(int year, uint8_t month, uint8_t day, uint8_t hour, uint8_t minute,
                            uint8_t second, time_t &timestamp)
{
  if (year < 2000 || year > 2099 || month < 1 || month > 12 || day < 1 ||
      day > daysInMonth(year, month) || hour > 23 || minute > 59 || second > 59) {
    return false;
  }

  const int64_t seconds = daysFromCivil(year, month, day) * 86400LL +
                          static_cast<int64_t>(hour) * 3600LL +
                          static_cast<int64_t>(minute) * 60LL + second;
  if (seconds < MIN_VALID_UNIX_TIMESTAMP || seconds > MAX_SETTABLE_UNIX_TIMESTAMP) return false;
  timestamp = static_cast<time_t>(seconds);
  return true;
}

bool readDs3231Registers(uint8_t startRegister, uint8_t *buffer, size_t length)
{
  Wire.beginTransmission(DS3231_ADDRESS);
  Wire.write(startRegister);
  if (Wire.endTransmission(false) != 0) return false;
  if (Wire.requestFrom(DS3231_ADDRESS, static_cast<uint8_t>(length)) != length) return false;

  for (size_t index = 0; index < length; ++index) {
    buffer[index] = Wire.read();
  }
  return true;
}

bool writeDs3231Registers(uint8_t startRegister, const uint8_t *buffer, size_t length)
{
  Wire.beginTransmission(DS3231_ADDRESS);
  Wire.write(startRegister);
  Wire.write(buffer, length);
  return Wire.endTransmission() == 0;
}

bool readDs3231Timestamp(time_t &timestamp)
{
  uint8_t status = 0;
  if (!readDs3231Registers(DS3231_STATUS_REGISTER, &status, 1) ||
      (status & DS3231_OSCILLATOR_STOP_FLAG) != 0) {
    return false;
  }

  uint8_t registers[7]{};
  if (!readDs3231Registers(DS3231_TIME_REGISTER, registers, sizeof(registers))) return false;

  uint8_t second;
  uint8_t minute;
  uint8_t hour;
  uint8_t day;
  uint8_t month;
  uint8_t year;
  if (!decodeBcd(registers[0], 0x7F, 0, 59, second) ||
      !decodeBcd(registers[1], 0x7F, 0, 59, minute)) {
    return false;
  }

  if ((registers[2] & 0x40U) != 0) {
    uint8_t hour12;
    if (!decodeBcd(registers[2], 0x1F, 1, 12, hour12)) return false;
    hour = static_cast<uint8_t>(hour12 % 12U + ((registers[2] & 0x20U) != 0 ? 12U : 0U));
  } else if (!decodeBcd(registers[2], 0x3F, 0, 23, hour)) {
    return false;
  }

  if (!decodeBcd(registers[4], 0x3F, 1, 31, day) ||
      !decodeBcd(registers[5], 0x1F, 1, 12, month) ||
      !decodeBcd(registers[6], 0xFF, 0, 99, year)) {
    return false;
  }
  return utcDateTimeToTimestamp(2000 + year, month, day, hour, minute, second, timestamp);
}

bool writeDs3231Timestamp(time_t timestamp)
{
  if (!rtcReady || timestamp < MIN_VALID_UNIX_TIMESTAMP || timestamp > MAX_SETTABLE_UNIX_TIMESTAMP) {
    return false;
  }

  struct tm utcTime{};
  if (gmtime_r(&timestamp, &utcTime) == nullptr || utcTime.tm_year + 1900 > 2099) return false;

  const uint8_t registers[] = {
      decimalToBcd(static_cast<uint8_t>(utcTime.tm_sec)),
      decimalToBcd(static_cast<uint8_t>(utcTime.tm_min)),
      decimalToBcd(static_cast<uint8_t>(utcTime.tm_hour)),
      decimalToBcd(static_cast<uint8_t>(utcTime.tm_wday + 1)),
      decimalToBcd(static_cast<uint8_t>(utcTime.tm_mday)),
      decimalToBcd(static_cast<uint8_t>(utcTime.tm_mon + 1)),
      decimalToBcd(static_cast<uint8_t>((utcTime.tm_year + 1900) - 2000)),
  };
  if (!writeDs3231Registers(DS3231_TIME_REGISTER, registers, sizeof(registers))) return false;

  uint8_t status = 0;
  if (!readDs3231Registers(DS3231_STATUS_REGISTER, &status, 1)) return false;
  status &= static_cast<uint8_t>(~DS3231_OSCILLATOR_STOP_FLAG);
  if (!writeDs3231Registers(DS3231_STATUS_REGISTER, &status, 1)) return false;
  setRtcTimeValid(true);
  return true;
}

bool setSystemTimestamp(time_t timestamp)
{
  if (timestamp < MIN_VALID_UNIX_TIMESTAMP || timestamp > MAX_SETTABLE_UNIX_TIMESTAMP) return false;
  const timeval systemTime{timestamp, 0};
  return settimeofday(&systemTime, nullptr) == 0;
}

const char *timeSourceName()
{
  switch (currentTimeSource) {
    case TimeSource::Rtc: return "rtc";
    case TimeSource::Ntp: return "ntp";
    case TimeSource::ManualLocal: return "manual_local";
    case TimeSource::ManualCloud: return "manual_cloud";
    case TimeSource::Unavailable:
    default: return "unavailable";
  }
}

void initializeI2c()
{
  Wire.begin(BME680_SDA_PIN, BME680_SCL_PIN);
  // Pri prekinjenem I2C vodilu ne smemo dolgo zadržati glavne zanke in spletnega strežnika.
  Wire.setTimeOut(50);
}

bool initializeRtc()
{
  Wire.beginTransmission(DS3231_ADDRESS);
  if (Wire.endTransmission() != 0) {
    rtcReady = false;
    setRtcTimeValid(false);
    reportComponentFailure(rtcStatus, "DS3231", "ni zaznan na I2C naslovu 0x68");
    Serial.println("DS3231 was not detected on I2C address 0x68.");
    return false;
  }

  rtcReady = true;
  reportComponentSuccess(rtcStatus, "DS3231");
  time_t rtcTimestamp = 0;
  setRtcTimeValid(readDs3231Timestamp(rtcTimestamp));
  if (!rtcTimeValid) {
    Serial.println("DS3231 detected, but its time is invalid or the backup oscillator stopped.");
    return true;
  }
  if (!setSystemTimestamp(rtcTimestamp)) {
    setRtcTimeValid(false);
    Serial.println("DS3231 time could not be applied to the ESP32 system clock.");
    return true;
  }

  currentTimeSource = TimeSource::Rtc;
  lastTimeSynchronizationTimestamp = rtcTimestamp;
  Serial.printf("System time restored from DS3231: %lu UTC.\n", static_cast<unsigned long>(rtcTimestamp));
  return true;
}

bool verifyDs3231Connection()
{
  uint8_t status = 0;
  if (!readDs3231Registers(DS3231_STATUS_REGISTER, &status, 1)) {
    rtcReady = false;
    setRtcTimeValid(false);
    reportComponentFailure(rtcStatus, "DS3231", "ni dosegljiv na I2C vodilu");
    return false;
  }

  rtcReady = true;
  time_t timestamp = 0;
  setRtcTimeValid(readDs3231Timestamp(timestamp));
  reportComponentSuccess(rtcStatus, "DS3231");
  return true;
}

bool loadStoredLoadCellOffset(long &offset)
{
  if (!preferences.begin(SENSOR_SETTINGS_NAMESPACE, true)) return false;

  const bool offsetAvailable = preferences.isKey(HX711_OFFSET_KEY);
  if (offsetAvailable) {
    offset = preferences.getLong(HX711_OFFSET_KEY, 0);
  }
  preferences.end();
  return offsetAvailable;
}

bool storeLoadCellOffset(long offset)
{
  if (!preferences.begin(SENSOR_SETTINGS_NAMESPACE, false)) return false;

  const size_t writtenBytes = preferences.putLong(HX711_OFFSET_KEY, offset);
  preferences.end();
  return writtenBytes == sizeof(int32_t);
}

bool loadBme680Calibration()
{
  if (!preferences.begin(SENSOR_SETTINGS_NAMESPACE, true)) return false;

  bme680TemperatureOffsetC = preferences.getFloat(BME680_TEMPERATURE_OFFSET_KEY, 0.0F);
  bme680HumidityOffsetPercent = preferences.getFloat(BME680_HUMIDITY_OFFSET_KEY, 0.0F);
  preferences.end();

  const bool offsetsAreValid = isfinite(bme680TemperatureOffsetC) &&
                               isfinite(bme680HumidityOffsetPercent) &&
                               bme680TemperatureOffsetC >= BME680_TEMPERATURE_OFFSET_MIN_C &&
                               bme680TemperatureOffsetC <= BME680_TEMPERATURE_OFFSET_MAX_C &&
                               bme680HumidityOffsetPercent >= BME680_HUMIDITY_OFFSET_MIN_PERCENT &&
                               bme680HumidityOffsetPercent <= BME680_HUMIDITY_OFFSET_MAX_PERCENT;
  if (!offsetsAreValid) {
    bme680TemperatureOffsetC = 0.0F;
    bme680HumidityOffsetPercent = 0.0F;
  }

  Serial.printf("BME680 calibration: temperature %+.1f C, humidity %+.1f %%\n",
                bme680TemperatureOffsetC, bme680HumidityOffsetPercent);
  return offsetsAreValid;
}

bool storeBme680Calibration(float temperatureOffsetC, float humidityOffsetPercent)
{
  if (!preferences.begin(SENSOR_SETTINGS_NAMESPACE, false)) return false;

  const size_t temperatureBytes = preferences.putFloat(BME680_TEMPERATURE_OFFSET_KEY, temperatureOffsetC);
  const size_t humidityBytes = preferences.putFloat(BME680_HUMIDITY_OFFSET_KEY, humidityOffsetPercent);
  preferences.end();
  return temperatureBytes == sizeof(float) && humidityBytes == sizeof(float);
}

bool areMeasurementSettingsValid(uint32_t measurementIntervalSeconds, uint32_t sdArchiveIntervalMinutes,
                                 uint32_t displayDecimals)
{
  return measurementIntervalSeconds >= MEASUREMENT_INTERVAL_MIN_SECONDS &&
         measurementIntervalSeconds <= MEASUREMENT_INTERVAL_MAX_SECONDS &&
         sdArchiveIntervalMinutes >= SD_ARCHIVE_INTERVAL_MIN_MINUTES &&
         sdArchiveIntervalMinutes <= SD_ARCHIVE_INTERVAL_MAX_MINUTES &&
         sdArchiveIntervalMinutes * 60U >= measurementIntervalSeconds &&
         (displayDecimals == 1 || displayDecimals == 2);
}

bool storeMeasurementSettings(uint32_t measurementIntervalSeconds, uint32_t sdArchiveIntervalMinutes,
                              uint32_t displayDecimals)
{
  if (!areMeasurementSettingsValid(measurementIntervalSeconds, sdArchiveIntervalMinutes, displayDecimals) ||
      !preferences.begin(DEVICE_SETTINGS_NAMESPACE, false)) {
    return false;
  }

  const bool measurementStored = preferences.putUShort(MEASUREMENT_INTERVAL_KEY, measurementIntervalSeconds) ==
                                 sizeof(uint16_t);
  const bool archiveStored = preferences.putUChar(SD_ARCHIVE_INTERVAL_KEY, sdArchiveIntervalMinutes) == sizeof(uint8_t);
  const bool decimalsStored = preferences.putUChar(WEIGHT_DISPLAY_DECIMALS_KEY, displayDecimals) == sizeof(uint8_t);
  preferences.end();
  return measurementStored && archiveStored && decimalsStored;
}

void loadMeasurementSettings()
{
  const uint32_t defaultMeasurementSeconds = DEFAULT_MEASUREMENT_INTERVAL_MS / 1000U;
  const uint32_t defaultArchiveMinutes = DEFAULT_SD_MEASUREMENT_INTERVAL_MS / (60U * 1000U);
  uint32_t measurementIntervalSeconds = defaultMeasurementSeconds;
  uint32_t sdArchiveIntervalMinutes = defaultArchiveMinutes;
  uint32_t displayDecimals = DEFAULT_WEIGHT_DISPLAY_DECIMALS;

  if (preferences.begin(DEVICE_SETTINGS_NAMESPACE, true)) {
    measurementIntervalSeconds = preferences.getUShort(MEASUREMENT_INTERVAL_KEY, defaultMeasurementSeconds);
    sdArchiveIntervalMinutes = preferences.getUChar(SD_ARCHIVE_INTERVAL_KEY, defaultArchiveMinutes);
    displayDecimals = preferences.getUChar(WEIGHT_DISPLAY_DECIMALS_KEY, DEFAULT_WEIGHT_DISPLAY_DECIMALS);
    preferences.end();
  }
  if (!areMeasurementSettingsValid(measurementIntervalSeconds, sdArchiveIntervalMinutes, displayDecimals)) {
    measurementIntervalSeconds = defaultMeasurementSeconds;
    sdArchiveIntervalMinutes = defaultArchiveMinutes;
    displayDecimals = DEFAULT_WEIGHT_DISPLAY_DECIMALS;
  }

  measurementIntervalMs = measurementIntervalSeconds * 1000U;
  sdMeasurementIntervalMs = sdArchiveIntervalMinutes * 60U * 1000U;
  weightDisplayDecimals = static_cast<uint8_t>(displayDecimals);
}

bool applyMeasurementSettings(uint32_t measurementIntervalSeconds, uint32_t sdArchiveIntervalMinutes,
                              uint32_t displayDecimals)
{
  if (!areMeasurementSettingsValid(measurementIntervalSeconds, sdArchiveIntervalMinutes, displayDecimals)) {
    return false;
  }
  if (!storeMeasurementSettings(measurementIntervalSeconds, sdArchiveIntervalMinutes, displayDecimals)) {
    return false;
  }

  measurementIntervalMs = measurementIntervalSeconds * 1000U;
  sdMeasurementIntervalMs = sdArchiveIntervalMinutes * 60U * 1000U;
  weightDisplayDecimals = static_cast<uint8_t>(displayDecimals);
  lastMeasurementMillis = 0;
  lastSDMeasurementMillis = 0;
  return true;
}

bool initializeBme680()
{
  if (!bme680.begin(BME680_PRIMARY_ADDRESS) && !bme680.begin(BME680_SECONDARY_ADDRESS)) {
    reportComponentFailure(bme680Status, "BME680", "ni zaznan na I2C naslovih 0x76 ali 0x77");
    Serial.println("BME680 was not detected on I2C addresses 0x76 or 0x77.");
    return false;
  }

  bme680.setTemperatureOversampling(BME680_OS_8X);
  bme680.setHumidityOversampling(BME680_OS_2X);
  bme680.setIIRFilterSize(BME680_FILTER_SIZE_3);
  bme680.setGasHeater(320, 150);
  reportComponentSuccess(bme680Status, "BME680");
  Serial.println("BME680 initialized.");
  return true;
}

void resetLoadCellWeightFilter()
{
  loadCellReferenceAvailable = false;
  lastLoadCellWeightKg = 0.0F;
  loadCellCandidateAvailable = false;
  loadCellCandidateWeightKg = 0.0F;
}

bool initializeLoadCell()
{
  resetLoadCellWeightFilter();
  loadCell.begin(HX711_DOUT_PIN, HX711_SCK_PIN);
  // Vgrajen pull-up prepreči lebdeče DOUT stanje, kadar je HX711 brez napajanja.
  pinMode(HX711_DOUT_PIN, INPUT_PULLUP);
  if (!loadCell.wait_ready_timeout(HX711_READY_TIMEOUT_MS)) {
    reportComponentFailure(loadCellStatus, "HX711", "ni pripravljen; preveri napajanje, DOUT in SCK");
    Serial.println("HX711 is not ready. Check power, DOUT and SCK wiring.");
    return false;
  }

  loadCell.set_scale(HX711_CALIBRATION_FACTOR);
  reportComponentSuccess(loadCellStatus, "HX711");
  long offset = 0;
  if (loadStoredLoadCellOffset(offset)) {
    loadCell.set_offset(offset);
    Serial.printf("HX711 initialized with saved tare offset %ld.\n", offset);
    return true;
  }

  // Prvo tariranje se izvede samo brez shranjenega odmika. Ploščad mora biti takrat prazna.
  Serial.println("HX711 has no saved tare offset; taring with an empty platform.");
  loadCell.tare(HX711_TARE_SAMPLES);
  offset = loadCell.get_offset();
  if (!storeLoadCellOffset(offset)) {
    Serial.println("HX711 tare offset could not be saved to NVS.");
  }
  Serial.printf("HX711 initialized. Tare offset: %ld, calibration factor: %.2f.\n", offset,
                HX711_CALIBRATION_FACTOR);
  return true;
}

bool acceptLoadCellWeight(float measuredWeightKg, float &acceptedWeightKg)
{
  if (!loadCellReferenceAvailable) {
    lastLoadCellWeightKg = measuredWeightKg;
    loadCellReferenceAvailable = true;
    loadCellCandidateAvailable = false;
    acceptedWeightKg = measuredWeightKg;
    return true;
  }

  const float referenceDifferenceKg = fabsf(measuredWeightKg - lastLoadCellWeightKg);
  if (referenceDifferenceKg <= HX711_MAX_STEP_CHANGE_KG) {
    if (loadCellCandidateAvailable) {
      Serial.printf("HX711 weight candidate rejected: candidate=%.1f kg, current=%.1f kg\n",
                    loadCellCandidateWeightKg, measuredWeightKg);
    }
    loadCellCandidateAvailable = false;
    lastLoadCellWeightKg = measuredWeightKg;
    acceptedWeightKg = measuredWeightKg;
    return true;
  }

  // Kandidat iz prejšnjega nejasnega cikla je rezervni mehanizem. Običajen
  // velik skok se spodaj vedno poskusi potrditi takoj z dodatnim branjem.
  if (loadCellCandidateAvailable &&
      fabsf(measuredWeightKg - loadCellCandidateWeightKg) <= HX711_STEP_CONFIRM_TOLERANCE_KG) {
    acceptedWeightKg = (loadCellCandidateWeightKg + measuredWeightKg) * 0.5F;
    lastLoadCellWeightKg = acceptedWeightKg;
    loadCellReferenceAvailable = true;
    loadCellCandidateAvailable = false;
    Serial.printf("HX711 pending large weight change confirmed: %.2f kg\n", acceptedWeightKg);
    return true;
  }

  if (loadCellCandidateAvailable) {
    Serial.printf("HX711 weight candidate rejected: candidate=%.1f kg, current=%.1f kg\n",
                  loadCellCandidateWeightKg, measuredWeightKg);
  }

  loadCellCandidateWeightKg = measuredWeightKg;
  loadCellCandidateAvailable = true;
  Serial.printf("HX711 large weight change detected: old=%.1f kg, first=%.1f kg\n",
                lastLoadCellWeightKg, measuredWeightKg);

  if (!loadCell.wait_ready_timeout(HX711_READY_TIMEOUT_MS)) {
    reportComponentFailure(loadCellStatus, "HX711",
                           "potrditvena meritev ni mogoča, ker pretvornik ni dosegljiv");
    if (componentHealth(loadCellStatus) == ComponentHealth::Error) loadCellReady = false;
    return false;
  }

  float confirmationWeightKg = loadCell.get_units(HX711_READ_SAMPLES);
  if (!isfinite(confirmationWeightKg)) {
    reportComponentFailure(loadCellStatus, "HX711", "potrditvena meritev je vrnila neveljavno maso");
    if (componentHealth(loadCellStatus) == ComponentHealth::Error) loadCellReady = false;
    return false;
  }

  reportComponentSuccess(loadCellStatus, "HX711");
  if (fabsf(confirmationWeightKg) < 0.02F) confirmationWeightKg = 0.0F;
  Serial.printf("HX711 confirmation read: %.1f kg\n", confirmationWeightKg);

  if (fabsf(measuredWeightKg - confirmationWeightKg) <= HX711_STEP_CONFIRM_TOLERANCE_KG) {
    acceptedWeightKg = (measuredWeightKg + confirmationWeightKg) * 0.5F;
    if (fabsf(acceptedWeightKg) < 0.02F) acceptedWeightKg = 0.0F;
    lastLoadCellWeightKg = acceptedWeightKg;
    loadCellReferenceAvailable = true;
    loadCellCandidateAvailable = false;
    Serial.printf("HX711 large weight change confirmed: %.2f kg\n", acceptedWeightKg);
    return true;
  }

  if (fabsf(confirmationWeightKg - lastLoadCellWeightKg) <= HX711_MAX_STEP_CHANGE_KG) {
    acceptedWeightKg = confirmationWeightKg;
    lastLoadCellWeightKg = acceptedWeightKg;
    loadCellReferenceAvailable = true;
    loadCellCandidateAvailable = false;
    Serial.printf("HX711 large weight change rejected; using confirmed reference-side reading: %.1f kg\n",
                  acceptedWeightKg);
    return true;
  }

  // Obe veljavni meritvi sta dale različen velik skok. Novejši odčitek ostane
  // kandidat za naslednji cikel, vendar ne vpliva na health diagnostiko HX711.
  loadCellCandidateWeightKg = confirmationWeightKg;
  Serial.printf("HX711 confirmation was inconclusive; pending candidate=%.1f kg\n",
                loadCellCandidateWeightKg);
  return false;
}

bool readBme680(float &temperatureC, float &humidityPercent)
{
  if (!bme680Ready) {
    reportComponentFailure(bme680Status, "BME680", "meritev ni mogoča, ker senzor ni dosegljiv");
    return false;
  }
  if (!bme680.performReading()) {
    reportComponentFailure(bme680Status, "BME680", "branje meritve ni uspelo");
    if (componentHealth(bme680Status) == ComponentHealth::Error) bme680Ready = false;
    return false;
  }

  const float rawTemperatureC = bme680.temperature;
  const float rawHumidityPercent = bme680.humidity;
  if (!isfinite(rawTemperatureC) || !isfinite(rawHumidityPercent)) {
    reportComponentFailure(bme680Status, "BME680", "vrnil je neveljavne podatke");
    if (componentHealth(bme680Status) == ComponentHealth::Error) bme680Ready = false;
    return false;
  }

  temperatureC = rawTemperatureC + bme680TemperatureOffsetC;
  humidityPercent = fminf(100.0F, fmaxf(0.0F, rawHumidityPercent + bme680HumidityOffsetPercent));
  if (!isfinite(temperatureC)) {
    reportComponentFailure(bme680Status, "BME680", "izračunana temperatura ni veljavna");
    if (componentHealth(bme680Status) == ComponentHealth::Error) bme680Ready = false;
    return false;
  }
  reportComponentSuccess(bme680Status, "BME680");
  return true;
}

bool readLoadCell(float &weightKg)
{
  if (!loadCellReady || !loadCell.wait_ready_timeout(HX711_READY_TIMEOUT_MS)) {
    reportComponentFailure(loadCellStatus, "HX711", "meritev ni mogoča, ker pretvornik ni dosegljiv");
    if (componentHealth(loadCellStatus) == ComponentHealth::Error) loadCellReady = false;
    return false;
  }

  float measuredWeightKg = loadCell.get_units(HX711_READ_SAMPLES);
  if (!isfinite(measuredWeightKg)) {
    reportComponentFailure(loadCellStatus, "HX711", "vrnil je neveljavno maso");
    if (componentHealth(loadCellStatus) == ComponentHealth::Error) loadCellReady = false;
    return false;
  }

  // Veljavna ADC vrednost potrjuje delovanje HX711 ne glede na rezultat filtra mase.
  reportComponentSuccess(loadCellStatus, "HX711");
  if (fabsf(measuredWeightKg) < 0.02F) measuredWeightKg = 0.0F;
  return acceptLoadCellWeight(measuredWeightKg, weightKg);
}

void maintainComponentRecovery(uint32_t currentMillis)
{
  if (lastComponentRecoveryMillis != 0 &&
      currentMillis - lastComponentRecoveryMillis < COMPONENT_RECOVERY_INTERVAL_MS) {
    return;
  }
  lastComponentRecoveryMillis = currentMillis;

  if (!bme680Ready) {
    Serial.println("[KOMPONENTA] Poskušam znova inicializirati BME680.");
    bme680Ready = initializeBme680();
  }

  if (!loadCellReady) {
    Serial.println("[KOMPONENTA] Poskušam znova inicializirati HX711.");
    loadCellReady = initializeLoadCell();
  }

  if (rtcReady) {
    verifyDs3231Connection();
  } else {
    Serial.println("[KOMPONENTA] Poskušam znova inicializirati DS3231.");
    initializeRtc();
  }
}

// --- Omrežje in čas ---------------------------------------------------------

void initializeWiFiEventHandlers()
{
  WiFi.onEvent([](WiFiEvent_t event, WiFiEventInfo_t info) {
    switch (event) {
      case ARDUINO_EVENT_WIFI_STA_GOT_IP:
        stationGotIpAddress = true;
        stationGotIpMillis = millis();
        wifiConnectionLostMillis = 0;
        Serial.printf("Wi-Fi station received IP address: %s\n", WiFi.localIP().toString().c_str());
        break;
      case ARDUINO_EVENT_WIFI_STA_DISCONNECTED:
        stationGotIpAddress = false;
        stationGotIpMillis = 0;
        if (wifiConnectionLostMillis == 0) wifiConnectionLostMillis = millis();
        Serial.printf("Wi-Fi station disconnected (reason %u).\n",
                      static_cast<unsigned>(info.wifi_sta_disconnected.reason));
        break;
      case ARDUINO_EVENT_WIFI_STA_LOST_IP:
        stationGotIpAddress = false;
        stationGotIpMillis = 0;
        if (wifiConnectionLostMillis == 0) wifiConnectionLostMillis = millis();
        Serial.println("Wi-Fi station lost its IP address.");
        break;
      case ARDUINO_EVENT_WIFI_AP_START:
        accessPointActive = true;
        Serial.println("Provisioning AP radio started.");
        break;
      case ARDUINO_EVENT_WIFI_AP_STOP:
        accessPointActive = false;
        Serial.println("Provisioning AP radio stopped.");
        break;
      case ARDUINO_EVENT_WIFI_AP_STACONNECTED:
        Serial.println("Phone or computer connected to the provisioning AP.");
        break;
      case ARDUINO_EVENT_WIFI_AP_STAIPASSIGNED:
        Serial.println("Provisioning AP assigned an IP address to the client.");
        break;
      case ARDUINO_EVENT_WIFI_AP_STADISCONNECTED:
        Serial.printf("Client disconnected from the provisioning AP (reason %u).\n",
                      static_cast<unsigned>(info.wifi_ap_stadisconnected.reason));
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

  // Stanje cloud ukaza je ločeno od nastavitev naprave. Pending ukaz po rebootu
  // znova prispe prek SSE, dokončno izveden pa se ne sme izvesti drugič.
  if (preferences.begin(CONTROL_REQUEST_NAMESPACE, true)) {
    const String storedControlRequestId = preferences.getString(CONTROL_LAST_REQUEST_ID_KEY, "");
    if (storedControlRequestId.length() > 0 &&
        storedControlRequestId.length() < sizeof(lastProcessedControlRequestId)) {
      storedControlRequestId.toCharArray(lastProcessedControlRequestId,
                                         sizeof(lastProcessedControlRequestId));
    }
    const String storedPendingControlRequestId = preferences.getString(CONTROL_PENDING_REQUEST_ID_KEY, "");
    if (storedPendingControlRequestId.length() > 0 &&
        storedPendingControlRequestId.length() < sizeof(pendingControlRequestId)) {
      storedPendingControlRequestId.toCharArray(pendingControlRequestId,
                                                sizeof(pendingControlRequestId));
    }
    preferences.end();
  }

  loadMeasurementSettings();

  // Raziskovalec SD do prve spremembe uporabi aktivacijsko kodo, nato pa svoje
  // geslo hrani ločeno od poverilnic domačega Wi-Fi omrežja.
  if (preferences.begin(SD_CARD_SETTINGS_NAMESPACE, false)) {
    if (!preferences.isKey(SD_CARD_PASSWORD_KEY)) {
      preferences.putString(SD_CARD_PASSWORD_KEY, activationCode);
    }
    preferences.end();
  } else {
    Serial.println("SD card explorer password storage could not be initialized.");
  }

  if (aggregateMigrationRequired) {
    Serial.println("Cloud history will be replayed once to create aggregate data.");
  }

  snprintf(accessPointSsid, sizeof(accessPointSsid), "Cebelnjak-%s", deviceId + 9);
  snprintf(arduinoOtaHostname, sizeof(arduinoOtaHostname), "panj-%s", deviceId);
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
  snprintf(loadCellStatusDatabasePath, sizeof(loadCellStatusDatabasePath), "%s/status/load_cell", deviceDatabasePath);
  snprintf(bme680StatusDatabasePath, sizeof(bme680StatusDatabasePath), "%s/status/bme680", deviceDatabasePath);
  snprintf(controlDatabasePath, sizeof(controlDatabasePath), "%s/control", deviceDatabasePath);
  snprintf(controlCommandDatabasePath, sizeof(controlCommandDatabasePath), "%s/control/command", deviceDatabasePath);
  snprintf(historyStatusDatabasePath, sizeof(historyStatusDatabasePath), "%s/status/history", deviceDatabasePath);
  snprintf(networkResetStatusDatabasePath, sizeof(networkResetStatusDatabasePath), "%s/status/network_reset", deviceDatabasePath);
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

bool startProvisioningAccessPoint(bool keepStationEnabled);

const char *wifiProvisioningStateName()
{
  if (wifiConnectionRequestQueued) return "connecting";

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
  if (wifiConnectionRequestQueued) return "Povezovanje z izbranim Wi-Fi omrežjem ...";

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

bool wifiConnectionAttemptBusy()
{
  bool requestQueued = false;
  portENTER_CRITICAL(&wifiProvisioningRequestMux);
  requestQueued = wifiConnectionRequestQueued;
  portEXIT_CRITICAL(&wifiProvisioningRequestMux);
  return requestQueued || wifiProvisioningState == WiFiProvisioningState::Connecting;
}

bool queueWiFiConnectionAttempt(const String &ssid, const String &password,
                                bool requestFromAccessPoint)
{
  char ssidCopy[sizeof(queuedWiFiSsid)] = {};
  char passwordCopy[sizeof(queuedWiFiPassword)] = {};
  ssid.toCharArray(ssidCopy, sizeof(ssidCopy));
  password.toCharArray(passwordCopy, sizeof(passwordCopy));

  bool requestQueued = false;
  portENTER_CRITICAL(&wifiProvisioningRequestMux);
  if (!wifiConnectionRequestQueued) {
    memcpy(queuedWiFiSsid, ssidCopy, sizeof(queuedWiFiSsid));
    memcpy(queuedWiFiPassword, passwordCopy, sizeof(queuedWiFiPassword));
    queuedWiFiRequestFromAccessPoint = requestFromAccessPoint;
    queuedWiFiConnectionStartMillis = millis() + WIFI_CONNECTION_REQUEST_DELAY_MS;
    wifiConnectionRequestQueued = true;
    requestQueued = true;
  }
  portEXIT_CRITICAL(&wifiProvisioningRequestMux);
  return requestQueued;
}

void startWiFiConnectionAttempt(const String &ssid, const String &password,
                                bool requestFromAccessPoint)
{
  if (ssid.length() == 0 || ssid.length() > 32 || password.length() > 63) {
    wifiProvisioningState = WiFiProvisioningState::Failed;
    pendingWiFiRequestFromAccessPoint = false;
    Serial.println("Wi-Fi connection attempt rejected because the credentials are invalid.");
    return;
  }

  pendingWiFiSsid = ssid;
  pendingWiFiPassword = password;
  pendingWiFiRequestFromAccessPoint = requestFromAccessPoint;
  wifiProvisioningState = WiFiProvisioningState::Connecting;
  accessPointShutdownMillis = 0;

  // Fallback AP ostane na voljo tudi, ko preklop iz trenutnega LAN omrežja prekine stari IP.
  if (!accessPointExpected) startProvisioningAccessPoint(true);
  WiFi.mode(WIFI_AP_STA);
  WiFi.setSleep(false);
  WiFi.persistent(false);
  WiFi.setAutoReconnect(false);
  stationConnected = false;
  stationGotIpAddress = false;
  stationGotIpMillis = 0;
  wifiConnectionLostMillis = 0;
  wifiReconnectAttempts = 0;
  savedWiFiReconnectAttemptActive = false;
  savedWiFiReconnectStartedMillis = 0;
  wifiConnectionStartedMillis = millis();
  WiFi.begin(ssid.c_str(), password.c_str());
  Serial.printf("Testing Wi-Fi '%s' without restarting.\n", pendingWiFiSsid.c_str());
}

void processQueuedWiFiConnectionAttempt()
{
  char ssid[sizeof(queuedWiFiSsid)] = {};
  char password[sizeof(queuedWiFiPassword)] = {};
  bool startAttempt = false;
  bool requestFromAccessPoint = false;
  const uint32_t currentMillis = millis();

  portENTER_CRITICAL(&wifiProvisioningRequestMux);
  if (wifiConnectionRequestQueued &&
      static_cast<int32_t>(currentMillis - queuedWiFiConnectionStartMillis) >= 0) {
    memcpy(ssid, queuedWiFiSsid, sizeof(ssid));
    memcpy(password, queuedWiFiPassword, sizeof(password));
    memset(queuedWiFiSsid, 0, sizeof(queuedWiFiSsid));
    memset(queuedWiFiPassword, 0, sizeof(queuedWiFiPassword));
    requestFromAccessPoint = queuedWiFiRequestFromAccessPoint;
    queuedWiFiRequestFromAccessPoint = false;
    queuedWiFiConnectionStartMillis = 0;
    wifiConnectionRequestQueued = false;
    startAttempt = true;
  }
  portEXIT_CRITICAL(&wifiProvisioningRequestMux);

  if (startAttempt) {
    startWiFiConnectionAttempt(String(ssid), String(password), requestFromAccessPoint);
  }
}

void updateWiFiConnectionAttempt()
{
  if (wifiProvisioningState != WiFiProvisioningState::Connecting) return;

  const bool requestedNetworkConnected =
      stationGotIpAddress && WiFi.status() == WL_CONNECTED && pendingWiFiSsid.length() > 0 &&
      WiFi.SSID() == pendingWiFiSsid;
  if (requestedNetworkConnected) {
    stationConnected = true;
    // Povezavo po morebitnem poznejšem izpadu upravlja naš časovno omejeni watchdog.
    // Sistemskemu samodejnemu reconnectu ne dovolimo, da med aktivnim AP-jem zasiči radio.
    WiFi.setAutoReconnect(false);
    wifiReconnectAttempts = 0;
    if (storeWiFiCredentials(pendingWiFiSsid, pendingWiFiPassword)) {
      savedWiFiCredentialsAvailable = true;
      wifiProvisioningState = WiFiProvisioningState::Connected;
      if (pendingWiFiRequestFromAccessPoint) {
        accessPointShutdownMillis = millis() + ACCESS_POINT_SHUTDOWN_DELAY_MS;
        Serial.println("Provisioning AP remains available for 30 seconds after AP setup.");
      } else {
        accessPointShutdownMillis = 0;
        if (accessPointExpected || accessPointActive) {
          accessPointExpected = false;
          WiFi.softAPdisconnect(true);
          accessPointActive = false;
          WiFi.mode(WIFI_STA);
        }
        Serial.println("Provisioning AP closed immediately after LAN Wi-Fi configuration.");
      }
      Serial.printf("Wi-Fi connected. IP address: %s\n", WiFi.localIP().toString().c_str());
    } else {
      wifiProvisioningState = WiFiProvisioningState::Failed;
      stationConnected = false;
      WiFi.disconnect(false, false);
    }
    pendingWiFiSsid = "";
    pendingWiFiPassword = "";
    pendingWiFiRequestFromAccessPoint = false;
    return;
  }

  if (millis() - wifiConnectionStartedMillis >= WIFI_CONNECT_TIMEOUT_MS) {
    WiFi.disconnect(false, false);
    wifiProvisioningState = WiFiProvisioningState::Failed;
    pendingWiFiSsid = "";
    pendingWiFiPassword = "";
    pendingWiFiRequestFromAccessPoint = false;
    Serial.println("Wi-Fi connection test timed out.");
  }
}

bool clearStoredWiFiCredentials()
{
  if (!preferences.begin(WIFI_SETTINGS_NAMESPACE, false)) {
    Serial.println("Saved Wi-Fi settings could not be opened for removal.");
    return false;
  }
  const bool ssidRemoved = !preferences.isKey(WIFI_SSID_KEY) || preferences.remove(WIFI_SSID_KEY);
  const bool passwordRemoved = !preferences.isKey(WIFI_PASSWORD_KEY) || preferences.remove(WIFI_PASSWORD_KEY);
  const bool credentialsCleared = ssidRemoved && passwordRemoved &&
                                !preferences.isKey(WIFI_SSID_KEY) && !preferences.isKey(WIFI_PASSWORD_KEY);
  preferences.end();
  if (!credentialsCleared) {
    Serial.println("Saved Wi-Fi settings could not be removed.");
    return false;
  }

  // Preklop STA -> AP je asinhron. Radio najprej popolnoma ustavimo in AP zaženemo šele
  // v naslednji fazi, sicer lahko pozni STA_DISCONNECTED dogodek prekine DHCP novega AP-ja.
  WiFi.setAutoReconnect(false);
  WiFi.persistent(false);
  accessPointExpected = false;
  WiFi.softAPdisconnect(true);
  WiFi.disconnect(true, true);
  WiFi.mode(WIFI_MODE_NULL);
  stationConnected = false;
  stationGotIpAddress = false;
  stationGotIpMillis = 0;
  savedWiFiCredentialsAvailable = false;
  wifiReconnectAttempts = 0;
  savedWiFiReconnectAttemptActive = false;
  savedWiFiReconnectStartedMillis = 0;
  lastWiFiReconnectAttemptMillis = 0;
  wifiProvisioningState = WiFiProvisioningState::Idle;
  accessPointShutdownMillis = 0;
  accessPointActive = false;
  lastAccessPointHealthCheckMillis = 0;
  scheduledAccessPointKeepsStationEnabled = false;
  scheduledAccessPointStartMillis = millis() + WIFI_RADIO_RESTART_DELAY_MS;
  Serial.println("Saved Wi-Fi settings were removed; provisioning AP will start after radio reset.");
  return true;
}

void maintainProvisioningAccessPoint()
{
  const uint32_t currentMillis = millis();

  if (scheduledWiFiSettingsClearMillis != 0 &&
      static_cast<int32_t>(currentMillis - scheduledWiFiSettingsClearMillis) >= 0) {
    scheduledWiFiSettingsClearMillis = 0;
    clearStoredWiFiCredentials();
  }

  if (scheduledAccessPointStartMillis != 0 &&
      static_cast<int32_t>(currentMillis - scheduledAccessPointStartMillis) >= 0) {
    const bool keepStationEnabled = scheduledAccessPointKeepsStationEnabled;
    scheduledAccessPointStartMillis = 0;
    startProvisioningAccessPoint(keepStationEnabled);
  }

  if (accessPointShutdownMillis != 0 &&
      static_cast<int32_t>(currentMillis - accessPointShutdownMillis) >= 0) {
    accessPointExpected = false;
    WiFi.softAPdisconnect(true);
    accessPointActive = false;
    accessPointShutdownMillis = 0;
    WiFi.mode(WIFI_STA);
    Serial.println("Provisioning access point closed after successful Wi-Fi connection.");
  }

  if (!accessPointExpected || scheduledAccessPointStartMillis != 0 ||
      currentMillis - lastAccessPointHealthCheckMillis < ACCESS_POINT_HEALTH_CHECK_INTERVAL_MS) {
    return;
  }

  lastAccessPointHealthCheckMillis = currentMillis;
  const wifi_mode_t wifiMode = WiFi.getMode();
  const bool apInterfaceEnabled = wifiMode == WIFI_MODE_AP || wifiMode == WIFI_MODE_APSTA;
  if (apInterfaceEnabled && WiFi.softAPIP() != IPAddress()) {
    accessPointActive = true;
    return;
  }

  accessPointActive = false;
  accessPointExpected = false;
  Serial.println("Provisioning AP health check failed; starting the interface again.");
  startProvisioningAccessPoint(savedWiFiCredentialsAvailable);
}

bool startProvisioningAccessPoint(bool keepStationEnabled)
{
  WiFi.persistent(false);
  accessPointExpected = true;
  // ESP32-S3 zanesljiveje oddaja provisioning beacon v kombiniranem načinu. STA ostane brez
  // povezave, kadar poverilnic ni, zato to ne povzroča Firebase ali internetnega prometa.
  const wifi_mode_t targetMode = WIFI_MODE_APSTA;
  if (!WiFi.mode(targetMode)) {
    accessPointExpected = false;
    accessPointActive = false;
    scheduledAccessPointKeepsStationEnabled = keepStationEnabled;
    scheduledAccessPointStartMillis = millis() + ACCESS_POINT_START_RETRY_MS;
    Serial.println("Provisioning AP mode could not be enabled.");
    return false;
  }

  WiFi.setSleep(false);
  const IPAddress accessPointIp(192, 168, 4, 1);
  const IPAddress subnetMask(255, 255, 255, 0);
  if (!WiFi.softAPConfig(accessPointIp, accessPointIp, subnetMask)) {
    accessPointExpected = false;
    accessPointActive = false;
    scheduledAccessPointKeepsStationEnabled = keepStationEnabled;
    scheduledAccessPointStartMillis = millis() + ACCESS_POINT_START_RETRY_MS;
    Serial.println("Provisioning AP network configuration failed.");
    return false;
  }

  accessPointActive = WiFi.softAP(accessPointSsid, nullptr, PROVISIONING_ACCESS_POINT_CHANNEL,
                                  false, PROVISIONING_ACCESS_POINT_MAX_CLIENTS);
  if (!accessPointActive) {
    accessPointExpected = false;
    Serial.println("Provisioning access point could not be started.");
    scheduledAccessPointKeepsStationEnabled = keepStationEnabled;
    scheduledAccessPointStartMillis = millis() + ACCESS_POINT_START_RETRY_MS;
    return false;
  }

  // Eksplicitne radijske nastavitve preprečijo, da bi različne revizije ESP32-S3 podedovale
  // nezdružljiv protokol ali širokopasovni način iz predhodnega STA/AP stanja.
  const esp_err_t bandwidthResult = esp_wifi_set_bandwidth(WIFI_IF_AP, WIFI_BW_HT20);
  const esp_err_t protocolResult =
      esp_wifi_set_protocol(WIFI_IF_AP, WIFI_PROTOCOL_11B | WIFI_PROTOCOL_11G | WIFI_PROTOCOL_11N);
  const esp_err_t txPowerResult = esp_wifi_set_max_tx_power(PROVISIONING_ACCESS_POINT_TX_POWER);
  if (bandwidthResult != ESP_OK || protocolResult != ESP_OK || txPowerResult != ESP_OK) {
    Serial.printf("Provisioning AP radio configuration warning: bandwidth=%s protocol=%s power=%s.\n",
                  esp_err_to_name(bandwidthResult), esp_err_to_name(protocolResult),
                  esp_err_to_name(txPowerResult));
  }

  lastAccessPointHealthCheckMillis = millis();
  scheduledAccessPointStartMillis = 0;

  Serial.printf("Provisioning AP: %s\n", accessPointSsid);
  Serial.println("Provisioning AP is open without a password (beta testing only).");
  const String accessPointIpText = WiFi.softAPIP().toString();
  const String accessPointMac = WiFi.softAPmacAddress();
  Serial.printf("Open local dashboard: http://%s/ (AP+STA, channel %u, BSSID %s, 20 MHz, 19.5 dBm)\n",
                accessPointIpText.c_str(), PROVISIONING_ACCESS_POINT_CHANNEL, accessPointMac.c_str());
  return true;
}

bool connectToStoredWiFi()
{
  String ssid;
  String password;
  if (!loadWiFiCredentials(ssid, password)) return false;

  savedWiFiCredentialsAvailable = true;
  WiFi.mode(WIFI_STA);
  // Lokalni spletni strežnik potrebuje nizko zakasnitev; varčevanje z energijo upočasni HTTP prenose.
  WiFi.setSleep(false);
  WiFi.persistent(false);
  WiFi.setAutoReconnect(false);
  stationGotIpAddress = false;
  stationGotIpMillis = 0;
  wifiReconnectAttempts = 0;
  savedWiFiReconnectAttemptActive = false;
  savedWiFiReconnectStartedMillis = 0;
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
    // WiFi.begin() lahko tudi po izteku začetnega čakanja nadaljuje povezovalni cikel.
    // Pred vklopom fallback AP-ja ga izrecno ustavimo, da lokalni portal dobi miren radio.
    WiFi.disconnect(false, false);
    stationGotIpAddress = false;
    stationGotIpMillis = 0;
    lastWiFiReconnectAttemptMillis = millis();
    Serial.println("\nSaved Wi-Fi is unavailable.");
  }
  return stationConnected;
}

bool startSavedWiFiReconnectAttempt()
{
  String ssid;
  String password;
  if (!loadWiFiCredentials(ssid, password)) {
    savedWiFiCredentialsAvailable = false;
    return false;
  }

  // AP ostane aktiven, da lokalni dostop deluje tudi med ponovnim zagonom STA povezave.
  WiFi.mode(WIFI_AP_STA);
  WiFi.setSleep(false);
  WiFi.persistent(false);
  WiFi.setAutoReconnect(false);
  stationGotIpAddress = false;
  stationGotIpMillis = 0;
  WiFi.disconnect(false, false);
  WiFi.begin(ssid.c_str(), password.c_str());
  savedWiFiReconnectAttemptActive = true;
  savedWiFiReconnectStartedMillis = millis();
  Serial.printf("Wi-Fi watchdog: controlled connection attempt %u/%u to '%s'.\n",
                wifiReconnectAttempts, WIFI_RECONNECTS_BEFORE_RESTART, ssid.c_str());
  return true;
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
  // Med provisioning preklopom je lastnik STA stanja izključno updateWiFiConnectionAttempt().
  // Watchdog sicer lahko staro povezavo pomotoma razglasi za uspeh novega omrežja.
  if (wifiProvisioningState == WiFiProvisioningState::Connecting) return;

  const bool actualStationReady = WiFi.status() == WL_CONNECTED && WiFi.localIP() != IPAddress();

  // Dogodek odklopa ali izgube IP-ja se lahko ob obremenjenem omrežnem skladu izgubi.
  // Dejanski status radia in IP zato ostajata končni vir resnice za watchdog.
  if (actualStationReady && !stationGotIpAddress) {
    stationGotIpAddress = true;
    stationGotIpMillis = millis();
    Serial.printf("Wi-Fi watchdog recovered the station state at %s.\n",
                  WiFi.localIP().toString().c_str());
  } else if (!actualStationReady) {
    stationGotIpAddress = false;
    stationGotIpMillis = 0;
    if (wifiConnectionLostMillis == 0) wifiConnectionLostMillis = millis();
  }

  if (stationConnected && !actualStationReady) {
    // Kratek prehodni odklop (roaming ali obnova DHCP) še ni razlog za ponovni zagon radia.
    if (millis() - wifiConnectionLostMillis < 3000) return;

    stationConnected = false;
    WiFi.setAutoReconnect(false);
    WiFi.disconnect(false, false);
    wifiReconnectAttempts = 0;
    savedWiFiReconnectAttemptActive = false;
    savedWiFiReconnectStartedMillis = 0;
    lastWiFiReconnectAttemptMillis = millis();
    accessPointShutdownMillis = 0;
    Serial.println("Wi-Fi connection was lost; enabling provisioning access point.");
    if (!accessPointExpected) startProvisioningAccessPoint(true);
    return;
  }

  if (!stationConnected && savedWiFiCredentialsAvailable &&
      wifiProvisioningState != WiFiProvisioningState::Connecting && actualStationReady) {
    stationConnected = true;
    wifiConnectionLostMillis = 0;
    savedWiFiReconnectAttemptActive = false;
    savedWiFiReconnectStartedMillis = 0;
    WiFi.setAutoReconnect(false);
    if (accessPointExpected || accessPointActive) {
      accessPointExpected = false;
      WiFi.softAPdisconnect(true);
      accessPointActive = false;
      WiFi.mode(WIFI_STA);
    }
    wifiReconnectAttempts = 0;
    Serial.printf("Wi-Fi connection restored. IP address: %s\n", WiFi.localIP().toString().c_str());
    return;
  }

  if (stationConnected || !savedWiFiCredentialsAvailable || actualStationReady) return;

  if (!accessPointExpected) startProvisioningAccessPoint(true);

  const uint8_t accessPointClients = accessPointExpected ? WiFi.softAPgetStationNum() : 0;
  if (savedWiFiReconnectAttemptActive) {
    // Tako kot konfiguracijski portal WiFiManagerja tudi naš portal med priključenim
    // odjemalcem ne sme izgubljati radijskega časa zaradi STA povezovalnega cikla.
    if (accessPointClients > 0) {
      WiFi.setAutoReconnect(false);
      WiFi.disconnect(false, false);
      savedWiFiReconnectAttemptActive = false;
      savedWiFiReconnectStartedMillis = 0;
      if (wifiReconnectAttempts >= WIFI_RECONNECTS_BEFORE_RESTART) wifiReconnectAttempts = 0;
      Serial.println("Wi-Fi watchdog: STA attempt paused while a client uses the provisioning AP.");
      return;
    }

    if (millis() - savedWiFiReconnectStartedMillis < WIFI_RECONNECT_ATTEMPT_TIMEOUT_MS) return;

    WiFi.setAutoReconnect(false);
    WiFi.disconnect(false, false);
    savedWiFiReconnectAttemptActive = false;
    savedWiFiReconnectStartedMillis = 0;
    Serial.printf("Wi-Fi watchdog: controlled attempt %u/%u timed out.\n", wifiReconnectAttempts,
                  WIFI_RECONNECTS_BEFORE_RESTART);
    if (wifiReconnectAttempts >= WIFI_RECONNECTS_BEFORE_RESTART) {
      wifiReconnectAttempts = 0;
      Serial.println("Wi-Fi watchdog: retry cycle finished; provisioning AP remains available.");
    }
    return;
  }

  // Dokler telefon ali računalnik uporablja fallback AP, lokalni HTTP in DHCP dobita
  // popolno prednost. Nov STA poskus se začne šele po odhodu zadnjega odjemalca.
  if (accessPointClients > 0 ||
      millis() - lastWiFiReconnectAttemptMillis < WIFI_RECONNECT_INTERVAL_MS) {
    return;
  }

  lastWiFiReconnectAttemptMillis = millis();
  ++wifiReconnectAttempts;
  if (!startSavedWiFiReconnectAttempt()) {
    wifiReconnectAttempts = 0;
    savedWiFiReconnectAttemptActive = false;
    savedWiFiReconnectStartedMillis = 0;
    if (!accessPointExpected) startProvisioningAccessPoint(false);
  }
}

bool startNtpSynchronization()
{
  if (!stationNetworkIsStable()) return false;

  configTzTime(TIMEZONE, NTP_SERVER_1, NTP_SERVER_2);
  timeSynchronizationInitialized = true;
  timeSynchronizationStartedMillis = millis();
  setNtpSynchronizationPending(true);
  Serial.println("Synchronizing time with NTP...");
  return true;
}

void initializeTime()
{
  if (!timeSynchronizationInitialized) startNtpSynchronization();
}

void processTimeSynchronization()
{
  if (ntpSynchronizationCompleted) {
    ntpSynchronizationCompleted = false;
    setNtpSynchronizationPending(false);
    const time_t synchronizedTimestamp = time(nullptr);
    if (synchronizedTimestamp < MIN_VALID_UNIX_TIMESTAMP) {
      Serial.println("NTP synchronization callback returned an invalid time.");
      return;
    }

    currentTimeSource = TimeSource::Ntp;
    lastTimeSynchronizationTimestamp = synchronizedTimestamp;
    if (rtcReady && !writeDs3231Timestamp(synchronizedTimestamp)) {
      setRtcTimeValid(false);
      Serial.println("NTP time is valid, but DS3231 could not be updated.");
    } else if (rtcReady) {
      Serial.println("DS3231 was synchronized with NTP.");
    }
    requestDeviceStatusUpdate();
    Serial.printf("NTP synchronization completed: %lu UTC.\n",
                  static_cast<unsigned long>(synchronizedTimestamp));
    return;
  }

  if (ntpSynchronizationPending &&
      millis() - timeSynchronizationStartedMillis >= NTP_SYNC_TIMEOUT_MS) {
    setNtpSynchronizationPending(false);
    Serial.println("NTP synchronization timed out; the current RTC/system time remains active.");
  }
}

bool isFirebaseTransportReady()
{
  return cloudNetworkReady() && app.ready() && !firebaseRequestsArePaused() &&
         asyncClient.taskCount() < MAX_FIREBASE_ASYNC_TASKS;
}

bool isFirebaseReady()
{
  return !historyDeletionQueued && isFirebaseTransportReady();
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

void initializeMemoryAndHistoryBuffer()
{
  const bool psramAvailable = psramFound();
  const size_t largestInternalBlock =
      heap_caps_get_largest_free_block(MALLOC_CAP_INTERNAL | MALLOC_CAP_8BIT);
  Serial.printf("[MEM] PSRAM: %s\n", psramAvailable ? "YES" : "NO");
  Serial.printf("[MEM] PSRAM total=%u free=%u\n", static_cast<unsigned>(ESP.getPsramSize()),
                static_cast<unsigned>(ESP.getFreePsram()));
  Serial.printf("[MEM] heap=%u min=%u largest=%u\n", static_cast<unsigned>(ESP.getFreeHeap()),
                static_cast<unsigned>(ESP.getMinFreeHeap()), static_cast<unsigned>(largestInternalBlock));

  if (!psramAvailable) {
    Serial.println("[MEM] Local history disabled because PSRAM was not detected.");
    return;
  }

  const size_t historyBufferSize = MAX_LOCAL_HISTORY_BUCKETS * sizeof(HistoryBucket);
  localHistoryBuckets = static_cast<HistoryBucket *>(
      heap_caps_calloc(MAX_LOCAL_HISTORY_BUCKETS, sizeof(HistoryBucket),
                       MALLOC_CAP_SPIRAM | MALLOC_CAP_8BIT));
  if (localHistoryBuckets == nullptr) {
    Serial.printf("[MEM] PSRAM allocation failed for %u-byte history buffer.\n",
                  static_cast<unsigned>(historyBufferSize));
    return;
  }

  Serial.printf("[MEM] Local history buffer=%u bytes in PSRAM.\n",
                static_cast<unsigned>(historyBufferSize));

  const size_t reconciliationBufferSize =
      MAX_DAILY_RECONCILIATION_DAYS * (sizeof(DailyReconciliationManifest) +
                                      sizeof(RemoteDailyReconciliationManifest));
  dailyReconciliationManifests = static_cast<DailyReconciliationManifest *>(
      heap_caps_calloc(MAX_DAILY_RECONCILIATION_DAYS, sizeof(DailyReconciliationManifest),
                       MALLOC_CAP_SPIRAM | MALLOC_CAP_8BIT));
  remoteDailyReconciliationManifests = static_cast<RemoteDailyReconciliationManifest *>(
      heap_caps_calloc(MAX_DAILY_RECONCILIATION_DAYS, sizeof(RemoteDailyReconciliationManifest),
                       MALLOC_CAP_SPIRAM | MALLOC_CAP_8BIT));
  if (dailyReconciliationManifests == nullptr || remoteDailyReconciliationManifests == nullptr) {
    heap_caps_free(dailyReconciliationManifests);
    heap_caps_free(remoteDailyReconciliationManifests);
    dailyReconciliationManifests = nullptr;
    remoteDailyReconciliationManifests = nullptr;
    Serial.printf("[MEM] PSRAM allocation failed for %u-byte daily sync index.\n",
                  static_cast<unsigned>(reconciliationBufferSize));
    return;
  }

  Serial.printf("[MEM] Daily sync index=%u bytes in PSRAM.\n",
                static_cast<unsigned>(reconciliationBufferSize));
}

void printSystemDiagnostics()
{
  const uint32_t currentMillis = millis();
  if (lastSystemDiagnosticMillis != 0 &&
      currentMillis - lastSystemDiagnosticMillis < SYSTEM_DIAGNOSTIC_INTERVAL_MS) {
    return;
  }
  lastSystemDiagnosticMillis = currentMillis;

  const bool stationReady = stationNetworkReady();
  const wifi_mode_t wifiMode = WiFi.getMode();
  const bool accessPointReady = accessPointExpected &&
                                (wifiMode == WIFI_MODE_AP || wifiMode == WIFI_MODE_APSTA) &&
                                WiFi.softAPIP() != IPAddress();
  const bool firebaseReady = cloudNetworkReady() && app.ready();
  const IPAddress stationIp = WiFi.localIP();
  const IPAddress accessPointIp = WiFi.softAPIP();
  const size_t largestInternalBlock =
      heap_caps_get_largest_free_block(MALLOC_CAP_INTERNAL | MALLOC_CAP_8BIT);
  const bool localAssetPriorityActive = localAssetsHavePriorityUntilMillis != 0 &&
                                        static_cast<int32_t>(currentMillis - localAssetsHavePriorityUntilMillis) < 0;
  const bool localHistoryPriorityActive = localHistoryHavePriorityUntilMillis != 0 &&
                                          static_cast<int32_t>(currentMillis - localHistoryHavePriorityUntilMillis) < 0;
  const bool httpPriorityActive = localAssetPriorityActive || localHistoryPriorityActive;

  Serial.printf("[SYS] heap=%u min=%u largest=%u psram=%u sta=%s rssi=%d staIp=%u.%u.%u.%u "
                "ap=%s apIp=%u.%u.%u.%u apClients=%u fbTasks=%u fbReady=%u httpPrio=%u\n",
                static_cast<unsigned>(ESP.getFreeHeap()), static_cast<unsigned>(ESP.getMinFreeHeap()),
                static_cast<unsigned>(largestInternalBlock), static_cast<unsigned>(ESP.getFreePsram()),
                stationReady ? "UP" : "DOWN", stationReady ? WiFi.RSSI() : 0, stationIp[0], stationIp[1],
                stationIp[2], stationIp[3], accessPointReady ? "UP" : "DOWN", accessPointIp[0],
                accessPointIp[1], accessPointIp[2], accessPointIp[3],
                static_cast<unsigned>(WiFi.softAPgetStationNum()),
                static_cast<unsigned>(asyncClient.taskCount()), firebaseReady ? 1U : 0U,
                httpPriorityActive ? 1U : 0U);
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

bool extractJsonTimestamp(const String &json, const char *key, time_t &value)
{
  const String keyPrefix = String('"') + key + "\":";
  const int keyPosition = json.indexOf(keyPrefix);
  if (keyPosition < 0) return false;

  const char *numberStart = json.c_str() + keyPosition + keyPrefix.length();
  while (*numberStart == ' ' || *numberStart == '\t') ++numberStart;
  char *numberEnd = nullptr;
  const unsigned long long parsed = strtoull(numberStart, &numberEnd, 10);
  if (numberEnd == numberStart || parsed < static_cast<unsigned long long>(MIN_VALID_UNIX_TIMESTAMP) ||
      parsed > static_cast<unsigned long long>(MAX_SETTABLE_UNIX_TIMESTAMP)) {
    return false;
  }
  value = static_cast<time_t>(parsed);
  return true;
}

bool extractJsonFloat(const String &json, const char *key, float &value)
{
  const String keyPrefix = String('"') + key + "\":";
  const int keyPosition = json.indexOf(keyPrefix);
  if (keyPosition < 0) return false;

  const char *numberStart = json.c_str() + keyPosition + keyPrefix.length();
  while (*numberStart == ' ' || *numberStart == '\t') ++numberStart;
  char *numberEnd = nullptr;
  const float parsed = strtof(numberStart, &numberEnd);
  if (numberEnd == numberStart || !isfinite(parsed)) return false;

  value = parsed;
  return true;
}

bool parseOtaArtifact(const String &json, const char *urlKey, const char *sha256Key, const char *sizeKey,
                      OtaArtifact &artifact)
{
  String sha256;
  if (!extractJsonString(json, urlKey, artifact.url) || !extractJsonString(json, sha256Key, sha256) ||
      !extractJsonSize(json, sizeKey, artifact.size) || sha256.length() != 64) {
    return false;
  }

  sha256.toLowerCase();
  sha256.toCharArray(artifact.sha256, sizeof(artifact.sha256));
  return true;
}

bool parseFirmwareManifest(const String &json, FirmwareManifest &manifest)
{
  String version;
  if (!extractJsonString(json, "version", version) || version.length() >= sizeof(manifest.version) ||
      !parseOtaArtifact(json, "firmware_url", "sha256", "size", manifest.firmware) ||
      !parseOtaArtifact(json, "littlefs_url", "littlefs_sha256", "littlefs_size", manifest.littlefs)) {
    return false;
  }

  version.toCharArray(manifest.version, sizeof(manifest.version));
  return true;
}

enum class FirmwareReleaseStage : uint8_t {
  Beta = 0,
  ReleaseCandidate = 1,
  Stable = 2,
};

struct ParsedFirmwareVersion {
  int major = 0;
  int minor = 0;
  int patch = 0;
  FirmwareReleaseStage stage = FirmwareReleaseStage::Stable;
  int stageNumber = 0;
};

bool parseFirmwareVersion(const char *version, ParsedFirmwareVersion &parsed)
{
  if (version == nullptr || version[0] == '\0') return false;
  const char *normalizedVersion = version[0] == 'v' ? version + 1 : version;

  int consumedCharacters = -1;
  if (sscanf(normalizedVersion, "%d.%d.%d-beta.%d%n", &parsed.major, &parsed.minor, &parsed.patch,
             &parsed.stageNumber, &consumedCharacters) == 4 && normalizedVersion[consumedCharacters] == '\0') {
    parsed.stage = FirmwareReleaseStage::Beta;
  } else {
    consumedCharacters = -1;
    if (sscanf(normalizedVersion, "%d.%d.%d-rc.%d%n", &parsed.major, &parsed.minor, &parsed.patch,
               &parsed.stageNumber, &consumedCharacters) == 4 && normalizedVersion[consumedCharacters] == '\0') {
      parsed.stage = FirmwareReleaseStage::ReleaseCandidate;
    } else {
      consumedCharacters = -1;
      parsed.stageNumber = 0;
      if (sscanf(normalizedVersion, "%d.%d.%d%n", &parsed.major, &parsed.minor, &parsed.patch,
                 &consumedCharacters) != 3 || normalizedVersion[consumedCharacters] != '\0') {
        return false;
      }
      parsed.stage = FirmwareReleaseStage::Stable;
    }
  }

  return parsed.major >= 0 && parsed.minor >= 0 && parsed.patch >= 0 && parsed.stageNumber >= 0;
}

bool isNewerFirmwareVersion(const char *candidateVersion, const char *currentVersion)
{
  ParsedFirmwareVersion candidate;
  ParsedFirmwareVersion current;
  if (!parseFirmwareVersion(candidateVersion, candidate) || !parseFirmwareVersion(currentVersion, current)) {
    return false;
  }

  if (candidate.major != current.major) return candidate.major > current.major;
  if (candidate.minor != current.minor) return candidate.minor > current.minor;
  if (candidate.patch != current.patch) return candidate.patch > current.patch;
  if (candidate.stage != current.stage) {
    return static_cast<uint8_t>(candidate.stage) > static_cast<uint8_t>(current.stage);
  }
  return candidate.stage != FirmwareReleaseStage::Stable && candidate.stageNumber > current.stageNumber;
}

void reportOtaStatus(const char *state, const char *targetVersion, const char *message, int progressPercent = -1)
{
  char jsonPayload[384];
  if (progressPercent >= 0) {
    const int clampedProgress = constrain(progressPercent, 0, 100);
    snprintf(jsonPayload, sizeof(jsonPayload),
             "{\"state\":\"%s\",\"current_version\":\"%s\",\"target_version\":\"%s\",\"message\":\"%s\",\"progress_percent\":%d,\"updated_at\":%lu}",
             state, FIRMWARE_VERSION, targetVersion, message, clampedProgress,
             static_cast<unsigned long>(time(nullptr)));
  } else {
    snprintf(jsonPayload, sizeof(jsonPayload),
             "{\"state\":\"%s\",\"current_version\":\"%s\",\"target_version\":\"%s\",\"message\":\"%s\",\"updated_at\":%lu}",
             state, FIRMWARE_VERSION, targetVersion, message, static_cast<unsigned long>(time(nullptr)));
  }
  object_t otaStatus(jsonPayload);
  database.set(asyncClient, otaStatusDatabasePath, otaStatus, processData, "updateOtaStatus");
}

void clearControlCommand(const String &requestId, const char *resultId = "clearControlCommand")
{
  if (requestId.length() == 0 || requestId.length() >= sizeof(controlCommandClearRequestId)) {
    Serial.println("Control command acknowledgement skipped: request ID is missing or too long.");
    return;
  }

  // Nov ukaz ne sme dedovati časovnika neuspešnega ACK-a prejšnjega ukaza.
  // Pri istem ID-ju časovnik ostane, da prepreči tesno zanko ponovnih poskusov.
  if (strcmp(controlCommandClearRequestId, requestId.c_str()) != 0) {
    lastControlCommandClearAttemptMillis = 0;
  }
  requestId.toCharArray(controlCommandClearRequestId, sizeof(controlCommandClearRequestId));
  strlcpy(controlCommandClearResultId, resultId, sizeof(controlCommandClearResultId));
  controlCommandClearPending = true;
}

void clearControlCommand(const char *resultId = "clearControlCommand")
{
  // Veljaven ukaz se pred izvedbo shrani kot processed. Tako se potrjuje vedno
  // točno isti request_id in nikoli trenutno poljuben zapis na Firebase poti.
  if (lastProcessedControlRequestId[0] == '\0') {
    Serial.println("Control command acknowledgement skipped: no processed request ID is available.");
    return;
  }
  clearControlCommand(String(lastProcessedControlRequestId), resultId);
}

uint8_t scaleOtaProgress(size_t completedBytes, size_t totalBytes, uint8_t startPercent, uint8_t endPercent)
{
  if (totalBytes == 0 || endPercent <= startPercent) return startPercent;
  const size_t range = static_cast<size_t>(endPercent - startPercent);
  return startPercent + static_cast<uint8_t>((completedBytes * range) / totalBytes);
}

void reportOtaDownloadProgress(const char *state, const char *artifactName, uint8_t artifactProgress,
                               uint8_t totalProgress)
{
  char message[80];
  snprintf(message, sizeof(message), "Prenašanje %s: %u %%.", artifactName, artifactProgress);
  reportOtaStatus(state, otaTargetVersion, message, totalProgress);
}

void reportOtaInstallProgress(uint8_t artifactProgress, uint8_t totalProgress)
{
  char message[80];
  snprintf(message, sizeof(message), "Nameščanje lokalne strani: %u %%.", artifactProgress);
  reportOtaStatus("installing_filesystem", otaTargetVersion, message, totalProgress);
}

void closeOtaDownloadConnection()
{
  otaDownloadClient.stop();
  otaDownloadStream = nullptr;
}

void closeOtaLittlefsStageFile()
{
  if (otaLittlefsStageFile) otaLittlefsStageFile.close();
}

void discardOtaLittlefsStageFile()
{
  closeOtaLittlefsStageFile();
  if (sdCardReady) SD.remove(OTA_LITTLEFS_STAGE_PATH);
}

void remountLittlefsAfterOtaFailure()
{
  if (!littlefsUnmountedForOta) return;

  if (!LittleFS.begin()) {
    Serial.println("LittleFS remount failed after OTA error.");
  }
  littlefsUnmountedForOta = false;
}

void releaseOtaDownloadResources(bool abortFlashWrite)
{
  if (otaHashActive) {
    mbedtls_sha256_free(&otaSha256Context);
    otaHashActive = false;
  }
  closeOtaDownloadConnection();
  if (abortFlashWrite && otaFlashUpdateActive) {
    Update.abort();
  }
  otaFlashUpdateActive = false;
}

void failOtaUpdate(const String &errorMessage)
{
  const uint8_t progressPercent = otaLastReportedProgress;
  Serial.print("OTA error: ");
  Serial.println(errorMessage);
  releaseOtaDownloadResources(true);
  discardOtaLittlefsStageFile();
  remountLittlefsAfterOtaFailure();
  firmwareCommandQueued = false;
  queuedFirmwareCommandInvalid = false;
  queuedFirmwareCommandPayload[0] = '\0';
  otaUpdateState = OtaUpdateState::Idle;
  firmwareUpdateInProgress = false;
  reportOtaStatus("error", otaTargetVersion, errorMessage.c_str(), progressPercent);
  clearControlCommand();
  otaTargetVersion[0] = '\0';
}

// Firebase povratni klic ostane kratek; počasno OTA omrežno delo se izvede pozneje v glavni zanki.
bool queueFirmwareUpdateCommand(const String &payload)
{
  if (firmwareUpdateInProgress || firmwareCommandQueued) {
    Serial.println("Cloud command postponed: an update is already queued or in progress.");
    return false;
  }

  queuedFirmwareCommandInvalid = payload.length() >= sizeof(queuedFirmwareCommandPayload);
  if (queuedFirmwareCommandInvalid) {
    queuedFirmwareCommandPayload[0] = '\0';
    Serial.println("OTA command rejected: payload is too large.");
  } else {
    payload.toCharArray(queuedFirmwareCommandPayload, sizeof(queuedFirmwareCommandPayload));
    Serial.println("Cloud command queued.");
  }
  firmwareCommandQueued = true;
  return true;
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
  Serial.print(manifest.firmware.size);
  Serial.print(" B firmware, ");
  Serial.print(manifest.littlefs.size);
  Serial.println(" B LittleFS.");
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

bool parseOtaHttpsUrl(const String &url, String &host, String &path)
{
  constexpr char HTTPS_PREFIX[] = "https://";
  constexpr size_t HTTPS_PREFIX_LENGTH = sizeof(HTTPS_PREFIX) - 1;

  if (!url.startsWith(HTTPS_PREFIX)) return false;

  const int pathStart = url.indexOf('/', HTTPS_PREFIX_LENGTH);
  host = pathStart < 0 ? url.substring(HTTPS_PREFIX_LENGTH) : url.substring(HTTPS_PREFIX_LENGTH, pathStart);
  path = pathStart < 0 ? "/" : url.substring(pathStart);

  // GitHub Release OTA uporablja običajni HTTPS gostitelj na vratih 443.
  return host.length() > 0 && host.indexOf('@') < 0 && host.indexOf(':') < 0;
}

String resolveOtaRedirectUrl(const String &location, const String &host, const String &path)
{
  if (location.startsWith("https://")) return location;
  if (location.startsWith("//")) return String("https:") + location;
  if (location.startsWith("/")) return String("https://") + host + location;

  const int lastSlash = path.lastIndexOf('/');
  const String parentPath = lastSlash < 0 ? "/" : path.substring(0, lastSlash + 1);
  return String("https://") + host + parentPath + location;
}

bool readOtaHttpLine(String &line, bool &lineTruncated, uint32_t timeoutMs)
{
  line = "";
  lineTruncated = false;
  line.reserve(OTA_HTTP_LINE_MAX_LENGTH);
  const uint32_t startedMillis = millis();

  while (millis() - startedMillis < timeoutMs) {
    while (otaDownloadClient.available() > 0) {
      const char character = static_cast<char>(otaDownloadClient.read());
      if (character == '\n') return true;
      if (character == '\r') continue;
      if (line.length() >= OTA_HTTP_LINE_MAX_LENGTH) {
        lineTruncated = true;
        continue;
      }
      line += character;
    }

    yield();
  }

  return false;
}

bool isOtaRedirectStatus(int statusCode)
{
  return statusCode == HTTP_CODE_MOVED_PERMANENTLY || statusCode == HTTP_CODE_FOUND ||
         statusCode == HTTP_CODE_SEE_OTHER || statusCode == HTTP_CODE_TEMPORARY_REDIRECT ||
         statusCode == 308;
}

bool openOtaArtifactDownloadConnection(const OtaArtifact &artifact, const char *artifactName, String &errorMessage)
{
  String requestUrl = artifact.url;

  for (uint8_t redirectCount = 0; redirectCount <= OTA_MAX_REDIRECTS; ++redirectCount) {
    String host;
    String path;
    if (!parseOtaHttpsUrl(requestUrl, host, path)) {
      errorMessage = "Firmware URL v manifestu ni veljaven HTTPS naslov.";
      return false;
    }

    otaDownloadClient.stop();
    otaDownloadClient.setTimeout(1000);
    otaDownloadClient.setHandshakeTimeout((OTA_FIRMWARE_TIMEOUT_MS + 999) / 1000);

    Serial.print("OTA: connecting to ");
    Serial.println(host);
    if (!otaDownloadClient.connect(host.c_str(), OTA_HTTPS_PORT, OTA_FIRMWARE_TIMEOUT_MS)) {
      errorMessage = String("Povezava do OTA strežnika ni uspela: ") + host;
      return false;
    }

    const String request = String("GET ") + path + " HTTP/1.1\r\nHost: " + host +
                           "\r\nUser-Agent: Pametni-Cebelnjak-ESP32\r\nAccept: application/octet-stream\r\nConnection: close\r\n\r\n";
    if (otaDownloadClient.print(request) != request.length()) {
      errorMessage = "Pošiljanje OTA zahteve ni uspelo.";
      return false;
    }

    String statusLine;
    bool statusLineTruncated = false;
    if (!readOtaHttpLine(statusLine, statusLineTruncated, OTA_HEADER_TIMEOUT_MS) || statusLine.length() == 0) {
      errorMessage = "OTA strežnik ni pravočasno poslal HTTP odgovora.";
      return false;
    }
    if (statusLineTruncated) {
      errorMessage = "OTA strežnik je vrnil predolgo HTTP statusno vrstico.";
      return false;
    }

    const int firstSpace = statusLine.indexOf(' ');
    const int secondSpace = statusLine.indexOf(' ', firstSpace + 1);
    const String statusText = secondSpace < 0 ? statusLine.substring(firstSpace + 1)
                                               : statusLine.substring(firstSpace + 1, secondSpace);
    const int statusCode = firstSpace < 0 ? 0 : statusText.toInt();
    if (statusCode == 0) {
      errorMessage = "OTA strežnik je vrnil neveljaven HTTP odgovor.";
      return false;
    }
    Serial.print("OTA: ");
    Serial.print(artifactName);
    Serial.print(" HTTP ");
    Serial.println(statusCode);

    String redirectLocation;
    long contentLength = -1;
    bool chunkedTransfer = false;
    while (true) {
      String headerLine;
      bool headerLineTruncated = false;
      if (!readOtaHttpLine(headerLine, headerLineTruncated, OTA_HEADER_TIMEOUT_MS)) {
        errorMessage = "Branje HTTP glav OTA prenosa je poteklo.";
        return false;
      }
      if (headerLineTruncated) {
        Serial.println("OTA: preskočena je bila predolga HTTP glava.");
        continue;
      }
      if (headerLine.length() == 0) break;

      const int separator = headerLine.indexOf(':');
      if (separator < 0) continue;

      String headerName = headerLine.substring(0, separator);
      String headerValue = headerLine.substring(separator + 1);
      headerName.toLowerCase();
      headerValue.trim();
      if (headerName == "location") {
        redirectLocation = headerValue;
      } else if (headerName == "content-length") {
        contentLength = headerValue.toInt();
      } else if (headerName == "transfer-encoding") {
        headerValue.toLowerCase();
        chunkedTransfer = headerValue.indexOf("chunked") >= 0;
      }
    }

    if (isOtaRedirectStatus(statusCode)) {
      if (redirectLocation.length() == 0) {
        errorMessage = "OTA strežnik je vrnil preusmeritev brez ciljnega naslova.";
        return false;
      }
      Serial.println("OTA: following GitHub redirect.");
      requestUrl = resolveOtaRedirectUrl(redirectLocation, host, path);
      continue;
    }

    if (statusCode != HTTP_CODE_OK) {
      errorMessage = String("Firmware datoteka ni dosegljiva (HTTP ") + statusCode + ").";
      return false;
    }
    if (chunkedTransfer) {
      errorMessage = "OTA strežnik je vrnil nepodprt chunked prenos.";
      return false;
    }
    if (contentLength >= 0 && static_cast<size_t>(contentLength) != artifact.size) {
      errorMessage = "Velikost OTA datoteke se ne ujema z manifestom.";
      return false;
    }

    otaDownloadStream = &otaDownloadClient;
    return true;
  }

  errorMessage = "OTA strežnik je vrnil preveč preusmeritev.";
  return false;
}

bool beginOtaArtifactDownload(const OtaArtifact &artifact, const char *artifactName, String &errorMessage)
{
  if (!openOtaArtifactDownloadConnection(artifact, artifactName, errorMessage)) {
    releaseOtaDownloadResources(false);
    return false;
  }

  if (otaDownloadStream == nullptr) {
    errorMessage = "Podatkovnega toka OTA datoteke ni bilo mogoče odpreti.";
    releaseOtaDownloadResources(false);
    return false;
  }

  mbedtls_sha256_init(&otaSha256Context);
  mbedtls_sha256_starts(&otaSha256Context, 0);
  otaHashActive = true;
  otaDownloadStream->setTimeout(1000);
  otaDownloadedBytes = 0;
  otaLastDataReceivedMillis = millis();
  return true;
}

bool startLittlefsDownload(String &errorMessage)
{
  if (!sdCardReady) {
    errorMessage = "Za posodobitev lokalne strani je potrebna SD kartica.";
    return false;
  }

  discardOtaLittlefsStageFile();
  if (SD.exists(OTA_LITTLEFS_STAGE_PATH)) {
    errorMessage = "Stare začasne OTA datoteke lokalne strani ni mogoče odstraniti s SD kartice.";
    return false;
  }
  otaLittlefsStageFile = SD.open(OTA_LITTLEFS_STAGE_PATH, FILE_WRITE);
  if (!otaLittlefsStageFile) {
    errorMessage = "Začasne OTA datoteke na SD kartici ni bilo mogoče ustvariti.";
    return false;
  }

  Serial.println("OTA: downloading local web page.");
  if (!beginOtaArtifactDownload(otaManifest.littlefs, "littlefs", errorMessage)) {
    discardOtaLittlefsStageFile();
    return false;
  }
  return true;
}

bool startLittlefsInstall(String &errorMessage)
{
  closeOtaLittlefsStageFile();
  otaLittlefsStageFile = SD.open(OTA_LITTLEFS_STAGE_PATH, FILE_READ);
  if (!otaLittlefsStageFile || otaLittlefsStageFile.size() != otaManifest.littlefs.size) {
    errorMessage = "Preverjena OTA datoteka lokalne strani na SD kartici manjka.";
    return false;
  }

  // Med pisanjem v LittleFS lokalni strežnik ne sme uporabljati iste flash particije.
  LittleFS.end();
  littlefsUnmountedForOta = true;
  if (!Update.begin(otaManifest.littlefs.size, U_SPIFFS)) {
    closeOtaLittlefsStageFile();
    remountLittlefsAfterOtaFailure();
    errorMessage = "Za OTA lokalne strani ni dovolj prostora v LittleFS particiji.";
    return false;
  }

  otaFlashUpdateActive = true;
  mbedtls_sha256_init(&otaSha256Context);
  mbedtls_sha256_starts(&otaSha256Context, 0);
  otaHashActive = true;
  otaDownloadedBytes = 0;
  Serial.println("OTA: installing local web page.");
  return true;
}

bool startFirmwareDownload(String &errorMessage)
{
  Serial.println("OTA: downloading firmware.");
  if (!beginOtaArtifactDownload(otaManifest.firmware, "firmware", errorMessage)) return false;

  if (!Update.begin(otaManifest.firmware.size, U_FLASH)) {
    errorMessage = "Za OTA ni dovolj prostora v neaktivni particiji.";
    releaseOtaDownloadResources(false);
    return false;
  }
  otaFlashUpdateActive = true;
  return true;
}

void processOtaDownloadChunk()
{
  if (otaDownloadStream == nullptr) {
    failOtaUpdate("Podatkovni tok OTA firmware-a ni na voljo.");
    return;
  }

  const bool downloadingLittlefs = otaUpdateState == OtaUpdateState::DownloadLittlefs;
  const OtaArtifact &artifact = downloadingLittlefs ? otaManifest.littlefs : otaManifest.firmware;
  const char *artifactName = downloadingLittlefs ? "lokalne strani" : "firmware-a";
  const uint8_t progressStart = downloadingLittlefs ? 0 : OTA_LITTLEFS_INSTALL_PROGRESS_END;
  const uint8_t progressEnd = downloadingLittlefs ? OTA_LITTLEFS_DOWNLOAD_PROGRESS_END
                                                   : OTA_FIRMWARE_DOWNLOAD_PROGRESS_END;

  const size_t available = otaDownloadStream->available();
  if (available == 0) {
    if (millis() - otaLastDataReceivedMillis >= OTA_STREAM_IDLE_TIMEOUT_MS) {
      failOtaUpdate("Prenos firmware-a je potekel brez prejetih podatkov.");
    }
    return;
  }

  const size_t bytesToRead = min(available, min(sizeof(otaDownloadBuffer), artifact.size - otaDownloadedBytes));
  const size_t bytesRead = otaDownloadStream->readBytes(otaDownloadBuffer, bytesToRead);
  if (bytesRead == 0) {
    failOtaUpdate("Branje OTA firmware-a ni uspelo.");
    return;
  }
  const size_t writtenBytes = downloadingLittlefs ? otaLittlefsStageFile.write(otaDownloadBuffer, bytesRead)
                                                   : Update.write(otaDownloadBuffer, bytesRead);
  if (writtenBytes != bytesRead) {
    failOtaUpdate(downloadingLittlefs ? "Zapis OTA datoteke lokalne strani na SD kartico ni uspel."
                                      : "Zapis OTA firmware-a ni uspel.");
    return;
  }
  mbedtls_sha256_update(&otaSha256Context, otaDownloadBuffer, bytesRead);
  otaDownloadedBytes += bytesRead;
  otaLastDataReceivedMillis = millis();

  const uint8_t artifactProgress = static_cast<uint8_t>((otaDownloadedBytes * 100U) / artifact.size);
  const uint8_t totalProgress = scaleOtaProgress(otaDownloadedBytes, artifact.size, progressStart, progressEnd);
  if (artifactProgress == 100 || totalProgress >= otaLastReportedProgress + OTA_PROGRESS_REPORT_INTERVAL_PERCENT) {
    otaLastReportedProgress = totalProgress;
    Serial.print("OTA: ");
    Serial.print(artifactName);
    Serial.print(" ");
    Serial.print(artifactProgress);
    Serial.println("% downloaded.");
    reportOtaDownloadProgress(downloadingLittlefs ? "downloading_filesystem" : "downloading", artifactName,
                              artifactProgress, totalProgress);
  }

  if (otaDownloadedBytes == artifact.size) {
    reportOtaStatus("verifying", otaTargetVersion,
                    downloadingLittlefs ? "Preverjam celovitost lokalne strani." : "Preverjam celovitost firmware-a.",
                    totalProgress);
    otaUpdateState = downloadingLittlefs ? OtaUpdateState::VerifyLittlefsDownload : OtaUpdateState::VerifyFirmware;
  }
}

bool verifyOtaArtifactHash(const OtaArtifact &artifact, const char *artifactName, String &errorMessage)
{
  if (!otaHashActive) {
    errorMessage = "OTA SHA-256 preverjanje ni bilo pripravljeno.";
    return false;
  }

  uint8_t actualHash[32];
  mbedtls_sha256_finish(&otaSha256Context, actualHash);
  mbedtls_sha256_free(&otaSha256Context);
  otaHashActive = false;
  closeOtaDownloadConnection();

  if (sha256ToHex(actualHash) != artifact.sha256) {
    errorMessage = String("SHA-256 datoteke ") + artifactName + " se ne ujema z manifestom.";
    return false;
  }
  return true;
}

void verifyLittlefsDownload()
{
  String errorMessage;
  if (!verifyOtaArtifactHash(otaManifest.littlefs, "lokalne strani", errorMessage)) {
    failOtaUpdate(errorMessage);
    return;
  }

  otaLittlefsStageFile.flush();
  closeOtaLittlefsStageFile();
  reportOtaStatus("preparing", otaTargetVersion, "Lokalna stran je preverjena; pripravljam zapis v LittleFS.",
                  OTA_LITTLEFS_DOWNLOAD_PROGRESS_END);
  otaUpdateState = OtaUpdateState::StartLittlefsInstall;
}

void processLittlefsInstallChunk()
{
  if (!otaLittlefsStageFile) {
    failOtaUpdate("Preverjene OTA datoteke lokalne strani ni mogoče prebrati.");
    return;
  }

  const size_t bytesToRead = min(sizeof(otaDownloadBuffer), otaManifest.littlefs.size - otaDownloadedBytes);
  const size_t bytesRead = otaLittlefsStageFile.read(otaDownloadBuffer, bytesToRead);
  if (bytesRead != bytesToRead) {
    failOtaUpdate("Branje OTA datoteke lokalne strani s SD kartice ni uspelo.");
    return;
  }
  if (Update.write(otaDownloadBuffer, bytesRead) != bytesRead) {
    failOtaUpdate("Zapis OTA lokalne strani v LittleFS ni uspel.");
    return;
  }

  mbedtls_sha256_update(&otaSha256Context, otaDownloadBuffer, bytesRead);
  otaDownloadedBytes += bytesRead;

  const uint8_t artifactProgress = static_cast<uint8_t>((otaDownloadedBytes * 100U) / otaManifest.littlefs.size);
  const uint8_t totalProgress = scaleOtaProgress(otaDownloadedBytes, otaManifest.littlefs.size,
                                                  OTA_LITTLEFS_DOWNLOAD_PROGRESS_END,
                                                  OTA_LITTLEFS_INSTALL_PROGRESS_END);
  if (artifactProgress == 100 || totalProgress >= otaLastReportedProgress + OTA_PROGRESS_REPORT_INTERVAL_PERCENT) {
    otaLastReportedProgress = totalProgress;
    Serial.print("OTA: local web page ");
    Serial.print(artifactProgress);
    Serial.println("% installed.");
    reportOtaInstallProgress(artifactProgress, totalProgress);
  }

  if (otaDownloadedBytes == otaManifest.littlefs.size) {
    reportOtaStatus("verifying", otaTargetVersion, "Preverjam zapis lokalne strani v LittleFS.", totalProgress);
    otaUpdateState = OtaUpdateState::VerifyLittlefsInstall;
  }
}

void verifyLittlefsInstall()
{
  String errorMessage;
  if (!verifyOtaArtifactHash(otaManifest.littlefs, "lokalne strani v LittleFS", errorMessage)) {
    failOtaUpdate(errorMessage);
    return;
  }
  if (!Update.end(true)) {
    failOtaUpdate("Zaključek OTA lokalne strani ni uspel.");
    return;
  }

  otaFlashUpdateActive = false;
  discardOtaLittlefsStageFile();
  reportOtaStatus("preparing", otaTargetVersion, "Lokalna stran je posodobljena; pripravljam firmware.",
                  OTA_LITTLEFS_INSTALL_PROGRESS_END);
  otaUpdateState = OtaUpdateState::StartFirmwareDownload;
}

void verifyDownloadedFirmware()
{
  String errorMessage;
  if (!verifyOtaArtifactHash(otaManifest.firmware, "firmware-a", errorMessage)) {
    failOtaUpdate(errorMessage);
    return;
  }

  if (!Update.end(true)) {
    failOtaUpdate("Zaključek OTA posodobitve ni uspel.");
    return;
  }
  otaFlashUpdateActive = false;
  releaseOtaDownloadResources(false);
  reportOtaStatus("restarting", otaTargetVersion, "Firmware je preverjen; naprava se znova zaganja.", 100);
  otaRestartScheduledMillis = millis();
  otaUpdateState = OtaUpdateState::RestartDevice;
}

void processFirmwareUpdateCommand(const String &payload)
{
  if (payload == "null" || payload.length() == 0) {
    return;
  }

  String action;
  String targetVersion;
  if (!extractJsonString(payload, "action", action)) {
    // Ista Firebase pot sprejema tudi ukaze za tehtnico, zgodovino in kalibracijo.
    // Neveljaven zapis zato ne sme prepisati zadnjega veljavnega OTA rezultata.
    Serial.println("Cloud command ignored: action is missing.");
    clearControlCommand();
    return;
  }

  if (action == "delete_history") {
    queueHistoryDeleteAction();
    return;
  }

  if (action == "clear_wifi_credentials") {
    queueWiFiCredentialResetAction();
    return;
  }

  if (action == "sync_history") {
    if (cloudSyncPending || cloudHistoryReconciliationIsActive()) {
      Serial.println("Cloud history reconciliation command ignored: synchronization is already active.");
    } else if (startCloudHistoryReconciliation()) {
      Serial.println("Cloud requested history reconciliation.");
    } else {
      Serial.println("Cloud history reconciliation command failed: SD history is unavailable.");
    }
    clearControlCommand();
    return;
  }

  if (action == "tare_load_cell") {
    // Najprej odstranimo cloud ukaz. Končni status se objavi šele po tariranju,
    // zato na enem AsyncClientu ne moreta tekmovati zapis statusa in remove ukaza.
    if (!queueLoadCellTare(false)) {
      Serial.println("Load cell tare command ignored: taring is already in progress.");
    }
    clearControlCommand();
    return;
  }

  if (action == "set_bme680_calibration") {
    float temperatureOffsetC = 0.0F;
    float humidityOffsetPercent = 0.0F;
    if (!extractJsonFloat(payload, "temperature_offset_c", temperatureOffsetC) ||
        !extractJsonFloat(payload, "humidity_offset_percent", humidityOffsetPercent)) {
      Serial.println("BME680 calibration command ignored: offsets are invalid.");
    } else if (!queueBme680Calibration(temperatureOffsetC, humidityOffsetPercent, true)) {
      Serial.println("BME680 calibration command ignored: calibration is already active or out of range.");
    }
    clearControlCommand();
    return;
  }

  if (action != "install" && action != "ignore") {
    Serial.println("OTA command ignored: unsupported action.");
    clearControlCommand();
    return;
  }

  if (!extractJsonString(payload, "target_version", targetVersion)) {
    Serial.println("OTA error: update command has no target version.");
    reportOtaStatus("error", "", "OTA ukaz nima ciljne različice.");
    clearControlCommand();
    return;
  }

  if (action == "ignore") {
    Serial.println("OTA: update command ignored.");
    reportOtaStatus("ignored", targetVersion.c_str(), "Posodobitev je bila prezrta.");
    clearControlCommand();
    return;
  }

  if (targetVersion == FIRMWARE_VERSION) {
    Serial.println("OTA: requested firmware is already installed.");
    reportOtaStatus("installed", targetVersion.c_str(), "Firmware je že nameščen.", 100);
    clearControlCommand();
    return;
  }

  if (!isNewerFirmwareVersion(targetVersion.c_str(), FIRMWARE_VERSION)) {
    Serial.println("OTA: requested firmware is not newer.");
    reportOtaStatus("ignored", targetVersion.c_str(), "Zahtevana različica ni novejša.");
    clearControlCommand();
    return;
  }

  if (targetVersion.length() >= sizeof(otaTargetVersion)) {
    Serial.println("OTA error: requested firmware version is too long.");
    reportOtaStatus("error", "", "Različica OTA ukaza je predolga.");
    clearControlCommand();
    return;
  }

  Serial.print("OTA: installation requested for v");
  Serial.println(targetVersion);
  targetVersion.toCharArray(otaTargetVersion, sizeof(otaTargetVersion));
  otaManifest = FirmwareManifest{};
  otaLastReportedProgress = 0;
  firmwareUpdateInProgress = true;
  otaUpdateState = OtaUpdateState::LoadManifest;
  reportOtaStatus("preparing", otaTargetVersion, "Pripravljam OTA posodobitev.", 0);
}

void processQueuedFirmwareUpdateCommand()
{
  if (!firmwareCommandQueued || firmwareUpdateInProgress || Update.isRunning()) {
    return;
  }

  if (queuedFirmwareCommandInvalid) {
    firmwareCommandQueued = false;
    queuedFirmwareCommandInvalid = false;
    Serial.println("OTA error: update command payload is too large.");
    reportOtaStatus("error", "", "OTA ukaz je predolg.");
    clearControlCommand();
  } else {
    const String payload(queuedFirmwareCommandPayload);
    String requestId;
    if (!extractJsonString(payload, "request_id", requestId) ||
        !markControlRequestProcessed(requestId)) {
      // Pending zapis ostane nedotaknjen; po rebootu oziroma ob naslednji zanki
      // zato ukaz še vedno lahko varno doseže dejansko izvedbo.
      Serial.println("Cloud command postponed: request ID is not yet safely persisted as processed.");
      return;
    }
    firmwareCommandQueued = false;
    queuedFirmwareCommandPayload[0] = '\0';
    processFirmwareUpdateCommand(payload);
  }
}

void processOtaUpdate()
{
  if (!firmwareUpdateInProgress) return;

  switch (otaUpdateState) {
    case OtaUpdateState::LoadManifest: {
      String errorMessage;
      if (!loadFirmwareManifest(otaManifest, errorMessage)) {
        failOtaUpdate(errorMessage);
        return;
      }
      if (String(otaManifest.version) != otaTargetVersion) {
        failOtaUpdate("Različica manifesta se ne ujema z OTA ukazom.");
        return;
      }
      if (!isNewerFirmwareVersion(otaManifest.version, FIRMWARE_VERSION)) {
        failOtaUpdate("Različica v manifestu ni novejša od nameščene.");
        return;
      }

      reportOtaStatus("preparing", otaTargetVersion, "Manifest je potrjen; pripravljam lokalno stran.", 0);
      otaUpdateState = OtaUpdateState::StartLittlefsDownload;
      return;
    }

    case OtaUpdateState::StartLittlefsDownload: {
      String errorMessage;
      if (!startLittlefsDownload(errorMessage)) {
        failOtaUpdate(errorMessage);
        return;
      }

      otaUpdateState = OtaUpdateState::DownloadLittlefs;
      reportOtaDownloadProgress("downloading_filesystem", "lokalne strani", 0, 0);
      return;
    }

    case OtaUpdateState::DownloadLittlefs:
      processOtaDownloadChunk();
      return;

    case OtaUpdateState::VerifyLittlefsDownload:
      verifyLittlefsDownload();
      return;

    case OtaUpdateState::StartLittlefsInstall: {
      String errorMessage;
      if (!startLittlefsInstall(errorMessage)) {
        failOtaUpdate(errorMessage);
        return;
      }

      otaUpdateState = OtaUpdateState::InstallLittlefs;
      reportOtaInstallProgress(0, OTA_LITTLEFS_DOWNLOAD_PROGRESS_END);
      return;
    }

    case OtaUpdateState::InstallLittlefs:
      processLittlefsInstallChunk();
      return;

    case OtaUpdateState::VerifyLittlefsInstall:
      verifyLittlefsInstall();
      return;

    case OtaUpdateState::StartFirmwareDownload: {
      String errorMessage;
      if (!startFirmwareDownload(errorMessage)) {
        failOtaUpdate(errorMessage);
        return;
      }

      otaUpdateState = OtaUpdateState::DownloadFirmware;
      reportOtaDownloadProgress("downloading", "firmware-a", 0, OTA_LITTLEFS_INSTALL_PROGRESS_END);
      return;
    }

    case OtaUpdateState::DownloadFirmware:
      processOtaDownloadChunk();
      return;

    case OtaUpdateState::VerifyFirmware:
      verifyDownloadedFirmware();
      return;

    case OtaUpdateState::RestartDevice:
      if (millis() - otaRestartScheduledMillis >= OTA_RESTART_DELAY_MS) {
        Serial.println("OTA: firmware verified, restarting device.");
        ESP.restart();
      }
      return;

    case OtaUpdateState::Idle:
      firmwareUpdateInProgress = false;
      return;
  }
}

void processMeasurementSettings(const String &payload)
{
  // Ob manjkajoči nastavitvi naprava obdrži varne lokalno shranjene privzete vrednosti.
  if (payload == "null" || payload.length() == 0) return;

  uint32_t measurementIntervalSeconds = 0;
  uint32_t sdArchiveIntervalMinutes = 0;
  uint32_t displayDecimals = 0;
  if (!extractJsonUnsignedValue(payload, "measurement_interval_seconds", measurementIntervalSeconds) ||
      !extractJsonUnsignedValue(payload, "sd_archive_interval_minutes", sdArchiveIntervalMinutes) ||
      !extractJsonUnsignedValue(payload, "weight_display_decimals", displayDecimals)) {
    Serial.println("Measurement settings ignored: required values are missing.");
    return;
  }

  if (!areMeasurementSettingsValid(measurementIntervalSeconds, sdArchiveIntervalMinutes, displayDecimals)) {
    Serial.println("Measurement settings ignored: values are outside the allowed range.");
    return;
  }

  const bool changed = measurementIntervalMs != measurementIntervalSeconds * 1000U ||
                       sdMeasurementIntervalMs != sdArchiveIntervalMinutes * 60U * 1000U ||
                       weightDisplayDecimals != displayDecimals;
  if (changed && applyMeasurementSettings(measurementIntervalSeconds, sdArchiveIntervalMinutes, displayDecimals)) {
    Serial.printf("Measurement settings applied: every %lu s, SD archive every %lu min, weight %lu decimals.\n",
                  static_cast<unsigned long>(measurementIntervalSeconds),
                  static_cast<unsigned long>(sdArchiveIntervalMinutes),
                  static_cast<unsigned long>(displayDecimals));
  }
}

bool queueTimeCommand(TimeCommandType type, time_t timestamp, bool fromCloud)
{
  bool queued = false;
  portENTER_CRITICAL(&timeCommandMux);
  if (pendingTimeCommandType == TimeCommandType::None) {
    pendingTimeCommandType = type;
    pendingTimeCommandTimestamp = timestamp;
    timeCommandFromCloud = fromCloud;
    queued = true;
  }
  portEXIT_CRITICAL(&timeCommandMux);
  return queued;
}

void processQueuedTimeCommand()
{
  if (!timeCommandQueued || firmwareUpdateInProgress || Update.isRunning()) return;

  const String payload(queuedTimeCommandPayload);
  String action;
  if (!extractJsonString(payload, "action", action)) {
    Serial.println("Time command ignored: invalid payload.");
    timeCommandQueued = false;
    queuedTimeCommandPayload[0] = '\0';
    clearControlCommand();
    return;
  }

  TimeCommandType commandType = TimeCommandType::None;
  time_t timestamp = 0;
  if (action == "set") {
    if (!extractJsonTimestamp(payload, "timestamp", timestamp)) {
      Serial.println("Time command ignored: invalid timestamp.");
      timeCommandQueued = false;
      queuedTimeCommandPayload[0] = '\0';
      clearControlCommand();
      return;
    }
    commandType = TimeCommandType::SetManual;
  } else if (action == "sync_ntp") {
    commandType = TimeCommandType::SynchronizeNtp;
  } else {
    Serial.println("Time command ignored: unsupported action.");
    timeCommandQueued = false;
    queuedTimeCommandPayload[0] = '\0';
    clearControlCommand();
    return;
  }

  if (!queueTimeCommand(commandType, timestamp, true)) {
    Serial.println("Time command postponed: another time operation is active.");
    return;
  }
  String requestId;
  if (!extractJsonString(payload, "request_id", requestId) ||
      requestId.length() >= sizeof(pendingTimeControlRequestId)) {
    // Ukaz še ni označen kot izveden. Neveljaven ID zato varno vrnemo iz
    // notranje čakalne vrste, Firebase ukaz pa ostane za naslednji stream dogodek.
    portENTER_CRITICAL(&timeCommandMux);
    pendingTimeCommandType = TimeCommandType::None;
    pendingTimeCommandTimestamp = 0;
    timeCommandFromCloud = false;
    portEXIT_CRITICAL(&timeCommandMux);
    Serial.println("Cloud time command postponed: request ID is invalid.");
    return;
  }
  requestId.toCharArray(pendingTimeControlRequestId, sizeof(pendingTimeControlRequestId));
  timeCommandQueued = false;
  queuedTimeCommandPayload[0] = '\0';
  Serial.println("Cloud time command queued.");
}

// --- Firebase control stream ------------------------------------------------

bool controlRequestWasProcessed(const String &requestId)
{
  return requestId.length() > 0 && strcmp(lastProcessedControlRequestId, requestId.c_str()) == 0;
}

bool controlRequestIsPending(const String &requestId)
{
  return requestId.length() > 0 && strcmp(pendingControlRequestId, requestId.c_str()) == 0;
}

bool rememberPendingControlRequest(const String &requestId)
{
  if (requestId.length() == 0 || requestId.length() >= sizeof(pendingControlRequestId)) {
    return false;
  }

  if (!preferences.begin(CONTROL_REQUEST_NAMESPACE, false)) {
    Serial.println("Pending control command could not be persisted to NVS.");
    return false;
  }
  const size_t storedLength = preferences.putString(CONTROL_PENDING_REQUEST_ID_KEY, requestId);
  preferences.end();
  if (storedLength != requestId.length()) {
    Serial.println("Pending control command request ID could not be saved to NVS.");
    return false;
  }

  requestId.toCharArray(pendingControlRequestId, sizeof(pendingControlRequestId));
  return true;
}

bool markControlRequestProcessed(const String &requestId)
{
  if (requestId.length() == 0 || requestId.length() >= sizeof(lastProcessedControlRequestId)) {
    return false;
  }

  if (!preferences.begin(CONTROL_REQUEST_NAMESPACE, false)) {
    Serial.println("Processed control command could not be persisted to NVS.");
    return false;
  }
  const size_t storedLength = preferences.putString(CONTROL_LAST_REQUEST_ID_KEY, requestId);
  const bool pendingRemoved = !controlRequestIsPending(requestId) ||
                              preferences.remove(CONTROL_PENDING_REQUEST_ID_KEY);
  preferences.end();
  if (storedLength != requestId.length()) {
    Serial.println("Processed control command request ID could not be saved to NVS.");
    return false;
  }
  if (!pendingRemoved) {
    Serial.println("Processed control command left a stale pending request ID in NVS.");
  }

  requestId.toCharArray(lastProcessedControlRequestId, sizeof(lastProcessedControlRequestId));
  if (controlRequestIsPending(requestId)) pendingControlRequestId[0] = '\0';
  return true;
}

void resetControlCommandSnapshot()
{
  controlCommandSnapshot = ControlCommandSnapshot{};
}

bool controlCommandSnapshotIsComplete()
{
  if (!controlCommandSnapshot.hasAction || !controlCommandSnapshot.hasRequestId) return false;

  const String action(controlCommandSnapshot.action);
  if (action == "install" || action == "ignore") return controlCommandSnapshot.hasTargetVersion;
  if (action == "set") return controlCommandSnapshot.hasTimestamp;
  if (action == "set_bme680_calibration") {
    return controlCommandSnapshot.hasTemperatureOffset && controlCommandSnapshot.hasHumidityOffset;
  }
  return true;
}

bool createControlSnapshotPayload(String &payload)
{
  if (!controlCommandSnapshotIsComplete()) return false;

  char serialized[OTA_COMMAND_PAYLOAD_LENGTH];
  const int written = snprintf(
      serialized, sizeof(serialized),
      "{\"action\":\"%s\",\"request_id\":\"%s\",\"target_version\":\"%s\",\"timestamp\":%lu,\"temperature_offset_c\":%.3f,\"humidity_offset_percent\":%.3f}",
      controlCommandSnapshot.action, controlCommandSnapshot.requestId,
      controlCommandSnapshot.hasTargetVersion ? controlCommandSnapshot.targetVersion : "",
      static_cast<unsigned long>(controlCommandSnapshot.timestamp), controlCommandSnapshot.temperatureOffsetC,
      controlCommandSnapshot.humidityOffsetPercent);
  if (written < 0 || static_cast<size_t>(written) >= sizeof(serialized)) return false;
  payload = serialized;
  return true;
}

bool parseControlStreamString(const String &payload, String &value)
{
  value = payload;
  value.trim();
  if (value.length() < 2 || value[0] != '"' || value[value.length() - 1] != '"') return false;
  value = value.substring(1, value.length() - 1);
  return true;
}

bool parseControlStreamUnsigned(const String &payload, uint32_t &value)
{
  String normalized = payload;
  normalized.trim();
  if (normalized.length() == 0) return false;
  char *end = nullptr;
  const unsigned long parsed = strtoul(normalized.c_str(), &end, 10);
  if (end == normalized.c_str() || *end != '\0') return false;
  value = static_cast<uint32_t>(parsed);
  return true;
}

bool parseControlStreamFloat(const String &payload, float &value)
{
  String normalized = payload;
  normalized.trim();
  if (normalized.length() == 0) return false;
  char *end = nullptr;
  const float parsed = strtof(normalized.c_str(), &end);
  if (end == normalized.c_str() || *end != '\0' || !isfinite(parsed)) return false;
  value = parsed;
  return true;
}

void processControlSettingsLeaf(const String &path, const String &payload)
{
  uint32_t measurementIntervalSeconds = measurementIntervalMs / 1000U;
  uint32_t sdArchiveIntervalMinutes = sdMeasurementIntervalMs / (60U * 1000U);
  uint32_t displayDecimals = weightDisplayDecimals;
  uint32_t parsedValue = 0;
  if (!parseControlStreamUnsigned(payload, parsedValue)) {
    Serial.println("Control settings ignored: changed value is invalid.");
    return;
  }

  if (path == "/settings/measurement_interval_seconds") {
    measurementIntervalSeconds = parsedValue;
  } else if (path == "/settings/sd_archive_interval_minutes") {
    sdArchiveIntervalMinutes = parsedValue;
  } else if (path == "/settings/weight_display_decimals") {
    displayDecimals = parsedValue;
  } else {
    return;
  }

  if (!areMeasurementSettingsValid(measurementIntervalSeconds, sdArchiveIntervalMinutes, displayDecimals)) {
    Serial.println("Control settings ignored: changed value is outside the allowed range.");
    return;
  }
  processMeasurementSettings(String("{\"measurement_interval_seconds\":") + measurementIntervalSeconds +
                             ",\"sd_archive_interval_minutes\":" + sdArchiveIntervalMinutes +
                             ",\"weight_display_decimals\":" + displayDecimals + "}");
}

void processControlCommandLeaf(const String &path, const String &payload)
{
  if (payload == "null") {
    // Brisanje kateregakoli polja pomeni konec trenutnega delnega ukaza.
    // Tako se parametri starega ukaza ne morejo združiti z naslednjim SSE dogodkom.
    if (path == "/command" || path.startsWith("/command/")) resetControlCommandSnapshot();
    return;
  }

  String value;
  if (path == "/command/action") {
    if (parseControlStreamString(payload, value) && value.length() < sizeof(controlCommandSnapshot.action)) {
      value.toCharArray(controlCommandSnapshot.action, sizeof(controlCommandSnapshot.action));
      controlCommandSnapshot.hasAction = true;
    }
  } else if (path == "/command/request_id") {
    if (parseControlStreamString(payload, value) && value.length() < sizeof(controlCommandSnapshot.requestId)) {
      value.toCharArray(controlCommandSnapshot.requestId, sizeof(controlCommandSnapshot.requestId));
      controlCommandSnapshot.hasRequestId = true;
    }
  } else if (path == "/command/target_version") {
    if (parseControlStreamString(payload, value) && value.length() < sizeof(controlCommandSnapshot.targetVersion)) {
      value.toCharArray(controlCommandSnapshot.targetVersion, sizeof(controlCommandSnapshot.targetVersion));
      controlCommandSnapshot.hasTargetVersion = true;
    }
  } else if (path == "/command/timestamp") {
    uint32_t timestamp = 0;
    if (parseControlStreamUnsigned(payload, timestamp)) {
      controlCommandSnapshot.timestamp = static_cast<time_t>(timestamp);
      controlCommandSnapshot.hasTimestamp = true;
    }
  } else if (path == "/command/temperature_offset_c") {
    if (parseControlStreamFloat(payload, controlCommandSnapshot.temperatureOffsetC)) {
      controlCommandSnapshot.hasTemperatureOffset = true;
    }
  } else if (path == "/command/humidity_offset_percent") {
    if (parseControlStreamFloat(payload, controlCommandSnapshot.humidityOffsetPercent)) {
      controlCommandSnapshot.hasHumidityOffset = true;
    }
  } else {
    return;
  }

  String completePayload;
  if (createControlSnapshotPayload(completePayload)) enqueueControlCommand(completePayload);
}

void enqueueControlCommand(const String &payload)
{
  String action;
  String requestId;
  if (!extractJsonString(payload, "action", action) || !extractJsonString(payload, "request_id", requestId)) {
    return;
  }
  if (requestId.length() == 0 || requestId.length() >= sizeof(lastProcessedControlRequestId)) {
    Serial.println("Control command ignored: request_id is missing or too long.");
    return;
  }
  if (controlRequestWasProcessed(requestId)) {
    Serial.println("Control command ignored: request_id was already processed.");
    // Po reconnectu Firebase ponovno pošlje trenutno stanje strežnika. Če je
    // prejšnje brisanje ukaza izgubilo povezavo, ga zdaj varno zaključimo,
    // ne da bi enkratno dejanje izvedli še drugič.
    clearControlCommand(requestId);
    return;
  }

  if (controlRequestIsPending(requestId) &&
      (controlCommandDispatchPending || firmwareCommandQueued || timeCommandQueued)) {
    // Isti SSE dogodek se lahko ponovi pred izvedbo; pending ukaz je že v RAM
    // čakalni vrsti. Po rebootu so te zastavice prazne in se isti ukaz prevzame.
    return;
  }

  if (controlCommandDispatchPending) {
    String pendingRequestId;
    if (extractJsonString(String(pendingControlCommandPayload), "request_id", pendingRequestId) &&
        pendingRequestId == requestId) {
      return;
    }
    Serial.println("Control command postponed: another command is waiting for the main loop.");
    return;
  }
  if (payload.length() >= sizeof(pendingControlCommandPayload)) {
    Serial.println("Control command ignored: payload is too large.");
    clearControlCommand();
    return;
  }

  payload.toCharArray(pendingControlCommandPayload, sizeof(pendingControlCommandPayload));
  controlCommandDispatchPending = true;
  Serial.printf("Control command received: %s.\n", action.c_str());
}

void processPendingControlCommand()
{
  if (controlCommandDispatchPending) {
    const String payload(pendingControlCommandPayload);
    String action;
    String requestId;
    if (!extractJsonString(payload, "action", action) || !extractJsonString(payload, "request_id", requestId)) {
      controlCommandDispatchPending = false;
      pendingControlCommandPayload[0] = '\0';
      clearControlCommand();
      return;
    }

    // Pending ID se shrani pred predajo v čakalno vrsto. Reboot v tem obdobju
    // zato ne izgubi ukaza: stream ga bo znova poslal, vendar še ni processed.
    if (!controlRequestIsPending(requestId) && !rememberPendingControlRequest(requestId)) {
      Serial.println("Control command postponed: request ID could not be saved as pending.");
      return;
    }

    bool queued = false;
    if (action == "set" || action == "sync_ntp") {
      if (!timeCommandQueued && payload.length() < sizeof(queuedTimeCommandPayload)) {
        payload.toCharArray(queuedTimeCommandPayload, sizeof(queuedTimeCommandPayload));
        timeCommandQueued = true;
        queued = true;
      }
    } else {
      queued = queueFirmwareUpdateCommand(payload);
    }

    if (queued) {
      controlCommandDispatchPending = false;
      pendingControlCommandPayload[0] = '\0';
    }
    return;
  }

  if (controlCommandClearPending && isFirebaseTransportReady() &&
      (lastControlCommandClearAttemptMillis == 0 ||
       millis() - lastControlCommandClearAttemptMillis >= CONTROL_COMMAND_ACK_RETRY_INTERVAL_MS)) {
    char acknowledgementPayload[256];
    snprintf(acknowledgementPayload, sizeof(acknowledgementPayload),
             "{\"command\":null,\"ack\":{\"request_id\":\"%s\",\"acknowledged_at\":%lu}}",
             controlCommandClearRequestId, static_cast<unsigned long>(time(nullptr)));
    object_t controlAcknowledgement(acknowledgementPayload);
    controlCommandClearPending = false;
    if (isHistoryDeletionRequest(controlCommandClearResultId)) {
      historyDeletionRequestPending = true;
    }
    if (isWiFiCredentialResetRequest(controlCommandClearResultId)) {
      wifiCredentialResetRequestPending = true;
    }
    // Atomarna posodobitev hkrati odstrani ukaz in zapiše request_id potrditve.
    // Pravila dovolijo ta poseg samo, če je ID trenutnega ukaza enak potrditvi.
    lastControlCommandClearAttemptMillis = millis();
    database.update(asyncClient, controlDatabasePath, controlAcknowledgement, processData,
                    controlCommandClearResultId);
  }
}

void processControlStreamData(AsyncResult &result)
{
  if (!result.isResult()) return;

  if (result.isError()) {
    Serial.printf("Firebase control stream error: %s (%d).\n", result.error().message().c_str(),
                  result.error().code());
    return;
  }
  if (!result.available()) return;

  RealtimeDatabaseResult &stream = result.to<RealtimeDatabaseResult>();
  if (!stream.isStream()) return;

  const String event = stream.event();
  if (event != "put" && event != "patch") return;

  const String path = stream.dataPath();
  const String payload = stream.to<const char *>();
  // Za začetni korenski dogodek objekt vsebuje oba podkanala. Iz njega obdelamo
  // samo tisti del, ki je dejansko prisoten, da se ukaz ne razlaga kot nastavitev.
  if ((path == "/" && payload.indexOf("\"measurement_interval_seconds\"") >= 0) || path == "/settings") {
    processMeasurementSettings(payload);
  } else if (path.startsWith("/settings/")) {
    processControlSettingsLeaf(path, payload);
  }

  if ((path == "/" && payload.indexOf("\"request_id\"") >= 0) || path == "/command") {
    if (payload == "null") {
      resetControlCommandSnapshot();
    } else {
      enqueueControlCommand(payload);
    }
  } else if (path.startsWith("/command/")) {
    processControlCommandLeaf(path, payload);
  }
}

void maintainControlStream()
{
  if (!cloudNetworkReady()) {
    if (controlStreamStarted) {
      controlStreamClient.stopAsync(true);
      controlStreamSslClient.stop();
      controlStreamStarted = false;
    }
    return;
  }
  if (controlStreamStarted || !app.ready()) return;

  controlStreamClient.setSSEFilters("get,put,patch,keep-alive,cancel,auth_revoked");
  database.get(controlStreamClient, controlDatabasePath, processControlStreamData, true, "controlStream");
  controlStreamStarted = true;
  Serial.println("Firebase control stream started.");
}

void processPendingTimeCommand()
{
  TimeCommandType commandType;
  time_t timestamp;
  bool fromCloud;
  portENTER_CRITICAL(&timeCommandMux);
  commandType = pendingTimeCommandType;
  timestamp = pendingTimeCommandTimestamp;
  fromCloud = timeCommandFromCloud;
  portEXIT_CRITICAL(&timeCommandMux);

  if (commandType == TimeCommandType::None || firmwareUpdateInProgress || Update.isRunning()) return;
  // Cloud ukaz najprej odstranimo iz Firebase. NTP DNS se zato ne more prekrivati z aktivnim remove opravilom.
  // Enako kot pri tariranju počakamo na prazen Firebase kanal. Tako lokalna
  // kalibracija ne tekmuje z meritvijo ali statusnim zapisom v isti asinhroni vrsti.
  if (asyncClient.taskCount() > 0) return;

  if (fromCloud) {
    const String requestId(pendingTimeControlRequestId);
    // `last_request` nastane šele tik pred dejanskim posegom v sistemski čas.
    // Če se naprava prej znova zažene, control/command ostane v Firebase in ga
    // stream lahko znova varno postavi v čakalno vrsto.
    if (!markControlRequestProcessed(requestId)) {
      Serial.println("Cloud time command postponed: request ID is not yet safely persisted as processed.");
      return;
    }
  }

  portENTER_CRITICAL(&timeCommandMux);
  pendingTimeCommandType = TimeCommandType::None;
  pendingTimeCommandTimestamp = 0;
  timeCommandFromCloud = false;
  portEXIT_CRITICAL(&timeCommandMux);

  if (fromCloud) {
    pendingTimeControlRequestId[0] = '\0';
    clearControlCommand();
  }

  if (commandType == TimeCommandType::SynchronizeNtp) {
    if (!startNtpSynchronization()) {
      Serial.println("Manual NTP synchronization failed: internet connection is unavailable.");
      return;
    }
    Serial.println(fromCloud ? "Cloud requested NTP synchronization." :
                               "Local dashboard requested NTP synchronization.");
    return;
  }

  if (!setSystemTimestamp(timestamp)) {
    Serial.println("Manual time setting failed: invalid system timestamp.");
    return;
  }
  currentTimeSource = fromCloud ? TimeSource::ManualCloud : TimeSource::ManualLocal;
  lastTimeSynchronizationTimestamp = timestamp;
  if (rtcReady && !writeDs3231Timestamp(timestamp)) {
    setRtcTimeValid(false);
    Serial.println("System time was set, but DS3231 could not be updated.");
  }
  requestDeviceStatusUpdate();
  Serial.printf("Time set manually from %s: %lu UTC.\n", fromCloud ? "cloud" : "local dashboard",
                static_cast<unsigned long>(timestamp));
}

void reportHistoryDeletionStatus(const char *state, const char *message, const char *requestId)
{
  char jsonPayload[256];
  snprintf(jsonPayload, sizeof(jsonPayload),
           "{\"state\":\"%s\",\"message\":\"%s\",\"updated_at\":%lu}",
           state, message, static_cast<unsigned long>(time(nullptr)));
  object_t historyStatus(jsonPayload);
  historyDeletionRequestPending = true;
  database.set(asyncClient, historyStatusDatabasePath, historyStatus, processData, requestId);
}

const char *loadCellTareStateName()
{
  switch (loadCellTareState) {
    case LoadCellTareState::Queued: return "queued";
    case LoadCellTareState::Taring: return "taring";
    case LoadCellTareState::Completed: return "completed";
    case LoadCellTareState::Error: return "error";
    case LoadCellTareState::Idle:
    default: return "idle";
  }
}

const char *localHistoryDeletionStateName()
{
  switch (localHistoryDeletionState) {
    case LocalHistoryDeletionState::Queued: return "queued";
    case LocalHistoryDeletionState::Deleting: return "deleting";
    case LocalHistoryDeletionState::Completed: return "completed";
    case LocalHistoryDeletionState::Error: return "error";
    case LocalHistoryDeletionState::Idle:
    default: return "idle";
  }
}

const char *bme680CalibrationStateName()
{
  switch (bme680CalibrationState) {
    case Bme680CalibrationState::Queued: return "queued";
    case Bme680CalibrationState::Applying: return "applying";
    case Bme680CalibrationState::Completed: return "completed";
    case Bme680CalibrationState::Error: return "error";
    case Bme680CalibrationState::Idle:
    default: return "idle";
  }
}

void reportLoadCellTareStatus(const char *message)
{
  if (!isFirebaseReady()) return;

  char jsonPayload[256];
  snprintf(jsonPayload, sizeof(jsonPayload),
           "{\"state\":\"%s\",\"message\":\"%s\",\"updated_at\":%lu}",
           loadCellTareStateName(), message, static_cast<unsigned long>(time(nullptr)));
  object_t tareStatus(jsonPayload);
  database.set(asyncClient, loadCellStatusDatabasePath, tareStatus, processData, "updateLoadCellTareStatus");
}

void reportBme680CalibrationStatus(const char *message)
{
  if (!isFirebaseReady()) {
    bme680CalibrationStatusReported = false;
    return;
  }

  char jsonPayload[256];
  snprintf(jsonPayload, sizeof(jsonPayload),
           "{\"ready\":%s,\"temperature_offset_c\":%.1f,\"humidity_offset_percent\":%.1f,\"state\":\"%s\",\"message\":\"%s\",\"updated_at\":%lu}",
           bme680Ready ? "true" : "false", bme680TemperatureOffsetC, bme680HumidityOffsetPercent,
           bme680CalibrationStateName(), message, static_cast<unsigned long>(time(nullptr)));
  object_t calibrationStatus(jsonPayload);
  bme680CalibrationStatusReported = true;
  database.set(asyncClient, bme680StatusDatabasePath, calibrationStatus, processData,
               "updateBme680CalibrationStatus");
}

bool queueLoadCellTare(bool publishCloudStatus)
{
  if (!loadCellReady || loadCellTareQueued || loadCellTareState == LoadCellTareState::Taring) {
    return false;
  }

  loadCellTareQueued = true;
  loadCellTareState = LoadCellTareState::Queued;
  Serial.println("Load cell tare command queued.");
  // Lokalni HTTP callback teče v AsyncTCP opravilu. FirebaseClient sme biti uporabljen samo
  // iz glavne zanke. Tudi cloud ukaz najprej počaka na odstranitev ukaza, zato stanje
  // objavimo šele po tariranju in ne ustvarimo dveh sočasnih Firebase opravil.
  (void)publishCloudStatus;
  return true;
}

bool queueBme680Calibration(float temperatureOffsetC, float humidityOffsetPercent, bool fromCloud)
{
  if (!isfinite(temperatureOffsetC) || !isfinite(humidityOffsetPercent) ||
      temperatureOffsetC < BME680_TEMPERATURE_OFFSET_MIN_C ||
      temperatureOffsetC > BME680_TEMPERATURE_OFFSET_MAX_C ||
      humidityOffsetPercent < BME680_HUMIDITY_OFFSET_MIN_PERCENT ||
      humidityOffsetPercent > BME680_HUMIDITY_OFFSET_MAX_PERCENT) {
    return false;
  }

  bool queued = false;
  portENTER_CRITICAL(&bme680CalibrationMux);
  if (!bme680CalibrationQueued && bme680CalibrationState != Bme680CalibrationState::Applying) {
    pendingBme680TemperatureOffsetC = temperatureOffsetC;
    pendingBme680HumidityOffsetPercent = humidityOffsetPercent;
    bme680CalibrationFromCloud = fromCloud;
    bme680CalibrationQueued = true;
    bme680CalibrationState = Bme680CalibrationState::Queued;
    queued = true;
  }
  portEXIT_CRITICAL(&bme680CalibrationMux);

  if (queued) Serial.println("BME680 calibration command queued.");
  return queued;
}

void processPendingLoadCellTare()
{
  if (!loadCellTareQueued || firmwareUpdateInProgress || Update.isRunning()) {
    return;
  }

  // Cloud ukaz je treba najprej odstraniti iz Firebase. Sicer lahko zaključni
  // status tariranja prekliče remove ukaza ali obratno.
  if (asyncClient.taskCount() > 0) {
    return;
  }

  loadCellTareQueued = false;
  loadCellTareState = LoadCellTareState::Taring;
  Serial.println("Load cell tare started.");

  if (!loadCellReady || !loadCell.wait_ready_timeout(HX711_READY_TIMEOUT_MS)) {
    loadCellTareState = LoadCellTareState::Error;
    Serial.println("Load cell tare failed: HX711 is unavailable.");
    reportLoadCellTareStatus("Tariranje ni uspelo: HX711 ni dosegljiv.");
    return;
  }

  loadCell.tare(HX711_TARE_SAMPLES);
  const long offset = loadCell.get_offset();
  if (!storeLoadCellOffset(offset)) {
    loadCellTareState = LoadCellTareState::Error;
    Serial.println("Load cell tare failed: offset could not be saved to NVS.");
    reportLoadCellTareStatus("Tariranje ni uspelo: odmika ni bilo mogoče shraniti.");
    return;
  }

  loadCellTareState = LoadCellTareState::Completed;
  resetLoadCellWeightFilter();
  lastMeasurementMillis = 0;
  Serial.printf("Load cell tare completed. Saved offset: %ld.\n", offset);
  reportLoadCellTareStatus("Tariranje je uspešno; nova ničla je shranjena.");
}

void processPendingBme680Calibration()
{
  if (!bme680CalibrationQueued || firmwareUpdateInProgress || Update.isRunning()) return;

  bool fromCloud = false;
  float temperatureOffsetC = 0.0F;
  float humidityOffsetPercent = 0.0F;
  portENTER_CRITICAL(&bme680CalibrationMux);
  fromCloud = bme680CalibrationFromCloud;
  temperatureOffsetC = pendingBme680TemperatureOffsetC;
  humidityOffsetPercent = pendingBme680HumidityOffsetPercent;
  portEXIT_CRITICAL(&bme680CalibrationMux);

  if (fromCloud && asyncClient.taskCount() > 0) return;

  portENTER_CRITICAL(&bme680CalibrationMux);
  bme680CalibrationQueued = false;
  bme680CalibrationFromCloud = false;
  bme680CalibrationState = Bme680CalibrationState::Applying;
  portEXIT_CRITICAL(&bme680CalibrationMux);

  if (!storeBme680Calibration(temperatureOffsetC, humidityOffsetPercent)) {
    bme680CalibrationState = Bme680CalibrationState::Error;
    bme680CalibrationStatusReported = false;
    Serial.println("BME680 calibration could not be saved to NVS.");
    reportBme680CalibrationStatus("Kalibracije BME680 ni bilo mogoce shraniti.");
    return;
  }

  bme680TemperatureOffsetC = temperatureOffsetC;
  bme680HumidityOffsetPercent = humidityOffsetPercent;
  bme680CalibrationState = Bme680CalibrationState::Completed;
  bme680CalibrationStatusReported = false;
  lastMeasurementMillis = 0;
  Serial.printf("BME680 calibration saved from %s: temperature %+.1f C, humidity %+.1f %%\n",
                fromCloud ? "cloud" : "local dashboard", bme680TemperatureOffsetC,
                bme680HumidityOffsetPercent);
  reportBme680CalibrationStatus("Kalibracija BME680 je shranjena in uporabljena pri novih meritvah.");
}

bool deleteMeasurementHistoryFromSD()
{
  if (!sdCardReady) {
    Serial.println("History deletion error: SD card is unavailable.");
    return false;
  }

  if (SD.exists(SD_LOG_PATH) && !SD.remove(SD_LOG_PATH)) {
    Serial.println("History deletion error: measurements.csv could not be removed.");
    return false;
  }
  SD.remove(SD_HISTORY_INDEX_PATH);
  SD.remove(SD_HISTORY_INDEX_TEMP_PATH);
  SD.remove(SD_HISTORY_RESPONSE_PATH);
  resetCloudHistoryReconciliation();
  cloudReconciliationState = CloudReconciliationState::Idle;

  File logFile = SD.open(SD_LOG_PATH, FILE_WRITE);
  if (!logFile) {
    Serial.println("History deletion error: measurements.csv could not be recreated.");
    return false;
  }
  logFile.println("date,time,unix_timestamp,temperature_c,humidity_percent,weight_kg");
  logFile.close();

  hasLatestMeasurement = false;
  latestMeasurement = {};
  portENTER_CRITICAL(&localHistoryStateMux);
  localHistoryState = LocalHistoryState::Idle;
  localHistoryFirstTimestamp = 0;
  localHistoryLastTimestamp = 0;
  portEXIT_CRITICAL(&localHistoryStateMux);
  historyIndexReady = false;
  lastIndexedDayTimestamp = 0;
  cloudSyncFileOffset = 0;
  cloudSyncPendingFileOffset = 0;
  lastCloudSyncedTimestamp = 0;
  cloudSyncWritesSincePersist = 0;
  cloudSyncStateSavePending = false;
  cloudSyncCaughtUp = true;
  cloudSyncRetryIntervalMs = CLOUD_SYNC_INTERVAL_MS;
  lastCloudSyncAttemptMillis = millis();
  resetCloudAggregateState();
  return persistCloudSyncState();
}

void processPendingLocalHistoryDeletion()
{
  if (!localHistoryDeletionQueued || firmwareUpdateInProgress || Update.isRunning() ||
      cloudSyncPending || cloudHistoryReconciliationIsActive() ||
      localHistoryState == LocalHistoryState::Reading || localHistoryState == LocalHistoryState::Writing) {
    return;
  }

  localHistoryDeletionState = LocalHistoryDeletionState::Deleting;
  Serial.println("Local history deletion: deleting measurements from the SD card.");
  const bool deletionSucceeded = deleteMeasurementHistoryFromSD();
  localHistoryDeletionQueued = false;
  localHistoryDeletionState = deletionSucceeded ? LocalHistoryDeletionState::Completed
                                                 : LocalHistoryDeletionState::Error;
  Serial.println(deletionSucceeded ? "Local history deletion completed."
                                   : "Local history deletion failed.");
}

bool isHistoryDeletionRequest(const String &requestId)
{
  return requestId == "historyDeletionReportQueued" ||
         requestId == "historyDeletionReportDeleting" ||
         requestId == "historyDeletionDeleteLatest" ||
         requestId == "historyDeletionDeleteMeasurements" ||
         requestId == "historyDeletionDeleteHourly" ||
         requestId == "historyDeletionDeleteDaily" ||
         requestId == "historyDeletionReportCompleted" ||
         requestId == "historyDeletionClearCommand" ||
         requestId == "historyDeletionReportError" ||
         requestId == "historyDeletionClearCommandAfterError";
}

void completeHistoryDeletionRequest()
{
  switch (historyDeletionStep) {
    case HistoryDeletionStep::ReportQueued:
      historyDeletionStep = HistoryDeletionStep::ReportDeleting;
      return;
    case HistoryDeletionStep::ReportDeleting:
      historyDeletionStep = HistoryDeletionStep::DeleteSd;
      return;
    case HistoryDeletionStep::DeleteLatest:
      historyDeletionStep = HistoryDeletionStep::DeleteMeasurements;
      return;
    case HistoryDeletionStep::DeleteMeasurements:
      historyDeletionStep = HistoryDeletionStep::DeleteHourlyAggregates;
      return;
    case HistoryDeletionStep::DeleteHourlyAggregates:
      historyDeletionStep = HistoryDeletionStep::DeleteDailyAggregates;
      return;
    case HistoryDeletionStep::DeleteDailyAggregates:
      historyDeletionStep = HistoryDeletionStep::ReportCompleted;
      return;
    case HistoryDeletionStep::ReportCompleted:
      historyDeletionStep = HistoryDeletionStep::ClearCommand;
      return;
    case HistoryDeletionStep::ReportError:
      historyDeletionStep = HistoryDeletionStep::ClearCommandAfterError;
      return;
    case HistoryDeletionStep::ClearCommand:
      Serial.println("History deletion completed.");
      historyDeletionQueued = false;
      historyDeletionStep = HistoryDeletionStep::Idle;
      return;
    case HistoryDeletionStep::ClearCommandAfterError:
      historyDeletionQueued = false;
      historyDeletionStep = HistoryDeletionStep::Idle;
      return;
    case HistoryDeletionStep::DeleteSd:
    case HistoryDeletionStep::Idle:
      return;
  }
}

void queueHistoryDeletionRemove(const char *path, const char *requestId)
{
  historyDeletionRequestPending = true;
  database.remove(asyncClient, path, processData, requestId);
}

void queueHistoryDeleteAction()
{
  if (historyDeletionQueued) {
    return;
  }
  historyDeletionQueued = true;
  historyDeletionStep = HistoryDeletionStep::ReportQueued;
  Serial.println("History deletion command queued.");
}

void processPendingHistoryDeletion()
{
  if (!historyDeletionQueued || historyDeletionRequestPending || firmwareUpdateInProgress ||
      Update.isRunning() || cloudSyncPending || cloudHistoryReconciliationIsActive()) {
    return;
  }

  switch (historyDeletionStep) {
    case HistoryDeletionStep::ReportQueued:
      if (isFirebaseTransportReady()) {
        reportHistoryDeletionStatus("queued", "Ukaz čaka na zaporedno izvedbo.",
                                    "historyDeletionReportQueued");
      }
      return;

    case HistoryDeletionStep::ReportDeleting:
      if (isFirebaseTransportReady()) {
        reportHistoryDeletionStatus("deleting", "Brišem SD dnevnik in cloud zgodovino …",
                                    "historyDeletionReportDeleting");
      }
      return;

    case HistoryDeletionStep::DeleteSd:
      if (!sdCardReady) {
        Serial.println("History deletion error: SD card is unavailable.");
        historyDeletionStep = HistoryDeletionStep::ReportError;
        return;
      }
      Serial.println("History deletion: deleting SD and cloud history sequentially.");
      if (!deleteMeasurementHistoryFromSD()) {
        Serial.println("History deletion error: SD log could not be recreated.");
        historyDeletionStep = HistoryDeletionStep::ReportError;
        return;
      }
      historyDeletionStep = HistoryDeletionStep::DeleteLatest;
      return;

    case HistoryDeletionStep::DeleteLatest:
      if (isFirebaseTransportReady()) {
        queueHistoryDeletionRemove(latestDatabasePath, "historyDeletionDeleteLatest");
      }
      return;

    case HistoryDeletionStep::DeleteMeasurements:
      if (isFirebaseTransportReady()) {
        queueHistoryDeletionRemove(historyDatabasePath, "historyDeletionDeleteMeasurements");
      }
      return;

    case HistoryDeletionStep::DeleteHourlyAggregates:
      if (isFirebaseTransportReady()) {
        queueHistoryDeletionRemove(hourlyAggregateDatabasePath, "historyDeletionDeleteHourly");
      }
      return;

    case HistoryDeletionStep::DeleteDailyAggregates:
      if (isFirebaseTransportReady()) {
        queueHistoryDeletionRemove(dailyAggregateDatabasePath, "historyDeletionDeleteDaily");
      }
      return;

    case HistoryDeletionStep::ReportCompleted:
      if (isFirebaseTransportReady()) {
        reportHistoryDeletionStatus("completed", "SD dnevnik in cloud zgodovina sta izbrisana.",
                                    "historyDeletionReportCompleted");
      }
      return;

    case HistoryDeletionStep::ClearCommand:
      if (isFirebaseTransportReady()) {
        clearControlCommand("historyDeletionClearCommand");
      }
      return;

    case HistoryDeletionStep::ReportError:
      if (isFirebaseTransportReady()) {
        reportHistoryDeletionStatus("error", "SD dnevnika ni bilo mogoče varno ponastaviti.",
                                    "historyDeletionReportError");
      }
      return;

    case HistoryDeletionStep::ClearCommandAfterError:
      if (isFirebaseTransportReady()) {
        clearControlCommand("historyDeletionClearCommandAfterError");
      }
      return;

    case HistoryDeletionStep::Idle:
      historyDeletionQueued = false;
      return;
  }
}

void reportWiFiCredentialResetStatus(const char *state, const char *message, const char *requestId)
{
  char jsonPayload[256];
  snprintf(jsonPayload, sizeof(jsonPayload),
           "{\"state\":\"%s\",\"message\":\"%s\",\"updated_at\":%lu}",
           state, message, static_cast<unsigned long>(time(nullptr)));
  object_t networkResetStatus(jsonPayload);
  wifiCredentialResetRequestPending = true;
  database.set(asyncClient, networkResetStatusDatabasePath, networkResetStatus, processData, requestId);
}

bool isWiFiCredentialResetRequest(const String &requestId)
{
  return requestId == "wifiCredentialResetReportQueued" ||
         requestId == "wifiCredentialResetClearCommand" ||
         requestId == "wifiCredentialResetReportError";
}

void completeWiFiCredentialResetRequest()
{
  switch (wifiCredentialResetStep) {
    case WiFiCredentialResetStep::ReportQueued:
      wifiCredentialResetStep = WiFiCredentialResetStep::ClearCommand;
      return;
    case WiFiCredentialResetStep::ClearCommand:
      wifiCredentialResetStep = WiFiCredentialResetStep::ResetCredentials;
      return;
    case WiFiCredentialResetStep::ReportError:
      wifiCredentialResetQueued = false;
      wifiCredentialResetStep = WiFiCredentialResetStep::Idle;
      return;
    case WiFiCredentialResetStep::Idle:
    case WiFiCredentialResetStep::ResetCredentials:
      return;
  }
}

void queueWiFiCredentialResetAction()
{
  if (wifiCredentialResetQueued || historyDeletionQueued || firmwareUpdateInProgress || Update.isRunning()) {
    Serial.println("Wi-Fi credential reset command ignored: another exclusive operation is active.");
    return;
  }
  wifiCredentialResetQueued = true;
  wifiCredentialResetStep = WiFiCredentialResetStep::ReportQueued;
  Serial.println("Wi-Fi credential reset command queued.");
}

void processPendingWiFiCredentialReset()
{
  if (!wifiCredentialResetQueued || wifiCredentialResetRequestPending || firmwareUpdateInProgress || Update.isRunning() ||
      historyDeletionQueued || cloudSyncPending || cloudHistoryReconciliationIsActive()) {
    return;
  }

  switch (wifiCredentialResetStep) {
    case WiFiCredentialResetStep::ReportQueued:
      if (isFirebaseTransportReady()) {
        // Status mora biti potrjen pred prekinitvijo STA povezave, saj po tem cloud ne more več vrniti odziva.
        reportWiFiCredentialResetStatus("queued", "Naprava bo izbrisala Wi-Fi poverilnice in odprla provisioning dostop.",
                                       "wifiCredentialResetReportQueued");
      }
      return;

    case WiFiCredentialResetStep::ClearCommand:
      if (isFirebaseTransportReady()) {
        clearControlCommand("wifiCredentialResetClearCommand");
      }
      return;

    case WiFiCredentialResetStep::ResetCredentials:
      if (clearStoredWiFiCredentials()) {
        // Prejšnji zapis stanja ostane namenoma v Firebase: po prekinitvi Wi-Fi-ja ga naprava ne more več dopolniti.
        wifiCredentialResetQueued = false;
        wifiCredentialResetStep = WiFiCredentialResetStep::Idle;
        Serial.println("Wi-Fi credential reset completed; provisioning AP will start.");
      } else {
        wifiCredentialResetStep = WiFiCredentialResetStep::ReportError;
      }
      return;

    case WiFiCredentialResetStep::ReportError:
      if (isFirebaseTransportReady()) {
        reportWiFiCredentialResetStatus("error", "Wi-Fi poverilnic ni bilo mogoče izbrisati; naprava ostaja povezana.",
                                       "wifiCredentialResetReportError");
      }
      return;

    case WiFiCredentialResetStep::Idle:
      wifiCredentialResetQueued = false;
      return;
  }
}

// --- SD kartica -------------------------------------------------------------

bool initializeSDCard()
{
  SD.end();
  sdSpi.begin(SD_SCK_PIN, SD_MISO_PIN, SD_MOSI_PIN, SD_CS_PIN);
  sdCardReady = SD.begin(SD_CS_PIN, sdSpi);

  if (!sdCardReady || SD.cardType() == CARD_NONE) {
    sdCardReady = false;
    reportComponentFailure(sdCardStatus, "SD kartica", "ni zaznana ali je ni mogoče priklopiti");
    Serial.println("SD card initialization failed.");
    return false;
  }

  if (SD.exists(SD_LOG_PATH)) {
    reportComponentSuccess(sdCardStatus, "SD kartica");
    Serial.println("SD card initialized.");
    return true;
  }

  File logFile = SD.open(SD_LOG_PATH, FILE_WRITE);
  if (!logFile) {
    Serial.println("Could not create measurements.csv on the SD card.");
    sdCardReady = false;
    reportComponentFailure(sdCardStatus, "SD kartica", "dnevnika measurements.csv ni mogoče ustvariti");
    return false;
  }

  logFile.println("date,time,unix_timestamp,temperature_c,humidity_percent,weight_kg");
  logFile.close();
  reportComponentSuccess(sdCardStatus, "SD kartica");
  Serial.println("SD card initialized.");
  return true;
}

void markSDCardUnavailable()
{
  if (sdCardReady) {
    Serial.println("SD card is unavailable.");
    // Stanje se je dejansko spremenilo; cloud objavo prepustimo obstoječi pending vrsti.
    requestSDCardStatusUpdate();
  }

  sdCardReady = false;
  reportComponentFailure(sdCardStatus, "SD kartica", "med delovanjem ni več dosegljiva");
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

void sendLocalJsonResponse(AsyncWebServerRequest *request, int statusCode, const String &jsonPayload)
{
  AsyncWebServerResponse *response =
      request->beginResponse(statusCode, "application/json; charset=utf-8", jsonPayload);
  response->addHeader("Cache-Control", "no-store");
  response->addHeader("Connection", "close");
  request->send(response);
}

void initializeArduinoOta()
{
  // mDNS/UDP inicializiramo šele po stabilizaciji STA vmesnika; lokalni ElegantOTA je na voljo tudi v AP načinu.
  if (arduinoOtaInitialized || !stationNetworkIsStable()) return;

  ArduinoOTA.setHostname(arduinoOtaHostname);
  ArduinoOTA.setPort(3232);
  // Aktivacijska koda ostane shranjena samo lokalno in je za beta Wi-Fi OTA geslo.
  ArduinoOTA.setPassword(activationCode);
  ArduinoOTA.onStart([]() {
    if (localElegantOtaSessionActive) {
      Serial.println("ArduinoOTA: local ElegantOTA session is active; update rejected.");
      Update.abort();
      return;
    }

    const bool filesystemUpdate = ArduinoOTA.getCommand() == U_SPIFFS;
    littlefsUnmountedForArduinoOta = false;
    arduinoOtaLastReportedProgress = 0;
    if (filesystemUpdate) {
      LittleFS.end();
      littlefsUnmountedForArduinoOta = true;
    }
    Serial.printf("ArduinoOTA: starting %s update.\n", filesystemUpdate ? "LittleFS" : "firmware");
  });
  ArduinoOTA.onProgress([](unsigned int currentBytes, unsigned int totalBytes) {
    if (totalBytes == 0) return;

    const uint8_t progressPercent = static_cast<uint8_t>((currentBytes * 100UL) / totalBytes);
    if (progressPercent < arduinoOtaLastReportedProgress + ARDUINO_OTA_PROGRESS_REPORT_INTERVAL_PERCENT &&
        progressPercent < 100) {
      return;
    }

    arduinoOtaLastReportedProgress = progressPercent;
    Serial.printf("ArduinoOTA: %u %% (%u/%u B).\n", progressPercent, currentBytes, totalBytes);
  });
  ArduinoOTA.onEnd([]() { Serial.println("ArduinoOTA: update completed; restarting device."); });
  ArduinoOTA.onError([](ota_error_t error) {
    Serial.printf("ArduinoOTA: update failed (error %u).\n", static_cast<unsigned>(error));
    if (littlefsUnmountedForArduinoOta) {
      littlefsUnmountedForArduinoOta = false;
      if (!LittleFS.begin()) {
        Serial.println("ArduinoOTA: LittleFS remount failed after update error.");
      }
    }
  });
  ArduinoOTA.begin();
  arduinoOtaInitialized = true;
  Serial.printf("ArduinoOTA: ready at %s.local:3232.\n", arduinoOtaHostname);
}

void maintainArduinoOta()
{
  if (!stationNetworkIsStable() || localElegantOtaSessionActive) return;

  initializeArduinoOta();
  ArduinoOTA.handle();
}

void initializeElegantOta()
{
  ElegantOTA.setAutoReboot(false);
  ElegantOTA.onStart([]() {
    LittleFS.end();
    littlefsUnmountedForLocalElegantOta = true;
    localElegantOtaSessionActive = true;
    localElegantOtaAwaitingUpdateStart = true;
    localElegantOtaRestartScheduled = false;
    localElegantOtaStartedMillis = millis();
    localElegantOtaLastReportedBytes = 0;
    Serial.println("ElegantOTA: local update started.");
  });
  ElegantOTA.onProgress([](size_t currentBytes, size_t totalBytes) {
    (void)totalBytes;
    if (currentBytes < localElegantOtaLastReportedBytes + LOCAL_ELEGANT_OTA_REPORT_INTERVAL_BYTES) return;

    localElegantOtaLastReportedBytes = currentBytes;
    Serial.printf("ElegantOTA: received %u KiB.\n", static_cast<unsigned>(currentBytes / 1024));
  });
  ElegantOTA.onEnd([](bool success) {
    if (success) {
      Serial.println("ElegantOTA: update completed; restarting device.");
      localElegantOtaRestartScheduled = true;
      localElegantOtaRestartScheduledMillis = millis();
      return;
    }

    Update.printError(Serial);
    localElegantOtaSessionActive = false;
    localElegantOtaAwaitingUpdateStart = false;
    localElegantOtaRestartScheduled = false;
    if (littlefsUnmountedForLocalElegantOta) {
      littlefsUnmountedForLocalElegantOta = false;
      if (!LittleFS.begin()) {
        Serial.println("ElegantOTA: LittleFS remount failed after update error.");
      }
    }
    Serial.println("ElegantOTA: update failed.");
  });
  ElegantOTA.begin(&localServer);
  Serial.println("ElegantOTA: http://<device-ip>/update");
}

void maintainElegantOtaSession()
{
  if (!localElegantOtaSessionActive) return;

  if (localElegantOtaAwaitingUpdateStart) {
    if (Update.isRunning()) {
      localElegantOtaAwaitingUpdateStart = false;
      return;
    }

    if (millis() - localElegantOtaStartedMillis < LOCAL_ELEGANT_OTA_START_TIMEOUT_MS) return;

    localElegantOtaSessionActive = false;
    localElegantOtaAwaitingUpdateStart = false;
    if (littlefsUnmountedForLocalElegantOta) {
      littlefsUnmountedForLocalElegantOta = false;
      if (!LittleFS.begin()) {
        Serial.println("ElegantOTA: LittleFS remount failed after update start error.");
      }
    }
    Serial.println("ElegantOTA: update did not start; local page restored.");
    return;
  }

  if (localElegantOtaRestartScheduled) {
    if (millis() - localElegantOtaRestartScheduledMillis >= LOCAL_ELEGANT_OTA_RESTART_DELAY_MS) {
      Serial.println("ElegantOTA: restarting device.");
      ESP.restart();
    }
    return;
  }

  if (Update.isRunning()) return;

  if (Update.hasError()) {
    Update.printError(Serial);
    localElegantOtaSessionActive = false;
    if (littlefsUnmountedForLocalElegantOta) {
      littlefsUnmountedForLocalElegantOta = false;
      if (!LittleFS.begin()) {
        Serial.println("ElegantOTA: LittleFS remount failed after update error.");
      }
    }
    Serial.println("ElegantOTA: update failed before the final HTTP response.");
    return;
  }

  Serial.println("ElegantOTA: flash write completed without the final HTTP response; restarting device.");
  localElegantOtaRestartScheduled = true;
  localElegantOtaRestartScheduledMillis = millis();
}

const char *contentTypeForPath(const String &path)
{
  if (path.endsWith(".html")) return "text/html; charset=utf-8";
  if (path.endsWith(".css")) return "text/css; charset=utf-8";
  if (path.endsWith(".js")) return "application/javascript; charset=utf-8";
  if (path.endsWith(".svg")) return "image/svg+xml";
  if (path.endsWith(".png")) return "image/png";
  return "application/octet-stream";
}

bool serveLocalAsset(AsyncWebServerRequest *request, String path)
{
  if (littlefsUnmountedForLocalElegantOta) {
    request->send(503, "text/plain; charset=utf-8", "Lokalna stran se posodablja.");
    return true;
  }
  if (path == "/") path = "/index.html";
  if (!LittleFS.exists(path)) return false;

  // Brskalnik ob prvem obisku vzporedno zahteva HTML, CSS in JavaScript. V tem kratkem oknu
  // ne dodajamo novih Firebase opravil, že aktivna zahteva in app.loop() pa nemoteno tečeta naprej.
  localAssetsHavePriorityUntilMillis = millis() + LOCAL_ASSET_PRIORITY_WINDOW_MS;

  String responsePath = path;
  bool sendCompressed = false;
  const AsyncWebHeader *encodingHeader = request->getHeader("Accept-Encoding");
  if (encodingHeader != nullptr && encodingHeader->value().indexOf("gzip") >= 0) {
    const String compressedPath = path + ".gz";
    if (LittleFS.exists(compressedPath)) {
      responsePath = compressedPath;
      sendCompressed = true;
    }
  }

  AsyncWebServerResponse *response = request->beginResponse(LittleFS, responsePath, contentTypeForPath(path));
  if (response == nullptr) return false;
  if (sendCompressed) response->addHeader("Content-Encoding", "gzip");
  response->addHeader("Vary", "Accept-Encoding");
  response->addHeader("Cache-Control", path.startsWith("/vendor/") ? "public, max-age=86400" : "no-cache");
  response->addHeader("Connection", "close");
  request->send(response);
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

bool normalizeSdCardPath(const String &candidate, String &path, bool allowRoot)
{
  if (candidate.isEmpty() || candidate.length() > SD_CARD_PATH_MAX_LENGTH || !candidate.startsWith("/") ||
      candidate.indexOf('\\') >= 0 || candidate.indexOf("//") >= 0 || candidate.indexOf("..") >= 0) {
    return false;
  }
  for (size_t index = 0; index < candidate.length(); ++index) {
    if (static_cast<uint8_t>(candidate[index]) < 0x20) return false;
  }

  path = candidate;
  while (path.length() > 1 && path.endsWith("/")) path.remove(path.length() - 1);
  return allowRoot || path != "/";
}

bool isValidSdCardFileName(const String &name)
{
  if (name.isEmpty() || name.length() > 64 || name == "." || name == ".." || name.indexOf('/') >= 0 ||
      name.indexOf('\\') >= 0 || name.indexOf("..") >= 0) {
    return false;
  }
  for (size_t index = 0; index < name.length(); ++index) {
    if (static_cast<uint8_t>(name[index]) < 0x20) return false;
  }
  return true;
}

String sdCardPathName(const String &path)
{
  const int separator = path.lastIndexOf('/');
  return separator >= 0 ? path.substring(separator + 1) : path;
}

bool authenticateSdCardRequest(AsyncWebServerRequest *request)
{
  String password;
  if (!preferences.begin(SD_CARD_SETTINGS_NAMESPACE, true)) {
    request->send(500, "text/plain; charset=utf-8", "SD card access password is unavailable.");
    return false;
  }
  password = preferences.getString(SD_CARD_PASSWORD_KEY, "");
  preferences.end();

  if (password.length() < SD_CARD_PASSWORD_MIN_LENGTH ||
      !request->authenticate(SD_CARD_USERNAME, password.c_str())) {
    request->requestAuthentication("SD kartica");
    return false;
  }
  return true;
}

void sendSdCardError(AsyncWebServerRequest *request, int statusCode, const char *message)
{
  String escapedMessage;
  appendJsonEscaped(escapedMessage, message);
  sendLocalJsonResponse(request, statusCode, String("{\"error\":\"") + escapedMessage + "\"}");
}

void sendSdCardDirectory(AsyncWebServerRequest *request)
{
  if (!authenticateSdCardRequest(request)) return;
  if (!sdCardReady) {
    sendSdCardError(request, 503, "SD card is unavailable");
    return;
  }

  String path;
  if (!normalizeSdCardPath(request->arg("path"), path, true)) {
    sendSdCardError(request, 400, "Invalid SD card path");
    return;
  }

  File directory = SD.open(path);
  if (!directory || !directory.isDirectory()) {
    if (directory) directory.close();
    sendSdCardError(request, 404, "Folder is unavailable");
    return;
  }
  directory.close();

  String jsonPayload;
  jsonPayload.reserve(1536);
  jsonPayload = "{\"path\":\"";
  appendJsonEscaped(jsonPayload, path);
  jsonPayload += "\",\"total_bytes\":" + String(static_cast<unsigned long long>(SD.totalBytes()));
  jsonPayload += ",\"used_bytes\":" + String(static_cast<unsigned long long>(SD.usedBytes()));
  jsonPayload += ",\"entries\":[";

  const String nativeDirectoryPath = String("/sd") + path;
  DIR *nativeDirectory = opendir(nativeDirectoryPath.c_str());
  if (nativeDirectory == nullptr) {
    sendSdCardError(request, 500, "Folder could not be enumerated");
    return;
  }

  // Arduinojev File::openNextFile() pri nekaterih FAT karticah dobi `DT_UNKNOWN`
  // in zato preskoči vse vnose. POSIX readdir() vrne imena neposredno, stat() pa
  // zanesljivo določi vrsto in velikost posameznega vnosa.
  bool firstEntry = true;
  bool truncated = false;
  uint16_t entryCount = 0;
  while (dirent *nativeEntry = readdir(nativeDirectory)) {
    const String entryName = nativeEntry->d_name;
    if (entryName == "." || entryName == "..") continue;
    if (entryCount >= SD_CARD_DIRECTORY_ENTRY_LIMIT) {
      truncated = true;
      break;
    }

    const String entryPath = path == "/" ? "/" + entryName : path + "/" + entryName;
    const String nativeEntryPath = String("/sd") + entryPath;
    struct stat entryInfo {};
    if (stat(nativeEntryPath.c_str(), &entryInfo) != 0) continue;
    if (!firstEntry) jsonPayload += ',';
    firstEntry = false;
    jsonPayload += "{\"name\":\"";
    appendJsonEscaped(jsonPayload, entryName);
    jsonPayload += "\",\"path\":\"";
    appendJsonEscaped(jsonPayload, entryPath);
    jsonPayload += "\",\"directory\":";
    jsonPayload += S_ISDIR(entryInfo.st_mode) ? "true" : "false";
    jsonPayload += ",\"size\":" + String(static_cast<unsigned long long>(entryInfo.st_size)) + '}';
    ++entryCount;
  }
  closedir(nativeDirectory);
  jsonPayload += "],\"truncated\":";
  jsonPayload += truncated ? "true}" : "false}";
  sendLocalJsonResponse(request, 200, jsonPayload);
}

void downloadSdCardFile(AsyncWebServerRequest *request)
{
  if (!authenticateSdCardRequest(request)) return;
  if (!sdCardReady) {
    request->send(503, "text/plain; charset=utf-8", "SD card is unavailable.");
    return;
  }

  String path;
  if (!normalizeSdCardPath(request->arg("path"), path, false)) {
    request->send(400, "text/plain; charset=utf-8", "Invalid SD card path.");
    return;
  }
  File file = SD.open(path, FILE_READ);
  if (!file || file.isDirectory()) {
    if (file) file.close();
    request->send(404, "text/plain; charset=utf-8", "File is unavailable.");
    return;
  }
  file.close();
  request->send(SD, path, contentTypeForPath(path), true);
}

void deleteSdCardFile(AsyncWebServerRequest *request)
{
  if (!authenticateSdCardRequest(request)) return;
  if (!sdCardReady) {
    sendSdCardError(request, 503, "SD card is unavailable");
    return;
  }

  String path;
  if (!normalizeSdCardPath(request->arg("path"), path, false)) {
    sendSdCardError(request, 400, "Invalid SD card path");
    return;
  }
  File entry = SD.open(path);
  if (!entry) {
    sendSdCardError(request, 404, "File or folder is unavailable");
    return;
  }
  const bool directory = entry.isDirectory();
  entry.close();
  const bool deleted = directory ? SD.rmdir(path) : SD.remove(path);
  if (!deleted) {
    sendSdCardError(request, 409, directory ? "Folder is not empty or could not be deleted" : "File could not be deleted");
    return;
  }
  sendLocalJsonResponse(request, 200, "{\"state\":\"deleted\"}");
}

void handleSdCardUpload(AsyncWebServerRequest *request, const String &filename, size_t index,
                        uint8_t *data, size_t length, bool final)
{
  if (index == 0) {
    if (!authenticateSdCardRequest(request) || !sdCardReady) return;

    auto *context = new SdCardUploadContext();
    if (context == nullptr) return;
    request->_tempObject = context;

    String directory;
    if (!normalizeSdCardPath(request->arg("path"), directory, true) || !isValidSdCardFileName(filename) ||
        !SD.exists(directory)) {
      context->failed = true;
      context->statusCode = 400;
      context->error = "Izbrana mapa ali ime datoteke ni veljavno";
      return;
    }
    const String targetPath = directory == "/" ? "/" + filename : directory + "/" + filename;
    context->targetPath = targetPath;
    context->overwrite = request->arg("overwrite") == "1";
    if (targetPath.length() + 7 > SD_CARD_PATH_MAX_LENGTH) {
      context->failed = true;
      context->statusCode = 400;
      context->error = "Ime datoteke je predolgo";
      return;
    }
    if (SD.exists(targetPath) && !context->overwrite) {
      context->failed = true;
      context->statusCode = 409;
      context->error = "Datoteka s tem imenom že obstaja";
      return;
    }
    context->temporaryPath = targetPath + ".upload";
    if (SD.exists(context->temporaryPath)) SD.remove(context->temporaryPath);
    context->file = SD.open(context->temporaryPath, FILE_WRITE);
    if (!context->file) {
      context->failed = true;
      context->statusCode = 500;
      context->error = "Temporary file could not be created";
    }
  }

  auto *context = static_cast<SdCardUploadContext *>(request->_tempObject);
  if (context == nullptr || context->failed) return;
  if (length > 0 && context->file.write(data, length) != length) {
    context->failed = true;
    context->statusCode = 500;
    context->error = "Writing to SD card failed";
  }
  if (!final) return;

  context->file.close();
  if (!context->failed && context->overwrite && SD.exists(context->targetPath) &&
      !SD.remove(context->targetPath)) {
    context->failed = true;
    context->statusCode = 409;
    context->error = "Obstoječe datoteke ni bilo mogoče zamenjati";
  }
  if (!context->failed && !SD.rename(context->temporaryPath, context->targetPath)) {
    context->failed = true;
    context->statusCode = 500;
    context->error = "Uploaded file could not be finalized";
  }
}

void finishSdCardUpload(AsyncWebServerRequest *request)
{
  if (!authenticateSdCardRequest(request)) return;
  auto *context = static_cast<SdCardUploadContext *>(request->_tempObject);
  if (context == nullptr) {
    sendSdCardError(request, sdCardReady ? 400 : 503, sdCardReady ? "Upload could not be started" : "SD card is unavailable");
    return;
  }

  if (context->file) context->file.close();
  if (context->failed) {
    if (!context->temporaryPath.isEmpty()) SD.remove(context->temporaryPath);
    const String error = context->error.isEmpty() ? "Upload failed" : context->error;
    const int statusCode = context->statusCode;
    delete context;
    request->_tempObject = nullptr;
    sendSdCardError(request, statusCode, error.c_str());
    return;
  }
  delete context;
  request->_tempObject = nullptr;
  sendLocalJsonResponse(request, 201, "{\"state\":\"uploaded\"}");
}

void changeSdCardPassword(AsyncWebServerRequest *request)
{
  if (!authenticateSdCardRequest(request)) return;
  if (!request->hasParam("current_password", true) || !request->hasParam("new_password", true)) {
    sendSdCardError(request, 400, "Current and new password are required");
    return;
  }

  const String currentPassword = request->getParam("current_password", true)->value();
  const String newPassword = request->getParam("new_password", true)->value();
  if (newPassword.length() < SD_CARD_PASSWORD_MIN_LENGTH || newPassword.length() > SD_CARD_PASSWORD_MAX_LENGTH) {
    sendSdCardError(request, 400, "New password must contain 8 to 63 characters");
    return;
  }
  if (!preferences.begin(SD_CARD_SETTINGS_NAMESPACE, false)) {
    sendSdCardError(request, 500, "Password storage is unavailable");
    return;
  }
  const String storedPassword = preferences.getString(SD_CARD_PASSWORD_KEY, "");
  if (currentPassword != storedPassword) {
    preferences.end();
    sendSdCardError(request, 403, "Current password is incorrect");
    return;
  }
  const bool saved = preferences.putString(SD_CARD_PASSWORD_KEY, newPassword) > 0;
  preferences.end();
  if (!saved) {
    sendSdCardError(request, 500, "New password could not be saved");
    return;
  }
  sendLocalJsonResponse(request, 200, "{\"state\":\"password_changed\"}");
}

void serveSdCardPage(AsyncWebServerRequest *request)
{
  if (!authenticateSdCardRequest(request)) return;
  if (!serveLocalAsset(request, "/sd_card.html")) {
    request->send(500, "text/plain; charset=utf-8", "SD card page is unavailable. Upload LittleFS assets.");
  }
}

void serveSdCardScript(AsyncWebServerRequest *request)
{
  if (!authenticateSdCardRequest(request)) return;
  if (!serveLocalAsset(request, "/sd_card.js")) {
    request->send(500, "text/plain; charset=utf-8", "SD card script is unavailable. Upload LittleFS assets.");
  }
}

void sendAvailableWiFiNetworks(AsyncWebServerRequest *request)
{
  if (wifiConnectionAttemptBusy()) {
    sendLocalJsonResponse(request, 409, "{\"error\":\"Wi-Fi connection test is in progress\"}");
    return;
  }

  const int scanResult = WiFi.scanComplete();
  if (scanResult == WIFI_SCAN_RUNNING) {
    sendLocalJsonResponse(request, 202, "{\"state\":\"scanning\"}");
    return;
  }

  if (scanResult == WIFI_SCAN_FAILED) {
    // Skeniranje potrebuje tudi STA vmesnik, AP pa ostane aktiven za telefon.
    WiFi.mode(WIFI_AP_STA);
    WiFi.setSleep(false);
    WiFi.scanNetworks(true, true);
    sendLocalJsonResponse(request, 202, "{\"state\":\"scanning\"}");
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
  sendLocalJsonResponse(request, 200, jsonPayload);
}

void saveWiFiConfiguration(AsyncWebServerRequest *request)
{
  const String ssid = request->arg("ssid");
  const String password = request->arg("password");
  if (ssid.length() == 0 || ssid.length() > 32 || password.length() > 63) {
    sendLocalJsonResponse(request, 400, "{\"error\":\"Invalid Wi-Fi configuration\"}");
    return;
  }
  if (wifiConnectionAttemptBusy()) {
    sendLocalJsonResponse(request, 409, "{\"error\":\"Wi-Fi connection test is in progress\"}");
    return;
  }

  const IPAddress requestLocalIp = request->client() != nullptr
                                       ? request->client()->localIP()
                                       : IPAddress();
  const bool requestFromAccessPoint = requestLocalIp == IPAddress(192, 168, 4, 1);
  Serial.printf("Wi-Fi configuration received through %s (%s).\n",
                requestFromAccessPoint ? "provisioning AP" : "home network",
                requestLocalIp.toString().c_str());

  if (!queueWiFiConnectionAttempt(ssid, password, requestFromAccessPoint)) {
    sendLocalJsonResponse(request, 409, "{\"error\":\"Wi-Fi connection test is in progress\"}");
    return;
  }
  sendLocalJsonResponse(request, 202, "{\"state\":\"connecting\"}");
}

void deleteWiFiConfiguration(AsyncWebServerRequest *request)
{
  if (wifiConnectionAttemptBusy()) {
    sendLocalJsonResponse(request, 409, "{\"error\":\"Wi-Fi connection test is in progress\"}");
    return;
  }

  sendLocalJsonResponse(request, 202, "{\"state\":\"clearing\"}");
  scheduledWiFiSettingsClearMillis = millis() + WIFI_SETTINGS_CLEAR_DELAY_MS;
}

bool parseRequestFloat(AsyncWebServerRequest *request, const char *parameterName, float &value)
{
  if (!request->hasParam(parameterName, true)) return false;

  const String text = request->getParam(parameterName, true)->value();
  char *numberEnd = nullptr;
  const float parsed = strtof(text.c_str(), &numberEnd);
  if (numberEnd == text.c_str() || *numberEnd != '\0' || !isfinite(parsed)) return false;

  value = parsed;
  return true;
}

void requestBme680Calibration(AsyncWebServerRequest *request)
{
  float temperatureOffsetC = 0.0F;
  float humidityOffsetPercent = 0.0F;
  if (!parseRequestFloat(request, "temperature_offset_c", temperatureOffsetC) ||
      !parseRequestFloat(request, "humidity_offset_percent", humidityOffsetPercent)) {
    sendLocalJsonResponse(request, 400, "{\"error\":\"Temperature and humidity offsets are required\"}");
    return;
  }

  if (!queueBme680Calibration(temperatureOffsetC, humidityOffsetPercent, false)) {
    sendLocalJsonResponse(request, 409, "{\"error\":\"Calibration is active or the offsets are out of range\"}");
    return;
  }

  Serial.println("Local BME680 calibration request accepted.");
  sendLocalJsonResponse(request, 202, "{\"state\":\"queued\"}");
}

void requestLoadCellTare(AsyncWebServerRequest *request)
{
  if (!loadCellReady) {
    sendLocalJsonResponse(request, 503, "{\"error\":\"HX711 is unavailable\"}");
    return;
  }
  if (!queueLoadCellTare(false)) {
    sendLocalJsonResponse(request, 409, "{\"error\":\"Load cell taring is already in progress\"}");
    return;
  }
  Serial.println("Local load cell tare request accepted.");
  sendLocalJsonResponse(request, 202, "{\"state\":\"queued\"}");
}

void requestTimeConfiguration(AsyncWebServerRequest *request)
{
  if (!request->hasParam("action", true)) {
    sendLocalJsonResponse(request, 400, "{\"error\":\"Time action is required\"}");
    return;
  }

  const String action = request->getParam("action", true)->value();
  TimeCommandType commandType = TimeCommandType::None;
  time_t timestamp = 0;
  if (action == "set") {
    if (!request->hasParam("timestamp", true)) {
      sendLocalJsonResponse(request, 400, "{\"error\":\"Timestamp is required\"}");
      return;
    }
    const String timestampText = request->getParam("timestamp", true)->value();
    char *timestampEnd = nullptr;
    const unsigned long long parsedTimestamp = strtoull(timestampText.c_str(), &timestampEnd, 10);
    if (timestampEnd == timestampText.c_str() || *timestampEnd != '\0' ||
        parsedTimestamp < static_cast<unsigned long long>(MIN_VALID_UNIX_TIMESTAMP) ||
        parsedTimestamp > static_cast<unsigned long long>(MAX_SETTABLE_UNIX_TIMESTAMP)) {
      sendLocalJsonResponse(request, 400, "{\"error\":\"Timestamp is outside the DS3231 range\"}");
      return;
    }
    timestamp = static_cast<time_t>(parsedTimestamp);
    commandType = TimeCommandType::SetManual;
  } else if (action == "sync_ntp") {
    if (!stationNetworkIsStable()) {
      sendLocalJsonResponse(request, 409, "{\"error\":\"Internet connection is unavailable\"}");
      return;
    }
    commandType = TimeCommandType::SynchronizeNtp;
  } else {
    sendLocalJsonResponse(request, 400, "{\"error\":\"Unsupported time action\"}");
    return;
  }

  if (!queueTimeCommand(commandType, timestamp, false)) {
    sendLocalJsonResponse(request, 409, "{\"error\":\"Another time operation is active\"}");
    return;
  }
  Serial.println("Local time command accepted.");
  sendLocalJsonResponse(request, 202, "{\"state\":\"queued\"}");
}

void sendLocalStatus(AsyncWebServerRequest *request)
{
  const Uptime uptime = getUptime();
  const String ipAddress = stationConnected ? WiFi.localIP().toString() : WiFi.softAPIP().toString();
  const String stationIp = stationConnected ? WiFi.localIP().toString() : "";
  const String accessPointIp = WiFi.softAPIP().toString();
  const String wifiSignal = stationConnected ? String(WiFi.RSSI()) : "null";
  String escapedStationSsid;
  appendJsonEscaped(escapedStationSsid, stationConnected ? WiFi.SSID() : "");
  const time_t lastSeenTimestamp = time(nullptr);
  const bool reconciliationActive = cloudHistoryReconciliationIsActive();
  const bool cloudSynchronizationComplete = cloudSyncCaughtUp && !cloudSyncPending &&
                                             !hourlyAggregateReady && !dailyAggregateReady &&
                                             !reconciliationActive;
  uint32_t accessPointShutdownRemainingSeconds = 0;
  if (accessPointShutdownMillis != 0) {
    const int32_t remainingMillis = static_cast<int32_t>(accessPointShutdownMillis - millis());
    if (remainingMillis > 0) {
      accessPointShutdownRemainingSeconds = (static_cast<uint32_t>(remainingMillis) + 999) / 1000;
    }
  }
  static char measurementJson[256];
  if (hasLatestMeasurement) {
    serializeMeasurementJson(latestMeasurement, measurementJson, sizeof(measurementJson));
  } else {
    snprintf(measurementJson, sizeof(measurementJson), "null");
  }

  const time_t currentTimestamp = time(nullptr);
  static char jsonPayload[3720];
  snprintf(jsonPayload, sizeof(jsonPayload),
           "{\"latest\":%s,\"device\":{\"device_id\":\"%s\",\"ip_address\":\"%s\",\"wifi_rssi_dbm\":%s,\"uptime_days\":%llu,\"uptime_hours\":%llu,\"uptime_minutes\":%llu,\"last_seen_timestamp\":%lu,\"components\":{\"bme680\":{\"state\":\"%s\",\"failures\":%u,\"ready\":%s},\"hx711\":{\"state\":\"%s\",\"failures\":%u,\"ready\":%s},\"ds3231\":{\"state\":\"%s\",\"failures\":%u,\"ready\":%s,\"time_valid\":%s},\"sd_card\":{\"state\":\"%s\",\"failures\":%u,\"ready\":%s}}},\"time\":{\"timestamp\":%lu,\"source\":\"%s\",\"system_valid\":%s,\"rtc_present\":%s,\"rtc_valid\":%s,\"ntp_sync_pending\":%s,\"last_sync_timestamp\":%lu},\"network\":{\"mode\":\"%s\",\"credentials_saved\":%s,\"station_connected\":%s,\"station_ssid\":\"%s\",\"station_ip\":\"%s\",\"local_hostname\":\"%s.local\",\"provisioning_active\":%s,\"access_point_ssid\":\"%s\",\"access_point_ip\":\"%s\",\"access_point_shutdown_remaining_seconds\":%lu,\"connection_state\":\"%s\",\"connection_message\":\"%s\",\"activation_code\":\"%s\"},\"sync\":{\"pending\":%s,\"caught_up\":%s,\"last_synced_timestamp\":%lu,\"retry_seconds\":%lu,\"reconciliation\":{\"state\":\"%s\",\"local_days\":%u,\"days_to_transfer\":%u,\"days_completed\":%u,\"measurements_to_transfer\":%lu,\"measurements_uploaded\":%lu,\"last_completed_timestamp\":%lu}},\"measurement_settings\":{\"measurement_interval_seconds\":%lu,\"sd_archive_interval_minutes\":%lu,\"weight_display_decimals\":%u},\"local_history\":{\"deletion_state\":\"%s\"},\"sd_card\":{\"present\":%s,\"initialization_failures\":%u,\"error\":%s},\"sensors\":{\"load_cell\":{\"ready\":%s,\"tare_state\":\"%s\"},\"bme680\":{\"ready\":%s,\"temperature_offset_c\":%.1f,\"humidity_offset_percent\":%.1f,\"state\":\"%s\"}},\"firmware\":{\"version\":\"%s\"}}",
           measurementJson, deviceId, ipAddress.c_str(), wifiSignal.c_str(), static_cast<unsigned long long>(uptime.days),
           static_cast<unsigned long long>(uptime.hours), static_cast<unsigned long long>(uptime.minutes),
           static_cast<unsigned long>(lastSeenTimestamp),
           componentHealthName(bme680Status), bme680Status.consecutiveFailures, bme680Ready ? "true" : "false",
           componentHealthName(loadCellStatus), loadCellStatus.consecutiveFailures, loadCellReady ? "true" : "false",
           componentHealthName(rtcStatus), rtcStatus.consecutiveFailures, rtcReady ? "true" : "false",
           rtcTimeValid ? "true" : "false", componentHealthName(sdCardStatus),
           sdCardStatus.consecutiveFailures, sdCardReady ? "true" : "false",
           static_cast<unsigned long>(currentTimestamp), timeSourceName(),
           currentTimestamp >= MIN_VALID_UNIX_TIMESTAMP ? "true" : "false", rtcReady ? "true" : "false",
           rtcTimeValid ? "true" : "false", ntpSynchronizationPending ? "true" : "false",
            static_cast<unsigned long>(lastTimeSynchronizationTimestamp),
            stationConnected ? "station" : "access_point",
            savedWiFiCredentialsAvailable ? "true" : "false", stationConnected ? "true" : "false",
            escapedStationSsid.c_str(), stationIp.c_str(), arduinoOtaHostname,
            accessPointActive ? "true" : "false", accessPointSsid, accessPointIp.c_str(),
            static_cast<unsigned long>(accessPointShutdownRemainingSeconds),
            wifiProvisioningStateName(), wifiProvisioningMessage(), activationCode,
           (cloudSyncPending || reconciliationActive) ? "true" : "false",
           cloudSynchronizationComplete ? "true" : "false",
           static_cast<unsigned long>(lastCloudSyncedTimestamp),
           static_cast<unsigned long>(cloudSyncRetryIntervalMs / 1000),
            cloudReconciliationStateName(), dailyReconciliationManifestCount,
            dailyReconciliationDaysToTransfer, dailyReconciliationDaysCompleted,
            static_cast<unsigned long>(dailyReconciliationMeasurementsToTransfer),
            static_cast<unsigned long>(dailyReconciliationMeasurementsUploaded),
           static_cast<unsigned long>(lastDailyReconciliationTimestamp),
           static_cast<unsigned long>(measurementIntervalMs / 1000U),
           static_cast<unsigned long>(sdMeasurementIntervalMs / (60U * 1000U)), weightDisplayDecimals,
           localHistoryDeletionStateName(),
           sdCardReady ? "true" : "false", sdInitializationFailures,
           sdErrorReported ? "true" : "false", loadCellReady ? "true" : "false",
           loadCellTareStateName(), bme680Ready ? "true" : "false", bme680TemperatureOffsetC,
           bme680HumidityOffsetPercent, bme680CalibrationStateName(), FIRMWARE_VERSION);
  sendLocalJsonResponse(request, 200, jsonPayload);
}

bool getLocalHistoryWindow(AsyncWebServerRequest *request, time_t &firstTimestamp, time_t &lastTimestamp,
                           uint32_t &bucketDuration)
{
  const time_t now = time(nullptr);
  firstTimestamp = request->hasParam("from")
                       ? static_cast<time_t>(request->arg("from").toInt())
                       : now - 24 * 60 * 60;
  lastTimestamp = request->hasParam("to")
                      ? static_cast<time_t>(request->arg("to").toInt())
                      : now;

  const time_t duration = lastTimestamp - firstTimestamp;
  if (firstTimestamp <= 0 || lastTimestamp <= firstTimestamp || duration > MAX_LOCAL_HISTORY_DURATION_SECONDS) {
    return false;
  }

  if (duration <= 24 * 60 * 60) {
    bucketDuration = 60;
  } else if (duration <= 7 * 24 * 60 * 60) {
    bucketDuration = 60 * 60;
  } else if (duration <= 31 * 24 * 60 * 60) {
    bucketDuration = 6 * 60 * 60;
  } else {
    bucketDuration = 24 * 60 * 60;
  }
  return true;
}

void failLocalHistory(const char *message)
{
  if (localHistoryLogFile) localHistoryLogFile.close();
  if (localHistoryResponseFile) localHistoryResponseFile.close();
  portENTER_CRITICAL(&localHistoryStateMux);
  strlcpy(localHistoryError, message, sizeof(localHistoryError));
  localHistoryState = LocalHistoryState::Error;
  portEXIT_CRITICAL(&localHistoryStateMux);
  Serial.printf("Local history error: %s\n", message);
}

void beginLocalHistoryResponse()
{
  if (localHistoryLogFile) localHistoryLogFile.close();
  if (SD.exists(SD_HISTORY_RESPONSE_PATH) && !SD.remove(SD_HISTORY_RESPONSE_PATH)) {
    failLocalHistory("History response could not be replaced");
    return;
  }

  localHistoryResponseFile = SD.open(SD_HISTORY_RESPONSE_PATH, FILE_WRITE);
  if (!localHistoryResponseFile) {
    failLocalHistory("History response could not be created");
    return;
  }

  localHistoryResponseFile.print("{\"readings\":[");
  localHistoryWriteBucketIndex = 0;
  localHistoryFirstReading = true;
  portENTER_CRITICAL(&localHistoryStateMux);
  localHistoryState = LocalHistoryState::Writing;
  portEXIT_CRITICAL(&localHistoryStateMux);
}

void processLocalHistory()
{
  LocalHistoryState state;
  portENTER_CRITICAL(&localHistoryStateMux);
  state = localHistoryState;
  portEXIT_CRITICAL(&localHistoryStateMux);

  if (state == LocalHistoryState::Queued) {
    if (!sdCardReady || localHistoryBuckets == nullptr) {
      failLocalHistory("SD card or PSRAM history buffer is unavailable");
      return;
    }

    memset(localHistoryBuckets, 0, MAX_LOCAL_HISTORY_BUCKETS * sizeof(HistoryBucket));
    localHistoryLogFile = SD.open(SD_LOG_PATH, FILE_READ);
    if (!localHistoryLogFile) {
      failLocalHistory("Measurement log is unavailable");
      return;
    }

    const uint32_t historyStartOffset = findHistoryFileOffset(localHistoryFirstTimestamp);
    if (historyStartOffset > 0 && !localHistoryLogFile.seek(historyStartOffset)) {
      localHistoryLogFile.seek(0);
    }
    portENTER_CRITICAL(&localHistoryStateMux);
    localHistoryState = LocalHistoryState::Reading;
    portEXIT_CRITICAL(&localHistoryStateMux);
    return;
  }

  if (state == LocalHistoryState::Reading) {
    const uint32_t startedMillis = millis();
    uint16_t processedLines = 0;
    bool readingComplete = false;
    char line[128];

    while (localHistoryLogFile.available() && processedLines < LOCAL_HISTORY_LINES_PER_LOOP &&
           millis() - startedMillis < LOCAL_HISTORY_LOOP_BUDGET_MS) {
      const size_t lineLength = localHistoryLogFile.readBytesUntil('\n', line, sizeof(line) - 1);
      line[lineLength] = '\0';
      ++processedLines;

      Measurement measurement{};
      if (!parseMeasurementCsvLine(line, measurement)) continue;
      if (measurement.timestamp > localHistoryLastTimestamp) {
        readingComplete = true;
        break;
      }
      if (measurement.timestamp < localHistoryFirstTimestamp) continue;

      const size_t bucketIndex =
          (measurement.timestamp - localHistoryFirstTimestamp) / localHistoryBucketDuration;
      if (bucketIndex >= MAX_LOCAL_HISTORY_BUCKETS) continue;
      HistoryBucket &bucket = localHistoryBuckets[bucketIndex];
      bucket.timestamp = (measurement.timestamp / localHistoryBucketDuration) * localHistoryBucketDuration;
      if (measurement.bme680Valid) {
        bucket.temperatureSum += measurement.temperatureC;
        bucket.humiditySum += measurement.humidityPercent;
        ++bucket.temperatureCount;
        ++bucket.humidityCount;
      }
      if (measurement.loadCellValid) {
        bucket.weightSum += measurement.weightKg;
        ++bucket.weightCount;
      }
      ++bucket.count;
    }

    if (readingComplete || !localHistoryLogFile.available()) beginLocalHistoryResponse();
    return;
  }

  if (state != LocalHistoryState::Writing) return;

  const uint32_t startedMillis = millis();
  uint16_t processedBuckets = 0;
  while (localHistoryWriteBucketIndex < MAX_LOCAL_HISTORY_BUCKETS &&
         processedBuckets < LOCAL_HISTORY_BUCKETS_PER_LOOP &&
         millis() - startedMillis < LOCAL_HISTORY_LOOP_BUDGET_MS) {
    const HistoryBucket &bucket = localHistoryBuckets[localHistoryWriteBucketIndex++];
    ++processedBuckets;
    if (bucket.count == 0) continue;
    if (!localHistoryFirstReading) localHistoryResponseFile.print(',');
    localHistoryFirstReading = false;
    char bucketJson[192];
    serializeHistoryBucketJson(bucket, bucketJson, sizeof(bucketJson));
    localHistoryResponseFile.print(bucketJson);
  }

  if (localHistoryWriteBucketIndex < MAX_LOCAL_HISTORY_BUCKETS) return;
  localHistoryResponseFile.print("]}");
  localHistoryResponseFile.close();
  portENTER_CRITICAL(&localHistoryStateMux);
  localHistoryState = LocalHistoryState::Ready;
  portEXIT_CRITICAL(&localHistoryStateMux);
  Serial.println("Local history response is ready.");
}

void sendLocalHistory(AsyncWebServerRequest *request)
{
  if (!sdCardReady || localHistoryBuckets == nullptr) {
    sendLocalJsonResponse(request, 503, "{\"error\":\"SD card or history buffer is unavailable\"}");
    return;
  }

  time_t firstTimestamp;
  time_t lastTimestamp;
  uint32_t bucketDuration;
  if (!getLocalHistoryWindow(request, firstTimestamp, lastTimestamp, bucketDuration)) {
    sendLocalJsonResponse(request, 400, "{\"error\":\"Invalid history time range\"}");
    return;
  }

  bool responseReady = false;
  bool responseFailed = false;
  char errorMessage[sizeof(localHistoryError)]{};
  portENTER_CRITICAL(&localHistoryStateMux);
  if (localHistoryState == LocalHistoryState::Ready &&
      localHistoryFirstTimestamp == firstTimestamp && localHistoryLastTimestamp == lastTimestamp) {
    responseReady = true;
  } else if (localHistoryState == LocalHistoryState::Error) {
    responseFailed = true;
    strlcpy(errorMessage, localHistoryError, sizeof(errorMessage));
    localHistoryState = LocalHistoryState::Idle;
  } else if (localHistoryState == LocalHistoryState::Idle || localHistoryState == LocalHistoryState::Ready) {
    localHistoryFirstTimestamp = firstTimestamp;
    localHistoryLastTimestamp = lastTimestamp;
    localHistoryBucketDuration = bucketDuration;
    localHistoryError[0] = '\0';
    localHistoryState = LocalHistoryState::Queued;
  }
  portEXIT_CRITICAL(&localHistoryStateMux);

  if (responseFailed) {
    char jsonPayload[160];
    snprintf(jsonPayload, sizeof(jsonPayload), "{\"error\":\"%s\"}", errorMessage);
    sendLocalJsonResponse(request, 500, jsonPayload);
    return;
  }
  if (!responseReady) {
    sendLocalJsonResponse(request, 202, "{\"state\":\"preparing\"}");
    return;
  }

  localHistoryHavePriorityUntilMillis = millis() + LOCAL_HISTORY_PRIORITY_WINDOW_MS;
  AsyncWebServerResponse *response =
      request->beginResponse(SD, SD_HISTORY_RESPONSE_PATH, "application/json; charset=utf-8");
  if (response == nullptr) {
    sendLocalJsonResponse(request, 500, "{\"error\":\"History response could not be sent\"}");
    return;
  }
  response->addHeader("Cache-Control", "no-store");
  response->addHeader("Connection", "close");
  request->send(response);
}

void resetCloudSynchronization(AsyncWebServerRequest *request)
{
  if (cloudSyncPending || cloudHistoryReconciliationIsActive()) {
    sendLocalJsonResponse(request, 409, "{\"error\":\"Cloud synchronization is in progress\"}");
    return;
  }

  if (!startCloudHistoryReconciliation()) {
    sendLocalJsonResponse(request, 503, "{\"error\":\"SD card or daily synchronization index is unavailable\"}");
    return;
  }

  sendLocalJsonResponse(request, 202, "{\"state\":\"checking\"}");
}

void requestLocalHistoryDeletion(AsyncWebServerRequest *request)
{
  if (!sdCardReady) {
    sendLocalJsonResponse(request, 503, "{\"error\":\"SD card is unavailable\"}");
    return;
  }
  if (localHistoryDeletionQueued || historyDeletionQueued || cloudSyncPending ||
      cloudHistoryReconciliationIsActive()) {
    sendLocalJsonResponse(request, 409, "{\"error\":\"History operation is already in progress\"}");
    return;
  }

  localHistoryDeletionState = LocalHistoryDeletionState::Queued;
  localHistoryDeletionQueued = true;
  Serial.println("Local history deletion command queued.");
  sendLocalJsonResponse(request, 202, "{\"state\":\"queued\"}");
}

void serveMeasurementLog(AsyncWebServerRequest *request)
{
  if (!sdCardReady) {
    request->send(503, "text/plain", "SD card is unavailable.");
    return;
  }
  if (!SD.exists(SD_LOG_PATH)) {
    request->send(404, "text/plain", "Measurement log is unavailable.");
    return;
  }
  const bool inlineView = request->url() == "/measurements";
  request->send(SD, SD_LOG_PATH, inlineView ? "text/plain; charset=utf-8" : "text/csv; charset=utf-8",
                !inlineView);
}

void initializeLocalWebServer()
{
  if (!LittleFS.begin()) {
    Serial.println("LittleFS initialization failed. Upload web assets with 'pio run -t uploadfs'.");
  }

  localServer.on("/api/status", HTTP_GET, sendLocalStatus);
  localServer.on("/api/history", HTTP_GET, sendLocalHistory);
  localServer.on("/api/history", HTTP_DELETE, requestLocalHistoryDeletion);
  localServer.on("/api/sync/reset", HTTP_POST, resetCloudSynchronization);
  localServer.on("/api/sensors/load-cell/tare", HTTP_POST, requestLoadCellTare);
  localServer.on("/api/sensors/bme680/calibration", HTTP_POST, requestBme680Calibration);
  localServer.on("/api/time", HTTP_POST, requestTimeConfiguration);
  localServer.on("/api/wifi", HTTP_POST, saveWiFiConfiguration);
  localServer.on("/api/wifi", HTTP_DELETE, deleteWiFiConfiguration);
  localServer.on("/api/wifi/networks", HTTP_GET, sendAvailableWiFiNetworks);
  localServer.on("/measurements", HTTP_GET, serveMeasurementLog);
  localServer.on("/measurements.csv", HTTP_GET, serveMeasurementLog);
  localServer.on("/sd_card/api/list", HTTP_GET, sendSdCardDirectory);
  localServer.on("/sd_card/download", HTTP_GET, downloadSdCardFile);
  localServer.on("/sd_card/api/file", HTTP_DELETE, deleteSdCardFile);
  localServer.on("/sd_card/api/password", HTTP_POST, changeSdCardPassword);
  localServer.on("/sd_card/api/upload", HTTP_POST, finishSdCardUpload, handleSdCardUpload);
  // ESPAsyncWebServer ob izbiri handlerja uporabi prvo ujemanje predpone,
  // zato morajo biti specifične API poti dodane pred začetno `/sd_card` potjo.
  localServer.on("/sd_card.js", HTTP_GET, serveSdCardScript);
  localServer.on("/sd_card.html", HTTP_GET, serveSdCardPage);
  localServer.on("/sd_card/", HTTP_GET, serveSdCardPage);
  localServer.on("/sd_card", HTTP_GET, serveSdCardPage);
  localServer.onNotFound([](AsyncWebServerRequest *request) {
    // Tudi neposreden poskus dostopa do morebitne stisnjene ali neznane datoteke
    // pod `/sd_card` ne sme obiti zaščite namenskih poti raziskovalca.
    if (request->url().startsWith("/sd_card")) {
      if (!authenticateSdCardRequest(request)) return;
      request->send(404, "text/plain; charset=utf-8", "Not found");
      return;
    }
    if (!serveLocalAsset(request, request->url())) request->send(404, "text/plain", "Not found");
  });
  localServer.on("/", HTTP_GET, [](AsyncWebServerRequest *request) { serveLocalAsset(request, "/"); });
  initializeElegantOta();
  localServer.begin();
  const String dashboardIp = stationConnected ? WiFi.localIP().toString() : WiFi.softAPIP().toString();
  Serial.printf("Local dashboard: http://%s/\n", dashboardIp.c_str());
}

// --- Meritve ----------------------------------------------------------------

bool createMeasurement(Measurement &measurement)
{
  measurement = {};
  struct tm timeInfo;
  if (rtcReady) {
    verifyDs3231Connection();
  }

  // Vsako komponento preberemo posebej. Veljavna BME680 meritev in veljavna HX711
  // meritev se nato neodvisno zapišeta tudi, kadar druga komponenta odpove.
  measurement.bme680Valid = readBme680(measurement.temperatureC, measurement.humidityPercent);
  measurement.loadCellValid = readLoadCell(measurement.weightKg);
  if (!measurementHasSensorValue(measurement)) {
    return false;
  }
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
  char csvLine[192];
  if (!serializeMeasurementCsvLine(measurement, csvLine, sizeof(csvLine))) {
    logFile.close();
    Serial.println("Meritve ni bilo mogoče oblikovati za measurements.csv.");
    return false;
  }
  const size_t expectedBytes = strlen(csvLine);
  const size_t bytesWritten = logFile.print(csvLine);
  logFile.close();
  if (bytesWritten != expectedBytes) {
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

bool copyMeasurementCsvField(const char *&cursor, char *field, size_t fieldSize, bool lastField)
{
  if (cursor == nullptr || fieldSize == 0) {
    return false;
  }

  const char *separator = strchr(cursor, ',');
  if ((!lastField && separator == nullptr) || (lastField && separator != nullptr)) {
    return false;
  }

  const char *fieldEnd = separator == nullptr ? cursor + strlen(cursor) : separator;
  size_t fieldLength = static_cast<size_t>(fieldEnd - cursor);
  while (fieldLength > 0 && (cursor[fieldLength - 1] == '\r' || cursor[fieldLength - 1] == '\n')) {
    --fieldLength;
  }
  if (fieldLength >= fieldSize) {
    return false;
  }

  memcpy(field, cursor, fieldLength);
  field[fieldLength] = '\0';
  cursor = separator == nullptr ? nullptr : separator + 1;
  return true;
}

bool parseOptionalCsvMeasurementValue(const char *field, float &value, bool &valid)
{
  valid = false;
  value = 0.0F;
  if (field[0] == '\0') {
    return true;
  }

  char *end = nullptr;
  const float parsedValue = strtof(field, &end);
  if (end == field || *end != '\0' || !isfinite(parsedValue)) {
    return false;
  }

  value = parsedValue;
  valid = true;
  return true;
}

bool parseMeasurementCsvLine(const char *line, Measurement &measurement)
{
  measurement = {};
  char timestampField[16];
  char temperatureField[32];
  char humidityField[32];
  char weightField[32];
  const char *cursor = line;
  if (!copyMeasurementCsvField(cursor, measurement.date, sizeof(measurement.date), false) ||
      !copyMeasurementCsvField(cursor, measurement.time, sizeof(measurement.time), false) ||
      !copyMeasurementCsvField(cursor, timestampField, sizeof(timestampField), false) ||
      !copyMeasurementCsvField(cursor, temperatureField, sizeof(temperatureField), false) ||
      !copyMeasurementCsvField(cursor, humidityField, sizeof(humidityField), false) ||
      !copyMeasurementCsvField(cursor, weightField, sizeof(weightField), true) ||
      measurement.date[0] == '\0' || measurement.time[0] == '\0') {
    return false;
  }

  char *timestampEnd = nullptr;
  const unsigned long timestamp = strtoul(timestampField, &timestampEnd, 10);
  if (timestampEnd == timestampField || *timestampEnd != '\0' ||
      timestamp < static_cast<unsigned long>(MIN_VALID_UNIX_TIMESTAMP)) {
    return false;
  }

  bool temperatureValid = false;
  bool humidityValid = false;
  if (!parseOptionalCsvMeasurementValue(temperatureField, measurement.temperatureC, temperatureValid) ||
      !parseOptionalCsvMeasurementValue(humidityField, measurement.humidityPercent, humidityValid) ||
      !parseOptionalCsvMeasurementValue(weightField, measurement.weightKg, measurement.loadCellValid) ||
      temperatureValid != humidityValid) {
    return false;
  }

  measurement.bme680Valid = temperatureValid;
  measurement.timestamp = static_cast<time_t>(timestamp);
  return measurementHasSensorValue(measurement);
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

bool recoverStalledCloudSynchronization()
{
  if (!cloudSyncPending) {
    return false;
  }

  const size_t taskCount = asyncClient.taskCount();
  const uint32_t requestAgeMillis = cloudSyncRequestStartedMillis == 0
                                        ? 0
                                        : millis() - cloudSyncRequestStartedMillis;
  const bool requestMissing = taskCount == 0 &&
                              requestAgeMillis >= CLOUD_SYNC_REQUEST_MISSING_GRACE_MS;
  const bool requestTimedOut = requestAgeMillis >= CLOUD_SYNC_REQUEST_TIMEOUT_MS;
  if (!requestMissing && !requestTimedOut) {
    return false;
  }

  if (requestMissing) {
    Serial.println("Cloud sync request disappeared from the Firebase queue; retrying.");
  } else {
    Serial.println("Cloud sync request timed out; closing the Firebase connection before retrying.");
    pauseFirebaseRequestsAfterNetworkError(-1);
    cancelPendingFirebaseTasks("cloud synchronization timeout");
  }

  markCloudSyncFailure();
  return true;
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
  const time_t synchronizedHour =
      lastCloudSyncedTimestamp - (lastCloudSyncedTimestamp % HOURLY_AGGREGATE_SECONDS);
  const time_t synchronizedDay = historyIndexDay(lastCloudSyncedTimestamp);

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
      const time_t measurementHour =
          measurement.timestamp - (measurement.timestamp % HOURLY_AGGREGATE_SECONDS);
      if (measurementHour == synchronizedHour) {
        addMeasurementToCloudAggregate(hourlyCloudAggregate, readyHourlyCloudAggregate,
                                       hourlyAggregateReady, measurement,
                                       HOURLY_AGGREGATE_SECONDS, false);
      }
      if (historyIndexDay(measurement.timestamp) == synchronizedDay) {
        addMeasurementToCloudAggregate(dailyCloudAggregate, readyDailyCloudAggregate,
                                       dailyAggregateReady, measurement,
                                       DAILY_AGGREGATE_SECONDS, false);
      }
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
  char jsonPayload[256];
  serializeMeasurementJson(measurement, jsonPayload, sizeof(jsonPayload));
  object_t measurements(jsonPayload);

  char historyPath[96];
  snprintf(historyPath, sizeof(historyPath), "%s/%lu", historyDatabasePath,
           static_cast<unsigned long>(measurement.timestamp));

  cloudSyncPendingMeasurement = measurement;
  cloudSyncPendingFileOffset = nextFileOffset;
  cloudSyncPending = true;
  cloudSyncRequestStartedMillis = millis();
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

  char jsonPayload[512];
  serializeMeasurementAggregateJson(aggregate,
                                    requestType == CloudSyncRequestType::ReconciliationDailyAggregate,
                                    periodSeconds, jsonPayload, sizeof(jsonPayload));
  object_t aggregateData(jsonPayload);

  char aggregatePath[DATABASE_PATH_LENGTH];
  snprintf(aggregatePath, sizeof(aggregatePath), "%s/%lu", databasePath,
           static_cast<unsigned long>(aggregate.timestamp));
  cloudSyncPendingAggregate = aggregate;
  cloudSyncPending = true;
  cloudSyncRequestStartedMillis = millis();
  cloudSyncRequestType = requestType;
  // PATCH ohrani oznako uspešno preverjene surove zgodovine tudi ob poznejši
  // osvežitvi tekočega urnega ali dnevnega agregata.
  database.update(asyncClient, aggregatePath, aggregateData, processData, requestId);
}

bool extractJsonUnsignedValue(const String &json, const char *key, uint32_t &value)
{
  const String keyPrefix = String('"') + key + "\":";
  const int keyPosition = json.indexOf(keyPrefix);
  if (keyPosition < 0) {
    return false;
  }

  const char *valueStart = json.c_str() + keyPosition + keyPrefix.length();
  char *valueEnd = nullptr;
  const unsigned long parsedValue = strtoul(valueStart, &valueEnd, 10);
  if (valueEnd == valueStart) {
    return false;
  }
  value = static_cast<uint32_t>(parsedValue);
  return true;
}

void resetCloudHistoryReconciliation()
{
  if (dailyReconciliationLogFile) {
    dailyReconciliationLogFile.close();
  }
  dailyReconciliationManifestCount = 0;
  remoteDailyReconciliationManifestCount = 0;
  dailyReconciliationCurrentIndex = 0;
  dailyReconciliationDaysToTransfer = 0;
  dailyReconciliationDaysCompleted = 0;
  dailyReconciliationMeasurementsToTransfer = 0;
  dailyReconciliationMeasurementsUploaded = 0;
  dailyReconciliationFileOffset = 0;
  dailyReconciliationPendingFileOffset = 0;
  dailyReconciliationDayStartOffset = 0;
  dailyReconciliationSnapshotFileSize = 0;
  dailyReconciliationSnapshotLastTimestamp = 0;
  dailyReconciliationDayStarted = false;
  dailyReconciliationDayRawComplete = false;
  dailyReconciliationPendingCompletesDay = false;
  reconciliationHourlyAggregateReady = false;
  dailyReconciliationPrefixMeasurementsRead = 0;
  dailyReconciliationPrefixChecksum = 0;
  reconciliationPendingMeasurementCount = 0;
  reconciliationHourlyAggregate = {};
  readyReconciliationHourlyAggregate = {};
}

bool addDailyReconciliationMeasurement(const Measurement &measurement, uint32_t fileOffset,
                                       uint32_t fileEndOffset)
{
  const time_t dayTimestamp = historyIndexDay(measurement.timestamp);
  DailyReconciliationManifest *manifest = nullptr;
  for (uint16_t index = dailyReconciliationManifestCount; index > 0; --index) {
    DailyReconciliationManifest &candidate = dailyReconciliationManifests[index - 1];
    if (candidate.aggregate.timestamp == dayTimestamp) {
      manifest = &candidate;
      break;
    }
  }

  if (manifest == nullptr) {
    if (dailyReconciliationManifestCount >= MAX_DAILY_RECONCILIATION_DAYS) {
      Serial.println("Daily cloud synchronization index reached its maximum size.");
      return false;
    }
    manifest = &dailyReconciliationManifests[dailyReconciliationManifestCount++];
    *manifest = {};
    manifest->aggregate.timestamp = dayTimestamp;
    manifest->firstFileOffset = fileOffset;
  }

  manifest->lastFileEndOffset = fileEndOffset;
  if (measurement.bme680Valid) {
    manifest->aggregate.temperatureSum += measurement.temperatureC;
    manifest->aggregate.humiditySum += measurement.humidityPercent;
    ++manifest->aggregate.temperatureCount;
    ++manifest->aggregate.humidityCount;
  }
  if (measurement.loadCellValid) {
    manifest->aggregate.weightSum += measurement.weightKg;
    ++manifest->aggregate.weightCount;
  }
  ++manifest->aggregate.count;
  manifest->aggregate.syncChecksum = updateMeasurementChecksum(manifest->aggregate.syncChecksum, measurement);
  return true;
}

bool startCloudHistoryReconciliation()
{
  if (!sdCardReady || !dailyReconciliationManifests || !remoteDailyReconciliationManifests) {
    return false;
  }
  if (!historyIndexReady && !initializeMeasurementHistoryIndex()) {
    return false;
  }

  resetCloudHistoryReconciliation();
  File logFile = SD.open(SD_LOG_PATH, FILE_READ);
  if (!logFile) {
    Serial.println("Cloud history reconciliation: SD log could not be opened.");
    return false;
  }
  dailyReconciliationSnapshotFileSize = static_cast<uint32_t>(logFile.size());
  logFile.close();
  cloudReconciliationState = CloudReconciliationState::BuildingLocalIndex;
  cloudSyncCaughtUp = false;
  requestDeviceStatusUpdate();
  Serial.printf("Cloud history reconciliation: building a local index from %lu bytes.\n",
                static_cast<unsigned long>(dailyReconciliationSnapshotFileSize));
  return true;
}

bool parseRemoteDailyReconciliationIndex(const String &payload)
{
  remoteDailyReconciliationManifestCount = 0;
  if (payload == "null" || payload.length() == 0) {
    return true;
  }

  int cursor = 0;
  while (cursor >= 0 && cursor < payload.length()) {
    const int keyStart = payload.indexOf('"', cursor);
    if (keyStart < 0) break;
    const int keyEnd = payload.indexOf('"', keyStart + 1);
    if (keyEnd < 0) return false;
    const int valueStart = payload.indexOf('{', keyEnd + 1);
    if (valueStart < 0) return false;
    const int valueEnd = payload.indexOf('}', valueStart + 1);
    if (valueEnd < 0) return false;

    const String key = payload.substring(keyStart + 1, keyEnd);
    char *keyEndPointer = nullptr;
    const unsigned long keyTimestamp = strtoul(key.c_str(), &keyEndPointer, 10);
    if (keyEndPointer != key.c_str() && *keyEndPointer == '\0') {
      const String aggregateJson = payload.substring(valueStart, valueEnd + 1);
      uint32_t timestamp = 0;
      uint32_t sampleCount = 0;
      uint32_t syncChecksum = 0;
      uint32_t rawSyncVersion = 0;
      if (!extractJsonUnsignedValue(aggregateJson, "timestamp", timestamp) ||
          !extractJsonUnsignedValue(aggregateJson, "sample_count", sampleCount)) {
        return false;
      }
      if (remoteDailyReconciliationManifestCount >= MAX_DAILY_RECONCILIATION_DAYS ||
          timestamp != keyTimestamp || sampleCount > UINT16_MAX) {
        return false;
      }
      RemoteDailyReconciliationManifest &remoteManifest =
          remoteDailyReconciliationManifests[remoteDailyReconciliationManifestCount++];
      remoteManifest.timestamp = static_cast<time_t>(timestamp);
      remoteManifest.sampleCount = static_cast<uint16_t>(sampleCount);
      remoteManifest.hasSyncChecksum = extractJsonUnsignedValue(aggregateJson, "sync_checksum", syncChecksum);
      remoteManifest.syncChecksum = syncChecksum;
      remoteManifest.rawSyncVersion =
          extractJsonUnsignedValue(aggregateJson, "raw_sync_version", rawSyncVersion) &&
                  rawSyncVersion <= UINT8_MAX
              ? static_cast<uint8_t>(rawSyncVersion)
              : 0;
      if (remoteManifest.rawSyncVersion >= DAILY_RAW_SYNC_VERSION) {
        uint32_t rawSampleCount = 0;
        String rawSyncChecksum;
        char *checksumEnd = nullptr;
        if (!extractJsonUnsignedValue(aggregateJson, "raw_sample_count", rawSampleCount) ||
            rawSampleCount > UINT16_MAX ||
            !extractJsonString(aggregateJson, "raw_sync_checksum", rawSyncChecksum)) {
          remoteManifest.rawSyncVersion = 0;
          remoteManifest.hasSyncChecksum = false;
        } else {
          const unsigned long parsedChecksum = strtoul(rawSyncChecksum.c_str(), &checksumEnd, 10);
          if (checksumEnd == rawSyncChecksum.c_str() || *checksumEnd != '\0') {
            remoteManifest.rawSyncVersion = 0;
            remoteManifest.hasSyncChecksum = false;
          } else {
            remoteManifest.sampleCount = static_cast<uint16_t>(rawSampleCount);
            remoteManifest.syncChecksum = static_cast<uint32_t>(parsedChecksum);
            remoteManifest.hasSyncChecksum = true;
          }
        }
      }
    }
    cursor = valueEnd + 1;
  }
  return true;
}

const RemoteDailyReconciliationManifest *findRemoteDailyReconciliationManifest(time_t timestamp)
{
  for (uint16_t index = 0; index < remoteDailyReconciliationManifestCount; ++index) {
    const RemoteDailyReconciliationManifest &manifest = remoteDailyReconciliationManifests[index];
    if (manifest.timestamp == timestamp) {
      return &manifest;
    }
  }
  return nullptr;
}

bool processCloudHistoryReconciliationIndex(const String &payload)
{
  if (!parseRemoteDailyReconciliationIndex(payload)) {
    Serial.println("Cloud history reconciliation: daily Firebase index could not be parsed.");
    return false;
  }

  dailyReconciliationDaysToTransfer = 0;
  dailyReconciliationMeasurementsToTransfer = 0;
  dailyReconciliationDaysCompleted = 0;
  dailyReconciliationCurrentIndex = 0;
  for (uint16_t index = 0; index < dailyReconciliationManifestCount; ++index) {
    DailyReconciliationManifest &localManifest = dailyReconciliationManifests[index];
    const RemoteDailyReconciliationManifest *remoteManifest =
        findRemoteDailyReconciliationManifest(localManifest.aggregate.timestamp);
    localManifest.cloudPrefixSampleCount = 0;
    localManifest.cloudPrefixChecksum = 0;
    const bool remoteRawHistoryVerified = remoteManifest != nullptr &&
                                          remoteManifest->rawSyncVersion >= DAILY_RAW_SYNC_VERSION;
    localManifest.measurementsNeedSync = remoteManifest == nullptr ||
                                         !remoteRawHistoryVerified ||
                                         remoteManifest->sampleCount != localManifest.aggregate.count ||
                                         (remoteManifest->hasSyncChecksum &&
                                          remoteManifest->syncChecksum != localManifest.aggregate.syncChecksum);
    // Dnevni agregat brez oznake potrjene surove zgodovine se enkrat obnovi v celoti.
    // Tako popravimo tudi morebitni manjkajoči zadnji paket iz starejše izdaje.
    localManifest.aggregateNeedsUpdate = localManifest.measurementsNeedSync ||
                                        (remoteManifest != nullptr && !remoteManifest->hasSyncChecksum);
    if (localManifest.measurementsNeedSync) {
      ++dailyReconciliationDaysToTransfer;
      if (remoteRawHistoryVerified && remoteManifest->hasSyncChecksum &&
          remoteManifest->sampleCount < localManifest.aggregate.count) {
        // Cloud agregat lahko pri tekočem dnevu zaostaja. Njegovo kontrolno vsoto
        // najprej primerjamo z enako dolgo predpono SD dnevnika in nato pošljemo le rep.
        localManifest.cloudPrefixSampleCount = remoteManifest->sampleCount;
        localManifest.cloudPrefixChecksum = remoteManifest->syncChecksum;
        dailyReconciliationMeasurementsToTransfer +=
            localManifest.aggregate.count - remoteManifest->sampleCount;
      } else {
        dailyReconciliationMeasurementsToTransfer += localManifest.aggregate.count;
      }
    }
  }

  cloudReconciliationState = CloudReconciliationState::ReconcilingDays;
  Serial.printf("Cloud history reconciliation: %u local days, %u days and %lu measurements require recovery.\n",
                dailyReconciliationManifestCount, dailyReconciliationDaysToTransfer,
                static_cast<unsigned long>(dailyReconciliationMeasurementsToTransfer));
  return true;
}

bool readNextReconciliationMeasurementBatch(DailyReconciliationManifest &manifest,
                                             uint32_t &nextFileOffset, bool &dayFinished)
{
  dayFinished = false;
  reconciliationPendingMeasurementCount = 0;
  nextFileOffset = dailyReconciliationFileOffset;
  File logFile = SD.open(SD_LOG_PATH, FILE_READ);
  if (!logFile || !logFile.seek(dailyReconciliationFileOffset)) {
    if (logFile) logFile.close();
    Serial.println("Cloud history reconciliation: SD log could not be read.");
    return false;
  }

  const time_t dayEndTimestamp = manifest.aggregate.timestamp + DAILY_AGGREGATE_SECONDS;
  const uint32_t dayReadEndOffset = min(manifest.lastFileEndOffset,
                                        dailyReconciliationSnapshotFileSize);
  const uint32_t startedMillis = millis();
  uint16_t processedLines = 0;
  char line[128];
  while (logFile.available() &&
         logFile.position() < dayReadEndOffset &&
         reconciliationPendingMeasurementCount < RECONCILIATION_MEASUREMENTS_PER_REQUEST &&
         processedLines < DAILY_RECONCILIATION_LINES_PER_LOOP &&
         (reconciliationPendingMeasurementCount > 0 ||
          millis() - startedMillis < DAILY_RECONCILIATION_LOOP_BUDGET_MS)) {
    const size_t lineLength = logFile.readBytesUntil('\n', line, sizeof(line) - 1);
    line[lineLength] = '\0';
    const uint32_t lineEndOffset = static_cast<uint32_t>(logFile.position());
    ++processedLines;
    Measurement parsedMeasurement{};
    if (!parseMeasurementCsvLine(line, parsedMeasurement)) {
      nextFileOffset = lineEndOffset;
      if (reconciliationPendingMeasurementCount == 0) {
        dailyReconciliationFileOffset = lineEndOffset;
      }
      continue;
    }
    if (parsedMeasurement.timestamp < manifest.aggregate.timestamp ||
        parsedMeasurement.timestamp >= dayEndTimestamp) {
      nextFileOffset = lineEndOffset;
      if (reconciliationPendingMeasurementCount == 0) {
        dailyReconciliationFileOffset = lineEndOffset;
      }
      continue;
    }

    if (dailyReconciliationPrefixMeasurementsRead < manifest.cloudPrefixSampleCount) {
      dailyReconciliationPrefixChecksum =
          updateMeasurementChecksum(dailyReconciliationPrefixChecksum, parsedMeasurement);
      addMeasurementToCloudAggregate(reconciliationHourlyAggregate, readyReconciliationHourlyAggregate,
                                     reconciliationHourlyAggregateReady, parsedMeasurement,
                                     HOURLY_AGGREGATE_SECONDS, true);
      ++dailyReconciliationPrefixMeasurementsRead;
      dailyReconciliationFileOffset = lineEndOffset;
      nextFileOffset = lineEndOffset;

      if (dailyReconciliationPrefixMeasurementsRead == manifest.cloudPrefixSampleCount) {
        if (dailyReconciliationPrefixChecksum != manifest.cloudPrefixChecksum) {
          const uint16_t invalidPrefixCount = manifest.cloudPrefixSampleCount;
          manifest.cloudPrefixSampleCount = 0;
          manifest.cloudPrefixChecksum = 0;
          dailyReconciliationMeasurementsToTransfer += invalidPrefixCount;
          dailyReconciliationFileOffset = dailyReconciliationDayStartOffset;
          nextFileOffset = dailyReconciliationDayStartOffset;
          dailyReconciliationPrefixMeasurementsRead = 0;
          dailyReconciliationPrefixChecksum = 0;
          reconciliationHourlyAggregate = {};
          readyReconciliationHourlyAggregate = {};
          reconciliationHourlyAggregateReady = false;
          Serial.printf("Cloud history reconciliation: cloud prefix mismatch; recovering all %u daily measurements.\n",
                        manifest.aggregate.count);
          logFile.close();
          return true;
        }
        Serial.printf("Cloud history reconciliation: verified %u existing measurements; uploading %u trailing measurements.\n",
                      manifest.cloudPrefixSampleCount,
                      manifest.aggregate.count - manifest.cloudPrefixSampleCount);
      }
      if (reconciliationHourlyAggregateReady) {
        logFile.close();
        return true;
      }
      continue;
    }

    reconciliationPendingMeasurements[reconciliationPendingMeasurementCount++] = parsedMeasurement;
    nextFileOffset = lineEndOffset;
  }

  if (!logFile.available() || logFile.position() >= dayReadEndOffset) {
    dayFinished = true;
  }
  logFile.close();
  return true;
}

void queueReconciliationMeasurementBatch(uint32_t nextFileOffset, bool completesDay)
{
  String jsonPayload;
  jsonPayload.reserve(reconciliationPendingMeasurementCount * 176U + 2U);
  jsonPayload = '{';
  for (uint8_t index = 0; index < reconciliationPendingMeasurementCount; ++index) {
    const Measurement &measurement = reconciliationPendingMeasurements[index];
    char measurementJson[256];
    char keyPrefix[24];
    serializeMeasurementJson(measurement, measurementJson, sizeof(measurementJson));
    snprintf(keyPrefix, sizeof(keyPrefix), "%s\"%lu\":", index == 0 ? "" : ",",
             static_cast<unsigned long>(measurement.timestamp));
    jsonPayload += keyPrefix;
    jsonPayload += measurementJson;
  }
  jsonPayload += '}';
  object_t measurementsData(jsonPayload);

  cloudSyncPendingMeasurement = reconciliationPendingMeasurements[reconciliationPendingMeasurementCount - 1];
  dailyReconciliationPendingFileOffset = nextFileOffset;
  dailyReconciliationPendingCompletesDay = completesDay;
  cloudSyncPending = true;
  cloudSyncRequestStartedMillis = millis();
  cloudSyncRequestType = CloudSyncRequestType::ReconciliationMeasurement;
  Serial.printf("Cloud history reconciliation: uploading %u measurements (%lu/%lu).\n",
                reconciliationPendingMeasurementCount,
                static_cast<unsigned long>(dailyReconciliationMeasurementsUploaded),
                static_cast<unsigned long>(dailyReconciliationMeasurementsToTransfer));
  database.update(asyncClient, historyDatabasePath, measurementsData, processData,
                  "syncReconciliationMeasurement");
}

void completeCurrentReconciliationDay()
{
  DailyReconciliationManifest &manifest = dailyReconciliationManifests[dailyReconciliationCurrentIndex];
  manifest.measurementsNeedSync = false;
  manifest.aggregateNeedsUpdate = false;
  ++dailyReconciliationDaysCompleted;
  ++dailyReconciliationCurrentIndex;
  dailyReconciliationDayStarted = false;
  dailyReconciliationDayRawComplete = false;
  dailyReconciliationPendingCompletesDay = false;
  dailyReconciliationFileOffset = 0;
  dailyReconciliationPendingFileOffset = 0;
  dailyReconciliationDayStartOffset = 0;
  dailyReconciliationPrefixMeasurementsRead = 0;
  dailyReconciliationPrefixChecksum = 0;
  reconciliationPendingMeasurementCount = 0;
  reconciliationHourlyAggregate = {};
  readyReconciliationHourlyAggregate = {};
  reconciliationHourlyAggregateReady = false;
}

void completeCloudHistoryReconciliationRequest(CloudSyncRequestType requestType)
{
  if (cloudReconciliationState != CloudReconciliationState::ReconcilingDays ||
      dailyReconciliationCurrentIndex >= dailyReconciliationManifestCount) {
    return;
  }

  if (requestType == CloudSyncRequestType::ReconciliationMeasurement) {
    const bool completedDay = dailyReconciliationPendingCompletesDay;
    dailyReconciliationFileOffset = dailyReconciliationPendingFileOffset;
    for (uint8_t index = 0; index < reconciliationPendingMeasurementCount; ++index) {
      addMeasurementToCloudAggregate(reconciliationHourlyAggregate, readyReconciliationHourlyAggregate,
                                     reconciliationHourlyAggregateReady,
                                     reconciliationPendingMeasurements[index],
                                     HOURLY_AGGREGATE_SECONDS, true);
    }
    dailyReconciliationMeasurementsUploaded += reconciliationPendingMeasurementCount;
    reconciliationPendingMeasurementCount = 0;
    dailyReconciliationPendingCompletesDay = false;
    if (completedDay) {
      dailyReconciliationDayRawComplete = true;
    }
  } else if (requestType == CloudSyncRequestType::ReconciliationHourlyAggregate) {
    reconciliationHourlyAggregateReady = false;
  } else if (requestType == CloudSyncRequestType::ReconciliationDailyAggregate) {
    completeCurrentReconciliationDay();
  }
}

void processCloudHistoryReconciliation()
{
  if (cloudReconciliationState == CloudReconciliationState::Idle ||
      cloudReconciliationState == CloudReconciliationState::Completed ||
      cloudReconciliationState == CloudReconciliationState::Error) {
    return;
  }

  if (!sdCardReady) {
    if (dailyReconciliationLogFile) dailyReconciliationLogFile.close();
    markCloudHistoryReconciliationError();
    Serial.println("Cloud history reconciliation stopped because the SD card is unavailable.");
    return;
  }

  if (cloudReconciliationState == CloudReconciliationState::BuildingLocalIndex) {
    if (!dailyReconciliationLogFile) {
      dailyReconciliationLogFile = SD.open(SD_LOG_PATH, FILE_READ);
      if (!dailyReconciliationLogFile) {
        markCloudHistoryReconciliationError();
        Serial.println("Cloud history reconciliation: SD log could not be opened.");
        return;
      }
    }

    const uint32_t startedMillis = millis();
    uint16_t processedLines = 0;
    char line[128];
    while (dailyReconciliationLogFile.available() &&
           dailyReconciliationLogFile.position() < dailyReconciliationSnapshotFileSize &&
           processedLines < DAILY_RECONCILIATION_LINES_PER_LOOP &&
           millis() - startedMillis < DAILY_RECONCILIATION_LOOP_BUDGET_MS) {
      const uint32_t lineOffset = static_cast<uint32_t>(dailyReconciliationLogFile.position());
      const size_t lineLength = dailyReconciliationLogFile.readBytesUntil('\n', line, sizeof(line) - 1);
      line[lineLength] = '\0';
      const uint32_t lineEndOffset = static_cast<uint32_t>(dailyReconciliationLogFile.position());
      Measurement measurement{};
      if (parseMeasurementCsvLine(line, measurement)) {
        if (!addDailyReconciliationMeasurement(measurement, lineOffset, lineEndOffset)) {
          dailyReconciliationLogFile.close();
          markCloudHistoryReconciliationError();
          return;
        }
        dailyReconciliationSnapshotLastTimestamp = measurement.timestamp;
      }
      ++processedLines;
    }

    if (!dailyReconciliationLogFile.available() ||
        dailyReconciliationLogFile.position() >= dailyReconciliationSnapshotFileSize) {
      dailyReconciliationLogFile.close();
      cloudReconciliationState = CloudReconciliationState::ReadingCloudIndex;
      Serial.printf("Cloud history reconciliation: local index contains %u days.\n",
                    dailyReconciliationManifestCount);
    }
    return;
  }

  if (cloudReconciliationState == CloudReconciliationState::ReadingCloudIndex) {
    if (cloudSyncPending || !isFirebaseReady()) {
      return;
    }
    if (millis() - lastCloudSyncAttemptMillis < cloudSyncRetryIntervalMs) {
      return;
    }
    lastCloudSyncAttemptMillis = millis();
    cloudSyncPending = true;
    cloudSyncRequestStartedMillis = millis();
    cloudSyncRequestType = CloudSyncRequestType::DailyReconciliationIndex;
    database.get(asyncClient, dailyAggregateDatabasePath, processData, false, "readDailyCloudIndex");
    return;
  }

  if (cloudReconciliationState != CloudReconciliationState::ReconcilingDays || cloudSyncPending ||
      !isFirebaseReady()) {
    return;
  }
  const uint32_t reconciliationRequestInterval = cloudSyncRetryIntervalMs > CLOUD_SYNC_INTERVAL_MS
                                                     ? cloudSyncRetryIntervalMs
                                                     : CLOUD_RECONCILIATION_INTERVAL_MS;
  if (millis() - lastCloudSyncAttemptMillis < reconciliationRequestInterval) {
    return;
  }

  while (dailyReconciliationCurrentIndex < dailyReconciliationManifestCount) {
    DailyReconciliationManifest &manifest = dailyReconciliationManifests[dailyReconciliationCurrentIndex];
    if (!manifest.measurementsNeedSync && !manifest.aggregateNeedsUpdate) {
      ++dailyReconciliationDaysCompleted;
      ++dailyReconciliationCurrentIndex;
      continue;
    }

    if (!manifest.measurementsNeedSync) {
      lastCloudSyncAttemptMillis = millis();
      queueCloudAggregate(manifest.aggregate, dailyAggregateDatabasePath,
                          CloudSyncRequestType::ReconciliationDailyAggregate,
                          "syncReconciliationDailyAggregate", DAILY_AGGREGATE_SECONDS);
      return;
    }

    if (!dailyReconciliationDayStarted) {
      dailyReconciliationFileOffset = manifest.firstFileOffset;
      dailyReconciliationDayStartOffset = dailyReconciliationFileOffset;
      dailyReconciliationDayStarted = true;
      dailyReconciliationDayRawComplete = false;
      dailyReconciliationPendingCompletesDay = false;
      dailyReconciliationPrefixMeasurementsRead = 0;
      dailyReconciliationPrefixChecksum = 0;
      reconciliationHourlyAggregate = {};
      readyReconciliationHourlyAggregate = {};
      reconciliationHourlyAggregateReady = false;
    }

    if (reconciliationHourlyAggregateReady) {
      lastCloudSyncAttemptMillis = millis();
      queueCloudAggregate(readyReconciliationHourlyAggregate, hourlyAggregateDatabasePath,
                          CloudSyncRequestType::ReconciliationHourlyAggregate,
                          "syncReconciliationHourlyAggregate", HOURLY_AGGREGATE_SECONDS);
      return;
    }

    if (dailyReconciliationDayRawComplete) {
      if (reconciliationHourlyAggregate.count > 0) {
        readyReconciliationHourlyAggregate = reconciliationHourlyAggregate;
        reconciliationHourlyAggregate = {};
        reconciliationHourlyAggregateReady = true;
        continue;
      }
      lastCloudSyncAttemptMillis = millis();
      queueCloudAggregate(manifest.aggregate, dailyAggregateDatabasePath,
                          CloudSyncRequestType::ReconciliationDailyAggregate,
                          "syncReconciliationDailyAggregate", DAILY_AGGREGATE_SECONDS);
      return;
    }

    uint32_t nextFileOffset = dailyReconciliationFileOffset;
    bool dayFinished = false;
    if (!readNextReconciliationMeasurementBatch(manifest, nextFileOffset, dayFinished)) {
      markCloudHistoryReconciliationError();
      return;
    }
    if (reconciliationPendingMeasurementCount == 0) {
      if (dayFinished) {
        dailyReconciliationDayRawComplete = true;
        continue;
      }
      return;
    }
    lastCloudSyncAttemptMillis = millis();
    queueReconciliationMeasurementBatch(nextFileOffset, dayFinished);
    return;
  }

  const uint32_t previousCloudSyncFileOffset = cloudSyncFileOffset;
  const time_t previousCloudSyncedTimestamp = lastCloudSyncedTimestamp;
  cloudSyncFileOffset = dailyReconciliationSnapshotFileSize;
  cloudSyncPendingFileOffset = dailyReconciliationSnapshotFileSize;
  lastCloudSyncedTimestamp = dailyReconciliationSnapshotLastTimestamp;
  cloudSyncWritesSincePersist = 0;
  cloudSyncStateSavePending = false;
  if (!persistCloudSyncState()) {
    cloudSyncFileOffset = previousCloudSyncFileOffset;
    cloudSyncPendingFileOffset = previousCloudSyncFileOffset;
    lastCloudSyncedTimestamp = previousCloudSyncedTimestamp;
    markCloudHistoryReconciliationError();
    Serial.println("Cloud history reconciliation: verified sync position could not be saved.");
    return;
  }

  File logFile = SD.open(SD_LOG_PATH, FILE_READ);
  const bool newMeasurementsWereAdded = logFile &&
                                         logFile.size() > dailyReconciliationSnapshotFileSize;
  if (logFile) logFile.close();
  rebuildCloudAggregateState();
  cloudReconciliationState = CloudReconciliationState::Completed;
  lastDailyReconciliationTimestamp = time(nullptr);
  cloudSyncCaughtUp = !newMeasurementsWereAdded;
  lastCloudSyncAttemptMillis = 0;
  requestDeviceStatusUpdate();
  Serial.printf("Cloud history reconciliation completed: checked %u days, recovered %u days%s.\n",
                dailyReconciliationDaysCompleted, dailyReconciliationDaysToTransfer,
                newMeasurementsWereAdded ? "; new SD records remain for normal sync" : "");
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
  if (cloudHistoryReconciliationIsActive()) {
    return;
  }

  if (recoverStalledCloudSynchronization()) {
    return;
  }

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

bool publishActivationSecret()
{
  if (activationSecretPublishInFlight || !isFirebaseReady()) return false;

  char jsonPayload[64];
  snprintf(jsonPayload, sizeof(jsonPayload), "{\"activation_code\":\"%s\"}", activationCode);
  object_t activationSecret(jsonPayload);
  database.set(asyncClient, activationSecretDatabasePath, activationSecret, processData,
               "publishActivationSecret");
  activationSecretPublishInFlight = true;
  activationSecretPublishPending = false;
  lastActivationSecretAttemptMillis = millis();
  return true;
}

bool queueSDCardStatusUpdate()
{
  if (sdCardStatusCloudInFlight || !isFirebaseReady()) return false;

  const bool hasError = sdInitializationFailures >= MAX_SD_INITIALIZATION_FAILURES;
  char jsonPayload[96];
  snprintf(jsonPayload, sizeof(jsonPayload),
           "{\"present\":%s,\"initialization_failures\":%u,\"error\":%s}",
           sdCardReady ? "true" : "false", sdInitializationFailures,
           hasError ? "true" : "false");
  object_t sdStatus(jsonPayload);

  // Snapshot shranimo pred pošiljanjem; kot objavljen ostane označen šele v uspešnem callbacku.
  sdCardStatusCloudInFlightPresent = sdCardReady;
  sdCardStatusCloudInFlightInitializationFailures = sdInitializationFailures;
  sdCardStatusCloudInFlightError = hasError;
  database.set(asyncClient, sdStatusDatabasePath, sdStatus, processData, "updateSDCardStatus");
  sdCardStatusCloudInFlight = true;
  sdCardStatusCloudPending = false;
  sdCardStatusCloudDirtyDuringFlight = false;
  lastSDStatusCloudAttemptMillis = millis();
  return true;
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

  const bool statusChanged = !sdCardStatusCloudPublished ||
                             sdCardStatusCloudPublishedPresent != sdCardReady ||
                             sdCardStatusCloudPublishedInitializationFailures != sdInitializationFailures ||
                             sdCardStatusCloudPublishedError != hasError;
  if (statusChanged) {
    requestSDCardStatusUpdate();
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

bool updateDeviceHeartbeat()
{
  if (deviceHeartbeatInFlight || !isFirebaseReady()) return false;

  // Firebase strežniški čas je neodvisen od RTC/NTP in je zato edina avtoriteta za cloud online stanje.
  char jsonPayload[160];
  snprintf(jsonPayload, sizeof(jsonPayload),
           "{\"last_seen_server_ms\":{\".sv\":\"timestamp\"},\"wifi_rssi_dbm\":%d}",
           WiFi.RSSI());
  object_t heartbeat(jsonPayload);
  database.update(asyncClient, deviceStatusDatabasePath, heartbeat, processData,
                  "updateDeviceHeartbeat");
  deviceHeartbeatInFlight = true;
  lastDeviceHeartbeatAttemptMillis = millis();
  return true;
}

bool updateDeviceStatus()
{
  if (deviceStatusInFlight || !isFirebaseReady()) return false;

  // esp_timer uporablja 64-bitni števec mikrosekund in se ne prelije kot millis().
  const uint64_t uptimeAnchorSeconds = static_cast<uint64_t>(esp_timer_get_time()) / 1000000ULL;
  const String ipAddress = WiFi.localIP().toString();
  String escapedStationSsid;
  appendJsonEscaped(escapedStationSsid, WiFi.SSID());

  const time_t currentDeviceTimestamp = time(nullptr);
  const time_t deviceTimeAnchor = currentDeviceTimestamp >= MIN_VALID_UNIX_TIMESTAMP
                                     ? currentDeviceTimestamp
                                     : 0;
  const bool reconciliationActive = cloudHistoryReconciliationIsActive();
  char jsonPayload[1400];
  snprintf(jsonPayload, sizeof(jsonPayload),
           "{\"device_id\":\"%s\",\"station_ssid\":\"%s\",\"ip_address\":\"%s\",\"wifi_rssi_dbm\":%d,\"uptime_anchor_seconds\":%llu,\"uptime_anchor_server_ms\":{\".sv\":\"timestamp\"},\"last_seen_server_ms\":{\".sv\":\"timestamp\"},\"device_time_anchor_s\":%lu,\"device_time_anchor_server_ms\":{\".sv\":\"timestamp\"},\"time_source\":\"%s\",\"rtc_present\":%s,\"rtc_valid\":%s,\"ntp_sync_pending\":%s,\"last_time_sync_timestamp\":%lu,\"components\":{\"bme680\":{\"state\":\"%s\",\"failures\":%u,\"ready\":%s},\"hx711\":{\"state\":\"%s\",\"failures\":%u,\"ready\":%s},\"ds3231\":{\"state\":\"%s\",\"failures\":%u,\"ready\":%s,\"time_valid\":%s},\"sd_card\":{\"state\":\"%s\",\"failures\":%u,\"ready\":%s}},\"history_sync\":{\"pending\":%s,\"caught_up\":%s,\"last_synced_timestamp\":%lu,\"retry_seconds\":%lu,\"reconciliation\":{\"state\":\"%s\",\"local_days\":%u,\"days_to_transfer\":%u,\"days_completed\":%u,\"measurements_to_transfer\":%lu,\"measurements_uploaded\":%lu,\"last_completed_timestamp\":%lu}}}",
           deviceId, escapedStationSsid.c_str(), ipAddress.c_str(), WiFi.RSSI(),
           static_cast<unsigned long long>(uptimeAnchorSeconds),
           static_cast<unsigned long>(deviceTimeAnchor),
           timeSourceName(), rtcReady ? "true" : "false", rtcTimeValid ? "true" : "false",
           ntpSynchronizationPending ? "true" : "false",
           static_cast<unsigned long>(lastTimeSynchronizationTimestamp),
           componentHealthName(bme680Status), bme680Status.consecutiveFailures, bme680Ready ? "true" : "false",
           componentHealthName(loadCellStatus), loadCellStatus.consecutiveFailures, loadCellReady ? "true" : "false",
           componentHealthName(rtcStatus), rtcStatus.consecutiveFailures, rtcReady ? "true" : "false",
           rtcTimeValid ? "true" : "false", componentHealthName(sdCardStatus),
           sdCardStatus.consecutiveFailures, sdCardReady ? "true" : "false",
           (cloudSyncPending || reconciliationActive) ? "true" : "false",
           (cloudSyncCaughtUp && !cloudSyncPending && !hourlyAggregateReady && !dailyAggregateReady &&
            !reconciliationActive) ? "true" : "false",
           static_cast<unsigned long>(lastCloudSyncedTimestamp),
           static_cast<unsigned long>(cloudSyncRetryIntervalMs / 1000), cloudReconciliationStateName(),
           dailyReconciliationManifestCount, dailyReconciliationDaysToTransfer,
           dailyReconciliationDaysCompleted,
           static_cast<unsigned long>(dailyReconciliationMeasurementsToTransfer),
           static_cast<unsigned long>(dailyReconciliationMeasurementsUploaded),
           static_cast<unsigned long>(lastDailyReconciliationTimestamp));
  object_t deviceStatus(jsonPayload);

  database.set(asyncClient, deviceStatusDatabasePath, deviceStatus, processData,
               "updateDeviceStatus");
  deviceStatusInFlight = true;
  deviceStatusPending = false;
  deviceStatusDirtyDuringFlight = false;
  lastDeviceStatusAttemptMillis = millis();
  return true;
}

void sendMeasurements(uint32_t measurementCycleMillis)
{
  Measurement measurement{};
  if (!createMeasurement(measurement)) {
    return;
  }

  // NTP se lahko potrdi med enim prehodom zanke; tak zapis je že veljavna prva cloud meritev.
  if (measurement.timestamp >= MIN_VALID_UNIX_TIMESTAMP) {
    validTimeWasAvailable = true;
  }

  latestMeasurement = measurement;
  hasLatestMeasurement = true;
  if (measurement.timestamp >= MIN_VALID_UNIX_TIMESTAMP) {
    latestMeasurementUploadPending = true;
  }

  char jsonPayload[256];
  serializeMeasurementJson(measurement, jsonPayload, sizeof(jsonPayload));
  object_t measurements(jsonPayload);

  const bool shouldArchiveMeasurement = lastSDMeasurementMillis == 0 ||
                                         measurementCycleMillis - lastSDMeasurementMillis >=
                                             sdMeasurementIntervalMs;
  bool savedToSDCard = false;
  if (shouldArchiveMeasurement) {
    lastSDMeasurementMillis = measurementCycleMillis;
    savedToSDCard = appendToSDCard(measurement);
    if (savedToSDCard) {
      cloudSyncCaughtUp = false;
    }
  }
  if (measurement.bme680Valid && measurement.loadCellValid) {
    Serial.printf("Meritev: %s %s, %.1f C, %.1f %%, %.2f kg\n", measurement.date,
                  measurement.time, measurement.temperatureC, measurement.humidityPercent,
                  measurement.weightKg);
  } else if (measurement.bme680Valid) {
    Serial.printf("Meritev: %s %s, %.1f C, %.1f %% (HX711 ni dosegljiv)\n", measurement.date,
                  measurement.time, measurement.temperatureC, measurement.humidityPercent);
  } else {
    Serial.printf("Meritev: %s %s, %.2f kg (BME680 ni dosegljiv)\n", measurement.date,
                  measurement.time, measurement.weightKg);
  }
  if (isFirebaseReady() && measurement.timestamp >= MIN_VALID_UNIX_TIMESTAMP) {
    // SD sinhronizacija je običajna pot zgodovine; neposredni zapis je le rezerva ob napaki SD.
    if (shouldArchiveMeasurement && !savedToSDCard) {
      char historyPath[DATABASE_PATH_LENGTH];
      snprintf(historyPath, sizeof(historyPath), "%s/%lu", historyDatabasePath,
               static_cast<unsigned long>(measurement.timestamp));
      database.set(asyncClient, historyPath, measurements, processData, "saveMeasurementHistory");
    }
  }
}

void processPendingLatestMeasurement()
{
  if (!latestMeasurementUploadPending || latestMeasurementUploadInFlight || !isFirebaseReady() ||
      latestMeasurement.timestamp < MIN_VALID_UNIX_TIMESTAMP) {
    return;
  }

  char jsonPayload[256];
  serializeMeasurementJson(latestMeasurement, jsonPayload, sizeof(jsonPayload));
  object_t measurements(jsonPayload);
  latestMeasurementUploadPending = false;
  latestMeasurementUploadInFlight = true;
  database.set(asyncClient, latestDatabasePath, measurements, processData, "updateLatestMeasurement");
}

}  // namespace

void setup()
{
  Serial.begin(115200);
  delay(500);
  Serial.printf("Firmware version: %s\n", FIRMWARE_VERSION);
  initializeMemoryAndHistoryBuffer();
  setenv("TZ", TIMEZONE, 1);
  tzset();
  sntp_set_time_sync_notification_cb([](timeval *) { ntpSynchronizationCompleted = true; });

  initializeWiFiEventHandlers();
  initializeI2c();
  initializeSDCard();
  initializeMeasurementHistoryIndex();
  loadBme680Calibration();
  bme680Ready = initializeBme680();
  initializeRtc();
  loadCellReady = initializeLoadCell();
  connectToWiFi();
  rebuildCloudAggregateState();
  initializeLocalWebServer();
  sslClient.setInsecure();
  sslClient.setConnectionTimeout(4000);
  sslClient.setHandshakeTimeout(5);
  controlStreamSslClient.setInsecure();
  controlStreamSslClient.setConnectionTimeout(4000);
  controlStreamSslClient.setHandshakeTimeout(5);
  otaClient.setInsecure();
  otaDownloadClient.setInsecure();

  initializeApp(asyncClient, app, getAuth(noAuth));
  app.getApp<RealtimeDatabase>(database);
  database.url(FIREBASE_DATABASE_URL);

  Serial.println(stationConnected
                     ? "Firebase client configured."
                     : "Firebase client configured; waiting for an internet connection.");
}

void loop()
{
  processQueuedWiFiConnectionAttempt();
  updateWiFiConnectionAttempt();
  maintainProvisioningAccessPoint();
  maintainNetworkConnection();
  initializeTime();
  processTimeSynchronization();
  maintainFirebaseClient();
  maintainControlStream();
  maintainArduinoOta();
  ElegantOTA.loop();
  maintainElegantOtaSession();

  processOtaUpdate();
  processPendingControlCommand();
  processQueuedFirmwareUpdateCommand();
  processQueuedTimeCommand();
  processPendingTimeCommand();
  processPendingHistoryDeletion();
  processPendingWiFiCredentialReset();
  processPendingLocalHistoryDeletion();
  processPendingLoadCellTare();
  processPendingBme680Calibration();
  processLocalHistory();
  processCloudHistoryReconciliation();
  printSystemDiagnostics();

  // Vsako opravilo uporablja svoj interval, zato meritve ne blokirajo spremljanja stanja naprave.
  const uint32_t currentMillis = millis();
  const bool validTimeAvailable = time(nullptr) >= MIN_VALID_UNIX_TIMESTAMP;
  maintainComponentRecovery(currentMillis);

  // Če prva meritev nastane pred NTP sinhronizacijo, po pridobitvi pravega časa
  // ustvarimo še eno takojšnjo meritev, primerno za SD dnevnik in Firebase.
  if (validTimeAvailable && !validTimeWasAvailable) {
    validTimeWasAvailable = true;
    lastMeasurementMillis = 0;
    lastSDMeasurementMillis = 0;
    Serial.println("Time synchronized; sending the first timestamped measurement.");
  } else if (!validTimeAvailable) {
    validTimeWasAvailable = false;
  }

  // Med OTA prenosom ohranimo odzivnost lokalnega strežnika in Firebase app.loop(),
  // druge cloud zahteve pa začasno ustavimo, da ne tekmujejo z OTA statusom.
  if (!firmwareUpdateInProgress && !Update.isRunning()) {
    // Nastavitve intervalov imajo prednost pred novo meritvijo `latest`. Če je en sam
    // Firebase kanal prost, jih naprava tako prevzame tudi pri pogostem pošiljanju meritev.
    // Ob zasedenem kanalu časovnika ne premaknemo in zahtevo neblokirno ponovimo v naslednji zanki.
    // Trenutna meritev ima prednost pred periodičnimi statusi. Tako en sam
    // Firebase kanal ne more preskočiti najnovejše meritve nastavljenega cikla.
    if (lastMeasurementMillis == 0 || currentMillis - lastMeasurementMillis >= measurementIntervalMs) {
      lastMeasurementMillis = currentMillis;
      sendMeasurements(currentMillis);
    }
    processPendingLatestMeasurement();

    const bool activationSecretRetryReady = lastActivationSecretAttemptMillis == 0 ||
                                            currentMillis - lastActivationSecretAttemptMillis >=
                                                ACTIVATION_SECRET_RETRY_INTERVAL_MS;
    if (activationSecretPublishPending && !activationSecretPublishInFlight &&
        activationSecretRetryReady) {
      publishActivationSecret();
    }

    if (isFirebaseReady() && !firmwareVersionReported) {
      firmwareVersionReported = true;
      sendFirmwareVersion();
    }

    // Po ponovnem zagonu cloud ne sme obdržati starega stanja "taring".
    // Zapis izvedemo le, ko je Firebase odjemalec prost.
    if (isFirebaseReady() && !loadCellTareStatusReported) {
      if (loadCellReady) {
        loadCellTareState = LoadCellTareState::Idle;
        reportLoadCellTareStatus("S ploščadi odstrani vse in nato tariraj tehtnico.");
      } else {
        loadCellTareState = LoadCellTareState::Error;
        reportLoadCellTareStatus("HX711 ni dosegljiv; tariranje ni mogoče.");
      }
      loadCellTareStatusReported = true;
    }

    if (isFirebaseReady() && !bme680CalibrationStatusReported) {
      reportBme680CalibrationStatus("Nastavi odmika temperature in vlage po referencnem merilniku.");
    }

    if (lastSDStatusMillis == 0 || currentMillis - lastSDStatusMillis >= SD_STATUS_INTERVAL_MS) {
      lastSDStatusMillis = currentMillis;
      updateSDCardStatus();
    }

    // Fizični SD pregled zgoraj ostaja minutni. Cloud objava čaka le na spremembo, reconnect
    // ali neuspešen zapis in pri zasedenem asinhronem kanalu ne premika retry časovnika.
    const bool sdStatusRetryReady = lastSDStatusCloudAttemptMillis == 0 ||
                                    currentMillis - lastSDStatusCloudAttemptMillis >=
                                        SD_STATUS_CLOUD_RETRY_INTERVAL_MS;
    if (sdCardStatusCloudPending && !sdCardStatusCloudInFlight && sdStatusRetryReady) {
      queueSDCardStatusUpdate();
    }

    // Polni posnetek odstranjuje tudi morebitna stara polja iz prejšnje sheme (set() prepiše
    // celoten status/device). Časovnika pomenita zadnji potrjen zapis, ne zgolj oddane zahteve.
    const bool fullStatusDue = deviceStatusPending ||
                               currentMillis - lastDeviceStatusMillis >= DEVICE_STATUS_SNAPSHOT_INTERVAL_MS;
    const bool fullStatusRetryReady = !deviceStatusPending || lastDeviceStatusAttemptMillis == 0 ||
                                      currentMillis - lastDeviceStatusAttemptMillis >= DEVICE_STATUS_RETRY_INTERVAL_MS;
    if (fullStatusDue && !deviceStatusInFlight && fullStatusRetryReady) {
      updateDeviceStatus();
    }

    const bool heartbeatDue = deviceHeartbeatPending || lastDeviceHeartbeatMillis == 0 ||
                              currentMillis - lastDeviceHeartbeatMillis >= DEVICE_HEARTBEAT_INTERVAL_MS;
    const bool heartbeatRetryReady = !deviceHeartbeatPending || lastDeviceHeartbeatAttemptMillis == 0 ||
                                     currentMillis - lastDeviceHeartbeatAttemptMillis >= DEVICE_STATUS_RETRY_INTERVAL_MS;
    if (heartbeatDue && !deviceHeartbeatInFlight && heartbeatRetryReady) {
      // Minutni heartbeat je majhen PATCH s Firebase strežniškim časom. Deluje tudi, če je
      // ura ESP napačna ali še ni nastavljena, zato online stanje ne more temeljiti na RTC/NTP.
      updateDeviceHeartbeat();
    }

    synchronizeSDMeasurements(currentMillis);

  }

}
