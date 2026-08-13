# Pametni čebelnjak

Firmware za ESP32-S3, ki spremlja stanje čebeljega panja in podatke zapisuje na SD kartico ter v Firebase Realtime Database.

**Različica:** `0.1.0-rc.30`

## Trenutne funkcije

- Dejanske trenutne meritve temperature, relativne vlage in teže z BME680 ter HX711 vsakih 10 sekund.
- Varno tariranje HX711 prek lokalne strani ali cloud nadzorne plošče; odmik prazne ploščadi se shrani v NVS.
- Enominutni zapis skupne meritve v CSV dnevnik na SD kartici ter postopna sinhronizacija surove zgodovine in agregatov v Firebase.
- Dnevni SD indeks za hitro lokalno zgodovino ter urni/dnevni Firebase agregati za daljša cloud obdobja.
- DS3231 ohranja datum in uro brez interneta; ob dosegljivem omrežju se samodejno uskladi z NTP.
- Samodejni Wi-Fi provisioning brez trdo vpisanega SSID-ja ali gesla.
- Dostopni AP kot rezerva, kadar domači Wi-Fi ni nastavljen ali ni dosegljiv.
- Trajni ID, aktivacijska koda in Firebase prijava za registracijo več naprav na uporabnika.
- Skrbniški pregled vseh panjev z varno odjavo trenutnega lastnika brez brisanja meritev.
- Deljenje panja z drugim Firebase uporabnikom prek 24-urne kode in vloge **samo ogled**.
- Odzivna lokalna nadzorna plošča z merjenjem, SD zgodovino in grafi tudi brez interneta.
- OTA posodobitev iz preverjenega GitHub Release manifesta in ročna lokalna posodobitev firmware-a ali LittleFS prek ElegantOTA.
- Varen izbris cloud zgodovine ali celotne SD in cloud zgodovine za izbrani panj.

## Prvi zagon

1. Prevedi firmware z `pio run` in ga naloži z `pio run -t upload`.
2. Naloži lokalno spletno stran v LittleFS z `pio run -t uploadfs`.
3. Če naprava nima shranjenega Wi-Fi-ja, se na telefonu poveži na odprti AP `Cebelnjak-XXXXXX`. ID naprave in aktivacijska koda sta izpisana v serijskem monitorju.
4. Na telefonu odpri `http://192.168.4.1/`, vpiši domači Wi-Fi SSID in geslo ter potrdi obrazec.
5. ESP32 povezavo najprej preizkusi brez ponovnega zagona. Ob uspehu shrani podatke, na strani pokaže potrditev in nato zapre AP.
6. Za ročno lokalno posodobitev odpri zavihek **Posodobitve**, nato portal ElegantOTA na poti `http://<device-ip>/update`. Izberi **Firmware** za `firmware.bin` ali **Filesystem** za `littlefs.bin`; datoteki namesti ločeno, naprava pa se po vsaki uspešni namestitvi znova zažene.

Wi-Fi podatki se hranijo v NVS na ESP32 in niso del firmwarea, Git-a ali GitHub Actions. Lokalni obrazec omogoča skeniranje omrežij in brisanje shranjenih nastavitev. Po izpadu Wi-Fi-ja lokalna stran in SD zgodovina ostaneta dostopni prek AP-ja. Watchdog vsakih 30 sekund poskusi ponovno povezavo, po treh neuspelih poskusih pa znova zažene STA povezavo z NVS poverilnicami. Odprt AP je začasna nastavitev za beta testiranje in pred produkcijo ne sme ostati odprt.

## Zahteve

- ESP32-S3 DevKitC-1
- microSD kartica, formatirana kot FAT32
- DS3231 RTC modul z rezervno baterijo
- Firebase Realtime Database za trenutni razvojni cloud pogled
- PlatformIO z Arduino frameworkom
- ElegantOTA 3.1.7; odprtokodna izdaja uporablja licenco AGPL-3.0, zato je treba pred zaprto komercialno distribucijo preveriti licenčne obveznosti ali uporabiti ustrezno Pro licenco.

## Cloud in lastništvo naprav

Trenutna beta zapisuje vsako napravo v lastno Firebase pot `devices/{device_id}`. Uporabnik se prijavi z e-pošto/geslom ali Googlom, napravo prevzame z ID-jem in lokalno aktivacijsko kodo ter vidi svoje in z njim deljene panje. Deljeni uporabnik lahko bere samo meritve in grafe; Firebase pravila mu blokirajo stanje komponent, OTA ter vse upravljalne ukaze. Glavni skrbnik lahko lastnika varno odjavi, brez brisanja naprave ali meritev. Postopek objave je v `docs/FIREBASE_AUTH_SETUP.md`. Ker ESP32 še anonimno pošilja meritve, je ta model namenjen beta testiranju in ne produkciji; omejitve so v `docs/DEVICE_OWNERSHIP.md`.

## Dokumentacija

- [Opis projekta in podatkovni model](docs/PROJECT.md)
- [Lastništvo naprav in produkcijska varnost](docs/DEVICE_OWNERSHIP.md)
- [Nastavitev Firebase Authentication](docs/FIREBASE_AUTH_SETUP.md)
- [Dnevnik sprememb](docs/CHANGELOG.md)
- [Projektna navodila](AGENTS.md)

## GitHub in OTA

### PlatformIO Wi-Fi OTA

Firmware `0.1.0-rc.30` omogoča nalaganje firmware-a in LittleFS neposredno iz PlatformIO prek ArduinoOTA. Prvo namestitev te različice še vedno naredi prek USB. Nato v lokalni, Git-ignorirani datoteki `platformio.local.ini` vnesi aktivacijsko kodo z lokalne strani:

```ini
[env:esp32s3_ota]
upload_port = 192.168.64.116
custom_ota_password = AKTIVACIJSKA_KODA
```

V repozitoriju je samo vzorčna datoteka `platformio.local.ini.example`; dejanska lokalna datoteka je izključena iz Git-a. Ukaza zahtevata povezavo naprave v domače Wi-Fi omrežje; prek same rezervne AP točke ne delujeta.

Ob izdaji nove verzije spremeni `FIRMWARE_VERSION`, posodobi dokumentacijo, nato po uspešnem preverjanju objavi ustrezen tag:

```powershell
git tag v0.1.0-rc.30
git push origin v0.1.0-rc.30
```

GitHub Actions prevede univerzalni firmware in LittleFS sliko ter v GitHub Release objavi `firmware.bin`, `littlefs.bin` in `manifest.json`. ESP32 najprej na SD prenese in s SHA-256 preveri `littlefs.bin`, nato posodobi lokalno spletno stran in šele zatem preverjeno posodobi firmware. Ker Wi-Fi ni del kode, za OTA izdajo niso potrebne GitHub Actions skrivnosti.

Prvi firmware z LittleFS OTA podporo je treba na že nameščeni starejši različici priporočeno naložiti prek USB skupaj z `pio run -t uploadfs`. Starejši OTA odjemalec prenese samo firmware; naslednja OTA izdaja nato že posodobi tudi LittleFS.
