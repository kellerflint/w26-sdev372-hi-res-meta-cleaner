import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { handleFileChange } from '../app/components/fileUtils';
import { AudioFile } from '../app/types/audio';

const files: AudioFile[] = [
  { id: 1, filename: 'song.mp3', title: 'Song', artist: 'Artist', album: 'Album', year: '2020', type: 'MP3', size: '5 MB' },
  { id: 2, filename: 'track.flac', title: 'Track', artist: 'Band', album: 'Record', year: '2021', type: 'FLAC', size: '20 MB' },
];

describe('handleFileChange', () => {
  const mockSetFiles = vi.fn();

  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true }));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    mockSetFiles.mockClear();
  });

  it('calls setFiles with the updated field value', async () => {
    await handleFileChange(0, 'title', 'New Title', files, mockSetFiles);

    const updatedFiles: AudioFile[] = mockSetFiles.mock.calls[0][0];
    expect(updatedFiles[0].title).toBe('New Title');
    expect(updatedFiles[1].title).toBe('Track'); // unchanged
  });

  it('does not mutate the original files array', async () => {
    await handleFileChange(0, 'artist', 'New Artist', files, mockSetFiles);

    expect(files[0].artist).toBe('Artist');
  });

  it('calls fetch when the file has an id', async () => {
    await handleFileChange(0, 'artist', 'New Artist', files, mockSetFiles);

    expect(fetch).toHaveBeenCalledOnce();
  });

  it('skips fetch when file id is falsy (0)', async () => {
    const filesWithoutId: AudioFile[] = [{ ...files[0], id: 0 }];
    await handleFileChange(0, 'title', 'New Title', filesWithoutId, mockSetFiles);

    expect(fetch).not.toHaveBeenCalled();
  });

  it('calls fetch with the correct endpoint and method', async () => {
    await handleFileChange(0, 'album', 'New Album', files, mockSetFiles);

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/update'),
      expect.objectContaining({ method: 'POST' })
    );
  });
});
