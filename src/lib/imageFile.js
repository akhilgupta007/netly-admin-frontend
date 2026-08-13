"use client";

/**
 * Preparing a picked image file for upload through a callable.
 *
 * Images go to the server as base64 inside the callable payload rather than
 * being uploaded from the browser, because the Storage bucket's rules are not
 * held in these repos — see postDisputeMessage. That makes payload size the
 * constraint worth caring about, which is what the downscale below is for.
 */

/** Longest edge kept. A chat photo is looked at, not printed. */
const MAX_EDGE = 1600;

/** Matches MAX_IMAGE_BYTES in postDisputeMessage — reject before uploading. */
const MAX_BYTES = 8 * 1024 * 1024;

/** Anything under this is sent untouched; re-encoding would only lose detail. */
const REENCODE_ABOVE_BYTES = 600 * 1024;

/** What the apps can render, and what the callable accepts. */
const ACCEPTED = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"];

/**
 * Reads a File as a data: URL.
 *
 * @param {File} file - The picked file.
 * @return {Promise<string>} The data URL.
 */
function readAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("That file could not be read."));
    reader.readAsDataURL(file);
  });
}

/**
 * Prepares a picked image for sending.
 *
 * Large photos are scaled down and re-encoded as JPEG. GIFs never are —
 * a canvas would flatten an animation to its first frame, which is a silent
 * change to what the admin thinks they are sending.
 *
 * @param {File} file - The picked file.
 * @return {Promise<{dataUrl: string, contentType: string, name: string}>}
 *   The image, ready to hand to postDisputeMessage.
 * @throws {Error} When the file is not a supported image, or is too large.
 */
export async function readImageForUpload(file) {
  const type = String(file?.type || "").toLowerCase();

  if (!ACCEPTED.includes(type)) {
    throw new Error("Attach a JPEG, PNG, WebP or GIF image.");
  }
  if (file.size > MAX_BYTES) {
    throw new Error(
        `That image is ${Math.round(file.size / 1024 / 1024)}MB. The limit is ${MAX_BYTES / 1024 / 1024}MB.`,
    );
  }

  const original = await readAsDataUrl(file);

  if (type === "image/gif" || file.size <= REENCODE_ABOVE_BYTES) {
    return { dataUrl: original, contentType: type, name: file.name };
  }

  try {
    const img = new Image();
    img.src = original;
    await img.decode();

    const longest = Math.max(img.naturalWidth, img.naturalHeight);
    const scale = longest > MAX_EDGE ? MAX_EDGE / longest : 1;

    const canvas = document.createElement("canvas");
    canvas.width = Math.round(img.naturalWidth * scale);
    canvas.height = Math.round(img.naturalHeight * scale);
    canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);

    return {
      dataUrl: canvas.toDataURL("image/jpeg", 0.85),
      contentType: "image/jpeg",
      name: file.name,
    };
  } catch {
    // A decode failure is not worth blocking the send — the original is still
    // a valid image the callable will accept, just a heavier one.
    return { dataUrl: original, contentType: type, name: file.name };
  }
}
