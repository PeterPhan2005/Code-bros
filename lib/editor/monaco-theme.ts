import type { Monaco } from "@monaco-editor/react";

export const CODE_BROS_MONACO_THEME = "code-bros-dark";

const THEME_FALLBACKS = {
  background: "#252525",
  foreground: "#fafafa",
  card: "#343434",
  muted: "#454545",
  mutedForeground: "#a1a1a1",
  border: "#ffffff1a",
  accent: "#454545",
  destructive: "#ff716f",
  warning: "#f4b942",
  info: "#67d4ff",
} as const;

function toHexChannel(value: number) {
  return Math.round(Math.min(1, Math.max(0, value)) * 255)
    .toString(16)
    .padStart(2, "0");
}

function linearToSrgb(value: number) {
  return value <= 0.0031308
    ? 12.92 * value
    : 1.055 * value ** (1 / 2.4) - 0.055;
}

function oklchToHex(value: string) {
  const match = value.match(
    /^oklch\(\s*([\d.]+)\s+([\d.]+)\s+([\d.-]+)(?:\s*\/\s*([\d.]+)%?)?\s*\)$/i,
  );

  if (!match) {
    return null;
  }

  const lightness = Number(match[1]);
  const chroma = Number(match[2]);
  const hue = (Number(match[3]) * Math.PI) / 180;
  const alphaValue = match[4] ? Number(match[4]) : 1;
  const alpha = value.includes("%") ? alphaValue / 100 : alphaValue;
  const a = chroma * Math.cos(hue);
  const b = chroma * Math.sin(hue);
  const lPrime = lightness + 0.3963377774 * a + 0.2158037573 * b;
  const mPrime = lightness - 0.1055613458 * a - 0.0638541728 * b;
  const sPrime = lightness - 0.0894841775 * a - 1.291485548 * b;
  const l = lPrime ** 3;
  const m = mPrime ** 3;
  const s = sPrime ** 3;
  const red = linearToSrgb(
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
  );
  const green = linearToSrgb(
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
  );
  const blue = linearToSrgb(
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  );
  const alphaHex = alpha < 1 ? toHexChannel(alpha) : "";

  return `#${toHexChannel(red)}${toHexChannel(green)}${toHexChannel(blue)}${alphaHex}`;
}

function readThemeColor(variable: string, fallback: string) {
  if (typeof document === "undefined") {
    return fallback;
  }

  const value = getComputedStyle(document.documentElement)
    .getPropertyValue(variable)
    .trim();

  if (/^#[\da-f]{6}(?:[\da-f]{2})?$/i.test(value)) {
    return value;
  }

  return oklchToHex(value) ?? fallback;
}

export function defineCodeBrosMonacoTheme(monaco: Monaco) {
  const colors = {
    background: readThemeColor(
      "--background",
      THEME_FALLBACKS.background,
    ),
    foreground: readThemeColor(
      "--foreground",
      THEME_FALLBACKS.foreground,
    ),
    card: readThemeColor("--card", THEME_FALLBACKS.card),
    muted: readThemeColor("--muted", THEME_FALLBACKS.muted),
    mutedForeground: readThemeColor(
      "--muted-foreground",
      THEME_FALLBACKS.mutedForeground,
    ),
    border: readThemeColor("--border", THEME_FALLBACKS.border),
    accent: readThemeColor("--accent", THEME_FALLBACKS.accent),
    destructive: readThemeColor(
      "--destructive",
      THEME_FALLBACKS.destructive,
    ),
  };

  monaco.editor.defineTheme(CODE_BROS_MONACO_THEME, {
    base: "vs-dark",
    inherit: true,
    rules: [],
    colors: {
      "editor.background": colors.background,
      "editor.foreground": colors.foreground,
      "editorLineNumber.foreground": colors.mutedForeground,
      "editorLineNumber.activeForeground": colors.foreground,
      "editor.lineHighlightBackground": colors.card,
      "editor.selectionBackground": colors.accent,
      "editor.inactiveSelectionBackground": colors.muted,
      "editorCursor.foreground": colors.foreground,
      "editorWhitespace.foreground": colors.muted,
      "editorIndentGuide.background1": colors.muted,
      "editorIndentGuide.activeBackground1": colors.mutedForeground,
      "editorBracketMatch.background": colors.accent,
      "editorBracketMatch.border": colors.mutedForeground,
      "editor.findMatchBackground": colors.accent,
      "editor.findMatchBorder": colors.foreground,
      "editorWidget.background": colors.card,
      "editorHoverWidget.background": colors.card,
      "editorWidget.border": colors.border,
      "editorError.foreground": colors.destructive,
      "editorWarning.foreground": THEME_FALLBACKS.warning,
      "editorInfo.foreground": THEME_FALLBACKS.info,
    },
  });

  monaco.editor.setTheme(CODE_BROS_MONACO_THEME);
}

export function configureMonacoLanguageDefaults(monaco: Monaco) {
  const compilerOptions = {
    allowJs: true,
    allowNonTsExtensions: true,
    jsx: monaco.languages.typescript.JsxEmit.ReactJSX,
    module: monaco.languages.typescript.ModuleKind.ESNext,
    moduleResolution:
      monaco.languages.typescript.ModuleResolutionKind.NodeJs,
    target: monaco.languages.typescript.ScriptTarget.ES2022,
  };

  monaco.languages.typescript.javascriptDefaults.setCompilerOptions(
    compilerOptions,
  );
  monaco.languages.typescript.typescriptDefaults.setCompilerOptions(
    compilerOptions,
  );
  monaco.languages.typescript.javascriptDefaults.setEagerModelSync(false);
  monaco.languages.typescript.typescriptDefaults.setEagerModelSync(false);
  monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
    noSemanticValidation: true,
    noSyntaxValidation: false,
  });
  monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
    noSemanticValidation: true,
    noSyntaxValidation: false,
  });
}
