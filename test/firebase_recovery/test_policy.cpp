#include "firebase_recovery.h"

// Preverjanja se izvedejo že pri prevajanju, zato ne potrebujejo USB povezave.
static_assert(!firebaseWriteNeedsRecovery(false, 1000, 6000, true, 3000), "Zakljucene zahteve ne ponavljamo.");
static_assert(!firebaseWriteNeedsRecovery(true, 1000, 3999, true, 3000), "Pocakamo na callback.");
static_assert(firebaseWriteNeedsRecovery(true, 1000, 4000, true, 3000), "Izgubljena zahteva se obnovi na meji tolerance.");
static_assert(!firebaseWriteNeedsRecovery(true, 1000, 30000, false, 3000), "Aktivno opravilo ima lasten watchdog.");
static_assert(firebaseWriteNeedsRecovery(true, 0, 3000, true, 3000), "Zacetek pri millis nic je veljaven.");
static_assert(!firebaseWriteNeedsRecovery(true, UINT32_MAX - 999, 1999, true, 3000), "Toleranca velja cez preliv.");
static_assert(firebaseWriteNeedsRecovery(true, UINT32_MAX - 999, 2000, true, 3000), "Obnovitev deluje cez preliv.");
