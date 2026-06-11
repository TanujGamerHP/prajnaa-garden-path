/**
 * Compresses an image file on the client side using HTML5 Canvas.
 * Resizes the image to a maximum dimension of 1200px (width or height)
 * and compresses it to JPEG format with a quality parameter.
 * Non-image files (like PDFs) are returned unchanged.
 */
export async function compressImage(file: File, maxDimension = 1200, quality = 0.8): Promise<File> {
  // If the file is not an image (e.g. PDF documents in KYC), return it immediately
  if (!file.type.startsWith("image/")) {
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
