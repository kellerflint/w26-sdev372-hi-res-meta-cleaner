import { metadata } from "../models/metadata.js";

export async function upsertMetadata(payload) {
  const items = Array.isArray(payload) ? payload : [payload];

  await Promise.all(
    items.map(async (track) => {
      if (!track || track.file_id === undefined) {
        throw new Error("file_id is required");
      }

      const updateFields = {
        file_id: track.file_id,
        title: track.title,
        artist: track.artist,
        album: track.album,
        year: track.year,
        comment: track.comment,
        track: track.track,
        genre: track.genre,
        type: track.type,
        size: track.size,
        album_artist: track.album_artist,
        composer: track.composer,
        discnumber: track.discnumber,
      };

      Object.keys(updateFields).forEach((key) => {
        const value = updateFields[key];
        if (value === undefined || value === "") {
          delete updateFields[key];
        }
      });

      return metadata.upsert(updateFields);
    })
  );
}
