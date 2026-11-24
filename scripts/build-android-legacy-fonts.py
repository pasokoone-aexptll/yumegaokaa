"""OFL-derived Intern + Noto Sans JP fallback for API 24–28 (fonttools required)."""
import logging
logging.basicConfig(level=logging.WARNING)
from pathlib import Path
from tempfile import TemporaryDirectory
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont
from fontTools import subset
from fontTools.merge import Merger
from fontTools.ttLib.scaleUpem import scale_upem
root = Path(__file__).resolve().parent.parent
out = root / 'apps/mobile/modules/presence-native/android/src/main/assets/fonts'
with TemporaryDirectory() as tmp:
    for weight, suffix in [(400, ''), (700, '-Bold')]:
        latin = instantiateVariableFont(TTFont(out / 'Intern.ttf'), {'wght': weight, 'opsz': 14}, inplace=True)
        jp = instantiateVariableFont(TTFont(out / 'NotoSansJP.ttf'), {'wght': weight}, inplace=True)
        scale_upem(jp, latin["head"].unitsPerEm)
        keep = set(jp.getBestCmap()) - set(latin.getBestCmap())
        options = subset.Options()
        options.layout_features = ['*']
        sub = subset.Subsetter(options=options)
        sub.populate(unicodes=keep)
        sub.subset(jp)
        files = []
        for index, font in enumerate([latin, jp]):
            # Hinting programs come from different upstreams; do not merge their bytecode.
            for table in ['fpgm', 'prep', 'cvt ', 'STAT', 'vhea', 'vmtx', 'VORG']:
                if table in font: del font[table]
            for glyph in font['glyf'].glyphs.values():
                if hasattr(glyph, 'program'): glyph.program.fromBytecode([])
            dest = str(Path(tmp) / f'{index}.ttf')
            font.save(dest); files.append(dest)
        merged = Merger().merge(files)
        for record in merged['name'].names:
            if record.nameID in [1, 3, 4, 6, 16]:
                name = 'Denshin Android Compat' if record.nameID != 6 else 'DenshinAndroidCompat'+suffix
                record.string = name.encode(record.getEncoding())
        merged.save(out / f'DenshinAndroidCompat{suffix}.ttf')
