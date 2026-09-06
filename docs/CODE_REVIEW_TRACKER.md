# Sledilnik ugotovitev code reviewa

**Izvirni pregled:** 5. september 2026  
**Uskladitev evidence:** 6. september 2026  
**Vir:** celotno izvirno poročilo, ki ga je uporabnik priložil v `pasted-text.txt`. Prenesenih je vseh 23 oštevilčenih ugotovitev z izvirno resnostjo, naslovom, lokacijo, opisom, scenarijem, predlaganim popravkom in opombami o preverjanju.

Številke vrstic v prenesenih lokacijah so **iz prvotnega pregleda**; po spremembah firmware-a se lahko razlikujejo. Pri izvedbi popravka uporabi tudi navedeno funkcijo in dodaj aktualno lokacijo oziroma commit. Ta uskladitev je dokumentacijski prenos, ne nov celoten code review ali ponovitev prvotnih testov.

Prejšnja različica sledilnika je bila napačna in nepopolna. Oznake so spodaj na novo usklajene z izvirnim vrstnim redom; preslikava starih oznak je na koncu dokumenta. Od te uskladitve naprej oznak ne prerazporejamo.

## Statusi in pravilo zapiranja

- **Odprto** — ni evidentiranega preverjenega popravka; to ne pomeni, da je bila reprodukcija danes ponovno izvedena.
- **V obravnavi** — delo poteka; zapisati je treba nosilca in vejo oziroma commit.
- **Čaka preverjanje** — popravek obstaja, merilo zaprtja še ni potrjeno.
- **Rešeno** — zapisani so popravek, različica oziroma commit in dokaz preverjanja.
- **Sprejeto tveganje** — izrecna odločitev z nosilcem, razlogom in datumom ponovnega pregleda. Dokumentirana beta omejitev sama po sebi ni zaprtje postavke.

Postavke ostanejo v evidenci tudi po rešitvi. Ob spremembi statusa posodobi tabelo, podrobnosti postavke in dnevnik na koncu. Vzrok, ki vpliva na več poti, se zapre šele, ko preverjanje pokrije celoten opisani obseg.

## Povzetek stanja

| Obseg | Resnost | Skupaj | Odprto | Čaka preverjanje | Rešeno |
| --- | --- | ---: | ---: | ---: | ---: |
| Izvirno poročilo | Critical | 1 | 1 | 0 | 0 |
| Izvirno poročilo | High | 12 | 7 | 3 | 2 |
| Izvirno poročilo | Medium | 9 | 9 | 0 | 0 |
| Izvirno poročilo | Low | 1 | 1 | 0 | 0 |
| **Izvirno poročilo skupaj** | | **23** | **18** | **3** | **2** |
| Naknadno odkrita težava F-01 | High | 1 | 0 | 0 | 1 |
| Naknadno odkrita težava F-02 | Medium | 1 | 0 | 0 | 1 |
| Naknadno odkrita težava F-03 | Medium | 1 | 0 | 1 | 0 |
| **Celotna evidenca** | | **26** | **18** | **4** | **4** |

**H-05, H-06, H-07, H-08 in H-10:** popravljene v delovni kopiji firmware-a `0.1.0-rc.76`; gostiteljski regresijski testi so uspešni. Uporabnik je firmware namestil na delujočo napravo; različica je potrjena prek lokalnega API-ja. Status **Čaka preverjanje** označuje še neizpolnjena merila posamezne postavke, ne neizvedenega popravka. Tariranje, odklop senzorja in brisanje zgodovine na napravi v uporabi niso dovoljeni v tem preizkusu. Skupna navodila in meje testov: [regresijski testi](../test/firmware_regressions/README.md).

**Skupna validacija `0.1.0-rc.76` (2026-09-06):** `scripts/test_firmware_regressions.py` uspešen; končni `pio run` za `esp32s3` uspešen (RAM 69.712 B, firmware 1.508.375 B); `git diff --check` brez napak.

Popravek za zastali `latest` in heartbeat ni ena izmed 23 prvotnih ugotovitev. Voden je ločeno kot **F-01**. Njegova namestitev ne zapira napake SSE ukazov, zastoja obnove/brisanja ali nepopolne izključitve OTA načinov.

## Kazalo prvotnih ugotovitev

| ID | Št. v poročilu | Resnost | Ugotovitev | Status |
| --- | ---: | --- | --- | --- |
| [C-01](#c-01) | 1 | Critical | TLS ne preverja identitete strežnika; SHA-256 zato ne zagotavlja varnega OTA | Odprto |
| [H-01](#h-01) | 2 | High | anonimen uporabnik lahko izbriše cloud zgodovino | Odprto |
| [H-02](#h-02) | 3 | High | lokalni dostop omogoča namestitev firmware-a brez prijave | Odprto |
| [H-03](#h-03) | 4 | High | lastništvo je mogoče prevzeti brez aktivacijske kode, kadar skrivnost še ne obstaja | Odprto |
| [H-04](#h-04) | 5 | High | Android prijavni most zaupa tudi lokalni spletni strani | Odprto |
| [H-05](#h-05) | 6 | High | začetni Firebase SSE dogodek lahko poveže nov ukaz s starim ACK-om | Rešeno |
| [H-06](#h-06) | 7 | High | obnova zgodovine izgublja urne agregate znotraj paketa | Rešeno |
| [H-07](#h-07) | 8 | High | brisanje med obnovo zgodovine povzroči medsebojno čakanje | Čaka preverjanje |
| [H-08](#h-08) | 9 | High | HX711 lahko trajno blokira glavno zanko | Čaka preverjanje |
| [H-09](#h-09) | 10 | High | prekinjena ElegantOTA seja lahko ustavi meritve do ponovnega zagona | Odprto |
| [H-10](#h-10) | 11 | High | prekinjen SD upload pušča odprte datoteke in pomnilnik | Čaka preverjanje |
| [H-11](#h-11) | 12 | High | raziskovalec SD lahko poruši notranje stanje dnevnika in OTA | Odprto |
| [H-12](#h-12) | 13 | High | prekinjena registracija lahko pusti panj brez dostopnega vnosa v uporabnikovem seznamu | Odprto |
| [M-01](#m-01) | 14 | Medium | cloud predpomnilnik trajno skrije pozneje sinhronizirane podatke | Odprto |
| [M-02](#m-02) | 15 | Medium | globalni Preferences se uporablja iz več opravil brez zaščite | Odprto |
| [M-03](#m-03) | 16 | Medium | popravek ure nazaj lahko skrije meritve in pokvari agregate | Odprto |
| [M-04](#m-04) | 17 | Medium | rezervni zapis ob odpovedi SD ne ustvarja agregatov | Odprto |
| [M-05](#m-05) | 18 | Medium | priključen uporabnik AP-ja lahko neomejeno preprečuje reconnect | Odprto |
| [M-06](#m-06) | 19 | Medium | cloud OTA spremeni LittleFS, še preden je firmware uspešno prenesen | Odprto |
| [M-07](#m-07) | 20 | Medium | različni OTA načini nimajo skupne izključitve | Odprto |
| [M-08](#m-08) | 21 | Medium | ukaz je trajno označen kot izveden pred zaključkom dejanja | Odprto |
| [M-09](#m-09) | 22 | Medium | različne lokalne zgodovinske zahteve uporabljajo isto datoteko odgovora | Odprto |
| [L-01](#l-01) | 23 | Low | Android instrumentacijski test preverja napačen paket | Odprto |

<a id="c-01"></a>

## C-01 — TLS ne preverja identitete strežnika; SHA-256 zato ne zagotavlja varnega OTA

- **Št. v izvirnem poročilu:** 1
- **Resnost:** Critical
- **Status:** Odprto

Lokacija: [main.cpp (line 7629)](C:/Users/rober/Documents/PlatformIO/Projects/Pametni_Cebelnjak/src/main.cpp:7629), setup(), loadFirmwareManifest().

- Napaka: vsi štirje TLS odjemalci uporabljajo setInsecure(), tudi odjemalec ukazov in manifesta. Napadalec lahko zamenja firmware in kontrolno vsoto v manifestu.
- Scenarij: napadalec nadzoruje omrežno pot naprave. Ponaredi Firebase ukaz, manifest in datoteke ter doseže namestitev svoje programske opreme.
- Popravek: preverjanje certifikatov in imen strežnikov za vse povezave; za OTA dodatno podpisan manifest oziroma firmware z vgrajenim javnim ključem.

**Evidenca reševanja**

- **Nosilec / veja:** —
- **Popravek / različica / commit:** —
- **Merilo zaprtja:** Neveljaven certifikat, napačno ime strežnika in spremenjen manifest oziroma firmware so zavrnjeni; veljavno podpisana izdaja se uspešno namesti.
- **Preverjanje popravka / datum:** —

<a id="h-01"></a>

## H-01 — anonimen uporabnik lahko izbriše cloud zgodovino

- **Št. v izvirnem poročilu:** 2
- **Resnost:** High
- **Status:** Odprto

Lokacija: [database.rules.json (line 238)](C:/Users/rober/Documents/PlatformIO/Projects/Pametni_Cebelnjak/database.rules.json:238), tudi pravila za latest, agregate in statuse.

- Napaka: auth == null dovoljuje pisanje na celotne podatkovne veje, vključno z brisanjem. Omejitev ni samo možnost dodajanja ponarejenih meritev.
- Scenarij: nekdo pozna URL baze in ID naprave ter izbriše measurements ali agregate. Lahko tudi ponaredi stanje naprave oziroma potrdi čakajoči ukaz.
- Popravek: avtentikacija posamezne naprave ali zaupanja vreden strežniški vnos; ločena dovoljenja za dodajanje, posodabljanje in brisanje.
To je dokumentirana beta omejitev, vendar predstavlja neposredno oviro za produkcijo.

**Evidenca reševanja**

- **Nosilec / veja:** —
- **Popravek / različica / commit:** —
- **Merilo zaprtja:** Preverjanja Firebase pravil zavrnejo anonimen izbris in ponarejene zapise; avtenticirana naprava lahko piše le v dovoljene lastne poti.
- **Preverjanje popravka / datum:** —

<a id="h-02"></a>

## H-02 — lokalni dostop omogoča namestitev firmware-a brez prijave

- **Št. v izvirnem poročilu:** 3
- **Resnost:** High
- **Status:** Odprto

Lokacija: [main.cpp (line 5313)](C:/Users/rober/Documents/PlatformIO/Projects/Pametni_Cebelnjak/src/main.cpp:5313), initializeElegantOta(), initializeLocalWebServer(), sendLocalStatus().

- Napaka: ElegantOTA in upravljalni lokalni API nimata avtentikacije. /api/status poleg tega razkrije aktivacijsko kodo, ki je začetno geslo raziskovalca SD in geslo ArduinoOTA.
- Scenarij: druga naprava v istem LAN-u ali uporabnik odprtega AP-ja lahko namesti firmware, spremeni Wi-Fi, tarira tehtnico ali izbriše zgodovino.
- Popravek: zaščita lokalnih upravljalnih poti in ElegantOTA; prikaz aktivacijske kode omejiti na fizično omogočen provisioning.
Odprt AP in nezaščiten ElegantOTA sta znani beta omejitvi. Izpostavljenost velja tudi prek domačega LAN-a.

**Evidenca reševanja**

- **Nosilec / veja:** —
- **Popravek / različica / commit:** —
- **Merilo zaprtja:** Neprijavljen LAN/AP odjemalec ne more uporabiti upravljalnih poti, namestiti OTA ali prebrati aktivacijske kode; dovoljeni provisioning še deluje.
- **Preverjanje popravka / datum:** —

**Opomba ob uskladitvi:** glava `X-Device-Reboot` in ID zagona v `0.1.0-rc.75` nista uporabniška avtentikacija. Novi reboot je del obsega skupne zaščite lokalnih upravljalnih poti.

<a id="h-03"></a>

## H-03 — lastništvo je mogoče prevzeti brez aktivacijske kode, kadar skrivnost še ne obstaja

- **Št. v izvirnem poročilu:** 4
- **Resnost:** High
- **Status:** Odprto

Lokacija: [database.rules.json (line 120)](C:/Users/rober/Documents/PlatformIO/Projects/Pametni_Cebelnjak/database.rules.json:120), pravilo owner_uid.

- Napaka: pravilo primerja vrednosti aktivacijske kode brez preverjanja obstoja. Če ni niti zahtevka niti skrivnosti, je primerjava null === null uspešna.
- Scenarij: prijavljen uporabnik neposredno zapiše svoj UID za napravo, ki še ni objavila skrivnosti, in jo rezervira pred pravim lastnikom.
- Popravek: zahtevati obstoj in veljaven tip obeh kod ter veljaven zahtevek pred zapisom lastništva.
Izolirano vrednotenje obstoječega izraza je ta primer dovolilo. Obnašanje manjkajočih vrednosti opisuje tudi Firebase dokumentacija.

**Evidenca reševanja**

- **Nosilec / veja:** —
- **Popravek / različica / commit:** —
- **Merilo zaprtja:** Firebase Emulator Suite zavrne prevzem brez obeh kod, z napačnima tipoma in z neveljavnim zahtevkom; pravilna registracija uspe.
- **Preverjanje popravka / datum:** —

<a id="h-04"></a>

## H-04 — Android prijavni most zaupa tudi lokalni spletni strani

- **Št. v izvirnem poročilu:** 5
- **Resnost:** High
- **Status:** Odprto

Lokacija: [android-app/src/main.js (line 326)](C:/Users/rober/Documents/PlatformIO/Projects/Pametni_Cebelnjak/android-app/src/main.js:326), handleNativeAuthenticationRequest().

- Napaka: preverja se samo event.source, ne event.origin ali način nadzorne plošče. Odgovor z Google žetoni se pošlje z targetOrigin: '*'.
- Scenarij: uporabnik odpre lokalno stran lažne oziroma kompromitirane naprave. Ta lahko sproži nativno Google prijavo in po uspešni prijavi prejme žetone. Tveganje obstaja tudi ob navigaciji iframe-a med čakanjem na odgovor.
- Popravek: prijavo dovoliti samo zaupanja vrednemu izvoru v cloud načinu; pred odgovorom ponovno preveriti aktivni dokument in uporabiti točen targetOrigin.

**Evidenca reševanja**

- **Nosilec / veja:** —
- **Popravek / različica / commit:** —
- **Merilo zaprtja:** Lažen lokalni iframe, napačen origin in navigacija med prijavo ne prejmejo žetonov; zaupanja vredna cloud prijava uspe.
- **Preverjanje popravka / datum:** —

<a id="h-05"></a>

## H-05 — začetni Firebase SSE dogodek lahko poveže nov ukaz s starim ACK-om

- **Št. v izvirnem poročilu:** 6
- **Resnost:** High
- **Status:** Rešeno

Lokacija: [main.cpp (line 4331)](C:/Users/rober/Documents/PlatformIO/Projects/Pametni_Cebelnjak/src/main.cpp:4331), processControlStreamData(), extractJsonString().

- Napaka: korenski objekt /control se v celoti posreduje razčlenjevalniku ukaza. Ta poišče prvo pojavitev request_id, ki lahko pripada ack, medtem ko action pripada novemu ukazu.
- Scenarij: po ponovnem zagonu ali reconnectu obstajata stari ACK in nov čakajoči ukaz. Novi ukaz se obravnava kot že izveden, napačna potrditev pa je zavrnjena.
- Popravek: uporabiti pravi JSON razčlenjevalnik in iz korenskega dogodka izločiti samo command. Omejitev velikosti ukaza prav tako uporabiti na tem podobjektu.

**Evidenca reševanja**

- **Nosilec / veja:** Codex / trenutna delovna kopija.
- **Popravek / različica / commit:** `0.1.0-rc.76`, še brez commita. [control_stream_root.h](../include/control_stream_root.h), `processControlStreamData()` v [main.cpp](../src/main.cpp): cJSON izloči samo `command` in `settings`, zato velikost ali ID iz ACK-a ne vplivata na ukaz. Ohranjen je ločen tok dogodkov posameznih poti.
- **Merilo zaprtja:** Korenski SSE dogodek s starim ACK-om in novim ukazom izvede ter potrdi izključno request_id novega ukaza.
- **Preverjanje popravka / datum:** 2026-09-06; gostiteljski test s pravim cJSON uspešen za stari ACK pred novim ukazom, obratni vrstni red, velik ACK, `put`/`patch`/`null`, odsoten ukaz, neveljaven JSON in ubežne znake. Preverjena je izolacija podobjekta; end-to-end izvedba in ACK po reconnectu na napravi še čakata.
- **Naprava, 2026-09-06:** med spremljanjem se je pojavil nov ACK `ac3074e0-e712-47a9-9007-649afd7661f0` ob `1788694591`, kanal `command` je prazen, zadnja NTP sinhronizacija je `1788694589` in RTC ostaja veljaven. Nismo namensko povzročili reconnecta s čakajočim ukazom; opažen je tudi ponavljajoč Firebase `401` brez identifikatorja zavrnjene zahteve, zato postavka ostaja v preverjanju.
- **Zaključno preverjanje na napravi, 2026-09-06:** izveden je bil en lokalni reboot z ID-jem `1607458164 → 156831003`. Med potrjenim odklopom je bil ob ohranjenem starem ACK-u z ETag/If-Match v prazen `command` oddan samo NTP ukaz `review-sse-0edfda5c-8b13-4114-bc7a-38d2a28a8129`. Naprava ga je po zagonu obdelala in ob `1788695586` potrdila točno novi ID; `command` je prazen, NTP zaključen in tehtanje deluje. Izvirno merilo H-05 je izpolnjeno. Poznejše ponovitve že uspešnega ACK-a so ločena nova težava F-02. Artefakt: `.pio/hardware-verification/sse-live.json`.

<a id="h-06"></a>

## H-06 — obnova zgodovine izgublja urne agregate znotraj paketa

- **Št. v izvirnem poročilu:** 7
- **Resnost:** High
- **Status:** Rešeno

Lokacija: [main.cpp (line 7079)](C:/Users/rober/Documents/PlatformIO/Projects/Pametni_Cebelnjak/src/main.cpp:7079), completeCloudHistoryReconciliationRequest(), addMeasurementToCloudAggregate().

- Napaka: paket vsebuje do 32 meritev, za zaključen urni agregat pa obstaja samo en readyReconciliationHourlyAggregate. Naslednji prehod ure prepiše še neposlan agregat.
- Scenarij: pri privzetem petminutnem arhiviranju 32 meritev zajame več kot dve uri. Prvi zaključeni urni agregat se izgubi; dnevni agregat se kljub temu lahko označi kot obnovljen.
- Popravek: paket končati ob prehodu ure ali vzdrževati vrsto vseh zaključenih agregatov.
Izolirana simulacija tega zaporedja je potrdila prepis prvega agregata.

**Evidenca reševanja**

- **Nosilec / veja:** Codex / trenutna delovna kopija.
- **Popravek / različica / commit:** `0.1.0-rc.76`, še brez commita; `readNextReconciliationMeasurementBatch()` v [main.cpp](../src/main.cpp) konča paket pred prehodom UTC ure. Nova vrstica ostane za naslednji paket; ob neuspelem prenosu se potrjeni offset in agregati ne premaknejo. `DAILY_RAW_SYNC_VERSION = 5` ob naslednji obnovi ponovno obdela stareje označene dneve in njihove urne agregate.
- **Merilo zaprtja:** Paket 32 petminutnih meritev čez več urnih mej objavi vse zaključene urne agregate s pravilnimi vrednostmi in števci.
- **Preverjanje popravka / datum:** 2026-09-06; dejanske funkcije branja, združevanja in potrditve paketa so prestale simulacije celodnevne zgodovine pri 1/5 minutah, večurnih vrzeli, meje dneva, neveljavnih vrstic, ponovitve brez ACK-a ter veljavne/neveljavne predpone. Vsi urni ključi in števci se ujemajo s pričakovanimi. Čaka preverjanje obnovljenih vrednosti v testni Firebase zgodovini po namestitvi.
- **Zaključno preverjanje na napravi / datum:** 2026-09-06, nameščeni `0.1.0-rc.76`. Lokalna obnova se je zaključila ob Unix času `1788695031` (13:43:51 lokalno): **21/21 dni, 20.649/20.649 meritev**, stanje `completed`, nato `caught_up = true`. Firebase CLI je z obstoječo prijavo prebral urne agregate; primerjava s predhodno kopijo SD je potrdila vseh **473 zaključenih ur** (skupno število, števci posameznih senzorjev in povprečja, toleranca zaokroževanja 0,011) ter vseh **20 zaključenih dnevov**. Tekoča ura/dan sta iz numerične primerjave izključena, ker nove meritve med testom nastajajo. Vsi zaključeni dnevi imajo `raw_sync_version = 5`. Merilo H-06 je izpolnjeno; podrobnosti: [poročilo preizkusa](HARDWARE_TEST_RC76.md).

<a id="h-07"></a>

## H-07 — brisanje med obnovo zgodovine povzroči medsebojno čakanje

- **Št. v izvirnem poročilu:** 8
- **Resnost:** High
- **Status:** Čaka preverjanje

Lokacija: [main.cpp (line 4758)](C:/Users/rober/Documents/PlatformIO/Projects/Pametni_Cebelnjak/src/main.cpp:4758), processPendingHistoryDeletion(), isFirebaseReady(), processCloudHistoryReconciliation().

- Napaka: brisanje čaka na konec obnove. Ko je historyDeletionQueued == true, isFirebaseReady() vrne false, zato obnova ne more nadaljevati.
- Scenarij: med aktivno obnovo uporabnik pošlje delete_history. Obnova in brisanje obstaneta; blokirani so tudi običajni cloud zapisi.
- Popravek: brisanje med obnovo zavrniti ali obnovo nadzorovano prekiniti, preden se aktivira stanje brisanja.

**Evidenca reševanja**

- **Nosilec / veja:** Codex / trenutna delovna kopija.
- **Popravek / različica / commit:** `0.1.0-rc.76`, še brez commita; `processPendingHistoryDeletion()` nadzorovano ustavi obnovo in zapre njen SD ročaj, ko se zaključi obstoječa zahteva. `processCloudHistoryReconciliation()` ob čakajočem brisanju ne začne novih korakov. `synchronizeSDMeasurements()` preveri izgubljeno zahtevo/timeout tudi pri aktivni obnovi.
- **Merilo zaprtja:** Ukaz delete_history med aktivno obnovo je jasno zavrnjen ali nadzorovano prekine obnovo; noben postopek ne ostane trajno blokiran.
- **Preverjanje popravka / datum:** 2026-09-06; dejanski izvajalnik brisanja prestane scenarije v treh aktivnih fazah obnove. Test potrdi čakanje na že oddano zahtevo, zaprtje ročaja pred posegom v SD ter nadaljevanje brisanja. Preverjena sta tudi izgubljeni callback in meja timeouta. Čaka end-to-end preizkus na namenski testni zgodovini; obstoječa zgodovina ni bila izbrisana.

<a id="h-08"></a>

## H-08 — HX711 lahko trajno blokira glavno zanko

- **Št. v izvirnem poročilu:** 9
- **Resnost:** High
- **Status:** Čaka preverjanje

Lokacija: [main.cpp (line 1975)](C:/Users/rober/Documents/PlatformIO/Projects/Pametni_Cebelnjak/src/main.cpp:1975) in [main.cpp (line 4566)](C:/Users/rober/Documents/PlatformIO/Projects/Pametni_Cebelnjak/src/main.cpp:4566).

- Napaka: wait_ready_timeout() preveri samo pripravljenost pred prvim vzorcem. get_units(5) in tare(20) nato uporabljata knjižnični read(), ki vsebuje neomejen wait_ready().
- Scenarij: HX711 odpove ali izgubi povezavo po prvem vzorcu. Meritve, reconnect, Firebase in obdelava ukazov v glavni zanki obstanejo.
- Popravek: vsak vzorec pridobivati z omejenim čakanjem; povprečenje in tariranje izvajati kot postopno stanje.
To sem preveril tudi v lokalno nameščeni knjižnici HX711.

**Evidenca reševanja**

- **Nosilec / veja:** Codex / trenutna delovna kopija.
- **Popravek / različica / commit:** `0.1.0-rc.76`, še brez commita; [load_cell_sampling.h](../include/load_cell_sampling.h), `tryReadLoadCellRaw()`, `processLoadCellSampling()`, `initializeLoadCell()`, `processPendingLoadCellTare()` in filter v [main.cpp](../src/main.cpp). Vsak prehod prebere največ en pripravljen vzorec s končnim številom impulzov; povprečenje, potrditev skoka ter začetno/ročno tariranje ne kličejo knjižničnega neomejenega čakanja. Timeout je 250 ms brez vzorca (1000 ms med začetnim povprečjem); prestara ali neuspešna masa se ne objavi. Odmik se spremeni šele po uspešnem shranjevanju v NVS.
- **Merilo zaprtja:** Odpoved HX711 med katerimkoli vzorcem meritve ali tariranja povzroči omejen timeout; glavna zanka nadaljuje meritve drugih senzorjev in obdelavo ukazov.
- **Preverjanje popravka / datum:** 2026-09-06; uspešni testi izpada pred vsakim od 5/20 vzorcev, meje timeouta, preliva ure, 24-bitnega predznaka in 25 impulzov, potrditve/zavrnitve skoka, postopnega tariranja, napake NVS z ohranjeno ničlo ter izločitve stare mase. Čaka fizični odklop HX711 med meritvijo/tariranjem in preverjanje odzivnosti drugih opravil ter električnega časovanja.
- **Naprava, 2026-09-06:** običajno tehtanje po namestitvi deluje (okoli 54,07–54,08 kg), HX711 in BME680 ostajata `ok`, lokalne meritve in Firebase potrditve napredujejo tudi med SD upload testi in obnovo. Tariranje in odklop HX711 nista bila izvedena, ker je panj v uporabi.

**Pojasnilo obsega:** blokirana je glavna zanka in opravila, ki jih poganja. Wi-Fi sklad in AsyncTCP tečeta v ločenih opravilih, zato ni pravilno trditi, da se nujno ustavi ves lokalni HTTP promet. Ukaz za reboot, ki se izvaja v glavni zanki, ob takem zastoju prav tako ne more biti obdelan.

<a id="h-09"></a>

## H-09 — prekinjena ElegantOTA seja lahko ustavi meritve do ponovnega zagona

- **Št. v izvirnem poročilu:** 10
- **Resnost:** High
- **Status:** Odprto

Lokacija: [main.cpp (line 5317)](C:/Users/rober/Documents/PlatformIO/Projects/Pametni_Cebelnjak/src/main.cpp:5317), maintainElegantOtaSession().

- Napaka: obstaja timeout za začetek, ne pa za zastal prenos. Ko Update.isRunning() postane true, se funkcija neomejeno vrača.
- Scenarij: odjemalec uspešno pokliče /ota/start, nato zapre stran ali prekine upload. LittleFS ostane odklopljen, pogoj v loop() pa preprečuje redne meritve.
- Popravek: beležiti čas zadnjega napredka; ob timeoutu preklicati Update, obnoviti LittleFS in počistiti stanje seje.

**Evidenca reševanja**

- **Nosilec / veja:** —
- **Popravek / različica / commit:** —
- **Merilo zaprtja:** Po /ota/start brez nadaljnjih podatkov in po prekinitvi prenosa timeout prekliče Update, priklopi LittleFS in omogoči nadaljevanje meritev.
- **Preverjanje popravka / datum:** —

<a id="h-10"></a>

## H-10 — prekinjen SD upload pušča odprte datoteke in pomnilnik

- **Št. v izvirnem poročilu:** 11
- **Resnost:** High
- **Status:** Čaka preverjanje

Lokacija: [main.cpp (line 5619)](C:/Users/rober/Documents/PlatformIO/Projects/Pametni_Cebelnjak/src/main.cpp:5619), handleSdCardUpload(), finishSdCardUpload().

- Napaka: objekt z File in String člani se ustvari z new in shrani v _tempObject. Ob prekinitvi zahteve se zaključni handler ne izvede. ESPAsyncWebServer 3.12.0 nad _tempObject pokliče free(), brez destruktorja objekta.
- Scenarij: več prekinjenih prenosov pušča datotečne ročice, notranje alokacije in začasne datoteke; SD operacije začnejo odpovedovati.
- Popravek: zagotoviti pravilno lastništvo objekta in čiščenje tudi ob disconnectu; uporabiti delete, zapreti datoteko ter odstraniti začasni zapis.

**Evidenca reševanja**

- **Nosilec / veja:** Codex / trenutna delovna kopija.
- **Popravek / različica / commit:** `0.1.0-rc.76`, še brez commita; `SdCardUploadContext::~SdCardUploadContext()`, `cleanupSdCardUpload()`, `handleSdCardUpload()` in `finishSdCardUpload()` v [main.cpp](../src/main.cpp). `onDisconnect` in zaključni handler izpraznita `_tempObject` ter uporabita `delete`; destruktor zapre datoteko in odstrani nedokončani začasni zapis. Različne začasne poti preprečijo medsebojno čiščenje sočasnih uploadov. Drugi multipart del ne prepiše konteksta.
- **Merilo zaprtja:** Več zaporednih prekinjenih SD uploadov ne povečuje števila odprtih datotek ali porabe pomnilnika; začasne datoteke so odstranjene.
- **Preverjanje popravka / datum:** 2026-09-06; dejanski handlerji prestanejo 100 prekinitev, dvojni disconnect, sočasna uploada, uspešen zaključek, zavrnjeno avtentikacijo, napako preimenovanja in dodatni multipart del. Nadomestni SD po čiščenju nima odprtih ročajev ali začasnih zapisov, uspešna ciljna datoteka ostane. Čaka meritev heap-a in ponovitev dejanskih HTTP prekinitev na ESP32.
- **Naprava, 2026-09-06:** vseh **10 dejanskih prekinjenih HTTP uploadov** je med prenosom ustvarilo po eno začasno datoteko, po disconnectu pa ni ostala nobena. Naslednji normalen upload 4.400 B je vrnil `201`; prenesena vsebina se bajt za bajtom ujema. Odstranjena je bila samo enkratno poimenovana testna datoteka. SD ostaja `ok`, obstoječa zgodovina ni bila spremenjena s tem testom. Heap-a in števila ročajev lokalni API ne izpostavlja, zato odsotnost pomnilniškega leaka na dejanskem ESP32 še ni neposredno izmerjena. Podrobni lokalni artefakti: `.pio/hardware-verification/upload-results.json`.

<a id="h-11"></a>

## H-11 — raziskovalec SD lahko poruši notranje stanje dnevnika in OTA

- **Št. v izvirnem poročilu:** 12
- **Resnost:** High
- **Status:** Odprto

Lokacija: [main.cpp (line 5585)](C:/Users/rober/Documents/PlatformIO/Projects/Pametni_Cebelnjak/src/main.cpp:5585), deleteSdCardFile(), handleSdCardUpload().

- Napaka: brez posebne obravnave dovoljuje brisanje ali zamenjavo measurements.csv, indeksa, pripravljenega odgovora zgodovine in OTA staging datoteke.
- Scenarij: uporabnik zamenja dnevnik, firmware pa ohrani stari cloudSyncFileOffset, agregate in indeks. Del nove zgodovine se preskoči ali se uporablja napačen indeks. Poseg med OTA lahko prekine namestitev.
- Popravek: rezervirane datoteke zaščititi; za obnovo dnevnika ponuditi namenski postopek, ki ustavi uporabnike datoteke in ponovno zgradi povezano stanje.

**Evidenca reševanja**

- **Nosilec / veja:** —
- **Popravek / različica / commit:** —
- **Merilo zaprtja:** Raziskovalec zavrne posege v rezervirane datoteke; namenski uvoz dnevnika obnovi kazalec sinhronizacije, indeks in agregate ter ne moti OTA.
- **Preverjanje popravka / datum:** —

<a id="h-12"></a>

## H-12 — prekinjena registracija lahko pusti panj brez dostopnega vnosa v uporabnikovem seznamu

- **Št. v izvirnem poročilu:** 13
- **Resnost:** High
- **Status:** Odprto

Lokacija: [web/app.js (line 6366)](C:/Users/rober/Documents/PlatformIO/Projects/Pametni_Cebelnjak/web/app.js:6366), claimDevice().

- Napaka: zapis zahtevka, lastništva, e-pošte in uporabniškega seznama je zaporedje ločenih zapisov. Ob napaki se odstrani samo zahtevek.
- Scenarij: lastništvo se shrani, zapis users/{uid}/devices/{deviceId} pa odpove. Panja ni v izbirniku; ponovna registracija je zavrnjena, ker lastnik že obstaja.
- Popravek: uskladiti pravila za atomaren zaključek registracije ali dodati obnovljiv postopek, ki obstoječemu lastniku popravi manjkajoče povezave.

**Evidenca reševanja**

- **Nosilec / veja:** —
- **Popravek / različica / commit:** —
- **Merilo zaprtja:** Prekinitev po vsakem koraku registracije omogoča varen ponovni poskus; lastništvo in uporabniški seznam se uskladita.
- **Preverjanje popravka / datum:** —

<a id="m-01"></a>

## M-01 — cloud predpomnilnik trajno skrije pozneje sinhronizirane podatke

- **Št. v izvirnem poročilu:** 14
- **Resnost:** Medium
- **Status:** Odprto

Lokacija: [web/app.js (line 7029)](C:/Users/rober/Documents/PlatformIO/Projects/Pametni_Cebelnjak/web/app.js:7029), fetchCloudHistoryWindowReadings(), getCloudHistoryRealtimeTailStart().

- Napaka: prebrano obdobje, tudi prazno, ostane označeno kot pokrito brez roka veljavnosti. Živi poslušalec spremlja samo petminutni rep surovih meritev oziroma tekoči agregat.
- Scenarij: naprava po daljšem izpadu prenese stare meritve. Odprta stran jih ne prevzame, čeprav so že v Firebase; enako velja za popravljene agregate.
- Popravek: razveljavitev predpomnilnika ob obnovi/reconnectu ali časovna veljavnost; obdobja z nedokončano sinhronizacijo ponovno preverjati.

**Evidenca reševanja**

- **Nosilec / veja:** —
- **Popravek / različica / commit:** —
- **Merilo zaprtja:** Po naknadnem vnosu starih meritev oziroma popravku agregatov jih že odprti graf prikaže brez ponovnega nalaganja strani.
- **Preverjanje popravka / datum:** —

<a id="m-02"></a>

## M-02 — globalni Preferences se uporablja iz več opravil brez zaščite

- **Št. v izvirnem poročilu:** 15
- **Resnost:** Medium
- **Status:** Odprto

Lokacija: [main.cpp (line 5465)](C:/Users/rober/Documents/PlatformIO/Projects/Pametni_Cebelnjak/src/main.cpp:5465), authenticateSdCardRequest(), changeSdCardPassword(), persistCloudSyncState().

- Napaka: AsyncTCP handlerji in glavna zanka delijo isti objekt z enim aktivnim NVS ročajem. begin()/uporaba/end() niso zaščiteni kot celota.
- Scenarij: dostop do raziskovalca SD sovpade s shranjevanjem sinhronizacije ali kalibracije. Operacije lahko nepričakovano odpovejo; ob neugodnem prepletanju si posežejo v stanje ročaja.
- Popravek: lokalni objekti Preferences ali mutex okoli celotne seje. Blokirajočih NVS operacij ne zapirati v spinlock.

**Evidenca reševanja**

- **Nosilec / veja:** —
- **Popravek / različica / commit:** —
- **Merilo zaprtja:** Sočasna SD avtentikacija, sprememba gesla in shranjevanje sinhronizacije/kalibracije ne vplivajo na tuje NVS seje.
- **Preverjanje popravka / datum:** —

<a id="m-03"></a>

## M-03 — popravek ure nazaj lahko skrije meritve in pokvari agregate

- **Št. v izvirnem poročilu:** 16
- **Resnost:** Medium
- **Status:** Odprto

Lokacija: [main.cpp (line 6095)](C:/Users/rober/Documents/PlatformIO/Projects/Pametni_Cebelnjak/src/main.cpp:6095), processLocalHistory(), appendMeasurementHistoryIndex(), addMeasurementToCloudAggregate().

- Napaka: branje in indeks predpostavljata naraščajoče časovne oznake, dovoljena pa sta NTP in ročna sprememba ure nazaj. Branje se konča pri prvi meritvi nad zgornjo mejo.
- Scenarij: napačna ura najprej zabeleži prihodnje meritve, nato se popravi. Poznejši veljavni zapisi ostanejo za »prihodnjim« zapisom in jih graf preskoči. Povratek v prejšnjo uro lahko tudi prepiše njen agregat z delnimi podatki.
- Popravek: zaznati časovni preskok ter uporabljati časovne segmente oziroma zaporedni ID; indeks in agregiranje prilagoditi neurejenim časovnim oznakam.

**Evidenca reševanja**

- **Nosilec / veja:** —
- **Popravek / različica / commit:** —
- **Merilo zaprtja:** Po premiku ure nazaj lokalna zgodovina vsebuje poznejše veljavne zapise, urni in dnevni agregati pa jih pravilno vključijo.
- **Preverjanje popravka / datum:** —

<a id="m-04"></a>

## M-04 — rezervni zapis ob odpovedi SD ne ustvarja agregatov

- **Št. v izvirnem poročilu:** 17
- **Resnost:** Medium
- **Status:** Odprto

Lokacija: [main.cpp (line 7580)](C:/Users/rober/Documents/PlatformIO/Projects/Pametni_Cebelnjak/src/main.cpp:7580), sendMeasurements().

- Napaka: rezervna pot zapiše samo surovo meritev v Firebase. Urni in dnevni agregati nastajajo iz SD dnevnika.
- Scenarij: internet deluje, SD pa več dni ne. Kratek graf vsebuje podatke, daljša obdobja, ki uporabljajo agregate, imajo vrzeli. Ti podatki se pozneje iz SD ne morejo obnoviti.
- Popravek: agregate graditi tudi za rezervno pot, najbolje na strežniku, ali zagotoviti naknadno obnovo iz cloud surovih meritev.

**Evidenca reševanja**

- **Nosilec / veja:** —
- **Popravek / različica / commit:** —
- **Merilo zaprtja:** Ob daljšem izpadu SD in delujočem internetu so surove meritve ter urni/dnevni agregati popolni ali naknadno obnovljivi.
- **Preverjanje popravka / datum:** —

<a id="m-05"></a>

## M-05 — priključen uporabnik AP-ja lahko neomejeno preprečuje reconnect

- **Št. v izvirnem poročilu:** 18
- **Resnost:** Medium
- **Status:** Odprto

Lokacija: [main.cpp (line 2666)](C:/Users/rober/Documents/PlatformIO/Projects/Pametni_Cebelnjak/src/main.cpp:2666), maintainNetworkConnection().

- Napaka: ob kateremkoli AP odjemalcu se aktivni STA poskus prekine, novi poskusi pa so popolnoma ustavljeni.
- Scenarij: telefon po izpadu ostane povezan s fallback AP-jem. Domači Wi-Fi je spet dosegljiv, naprava pa se ne poveže nazaj.
- Popravek: lokalnemu prometu dati omejeno prednost, ob tem pa periodično dovoliti nadzorovan reconnect. Trenutno obnašanje odstopa od dokumentiranega watchdog postopka.

**Evidenca reševanja**

- **Nosilec / veja:** —
- **Popravek / različica / commit:** —
- **Merilo zaprtja:** Po vrnitvi domačega Wi-Fi-ja se naprava ponovno poveže tudi, če odjemalec ostane povezan s fallback AP-jem.
- **Preverjanje popravka / datum:** —

<a id="m-06"></a>

## M-06 — cloud OTA spremeni LittleFS, še preden je firmware uspešno prenesen

- **Št. v izvirnem poročilu:** 19
- **Resnost:** Medium
- **Status:** Odprto

Lokacija: [main.cpp (line 3624)](C:/Users/rober/Documents/PlatformIO/Projects/Pametni_Cebelnjak/src/main.cpp:3624), verifyLittlefsInstall().

- Napaka: nova spletna stran se trajno namesti, nato se šele začne prenos firmware-a. Povrnitev starega LittleFS ni predvidena.
- Scenarij: drugi prenos odpove ali zmanjka napajanja. Naprava ostane s starim firmware-om in novim vmesnikom; prekinitev med pisanjem LittleFS lahko odstrani lokalni vmesnik.
- Popravek: pred namestitvijo pripraviti in preveriti oba artefakta; zagotoviti združljivost različic ter obnovitveno oziroma dvojno datotečno particijo.

**Evidenca reševanja**

- **Nosilec / veja:** —
- **Popravek / različica / commit:** —
- **Merilo zaprtja:** Napaka prenosa firmware-a po pripravi LittleFS in prekinitev napajanja omogočata obnovitev združljivega firmware-a ter lokalnega vmesnika.
- **Preverjanje popravka / datum:** —

<a id="m-07"></a>

## M-07 — različni OTA načini nimajo skupne izključitve

- **Št. v izvirnem poročilu:** 20
- **Resnost:** Medium
- **Status:** Odprto

Lokacija: [main.cpp (line 5265)](C:/Users/rober/Documents/PlatformIO/Projects/Pametni_Cebelnjak/src/main.cpp:5265), maintainArduinoOta(), initializeElegantOta(), processOtaUpdate().

- Napaka: ArduinoOTA ne preveri firmwareUpdateInProgress, ElegantOTA pa nima skupnega dovoljenja za začetek med cloud OTA. Vsi uporabljajo globalni Update in LittleFS.
- Scenarij: med cloud posodobitvijo uporabnik začne lokalno posodobitev. Postopka si lahko prekineta zapisovanje in napačno upravljata priklop LittleFS.
- Popravek: enoten upravljalnik OTA seje z izključnim lastnikom; druge načine zavrniti pred kakršnimkoli posegom v Update ali datotečni sistem.

**Evidenca reševanja**

- **Nosilec / veja:** —
- **Popravek / različica / commit:** —
- **Merilo zaprtja:** Začetek kateregakoli drugega OTA načina med aktivno sejo je zavrnjen pred spremembo Update ali LittleFS; preverjene so vse kombinacije načinov.
- **Preverjanje popravka / datum:** —

**Opomba ob uskladitvi:** `0.1.0-rc.75` dodaja ključavnico med lokalnim rebootom in začetkom/zaključkom ElegantOTA. To še ni skupna izključitev ArduinoOTA, ElegantOTA in cloud OTA, zato M-07 ostaja odprt.

<a id="m-08"></a>

## M-08 — ukaz je trajno označen kot izveden pred zaključkom dejanja

- **Št. v izvirnem poročilu:** 21
- **Resnost:** Medium
- **Status:** Odprto

Lokacija: [main.cpp (line 3777)](C:/Users/rober/Documents/PlatformIO/Projects/Pametni_Cebelnjak/src/main.cpp:3777), processQueuedFirmwareUpdateCommand(), markControlRequestProcessed().

- Napaka: ID se shrani kot »processed« pred dejansko izvedbo, tudi pri večstopenjskem brisanju zgodovine.
- Scenarij: naprava se ponovno zažene po izbrisu SD, pred izbrisom Firebase. Ob ponovnem prejemu se ukaz samo potrdi kot že obdelan; cloud zgodovina ostane.
- Popravek: trajno razlikovati med sprejetim, začetim in dokončanim ukazom; shraniti korak večstopenjskega postopka ter ga obnovljivo nadaljevati.

**Evidenca reševanja**

- **Nosilec / veja:** —
- **Popravek / različica / commit:** —
- **Merilo zaprtja:** Ponovni zagon po vsakem koraku večstopenjskega ukaza nadaljuje nedokončano delo in ne potrdi nedokončanega ukaza kot uspešnega.
- **Preverjanje popravka / datum:** —

<a id="m-09"></a>

## M-09 — različne lokalne zgodovinske zahteve uporabljajo isto datoteko odgovora

- **Št. v izvirnem poročilu:** 22
- **Resnost:** Medium
- **Status:** Odprto

Lokacija: [main.cpp (line 6032)](C:/Users/rober/Documents/PlatformIO/Projects/Pametni_Cebelnjak/src/main.cpp:6032) in [main.cpp (line 6195)](C:/Users/rober/Documents/PlatformIO/Projects/Pametni_Cebelnjak/src/main.cpp:6195).

- Napaka: stanje Ready ne beleži aktivnega HTTP prenosa. Nova zahteva lahko začne odstranjevati in ponovno ustvarjati history-response.json, medtem ko jo prejšnji odziv še bere.
- Scenarij: dva telefona zahtevata različni obdobji ali en odjemalec počasi prenaša odgovor. Glede na obnašanje datotečnega sistema lahko odpove priprava novega odgovora ali prejšnji prenos.
- Popravek: nespremenljiva datoteka za posamezno generacijo odgovora oziroma referenčno štetje aktivnih prenosov.

**Evidenca reševanja**

- **Nosilec / veja:** —
- **Popravek / različica / commit:** —
- **Merilo zaprtja:** Sočasni zahtevi za različni obdobji in počasen odjemalec prejmejo vsak svoj celovit, nespremenjen odgovor.
- **Preverjanje popravka / datum:** —

<a id="l-01"></a>

## L-01 — Android instrumentacijski test preverja napačen paket

- **Št. v izvirnem poročilu:** 23
- **Resnost:** Low
- **Status:** Odprto

Lokacija: [ExampleInstrumentedTest.java (line 26)](C:/Users/rober/Documents/PlatformIO/Projects/Pametni_Cebelnjak/android-app/android/app/src/androidTest/java/com/getcapacitor/myapp/ExampleInstrumentedTest.java:26).

- Napaka: pričakuje com.getcapacitor.app, dejanski applicationId pa je si.pametnicebelnjak.app.
- Scenarij: instrumentacijski test na napravi ali emulatorju odpove tudi pri pravilno zgrajeni aplikaciji.
- Popravek: uskladiti pričakovani paket; vzorčne teste dopolniti s preverjanji dejanskega provisioning postopka.

**Evidenca reševanja**

- **Nosilec / veja:** —
- **Popravek / različica / commit:** —
- **Merilo zaprtja:** Instrumentacijski test na emulatorju ali napravi preveri si.pametnicebelnjak.app in uspe.
- **Preverjanje popravka / datum:** —

<a id="f-01"></a>

## F-01 — Izgubljen Firebase callback je trajno blokiral latest in heartbeat

- **Izvor:** naknadna diagnostika 5. septembra 2026; ni del prvotnih 23 ugotovitev.
- **Resnost:** High
- **Status:** Rešeno
- **Lokacija:** [src/main.cpp](../src/main.cpp), `recoverMissingFirebaseWrites()`, `recoverMissingFirebaseWrite()`, `processData()` in funkcije za pošiljanje; [firebase_recovery.h](../include/firebase_recovery.h).
- **Napaka:** po odstranitvi asinhronega opravila brez uporabnega končnega callbacka je lahko ostala zastavica `in_flight`. Pri nekaterih zapisih so se zastavice nastavile šele po klicu knjižnice in tako lahko prepisale stanje, ki ga je že nastavil takojšnji callback napake.
- **Scenarij:** lokalne meritve in cloud zgodovina so se osveževale, `latest` ter heartbeat pa sta ostala stara; cloud je napravo prikazoval kot offline.
- **Popravek:** `0.1.0-rc.75` po najmanj treh sekundah od začetka izgubljene zahteve in ob prazni Firebase vrsti sprosti zastavico ter zahteva ponovitev aktualnih podatkov. Pokriti so latest, heartbeat, celoten status, SD status in aktivacijska skrivnost. Zastavice in čas začetka se nastavijo pred klicem knjižnice. Dodana je lokalna diagnostika potrditev in obnovitev.
- **Različica / commit:** firmware `0.1.0-rc.75`; popravek je ob uskladitvi v delovni kopiji, commit še ni evidentiran. Opis je v [CHANGELOG.md](CHANGELOG.md).
- **Preverjanje popravka / datum:** 5. september 2026. Uspešna gradnja običajnega in OTA okolja; statične C++ trditve v [test_policy.cpp](../test/firebase_recovery/test_policy.cpp) pokrijejo neaktivno zahtevo, aktivno vrsto, mejo tolerance, začetni čas nič in preliv `millis()`. Firmware in LittleFS sta bila uspešno nameščena prek Wi-Fi OTA.
- **Preverjanje na napravi:** zadnji pregled po preizkusnem rebootu je pokazal meritev in Firebase potrditev latest ob **23:37:40**, potrditev heartbeat-a ob **23:37:58**, `last_error_code = 0` in `sync.caught_up = true`. Uporabnik je potrdil pravilni online status in sveže latest podatke v cloudu.
- **Meja dokaza:** prvotni izgubljeni callback ni bil namensko ponovno povzročen na fizični napravi. Preverjena sta politika obnove in ponovno delovanje zapisov po namestitvi; to ni dokaz dolgoročne odsotnosti vseh Firebase težav.

Lokalni reboot je spremljevalna funkcionalnost tega popravka. Sedem testov v [local_reboot.test.cjs](../test/local_reboot.test.cjs) preverja vmesnik za reboot, **ne** Firebase obnove. Na napravi sta bili preverjeni zavrnitvi manjkajoče/napačne potrditve (`403`), sprejem veljavne zahteve (`202`), spremenjeni ID zagona, ohranjene nastavitve in zaznana SD kartica.

<a id="f-02"></a>

## F-02 — naprava po uspešnem ACK-u ponavlja zavrnjene potrditve

- **Izvor:** naknadni praktični preizkus `0.1.0-rc.76`, ni del prvotnih 23 ugotovitev.
- **Resnost:** Medium.
- **Status:** Rešeno.
- **Lokacija:** [main.cpp](../src/main.cpp), `clearControlCommand()`, `processPendingControlCommand()`, `processData()` ter obravnava ponovljenih SSE dogodkov v `enqueueControlCommand()`.
- **Napaka:** po uspešnem NTP ukazu in pravilnem ACK-u, ko je `control/command` že prazen, naprava še naprej približno vsakih 30 sekund oddaja PATCH na `control`. Pravila ga zavrnejo, ker odstranitev zahteva še obstoječ ukaz z ustreznim ID-jem. Ponovitve obremenjujejo kanal in povzročajo trajno ponavljajoč `401` v diagnostiki.
- **Scenarij / dokaz:** pojav je bil opažen po prvem NTP ukazu in ponovljen po nadzorovanem rebootu ter novem ukazu H-05. Drugi ACK je uspel ob `1788695586`, nova napaka se pojavi ob `1788695616` in znova ob `1788695646`. Firebase profiler pred rebootom potrdi `rest-update`, pot `/devices/CB-608C004AEC24/control`, `allowed: false`, čas `1788695433381` ms. `latest`, heartbeat in zgodovina se medtem uspešno zapisujejo.
- **Meja diagnoze:** potrjena sta zavrnjena pot in ponavljanje po uspešnem ACK-u. Točen vrstni red callbackov, ki ponovno postavi čakajočo zastavico, še ni izolirano reproduciran. Koda pri uspešnem `clearControlCommand` nima izrecne uskladitve morebitnega ponovno postavljenega pending stanja; sam ukaz se z novim ID-jem pravilno izvede, zato to ne odpira ponovno H-05.
- **Popravek:** `0.1.0-rc.77`, še brez commita. [control_ack_state.h](../include/control_ack_state.h) vodi ločeno čakajoče, oddano in potrjeno stanje z ID-jem zahteve ter interno oznako asinhronega rezultata. `processData()` zaključi samo dejansko oddani ACK; ob napaki ponovno pripravi samo ta ID, če medtem ni že pripravljen nov ukaz. `enqueueControlCommand()` ignorira pozni SSE dogodek za ID, ki je bil v tem zagonu že uspešno potrjen.
- **Merilo zaprtja:** po uspešnem NTP ukazu vsaj več intervalov ponovitve ni več zavrnjenih PATCH-ov za isti ID; izgubljeni ACK se še vedno obnovi, pozna potrditev starega ID-ja pa ne poseže v novega. Test pokrije vrstni red uspešnega odgovora, ponovljenega SSE dogodka in poznega callbacka.
- **Nosilec / različica / preverjanje:** Codex / `0.1.0-rc.77`, še brez commita. Gostiteljski regresijski test pokrije uspešen ACK in pozen SSE istega ID-ja, izgubljeni callback, nov ukaz med ponovitvijo starega ACK-a ter uspešen zaključek obeh ID-jev. Na napravi je bil 6. septembra izveden NTP ukaz; po potrditvi je `/api/status` več kot 60 sekund ostal brez Firebase napake, hkrati pa sta se latest in heartbeat nadaljevala. Ponovljenega PATCH-a na `control` ni bilo. Dokazi iz prejšnje reprodukcije: [HARDWARE_TEST_RC76.md](HARDWARE_TEST_RC76.md), lokalna `.pio/hardware-verification/firebase-profile.jsonl` in `sse-live.json`.

<a id="f-03"></a>

## F-03 — kratek izpad HX711 ustvari prazno maso v zgodovini

- **Izvor:** praktični preizkus naprave s firmware-om `0.1.0-rc.77`, 6. september 2026; ni del prvotnih 23 ugotovitev.
- **Resnost:** Medium.
- **Status:** Čaka preverjanje.
- **Lokacija:** [src/main.cpp](../src/main.cpp), `initializeLoadCell()`, `processLoadCellSampling()` in `sendMeasurements()`.
- **Napaka:** prvi arhivski zapis po zagonu lahko nastane pred prvim petvzročnim povprečjem HX711. Pri kasnejšem kratkem timeoutu koda izbriše še svežo potrjeno maso, po petih timeoutih pa vzorčenje ustavi do minutne ponovne inicializacije. BME680 se medtem normalno zapiše, masa pa ostane prazna.
- **Scenarij / dokaz:** dejanski `/measurements.csv` naprave `CB-608C004AEC24` vsebuje ob `19:48:32` in `19:57:45` prazno `weight_kg`, medtem ko so ob `19:42:57`, `19:53:34` in `20:02:46` temperatura, vlaga in masa veljavne. Lokalni in cloud graf pravilno ne narišeta `null`, zato je videti daljša vrzel.
- **Popravek:** `0.1.0-rc.78` odloži prvi arhivski zapis do prve potrjene mase oziroma začetnega timeouta. Kratek timeout ali nejasen kandidat pusti zadnje potrjeno povprečje na voljo največ dve sekundi; nato `readLoadCell()` še vedno vrne `false`. Običajno vzorčenje po stanju napake nadaljuje, zato se vrnjen signal obdeluje takoj.
- **Merilo zaprtja:** po zagonu ima prvi SD arhivski zapis veljavno maso, kadar HX711 odgovori v začetnem časovnem oknu. Ob kratki motnji masa v naslednjem 5-minutnem arhivu ne postane `null`; ob dejanskem daljšem odklopu pa ostane `null` in health stanje pokaže napako.
- **Preverjanje popravka / datum:** gostiteljski regresijski test preveri ohranitev sveže mase pri timeoutu in zavrnitev mase, starejše od dveh sekund. Fizično preverjanje s panjem v uporabi še čaka; ne izvajaj namernega odklopa merilnih celic.

## Preverjanja in povzetek iz izvirnega poročila

Spodaj je zgodovinski zapis iz prvotnega pregleda. Izolirane simulacije in preizkusi, navedeni tu ali pri posamezni ugotovitvi, so dokazi prvotnega pregleda, ne preverjanja poznejših popravkov. Takrat fizična naprava in dejanska Firebase baza nista bili uporabljeni; poznejša preverjanja F-01 so opisana posebej.

### Opravljena preverjanja

- Sintaksa petih JavaScript datotek: uspešna.
- Sintaksa obeh Python skript in razčlenitev glavnih JSON konfiguracij: uspešna.
- Izolirana preverjanja: potrjen prehod pravila lastništva pri manjkajočih kodah in nespremenljiva pokritost cloud predpomnilnika.
- Simulaciji razčlenjevanja SSE in paketnega agregiranja sta potrdili opisani napaki.
- Preverjena dejanska lokalna implementacija HX711, ESPAsyncWebServer in Preferences.
- Git delovno drevo je ostalo čisto.
Polnega firmware/Android builda in Firebase Emulator Suite nisem izvajal. Firmware testna mapa vsebuje samo predlogo, Android pa vzorčna testa brez pokritosti poslovne logike.
### Povzetek

- Critical bugs: 1 — nepreverjen TLS omogoča ponarejen OTA.
- High priority bugs: 12 — prednost imajo izgubljanje agregatov, zastoj obnove/brisanja, SSE ukazi, HX711, ElegantOTA in SD viri; pred produkcijo tudi vse navedene varnostne poti.
- Medium/Low issues: 10 — predpomnjenje, sočasni dostop do stanja, časovni preskoki, nepopolna obnovljivost OTA/ukazov in napačen test.
- Videti pravilno: profil ESP32-S3 in nastavitve pomnilnika; lokalno priložen uPlot; preverjanje neuspelih PSRAM alokacij; neodvisna veljavnost meritev senzorjev; ločeni števci vzorcev pri agregiranju; strežniški heartbeat; preverjanje SHA-256 pred aktivacijo firmware-a; preverjanje veljavnosti RTC časa; atomarno sprejemanje povabil in transakcijsko preprečevanje prepisovanja čakajočega cloud ukaza. Lokalna Firebase konfiguracija in OTA poverilnice niso sledene v Git-u.

## Preslikava napačnih prejšnjih oznak

Ta tabela ohranja sledljivost prejšnjih pogovorov. Prejšnji seznam ni bil zanesljiv prepis izvirnega poročila; spodnje nove oznake so od 6. septembra 2026 merodajne.

| Prejšnja oznaka | Nova oznaka oziroma obravnava |
| --- | --- |
| C-01 — anonimni zapisi | H-01; v izvirnem poročilu je resnost High, Critical je TLS/OTA |
| H-01 — TLS | C-01 |
| H-02, H-03, H-05 — lokalni API, razkrita koda in OTA | H-02; skupaj kot v izvirnem poročilu |
| H-04 — anonimno branje/potrjevanje ukazov | V obsegu H-01; ni dodatna samostojna izvirna postavka |
| H-06 — »neavtenticiran SD upload« | Umaknjena napačna trditev; oba upload handlerja preverjata avtentikacijo. Izvirni težavi SD uploada sta H-10 in H-11 |
| H-07 — ugibanje aktivacijske kode | Ni izvirna ugotovitev; umaknjeno iz potrjenega seznama. Izvirni prevzem brez kode je H-03 |
| H-08 — v kodi določen skrbniški UID | Ni izvirna ugotovitev; umaknjeno iz potrjenega seznama |
| H-09 — zastali latest/heartbeat | F-01; naknadno odkrita in rešena težava |
| H-10 — splošna sočasnost | Splošni opis zamenjan z izvirnimi konkretnimi ugotovitvami, med drugim M-02, M-07 in M-09 |
| H-11 — splošna fragmentacija pomnilnika | Ni izvirna potrjena ugotovitev; umaknjeno. Izvirni leak pri prekinjenem SD uploadu je H-10 |
| H-12 — HX711 (po naknadnem popravku dokumenta) | H-08 |
| Prvotna napačna H-12 — reboot brez skupne avtentikacije | V obsegu H-02; reboot je bil dodan po prvotnem pregledu |

## Dnevnik evidence

| Datum | Postavke | Sprememba |
| --- | --- | --- |
| 2026-09-05 | F-01 | Nameščen in preverjen popravek latest/heartbeat v `0.1.0-rc.75`; uporabnik potrdi cloud delovanje |
| 2026-09-06 | C-01, H-01–H-12, M-01–M-09, L-01 | Vseh 23 izvirnih ugotovitev prenesenih po priloženem poročilu; ohranjene resnosti in izvirne zaporedne številke |
| 2026-09-06 | Prejšnja evidenca | Popravljene napačne oznake, umaknjene nadomestne/nepodprte trditve; F-01 ločen od izvirnega pregleda |
| 2026-09-06 | H-05, H-06, H-07, H-08, H-10 | Popravki v `0.1.0-rc.76`; gostiteljski regresijski testi in končni `pio run` uspešni. Status Odprto → Čaka preverjanje: namestitev in fizični/end-to-end preizkusi še niso izvedeni |
| 2026-09-06 | H-06 | Po uporabnikovi namestitvi uspešna obnova 21 dni/20.649 meritev; primerjava 473 ur in 20 dni brez odstopanj. Čaka preverjanje → Rešeno |
| 2026-09-06 | H-05, H-08, H-10 | Praktični testi in njihove omejitve zapisani v HARDWARE_TEST_RC76.md; opažen ponavljajoč Firebase 401 neznane zahteve. H-07 in tariranje/odklop HX711 namensko nista bila izvajana na panju v uporabi |
| 2026-09-06 | H-05 | Nadzorovan reboot s starim ACK-om in novim čakajočim NTP ukazom: potrjen novi ID, ukaz odstranjen, NTP zaključen. Čaka preverjanje → Rešeno |
| 2026-09-06 | F-02 | Profiler potrdi zavrnjene PATCH-e na control po že uspešnem ACK-u; pojav se ponovi po novem zagonu. Nova naknadna postavka Medium / Odprto |
| 2026-09-06 | F-02 | Popravek v `0.1.0-rc.77`: ACK ima ločeno čakajoče, oddano in potrjeno stanje; pozen SSE dogodke ne obudi potrjenega ID-ja. Gostiteljski regresijski test uspešen. Odprto → Čaka preverjanje: fizični test po namestitvi še ni izveden |
| 2026-09-06 | F-02 | NTP ukaz na napravi, nato več kot 60 sekund brez Firebase napake in ob nadaljnjih latest/heartbeat zapisih. Čaka preverjanje → Rešeno |
| 2026-09-06 | F-03 | Dejanski CSV pokaže prazno maso po zagonu in pri kratki motnji HX711. Popravek v `0.1.0-rc.78`, gostiteljski regresijski test uspešen. Odprto → Čaka preverjanje fizičnega opazovanja |

Pri naslednjem popravku dodaj vrstico z ID-jem, različico/commitom, spremembo statusa in rezultatom merila zaprtja. Evidenca ni nalog za samodejno izvajanje vseh popravkov.
