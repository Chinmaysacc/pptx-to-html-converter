export function parseHtml(html: string): Document {
  return new DOMParser().parseFromString(html, "text/html");
}

export function serializeHtml(doc: Document): string {
  return "<!DOCTYPE html>\n" + doc.documentElement.outerHTML;
}
