import * as musicMetadata from "music-metadata";
import path from "path";
import { upsertMetadata } from "../repos/repos.js";

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
        // If metadata extraction fails, still create a record with file_id
        // This ensures the relationship exists even if no metadata was found
        console.warn(
          `Could not extract metadata from ${file.filename}:`,
          parseError.message
        );

        await upsertMetadata({ file_id: file.file_id });

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
