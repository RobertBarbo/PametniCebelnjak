"""Gostiteljski testi H-05/06/07/08/10; firmware se izlušči brez kopije algoritmov.

Potrebuje C++14 prevajalnik (--cxx) in cJSON 1.7.19 C vir (--cjson-source).
Privzeto uporabi PlatformIO GCC/Arduino paket in .pio/test-deps/cJSON.c.
Testni artefakti ostanejo v ignorirani mapi .pio/firmware-regressions.
"""

import argparse
import os
from pathlib import Path
import re
import subprocess


def main():
    root = Path(__file__).resolve().parents[1]
    packages = Path(os.environ.get("PLATFORMIO_CORE_DIR", Path.home() / ".platformio")) / "packages"
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--cxx", default=str(packages / "toolchain-gccmingw32/bin/g++.exe"))
    parser.add_argument("--cjson-source", type=Path, default=root / ".pio/test-deps/cJSON.c")
    parser.add_argument("--cjson-include", type=Path, default=packages /
                        "framework-arduinoespressif32-libs/esp32s3/include/json/cJSON")
    args = parser.parse_args()
    source = (root / "src/main.cpp").read_text(encoding="utf-8-sig")
    output = root / ".pio/firmware-regressions"
    output.mkdir(parents=True, exist_ok=True)

    def extract(name, kind="function"):
        if kind == "function":
            pattern = rf"^(?:bool|void|uint32_t) {name}\([^;{{]*\)\s*\{{.*?^\}}"
        else:
            pattern = rf"^(?:struct|enum class) {name}\b[^{{]*\{{.*?^\}};"
        match = re.search(pattern, source, re.M | re.S)
        if match is None:
            raise RuntimeError(f"Definicija {name} ni bila najdena.")
        return match.group() + "\n"

    types = ["Measurement", "MeasurementAggregate", "DailyReconciliationManifest",
             "HistoryDeletionStep", "CloudReconciliationState", "SdCardUploadContext",
             "LoadCellTareState", "ComponentHealth", "ComponentStatus"]
    functions = ["addMeasurementToCloudAggregate", "readNextReconciliationMeasurementBatch",
                 "completeCloudHistoryReconciliationRequest", "processPendingHistoryDeletion",
                 "recoverStalledCloudSynchronization", "cleanupSdCardUpload",
                 "handleSdCardUpload", "finishSdCardUpload", "tryReadLoadCellRaw",
                 "resetLoadCellWeightFilter", "acceptLoadCellWeight", "acceptLoadCellConfirmation",
                 "readLoadCell", "processLoadCellSampling", "processPendingLoadCellTare"]
    (output / "firmware_types.inc").write_text("\n".join(extract(t, "type") for t in types), encoding="utf-8")
    (output / "firmware_functions.inc").write_text("\n".join(extract(f) for f in functions), encoding="utf-8")

    # Povezave med loop() in testiranimi funkcijami: timeout mora veljati tudi med obnovo.
    sync = extract("synchronizeSDMeasurements")
    assert sync.index("recoverStalledCloudSynchronization()") < sync.index("cloudHistoryReconciliationIsActive()")
    reconciliation = extract("processCloudHistoryReconciliation")
    assert re.search(r"\{\s*if \(historyDeletionQueued\) return;", reconciliation)
    for name in ("initializeLoadCell", "processPendingLoadCellTare", "readLoadCell", "acceptLoadCellWeight"):
        assert not re.search(r"loadCell\.(?:tare|get_units|read|read_average|wait_ready\w*)\s*\(", extract(name))
    assert "processLoadCellSampling();" in extract("loop")
    assert "processControlRootEvent(" in extract("processControlStreamData")

    exe = output / "regressions.exe"
    test_env = os.environ.copy()
    test_env["PATH"] = str(Path(args.cxx).resolve().parent) + os.pathsep + test_env.get("PATH", "")
    subprocess.run([args.cxx, "-std=c++14", "-Wall", "-Wextra", "-O0", "-g",
                    "-I" + str(root / "include"), "-I" + str(output),
                    "-I" + str(args.cjson_include),
                    str(root / "test/firmware_regressions/test.cpp"), str(args.cjson_source),
                    "-o", str(exe)], check=True, cwd=root, env=test_env)
    subprocess.run([str(exe)], check=True, cwd=root, env=test_env, timeout=20)


if __name__ == "__main__":
    main()
