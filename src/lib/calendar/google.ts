const GOOGLE_CALENDAR_API = "https://www.googleapis.com/calendar/v3";

interface CalendarEvent {
  summary: string;
  description?: string;
  start: { date?: string; dateTime?: string; timeZone: string };
  end: { date?: string; dateTime?: string; timeZone: string };
}

export async function createGoogleEvent(accessToken: string, event: CalendarEvent): Promise<string | null> {
  try {
    const res = await fetch(`${GOOGLE_CALENDAR_API}/calendars/primary/events`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(event),
    });
    if (!res.ok) {
      console.error("[Google] Create event error:", res.status, await res.text());
      return null;
    }
    const data = await res.json();
    return data.id;
  } catch (error) {
    console.error("[Google] Create event exception:", error);
    return null;
  }
}

export async function updateGoogleEvent(accessToken: string, eventId: string, event: Partial<CalendarEvent>): Promise<boolean> {
  try {
    const res = await fetch(`${GOOGLE_CALENDAR_API}/calendars/primary/events/${eventId}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(event),
    });
    return res.ok;
  } catch (error) {
    console.error("[Google] Update event error:", error);
    return false;
  }
}

export async function deleteGoogleEvent(accessToken: string, eventId: string): Promise<boolean> {
  try {
    const res = await fetch(`${GOOGLE_CALENDAR_API}/calendars/primary/events/${eventId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    return res.ok;
  } catch (error) {
    console.error("[Google] Delete event error:", error);
    return false;
  }
}

export async function refreshGoogleToken(refreshToken: string, clientId: string, clientSecret: string): Promise<{ access_token: string; expires_in: number } | null> {
  try {
    const res = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
        grant_type: "refresh_token",
      }),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}
