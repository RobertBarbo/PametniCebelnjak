# Pametni čebelnjak – projektna navodila

## Jezik in slog

- Komunikacija, dokumentacija in komentarji so v slovenščini.
- Imena C++ simbolov, Firebase ključev in datotek ostanejo v angleščini.
- Koda naj uporablja jasna imena, majhne funkcije, `constexpr` za konstante in komentarje za pomembne odločitve, protokole ter omejitve strojne opreme.
- Ne dodajaj neuporabljenih knjižnic, kode ali konfiguracij.

## Razvoj firmware-a

- Ciljna ploščica je `esp32-s3-devkitm-1` z Arduino frameworkom in PlatformIO.
- Pred predajo sprememb vedno prevedi z `pio run` oziroma z lokalnim PlatformIO izvršljivim programom, če `pio` ni v `PATH`.
- Ne uporabljaj blokirajočih zakasnitev v glavni zanki, razen pri začetnem povezovanju v `setup()`.
- Meritve se beležijo na SD in v Firebase Realtime Database; spremembe podatkovnega modela morajo posodobiti obe poti in dokumentacijo.

## Firebase in skrivnosti

- `include/secrets.h` in `firebase.md` sta lokalni datoteki; njunih vrednosti ne vpisuj v sledeno izvorno kodo ali dokumentacijo.
- Firebase poti ostanejo pod `/hives/panj_1/` dokler projekt ne dobi podpore za več panjev.
- Ob zagonu firmware pošlje svojo verzijo na `/hives/panj_1/status/firmware`.

## Verzije in dokumentacija

- Trenutna razvojna verzija je v `include/version.h`.
- Pred stabilno izdajo uporabljaj obliko `MAJOR.MINOR.PATCH-beta.N`; vsaka funkcionalna sprememba zahteva smiselno povišanje verzije.
- Ob vsaki funkcionalni spremembi posodobi `docs/PROJECT.md` in dodaj vnos v `docs/CHANGELOG.md`.
- V changelogu uporabi razdelke `Added`, `Changed`, `Fixed` in `Removed`, kjer so primerni.

## Spletna nadzorna plošča

- Statična lokalna nadzorna plošča je v mapi `web/` in mora ostati odzivna za telefon, tablico in namizni računalnik.
- ESP32 isti uporabniški vmesnik streže iz LittleFS prek lokalnega IP-ja; lokalni API poti sta `/api/status` in `/api/history`.
- Lokalni zgodovinski graf bere CSV dnevnik s SD kartice in podatke združuje za dan, teden, mesec ali leto.
- Highcharts mora biti lokalno priložen v `web/vendor/`, saj mora lokalni pogled delovati brez dostopa do interneta; ne uporabljaj CDN povezave.
- Izbirnik zgodovine uporablja začetni in končni datum z urama, hitrimi izbirami in X-zoomiranjem grafa v obeh načinih.
- Firebase spletna konfiguracija je samo v `web/firebase-config.js`; v Git se doda le `web/firebase-config.example.js`.
- Nadzorna plošča bere Firebase Realtime Database neposredno in ne sme vsebovati Firebase Admin poverilnic.
- Ob spremembi Firebase podatkovnega modela posodobi nadzorno ploščo in `docs/PROJECT.md`.
