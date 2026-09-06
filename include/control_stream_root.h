#pragma once

#include <cJSON.h>

// Korenski SSE posnetek vsebuje tudi ack. Polja ukaza beremo izključno iz command.
// Callback prejme začasni JSON niz, ki velja samo med njegovim klicem.
template <typename Settings, typename Command, typename Reset>
bool processControlRootEvent(const char *payload, bool replacement,
                             Settings settings, Command command, Reset reset) {
  cJSON *root = cJSON_ParseWithOpts(payload, nullptr, true);
  if (root == nullptr) return false;
  if (!cJSON_IsObject(root) && !cJSON_IsNull(root)) {
    cJSON_Delete(root);
    return false;
  }
  const cJSON *settingsObject = cJSON_GetObjectItemCaseSensitive(root, "settings");
  if (cJSON_IsObject(settingsObject)) {
    char *json = cJSON_PrintUnformatted(settingsObject);
    if (json != nullptr) { settings(json); cJSON_free(json); }
  }
  const cJSON *commandObject = cJSON_GetObjectItemCaseSensitive(root, "command");
  if (cJSON_IsObject(commandObject)) {
    char *json = cJSON_PrintUnformatted(commandObject);
    if (json != nullptr) { command(json); cJSON_free(json); }
  } else if (cJSON_IsNull(commandObject) || (replacement && commandObject == nullptr)) {
    reset();
  }
  cJSON_Delete(root);
  return true;
}
