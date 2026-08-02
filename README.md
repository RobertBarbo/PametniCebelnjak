# Pametni čebelnjak

Firmware za ESP32-S3, ki spremlja stanje čebeljega panja in podatke zapisuje na SD kartico ter v Firebase Realtime Database.

**Različica:** `0.1.0-beta.8`

## Trenutne funkcije

- Simulirane meritve temperature, relativne vlage in teže vsakih 5 minut.
- Zapis vsake meritve v CSV dnevnik na SD kartici ter postopna sinhronizacija surove zgodovine in agregatov v Firebase.
- Dnevni SD indeks za hitro lokalno zgodovino ter urni/dnevni Firebase agregati za daljša cloud obdobja.
- Samodejni Wi-Fi provisioning brez trdo vpisanega SSID-ja ali gesla.
- Dostopni AP kot rezerva, kadar domači Wi-Fi ni nastavljen ali ni dosegljiv.
- Trajni ID, aktivacijska koda in Firebase prijava za registracijo več naprav na uporabnika.
- Odzivna lokalna nadzorna plošča z merjenjem, SD zgodovino in grafi tudi brez interneta.
- OTA posodobitev iz preverjenega GitHub Release manifesta.

## Prvi zagon

1. Prevedi firmware z `pio run` in ga naloži z `pio run -t upload`.
2. Naloži lokalno spletno stran v LittleFS z `pio run -t uploadfs`.
3. Če naprava nima shranjenega Wi-Fi-ja, se na telefonu poveži na odprti AP `Cebelnjak-XXXXXX`. ID naprave in aktivacijska koda sta izpisana v serijskem monitorju.
4. Na telefonu odpri `http://192.168.4.1/`, vpiši domači Wi-Fi SSID in geslo ter potrdi obrazec.
5. ESP32 povezavo najprej preizkusi brez ponovnega zagona. Ob uspehu shrani podatke, na strani pokaže potrditev in nato zapre AP.

Wi-Fi podatki se hranijo v NVS na ESP32 in niso del firmwarea, Git-a ali GitHub Actions. Lokalni obrazec omogoča skeniranje omrežij in brisanje shranjenih nastavitev. Po izpadu Wi-Fi-ja lokalna stran in SD zgodovina ostaneta dostopni prek AP-ja. Odprt AP je začasna nastavitev za beta testiranje in pred produkcijo ne sme ostati odprt.

## Zahteve

- ESP32-S3 DevKitC-1
- microSD kartica, formatirana kot FAT32
- Firebase Realtime Database za trenutni razvojni cloud pogled
- PlatformIO z Arduino frameworkom

## Cloud in lastništvo naprav

Trenutna beta zapisuje vsako napravo v lastno Firebase pot `devices/{device_id}`. Uporabnik se prijavi z e-pošto/geslom ali Googlom, napravo prevzame z ID-jem in lokalno aktivacijsko kodo ter vidi samo lastne naprave. Postopek objave je v `docs/FIREBASE_AUTH_SETUP.md`. Ker ESP32 še anonimno pošilja meritve, je ta model namenjen beta testiranju in ne produkciji; omejitve so v `docs/DEVICE_OWNERSHIP.md`.

## Dokumentacija

- [Opis projekta in podatkovni model](docs/PROJECT.md)
- [Lastništvo naprav in produkcijska varnost](docs/DEVICE_OWNERSHIP.md)
- [Nastavitev Firebase Authentication](docs/FIREBASE_AUTH_SETUP.md)
- [Dnevnik sprememb](docs/CHANGELOG.md)
- [Projektna navodila](AGENTS.md)

## GitHub in OTA

Ob izdaji nove verzije spremeni `FIRMWARE_VERSION`, posodobi dokumentacijo, nato po uspešnem preverjanju objavi ustrezen tag:

```powershell
git tag v0.1.0-beta.8
git push origin v0.1.0-beta.8
```

GitHub Actions prevede univerzalni firmware in objavi `firmware.bin` ter `manifest.json` v GitHub Release. Ker Wi-Fi ni del kode, za OTA izdajo niso potrebne GitHub Actions skrivnosti.
