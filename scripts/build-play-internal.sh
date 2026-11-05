#!/bin/bash
# Builds locally; does not upload to Play. Keep signing files outside the checkout.
set -euo pipefail
root=$(cd "$(dirname "$0")/.." && pwd)
: "${YUME_UPLOAD_STORE:?Set the absolute path to the upload PKCS12 keystore}"
: "${YUME_UPLOAD_PASSWORD_FILE:?Set the path to the private passphrase file}"
: "${EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY:?Set the field project publishable key}"
[[ $YUME_UPLOAD_STORE == /* && -f $YUME_UPLOAD_STORE ]]
[[ $EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY == sb_publishable_* ]]
export YUMEGAOKA_LOCAL_ENTRY=0 EXPO_PUBLIC_FIELD_TRIAL=0 NODE_ENV=production
export EXPO_PUBLIC_SUPABASE_URL=https://kchsbjayfdwjjbevqlop.supabase.co
export EXPO_PUBLIC_GATEWAY_URL=wss://yumegaoka-field.onrender.com/street
password=$(cat "$YUME_UPLOAD_PASSWORD_FILE")
cd "$root/apps/mobile/android"
env "ORG_GRADLE_PROJECT_android.injected.signing.store.file=$YUME_UPLOAD_STORE" \
    "ORG_GRADLE_PROJECT_android.injected.signing.store.password=$password" \
    "ORG_GRADLE_PROJECT_android.injected.signing.key.alias=yumegaoka-upload" \
    "ORG_GRADLE_PROJECT_android.injected.signing.key.password=$password" \
    ./gradlew :app:bundleRelease -PreactNativeArchitectures=armeabi-v7a,arm64-v8a,x86,x86_64
bundle=app/build/outputs/bundle/release/app-release.aab
"$JAVA_HOME/bin/jarsigner" -verify "$bundle" >/dev/null
expected=$("$JAVA_HOME/bin/keytool" -exportcert -alias yumegaoka-upload -keystore "$YUME_UPLOAD_STORE" -storepass:file "$YUME_UPLOAD_PASSWORD_FILE" | openssl dgst -sha256)
actual=$("$JAVA_HOME/bin/keytool" -printcert -jarfile "$bundle" -rfc | openssl x509 -outform DER | openssl dgst -sha256)
[[ $expected == "$actual" ]] || { echo 'Unexpected AAB signing certificate' >&2; exit 1; }
echo "Verified $PWD/$bundle"
