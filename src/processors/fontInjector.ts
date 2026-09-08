import type { EmbeddedFont, ExtractedFont } from "../types/font";

  export const injectEmbeddedFontsIntoHtml = (
    html: string,
    embeddedFonts: EmbeddedFont[]
  ): string => {
    if (
      embeddedFonts.length === 0
    ) {
      console.warn(
        "NO EMBEDDED FONTS TO INJECT"
      );

      return html;
    }

    console.log(
      "========== STARTING EMBEDDED FONT INJECTION =========="
    );

    const parser =
      new DOMParser();

    const doc =
      parser.parseFromString(
        html,
        "text/html"
      );

    const style =
      doc.createElement(
        "style"
      );

    const rules =
      embeddedFonts.map(
        (
          font
        ) => {
          const safeFamily =
            font.fontFamily.replace(
              /\\/g,
              "\\\\"
            ).replace(
              /"/g,
              '\\"'
            );

          return `
@font-face {
  font-family: "${safeFamily}";
  src: url("${font.dataUrl}") format("truetype");
  font-weight: ${font.fontWeight};
  font-style: ${font.fontStyle};
  font-display: block;
}
`;
        }
      ).join("\n");

    style.setAttribute(
      "data-ppt-embedded-fonts",
      "true"
    );

    style.textContent =
      rules;

    doc.head.appendChild(
      style
    );

    console.log(
      "EMBEDDED FONT @font-face RULES ADDED:",
      embeddedFonts.length
    );

    console.log(
      "========== EMBEDDED FONT INJECTION COMPLETE =========="
    );

    return (
      "<!DOCTYPE html>\n" +
      doc.documentElement.outerHTML
    );
  };
        export const applyExtractedFonts = (
          html: string,
          extractedFonts: ExtractedFont[]
        ): string => {

          console.log(
            "========== STARTING FONT INJECTION =========="
          );

          const parser =
            new DOMParser();

          const doc =
            parser.parseFromString(
              html,
              "text/html"
            );

          const slides =
            Array.from(
              doc.querySelectorAll(
                ".slide"
              )
            );

          console.log(
            "TOTAL HTML SLIDES:",
            slides.length
          );

          let appliedCount = 0;

          extractedFonts.forEach(
            (font) => {

              const slide =
                slides[
                  font.slideNumber - 1
                ];

              if (!slide) {

                console.warn(
                  `FONT SLIDE NOT FOUND: ${font.slideNumber}`
                );

                return;
              }

              const runs =
                Array.from(
                  slide.querySelectorAll(
                    ".run"
                  )
                );

              // Find exact matching text
              const matchingRuns =
                runs.filter(
                  (run) => {

                    const runText =
                      run.textContent
                        ?.trim()
                        .replace(
                          /\s+/g,
                          " "
                        );

                    const extractedText =
                      font.text
                        .trim()
                        .replace(
                          /\s+/g,
                          " "
                        );

                    return (
                      runText ===
                      extractedText
                    );
                  }
                );

              if (
                matchingRuns.length === 0
              ) {

                console.warn(
                  "FONT MATCH NOT FOUND:",
                  {
                    slide:
                      font.slideNumber,

                    text:
                      font.text,

                    font:
                      font.fontFamily,
                  }
                );

                return;
              }

              matchingRuns.forEach(
                (run) => {

                  (
                    run as HTMLElement
                  ).style.fontFamily =
                    `"${font.fontFamily}", sans-serif`;

                  appliedCount++;

                  console.log(
                    "FONT APPLIED:",
                    {
                      slide:
                        font.slideNumber,

                      text:
                        font.text,

                      font:
                        font.fontFamily,
                    }
                  );

                }
              );

            }
          );

          console.log(
            "TOTAL FONTS APPLIED:",
            appliedCount
          );

          console.log(
            "========== FONT INJECTION COMPLETE =========="
          );

          return (
            "<!DOCTYPE html>\n" +
            doc.documentElement.outerHTML
          );
        };
