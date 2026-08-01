# Lokalna nadzorna plošča

Nadzorna plošča v tej mapi ima dva načina: na ESP32 se iz LittleFS streže prek lokalnega IP naslova in bere lokalna API-ja; drugje neposredno bere Firebase Realtime Database za `hives/panj_1`.

## Lokalni ESP32 pogled

1. Naloži firmware z `pio run -t upload`.
2. Naloži to mapo v LittleFS z `pio run -t uploadfs`.
3. V serijskem monitorju poišči izpis `Local dashboard: http://.../` in ta naslov odpri v brskalniku na istem Wi-Fi omrežju.

Lokalni graf bere `/measurements.csv` na SD kartici. Izbirnik podpira hitra obdobja ali poljuben začetni in končni datum z uro; lokalni API sprejme obdobje do 366 dni in podatke ustrezno časovno združi. Po grafu povleci z miško ali prstom za X-zoomiranje.

## Zagon lokalno

1. Preveri lokalno datoteko `firebase-config.js`. Za novo razvojno okolje kopiraj `firebase-config.example.js` v `firebase-config.js` in vpiši Firebase spletno konfiguracijo.
2. Iz korena projekta zaženi lokalni strežnik:

   ```powershell
   py -m http.server 8080 --directory web
   ```

3. Odpri `http://localhost:8080`.

Datoteke ne odpiraj neposredno prek `file://`, ker brskalniški ES moduli potrebujejo HTTP strežnik.

## Highcharts

Grafi uporabljajo lokalno kopijo `vendor/highcharts.js`, ki se skupaj z ostalimi datotekami naloži v LittleFS. Zato lokalni pogled za prikaz grafov ne potrebuje interneta. Pred produkcijsko ali komercialno uporabo preveri licenco Highcharts.

## Firebase pravila

Za prikaz podatkov mora imeti spletni odjemalec dovoljenje za branje poti `/hives/panj_1`. Razvojna javna pravila niso primerna za produkcijo; pred objavo na Firebase Hostingu dodamo Firebase Authentication in omejena varnostna pravila.
