import * as musicMetadata from "music-metadata";
import path from "path";
import fs from "fs";
import { upsertMetadata } from "../repos/repos.js";

function formatFileSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

/**
 * Middleware to extract metadata from uploaded audio files and store in database.
 * This middleware should run after files are uploaded and AudioFile records are created.
 * It expects req.uploadedFiles to contain an array of { file_id, filename } objects.
 */
export const extractMetadata = async (req, res, next) => {
  try {
    const uploadedFiles = req.uploadedFiles;

    if (!uploadedFiles || uploadedFiles.length === 0) {
      return next();
    }

    const metadataPromises = uploadedFiles.map(async (file) => {
      const filePath = path.join("uploads", file.filename);

      try {
        console.log(`Extracting metadata from: ${filePath}`);
        const parsed = await musicMetadata.parseFile(filePath);
        const common = parsed.common;
        console.log(`Extracted metadata:`, JSON.stringify(common, null, 2));

        // Get file stats for size
        const stats = fs.statSync(filePath);
        const fileSize = formatFileSize(stats.size);

        // Get file type from extension
        const fileType = path.extname(file.filename).slice(1).toUpperCase() || null;

        // Extract comment - can be array of strings or objects with text property
        let commentText = null;
        if (common.comment && common.comment.length > 0) {
          const firstComment = common.comment[0];
          commentText = typeof firstComment === "string"
            ? firstComment
            : firstComment?.text || null;
        }

        // Map extracted metadata to our database schema
        const metadataRecord = {
          file_id: file.file_id,
          title: common.title || null,
          artist: common.artist || null,
          album: common.album || null,
          year: common.year || null,
          comment: commentText,
          track: common.track?.no || null,
          genre: common.genre?.[0] || null,
          type: fileType,
          size: fileSize,
          album_artist: common.albumartist || null,
          composer: common.composer?.[0] || null,
          discnumber: common.disk?.no || null,
        };

        await upsertMetadata(metadataRecord);

        return {
          file_id: file.file_id,
          metadata: metadataRecord,
          success: true,
        };
      } catch (parseError) {
        // If metadata extraction fails, still create a record with file_id, type, and size
        // This ensures the relationship exists even if no metadata was found
        console.warn(
          `Could not extract metadata from ${file.filename}:`,
          parseError.message
        );

        // Still try to get type and size even if metadata parsing failed
        let fileSize = null;
        try {
          const stats = fs.statSync(filePath);
          fileSize = formatFileSize(stats.size);
        } catch {}
        const fileType = path.extname(file.filename).slice(1).toUpperCase() || null;

        await upsertMetadata({ file_id: file.file_id, type: fileType, size: fileSize });

        return {
          file_id: file.file_id,
          metadata: null,
          success: false,
          error: parseError.message,
        };
      }
    });

    req.extractedMetadata = await Promise.all(metadataPromises);
    next();
  } catch (err) {
    next(err);
  }
};
