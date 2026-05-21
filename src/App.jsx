
import React, { useState } from "react";

const MACHINE_NAME = "Bagger EZ80";
const SHEET_WEBAPP_URL = import.meta.env.VITE_GOOGLE_SCRIPT_URL || "";

const members = [
  "Steininger",
  "Zorn",
  "Stockhammer",
  "Kerschbaumer",
  "Mayr",
  "Passenbrunner",
  "Zwicklhuber",
  "Kremshuber",
  "Staudinger",
];

function Field({ label, children }) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
    </label>
  );
}

function Card({ children, className = "" }) {
  return <div className={`card ${className}`}>{children}</div>;
}

export default function App() {
  const [form, setForm] = useState({
    datum: new Date().toISOString().slice(0, 10),
    mitglied: "",
    betriebsstunden: "",
    diesel: "",
    einsatzart: "innerbetrieblich",
    bemerkung: "",
  });

  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  async function saveEntry(event) {
    event.preventDefault();
    setMessage("");

    if (!SHEET_WEBAPP_URL) {
      setMessage("Google-Script-Link fehlt noch. Bitte VITE_GOOGLE_SCRIPT_URL in Vercel eintragen.");
      return;
    }

    if (!form.datum || !form.mitglied || !form.betriebsstunden) {
      alert("Bitte mindestens Datum, Mitglied und Betriebsstunden ausfüllen.");
      return;
    }

    setSending(true);

    const payload = {
      maschine: MACHINE_NAME,
      datum: form.datum,
      mitglied: form.mitglied,
      betriebsstunden: Number(form.betriebsstunden),
      diesel: Number(form.diesel) || 0,
      einsatzart: form.einsatzart,
      bemerkung: form.bemerkung.trim(),
      erfasstAm: new Date().toISOString(),
    };

    try {
      await fetch(SHEET_WEBAPP_URL, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify(payload),
      });

      setMessage("Eintrag wurde gespeichert.");
      setForm({
        datum: new Date().toISOString().slice(0, 10),
        mitglied: "",
        betriebsstunden: "",
        diesel: "",
        einsatzart: "innerbetrieblich",
        bemerkung: "",
      });
    } catch (error) {
      setMessage("Speichern fehlgeschlagen. Bitte Internetverbindung und Google-Script-Link prüfen.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="page">
      <div className="container">
        <header className="header">
          <div>
            <h1>Bagger EZ80</h1>
            <p>QR-Code scannen, Daten eintragen, speichern. Die Daten landen automatisch in der Google-Tabelle.</p>
          </div>
        </header>

        {message && <Card className="notice">{message}</Card>}

        <main className="main-grid">
          <Card>
            <div className="card-head">
              <div>
                <h2>Neue Erfassung</h2>
                <p>Kein Login, kein Passwort, keine E-Mail-Bestätigung.</p>
              </div>
              <div className="qr-symbol">▦</div>
            </div>

            <form onSubmit={saveEntry} className="form">
              <div className="machine-pill"><strong>Maschine:</strong> {MACHINE_NAME}</div>

              <Field label="Datum">
                <input type="date" value={form.datum} onChange={(event) => setForm({ ...form, datum: event.target.value })} />
              </Field>

              <Field label="Mitglied / Fahrer">
                <select value={form.mitglied} onChange={(event) => setForm({ ...form, mitglied: event.target.value })}>
                  <option value="">Bitte Mitglied auswählen</option>
                  {members.map((member) => <option key={member} value={member}>{member}</option>)}
                </select>
              </Field>

              <Field label="Betriebsstunden">
                <input type="number" min="0" step="0.25" placeholder="z. B. 2,5" value={form.betriebsstunden} onChange={(event) => setForm({ ...form, betriebsstunden: event.target.value })} />
              </Field>

              <Field label="Getankte Dieselmenge in Liter">
                <input type="number" min="0" step="0.1" placeholder="z. B. 18" value={form.diesel} onChange={(event) => setForm({ ...form, diesel: event.target.value })} />
              </Field>

              <Field label="Einsatzart">
                <select value={form.einsatzart} onChange={(event) => setForm({ ...form, einsatzart: event.target.value })}>
                  <option value="innerbetrieblich">Innerbetrieblich — Standard, € 15/h</option>
                  <option value="ueberbetrieblich">Überbetrieblich, € 50/h</option>
                </select>
              </Field>

              <Field label="Bemerkung / Schäden">
                <textarea placeholder="z. B. Schaden, Wartung, Besonderheiten" value={form.bemerkung} onChange={(event) => setForm({ ...form, bemerkung: event.target.value })} />
              </Field>

              <button className="primary" type="submit" disabled={sending}>
                {sending ? "Speichert..." : "Eintrag speichern"}
              </button>
            </form>
          </Card>

          <Card className="wide">
            <h2>Für den Kassier</h2>
            <p>
              Alle Einträge werden in der Google-Tabelle gesammelt. Dort kann man filtern, summieren,
              nach Stichtag abrechnen und bei Bedarf als Excel oder PDF exportieren.
            </p>

            <div className="info-grid">
              <div><strong>Maschine</strong><span>{MACHINE_NAME}</span></div>
              <div><strong>Innerbetrieblich</strong><span>€ 15 / Stunde</span></div>
              <div><strong>Überbetrieblich</strong><span>€ 50 / Stunde</span></div>
              <div><strong>Speicher</strong><span>Google Tabelle</span></div>
            </div>
          </Card>
        </main>
      </div>
    </div>
  );
}
