/**
 * Compresses an image file on the client side using HTML5 Canvas.
 * Resizes the image to a maximum dimension of 1200px (width or height)
 * and compresses it to JPEG format with a quality parameter.
 * Non-image files (like PDFs) are returned unchanged.
 */
export async function compressImage(file: File, maxDimension = 600, quality = 0.5): Promise<File> {
  // If the file is not an image (e.g. PDF documents in KYC), return it immediately
  const extension = file.name.split('.').pop()?.toLowerCase();
  const isImage = file.type.startsWith("image/") || ["jpg", "jpeg", "png", "webp", "gif", "bmp"].includes(extension || "");
  if (!isImage) {
    return file;
  }

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Calculate new dimensions preserving aspect ratio
        if (width > height) {
          if (width > maxDimension) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          }
        } else {
          if (height > maxDimension) {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(file);
          return;
        }

        // Draw image on canvas (performs resizing)
        ctx.drawImage(img, 0, 0, width, height);

        // Convert canvas content to blob in JPEG format with specified quality
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              resolve(file);
              return;
            }

            // Create a new File from the blob
            const nameWithoutExt = file.name.substring(0, file.name.lastIndexOf(".")) || file.name;
            const compressedFile = new File([blob], `${nameWithoutExt}.jpg`, {
              type: "image/jpeg",
              lastModified: Date.now(),
            });
            resolve(compressedFile);
          },
          "image/jpeg",
          quality,
        );
      };

      img.onerror = () => resolve(file);
      img.src = event.target?.result as string;
    };
    reader.onerror = () => resolve(file);
    reader.readAsDataURL(file);
  });
}

import { fileToBase64 } from "./file-to-base64";

export async function base64ToFile(base64DataUrl: string, filename = "image.jpg"): Promise<File> {
  let dataUrl = base64DataUrl;
  if (!dataUrl.includes(',')) {
    dataUrl = "data:image/jpeg;base64," + dataUrl;
  }
  const arr = dataUrl.split(',');
  const mime = arr[0].match(/:(.*?);/)?.[1] || "image/jpeg";
  const bstr = atob(arr[1].trim());
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new File([u8arr], filename, { type: mime });
}

export async function optimizeBase64Image(base64Str: string): Promise<string> {
  if (!base64Str || base64Str.length < 50000) {
    return base64Str;
  }
  // Check if it's a valid base64 pattern (with or without data prefix)
  const prefixIndex = base64Str.indexOf(',');
  const rawBase64 = prefixIndex !== -1 ? base64Str.substring(prefixIndex + 1) : base64Str;
  const cleanBase64 = rawBase64.replace(/\s/g, '');
  const isBase64 = /^[A-Za-z0-9+/=]+$/.test(cleanBase64.slice(0, 100));
  
  if (!isBase64) {
    return base64Str;
  }
  try {
    const file = await base64ToFile(base64Str);
    const compressed = await compressImage(file, 600, 0.5);
    return await fileToBase64(compressed);
  } catch (err) {
    console.error("Error compressing base64 image:", err);
    return base64Str;
  }
}
