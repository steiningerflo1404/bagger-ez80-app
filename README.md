# Bagger EZ80 App mit Google Tabelle

Diese Version verwendet keine Supabase-Datenbank mehr.

## So funktioniert es

- App läuft über Vercel-Link
- Mitglieder öffnen per QR-Code
- Daten werden in eine Google-Tabelle geschrieben
- Kassier arbeitet direkt in der Google-Tabelle

## Vercel Environment Variable

In Vercel muss nur eine Variable gesetzt werden:

```text
VITE_GOOGLE_SCRIPT_URL
```

Wert ist der Web-App-Link aus Google Apps Script.

## Google Tabelle einrichten

1. Neue Google Tabelle erstellen
2. Name z. B. `Bagger EZ80 Stundenliste`
3. Erweiterungen → Apps Script
4. Inhalt aus `google-apps-script/Code.gs` einfügen
5. Speichern
6. Bereitstellen → Neue Bereitstellung
7. Typ: Web-App
8. Ausführen als: Ich
9. Zugriff: Jeder
10. Bereitstellen
11. Web-App-URL kopieren
12. In Vercel als `VITE_GOOGLE_SCRIPT_URL` eintragen
13. Vercel neu deployen

## Vorteile

- kein Supabase
- keine Edge Functions
- kein Login
- sehr einfach zu warten
