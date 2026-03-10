import { describe, it, expect, vi } from 'vitest';

vi.mock('music-metadata', () => ({ parseBlob: vi.fn() }));

import { getFileType } from '../app/components/useAudioMetadata';

describe('getFileType', () => {
  it('returns extension in uppercase', () => {
    expect(getFileType('song.mp3')).toBe('MP3');
    expect(getFileType('track.flac')).toBe('FLAC');
    expect(getFileType('audio.wav')).toBe('WAV');
  });

  it('handles already-uppercase extension', () => {
    expect(getFileType('track.FLAC')).toBe('FLAC');
  });

  it('returns last segment for multi-dot filenames', () => {
    expect(getFileType('my.favorite.track.mp3')).toBe('MP3');
  });

  it('returns the whole name uppercased when there is no dot', () => {
    // split('.').pop() on 'noextension' returns 'noextension' itself
    expect(getFileType('noextension')).toBe('NOEXTENSION');
  });
});
