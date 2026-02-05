/**
 * resQ Amal Backend - Google Apps Script (v2.3)
 * 
 * URL yang dibekalkan oleh user:
 * https://script.google.com/macros/s/AKfycbzxTJSmAUVSNBhIFCnIXi5WMHeIqb9BhyeaBOm51REMZEl-nQDC4GlxZZRKXEjI3SWoqA/exec
 */

const MASTER_SHEET_NAME = "Master_Users_List";

function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('🚀 resQ Amal')
    .addItem('Sediakan Semua Sheet & Header', 'setupSystemSheets')
    .addSeparator()
    .addSubMenu(ui.createMenu('Sediakan Sheet Spesifik')
      .addItem('Sheet Maklumat Program', 'setupProgramsSheet')
      .addItem('Sheet Maklumat Responder', 'setupRespondersSheet')
      .addItem('Sheet Laporan Kes', 'setupCasesSheet'))
    .addSeparator()
    .addItem('Semak Status Backend', 'checkStatus')
    .addToUi();
}

function setupSystemSheets() {
  setupProgramsSheet();
  setupRespondersSheet();
  setupCasesSheet();
  SpreadsheetApp.getUi().alert('Sistem Berjaya Diarkibkan. Semua Sheet dan Header utama telah disediakan.');
}

function setupProgramsSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  getOrCreateSheet(ss, "Summary_Programs", ["id", "name", "location", "date", "time", "state", "status"]);
}

function setupRespondersSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  getOrCreateSheet(ss, MASTER_SHEET_NAME, ["id", "name", "role", "state", "createdAt", "spreadsheetId"]);
}

function setupCasesSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  getOrCreateSheet(ss, "Summary_Cases", ["id", "programId", "responderName", "checkpoint", "patientName", "complaint", "status", "timestamp", "latitude", "longitude"]);
}

function checkStatus() {
  SpreadsheetApp.getUi().alert('Backend resQ Amal sedang aktif.');
}

function doPost(e) {
  try {
    const requestData = JSON.parse(e.postData.contents);
    const action = requestData.action;
    const data = requestData.data;
    
    switch (action) {
      case 'register':
        return handleRegistration(data);
      case 'sync':
        return handleSync(data, requestData.spreadsheetId);
      case 'test_connection':
        return handleTestConnection();
      default:
        return createResponse({ status: 'error', message: 'Tindakan tidak sah' });
    }
  } catch (err) {
    return createResponse({ status: 'error', message: err.toString() });
  }
}

/**
 * Mengembalikan struktur spreadsheet untuk pengesahan frontend.
 */
function handleTestConnection() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheets = ss.getSheets();
  const structure = {};
  
  sheets.forEach(sheet => {
    const name = sheet.getName();
    const lastCol = sheet.getLastColumn();
    let headers = [];
    if (lastCol > 0) {
      headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
    }
    structure[name] = headers;
  });
  
  return createResponse({ 
    status: 'success', 
    message: 'Sambungan aktif', 
    structure: structure 
  });
}

function handleRegistration(userData) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const masterSheet = getOrCreateSheet(ss, MASTER_SHEET_NAME, ["id", "name", "role", "state", "createdAt", "spreadsheetId"]);
  
  const fileName = `resQ_Data_${userData.role}_${userData.id}_${userData.name}`;
  const newSs = SpreadsheetApp.create(fileName);
  const personalSsId = newSs.getId();
  
  if (userData.role === 'Responder') {
    getOrCreateSheet(newSs, "cases", ["id", "programId", "patientName", "complaint", "status", "timestamp", "latitude", "longitude"]);
    getOrCreateSheet(newSs, "attendance", ["id", "programId", "checkpoint", "entryTime", "lat", "lng"]);
  } else {
    getOrCreateSheet(newSs, "programs", ["id", "name", "location", "date", "time", "state", "status"]);
    getOrCreateSheet(newSs, "cases_received", ["id", "programId", "responderName", "patientName", "status", "timestamp"]);
  }

  const row = [userData.id, userData.name, userData.role, userData.state, userData.createdAt, personalSsId];
  masterSheet.appendRow(row);
  
  return createResponse({ 
    status: 'success', 
    message: 'User berdaftar', 
    spreadsheetId: personalSsId 
  });
}

function handleSync(syncItems, targetSsId) {
  if (!targetSsId) return createResponse({ status: 'error', message: 'ID Spreadsheet tidak sah.' });
  try {
    const ss = SpreadsheetApp.openById(targetSsId);
    const items = Array.isArray(syncItems) ? syncItems : [syncItems];
    items.forEach(item => {
      const sheetName = item.type; 
      const payload = item.payload;
      const headers = Object.keys(payload);
      const sheet = getOrCreateSheet(ss, sheetName, headers);
      const currentHeaders = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
      const values = currentHeaders.map(h => payload[h] !== undefined ? payload[h] : "");
      sheet.appendRow(values);
      syncToMaster(item);
    });
    return createResponse({ status: 'success', message: 'Data disinkronkan.' });
  } catch (err) {
    return createResponse({ status: 'error', message: err.toString() });
  }
}

function syncToMaster(item) {
  const masterSs = SpreadsheetApp.getActiveSpreadsheet();
  let masterSheet;
  if (item.type === 'cases') {
    masterSheet = getOrCreateSheet(masterSs, "Summary_Cases", Object.keys(item.payload));
  } else if (item.type === 'programs') {
    masterSheet = getOrCreateSheet(masterSs, "Summary_Programs", Object.keys(item.payload));
  }
  if (masterSheet) {
    const headers = masterSheet.getRange(1, 1, 1, masterSheet.getLastColumn()).getValues()[0];
    const values = headers.map(h => item.payload[h] !== undefined ? payload[h] : "");
    masterSheet.appendRow(values);
  }
}

function getOrCreateSheet(ss, name, headers) {
  let sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    sheet.getRange(1, 1, 1, headers.length)
         .setValues([headers])
         .setFontWeight("bold")
         .setBackground("#f3f4f6")
         .setFontColor("#111827")
         .setHorizontalAlignment("center");
    sheet.setFrozenRows(1);
    sheet.autoResizeColumns(1, headers.length);
  } else {
    const currentHeaders = sheet.getRange(1, 1, 1, Math.max(1, sheet.getLastColumn())).getValues()[0];
    const newHeaders = headers.filter(h => !currentHeaders.includes(h));
    if (newHeaders.length > 0) {
      const startCol = sheet.getLastColumn() + 1;
      sheet.getRange(1, startCol, 1, newHeaders.length)
           .setValues([newHeaders])
           .setFontWeight("bold")
           .setBackground("#f3f4f6");
      sheet.autoResizeColumns(startCol, newHeaders.length);
    }
  }
  return sheet;
}

function createResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function doGet(e) {
  return ContentService.createTextOutput("Backend resQ Amal AKTIF.").setMimeType(ContentService.MimeType.TEXT);
}