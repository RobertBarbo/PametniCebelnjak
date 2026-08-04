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
- Ob uspešni povezavi z domačim Wi-Fi lokalni provisioning pogled uporablja nevtralen izraz »naprava«, ne strojno specifičnega imena ESP32.
- Lokalni provisioning pogled ob aktivni povezavi prikaže tudi ime trenutno povezanega domačega Wi-Fi omrežja (SSID).
- Highcharts je v `web/vendor/highcharts.js`, zato grafi na lokalnem ESP32 ne potrebujejo interneta.
- Lokalna grafa uporabita dnevni SD indeks in podatke agregirata na ESP32. Če SD trenutno ni dosegljiv, ostane nadzorna plošča v lokalnem načinu in jasno prikaže napako zgodovine.
- Cloud grafa za obdobja do 7 dni bereta surove meritve, do 31 dni urne agregate, za daljša obdobja pa dnevne agregate. Tako ostaneta prenos in poraba brskalnika predvidljiva tudi pri enoletnem pogledu.
- Lokalni gumb **Ponovno sinhroniziraj zgodovino** ponastavi NVS položaj prenosa in ponovno pošlje celoten SD dnevnik. Namenjen je predvsem obnovi po ročnem brisanju Firebase baze.
- Izbirnik omogoča hitra obdobja, začetni in končni datum z urama ter X-zoomiranje obeh grafov v lokalnem in cloud pogledu. Klik na pretekli dan samodejno izbere obdobje od `00:00` do `23:59`, klik na današnji dan pa od `00:00` do trenutne ure; drugi klik lahko obdobje razširi na drug dan.
- Glavna navigacija loči poglede **Pregled**, **Grafi**, **Naprava** in **Posodobitve**; lokalni način skrije cloud prijavo in OTA upravljanje.
- Pogled **Grafi** loči temperaturo z relativno vlago od teže panja, vendar oba grafa uporabljata isto izbrano obdobje in sta zložena navpično.
- Svetla in temna tema delujeta v obeh načinih, shranjena izbira pa ostane v brskalniku. Highcharts uporablja barve aktivne teme.
- Datumi v karticah, tabeli, izbirniku obdobja in grafu so prikazani v obliki `d/m/y`; ura uporablja 24-urni zapis.
- Tooltipi grafov za temperaturo, relativno vlago in težo vrednosti prikažejo zaokrožene na eno decimalko v lokalnem in cloud načinu.
- Odzivna postavitev prilagodi navigacijo, kartice, tabelo, graf in obrazce telefonu, tablici ter namiznemu računalniku. Upravljalni elementi na dotik so visoki najmanj 44 px.
- Cloud uporabnik lahko izbrani panj odregistrira po potrditvi. Postopek odstrani samo `owner_uid` in povezavo pod `/users/{uid}/devices`; meritve, SD sinhronizacija in aktivacijska koda ostanejo nedotaknjeni, zato je panj mogoče z isto kodo ponovno registrirati.
- Po spremembi datotek v `web/` izvedi `pio run -t uploadfs`.

## OTA firmware

GitHub Actions ob tagu `vMAJOR.MINOR.PATCH-beta.N` preveri skladnost z `FIRMWARE_VERSION`, prevede firmware in LittleFS sliko, ustvari SHA-256 manifest ter v GitHub Release objavi `firmware.bin`, `littlefs.bin` in `manifest.json`.

Cloud nadzorna plošča preveri najnovejšo izdajo. Uporabnik lahko pošlje OTA ukaz ali različico prezre v svojem brskalniku. ESP32 ukaz preveri v največ 30 sekundah, ga najprej postavi v čakalno vrsto in šele nato obdela iz glavne zanke. Najprej `littlefs.bin` prenese na SD kartico in preveri SHA-256; šele nato LittleFS odklopi, datoteko po 2 KB korakih zapiše v njegovo particijo in ponovno preveri SHA-256. Nato enako preverjeno posodobi `firmware.bin` v neaktivno OTA particijo in se ob uspehu ponovno zažene. Če SD kartice ni, se celotna OTA posodobitev varno prekine pred pisanjem katerekoli particije. Manifest ima 15-sekundno omejitev. Datoteke se prenašajo prek neposredne HTTPS povezave z ročno obdelavo največ štirih GitHub preusmeritev; povezava ima 20-sekundno, HTTP glave pa 15-sekundno omejitev. Predolge nepomembne GitHub HTTP glave se med branjem varno preskočijo, preusmeritvena `Location` pa se obdela. Prehodno prazno stanje `WiFiClientSecure` ne prekine prenosa; šele 15 sekund brez podatkov pomeni napako in se zapiše v Firebase. Cloud kartica prikaže fazo, skupni napredek od 0 do 100 % in razlog napake; serijski monitor izpiše iste korake ter ciljnega OTA gostitelja. Podvojeni Firebase povratni klici za isti OTA ukaz se ignorirajo. OTA izdaja ne vsebuje Wi-Fi poverilnic, zato je ista binarna datoteka primerna za vse naprave.

Po kliku gumba **Posodobi napravo** cloud vmesnik oba OTA gumba zaklene do uspeha ali napake. Zaklep ostane aktiven tudi po osvežitvi strani, ker se določi iz stanja OTA v Firebase. Besedilo kartice prikazuje trenutno fazo in njen delež, oznaka ob vrstici napredka pa vedno pomeni skupni napredek celotne OTA posodobitve.

Prvi firmware z LittleFS OTA podporo se za že nameščene starejše beta naprave priporočeno naloži prek USB skupaj z LittleFS (`pio run -t upload` in `pio run -t uploadfs`). Starejši OTA odjemalec lahko namesti samo firmware; šele naslednja OTA izdaja nato samodejno posodobi tudi lokalno spletno stran.

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

Cloud pogled zahteva Firebase prijavo in običajnemu uporabniku pokaže samo naprave pod `/users/{firebase_uid}/devices`. Trenutni beta skrbniški UID lahko bere celotno pot `/devices` in zato samodejno vidi vse panje brez aktivacije, vendar nima dodatnih pravic za spreminjanje podatkov. Uporabnik napravo prevzame z ID-jem in aktivacijsko kodo prek Firebase pravil. ESP32 za trenutno beta testiranje ostaja anonimen zapisovalec; omejitve in produkcijski načrt sta opisana v `docs/DEVICE_OWNERSHIP.md`.
