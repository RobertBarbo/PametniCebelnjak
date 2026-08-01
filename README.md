# Pametni čebelnjak

Firmware za ESP32-S3, ki spremlja stanje čebeljega panja in podatke zapisuje na SD kartico ter v Firebase Realtime Database.

**Različica:** `0.1.0-beta.5`

## Trenutne funkcije

- Simulirane meritve temperature, relativne vlage in teže vsakih 10 sekund.
- Zapis vsake meritve v Firebase in v CSV dnevnik na SD kartici.
- NTP datum in ura za območje Slovenije.
- Enominutno preverjanje stanja SD kartice ter samodejna ponovna inicializacija.
- Pošiljanje različice firmware-a, stanja SD kartice, IP-ja, Wi-Fi signala in uptime-a v Firebase.
- Odzivna lokalna nadzorna plošča z živimi statusi in grafom zgodovine meritev.
- Dostop do iste nadzorne plošče prek lokalnega IP naslova ESP32, tudi brez Firebase podatkov.

## Zahteve

- ESP32-S3 DevKitM-1
- microSD kartica, formatirana kot FAT32
- Wi-Fi omrežje
- Firebase Realtime Database
- PlatformIO z Arduino frameworkom

## Začetek

1. Kopiraj `include/secrets.example.h` v `include/secrets.h`.
2. V `include/secrets.h` vpiši Wi-Fi podatke.
3. Preveri Firebase Realtime Database pravila za razvojno okolje.
4. Prevedi firmware z `pio run`.
5. Naloži firmware z `pio run -t upload`.
6. Naloži spletne datoteke v LittleFS z `pio run -t uploadfs`.

Lokalni datoteki `include/secrets.h` in `firebase.md` sta namenoma izključeni iz Git-a.

## Dokumentacija

- [Opis projekta in podatkovni model](docs/PROJECT.md)
- [Dnevnik sprememb](docs/CHANGELOG.md)
- [Projektna navodila](AGENTS.md)

## Objavljanje na GitHub

Ko na GitHubu ustvariš prazen repozitorij brez začetnih datotek, v tej mapi zaženi:

```powershell
git remote add origin https://github.com/UPORABNIK/Pametni_Cebelnjak.git
git branch -M main
git add .
git commit -m "Initial release: 0.1.0-beta.5"
git push -u origin main
```

Pred objavo preveri seznam datotek z `git status` in se prepričaj, da `include/secrets.h` ter `firebase.md` nista med njimi.
