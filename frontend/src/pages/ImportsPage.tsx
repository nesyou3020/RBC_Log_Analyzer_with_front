import { useMemo, useRef, useState } from 'react';
import { useImports } from '../hooks/useImports';
import { useAuthContext } from '../store/authContext';

export function ImportsPage() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const uploadZoneRef = useRef<HTMLDivElement | null>(null);
  const { list, upload, remove, download } = useImports();
  const auth = useAuthContext();
  const [nameFilter, setNameFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [notice, setNotice] = useState<string | null>(null);

  const imports = list.data ?? [];
  const isValidator = auth.user?.role === 'validator';

  const filteredImports = useMemo(() => {
    return imports.filter((item) => {
      const byName = item.file.file_name.toLowerCase().includes(nameFilter.trim().toLowerCase());
      const byDate = !dateFilter || new Date(item.uploaded_at).toISOString().slice(0, 10) === dateFilter;
      return byName && byDate;
    });
  }, [imports, nameFilter, dateFilter]);

  const triggerUpload = () => {
    fileInputRef.current?.click();
  };

  const uploadFiles = (files: FileList | null) => {
    if (!files || files.length === 0) {
      return;
    }

    const firstFile = files[0];
    upload.mutate(firstFile, {
      onSuccess: () => setNotice(`Uploaded ${firstFile.name} successfully.`),
      onError: (error) => setNotice((error as Error).message)
    });
  };

  const onDownload = (fileId: string) => {
    download.mutate(fileId, {
      onSuccess: ({ blob, filename }) => {
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = filename;
        document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();
        URL.revokeObjectURL(url);
        setNotice(`Downloaded ${filename}`);
      },
      onError: (error) => setNotice((error as Error).message)
    });
  };

  const onDelete = (fileId: string, fileName: string) => {
    const confirmed = window.confirm(`Delete ${fileName}?`);
    if (!confirmed) {
      return;
    }

    remove.mutate(fileId, {
      onSuccess: () => setNotice(`Deleted ${fileName}`),
      onError: (error) => setNotice((error as Error).message)
    });
  };

  const onUploadZoneDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (uploadZoneRef.current) {
      uploadZoneRef.current.style.borderColor = 'var(--color-primary)';
      uploadZoneRef.current.style.backgroundColor = 'rgba(59, 130, 246, 0.15)';
    }
  };

  const onUploadZoneDragLeave = () => {
    if (uploadZoneRef.current) {
      uploadZoneRef.current.style.borderColor = 'var(--color-border)';
      uploadZoneRef.current.style.backgroundColor = 'rgba(59, 130, 246, 0.05)';
    }
  };

  const onUploadZoneDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    onUploadZoneDragLeave();
    uploadFiles(event.dataTransfer.files);
  };

  const formatSizeMb = (bytes: number) => {
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(mb >= 100 ? 0 : 1)} MB`;
  };

  const latestSync = imports.length ? new Date(imports[0].uploaded_at).toLocaleString() : '-';

  const pageStyles = `
    .upload-zone {
      border: 2px dashed var(--color-border);
      border-radius: 8px;
      padding: var(--spacing-2xl);
      text-align: center;
      background-color: rgba(59, 130, 246, 0.05);
      transition: var(--transition);
      cursor: pointer;
      margin-bottom: var(--spacing-2xl);
    }

    .upload-zone:hover {
      border-color: var(--color-primary);
      background-color: rgba(59, 130, 246, 0.1);
    }

    .upload-icon {
      font-size: 48px;
      color: var(--color-primary);
      margin-bottom: var(--spacing-md);
    }

    .upload-text {
      font-weight: 500;
      color: var(--color-text-primary);
      margin-bottom: var(--spacing-sm);
    }

    .upload-help {
      font-size: 12px;
      color: var(--color-text-muted);
    }

    .hidden-input {
      display: none;
    }

    .file-filters {
      display: flex;
      gap: var(--spacing-md);
      margin-bottom: var(--spacing-lg);
      flex-wrap: wrap;
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

    .filter-input {
      width: 100%;
      padding: var(--spacing-sm) var(--spacing-md);
      background-color: var(--color-bg-secondary);
      border: 1px solid var(--color-border);
      border-radius: 4px;
      color: var(--color-text-primary);
      font-size: 14px;
    }

    .filter-input:focus {
      outline: none;
      border-color: var(--color-primary);
    }

    .file-actions {
      display: flex;
      gap: 8px;
    }

    .action-btn {
      padding: 4px 8px;
      background-color: var(--color-bg-secondary);
      border: 1px solid var(--color-border);
      border-radius: 4px;
      color: var(--color-text-primary);
      cursor: pointer;
      font-size: 12px;
      transition: var(--transition);
    }

    .action-btn:hover {
      background-color: rgba(59, 130, 246, 0.1);
      border-color: var(--color-primary);
      color: var(--color-primary);
    }

    .action-btn.danger:hover {
      background-color: rgba(239, 68, 68, 0.1);
      border-color: var(--color-error);
      color: var(--color-error);
    }
  `;

  return (
    <>
      <style>{pageStyles}</style>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-lg)' }}>
        <div>
          <h2 style={{ color: 'var(--color-text-primary)', marginBottom: 4 }}>Import Files</h2>
          <p style={{ color: 'var(--color-text-muted)', fontSize: 14 }}>Upload and manage your RBC log files</p>
        </div>
        <button className="btn btn-primary" onClick={triggerUpload} disabled={upload.isPending}>
          <i className="fas fa-upload"></i>
          <span>{upload.isPending ? 'Uploading...' : 'Upload New File'}</span>
        </button>
        <input
          ref={fileInputRef}
          type="file"
          className="hidden-input"
          accept=".xml"
          onChange={(e) => uploadFiles(e.currentTarget.files)}
        />
      </div>

      <div
        ref={uploadZoneRef}
        className="upload-zone"
        onClick={triggerUpload}
        onDragOver={onUploadZoneDragOver}
        onDragLeave={onUploadZoneDragLeave}
        onDrop={onUploadZoneDrop}
      >
        <div className="upload-icon">
          <i className="fas fa-cloud-upload-alt"></i>
        </div>
        <div className="upload-text">Drag and drop your files here or click to browse</div>
        <div className="upload-help">Supported formats: XML | Maximum file size: 500MB</div>
      </div>

      <div className="file-filters">
        <div className="filter-group">
          <label className="filter-label">File Name</label>
          <input
            type="text"
            className="filter-input"
            placeholder="Search by file name..."
            value={nameFilter}
            onChange={(e) => setNameFilter(e.target.value)}
          />
        </div>
        <div className="filter-group">
          <label className="filter-label">Uploaded Date</label>
          <input type="date" className="filter-input" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} />
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Uploaded Files ({filteredImports.length} total)</h3>
          <span style={{ color: 'var(--color-text-muted)', fontSize: 12 }}>Last updated: {latestSync}</span>
        </div>

        {list.isLoading ? <div style={{ padding: 'var(--spacing-md)' }}>Loading imports...</div> : null}
        {list.error ? <div style={{ padding: 'var(--spacing-md)', color: 'var(--color-error)' }}>{(list.error as Error).message}</div> : null}
        {notice ? <div style={{ padding: '0 var(--spacing-md) var(--spacing-md)', color: 'var(--color-text-secondary)' }}>{notice}</div> : null}

        <table className="table">
          <thead>
            <tr>
              <th>File Name</th>
              {isValidator ? <th>Created By</th> : null}
              <th>Size</th>
              <th>Uploaded</th>
              <th>Events</th>
              <th>Train IDs</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {!list.isLoading && filteredImports.length === 0 ? (
              <tr>
                <td colSpan={isValidator ? 7 : 6} style={{ color: 'var(--color-text-muted)' }}>
                  No imports found.
                </td>
              </tr>
            ) : null}

            {filteredImports.map((item) => (
              <tr key={item.file_id}>
                <td>
                  <i className="fas fa-file-code" style={{ color: 'var(--color-primary)', marginRight: 8 }}></i>
                  {item.file.file_name}
                </td>
                {isValidator ? <td>{item.created_by_username ?? '-'}</td> : null}
                <td>{formatSizeMb(item.file.file_size)}</td>
                <td>{new Date(item.uploaded_at).toLocaleString()}</td>
                <td>
                  <strong>-</strong>
                </td>
                <td>-</td>
                <td>
                  <div className="file-actions">
                    <button className="action-btn" title="View details" onClick={() => setNotice('Detailed view is not implemented yet.')}>
                      <i className="fas fa-eye"></i>
                    </button>
                    <button className="action-btn" title="Download" onClick={() => onDownload(item.file_id)} disabled={download.isPending}>
                      <i className="fas fa-download"></i>
                    </button>
                    <button
                      className="action-btn danger"
                      title="Delete"
                      onClick={() => onDelete(item.file_id, item.file.file_name)}
                      disabled={remove.isPending}
                    >
                      <i className="fas fa-trash"></i>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: 'var(--spacing-sm)',
            padding: 'var(--spacing-lg)',
            borderTop: '1px solid var(--color-border)'
          }}
        >
          <button className="btn btn-secondary" style={{ minWidth: 80 }} disabled>
            ← Previous
          </button>
          <button className="btn btn-primary" style={{ minWidth: 40 }}>
            1
          </button>
          <button className="btn btn-secondary" style={{ minWidth: 80 }} disabled>
            Next →
          </button>
        </div>
      </div>
    </>
  );
}
