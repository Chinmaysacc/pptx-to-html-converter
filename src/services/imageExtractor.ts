import JSZip from "jszip";
import type { ExtractedImage } from "../types/image";
import {
  getMimeType,
  isImageFile,
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
function getDirectTransform(
  element: Element
): {
  x: number;
  y: number;
  width: number;
  height: number;
} {

  const xfrm =
    Array.from(
      element.children
    ).find(
      child =>
        child.tagName === "p:spPr"
    )
    ?.getElementsByTagName(
      "a:xfrm"
    )[0]
    ||
    element.getElementsByTagName(
      "a:xfrm"
    )[0];

  if (!xfrm) {
    return {
      x: 0,
      y: 0,
      width: 0,
      height: 0,
    };
  }

  const off =
    Array.from(
      xfrm.children
    ).find(
      child =>
        child.tagName === "a:off"
    );

  const ext =
    Array.from(
      xfrm.children
    ).find(
      child =>
        child.tagName === "a:ext"
    );

  return {
    x: off
      ? Number(
          off.getAttribute("x") || 0
        )
      : 0,

    y: off
      ? Number(
          off.getAttribute("y") || 0
        )
      : 0,

    width: ext
      ? Number(
          ext.getAttribute("cx") || 0
        )
      : 0,

    height: ext
      ? Number(
          ext.getAttribute("cy") || 0
        )
      : 0,
  };
}


// ========================================
// GET GROUP TRANSFORM
//
// For:
//
// <p:grpSp>
//   <p:grpSpPr>
//     <a:xfrm>
//       <a:off ... />
//       <a:ext ... />
//       <a:chOff ... />
//       <a:chExt ... />
//     </a:xfrm>
//   </p:grpSpPr>
// </p:grpSp>
// ========================================

function getGroupTransform(
  group: Element
): {
  x: number;
  y: number;
  width: number;
  height: number;
  childX: number;
  childY: number;
  childWidth: number;
  childHeight: number;
} {

  const groupProperties =
    Array.from(
      group.children
    ).find(
      child =>
        child.tagName === "p:grpSpPr"
    );

  const xfrm =
    groupProperties?.getElementsByTagName(
      "a:xfrm"
    )[0];

  if (!xfrm) {
    return {
      x: 0,
      y: 0,
      width: 0,
      height: 0,
      childX: 0,
      childY: 0,
      childWidth: 0,
      childHeight: 0,
    };
  }

  const off =
    Array.from(
      xfrm.children
    ).find(
      child =>
        child.tagName === "a:off"
    );

  const ext =
    Array.from(
      xfrm.children
    ).find(
      child =>
        child.tagName === "a:ext"
    );

  const chOff =
    Array.from(
      xfrm.children
    ).find(
      child =>
        child.tagName === "a:chOff"
    );

  const chExt =
    Array.from(
      xfrm.children
    ).find(
      child =>
        child.tagName === "a:chExt"
    );

  return {
    x: off
      ? Number(
          off.getAttribute("x") || 0
        )
      : 0,

    y: off
      ? Number(
          off.getAttribute("y") || 0
        )
      : 0,

    width: ext
      ? Number(
          ext.getAttribute("cx") || 0
        )
      : 0,

    height: ext
      ? Number(
          ext.getAttribute("cy") || 0
        )
      : 0,

    childX: chOff
      ? Number(
          chOff.getAttribute("x") || 0
        )
      : 0,

    childY: chOff
      ? Number(
          chOff.getAttribute("y") || 0
        )
      : 0,

    childWidth: chExt
      ? Number(
          chExt.getAttribute("cx") || 0
        )
      : 0,

    childHeight: chExt
      ? Number(
          chExt.getAttribute("cy") || 0
        )
      : 0,
  };
}


// ========================================
// GET ABSOLUTE TRANSFORM
//
// Converts an image's local coordinates
// into slide-level coordinates.
//
// Supports nested PowerPoint groups.
// ========================================

function getElementTransform(
  element: Element
): {
  x: number;
  y: number;
  width: number;
  height: number;
} {

  let transform =
    getDirectTransform(
      element
    );

  let x =
    transform.x;

  let y =
    transform.y;

  let width =
    transform.width;

  let height =
    transform.height;

  let current =
    element.parentElement;

  console.log(
    "========== CALCULATING ABSOLUTE IMAGE POSITION =========="
  );

  console.log(
    "LOCAL TRANSFORM:",
    {
      x,
      y,
      width,
      height,
    }
  );

  // Walk upwards through all parents.
  // If we encounter a PowerPoint group,
  // convert child coordinates into the
  // group's coordinate system.

  while (current) {

    if (
      current.tagName === "p:grpSp"
    ) {

      const group =
        getGroupTransform(
          current
        );

      console.log(
        "GROUP FOUND:",
        group
      );

      // Calculate scaling between
      // child coordinate system
      // and actual group size.

      const scaleX =
        group.childWidth !== 0
          ? group.width /
            group.childWidth
          : 1;

      const scaleY =
        group.childHeight !== 0
          ? group.height /
            group.childHeight
          : 1;

      // Convert current position
      // into parent's coordinate system.

      x =
        group.x +
        (
          x -
          group.childX
        ) *
        scaleX;

      y =
        group.y +
        (
          y -
          group.childY
        ) *
        scaleY;

      width =
        width *
        scaleX;

      height =
        height *
        scaleY;

      console.log(
        "AFTER GROUP TRANSFORM:",
        {
          x,
          y,
          width,
          height,
          scaleX,
          scaleY,
        }
      );
    }

    current =
      current.parentElement;
  }

  console.log(
    "FINAL ABSOLUTE TRANSFORM:",
    {
      x,
      y,
      width,
      height,
    }
  );

  return {
    x,
    y,
    width,
    height,
  };
}

// ========================================
// GET RELATIONSHIP ID FROM IMAGE ELEMENT
//
// Handles:
//
// <a:blip r:embed="rId2"/>
// ========================================

function getEmbedRelationshipId(
  element: Element
): string | null {
  const blips =
    element.getElementsByTagName(
      "a:blip"
    );

  for (
    const blip of
    Array.from(
      blips
    )
  ) {
    const relationshipId =
      blip.getAttribute(
        "r:embed"
      );

    if (
      relationshipId
    ) {
      return relationshipId;
    }
  }

  return null;
}

// ========================================
// CONVERT ZIP IMAGE TO DATA URL
// ========================================

async function imageToDataUrl(
  zip: JSZip,
  imagePath: string
): Promise<string | null> {
  const zipFile =
    zip.files[
      imagePath
    ];

  if (!zipFile) {
    console.warn(
      "IMAGE FILE NOT FOUND:",
      imagePath
    );

    return null;
  }

  const blob =
    await zipFile.async(
      "blob"
    );

  const mimeType =
    getMimeType(
      imagePath
    );

  const typedBlob =
    new Blob(
      [blob],
      {
        type:
          mimeType,
      }
    );

  const dataUrl =
    await new Promise<string>(
      (
        resolve,
        reject
      ) => {
        const reader =
          new FileReader();

        reader.onload =
          () => {
            if (
              typeof reader.result ===
              "string"
            ) {
              resolve(
                reader.result
              );
            } else {
              reject(
                new Error(
                  "Failed to convert image to Data URL"
                )
              );
            }
          };

        reader.onerror =
          () => {
            reject(
              new Error(
                "Failed to read image"
              )
            );
          };

        reader.readAsDataURL(
          typedBlob
        );
      }
    );

  return dataUrl;
}

// ========================================
// CREATE EXTRACTED IMAGE
// ========================================

async function createExtractedImage(
  zip: JSZip,
  relationshipMap: Map<
    string,
    string
  >,
  relationshipId: string,
  slideNumber: number,
  x: number,
  y: number,
  width: number,
  height: number
): Promise<ExtractedImage | null> {
  const imagePath =
    relationshipMap.get(
      relationshipId
    );

  if (
    !imagePath ||
    !isImageFile(
      imagePath
    )
  ) {
    return null;
  }

  const dataUrl =
    await imageToDataUrl(
      zip,
      imagePath
    );

  if (!dataUrl) {
    return null;
  }

  const extractedImage:
    ExtractedImage = {
      path:
        imagePath,

      type:
        "image",

      mimeType:
        getMimeType(
          imagePath
        ),

      dataUrl,

      slideNumber,

      x,
      y,
      width,
      height,
    };

  console.log(
    `EXTRACTED IMAGE FROM SLIDE ${slideNumber}:`,
    {
      path:
        imagePath,
      relationshipId,
      x,
      y,
      width,
      height,
    }
  );

  return extractedImage;
}

// ========================================
// EXTRACT IMAGES FROM ONE SLIDE
//
// Handles:
//
// 1. <p:pic>
// 2. <p:sp> with <a:blipFill>
// 3. Images inside <p:grpSp>
// 4. Nested shape images
// ========================================

async function getImagesFromSlide(
  zip: JSZip,
  slideNumber: number
): Promise<
  ExtractedImage[]
> {
  const images:
    ExtractedImage[] = [];

  const slidePath =
    `ppt/slides/slide${slideNumber}.xml`;

  const slideFile =
    zip.files[
      slidePath
    ];

  if (!slideFile) {
    return images;
  }

  const slideXml =
    await slideFile.async(
      "text"
    );

  const relationshipMap =
    await getSlideRelationshipMap(
      zip,
      slideNumber
    );

  // ========================================
  // PARSE XML
  // ========================================

  const parser =
    new DOMParser();

  const xmlDoc =
    parser.parseFromString(
      slideXml,
      "application/xml"
    );

  const parserError =
    xmlDoc.querySelector(
      "parsererror"
    );

  if (
    parserError
  ) {
    console.error(
      `XML PARSE ERROR ON SLIDE ${slideNumber}:`,
      parserError.textContent
    );

    return images;
  }

  // ========================================
  // FIND ALL IMAGE-CONTAINING ELEMENTS
  //
  // PowerPoint may store an image as:
  //
  // <p:pic>
  //
  // OR
  //
  // <p:sp>
  //   <a:blipFill>
  //
  // The second case was causing
  // Slide 3 to be missed.
  // ========================================

  const imageElements:
    Element[] = [];

  const pictureElements =
    Array.from(
      xmlDoc.getElementsByTagName(
        "p:pic"
      )
    );

  const shapeElements =
    Array.from(
      xmlDoc.getElementsByTagName(
        "p:sp"
      )
    );

  // Add normal pictures

  for (
    const picture of
    pictureElements
  ) {
    const relationshipId =
      getEmbedRelationshipId(
        picture
      );

    if (
      relationshipId
    ) {
      imageElements.push(
        picture
      );
    }
  }

  // Add shapes containing image fills

  for (
    const shape of
    shapeElements
  ) {
    const blipFill =
      shape.getElementsByTagName(
        "a:blipFill"
      )[0];

    if (
      !blipFill
    ) {
      continue;
    }

    const relationshipId =
      getEmbedRelationshipId(
        blipFill
      );

    if (
      relationshipId
    ) {
      imageElements.push(
        shape
      );
    }
  }

  console.log(
    `========== SLIDE ${slideNumber} IMAGE DEBUG ==========`
  );

  console.log(
    "NORMAL PICTURES:",
    pictureElements.length
  );

  console.log(
    "IMAGE SHAPES:",
    imageElements.length
  );

  // ========================================
  // PREVENT DUPLICATES
  // ========================================

  const processed =
    new Set<string>();

  for (
    const element of
    imageElements
  ) {
    const relationshipId =
      getEmbedRelationshipId(
        element
      );

    if (
      !relationshipId
    ) {
      continue;
    }

    const transform =
      getElementTransform(
        element
      );

    const imagePath =
      relationshipMap.get(
        relationshipId
      );

    if (
      !imagePath
    ) {
      console.warn(
        `NO RELATIONSHIP FOUND FOR ${relationshipId} ON SLIDE ${slideNumber}`
      );

      continue;
    }

    // Duplicate key includes
    // image + position.

    const uniqueKey =
      `${relationshipId}-${transform.x}-${transform.y}-${transform.width}-${transform.height}`;

    if (
      processed.has(
        uniqueKey
      )
    ) {
      continue;
    }

    processed.add(
      uniqueKey
    );

    const extractedImage =
      await createExtractedImage(
        zip,
        relationshipMap,
        relationshipId,
        slideNumber,
        transform.x,
        transform.y,
        transform.width,
        transform.height
      );

    if (
      extractedImage
    ) {
      images.push(
        extractedImage
      );
    }
  }

  console.log(
    `SLIDE ${slideNumber} TOTAL EXTRACTED IMAGES:`,
    images.length
  );

  return images;
}

// ========================================
// EXTRACT ALL IMAGES FROM PPTX
// ========================================

export async function extractImagesFromPptx(
  pptxFile: File
): Promise<
  ExtractedImage[]
> {
  console.log(
    "========== OPENING PPTX FOR IMAGE EXTRACTION =========="
  );

  const zip =
    await JSZip.loadAsync(
      pptxFile
    );

  // ========================================
  // FIND ALL SLIDE XML FILES
  // ========================================

  const slideFiles =
    Object.keys(
      zip.files
    )
      .filter(
        (
          path
        ) =>
          /^ppt\/slides\/slide\d+\.xml$/.test(
            path
          )
      )
      .sort(
        (
          a,
          b
        ) => {
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
    "TOTAL SLIDES FOR IMAGE EXTRACTION:",
    slideFiles.length
  );

  const allImages:
    ExtractedImage[] = [];

  // ========================================
  // PROCESS EACH SLIDE
  // ========================================

  for (
    const slidePath of
    slideFiles
  ) {
    const match =
      slidePath.match(
        /slide(\d+)\.xml/
      );

    if (
      !match
    ) {
      continue;
    }

    const slideNumber =
      Number(
        match[1]
      );

    console.log(
      `========== EXTRACTING IMAGES FROM SLIDE ${slideNumber} ==========`
    );

    const slideImages =
      await getImagesFromSlide(
        zip,
        slideNumber
      );

    allImages.push(
      ...slideImages
    );
  }

  console.log(
    "========== IMAGE EXTRACTION COMPLETE =========="
  );

  console.table(
    allImages.map(
      (
        image
      ) => ({
        slideNumber:
          image.slideNumber,

        path:
          image.path,

        x:
          image.x,

        y:
          image.y,

        width:
          image.width,

        height:
          image.height,
      })
    )
  );

  return allImages;
}
