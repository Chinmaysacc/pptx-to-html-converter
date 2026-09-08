export interface ExtractedFont {
  slideNumber: number;
  text: string;
  fontFamily: string;
}

export type EmbeddedFontVariant =
  | "regular"
  | "bold"
  | "italic"
  | "boldItalic";

export interface EmbeddedFont {
  fontFamily: string;
  fontWeight: string;
  fontStyle: string;
  dataUrl: string;
  sourcePath: string;
  variant: EmbeddedFontVariant;
}
