
function doPost(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Einträge");
  if (!sheet) {
    sheet = SpreadsheetApp.getActiveSpreadsheet().insertSheet("Einträge");
    sheet.appendRow([
      "Erfasst am",
      "Datum",
      "Maschine",
      "Mitglied",
      "Betriebsstunden",
      "Diesel Liter",
      "Einsatzart",
      "Stundensatz",
      "Betrag",
      "Bemerkung"
    ]);
  }

  var data = JSON.parse(e.postData.contents);

  var stundensatz = data.einsatzart === "ueberbetrieblich" ? 50 : 15;
  var stunden = Number(data.betriebsstunden || 0);
  var betrag = stunden * stundensatz;

  sheet.appendRow([
    new Date(),
    data.datum || "",
    data.maschine || "Bagger EZ80",
    data.mitglied || "",
    stunden,
    Number(data.diesel || 0),
    data.einsatzart === "ueberbetrieblich" ? "überbetrieblich" : "innerbetrieblich",
    stundensatz,
    betrag,
    data.bemerkung || ""
  ]);

  return ContentService
    .createTextOutput(JSON.stringify({ ok: true }))
    .setMimeType(ContentService.MimeType.JSON);
}

function doGet() {
  return ContentService
    .createTextOutput("Bagger EZ80 Erfassung ist aktiv.")
    .setMimeType(ContentService.MimeType.TEXT);
}
