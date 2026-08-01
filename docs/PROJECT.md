# Pametni čebelnjak

## Namen

Firmware na ESP32-S3 spremlja stanje enega čebeljega panja. Trenutno so temperatura, relativna vlaga in teža simulirane. Meritve se shranijo na SD kartico in v Firebase Realtime Database, da je kasneje možen prikaz grafov na Firebase Hostingu.

## Strojna oprema

- ESP32-S3 DevKitM-1
- microSD kartica prek SPI: `CS=10`, `MOSI=11`, `SCK=12`, `MISO=13`
- Senzorji bodo dodani v naslednjih fazah; trenutne vrednosti so simulirane.

## Delovanje

- Vsakih 10 sekund firmware ustvari meritev.
- Ob uspešni NTP sinhronizaciji se meritvi dodata lokalni datum in ura za območje Slovenije.
- Vsaka meritev se doda v `/measurements.csv` na SD kartici in v zgodovino Firebase.
- Trenutna meritev se zapiše tudi ločeno, da je enostavno dostopna za uporabniški vmesnik.
- Stanje SD kartice se preveri in pošlje v Firebase enkrat na minuto.
- IP naslov, moč Wi-Fi signala in uptime naprave se pošljejo v Firebase enkrat na minuto.
- Ob nedosegljivi kartici firmware kartico vsako minuto znova inicializira. Po petih neuspelih poizkusih je stanje označeno kot napaka.

## Lokalna nadzorna plošča

Mapa `web/` vsebuje odzivno statično spletno stran za telefon, tablico in namizni računalnik. Isti vmesnik se lahko lokalno streže iz LittleFS na ESP32 ali v cloud načinu bere Firebase Realtime Database. Prikazuje zadnjo meritev, zgodovinski graf, stanje SD kartice, firmware verzijo, IP naslov, Wi-Fi signal, uptime in jasno stanje dosegljivosti ESP32.

Lokalni ESP32 pogled je dosegljiv na `http://IP-ESP32/`. Izpis IP naslova je v serijskem monitorju. Po vsaki spremembi datotek v `web/` izvedi `pio run -t uploadfs`. Highcharts je priložen v `web/vendor/highcharts.js`, zato lokalni grafi ne potrebujejo internetne povezave. Izbirnik zgodovine omogoča poljuben začetni in končni datum z uro ter hitre izbire; graf se približa z vlečenjem po osi časa. Lokalni API sprejme največ 366 dni in podatke združuje glede na trajanje obdobja: do dneva na 5 minut, do tedna na uro, do meseca na 6 ur in daljše obdobje po dnevih.

Cloud pogled potrebuje HTTP strežnik za razvoj; podrobna navodila so v `web/README.md`. Datoteka `web/firebase-config.js` je lokalna konfiguracija in ne sodi v Git.

## OTA firmware

Nova firmware izdaja se objavi prek GitHub Actions ob potisku taga oblike `vMAJOR.MINOR.PATCH-beta.N`. Workflow preveri, da se tag ujema z `FIRMWARE_VERSION`, prevede `firmware.bin`, izračuna SHA-256 in v GitHub Release doda `firmware.bin` ter `manifest.json`.

Cloud nadzorna plošča preveri najnovejši GitHub Release in ob novejši verziji ponudi gumba **Posodobi napravo** in **Prezri**. Prezrta izdaja se shrani le v brskalnik. Potrjen gumb zapiše ukaz v Firebase; ESP32 ga preveri vsakih 30 sekund, prenese manifest, primerja verzijo, preveri velikost in SHA-256 ter sliko zapiše v neaktivno OTA particijo. Ob uspehu se naprava ponovno zažene.

Privzeta 8 MB particijska tabela vsebuje `app0` in `app1`, zato podpira varno menjavo OTA slike. Trenutna beta uporablja HTTPS povezavo do GitHub Release in SHA-256 preverjanje datoteke. Pred produkcijsko uporabo je treba Firebase pravila omejiti na avtenticirane uporabnike in dodati preverjanje podpisa OTA slike oziroma zaupanja vredno potrdilo strežnika.

Za objavo izdaje po uspešnem pushu na `main` uporabi:

```powershell
git tag v0.1.0-beta.6
git push origin v0.1.0-beta.6
```

## Firebase podatkovni model

```text
/hives/panj_1/
  latest/
    temperature_c
    humidity_percent
    weight_kg
    date
    time
    timestamp
  measurements/{unix_timestamp}/
    temperature_c
    humidity_percent
    weight_kg
    date
    time
    timestamp
  status/
    firmware/
      version
    sd_card/
      present
      initialization_failures
      error
    device/
      ip_address
      wifi_rssi_dbm
      uptime_days
      uptime_hours
      uptime_minutes
      uptime_total_minutes
      last_seen_timestamp
    ota/
      state
      current_version
      target_version
      message
      updated_at
  commands/
    firmware_update/
      action
      target_version
      requested_at
```

## SD dnevnik

Datoteka `/measurements.csv` ima glavo in zapis za vsako meritev:

```csv
date,time,unix_timestamp,temperature_c,humidity_percent,weight_kg
2026-08-01,14:30:00,1785587400,32.4,58.1,41.36
```

## Lokalna konfiguracija

1. Kopiraj `include/secrets.example.h` v `include/secrets.h`.
2. Vpiši Wi-Fi podatke v `include/secrets.h`.
3. Preveri Firebase Realtime Database pravila za razvojno okolje.
4. Prevedi z `pio run` in naloži firmware na ESP32-S3.

`include/secrets.h` in `firebase.md` sta lokalni datoteki in ne sodita v repozitorij.

## GitHub

Projekt je pripravljen za GitHub z lokalnim Git repozitorijem, `.gitignore` za občutljive in gradbene datoteke ter korenskim `README.md`. Postopek prve objave je opisan v `README.md`.
