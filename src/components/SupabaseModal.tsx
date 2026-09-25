import React, { useState, useEffect } from 'react';
import {
  X,
  Database,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  HardDrive
} from 'lucide-react';
import {
  getStoredSupabaseConfig,
  saveSupabaseConfig,
  clearSupabaseConfig,
  testSupabaseConnection,
  SUPABASE_SQL_SETUP
} from '../services/supabase.ts';
import { SupabaseConfig } from '../types/index.ts';

interface SupabaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnectionChange: () => void;
  onSyncLocalToDb: () => Promise<void>;
  localTaskCount: number;
}

export const SupabaseModal: React.FC<SupabaseModalProps> = ({
  isOpen,
  onClose,
  onConnectionChange,
  onSyncLocalToDb,
  localTaskCount,
}) => {
  const [url, setUrl] = useState('');
  const [anonKey, setAnonKey] = useState('');
  const [testing, setTesting] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
    tableExists?: boolean;
  } | null>(null);
  const [copiedSql, setCopiedSql] = useState(false);
  const [showSql, setShowSql] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const config = getStoredSupabaseConfig();
      if (config) {
        setUrl(config.url);
        setAnonKey(config.anonKey);
      } else {
        setUrl('');
        setAnonKey('');
      }
      setTestResult(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleTestConnection = async () => {
    if (!url.trim() || !anonKey.trim()) {
      setTestResult({
        success: false,
        message: 'Por favor, informe a URL do projeto e a chave anônima (anon public key).',
      });
      return;
    }

    setTesting(true);
    setTestResult(null);

    const testCfg: SupabaseConfig = {
      url: url.trim(),
      anonKey: anonKey.trim(),
    };

    const res = await testSupabaseConnection(testCfg);
    setTesting(false);
    setTestResult(res);

    if (res.success) {
      saveSupabaseConfig(testCfg);
      onConnectionChange();
    }
  };

  const handleSaveAndConnect = async () => {
    if (!url.trim() || !anonKey.trim()) {
      setTestResult({
        success: false,
        message: 'Preencha a URL e a Chave do Supabase para conectar.',
      });
      return;
    }

    setTesting(true);
    const testCfg: SupabaseConfig = {
      url: url.trim(),
      anonKey: anonKey.trim(),
    };
    const res = await testSupabaseConnection(testCfg);
    setTesting(false);
    setTestResult(res);

    if (res.success) {
      saveSupabaseConfig(testCfg);
      onConnectionChange();
      setTimeout(() => {
        onClose();
      }, 1200);
    }
  };

  const handleDisconnect = () => {
    clearSupabaseConfig();
    setUrl('');
    setAnonKey('');
    setTestResult({
      success: true,
      message: 'Desconectado do Supabase. O CRM continuará funcionando com armazenamento local no seu navegador.',
    });
    onConnectionChange();
  };

  const handleCopySql = () => {
    navigator.clipboard.writeText(SUPABASE_SQL_SETUP);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2500);
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      await onSyncLocalToDb();
    } finally {
      setSyncing(false);
    }
  };

  const activeConfig = getStoredSupabaseConfig();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-950/80 text-emerald-400 border border-emerald-800/60">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                Conexão com Banco de Dados Supabase
              </h2>
              <p className="text-xs text-slate-400">
                Sincronize suas tarefas em tempo real com seu PostgreSQL no Supabase.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Status Badge */}
          <div
            className={`p-3.5 rounded-xl border flex items-center justify-between ${
              activeConfig
                ? 'bg-emerald-950/30 border-emerald-800/50 text-emerald-300'
                : 'bg-slate-950 border-slate-800 text-slate-300'
            }`}
          >
            <div className="flex items-center gap-2.5 text-xs font-medium">
              {activeConfig ? (
                <>
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Conectado ao Supabase: <strong className="font-semibold text-white">{activeConfig.url}</strong></span>
                </>
              ) : (
                <>
                  <HardDrive className="w-4 h-4 text-blue-400" />
                  <span>Modo Local Ativo (Tarefas salvas no navegador)</span>
                </>
              )}
            </div>

            {activeConfig && (
              <button
                type="button"
                onClick={handleDisconnect}
                className="text-[11px] text-rose-400 hover:text-rose-300 underline font-medium"
              >
                Desconectar
              </button>
            )}
          </div>

          {/* Test connection feedback */}
          {testResult && (
            <div
              className={`p-3.5 rounded-xl border text-xs flex items-start gap-2.5 ${
                testResult.success
                  ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300'
                  : 'bg-rose-950/40 border-rose-800/60 text-rose-300'
              }`}
            >
              {testResult.success ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              )}
              <div className="space-y-1">
                <p className="font-medium">{testResult.message}</p>
                {testResult.tableExists === false && (
                  <p className="text-[11px] text-amber-300">
                    Aviso: Crie a tabela &quot;tasks&quot; no SQL Editor do Supabase usando o script abaixo para salvar dados.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Inputs */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Project URL (URL do Projeto Supabase)
              </label>
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://exemplo-app.supabase.co"
                className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-600 outline-none font-mono"
              />
              <span className="text-[11px] text-slate-500 mt-1 block">
                Encontrada em: Supabase Dashboard &gt; Project Settings &gt; API &gt; Project URL
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Anon Public Key (Chave Anônima Pública)
              </label>
              <input
                type="password"
                value={anonKey}
                onChange={(e) => setAnonKey(e.target.value)}
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6..."
                className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-600 outline-none font-mono"
              />
              <span className="text-[11px] text-slate-500 mt-1 block">
                Encontrada em: Supabase Dashboard &gt; Project Settings &gt; API &gt; anon public
              </span>
            </div>
          </div>

          {/* Sync local tasks to Supabase if any */}
          {activeConfig && localTaskCount > 0 && (
            <div className="p-3.5 bg-slate-950/70 border border-slate-800 rounded-xl flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-200">
                  {localTaskCount} tarefa(s) criadas localmente
                </p>
                <p className="text-[11px] text-slate-400">
                  Deseja exportar e sincronizar as tarefas locais para o seu Supabase?
                </p>
              </div>
              <button
                type="button"
                onClick={handleSync}
                disabled={syncing}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-400 bg-emerald-950/60 hover:bg-emerald-900/60 border border-emerald-800/60 rounded-lg transition-colors"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
                <span>{syncing ? 'Enviando...' : 'Sincronizar'}</span>
              </button>
            </div>
          )}

          {/* SQL Setup Helper */}
          <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950/50">
            <button
              type="button"
              onClick={() => setShowSql(!showSql)}
              className="w-full flex items-center justify-between p-3.5 text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800/40 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Database className="w-3.5 h-3.5 text-emerald-400" />
                <span>Script SQL de criação da tabela (Supabase SQL Editor)</span>
              </div>
              <span className="text-[11px] text-slate-400">
                {showSql ? 'Ocultar' : 'Ver SQL'}
              </span>
            </button>

            {showSql && (
              <div className="p-3.5 pt-0 border-t border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span>Execute este script no painel do Supabase:</span>
                  <button
                    type="button"
                    onClick={handleCopySql}
                    className="flex items-center gap-1 text-emerald-400 hover:text-emerald-300 font-medium py-1 px-2 rounded hover:bg-emerald-950/40 transition-colors"
                  >
                    {copiedSql ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Copiado!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copiar SQL</span>
                      </>
                    )}
                  </button>
                </div>
                <pre className="p-3 bg-slate-950 rounded-lg text-[11px] text-slate-300 font-mono overflow-x-auto border border-slate-800/80 leading-relaxed max-h-44">
                  {SUPABASE_SQL_SETUP}
                </pre>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-900/80 flex items-center justify-between">
          <a
            href="https://supabase.com/dashboard"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors"
          >
            <span>Abrir Painel Supabase</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleTestConnection}
              disabled={testing}
              className="px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${testing ? 'animate-spin' : ''}`} />
              <span>{testing ? 'Testando...' : 'Testar Conexão'}</span>
            </button>

            <button
              type="button"
              onClick={handleSaveAndConnect}
              disabled={testing}
              className="px-5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-lg shadow-emerald-600/30 transition-all flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Salvar &amp; Conectar</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
