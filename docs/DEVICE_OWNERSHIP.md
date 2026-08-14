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

`database.rules.json` dovoli celoten ogled naprave samo takrat, ko je `owner_uid` enak prijavljenemu Firebase UID-ju. Uporabnik lahko registrira več panjev in med njimi preklaplja z izbirnikom na cloud strani. Deljeni uporabnik dobi ločeno vlogo `viewer`, ki omogoča samo branje meritev in agregatov.

## Deljenje panja samo za ogled

Lastnik v cloud pogledu vnese e-poštni naslov prejemnika. Spletna stran ustvari naključno osemmestno kodo pod `/share_invites/{code}`; povabilo je vezano na izbrani panj, lastnika, e-poštni naslov in poteče po 24 urah. Prejemnik mora biti prijavljen prav s tem Firebase e-poštnim naslovom.

Po vnosu kode se z eno atomsko posodobitvijo ustvarita dostop `/device_access/{deviceId}/{viewerUid}` in uporabnikov izbirnik `/users/{viewerUid}/shared_devices/{deviceId}`, uporabljeno povabilo pa se izbriše. Firebase pravila gledalcu dovolijo branje samo poti `latest`, `measurements`, `aggregates/hourly` in `aggregates/daily`. Poti `status`, `commands`, lastništvo in aktivacijska koda ostanejo nedostopne, zato skriti upravljalni gumbi niso edina zaščita.

Lastnik lahko vidi seznam gledalcev in posamezen dostop prekliče. Gledalec lahko deljeni panj odstrani iz svojega računa; atomsko se izbrišeta samo njegov zapis `/device_access/{deviceId}/{viewerUid}` in povezava `/users/{viewerUid}/shared_devices/{deviceId}`, lastništvo ter meritve pa ostanejo nespremenjeni. Ob odregistraciji panja lastnik ali skrbnik z istim atomskim zapisom odstrani tudi vse zapise `device_access` ter pripadajoče uporabniške povezave.

## Skrbniški ogled

Za trenutni beta skrbniški UID so Firebase pravila določena neposredno v `database.rules.json`. Ta račun lahko bere celotno pot `/devices`, zato cloud nadzorna plošča samodejno prikaže vse registrirane in še neregistrirane panje brez aktivacijske kode. Skrbnik lahko za izbrani panj pošlje OTA ukaz, počisti merilno zgodovino in odjavi trenutnega lastnika; ne more pa nastaviti novega lastnika, brati zasebnih aktivacijskih podatkov ali upravljati uporabniških računov.

Za nadaljnjo produkcijsko administracijo je treba ta enkratni UID zamenjati z vlogo Firebase custom claim, ki jo nastavi zaupanja vreden Admin SDK backend.

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

## Odregistracija panja

Prijavljen lastnik lahko v cloud nadzorni plošči odregistrira izbrani panj. Po potrditvi se z eno atomsko posodobitvijo odstranijo povezava `/users/{uid}/devices/{deviceId}`, lastništvo pod `/devices/{deviceId}` in vsi deljeni dostopi.

Meritve, status naprave, SD sinhronizacija in zasebna aktivacijska koda se ne brišejo. Panj zato ni več viden nobenemu uporabniku, novi lastnik pa ga lahko z istim ID-jem in aktivacijsko kodo ponovno registrira. Firebase pravilo dovoli brisanje `owner_uid` trenutnemu lastniku ali trenutnemu beta skrbniškemu UID-ju. Skrbniška kartica zahteva besedo `ODJAVI` in nato z enim atomarnim zapisom odstrani `owner_uid`, `owner_email` ter `/users/{lastnik_uid}/devices/{deviceId}`, zato ne more nastati delno odjavljen panj.

## Pomembna omejitev

- Zaradi beta primerjave SD zgodovine lahko anonimen ESP32 prebere dnevne agregate `/devices/{deviceId}/aggregates/daily`. To ne odpre surovih meritev, vendar vsakdo, ki pozna ID naprave in URL baze, lahko vidi dnevna povprečja. Pred produkcijo mora ta dostop nadomestiti avtentikacija naprave.

ESP32 v tej izvedbi še vedno anonimno piše meritve, stanje, bere OTA ukaz in za primerjavo zgodovine bere dnevne agregate. Firebase pravila zato lahko zaščitijo surovo zgodovino in prikaz podatkov v nadzorni plošči, ne morejo pa dokazati, da je anonimen zapis res poslal fizični ESP32. Kdor pozna ID naprave, lahko teoretično pošilja ponarejene meritve, izbriše OTA ukaz ali prebere dnevna povprečja, ne more pa brati surovih meritev brez računa lastnika.

To je sprejemljivo samo za trenutno beta testiranje. Za produkcijo je potreben zaupanja vreden strežniški vmesnik ali avtentikacija naprave z lastnim žetonom oziroma certifikatom.

## Varnostna pravila

- `device_secrets` je zaseben; anonimen ESP32 ga lahko ustvari in pozneje ponovno zapiše samo z isto aktivacijsko kodo.
- `device_claims` lahko bere in piše samo uporabnik, katerega UID je v poti.
- `devices/{deviceId}` lahko v celoti bere samo lastnik; trenutni beta skrbniški UID lahko bere vse naprave. Gledalec lahko bere samo merilne pod-poti, ki jih izrecno dovoljujejo pravila.
- `share_invites` lahko ustvari lastnik, prebere in uporabi pa ga le prijavljeni račun z ustreznim e-poštnim naslovom; uporabljena koda se izbriše.
- `device_access` lahko ustvari samo prejemnik veljavnega povabila, odstrani pa ga lahko gledalec, lastnik ali skrbnik.
- Lastnik lahko pošlje OTA ukaz, anonimen ESP32 pa ga lahko le prebere in izbriše po obdelavi.
- Meritve, agregati, status in `latest` dovoljujejo anonimen zapis samo zato, ker ESP32 še nima lastne Firebase avtentikacije.

Pravil ne spreminjaj v javno branje. Pred produkcijo odstrani anonimen zapis in uvedi avtentikacijo naprave.
