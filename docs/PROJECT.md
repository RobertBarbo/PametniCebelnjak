# Pametni čebelnjak – tehnični opis

## Namen

Firmware na ESP32-S3 spremlja en čebelji panj. Temperaturo in relativno vlago bere BME680, težo pa HX711 z merilnimi celicami. Vsaka meritev se najprej zapiše na SD kartico, nato pa se ob dosegljivem internetu postopno sinhronizira v Firebase Realtime Database za cloud nadzorno ploščo.

## Strojna oprema

- ESP32-S3 DevKitC-1 z 16 MB QIO flash in 8 MB vgrajenega OPI PSRAM
- microSD kartica prek SPI: `CS=10`, `MOSI=11`, `SCK=12`, `MISO=13`
- BME680 prek I²C: `SDA=8`, `SCL=9`, naslov `0x76` ali `0x77`
- DS3231 RTC z rezervno baterijo na istem I²C vodilu: `SDA=8`, `SCL=9`, naslov `0x68`
- HX711 z merilnimi celicami: `DOUT=4`, `SCK=5`

PlatformIO uporablja uradni profil `esp32-s3-devkitc1-n16r8` z `qio_opi`, `BOARD_HAS_PSRAM`, 16 MB flash in `default_16MB.csv`. Shema vsebuje dve OTA aplikacijski particiji po 6,4 MB, LittleFS particijo velikosti 3,375 MB ter coredump particijo. Ob zagonu firmware preveri `psramFound()` in izpiše skupni/prosti PSRAM ter stanje notranjega heap-a. Medpomnilnik lokalne zgodovine je alociran neposredno v PSRAM; če alokacija ne uspe, meritve in cloud delovanje ostanejo aktivni, lokalna zgodovina pa jasno vrne napako.

## Meritve, čas in SD kartica

- Temperatura, relativna vlaga in teža se izmerijo takoj po zagonu, nato vsakih 10 sekund. Trenutna meritev takoj posodobi lokalni API in Firebase vejo `latest`, zato jo prikažeta lokalna in cloud nadzorna plošča.
- SD CSV dnevnik prejme skupen zapis vseh treh vrednosti enkrat na minuto. Samo ti enominutni zapisi se sinhronizirajo v Firebase zgodovino in agregate, zato grafi ne ustvarjajo nepotrebne količine podatkov.
- Če prvi zapis nastane pred NTP sinhronizacijo, se takoj po pridobitvi časa ustvari dodatna meritev z veljavnim časom za Firebase in SD dnevnik.
- Ob prvem zagonu brez shranjenega HX711 odmika mora biti merilna ploščad prazna. Firmware izvede tariranje in odmik shrani v NVS. Faktor `HX711_CALIBRATION_FACTOR=22500,0` je trenutno umerjen z referenčnima utežema `1,464 kg` in `2,470 kg` na testni merilni konstrukciji; ob spremembi mehanske izvedbe ga je treba ponovno umeriti.
- Tariranje je mogoče zahtevati v lokalnem omrežnem panelu ali cloud kartici izbranega online panja, ob upravljanju zgodovine. Pred potrditvijo mora biti ploščad prazna; lokalni AsyncTCP endpoint samo postavi ukaz v čakalno vrsto in ne kliče FirebaseClient. ESP32 tariranje v obeh primerih izvede v glavni zanki, nov HX711 odmik shrani v NVS in takoj ustvari novo trenutno meritev.
- Teža vsake meritve je povprečje `20` zaporednih vzorcev HX711. To zmanjša električni šum, ne more pa odpraviti mehanskega posedanja ali dotika panja s podlago.
- Če BME680 ali HX711 ni dosegljiv oziroma vrne neveljavno vrednost, se meritev ne zapiše na SD ali v Firebase; firmware ne ustvarja simuliranih nadomestnih podatkov.
- Ob zagonu veljaven DS3231 UTC čas takoj nastavi sistemsko uro ESP32. Meritve imajo zato pravilen datum in Unix čas tudi brez interneta; baterija RTC mora biti vstavljena in delujoča.
- Ob dosegljivem internetu NTP samodejno popravi sistemski čas in DS3231. Datum in uro je mogoče nastaviti tudi ročno prek lokalne ali cloud strani; brskalnik lokalni datum pretvori v Unix UTC čas, RTC pa vedno hrani UTC.
- Če DS3231 ni zaznan ali ima zastavico ustavljenega oscilatorja, naprava še naprej deluje. Do prve NTP ali ročne nastavitve pa absolutni datum ni znan in takih zapisov ni mogoče pravilno umestiti v koledarski graf.
- Datoteka `/measurements.csv` na SD ima glavo `date,time,unix_timestamp,temperature_c,humidity_percent,weight_kg`.
- Izpeljana datoteka `/measurements.idx` hrani začetni položaj vsakega UTC dneva. Obstoječemu CSV dnevniku se indeks ob prvem zagonu izdela samodejno, zato lokalni graf pri običajni poizvedbi bere samo zahtevani del datoteke. CSV ostaja edini izvorni zapis in indeks se lahko varno ponovno izdela.
- Ko je Firebase dosegljiv, ESP32 iz CSV dnevnika prenese eno še nepotrjeno meritev na 10 sekund. Ob napaki razmik eksponentno poveča do največ 60 sekund. V NVS vsakih 12 uspešnih zapisov shrani položaj v datoteki in zadnji sinhroniziran čas; po izpadu elektrike se lahko ponovno pošlje največ 11 meritev, kar je varno, ker Firebase uporablja Unix čas kot enolični ključ.
- Surova zgodovina se običajno pošilja samo prek SD sinhronizacije, zato isti zapis ni poslan dvakrat. Neposredni Firebase zapis se uporabi le kot rezerva, kadar meritve ni mogoče shraniti na SD.
- Med zaporednim prenosom ESP32 izdela urne in dnevne povprečne agregate. Zaključeni interval se zapiše enkrat, trenutni interval pa se osveži največ vsakih 30 minut.
- Ob prvem zagonu firmware-a z agregati se NVS kazalec enkrat samodejno vrne na začetek SD dnevnika. Obstoječi surovi ključi se varno prepišejo, hkrati pa se dopolnijo urni in dnevni podatki; naslednji zagoni nadaljujejo z običajnega shranjenega položaja.
- Zapisi z `unix_timestamp=0`, ki nastanejo pred prvim veljavnim časom iz RTC-ja, NTP-ja ali ročne nastavitve, ostanejo samo na SD kartici in niso vključeni v cloud graf.
- Stanje SD kartice se preveri vsako minuto. Ob nedosegljivi kartici se inicializacija ponovi; po petih neuspelih poskusih se stanje označi kot napaka.

## Wi-Fi provisioning in lokalni dostop

Po pridobitvi naslova domačega omrežja firmware počaka dve sekundi, nato inicializira NTP in šele po dodatnih treh sekundah dovoli Firebase promet. Zaporedni zagon prepreči prekrivanje NTP in Firebase DNS zahtev v lwIP, posebej kadar se STA povezava vzpostavi med delovanjem prek provisioning obrazca. Brez STA povezave se NTP in Firebase omrežne zahteve ne zaženejo.

Firmware je univerzalen in ne vsebuje Wi-Fi poverilnic.

1. Ob prvem zagonu oziroma ob nedosegljivem shranjenem omrežju ESP32 odpre AP `Cebelnjak-XXXXXX`.
2. Med beta testiranjem je AP odprt brez gesla. Lokalni naslov, `device_id` in aktivacijska koda se izpišejo v serijskem monitorju.
3. Uporabnik se z mobilnim telefonom poveže na AP, odpre `http://192.168.4.1/` in na obrazcu vnese domači SSID ter geslo.
4. ESP32 povezavo asinkrono preizkusi, medtem pa AP ostane aktiven in stran pokaže stanje. Podatka se v NVS shranita samo ob uspešni povezavi; ponovni zagon ni potreben.

Če povezava z domačim Wi-Fi-jem med delovanjem odpove, se AP znova vključi. Lokalna nadzorna plošča, trenutne meritve in SD zgodovina so zato dostopni tudi brez interneta. Zaradi zanesljivega oddajanja beaconov na različnih revizijah ESP32-S3 provisioning vedno uporablja kombinirani `AP+STA` način; brez poverilnic ostane STA nepovezan. AP uporablja kanal 6, pasovno širino 20 MHz, združljive protokole 802.11b/g/n, oddajno moč 19,5 dBm, statični naslov `192.168.4.1` in lasten DHCP. Wi-Fi varčevanje z energijo je izklopljeno, ker lokalni strežnik in grafi potrebujeta nizko zakasnitev; to nekoliko poveča porabo energije naprave. Watchdog AP vsakih 30 sekund preveri dejanski Wi-Fi način in lokalni naslov ter vmesnik ponovno zažene samo, če ga res ni. Ločeni STA watchdog vsakih 30 sekund sproži `WiFi.reconnect()` in po treh neuspelih poskusih znova zažene povezavo z NVS poverilnicami, AP pa med tem ostane aktiven. Ko se Wi-Fi po uspešnem preizkusu obnovi, se AP zapre. Lokalni obrazec asinkrono najde dosegljiva omrežja in lahko izbriše shranjene Wi-Fi podatke. Odprt AP je dovoljen samo za trenutno beta testiranje; produkcijska izvedba ga mora zaščititi.

`device_id` ima obliko `CB-XXXXXXXXXXXX` in je ponovljiv za isto ESP32 napravo. Aktivacijska koda je lokalna skrivnost v NVS; prikaže se na lokalni strani in v serijskem monitorju. Za Firebase-only beta registracijo jo ESP32 zapiše pod zasebno, neberljivo pot `/device_secrets/{device_id}` in zapis z isto kodo obnovi vsakih pet minut; nikoli se ne prikaže v cloud nadzorni plošči ali Git-u.

## Lokalna in cloud nadzorna plošča

Začetni lokalni pogled naloži samo HTML, CSS, aplikacijski JavaScript in kratko stanje naprave. Highcharts ter zgodovina z SD kartice se zaradi omejenih omrežnih virov ESP32 naložita zaporedno šele ob odprtju zavihka `Grafi`; lokalni HTTP odzivi po prenosu zaprejo povezavo.

Mapa `web/` je hkrati vir za Firebase Hosting in LittleFS (`data_dir`) na ESP32. PlatformIO pred prevajanjem samodejno izdela `gzip` kopije HTML, CSS in JavaScript datotek. Lokalni strežnik jih pošlje pod izvirnim URL-jem z glavo `Content-Encoding: gzip`; če jih odjemalec ne podpira ali stisnjena datoteka še ni naložena, uporabi nespremenjen izvorni zapis.

- Lokalni API in ElegantOTA uporabljata isti asinhroni strežnik na portu `80`: `/api/status`, `/api/history`, `/api/wifi`, `/api/sync/reset`, `/api/sensors/load-cell/tare`, `/api/time`, `/measurements.csv` in portal `http://<device-ip>/update`.
- Lokalni pogled najprej poskusi lokalni API; kadar ta ni dosegljiv, uporabi Firebase cloud pogled s prijavo uporabnika. Lokalni pogled ne prikaže cloud prijave ali registracije naprav, prikaže pa `device_id`, aktivacijsko kodo za kasnejšo registracijo in povezavo do ElegantOTA.
- Ob uspešni povezavi z domačim Wi-Fi lokalni provisioning pogled uporablja nevtralen izraz »naprava«, ne strojno specifičnega imena ESP32.
- Lokalni provisioning pogled ob aktivni povezavi prikaže tudi ime trenutno povezanega domačega Wi-Fi omrežja (SSID).
- Lokalni pogled **Naprava** loči Wi-Fi nastavitve od stanja sistema: zgornji Wi-Fi del ima ločeno kartico trenutno povezanega SSID-ja ter kartico z ID-jem naprave in aktivacijsko kodo. Spodnja kartica po statusnih karticah združi tariranje tehtnice, čas sistema in sinhronizacijo zgodovine; statusna mreža lokalno prikazuje IP naslov brez podvajanja SSID-ja.
- Cloud pogled **Naprava** po prijavi najprej prikaže kartico računa z izbiro oziroma registracijo panja. Upravljanje izbranega panja je ločeno v kartici podrobnosti naprave: za statusnimi karticami so tariranje tehtnice, čas sistema in **Brisanje merilne zgodovine**. Ta ima en sam ukaz, ki trajno izbriše dnevnik s SD kartice in zgodovino v Firebase; ločeno brisanje samo cloud zgodovine ni na voljo. Vsi cloud ukazi, ki jih mora izvesti ESP32 (tariranje, brisanje ter nastavljanje časa), so vidni samo po izbiri panja in onemogočeni, kadar naprava ni online.
- Po brisanju shranjenih Wi-Fi nastavitev firmware najprej ustavi STA in AP vmesnik, nato po eni sekundi brez blokiranja glavne zanke zažene odprti provisioning AP na `192.168.4.1`. Če zagon AP-ja ne uspe, ga ponovi na pet sekund, zato asinhroni dogodek odklopa ne more prekiniti novega DHCP strežnika.
- Highcharts je v `web/vendor/highcharts.js`, zato grafi na lokalnem ESP32 ne potrebujejo interneta.
- Lokalna grafa uporabita dnevni SD indeks in podatke agregirata na ESP32. `/api/history` zahtevek samo uvrsti pripravo; glavni `loop()` SD dnevnik bere v kratkih časovno omejenih korakih, history koše hrani v PSRAM in JSON postopno pripravi v začasni datoteki na SD. Frontend med odgovorom `202` počaka ter zahtevek ponovi, zato AsyncTCP callback nikoli ne izvaja dolgega skeniranja CSV. Če SD ali PSRAM trenutno ni dosegljiv, ostane nadzorna plošča v lokalnem načinu in jasno prikaže napako zgodovine.
- Cloud grafa za obdobja do 7 dni bereta surove meritve, do 31 dni urne agregate, za daljša obdobja pa dnevne agregate. Tako ostaneta prenos in poraba brskalnika predvidljiva tudi pri enoletnem pogledu.
- Lokalni gumb **Ponovno sinhroniziraj zgodovino** ponastavi NVS položaj prenosa in ponovno pošlje celoten SD dnevnik. Namenjen je predvsem obnovi po ročnem brisanju Firebase baze. Med prenosom lokalni pogled prikaže zadnji potrjeni zapis; firmware zazna izgubljeno ali predolgo čakajočo Firebase asinhrono zahtevo, jo prekine in nadaljuje z varnim ponovnim poskusom.
- Izbirnik omogoča hitra obdobja, začetni in končni datum z urama ter X-zoomiranje obeh grafov v lokalnem in cloud pogledu. Klik na pretekli dan samodejno izbere obdobje od `00:00` do `23:59`, klik na današnji dan pa od `00:00` do trenutne ure; drugi klik lahko obdobje razširi na drug dan.
- Glavna navigacija loči poglede **Pregled**, **Grafi**, **Naprava** in **Posodobitve**; lokalni način skrije cloud prijavo in OTA upravljanje.
- Pogled **Grafi** loči temperaturo z relativno vlago od teže panja, vendar oba grafa uporabljata isto izbrano obdobje in sta zložena navpično.
- Svetla in temna tema delujeta v obeh načinih, shranjena izbira pa ostane v brskalniku. Highcharts uporablja barve aktivne teme.
- Datumi v karticah, tabeli, izbirniku obdobja in grafu so prikazani v obliki `d/m/y`; ura uporablja 24-urni zapis.
- Vsi prikazi meritev, vključno s tooltipi grafov, temperaturo, relativno vlago in težo prikažejo na eno decimalko v lokalnem in cloud načinu. SD in Firebase še vedno hranita težo na dve decimalki za poznejše analize.
- Graf za obdobja do 24 ur uporablja minutne točke; daljša obdobja ostanejo agregirana na urne, šesturne oziroma dnevne točke.
- Zgornji cloud indikator prikazuje stanje izbranega panja glede na `status/device/last_seen_timestamp`: `Naprava online` do 90 sekund po odzivu, sicer `Naprava offline`. To ni več indikator povezave brskalnika s Firebase.
- Na telefonu je v glavi namesto besedila indikatorja prikazana le zelena oziroma rdeča pika; lokalni pogled uporablja zeleno piko za uspešno lokalno povezavo z napravo.
- Odzivna postavitev prilagodi navigacijo, kartice, tabelo, graf in obrazce telefonu, tablici ter namiznemu računalniku. Upravljalni elementi na dotik so visoki najmanj 44 px.
- Pogled **Naprava** prikazuje trenutni datum in uro, vir časa ter stanje DS3231. Lokalno ali za izbrani online cloud panj lahko uporabnik nastavi datum in uro; NTP gumb je omogočen samo ob internetni povezavi.
- Cloud uporabnik lahko izbrani panj odregistrira po potrditvi. Postopek odstrani samo `owner_uid` in povezavo pod `/users/{uid}/devices`; meritve, SD sinhronizacija in aktivacijska koda ostanejo nedotaknjeni, zato je panj mogoče z isto kodo ponovno registrirati.
- Navaden cloud uporabnik ob izbiri svojih panjev ohrani obrazec za registracijo novega panja. Glavni skrbnik namesto njega vidi klikabilen pregled vseh naprava z zeleno/rdečo oznako online stanja in z njim izbere panj za upravljanje.
- V cloud pogledu lahko lastnik ali glavni skrbnik po potrditvi z besedo `IZBRIŠI` počisti samo Firebase zgodovino (`latest`, `measurements`, `aggregates`) ali pošlje ukaz za trajni izbris SD dnevnika skupaj s cloud zgodovino. Popoln izbris je omogočen le za online napravo; ESP32 ukaz postavi v čakalno vrsto, dokler ne zaključi trenutnega SD prenosa, nato znova ustvari prazen CSV dnevnik in ponastavi kazalce sinhronizacije. Lokalni pogled te nevarne funkcije namenoma ne ponuja brez cloud prijave.
- Po spremembi datotek v `web/` izvedi `pio run -t uploadfs`.

## OTA firmware

GitHub Actions ob tagu `vMAJOR.MINOR.PATCH-beta.N` preveri skladnost z `FIRMWARE_VERSION`, prevede firmware in LittleFS sliko, ustvari SHA-256 manifest ter v GitHub Release objavi `firmware.bin`, `littlefs.bin` in `manifest.json`.

Cloud nadzorna plošča preveri najnovejšo izdajo. Uporabnik lahko pošlje OTA ukaz ali različico prezre v svojem brskalniku. ESP32 ukaz preveri v največ 30 sekundah, ga najprej postavi v čakalno vrsto in šele nato obdela iz glavne zanke. Prazno preverjanje ukaza ostane tiho v serijskem monitorju. Najprej `littlefs.bin` prenese na SD kartico in preveri SHA-256; šele nato LittleFS odklopi, datoteko po 2 KB korakih zapiše v njegovo particijo in ponovno preveri SHA-256. Nato enako preverjeno posodobi `firmware.bin` v neaktivno OTA particijo in se ob uspehu ponovno zažene. Če SD kartice ni, se celotna OTA posodobitev varno prekine pred pisanjem katerekoli particije. Manifest ima 15-sekundno omejitev. Datoteke se prenašajo prek neposredne HTTPS povezave z ročno obdelavo največ štirih GitHub preusmeritev; povezava ima 20-sekundno, HTTP glave pa 15-sekundno omejitev. Predolge nepomembne GitHub HTTP glave se med branjem varno preskočijo, preusmeritvena `Location` pa se obdela. Prehodno prazno stanje `WiFiClientSecure` ne prekine prenosa; šele 15 sekund brez podatkov pomeni napako in se zapiše v Firebase. Cloud kartica prikaže fazo, skupni napredek od 0 do 100 % in razlog napake; serijski monitor izpiše iste korake ter ciljnega OTA gostitelja. Podvojeni Firebase povratni klici za isti OTA ukaz se ignorirajo. OTA izdaja ne vsebuje Wi-Fi poverilnic, zato je ista binarna datoteka primerna za vse naprave.

Če uporabnik ni prijavljen ali ne izbere panja, cloud OTA kartica ostane skrita brez dodatnega praznega obvestila.

Po kliku gumba **Posodobi napravo** cloud vmesnik oba OTA gumba zaklene do uspeha ali napake. Zaklep ostane aktiven tudi po osvežitvi strani, ker se določi iz stanja OTA v Firebase. Besedilo kartice prikazuje trenutno fazo in njen delež, oznaka ob vrstici napredka pa vedno pomeni skupni napredek celotne OTA posodobitve.

Lokalni pogled v zavihku **Posodobitve** odpre ElegantOTA 3.1.7 na naslovu `http://<device-ip>/update`. Glavna nadzorna plošča, API in ElegantOTA uporabljajo isti asinhroni `ESPAsyncWebServer` na portu `80`; zato ne obstaja več ločena sinhrona zanka na portu `8080`. Pred začetkom se LittleFS odklopi, ker se med posodobitvijo njegove particije ne sme hkrati brati; vgrajeni ElegantOTA portal ostane dosegljiv brez LittleFS. Firmware ne čaka samo na končni HTTP callback: ko `Update` po zadnjem bajtu ni več aktiven in nima napake, sam razporedi ponovni zagon. Tako se uspešno zapisana particija aktivira tudi ob prekinjenem zaključnem odgovoru brskalniku. Ob napaki se datotečni sistem ponovno priklopi. Vsaka datoteka se namesti posebej; SD kartica, Firebase in internet niso potrebni. Ročni postopek nima GitHub manifesta in SHA-256 preverjanja, zato se smejo uporabiti samo zaupanja vredne datoteke za `esp32-s3-devkitc-1`, po možnosti iz iste GitHub Release izdaje. Odprtokodna ElegantOTA je licencirana pod AGPL-3.0; pred zaprto komercialno distribucijo je treba preveriti licenčne obveznosti ali uporabiti ustrezno Pro licenco. Med odprtim beta AP-jem lahko portal uporabi vsak povezan odjemalec, zato je treba pred produkcijo zaščititi AP in ElegantOTA dostop.

Prvi firmware z LittleFS OTA podporo se za že nameščene starejše beta naprave priporočeno naloži prek USB skupaj z LittleFS (`pio run -t upload` in `pio run -t uploadfs`). Starejši OTA odjemalec lahko namesti samo firmware; šele naslednja OTA izdaja nato samodejno posodobi tudi lokalno spletno stran.

Beta.68 prvič preklopi iz 8 MB na `default_16MB.csv` particijsko shemo. Ker navaden OTA ne posodobi particijske tabele, je za ta prehod obvezen enkraten USB prenos z `pio run -e esp32s3 -t upload` in nato `pio run -e esp32s3 -t uploadfs`. Nadaljnje izdaje lahko znova uporabljajo OTA, dokler shema ostane enaka.

Za razvojni prenos neposredno iz PlatformIO je na voljo tudi ArduinoOTA na vratih `3232`. Okolje `esp32s3_ota` uporabi `upload_protocol = espota`; lokalna, Git-ignorirana datoteka `platformio.local.ini` vsebuje `upload_port` in prazno polje `custom_ota_password` za aktivacijsko kodo naprave. V beta fazi je geslo trenutna lokalna aktivacijska koda naprave. Okoljska spremenljivka `ESP32_OTA_PASSWORD` ostane rezervna možnost. ArduinoOTA se zažene samo ob povezavi v domače Wi-Fi omrežje, sprejme firmware ali LittleFS in med prejemom ustavi redna opravila, ker `Update` teče. Ob LittleFS napaki firmware datotečni sistem ponovno priklopi. Pred produkcijo naj ima vsaka naprava ločeno, močnejše OTA geslo ali drug avtentikacijski mehanizem.

Če Firebase DNS ali TLS povezava odpove, firmware zaporedne omrežne napake zazna in nove Firebase zahteve začasno zaustavi: najprej za 30 sekund, nato z naraščajočim odmorom do štiri minute. Posamezno opravilo ima 12-sekundno omejitev; po njej se TLS povezava zapre in čakalna vrsta varno ponastavi. SD beleženje, lokalna stran, meritve in Wi-Fi ostanejo pri tem aktivni. Sinhronizacija SD zgodovine uporablja desetsekundni tempo, da ob večji zgodovini ne zasiči omrežja.

FirebaseClient ima varnostno omejitev asinhrone vrste štirih zahtev (`FIREBASE_ASYNC_QUEUE_LIMIT=4`), aplikacija pa zaradi stabilnosti hkrati dovoli samo eno dejansko zahtevo. Naslednji status, meritev ali SD sinhronizacija počaka na zaključek trenutnega opravila, zato počasna povezava ne more napolniti vrste in sprožiti preklica starejšega opravila.

`app.loop()` za Firebase se izvaja največ vsakih 50 ms in teče tudi med odmorom za dodajanje novih zahtev, da lahko zaključi obstoječe opravilo. AsyncTCP lokalnega strežnika teče na aplikacijskem jedru 1 z izvirnimi priporočenimi nastavitvami prioritete, vrste in ACK časa. Ob zahtevi za statično lokalno datoteko imajo nove cloud zahteve deset sekund premora, aktivna Firebase/TLS povezava pa se ne prekine. Hard cancel ostane samo za dejansko izgubo Wi-Fi/IP povezave ali 12-sekundni timeout Firebase opravila.

Vsakih 15 sekund Serial izpiše vrstico `[SYS]` z notranjim heap-om, zgodovinskim minimumom, največjim prostim notranjim blokom, prostim PSRAM, ločenim STA/AP stanjem in IP naslovoma, RSSI, številom AP odjemalcev, številom Firebase opravil in lokalno HTTP prioriteto. Diagnostika je namenjena predvsem preverjanju fragmentacije med hitrim osveževanjem strani, odpiranjem grafov in TLS ponovnimi povezavami.

## Trenutni Firebase podatkovni model

Upravljavski ukaz za izbris zgodovine se izvaja strogo zaporedno. Firmware najprej objavi stanje, varno ponastavi SD dnevnik, nato po eno izbriše `latest`, surove meritve ter urne in dnevne agregate, objavi zaključek in nazadnje odstrani ukaz. Med tem tokom ne dodaja drugih Firebase opravil.

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
    device/{device_id,station_ssid,ip_address,wifi_rssi_dbm,uptime_days,uptime_hours,uptime_minutes,uptime_total_minutes,last_seen_timestamp,current_time_timestamp,time_source,rtc_present,rtc_valid,ntp_sync_pending,last_time_sync_timestamp}
    ota/{state,current_version,target_version,message,progress_percent,updated_at}
    history/{state,message,updated_at}
    load_cell/{state,message,updated_at}
  commands/
    firmware_update/{action,target_version?,requested_at}
    time/{action,timestamp?,requested_at}

/users/{firebase_uid}/devices/{device_id}/
  display_name
  claimed_at

/device_secrets/{device_id}/activation_code
/device_claims/{device_id}/{firebase_uid}/activation_code
```

Cloud pogled zahteva Firebase prijavo in običajnemu uporabniku pokaže samo naprave pod `/users/{firebase_uid}/devices`. Trenutni beta skrbniški UID lahko bere celotno pot `/devices` in zato samodejno vidi vse panje brez aktivacije; lahko tudi počisti merilno zgodovino izbranega panja, ne more pa spreminjati lastništva ali zasebnih aktivacijskih podatkov. Popoln izbris uporabi akcijo `delete_history`, cloud tariranje pa akcijo `tare_load_cell` v obstoječem ukazu `commands/firmware_update`, zato ju firmware preveri z istim zanesljivim 30-sekundnim ciklom kot OTA. Pred tariranjem firmware ukaz najprej odstrani, nato iz glavne zanke objavi končni uspeh ali napako; tako se Firebase zahteve ne prekrivajo. Uporabnik napravo prevzame z ID-jem in aktivacijsko kodo prek Firebase pravil. ESP32 za trenutno beta testiranje ostaja anonimen zapisovalec; omejitve in produkcijski načrt sta opisana v `docs/DEVICE_OWNERSHIP.md`.

Če cloud status tariranja ostane `queued` ali `taring` več kot 90 sekund, nadzorna plošča ga označi kot nedokončanega in ponovno omogoči gumb. Ob vsakem zagonu ESP32 objavi začetno stanje HX711, zato se zastarelo stanje prejšnjega zagona ponastavi.
