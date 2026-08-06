# Changelog

Vse pomembne spremembe projekta so dokumentirane v tej datoteki.

## Unreleased

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
