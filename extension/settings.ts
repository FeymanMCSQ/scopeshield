export type Settings = {
  hourlyRate: number;
  defaultFee: number;
};

export type RawSettings = {
  hourlyRate?: unknown;
  defaultFee?: unknown;
};

export function normalizeSettings(input: RawSettings): Settings {
  return {
    hourlyRate: Number(input.hourlyRate ?? 0),
    defaultFee: Number(input.defaultFee ?? 0),
  };
}
