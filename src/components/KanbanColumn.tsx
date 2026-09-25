import React, { useState } from 'react';
import { Plus, CircleDot, Clock, CheckCircle2 } from 'lucide-react';
import { Task, TaskStatus } from '../types/index.ts';
import { TaskCard } from './TaskCard.tsx';

interface KanbanColumnProps {
  status: TaskStatus;
  tasks: Task[];
  onAddTask: (status: TaskStatus) => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (id: string) => void;
  onStatusChange: (id: string, newStatus: TaskStatus) => void;
}

export const KanbanColumn: React.FC<KanbanColumnProps> = ({
  status,
  tasks,
  onAddTask,
  onEditTask,
  onDeleteTask,
  onStatusChange,
}) => {
  const [isOver, setIsOver] = useState(false);

  const columnConfig: Record<
    TaskStatus,
    {
      title: string;
      color: string;
      badgeBg: string;
      borderActive: string;
      icon: React.ReactNode;
      accentBar: string;
    }
  > = {
    'Não iniciado': {
      title: 'Não iniciado',
      color: 'text-amber-300',
      badgeBg: 'bg-amber-950/70 text-amber-300 border-amber-800/60',
      borderActive: 'border-amber-500/50 bg-amber-950/20',
      icon: <CircleDot className="w-4 h-4 text-amber-400" />,
      accentBar: 'bg-amber-500',
    },
    'Em Andamento': {
      title: 'Em Andamento',
      color: 'text-blue-300',
      badgeBg: 'bg-blue-950/70 text-blue-300 border-blue-800/60',
      borderActive: 'border-blue-500/50 bg-blue-950/20',
      icon: <Clock className="w-4 h-4 text-blue-400" />,
      accentBar: 'bg-blue-500',
    },
    'Finalizado': {
      title: 'Finalizado',
      color: 'text-emerald-300',
      badgeBg: 'bg-emerald-950/70 text-emerald-300 border-emerald-800/60',
      borderActive: 'border-emerald-500/50 bg-emerald-950/20',
      icon: <CheckCircle2 className="w-4 h-4 text-emerald-400" />,
      accentBar: 'bg-emerald-500',
    },
  };

  const currentConfig = columnConfig[status];

  const totalValue = tasks.reduce((sum, t) => sum + (t.value || 0), 0);
  const formattedTotalValue =
    totalValue > 0
      ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalValue)
      : null;

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (!isOver) setIsOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    // Only set false if leaving the actual column container
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsOver(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsOver(false);
    const taskId = e.dataTransfer.getData('text/plain');
    if (taskId) {
      onStatusChange(taskId, status);
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`flex flex-col flex-1 min-w-[320px] max-w-[440px] bg-slate-900/60 rounded-2xl border transition-all duration-200 overflow-hidden ${
        isOver
          ? `${currentConfig.borderActive} ring-2 ring-blue-500/30 scale-[1.005]`
          : 'border-slate-800/80 hover:border-slate-700/70'
      }`}
    >
      {/* Top accent bar */}
      <div className={`h-1.5 w-full ${currentConfig.accentBar}`} />

      {/* Column Header */}
      <div className="p-4 border-b border-slate-800/60 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {currentConfig.icon}
          <h2 className="font-bold text-sm text-slate-100 tracking-tight">
            {currentConfig.title}
          </h2>
          <span
            className={`text-xs px-2 py-0.5 rounded-full font-semibold border ${currentConfig.badgeBg}`}
          >
            {tasks.length}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {formattedTotalValue && (
            <span className="text-xs font-semibold text-slate-400 bg-slate-800/60 px-2 py-0.5 rounded-md border border-slate-700/50">
              {formattedTotalValue}
            </span>
          )}

          <button
            type="button"
            onClick={() => onAddTask(status)}
            title={`Adicionar tarefa em ${status}`}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Tasks List */}
      <div className="flex-1 p-3 space-y-3 overflow-y-auto max-h-[calc(100vh-230px)] min-h-[380px]">
        {tasks.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center p-6 text-center border-2 border-dashed border-slate-800/70 rounded-xl my-2">
            <div className="w-10 h-10 rounded-full bg-slate-800/50 flex items-center justify-center text-slate-500 mb-2">
              {currentConfig.icon}
            </div>
            <p className="text-xs font-medium text-slate-400 mb-1">
              Nenhuma tarefa em {status}
            </p>
            <p className="text-[11px] text-slate-500 mb-3">
              Arraste um card até aqui ou crie uma nova tarefa.
            </p>
            <button
              type="button"
              onClick={() => onAddTask(status)}
              className="inline-flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 font-medium bg-blue-950/50 hover:bg-blue-900/60 border border-blue-800/50 px-3 py-1.5 rounded-lg transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Criar tarefa
            </button>
          </div>
        ) : (
          tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onEdit={onEditTask}
              onDelete={onDeleteTask}
              onStatusChange={onStatusChange}
            />
          ))
        )}
      </div>
    </div>
  );
};
