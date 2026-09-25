/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Task, TaskStatus, Priority, STATUS_LIST } from './types/index.ts';
import {
  fetchAllTasks,
  createTaskInDb,
  updateTaskInDb,
  deleteTaskFromDb,
  getStoredSupabaseConfig,
  getSupabaseClient,
  getLocalTasks,
} from './services/supabase.ts';
import { Header } from './components/Header.tsx';
import { KanbanColumn } from './components/KanbanColumn.tsx';
import { TaskModal } from './components/TaskModal.tsx';
import { SupabaseModal } from './components/SupabaseModal.tsx';
import { Plus, Database, Sparkles, CheckCircle2 } from 'lucide-react';

export default function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPriority, setSelectedPriority] = useState<Priority | 'Todas'>('Todas');

  // Modals state
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isSupabaseModalOpen, setIsSupabaseModalOpen] = useState(false);
  const [taskModalInitialStatus, setTaskModalInitialStatus] = useState<TaskStatus>('Não iniciado');
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  // Connection indicator
  const [isSupabaseConnected, setIsSupabaseConnected] = useState(false);
  const [feedbackNotification, setFeedbackNotification] = useState<string | null>(null);

  const showNotification = (msg: string) => {
    setFeedbackNotification(msg);
    setTimeout(() => {
      setFeedbackNotification(null);
    }, 3500);
  };

  const checkConnectionStatus = useCallback(() => {
    const config = getStoredSupabaseConfig();
    setIsSupabaseConnected(Boolean(config?.url && config?.anonKey));
  }, []);

  const loadTasks = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchAllTasks();
      setTasks(res.tasks);
      checkConnectionStatus();
    } catch (err) {
      console.error('Erro ao carregar tarefas:', err);
    } finally {
      setLoading(false);
    }
  }, [checkConnectionStatus]);

  useEffect(() => {
    loadTasks();
    checkConnectionStatus();
  }, [loadTasks, checkConnectionStatus]);

  // Handle Create or Update
  const handleSaveTask = async (
    taskData: Omit<Task, 'id' | 'created_at' | 'updated_at'> & { id?: string }
  ) => {
    if (taskData.id) {
      // Update existing task
      const { updated } = await updateTaskInDb(taskData.id, taskData);
      if (updated) {
        setTasks((prev) => prev.map((t) => (t.id === taskData.id ? updated! : t)));
        showNotification('Tarefa atualizada com sucesso!');
      }
    } else {
      // Create new task manually
      const newTask: Task = {
        id: 'task_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
        title: taskData.title,
        description: taskData.description || '',
        status: taskData.status,
        priority: taskData.priority,
        client_name: taskData.client_name,
        client_email: taskData.client_email,
        client_phone: taskData.client_phone,
        value: taskData.value,
        due_date: taskData.due_date,
        tags: taskData.tags,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { task } = await createTaskInDb(newTask);
      setTasks((prev) => [task, ...prev]);
      showNotification('Nova tarefa criada com sucesso!');
    }
  };

  // Handle Status Change (Drag & drop or quick transition buttons)
  const handleStatusChange = async (id: string, newStatus: TaskStatus) => {
    // Optimistic UI update
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status: newStatus, updated_at: new Date().toISOString() } : t))
    );

    const { updated } = await updateTaskInDb(id, { status: newStatus });
    if (updated) {
      setTasks((prev) => prev.map((t) => (t.id === id ? updated! : t)));
      showNotification(`Status alterado para "${newStatus}"!`);
    }
  };

  // Handle Delete
  const handleDeleteTask = async (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
    await deleteTaskFromDb(id);
    showNotification('Tarefa excluída.');
  };

  // Open Task Modal to create
  const handleOpenCreateModal = (status: TaskStatus = 'Não iniciado') => {
    setEditingTask(null);
    setTaskModalInitialStatus(status);
    setIsTaskModalOpen(true);
  };

  // Open Task Modal to edit
  const handleOpenEditModal = (task: Task) => {
    setEditingTask(task);
    setIsTaskModalOpen(true);
  };

  // Sync Local Tasks to Supabase
  const handleSyncLocalToDb = async () => {
    const client = getSupabaseClient();
    if (!client) return;

    const localList = getLocalTasks();
    if (localList.length === 0) return;

    let synced = 0;
    for (const t of localList) {
      await createTaskInDb(t);
      synced++;
    }

    showNotification(`${synced} tarefas sincronizadas com o Supabase com sucesso!`);
    await loadTasks();
  };

  // Filter tasks based on search & priority
  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      const matchesPriority =
        selectedPriority === 'Todas' || t.priority === selectedPriority;

      if (!matchesPriority) return false;

      if (!searchQuery.trim()) return true;

      const q = searchQuery.toLowerCase();
      const matchTitle = t.title.toLowerCase().includes(q);
      const matchDesc = t.description?.toLowerCase().includes(q);
      const matchClient = t.client_name?.toLowerCase().includes(q);
      const matchPhone = t.client_phone?.toLowerCase().includes(q);
      const matchTags = t.tags?.some((tag) => tag.toLowerCase().includes(q));

      return matchTitle || matchDesc || matchClient || matchPhone || matchTags;
    });
  }, [tasks, searchQuery, selectedPriority]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* Top Header */}
      <Header
        tasks={tasks}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedPriority={selectedPriority}
        onPriorityChange={setSelectedPriority}
        onOpenNewTaskModal={() => handleOpenCreateModal('Não iniciado')}
        onOpenSupabaseModal={() => setIsSupabaseModalOpen(true)}
        isSupabaseConnected={isSupabaseConnected}
      />

      {/* Toast Notification */}
      {feedbackNotification && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 bg-slate-900 border border-slate-700 text-slate-100 rounded-xl shadow-2xl animate-in slide-in-from-bottom-5 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="text-xs font-medium">{feedbackNotification}</span>
        </div>
      )}

      {/* Main Kanban Content */}
      <main className="flex-1 max-w-[1600px] w-full mx-auto p-4 sm:p-6 overflow-x-auto">
        {loading ? (
          <div className="h-64 flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs text-slate-400">Carregando CRM...</p>
            </div>
          </div>
        ) : tasks.length === 0 ? (
          /* Zero dummy data initial view */
          <div className="my-10 max-w-xl mx-auto text-center p-8 bg-slate-900/50 border border-slate-800 rounded-3xl backdrop-blur-sm">
            <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-blue-950/70 border border-blue-800/60 flex items-center justify-center text-blue-400">
              <Sparkles className="w-7 h-7" />
            </div>
            <h2 className="text-lg font-bold text-white mb-2">
              Seu Kanban está pronto e sem dados modelo
            </h2>
            <p className="text-xs text-slate-400 leading-relaxed mb-6">
              Nenhuma informação fictícia foi criada. Crie suas tarefas manualmente para organizar
              seus atendimentos nos status <strong className="text-slate-200">Não iniciado</strong>,{' '}
              <strong className="text-slate-200">Em Andamento</strong> e{' '}
              <strong className="text-slate-200">Finalizado</strong>.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => handleOpenCreateModal('Não iniciado')}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 active:scale-95 text-white text-xs font-bold rounded-xl shadow-lg shadow-blue-600/30 transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Criar Primeira Tarefa</span>
              </button>

              <button
                type="button"
                onClick={() => setIsSupabaseModalOpen(true)}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 bg-slate-800 hover:bg-slate-750 text-slate-200 hover:text-white text-xs font-semibold rounded-xl border border-slate-700 transition-colors"
              >
                <Database className="w-4 h-4 text-emerald-400" />
                <span>{isSupabaseConnected ? 'Ver Conexão Supabase' : 'Conectar ao Supabase'}</span>
              </button>
            </div>
          </div>
        ) : (
          /* Kanban Board Columns */
          <div className="flex gap-5 items-start justify-start pb-6">
            {STATUS_LIST.map((status) => {
              const columnTasks = filteredTasks.filter((t) => t.status === status);
              return (
                <KanbanColumn
                  key={status}
                  status={status}
                  tasks={columnTasks}
                  onAddTask={handleOpenCreateModal}
                  onEditTask={handleOpenEditModal}
                  onDeleteTask={handleDeleteTask}
                  onStatusChange={handleStatusChange}
                />
              );
            })}
          </div>
        )}
      </main>

      {/* Task Create / Edit Modal */}
      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => {
          setIsTaskModalOpen(false);
          setEditingTask(null);
        }}
        onSave={handleSaveTask}
        onDelete={handleDeleteTask}
        initialStatus={taskModalInitialStatus}
        taskToEdit={editingTask}
      />

      {/* Supabase Settings / Sync Modal */}
      <SupabaseModal
        isOpen={isSupabaseModalOpen}
        onClose={() => setIsSupabaseModalOpen(false)}
        onConnectionChange={() => {
          checkConnectionStatus();
          loadTasks();
        }}
        onSyncLocalToDb={handleSyncLocalToDb}
        localTaskCount={tasks.length}
      />
    </div>
  );
}
