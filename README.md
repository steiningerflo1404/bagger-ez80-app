# Bagger EZ80 Public + Admin App

Diese Version hat keinen Mitglieder-Login mehr.

Mitglieder:
- QR-Code scannen
- Daten erfassen
- speichern

Admin/Kassier:
- rechts oben auf Admin / Kassier
- Admin-Passwort eingeben
- Einträge sehen, löschen, CSV-Abrechnung erstellen

In Supabase SQL Editor ausführen:
supabase/schema-public-admin.sql

In Vercel bleiben:
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY

In Supabase Edge Function Secrets setzen:
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
ADMIN_PASSWORD
RESEND_API_KEY
RESEND_FROM_EMAIL
