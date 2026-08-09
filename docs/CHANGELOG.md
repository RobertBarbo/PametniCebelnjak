# Changelog

Vse pomembne spremembe projekta so dokumentirane v tej datoteki.

## Unreleased

## [0.1.0-beta.82] - 2026-08-09

### Fixed

- Sinhronizacija SD zgodovine v Firebase samodejno obnovi zataknjeno asinhrono zahtevo, zato zastavica prenosa ne more ostati trajno aktivna.

### Changed

- Lokalni pogled med prenosom zgodovine prikaže čas zadnjega potrjenega zapisa v Firebase.

## [0.1.0-beta.81] - 2026-08-09

### Changed

- Cloud upravljanje zgodovine ima en sam ukaz za trajni izbris meritev s SD kartice in iz Firebase; ločeno brisanje samo cloud zgodovine je odstranjeno.
- Naslov upravljanja je preimenovan v **Brisanje merilne zgodovine** in jasno opozori, da dejanja ni mogoče razveljaviti.

### Fixed

- Cloud gumbi za tariranje tehtnice, brisanje merilne zgodovine ter ročno in NTP nastavitev časa so onemogočeni, kadar izbrani panj ni online.

## [0.1.0-beta.80] - 2026-08-09

### Changed

- Cloud pogled **Naprava** ima kartico računa na vrhu. Iz nje sta odstranjena tariranje tehtnice in upravljanje merilne zgodovine.
- Po izbiri panja cloud kartica **Podrobnosti naprave** po statusnih karticah prikaže tariranje tehtnice, čas sistema in nevarno območje za merilno zgodovino.

## [0.1.0-beta.79] - 2026-08-09

### Changed

- Lokalni pogled **Naprava** ima ločeno Wi‑Fi kartico. V kartici podrobnosti so po vrstnem redu stanje naprave, lokalno tariranje tehtnice, nastavitev časa in sinhronizacija zgodovine.
- Lokalni Wi‑Fi del ima ločeno kartico trenutno povezanega SSID-ja; kartica podrobnosti naprave zato prikazuje samo IP naslov. ID naprave in aktivacijska koda sta v svoji ločeni kartici.

## [0.1.0-beta.78] - 2026-08-09

### Removed

- Odstranjeno je odvečno cloud OTA obvestilo o prijavi in izbiri naprave; prikaz OTA kartice že jasno sledi izbranemu panju.

## [0.1.0-beta.77] - 2026-08-09

### Fixed

- Cloud vmesnik po 90 sekundah nedokončano stanje tariranja označi kot poteklo in znova omogoči gumb.
- ESP32 po ponovnem zagonu objavi začetno stanje tehtnice, zato v Firebase ne ostane zastarel zapis `taring`.

## [0.1.0-beta.76] - 2026-08-09

### Added

- Mobilna glava lokalne in cloud nadzorne plošče prikaže samo zeleno oziroma rdečo piko stanja naprave; besedilo indikatorja ostane skrito.

## [0.1.0-beta.75] - 2026-08-09

### Fixed

- Cloud ukaz za tariranje tehtnice se najprej odstrani iz Firebase, končni status pa ESP32 objavi šele po izvedbi. Firebase zahtevi se zato ne moreta več medsebojno preklicati.

## [0.1.0-beta.74] - 2026-08-09

### Added

- Kartica stanja ESP32 pred besedilom prikaže zeleno piko za online oziroma rdečo za offline stanje.
- Super admin namesto obrazca za registracijo vidi klikabilen pregled vseh panjev z zelenim/rdečim statusom; navaden uporabnik obdrži obrazec za registracijo panja.

## [0.1.0-beta.73] - 2026-08-09

### Added

- Cloud kartice naprave najprej prikažejo SSID domačega Wi-Fi omrežja, nato IP naslov, signal, uptime, online stanje, firmware, ID naprave in SD kartico.

### Changed

- ESP32 objavi trenutno povezani `station_ssid` skupaj z ostalim stanjem naprave v Firebase `status/device`.

## [0.1.0-beta.72] - 2026-08-09

### Added

- Podpora za DS3231 na skupnem I²C vodilu `SDA=8`, `SCL=9` obnovi veljaven UTC čas ob zagonu tudi brez interneta.
- Lokalna in cloud nadzorna plošča prikazujeta trenutni vir časa, stanje RTC-ja ter omogočata ročno nastavitev datuma in ure ali zahtevano NTP sinhronizacijo.
- Lokalni endpoint `/api/time` in Firebase ukaz `commands/time` izvajata časovne operacije varno v glavni zanki.

### Changed

- Uspešna NTP ali ročna časovna nastavitev poleg sistemske ure posodobi tudi DS3231 in počisti njegovo zastavico ustavljenega oscilatorja.
- Status naprave v Firebase vsebuje vir časa, stanje RTC-ja, trenutni čas in čas zadnje sinhronizacije.

## [0.1.0-beta.71] - 2026-08-09

### Changed

- Omrežne cloud storitve se po pridobitvi STA naslova zaženejo zaporedno: po stabilizaciji povezave se najprej inicializira NTP, Firebase pa šele po kratkem varnostnem zamiku.

### Fixed

- Odpravljeno je lwIP sesutje `udp_new_ip_type` po uspešnem vnosu Wi-Fi podatkov prek provisioning strani, ki ga je povzročilo prekrivanje NTP in Firebase DNS zahtev.

## [0.1.0-beta.70] - 2026-08-09

### Changed

- Provisioning AP na ESP32-S3 vedno uporablja kombinirani `AP+STA` način; brez shranjenih poverilnic STA ostane nepovezan in ne ustvarja internetnega prometa.
- PlatformIO uporablja uradni profil `esp32-s3-devkitc1-n16r8` namesto generičnega N8 profila z ročnimi pomnilniškimi preglasitvami.

### Fixed

- Odpravljen je primer, ko je gonilnik čisti AP vmesnik označil kot aktiven, njegovega BSSID-ja pa telefon in računalnik nista zaznala v radijskem skenu.

## [0.1.0-beta.69] - 2026-08-09

### Changed

- Provisioning AP uporablja kanal 6, 20 MHz način, združljive protokole 802.11b/g/n in največjo dovoljeno oddajno moč 19,5 dBm.
- Periodična diagnostika ločeno prikazuje stanje STA in AP vmesnika, oba IP naslova ter število odjemalcev AP-ja.

### Fixed

- Zagon provisioning AP-ja eksplicitno nastavi radijske parametre, zato nova ESP32-S3 ploščica ne podeduje nezdružljivih nastavitev prejšnjega Wi-Fi načina.

## [0.1.0-beta.68] - 2026-08-09

### Added

- Zagonska diagnostika izpiše zaznavo, skupno in prosto velikost PSRAM ter stanje notranjega heap-a.
- Periodični 15-sekundni izpis `[SYS]` spremlja notranji heap, največji prosti blok, PSRAM, Wi-Fi, RSSI, IP, Firebase opravila in prioriteto lokalnega HTTP.

### Changed

- PlatformIO zdaj uporablja dejansko strojno konfiguracijo 16 MB QIO flash in 8 MB OPI PSRAM (`qio_opi`) ter standardno `default_16MB.csv` shemo z dvema 6,4 MB OTA particijama in 3,375 MB LittleFS particijo.
- Med nalaganjem lokalnih datotek se ustavi samo razporejanje novih Firebase zahtev; aktivna TLS zahteva in `app.loop()` tečeta naprej.
- Lokalna zgodovina se bere in JSON pripravlja postopno v glavni zanki, frontend pa med pripravo varno ponavlja isti `/api/history` zahtevek.
- Velik medpomnilnik 1441 lokalnih history košev je prestavljen iz notranjega heap-a v PSRAM.
- Kratek Wi-Fi odklop ima trisekundni debounce, preden firmware povezavo razglasi za izgubljeno in odpre fallback AP.

### Fixed

- Popravljen je napačen PlatformIO define v dejansko podprti `FIREBASE_ASYNC_QUEUE_LIMIT=4`.
- Odpiranje ali hitro osveževanje lokalne strani ne kliče več `asyncClient.stopAsync(true)` in `sslClient.stop()`.
- Dolgo branje SD dnevnika ne teče več v AsyncTCP callbacku in zato ne blokira lokalnega strežnika.

## [0.1.0-beta.67] - 2026-08-07

### Changed

- Brisanje SD in cloud zgodovine zdaj uporablja zaporedni state machine: vsaka Firebase operacija se začne šele po potrditvi prejšnje.
- Med brisanjem zgodovine so običajne Firebase objave začasno ustavljene, zato se ne morejo vriniti med posamezne korake.
- Zagonski izpis jasno pove, da je Firebase odjemalec samo konfiguriran; uspešne zapise še vedno potrjujejo izpisi `Firebase write complete`.

### Fixed

- Ukaz za brisanje zgodovine ne ustvari več osmih sočasnih Firebase opravil in zato ne povzroča verige napak `operation was cancelled (-118)` ter večminutnega odmora.

## [0.1.0-beta.66] - 2026-08-07

### Changed

- Lokalna nadzorna plošča Highcharts in SD zgodovino naloži šele ob odprtju zavihka `Grafi`, zato začetni prikaz ne sproži več več velikih vzporednih prenosov.
- Lokalni HTTP odzivi po končanem prenosu zaprejo povezavo in tako preprečijo kopičenje povezav brskalnika na ESP32.

### Fixed

- Odpravljeno je dvojno branje lokalne zgodovine ob prvem odprtju nadzorne plošče, ki je lahko zasičilo omrežni sklad, prekinilo Firebase TLS in povzročilo izgubo pinga.

## [0.1.0-beta.65] - 2026-08-07

### Fixed

- AsyncTCP lokalnega strežnika znova teče na aplikacijskem jedru 1, zato prenos večjih LittleFS datotek ne zadržuje Wi-Fi sklada na omrežnem jedru 0 in ne povzroča izgube pinga.
- Firmware hkrati pošlje največ eno Firebase zahtevo. Zagozdeno TLS opravilo po 12 sekundah prekine, sprosti povezavo in uporabi nadzorovani odmor pred ponovnim poskusom.
- Firebase `app.loop()` še naprej zaključuje obstoječa opravila tudi med odmorom za nove zahteve; ob lokalnem prenosu se aktivna cloud povezava varno prekliče iz glavne zanke.
- Provisioning AP se ponovno zažene samo, če 30-sekundno preverjanje potrdi, da AP vmesnika ali naslova `192.168.4.1` dejansko ni, ne pa ob prehodnih dogodkih radia ali odklopu odjemalca.

## [0.1.0-beta.64] - 2026-08-07

### Fixed

- AP watchdog normalnega notranjega prehoda `AP_STOP`/`AP_START` med konfiguracijo ne obravnava več kot okvaro. Po dogodku počaka 750 ms in preveri dejanski Wi-Fi način ter AP naslov, preden dovoli ponovni zagon radia.
- Zagon provisioning AP-ja uporablja neposredni `WiFi.softAP()` brez predhodnega prisilnega preklopa načina, s čimer se odstranijo odvečni radijski cikli in neskončno ponovno zaganjanje AP-ja.

## [0.1.0-beta.63] - 2026-08-07

### Fixed

- Provisioning AP uporablja uradni poenostavljeni Arduino-ESP32 zagon v stalnem `AP+STA` načinu, 20 MHz pasovno širino in DHCP captive-portal podatek za boljšo združljivost s telefoni.
- Firmware spremlja dogodke zagona, ustavitve, povezave in dodelitve DHCP naslova. Če se AP nepričakovano ustavi ali se telefon odklopi pred prejemom naslova, ga watchdog samodejno ponovno zažene.
- Serijski monitor ob odklopu izpiše Wi-Fi razlog in ločeno potrdi dodelitev IP-ja, zato je mogoče razlikovati napako asociacije od napake DHCP.

## [0.1.0-beta.62] - 2026-08-07

### Fixed

- Lokalni endpoint za tariranje ne kliče več FirebaseClient iz AsyncTCP spletnega opravila. Zahtevek samo varno postavi tariranje v čakalno vrsto, izvedba HX711 in objava stanja pa ostaneta v glavni zanki enako kot pri cloud ukazu.
- Serijski monitor ob lokalnem zahtevku izpiše njegovo sprejetje, zato je mogoče ločiti napako gumba od napake HX711.

## [0.1.0-beta.61] - 2026-08-07

### Fixed

- Brisanje Wi-Fi nastavitev ne zažene več provisioning AP-ja v istem trenutku kot asinhroni odklop STA. Radio se najprej popolnoma ustavi, AP pa se po eni sekundi zažene z lastnim DHCP omrežjem na `192.168.4.1`.
- Provisioning AP uporablja določen kanal, največ štiri odjemalce in ob neuspešnem zagonu samodejno ponovi poskus na dve sekundi.

## [0.1.0-beta.60] - 2026-08-07

### Fixed

- AsyncTCP lokalnega strežnika teče na omrežnem jedru, ločeno od Firebase `loopTask`, zato DNS/TLS čakanje ne ustavi pošiljanja lokalne strani.
- Med začetnim prenosom statičnih lokalnih datotek se Firebase opravila za največ deset sekund začasno umaknejo, kar prepreči prazne ali prekinjene HTTP odzive ob hkratnem cloud prometu.
- Firebase TLS povezava ima omejen čas povezovanja in rokovanja, zato nedosegljiv DNS ali strežnik ne zadrži naprave za daljše obdobje.

### Changed

- LittleFS vsebuje vnaprej stisnjene `gzip` različice HTML, CSS in JavaScript datotek; brskalnik zato prenese občutno manj podatkov, izvorne datoteke pa ostanejo rezervna možnost za odjemalce brez podpore `gzip`.

## [0.1.0-beta.59] - 2026-08-07

### Fixed

- Firebase `app.loop()` se izvaja največ 20-krat na sekundo, zato med TLS/DNS težavami ne sme izriniti lokalnega HTTP strežnika in povzročiti praznega HTTP odziva.

### Changed

- Serijski zagon izpiše nameščeno različico firmware-a za nedvoumno preverjanje testnega binarija.

## [0.1.0-beta.58] - 2026-08-07

### Fixed

- FirebaseClient asinhrona čakalna vrsta je omejena na štiri zahteve, kar prepreči izčrpanje RAM-a in `abort()` v `SlotManager::addSlot` med nedosegljivim Wi-Fi-jem ali Firebase strežnikom.
- Preverjanje OTA ukaza ne ustvari dodatne Firebase zahteve, kadar je čakalna vrsta že polna.

## [0.1.0-beta.57] - 2026-08-07

### Changed

- Sinhronizacija SD zgodovine s Firebase poteka na 10 sekund namesto na 1,5 sekunde, kar zmanjša število sočasnih TLS povezav.

### Fixed

- Po Firebase omrežni napaki firmware nove cloud zahteve začasno zaustavi z naraščajočim odmorom, zato DNS ali TLS težava ne sme zasedati lokalne nadzorne plošče in Wi-Fi sklada.

## [0.1.0-beta.56] - 2026-08-07

### Added

- Lokalna datoteka `platformio.local.ini` omogoča vnos IP-ja in ArduinoOTA gesla neposredno za PlatformIO GUI, brez zapisa skrivnosti v Git.

### Changed

- Okolje `esp32s3_ota` bere `custom_ota_password` iz lokalne konfiguracije; `ESP32_OTA_PASSWORD` ostane rezervna možnost.

## [0.1.0-beta.55] - 2026-08-07

### Added

- ArduinoOTA na vratih `3232` omogoča nalaganje firmware-a in LittleFS neposredno iz PlatformIO prek domačega Wi-Fi omrežja.
- Okolje `esp32s3_ota` uporabi IP iz `--upload-port` in OTA geslo iz okoljske spremenljivke `ESP32_OTA_PASSWORD`, zato poverilnica ni zapisana v Git-u.

### Changed

- Med beta testiranjem ArduinoOTA kot lokalno geslo uporablja obstoječo aktivacijsko kodo naprave; serijski monitor izpiše stanje in napredek prenosa.

## [0.1.0-beta.54] - 2026-08-07

### Fixed

- Gumb lokalnega ElegantOTA ne prepiše več poti `/update` s starim naslovom na portu `8080`.

## [0.1.0-beta.53] - 2026-08-07

### Changed

- Vsi lokalni in cloud prikazi teže, tudi tooltip grafa, zdaj uporabljajo eno decimalno mesto; shranjeni podatki ostanejo natančni na dve decimalni mesti.

## [0.1.0-beta.52] - 2026-08-06

### Fixed

- Lokalni API zgodovine za daljša obdobja ne sestavlja več celotnega JSON odgovora v RAM-u. Cel dan minutnih točk se pripravi na SD in pretočno pošlje brskalniku, zato graf »Danes« ostane prikazan.

## [0.1.0-beta.51] - 2026-08-06

### Changed

- Tariranje tehtnice je na cloud strani prestavljeno v kartico izbranega panja ob upravljanje zgodovine, lokalni gumb pa v lokalni omrežni panel.

## [0.1.0-beta.50] - 2026-08-06

### Added

- Lokalna in cloud nadzorna plošča omogočata varno tariranje HX711, kadar je merilna ploščad prazna.
- ESP32 po tariranju odmik shrani v NVS, takoj izmeri novo trenutno težo in stanje postopka objavi v Firebase pod `status/load_cell`.

## [0.1.0-beta.49] - 2026-08-06

### Fixed

- Tooltipi grafov zdaj dosledno prikažejo temperaturo in relativno vlago na eno decimalko, težo pa na dve decimalni mesti.

## [0.1.0-beta.48] - 2026-08-06

### Fixed

- Popravljena je nastavitev tooltipa grafa teže: masa panja se zdaj prikaže na dve decimalni mesti.

## [0.1.0-beta.47] - 2026-08-06

### Changed

- Lokalni in cloud graf za obdobja do 24 ur zdaj prikažeta minutne točke namesto petminutnih povprečij.

## [0.1.0-beta.46] - 2026-08-06

### Changed

- Tooltip grafa teže v lokalnem in cloud pogledu zdaj prikaže dve decimalni mesti v kilogramih.

## [0.1.0-beta.45] - 2026-08-06

### Changed

- Temperatura, relativna vlaga in teža se zdaj izmerijo ter posodobijo kot trenutne vrednosti lokalne in cloud nadzorne plošče vsakih `10` sekund.
- SD CSV dnevnik in Firebase zgodovina se dopolnita le enkrat na minuto; s tem ostanejo zgodovinski grafi varčni s prostorom in številom Firebase zapisov.
- Objavljanje aktivacijske kode ostane omejeno na petminutni interval in se ne pospeši skupaj s trenutnimi meritvami.

## [0.1.0-beta.44] - 2026-08-06

### Changed

- Začasno je interval meritev skrajšan na `15` sekund za diagnostiko stabilnosti HX711; po testu se vrne na produkcijskih 5 minut.

## [0.1.0-beta.43] - 2026-08-06

### Changed

- Posamezna meritev teže zdaj povpreči `20` HX711 vzorcev namesto `5`, kar zmanjša naključni šum ADC in merilnih celic.

## [0.1.0-beta.42] - 2026-08-06

### Changed

- HX711 faktor teže je dodatno umerjen na `22500,0` z referenčnima utežema `1,464 kg` in `2,470 kg`, da bolje pokrije celotno preskušeno območje.

## [0.1.0-beta.41] - 2026-08-06

### Changed

- HX711 faktor teže je umerjen na `22296,0` z referenčno utežjo `1,464 kg`; pri prvem testu je enaka utež prikazala `-4,63 kg` ob začetnem faktorju `-7050,0`.

## [0.1.0-beta.40] - 2026-08-06

### Added

- Firmware bere temperaturo in relativno vlago z BME680 prek I²C (`SDA=8`, `SCL=9`) ter težo prek HX711 (`DOUT=4`, `SCK=5`).
- HX711 ob prvem zagonu prazne merilne ploščadi izvede tariranje in njegov odmik shrani v NVS, zato se ob naslednjih zagonih ne ponovi.

### Changed

- Odstranjene so simulirane meritve; neodziven BME680 ali HX711 meritev jasno prekine namesto ustvarjanja izmišljenih podatkov.

## [0.1.0-beta.39] - 2026-08-06

### Changed

- Lokalni ElegantOTA in nadzorna plošča zdaj uporabljata isti asinhroni HTTP strežnik na vratih `80`; odstranjeno je periodično izvajanje ločenega sinhronega strežnika na vratih `8080`, ki je lahko poslabšalo odzivnost naprave.

## [0.1.0-beta.38] - 2026-08-06

### Fixed

- Shranjena STA povezava po zagonu izklopi Wi-Fi varčevanje z energijo, da lokalni HTTP strežnik in prenos grafov ne trpita zaradi visokih zakasnitev.

## [0.1.0-beta.37] - 2026-08-06

### Fixed

- Popoln izbris zgodovine se med aktivnim SD→Firebase prenosom ne prekine več z napako; ukaz počaka na zaključek prenosa in se nato samodejno izvede.
- Serijski monitor zdaj ločeno izpiše, ali ni bilo mogoče odstraniti ali znova ustvariti `measurements.csv`.

## [0.1.0-beta.36] - 2026-08-06

### Fixed

- Ukaz za brisanje zgodovine uporablja isti preverjeni Firebase ukazni kanal kot OTA, zato ga ESP32 zanesljivo prevzame v največ 30 sekundah.

## [0.1.0-beta.35] - 2026-08-06

### Added

- Cloud pogled omogoča lastniku ali glavnemu skrbniku izbranega panja brisanje samo Firebase zgodovine ali trajni izbris SD dnevnika skupaj s cloud zgodovino.
- Popoln izbris uporablja akcijo `delete_history` v obstoječem Firebase ukazu `/commands/firmware_update`, ki jo ESP32 potrdi z zapisom pod `/status/history`.

### Changed

- Firebase pravila dovolijo lastniku in glavnemu skrbniku brisanje vej `latest`, `measurements` in `aggregates` samo za izbrani panj.

## [0.1.0-beta.34] - 2026-08-06

### Changed

- Zgornji indikator cloud nadzorne plošče zdaj prikazuje dosegljivost izbranega panja (`Naprava online` oziroma `Naprava offline`) glede na njegov zadnji odziv, ne več povezave brskalnika s Firebase.
- Pred prvim odzivom novo izbranega panja indikator prikaže `Čakam na odziv naprave …`; brez izbire prikaže `Izberi panj`.
- Čas brez novega odziva do prikaza `Naprava offline` je skrajšan s 150 na 90 sekund.

## [0.1.0-beta.33] - 2026-08-05

### Added

- Wi-Fi watchdog po izpadu povezave vsakih 30 sekund sproži ponovni poskus povezave.

### Changed

- Po treh neuspelih reconnect poskusih firmware brez blokiranja znova zažene STA povezavo iz shranjenih NVS poverilnic, medtem ko fallback AP ostane aktiven.

## [0.1.0-beta.32] - 2026-08-05

### Changed

- Serijski monitor med ElegantOTA prenosom poroča vsakih 128 KiB namesto pri vsakem paketu, ker sinhroni callback ne podaja končne velikosti datoteke.
- Ponovni zagon po lokalni posodobitvi upravlja firmware in ni več odvisen od končnega HTTP odgovora ElegantOTA.

### Fixed

- Če brskalnik po zadnjem prenesenem bajtu prekine povezavo, firmware zazna uspešno zaključen `Update`, počaka dve sekundi in ponovno zažene napravo.
- LittleFS po popolnem prenosu ne ostane več odklopljen samo zato, ker ElegantOTA ni prejel zaključnega HTTP callbacka.

## [0.1.0-beta.31] - 2026-08-05

### Changed

- Lokalna nadzorna plošča ostaja na asinhronem strežniku na portu `80`, ElegantOTA pa uporablja ločen sinhroni `WebServer` na portu `8080`.
- Pot `/update` na glavnem lokalnem strežniku preusmeri na namenski ElegantOTA portal, zato deluje tudi s starejšo LittleFS stranjo.

### Fixed

- Odklop LittleFS ne poteka več v AsyncTCP opravilu, kjer je lahko zaustavil začetek prenosa in pustil lokalno stran v stanju `503`.
- Sinhroni ElegantOTA prenos ne zapisuje flasha znotraj AsyncTCP callbacka, kar odpravlja prekinitev s statusom HTTP `0` pri začetku posodobitve.

## [0.1.0-beta.30] - 2026-08-05

### Changed

- ElegantOTA pred lokalno posodobitvijo odklopi LittleFS, medtem ko vgrajeni portal ostane dosegljiv iz programske vsebine knjižnice.

### Fixed

- Lokalna namestitev `littlefs.bin` ne zapisuje več v še vedno priklopljeno LittleFS particijo.
- Ob neuspehu se LittleFS ponovno priklopi, serijski monitor pa izpiše natančen razlog iz sistema `Update`.
- Če se flash posodobitev po začetni zahtevi ne začne, petsekundni varovalni mehanizem obnovi lokalno stran.

## [0.1.0-beta.29] - 2026-08-05

### Added

- Lokalni portal ElegantOTA 3.1.7 na poti `/update` omogoča ločeno namestitev `firmware.bin` in `littlefs.bin` prek asinhronega spletnega strežnika.

### Changed

- Lokalni zavihek **Posodobitve** odpre namenski ElegantOTA vmesnik, ki sam prikazuje potek prenosa in po uspešni namestitvi ponovno zažene ESP32.
- Lokalna posodobitev ne potrebuje SD kartice; firmware in LittleFS se zaradi varnosti namestita vsak posebej.

### Removed

- Odstranjeni so lasten surovi HTTP prenos, začasne OTA datoteke na SD kartici, API poti `/api/update/*` in pripadajoča logika napredka v nadzorni plošči.

## [0.1.0-beta.28] - 2026-08-05

### Changed

- AsyncTCP opravilo za lokalni prenos teče na aplikacijskem jedru 1 s priporočenimi nastavitvami knjižnice, zato SD zapis ne zadržuje Wi-Fi sklada na jedru 0.
- Začasni datoteki ročne posodobitve uporabljata 16-KB pisalni medpomnilnik, brskalnik pa ob aktivnem prenosu dopušča do deset minut.

### Fixed

- Prekinjen sprejem datoteke ne kliče več `Update.abort()`, kadar flash posodobitev sploh ni bila začeta, zato ne sproži napačnega opozorila za GPIO 0.
- Odpravljeno je glavno ozko grlo, zaradi katerega je lokalni prenos na SD dosegal le približno 2–3 kB/s in po treh minutah potekel.

## [0.1.0-beta.27] - 2026-08-05

### Changed

- Ročna lokalna posodobitev datoteki `littlefs.bin` in `firmware.bin` najprej asinhrono prenese v začasni datoteki na SD kartici, nato pa ju glavna zanka po 4-KB korakih namesti v flash.
- Lokalni obrazec jasno loči prenos datotek na SD kartico od poznejše namestitve in za prenos dopušča do tri minute.

### Fixed

- HTTP prenos ne zapisuje več neposredno v LittleFS ali OTA flash particijo, zato se preprečijo večminutni zastoji, potek prenosa in nedosegljiv lokalni ESP32.
- Med odklopljenim LittleFS statične datoteke vrnejo `503`, API za stanje posodobitve pa ostane dosegljiv.

## [0.1.0-beta.26] - 2026-08-05

### Changed

- Ročni lokalni OTA HTTP callback prejeti tok kopira v šest 4-KB RAM medpomnilnikov, ločeno FreeRTOS opravilo na drugem jedru pa izvaja `Update.write()` in `Update.end()`.

### Fixed

- Pisanje LittleFS v flash ne zavira več TCP callbacka za vsak prejeti paket, kar odpravlja prenos s hitrostjo okoli 2 kB/s in posledične zastoje lokalnega strežnika.
- Med aktivno posodobitvijo LittleFS statične poti vrnejo `503`, namesto da bi poskušale brati odklopljen datotečni sistem.

## [0.1.0-beta.25] - 2026-08-05

### Changed

- Lokalni OTA uporablja `ESPAsyncWebServer` 3.12.0; `AsyncTCP` teče na ločenem jedru z večjo čakalno vrsto in daljšim TCP potrditvenim intervalom.
- Lokalni obrazec prenos prekine po 45 sekundah brez zaključka zahteve.

### Fixed

- Zastali ročni prenos se po 30 sekundah brez prejetega dela datoteke varno prekine, prekliče zapis v flash in znova priklopi LittleFS namesto da ostane naprava v nedokončanem stanju.
- Serijski monitor vsakih 10 % prikaže prejeti obseg ročne posodobitve, zato je mogoče izmeriti dejansko hitrost in mesto morebitnega zastoja.

## [0.1.0-beta.24] - 2026-08-05

### Added

- Lokalni zavihek **Posodobitve** omogoča ročni prenos `littlefs.bin` in `firmware.bin` neposredno iz telefona ali računalnika, tudi brez interneta.
- ESP32 ročno najprej varno namesti lokalno stran, LittleFS znova priklopi in nato sprejme firmware; po firmware zapisu se samodejno znova zažene.
- Lokalni obrazec prikaže napredek prenosa, stanje namestitve in razumljivo napako ob prekinjenem ali neveljavnem prenosu.

### Changed

- Lokalni HTTP strežnik uporablja `ESPAsyncWebServer` in ročni prenos kot surovo binarno telo zahteve namesto počasnega `multipart/form-data` prenosa.
- Ročna posodobitev binarnih datotek ne uporablja več začasnih datotek na SD kartici.

### Fixed

- Prenos `littlefs.bin` ne blokira več lokalnega strežnika zaradi bajtnega `multipart` razčlenjevanja, zato mora med posodobitvijo ostati bistveno bolj odziven.

## [0.1.0-beta.20] - 2026-08-04

### Added

- Lokalni provisioning pogled prikaže SSID domačega Wi-Fi omrežja, kadar je naprava povezana kot postaja.

### Fixed

- Gumb **Posodobi napravo** in gumb **Prezri** se med aktivno OTA posodobitvijo zanesljivo zakleneta tudi po osvežitvi cloud strani.
- OTA prikaz ne podvaja več imena trenutne faze; vrstica napredka jasno označuje skupni odstotek celotne posodobitve.
- Serijski monitor ob potrditvi asinhronega Firebase zapisa izpiše eno samo potrditev namesto podvojenega zapisa.
- Prazno 30-sekundno preverjanje OTA ukaza (`null`) ne ustvarja več zavajajočih izpisov o čakalni vrsti ali odsotnem ukazu.

## [0.1.0-beta.19] - 2026-08-04

### Changed

- Lokalna stran pri uspešni povezavi z domačim Wi-Fi uporablja nevtralen izraz »naprava« namesto »ESP32«; sprememba je namenjena potrditvi LittleFS OTA posodobitve.

## [0.1.0-beta.18] - 2026-08-04

### Fixed

- Cloud vrstica povezave po uspešni prijavi takoj prikaže povezovanje oziroma povezavo s Firebase in ne obstane več na stanju »Prijava je potrebna«.

### Added

- Zgornja vrstica cloud nadzorne plošče po prijavi prikaže gumb **Odjava** ob izbiri teme.
- Določen beta skrbniški Firebase UID samodejno vidi vse panje v cloud nadzorni plošči, brez registracije ali aktivacijske kode.
- OTA izdaja zdaj vsebuje preverjen `littlefs.bin`; ESP32 ga najprej preverjeno prenese na SD, nato posodobi LittleFS in šele zatem firmware.
- Glavna navigacija z ločenimi pogledi **Pregled**, **Grafi**, **Naprava** in **Posodobitve**.
- Svetla in temna tema, ki upoštevata sistemsko nastavitev ter shranita uporabnikovo izbiro v brskalnik.
- Ločena grafa za temperaturo z relativno vlago ter težo panja z enakim časovnim obdobjem.

### Changed

- Lokalna in cloud nadzorna plošča sta preurejeni za telefon, tablico in namizni računalnik z mobilnim menijem ter večjimi upravljalnimi elementi na dotik.
- Zavihek **Meritve** je odstranjen, **Zgodovina** pa je preimenovana v **Grafi**.
- Vsi datumi v uporabniškem vmesniku so prikazani v obliki `d/m/y`.
- Highcharts prevzame barve iz izbrane teme in v datumskih oznakah uporablja enak zapis kot preostali vmesnik.
- Tooltipi grafov prikažejo temperaturo, relativno vlago in težo zaokroženo na eno decimalko.
- Grafa temperature z vlago in teže panja sta zložena navpično za jasnejši pregled na vseh velikostih zaslona.
- Izbira uporabnikovega panja je preoblikovana v kompaktno kartico, registracija pa uporablja izraz »panj«.
- Uporabnik lahko po potrditvi odregistrira izbrani panj, pri čemer meritve ostanejo shranjene.
- Opis registracije ima več navpičnega razmika, kartici ESP32 in SD pa uporabljata enako nevtralno obliko kot preostale sistemske kartice.
- Naslovi začetnega pogleda, meritev, pametnega kontrolerja in OTA posodobitev so vsebinsko poenoteni ter manjši na mobilnih zaslonih.
- Koledarski klik na pretekli dan privzeto izbere celoten dan od `00:00` do `23:59`, zato graf ne dobi več praznega intervala z uro prejšnje izbire.

## [0.1.0-beta.17] - 2026-08-03

### Changed

- Testna OTA izdaja za preverjanje GitHub preusmeritve po varnem preskakovanju predolgih HTTP glav v beta.16.

## [0.1.0-beta.16] - 2026-08-03

### Fixed

- OTA parser varno preskoči predolge nepomembne GitHub HTTP glave, kot je Content-Security-Policy, in še naprej obdela preusmeritveno glavo `Location`.
- Podvojeni Firebase povratni klic za isti OTA ukaz med čakanjem ali posodobitvijo ne more več sprožiti dodatnega poskusa po napaki.

## [0.1.0-beta.15] - 2026-08-03

### Changed

- Testna OTA izdaja za končno preverjanje prenosa GitHub Release datoteke po popravku branja HTTP glav v beta.14.

## [0.1.0-beta.14] - 2026-08-03

### Fixed

- OTA med branjem GitHub HTTP glav in med kratko praznim prenosnim medpomnilnikom ne zaupa več prehodnemu napačnemu stanju `WiFiClientSecure::connected()`.
- Prenos zdaj prekine šele po dejanskem nastavljenem poteku brez podatkov, zato se GitHub preusmeritev ne označi več napačno kot prekinjena povezava.

### Changed

- Serijski monitor po odprtju firmware povezave izpiše HTTP statusno kodo odgovora OTA strežnika.

## [0.1.0-beta.13] - 2026-08-03

### Changed

- Testna OTA izdaja za preverjanje neposrednega HTTPS prenosa, GitHub preusmeritve, prikaza napredka v cloud nadzorni plošči in serijskega izpisa.

## [0.1.0-beta.12] - 2026-08-03

### Changed

- Serijski monitor med OTA prenosom izpiše ciljni HTTPS gostitelj in vsako GitHub preusmeritev, zato je povezovalne težave mogoče jasno prepoznati.

### Fixed

- Prenos `firmware.bin` ne uporablja več `HTTPClient`, ki je lahko obstal pri GitHub Release preusmeritvi.
- OTA zdaj neposredno odpre HTTPS povezavo, ročno sledi omejenemu številu varnih preusmeritev in ob poteku povezave ali HTTP glav zapiše razumljivo napako v Firebase ter serijski monitor.

## [0.1.0-beta.11] - 2026-08-03

### Added

- Cloud OTA kartica prikazuje fazo posodobitve, odstotek prenosa in poudarjeno napako z možnostjo ponovnega poskusa.
- ESP32 v Firebase zapisuje `progress_percent` od 0 do 100 ter v serijskem monitorju izpiše napredek prenosa po desetih odstotkih.

### Changed

- OTA prenos firmware-a poteka po kratkih korakih v glavni zanki; med prenosom ostaneta aktivna Firebase obdelava in lokalni spletni strežnik.
- Med OTA posodobitvijo se ostale cloud zahteve začasno ustavijo, da ne tekmujejo s statusom in prenosom firmware-a.

## [0.1.0-beta.10] - 2026-08-03

### Fixed

- OTA ukaz se zdaj najprej varno postavi v čakalno vrsto in se obdela iz glavne zanke, ne več znotraj Firebase povratnega klica.
- Prenos firmware-a prekine ob prekinjeni povezavi ali po 15 sekundah brez prejetih podatkov, zato ESP32 ne more več neskončno obstati v OTA prenosu.
- OTA uporablja globalni prenosni medpomnilnik namesto velikega lokalnega medpomnilnika na skladu `loopTask`.
- Serijski monitor izpiše faze OTA prenosa, HTTP napake, napredek in konkreten razlog neuspeha.
- Po uspešnem ponovnem zagonu naprava zazna že nameščeno ciljno različico, označi OTA kot uspešen in odstrani ukaz.

## [0.1.0-beta.9] - 2026-08-02

### Added

- Firebase Authentication v cloud nadzorni plošči z e-pošto/geslom in Google prijavo.
- Prevzem več naprav z `device_id` in aktivacijsko kodo ter izbirnik uporabnikovih naprav.
- Firebase Realtime Database pravila za zasebnost podatkov po `owner_uid`.
- Dnevni indeks SD CSV dnevnika za hitrejše lokalne poizvedbe zgodovine.
- Urne in dnevne Firebase agregate za učinkovite mesečne in letne cloud grafe.
- Lokalni prikaz stanja sinhronizacije in gumb za ponovni prenos celotnega SD dnevnika po brisanju baze.

### Changed

- ESP32 pripravi zaseben aktivacijski zapis za Firebase-only beta registracijo.
- ESP32 obnovi isti aktivacijski zapis po ročnem brisanju Firebase baze.
- ESP32 po uspešni NTP sinhronizaciji takoj zapiše časovno veljavno prvo meritev na SD kartico in v Firebase.
- Lokalni pogled skrije cloud prijavo, registracijo naprav in OTA upravljanje ter jasno prikaže aktivacijsko kodo naprave.
- ESP32 postopno sinhronizira zgodovino meritev s SD kartice v Firebase brez uporabe Cloud Storage.
- Surovo Firebase zgodovino zapisuje samo SD sinhronizacija; neposredni zapis ostaja rezerva ob napaki SD.
- Neuspešni prenosi uporabljajo eksponentni zamik od 1,5 do 60 sekund.
- Cloud graf samodejno izbere surove, urne ali dnevne podatke glede na dolžino obdobja.
- Prvi zagon novega agregacijskega modela enkrat ponovno obdela obstoječi SD dnevnik, da stare meritve dobijo agregate.

### Fixed

- CSS zdaj dosledno upošteva atribut `hidden`, zato se cloud obrazci ne prikažejo v lokalnem pogledu.
- Firebase povratni klici ne uporabljajo več stack-potratnega formatiranega izpisa, ki je povzročal ponovni zagon ESP32-S3.
- Ob zagonu se prva meritev z veljavnim NTP časom ne podvoji več v istem časovnem trenutku.
- Napaka lokalne SD zgodovine ne preklopi več nadzorne plošče v Firebase način.

## [0.1.0-beta.8] - 2026-08-02

### Added

- Wi-Fi provisioning prek lokalne nadzorne plošče in trajno shranjevanje omrežnih podatkov v NVS.
- Zaščiten AP kot samodejni rezervni lokalni dostop ob prvi namestitvi ali nedosegljivem Wi-Fi-ju.
- Trajni `device_id` na osnovi identitete ESP32 in prikaz ID-ja v lokalni ter cloud nadzorni plošči.
- Dokumentiran varen načrt za prijavo uporabnikov, registracijo naprav in več naprav na uporabnika.

### Changed

- OTA GitHub Actions gradi enoten firmware brez `secrets.h` in brez Wi-Fi poverilnic v CI.
- Meritve se ob nedosegljivem cloudu še vedno zapisujejo lokalno na SD kartico.

### Removed

- Predloga `include/secrets.example.h` in odvisnost firmwarea od trdo vpisanih Wi-Fi poverilnic.

## [0.1.0-beta.7] - 2026-08-01

### Changed

- Testna OTA izdaja za preverjanje GitHub Release, Firebase ukaza in posodobitve naprave prek cloud nadzorne plošče.

## [0.1.0-beta.6] - 2026-08-01

### Added

- OTA posodobitev ESP32 firmware-a iz GitHub Release manifesta po potrditvi v Firebase cloud pogledu.
- Preverjanje verzije, velikosti datoteke in SHA-256 pred zapisom OTA slike v neaktivno particijo.
- Cloud kartico za prikaz nove GitHub Release verzije z možnostjo potrditve ali prezrtja posodobitve.
- GitHub Actions workflow za prevod firmware-a, generiranje `manifest.json` in objavo GitHub Release ob verzijskem tagu.

## [0.1.0-beta.5] - 2026-08-01

### Added

- `last_seen_timestamp` v stanju naprave za prikaz dosegljivosti ESP32 v Firebase pogledu.
- Izbirnik začetnega in končnega datuma z uro, koledarjem in hitrimi obdobji v lokalnem in cloud pogledu.
- X-zoomiranje grafov z vlečenjem po grafu.
- Lokalno kopijo Highcharts `web/vendor/highcharts.js` za delovanje lokalnih grafov brez interneta.

### Changed

- Lokalni API zgodovine podpira parametra `from` in `to` ter sam izbere ustrezno agregacijo podatkov.
- Firebase Hosting ne objavi razvojnih datotek in Firebase dnevnikov iz mape `web/`.

## [0.1.0-beta.4] - 2026-08-01

### Added

- Lokalni HTTP strežnik na ESP32 z nadzorno ploščo, doseglivo prek IP naslova naprave.
- Lokalna API-ja za trenutno stanje in agregirano zgodovino iz SD CSV dnevnika.
- LittleFS nalaganje spletnih datotek z `pio run -t uploadfs`.
- Filtre zgodovine za dan, teden, mesec in leto v lokalnem in cloud pogledu.

### Changed

- Cloud in lokalni pogled uporabljata isti odzivni uporabniški vmesnik in Highcharts grafe.

## [0.1.0-beta.3] - 2026-08-01

### Added

- Odzivno lokalno spletno nadzorno ploščo z živimi Firebase podatki in grafom zgodovine meritev.
- Prikaz zadnje meritve, stanja SD kartice, IP naslova, Wi-Fi signala, uptime-a in verzije firmware-a.
- Lokalno Firebase spletno konfiguracijo in predlogo konfiguracije za GitHub.

### Changed

- Ureditev firmware-a z jasnimi razdelki in komentarji za nadaljnji razvoj.

## [0.1.0-beta.2] - 2026-08-01

### Added

- Enominutno pošiljanje IP naslova, moči Wi-Fi signala in uptime-a naprave v Firebase.

## [0.1.0-beta.1] - 2026-08-01

### Added

- Začetni ESP32-S3 firmware z Wi-Fi povezavo in Firebase Realtime Database.
- Simulirane meritve temperature, relativne vlage in teže v 10-sekundnem intervalu.
- NTP sinhronizacijo lokalnega slovenskega časa z upoštevanjem poletnega časa.
- CSV dnevnik meritev na SD kartici prek SPI.
- Zgodovino meritev, trenutno meritev in stanje SD kartice v Firebase.
- Enominutno preverjanje SD kartice s petimi poskusi ponovne inicializacije.
- Pošiljanje razvojne verzije firmware-a v Firebase ob zagonu.
- Osnovo Git repozitorija, javni `README.md`, `.gitignore` in `.gitattributes` za GitHub.
