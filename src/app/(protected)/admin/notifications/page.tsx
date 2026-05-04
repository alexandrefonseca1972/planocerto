"use client";

import { useActionState, useState, useEffect } from "react";
import { createNotification, deleteNotification, getNotifications } from "@/app/actions/notifications";
import type { NotificationItem, NotificationFormState } from "@/app/actions/notifications";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogFooter, AlertDialogCancel } from "@/components/ui/alert-dialog";
import { Plus, Trash2, Bell, Check, Globe, Building2, User } from "lucide-react";

const init: NotificationFormState = { message: undefined, errors: {} };

export default function AdminNotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [createState, createAction, isCreating] = useActionState(createNotification, init);
  const [, deleteAction, isDeleting] = useActionState(deleteNotification, init);

  useEffect(() => { getNotifications().then(setNotifications); }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">Notificações</h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Crie e gerencie notificações para os usuários.</p>
        </div>
        <Button onClick={() => setShowForm(true)}><Plus className="h-4 w-4 mr-1" /> Nova notificação</Button>
      </div>

      <div className="space-y-2">
        {notifications.map(n => (
          <Card key={n.id} className="flex items-center justify-between p-4">
            <div className="flex items-start gap-3 min-w-0">
              <Bell className="mt-0.5 h-5 w-5 shrink-0 text-zinc-400" />
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-zinc-900 dark:text-zinc-50 truncate">{n.title}</p>
                  <Badge variant={n.target_type === "all" ? "default" : "outline"} className="text-xs">
                    {n.target_type === "all" ? <Globe className="mr-1 h-3 w-3" /> : n.target_type === "user" ? <User className="mr-1 h-3 w-3" /> : <Building2 className="mr-1 h-3 w-3" />}
                    {n.target_type === "all" ? "Todos" : n.target_type === "user" ? "Usuário" : "Empresa"}
                  </Badge>
                  {n.is_fixed && <Badge variant="secondary" className="text-xs">Fixa</Badge>}
                </div>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 truncate mt-0.5">{n.message}</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" className="shrink-0 text-red-500" onClick={() => setDeletingId(n.id)}><Trash2 className="h-4 w-4" /></Button>
          </Card>
        ))}
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/50 p-4 backdrop-blur-sm" onClick={() => setShowForm(false)}>
          <div className="w-full max-w-md rounded-xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-700 dark:bg-zinc-900" onClick={e => e.stopPropagation()}>
            <h3 className="mb-4 text-lg font-semibold">Nova notificação</h3>
            <form action={createAction} className="space-y-4">
              <Field label="Título" name="title" required placeholder="Título da notificação" />
              <Field label="Mensagem" name="message" multiline placeholder="Corpo da mensagem" />
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5"><Label className="text-xs">Tipo</Label>
                  <select name="type" defaultValue="info" className="h-10 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50">
                    <option value="info">Info</option><option value="warning">Aviso</option><option value="success">Sucesso</option><option value="error">Erro</option>
                  </select>
                </div>
                <div className="space-y-1.5"><Label className="text-xs">Público-alvo</Label>
                  <select name="target_type" defaultValue="all" className="h-10 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50">
                    <option value="all">Todos</option><option value="user">Usuário específico</option><option value="tenant">Empresa</option>
                  </select>
                </div>
              </div>
              <div className="flex items-center gap-2"><input type="checkbox" name="is_fixed" value="true" className="rounded" /><Label className="text-xs">Notificação fixa (permanente)</Label></div>
              <Field label="Expira em (opcional)" name="expires_at" type="datetime-local" />
              {createState.message && <div className={`rounded-md p-3 text-sm ${createState.success ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-800"}`}>{createState.message}</div>}
              <div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button><Button type="submit" isLoading={isCreating}><Check className="h-4 w-4 mr-1" />Criar</Button></div>
            </form>
          </div>
        </div>
      )}

      <AlertDialog open={!!deletingId} onOpenChange={o => { if (!o) setDeletingId(null); }}>
        {deletingId && <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Excluir notificação</AlertDialogTitle></AlertDialogHeader><form action={deleteAction}><input type="hidden" name="notificationId" value={deletingId} /><AlertDialogFooter><AlertDialogCancel /><Button type="submit" variant="destructive" isLoading={isDeleting}><Trash2 className="h-4 w-4 mr-1" />Excluir</Button></AlertDialogFooter></form></AlertDialogContent>}
      </AlertDialog>
    </div>
  );
}

function Field({ label, name, defaultValue = "", multiline, required, placeholder, type }: {
  label: string; name: string; defaultValue?: string; multiline?: boolean; required?: boolean; placeholder?: string; type?: string;
}) {
  return <div className="space-y-1.5"><Label className="text-xs">{label}</Label>{multiline ? <textarea name={name} defaultValue={defaultValue} placeholder={placeholder} required={required} rows={2} className="flex w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm resize-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50" /> : <Input name={name} type={type} defaultValue={defaultValue} placeholder={placeholder} required={required} />}</div>;
}
