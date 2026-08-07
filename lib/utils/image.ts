import { deleteUploadedFile } from "./file";

export async function replaceUploadedImage(
  previousImage: string | null,
  newImage: string | null
) {
  if (
    previousImage &&
    newImage &&
    previousImage !== newImage
  ) {
    await deleteUploadedFile(previousImage);
  }
}

export async function removeUploadedImage(
  image: string | null
) {
  if (image) {
    await deleteUploadedFile(image);
  }
}