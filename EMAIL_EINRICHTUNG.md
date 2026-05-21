# E-Mail-Benachrichtigung einrichten

Empfänger ist fest in der Function eingetragen:

Bagger.Wartbergnussbach@gmail.com

## Warum über Edge Function?

Der E-Mail-Schlüssel darf nicht im Browser stehen.
Darum sendet die App nach dem Speichern eines Eintrags eine Anfrage an die Supabase Edge Function `send-entry-email`.
Diese Function verwendet den geheimen `RESEND_API_KEY`.

## Schritte

1. Resend-Konto erstellen
2. API-Key erstellen
3. Absender-Domain oder Absenderadresse verifizieren
4. In Supabase Secrets setzen:

```bash
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxx
RESEND_FROM_EMAIL=Bagger EZ80 <absender@deinedomain.at>
```

5. Function deployen:

```bash
supabase functions deploy send-entry-email
```

6. App neu veröffentlichen

## Test

Einen neuen Eintrag speichern.
Danach sollte eine E-Mail an `Bagger.Wartbergnussbach@gmail.com` kommen.
