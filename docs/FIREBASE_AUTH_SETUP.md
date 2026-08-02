# Firebase Authentication in registracija naprave

Ta postopek ne potrebuje Firebase Blaze paketa.

## 1. Omogoči prijavne metode

V Firebase Console odpri **Authentication** in izberi **Get started**. Pod **Sign-in method** omogoči:

1. **Email/Password**;
2. **Google** in izberi podporni e-poštni naslov projekta.

Za Google preveri še seznam **Authorized domains**. `pametnicebelnjak.web.app` mora ostati dovoljen; pri lastni domeni jo dodaj na isti strani.

## 2. Objavi Firebase pravila

```powershell
firebase deploy --only database
```

`firebase.json` uporabi datoteko `database.rules.json`. Ta pravila omogočijo anonimen zapis aktivacijske kode in varno ponovitev samo z isto kodo, hkrati pa skrijejo podatke naprav pred neprijavljenimi uporabniki.

## 3. Naloži firmware in LittleFS

```powershell
pio run -t upload
pio run -t uploadfs
```

ESP32 naj se poveže v Wi-Fi in Firebase. V serijskem monitorju počakaj na sporočilo `Device activation secret was registered.`. ESP32 enak zasebni zapis nato obnavlja vsakih pet minut, zato se obnovi tudi po ročnem brisanju podatkov iz baze.

## 4. Objavi cloud stran

```powershell
firebase deploy --only hosting
```

Po objavi pravil nepovezani obiskovalci ne morejo brati podatkov naprav.

## 5. Ustvari račun in registriraj napravo

1. Odpri Firebase Hosting stran in klikni **Prijava**.
2. Ustvari račun z e-pošto/geslom ali uporabi Google.
3. V kartici **Registriraj čebelnjak** vnesi prikazno ime, ID naprave in aktivacijsko kodo z lokalne ESP32 strani.
4. Po uspehu je naprava vidna samo v tvojem računu. Dodatne naprave dodaš z istim postopkom.

## Preverjanje

V Realtime Database moraš po uspešnem prevzemu videti:

```text
/devices/CB-XXXXXXXXXXXX/owner_uid
/users/{tvoj_firebase_uid}/devices/CB-XXXXXXXXXXXX
```

Z drugim uporabniškim računom ta naprava ne sme biti vidna niti berljiva.

## Beta omejitev

Ta Firebase-only rešitev skriva podatke pred drugimi uporabniki, ne more pa kriptografsko potrditi anonimnega ESP32 zapisa. Podrobnost je v `docs/DEVICE_OWNERSHIP.md`.
