'use client';

import './UploadSection.css';

type UploadSectionProps = {
  onFilesSelected: (files: File[]) => void;
};

export default function UploadSection({
  onFilesSelected,
}: UploadSectionProps) {
  return (
    <section className="upload-section">
      <h2>Upload Audio Files</h2>

      <label htmlFor="audio-upload" className="visually-hidden">
        Select audio files
      </label>
      <input
        id="audio-upload"
        type="file"
        multiple
        accept="audio/*"
        onChange={(e) =>
          e.target.files && onFilesSelected(Array.from(e.target.files))
        }
        className="upload-input"
      />
    </section>
  );
}
