# Changelog

Vse pomembne spremembe projekta so dokumentirane v tej datoteki.

## [0.1.0-beta.6] - 2026-08-01

### Added

- OTA posodobitev ESP32 firmware-a iz GitHub Release manifesta po potrditvi v Firebase cloud pogledu.
- Preverjanje verzije, velikosti datoteke in SHA-256 pred zapisom OTA slike v neaktivno particijo.
- Cloud kartico za prikaz nove GitHub Release verzije z možnostjo potrditve ali prezrtja posodobitve.
- GitHub Actions workflow za prevod firmware-a, generiranje `manifest.json` in objavo GitHub Release ob verzijskem tagu.

## [0.1.0-beta.5] - 2026-08-01

### Added

- `last_seen_timestamp` v stanju naprave za prikaz dosegljivosti ESP32 v Firebase pogledu.
- Izbirnik začetnega in končnega datuma z uro, koledarjem in hitrimi obdobji v lokalnem in cloud pogledu.
- X-zoomiranje grafov z vlečenjem po grafu.
- Lokalno kopijo Highcharts `web/vendor/highcharts.js` za delovanje lokalnih grafov brez interneta.

### Changed

- Lokalni API zgodovine podpira parametra `from` in `to` ter sam izbere ustrezno agregacijo podatkov.
- Firebase Hosting ne objavi razvojnih datotek in Firebase dnevnikov iz mape `web/`.

## [0.1.0-beta.4] - 2026-08-01

### Added

- Lokalni HTTP strežnik na ESP32 z nadzorno ploščo, doseglivo prek IP naslova naprave.
- Lokalna API-ja za trenutno stanje in agregirano zgodovino iz SD CSV dnevnika.
- LittleFS nalaganje spletnih datotek z `pio run -t uploadfs`.
- Filtre zgodovine za dan, teden, mesec in leto v lokalnem in cloud pogledu.

### Changed

- Cloud in lokalni pogled uporabljata isti odzivni uporabniški vmesnik in Highcharts grafe.

## [0.1.0-beta.3] - 2026-08-01

### Added

- Odzivno lokalno spletno nadzorno ploščo z živimi Firebase podatki in grafom zgodovine meritev.
- Prikaz zadnje meritve, stanja SD kartice, IP naslova, Wi-Fi signala, uptime-a in verzije firmware-a.
- Lokalno Firebase spletno konfiguracijo in predlogo konfiguracije za GitHub.

### Changed

- Ureditev firmware-a z jasnimi razdelki in komentarji za nadaljnji razvoj.

## [0.1.0-beta.2] - 2026-08-01

### Added

- Enominutno pošiljanje IP naslova, moči Wi-Fi signala in uptime-a naprave v Firebase.

## [0.1.0-beta.1] - 2026-08-01

### Added

- Začetni ESP32-S3 firmware z Wi-Fi povezavo in Firebase Realtime Database.
- Simulirane meritve temperature, relativne vlage in teže v 10-sekundnem intervalu.
- NTP sinhronizacijo lokalnega slovenskega časa z upoštevanjem poletnega časa.
- CSV dnevnik meritev na SD kartici prek SPI.
- Zgodovino meritev, trenutno meritev in stanje SD kartice v Firebase.
- Enominutno preverjanje SD kartice s petimi poskusi ponovne inicializacije.
- Pošiljanje razvojne verzije firmware-a v Firebase ob zagonu.
- Osnovo Git repozitorija, javni `README.md`, `.gitignore` in `.gitattributes` za GitHub.
