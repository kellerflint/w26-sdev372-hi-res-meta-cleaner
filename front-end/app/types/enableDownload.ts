import { AudioFile } from "./audio";

export type EnableDownload = {
  collection: AudioFile[];
  onRemove?: (index: number) => void;
  readOnly?: boolean;
  showDownload?: boolean;
  selectedFiles?: Set<string>;
  onSelectionChange?: (filenames: Set<string>) => void;
};