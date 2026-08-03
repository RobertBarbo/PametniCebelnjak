# Pametni čebelnjak – tehnični opis

## Namen

Firmware na ESP32-S3 spremlja en čebelji panj. Temperatura, relativna vlaga in teža so trenutno simulirane. Vsaka meritev se najprej zapiše na SD kartico, nato pa se ob dosegljivem internetu postopno sinhronizira v Firebase Realtime Database za cloud nadzorno ploščo.

## Strojna oprema

- ESP32-S3 DevKitC-1
- microSD kartica prek SPI: `CS=10`, `MOSI=11`, `SCK=12`, `MISO=13`
- Prihodnji senzorji za temperaturo, vlago in težo

## Meritve, čas in SD kartica

- Nova meritev nastane takoj po zagonu, nato vsakih 5 minut. Če prvi zapis nastane pred NTP sinhronizacijo, se takoj po pridobitvi časa ustvari dodatna meritev z veljavnim časom za Firebase in SD dnevnik.
- Ob uspešni NTP sinhronizaciji zapis vsebuje slovenski datum, uro in Unix čas.
- Brez interneta se meritev še vedno prikaže lokalno in zapiše na SD. Po ponovnem zagonu brez predhodne NTP sinhronizacije absolutni datum ni znan, zato takih zapisov ni mogoče pravilno umestiti v koledarski graf.
- Datoteka `/measurements.csv` na SD ima glavo `date,time,unix_timestamp,temperature_c,humidity_percent,weight_kg`.
- Izpeljana datoteka `/measurements.idx` hrani začetni položaj vsakega UTC dneva. Obstoječemu CSV dnevniku se indeks ob prvem zagonu izdela samodejno, zato lokalni graf pri običajni poizvedbi bere samo zahtevani del datoteke. CSV ostaja edini izvorni zapis in indeks se lahko varno ponovno izdela.
- Ko je Firebase dosegljiv, ESP32 iz CSV dnevnika prenese eno še nepotrjeno meritev na 1,5 sekunde. Ob napaki razmik eksponentno poveča do največ 60 sekund. V NVS vsakih 12 uspešnih zapisov shrani položaj v datoteki in zadnji sinhroniziran čas; po izpadu elektrike se lahko ponovno pošlje največ 11 meritev, kar je varno, ker Firebase uporablja Unix čas kot enolični ključ.
- Surova zgodovina se običajno pošilja samo prek SD sinhronizacije, zato isti zapis ni poslan dvakrat. Neposredni Firebase zapis se uporabi le kot rezerva, kadar meritve ni mogoče shraniti na SD.
- Med zaporednim prenosom ESP32 izdela urne in dnevne povprečne agregate. Zaključeni interval se zapiše enkrat, trenutni interval pa se osveži največ vsakih 30 minut.
- Ob prvem zagonu firmware-a z agregati se NVS kazalec enkrat samodejno vrne na začetek SD dnevnika. Obstoječi surovi ključi se varno prepišejo, hkrati pa se dopolnijo urni in dnevni podatki; naslednji zagoni nadaljujejo z običajnega shranjenega položaja.
- Zapisi z `unix_timestamp=0`, ki nastanejo pred prvo NTP sinhronizacijo, ostanejo samo na SD kartici in niso vključeni v cloud graf.
- Stanje SD kartice se preveri vsako minuto. Ob nedosegljivi kartici se inicializacija ponovi; po petih neuspelih poskusih se stanje označi kot napaka.

## Wi-Fi provisioning in lokalni dostop

Firmware je univerzalen in ne vsebuje Wi-Fi poverilnic.

1. Ob prvem zagonu oziroma ob nedosegljivem shranjenem omrežju ESP32 odpre AP `Cebelnjak-XXXXXX`.
2. Med beta testiranjem je AP odprt brez gesla. Lokalni naslov, `device_id` in aktivacijska koda se izpišejo v serijskem monitorju.
3. Uporabnik se z mobilnim telefonom poveže na AP, odpre `http://192.168.4.1/` in na obrazcu vnese domači SSID ter geslo.
4. ESP32 povezavo asinkrono preizkusi, medtem pa AP ostane aktiven in stran pokaže stanje. Podatka se v NVS shranita samo ob uspešni povezavi; ponovni zagon ni potreben.

Če povezava z domačim Wi-Fi-jem med delovanjem odpove, se AP znova vključi. Lokalna nadzorna plošča, trenutne meritve in SD zgodovina so zato dostopni tudi brez interneta. Lokalni obrazec asinkrono najde dosegljiva omrežja in lahko izbriše shranjene Wi-Fi podatke. Ko se Wi-Fi po uspešnem preizkusu obnovi, se AP zapre. Odprt AP je dovoljen samo za trenutno beta testiranje; produkcijska izvedba ga mora zaščititi.

`device_id` ima obliko `CB-XXXXXXXXXXXX` in je ponovljiv za isto ESP32 napravo. Aktivacijska koda je lokalna skrivnost v NVS; prikaže se na lokalni strani in v serijskem monitorju. Za Firebase-only beta registracijo jo ESP32 zapiše pod zasebno, neberljivo pot `/device_secrets/{device_id}` in zapis z isto kodo obnovi vsakih pet minut; nikoli se ne prikaže v cloud nadzorni plošči ali Git-u.

## Lokalna in cloud nadzorna plošča

Mapa `web/` je hkrati vir za Firebase Hosting in LittleFS (`data_dir`) na ESP32.

- Lokalni API: `/api/status`, `/api/history`, `/api/wifi`, `/api/sync/reset` in `/measurements.csv`.
- Lokalni pogled najprej poskusi lokalni API; kadar ta ni dosegljiv, uporabi Firebase cloud pogled s prijavo uporabnika. Lokalni pogled ne prikaže cloud prijave, registracije naprav ali OTA upravljanja, prikaže pa `device_id` in aktivacijsko kodo za kasnejšo registracijo.
- Highcharts je v `web/vendor/highcharts.js`, zato grafi na lokalnem ESP32 ne potrebujejo interneta.
- Lokalni graf uporabi dnevni SD indeks in podatke agregira na ESP32. Če SD trenutno ni dosegljiv, ostane nadzorna plošča v lokalnem načinu in jasno prikaže napako zgodovine.
- Cloud graf za obdobja do 7 dni bere surove meritve, do 31 dni urne agregate, za daljša obdobja pa dnevne agregate. Tako ostaneta prenos in poraba brskalnika predvidljiva tudi pri enoletnem pogledu.
- Lokalni gumb **Ponovno sinhroniziraj zgodovino** ponastavi NVS položaj prenosa in ponovno pošlje celoten SD dnevnik. Namenjen je predvsem obnovi po ročnem brisanju Firebase baze.
- Izbirnik omogoča hitra obdobja, začetni in končni datum z urama ter X-zoomiranje v lokalnem in cloud pogledu.
- Glavna navigacija loči poglede **Pregled**, **Meritve**, **Zgodovina**, **Naprava** in **Posodobitve**; lokalni način skrije cloud prijavo in OTA upravljanje.
- Svetla in temna tema delujeta v obeh načinih, shranjena izbira pa ostane v brskalniku. Highcharts uporablja barve aktivne teme.
- Datumi v karticah, tabeli, izbirniku obdobja in grafu so prikazani v obliki `d/m/y`; ura uporablja 24-urni zapis.
- Odzivna postavitev prilagodi navigacijo, kartice, tabelo, graf in obrazce telefonu, tablici ter namiznemu računalniku. Upravljalni elementi na dotik so visoki najmanj 44 px.
- Po spremembi datotek v `web/` izvedi `pio run -t uploadfs`.

## OTA firmware

GitHub Actions ob tagu `vMAJOR.MINOR.PATCH-beta.N` preveri skladnost z `FIRMWARE_VERSION`, prevede firmware, ustvari SHA-256 manifest in objavi `firmware.bin` ter `manifest.json` v GitHub Release.

Cloud nadzorna plošča preveri najnovejšo izdajo. Uporabnik lahko pošlje OTA ukaz ali različico prezre v svojem brskalniku. ESP32 ukaz preveri v največ 30 sekundah, ga najprej postavi v čakalno vrsto in šele nato obdela iz glavne zanke. Pred namestitvijo preveri verzijo, velikost in SHA-256, nato se ob uspehu ponovno zažene. Manifest ima 15-sekundno omejitev. Firmware se prenese prek neposredne HTTPS povezave z ročno obdelavo največ štirih GitHub preusmeritev; povezava ima 20-sekundno, HTTP glave pa 15-sekundno omejitev. Predolge nepomembne GitHub HTTP glave se med branjem varno preskočijo, preusmeritvena `Location` pa se obdela. Prehodno prazno stanje `WiFiClientSecure` ne prekine prenosa; šele 15 sekund brez podatkov pomeni napako in se zapiše v Firebase. Sam prenos poteka po 2 KB korakih, zato `app.loop()` med prenosom še vedno pošilja status. Cloud kartica prikaže fazo, napredek od 0 do 100 % in razlog napake; serijski monitor izpiše iste korake ter ciljnega OTA gostitelja. Podvojeni Firebase povratni klici za isti OTA ukaz se ignorirajo. OTA izdaja ne vsebuje Wi-Fi poverilnic, zato je ista binarna datoteka primerna za vse naprave.

## Trenutni Firebase podatkovni model

Trenutna razvojna beta uporablja ločeno pot za vsak trajni ID naprave in lastništvo uporabnika:

```text
/devices/{device_id}/
  owner_uid
  latest/
  measurements/{unix_timestamp}/
  aggregates/
    hourly/{hour_start_timestamp}/
    daily/{day_start_timestamp}/
  status/
    firmware/version
    sd_card/{present,initialization_failures,error}
    device/{device_id,ip_address,wifi_rssi_dbm,uptime_days,uptime_hours,uptime_minutes,uptime_total_minutes,last_seen_timestamp}
    ota/{state,current_version,target_version,message,progress_percent,updated_at}
  commands/firmware_update/{action,target_version,requested_at}

/users/{firebase_uid}/devices/{device_id}/
  display_name
  claimed_at

/device_secrets/{device_id}/activation_code
/device_claims/{device_id}/{firebase_uid}/activation_code
```

Cloud pogled zahteva Firebase prijavo in pokaže samo naprave pod `/users/{firebase_uid}/devices`. Uporabnik napravo prevzame z ID-jem in aktivacijsko kodo prek Firebase pravil. ESP32 za trenutno beta testiranje ostaja anonimen zapisovalec; omejitve in produkcijski načrt sta opisana v `docs/DEVICE_OWNERSHIP.md`.
