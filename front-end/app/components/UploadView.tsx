import { AudioFile } from '../types/audio';
import UploadSection from './UploadSection';
import CollectionTable from './CollectionTable';

type Props = {
  localCollection: AudioFile[];
  onFilesSelected: (files: File[]) => void;
  onRemove: (index: number) => void;
  onSubmit: () => void;
  uploadError?: string | null;
  duplicateFilenames?: Set<string>;
  resetKey?: number;
};

export default function UploadView({ localCollection, onFilesSelected, onRemove, onSubmit, uploadError, duplicateFilenames, resetKey }: Props) {
  return (
    <>
      <UploadSection key={resetKey} onFilesSelected={onFilesSelected} />
      {localCollection.length > 0 && (
        <div className="selected-files-section">
          <h2 className="section-heading">Selected Files</h2>
          <CollectionTable collection={localCollection} onRemove={onRemove} duplicateFilenames={duplicateFilenames} readOnly />
          {uploadError && <p className="error-message">{uploadError}</p>}
          <button type="button" className="submit-button" onClick={onSubmit}>
            Submit
          </button>
        </div>
      )}
    </>
  );
}
