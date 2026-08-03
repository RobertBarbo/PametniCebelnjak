# Changelog

Vse pomembne spremembe projekta so dokumentirane v tej datoteki.

## Unreleased

## [0.1.0-beta.10] - 2026-08-03

### Fixed

- OTA ukaz se zdaj najprej varno postavi v čakalno vrsto in se obdela iz glavne zanke, ne več znotraj Firebase povratnega klica.
- Prenos firmware-a prekine ob prekinjeni povezavi ali po 15 sekundah brez prejetih podatkov, zato ESP32 ne more več neskončno obstati v OTA prenosu.
- OTA uporablja globalni prenosni medpomnilnik namesto velikega lokalnega medpomnilnika na skladu `loopTask`.
- Serijski monitor izpiše faze OTA prenosa, HTTP napake, napredek in konkreten razlog neuspeha.
- Po uspešnem ponovnem zagonu naprava zazna že nameščeno ciljno različico, označi OTA kot uspešen in odstrani ukaz.

## [0.1.0-beta.9] - 2026-08-02

### Added

- Firebase Authentication v cloud nadzorni plošči z e-pošto/geslom in Google prijavo.
- Prevzem več naprav z `device_id` in aktivacijsko kodo ter izbirnik uporabnikovih naprav.
- Firebase Realtime Database pravila za zasebnost podatkov po `owner_uid`.
- Dnevni indeks SD CSV dnevnika za hitrejše lokalne poizvedbe zgodovine.
- Urne in dnevne Firebase agregate za učinkovite mesečne in letne cloud grafe.
- Lokalni prikaz stanja sinhronizacije in gumb za ponovni prenos celotnega SD dnevnika po brisanju baze.

### Changed

- ESP32 pripravi zaseben aktivacijski zapis za Firebase-only beta registracijo.
- ESP32 obnovi isti aktivacijski zapis po ročnem brisanju Firebase baze.
- ESP32 po uspešni NTP sinhronizaciji takoj zapiše časovno veljavno prvo meritev na SD kartico in v Firebase.
- Lokalni pogled skrije cloud prijavo, registracijo naprav in OTA upravljanje ter jasno prikaže aktivacijsko kodo naprave.
- ESP32 postopno sinhronizira zgodovino meritev s SD kartice v Firebase brez uporabe Cloud Storage.
- Surovo Firebase zgodovino zapisuje samo SD sinhronizacija; neposredni zapis ostaja rezerva ob napaki SD.
- Neuspešni prenosi uporabljajo eksponentni zamik od 1,5 do 60 sekund.
- Cloud graf samodejno izbere surove, urne ali dnevne podatke glede na dolžino obdobja.
- Prvi zagon novega agregacijskega modela enkrat ponovno obdela obstoječi SD dnevnik, da stare meritve dobijo agregate.

### Fixed

- CSS zdaj dosledno upošteva atribut `hidden`, zato se cloud obrazci ne prikažejo v lokalnem pogledu.
- Firebase povratni klici ne uporabljajo več stack-potratnega formatiranega izpisa, ki je povzročal ponovni zagon ESP32-S3.
- Ob zagonu se prva meritev z veljavnim NTP časom ne podvoji več v istem časovnem trenutku.
- Napaka lokalne SD zgodovine ne preklopi več nadzorne plošče v Firebase način.

## [0.1.0-beta.8] - 2026-08-02

### Added

- Wi-Fi provisioning prek lokalne nadzorne plošče in trajno shranjevanje omrežnih podatkov v NVS.
- Zaščiten AP kot samodejni rezervni lokalni dostop ob prvi namestitvi ali nedosegljivem Wi-Fi-ju.
- Trajni `device_id` na osnovi identitete ESP32 in prikaz ID-ja v lokalni ter cloud nadzorni plošči.
- Dokumentiran varen načrt za prijavo uporabnikov, registracijo naprav in več naprav na uporabnika.

### Changed

- OTA GitHub Actions gradi enoten firmware brez `secrets.h` in brez Wi-Fi poverilnic v CI.
- Meritve se ob nedosegljivem cloudu še vedno zapisujejo lokalno na SD kartico.

### Removed

- Predloga `include/secrets.example.h` in odvisnost firmwarea od trdo vpisanih Wi-Fi poverilnic.

## [0.1.0-beta.7] - 2026-08-01

### Changed

- Testna OTA izdaja za preverjanje GitHub Release, Firebase ukaza in posodobitve naprave prek cloud nadzorne plošče.

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
