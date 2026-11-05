#!/bin/sh
# Synthetic fixtures only. No mounts, published ports, or production credentials.
set -eu
umask 077
work=$(mktemp -d)
db=
cleanup() {
  if [ -n "$db" ]; then docker rm -f "$db" >/dev/null; fi
  rm -rf "$work"
}
trap cleanup EXIT
trap 'exit 1' INT TERM
cd "$work"
db=$(docker run -d --network none -e POSTGRES_HOST_AUTH_METHOD=trust postgres:16-alpine)
n=0
until docker exec "$db" pg_isready -U postgres >/dev/null; do
  n=$((n+1)); [ "$n" -lt 60 ] || exit 1; sleep 1
done
docker exec "$db" psql -v ON_ERROR_STOP=1 -U postgres -c "create table photos(path text primary key); insert into photos values ('street.png');" >/dev/null
docker exec "$db" pg_dump -Fc -U postgres postgres > db.dump
# Real 1x1 PNG bytes, unrelated to any account.
echo iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aL1sAAAAASUVORK5CYII= | openssl base64 -d -A > street.png
openssl req -x509 -newkey rsa:3072 -nodes -subj /CN=drill -days 1 -keyout drill.key -out drill.crt 2>/dev/null
tar cf - db.dump street.png | openssl cms -encrypt -binary -aes-256-gcm -outform DER -out backup.cms drill.crt
mkdir restored
openssl cms -decrypt -binary -inform DER -in backup.cms -recip drill.crt -inkey drill.key -out restored.tar
tar xf restored.tar -C restored
docker exec "$db" createdb -U postgres restored
docker exec -i "$db" pg_restore --exit-on-error -U postgres -d restored < restored/db.dump
path=$(docker exec "$db" psql -At -U postgres -d restored -c 'select path from photos')
test "$path" = street.png && cmp street.png "restored/$path" || exit 1
echo 'Restored fixture DB row and byte-identical image from encrypted archive.'
