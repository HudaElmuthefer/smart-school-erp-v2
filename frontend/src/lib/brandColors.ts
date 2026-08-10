// يحوّل لون العلامة التجارية المحفوظ بإعدادات المدرسة (لون رئيسي واحد للكحلي
// وآخر للذهبي) إلى تدرجات الكحلي/الذهبي الأربعة والاثنين المستخدمة بالتصميم،
// عبر تعديل درجة الإضاءة (lightness) فقط مع إبقاء الصبغة والتشبع — بنفس فروق
// الإضاءة بين الدرجات الافتراضية بـindex.css، حتى يبقى التدرج متناسقاً لأي لون.
function hexToHsl(hex: string): [number, number, number] {
  const m = hex.replace('#', '');
  const r = parseInt(m.slice(0, 2), 16) / 255;
  const g = parseInt(m.slice(2, 4), 16) / 255;
  const b = parseInt(m.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      default:
        h = (r - g) / d + 4;
    }
    h /= 6;
  }
  return [h * 360, s * 100, l * 100];
}

function hslToHex(h: number, s: number, l: number): string {
  h /= 360;
  s /= 100;
  l /= 100;
  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  let r: number, g: number, b: number;
  if (s === 0) {
    r = g = b = l;
  } else {
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }
  const toHex = (v: number) =>
    Math.round(v * 255)
      .toString(16)
      .padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function shade(hex: string, deltaL: number): string {
  const [h, s, l] = hexToHsl(hex);
  return hslToHex(h, s, Math.min(100, Math.max(0, l + deltaL)));
}

export function applyBrandColors(primaryHex?: string | null, goldHex?: string | null) {
  const root = document.documentElement.style;
  if (primaryHex) {
    root.setProperty('--color-navy-900', primaryHex);
    root.setProperty('--color-navy-950', shade(primaryHex, -2.8));
    root.setProperty('--color-navy-800', shade(primaryHex, 4.5));
    root.setProperty('--color-navy-700', shade(primaryHex, 10.2));
  }
  if (goldHex) {
    root.setProperty('--color-gold-500', goldHex);
    root.setProperty('--color-gold-400', shade(goldHex, 8.6));
  }
}
