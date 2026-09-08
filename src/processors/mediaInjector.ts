import type { ExtractedMedia } from "../types/media";

  export const injectMediaIntoHtml = (
    html: string,
    extractedMedia: ExtractedMedia[]
  ): string => {
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
      "TOTAL SLIDES FOUND:",
      slides.length
    );

    extractedMedia.forEach(
      (media) => {
        if (
          media.slideNumber === -1
        ) {
          console.warn(
            `Could not find slide mapping for ${media.path}`
          );

          return;
        }

        const slide =
          slides[
            media.slideNumber - 1
          ];

        if (!slide) {
          console.warn(
            `Slide ${media.slideNumber} not found for ${media.path}`
          );

          return;
        }

        console.log(
          `========== PROCESSING ${media.type.toUpperCase()} ON SLIDE ${media.slideNumber} ==========`
        );

        const mediaPosters =
          Array.from(
            slide.querySelectorAll<HTMLElement>(
              ".media-poster[data-media-kind]"
            )
          );

        const mediaPoster =
          mediaPosters.find(
            (poster) =>
              poster.getAttribute("data-media-kind") ===
              media.type
          ) || null;

        let mediaButton: HTMLButtonElement | null = null;

        if (mediaPoster) {
          const previous =
            mediaPoster.previousElementSibling;

          if (
            previous instanceof HTMLButtonElement &&
            previous.matches(
              '.media-action-surface[data-action="media"]'
            )
          ) {
            mediaButton = previous;
          }
        }

        console.log(
          "MEDIA BUTTON FOUND:",
          !!mediaButton
        );

        console.log(
          "MEDIA POSTER FOUND:",
          !!mediaPoster
        );

        console.log(
          "MEDIA TYPE / BUTTON MAPPING:",
          {
            type: media.type,
            path: media.path,
            posterKind:
              mediaPoster?.getAttribute("data-media-kind"),
            buttonMediaId:
              mediaButton?.getAttribute("data-media-id"),
          }
        );

        // ========================================
        // AUDIO
        // ========================================

        if (
          media.type === "audio"
        ) {
          const mediaId =
            `ppt-audio-slide-${media.slideNumber}`;

          const existingAudio =
            doc.getElementById(
              mediaId
            );

          if (
            !existingAudio
          ) {
            const audio =
              doc.createElement(
                "audio"
              );

            audio.id =
              mediaId;

            audio.src =
              media.url;

            audio.preload =
              "auto";

            // Keep the audio element available for playback.
            // Hidden audio is fine for the final presentation,
            // but controls are useful while testing audio support.
            audio.controls = true;
            audio.style.display = "block";
            audio.style.position = "absolute";
            audio.style.left = "0";
            audio.style.bottom = "0";
            audio.style.width = "auto";
            audio.style.maxWidth = "100%";
            audio.style.height = "45px";
            audio.style.zIndex = "10";

            slide.appendChild(
              audio
            );

            console.log(
              `Audio element added: ${mediaId}`
            );
          }

          if (
            mediaButton
          ) {
            mediaButton.setAttribute(
              "data-media-id",
              mediaId
            );

            mediaButton.setAttribute(
              "data-media-type",
              "audio"
            );

            mediaButton.style.cursor =
              "pointer";

            console.log(
              `Audio button connected to ${mediaId}`
            );
          } else {
            console.warn(
              `Audio button not found on slide ${media.slideNumber}`
            );
          }
        }

        // ========================================
        // VIDEO
        // ========================================

        if (
          media.type === "video"
        ) {
          const mediaId =
            `ppt-video-slide-${media.slideNumber}`;

          const video =
            doc.createElement(
              "video"
            );

          video.id =
            mediaId;

          video.src =
            media.url;

          video.controls =
            true;

          video.preload =
            "metadata";

          video.style.objectFit =
            "contain";

          if (
            mediaPoster
          ) {
            video.className =
              mediaPoster.className;

            const posterStyle =
              mediaPoster.getAttribute(
                "style"
              );

            if (
              posterStyle
            ) {
              video.setAttribute(
                "style",
                posterStyle
              );
            }

            video.style.objectFit =
              "contain";

            mediaPoster.replaceWith(
              video
            );

            console.log(
              `Video replaced poster on slide ${media.slideNumber}`
            );
          } else {
            console.warn(
              `No poster found for video on slide ${media.slideNumber}`
            );

            video.style.position =
              "absolute";

            video.style.left =
              "0";

            video.style.top =
              "0";

            video.style.width =
              "100%";

            video.style.height =
              "100%";

            slide.appendChild(
              video
            );
          }

          if (
            mediaButton
          ) {
            mediaButton.setAttribute(
              "data-media-id",
              mediaId
            );

            mediaButton.setAttribute(
              "data-media-type",
              "video"
            );

            mediaButton.style.cursor =
              "pointer";

            console.log(
              `Video button connected to ${mediaId}`
            );
          }
        }
      }
    );

    // ========================================
    // MEDIA PLAYBACK SCRIPT
    // ========================================

    const script =
      doc.createElement(
        "script"
      );

    script.textContent = `
(function () {

  console.log(
    "========== PPT MEDIA PLAYER LOADED =========="
  );

  function handleMedia(
    button,
    event
  ) {

    if (!button) return;

    var mediaId =
      button.getAttribute(
        "data-media-id"
      );

    var mediaType =
      button.getAttribute(
        "data-media-type"
      );

    if (
      !mediaId ||
      !mediaType
    ) {
      return;
    }

    var media =
      document.getElementById(
        mediaId
      );

    if (!media) {
      console.error(
        "MEDIA ELEMENT NOT FOUND:",
        mediaId
      );

      return;
    }

    console.log(
      "MEDIA TRIGGERED:",
      mediaId,
      mediaType
    );

    event.preventDefault();
    event.stopImmediatePropagation();

    if (
      mediaType === "audio"
    ) {

      if (
        media.paused
      ) {

        if (
          media.ended
        ) {
          media.currentTime =
            0;
        }

        media.play()
          .then(
            function () {
              console.log(
                "AUDIO PLAYING SUCCESSFULLY"
              );

              button.setAttribute(
                "data-playing",
                "true"
              );
            }
          )
          .catch(
            function (
              error
            ) {
              console.error(
                "AUDIO PLAYBACK FAILED:",
                error
              );
            }
          );

      } else {

        media.pause();

        button.setAttribute(
          "data-playing",
          "false"
        );
      }

      return;
    }

    if (
      mediaType === "video"
    ) {

      if (
        media.paused
      ) {

        media.play()
          .then(
            function () {
              console.log(
                "VIDEO PLAYING SUCCESSFULLY"
              );
            }
          )
          .catch(
            function (
              error
            ) {
              console.error(
                "VIDEO PLAYBACK FAILED:",
                error
              );
            }
          );

      } else {
        media.pause();
      }

      return;
    }
  }

  function attachMediaHandlers() {

    var buttons =
      document.querySelectorAll(
        '.media-action-surface[data-media-id]'
      );

    console.log(
      "MEDIA BUTTONS FOUND:",
      buttons.length
    );

    buttons.forEach(
      function (
        button
      ) {

        button.style.cursor =
          "pointer";

        button.addEventListener(
          "pointerdown",
          function (
            event
          ) {

            console.log(
              "MEDIA POINTERDOWN:",
              button.getAttribute(
                "data-media-id"
              )
            );

            handleMedia(
              button,
              event
            );

          },
          true
        );

        button.addEventListener(
          "click",
          function (
            event
          ) {

            console.log(
              "MEDIA CLICK:",
              button.getAttribute(
                "data-media-id"
              )
            );

            event.preventDefault();
            event.stopImmediatePropagation();

          },
          true
        );

      }
    );
  }

  if (
    document.readyState ===
    "loading"
  ) {

    document.addEventListener(
      "DOMContentLoaded",
      attachMediaHandlers
    );

  } else {
    attachMediaHandlers();
  }

  console.log(
    "========== MEDIA PLAYER READY =========="
  );

})();
`;

    doc.body.appendChild(
      script
    );

    return (
      "<!DOCTYPE html>\n" +
      doc.documentElement.outerHTML
    );
  };

  // ========================================
// MAKE PPT PREVIEW RESPONSIVE
// ========================================

const makePreviewResponsive = (
  html: string
): string => {

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

  style.textContent = `
    html,
    body {
      width: 100%;
      min-height: 100%;
      overflow-x: hidden;
    }

    .pptx-container {
      width: 100%;
      box-sizing: border-box;
      align-items: center;
    }

    .slide-shell {
      transform-origin: top left;
    }

    .slide {
      transform-origin: top left;
    }
  `;

  doc.head.appendChild(
    style
  );

  const script =
    doc.createElement(
      "script"
    );

  script.textContent = `
(function () {

  console.log(
    "========== PPT RESPONSIVE SCALING LOADED =========="
  );

  function scaleSlides() {

    var shells =
      document.querySelectorAll(
        ".slide-shell"
      );

    console.log(
      "SLIDES TO SCALE:",
      shells.length
    );

    shells.forEach(
      function (shell) {

        var slide =
          shell.querySelector(
            ".slide"
          );

        if (!slide) return;

        var originalWidth =
          parseFloat(
            getComputedStyle(
              slide
            ).width
          );

        var originalHeight =
          parseFloat(
            getComputedStyle(
              slide
            ).height
          );

        if (
          !originalWidth ||
          !originalHeight
        ) {
          return;
        }

        var availableWidth =
          window.innerWidth - 40;

        var scale =
          Math.min(
            1,
            availableWidth /
              originalWidth
          );

        if (
          scale <= 0
        ) {
          scale = 1;
        }

        slide.style.transform =
          "scale(" +
          scale +
          ")";

        slide.style.transformOrigin =
          "top left";

        shell.style.width =
          (
            originalWidth *
            scale
          ) +
          "px";

        shell.style.height =
          (
            originalHeight *
            scale
          ) +
          "px";

        console.log(
          "SLIDE SCALE:",
          scale,
          "DISPLAY:",
          originalWidth * scale,
          "x",
          originalHeight * scale
        );

      }
    );
  }

  if (
    document.readyState ===
    "loading"
  ) {

    document.addEventListener(
      "DOMContentLoaded",
      scaleSlides
    );

  } else {

    scaleSlides();

  }

  window.addEventListener(
    "resize",
    scaleSlides
  );

})();
`;

  doc.body.appendChild(
    script
  );

  return (
    "<!DOCTYPE html>\n" +
    doc.documentElement.outerHTML
  );
};

  // ========================================
  // BLOB URL → DATA URL
  // ========================================

