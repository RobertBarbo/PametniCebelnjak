# Pametni čebelnjak – projektna navodila

## Jezik in slog

- Komunikacija, dokumentacija in komentarji so v slovenščini.
- Imena C++ simbolov, Firebase ključev in datotek ostanejo v angleščini.
- Koda naj uporablja jasna imena, majhne funkcije, `constexpr` za konstante in komentarje za pomembne odločitve, protokole ter omejitve strojne opreme.
- Ne dodajaj neuporabljenih knjižnic, kode ali konfiguracij.

## Razvoj firmware-a

- Ciljna ploščica je `esp32-s3-devkitc-1` s PIOArduino ESP32 platformo in Arduino frameworkom.
- Pred predajo sprememb vedno prevedi z `pio run` oziroma z lokalnim PlatformIO izvršljivim programom, če `pio` ni v `PATH`.
- Ne uporabljaj blokirajočih zakasnitev v glavni zanki, razen pri začetnem povezovanju v `setup()`.
- Meritve se najprej beležijo na SD, nato pa se surova zgodovina ter urni/dnevni agregati sinhronizirajo v Firebase Realtime Database; spremembe podatkovnega modela morajo posodobiti obe poti in dokumentacijo.

## Omrežje in identiteta naprave

- Wi-Fi SSID in geslo ne smeta biti v izvorni kodi, GitHub Actions skrivnostih ali sledeni datoteki. Nastavljata se le prek lokalnega provisioning obrazca in se shranita v NVS.
- Brez shranjenega ali dosegljivega Wi-Fi-ja naprava odpre AP in iz LittleFS streže lokalno nadzorno ploščo. Med beta testiranjem je AP odprt; pred produkcijo mora biti ponovno zaščiten.
- `device_id` je trajni identifikator naprave. Aktivacijska koda je lokalna skrivnost: ne prikaži je v cloud UI ali Git-u. Firebase-only beta jo enkrat zapiše pod zasebno `/device_secrets/{device_id}` za preverjanje registracije.
- Trenutni beta firmware uporablja lastno razvojno pot `/devices/{device_id}/` in Firebase Authentication za lastništvo uporabnika. Anonimno ESP32 pisanje je dovoljeno samo za beta testiranje; omejitve morajo ostati dokumentirane v `docs/DEVICE_OWNERSHIP.md`.

## Firebase in OTA

- `include/project_config.h` vsebuje javni URL Firebase Realtime Database, ne uporabniških poverilnic.
- Ob zagonu firmware pošlje svojo verzijo na `/devices/{device_id}/status/firmware`.
- OTA firmware se izdaja iz GitHub Release workflowa ob tagu `vMAJOR.MINOR.PATCH-beta.N`; Git tag se mora ujemati z `FIRMWARE_VERSION`.
- ESP32 sprejme OTA samo po Firebase ukazu in po preverjanju SHA-256 iz GitHub `manifest.json`; firmware datoteke ne dodajaj v Git repozitorij.
- Trenutni neposredni Firebase dostop brez avtentikacije je namenjen le razvoju. Pred produkcijo je obvezen zaupanja vreden strežniški vnos meritev in avtentikacija naprave; Firebase Authentication in omejena pravila za uporabnike sta že del beta toka.

## Verzije in dokumentacija

- Trenutna razvojna verzija je v `include/version.h`.
- Pred stabilno izdajo uporabljaj obliko `MAJOR.MINOR.PATCH-beta.N`; vsaka funkcionalna sprememba zahteva smiselno povišanje verzije.
- Ob vsaki funkcionalni spremembi posodobi `docs/PROJECT.md` in dodaj vnos v `docs/CHANGELOG.md`.
- V changelogu uporabi razdelke `Added`, `Changed`, `Fixed` in `Removed`, kjer so primerni.

## Spletna nadzorna plošča

- Statična lokalna nadzorna plošča je v mapi `web/` in mora ostati odzivna za telefon, tablico in namizni računalnik.
- ESP32 isti uporabniški vmesnik streže iz LittleFS prek lokalnega IP-ja; lokalni API poti so `/api/status`, `/api/history`, `/api/wifi` in `/api/sync/reset`.
- Lokalni pogled mora delovati brez interneta, vključno z grafi iz SD CSV dnevnika.
- Highcharts mora biti lokalno priložen v `web/vendor/`, saj lokalni pogled ne sme uporabljati CDN povezave.
- Izbirnik zgodovine uporablja začetni in končni datum z urama, hitrimi izbirami in X-zoomiranjem grafa v obeh načinih.
- Firebase spletna konfiguracija je samo v `web/firebase-config.js`; v Git se doda le `web/firebase-config.example.js`.
- Nadzorna plošča ne sme vsebovati Firebase Admin poverilnic.
- Ob spremembi Firebase podatkovnega modela posodobi nadzorno ploščo in `docs/PROJECT.md`.
