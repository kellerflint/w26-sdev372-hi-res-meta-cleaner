'use client';

import { useState } from 'react';
import { AudioFile } from '../types/audio';
import './CollectionTable.css';

type Props = {
  collection: AudioFile[];
  onRemove?: (index: number) => void;
  readOnly?: boolean;
  showDownload?: boolean;
  selectedFiles?: Set<string>;
  onSelectionChange?: (filenames: Set<string>) => void;
};

export default function CollectionTable({
  collection,
  onRemove,
  readOnly = false,
  showDownload = false,
  selectedFiles = new Set(),
  onSelectionChange,
}: Props) {
  // Local state for editable collection
  const [files, setFiles] = useState<AudioFile[]>(collection);

  if (files.length === 0) return null;

  const headers = ['File', 'Artist', 'Title', 'Album', 'Year', 'Type', 'Size'];
  if (showDownload) headers.push('Download');
  if (onRemove) headers.push('');

  const handleCheckboxChange = (filename: string, checked: boolean) => {
    if (!onSelectionChange) return;
    const newSelection = new Set(selectedFiles);
    if (checked) {
      newSelection.add(filename);
    } else {
      newSelection.delete(filename);
    }
    onSelectionChange(newSelection);
  };

  const handleSelectAll = (checked: boolean) => {
    if (!onSelectionChange) return;
    if (checked) {
      onSelectionChange(new Set(files.map(f => f.filename)));
    } else {
      onSelectionChange(new Set());
    }
  };

  // Split filename into name and extension
  const getNameAndExt = (filename: string) => {
    const lastDot = filename.lastIndexOf('.');
    if (lastDot === -1) return { name: filename, ext: '' };
    return {
      name: filename.slice(0, lastDot),
      ext: filename.slice(lastDot),
    };
  };

  // Handler for updating filename (name only, preserving extension)
  const handleFilenameChange = (index: number, newName: string) => {
    const file = files[index];
    const { ext } = getNameAndExt(file.filename);
    const newFilename = newName + ext;
    handleChange(index, 'filename', newFilename);
  };

  // Handler for updating a field
  const handleChange = async (
    index: number,
    field: keyof AudioFile,
    value: string
  ) => {
    const updatedFiles = [...files];
    const file = updatedFiles[index];

    // Update local state immediately
    updatedFiles[index] = { ...file, [field]: value };
    setFiles(updatedFiles);

    // If no ID, skip API call
    if (!file.id) {
      console.warn('Skipping API call: file ID is missing', file);
      return;
    }

    // Build metadata payload
    const metadata = {
        file_id: file.id,
        filename: updatedFiles[index].filename ?? '',
        title: updatedFiles[index].title ?? '',
        artist: updatedFiles[index].artist ?? '',
        album: updatedFiles[index].album ?? '',
        year: updatedFiles[index].year ?? '',
        type: file.type,
        size: file.size,
    };

    try {
      await fetch('http://localhost:3001/api/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(metadata),
      });
    } catch (error) {
      console.error('Failed to update metadata:', error);
    }
  };


  return (
    <section>
      <table className="collection-table">
        <thead>
          <tr>
            {headers.map((h, i) => (
              <th key={i}>
                {h === 'Download' ? (
                  <label>
                    <input
                      type="checkbox"
                      title="Select all"
                      checked={selectedFiles.size === files.length && files.length > 0}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                    />{' '}
                    {h}
                  </label>
                ) : (
                  h
                )}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {files.map((file, index) => (
            <tr key={file.id ?? `${file.filename}-${index}`}>
              <td>
                {readOnly ? (
                  file.filename ?? '-'
                ) : (
                  <span className="filename-input">
                    <input
                      type="text"
                      title="Filename"
                      value={getNameAndExt(file.filename ?? '').name}
                      onChange={(e) => handleFilenameChange(index, e.target.value)}
                    />
                    <span className="filename-ext">{getNameAndExt(file.filename ?? '').ext}</span>
                  </span>
                )}
              </td>
              <td>
                {readOnly ? (
                  file.artist ?? '-'
                ) : (
                  <input
                    type="text"
                    title="Artist"
                    value={file.artist ?? ''}
                    onChange={(e) => handleChange(index, 'artist', e.target.value)}
                  />
                )}
              </td>
              <td>
                {readOnly ? (
                  file.title ?? '-'
                ) : (
                  <input
                    type="text"
                    title="Title"
                    value={file.title ?? ''}
                    onChange={(e) => handleChange(index, 'title', e.target.value)}
                  />
                )}
              </td>
              <td>
                {readOnly ? (
                  file.album ?? '-'
                ) : (
                  <input
                    type="text"
                    title="Album"
                    value={file.album ?? ''}
                    onChange={(e) => handleChange(index, 'album', e.target.value)}
                  />
                )}
              </td>
              <td>
                {readOnly ? (
                  file.year ?? '-'
                ) : (
                  <input
                    type="text"
                    title="Year"
                    value={file.year ?? ''}
                    onChange={(e) => handleChange(index, 'year', e.target.value)}
                  />
                )}
              </td>
              <td>{file.type ?? '-'}</td>
              <td>{file.size ?? '-'}</td>
              {showDownload && (
                <td>
                  <input
                    type="checkbox"
                    title={`Select ${file.filename}`}
                    checked={selectedFiles.has(file.filename)}
                    onChange={(e) => handleCheckboxChange(file.filename, e.target.checked)}
                  />
                </td>
              )}
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
