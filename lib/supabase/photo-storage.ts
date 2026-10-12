import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";

export interface CompressedImageResult {
  blob: Blob;
  dataUrl: string;
  width: number;
  height: number;
  originalBytes: number;
  compressedBytes: number;
}

export interface UploadedPhotoResult {
  publicUrl: string;
  storagePath: string;
  originalBytes: number;
  compressedBytes: number;
}

const BUCKET_NAME = "profile-photos";

/**
 * Client-Side WebP Image Compressor (~80KB - 120KB target)
 * Resizes image proportionally to maxDimension (default 1080px)
 * and encodes as WebP (with adaptive quality step-down if needed).
 */
export async function compressImageToWebP(
  file: File,
  options?: {
    maxDimension?: number;
    quality?: number;
    maxTargetBytes?: number;
  }
): Promise<CompressedImageResult> {
  const maxDimension = options?.maxDimension ?? 1080;
  const initialQuality = options?.quality ?? 0.8;
  const maxTargetBytes = options?.maxTargetBytes ?? 135 * 1024; // ~135 KB ceiling

  const img = await loadImageFromFile(file);

  let targetWidth = img.naturalWidth || img.width;
  let targetHeight = img.naturalHeight || img.height;

  if (targetWidth > maxDimension || targetHeight > maxDimension) {
    if (targetWidth >= targetHeight) {
      targetHeight = Math.round((targetHeight * maxDimension) / targetWidth);
      targetWidth = maxDimension;
    } else {
      targetWidth = Math.round((targetWidth * maxDimension) / targetHeight);
      targetHeight = maxDimension;
    }
  }

  const canvas = document.createElement("canvas");
  canvas.width = targetWidth;
  canvas.height = targetHeight;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Canvas 2D context tidak tersedia di browser ini.");
  }

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

  // First pass encoding at initialQuality (0.80)
  let quality = initialQuality;
  let blob = await canvasToBlob(canvas, "image/webp", quality);

  // Adaptive quality step-down if still above target (~135 KB)
  if (blob.size > maxTargetBytes && quality > 0.62) {
    quality = 0.68;
    blob = await canvasToBlob(canvas, "image/webp", quality);
  }
  if (blob.size > maxTargetBytes && quality > 0.52) {
    quality = 0.56;
    blob = await canvasToBlob(canvas, "image/webp", quality);
  }

  const dataUrl = await blobToDataUrl(blob);

  return {
    blob,
    dataUrl,
    width: targetWidth,
    height: targetHeight,
    originalBytes: file.size,
    compressedBytes: blob.size,
  };
}

function loadImageFromFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Gagal membaca file gambar."));
    };
    img.src = objectUrl;
  });
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  mimeType: string,
  quality: number
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error("Gagal mengonversi gambar ke WebP."));
        }
      },
      mimeType,
      quality
    );
  });
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
      } else {
        reject(new Error("Gagal membaca Data URL hasil kompresi."));
      }
    };
    reader.onerror = () => reject(new Error("Gagal membaca hasil kompresi."));
    reader.readAsDataURL(blob);
  });
}

/**
 * Extracts internal storage object path `{user_id}/{filename}` from a
 * Supabase public URL or storage_path string.
 */
export function extractStorageObjectPath(urlOrPath: string): string | null {
  if (!urlOrPath || urlOrPath.startsWith("data:")) return null;

  // Match Supabase public storage URL pattern:
  // https://<project>.supabase.co/storage/v1/object/public/profile-photos/<user_id>/<file>
  const marker = `/storage/v1/object/public/${BUCKET_NAME}/`;
  const markerIdx = urlOrPath.indexOf(marker);
  if (markerIdx !== -1) {
    return decodeURIComponent(urlOrPath.slice(markerIdx + marker.length));
  }

  // Or if prefixed with `profile-photos/<user_id>/<file>`
  if (urlOrPath.startsWith(`${BUCKET_NAME}/`)) {
    return urlOrPath.slice(BUCKET_NAME.length + 1);
  }

  return null;
}

/**
 * Compresses photo to WebP (~100 KB) and uploads to Supabase Storage if configured,
 * falling back seamlessly to compressed WebP Data URL in local mode.
 */
export async function uploadCompressedProfilePhoto(
  file: File,
  fallbackUserId = "user-me"
): Promise<UploadedPhotoResult> {
  const compressed = await compressImageToWebP(file, {
    maxDimension: 1080,
    quality: 0.8,
  });

  const uniqueSuffix = `${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 8)}`;

  if (isSupabaseConfigured()) {
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const objectPath = `${user.id}/photo-${uniqueSuffix}.webp`;
        const { error: uploadError } = await supabase.storage
          .from(BUCKET_NAME)
          .upload(objectPath, compressed.blob, {
            contentType: "image/webp",
            cacheControl: "31536000",
            upsert: false,
          });

        if (!uploadError) {
          const { data: publicUrlData } = supabase.storage
            .from(BUCKET_NAME)
            .getPublicUrl(objectPath);

          return {
            publicUrl: publicUrlData.publicUrl,
            storagePath: `${BUCKET_NAME}/${objectPath}`,
            originalBytes: compressed.originalBytes,
            compressedBytes: compressed.compressedBytes,
          };
        }
      }
    } catch {
      // Fallback to compressed WebP Data URL if offline or unauthenticated
    }
  }

  return {
    publicUrl: compressed.dataUrl,
    storagePath: `${BUCKET_NAME}/${fallbackUserId}/photo-${uniqueSuffix}.webp`,
    originalBytes: compressed.originalBytes,
    compressedBytes: compressed.compressedBytes,
  };
}

/**
 * Immediately deletes a single photo from Supabase Storage bucket if it resides there.
 */
export async function deleteStoragePhotoIfPresent(
  urlOrPath: string
): Promise<void> {
  if (!isSupabaseConfigured()) return;
  const objectPath = extractStorageObjectPath(urlOrPath);
  if (!objectPath) return;

  try {
    const supabase = createClient();
    await supabase.storage.from(BUCKET_NAME).remove([objectPath]);
  } catch {
    // Non-blocking storage cleanup
  }
}

/**
 * Compares previous photo URLs with updated photo URLs and permanently deletes
 * any removed/replaced photos from Supabase Storage (Zero Orphan Files).
 */
export async function cleanupOrphanProfilePhotos(
  previousUrls: string[],
  nextUrls: string[]
): Promise<number> {
  const nextSet = new Set(nextUrls);
  const removedUrls = previousUrls.filter((url) => !nextSet.has(url));

  if (removedUrls.length === 0 || !isSupabaseConfigured()) {
    return 0;
  }

  const objectPaths = removedUrls
    .map(extractStorageObjectPath)
    .filter((p): p is string => Boolean(p));

  if (objectPaths.length === 0) return 0;

  try {
    const supabase = createClient();
    await supabase.storage.from(BUCKET_NAME).remove(objectPaths);
    return objectPaths.length;
  } catch {
    return 0;
  }
}

export function formatKilobytes(bytes: number): string {
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}
