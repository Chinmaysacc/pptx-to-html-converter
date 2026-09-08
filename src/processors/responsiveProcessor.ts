import { parseHtml, serializeHtml } from "../utils/htmlParser";

export const makePreviewResponsive = (
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
