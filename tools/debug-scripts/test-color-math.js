function hexToHsl(hex) {
  hex = hex.replace('#', '');
  if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h *= 60;
  }
  return [Math.round(h), Math.round(s * 100), Math.round(l * 100)];
}

function hslToHex(h, s, l) {
  s /= 100;
  l /= 100;
  const a = s * Math.min(l, 1 - l);
  const f = n => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

function getSubjectVariants(hexColor) {
  const [h, s, l] = hexToHsl(hexColor);

  // Examen: saturated dark version (high contrast with white text)
  // Ensure lightness is ~28-32% and saturation is healthy (>= 60%)
  const examHex = hslToHex(h, Math.max(s, 65), 30);

  // Entrega pastel: soft light pastel (high contrast with black text)
  // Lightness ~88-91%, saturation ~40-55%
  const entregaPastelHex = hslToHex(h, Math.min(Math.max(s, 40), 60), 89);

  // Entrega border: vibrant accent border
  const entregaBorderHex = hslToHex(h, Math.max(s, 60), 40);

  return {
    raw: hexColor,
    hsl: [h, s, l],
    exam: examHex,
    entregaPastel: entregaPastelHex,
    entregaBorder: entregaBorderHex
  };
}

const subjects = [
  { name: '🖥️ Fundamentos de los Computadores', color: '#B69A31' },
  { name: '💵 Fundamentos de Economía', color: '#96BCBB' },
  { name: '💼 Derecho de la Empresa', color: '#C2842D' },
  { name: '🧑‍💻 Programación 1', color: '#90B0C4' },
  { name: '🧮 Matematicas 1', color: '#BAB35A' },
  { name: '🪧 Introducción al Márketing', color: '#6B8D8A' }
];

subjects.forEach(sub => {
  console.log(sub.name);
  console.log(getSubjectVariants(sub.color));
});
