#pragma once

#include <stdint.h>

// Izgubljen callback obravnavamo šele po toleranci; odštevanje velja tudi ob prelivu millis().
constexpr bool firebaseWriteNeedsRecovery(bool inFlight, uint32_t startedMillis,
                                          uint32_t nowMillis, bool queueEmpty,
                                          uint32_t graceMillis)
{
  return inFlight && queueEmpty && uint32_t(nowMillis - startedMillis) >= graceMillis;
}
