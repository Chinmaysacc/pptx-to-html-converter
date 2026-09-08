import { blobUrlToDataUrl } from "../utils/blobToDataUrl";
import { parseHtml, serializeHtml } from "../utils/htmlParser";

export const convertBlobUrlsToDataUrls =
    async (
      html: string
    ): Promise<string> => {
      console.log(
        "========== STARTING MEDIA EMBEDDING FOR DOWNLOAD =========="
      );

      const parser =
        new DOMParser();

      const doc =
        parser.parseFromString(
          html,
          "text/html"
        );

      const mediaElements =
        Array.from(
          doc.querySelectorAll<
            HTMLAudioElement |
            HTMLVideoElement
          >(
            "audio, video"
          )
        );

      console.log(
        "TOTAL MEDIA ELEMENTS:",
        mediaElements.length
      );

      for (
        const media of
        mediaElements
      ) {
        const src =
          media.getAttribute(
            "src"
          );

        if (!src) {
          console.warn(
            "MEDIA HAS NO SRC:",
            media.id
          );

          continue;
        }

        if (
          src.startsWith(
            "data:"
          )
        ) {
          continue;
        }

        if (
          !src.startsWith(
            "blob:"
          )
        ) {
          console.warn(
            "SKIPPING NON-BLOB MEDIA:",
            src
          );

          continue;
        }

        try {
          console.log(
            "EMBEDDING MEDIA:",
            media.id
          );

          const dataUrl =
            await blobUrlToDataUrl(
              src
            );

          media.setAttribute(
            "src",
            dataUrl
          );

          console.log(
            "MEDIA EMBEDDED SUCCESSFULLY:",
            media.id
          );

        } catch (
          error
        ) {
          console.error(
            "FAILED TO EMBED MEDIA:",
            media.id,
            error
          );
        }
      }

      console.log(
        "========== MEDIA EMBEDDING COMPLETE =========="
      );

      return (
        "<!DOCTYPE html>\n" +
        doc.documentElement.outerHTML
      );
    };

  // ========================================
  // INJECT EMBEDDED TTF FONTS
  //
  // The PPTX may contain the actual font
  // binaries. We embed those binaries as
  // @font-face rules so the browser uses
  // the original PPT font metrics instead
  // of a generic fallback font.
  // ========================================
