import type { ExtractedImage } from "../types/image";
import type { SlideSize } from "../types/pptx";
import { emuToPercent } from "../utils/emu";

  export const imageAlreadyExists = (
    slide: Element,
    image: ExtractedImage,
    slideSize: SlideSize
  ): boolean => {
    const existingImages =
      slide.querySelectorAll("img");

    for (
      const existingImage of
      existingImages
    ) {
      const src =
        existingImage.getAttribute(
          "src"
        );

      if (!src) continue;

      // Exact Data URL match
      if (
        src === image.dataUrl
      ) {
        return true;
      }

      // Sometimes the converter stores
      // images as blob/data URLs, so use
      // position + size as an additional
      // duplicate check.
      const style =
        existingImage.getAttribute(
          "style"
        ) || "";

      const position =
        emuToPercent(
          image,
          slideSize);

      const leftMatch =
        style.includes(
          `${position.left.toFixed(2)}%`
        );

      const topMatch =
        style.includes(
          `${position.top.toFixed(2)}%`
        );

      const widthMatch =
        style.includes(
          `${position.width.toFixed(2)}%`
        );

      const heightMatch =
        style.includes(
          `${position.height.toFixed(2)}%`
        );

      if (
        leftMatch &&
        topMatch &&
        widthMatch &&
        heightMatch
      ) {
        return true;
      }
    }

    return false;
  };

  // ========================================
  // INJECT MISSING PPT IMAGES
  // ========================================

  export const injectImagesIntoHtml = (
    html: string,
    extractedImages: ExtractedImage[],
    slideSize: SlideSize
  ): string => {

    console.log(
      "========== STARTING IMAGE INJECTION =========="
    );

    const parser =
      new DOMParser();

    const doc =
      parser.parseFromString(
        html,
        "text/html"
      );

    const slides =
      doc.querySelectorAll(".slide");

    console.log(
      "TOTAL SLIDES FOUND FOR IMAGE INJECTION:",
      slides.length
    );

    extractedImages.forEach(
      (image, index) => {

        const slide =
          slides[
            image.slideNumber - 1
          ];

        if (!slide) {

          console.warn(
            `SLIDE ${image.slideNumber} NOT FOUND FOR IMAGE:`,
            image.path
          );

          return;
        }

        console.log(
          `PROCESSING IMAGE ${index + 1}:`,
          {
            slide:
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
          }
        );

        // ----------------------------------------
        // CHECK IF IMAGE ALREADY EXISTS
        // ----------------------------------------

        if (
          imageAlreadyExists(
            slide,
            image,
            slideSize
          )
        ) {

          console.log(
            "IMAGE ALREADY EXISTS - SKIPPING:",
            image.path
          );

          return;
        }

        // ----------------------------------------
        // CALCULATE POSITION
        // ----------------------------------------

        const position =
          emuToPercent(
            image,
            slideSize
          );

        console.log(
          "IMAGE MISSING - INJECTING:",
          image.path
        );

        console.log(
          "CSS POSITION:",
          position
        );

        // ----------------------------------------
        // CREATE IMAGE
        // ----------------------------------------

        const img =
          doc.createElement(
            "img"
          );

        img.src =
          image.dataUrl;

        img.alt =
          `Recovered PPT image ${index + 1}`;

        img.className =
          "ppt-recovered-image";

        // ----------------------------------------
        // POSITION
        // ----------------------------------------

        img.style.position =
          "absolute";

        img.style.left =
          `${position.left}%`;

        img.style.top =
          `${position.top}%`;

        img.style.width =
          `${position.width}%`;

        img.style.height =
          `${position.height}%`;

        img.style.objectFit =
          "fill";

        img.style.pointerEvents =
          "none";

        // ----------------------------------------
        // ENSURE SLIDE IS POSITIONED
        // ----------------------------------------

        (
          slide as HTMLElement
        ).style.position =
          "relative";

        // ----------------------------------------
        // DETECT BACKGROUND IMAGE
        //
        // A background image generally covers
        // almost the complete slide.
        // ----------------------------------------

        const isBackgroundImage =
          position.left <= 1 &&
          position.top <= 1 &&
          position.width >= 99 &&
          position.height >= 99;

        if (
          isBackgroundImage
        ) {

          console.log(
            "DETECTED AS BACKGROUND IMAGE:",
            image.path
          );

          // Background stays at bottom
          img.style.zIndex =
            "0";

          // Insert at beginning
          slide.insertBefore(
            img,
            slide.firstChild
          );

        } else {

          console.log(
            "DETECTED AS FOREGROUND / OVERLAY IMAGE:",
            image.path
          );

          // Put overlay image above recovered
          // background images
          img.style.zIndex =
            "1";

          // Insert after background images
          const recoveredImages =
            slide.querySelectorAll(
              ".ppt-recovered-image"
            );

          if (
            recoveredImages.length > 0
          ) {

            const lastRecoveredImage =
              recoveredImages[
                recoveredImages.length - 1
              ];

            if (
              lastRecoveredImage.nextSibling
            ) {

              slide.insertBefore(
                img,
                lastRecoveredImage.nextSibling
              );

            } else {

              slide.appendChild(
                img
              );
            }

          } else {

            slide.appendChild(
              img
            );
          }
        }

        console.log(
          "IMAGE INJECTED SUCCESSFULLY:",
          image.path
        );

      }
    );

    console.log(
      "========== IMAGE INJECTION COMPLETE =========="
    );

    return (
      "<!DOCTYPE html>\n" +
      doc.documentElement.outerHTML
    );
  };

  // ========================================
  // INJECT EXTRACTED MEDIA
  // ========================================

