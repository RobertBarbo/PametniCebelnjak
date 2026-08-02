# Lastništvo naprav in Firebase-only beta varnost

## Kaj zagotavlja trenutna beta

Firebase Authentication prepozna uporabnika z e-pošto/geslom ali Google računom. Vsak uporabnik v cloud nadzorni plošči vidi samo naprave, zapisane pod lastnim UID-jem.

```text
/users/{uid}/devices/{deviceId}
  display_name
  claimed_at

/devices/{deviceId}
  owner_uid
  latest
  measurements/{unix_timestamp}
  aggregates/hourly/{hour_start_timestamp}
  aggregates/daily/{day_start_timestamp}
  status
  commands
```

`database.rules.json` dovoli branje naprave samo takrat, ko je `owner_uid` enak prijavljenemu Firebase UID-ju. Uporabnik lahko registrira več naprav in med njimi preklaplja z izbirnikom na cloud strani.

## Prevzem naprave brez Cloud Functions

Ta beta namerno ne uporablja Cloud Functions in zato ne zahteva Blaze paketa. Aktivacijska koda se preveri neposredno v Firebase Realtime Database pravilih.

```text
/device_secrets/{deviceId}/activation_code
/device_claims/{deviceId}/{uid}/activation_code
```

1. ESP32 ob prvem uspešnem Firebase dostopu enkrat zapiše svojo osemmestno aktivacijsko kodo pod zasebno pot `/device_secrets/{deviceId}`.
2. Ta pot ni berljiva iz spletne strani; koda se prikaže samo lokalno prek AP-ja oziroma serijskega monitorja.
3. Prijavljen uporabnik v cloud obrazec vnese ID naprave, aktivacijsko kodo in prikazno ime.
4. Firebase pravilo primerja vneseno kodo z zasebnim zapisom. Ob ujemanju cloud stran zapiše `owner_uid` in povezavo pod `/users/{uid}/devices`.
5. Začasni zahtevek se izbriše; aktivacijska koda ni prikazana v cloud nadzorni plošči.

## Pomembna omejitev

ESP32 v tej izvedbi še vedno anonimno piše meritve, stanje in bere OTA ukaz. Firebase pravila zato lahko zaščitijo **zasebnost in prikaz podatkov**, ne morejo pa dokazati, da je anonimen zapis res poslal fizični ESP32. Kdor pozna ID naprave, lahko teoretično pošilja ponarejene meritve ali izbriše OTA ukaz, ne more pa podatkov brati brez računa lastnika.

To je sprejemljivo samo za trenutno beta testiranje. Za produkcijo je potreben zaupanja vreden strežniški vmesnik ali avtentikacija naprave z lastnim žetonom oziroma certifikatom.

## Varnostna pravila

- `device_secrets` je zaseben; anonimen ESP32 ga lahko ustvari in pozneje ponovno zapiše samo z isto aktivacijsko kodo.
- `device_claims` lahko bere in piše samo uporabnik, katerega UID je v poti.
- `devices/{deviceId}` lahko bere samo lastnik.
- Lastnik lahko pošlje OTA ukaz, anonimen ESP32 pa ga lahko le prebere in izbriše po obdelavi.
- Meritve, agregati, status in `latest` dovoljujejo anonimen zapis samo zato, ker ESP32 še nima lastne Firebase avtentikacije.

Pravil ne spreminjaj v javno branje. Pred produkcijo odstrani anonimen zapis in uvedi avtentikacijo naprave.
