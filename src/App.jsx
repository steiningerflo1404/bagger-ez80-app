
import React, { useEffect, useMemo, useState } from "react";
import { supabase, isSupabaseConfigured } from "./supabaseClient";

const MACHINE_NAME = "Bagger EZ80";

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

const FIXED_RATES = {
  innerbetrieblich: 15,
  ueberbetrieblich: 50,
};

function calculateSettlement(entries, deadline, rates = FIXED_RATES) {
  const until = new Date(`${deadline}T23:59:59`);
  const grouped = {};

  entries
    .filter((entry) => new Date(`${entry.date}T00:00:00`) <= until)
    .forEach((entry) => {
      if (!grouped[entry.member]) {
        grouped[entry.member] = {
          member: entry.member,
          innerHours: 0,
          outerHours: 0,
          diesel: 0,
          amount: 0,
        };
      }

      const hours = Number(entry.hours) || 0;
      const diesel = Number(entry.diesel) || 0;
      const rate = rates[entry.type] || 0;

      if (entry.type === "innerbetrieblich") grouped[entry.member].innerHours += hours;
      if (entry.type === "ueberbetrieblich") grouped[entry.member].outerHours += hours;

      grouped[entry.member].diesel += diesel;
      grouped[entry.member].amount += hours * rate;
    });

  return Object.values(grouped).sort((a, b) => a.member.localeCompare(b.member));
}

function runLogicTests() {
  const testEntries = [
    { date: "2026-01-01", member: "A", hours: 2, diesel: 10, type: "innerbetrieblich", note: "" },
    { date: "2026-01-02", member: "A", hours: 3, diesel: 12, type: "ueberbetrieblich", note: "" },
    { date: "2026-02-01", member: "B", hours: 5, diesel: 20, type: "innerbetrieblich", note: "" },
  ];

  const result = calculateSettlement(testEntries, "2026-01-31", {
    innerbetrieblich: 10,
    ueberbetrieblich: 20,
  });

  console.assert(result.length === 1, "Nur Mitglied A sollte im Jänner enthalten sein.");
  console.assert(result[0].innerHours === 2, "Innerbetriebliche Stunden sollten 2 sein.");
  console.assert(result[0].outerHours === 3, "Überbetriebliche Stunden sollten 3 sein.");
  console.assert(result[0].diesel === 22, "Dieselmenge sollte 22 Liter sein.");
  console.assert(result[0].amount === 80, "Betrag sollte 80 Euro sein.");
}

runLogicTests();

function Card({ children, className = "" }) {
  return <div className={`card ${className}`}>{children}</div>;
}

function Badge({ children, tone = "default" }) {
  return <span className={`badge badge-${tone}`}>{children}</span>;
}

function Field({ label, children }) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
    </label>
  );
}

export default function App() {
  const [session, setSession] = useState(null);
  const [loginEmail, setLoginEmail] = useState("");
  const [profile, setProfile] = useState(null);
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [deadline, setDeadline] = useState(new Date().toISOString().slice(0, 10));
  const [form, setForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    member: "",
    hours: "",
    diesel: "",
    type: "innerbetrieblich",
    note: "",
  });

  const role = profile?.role || "member";
  const canEditAll = role === "admin" || role === "cashier";

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      setMessage("Supabase ist noch nicht eingerichtet. Bitte VITE_SUPABASE_URL und VITE_SUPABASE_ANON_KEY setzen.");
      return;
    }

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      setSession(currentSession);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session?.user) {
      setProfile(null);
      setEntries([]);
      setLoading(false);
      return;
    }

    loadProfileAndEntries();
  }, [session]);

  async function loadProfileAndEntries(options = { clearMessage: true }) {
    setLoading(true);
    if (options.clearMessage) setMessage("");

    const user = session.user;
    const email = user.email || "";
    const fallbackName = email.split("@")[0] || "Mitglied";

    const { data: existingProfile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError) {
      setMessage(profileError.message);
      setLoading(false);
      return;
    }

    let nextProfile = existingProfile;

    if (!nextProfile) {
      const { data: createdProfile, error: createError } = await supabase
        .from("profiles")
        .insert({
          id: user.id,
          email,
          name: fallbackName,
          role: "member",
        })
        .select()
        .single();

      if (createError) {
        setMessage(createError.message);
        setLoading(false);
        return;
      }

      nextProfile = createdProfile;
    }

    setProfile(nextProfile);
    setForm((current) => ({ ...current, member: "" }));

    const { data: rows, error: entriesError } = await supabase
      .from("machine_entries")
      .select("*")
      .order("date", { ascending: false })
      .order("created_at", { ascending: false });

    if (entriesError) {
      setMessage(entriesError.message);
    } else {
      setEntries(
        (rows || []).map((row) => ({
          id: row.id,
          date: row.date,
          member: row.member_name,
          hours: row.hours,
          diesel: row.diesel_liters,
          type: row.usage_type,
          note: row.note || "",
          createdBy: row.created_by,
        }))
      );
    }

    setLoading(false);
  }

  async function sendMagicLink(event) {
    event.preventDefault();
    if (!loginEmail) return;

    const { error } = await supabase.auth.signInWithOtp({
      email: loginEmail,
      options: {
        emailRedirectTo: window.location.origin,
      },
    });

    if (error) {
      setMessage(error.message);
    } else {
      setMessage("Login-Link wurde per E-Mail gesendet. Bitte Posteingang prüfen.");
    }
  }

  async function signOut() {
    await supabase.auth.signOut();
  }

  async function saveEntry(event) {
    event.preventDefault();

    if (!session?.user) {
      setMessage("Bitte zuerst anmelden.");
      return;
    }

    if (!form.date || !form.member || !form.hours) {
      alert("Bitte mindestens Datum, Mitglied und Betriebsstunden ausfüllen.");
      return;
    }

    const newEntry = {
      machine_name: MACHINE_NAME,
      date: form.date,
      member_name: form.member,
      hours: Number(form.hours),
      diesel_liters: Number(form.diesel) || 0,
      usage_type: form.type,
      note: form.note.trim(),
      created_by: session.user.id,
    };

    const { data: insertedEntry, error } = await supabase
      .from("machine_entries")
      .insert(newEntry)
      .select()
      .single();

    if (error) {
      setMessage(error.message);
      return;
    }

    const { error: emailError } = await supabase.functions.invoke("send-entry-email", {
      body: {
        entry: insertedEntry,
        submittedBy: profile?.name || session.user.email || "Unbekannt",
      },
    });

    if (emailError) {
      setMessage(`Eintrag gespeichert, aber E-Mail konnte nicht gesendet werden: ${emailError.message}`);
    } else {
      setMessage("Eintrag gespeichert. E-Mail-Benachrichtigung wurde gesendet.");
    }

    setForm({
      date: new Date().toISOString().slice(0, 10),
      member: "",
      hours: "",
      diesel: "",
      type: "innerbetrieblich",
      note: "",
    });

    await loadProfileAndEntries({ clearMessage: false });
  }

  async function deleteEntry(id) {
    if (!canEditAll) return;

    const { error } = await supabase.from("machine_entries").delete().eq("id", id);

    if (error) {
      setMessage(error.message);
      return;
    }

    await loadProfileAndEntries();
  }

  function exportSettlementCsv() {
    const header = ["Mitglied", "Innerbetriebliche Stunden", "Überbetriebliche Stunden", "Diesel gesamt", "Betrag EUR"];
    const rows = settlement.map((row) => [
      row.member,
      row.innerHours.toFixed(2),
      row.outerHours.toFixed(2),
      row.diesel.toFixed(1),
      row.amount.toFixed(2),
    ]);

    const csv = [header, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(";"))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `abrechnung_bagger_ez80_${deadline}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  const visibleEntries = entries;
  const settlement = useMemo(() => calculateSettlement(entries, deadline), [entries, deadline]);
  const totalHours = entries.reduce((sum, entry) => sum + Number(entry.hours || 0), 0);
  const totalDiesel = entries.reduce((sum, entry) => sum + Number(entry.diesel || 0), 0);
  const noteCount = entries.filter((entry) => {
    const note = String(entry.note || "").toLowerCase();
    return note.includes("schaden") || note.includes("schäden") || note.includes("kontrollieren") || note.includes("wartung");
  }).length;

  if (!session) {
    return (
      <div className="page login-page">
        <Card className="login-card">
          <h1>Bagger EZ80</h1>
          <p>Bitte mit E-Mail anmelden. Du bekommst einen Login-Link ohne Passwort.</p>

          <form className="form" onSubmit={sendMagicLink}>
            <Field label="E-Mail">
              <input type="email" placeholder="name@example.com" value={loginEmail} onChange={(event) => setLoginEmail(event.target.value)} />
            </Field>
            <button className="primary" type="submit">Login-Link senden</button>
          </form>

          {message && <p className="message">{message}</p>}
        </Card>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="container">
        <header className="header">
          <div>
            <h1>Maschinengemeinschaft</h1>
            <p>{MACHINE_NAME}: Betriebsstunden, Diesel, Schäden und Abrechnung per QR-Code.</p>
          </div>

          <div className="role-box">
            <Badge tone="blue">{profile?.name || session.user.email}</Badge>
            <Badge tone="green">{role === "admin" ? "Verwalter" : role === "cashier" ? "Kassier" : "Mitglied"}</Badge>
            <button className="secondary" onClick={signOut}>Abmelden</button>
          </div>
        </header>

        {message && <Card className="notice">{message}</Card>}

        {loading ? (
          <Card>Lade Daten...</Card>
        ) : (
          <>
            <section className="stats">
              <Card><div className="icon">⏱️</div><small>Betriebsstunden</small><strong>{totalHours.toFixed(2)} h</strong></Card>
              <Card><div className="icon">⛽</div><small>Diesel gesamt</small><strong>{totalDiesel.toFixed(1)} l</strong></Card>
              <Card><div className="icon">🚜</div><small>Maschine</small><strong className="smaller">{MACHINE_NAME}</strong></Card>
              <Card><div className="icon">🔧</div><small>Hinweise / Schäden</small><strong>{noteCount}</strong></Card>
            </section>

            <main className="main-grid">
              <Card>
                <div className="card-head">
                  <div>
                    <h2>Neue Erfassung</h2>
                    <p>Diese Seite wird per QR-Code direkt am {MACHINE_NAME} geöffnet.</p>
                  </div>
                  <div className="qr-symbol">▦</div>
                </div>

                <form onSubmit={saveEntry} className="form">
                  <div className="machine-pill"><strong>Maschine:</strong> {MACHINE_NAME}</div>

                  <Field label="Datum">
                    <input type="date" value={form.date} onChange={(event) => setForm({ ...form, date: event.target.value })} />
                  </Field>

                  <Field label="Mitglied / Fahrer">
                    <select value={form.member} onChange={(event) => setForm({ ...form, member: event.target.value })}>
                      <option value="">Bitte Mitglied auswählen</option>
                      {members.map((member) => <option key={member} value={member}>{member}</option>)}
                    </select>
                  </Field>

                  <Field label="Betriebsstunden">
                    <input type="number" min="0" step="0.25" placeholder="z. B. 2,5" value={form.hours} onChange={(event) => setForm({ ...form, hours: event.target.value })} />
                  </Field>

                  <Field label="Getankte Dieselmenge in Liter">
                    <input type="number" min="0" step="0.1" placeholder="z. B. 18" value={form.diesel} onChange={(event) => setForm({ ...form, diesel: event.target.value })} />
                  </Field>

                  <Field label="Einsatzart">
                    <select value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value })}>
                      <option value="innerbetrieblich">Innerbetrieblich — Standard, € 15/h</option>
                      <option value="ueberbetrieblich">Überbetrieblich, € 50/h</option>
                    </select>
                  </Field>

                  <Field label="Bemerkung / Schäden">
                    <textarea placeholder="z. B. Schaden, Wartung, Besonderheiten" value={form.note} onChange={(event) => setForm({ ...form, note: event.target.value })} />
                  </Field>

                  <button className="primary" type="submit">Speichern</button>
                </form>
              </Card>

              <Card className="wide">
                <div className="card-head">
                  <div>
                    <h2>Einträge</h2>
                    <p>Mitglieder können erfassen. Kassier und Verwalter können löschen und abrechnen.</p>
                  </div>
                  {canEditAll ? <Badge tone="green">Gesamteinsicht & Bearbeitung</Badge> : <Badge>Erfassung</Badge>}
                </div>

                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Datum</th>
                        <th>Mitglied</th>
                        <th className="right">Std.</th>
                        <th className="right">Diesel</th>
                        <th>Art</th>
                        <th>Bemerkung</th>
                        {canEditAll && <th className="right">Aktion</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {visibleEntries.length === 0 && (
                        <tr><td colSpan={canEditAll ? 7 : 6} className="empty">Keine Einträge vorhanden.</td></tr>
                      )}

                      {visibleEntries.map((entry) => (
                        <tr key={entry.id}>
                          <td>{entry.date}</td>
                          <td>{entry.member}</td>
                          <td className="right">{Number(entry.hours).toFixed(2)}</td>
                          <td className="right">{Number(entry.diesel).toFixed(1)} l</td>
                          <td><Badge tone={entry.type === "innerbetrieblich" ? "green" : "amber"}>{entry.type === "innerbetrieblich" ? "innerbetrieblich" : "überbetrieblich"}</Badge></td>
                          <td className="note">{entry.note || "—"}</td>
                          {canEditAll && <td className="right"><button className="ghost" onClick={() => deleteEntry(entry.id)}>Löschen</button></td>}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </main>

            {(role === "cashier" || role === "admin") && (
              <Card>
                <div className="card-head">
                  <div>
                    <h2>Abrechnung für Kassier</h2>
                    <p>Stichtagsliste für {MACHINE_NAME}: innerbetrieblich € 15/h, überbetrieblich € 50/h.</p>
                  </div>
                  <div className="export-box">
                    <input type="date" value={deadline} onChange={(event) => setDeadline(event.target.value)} />
                    <button className="secondary" onClick={exportSettlementCsv}>CSV exportieren</button>
                  </div>
                </div>

                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Mitglied</th>
                        <th className="right">Innerbetr. Stunden</th>
                        <th className="right">Überbetr. Stunden</th>
                        <th className="right">Diesel gesamt</th>
                        <th className="right">Betrag</th>
                      </tr>
                    </thead>
                    <tbody>
                      {settlement.length === 0 && (
                        <tr><td colSpan="5" className="empty">Keine Daten bis zu diesem Stichtag.</td></tr>
                      )}

                      {settlement.map((row) => (
                        <tr key={row.member}>
                          <td><strong>{row.member}</strong></td>
                          <td className="right">{row.innerHours.toFixed(2)} h × € 15</td>
                          <td className="right">{row.outerHours.toFixed(2)} h × € 50</td>
                          <td className="right">{row.diesel.toFixed(1)} l</td>
                          <td className="right"><strong>€ {row.amount.toFixed(2)}</strong></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}

            <Card>
              <h2>QR-Code & Startbildschirm</h2>
              <p>
                Nach der Veröffentlichung wird der öffentliche Link als QR-Code am {MACHINE_NAME} angebracht.
                iPhone: Link öffnen → Teilen → „Zum Home-Bildschirm“. Android: Link öffnen → Menü → „App installieren“.
              </p>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
