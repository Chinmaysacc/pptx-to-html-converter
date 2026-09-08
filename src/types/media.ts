export interface ExtractedMedia {
  path: string;
  type: "audio" | "video";
  mimeType: string;
  url: string;
  slideNumber: number;
}
