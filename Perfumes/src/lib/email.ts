import nodemailer from 'nodemailer';

// Obtener transporter de Nodemailer
async function getTransporter() {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || '587');
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (host && user && pass) {
    return nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: {
        user,
        pass,
      },
    });
  } else {
    // Generar cuenta de prueba Ethereal automática en desarrollo
    const testAccount = await nodemailer.createTestAccount();
    return nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
  }
}

// Plantilla CSS/HTML común premium estilo Lé Désir
const getLuxuryEmailWrapper = (title: string, content: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      background-color: #FAF9F6;
      color: #1A1A1A;
      margin: 0;
      padding: 0;
    }
    .wrapper {
      max-width: 600px;
      margin: 0 auto;
      background-color: #FFFFFF;
      border: 1px solid #EAEAEA;
    }
    .header {
      background-color: #111111;
      text-align: center;
      padding: 40px 20px;
      border-bottom: 2px solid #C5A880;
    }
    .brand-title {
      font-family: Georgia, serif;
      color: #FAF9F6;
      font-size: 28px;
      letter-spacing: 4px;
      text-transform: lowercase;
      margin: 0;
      font-weight: 300;
    }
    .brand-sub {
      color: #C5A880;
      font-size: 10px;
      letter-spacing: 6px;
      text-transform: uppercase;
      margin-top: 5px;
      font-weight: 600;
    }
    .content {
      padding: 40px 30px;
      line-height: 1.6;
    }
    .content h2 {
      font-family: Georgia, serif;
      font-size: 22px;
      color: #111111;
      font-weight: normal;
      margin-top: 0;
    }
    .table-container {
      margin: 30px 0;
    }
    table {
      width: 100%;
      border-collapse: collapse;
    }
    th {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 2px;
      color: #888888;
      border-bottom: 1px solid #EAEAEA;
      padding-bottom: 10px;
      text-align: left;
    }
    td {
      padding: 15px 0;
      border-bottom: 1px solid #F5F5F5;
      font-size: 14px;
    }
    .total-row td {
      border-top: 1px solid #111111;
      border-bottom: none;
      font-weight: bold;
      font-size: 16px;
      padding-top: 20px;
    }
    .footer {
      background-color: #F7F5F0;
      padding: 30px 20px;
      text-align: center;
      font-size: 11px;
      color: #888888;
      border-top: 1px solid #EAEAEA;
      letter-spacing: 1px;
    }
    .button {
      display: inline-block;
      background-color: #111111;
      color: #FAF9F6 !important;
      text-decoration: none;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 2px;
      padding: 16px 30px;
      font-weight: bold;
      margin-top: 20px;
    }
    .button:hover {
      background-color: #C5A880;
    }
    .highlight-box {
      background-color: #FDFBF7;
      border: 1px solid #F3EDE2;
      padding: 20px;
      margin: 20px 0;
      font-size: 13px;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <div class="brand-title">lé désir</div>
      <div class="brand-sub">fragancias selectas</div>
    </div>
    <div class="content">
      ${content}
    </div>
    <div class="footer">
      LÉ DÉSIR FRAGANCIAS &copy; 2026<br>
      Buenos Aires, Argentina | Instagram @ledesir.fragancias
    </div>
  </div>
</body>
</html>
`;

export async function sendOrderEmails(order: any, items: any[]) {
  const transporter = await getTransporter();
  
  const paymentMethodText = order.payment_method === 'mercadopago' 
    ? 'Mercado Pago (Pendiente de acreditación)' 
    : 'WhatsApp (Coordinar efectivo/transferencia)';
    
  const shippingMethodText = order.method === 'envio' 
    ? `Envío a domicilio (${order.address})` 
    : 'Retiro en punto de entrega (Coordinar por WhatsApp)';

  // 1. Email para el Cliente
  const itemsHtml = items.map(item => `
    <tr>
      <td style="font-weight: bold;">${item.name} <span style="font-weight: normal; color: #888888; font-size: 12px;">(${item.sizeLabel})</span></td>
      <td style="text-align: center;">${item.quantity}</td>
      <td style="text-align: right;">$${(item.price * item.quantity).toLocaleString('es-AR')}</td>
    </tr>
  `).join('');

  const discountHtml = order.discount > 0 
    ? `<tr>
        <td colspan="2" style="text-align: right; color: #449D44; font-weight: 500;">Descuento (${order.coupon_code || 'Cupón'}):</td>
        <td style="text-align: right; color: #449D44; font-weight: 500;">-$${order.discount.toLocaleString('es-AR')}</td>
      </tr>` 
    : '';

  const shippingCostHtml = order.method === 'envio' 
    ? `<tr>
        <td colspan="2" style="text-align: right; color: #888888;">Envío a domicilio:</td>
        <td style="text-align: right;">$5.000</td>
      </tr>` 
    : '';

  const clientContent = `
    <h2>Hola, ${order.client_name}.</h2>
    <p>Hemos recibido tu pedido de fragancias exclusivas en Lé Désir. A continuación te presentamos el resumen de tu compra:</p>
    
    <div class="highlight-box">
      <strong>Pedido N°:</strong> #${order.id}<br>
      <strong>Método de Pago:</strong> ${paymentMethodText}<br>
      <strong>Método de Entrega:</strong> ${shippingMethodText}
    </div>

    <div class="table-container">
      <table>
        <thead>
          <tr>
            <th>Fragancia</th>
            <th style="text-align: center;">Cantidad</th>
            <th style="text-align: right;">Subtotal</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
          ${discountHtml}
          ${shippingCostHtml}
          <tr class="total-row">
            <td colspan="2" style="text-align: right;">Total Estimado:</td>
            <td style="text-align: right;">$${order.total.toLocaleString('es-AR')}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <p style="font-size: 13px; color: #555555;">
      ${order.payment_method === 'mercadopago' 
        ? 'Una vez que Mercado Pago nos notifique la aprobación de tu pago, te enviaremos otro correo de confirmación de despacho.' 
        : 'Nos contactaremos contigo por WhatsApp en breve para coordinar el cobro de la transferencia o acordar el retiro.'}
    </p>

    <div style="text-align: center; margin-top: 30px;">
      <a href="https://wa.me/5491123456789" class="button">Consultar por WhatsApp</a>
    </div>
  `;

  const clientMailOptions = {
    from: '"Lé Désir Fragancias" <no-reply@ledesirfragancias.com>',
    to: order.client_email,
    subject: `Confirmación de Pedido #${order.id} | Lé Désir`,
    html: getLuxuryEmailWrapper(`Pedido #${order.id} Recibido`, clientContent),
  };

  // 2. Email para el Administrador
  const adminContent = `
    <h2>Nuevo Pedido Recibido</h2>
    <p>Se ha registrado una nueva orden en el e-commerce de Lé Désir.</p>

    <div class="highlight-box">
      <strong>Pedido ID:</strong> #${order.id}<br>
      <strong>Cliente:</strong> ${order.client_name}<br>
      <strong>Email:</strong> ${order.client_email}<br>
      <strong>Teléfono:</strong> ${order.phone || 'No provisto'}<br>
      <strong>Entrega:</strong> ${shippingMethodText}<br>
      <strong>Pago:</strong> ${paymentMethodText}
    </div>

    <div class="table-container">
      <table>
        <thead>
          <tr>
            <th>Fragancia</th>
            <th style="text-align: center;">Cant.</th>
            <th style="text-align: right;">Precio</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
          ${discountHtml}
          ${shippingCostHtml}
          <tr class="total-row">
            <td colspan="2" style="text-align: right;">Total Recaudado:</td>
            <td style="text-align: right;">$${order.total.toLocaleString('es-AR')}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <p>Para ver los detalles completos del pedido o actualizar su estado, ingresa al panel de administración.</p>
  `;

  const adminNotifyEmail = process.env.ADMIN_NOTIFY_EMAIL || 'admin@ledesir.com';
  const adminMailOptions = {
    from: '"Lé Désir E-Commerce" <no-reply@ledesirfragancias.com>',
    to: adminNotifyEmail,
    subject: `⚠️ NUEVO PEDIDO #${order.id} - ${order.client_name}`,
    html: getLuxuryEmailWrapper(`Alerta de Pedido #${order.id}`, adminContent),
  };

  // Enviar correos
  const infoClient = await transporter.sendMail(clientMailOptions);
  const infoAdmin = await transporter.sendMail(adminMailOptions);

  // Si es cuenta de prueba Ethereal, imprimir enlace de previsualización en la consola
  if (transporter.options.host === 'smtp.ethereal.email') {
    console.log('------------------------------------------------------------');
    console.log(`📧 [MOCK EMAIL CLIENTE] Vista previa: ${nodemailer.getTestMessageUrl(infoClient)}`);
    console.log(`📧 [MOCK EMAIL ADMIN] Vista previa: ${nodemailer.getTestMessageUrl(infoAdmin)}`);
    console.log('------------------------------------------------------------');
  }
}

export async function sendOrderApprovedEmail(order: any, items: any[]) {
  const transporter = await getTransporter();

  const itemsHtml = items.map(item => `
    <tr>
      <td style="font-weight: bold;">${item.name} <span style="font-weight: normal; color: #888888; font-size: 12px;">(${item.sizeLabel})</span></td>
      <td style="text-align: center;">${item.quantity}</td>
      <td style="text-align: right;">$${(item.price * item.quantity).toLocaleString('es-AR')}</td>
    </tr>
  `).join('');

  const discountHtml = order.discount > 0 
    ? `<tr>
        <td colspan="2" style="text-align: right; color: #449D44; font-weight: 500;">Descuento:</td>
        <td style="text-align: right; color: #449D44; font-weight: 500;">-$${order.discount.toLocaleString('es-AR')}</td>
      </tr>` 
    : '';

  const shippingCostHtml = order.method === 'envio' 
    ? `<tr>
        <td colspan="2" style="text-align: right; color: #888888;">Envío a domicilio:</td>
        <td style="text-align: right;">$5.000</td>
      </tr>` 
    : '';

  const clientContent = `
    <h2>¡Tu Pago ha sido Acreditado!</h2>
    <p>Hola, ${order.client_name}. Te confirmamos que hemos recibido el pago de tu orden de forma exitosa a través de Mercado Pago.</p>
    
    <div class="highlight-box">
      <strong>Pedido N°:</strong> #${order.id}<br>
      <strong>ID Pago Mercado Pago:</strong> ${order.payment_id || 'Acreditado'}<br>
      <strong>Total Abonado:</strong> $${order.total.toLocaleString('es-AR')}
    </div>

    <p>Estamos empaquetando tus fragancias premium y coordinando el envío / retiro. En breve te enviaremos una notificación de despacho.</p>

    <div class="table-container">
      <table>
        <thead>
          <tr>
            <th>Fragancia</th>
            <th style="text-align: center;">Cantidad</th>
            <th style="text-align: right;">Subtotal</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
          ${discountHtml}
          ${shippingCostHtml}
          <tr class="total-row">
            <td colspan="2" style="text-align: right;">Total Final:</td>
            <td style="text-align: right;">$${order.total.toLocaleString('es-AR')}</td>
          </tr>
        </tbody>
      </table>
    </div>
  `;

  const clientMailOptions = {
    from: '"Lé Désir Fragancias" <no-reply@ledesirfragancias.com>',
    to: order.client_email,
    subject: `✓ Pago Acreditado - Pedido #${order.id} | Lé Désir`,
    html: getLuxuryEmailWrapper(`Pago Acreditado Pedido #${order.id}`, clientContent),
  };

  const infoApproved = await transporter.sendMail(clientMailOptions);

  if (transporter.options.host === 'smtp.ethereal.email') {
    console.log('------------------------------------------------------------');
    console.log(`📧 [MOCK EMAIL PAGO APROBADO] Vista previa: ${nodemailer.getTestMessageUrl(infoApproved)}`);
    console.log('------------------------------------------------------------');
  }
}

export async function sendWelcomeEmail(email: string) {
  const transporter = await getTransporter();

  const clientContent = `
    <h2>¡Gracias por suscribirte a nuestro boletín!</h2>
    <p>Te damos la bienvenida al universo olfativo de <strong>Lé Désir</strong>.</p>
    <p>A partir de ahora, serás el primero en enterarte de nuestros nuevos lanzamientos, colecciones limitadas y eventos exclusivos.</p>
    
    <div class="highlight-box" style="text-align: center; border: 1.5px dashed #C5A880; background-color: #FCFAF7; padding: 25px; margin: 30px 0;">
      <p style="font-size: 11px; uppercase tracking-widest text-brand-dark/50 margin-bottom: 5px;">Tu obsequio de bienvenida</p>
      <h3 style="font-family: Georgia, serif; font-size: 28px; color: #111111; margin: 0 0 10px 0; letter-spacing: 2px;">10% OFF</h3>
      <p style="font-size: 13px; color: #555555; margin-bottom: 15px;">Utilizá el siguiente código en el checkout de tu próxima compra:</p>
      <code style="display: inline-block; font-size: 18px; font-weight: bold; background-color: #111111; color: #C5A880; padding: 10px 20px; border-radius: 2px; letter-spacing: 2px;">BIENVENIDA10</code>
    </div>

    <p style="font-size: 13px; color: #555555; line-height: 1.6;">
      Nuestras fragancias son concebidas bajo la filosofía del minimalismo olfativo, creadas con esencias selectas para perdurar y expresar tu estilo único.
    </p>

    <div style="text-align: center; margin-top: 30px;">
      <a href="http://localhost:4321/shop" class="button">Explorar Catálogo</a>
    </div>
  `;

  const welcomeMailOptions = {
    from: '"Lé Désir Fragancias" <no-reply@ledesirfragancias.com>',
    to: email,
    subject: 'Bienvenido a Lé Désir | 10% de descuento de bienvenida',
    html: getLuxuryEmailWrapper('Bienvenido a Lé Désir', clientContent),
  };

  const info = await transporter.sendMail(welcomeMailOptions);

  if (transporter.options.host === 'smtp.ethereal.email') {
    console.log('------------------------------------------------------------');
    console.log(`📧 [MOCK EMAIL BIENVENIDA] Vista previa: ${nodemailer.getTestMessageUrl(info)}`);
    console.log('------------------------------------------------------------');
  }
}

