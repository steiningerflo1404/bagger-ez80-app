
function toNumber(value) {
  if (value === null || value === undefined || value === "") return 0;
  return Number(String(value).replace(",", "."));
}

function doPost(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Einträge");

  if (!sheet) {
    sheet = SpreadsheetApp.getActiveSpreadsheet().insertSheet("Einträge");
    sheet.appendRow([
      "Erfasst am",
      "Zeitraum von",
      "Zeitraum bis",
      "Maschine",
      "Mitglied",
      "Stundenzähler Beginn",
      "Stundenzähler Ende",
      "Gefahrene Stunden",
      "Diesel Liter",
      "Einsatzart",
      "Stundensatz",
      "Betrag",
      "Getankt",
      "Abgeschmiert",
      "Bemerkung"
    ]);
  }

  var data = JSON.parse(e.postData.contents);

  var stundensatz = data.einsatzart === "ueberbetrieblich" ? 50 : 15;
  var start = toNumber(data.stundenStart);
  var ende = toNumber(data.stundenEnde);
  var gefahreneStunden = Math.round((ende - start) * 100) / 100;

  if (gefahreneStunden < 0) gefahreneStunden = 0;

  var diesel = toNumber(data.diesel);
  var betrag = Math.round(gefahreneStunden * stundensatz * 100) / 100;

  sheet.appendRow([
    new Date(),
    data.datumVon || "",
    data.datumBis || "",
    data.maschine || "Bagger EZ80",
    data.mitglied || "",
    start,
    ende,
    gefahreneStunden,
    diesel,
    data.einsatzart === "ueberbetrieblich" ? "überbetrieblich" : "innerbetrieblich",
    stundensatz,
    betrag,
    data.getankt ? "Ja" : "Nein",
    data.abgeschmiert ? "Ja" : "Nein",
    data.bemerkung || ""
  ]);

  return ContentService
    .createTextOutput(JSON.stringify({ ok: true }))
    .setMimeType(ContentService.MimeType.JSON);
}

function doGet(e) {
  var action = e && e.parameter ? e.parameter.action : "";

  if (action === "last") {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Einträge");

    if (!sheet || sheet.getLastRow() < 2) {
      return ContentService
        .createTextOutput(JSON.stringify({ ok: true, lastEnde: "" }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    var lastRow = sheet.getLastRow();
    var lastEnde = sheet.getRange(lastRow, 7).getValue();

    return ContentService
      .createTextOutput(JSON.stringify({ ok: true, lastEnde: lastEnde }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  return ContentService
    .createTextOutput("Bagger EZ80 Erfassung ist aktiv.")
    .setMimeType(ContentService.MimeType.TEXT);
}
