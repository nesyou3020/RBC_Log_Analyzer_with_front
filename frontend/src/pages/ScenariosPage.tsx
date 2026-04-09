import { useEffect, useMemo, useState } from 'react';
import { useScenarios } from '../hooks/useScenarios';
import { CreateScenarioPayload, OperationalScenario, ScenarioStep, ScenarioTemplate } from '../types';
import { useAuthContext } from '../store/authContext';

type VariableDraft = {
  id: string;
  key: string;
  value: string;
};

type StepDraft = {
  id: string;
  type: string;
  variables: VariableDraft[];
};

type EventDraft = {
  id: string;
  name: string;
  stepsCount: number;
  steps: StepDraft[];
};

type BuilderMode = 'import' | 'manual';

function makeId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function makeVariable(key = '', value = ''): VariableDraft {
  return {
    id: makeId('var'),
    key,
    value,
  };
}

function makeStep(type = ''): StepDraft {
  return {
    id: makeId('step'),
    type,
    variables: [makeVariable()],
  };
}

function makeEvent(): EventDraft {
  return {
    id: makeId('event'),
    name: '',
    stepsCount: 1,
    steps: [makeStep()],
  };
}

function buildEvents(count: number): EventDraft[] {
  return Array.from({ length: Math.max(0, count) }, () => makeEvent());
}

function toDateLabel(value: string): string {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? '-' : parsed.toLocaleDateString();
}

function toStepDraft(step: ScenarioStep): StepDraft {
  const variables = Object.entries(step)
    .filter(([key]) => key !== 'type')
    .map(([key, value]) => makeVariable(key, String(value ?? '')));

  return {
    id: makeId('step'),
    type: String(step.type ?? ''),
    variables: variables.length > 0 ? variables : [makeVariable()],
  };
}

function toEventDraft(source: OperationalScenario): EventDraft {
  return {
    id: makeId('event'),
    name: source.name ?? '',
    stepsCount: source.steps.length,
    steps: source.steps.map((step) => toStepDraft(step)),
  };
}

export function ScenariosPage() {
  const scenarios = useScenarios();
  const auth = useAuthContext();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [builderMode, setBuilderMode] = useState<BuilderMode>('import');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [numberOfEvents, setNumberOfEvents] = useState(2);
  const [events, setEvents] = useState<EventDraft[]>(() => buildEvents(2));
  const [xlsx, setXlsx] = useState<File | null>(null);
  const [importedPayload, setImportedPayload] = useState<ScenarioTemplate | null>(null);
  const [searchText, setSearchText] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [builderMessage, setBuilderMessage] = useState<{ kind: 'info' | 'success' | 'error'; text: string } | null>(null);
  const [isImportReview, setIsImportReview] = useState(false);

  const isValidator = auth.user?.role === 'validator';
  const canManageScenarios = Boolean(auth.user);

  useEffect(() => {
    if (!successMessage) {
      return;
    }

    const timeout = window.setTimeout(() => {
      setSuccessMessage('');
    }, 3500);

    return () => window.clearTimeout(timeout);
  }, [successMessage]);

  function resetBuilder() {
    setBuilderMode('import');
    setName('');
    setDescription('');
    setNumberOfEvents(2);
    setEvents(buildEvents(2));
    setXlsx(null);
    setImportedPayload(null);
    setBuilderMessage(null);
    setIsImportReview(false);
  }

  function openBuilderModal(mode: BuilderMode = 'import') {
    if (!canManageScenarios) {
      return;
    }

    setIsModalOpen(true);
    resetBuilder();
    setBuilderMode(mode);
  }

  function closeBuilderModal() {
    setIsModalOpen(false);
  }

  function generateEvents() {
    setEvents(buildEvents(numberOfEvents));
  }

  function generateSteps(eventId: string) {
    setEvents((previous) =>
      previous.map((eventItem) => {
        if (eventItem.id !== eventId) {
          return eventItem;
        }

        return {
          ...eventItem,
          steps: Array.from({ length: Math.max(0, eventItem.stepsCount) }, () => makeStep()),
        };
      })
    );
  }

  function addVariable(eventId: string, stepId: string) {
    setEvents((previous) =>
      previous.map((eventItem) => {
        if (eventItem.id !== eventId) {
          return eventItem;
        }

        return {
          ...eventItem,
          steps: eventItem.steps.map((step) => {
            if (step.id !== stepId) {
              return step;
            }
            return {
              ...step,
              variables: [...step.variables, makeVariable()],
            };
          }),
        };
      })
    );
  }

  function removeVariable(eventId: string, stepId: string, variableId: string) {
    setEvents((previous) =>
      previous.map((eventItem) => {
        if (eventItem.id !== eventId) {
          return eventItem;
        }

        return {
          ...eventItem,
          steps: eventItem.steps.map((step) => {
            if (step.id !== stepId) {
              return step;
            }
            return {
              ...step,
              variables: step.variables.filter((variable) => variable.id !== variableId),
            };
          }),
        };
      })
    );
  }

  function buildManualPayload(strict: boolean): CreateScenarioPayload {
    const trimmedName = name.trim();
    if (strict && !trimmedName) {
      throw new Error('Scenario Name is required');
    }

    const payload: CreateScenarioPayload = {
      name: trimmedName,
      description: description.trim(),
      operational_scenarios: [],
    };

    events.forEach((eventItem, eventIndex) => {
      const eventName = eventItem.name.trim();
      if (strict && !eventName) {
        throw new Error(`Event name is required for event #${eventIndex + 1}`);
      }

      const scenarioEvent: OperationalScenario = {
        index: eventIndex + 1,
        name: eventName || `EVENT_${eventIndex + 1}`,
        steps: [],
      };

      eventItem.steps.forEach((step, stepIndex) => {
        const stepType = step.type.trim();
        if (strict && !stepType) {
          throw new Error(`Type is required in event ${scenarioEvent.name}, step ${stepIndex + 1}`);
        }

        const stepPayload: ScenarioStep = { type: stepType };
        step.variables.forEach((variable) => {
          const key = variable.key.trim();
          if (key) {
            stepPayload[key] = variable.value;
          }
        });

        scenarioEvent.steps.push(stepPayload);
      });

      payload.operational_scenarios.push(scenarioEvent);
    });

    if (strict && payload.operational_scenarios.length === 0) {
      throw new Error('At least one event is required');
    }

    return payload;
  }

  function hydrateManualBuilder(template: ScenarioTemplate) {
    setName(template.name ?? '');
    setDescription(template.description ?? '');
    const nextEvents = template.operational_scenarios.map((item) => toEventDraft(item));
    setNumberOfEvents(nextEvents.length);
    setEvents(nextEvents);
  }

  function onSaveImportedScenario() {
    if (!xlsx) {
      setBuilderMessage({ kind: 'error', text: 'Please choose an .xlsx file before uploading.' });
      return;
    }

    setBuilderMessage({ kind: 'info', text: 'Saving scenario from .xlsx...' });

    scenarios.uploadExcel.mutate(
      {
        name: name || xlsx.name.replace(/\.(xlsx|xlsm)$/i, ''),
        description,
        file: xlsx,
      },
      {
        onSuccess: () => {
          setSuccessMessage(`Scenario "${name || xlsx.name.replace(/\.(xlsx|xlsm)$/i, '')}" added successfully.`);
          closeBuilderModal();
          setBuilderMessage(null);
        },
        onError: () => {
          setBuilderMessage({ kind: 'error', text: 'Save failed. Please check the file format and try again.' });
        },
      }
    );
  }

  function onReviewBeforeSaving() {
    if (!xlsx) {
      setBuilderMessage({ kind: 'error', text: 'Please choose an .xlsx file before reviewing.' });
      return;
    }

    setBuilderMessage({ kind: 'info', text: 'Preparing review from .xlsx without saving...' });

    scenarios.previewExcel.mutate(
      {
        name: name || xlsx.name.replace(/\.(xlsx|xlsm)$/i, ''),
        description,
        file: xlsx,
      },
      {
        onSuccess: (response) => {
          setImportedPayload(response.data);
          hydrateManualBuilder(response.data);
          setBuilderMode('manual');
          setIsImportReview(true);
          setBuilderMessage({ kind: 'success', text: 'Review loaded. Click Save Scenario to save once.' });
        },
        onError: () => {
          setBuilderMessage({ kind: 'error', text: 'Review failed. Please check the file format and try again.' });
        },
      }
    );
  }

  function onCreate() {
    let payload: CreateScenarioPayload;
    try {
      payload = buildManualPayload(true);
    } catch {
      return;
    }

    scenarios.create.mutate(payload, {
      onSuccess: () => {
        setSuccessMessage(`Scenario "${payload.name}" added successfully.`);
        closeBuilderModal();
        setImportedPayload(null);
        setBuilderMessage(null);
      },
      onError: () => {
        setBuilderMessage({ kind: 'error', text: 'Could not save scenario. Please fix required fields and try again.' });
      },
    });
  }

  const scenarioItems = scenarios.list.data ?? [];
  const filteredItems = useMemo(() => {
    const search = searchText.trim().toLowerCase();
    if (!search) {
      return scenarioItems;
    }

    return scenarioItems.filter((item) => {
      return item.name.toLowerCase().includes(search) || (item.description ?? '').toLowerCase().includes(search);
    });
  }, [scenarioItems, searchText]);

  const payloadPreview = useMemo(() => {
    if (builderMode === 'import' && importedPayload) {
      return JSON.stringify(importedPayload, null, 2);
    }

    return JSON.stringify(buildManualPayload(false), null, 2);
  }, [builderMode, importedPayload, name, description, events]);

  const pageStyles = `
    .scenario-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: var(--spacing-lg);
      margin-bottom: var(--spacing-2xl);
    }

    .scenario-card {
      background: linear-gradient(180deg, rgba(30, 41, 59, 0.98) 0%, rgba(15, 23, 42, 0.98) 100%);
      border: 1px solid rgba(148, 163, 184, 0.16);
      border-radius: 14px;
      padding: var(--spacing-lg);
      transition: var(--transition);
      box-shadow: 0 10px 28px rgba(2, 6, 23, 0.16);
    }

    .scenario-card:hover {
      border-color: rgba(59, 130, 246, 0.55);
      box-shadow: 0 16px 36px rgba(2, 6, 23, 0.24);
      transform: translateY(-2px);
    }

    .scenario-header {
      display: flex;
      justify-content: space-between;
      align-items: start;
      margin-bottom: var(--spacing-md);
    }

    .scenario-title {
      font-weight: 600;
      font-size: 16px;
      color: var(--color-text-primary);
      margin-bottom: 4px;
    }

    .scenario-description {
      font-size: 13px;
      color: var(--color-text-secondary);
      margin-bottom: var(--spacing-md);
      line-height: 1.5;
    }

    .scenario-meta {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: var(--spacing-md) 0;
      border-top: 1px solid rgba(148, 163, 184, 0.12);
      margin-bottom: var(--spacing-md);
    }

    .status-badge {
      display: inline-block;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 11px;
      font-weight: 500;
    }

    .status-active {
      background-color: rgba(34, 197, 94, 0.1);
      color: var(--color-success);
    }

    .scenario-actions {
      display: flex;
      gap: 8px;
    }

    .action-btn-sm {
      padding: 8px 12px;
      font-size: 12px;
      background-color: rgba(15, 23, 42, 0.72);
      border: 1px solid rgba(148, 163, 184, 0.18);
      color: var(--color-text-primary);
      border-radius: 8px;
      cursor: pointer;
      transition: var(--transition);
      flex: 1;
      text-align: center;
    }

    .action-btn-sm:hover {
      background-color: rgba(59, 130, 246, 0.14);
      border-color: rgba(59, 130, 246, 0.55);
      color: var(--color-primary);
    }

    .builder-modal {
      width: min(1200px, 96vw);
      max-height: 90vh;
      overflow: auto;
      background: linear-gradient(180deg, rgba(15, 23, 42, 0.98) 0%, rgba(17, 24, 39, 0.98) 100%);
      border: 1px solid rgba(148, 163, 184, 0.16);
      border-radius: 18px;
      box-shadow: 0 24px 60px rgba(2, 6, 23, 0.45);
    }

    .builder-body {
      display: grid;
      grid-template-columns: 1.6fr 1fr;
      gap: var(--spacing-lg);
      padding: var(--spacing-lg);
    }

    .builder-panel {
      background-color: rgba(15, 23, 42, 0.58);
      border: 1px solid rgba(148, 163, 184, 0.14);
      border-radius: 14px;
      padding: var(--spacing-md);
    }

    .mode-tabs {
      display: flex;
      gap: 8px;
      margin-bottom: var(--spacing-md);
    }

    .mode-tab {
      border: 1px solid rgba(148, 163, 184, 0.18);
      background-color: rgba(15, 23, 42, 0.72);
      color: var(--color-text-secondary);
      padding: 8px 12px;
      border-radius: 999px;
      cursor: pointer;
      font-size: 12px;
      font-weight: 700;
    }

    .mode-tab.active {
      background-color: var(--color-primary);
      border-color: var(--color-primary);
      color: white;
    }

    .form-row {
      display: grid;
      grid-template-columns: 1fr 180px auto;
      gap: 8px;
      align-items: end;
    }

    .event-list {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-md);
      margin-top: var(--spacing-md);
    }

    .event-block {
      border: 1px solid var(--color-border);
      border-radius: 8px;
      padding: var(--spacing-md);
      background-color: var(--color-bg-primary);
    }

    .event-head {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
    }

    .event-title {
      font-weight: 700;
      color: var(--color-text-primary);
      font-size: 13px;
    }

    .steps-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
      margin-top: 8px;
    }

    .step-block {
      border: 1px solid rgba(148, 163, 184, 0.14);
      border-radius: 10px;
      padding: 10px;
      background: rgba(30, 41, 59, 0.68);
    }

    .step-header {
      font-size: 12px;
      font-weight: 700;
      color: var(--color-text-secondary);
      margin-bottom: 8px;
    }

    .variables-list {
      display: flex;
      flex-direction: column;
      gap: 6px;
      margin-top: 8px;
    }

    .variable-row {
      display: grid;
      grid-template-columns: 1fr 1fr auto;
      gap: 8px;
      align-items: center;
    }

    .preview-box {
      border: 1px solid rgba(148, 163, 184, 0.14);
      border-radius: 14px;
      background: linear-gradient(180deg, #07111f 0%, #0a1324 100%);
      color: #dbeafe;
      padding: 12px;
      font-size: 12px;
      line-height: 1.45;
      min-height: 460px;
      max-height: 65vh;
      overflow: auto;
      white-space: pre-wrap;
      word-break: break-word;
      font-family: Consolas, 'Courier New', monospace;
    }

    .inline-help {
      font-size: 11px;
      color: var(--color-text-muted);
      margin-top: 4px;
    }

    .search-line {
      margin-bottom: var(--spacing-md);
    }

    .search-input {
      width: 100%;
      padding: 10px 12px;
      background-color: rgba(30, 41, 59, 0.9);
      border: 1px solid rgba(148, 163, 184, 0.16);
      border-radius: 10px;
      color: var(--color-text-primary);
      font-size: 14px;
    }

    .success-banner {
      margin-bottom: var(--spacing-md);
      padding: 10px 12px;
      border-radius: 10px;
      background-color: rgba(16, 185, 129, 0.12);
      color: var(--color-success);
      border: 1px solid rgba(16, 185, 129, 0.35);
      font-size: 14px;
    }

    .builder-toolbar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: var(--spacing-md);
      margin-bottom: var(--spacing-md);
      flex-wrap: wrap;
    }

    .page-header-card {
      margin-bottom: var(--spacing-lg);
      padding: var(--spacing-lg);
      border-radius: 16px;
      border: 1px solid rgba(148, 163, 184, 0.12);
      background: linear-gradient(135deg, rgba(30, 41, 59, 0.96), rgba(15, 23, 42, 0.96));
      box-shadow: 0 18px 44px rgba(2, 6, 23, 0.22);
    }

    .page-header-card h2 {
      font-size: 24px;
      letter-spacing: 0.2px;
    }

    .page-header-card p {
      max-width: 720px;
    }

    .modal-actions {
      display: flex;
      justify-content: space-between;
      gap: var(--spacing-sm);
      margin-top: var(--spacing-md);
      flex-wrap: wrap;
    }

    .status-badge-muted {
      background-color: rgba(148, 163, 184, 0.12);
      color: var(--color-text-secondary);
    }

    .flow-guide {
      margin-top: 10px;
      border: 1px solid rgba(148, 163, 184, 0.16);
      border-radius: 10px;
      background: rgba(15, 23, 42, 0.48);
      padding: 10px 12px;
      font-size: 12px;
      color: var(--color-text-secondary);
      line-height: 1.55;
    }

    .flow-guide strong {
      color: var(--color-text-primary);
    }

    .selected-file {
      margin-top: 8px;
      font-size: 12px;
      color: var(--color-text-secondary);
      padding: 6px 8px;
      border: 1px dashed rgba(148, 163, 184, 0.26);
      border-radius: 8px;
      background: rgba(30, 41, 59, 0.35);
    }

    .builder-alert {
      margin-top: 12px;
      padding: 10px 12px;
      border-radius: 10px;
      font-size: 13px;
      border: 1px solid transparent;
    }

    .builder-alert.info {
      color: var(--color-info);
      background: rgba(6, 182, 212, 0.1);
      border-color: rgba(6, 182, 212, 0.3);
    }

    .builder-alert.success {
      color: var(--color-success);
      background: rgba(16, 185, 129, 0.12);
      border-color: rgba(16, 185, 129, 0.35);
    }

    .builder-alert.error {
      color: var(--color-error);
      background: rgba(239, 68, 68, 0.1);
      border-color: rgba(239, 68, 68, 0.3);
    }

    @media (max-width: 1080px) {
      .builder-body {
        grid-template-columns: 1fr;
      }

      .form-row {
        grid-template-columns: 1fr;
      }

      .variable-row {
        grid-template-columns: 1fr;
      }

      .preview-box {
        min-height: 260px;
      }
    }

    /* Light mode polish: keep dark mode untouched */
    :root[data-theme='light'] .page-header-card {
      background: linear-gradient(135deg, #f8f9ff 0%, #eef3ff 100%);
      border: 1px solid #dfe5f6;
      box-shadow: 0 10px 28px rgba(31, 34, 51, 0.08);
    }

    :root[data-theme='light'] .scenario-card {
      background: #ffffff;
      border: 1px solid #dfe5f6;
      box-shadow: 0 10px 22px rgba(31, 34, 51, 0.08);
    }

    :root[data-theme='light'] .scenario-card:hover {
      border-color: #b9c6ff;
      box-shadow: 0 16px 30px rgba(31, 34, 51, 0.12);
    }

    :root[data-theme='light'] .action-btn-sm {
      background: #f4f6fd;
      border-color: #d7deef;
      color: #3a445f;
    }

    :root[data-theme='light'] .search-input {
      background: #ffffff;
      border-color: #dfe5f6;
      color: #1f2233;
    }

    :root[data-theme='light'] .builder-modal {
      background: #ffffff;
      border-color: #dfe5f6;
      box-shadow: 0 24px 52px rgba(31, 34, 51, 0.2);
    }

    :root[data-theme='light'] .builder-panel {
      background: #f8faff;
      border-color: #dfe5f6;
    }

    :root[data-theme='light'] .mode-tab {
      background: #f2f5ff;
      border-color: #d5ddf5;
      color: #4c5675;
    }

    :root[data-theme='light'] .event-block {
      background: #ffffff;
      border-color: #dfe5f6;
    }

    :root[data-theme='light'] .step-block {
      background: #f8faff;
      border-color: #dfe5f6;
    }

    :root[data-theme='light'] .preview-box {
      background: #f7f9ff;
      border-color: #dfe5f6;
      color: #2f3a5f;
    }

    :root[data-theme='light'] .flow-guide,
    :root[data-theme='light'] .selected-file {
      background: #f6f8ff;
      border-color: #d5ddf5;
      color: #526085;
    }
  `;

  return (
    <>
      <style>{pageStyles}</style>

      <div className="page-header-card builder-toolbar">
        <div>
          <h2 style={{ color: 'var(--color-text-primary)', marginBottom: 4 }}>Scenario Templates</h2>
          <p style={{ color: 'var(--color-text-muted)', fontSize: 14 }}>
            {isValidator
              ? 'Import from .xlsx, review scenarios, or create manually'
              : 'Import from .xlsx or create your own scenarios manually'}
          </p>
        </div>
        {canManageScenarios ? (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button className="btn btn-secondary" onClick={() => openBuilderModal('import')}>
              <i className="fas fa-file-import"></i>
              <span>Import from .xlsx</span>
            </button>
            <button className="btn btn-primary" onClick={() => openBuilderModal('manual')}>
              <i className="fas fa-pen"></i>
              <span>Create with form</span>
            </button>
          </div>
        ) : null}
      </div>

      {successMessage ? <div className="success-banner">{successMessage}</div> : null}

      <div className="search-line">
        <input
          type="text"
          className="search-input"
          placeholder="Search scenarios..."
          value={searchText}
          onChange={(event) => setSearchText(event.target.value)}
        />
      </div>

      <div className="scenario-grid">
        {filteredItems.map((item) => (
          <div key={item.template_id} className="scenario-card">
            <div className="scenario-header">
              <div>
                <div className="scenario-title">{item.name}</div>
                <span className="status-badge status-active">ACTIVE</span>
              </div>
            </div>

            <div className="scenario-description">{item.description || '-'}</div>

            <div className="scenario-meta">
              {isValidator ? (
                <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
                  Created by {item.created_by_username ?? item.created_by}
                </span>
              ) : (
                <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>My scenario</span>
              )}
              <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>{toDateLabel(item.created_at)}</span>
            </div>

            {canManageScenarios ? (
              <div className="scenario-actions">
                <button
                  className="action-btn-sm"
                  onClick={() => {
                    openBuilderModal();
                    setBuilderMode('manual');
                    setName(item.name);
                    setDescription(item.description ?? '');
                    const nextEvents = item.operational_scenarios.length > 0 ? item.operational_scenarios.map((scenario) => toEventDraft(scenario)) : buildEvents(1);
                    setNumberOfEvents(nextEvents.length);
                    setEvents(nextEvents);
                  }}
                >
                  <i className="fas fa-edit"></i> Edit
                </button>
                <button
                  className="action-btn-sm"
                  onClick={() => {
                    const confirmed = window.confirm(`Delete ${item.name}?`);
                    if (!confirmed) {
                      return;
                    }

                    scenarios.remove.mutate(item.template_id);
                  }}
                  disabled={scenarios.remove.isPending}
                >
                  <i className="fas fa-trash"></i> Delete
                </button>
              </div>
            ) : null}
          </div>
        ))}
      </div>

      {isModalOpen ? (
        <>
          <div className="modal active" style={{ alignItems: 'center', justifyContent: 'center' }}>
            <div className="builder-modal">
              <div className="modal-header" style={{ padding: 'var(--spacing-lg)', borderBottom: '1px solid var(--color-border)' }}>
                <h2 style={{ margin: 0 }}>Create Scenario Template</h2>
                <button className="modal-close" onClick={closeBuilderModal}>
                  <i className="fas fa-times"></i>
                </button>
              </div>

              <div className="builder-body">
                <div className="builder-panel">
                  <div className="mode-tabs">
                    <span className={`mode-tab active`}>
                      <i className={`fas ${builderMode === 'import' ? 'fa-file-import' : 'fa-pen'}`}></i> {builderMode === 'import' ? 'Import from .xlsx' : isImportReview ? 'Review before saving' : 'Create with form'}
                    </span>
                  </div>

                  {builderMode === 'import' ? (
                    <div className="form-group">
                      <label className="form-label">1) Import .xlsx file</label>
                      <input
                        type="file"
                        className="form-input"
                        accept=".xlsx,.xlsm"
                        onChange={(event) => setXlsx(event.target.files?.[0] ?? null)}
                      />
                      {xlsx ? <div className="selected-file"><strong>Selected:</strong> {xlsx.name}</div> : null}
                      <div className="import-actions" style={{ marginTop: 10, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                          <button className="btn btn-primary" onClick={onSaveImportedScenario} disabled={scenarios.uploadExcel.isPending || !xlsx}>
                            {scenarios.uploadExcel.isPending ? 'Saving...' : 'Save scenario'}
                          </button>
                          <button className="btn btn-secondary" onClick={onReviewBeforeSaving} disabled={scenarios.previewExcel.isPending || !xlsx}>
                            {scenarios.previewExcel.isPending ? 'Loading review...' : 'Review before saving'}
                          </button>
                      </div>

                      <div className="flow-guide">
                        <div><strong>Step 1:</strong> Choose your .xlsx template.</div>
                        <div><strong>Step 2:</strong> Click Save scenario to save once, or Review before saving.</div>
                        <div><strong>Step 3:</strong> If you review first, click Save Scenario from the form to save once.</div>
                      </div>
                    </div>
                  ) : null}

                  {builderMessage ? <div className={`builder-alert ${builderMessage.kind}`}>{builderMessage.text}</div> : null}

                  {builderMode === 'manual' ? (
                    <>
                      <div className="form-group">
                        <label className="form-label">1) Scenario Information</label>
                        <input
                          type="text"
                          className="form-input"
                          placeholder="Scenario Name (required)"
                          value={name}
                          onChange={(event) => setName(event.target.value)}
                        />
                        <textarea
                          className="form-input"
                          rows={3}
                          placeholder="Description (optional)"
                          style={{ marginTop: 8 }}
                          value={description}
                          onChange={(event) => setDescription(event.target.value)}
                        ></textarea>
                      </div>

                      <div className="form-group">
                        <label className="form-label">2) Number of Events</label>
                        <div className="form-row">
                          <input
                            type="number"
                            min={0}
                            className="form-input"
                            value={numberOfEvents}
                            onChange={(event) => setNumberOfEvents(Number(event.target.value || 0))}
                          />
                          <button className="btn btn-secondary" onClick={generateEvents}>Generate Events</button>
                        </div>
                      </div>

                      <div className="event-list">
                        {events.map((eventItem, eventIndex) => (
                          <div key={eventItem.id} className="event-block">
                            <div className="event-head">
                              <div className="event-title">Event {eventIndex + 1}</div>
                              <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>index: {eventIndex + 1}</div>
                            </div>

                            <div className="form-row">
                              <input
                                type="text"
                                className="form-input"
                                placeholder="Event Name (required)"
                                value={eventItem.name}
                                onChange={(event) =>
                                  setEvents((previous) =>
                                    previous.map((item) =>
                                      item.id === eventItem.id ? { ...item, name: event.target.value } : item
                                    )
                                  )
                                }
                              />
                              <input
                                type="number"
                                min={0}
                                className="form-input"
                                value={eventItem.stepsCount}
                                onChange={(event) =>
                                  setEvents((previous) =>
                                    previous.map((item) =>
                                      item.id === eventItem.id ? { ...item, stepsCount: Number(event.target.value || 0) } : item
                                    )
                                  )
                                }
                              />
                              <button className="btn btn-secondary" type="button" onClick={() => generateSteps(eventItem.id)}>
                                Generate Steps
                              </button>
                            </div>

                            <div className="inline-help">3) For each event: enter name + number of steps, then generate step blocks. 0 is allowed.</div>

                            <div className="steps-list">
                              {eventItem.steps.map((step, stepIndex) => (
                                <div key={step.id} className="step-block">
                                  <div className="step-header">Step {stepIndex + 1}</div>
                                  <label className="form-label" style={{ marginBottom: 6 }}>Type (required)</label>
                                  <input
                                    type="text"
                                    className="form-input"
                                    placeholder="type value (example: stpauthdata)"
                                    value={step.type}
                                    onChange={(event) =>
                                      setEvents((previous) =>
                                        previous.map((item) => {
                                          if (item.id !== eventItem.id) {
                                            return item;
                                          }
                                          return {
                                            ...item,
                                            steps: item.steps.map((itemStep) =>
                                              itemStep.id === step.id ? { ...itemStep, type: event.target.value } : itemStep
                                            ),
                                          };
                                        })
                                      )
                                    }
                                  />

                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                                    <div className="form-label" style={{ margin: 0 }}>Variables</div>
                                    <button
                                      className="btn btn-secondary"
                                      type="button"
                                      style={{ padding: '6px 10px', fontSize: 12 }}
                                      onClick={() => addVariable(eventItem.id, step.id)}
                                    >
                                      + Add Variable
                                    </button>
                                  </div>

                                  <div className="variables-list">
                                    {step.variables.map((variable) => (
                                      <div key={variable.id} className="variable-row">
                                        <input
                                          type="text"
                                          className="form-input"
                                          placeholder="Variable name"
                                          value={variable.key}
                                          onChange={(event) =>
                                            setEvents((previous) =>
                                              previous.map((item) => {
                                                if (item.id !== eventItem.id) {
                                                  return item;
                                                }
                                                return {
                                                  ...item,
                                                  steps: item.steps.map((itemStep) => {
                                                    if (itemStep.id !== step.id) {
                                                      return itemStep;
                                                    }
                                                    return {
                                                      ...itemStep,
                                                      variables: itemStep.variables.map((itemVariable) =>
                                                        itemVariable.id === variable.id
                                                          ? { ...itemVariable, key: event.target.value }
                                                          : itemVariable
                                                      ),
                                                    };
                                                  }),
                                                };
                                              })
                                            )
                                          }
                                        />

                                        <input
                                          type="text"
                                          className="form-input"
                                          placeholder="Variable value"
                                          value={variable.value}
                                          onChange={(event) =>
                                            setEvents((previous) =>
                                              previous.map((item) => {
                                                if (item.id !== eventItem.id) {
                                                  return item;
                                                }
                                                return {
                                                  ...item,
                                                  steps: item.steps.map((itemStep) => {
                                                    if (itemStep.id !== step.id) {
                                                      return itemStep;
                                                    }
                                                    return {
                                                      ...itemStep,
                                                      variables: itemStep.variables.map((itemVariable) =>
                                                        itemVariable.id === variable.id
                                                          ? { ...itemVariable, value: event.target.value }
                                                          : itemVariable
                                                      ),
                                                    };
                                                  }),
                                                };
                                              })
                                            )
                                          }
                                        />

                                        <button
                                          className="btn btn-secondary"
                                          type="button"
                                          style={{ padding: '6px 10px', fontSize: 12 }}
                                          onClick={() => removeVariable(eventItem.id, step.id, variable.id)}
                                        >
                                          Remove
                                        </button>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : null}

                  <div className="modal-actions">
                    <button className="btn btn-secondary" onClick={closeBuilderModal}>Cancel</button>
                    <button className="btn btn-primary" onClick={onCreate} disabled={builderMode !== 'manual' || scenarios.create.isPending}>
                      <i className="fas fa-save"></i>
                      {scenarios.create.isPending ? 'Saving...' : 'Save Scenario'}
                    </button>
                  </div>
                </div>

                <div className="builder-panel">
                  <h3 style={{ margin: '0 0 10px 0', fontSize: 15, color: 'var(--color-text-primary)' }}>Endpoint JSON Payload Preview</h3>
                  <div className="preview-box">{payloadPreview}</div>
                </div>
              </div>
            </div>
          </div>

          <div className="modal-backdrop" style={{ display: 'block' }} onClick={closeBuilderModal}></div>
        </>
      ) : null}
    </>
  );
}
