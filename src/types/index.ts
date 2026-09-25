export type TaskStatus = 'Não iniciado' | 'Em Andamento' | 'Finalizado';

export const STATUS_LIST: TaskStatus[] = ['Não iniciado', 'Em Andamento', 'Finalizado'];

export type Priority = 'Baixa' | 'Média' | 'Alta' | 'Urgente';

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: Priority;
  client_name?: string;
  client_email?: string;
  client_phone?: string;
  value?: number;
  due_date?: string;
  tags?: string[];
  created_at: string;
  updated_at: string;
}

export interface SupabaseConfig {
  url: string;
  anonKey: string;
}
