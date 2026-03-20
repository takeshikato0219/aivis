import type { TRenderEngineConfig } from 'react-native-render-html';
import { defaultFallbackFonts, defaultSystemFonts } from 'react-native-render-html';

export const policyRenderHtmlConfig: TRenderEngineConfig = {
  baseStyle: {
    color: '#fff',
    fontSize: 16,
    lineHeight: 24,
  },
  tagsStyles: {
    // Body & containers
    body: { color: '#fff', fontSize: 16, lineHeight: 24 },
    div: { color: '#fff', fontSize: 16, lineHeight: 24, marginVertical: 4 },
    p: { color: '#fff', fontSize: 16, marginVertical: 8, lineHeight: 24 },
    // Headings (h1-h6)
    h1: { color: '#fff', fontSize: 32, fontWeight: '700', marginVertical: 24, lineHeight: 40 },
    h2: { color: '#fff', fontSize: 28, fontWeight: '700', marginVertical: 20, lineHeight: 36 },
    h3: { color: '#fff', fontSize: 22, fontWeight: '600', marginVertical: 16, lineHeight: 28 },
    h4: { color: '#fff', fontSize: 18, fontWeight: '600', marginVertical: 12, lineHeight: 24 },
    h5: { color: '#fff', fontSize: 16, fontWeight: '600', marginVertical: 10, lineHeight: 22 },
    h6: { color: '#fff', fontSize: 14, fontWeight: '600', marginVertical: 8, lineHeight: 20 },
    // Text formatting - bold
    strong: { color: '#fff', fontWeight: '700' },
    b: { color: '#fff', fontWeight: '700' },
    // Text formatting - italic
    em: { color: '#fff', fontStyle: 'italic' },
    i: { color: '#fff', fontStyle: 'italic' },
    // Text formatting - underline
    u: { color: '#fff', textDecorationLine: 'underline' },
    // Text formatting - strikethrough
    s: { color: '#fff', textDecorationLine: 'line-through' },
    strike: { color: '#fff', textDecorationLine: 'line-through' },
    del: { color: '#fff', textDecorationLine: 'line-through' },
    // Code & preformatted
    code: {
      color: '#fff',
      fontFamily: defaultFallbackFonts.monospace,
      fontSize: 14,
      backgroundColor: 'rgba(255,255,255,0.1)',
      paddingHorizontal: 4,
      paddingVertical: 2,
    },
    pre: {
      color: '#fff',
      fontFamily: defaultFallbackFonts.monospace,
      fontSize: 14,
      whiteSpace: 'pre' as const,
      backgroundColor: 'rgba(255,255,255,0.08)',
      padding: 12,
      marginVertical: 8,
      overflow: 'hidden' as const,
    },
    // Blockquote
    blockquote: {
      color: '#fff',
      borderLeftWidth: 4,
      borderLeftColor: 'rgba(255,255,255,0.5)',
      paddingLeft: 16,
      marginVertical: 12,
      marginLeft: 0,
      fontStyle: 'italic' as const,
    },
    // Inline
    span: { color: '#fff' },
    mark: { color: '#1A202C', backgroundColor: '#FFEB3B' },
    // Links
    a: { color: '#007bff', textDecorationLine: 'underline' as const },
    // Lists
    ul: { color: '#fff', marginVertical: 8, paddingLeft: 20 },
    ol: { color: '#fff', marginVertical: 8, paddingLeft: 20 },
    li: { color: '#fff', fontSize: 16, marginVertical: 4, lineHeight: 24 },
    // Subscript/superscript (approximation - RN has limited support)
    sub: { color: '#fff', fontSize: 12, lineHeight: 16 },
    sup: { color: '#fff', fontSize: 12, lineHeight: 16 },
  },
  enableCSSInlineProcessing: true,
  emSize: 16,
  systemFonts: [
    ...defaultSystemFonts,
    defaultFallbackFonts.serif,
    defaultFallbackFonts['sans-serif'],
    defaultFallbackFonts.monospace,
  ],
  fallbackFonts: defaultFallbackFonts,
  enableUserAgentStyles: true,
};
