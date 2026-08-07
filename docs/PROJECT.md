# Pametni čebelnjak – tehnični opis

## Namen

Firmware na ESP32-S3 spremlja en čebelji panj. Temperaturo in relativno vlago bere BME680, težo pa HX711 z merilnimi celicami. Vsaka meritev se najprej zapiše na SD kartico, nato pa se ob dosegljivem internetu postopno sinhronizira v Firebase Realtime Database za cloud nadzorno ploščo.

## Strojna oprema

- ESP32-S3 DevKitC-1
- microSD kartica prek SPI: `CS=10`, `MOSI=11`, `SCK=12`, `MISO=13`
- BME680 prek I²C: `SDA=8`, `SCL=9`, naslov `0x76` ali `0x77`
- HX711 z merilnimi celicami: `DOUT=4`, `SCK=5`

## Meritve, čas in SD kartica

- Temperatura, relativna vlaga in teža se izmerijo takoj po zagonu, nato vsakih 10 sekund. Trenutna meritev takoj posodobi lokalni API in Firebase vejo `latest`, zato jo prikažeta lokalna in cloud nadzorna plošča.
- SD CSV dnevnik prejme skupen zapis vseh treh vrednosti enkrat na minuto. Samo ti enominutni zapisi se sinhronizirajo v Firebase zgodovino in agregate, zato grafi ne ustvarjajo nepotrebne količine podatkov.
- Če prvi zapis nastane pred NTP sinhronizacijo, se takoj po pridobitvi časa ustvari dodatna meritev z veljavnim časom za Firebase in SD dnevnik.
- Ob prvem zagonu brez shranjenega HX711 odmika mora biti merilna ploščad prazna. Firmware izvede tariranje in odmik shrani v NVS. Faktor `HX711_CALIBRATION_FACTOR=22500,0` je trenutno umerjen z referenčnima utežema `1,464 kg` in `2,470 kg` na testni merilni konstrukciji; ob spremembi mehanske izvedbe ga je treba ponovno umeriti.
- Tariranje je mogoče zahtevati v lokalnem omrežnem panelu ali cloud kartici izbranega online panja, ob upravljanju zgodovine. Pred potrditvijo mora biti ploščad prazna; ESP32 tariranje izvede v glavni zanki, nov HX711 odmik shrani v NVS in takoj ustvari novo trenutno meritev.
- Teža vsake meritve je povprečje `20` zaporednih vzorcev HX711. To zmanjša električni šum, ne more pa odpraviti mehanskega posedanja ali dotika panja s podlago.
- Če BME680 ali HX711 ni dosegljiv oziroma vrne neveljavno vrednost, se meritev ne zapiše na SD ali v Firebase; firmware ne ustvarja simuliranih nadomestnih podatkov.
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

Če povezava z domačim Wi-Fi-jem med delovanjem odpove, se AP znova vključi. Lokalna nadzorna plošča, trenutne meritve in SD zgodovina so zato dostopni tudi brez interneta. Wi-Fi varčevanje z energijo je izklopljeno, ker lokalni strežnik in grafi potrebujeta nizko zakasnitev; to nekoliko poveča porabo energije naprave. Watchdog vsakih 30 sekund sproži `WiFi.reconnect()`; po treh neuspelih poskusih znova zažene STA povezavo z NVS poverilnicami, AP pa med tem ostane aktiven. Ko se Wi-Fi po uspešnem preizkusu obnovi, se AP zapre. Lokalni obrazec asinkrono najde dosegljiva omrežja in lahko izbriše shranjene Wi-Fi podatke. Odprt AP je dovoljen samo za trenutno beta testiranje; produkcijska izvedba ga mora zaščititi.

`device_id` ima obliko `CB-XXXXXXXXXXXX` in je ponovljiv za isto ESP32 napravo. Aktivacijska koda je lokalna skrivnost v NVS; prikaže se na lokalni strani in v serijskem monitorju. Za Firebase-only beta registracijo jo ESP32 zapiše pod zasebno, neberljivo pot `/device_secrets/{device_id}` in zapis z isto kodo obnovi vsakih pet minut; nikoli se ne prikaže v cloud nadzorni plošči ali Git-u.

## Lokalna in cloud nadzorna plošča

Mapa `web/` je hkrati vir za Firebase Hosting in LittleFS (`data_dir`) na ESP32.

- Lokalni API in ElegantOTA uporabljata isti asinhroni strežnik na portu `80`: `/api/status`, `/api/history`, `/api/wifi`, `/api/sync/reset`, `/api/sensors/load-cell/tare`, `/measurements.csv` in portal `http://<device-ip>/update`.
- Lokalni pogled najprej poskusi lokalni API; kadar ta ni dosegljiv, uporabi Firebase cloud pogled s prijavo uporabnika. Lokalni pogled ne prikaže cloud prijave ali registracije naprav, prikaže pa `device_id`, aktivacijsko kodo za kasnejšo registracijo in povezavo do ElegantOTA.
- Ob uspešni povezavi z domačim Wi-Fi lokalni provisioning pogled uporablja nevtralen izraz »naprava«, ne strojno specifičnega imena ESP32.
- Lokalni provisioning pogled ob aktivni povezavi prikaže tudi ime trenutno povezanega domačega Wi-Fi omrežja (SSID).
- Highcharts je v `web/vendor/highcharts.js`, zato grafi na lokalnem ESP32 ne potrebujejo interneta.
- Lokalna grafa uporabita dnevni SD indeks in podatke agregirata na ESP32. Pri velikih odgovorih, kot je cel dan minutnih točk, ESP32 JSON najprej pripravi v začasni datoteki na SD in ga nato pretočno pošlje brskalniku; s tem ne izčrpa delovnega pomnilnika. Če SD trenutno ni dosegljiv, ostane nadzorna plošča v lokalnem načinu in jasno prikaže napako zgodovine.
- Cloud grafa za obdobja do 7 dni bereta surove meritve, do 31 dni urne agregate, za daljša obdobja pa dnevne agregate. Tako ostaneta prenos in poraba brskalnika predvidljiva tudi pri enoletnem pogledu.
- Lokalni gumb **Ponovno sinhroniziraj zgodovino** ponastavi NVS položaj prenosa in ponovno pošlje celoten SD dnevnik. Namenjen je predvsem obnovi po ročnem brisanju Firebase baze.
- Izbirnik omogoča hitra obdobja, začetni in končni datum z urama ter X-zoomiranje obeh grafov v lokalnem in cloud pogledu. Klik na pretekli dan samodejno izbere obdobje od `00:00` do `23:59`, klik na današnji dan pa od `00:00` do trenutne ure; drugi klik lahko obdobje razširi na drug dan.
- Glavna navigacija loči poglede **Pregled**, **Grafi**, **Naprava** in **Posodobitve**; lokalni način skrije cloud prijavo in OTA upravljanje.
- Pogled **Grafi** loči temperaturo z relativno vlago od teže panja, vendar oba grafa uporabljata isto izbrano obdobje in sta zložena navpično.
- Svetla in temna tema delujeta v obeh načinih, shranjena izbira pa ostane v brskalniku. Highcharts uporablja barve aktivne teme.
- Datumi v karticah, tabeli, izbirniku obdobja in grafu so prikazani v obliki `d/m/y`; ura uporablja 24-urni zapis.
- Vsi prikazi meritev, vključno s tooltipi grafov, temperaturo, relativno vlago in težo prikažejo na eno decimalko v lokalnem in cloud načinu. SD in Firebase še vedno hranita težo na dve decimalki za poznejše analize.
- Graf za obdobja do 24 ur uporablja minutne točke; daljša obdobja ostanejo agregirana na urne, šesturne oziroma dnevne točke.
- Zgornji cloud indikator prikazuje stanje izbranega panja glede na `status/device/last_seen_timestamp`: `Naprava online` do 90 sekund po odzivu, sicer `Naprava offline`. To ni več indikator povezave brskalnika s Firebase.
- Odzivna postavitev prilagodi navigacijo, kartice, tabelo, graf in obrazce telefonu, tablici ter namiznemu računalniku. Upravljalni elementi na dotik so visoki najmanj 44 px.
- Cloud uporabnik lahko izbrani panj odregistrira po potrditvi. Postopek odstrani samo `owner_uid` in povezavo pod `/users/{uid}/devices`; meritve, SD sinhronizacija in aktivacijska koda ostanejo nedotaknjeni, zato je panj mogoče z isto kodo ponovno registrirati.
- V cloud pogledu lahko lastnik ali glavni skrbnik po potrditvi z besedo `IZBRIŠI` počisti samo Firebase zgodovino (`latest`, `measurements`, `aggregates`) ali pošlje ukaz za trajni izbris SD dnevnika skupaj s cloud zgodovino. Popoln izbris je omogočen le za online napravo; ESP32 ukaz postavi v čakalno vrsto, dokler ne zaključi trenutnega SD prenosa, nato znova ustvari prazen CSV dnevnik in ponastavi kazalce sinhronizacije. Lokalni pogled te nevarne funkcije namenoma ne ponuja brez cloud prijave.
- Po spremembi datotek v `web/` izvedi `pio run -t uploadfs`.

## OTA firmware

GitHub Actions ob tagu `vMAJOR.MINOR.PATCH-beta.N` preveri skladnost z `FIRMWARE_VERSION`, prevede firmware in LittleFS sliko, ustvari SHA-256 manifest ter v GitHub Release objavi `firmware.bin`, `littlefs.bin` in `manifest.json`.

Cloud nadzorna plošča preveri najnovejšo izdajo. Uporabnik lahko pošlje OTA ukaz ali različico prezre v svojem brskalniku. ESP32 ukaz preveri v največ 30 sekundah, ga najprej postavi v čakalno vrsto in šele nato obdela iz glavne zanke. Prazno preverjanje ukaza ostane tiho v serijskem monitorju. Najprej `littlefs.bin` prenese na SD kartico in preveri SHA-256; šele nato LittleFS odklopi, datoteko po 2 KB korakih zapiše v njegovo particijo in ponovno preveri SHA-256. Nato enako preverjeno posodobi `firmware.bin` v neaktivno OTA particijo in se ob uspehu ponovno zažene. Če SD kartice ni, se celotna OTA posodobitev varno prekine pred pisanjem katerekoli particije. Manifest ima 15-sekundno omejitev. Datoteke se prenašajo prek neposredne HTTPS povezave z ročno obdelavo največ štirih GitHub preusmeritev; povezava ima 20-sekundno, HTTP glave pa 15-sekundno omejitev. Predolge nepomembne GitHub HTTP glave se med branjem varno preskočijo, preusmeritvena `Location` pa se obdela. Prehodno prazno stanje `WiFiClientSecure` ne prekine prenosa; šele 15 sekund brez podatkov pomeni napako in se zapiše v Firebase. Cloud kartica prikaže fazo, skupni napredek od 0 do 100 % in razlog napake; serijski monitor izpiše iste korake ter ciljnega OTA gostitelja. Podvojeni Firebase povratni klici za isti OTA ukaz se ignorirajo. OTA izdaja ne vsebuje Wi-Fi poverilnic, zato je ista binarna datoteka primerna za vse naprave.

Po kliku gumba **Posodobi napravo** cloud vmesnik oba OTA gumba zaklene do uspeha ali napake. Zaklep ostane aktiven tudi po osvežitvi strani, ker se določi iz stanja OTA v Firebase. Besedilo kartice prikazuje trenutno fazo in njen delež, oznaka ob vrstici napredka pa vedno pomeni skupni napredek celotne OTA posodobitve.

Lokalni pogled v zavihku **Posodobitve** odpre ElegantOTA 3.1.7 na naslovu `http://<device-ip>/update`. Glavna nadzorna plošča, API in ElegantOTA uporabljajo isti asinhroni `ESPAsyncWebServer` na portu `80`; zato ne obstaja več ločena sinhrona zanka na portu `8080`. Pred začetkom se LittleFS odklopi, ker se med posodobitvijo njegove particije ne sme hkrati brati; vgrajeni ElegantOTA portal ostane dosegljiv brez LittleFS. Firmware ne čaka samo na končni HTTP callback: ko `Update` po zadnjem bajtu ni več aktiven in nima napake, sam razporedi ponovni zagon. Tako se uspešno zapisana particija aktivira tudi ob prekinjenem zaključnem odgovoru brskalniku. Ob napaki se datotečni sistem ponovno priklopi. Vsaka datoteka se namesti posebej; SD kartica, Firebase in internet niso potrebni. Ročni postopek nima GitHub manifesta in SHA-256 preverjanja, zato se smejo uporabiti samo zaupanja vredne datoteke za `esp32-s3-devkitc-1`, po možnosti iz iste GitHub Release izdaje. Odprtokodna ElegantOTA je licencirana pod AGPL-3.0; pred zaprto komercialno distribucijo je treba preveriti licenčne obveznosti ali uporabiti ustrezno Pro licenco. Med odprtim beta AP-jem lahko portal uporabi vsak povezan odjemalec, zato je treba pred produkcijo zaščititi AP in ElegantOTA dostop.

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
    history/{state,message,updated_at}
    load_cell/{state,message,updated_at}
  commands/
    firmware_update/{action,target_version?,requested_at}

/users/{firebase_uid}/devices/{device_id}/
  display_name
  claimed_at

/device_secrets/{device_id}/activation_code
/device_claims/{device_id}/{firebase_uid}/activation_code
```

Cloud pogled zahteva Firebase prijavo in običajnemu uporabniku pokaže samo naprave pod `/users/{firebase_uid}/devices`. Trenutni beta skrbniški UID lahko bere celotno pot `/devices` in zato samodejno vidi vse panje brez aktivacije; lahko tudi počisti merilno zgodovino izbranega panja, ne more pa spreminjati lastništva ali zasebnih aktivacijskih podatkov. Popoln izbris uporabi akcijo `delete_history` v obstoječem ukazu `commands/firmware_update`, zato jo firmware preveri z istim zanesljivim 30-sekundnim ciklom kot OTA. Uporabnik napravo prevzame z ID-jem in aktivacijsko kodo prek Firebase pravil. ESP32 za trenutno beta testiranje ostaja anonimen zapisovalec; omejitve in produkcijski načrt sta opisana v `docs/DEVICE_OWNERSHIP.md`.
