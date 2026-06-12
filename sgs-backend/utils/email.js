const nodemailer = require('nodemailer');

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;

  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn('SMTP non configuré dans .env. Les emails ne seront pas envoyés.');
    return null;
  }

  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });

  return transporter;
}

const TEMPLATES = {
  alert_absence: (eleve, absences) => ({
    subject: `[SGS] Alerte d'absence - ${eleve.prenom} ${eleve.nom}`,
    html: `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Alerte d'absence - SGS</title>
  <style>
    @media only screen and (max-width: 520px) {
      table.main { width: 100% !important; }
      td.responsive-pad { padding: 1rem 1rem !important; }
      td.responsive-pad-wide { padding: 0.75rem 1rem !important; }
      td.responsive-hide { display: none !important; }
      td.responsive-stack { display: block !important; width: 100% !important; text-align: center !important; padding-left: 0 !important; padding-top: 8px !important; }
      div.responsive-badge { display: inline-flex !important; align-items: center !important; gap: 6px !important; padding: 5px 14px !important; }
      div.responsive-badge div:first-child { font-size: 18px !important; }
      .header-mini-logo { text-align: center !important; padding-bottom: 0 !important; }
      .header-mini-logo img { display: inline-block !important; }
      .header-mini-org { display: block !important; width: 100% !important; padding: 4px 0 0 0 !important; text-align: center !important; }
      .header-mini-brand { display: block !important; width: 100% !important; padding: 4px 0 0 0 !important; text-align: center !important; }
      .footer-stack { display: block !important; width: 100% !important; text-align: center !important; padding-top: 4px !important; }
      .cta-btn { display: block !important; text-align: center !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background:#F1F5F9;font-family:Inter,Arial,sans-serif;">

  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F1F5F9;padding:2rem 1rem;">
    <tr>
      <td align="center">
        <table class="main" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;border-radius:12px;overflow:hidden;border:1px solid #E2E8F0;background:#ffffff;">

          <!-- ===== HEADER ===== -->
          <tr>
            <td style="background:#1A2744;padding:1.25rem 1.75rem;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td class="header-mini-logo" style="width:44px;vertical-align:middle;text-align:left;">
                    <img src="https://deroua24.ma/wp-content/uploads/2024/08/IMG-20240822-WA0209.jpg"
                         alt="Logo" width="44" height="44"
                         style="display:inline-block;object-fit:contain;border-radius:4px;" />
                  </td>
                  <td class="responsive-hide" style="width:1px;vertical-align:middle;">
                    <div style="width:1px;height:40px;background:rgba(255,255,255,0.2);margin:0 12px;"></div>
                  </td>
                  <td class="header-mini-org" style="vertical-align:middle;text-align:left;">
                    <div style="color:rgba(255,255,255,0.85);font-size:11px;line-height:1.4;direction:rtl;text-align:right;">
                      وزارة التربية الوطنية والتعليم الأولي والرياضة
                    </div>
                    <div style="color:#ffffff;font-size:12px;font-weight:500;line-height:1.4;margin-top:1px;">
                      Ministère de l'Éducation Nationale
                    </div>
                  </td>
                  <td class="header-mini-brand" style="vertical-align:middle;text-align:right;padding-left:10px;">
                    <div style="color:#ffffff;font-size:16px;font-weight:700;">SGS</div>
                    <div style="color:rgba(255,255,255,0.5);font-size:10px;">Gestion Scolaire</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- ===== ALERT BAND ===== -->
          <tr>
            <td class="responsive-pad-wide" style="background:#FEF3C7;border-left:4px solid #F59E0B;padding:0.75rem 1.75rem;">
              <table cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td style="font-size:16px;vertical-align:middle;padding-right:8px;width:26px;">⚠️</td>
                  <td style="font-size:13px;color:#78350F;font-weight:600;vertical-align:middle;">
                    Alerte d'absence — action requise
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- ===== BODY ===== -->
          <tr>
            <td class="responsive-pad" style="padding:1.75rem;">

              <p style="font-size:15px;color:#475569;line-height:1.7;margin:0 0 1rem;">Bonjour,</p>
              <p style="font-size:15px;color:#475569;line-height:1.7;margin:0 0 1.25rem;">
                Nous vous informons que votre enfant a dépassé le seuil d'absences réglementaire.
                Veuillez prendre contact avec l'administration dès que possible.
              </p>

              <!-- Student card (responsive: badge under name on mobile) -->
              <table width="100%" cellpadding="0" cellspacing="0"
                     style="background:#F8FAFC;border-radius:8px;margin:1.25rem 0;">
                <tr>
                  <td style="padding:0.875rem 1rem;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <!-- Initials circle -->
                        <td style="width:40px;vertical-align:middle;">
                          <div style="width:40px;height:40px;border-radius:50%;background:#E6F1FB;
                                      display:flex;align-items:center;justify-content:center;
                                      font-size:14px;font-weight:600;color:#0C447C;
                                      text-align:center;line-height:40px;">
                            ${eleve.prenom[0]}${eleve.nom[0]}
                          </div>
                        </td>
                        <!-- Name & class (takes remaining space) -->
                        <td style="padding-left:12px;vertical-align:middle;">
                          <div style="font-size:15px;font-weight:600;color:#1E293B;">
                            ${eleve.prenom} ${eleve.nom}
                          </div>
                          <div style="font-size:12px;color:#64748B;margin-top:2px;">
                            ${eleve.classe}
                          </div>
                        </td>
                        <!-- Absence badge (becomes block below on mobile) -->
                        <td class="responsive-stack" style="text-align:right;vertical-align:middle;width:auto;">
                          <div class="responsive-badge" style="display:inline-block;background:#FEF3C7;
                                      border:1px solid #F59E0B;border-radius:20px;
                                      padding:5px 14px;text-align:center;">
                            <div style="font-size:20px;font-weight:700;color:#92400E;line-height:1;display:inline;">
                              ${absences}h
                            </div>
                            <div style="font-size:10px;color:#B45309;text-transform:uppercase;
                                        letter-spacing:0.05em;margin-top:1px;">
                              absences
                            </div>
                          </div>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <p style="font-size:14px;color:#64748B;line-height:1.7;margin:0 0 1.5rem;">
                Conformément au règlement intérieur, tout dépassement de
                <strong style="color:#1E293B;">10h d'absence</strong> non justifiée
                nécessite un entretien avec l'administration.
              </p>

              <!-- CTA Button -->
              <table cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td class="cta-btn">
                    <a href="#"
                       style="display:inline-block;background:#1A2744;color:#ffffff;
                              font-size:14px;font-weight:600;padding:12px 28px;
                              border-radius:8px;text-decoration:none;">
                      Contacter l'administration
                    </a>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- ===== FOOTER ===== -->
          <tr>
            <td style="background:#F8FAFC;padding:0.875rem 1.5rem;border-top:1px solid #E2E8F0;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td class="footer-stack" style="font-size:12px;color:#64748B;text-align:left;">
                    <strong style="color:#1E293B;">SGS</strong> — Système de Gestion Scolaire
                  </td>
                  <td class="footer-stack" style="text-align:right;font-size:11px;color:#94A3B8;padding-top:0;">
                    Ne pas répondre à cet email
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>

</body>
</html>`,
  }),
};

async function sendAlertEmail(eleve, absences) {
  const t = getTransporter();
  if (!t) return { sent: false, reason: 'SMTP non configuré' };
  if (!eleve.email_parent) return { sent: false, reason: 'Aucun email parent' };

  const { subject, html } = TEMPLATES.alert_absence(eleve, absences);

  try {
    await t.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: eleve.email_parent,
      subject,
      html,
    });
    return { sent: true };
  } catch (err) {
    console.error('Erreur envoi email:', err.message);
    return { sent: false, reason: err.message };
  }
}

module.exports = { sendAlertEmail, getTransporter };
