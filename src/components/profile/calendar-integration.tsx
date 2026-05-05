"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getCalendarStatus, disconnectCalendar, getGoogleAuthUrl } from "@/app/actions/calendar-sync";
import { Calendar, CheckCircle2, XCircle, Loader2 } from "lucide-react";

export function CalendarIntegration() {
  const [status, setStatus] = useState<{ connected: boolean; provider?: string; syncCount: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState("");
  const callbackHandled = useRef(false);

  const handleOAuthCallback = async (code: string) => {
    setActionLoading(true);
    setMessage("Conectando ao Google Calendar...");
    const { connectGoogleCalendar } = await import("@/app/actions/calendar-sync");
    const result = await connectGoogleCalendar(code);
    if (result.success) {
      window.history.replaceState({}, "", window.location.pathname);
      const newStatus = await getCalendarStatus();
      setStatus(newStatus);
      setMessage("Google Calendar conectado!");
    } else {
      setMessage(result.message || "Erro ao conectar.");
    }
    setActionLoading(false);
  };

  useEffect(() => {
    getCalendarStatus().then(s => { setStatus(s); setLoading(false); });
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    if (code && !callbackHandled.current) {
      callbackHandled.current = true;
      handleOAuthCallback(code);
    }
  }, []);

  const handleConnect = async () => {
    const url = await getGoogleAuthUrl();
    if (url) window.location.href = url;
    else setMessage("Configuração do Google OAuth não encontrada. Configure GOOGLE_CLIENT_ID.");
  };

  const handleDisconnect = async () => {
    setActionLoading(true);
    const result = await disconnectCalendar();
    setMessage(result.message || "");
    if (result.success) setStatus({ connected: false, syncCount: 0 });
    setActionLoading(false);
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Calendar className="h-4 w-4 text-zinc-500" /> Integração com Calendário</CardTitle>
          <CardDescription>Verificando status...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-zinc-500" />
          Integração com Calendário
        </CardTitle>
        <CardDescription>
          Sincronize ações 5W2H com Google Calendar.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-3 p-3 rounded-lg border border-zinc-200 dark:border-zinc-700">
          {status?.connected ? (
            <>
              <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">Conectado ao Google Calendar</p>
                <p className="text-xs text-zinc-500">{status.syncCount} ações sincronizadas</p>
              </div>
              <Button variant="outline" size="sm" onClick={handleDisconnect} isLoading={actionLoading} className="text-xs">
                Desconectar
              </Button>
            </>
          ) : (
            <>
              <XCircle className="h-5 w-5 text-zinc-400 shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">Não conectado</p>
                <p className="text-xs text-zinc-500">Conecte para sincronizar prazos automaticamente</p>
              </div>
              <Button variant="outline" size="sm" onClick={handleConnect} isLoading={actionLoading} className="text-xs">
                {actionLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
                Conectar Google
              </Button>
            </>
          )}
        </div>

        {message && (
          <p className="text-xs text-zinc-500">{message}</p>
        )}

        <div className="text-xs text-zinc-400 space-y-1">
          <p>Ao criar ou editar uma ação, o evento é automaticamente sincronizado com o Google Calendar do responsável.</p>
          <p className="flex items-center gap-1 flex-wrap">
            Requer: <code className="bg-zinc-100 dark:bg-zinc-800 px-1 rounded text-[10px]">GOOGLE_CLIENT_ID</code> <code className="bg-zinc-100 dark:bg-zinc-800 px-1 rounded text-[10px]">GOOGLE_CLIENT_SECRET</code>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
