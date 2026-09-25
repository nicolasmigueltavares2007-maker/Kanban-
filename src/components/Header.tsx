import React from 'react';
import {
  Plus,
  Search,
  Filter,
  Database,
  BarChart3,
  DollarSign,
  CheckCircle2,
  ListTodo
} from 'lucide-react';
import { Priority, Task } from '../types/index.ts';

interface HeaderProps {
  tasks: Task[];
  searchQuery: string;
  onSearchChange: (q: string) => void;
  selectedPriority: Priority | 'Todas';
  onPriorityChange: (p: Priority | 'Todas') => void;
  onOpenNewTaskModal: () => void;
  onOpenSupabaseModal: () => void;
  isSupabaseConnected: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  tasks,
  searchQuery,
  onSearchChange,
  selectedPriority,
  onPriorityChange,
  onOpenNewTaskModal,
  onOpenSupabaseModal,
  isSupabaseConnected,
}) => {
  const totalTasks = tasks.length;
  const finishedTasks = tasks.filter((t) => t.status === 'Finalizado').length;
  const inProgressTasks = tasks.filter((t) => t.status === 'Em Andamento').length;
  const pipelineValue = tasks.reduce((acc, t) => acc + (t.value || 0), 0);

  const formattedPipelineValue = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  }).format(pipelineValue);

  return (
    <header className="border-b border-slate-850 bg-slate-900/80 backdrop-blur-md sticky top-0 z-30">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-4">
        {/* Top row: Brand & Actions */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/25">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl font-extrabold text-white tracking-tight">
                  CRM Kanban
                </h1>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700/60">
                  Pipeline de Tarefas
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Gestão manual de oportunidades e fluxo de trabalho
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Supabase status button */}
            <button
              type="button"
              onClick={onOpenSupabaseModal}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
                isSupabaseConnected
                  ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300 hover:bg-emerald-950/70'
                  : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Database className={`w-3.5 h-3.5 ${isSupabaseConnected ? 'text-emerald-400' : 'text-slate-400'}`} />
              <span>{isSupabaseConnected ? 'Supabase Conectado' : 'Conectar Supabase'}</span>
              <span
                className={`w-2 h-2 rounded-full ${
                  isSupabaseConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
                }`}
              />
            </button>

            {/* + New Task Button */}
            <button
              type="button"
              onClick={onOpenNewTaskModal}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 active:scale-95 transition-all shadow-lg shadow-blue-600/30"
            >
              <Plus className="w-4 h-4" />
              <span>Nova Tarefa</span>
            </button>
          </div>
        </div>

        {/* Middle row: KPI summary badges */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-4 pt-3 border-t border-slate-800/50">
          <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-slate-950/60 border border-slate-800/80">
            <ListTodo className="w-4 h-4 text-blue-400" />
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Total Tarefas</span>
              <span className="text-sm font-bold text-slate-100">{totalTasks}</span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-slate-950/60 border border-slate-800/80">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shrink-0" />
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Em Andamento</span>
              <span className="text-sm font-bold text-slate-100">{inProgressTasks}</span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-slate-950/60 border border-slate-800/80">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Finalizadas</span>
              <span className="text-sm font-bold text-emerald-400">{finishedTasks}</span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-slate-950/60 border border-slate-800/80">
            <DollarSign className="w-4 h-4 text-emerald-400" />
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Total Pipeline</span>
              <span className="text-sm font-bold text-slate-100">{formattedPipelineValue}</span>
            </div>
          </div>
        </div>

        {/* Filter bar */}
        <div className="flex flex-col sm:flex-row items-center gap-3 mt-3.5 pt-2">
          {/* Search Input */}
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Buscar por título, cliente, telefone ou tag..."
              className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl pl-9 pr-3.5 py-2 text-xs text-slate-100 placeholder-slate-500 outline-none transition-colors"
            />
          </div>

          {/* Priority filter */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="text-xs text-slate-400 hidden sm:inline">Prioridade:</span>
            <select
              value={selectedPriority}
              onChange={(e) => onPriorityChange(e.target.value as Priority | 'Todas')}
              className="bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-xl px-3 py-2 outline-none focus:border-blue-500 transition-colors w-full sm:w-auto cursor-pointer"
            >
              <option value="Todas">Todas as Prioridades</option>
              <option value="Baixa">Baixa</option>
              <option value="Média">Média</option>
              <option value="Alta">Alta</option>
              <option value="Urgente">Urgente</option>
            </select>
          </div>
        </div>
      </div>
    </header>
  );
};
