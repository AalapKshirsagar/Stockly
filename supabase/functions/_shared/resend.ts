const RESEND_API_URL = "https://api.resend.com/emails";

function apiKey(): string {
  const key = Deno.env.get("RESEND_API_KEY");
  if (!key) throw new Error("RESEND_API_KEY is not configured");
  return key;
}

function fromAddress(): string {
  return Deno.env.get("ALERT_FROM_EMAIL") ?? "alerts@stockly.app";
}

export async function sendAlertEmail(to: string, subject: string, html: string): Promise<void> {
  const res = await fetch(RESEND_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey()}`,
    },
    body: JSON.stringify({
      from: fromAddress(),
      to: [to],
      subject,
      html,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Resend request failed (${res.status}): ${text}`);
  }
}
