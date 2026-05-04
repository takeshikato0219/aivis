#!/bin/sh
# Generates hermesvm.framework.dSYM for Release/Archive so App Store validation
# finds a DWARF bundle matching the embedded Hermes binary (RN prebuilt Hermes).
set -e

if [ "${CONFIGURATION}" != "Release" ]; then
  echo "Not Release, skipping HermesVM dSYM generation"
  exit 0
fi

EMBEDDED_HERMES_BIN="${TARGET_BUILD_DIR}/${FRAMEWORKS_FOLDER_PATH}/hermesvm.framework/hermesvm"

if [ -f "$EMBEDDED_HERMES_BIN" ]; then
  HERMES_BIN="$EMBEDDED_HERMES_BIN"
else
  # Prebuilt xcframework layout (RN 0.82+); prefer device slice for App Store archives.
  HERMESVM_XC="${PODS_ROOT}/hermes-engine/destroot/Library/Frameworks/universal/hermesvm.xcframework"
  if [ -f "${HERMESVM_XC}/ios-arm64/hermesvm.framework/hermesvm" ]; then
    HERMES_BIN="${HERMESVM_XC}/ios-arm64/hermesvm.framework/hermesvm"
  elif [ -f "${HERMESVM_XC}/ios-arm64_x86_64-simulator/hermesvm.framework/hermesvm" ]; then
    HERMES_BIN="${HERMESVM_XC}/ios-arm64_x86_64-simulator/hermesvm.framework/hermesvm"
  else
    HERMES_BIN="$(find "${PODS_ROOT}/hermes-engine" -path "*hermesvm.framework/hermesvm" -type f 2>/dev/null | head -n 1)"
  fi
fi

DSYM_OUTPUT="${DWARF_DSYM_FOLDER_PATH}/hermesvm.framework.dSYM"

if [ -z "$HERMES_BIN" ] || [ ! -f "$HERMES_BIN" ]; then
  echo "warning: HermesVM binary not found, skipping dSYM generation"
  exit 0
fi

echo "HermesVM binary: $HERMES_BIN"
echo "dSYM output: $DSYM_OUTPUT"

NEED_REGEN=1

if [ -d "$DSYM_OUTPUT" ]; then
  BIN_UUIDS="$(dwarfdump --uuid "$HERMES_BIN" 2>/dev/null | awk '{print $2}' | sort | tr '\n' ' ')"
  DSYM_UUIDS="$(dwarfdump --uuid "$DSYM_OUTPUT" 2>/dev/null | awk '{print $2}' | sort | tr '\n' ' ')"

  if [ -n "$BIN_UUIDS" ] && [ "$BIN_UUIDS" = "$DSYM_UUIDS" ]; then
    NEED_REGEN=0
    echo "HermesVM dSYM already present and UUIDs match."
  else
    echo "HermesVM dSYM present but UUID mismatch; regenerating."
  fi
else
  echo "HermesVM dSYM missing; generating."
fi

if [ "$NEED_REGEN" -eq 1 ]; then
  rm -rf "$DSYM_OUTPUT"
  dsymutil "$HERMES_BIN" -o "$DSYM_OUTPUT"
fi

exit 0
