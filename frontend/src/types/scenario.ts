export type ScenarioStep = {
  type: string;
  [key: string]: string;
};

export type OperationalScenario = {
  index: number;
  name: string;
  steps: ScenarioStep[];
};

export type ScenarioTemplate = {
  template_id: string;
  name: string;
  description: string | null;
  created_by: string;
  created_by_username?: string | null;
  created_at: string;
  operational_scenarios: OperationalScenario[];
};

export type CreateScenarioPayload = {
  name: string;
  description?: string;
  operational_scenarios: OperationalScenario[];
};
