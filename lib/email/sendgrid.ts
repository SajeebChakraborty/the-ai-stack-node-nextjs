import "server-only";

type SendEmailParams = {
  html: string;
  subject: string;
  text: string;
  toEmail: string;
  toName?: string | null;
};

function getEmailConfig() {
  const apiKey = process.env.SENDGRID_API_KEY;
  const fromEmail = process.env.EMAIL_FROM;
  const fromName = process.env.EMAIL_USERNAME ?? "TheAiStack";

  if (!apiKey || !fromEmail) {
    throw new Error("SendGrid email is not configured.");
  }

  return {
    apiKey,
    fromEmail,
    fromName
  };
}

export async function sendEmail({ html, subject, text, toEmail, toName }: SendEmailParams) {
  const { apiKey, fromEmail, fromName } = getEmailConfig();
  const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from: {
        email: fromEmail,
        name: fromName
      },
      personalizations: [
        {
          to: [
            {
              email: toEmail,
              ...(toName ? { name: toName } : {})
            }
          ]
        }
      ],
      subject,
      content: [
        {
          type: "text/plain",
          value: text
        },
        {
          type: "text/html",
          value: html
        }
      ]
    })
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`SendGrid email failed: ${response.status} ${errorBody}`);
  }
}
