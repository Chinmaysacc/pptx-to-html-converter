import JSZip from "jszip";
import { eotToTtf, parseEotMetadata } from "mtx-decompressor";
import type { EmbeddedFont, EmbeddedFontVariant } from "../types/font";

function uint8ArrayToBase64(
  data: Uint8Array
): string {
  let binary = "";

  const chunkSize = 0x8000;

  for (
    let offset = 0;
    offset < data.length;
    offset += chunkSize
  ) {
    const chunk = data.subarray(
      offset,
      Math.min(
        offset + chunkSize,
        data.length
      )
    );

    binary += String.fromCharCode(
      ...chunk
    );
  }

  return btoa(binary);
}

// ========================================
// NORMALIZE ZIP TARGET
//
// Relationship targets are usually relative
// to ppt/presentation.xml:
//
// fonts/font1.fntdata
// ../fonts/font1.fntdata
// ppt/fonts/font1.fntdata
// ========================================

function normalizePresentationTarget(
  target: string
): string {
  const cleanTarget =
    target.split("?")[0].split("#")[0];

  if (
    cleanTarget.startsWith("/")
  ) {
    return cleanTarget.replace(
      /^\/+/,
      ""
    );
  }

  if (
    cleanTarget.startsWith(
      "ppt/"
    )
  ) {
    return cleanTarget;
  }

  if (
    cleanTarget.startsWith(
      "../"
    )
  ) {
    const withoutParent =
      cleanTarget.replace(
        /^\.\.\//,
        ""
      );

    return `ppt/${withoutParent}`;
  }

  return `ppt/${cleanTarget.replace(
    /^\.?\//,
    ""
  )}`;
}

// ========================================
// GET PRESENTATION RELATIONSHIPS
//
// Builds:
//
// rId1 -> ppt/fonts/font1.fntdata
// ========================================

async function getPresentationRelationshipMap(
  zip: JSZip
): Promise<Map<string, string>> {
  const relationshipMap =
    new Map<string, string>();

  const relationshipPath =
    "ppt/_rels/presentation.xml.rels";

  const relationshipFile =
    zip.files[
      relationshipPath
    ];

  if (!relationshipFile) {
    console.warn(
      "presentation.xml.rels NOT FOUND"
    );

    return relationshipMap;
  }

  const xml =
    await relationshipFile.async(
      "text"
    );

  const parser =
    new DOMParser();

  const xmlDoc =
    parser.parseFromString(
      xml,
      "application/xml"
    );

  const relationships =
    Array.from(
      xmlDoc.getElementsByTagName(
        "Relationship"
      )
    );

  for (
    const relationship of
    relationships
  ) {
    const id =
      relationship.getAttribute(
        "Id"
      );

    const target =
      relationship.getAttribute(
        "Target"
      );

    if (
      !id ||
      !target
    ) {
      continue;
    }

    relationshipMap.set(
      id,
      normalizePresentationTarget(
        target
      )
    );
  }

  return relationshipMap;
}

// ========================================
// FIND EMBEDDED FONT RELATIONSHIP ID
//
// Handles namespace-qualified and
// namespace-free XML safely.
// ========================================

function getRelationshipId(
  element: Element | null
): string | null {
  if (!element) {
    return null;
  }

  return (
    element.getAttribute(
      "r:id"
    ) ||
    element.getAttribute(
      "r:embed"
    ) ||
    element.getAttributeNS(
      "http://schemas.openxmlformats.org/officeDocument/2006/relationships",
      "id"
    ) ||
    element.getAttribute(
      "id"
    )
  );
}

// ========================================
// GET VARIANT INFORMATION
// ========================================

function getFontVariantInfo(
  variant: "regular" | "bold" | "italic" | "boldItalic"
): {
  fontWeight: string;
  fontStyle: string;
} {
  switch (
    variant
  ) {
    case "bold":
      return {
        fontWeight: "700",
        fontStyle: "normal",
      };

    case "italic":
      return {
        fontWeight: "400",
        fontStyle: "italic",
      };

    case "boldItalic":
      return {
        fontWeight: "700",
        fontStyle: "italic",
      };

    default:
      return {
        fontWeight: "400",
        fontStyle: "normal",
      };
  }
}

// ========================================
// EXTRACT EMBEDDED FONTS FROM PPTX
// ========================================

export async function extractEmbeddedFonts(
  pptxFile: File
): Promise<EmbeddedFont[]> {
  console.log(
    "========== STARTING EMBEDDED FONT EXTRACTION =========="
  );

  const zip =
    await JSZip.loadAsync(
      pptxFile
    );

  const presentationFile =
    zip.files[
      "ppt/presentation.xml"
    ];

  if (!presentationFile) {
    console.warn(
      "presentation.xml NOT FOUND - NO EMBEDDED FONTS"
    );

    return [];
  }

  const presentationXml =
    await presentationFile.async(
      "text"
    );

  const parser =
    new DOMParser();

  const presentationDoc =
    parser.parseFromString(
      presentationXml,
      "application/xml"
    );

  const embeddedFontList =
    presentationDoc.getElementsByTagName(
      "p:embeddedFontLst"
    )[0];

  if (!embeddedFontList) {
    console.warn(
      "p:embeddedFontLst NOT FOUND - NO EMBEDDED FONTS"
    );

    return [];
  }

  const relationshipMap =
    await getPresentationRelationshipMap(
      zip
    );

  const embeddedFontElements =
    Array.from(
      embeddedFontList.getElementsByTagName(
        "p:embeddedFont"
      )
    );

  console.log(
    "EMBEDDED FONT ENTRIES:",
    embeddedFontElements.length
  );

  const variants: Array<
    "regular" |
    "bold" |
    "italic" |
    "boldItalic"
  > = [
    "regular",
    "bold",
    "italic",
    "boldItalic",
  ];

  const extractedFonts:
    EmbeddedFont[] = [];

  const seen =
    new Set<string>();

  for (
    const embeddedFont of
    embeddedFontElements
  ) {
    const fontElement =
      embeddedFont.getElementsByTagName(
        "p:font"
      )[0];

    const fontFamily =
      fontElement?.getAttribute(
        "typeface"
      )?.trim();

    if (!fontFamily) {
      console.warn(
        "EMBEDDED FONT HAS NO TYPEFACE - SKIPPING"
      );

      continue;
    }

    console.log(
      "EMBEDDED FONT FAMILY:",
      fontFamily
    );

    for (
      const variant of
      variants
    ) {
      const variantElement =
        embeddedFont.getElementsByTagName(
          `p:${variant}`
        )[0];

      if (!variantElement) {
        continue;
      }

      const relationshipId =
        getRelationshipId(
          variantElement
        );

      if (!relationshipId) {
        console.warn(
          "FONT VARIANT HAS NO RELATIONSHIP ID:",
          {
            fontFamily,
            variant,
          }
        );

        continue;
      }

      const sourcePath =
        relationshipMap.get(
          relationshipId
        );

      if (!sourcePath) {
        console.warn(
          "FONT RELATIONSHIP NOT FOUND:",
          {
            fontFamily,
            variant,
            relationshipId,
          }
        );

        continue;
      }

      const fontFile =
        zip.files[
          sourcePath
        ];

      if (!fontFile) {
        console.warn(
          "EMBEDDED FONT FILE NOT FOUND:",
          sourcePath
        );

        continue;
      }

      const fontBytes =
        await fontFile.async(
          "uint8array"
        );

      console.log(
        "EMBEDDED FONT FILE:",
        {
          fontFamily,
          variant,
          sourcePath,
          size: fontBytes.length,
        }
      );

      try {
        const metadata =
          parseEotMetadata(
            fontBytes
          );

        console.log(
          "EOT FONT METADATA:",
          {
            sourcePath,
            familyName:
              metadata.familyName,
            styleName:
              metadata.styleName,
            fullName:
              metadata.fullName,
            permissions:
              metadata.permissions,
            compressed:
              metadata.compressed,
            encrypted:
              metadata.encrypted,
          }
        );

        const ttfBytes =
          eotToTtf(
            fontBytes
          );

        const dataUrl =
          `data:font/ttf;base64,${uint8ArrayToBase64(
            ttfBytes
          )}`;

        const {
          fontWeight,
          fontStyle,
        } =
          getFontVariantInfo(
            variant
          );

        const uniqueKey =
          `${fontFamily}|${variant}|${sourcePath}`;

        if (
          seen.has(
            uniqueKey
          )
        ) {
          continue;
        }

        seen.add(
          uniqueKey
        );

        const extractedFont:
          EmbeddedFont = {
            fontFamily,
            fontWeight,
            fontStyle,
            dataUrl,
            sourcePath,
            variant,
          };

        extractedFonts.push(
          extractedFont
        );

        console.log(
          "EMBEDDED FONT CONVERTED SUCCESSFULLY:",
          {
            fontFamily,
            variant,
            sourcePath,
            fontWeight,
            fontStyle,
            ttfSize:
              ttfBytes.length,
          }
        );

      } catch (
        error
      ) {
        console.error(
          "FAILED TO CONVERT EMBEDDED FONT:",
          {
            fontFamily,
            variant,
            sourcePath,
            error,
          }
        );
      }
    }
  }

  console.log(
    "========== EMBEDDED FONT EXTRACTION COMPLETE =========="
  );

  console.table(
    extractedFonts.map(
      font => ({
        fontFamily:
          font.fontFamily,
        variant:
          font.variant,
        fontWeight:
          font.fontWeight,
        fontStyle:
          font.fontStyle,
        sourcePath:
          font.sourcePath,
      })
    )
  );

  return extractedFonts;
}
