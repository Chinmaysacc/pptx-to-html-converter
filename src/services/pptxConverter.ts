import { pptxToHtml } from "@briank-dev/pptx-to-html";

import { extractMediaFromPptx } from "./mediaExtractor";
import { extractImagesFromPptx } from "./imageExtractor";
import { extractFontsFromPptx } from "./fontExtractor";
import { extractEmbeddedFonts } from "./embeddedFontExtractor";
import { extractSlideSizeFromPptx } from "./slideSizeExtractor";

import { injectImagesIntoHtml } from "../processors/imageInjector";
import {
  injectEmbeddedFontsIntoHtml,
  applyExtractedFonts,
} from "../processors/fontInjector";
import { injectMediaIntoHtml } from "../processors/mediaInjector";
import { makePreviewResponsive } from "../processors/responsiveProcessor";
import { convertBlobUrlsToDataUrls } from "../processors/standaloneHtmlProcessor";

export interface ConversionResult {
  previewHtml: string;
  standaloneHtml: string;
}

export async function convertPptxToHtml(
  selectedFile: File
): Promise<ConversionResult> {
  try {
    console.log("[PPTX] STARTING CONVERSION PIPELINE");

    console.log("========== STARTING SLIDE SIZE EXTRACTION ==========");
    const slideSize = await extractSlideSizeFromPptx(selectedFile);
    console.log("========== PPT SLIDE SIZE EXTRACTED ==========");
    console.log(slideSize);

    console.log("========== STARTING MEDIA EXTRACTION ==========");
    const extractedMedia = await extractMediaFromPptx(selectedFile);
    console.log("========== EXTRACTED PPT MEDIA ==========");
    console.table(extractedMedia);

    console.log("========== STARTING IMAGE EXTRACTION ==========");
    const extractedImages = await extractImagesFromPptx(selectedFile);
    console.log("========== EXTRACTED PPT IMAGES ==========");
    console.table(
      extractedImages.map((image) => ({
        slideNumber: image.slideNumber,
        path: image.path,
        x: image.x,
        y: image.y,
        width: image.width,
        height: image.height,
      }))
    );

    console.log("========== STARTING FONT EXTRACTION ==========");
    const extractedFonts = await extractFontsFromPptx(selectedFile);
    console.log("========== EXTRACTED PPT FONTS ==========");
    console.table(
      extractedFonts.map((font) => ({
        slideNumber: font.slideNumber,
        text: font.text,
        fontFamily: font.fontFamily,
      }))
    );
    console.log("========== FONT EXTRACTION COMPLETE ==========");

    console.log("========== STARTING EMBEDDED FONT EXTRACTION ==========");
    const embeddedFonts = await extractEmbeddedFonts(selectedFile);
    console.log("========== EMBEDDED FONTS EXTRACTED ==========");
    console.table(
      embeddedFonts.map((font) => ({
        fontFamily: font.fontFamily,
        variant: font.variant,
        fontWeight: font.fontWeight,
        fontStyle: font.fontStyle,
        sourcePath: font.sourcePath,
      }))
    );

    console.log("========== STARTING PPTX TO HTML ==========");

    // The package is a Rust/WASM module. In Vite dev mode, its generated
    // `new URL("pptx2html_wasm_bg.wasm", import.meta.url)` loader can resolve
    // to an optimized dependency URL that does not contain the WASM asset.
    // Pass an explicit public WASM URL so both dev and production use the
    // real binary instead of falling back to index.html.
    const wasmUrl = "/pptx2html_wasm_bg.wasm";
    console.log("[PPTX] WASM URL:", wasmUrl);

    const html = await pptxToHtml(selectedFile, wasmUrl);

    const fontParser = new DOMParser();
    const fontDoc = fontParser.parseFromString(html, "text/html");
    const textRuns = fontDoc.querySelectorAll(".run");

    console.log("========== TEXT / FONT DEBUG ==========");
    console.log("TOTAL TEXT RUNS:", textRuns.length);

    textRuns.forEach((run, index) => {
      const text = run.textContent?.trim();
      if (!text) return;

      const parentShape = run.closest(".shape");

      console.log(`TEXT ${index + 1}:`, {
        text,
        runStyle: run.getAttribute("style"),
        parentStyle: parentShape?.getAttribute("style"),
        parentHTML: parentShape?.outerHTML.slice(0, 500),
      });
    });

    console.log("========== END TEXT / FONT DEBUG ==========");
    console.log("========== PPTX TO HTML COMPLETE ==========");

    const htmlWithImages = injectImagesIntoHtml(
      html,
      extractedImages,
      slideSize
    );

    const htmlWithEmbeddedFonts = injectEmbeddedFontsIntoHtml(
      htmlWithImages,
      embeddedFonts
    );

    const htmlWithFonts = applyExtractedFonts(
      htmlWithEmbeddedFonts,
      extractedFonts
    );

    const mediaInjectedHtml = injectMediaIntoHtml(
      htmlWithFonts,
      extractedMedia
    );

    const modifiedHtml = makePreviewResponsive(
      mediaInjectedHtml
    );

    console.log("========== ALL INJECTION COMPLETE ==========");

    const debugParser = new DOMParser();
    const debugDoc = debugParser.parseFromString(
      modifiedHtml,
      "text/html"
    );

    console.log("========== FINAL PPT DEBUG ==========");
    console.log("AUDIO TAGS:", debugDoc.querySelectorAll("audio").length);
    console.log("VIDEO TAGS:", debugDoc.querySelectorAll("video").length);
    console.log(
      "RECOVERED IMAGES:",
      debugDoc.querySelectorAll(".ppt-recovered-image").length
    );
    console.log(
      "EMBEDDED @FONT-FACE RULES:",
      debugDoc.querySelectorAll(
        'style[data-ppt-embedded-fonts]'
      ).length
    );
    console.log(
      "CONNECTED MEDIA BUTTONS:",
      debugDoc.querySelectorAll(
        '.media-action-surface[data-media-id]'
      ).length
    );
    console.log("========== END FINAL DEBUG ==========");

    const standaloneHtml = await convertBlobUrlsToDataUrls(
      modifiedHtml
    );

    console.log("========== STANDALONE HTML READY ==========");

    return {
      previewHtml: modifiedHtml,
      standaloneHtml,
    };
  } catch (error) {
    console.error(error);
    throw error;
  }
}
