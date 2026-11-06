"""Encrypted field DB + Storage backup. Restore only into an isolated disposable DB."""
import argparse
import datetime
import hashlib
import json
import os
from pathlib import Path
import shlex
import shutil
import subprocess
import tarfile
import tempfile
import time
import urllib.parse
import urllib.request
import uuid

ROOT = Path(__file__).resolve().parents[1]
CFG = Path.home() / "Library/Application Support/yumegaoka-backup"
PROJECT = "kchsbjayfdwjjbevqlop"
CLI = str(ROOT / "node_modules/.bin/supabase")
IMAGE = "public.ecr.aws/supabase/postgres:17.11.0.006"
S3 = "https://5826ee487d3534d1d2e29b571fe0459b.r2.cloudflarestorage.com/yumegaoka-private-backups/"
SCHEMAS = ("public", "auth", "storage", "app_private", "supabase_migrations")


def run(*args, **opts):
    return subprocess.run(args, cwd=ROOT, check=True, **opts)


def output(*args):
    return run(*args, stdout=subprocess.PIPE).stdout


def transfer(key, file, upload):
    creds = json.loads((CFG / "r2.json").read_text())
    config = 'user = "' + creds["id"] + ':' + creds["secret"] + '"\n'
    run("curl", "--silent", "--show-error", "--fail", "--retry", "3",
        "--config", "-", "--aws-sigv4", "aws:amz:auto:s3",
        "--upload-file" if upload else "--output", file, S3 + key, input=config.encode())


def inventory():
    sql = "select bucket_id,name,version,metadata->>'size' as size from storage.objects order by bucket_id,name"
    result = json.loads(output(CLI, "db", "query", "--linked", "--output", "json", sql))
    return result if isinstance(result, list) else result["rows"]


def backup(work):
    if (ROOT / "supabase/.temp/project-ref").read_text().strip() != PROJECT:
        raise RuntimeError("Unexpected linked project")
    objects = inventory()
    dry = output(CLI, "db", "dump", "--linked", "--dry-run").decode()
    pg = {}
    for line in dry.splitlines():
        if line.startswith("export PG"):
            k, value = shlex.split(line[7:])[0].split("=", 1)
            pg[k] = value
    if not {"PGHOST", "PGPASSWORD", "PGDATABASE", "PGUSER", "PGPORT"} <= pg.keys():
        raise RuntimeError("Missing PostgreSQL connection settings")
    schema_args = [arg for schema in SCHEMAS for arg in ("--schema", schema)]
    with (work / "db.dump").open("wb") as f:
        run("docker", "run", "--rm", *(x for k in pg for x in ("-e", k)), "-e", "PGSSLMODE=require",
            IMAGE, "pg_dump", "--role=postgres", "-Fc", *schema_args,
            env={**os.environ, **pg}, stdout=f)
    keys = json.loads(output(CLI, "projects", "api-keys", "--project-ref", PROJECT, "-o", "json"))
    token = next(row["api_key"] for row in keys if row["name"] == "service_role")
    for i, obj in enumerate(objects):
        path = "/".join(urllib.parse.quote(obj[k], safe="/") for k in ("bucket_id", "name"))
        req = urllib.request.Request(f"https://{PROJECT}.supabase.co/storage/v1/object/{path}",
                                     headers={"apikey": token, "Authorization": "Bearer " + token})
        with urllib.request.urlopen(req, timeout=60) as response:
            data = response.read()
        if len(data) != int(obj["size"]):
            raise RuntimeError("Storage size changed")
        obj["file"] = f"image-{i}"
        obj["sha256"] = hashlib.sha256(data).hexdigest()
        (work / obj["file"]).write_bytes(data)
    if inventory() != [{k: v for k, v in obj.items() if k not in ("file", "sha256")} for obj in objects]:
        raise RuntimeError("Storage changed during backup; retry")
    (work / "objects.json").write_text(json.dumps(objects))
    archive = work / "snapshot.tar"
    with tarfile.open(archive, "w") as tar:
        for file in [work/"db.dump", work/"objects.json", *(work/o["file"] for o in objects)]:
            tar.add(file, arcname=file.name)
    sealed = work / "snapshot.cms"
    run("openssl","cms","-encrypt","-binary","-aes-256-gcm","-outform","DER","-in",archive,"-out",sealed,CFG/"backup.crt")
    key = datetime.datetime.now(datetime.timezone.utc).strftime("daily/%Y%m%dT%H%M%SZ-") + uuid.uuid4().hex + ".cms"
    transfer(key, sealed, True)
    print(key, flush=True)
    return key


def restore(work, key, recover_to=None):
    sealed = work / "download.cms"
    transfer(key, sealed, False)
    archive = work / "restore.tar"
    run("openssl","cms","-decrypt","-binary","-inform","DER","-in",sealed,
        "-recip",CFG/"backup.crt","-inkey",CFG/"recovery.key","-out",archive)
    target = work / "restored"
    target.mkdir()
    with tarfile.open(archive) as tar:
        for member in tar:
            if not member.isfile() or Path(member.name).name != member.name:
                raise ValueError("Invalid archive member")
            (target/member.name).write_bytes(tar.extractfile(member).read())
    db = output("docker","run","--rm","-d","--network","none","-e","POSTGRES_PASSWORD="+uuid.uuid4().hex,IMAGE).decode().strip()
    try:
        for _ in range(90):
            if subprocess.run(["docker","exec",db,"pg_isready","-h","127.0.0.1","-U","postgres"],stdout=subprocess.DEVNULL).returncode == 0:
                break
            time.sleep(1)
        run("docker","exec",db,"createdb","-U","supabase_admin","-T","template0","verify")
        psql = ["docker","exec","-i",db,"psql","-XAtq","-v","ON_ERROR_STOP=1","-U","supabase_admin","-d","verify"]
        run(*psql,input=b'drop schema public; create schema extensions; create extension postgis schema extensions; create extension pgcrypto schema extensions; create extension "uuid-ossp" schema extensions;')
        with (target/"db.dump").open("rb") as f:
            run("docker","exec","-i",db,"pg_restore","--exit-on-error","--no-owner","-U","supabase_admin","-d","verify",stdin=f)
        listing=json.loads(output(*psql,"-c","select coalesce(json_agg(json_build_array(bucket_id,name,version) order by bucket_id,name),'[]') from storage.objects"))
        objects=json.loads((target/"objects.json").read_text())
        if listing != [[o["bucket_id"],o["name"],o["version"]] for o in objects]:
            raise RuntimeError("Restored Storage references differ")
        for obj in objects:
            if hashlib.sha256((target/obj["file"]).read_bytes()).hexdigest()!=obj["sha256"]:
                raise RuntimeError("Restored image differs")
        counts=output(*psql,"-c","select (select count(*) from auth.users),(select count(*) from app_private.messages)").decode().strip()
        if recover_to is not None:
            # Refuse to merge with an existing recovery directory.
            shutil.copytree(target, recover_to)
        print(f"Isolated restore verified. Accounts|messages: {counts}. Images: {len(objects)}.")
    finally:
        run("docker","rm","-f",db,stdout=subprocess.DEVNULL)


if __name__ == "__main__":
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--restore",metavar="R2_KEY")
    parser.add_argument("--recover-to", type=Path, help="Keep verified DB dump, images and manifest in a new private directory")
    args=parser.parse_args()
    if args.recover_to and (not args.restore or args.recover_to.exists()):
        parser.error("--recover-to requires --restore and a new directory")
    os.umask(0o077)
    with tempfile.TemporaryDirectory() as folder:
        work=Path(folder)
        restore(work,args.restore or backup(work),args.recover_to)
