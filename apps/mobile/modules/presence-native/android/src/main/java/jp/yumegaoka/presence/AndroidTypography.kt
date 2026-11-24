package jp.yumegaoka.presence

import android.content.Context
import android.graphics.Typeface
import android.graphics.fonts.Font
import android.graphics.fonts.FontFamily
import android.graphics.fonts.FontStyle
import com.facebook.react.common.assets.ReactFontManager

/** Latin uses Intern; Japanese glyphs fall back to Noto Sans JP at the same weight. */
internal fun installAndroidTypography(context: Context) {
  val manager = ReactFontManager.getInstance()
  val aliases = listOf("DenshinAndroid", "ui-rounded", "sans-serif", "sans-serif-medium")
  if (android.os.Build.VERSION.SDK_INT < 29) {
    val regular = Typeface.createFromAsset(context.assets, "fonts/DenshinAndroidCompat.ttf")
    val bold = Typeface.createFromAsset(context.assets, "fonts/DenshinAndroidCompat-Bold.ttf")
    aliases.forEach { name ->
      manager.setTypeface(name, Typeface.NORMAL, regular)
      manager.setTypeface(name, Typeface.BOLD, bold)
      manager.setTypeface(name, Typeface.ITALIC, Typeface.create(regular, Typeface.ITALIC))
      manager.setTypeface(name, Typeface.BOLD_ITALIC, Typeface.create(bold, Typeface.BOLD_ITALIC))
    }
    return
  }
  fun family(asset: String): FontFamily {
    val faces = (100..900 step 100).map { weight ->
      Font.Builder(context.assets, "fonts/$asset.ttf")
        .setFontVariationSettings("'wght' $weight")
        .setWeight(weight).build()
    }
    return FontFamily.Builder(faces.first()).apply { faces.drop(1).forEach { addFont(it) } }.build()
  }
  val typeface = Typeface.CustomFallbackBuilder(family("Intern"))
    .addCustomFallback(family("NotoSansJP"))
    .setStyle(FontStyle(400, FontStyle.FONT_SLANT_UPRIGHT)).build()
  aliases.forEach {
    manager.addCustomFont(it, typeface)
  }
}
