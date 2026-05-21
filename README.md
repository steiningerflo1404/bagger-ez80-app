# Bagger EZ80 PWA mit Supabase

Diese Version speichert die Daten zentral in Supabase und kann auf Vercel veröffentlicht werden.

## Enthalten

- Bagger EZ80
- Mitgliederliste
- Stundensätze: innerbetrieblich 15 €/h, überbetrieblich 50 €/h
- Login per E-Mail-Link
- zentrale Supabase-Datenbank
- Erfassung: Datum, Mitglied, Betriebsstunden, Dieselmenge, Einsatzart, Bemerkung/Schäden
- Kassier-/Verwalter-Rollen
- Stichtagsabrechnung
- CSV-Export
- PWA für iPhone und Android Startbildschirm

## 1. Supabase einrichten

1. Auf supabase.com kostenloses Projekt erstellen
2. SQL Editor öffnen
3. Datei `supabase/schema.sql` komplett einfügen und ausführen
4. Project Settings -> API öffnen
5. Folgende Werte kopieren:
   - Project URL
   - anon public key

## 2. Lokal testen

Datei `.env` im Hauptordner erstellen:

```env
VITE_SUPABASE_URL=https://DEIN-PROJEKT.supabase.co
VITE_SUPABASE_ANON_KEY=DEIN_ANON_PUBLIC_KEY
```

Dann:

```bash
npm install
npm run dev
```

## 3. Auf Vercel veröffentlichen

1. Projekt in GitHub hochladen
2. Auf vercel.com neues Projekt importieren
3. Environment Variables eintragen:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Deploy klicken


## Automatische E-Mail bei jedem Eintrag

Nach jedem gespeicherten Eintrag wird automatisch eine E-Mail an diese Adresse gesendet:

```text
Bagger.Wartbergnussbach@gmail.com
```

Die E-Mail enthält:

- Datum
- Mitglied / Fahrer
- Betriebsstunden
- getankte Dieselmenge
- Einsatzart
- Bemerkung / Schäden
- wer den Eintrag erfasst hat
- Zeitpunkt der Erfassung

### E-Mail-Versand einrichten

Für den Versand wird eine Supabase Edge Function mit Resend verwendet.

1. Kostenloses Konto bei Resend erstellen
2. API Key erstellen
3. In Supabase unter Edge Functions / Secrets setzen:

```bash
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxx
RESEND_FROM_EMAIL=Bagger EZ80 <deine-verifizierte-absenderadresse@deinedomain.at>
```

Wichtig: Für zuverlässigen Versand sollte bei Resend eine eigene Absender-Domain oder Absenderadresse verifiziert werden.

### Function deployen

Im Projektordner:

```bash
supabase functions deploy send-entry-email
```

Die App ruft danach automatisch diese Function auf, sobald ein Eintrag gespeichert wurde.


## 4. Kassier/Verwalter setzen

Nach dem ersten Login legt die App automatisch ein Profil an.
Dann in Supabase im SQL Editor ausführen:

```sql
update public.profiles set role = 'cashier', name = 'Kassier Name' where email = 'kassier@example.com';
update public.profiles set role = 'admin', name = 'Verwalter Name' where email = 'admin@example.com';
```

## 5. QR-Code

Nach dem Vercel-Deploy bekommst du einen Link.
Diesen Link als QR-Code erzeugen und auf den Bagger EZ80 kleben.

## Hinweis

Aktuell dürfen alle angemeldeten Mitglieder die Eintragsliste sehen. Kassier und Verwalter dürfen löschen und abrechnen.
Wenn Mitglieder wirklich nur eigene Einträge sehen sollen, muss beim Login die ausgewählte Person fix mit dem Benutzerprofil verbunden werden.
