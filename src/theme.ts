export interface Palette { primary: string; primaryD: string; accent: string; gold: string; ink: string; hero1: string; hero2: string; page: string; wrong: string }
export interface ThemeDef { id: string; label: string; swatch: string; palette: Palette }

export const THEMES: ThemeDef[] = [
  { id: 'classic', label: 'Sage', swatch: '#4a8f72',
    palette: { primary: '#4a8f72', primaryD: '#3b7a5f', accent: '#5b86a8', gold: '#d6a54a', ink: '#34413c', hero1: '#4a8f72', hero2: '#3f7f86', page: '#f4f6f3', wrong: '#cf6a64' } },
  { id: 'clinical', label: 'Slate', swatch: '#4f7f9a',
    palette: { primary: '#4f7f9a', primaryD: '#3d667e', accent: '#7a8fb5', gold: '#d6a54a', ink: '#2b3a46', hero1: '#3f6785', hero2: '#5a8f9a', page: '#f1f5f8', wrong: '#cf6a64' } },
  { id: 'night', label: 'Night', swatch: '#1e272c',
    palette: { primary: '#6fbf9f', primaryD: '#4a9a7c', accent: '#8aaed6', gold: '#e0b865', ink: '#e8eef0', hero1: '#1f3d44', hero2: '#2d6a63', page: '#151c20', wrong: '#e07a78' } },
]
const KEY = 'med-english-theme'
export const themeById = (id: string) => THEMES.find((t) => t.id === id) ?? THEMES[0]
export function loadTheme(): string {
  try { return themeById(localStorage.getItem(KEY) ?? '').id } catch { return 'classic' }
}
export function applyTheme(id: string) {
  document.documentElement.dataset.theme = id
  try { localStorage.setItem(KEY, id) } catch { /* ignore */ }
}
