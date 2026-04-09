// M_Mode labels mapping
export const M_MODE_DICT: Record<string | number, string> = {
  "0": "FS",
  "1": "OS",
  "2": "SR",
  "3": "SH",
  "4": "UN",
  "5": "SL",
  "6": "SB",
  "7": "TR",
  "8": "PT",
  "9": "SF",
  "10": "IS",
  "12": "LS",
  "13": "SN",
  "14": "RV",
};

export interface TrainGraphDataPoint {
  Time_sec: number;
  V_Train: number;
  M_Mode_value: number;
  M_Mode_label: string;
  Timestamp: string;
}

function parseTimestampValue(value: unknown): Date | null {
  if (value === null || value === undefined) {
    return null;
  }

  const raw = String(value).trim();
  if (!raw) {
    return null;
  }

  const direct = new Date(raw);
  if (!Number.isNaN(direct.getTime())) {
    return direct;
  }

  // Normalize common backend format: "2022-08-25 14:00:14.705 +0000"
  const normalized = raw
    .replace(' ', 'T')
    .replace(/\s+([+-]\d{2})(\d{2})$/, '$1:$2');
  const parsedNormalized = new Date(normalized);
  if (!Number.isNaN(parsedNormalized.getTime())) {
    return parsedNormalized;
  }

  return null;
}

function toNumber(value: unknown, fallback = 0): number {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) {
      return fallback;
    }
    const parsed = Number(trimmed);
    return Number.isFinite(parsed) ? parsed : fallback;
  }
  return fallback;
}

function hasRequiredGraphFields(event: Record<string, unknown>): boolean {
  const timestamp = event.Timestamp ?? event.timestamp ?? event.ts;
  const vTrain = event.V_Train ?? event.v_train ?? event.vTrain;
  const mode = event.M_Mode ?? event.m_mode ?? event.mMode;

  if (timestamp === null || timestamp === undefined || String(timestamp).trim() === '') {
    return false;
  }

  if (vTrain === null || vTrain === undefined || String(vTrain).trim() === '') {
    return false;
  }

  if (mode === null || mode === undefined || String(mode).trim() === '') {
    return false;
  }

  return true;
}

/**
 * Transform raw events into chart dataset
 * @param rawEvents - Array of raw event objects from backend
 * @returns Array of chart data points with Time_sec calculated
 */
export function transformRawEventsToChartData(rawEvents: Record<string, unknown>[]): TrainGraphDataPoint[] {
  if (!rawEvents || rawEvents.length === 0) {
    return [];
  }

  const rowsWithTimestamp = rawEvents
    .filter((event) => hasRequiredGraphFields(event))
    .map((event) => {
      const tsValue = event.Timestamp ?? event.timestamp ?? event.ts;
      const parsedTimestamp = parseTimestampValue(tsValue);
      if (!parsedTimestamp) {
        return null;
      }
      return {
        event,
        timestamp: parsedTimestamp,
        timestampText: String(tsValue)
      };
    })
    .filter((row): row is { event: Record<string, unknown>; timestamp: Date; timestampText: string } => row !== null)
    .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

  if (rowsWithTimestamp.length === 0) {
    return [];
  }

  const firstTimestampMs = rowsWithTimestamp[0].timestamp.getTime();

  const eventPoints: TrainGraphDataPoint[] = rowsWithTimestamp.map(({ event, timestamp, timestampText }) => {
    const diffSeconds = (timestamp.getTime() - firstTimestampMs) / 1000;
    const Time_sec = Math.max(0, Math.round(diffSeconds));

    const rawSpeed = event.V_Train ?? event.v_train ?? event.vTrain;
    const rawMode = event.M_Mode ?? event.m_mode ?? event.mMode;

    const V_Train = toNumber(rawSpeed, 0);
    const M_Mode_value = toNumber(rawMode, 0);
    const M_Mode_label = M_MODE_DICT[String(M_Mode_value)] || String(M_Mode_value);

    return {
      Time_sec,
      V_Train,
      M_Mode_value,
      M_Mode_label,
      Timestamp: timestampText
    };
  });

  if (eventPoints.length === 0) {
    return [];
  }

  // Keep one value per second (last event of that second), then fill missing seconds
  // with previous values to get a stable step-like timeline similar to Excel.
  const bySecond = new Map<number, TrainGraphDataPoint>();
  for (const point of eventPoints) {
    bySecond.set(point.Time_sec, point);
  }

  const maxSec = Math.max(...Array.from(bySecond.keys()));
  const timeline: TrainGraphDataPoint[] = [];

  let last = bySecond.get(0) ?? eventPoints[0];
  for (let sec = 0; sec <= maxSec; sec += 1) {
    const current = bySecond.get(sec);
    if (current) {
      last = current;
      timeline.push(current);
    } else {
      timeline.push({
        Time_sec: sec,
        V_Train: last.V_Train,
        M_Mode_value: last.M_Mode_value,
        M_Mode_label: last.M_Mode_label,
        Timestamp: last.Timestamp
      });
    }
  }

  return timeline;
}
