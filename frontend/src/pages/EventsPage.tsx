import { useMemo, useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useAllEvents, useAllRawEvents, useTrains } from '../hooks/useEvents';
import { useImports } from '../hooks/useImports';
import { EventMode, EventRow } from '../types';
import { transformRawEventsToChartData } from '../utils/trainGraphUtils';

const EVENTS_GRAPH_VISIBILITY_SESSION_KEY = 'events-graph-visible';

function toText(value: unknown): string {
  if (value === null || value === undefined) {
    return '';
  }
  return String(value);
}

function getFirstValue(row: EventRow, keys: string[]): string {
  for (const key of keys) {
    const value = row[key];
    if (value !== null && value !== undefined && String(value).trim() !== '') {
      return String(value);
    }
  }
  return '';
}

function getCode(row: EventRow): string {
  const raw = row.raw as Record<string, unknown> | undefined;
  const fromRow = getFirstValue(row, ['message_code', 'code', 'nid_message']);
  if (fromRow) {
    return fromRow.startsWith('M') ? fromRow : `M${fromRow}`;
  }

  const rawCode = raw ? toText(raw.nid_message) : '';
  if (rawCode) {
    return rawCode.startsWith('M') ? rawCode : `M${rawCode}`;
  }

  return '';
}

function getMessageName(row: EventRow): string {
  const byName = getFirstValue(row, ['message_name', 'name', 'info']);
  if (byName) {
    return byName;
  }

  return '-';
}

function getTimestamp(row: EventRow): string {
  return getFirstValue(row, ['timestamp', 'ts', 'datetime']) || '-';
}

function getDirection(row: EventRow): string {
  const raw = row.raw as Record<string, unknown> | undefined;

  const symbol = (getFirstValue(row, ['direction_symbol']) || (raw ? toText(raw.direction_symbol) : '')).trim();
  if (symbol) {
    if (symbol.includes('<')) {
      return '<---------';
    }
    if (symbol.includes('>')) {
      return '--------->';
    }
    return symbol;
  }

  const direction = getFirstValue(row, ['direction']) || (raw ? toText(raw.direction) : '');
  if (!direction) {
    return '-';
  }

  const normalized = direction.toLowerCase();
  if (normalized.includes('from') || normalized.includes('left') || normalized.includes('rbc_to_obu')) {
    return '<---------';
  }
  if (normalized.includes('to') || normalized.includes('right') || normalized.includes('obu_to_rbc')) {
    return '--------->';
  }

  return direction;
}

function getRawTrainId(raw: Record<string, unknown>): string {
  const value = raw.peer_etcs_id;
  if (value === null || value === undefined) {
    return '';
  }
  return String(value).trim();
}

export function EventsPage() {
  const [fileId, setFileId] = useState('');
  const [mode, setMode] = useState<EventMode>('without_24_136');
  const [trainId, setTrainId] = useState('');
  const [timestampFromInput, setTimestampFromInput] = useState('');
  const [timestampToInput, setTimestampToInput] = useState('');
  const [messageType, setMessageType] = useState('');
  const [messageCode, setMessageCode] = useState('');
  const [searchText, setSearchText] = useState('');
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [isGraphVisible, setIsGraphVisible] = useState<boolean>(() => {
    if (typeof window === 'undefined') {
      return true;
    }
    return window.sessionStorage.getItem(EVENTS_GRAPH_VISIBILITY_SESSION_KEY) !== 'false';
  });
  const pageSize = 50;

  function parseFilterTimestamp(value: string): number {
    const input = value.trim();
    if (!input) {
      return NaN;
    }

    const match = input.match(/^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2}):(\d{2})(?:\.(\d{1,3}))?$/);
    if (match) {
      const year = Number(match[1]);
      const month = Number(match[2]);
      const day = Number(match[3]);
      const hour = Number(match[4]);
      const minute = Number(match[5]);
      const second = Number(match[6]);
      const msRaw = match[7] ?? '0';
      const millisecond = Number(msRaw.padEnd(3, '0'));

      return new Date(year, month - 1, day, hour, minute, second, millisecond).getTime();
    }

    return new Date(input).getTime();
  }

  const imports = useImports();
  const trains = useTrains(fileId || null);
  const allEvents = useAllEvents(fileId || null, mode);
  const allRawEvents = useAllRawEvents(fileId || null);

  const timestampFrom = timestampFromInput.trim();
  const timestampTo = timestampToInput.trim();

  function clearAllFilters(): void {
    setFileId('');
    setMode('without_24_136');
    setTrainId('');
    setTimestampFromInput('');
    setTimestampToInput('');
    setMessageType('');
    setMessageCode('');
    setSearchText('');
    setSelectedIndex(null);
    setCurrentPage(1);
  }

  // Auto-select single train if file has only one train
  const shouldAutoSelectTrain = trains.data && trains.data.length === 1 && !trainId;
  useEffect(() => {
    if (shouldAutoSelectTrain) {
      setTrainId(String(trains.data[0]));
    }
  }, [shouldAutoSelectTrain, trains.data]);

  useEffect(() => {
    setCurrentPage(1);
    setSelectedIndex(null);
  }, [fileId, mode, trainId, timestampFrom, timestampTo, messageType, messageCode, searchText]);

  const catalogRows = allEvents.data ?? [];

  const typeOptions = useMemo(() => {
    const set = new Set<string>();
    catalogRows.forEach((row) => {
      const raw = row.raw as Record<string, unknown> | undefined;
      const type = getFirstValue(row, ['type']) || (raw ? toText(raw.type) : '');
      if (type) {
        set.add(type.toUpperCase());
      }
    });
    return Array.from(set);
  }, [catalogRows]);

  const codeOptions = useMemo(() => {
    const set = new Set<string>();
    const labelMap = new Map<string, string>();

    // Filter rows by selected message type if one is selected
    const rowsToProcess = messageType
      ? catalogRows.filter((row) => {
          const raw = row.raw as Record<string, unknown> | undefined;
          const rowType = (getFirstValue(row, ['type']) || (raw ? toText(raw.type) : '')).toUpperCase();
          return rowType === messageType.toUpperCase();
        })
      : catalogRows;

    rowsToProcess.forEach((row) => {
      const code = getCode(row);
      if (!code) {
        return;
      }

      set.add(code);

      const messageName = getFirstValue(row, ['message_name', 'name', 'info']);
      if (messageName && !labelMap.has(code)) {
        labelMap.set(code, messageName);
      }
    });

    return Array.from(set).map((code) => ({
      code,
      label: labelMap.get(code) ? `${code} - ${labelMap.get(code)}` : code
    }));
  }, [catalogRows, messageType]);

  useEffect(() => {
    if (messageCode && !codeOptions.some((option) => option.code === messageCode)) {
      setMessageCode('');
    }
  }, [codeOptions, messageCode]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    window.sessionStorage.setItem(EVENTS_GRAPH_VISIBILITY_SESSION_KEY, String(isGraphVisible));
  }, [isGraphVisible]);

  const filteredRows = useMemo(() => {
    const typeFilter = messageType.trim().toUpperCase();
    const codeFilter = messageCode.trim().toUpperCase();
    const searchFilter = searchText.trim().toLowerCase();
    const fromComparable = parseFilterTimestamp(timestampFrom);
    const toComparable = parseFilterTimestamp(timestampTo);

    return catalogRows.filter((row) => {
      const tsText = getTimestamp(row);
      const tsComparable = tsText && tsText !== '-' ? new Date(tsText).getTime() : NaN;

      if (timestampFrom && Number.isFinite(fromComparable) && Number.isFinite(tsComparable) && tsComparable < fromComparable) {
        return false;
      }

      if (timestampTo && Number.isFinite(toComparable) && Number.isFinite(tsComparable) && tsComparable > toComparable) {
        return false;
      }

      const raw = row.raw as Record<string, unknown> | undefined;
      const rowType = (getFirstValue(row, ['type']) || (raw ? toText(raw.type) : '')).toUpperCase();
      if (typeFilter && rowType !== typeFilter) {
        return false;
      }

      const rowCode = getCode(row).toUpperCase();
      if (codeFilter && rowCode !== codeFilter) {
        return false;
      }

      if (searchFilter) {
        const searchable = [
          tsText,
          getDirection(row),
          rowCode,
          getMessageName(row),
          rowType,
        ]
          .join(' ')
          .toLowerCase();

        if (!searchable.includes(searchFilter)) {
          return false;
        }
      }

      return true;
    });
  }, [catalogRows, messageType, messageCode, searchText, timestampFrom, timestampTo]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize));

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const pagedRows = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredRows.slice(start, start + pageSize);
  }, [filteredRows, currentPage]);

  const selectedRow = useMemo(() => {
    if (selectedIndex === null) {
      return pagedRows[0] ?? null;
    }
    return pagedRows.find((row, idx) => (row.index ?? idx + 1) === selectedIndex) ?? pagedRows[0] ?? null;
  }, [pagedRows, selectedIndex]);

  const selectedRaw = useMemo(() => {
    if (!selectedRow) {
      return null;
    }

    const rowRaw = selectedRow.raw as Record<string, unknown> | undefined;
    if (rowRaw && Object.keys(rowRaw).length > 0) {
      return rowRaw;
    }

    const idx = selectedRow.index;
    if (!idx) {
      return null;
    }

    const pool = allRawEvents.data ?? [];
    const matched = pool.find((item) => Number(item.index) === Number(idx));
    return matched ?? null;
  }, [selectedRow, allRawEvents.data]);

  const selectedEntries = useMemo(() => {
    if (!selectedRaw) {
      return [] as Array<[string, unknown]>;
    }
    return Object.entries(selectedRaw);
  }, [selectedRaw]);

  // Chart data logic with train-dependent display
  const { shouldShowGraph, graphMessage } = useMemo(() => {
    if (!fileId) {
      return { shouldShowGraph: false, graphMessage: '' };
    }

    const trainCount = trains.data?.length ?? 0;
    if (trainCount === 0) {
      return { shouldShowGraph: false, graphMessage: 'No trains found in this file.' };
    }

    if (trainCount > 1 && !trainId) {
      return { shouldShowGraph: false, graphMessage: 'Please select a train to display the graph.' };
    }

    if (trainId) {
      return { shouldShowGraph: true, graphMessage: '' };
    }

    return { shouldShowGraph: false, graphMessage: '' };
  }, [fileId, trainId, trains.data]);

  const chartData = useMemo(() => {
    if (!shouldShowGraph || !trainId) {
      return [];
    }

    // Prefer /events/raw full timeline; fallback to row.raw values if needed.
    const rawPool = allRawEvents.data && allRawEvents.data.length > 0
      ? allRawEvents.data
        : (allEvents.data ?? [])
          .map((row) => row.raw)
          .filter((raw): raw is Record<string, unknown> => Boolean(raw && Object.keys(raw).length > 0));

    const normalizedTrainId = String(trainId).trim();
    const trainFilteredEvents = rawPool.filter((event) => getRawTrainId(event) === normalizedTrainId);

    return transformRawEventsToChartData(
      trainFilteredEvents.map((item) => item as Record<string, unknown>)
    );
  }, [allRawEvents.data, allEvents.data, trainId, shouldShowGraph]);

  const pageStyles = `
    .event-filters {
      display: flex;
      gap: var(--spacing-md);
      margin-bottom: var(--spacing-lg);
      flex-wrap: wrap;
      align-items: flex-end;
    }

    .filter-group {
      flex: 1;
      min-width: 200px;
    }

    .filter-label {
      display: block;
      font-size: 12px;
      font-weight: 500;
      color: var(--color-text-muted);
      margin-bottom: 4px;
      text-transform: uppercase;
    }

    .filter-input,
    .filter-select {
      width: 100%;
      padding: var(--spacing-sm) var(--spacing-md);
      background-color: var(--color-bg-secondary);
      border: 1px solid var(--color-border);
      border-radius: 4px;
      color: var(--color-text-primary);
      font-size: 14px;
    }

    .filter-input:focus,
    .filter-select:focus {
      outline: none;
      border-color: var(--color-primary);
    }

    .toggle-btn {
      padding: 6px 12px;
      border: 1px solid var(--color-border);
      border-radius: 4px;
      background-color: var(--color-bg-primary);
      color: var(--color-text-primary);
      cursor: pointer;
      font-size: 12px;
      font-weight: 500;
      transition: all 0.2s;
    }

    .toggle-btn:hover {
      background-color: var(--color-bg-secondary);
    }

    .toggle-btn.active {
      background-color: var(--color-primary);
      color: white;
      border-color: var(--color-primary);
    }

    .message-selected {
      background-color: rgba(59, 130, 246, 0.1) !important;
      border-left: 3px solid var(--color-primary);
    }

    .graph-section-wrapper {
      overflow: hidden;
      max-height: 1200px;
      opacity: 1;
      margin-bottom: var(--spacing-lg);
      transition: max-height var(--transition), opacity var(--transition), margin-bottom var(--transition);
    }

    .graph-section-wrapper.hidden {
      max-height: 0;
      opacity: 0;
      margin-bottom: 0;
    }

    @media (max-width: 1200px) {
      .visualization-section {
        grid-template-columns: 1fr;
      }

      .bottom-split {
        grid-template-columns: 1fr;
      }
    }
  `;

  return (
    <>
      <style>{pageStyles}</style>

      <div style={{ marginBottom: 'var(--spacing-lg)' }}>
        <h2 style={{ color: 'var(--color-text-primary)', marginBottom: 4 }}>Event Viewer</h2>
        <p style={{ color: 'var(--color-text-muted)', fontSize: 14 }}>Analyze and explore parsed events from your log files</p>
      </div>

      <div className="event-filters">
        <div className="filter-group" style={{ minWidth: 250 }}>
          <label className="filter-label">Select File (Required)</label>
          <select
            className="filter-select"
            value={fileId}
            onChange={(e) => {
              setFileId(e.target.value);
              setTrainId('');
              setSelectedIndex(null);
            }}
          >
            <option value="">-- Choose a file --</option>
            {(imports.list.data ?? []).map((item) => (
              <option key={item.file_id} value={item.file_id}>
                {item.file.file_name}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label className="filter-label">Train ID</label>
          <select className="filter-select" value={trainId} onChange={(e) => setTrainId(e.target.value)}>
            <option value="">All Trains</option>
            {(trains.data ?? []).map((train) => (
              <option key={String(train)} value={String(train)}>
                {String(train)}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label className="filter-label">Timestamp From</label>
          <input
            type="text"
            className="filter-input"
            placeholder="2022-08-25 14:00:00.154"
            value={timestampFromInput}
            onChange={(e) => setTimestampFromInput(e.target.value)}
          />
        </div>

        <div className="filter-group">
          <label className="filter-label">Timestamp To</label>
          <input
            type="text"
            className="filter-input"
            placeholder="2022-08-25 14:00:00.154"
            value={timestampToInput}
            onChange={(e) => setTimestampToInput(e.target.value)}
          />
        </div>
      </div>

      <div className="event-filters">
        <div className="filter-group">
          <label className="filter-label">Message Type</label>
          <select className="filter-select" value={messageType} onChange={(e) => {
            setMessageType(e.target.value);
            setMessageCode(''); // Reset message code when type changes
          }}>
            <option value="">All Types</option>
            {typeOptions.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label className="filter-label">Message Code</label>
          <select className="filter-select" value={messageCode} onChange={(e) => setMessageCode(e.target.value)}>
            <option value="">All Codes</option>
            {codeOptions.map(({ code, label }) => (
              <option key={code} value={code}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label className="filter-label">Search</label>
          <input
            type="text"
            className="filter-input"
            placeholder="Search events..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
        </div>

        <div className="filter-group" style={{ flex: '0 0 auto', minWidth: 190 }}>
          <button
            className="toggle-btn"
            style={{ width: '100%', height: 38 }}
            onClick={clearAllFilters}
            type="button"
          >
            Remove All Filters
          </button>
        </div>
      </div>

      <div style={{ marginBottom: 'var(--spacing-sm)' }}>
        <button
          className="toggle-btn"
          type="button"
          onClick={() => setIsGraphVisible((prev) => !prev)}
        >
          {isGraphVisible ? 'Hide Graph' : 'Show Graph'}
        </button>
      </div>

      <div className={`graph-section-wrapper ${isGraphVisible ? '' : 'hidden'}`}>
        <div className="card" style={{ marginBottom: 0, padding: 'var(--spacing-md)' }}>
          <div style={{ fontWeight: 600, marginBottom: 'var(--spacing-md)', fontSize: 14 }}>The Graphical View of Train Status</div>

          {!shouldShowGraph ? (
            <div style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: 'var(--spacing-lg)' }}>
              {graphMessage || 'Please select a train to display the graph.'}
            </div>
          ) : chartData.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: 'var(--spacing-lg)' }}>
              No valid events to display for this train. Try selecting a different train or file.
            </div>
          ) : (
            <>
              <div style={{ fontWeight: 600, marginBottom: 'var(--spacing-sm)', fontSize: 12 }}>V_Train</div>
              <div style={{ border: '1px solid var(--color-border)', borderRadius: 4, padding: 'var(--spacing-sm)', marginBottom: 'var(--spacing-md)' }}>
                <ResponsiveContainer width="100%" height={260}>
                  <LineChart data={chartData} margin={{ top: 8, right: 24, left: 8, bottom: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                    <XAxis
                      type="number"
                      dataKey="Time_sec"
                      domain={[0, 'dataMax']}
                      allowDuplicatedCategory={false}
                      stroke="var(--color-text-muted)"
                      label={{ value: 'Time_sec', position: 'insideBottomRight', offset: -5 }}
                    />
                    <YAxis stroke="var(--color-text-muted)" label={{ value: 'V_Train', angle: -90, position: 'insideLeft' }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'var(--color-bg-secondary)',
                        border: '1px solid var(--color-border)',
                        color: 'var(--color-text-primary)',
                        borderRadius: 4
                      }}
                    />
                    <Legend />
                    <Line type="stepAfter" dataKey="V_Train" stroke="#3b82f6" dot={false} strokeWidth={2} name="V_Train" />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div style={{ fontWeight: 600, marginBottom: 'var(--spacing-sm)', fontSize: 12 }}>M_Mode</div>
              <div style={{ border: '1px solid var(--color-border)', borderRadius: 4, padding: 'var(--spacing-sm)' }}>
                <ResponsiveContainer width="100%" height={260}>
                  <LineChart data={chartData} margin={{ top: 20, right: 24, left: 8, bottom: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                    <XAxis
                      type="number"
                      dataKey="Time_sec"
                      domain={[0, 'dataMax']}
                      allowDuplicatedCategory={false}
                      stroke="var(--color-text-muted)"
                      label={{ value: 'Time_sec', position: 'insideBottomRight', offset: -5 }}
                    />
                    <YAxis stroke="var(--color-text-muted)" label={{ value: 'M_Mode', angle: -90, position: 'insideLeft' }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'var(--color-bg-secondary)',
                        border: '1px solid var(--color-border)',
                        color: 'var(--color-text-primary)',
                        borderRadius: 4
                      }}
                      formatter={(value, name, item) => {
                        if (name === 'M_Mode') {
                          const payload = item.payload as { M_Mode_label?: string };
                          return [`${String(value)} (${payload.M_Mode_label ?? ''})`, 'M_Mode'];
                        }
                        return [String(value), String(name)];
                      }}
                    />
                    <Legend />
                    <Line type="stepAfter" dataKey="M_Mode_value" stroke="#22c55e" dot={false} activeDot={false} strokeWidth={2} name="M_Mode" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="bottom-split" style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: 'var(--spacing-lg)', marginBottom: 'var(--spacing-lg)' }}>
        <div className="card" style={{ marginBottom: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--spacing-md)', borderBottom: '1px solid var(--color-border)' }}>
            <div style={{ fontWeight: 600, fontSize: 13 }}>Messages</div>
            <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
              <button className={`toggle-btn ${mode === 'without_24_136' ? 'active' : ''}`} onClick={() => setMode('without_24_136')}>
                Messages without 24 and 136
              </button>
              <button className={`toggle-btn ${mode === 'with_24_136' ? 'active' : ''}`} onClick={() => setMode('with_24_136')}>
                Messages including 24 and 136
              </button>
            </div>
          </div>

          <table className="table" style={{ margin: 0 }}>
            <thead>
              <tr>
                <th>timestamp</th>
                <th>OBU ⇄ RBC</th>
                <th>Messages</th>
                <th>Message Name</th>
              </tr>
            </thead>
            <tbody id="messagesList" style={{ fontSize: 12 }}>
              {!fileId ? (
                <tr>
                  <td colSpan={4} style={{ color: 'var(--color-text-muted)' }}>
                    Select a file to load events.
                  </td>
                </tr>
              ) : null}

              {fileId && allEvents.isLoading ? (
                <tr>
                  <td colSpan={4}>Loading events...</td>
                </tr>
              ) : null}

              {fileId && (allEvents.error || allEvents.isError) ? (
                <tr>
                  <td colSpan={4} style={{ color: 'var(--color-error)' }}>
                    {String((allEvents.error as Error)?.message ?? 'Failed to load events.')}
                  </td>
                </tr>
              ) : null}

              {fileId && !allEvents.isLoading && !allEvents.isError && filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ color: 'var(--color-text-muted)' }}>
                    No events found for current filters.
                  </td>
                </tr>
              ) : null}

              {pagedRows.map((row, idx) => {
                const rowIndex = Number(row.index ?? idx + 1);
                const selected = selectedRow ? Number(selectedRow.index ?? pagedRows.indexOf(selectedRow) + 1) === rowIndex : idx === 0;
                const code = getCode(row);

                return (
                  <tr
                    key={`${rowIndex}-${code}-${getTimestamp(row)}`}
                    onClick={() => setSelectedIndex(rowIndex)}
                    style={{ cursor: 'pointer' }}
                    className={selected ? 'message-selected' : ''}
                  >
                    <td>{getTimestamp(row)}</td>
                    <td>{getDirection(row)}</td>
                    <td>
                      <strong>{code || '-'}</strong>
                    </td>
                    <td>{getMessageName(row)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {fileId && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--spacing-md)', borderTop: '1px solid var(--color-border)' }}>
              <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
                Page {currentPage} of {totalPages} ({filteredRows.length} total events)
              </div>
              <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
                <button
                  className="toggle-btn"
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  style={{ opacity: currentPage === 1 ? 0.5 : 1, cursor: currentPage === 1 ? 'not-allowed' : 'pointer' }}
                >
                  ← Previous
                </button>
                <button
                  className="toggle-btn"
                  onClick={() => setCurrentPage((prev) => prev + 1)}
                  disabled={currentPage >= totalPages}
                  style={{
                    opacity: currentPage >= totalPages ? 0.5 : 1,
                    cursor: currentPage >= totalPages ? 'not-allowed' : 'pointer'
                  }}
                >
                  Next →
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="card" style={{ overflowY: 'auto', padding: 'var(--spacing-md)', marginBottom: 0 }}>
          <div style={{ fontWeight: 600, marginBottom: 'var(--spacing-md)', fontSize: 13 }}>Information of the Selected Message</div>
          <div id="messageDetailContent">
            <div style={{ marginBottom: 'var(--spacing-md)' }}>
              <label style={{ fontSize: 12, fontWeight: 500 }}>add later</label>
              <input type="text" className="filter-input" style={{ fontSize: 12 }} value={getTimestamp(selectedRow ?? {})} readOnly />
            </div>

            <div style={{ marginBottom: 'var(--spacing-md)' }}>
              <label style={{ fontSize: 12, fontWeight: 500 }}>add later</label>
              <input type="text" className="filter-input" style={{ fontSize: 12 }} value={getMessageName(selectedRow ?? {})} readOnly />
            </div>

            <div style={{ marginBottom: 'var(--spacing-md)' }}>
              <label style={{ fontSize: 12, fontWeight: 500 }}>add later</label>
              <input type="text" className="filter-input" style={{ fontSize: 12 }} value={getCode(selectedRow ?? {})} readOnly />
            </div>

            <div style={{ marginBottom: 'var(--spacing-md)' }}>
              <label style={{ fontSize: 12, fontWeight: 500 }}>add later</label>
              <input type="text" className="filter-input" style={{ fontSize: 12 }} value={selectedEntries[0]?.[0] ?? ''} readOnly />
            </div>

            <div style={{ marginBottom: 'var(--spacing-md)' }}>
              <label style={{ fontSize: 12, fontWeight: 500 }}>add later</label>
              <input type="text" className="filter-input" style={{ fontSize: 12 }} value={selectedEntries[0] ? String(selectedEntries[0][1]) : ''} readOnly />
            </div>

            <table style={{ width: '100%', fontSize: 11, borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <th style={{ textAlign: 'left', padding: '6px 0', color: 'var(--color-text-muted)' }}>Name</th>
                  <th style={{ textAlign: 'left', padding: '6px 0', color: 'var(--color-text-muted)' }}>Value</th>
                </tr>
              </thead>
              <tbody>
                {selectedEntries.length === 0 ? (
                  <tr>
                    <td colSpan={2} style={{ padding: '6px 0', color: 'var(--color-text-muted)' }}>
                      No raw details available.
                    </td>
                  </tr>
                ) : null}

                {selectedEntries.map(([name, value]) => (
                  <tr key={name} style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <td style={{ padding: '6px 0' }}>{name}</td>
                    <td style={{ padding: '6px 0', fontFamily: 'monospace' }}>{String(value)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}
