# Changelog

Vse pomembne spremembe projekta so dokumentirane v tej datoteki.

## Unreleased

## [0.1.0-rc.14] - 2026-08-11

### Changed

- Ob skoku mase nad `5 kg` firmware v istem 10-sekundnem ciklu takoj izvede dodatno 5-vzorčno HX711 meritev. Ujemajoča se odčitka znotraj `±1 kg` sprejme kot njuno povprečje, zato legitimnega velikega skoka ni več treba potrjevati šele v naslednjem ciklu.

### Fixed

- Osamljen velik odčitek se zavrne, kadar je takojšnja potrditvena meritev blizu zadnje potrjene mase. Nejasna potrditev ostane kandidat za naslednji cikel, plausibility zavrnitev pa ne vpliva na HX711 health stanje.

## [0.1.0-rc.13] - 2026-08-11

### Changed

- Periodična HX711 meritev uporablja `5` namesto `20` vzorcev, zato manj časa blokira glavno zanko; tariranje še vedno uporablja `20` vzorcev, kalibracijski faktor pa ostaja nespremenjen.

### Fixed

- Velik skok mase nad `5 kg` ni več napaka komponente. Firmware ga shrani kot kandidata in sprejme po naslednji meritvi znotraj `±1 kg`; osamljen skok zavrne brez vpliva na HX711 `consecutiveFailures`, warning/error stanje ali recovery.
- HX711 health zdaj povečujejo samo nedosegljiv pretvornik ter numerično neveljaven odčitek. Po tariranju ali ponovni inicializaciji se referenca in kandidat filtra ponastavita.

## [0.1.0-rc.12] - 2026-08-11

### Changed

- Objavljena je preverjena uPlot različica grafov z vidnim prosojnim območjem med vlečenjem, native X-zoomom in gumbom **Ponastavi zoom**.

## [0.1.0-rc.11] - 2026-08-11

### Fixed

- X-zoom grafov uporablja preverjeni native uPlot tok iz uradnih primerov: knjižnica med vlečenjem sproti posodablja in prikazuje `.u-select`, ob spustu sama nastavi X merilo, aplikacijski hook pa samo prikaže gumb **Ponastavi zoom**. Odstranjena je lastna podvojena plast, ki je tekmovala z notranjimi uPlot dogodki. Dejansko nevidnost izbora je povzročala neobstoječa CSS spremenljivka `--accent`; izbor zdaj uporablja veljavno tematsko barvo `--primary` in je viden v svetli ter temni temi.

## [0.1.0-rc.10] - 2026-08-11

### Fixed

- Vizualni pas za X-zoom se ne skrije več ob začetnem native uPlot `setSelect` dogodku. Dogodki za prikaz pasu se zajamejo pred notranjimi uPlot poslušalci, pas pa se med vsakim premikom izrecno ohrani viden do spusta gumba miške.

## [0.1.0-rc.9] - 2026-08-11

### Fixed

- Grafa med povlekom za X-zoom zdaj prikažeta zanesljiv lasten prosojni izbor čez celotno višino risalne površine. Vizualni pas v realnem času sledi vlečenju v obe smeri, ne posega v native uPlot izračun zooma ter se varno odstrani ob spustu gumba, preklicu, izgubi fokusa ali ponovni izgradnji grafa.

## [0.1.0-rc.8] - 2026-08-11

### Fixed

- Povlek za X-zoom zdaj uporablja izrecno native uPlot izbiro nad platnom (`select.over`) in zaključi zoom prek native `setSelect` hooka. Prosojno območje z robovoma se zato med vlečenjem ne počisti oziroma ne obdeluje predčasno, temveč se odstrani šele po branju izbranega območja ob spustu kazalca.

## [0.1.0-rc.7] - 2026-08-11

### Added

- Klikabilna legenda uPlot grafov: temperaturo, vlago in težo je mogoče neodvisno skriti oziroma znova prikazati brez nove zahteve za zgodovino.

### Changed

- Skrita serija ima zatemnjen, dostopen gumb legende z večjo površino za klik ali dotik; stanje ostane ohranjeno tudi ob ponovni izgradnji grafov zaradi spremembe teme.

### Fixed

- Native uPlot izbor območja ima jasno prosojno poudarjanje z vidnima navpičnima robovoma med vlečenjem za zoom v svetli in temni temi.

## [0.1.0-rc.6] - 2026-08-11

### Added

- Po ročnem približanju se v zgornjem desnem kotu posameznega grafa prikaže gumb **Ponastavi zoom**, ki vrne samo ta graf na območje iz časovnega izbirnika.

### Changed

- Oznake X osi uPlot grafov se prilagodijo trenutnemu vidnemu časovnemu razponu: za kratek razpon kažejo uro, nato datum z uro, datum, mesec ali leto. Gostota oznak se prilagodi tudi širini grafa.
- Območje, izbrano s povlekom po grafu, med vlečenjem ostane jasno poudarjeno; približanje se izvede šele ob spustu kazalca oziroma prsta.

## [0.1.0-rc.5] - 2026-08-11

### Added

- Po ročnem približanju se na vsakem grafu prikaže gumb **Resetiraj zoom**; dvojni klik po grafu ostaja hitra bližnjica za enako dejanje.

### Changed

- Časovne oznake uPlot grafov so dvo-vrstične (datum in ura) in imajo večji najmanjši razmik, zato ostanejo berljive tudi na telefonu.
- Izbor območja pri približevanju ostane jasno viden do zaključka poteze, enako kot pri prejšnjem prikazu grafov.

## [0.1.0-rc.4] - 2026-08-11

### Added

- Lokalni paket `uPlot` 1.6.32 z licenco MIT za lahke grafe brez internetne povezave.

### Changed

- Lokalni in cloud grafi uporabljajo uPlot s stolpčno podatkovno strukturo, dvema neodvisnima osema za temperaturo in vlago, lastnim tooltipom ter odzivnim `ResizeObserver` prilagajanjem.
- Knjižnica grafov se prvič naloži šele ob odpiranju zavihka **Grafi**; brskalnik nato uporablja predpomnjeno različico z verzijskim imenom datoteke.
- Povlek po grafu približa os časa, dvojni klik ponastavi zoom na izbrano obdobje, osvežitev meritev pa ohrani ročni zoom.
- Za kratke LittleFS JS/CSS prenose velja 3-sekundna prednost pred novimi Firebase opravili, prenos zgodovine s SD kartice pa ima ločeno 10-sekundno prednost.

### Fixed

- Pri eni veljavni meritvi je na temperaturi, vlagi in teži prikazana jasna točka premera 10 px; pri več meritvah markerji ostanejo skriti.

### Removed

- Highcharts in njegovo prednalaganje v ozadju lokalne nadzorne plošče.

## [0.1.0-rc.3] - 2026-08-10

### Fixed

- Lokalna nadzorna plošča po začetnem prikazu v ozadju prenese knjižnico Highcharts, zato prvi prehod na grafe ne čaka na njen prenos iz LittleFS.
- Graf pri enem samem zapisu vedno prikaže vidno merilno točko.

## [0.1.0-rc.2] - 2026-08-10

### Changed

- SD dnevnik `measurements.csv` težo zapisuje na eno decimalno mesto, enako kot prikaz na nadzornih ploščah.
- Kontrolni seštevek dnevnika uporablja enako natančnost kot CSV zapis, zato sinhronizacija ne zazna navideznih razlik.

## [0.1.0-rc.1] - 2026-08-10

### Changed

- Prva kandidatska izdaja za terenski preizkus na dejanskem panju. Vključuje preverjene meritve BME680 in HX711, DS3231 čas, SD dnevnik, cloud sinhronizacijo, lokalno nadzorno ploščo ter cloud OTA.
- Lokalni pogled uporablja `favicon2.svg`, cloud pogled pa barvno `favicon.png`; lokalni strežnik za obe sliki uporabi ustrezen MIME tip.

## [0.1.0-beta.112] - 2026-08-10

### Fixed

- Lokalni strežnik za datoteki SVG in PNG pošlje pravilna MIME tipa, zato brskalnik pravilno prikaže favicon in znak v glavi.

## [0.1.0-beta.111] - 2026-08-10

### Changed

- Lokalna nadzorna plošča prednostno uporablja majhen `assets/favicon2.svg`, cloud pogled pa barvno `assets/favicon.png`; s tem je lokalni prvi prikaz glave hitrejši, cloud pa ohrani podrobnejšo ikono.

## [0.1.0-beta.110] - 2026-08-10

### Changed

- Cloud in lokalna nadzorna plošča za favicon ter znak v glavi testno uporabljata isto barvno ikono `web/assets/favicon.png`; manjši `favicon.svg` ostane v projektu kot možna hitrejša lokalna alternativa.

## [0.1.0-beta.109] - 2026-08-10

### Fixed

- Neveljaven ali nepodprt skupni cloud ukaz ne more več prepisati zadnjega OTA statusa z napačnim sporočilom.
- Cloud OTA kartica po uspešnem ponovnem zagonu prepozna nameščeno ciljno verzijo in prikaže datum ter uro zadnje uspešne cloud OTA posodobitve. Lokalna ElegantOTA in ArduinoOTA tega zapisa namenoma ne spreminjata.

## [0.1.0-beta.108] - 2026-08-10

### Fixed

- Skrbniški seznam prikaže šest kompaktnih kartic v omejenem drsečem območju; izbrani panj ima bolj kontrastno obrobo in ozadje brez odrezanega roba.
- Ob prijavi običajnega lastnika se manjkajoča e-pošta samodejno dopolni za vse njegove že registrirane panje.

## [0.1.0-beta.107] - 2026-08-10

### Changed

- Skrbniški pregled panjev uporablja kompakten drseč seznam brez podvojenega izbirnika. Vsaka vrstica prikaže ID naprave, online/offline stanje, zadnji odziv in e-poštni naslov lastnika.
- Ob registraciji oziroma izbiri panja se e-pošta lastnika varno zapiše pod `devices/{device_id}/owner_email`; vidna je samo lastniku in glavnemu skrbniku.

## [0.1.0-beta.106] - 2026-08-10

### Fixed

- Cloud prikaz zaključenega brisanja ne uporablja več starega besedila iz Firebase, temveč ga vedno prikaže kot zgodovinski rezultat zadnjega ukaza.

## [0.1.0-beta.105] - 2026-08-10

### Fixed

- Cloud pogled po ponovni online povezavi pravilno ponastavi sporočilo za nastavitev časa. Zaključeno brisanje zgodovine je označeno kot zadnji izvedeni ukaz z datumom namesto kot trditev o trenutnem stanju meritev.

## [0.1.0-beta.104] - 2026-08-10

### Changed

- Velika rastrska ikona je zamenjana z majhno vektorsko ikono `favicon.svg`; znak v glavi je neposredno vdelan v HTML, zato lokalna nadzorna plošča ob odprtju ne čaka več dodatnega prenosa slike.

## [0.1.0-beta.103] - 2026-08-10

### Changed

- Cloud OTA kartica med čakanjem, prenosom, nameščanjem in ponovnim zagonom prikaže trajno varnostno opozorilo. Gumba **Posodobi napravo** in **Prezri** ostaneta zaklenjena, dokler se postopek ne zaključi z uspehom ali napako.
- Lokalni pogled pred preusmeritvijo na ElegantOTA zahteva izrecno potrditev ter opozori, da med prenosom ni dovoljeno izklopiti naprave, zapreti brskalnika ali prekiniti Wi-Fi povezave.

## [0.1.0-beta.102] - 2026-08-10

### Fixed

- Trenutna meritev za Firebase vejo `latest` ima prednost pred periodičnimi statusnimi in zgodovinskimi opravili. Ko je en sam asinhroni Firebase kanal zaseden, firmware obdrži samo najnovejšo meritev ter jo pošlje takoj po sprostitvi, zato cloud nadzorna plošča ne preskakuje 10-sekundnih posodobitev.

## [0.1.0-beta.100] - 2026-08-10

### Changed

- Glava lokalne in cloud nadzorne plošče namesto znaka `PČ` prikaže projektno ikono `favicon.png`.

## [0.1.0-beta.99] - 2026-08-10

### Added

- Lokalna in cloud nadzorna plošča uporabljata ikono `web/assets/favicon.png` v zavihku brskalnika.

## [0.1.0-beta.98] - 2026-08-10

### Changed

- V glavi lokalne in cloud nadzorne plošče je značka opozoril komponent pred indikatorjem online/offline naprave.

## [0.1.0-beta.97] - 2026-08-10

### Fixed

- Preverjanje DS3231 bere dejanski statusni register namesto samega I2C potrjevanja naslova; odpravljena sta podvojeno preverjanje in napačni prehodi med stanji.
- I2C uporablja 50-milisekundni timeout, zato prekinjeno vodilo ne more dalj časa blokirati meritev, lokalne strani ali omrežnih opravil.
- Kartica opozoril komponent ima enotno kompaktno postavitev, pravilne odmike in opozorila prikaže kot kratke značke.

## [0.1.0-beta.96] - 2026-08-10

### Fixed

- HX711 vhod DOUT uporablja notranji pull-up, meritev pa zavrne nerealni skok mase nad `5 kg` med zaporednima meritvama. Tako izpad napajanja oziroma lebdeč signal ne more tiho ustvarjati lažne meritve.
- DS3231 se preveri pred vsako meritvijo, zato se njegov odklop prikaže kot ločeno opozorilo tudi kadar se zaradi istega I2C vodila hkrati odzove BME680.
- Neuspeh ene meritve ne prekine več preverjanja drugega senzorja; BME680 in HX711 zdaj neodvisno poročata stanje.
- Opozorila komponent so na nadzornih ploščah razporejena kompaktno pod naslovom in ne puščajo praznega prostora ob seznamu.

## [0.1.0-beta.95] - 2026-08-10

### Added

- Firmware spremlja BME680, HX711, DS3231 in SD kartico z zaporednimi preverjanji. Po treh zaporednih napakah objavi opozorilo, po petih pa napako; uspešen odziv stanje samodejno obnovi.
- Serijski monitor ob prvi napaki, prehodu v opozorilo oziroma napako in ob obnovitvi izpiše jasno sporočilo `[KOMPONENTA]`.
- Lokalni in cloud pogled prikažeta stanje vseh štirih komponent, opozorilno značko v glavi ter opozorila na pregledu samo kadar je potreben poseg.

### Changed

- Nedosegljivi BME680, HX711 in DS3231 se ponovno inicializirajo vsakih 60 sekund; SD kartica ohrani obstoječi enominutni postopek ponovne inicializacije.

## [0.1.0-beta.94] - 2026-08-10

### Changed

- Cloud nadzorna plošča brez prijave prikaže neposredno prijavni obrazec in skrije navigacijo ter prazne podatkovne poglede. Po uspešni prijavi se samodejno odpre pogled **Pregled**.

## [0.1.0-beta.93] - 2026-08-10

### Added

- Cloud prijava ima ikone za e-pošto, ustvarjanje računa, Google in zapiranje okna.
- Kartica prijavljenega računa prikaže Google profilno sliko iz Firebase `photoURL`; kadar slika ni na voljo, uporabi krog z začetnicami uporabnika.

## [0.1.0-beta.92] - 2026-08-10

### Fixed

- Polji odmika BME680 med urejanjem ne prepiše več samodejno osveževanje statusa. Izbrana vrednost ostane v obrazcu, dokler uporabnik ne potrdi kalibracije.

## [0.1.0-beta.91] - 2026-08-10

### Added

- Lokalna in cloud nadzorna plošča pod tariranjem tehtnice omogočata nastavitev programskega odmika BME680 za temperaturo in relativno vlago v korakih `0,1`.
- ESP32 shrani odmika v NVS, ju uporabi pri vseh novih meritvah ter objavi stanje kalibracije pod `status/bme680`.

### Changed

- Lastnik izbranega online panja lahko kalibracijo nastavi tudi iz cloud pogleda; ukaz uporablja obstoječi varni kanal `commands/firmware_update`.

## [0.1.0-beta.90] - 2026-08-10

### Added

- Cloud pogled prikazuje odsek sinhronizacije zgodovine na istem mestu kot lokalni pogled in omogoča ročni zagon primerjave SD zgodovine s Firebase.
- Firmware v statusu naprave objavlja stanje, napredek in zadnji zaključek sinhronizacije ter sprejme cloud ukaz `sync_history`.

### Changed

- Gumb za ponovno sinhronizacijo je v obeh pogledih onemogočen, kadar naprava nima povezave s cloudom ali SD kartica ni dosegljiva.

## [0.1.0-beta.89] - 2026-08-09

### Added

- Lokalni pogled ima ločen odsek za ogled, prenos in trajni izbris dnevnika meritev samo s SD kartice.
- Lokalni `DELETE /api/history` brisanje uvrsti v glavno zanko in prek `/api/status` objavi njegovo stanje.

### Changed

- Po lokalnem izbrisu se počisti tudi pripravljen odgovor grafa, zato lokalni pogled ne more prikazati stare predpomnjene zgodovine.

## [0.1.0-beta.88] - 2026-08-09

### Added

- Lokalni pogled omogoča neposreden ogled dnevnika meritev s SD kartice in ločen prenos datoteke CSV.

### Changed

- Pot `/measurements` prikaže dnevnik kot besedilo v brskalniku, `/measurements.csv` pa prenese izvorno datoteko CSV.
- Gumba za ogled in prenos dnevnika sta onemogočena, kadar SD kartica ni dosegljiva.

### Fixed

- Gumb za ogled dnevnika ne sproži več prenosa CSV, temveč dnevnik odpre v novem zavihku.

## [0.1.0-beta.87] - 2026-08-09

### Changed

- Dnevni marker potrjene surove zgodovine je ločen od prikaznega agregata in uporablja besedilno 32-bitno kontrolno vsoto, zato ga poznejša osvežitev povprečij ne more pokvariti.
- Obnova bere samo nespremenljiv posnetek SD dnevnika in meritve pošilja v paketih po največ 32 zapisov; zapisi, dodani med obnovo, ostanejo za običajno inkrementalno sinhronizacijo.

### Fixed

- Starejši ali offline zapisi, vstavljeni med novejše datume, ne ponastavijo več dnevnega agregata na zadnji del dneva in zato ne povzročijo ponovnega prenosa celotnega dneva.
- Časovni proračun skeniranja ne razbije več Firebase paketa na zahteve z eno samo meritvijo.
- Vsak dnevni prenos uporablja dejanski prvi in zadnji položaj dneva v posnetku CSV, zato pravilno obravnava tudi časovno neurejene starejše zapise.

## [0.1.0-beta.86] - 2026-08-09

### Changed

- Ročna primerjava pri krajšem cloud agregatu preveri kontrolno vsoto že prisotne predpone dneva in prenese samo manjkajoči rep. Če se predpona ne ujema, varno obnovi celoten dan.

### Fixed

- Zadnji nepolni paket dneva se pred zaključkom vedno pošlje; pri 590 meritvah se po 18 paketih po 32 zapisov prenese tudi preostalih 14 meritev.
- Tekoči dan se po nekaj novih minutnih meritvah ne označi več kot v celoti manjkajoč samo zato, ker se dnevni Firebase agregat osvežuje redkeje.
- Dnevni agregat dobi oznako potrjene surove zgodovine. Prva primerjava z `beta.86` enkrat v celoti obnovi stare dneve brez te oznake in s tem popravi morebitne luknje, ki jih je pustil manjkajoči zadnji paket.

## [0.1.0-beta.85] - 2026-08-09

### Changed

- Ročna obnova manjkajočih dni pošlje do 32 surovih meritev z eno Firebase `PATCH` zahtevo in med paketi uporabi kratek varni interval. Ne izvaja več prenosa enega zapisa na deset sekund.
- Lokalni pogled med obnovo prikaže število prenesenih meritev in skupno število meritev, ki jih je treba obnoviti.

### Fixed

- Zavrnjen dostop do Firebase med primerjavo zgodovine prekine obnovo z jasno napako namesto ponavljanja brez vidnega napredka.

## [0.1.0-beta.84] - 2026-08-09

### Fixed

- Po uspešni ročni primerjavi firmware shrani preverjeni konec SD dnevnika v NVS, zato se stara zgodovina ne prenese znova po minuti. Zapisi, dodani med primerjavo, ostanejo za običajno inkrementalno sinhronizacijo.

### Changed

- Firebase pravila anonimnemu ESP32 dovolijo branje samo dnevnih agregatov za primerjavo SD indeksa; surove meritve ostanejo dostopne le lastniku panja oziroma skrbniku.

## [0.1.0-beta.83] - 2026-08-09

### Added

- Ročna sinhronizacija zgodovine najprej neblokirajoče izdela dnevni indeks SD dnevnika in ga primerja z dnevnimi agregati v Firebase.
- Dnevni agregati vsebujejo kontrolno vsoto zapisov, zato firmware zazna manjkajoč ali neskladen dan tudi, kadar ima enako število meritev.

### Changed

- Lokalni gumb **Ponovno sinhroniziraj zgodovino** prenese le manjkajoče oziroma neskladne dni; pri starejših agregatih brez kontrolne vsote dopolni indeks brez ponovnega prenosa surovih meritev.
- Lokalna stran med pregledom jasno prikaže pripravo indeksa, primerjavo s Firebase in napredek po dnevih.

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
