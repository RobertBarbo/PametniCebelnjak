# Nadzorna plošča

Mapa vsebuje isti odzivni vmesnik za dva načina:

- **lokalni ESP32 pogled** iz LittleFS prek lokalnega IP-ja ali AP-ja;
- **cloud pogled** prek Firebase Authentication in Realtime Database za lastne naprave uporabnika.

Vmesnik je razdeljen na poglede **Pregled**, **Grafi**, **Naprava** in **Posodobitve**. Na telefonu se navigacija zloži v meni, postavitev pa se prilagodi tudi tablici in namiznemu računalniku. Uporabnik lahko izbere svetlo ali temno temo; izbira se shrani lokalno. Datumi so povsod prikazani v obliki `d/m/y`.

## Lokalni ESP32 pogled brez interneta

1. Naloži firmware z `pio run -t upload`.
2. Naloži to mapo v LittleFS z `pio run -t uploadfs`.
3. Brez nastavljenega Wi-Fi-ja se na telefonu poveži na odprti AP `Cebelnjak-XXXXXX`; podatki AP-ja so v serijskem monitorju. Odprt AP je začasen samo za beta testiranje.
4. Odpri `http://192.168.4.1/`, izberi najdeno Wi-Fi omrežje ali ga vpiši ročno. ESP32 povezavo preveri brez ponovnega zagona in podatke shrani šele po uspehu.
5. V lokalnem zavihku **Posodobitve** odpri ElegantOTA na portu `8080`. Izberi **Firmware** za `firmware.bin` ali **Filesystem** za `littlefs.bin`; datoteki namesti ločeno in uporabi samo zaupanja vredne datoteke za ESP32-S3.

Lokalni obrazec ima tudi gumb za brisanje shranjenega Wi-Fi-ja. Po potrditvi se ESP32 odklopi od domačega omrežja in znova odpre svoj AP.

Lokalni pogled ne prikazuje cloud prijave ali obrazca za registracijo. Aktivacijska koda je vidna na kartici **Aktivacijska koda** ob stanju naprave; uporabi se skupaj z ID-jem naprave v cloud pogledu.

Lokalna grafa bereta `/measurements.csv` prek `/api/history`. Highcharts je priložen v `vendor/highcharts.js`, zato za grafa in obe temi ne potrebuje interneta. Izbirnik podpira hitra obdobja, začetek in konec z uro ter X-zoomiranje. Temperatura in relativna vlaga sta na prvem grafu, teža panja pa na drugem.

## Cloud razvojni pogled

Za lokalni preizkus cloud pogleda kopiraj `firebase-config.example.js` v lokalni `firebase-config.js`, vpiši Firebase spletno konfiguracijo in zaženi:

```powershell
py -m http.server 8080 --directory web
```

Nato odpri `http://localhost:8080`. Datoteka `firebase-config.js` je lokalna in se ne objavi v Git. V Firebase Console pred uporabo omogoči Email/Password in Google prijavo.

Po prijavi cloud pogled prebere samo `/users/{uid}/devices`. Panj registriraš z ID-jem naprave in aktivacijsko kodo iz lokalne ESP32 strani; nato ga lahko izbereš v kompaktni kartici. Gumb **Odregistriraj izbrani panj** odstrani povezavo z računom, ne izbriše pa meritev ali zgodovine. Celoten postopek je v `../docs/FIREBASE_AUTH_SETUP.md`.

## OTA

Cloud pogled preveri najnovejši javni GitHub Release. Nova različica ponudi gumba **Posodobi napravo** in **Prezri**. Potrditev zapiše ukaz v trenutno razvojno Firebase pot; ESP32 ga preveri v največ 30 sekundah, preveri manifest in se nato po uspešni namestitvi ponovno zažene.

## Produkcija

Ta Firebase-only beta loči uporabnike pri branju podatkov, vendar anonimnega ESP32 zapisa ne more kriptografsko potrditi. Pred produkcijo dodaj avtentikacijo naprave ali zaupanja vreden backend po načrtu v `../docs/DEVICE_OWNERSHIP.md`.
