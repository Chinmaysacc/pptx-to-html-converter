import JSZip from "jszip";
import type { ExtractedMedia } from "../types/media";
import {
  getMediaType,
  getMimeType,
  normalizeMediaPath,
} from "../utils/pptxMedia";

async function getSlideRelationshipMap(
  zip: JSZip,
  slideNumber: number
): Promise<Map<string, string>> {
  const relationshipMap =
    new Map<string, string>();

  const relationshipPath =
    `ppt/slides/_rels/slide${slideNumber}.xml.rels`;

  const relationshipFile =
    zip.files[
      relationshipPath
    ];

  if (!relationshipFile) {
    return relationshipMap;
  }

  const xml =
    await relationshipFile.async(
      "text"
    );

  const relationshipRegex =
    /<Relationship\b[^>]*>/g;

  const relationshipTags =
    xml.match(
      relationshipRegex
    ) || [];

  for (
    const relationshipTag of
    relationshipTags
  ) {
    const idMatch =
      relationshipTag.match(
        /Id="([^"]+)"/
      );

    const targetMatch =
      relationshipTag.match(
        /Target="([^"]+)"/
      );

    if (
      !idMatch ||
      !targetMatch
    ) {
      continue;
    }

    const relationshipId =
      idMatch[1];

    const target =
      targetMatch[1];

    const normalizedPath =
      normalizeMediaPath(
        target
      );

    relationshipMap.set(
      relationshipId,
      normalizedPath
    );
  }

  return relationshipMap;
}

// ========================================
// GET ALL MEDIA → SLIDE MAPPING
//
// Audio / Video only
// ========================================
async function getMediaSlideMapping(
  zip: JSZip
): Promise<Map<string, number>> {
  const mediaSlideMap =
    new Map<string, number>();

  const relationshipFiles =
    Object.keys(
      zip.files
    ).filter(
      (path) =>
        path.startsWith(
          "ppt/slides/_rels/slide"
        ) &&
        path.endsWith(
          ".xml.rels"
        )
    );

  console.log(
    "========== SLIDE RELATIONSHIP FILES =========="
  );

  for (
    const relationshipPath of
    relationshipFiles
  ) {
    const match =
      relationshipPath.match(
        /slide(\d+)\.xml\.rels/
      );

    if (!match) {
      continue;
    }

    const slideNumber =
      Number(
        match[1]
      );

    const relationshipFile =
      zip.files[
        relationshipPath
      ];

    if (!relationshipFile) {
      continue;
    }

    const xml =
      await relationshipFile.async(
        "text"
      );

    const targetRegex =
      /Target="([^"]+)"/g;

    let result;

    while (
      (
        result =
          targetRegex.exec(
            xml
          )
      ) !== null
    ) {
      const target =
        result[1];

      const normalizedPath =
        normalizeMediaPath(
          target
        );

      const mediaType =
        getMediaType(
          normalizedPath
        );

      if (
        mediaType
      ) {
        console.log(
          `FOUND ${mediaType.toUpperCase()} ON SLIDE ${slideNumber}:`,
          normalizedPath
        );

        mediaSlideMap.set(
          normalizedPath,
          slideNumber
        );
      }
    }
  }

  console.log(
    "========== MEDIA → SLIDE MAPPING =========="
  );

  console.log(
    Array.from(
      mediaSlideMap.entries()
    )
  );

  return mediaSlideMap;
}

// ========================================
// EXTRACT AUDIO + VIDEO
// ========================================

export async function extractMediaFromPptx(
  pptxFile: File
): Promise<ExtractedMedia[]> {
  console.log(
    "========== OPENING PPTX FOR MEDIA =========="
  );

  const zip =
    await JSZip.loadAsync(
      pptxFile
    );

  const mediaSlideMap =
    await getMediaSlideMapping(
      zip
    );

  const extractedMedia:
    ExtractedMedia[] = [];

  console.log(
    "========== EXTRACTING MEDIA =========="
  );

  for (
    const path of
    Object.keys(
      zip.files
    )
  ) {
    if (
      !path.startsWith(
        "ppt/media/"
      )
    ) {
      continue;
    }

    const mediaType =
      getMediaType(
        path
      );

    if (!mediaType) {
      continue;
    }

    const zipFile =
      zip.files[
        path
      ];

    if (!zipFile) {
      continue;
    }

    const blob =
      await zipFile.async(
        "blob"
      );

    const mimeType =
      getMimeType(
        path
      );

    const typedBlob =
      new Blob(
        [blob],
        {
          type:
            mimeType,
        }
      );

    const url =
      URL.createObjectURL(
        typedBlob
      );

    const slideNumber =
      mediaSlideMap.get(
        path
      ) ?? -1;

    const media:
      ExtractedMedia = {
        path,
        type:
          mediaType,
        mimeType,
        url,
        slideNumber,
      };

    extractedMedia.push(
      media
    );

    console.log(
      "EXTRACTED MEDIA:",
      media
    );
  }

  console.log(
    "========== MEDIA EXTRACTION COMPLETE =========="
  );

  console.table(
    extractedMedia.map(
      (
        media
      ) => ({
        path:
          media.path,
        type:
          media.type,
        slideNumber:
          media.slideNumber,
        mimeType:
          media.mimeType,
      })
    )
  );

  return extractedMedia;
}
