# Bagger EZ80 App - Version 6

Neu:
- Großes Hinweisfeld: "Abschmieren in X Stunden"
- Nach "Letzten Wert übernehmen" wird der Abschmierstatus sofort groß angezeigt
- Wenn der neue End-Stundenzähler in den Bereich ab 6 Stunden seit letzter Abschmierung kommt, muss "Abgeschmiert" angehakt werden
- Bei 8 Stunden oder mehr wird ebenfalls Abschmieren verlangt
- Wird "Abgeschmiert" angehakt, startet der 8h-Zyklus neu

Update:
1. Dateien auf GitHub hochladen und alte Version ersetzen
2. In Google Apps Script den Code aus google-apps-script/Code.gs komplett ersetzen
3. Apps Script neu bereitstellen: Bereitstellen -> Bereitstellungen verwalten -> Stift -> Neue Version -> Bereitstellen
4. Vercel redeployen
