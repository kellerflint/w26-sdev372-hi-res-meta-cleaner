'use client';

import { AudioFile } from '../types/audio';
import './CollectionTable.css';

type Props = {
  collection: AudioFile[];
  onRemove?: (index: number) => void;
};

export default function CollectionTable({ collection, onRemove }: Props) {
  if (collection.length === 0) return null;

  const headers = ['File', 'Artist', 'Title', 'Album', 'Year', 'Type', 'Size'];
  if (onRemove) headers.push('');

  return (
    <section>
      <table className="collection-table">
        <thead>
          <tr>
            {headers.map((h, i) => (
              <th key={i}>{h}</th>
            ))}
          </tr>
        </thead>

        <tbody>
          {collection.map((file, index) => (
            <tr key={file.id ?? `${file.filename}-${index}`}>
              <td>{file.filename ?? '-'}</td>
              <td>{file.artist ?? '-'}</td>
              <td>{file.title ?? '-'}</td>
              <td>{file.album ?? '-'}</td>
              <td>{file.year ?? '-'}</td>
              <td>{file.type ?? '-'}</td>
              <td>{file.size ?? '-'}</td>
              {onRemove && (
                <td>
                  <button
                    type="button"
                    className="remove-button"
                    onClick={() => onRemove(index)}
                  >
                    Remove
                  </button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
