import { AudioFile } from '../types/audio';
import CollectionTable from './CollectionTable';
import Loading from './Loading';
import styles from '../page.module.css';

type Props = {
  collection: AudioFile[];
  isLoadingCollection: boolean;
  selectedForDownload: Set<number>;
  onSelectionChange: (selected: Set<number>) => void;
  onDownload: () => void;
  isDownloading: boolean;
};

export default function CollectionView({
  collection,
  isLoadingCollection,
  selectedForDownload,
  onSelectionChange,
  onDownload,
  isDownloading,
}: Props) {
  return (
    <div>
      <h2 className="section-heading">Audio Collection Editor</h2>
      {isLoadingCollection ? (
        <Loading message="Loading collection" />
      ) : collection.length === 0 ? (
        <p>No files in your collection.</p>
      ) : (
        <>
          <CollectionTable
            collection={collection}
            showDownload
            selectedFiles={selectedForDownload}
            onSelectionChange={onSelectionChange}
          />
          <button
            type="button"
            className={`submit-button ${styles.downloadButton}`}
            onClick={onDownload}
            disabled={selectedForDownload.size === 0 || isDownloading}
          >
            {isDownloading ? 'Downloading...' : `Download Selected (${selectedForDownload.size})`}
          </button>
        </>
      )}
    </div>
  );
}
