interface TeamsCard {
  title: string;
  text: string;
  facts?: { name: string; value: string }[];
  color?: string;
}

export async function sendTeamsNotification(webhookUrl: string, card: TeamsCard): Promise<boolean> {
  if (!webhookUrl) return false;
  try {
    const facts = card.facts?.map(f => ({ name: f.name, value: f.value })) || [];

    const body = {
      type: "message",
      attachments: [{
        contentType: "application/vnd.microsoft.card.adaptive",
        content: {
          type: "AdaptiveCard",
          version: "1.4",
          body: [
            {
              type: "TextBlock",
              text: card.title,
              weight: "bolder",
              size: "medium",
              wrap: true,
            },
            {
              type: "TextBlock",
              text: card.text,
              wrap: true,
              spacing: "small",
            },
            ...(facts.length > 0 ? [{
              type: "FactSet",
              facts: facts.map(f => ({ title: f.name, value: f.value })),
              spacing: "medium",
            }] : []),
          ],
          $schema: "http://adaptivecards.io/schemas/adaptive-card.json",
        },
      }],
    };

    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
    });

    if (!res.ok) {
      const text = await res.text();
      console.error("[Teams] Webhook falhou:", res.status, text.slice(0, 200));
      return false;
    }

    return true;
  } catch (e) {
    console.error("[Teams] Erro ao enviar notificação:", e);
    return false;
  }
}

export async function notifyPlanAction(
  webhookUrl: string,
  event: string,
  item: { number: string; action: string; responsible: string; status: number; tenant: string }
): Promise<void> {
  if (!webhookUrl) return;

  const statusLabels: Record<number, string> = {
    1: "Não Iniciada", 2: "Pendente", 3: "Em andamento (atraso)", 4: "Em andamento", 5: "Concluído"
  };

  const card: TeamsCard = {
    title: `Plano de Ação — ${event}`,
    text: `O item **${item.number}** foi ${event.toLowerCase()} na empresa **${item.tenant}**.`,
    facts: [
      { name: "Ação", value: item.action },
      { name: "Responsável", value: item.responsible || "—" },
      { name: "Status", value: statusLabels[item.status] || `Status ${item.status}` },
    ],
    color: item.status === 5 ? "28A745" : item.status === 3 ? "DC3545" : "0078D4",
  };

  await sendTeamsNotification(webhookUrl, card);
}
