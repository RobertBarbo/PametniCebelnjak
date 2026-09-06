# Regresijski testi firmware-a

Testi H-05, H-06, H-07, H-08, H-10 in F-02 tečejo na računalniku brez ESP32 ali povezave s produkcijsko bazo. Skripta iz `src/main.cpp` izlušči dejanske funkcije; algoritmi niso prepisani v teste. GPIO, datoteke, ura, NVS in asinhroni transport imajo testne nadomestke. SSE uporablja pravi cJSON 1.7.19, enako različico kot nameščeni ESP-IDF paket.

## Zagon

Po običajnem `pio run` je na voljo glava cJSON. Za Windows gostiteljski prevajalnik in testni C vir enkrat pripravi:

```powershell
pio pkg install --global --tool platformio/toolchain-gccmingw32
New-Item -ItemType Directory -Force -Path .pio/test-deps | Out-Null
Invoke-WebRequest -Uri 'https://raw.githubusercontent.com/DaveGamble/cJSON/v1.7.19/cJSON.c' -OutFile .pio/test-deps/cJSON.c
```

Nato iz korena projekta:

```powershell
python scripts/test_firmware_regressions.py
pio run
```

Če ukaza nista v `PATH`, uporabi izvršljiva programa iz `~/.platformio/penv/Scripts/`. Drug prevajalnik C++14, izvor cJSON ali imenik njegove glave lahko podaš z `--cxx`, `--cjson-source` in `--cjson-include`. Artefakti nastanejo samo v ignorirani `.pio/firmware-regressions/`; skripta ne spreminja firmware-a. Neuspešna trditev ali prevod vrne neničelno izhodno kodo, izvajanje pa je časovno omejeno.

## Pokritje

- **H-05:** stari ACK pred novim ukazom, obratni vrstni red, velik ACK z majhnim ukazom, `put`, `patch`, `null`, odsoten ukaz, neveljaven JSON in ubežni znaki.
- **H-06:** cel dan minutnih in petminutnih meritev, večurne vrzeli, meja dneva, neveljavne vrstice, ponovitev brez ACK-a ter veljavna/neveljavna cloud predpona. Test primerja vse urne ključe in števce z neodvisnim pričakovanim rezultatom.
- **H-07:** brisanje med gradnjo lokalnega indeksa, branjem cloud indeksa in prenosom dni; čakanje na aktivno zahtevo, zaprtje SD ročaja pred brisanjem, izgubljeni callback in timeout. Dodatne statične trditve preverijo, da firmware med brisanjem ne nadaljuje obnove in timeout ni skrit za njenim stanjem.
- **H-08/F-03:** izpad pred vsakim od 5 oziroma 20 vzorcev, meja timeouta, preliv `millis()`, negativni ADC razpon, točno 25 impulzov, filter velikih skokov, postopno tariranje, ohranitev stare ničle pri napaki NVS, kratek timeout z ohranjeno svežo maso in izločitev prestare mase.
- **H-10:** 100 zaporednih prekinitev, nič odprtih ročajev in začasnih datotek po čiščenju, ponovljen disconnect, dva sočasna prenosa v isti cilj, uspešen zaključek, zavrnitev avtentikacije, napaka preimenovanja in več datotek v eni zahtevi.
- **F-02:** uspešen ACK, nato pozen SSE istega ukaza; izgubljeni callback, nov ukaz med ponovitvijo starega ACK-a in uspešno dokončanje obeh ID-jev.

## Meje preverjanja

To niso meritve heap-a na ESP32 ali end-to-end testi Wi-Fi/Firebase. Testi ne simulirajo električnih časov HX711, vseh prekinitev FreeRTOS ali fizične odpovedi SD. Po namestitvi preveri pravo tariranje in odklop HX711, ponovljene prekinjene HTTP prenose s spremljanjem prostega heap-a, reconnect SSE s čakajočim ukazom ter obnovo in brisanje na testni zgodovini. Produkcijske zgodovine testi ne brišejo.
