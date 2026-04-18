import { CheerioAPI } from "cheerio";
import { CrawlContext, PageIssue, ImageInfo } from "../types";

export function analyzeImages(
  html: string,
  $: CheerioAPI,
  url: string,
  context: CrawlContext
): PageIssue[] {
  const issues: PageIssue[] = [];

  const images: ImageInfo[] = [];
  const imagesWithoutAlt: ImageInfo[] = [];
  let totalImages = 0;

  $("img").each((_, el) => {
    const src = $(el).attr("src") || "";
    const alt = $(el).attr("alt") || "";
    const width = $(el).attr("width") ? parseInt($(el).attr("width")!) : undefined;
    const height = $(el).attr("height") ? parseInt($(el).attr("height")!) : undefined;

    totalImages++;

    const image: ImageInfo = {
      src,
      alt,
      hasAlt: alt.length > 0,
      width,
      height,
    };

    images.push(image);

    if (!alt) {
      imagesWithoutAlt.push(image);
    }
  });

  // Check for images without alt text
  if (imagesWithoutAlt.length > 0) {
    issues.push({
      type: "images-without-alt",
      severity: "high",
      message: `${imagesWithoutAlt.length} images are missing alt text`,
      details: `Total images: ${totalImages}, Missing alt: ${imagesWithoutAlt.length}`,
    });
  }

  // Check for empty alt text
  $("img[alt]").each((_, el) => {
    const alt = $(el).attr("alt") || "";
    if (alt === "") {
      const src = $(el).attr("src") || "";
      issues.push({
        type: "empty-alt-text",
        severity: "medium",
        message: "Image has empty alt attribute",
        details: `Image src: ${src.substring(0, 100)}...`,
      });
    }
  });

  // Check for large images without dimensions
  $("img").each((_, el) => {
    const width = $(el).attr("width");
    const height = $(el).attr("height");

    if (!width || !height) {
      const src = $(el).attr("src") || "";
      // Only flag if it has alt text (decorative images often don't need dimensions)
      if ($(el).attr("alt")) {
        issues.push({
          type: "missing-image-dimensions",
          severity: "low",
          message: "Image is missing width and/or height attributes",
          details: `Image: ${src.substring(0, 100)}...`,
        });
      }
    }
  });

  // Check for images with relative src
  $("img").each((_, el) => {
    const src = $(el).attr("src") || "";
    if (src && !src.startsWith("http") && !src.startsWith("/") && !src.startsWith("data:")) {
      issues.push({
        type: "relative-image-path",
        severity: "low",
        message: "Image uses relative path (may cause issues)",
        details: `Path: ${src}`,
      });
    }
  });

  // Check for lazy loading
  const imagesWithLazy = $("img[loading='lazy']").length;
  const imagesWithoutLazy = totalImages - imagesWithLazy;
  if (totalImages > 5 && imagesWithoutLazy > totalImages * 0.5) {
    issues.push({
      type: "no-lazy-loading",
      severity: "low",
      message: "Many images are missing lazy loading attribute",
      details: `${imagesWithoutLazy} of ${totalImages} images don't use loading="lazy"`,
    });
  }

  return issues;
}

export function extractImages($: CheerioAPI): ImageInfo[] {
  const images: ImageInfo[] = [];

  $("img").each((_, el) => {
    images.push({
      src: $(el).attr("src") || "",
      alt: $(el).attr("alt") || "",
      hasAlt: !!$(el).attr("alt"),
      width: $(el).attr("width") ? parseInt($(el).attr("width")!) : undefined,
      height: $(el).attr("height") ? parseInt($(el).attr("height")!) : undefined,
    });
  });

  return images;
}
