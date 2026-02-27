export interface PdfConversionResult {
  imageUrl: string;
  file: File | null;
  error?: string;
}

let pdfjsLib: any = null;
let loadPromise: Promise<any> | null = null;

// ✅ Import worker correctly for Vite
import pdfWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url";

async function loadPdfJs(): Promise<any> {
  if (pdfjsLib) return pdfjsLib;
  if (loadPromise) return loadPromise;

  loadPromise = import("pdfjs-dist/build/pdf.mjs").then((lib) => {
    lib.GlobalWorkerOptions.workerSrc = pdfWorker;
    pdfjsLib = lib;
    return lib;
  });

  return loadPromise;
}

export async function convertPdfToImage(
  file: File
): Promise<PdfConversionResult> {
  try {
    const lib = await loadPdfJs();

    const arrayBuffer = await file.arrayBuffer();

    const pdf = await lib.getDocument({
      data: arrayBuffer,
    }).promise;

    // ✅ first page
    const page = await pdf.getPage(1);

    const viewport = page.getViewport({ scale: 2 });

    if (!viewport.width || !viewport.height) {
      throw new Error("Invalid PDF viewport");
    }

    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");

    if (!context) {
      return {
        imageUrl: "",
        file: null,
        error: "Canvas context unavailable",
      };
    }

    canvas.width = viewport.width;
    canvas.height = viewport.height;

    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = "high";

    // ✅ render page
    await page.render({
      canvasContext: context,
      viewport,
    }).promise;

    // ✅ convert canvas → blob
    return new Promise((resolve) => {
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            resolve({
              imageUrl: "",
              file: null,
              error: "Failed to create image blob",
            });
            return;
          }

          const originalName = file.name.replace(/\.pdf$/i, "");

          const imageFile = new File(
            [blob],
            `${originalName}.png`,
            { type: "image/png" }
          );

          resolve({
            imageUrl: URL.createObjectURL(blob),
            file: imageFile,
          });
        },
        "image/png",
        1.0
      );
    });
  } catch (err) {
    console.error("PDF conversion error:", err);

    return {
      imageUrl: "",
      file: null,
      error: `Failed to convert PDF: ${String(err)}`,
    };
  }
}