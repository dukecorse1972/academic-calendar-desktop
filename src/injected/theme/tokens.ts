import { ThemeMode, ThemeTokens } from '../../shared/types';

export const LIGHT_THEME: ThemeTokens = {
  background: '#ffffff',
  surface: '#f8fafd',
  surfaceHover: '#f1f3f4',
  border: '#dadce0',
  text: '#1f1f1f',
  secondaryText: '#5f6368',
  accent: '#1a73e8',
  selected: '#e8f0fe',
  disabled: '#9aa0a6'
};

export const DARK_THEME: ThemeTokens = {
  background: '#1f1f1f',
  surface: '#282a2d',
  surfaceHover: '#35373b',
  border: '#444746',
  text: '#e8eaed',
  secondaryText: '#9aa0a6',
  accent: '#8ab4f8',
  selected: '#004a77',
  disabled: '#5f6368'
};

export function getTokens(mode: ThemeMode): ThemeTokens {
  return mode === 'DARK' ? DARK_THEME : LIGHT_THEME;
}
