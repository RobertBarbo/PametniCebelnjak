Import("env")

import os

ota_password = env.GetProjectOption("custom_ota_password", "").strip()
if not ota_password:
    ota_password = os.environ.get("ESP32_OTA_PASSWORD", "").strip()

if ota_password:
    env.Append(UPLOADERFLAGS=["--auth", ota_password])
