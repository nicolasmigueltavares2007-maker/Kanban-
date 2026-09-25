import React, { useState } from 'react';
import {
  Calendar,
  DollarSign,
  User,
  Phone,
  Mail,
  MoreVertical,
  Edit2,
  Trash2,
  ArrowRight,
  ArrowLeft,
  Tag,
  CheckCircle2,
  Clock,
  CircleDot
} from 'lucide-react';
import { Task, TaskStatus, Priority, STATUS_LIST } from '../types/index.ts';

interface TaskCardProps {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  onStatusChange: (id: string, newStatus: TaskStatus) => void;
  isDragging?: boolean;
}

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  onEdit,
  onDelete,
  onStatusChange,
}) => {
  const [showMenu, setShowMenu] = useState(false);

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('text/plain', task.id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const priorityStyles: Record<Priority, { bg: string; text: string; border: string }> = {
    Baixa: {
      bg: 'bg-slate-800/80',
      text: 'text-slate-300',
      border: 'border-slate-700',
    },
    Média: {
      bg: 'bg-blue-950/60',
      text: 'text-blue-300',
      border: 'border-blue-800/50',
    },
    Alta: {
      bg: 'bg-amber-950/60',
      text: 'text-amber-300',
      border: 'border-amber-700/50',
    },
    Urgente: {
      bg: 'bg-rose-950/70',
      text: 'text-rose-300',
      border: 'border-rose-700/60',
    },
  };

  const formatCurrency = (val?: number) => {
    if (val === undefined || isNaN(val) || val === 0) return null;
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(val);
  };

  const isOverdue = () => {
    if (!task.due_date || task.status === 'Finalizado') return false;
    const today = new Date().toISOString().split('T')[0];
    return task.due_date < today;
  };

  const isDueToday = () => {
    if (!task.due_date || task.status === 'Finalizado') return false;
    const today = new Date().toISOString().split('T')[0];
    return task.due_date === today;
  };

  const getNextStatus = (): TaskStatus | null => {
    if (task.status === 'Não iniciado') return 'Em Andamento';
    if (task.status === 'Em Andamento') return 'Finalizado';
    return null;
  };

  const getPrevStatus = (): TaskStatus | null => {
    if (task.status === 'Finalizado') return 'Em Andamento';
    if (task.status === 'Em Andamento') return 'Não iniciado';
    return null;
  };

  const nextStatus = getNextStatus();
  const prevStatus = getPrevStatus();
  const priorityStyle = priorityStyles[task.priority] || priorityStyles.Média;
  const formattedValue = formatCurrency(task.value);

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      className="group relative bg-slate-900/90 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-150 cursor-grab active:cursor-grabbing select-none"
    >
      {/* Top row: Priority & Options */}
      <div className="flex items-center justify-between gap-2 mb-2.5">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span
            className={`text-xs px-2 py-0.5 rounded-md font-medium border ${priorityStyle.bg} ${priorityStyle.text} ${priorityStyle.border}`}
          >
            {task.priority}
          </span>

          {formattedValue && (
            <span className="flex items-center text-xs font-semibold text-emerald-400 bg-emerald-950/60 border border-emerald-800/40 px-2 py-0.5 rounded-md">
              <DollarSign className="w-3 h-3 mr-0.5" />
              {formattedValue}
            </span>
          )}
        </div>

        <div className="relative">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setShowMenu(!showMenu);
            }}
            aria-label="Opções da tarefa"
            className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <MoreVertical className="w-4 h-4" />
          </button>

          {showMenu && (
            <>
              <div
                className="fixed inset-0 z-20"
                onClick={() => setShowMenu(false)}
              />
              <div className="absolute right-0 top-7 w-48 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl py-1.5 z-30 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setShowMenu(false);
                    onEdit(task);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  Editar Detalhes
                </button>

                <div className="border-t border-slate-800 my-1" />

                <div className="px-3 py-1 text-[10px] uppercase tracking-wider text-slate-500 font-semibold">
                  Mudar status
                </div>
                {STATUS_LIST.map((st) => (
                  <button
                    key={st}
                    type="button"
                    disabled={task.status === st}
                    onClick={() => {
                      setShowMenu(false);
                      onStatusChange(task.id, st);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-1.5 text-left transition-colors ${
                      task.status === st
                        ? 'text-slate-500 cursor-default bg-slate-800/30'
                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <span>{st}</span>
                    {task.status === st && <span className="text-[10px] text-blue-400 font-medium">Atual</span>}
                  </button>
                ))}

                <div className="border-t border-slate-800 my-1" />

                <button
                  type="button"
                  onClick={() => {
                    setShowMenu(false);
                    onDelete(task.id);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-rose-400 hover:bg-rose-950/40 hover:text-rose-300 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Excluir Tarefa
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Title */}
      <h3
        onClick={() => onEdit(task)}
        className="font-semibold text-slate-100 text-sm leading-snug hover:text-blue-400 transition-colors cursor-pointer mb-2"
      >
        {task.title}
      </h3>

      {/* Description preview if exists */}
      {task.description && (
        <p className="text-xs text-slate-400 line-clamp-2 mb-3 leading-relaxed">
          {task.description}
        </p>
      )}

      {/* CRM Client Information if filled */}
      {(task.client_name || task.client_phone || task.client_email) && (
        <div className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-2.5 mb-3 text-xs space-y-1">
          {task.client_name && (
            <div className="flex items-center gap-1.5 text-slate-300 font-medium truncate">
              <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="truncate">{task.client_name}</span>
            </div>
          )}
          {task.client_phone && (
            <div className="flex items-center gap-1.5 text-slate-400 truncate">
              <Phone className="w-3 h-3 text-slate-500 shrink-0" />
              <span className="truncate text-[11px]">{task.client_phone}</span>
            </div>
          )}
          {task.client_email && (
            <div className="flex items-center gap-1.5 text-slate-400 truncate">
              <Mail className="w-3 h-3 text-slate-500 shrink-0" />
              <span className="truncate text-[11px]">{task.client_email}</span>
            </div>
          )}
        </div>
      )}

      {/* Tags */}
      {task.tags && task.tags.length > 0 && (
        <div className="flex items-center gap-1 flex-wrap mb-3">
          {task.tags.map((tag, idx) => (
            <span
              key={idx}
              className="inline-flex items-center gap-1 text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full border border-slate-700/50"
            >
              <Tag className="w-2.5 h-2.5 text-slate-500" />
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Bottom Footer: Due Date and Quick Move Buttons */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-xs">
        {task.due_date ? (
          <div
            className={`inline-flex items-center gap-1 text-[11px] font-medium ${
              isOverdue()
                ? 'text-rose-400'
                : isDueToday()
                ? 'text-amber-400'
                : 'text-slate-400'
            }`}
          >
            <Calendar className="w-3 h-3" />
            <span>
              {new Date(task.due_date + 'T12:00:00').toLocaleDateString('pt-BR')}
            </span>
            {isOverdue() && <span className="text-[10px] uppercase font-bold">(Atrasado)</span>}
            {isDueToday() && <span className="text-[10px] uppercase font-bold">(Hoje)</span>}
          </div>
        ) : (
          <span className="text-[11px] text-slate-500">Sem prazo</span>
        )}

        {/* Quick status transition action buttons */}
        <div className="flex items-center gap-1">
          {prevStatus && (
            <button
              type="button"
              title={`Mover de volta para: ${prevStatus}`}
              onClick={(e) => {
                e.stopPropagation();
                onStatusChange(task.id, prevStatus);
              }}
              className="p-1 rounded-md text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
            </button>
          )}

          {nextStatus && (
            <button
              type="button"
              title={`Avançar para: ${nextStatus}`}
              onClick={(e) => {
                e.stopPropagation();
                onStatusChange(task.id, nextStatus);
              }}
              className="flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-md text-blue-300 hover:text-white bg-blue-950/80 hover:bg-blue-900 border border-blue-800/60 transition-all"
            >
              <span>Avançar</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          )}

          {task.status === 'Finalizado' && (
            <span className="flex items-center text-emerald-400 text-[11px] font-medium gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Concluído
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
