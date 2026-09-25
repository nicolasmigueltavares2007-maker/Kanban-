import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Task, TaskStatus, SupabaseConfig } from '../types/index.ts';

const LOCAL_STORAGE_TASKS_KEY = 'crm_kanban_tasks_local';
const LOCAL_STORAGE_CONFIG_KEY = 'crm_supabase_config';

let cachedClient: SupabaseClient | null = null;
let lastConfigHash: string = '';

export function getStoredSupabaseConfig(): SupabaseConfig | null {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_CONFIG_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.url && parsed.anonKey) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Erro ao ler configuração do Supabase no localStorage', e);
  }

  // Fallback para variáveis de ambiente Vite caso existam
  const envUrl = (import.meta.env.VITE_SUPABASE_URL as string)?.trim();
  const envKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string)?.trim();

  if (envUrl && envKey && !envUrl.includes('seu-projeto') && !envKey.includes('sua-chave')) {
    return {
      url: envUrl,
      anonKey: envKey,
    };
  }

  return null;
}

export function saveSupabaseConfig(config: SupabaseConfig) {
  localStorage.setItem(LOCAL_STORAGE_CONFIG_KEY, JSON.stringify(config));
  cachedClient = null;
  lastConfigHash = '';
}

export function clearSupabaseConfig() {
  localStorage.removeItem(LOCAL_STORAGE_CONFIG_KEY);
  cachedClient = null;
  lastConfigHash = '';
}

export function getSupabaseClient(): SupabaseClient | null {
  const config = getStoredSupabaseConfig();
  if (!config?.url || !config?.anonKey) {
    return null;
  }

  const hash = `${config.url}_${config.anonKey}`;
  if (cachedClient && lastConfigHash === hash) {
    return cachedClient;
  }

  try {
    cachedClient = createClient(config.url, config.anonKey, {
      auth: {
        persistSession: false,
      },
    });
    lastConfigHash = hash;
    return cachedClient;
  } catch (err) {
    console.error('Falha ao inicializar cliente Supabase:', err);
    return null;
  }
}

// Local Storage Handlers (Sem informações modelo / starts empty)
export function getLocalTasks(): Task[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_TASKS_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as Task[];
  } catch (e) {
    console.error('Erro ao ler tarefas locais:', e);
    return [];
  }
}

export function setLocalTasks(tasks: Task[]): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_TASKS_KEY, JSON.stringify(tasks));
  } catch (e) {
    console.error('Erro ao salvar tarefas locais:', e);
  }
}

// Database Service Functions
export async function testSupabaseConnection(configToTest?: SupabaseConfig): Promise<{
  success: boolean;
  message: string;
  tableExists?: boolean;
}> {
  const client = configToTest
    ? createClient(configToTest.url, configToTest.anonKey, { auth: { persistSession: false } })
    : getSupabaseClient();

  if (!client) {
    return {
      success: false,
      message: 'Configuração do Supabase não fornecida.',
    };
  }

  try {
    // Tenta consultar a tabela tasks
    const { data, error } = await client.from('tasks').select('id').limit(1);

    if (error) {
      if (error.code === '42P01' || error.message?.includes('relation "tasks" does not exist') || error.message?.includes('not found')) {
        return {
          success: true,
          tableExists: false,
          message: 'Conectado ao Supabase com sucesso, mas a tabela "tasks" ainda não foi criada.',
        };
      }
      return {
        success: false,
        message: `Erro do Supabase: ${error.message}`,
      };
    }

    return {
      success: true,
      tableExists: true,
      message: `Conectado com sucesso ao Supabase! Tabela "tasks" pronta (${data?.length ?? 0} registros consultados).`,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Falha na conexão com Supabase';
    return {
      success: false,
      message,
    };
  }
}

export async function fetchAllTasks(): Promise<{ tasks: Task[]; source: 'supabase' | 'local'; error?: string }> {
  const client = getSupabaseClient();

  if (!client) {
    return {
      tasks: getLocalTasks(),
      source: 'local',
    };
  }

  try {
    const { data, error } = await client
      .from('tasks')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Erro ao carregar do Supabase, utilizando armazenamento local:', error.message);
      return {
        tasks: getLocalTasks(),
        source: 'local',
        error: error.message,
      };
    }

    // Normaliza tarefas do Supabase
    const mapped: Task[] = (data || []).map((row: any) => ({
      id: String(row.id),
      title: row.title || 'Sem título',
      description: row.description || '',
      status: (['Não iniciado', 'Em Andamento', 'Finalizado'].includes(row.status)
        ? row.status
        : 'Não iniciado') as TaskStatus,
      priority: row.priority || 'Média',
      client_name: row.client_name || '',
      client_email: row.client_email || '',
      client_phone: row.client_phone || '',
      value: typeof row.value === 'number' ? row.value : parseFloat(row.value) || 0,
      due_date: row.due_date || '',
      tags: Array.isArray(row.tags) ? row.tags : [],
      created_at: row.created_at || new Date().toISOString(),
      updated_at: row.updated_at || new Date().toISOString(),
    }));

    // Mantém backup local em sincronia
    setLocalTasks(mapped);

    return {
      tasks: mapped,
      source: 'supabase',
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro ao conectar ao Supabase';
    return {
      tasks: getLocalTasks(),
      source: 'local',
      error: message,
    };
  }
}

export async function createTaskInDb(task: Task): Promise<{ task: Task; source: 'supabase' | 'local' }> {
  // Salva localmente primeiro
  const localList = getLocalTasks();
  const updatedLocal = [task, ...localList.filter((t) => t.id !== task.id)];
  setLocalTasks(updatedLocal);

  const client = getSupabaseClient();
  if (!client) {
    return { task, source: 'local' };
  }

  try {
    const { error } = await client.from('tasks').insert([
      {
        id: task.id,
        title: task.title,
        description: task.description || '',
        status: task.status,
        priority: task.priority,
        client_name: task.client_name || null,
        client_email: task.client_email || null,
        client_phone: task.client_phone || null,
        value: task.value || 0,
        due_date: task.due_date || null,
        tags: task.tags || [],
        created_at: task.created_at,
        updated_at: task.updated_at,
      },
    ]);

    if (error) {
      console.error('Erro ao inserir no Supabase, mantido em cache local:', error.message);
      return { task, source: 'local' };
    }

    return { task, source: 'supabase' };
  } catch (err) {
    console.error('Exceção ao inserir no Supabase:', err);
    return { task, source: 'local' };
  }
}

export async function updateTaskInDb(
  id: string,
  updates: Partial<Task>
): Promise<{ updated: Task | null; source: 'supabase' | 'local' }> {
  const localList = getLocalTasks();
  let updatedTask: Task | null = null;

  const newLocal = localList.map((t) => {
    if (t.id === id) {
      updatedTask = {
        ...t,
        ...updates,
        updated_at: new Date().toISOString(),
      };
      return updatedTask;
    }
    return t;
  });

  setLocalTasks(newLocal);

  const client = getSupabaseClient();
  if (!client) {
    return { updated: updatedTask, source: 'local' };
  }

  try {
    const payload: any = {
      ...updates,
      updated_at: new Date().toISOString(),
    };
    delete payload.id;

    const { error } = await client.from('tasks').update(payload).eq('id', id);

    if (error) {
      console.warn('Erro ao atualizar no Supabase, atualizado localmente:', error.message);
      return { updated: updatedTask, source: 'local' };
    }

    return { updated: updatedTask, source: 'supabase' };
  } catch (err) {
    console.error('Falha na atualização com Supabase:', err);
    return { updated: updatedTask, source: 'local' };
  }
}

export async function deleteTaskFromDb(id: string): Promise<{ success: boolean; source: 'supabase' | 'local' }> {
  const localList = getLocalTasks();
  setLocalTasks(localList.filter((t) => t.id !== id));

  const client = getSupabaseClient();
  if (!client) {
    return { success: true, source: 'local' };
  }

  try {
    const { error } = await client.from('tasks').delete().eq('id', id);
    if (error) {
      console.warn('Erro ao excluir no Supabase:', error.message);
      return { success: true, source: 'local' };
    }
    return { success: true, source: 'supabase' };
  } catch (err) {
    console.error('Falha ao excluir no Supabase:', err);
    return { success: true, source: 'local' };
  }
}

export const SUPABASE_SQL_SETUP = `-- Script SQL para criar a tabela no Supabase SQL Editor
-- Acesse seu painel no Supabase > SQL Editor > Nova Consulta (New query) e execute:

CREATE TABLE IF NOT EXISTS public.tasks (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  status TEXT NOT NULL CHECK (status IN ('Não iniciado', 'Em Andamento', 'Finalizado')),
  priority TEXT DEFAULT 'Média',
  client_name TEXT,
  client_email TEXT,
  client_phone TEXT,
  value NUMERIC DEFAULT 0,
  due_date TEXT,
  tags JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ativar segurança em nível de linha (Row Level Security)
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- Política para permitir que o cliente anônimo leia, crie, edite e delete tarefas:
CREATE POLICY "Permitir acesso completo a tarefas" 
ON public.tasks 
FOR ALL 
TO anon, authenticated 
USING (true) 
WITH CHECK (true);
`;
