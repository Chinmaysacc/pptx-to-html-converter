import JSZip from "jszip";
import type { SlideSize } from "../types/pptx";

export async function extractSlideSizeFromPptx(
  pptxFile: File
): Promise<SlideSize> {

  console.log(
    "========== EXTRACTING PPT SLIDE SIZE =========="
  );

  const zip =
    await JSZip.loadAsync(
      pptxFile
    );

  const presentationFile =
    zip.files[
      "ppt/presentation.xml"
    ];

  // ----------------------------------------
  // FALLBACK
  // ----------------------------------------

  const defaultSlideSize: SlideSize = {
    width: 12192000,
    height: 6858000,
  };

  if (!presentationFile) {

    console.warn(
      "presentation.xml NOT FOUND - USING DEFAULT SLIDE SIZE"
    );

    return defaultSlideSize;
  }

  const xml =
    await presentationFile.async(
      "text"
    );

  const parser =
    new DOMParser();

  const xmlDoc =
    parser.parseFromString(
      xml,
      "application/xml"
    );

  const slideSize =
    xmlDoc.getElementsByTagName(
      "p:sldSz"
    )[0];

  if (!slideSize) {

    console.warn(
      "p:sldSz NOT FOUND - USING DEFAULT SLIDE SIZE"
    );

    return defaultSlideSize;
  }

  const width =
    Number(
      slideSize.getAttribute(
        "cx"
      ) || 0
    );

  const height =
    Number(
      slideSize.getAttribute(
        "cy"
      ) || 0
    );

  if (
    !width ||
    !height
  ) {

    console.warn(
      "INVALID PPT SLIDE SIZE - USING DEFAULT"
    );

    return defaultSlideSize;
  }

  const result: SlideSize = {
    width,
    height,
  };

  console.log(
    "========== PPT SLIDE SIZE =========="
  );

  console.log(
    result
  );

  console.log(
    "SLIDE ASPECT RATIO:",
    width / height
  );

  return result;
}

// ========================================
// EXTRACT ALL IMAGES FROM PPTX
// ========================================

