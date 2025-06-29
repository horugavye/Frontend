/**
 * Format file size in bytes to human readable format
 * @param bytes File size in bytes
 * @returns Formatted file size string (e.g., "1.5 MB")
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

/**
 * Get file extension from filename
 * @param filename Name of the file
 * @returns File extension in lowercase
 */
export const getFileExtension = (filename: string): string => {
  return filename.slice((filename.lastIndexOf('.') - 1 >>> 0) + 2).toLowerCase();
};

/**
 * Check if file is an image based on its type
 * @param fileType MIME type of the file
 * @returns boolean indicating if file is an image
 */
export const isImageFile = (fileType: string): boolean => {
  return fileType.startsWith('image/');
};

/**
 * Check if file is a video based on its type
 * @param fileType MIME type of the file
 * @returns boolean indicating if file is a video
 */
export const isVideoFile = (fileType: string): boolean => {
  return fileType.startsWith('video/');
};

/**
 * Check if file is an audio based on its type
 * @param fileType MIME type of the file
 * @returns boolean indicating if file is an audio
 */
export const isAudioFile = (fileType: string): boolean => {
  return fileType.startsWith('audio/');
};

/**
 * Check if file is a document based on its type
 * @param fileType MIME type of the file
 * @returns boolean indicating if file is a document
 */
export const isDocumentFile = (fileType: string): boolean => {
  return fileType.startsWith('application/');
};

/**
 * Get file category based on its type
 * @param fileType MIME type of the file
 * @returns Category of the file ('image', 'video', 'audio', 'document', or 'other')
 */
export const getFileCategory = (fileType: string): 'image' | 'video' | 'audio' | 'document' | 'other' => {
  if (isImageFile(fileType)) return 'image';
  if (isVideoFile(fileType)) return 'video';
  if (isAudioFile(fileType)) return 'audio';
  if (isDocumentFile(fileType)) return 'document';
  return 'other';
}; 