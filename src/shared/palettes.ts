export interface ColorPalette {
  id: string;
  name: string;
  subtitle: string;
  source: string;
  colors: {
    name: string;
    hex: string;
  }[];
}

/**
 * Curated color palettes from specialized stationery and design systems:
 * 1. Zebra Mildliner™ (World's #1 Japanese study highlighter system used in GoodNotes/Notion)
 * 2. Catppuccin™ (Community pastel design system, Latte/Macchiato flavor)
 * 3. Nord™ (Arctic design system: Frost & Aurora)
 * 4. Morandi (Earthy muted editorial tones from painter Giorgio Morandi)
 */
export const PREDEFINED_PALETTES: ColorPalette[] = [
  {
    id: 'mildliner',
    name: 'Zebra Mildliner™ Pastel',
    subtitle: 'Destacadores japoneses de estudio (GoodNotes / Notion)',
    source: 'Zebra Pen & Stationery Aesthetic',
    colors: [
      { name: 'Mild Blue', hex: '#98D5E8' },
      { name: 'Mild Blue Green', hex: '#A1D0CA' },
      { name: 'Mild Yellow', hex: '#F0F4A3' },
      { name: 'Mild Pink', hex: '#FFB6D9' },
      { name: 'Mild Orange', hex: '#FFDFB5' },
      { name: 'Mild Smoke Red', hex: '#E3B1C3' },
      { name: 'Mild Iris Lavender', hex: '#C6B6D3' }
    ]
  },
  {
    id: 'catppuccin',
    name: 'Catppuccin™ Pastel',
    subtitle: 'Paleta comunitaria de diseño suave de alto contraste',
    source: 'Catppuccin Design System',
    colors: [
      { name: 'Sapphire', hex: '#74c7ec' },
      { name: 'Green', hex: '#a6e3a1' },
      { name: 'Peach', hex: '#fab387' },
      { name: 'Mauve', hex: '#cba6f7' },
      { name: 'Red', hex: '#f38ba8' },
      { name: 'Teal', hex: '#94e2d5' },
      { name: 'Lavender', hex: '#b4befe' }
    ]
  },
  {
    id: 'nord',
    name: 'Nord™ Frost & Aurora',
    subtitle: 'Inspiración ártica nórdica limpia y equilibrada',
    source: 'Nord Theme Specification',
    colors: [
      { name: 'Frost Cyan', hex: '#88C0D0' },
      { name: 'Frost Blue', hex: '#81A1C1' },
      { name: 'Aurora Green', hex: '#A3BE8C' },
      { name: 'Aurora Yellow', hex: '#EBCB8B' },
      { name: 'Aurora Orange', hex: '#D08770' },
      { name: 'Aurora Purple', hex: '#B48EAD' },
      { name: 'Aurora Red', hex: '#BF616A' }
    ]
  },
  {
    id: 'morandi',
    name: 'Morandi Editorial',
    subtitle: 'Tonos terrosos y apagados elegantes para agendas digitales',
    source: 'Giorgio Morandi Color Theory',
    colors: [
      { name: 'Morandi Blue', hex: '#99B9C6' },
      { name: 'Morandi Green', hex: '#A9B4A1' },
      { name: 'Morandi Pink', hex: '#DAC5C3' },
      { name: 'Morandi Lavender', hex: '#B7A9B3' },
      { name: 'Morandi Terracotta', hex: '#DB787A' },
      { name: 'Morandi Beige', hex: '#D8D3C9' },
      { name: 'Morandi Gray', hex: '#BFBEBD' }
    ]
  }
];

export function getPaletteById(id: string): ColorPalette {
  return PREDEFINED_PALETTES.find((p) => p.id === id) || PREDEFINED_PALETTES[0];
}
