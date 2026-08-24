# Obnovitev projekta Pametni Čebelnjak

Ta dokument opisuje osnovne korake za obnovitev projekta na novem računalniku po kloniranju iz GitHub repozitorija.

## 1. Kloniranje repozitorija

```powershell
git clone <URL_REPOZITORIJA>
cd Pametni_Cebelnjak
```

Privzeta veja za obnovitev trenutnega stabilnega projektnega stanja je `main`:

```powershell
git switch main
```

Če želiš nadaljevati delo na ločeni razvojni veji, jo izberi šele po kloniranju oziroma preveri njeno trenutno ime na GitHubu.

Preveri stanje:

```powershell
git status
```

## 2. PlatformIO / ESP32 firmware

Projekt vsebuje vse potrebne izvorne datoteke in `platformio.ini`.

Odpri projekt v VS Code z nameščenim PlatformIO. PlatformIO bo manjkajoče knjižnice in build datoteke ponovno ustvaril sam.

Mapa `.pio/` ni shranjena v Git-u in je ni potrebno kopirati.

### Lokalna OTA konfiguracija

Datoteka `platformio.local.ini` ni v Git-u, ker vsebuje lokalne podatke, kot sta OTA IP in geslo. Za običajen USB build ni potrebna.

Če želiš uporabljati OTA, jo je treba na novem računalniku ponovno ustvariti.

## 3. Firebase / Web

Datoteka `web/firebase-config.js` namenoma ni shranjena v Git-u.

Na novem računalniku jo ustvari iz `web/firebase-config.example.js`:

```powershell
Copy-Item web/firebase-config.example.js web/firebase-config.js
```

Nato v `web/firebase-config.js` vnesi pravilno Firebase Web konfiguracijo projekta.

Brez te datoteke lokalni cloud pogled in Androidov postopek `npm run sync` ne bosta delovala.

## 4. Node.js odvisnosti

`node_modules/` ni shranjen v Git-u. Za Android aplikacijo odpri njeno mapo in namesti odvisnosti:

```powershell
cd android-app
npm install
```

Odvisnosti se obnovijo iz `package.json` in `package-lock.json`.

## 5. Android projekt

Android projekt in Gradle wrapper sta shranjena v Git-u. Build mape niso shranjene in se ustvarijo samodejno.

Datoteka `android-app/android/app/google-services.json` ni shranjena v Git-u. Trenutni osnovni Android build je ne potrebuje; potrebna je le za funkcije, ki uporabljajo Google Services oziroma push obvestila.

Pred izdelavo APK-ja najprej v korenu projekta pripravi kopijo web nadzorne plošče:

```powershell
cd android-app
npm run sync
cd android
.\gradlew.bat assembleDebug
```

## 6. Datoteke, ki se namenoma ne shranjujejo

Med drugim so izključene naslednje lokalne, generirane ali občutljive datoteke:

```text
.pio/
node_modules/
build/
.firebase/
*.gz
platformio.local.ini
web/firebase-config.js
android-app/android/app/google-services.json
```

Teh datotek ni treba kopirati iz starega računalnika, razen kadar želiš obnoviti lastno Firebase konfiguracijo, OTA nastavitve ali Google Services/push obvestila.

## 7. Preverjanje obnovitve

Po kloniranju preveri:

```powershell
git status
git branch --show-current
git log -1 --oneline
```

Za trenutno skupno projektno stanje mora biti aktivna veja:

```text
main
```

Nato preveri:

1. PlatformIO build firmware-a.
2. Lokalni spletni vmesnik.
3. Firebase cloud povezavo.
4. Android build, če ga uporabljaš.

## Git backup

Za običajen backup trenutnega projekta najprej preveri spremembe:

```powershell
git status
```

Nato dodaj relevantne projektne datoteke, brez arhivov, build datotek, gesel in API skrivnosti:

```powershell
git add -A -- . ':(exclude)web.rar'
git commit -m "chore: backup projekta"
git push origin HEAD
```
