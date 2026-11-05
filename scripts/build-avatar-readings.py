"""Build initials from mecab-ipadic CSVs (taku910/mecab 61b90ba6). Run from repo root."""
import csv
import json
import shutil
import sys
import unicodedata
from collections import Counter, defaultdict
from pathlib import Path

source = Path(sys.argv[1])
out = Path("apps/mobile/assets/readings")
kana = dict(zip("アイウエオァィゥェォ", "AIUEOAIUEO"))
for group, initial in [
    ("カキクケコヵヶ", "K"), ("ガギグゲゴ", "G"), ("サスセソシ", "S"),
    ("ザズゼゾ", "Z"), ("ジヂ", "J"), ("タツテト", "T"), ("チ", "C"),
    ("ダヅデド", "D"), ("ナニヌネノン", "N"), ("ハヒヘホ", "H"), ("フ", "F"),
    ("バビブベボ", "B"), ("パピプペポ", "P"), ("マミムメモ", "M"),
    ("ヤユヨャュョ", "Y"), ("ラリルレロ", "R"), ("ワヮヰヱ", "W"),
    ("ヲ", "O"), ("ヴ", "V")
]:
    kana.update(dict.fromkeys(group, initial))
readings = dict(kana)
costs = {}
frequencies = defaultdict(Counter)
for file in sorted(source.glob("*.csv")):
    with file.open(encoding="euc_jp", errors="replace") as stream:
        for row in csv.reader(stream):
            if len(row) < 13 or not row[11]:
                continue
            word = unicodedata.normalize("NFKC", row[0])
            if not word or not unicodedata.name(word[0], "").startswith("CJK UNIFIED"):
                continue
            reading = row[11].lstrip("ッ")
            if not reading or reading[0] not in kana:
                continue
            initial = kana[reading[0]]
            cost = int(row[3])
            if cost < costs.get(word, float("inf")):
                readings[word] = initial
                costs[word] = cost
            frequencies[word[0]][initial] += 1
for char, counts in frequencies.items():
    readings.setdefault(char, counts.most_common(1)[0][0])
# Keep a longer prefix only when its initial differs from the inherited reading.
prefixes = {}
for word in sorted(readings, key=lambda w: (len(w), w)):
    inherited = next((prefixes[word[:i]] for i in range(len(word)-1, 0, -1) if word[:i] in prefixes), None)
    if inherited != readings[word]:
        prefixes[word] = readings[word]
out.mkdir(exist_ok=True, parents=True)
license_text = (source / "COPYING").read_text(encoding="latin-1")
(out / "initials.json").write_text(json.dumps({"license": license_text, "prefixes": prefixes, "maxLength": max(map(len, prefixes))}, ensure_ascii=False, separators=(",", ":")) + "\n")
shutil.copyfile(source / "COPYING", out / "COPYING")
