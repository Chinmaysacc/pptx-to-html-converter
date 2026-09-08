export function getMediaType(
  fileName: string
): "audio" | "video" | null {
  const extension = fileName.split(".").pop()?.toLowerCase();

  const audioExtensions = ["mp3", "wav", "ogg", "m4a", "aac"];
  const videoExtensions = ["mp4", "webm", "mov", "wmv", "avi"];

  if (audioExtensions.includes(extension || "")) return "audio";
  if (videoExtensions.includes(extension || "")) return "video";
  return null;
}

export function isImageFile(fileName: string): boolean {
  const extension = fileName.split(".").pop()?.toLowerCase();

  return [
    "png", "jpg", "jpeg", "gif", "bmp", "svg", "emf", "wmf",
  ].includes(extension || "");
}

export function getMimeType(fileName: string): string {
  const extension = fileName.split(".").pop()?.toLowerCase();

  const mimeTypes: Record<string, string> = {
    mp3: "audio/mpeg", wav: "audio/wav", ogg: "audio/ogg",
    m4a: "audio/mp4", aac: "audio/aac",
    mp4: "video/mp4", webm: "video/webm", mov: "video/quicktime",
    wmv: "video/x-ms-wmv", avi: "video/x-msvideo",
    png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg",
    gif: "image/gif", bmp: "image/bmp", svg: "image/svg+xml",
    emf: "image/x-emf", wmf: "image/x-wmf",
  };

  return mimeTypes[extension || ""] || "application/octet-stream";
}

export function normalizeMediaPath(target: string): string {
  if (target.startsWith("../media/")) {
    return `ppt/media/${target.replace("../media/", "")}`;
  }
  if (target.startsWith("media/")) return `ppt/${target}`;
  return target;
}
