export interface ExecutionResult {
  output?: string;
  error?: string;
  status: 'success' | 'error' | 'timeout';
  executionTime: number;
  memoryUsed: number;
  cpuUsed: number;
  exitCode?: number;
}