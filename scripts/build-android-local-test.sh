#!/bin/bash
# Standalone APK for a locally connected development device. Never uploads.
# Uses the generated Android project's debug signing key to preserve installed data.
set -euo pipefail
root=$(cd "$(dirname "$0")/.." && pwd)
: "${EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY:?Set the cloud project publishable key}"
: "${JAVA_HOME:?Set JAVA_HOME to JDK 17}"
: "${ANDROID_HOME:?Set ANDROID_HOME to the Android SDK}"
[[ $EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY == sb_publishable_* ]]
export NODE_ENV=production YUMEGAOKA_LOCAL_ENTRY=0
export EXPO_PUBLIC_UI_REVIEW=0 EXPO_PUBLIC_FIELD_TRIAL=0
export EXPO_PUBLIC_SUPABASE_URL=https://kchsbjayfdwjjbevqlop.supabase.co
export EXPO_PUBLIC_GATEWAY_URL=wss://yumegaoka-field.onrender.com/street
cd "$root/apps/mobile/android"
./gradlew :app:assembleRelease -PreactNativeArchitectures=arm64-v8a
apk=app/build/outputs/apk/release/app-release.apk
# A standalone build must actually contain its JavaScript, not a Metro URL.
"$JAVA_HOME/bin/jar" tf "$apk" | awk '
  $0 == "assets/index.android.bundle" { found = 1 }
  END { exit !found }
'
printf 'Local test APK (no upload): %s/%s\n' "$PWD" "$apk"
