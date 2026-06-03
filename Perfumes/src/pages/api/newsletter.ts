import type { APIRoute } from 'astro';
import db from '../../lib/db';
import { checkRateLimit } from '../../lib/rateLimit';
import { sendWelcomeEmail } from '../../lib/email';
import { z } from 'zod';

const NewsletterSchema = z.object({
  email: z.string().email('El correo electrónico no es válido'),
});

// Función para sincronizar con proveedores externos en base a variables de entorno
export async function syncWithNewsletterProvider(email: string): Promise<string> {
  const resendKey = process.env.RESEND_API_KEY;
  const resendAudienceId = process.env.RESEND_AUDIENCE_ID;
  
  const mailchimpKey = process.env.MAILCHIMP_API_KEY;
  const mailchimpAudienceId = process.env.MAILCHIMP_AUDIENCE_ID;
  
  const brevoKey = process.env.BREVO_API_KEY;
  const brevoListIds = process.env.BREVO_LIST_IDS;

  // 1. Resend Integration
  if (resendKey && resendAudienceId) {
    console.log(`[NEWSLETTER] Sincronizando ${email} con Resend (Audience ID: ${resendAudienceId})...`);
    const res = await fetch(`https://api.resend.com/audiences/${resendAudienceId}/contacts`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, unsubscribed: false })
    });
    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Resend API error: ${res.status} - ${errText}`);
    }
    return 'resend';
  }

  // 2. Mailchimp Integration
  if (mailchimpKey && mailchimpAudienceId) {
    const dc = mailchimpKey.split('-')[1] || 'us1';
    console.log(`[NEWSLETTER] Sincronizando ${email} con Mailchimp (List ID: ${mailchimpAudienceId})...`);
    const res = await fetch(`https://${dc}.api.mailchimp.com/3.0/lists/${mailchimpAudienceId}/members`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${Buffer.from(`anystring:${mailchimpKey}`).toString('base64')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email_address: email,
        status: 'subscribed'
      })
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      if (res.status === 400 && errData.title === 'Member Exists') {
        console.log(`[NEWSLETTER] ${email} ya existe en Mailchimp.`);
        return 'mailchimp';
      }
      throw new Error(`Mailchimp API error: ${res.status} - ${JSON.stringify(errData)}`);
    }
    return 'mailchimp';
  }

  // 3. Brevo Integration
  if (brevoKey) {
    console.log(`[NEWSLETTER] Sincronizando ${email} con Brevo...`);
    const listIds = brevoListIds ? brevoListIds.split(',').map(id => parseInt(id.trim())).filter(Boolean) : [];
    const res = await fetch('https://api.brevo.com/v3/contacts', {
      method: 'POST',
      headers: {
        'api-key': brevoKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email,
        listIds: listIds.length > 0 ? listIds : undefined,
        updateEnabled: true
      })
    });
    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Brevo API error: ${res.status} - ${errText}`);
    }
    return 'brevo';
  }

  // 4. Fallback (Modo Simulación)
  console.log(`[NEWSLETTER] Sincronización simulada para ${email} (Credenciales de proveedor ausentes).`);
  return 'simulation';
}

export const POST: APIRoute = async ({ request }) => {
  try {
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    if (!checkRateLimit(ip, 5, 60000)) {
      return new Response(JSON.stringify({ error: 'Demasiadas solicitudes. Intenta de nuevo en un minuto.' }), {
        status: 429,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const body = await request.json();
    const result = NewsletterSchema.safeParse(body);
    if (!result.success) {
      return new Response(JSON.stringify({ error: result.error.errors.map(e => e.message).join(', ') }), { status: 400 });
    }

    const { email } = result.data;

    let subId: number | bigint = 0;
    try {
      const insertRes = db.prepare('INSERT INTO newsletter (email, sync_status, sync_provider) VALUES (?, \'pending\', \'none\')').run(email);
      subId = insertRes.lastInsertRowid;
    } catch (dbErr: any) {
      if (dbErr.code === 'SQLITE_CONSTRAINT_UNIQUE') {
        return new Response(JSON.stringify({ success: true, message: 'Ya te encuentras registrado en nuestro boletín.' }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      throw dbErr;
    }

    // 1. Enviar correo electrónico de bienvenida de lujo
    try {
      await sendWelcomeEmail(email);
    } catch (emailErr) {
      console.error('[NEWSLETTER] Error enviando correo de bienvenida:', emailErr);
    }

    // 2. Sincronizar en tiempo real con proveedor de email marketing
    try {
      const provider = await syncWithNewsletterProvider(email);
      db.prepare("UPDATE newsletter SET sync_status = 'synced', sync_provider = ?, sync_attempts = 1 WHERE id = ?").run(provider, subId);
    } catch (syncErr: any) {
      console.error('[NEWSLETTER] Sincronización en tiempo real fallida, guardado en cola para reintento:', syncErr.message);
      db.prepare("UPDATE newsletter SET sync_status = 'failed', sync_attempts = 1, last_sync_error = ? WHERE id = ?").run(syncErr.message, subId);
    }

    return new Response(JSON.stringify({ success: true, message: '¡Te has registrado con éxito en nuestro boletín!' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in newsletter endpoint:', error);
    return new Response(JSON.stringify({ error: 'Error interno del servidor al registrarse' }), { status: 500 });
  }
};
