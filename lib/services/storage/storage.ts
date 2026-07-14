export interface StorageProvider {
  saveImage(
    file: File,
    folder: string
  ): Promise<string>;

  deleteImage(
    path: string
  ): Promise<void>;
}