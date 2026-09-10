import JSZip from "jszip";
import type { ExtractedFont } from "../types/font";

interface ThemeFonts {
  majorLatin: string;
  minorLatin: string;
}

async function getThemeFonts(
  zip: JSZip
): Promise<ThemeFonts> {

  const defaultFonts: ThemeFonts = {
    majorLatin: "Arial",
    minorLatin: "Arial",
  };

  const themeFile =
    zip.files[
      "ppt/theme/theme1.xml"
    ];

  if (!themeFile) {
    console.warn(
      "THEME FILE NOT FOUND"
    );

    return defaultFonts;
  }

  const themeXml =
    await themeFile.async(
      "text"
    );

  const parser =
    new DOMParser();

  const xmlDoc =
    parser.parseFromString(
      themeXml,
      "application/xml"
    );

  const majorFont =
    xmlDoc.getElementsByTagName(
      "a:majorFont"
    )[0];

  const minorFont =
    xmlDoc.getElementsByTagName(
      "a:minorFont"
    )[0];

  const majorLatin =
    majorFont
      ?.getElementsByTagName(
        "a:latin"
      )[0]
      ?.getAttribute(
        "typeface"
      );

  const minorLatin =
    minorFont
      ?.getElementsByTagName(
        "a:latin"
      )[0]
      ?.getAttribute(
        "typeface"
      );

  const fonts: ThemeFonts = {
    majorLatin:
      majorLatin ||
      "Arial",

    minorLatin:
      minorLatin ||
      "Arial",
  };

  console.log(
    "========== PPT THEME FONTS =========="
  );

  console.table(
    fonts
  );

  return fonts;
}


// ========================================
// GET FONT FROM A TEXT RUN
//
// Checks for a direct font declaration.
// If none is found, falls back to the
// presentation theme's minor font,
// major font, and finally Arial.
// ========================================

function getRunFont(
  run: Element,
  themeFonts: ThemeFonts
): string {

  const runProperties =
    Array.from(
      run.children
    ).find(
      child =>
        child.tagName === "a:rPr"
    );

  // ----------------------------------------
  // 1. DIRECT FONT
  //
  // <a:rPr>
  //   <a:latin typeface="FONT"/>
  // </a:rPr>
  // ----------------------------------------

  if (
    runProperties
  ) {

    const latinFont =
      runProperties
        .getElementsByTagName(
          "a:latin"
        )[0]
        ?.getAttribute(
          "typeface"
        );

    if (
      latinFont
    ) {

      return latinFont;
    }

    // ----------------------------------------
    // Sometimes typeface is directly stored
    // on rPr
    // ----------------------------------------

    const directTypeface =
      runProperties.getAttribute(
        "typeface"
      );

    if (
      directTypeface
    ) {

      return directTypeface;
    }
  }

  // ----------------------------------------
  // 2. DEFAULT TO MINOR THEME FONT
  //
  // Most normal body text uses minor font.
  // ----------------------------------------

  return (
    themeFonts.minorLatin ||
    themeFonts.majorLatin ||
    "Arial"
  );
}


// ========================================
// EXTRACT FONTS FROM ONE SLIDE
// ========================================

async function getFontsFromSlide(
  zip: JSZip,
  slideNumber: number,
  themeFonts: ThemeFonts
): Promise<ExtractedFont[]> {

  const fonts:
    ExtractedFont[] =
      [];

  const slidePath =
    `ppt/slides/slide${slideNumber}.xml`;

  const slideFile =
    zip.files[
      slidePath
    ];

  if (
    !slideFile
  ) {
    return fonts;
  }

  const slideXml =
    await slideFile.async(
      "text"
    );

  const parser =
    new DOMParser();

  const xmlDoc =
    parser.parseFromString(
      slideXml,
      "application/xml"
    );

  // ========================================
  // GET ALL TEXT RUNS
  //
  // <a:r>
  //   <a:rPr>
  //   <a:t>TEXT</a:t>
  // </a:r>
  // ========================================

  const runs =
    Array.from(
      xmlDoc.getElementsByTagName(
        "a:r"
      )
    );

  console.log(
    `========== EXTRACTING FONTS FROM SLIDE ${slideNumber} ==========`
  );

  console.log(
    "TEXT RUNS FOUND:",
    runs.length
  );

  for (
    const run of runs
  ) {

    const textElement =
      run.getElementsByTagName(
        "a:t"
      )[0];

    if (
      !textElement
    ) {
      continue;
    }

    const text =
      textElement.textContent
        ?.trim();

    if (
      !text
    ) {
      continue;
    }

    const fontFamily =
      getRunFont(
        run,
        themeFonts
      );

    const extractedFont:
      ExtractedFont = {
        slideNumber,
        text,
        fontFamily,
      };

    fonts.push(
      extractedFont
    );

    console.log(
      "FONT EXTRACTED:",
      extractedFont
    );
  }

  return fonts;
}


// ========================================
// EXTRACT ALL FONTS FROM PPTX
// ========================================

export async function extractFontsFromPptx(
  pptxFile: File
): Promise<
  ExtractedFont[]
> {

  console.log(
    "========== STARTING FONT EXTRACTION =========="
  );

  const zip =
    await JSZip.loadAsync(
      pptxFile
    );

  // ========================================
  // GET THEME FONTS
  // ========================================

  const themeFonts =
    await getThemeFonts(
      zip
    );

  // ========================================
  // FIND ALL SLIDES
  // ========================================

  const slideFiles =
    Object.keys(
      zip.files
    )
      .filter(
        path =>
          /^ppt\/slides\/slide\d+\.xml$/.test(
            path
          )
      )
      .sort(
        (a, b) => {

          const aNumber =
            Number(
              a.match(
                /slide(\d+)\.xml/
              )?.[1] || 0
            );

          const bNumber =
            Number(
              b.match(
                /slide(\d+)\.xml/
              )?.[1] || 0
            );

          return (
            aNumber -
            bNumber
          );
        }
      );

  console.log(
    "TOTAL SLIDES FOR FONT EXTRACTION:",
    slideFiles.length
  );

  const extractedFonts:
    ExtractedFont[] =
      [];

  // ========================================
  // PROCESS EVERY SLIDE
  // ========================================

  for (
    const slidePath of
    slideFiles
  ) {

    const slideNumber =
      Number(
        slidePath.match(
          /slide(\d+)\.xml/
        )?.[1] || 0
      );

    const slideFonts =
      await getFontsFromSlide(
        zip,
        slideNumber,
        themeFonts
      );

    extractedFonts.push(
      ...slideFonts
    );
  }

  // ========================================
  // FINAL DEBUG
  // ========================================

  console.log(
    "========== FONT EXTRACTION COMPLETE =========="
  );

  console.table(
    extractedFonts.map(
      font => ({
        slideNumber:
          font.slideNumber,

        text:
          font.text,

        fontFamily:
          font.fontFamily,
      })
    )
  );

  return extractedFonts;
}
