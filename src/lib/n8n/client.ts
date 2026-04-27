import { getN8nUrl } from './service';

export interface N8nWorkflow {
  id: string;
  name: string;
  active: boolean;
  nodes: any[];
  connections: any;
  createdAt: string;
  updatedAt: string;
}

export interface N8nExecution {
  id: string;
  workflowId: string;
  status: 'success' | 'error' | 'running' | 'waiting' | 'unknown';
  startedAt: string;
  stoppedAt?: string;
  executionTime?: number;
  data?: any;
  error?: string;
}

const BASE_URL = getN8nUrl();

async function fetchN8nAPI(
  endpoint: string,
  options: RequestInit = {}
): Promise<any> {
  const url = `${BASE_URL}/api${endpoint}`;

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`n8n API error: ${response.status} - ${error}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`n8n API call failed: ${endpoint}`, error);
    throw error;
  }
}

// Workflows
export async function getWorkflows(): Promise<N8nWorkflow[]> {
  return fetchN8nAPI('/workflows');
}

export async function getWorkflow(id: string): Promise<N8nWorkflow> {
  return fetchN8nAPI(`/workflows/${id}`);
}

export async function createWorkflow(
  data: Partial<N8nWorkflow>
): Promise<N8nWorkflow> {
  return fetchN8nAPI('/workflows', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateWorkflow(
  id: string,
  data: Partial<N8nWorkflow>
): Promise<N8nWorkflow> {
  return fetchN8nAPI(`/workflows/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteWorkflow(id: string): Promise<void> {
  await fetchN8nAPI(`/workflows/${id}`, {
    method: 'DELETE',
  });
}

export async function activateWorkflow(id: string): Promise<N8nWorkflow> {
  return fetchN8nAPI(`/workflows/${id}/activate`, {
    method: 'POST',
  });
}

export async function deactivateWorkflow(id: string): Promise<N8nWorkflow> {
  return fetchN8nAPI(`/workflows/${id}/deactivate`, {
    method: 'POST',
  });
}

// Executions
export async function getExecutions(
  workflowId?: string
): Promise<N8nExecution[]> {
  const query = workflowId ? `?workflowId=${workflowId}` : '';
  return fetchN8nAPI(`/executions${query}`);
}

export async function getExecution(id: string): Promise<N8nExecution> {
  return fetchN8nAPI(`/executions/${id}`);
}

export async function executeWorkflow(
  workflowId: string,
  data?: any
): Promise<N8nExecution> {
  return fetchN8nAPI(`/workflows/${workflowId}/execute`, {
    method: 'POST',
    body: JSON.stringify({ data }),
  });
}

export async function stopExecution(id: string): Promise<void> {
  await fetchN8nAPI(`/executions/${id}`, {
    method: 'DELETE',
  });
}

// Webhooks (for n8n workflow webhooks)
export async function createWebhookForWorkflow(
  workflowId: string,
  data: {
    path: string;
    method?: string;
    isActive?: boolean;
  }
): Promise<any> {
  return fetchN8nAPI('/webhooks', {
    method: 'POST',
    body: JSON.stringify({
      workflowId,
      ...data,
    }),
  });
}

// Audit event webhook
export async function createAuditWebhook(): Promise<any> {
  return fetchN8nAPI('/webhooks', {
    method: 'POST',
    body: JSON.stringify({
      path: 'audit-complete',
      method: 'POST',
      isActive: true,
    }),
  });
}
