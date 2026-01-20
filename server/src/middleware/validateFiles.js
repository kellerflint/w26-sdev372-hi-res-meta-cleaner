const ALLOWED_AUDIO_TYPES = [
  'audio/mpeg',
  'audio/mp3',
  'audio/wav',
  'audio/wave',
  'audio/x-wav',
  'audio/flac',
  'audio/x-flac',
  'audio/ogg',
  'audio/aac',
  'audio/mp4',
  'audio/x-m4a',
  'audio/aiff',
  'audio/x-aiff',
];

const ALLOWED_EXTENSIONS = ['.mp3', '.wav', '.flac', '.ogg', '.aac', '.m4a', '.aiff'];

function isAudioFile(file) {
  const mimeMatch = ALLOWED_AUDIO_TYPES.includes(file.mimetype);
  const extMatch = ALLOWED_EXTENSIONS.some(ext =>
    file.originalname.toLowerCase().endsWith(ext)
  );
  return mimeMatch || extMatch;
}

// Middleware to validate uploaded files
export const validateFiles = (req, res, next) => {
  const files = req.files;

  if (!files || files.length === 0) {
    return res.status(400).json({ error: "No files uploaded" });
  }

  const invalidFiles = files.filter(file => !isAudioFile(file));
  if (invalidFiles.length > 0) {
    const invalidNames = invalidFiles.map(f => f.originalname).join(', ');
    return res.status(400).json({
      error: `Invalid file type(s): ${invalidNames}. Only audio files are allowed.`
    });
  }

  next();
};
