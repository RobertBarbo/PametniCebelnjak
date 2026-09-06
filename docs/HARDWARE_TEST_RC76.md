# Preizkus firmware-a 0.1.0-rc.76 na napravi

Datum: **6. september 2026**, približno 13:31–13:55 (Europe/Ljubljana). Naprava `CB-608C004AEC24`, lokalno `192.168.64.116`. Firmware je namestil uporabnik; `/api/status` potrdi `0.1.0-rc.76`.

Uporabnik je dovolil neuničujoče teste na panju v uporabi. **Tariranje, odklop HX711 in brisanje zgodovine niso bili izvedeni.** Med tem preizkusom ni bilo sprememb firmware-a, LittleFS, Hostinga ali Firebase pravil.

## Rezultati

| Preizkus | Rezultat | Meja dokaza |
| --- | --- | --- |
| Osnovno delovanje / H-08 | BME680, HX711, DS3231 in SD so `ok`; masa okoli 54,07–54,08 kg, meritve in potrditve Firebase napredujejo med testi | Odpoved med vzorčenjem in tariranje na tej napravi nista preverjena |
| H-10: prekinjeni SD uploadi | 10/10 prekinitev: med prenosom po ena začasna datoteka, po disconnectu nič preostalih testnih datotek | API ne izpostavlja prostega heap-a ali števila odprtih ročajev, zato pomnilnik ni neposredno izmerjen |
| H-10: normalen upload po prekinitvah | HTTP `201`, 4.400 B prenesenih nazaj in bajtno primerjanih brez razlike; odstranjena samo na novo ustvarjena testna datoteka | Testirane so zaporedne prekinitve; sočasnost je pokrita z gostiteljskim testom |
| H-06: obnova | `completed`, 21/21 dni, 20.649/20.649 potrjenih meritev, nato `caught_up = true` | Obnovljena je obstoječa zgodovina pod istimi ključi; brisanja ni bilo |
| H-06: preverjanje urnih agregatov | **473/473 zaključenih ur** ima pravilno število vzorcev, števce posameznih senzorjev in povprečja glede na kopijo SD | Tekoča ura je izločena zaradi novih meritev med testom |
| H-06: preverjanje dnevnih agregatov | **20/20 zaključenih dni** ima pravilno število vzorcev, povprečja in `raw_sync_version = 5` | Tekoči dan je izločen zaradi novih meritev med testom |
| H-05: začetni SSE po rebootu | Med odklopom oddan nov NTP ukaz ob ohranjenem starem ACK-u; po novem zagonu naprava potrdi točno novi ID, odstrani ukaz in zaključi NTP | En uspešen namenski preizkus na napravi; permutacije JSON so dodatno pokrite z gostiteljskimi testi |
| H-07 | Ni izveden | Destruktivni preizkus ni dovoljen na uporabljani zgodovini |

**H-05 in H-06 sta zaprti kot Rešeno.** H-07, H-08 in H-10 ohranijo status Čaka preverjanje zaradi navedenih preostalih meril. Ponovljene zavrnjene potrditve so nova postavka **F-02 / Medium / Odprto**.

## Namenski preizkus H-05

Pred preizkusom je bil `control/command` prazen, stari ACK pa `ac3074e0-e712-47a9-9007-649afd7661f0`. Lokalni API je dovolil reboot; izveden je bil en ponovni zagon, ID `1607458164 → 156831003`. Med potrjenim odklopom je bil prek avtentikacijskega in HTTP vmesnika nameščenega Firebase CLI oddan ukaz `sync_ntp` z ID-jem `review-sse-0edfda5c-8b13-4114-bc7a-38d2a28a8129`. Pogojni PUT z ETag/If-Match je zagotavljal, da se morebitni vmesni uporabnikov ukaz ne prepiše.

Po ponovni povezavi je naprava dobila stari ACK in novi ukaz. Novi ACK ob `1788695586` (13:53:06) vsebuje točno novi ID, `command` je prazen, NTP ni več pending, RTC je veljaven in tehtanje deluje (54,06 kg). Zgodovina ni bila brisana in tare ni bil sprožen. Med rebootom je bila pričakovana kratka prekinitev meritev.

## Opaženi Firebase 401

Začetni lokalni status je imel `last_error_code = 0`. Med spremljanjem po NTP ukazu se je pojavil `401`; čas napake se je nato obnavljal približno vsakih 30 sekund. Medtem so `latest`, heartbeat in obnova zgodovine dobivali uspešne potrditve. Napaka je ostala opažena tudi po zaključku obnove.

Lokalna diagnostika ne vsebuje UID-ja oziroma poti neuspešne zahteve. Zato je bil izveden 40-sekundni zajem Firebase profilerja: pri času `1788695433381` ms potrdi `rest-update` na `/devices/CB-608C004AEC24/control` z `allowed: false`. Gre za zavrnjeni PATCH potrditvenega kanala, ne zavrnitev meritev ali agregatov.

Po uspešnem namenskem preizkusu H-05 je diagnostika sprva kazala 0, nato pa se `401` znova pojavi ob `1788695616`, `1788695646` in `1788695676` — vsakih 30 sekund po ACK-u ob `1788695586`. Naprava torej nadaljuje potrjevanje že odstranjenega ukaza. Točen vrstni red callbackov, ki ohrani ponavljanje, še ni potrjen; potreben je ločen popravek življenjskega cikla ACK-a. Firebase pravil zaradi tega ne slabimo. Napaka je evidentirana kot [F-02](CODE_REVIEW_TRACKER.md#f-02).

Opaženi stari ACK: `82b5ca77-937e-4705-8889-f26c42542eee`. Novi ACK: `ac3074e0-e712-47a9-9007-649afd7661f0`, `acknowledged_at = 1788694591` (13:36:31). Zadnja NTP sinhronizacija: `1788694589`; RTC ostaja veljaven. Zaključek obnove: `1788695031` (13:43:51).

## Dokazi in lokalna kopija

Pred obnovo je bila prebrana kopija `measurements.csv` (966.246 B), SHA-256:

`218e22c37d435181dbdd01b46d3cb602cdc955131307596afb9ca80fb43931f6`

Urni agregati so bili prebrani z uradnim Firebase CLI prek njegove obstoječe prijave. Anonimno branje te poti je pravilno vrnilo `401`; zato ga nismo uporabljali za numerično primerjavo. To je ločeno od napak, ki jih je sporočala naprava. Lokalno geslo SD je ostalo samo v pomnilniku in ni del testnih artefaktov.

Podrobni podatki ostanejo lokalno v ignorirani `.pio/hardware-verification/`:

- `measurements-before.csv`, `daily-before.json`: kopija pred obnovo.
- `upload-results.json`: posamezne prekinitve, hash uspešnega uploada in stanje naprave.
- `hourly-after.json`, `hourly-comparison.json`: dejanski cloud urni agregati in primerjava vseh zaključenih ur.
- `daily-after.json`, `daily-comparison.json`: dnevni agregati in primerjava zaključenih dni.
- `latest-status.json`, `control-after.json`: zadnji pregled brez omrežnih skrivnosti.
- `sse-live.json`: stari/novi ID zagona, pripravljeni ukaz in potrjeni ACK namenskega testa H-05.
- `firebase-profile.jsonl`: metapodatki operacij, ki potrjujejo zavrnjeno pot `control`; brez vsebin meritev ali poverilnic.

Primerjava uporablja SD vrednosti in toleranco 0,011 za povprečja zaradi shranjevanja Firebase vrednosti na dve decimalki. Števci se morajo ujemati natančno. Mapa `.pio` je začasna; zgornji povzetek ostane trajno v dokumentaciji tudi po njenem čiščenju.
