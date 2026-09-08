import type { ExtractedImage } from "../types/image";
import type { SlideSize } from "../types/pptx";

export function emuToPercent(
  image: ExtractedImage,
  slideSize: SlideSize
) {
  return {
    left: (image.x / slideSize.width) * 100,
    top: (image.y / slideSize.height) * 100,
    width: (image.width / slideSize.width) * 100,
    height: (image.height / slideSize.height) * 100,
  };
}
