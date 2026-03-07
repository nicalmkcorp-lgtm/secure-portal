import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { AppSession, AppUser } from '../types';

interface LoginScreenProps {
  onLogin: (session: AppSession, scriptUrl: string) => void;
  initialScriptUrl?: string;
  themeColor?: string;
}

const ShieldIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>;
const UserIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>;
const LinkIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>;
const KeyIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m21 2-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0 3 3L22 7l-3-3y-1.5L15.5 7.5z"/></svg>;
const CloudOffIcon = ({ size = 24 }: { size?: number }) => <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m2 2 20 20"/><path d="M6.39 6.39a5 5 0 0 0 7.07 7.07"/><path d="M11.77 6.17a5 5 0 0 1 7.27 4.2"/><path d="M21 16h-4.5"/><path d="M4.5 16H3a5 5 0 0 1 0-10h1.5"/></svg>;
const EyeIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>;
const EyeOffIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.52 13.52 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" x2="22" y1="2" y2="22"/></svg>;

const DEPLOYMENT_SCRIPT = `// Unified Cloud Engine v203.4 (Optimized IDs)
const HISTORY_SHEET_NAME = "history";
const CONFIG_SHEET_NAME = "_TabConfigs_";
const USERS_SHEET_NAME = "USERS";
const METRICS_SHEET_NAME = "_REPORT_SUMMARY_";
const INVESTORS_SHEET_NAME = "Investors";
const SIGNATURES_SHEET_NAME = "Signatures";
const CONTRACTS_SHEET_NAME = "_Contracts_";
const SKIP_ROWS = 3; 

function isSystemSheet(sheetName) {
  var name = sheetName.toLowerCase().trim();
  return name.startsWith("_") || name.startsWith("report_") || name === HISTORY_SHEET_NAME.toLowerCase() || name === "earnings" || name === USERS_SHEET_NAME.toLowerCase() || name === INVESTORS_SHEET_NAME.toLowerCase() || name === SIGNATURES_SHEET_NAME.toLowerCase() || name === CONTRACTS_SHEET_NAME.toLowerCase() || name === "main ledger" || name.endsWith(" incoming") || name.endsWith(" outgoing");
}

function getTabConfigs(ss) {
  var sheet = ss.getSheetByName(CONFIG_SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(CONFIG_SHEET_NAME);
    ensureHeaders(sheet, 'config');
  }
  var data = sheet.getDataRange().getValues();
  var configs = { types: {}, currencyConfigs: {}, rentTabPhotos: {}, rentBannerSettings: {}, appPin: "", authorizedSignature: "", fundHolderName: "", operatorName: "", lenderName: "", githubPagesUrl: "" };
  for (var i = 1; i < data.length; i++) {
    var key = data[i][0];
    if (!key) continue;
    var val = data[i][1];
    if (key === "appPin") configs.appPin = val.toString();
    else if (key === "authorizedSignature") configs.authorizedSignature = val.toString();
    else if (key === "fundHolderName") configs.fundHolderName = val.toString();
    else if (key === "operatorName") configs.operatorName = val.toString();
    else if (key === "lenderName") configs.lenderName = val.toString();
    else if (key === "githubPagesUrl") configs.githubPagesUrl = val.toString();
    else if (key.indexOf("type_") === 0) configs.types[key.replace("type_", "")] = val;
    else if (key.indexOf("currency_") === 0) {
      try { configs.currencyConfigs[key.replace("currency_", "")] = JSON.parse(val); } catch(e) {}
    }
    else if (key.indexOf("rent_photo_") === 0) {
      configs.rentTabPhotos[key.replace("rent_photo_", "")] = val;
    }
    else if (key.indexOf("rent_qr1_") === 0) {
      var tab = key.replace("rent_qr1_", "");
      if (!configs.rentBannerSettings[tab]) configs.rentBannerSettings[tab] = {};
      configs.rentBannerSettings[tab].qrCode1 = val;
    }
    else if (key.indexOf("rent_qr2_") === 0) {
      var tab = key.replace("rent_qr2_", "");
      if (!configs.rentBannerSettings[tab]) configs.rentBannerSettings[tab] = {};
      configs.rentBannerSettings[tab].qrCode2 = val;
    }
    else if (key.indexOf("rent_banner_") === 0) {
      var tab = key.replace("rent_banner_", "");
      try { 
        var s = JSON.parse(val); 
        if (configs.rentBannerSettings[tab]) {
           if (configs.rentBannerSettings[tab].qrCode1) s.qrCode1 = configs.rentBannerSettings[tab].qrCode1;
           if (configs.rentBannerSettings[tab].qrCode2) s.qrCode2 = configs.rentBannerSettings[tab].qrCode2;
        }
        configs.rentBannerSettings[tab] = s;
      } catch(e) {}
    }
  }
  return configs;
}

function ensureHeaders(sheet, type) {
    if (!sheet) return;
    var lastRow = sheet.getLastRow();
    if (lastRow >= SKIP_ROWS) return; 
    
    var headers = [];
    var color = "#1e293b"; 
    
    if (type === 'users') { headers = ["ID", "Username", "Password", "Restrictions"]; }
    else if (type === 'salary') { headers = ["ID", "Start Date", "End Date", "Amount", "Remarks"]; }
    else if (type === 'business') { headers = ["ID", "Type", "Name", "Amount", "Date", "Remarks"]; }
    else if (type === 'savings') { headers = ["ID", "Type", "Name", "Amount", "Date", "Status", "Remarks", "Actual"]; }
    else if (type === 'supply' || type === 'product') { headers = ["Id", "Type", "Name", "Code", "Quantity", "Price", "Date", "Remarks", "Min", "Max"]; }
    else if (type === 'supply_trans') { headers = ["log Id", "Trans Type", "Product", "Quantity", "Date", "Remarks"]; }
    else if (type === 'config') { headers = ["Key", "Value"]; }
    else if (type === 'metrics') { headers = ["Category", "Metric Label", "Value", "Currency/Unit", "Update Date"]; color = "#0f172a"; }
    else if (type === 'cashflow') { headers = ["Id", "amount", "Date", "Remarks", "Reference", "Type (income or expense)", "Tab (tab name)"]; }
    else if (type === 'investors') { headers = ["ID", "Name", "Bank Name", "Bank Number", "Amount", "Date Invested", "Percent", "Monthly Amount"]; }
    else if (type === 'signatures') { headers = ["ID", "Signer Name", "Address", "Date Signed", "Signature (Base64)", "Status", "Term", "Period", "Amount Per Due", "Amount", "Start Date", "End Date", "Type"]; }
    else if (type === 'contracts') { headers = ["Draft ID", "Person Name", "Data (JSON)", "Created At", "Status"]; }
    else { headers = ["ID", "Name", "Amount", "Date", "Remarks", "Facebook", "Contact", "EndDate", "Status", "Type", "Tab", "Sales Entry Type"]; }
    
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]).setFontWeight("bold").setBackground(color).setFontColor("white");
    
    if (type === 'cashflow') {
      sheet.getRange("A2").setValue(0).setBackground("#f1f5f9").setFontWeight("bold");
      sheet.getRange("B2").setValue("Initial Balance (Enter Left)").setFontStyle("italic").setFontColor("#64748b");
    } else {
      var metaRow = headers.map(function() { return "SYSTEM_METADATA_RESERVED"; });
      sheet.getRange(2, 1, 1, headers.length).setBackground("#fafafa").setFontColor("#cbd5e1").setFontSize(7).setValues([metaRow]);
    }
    
    var reservedRow = headers.map(function() { return "---"; });
    sheet.getRange(3, 1, 1, headers.length).setBackground("#f8fafc").setValues([reservedRow]).setFontColor("#e2e8f0").setFontSize(8);
}

function safeAppend(sheet, rowData) {
  var lastRow = sheet.getLastRow();
  var targetRow = Math.max(SKIP_ROWS + 1, lastRow + 1);
  sheet.getRange(targetRow, 1, 1, rowData.length).setValues([rowData]);
}

function getRecords(sheet, type) {
  if (!sheet) return [];
  var data = sheet.getDataRange().getValues();
  if (data.length <= SKIP_ROWS) return [];
  var tz = SpreadsheetApp.getActiveSpreadsheet().getSpreadsheetTimeZone();
  var formatDateSafe = function(val) {
    if (!val) return "";
    var d = new Date(val);
    if (!isNaN(d.getTime())) return Utilities.formatDate(d, tz, "yyyy-MM-dd");
    return val.toString().split('T')[0];
  };

  return data.slice(SKIP_ROWS).map(function(row) {
    if (!row[0] || row[0].toString().trim() === "" || row[0] === "---") return null;
    var record = { id: row[0].toString() };
    if (type === 'signatures') { 
        record.signerName = row[1] ? row[1].toString() : "";
        record.signerAddress = row[2] ? row[2].toString() : "";
        record.signatureDate = formatDateSafe(row[3]); 
        record.signature = row[4] ? row[4].toString() : ""; 
        record.term = row[6] ? row[6].toString() : "";
        record.period = row[7] ? row[7].toString() : "";
        record.amountPerDue = row[8] ? row[8].toString() : "";
        return record; 
    }
    if (type === 'users') {
      record.username = row[1] ? row[1].toString() : "";
      record.password = row[2] ? row[2].toString() : "";
      try { record.restrictions = row[3] ? JSON.parse(row[3].toString()) : []; } catch(e) { record.restrictions = []; }
      return record;
    }
    if (type === 'salary') { record.date = formatDateSafe(row[1]); record.endDate = formatDateSafe(row[2]); record.amount = Number(row[3]) || 0; record.remarks = row[4] ? row[4].toString() : ""; record.name = "Salary Payment"; }
    else if (type === 'business') { record.businessEntryType = row[1] ? row[1].toString().toLowerCase().trim() : "expense"; record.name = row[2] ? row[2].toString().trim() : ""; record.amount = Number(row[3]) || 0; record.date = formatDateSafe(row[4]); record.remarks = row[5] ? row[5].toString() : ""; }
    else if (type === 'savings') { record.transactionType = row[1] ? row[1].toString().toLowerCase().trim() : "income"; record.name = row[2] ? row[2].toString().trim() : ""; record.amount = Number(row[3]) || 0; record.date = formatDateSafe(row[4]); record.status = row[5] ? row[5].toString() : "active"; record.remarks = row[6] ? row[6].toString() : ""; record.actualAmount = row[7] ? Number(row[7]) : undefined; }
    else if (type === 'supply' || type === 'product') { record.transactionType = row[1] ? row[1].toString().toLowerCase().trim() : "income"; record.name = row[2] ? row[2].toString().trim() : ""; record.itemCode = row[3] ? row[3].toString().trim() : ""; record.amount = Number(row[4]) || 0; record.price = row[5] ? Number(row[5]) : undefined; record.date = formatDateSafe(row[6]); record.remarks = row[7] ? row[7].toString() : ""; record.minAmount = row[8] ? Number(row[8]) : undefined; record.maxAmount = row[9] ? Number(row[9]) : undefined; }
    else if (type === 'supply_trans') { record.supplySource = row[1] ? row[1].toString().toLowerCase().trim() : "general"; record.name = row[2] ? row[2].toString().trim() : ""; record.amount = Number(row[3]) || 0; record.date = formatDateSafe(row[4]); record.remarks = row[5] ? row[5].toString() : ""; }
    else if (type === 'cashflow') { record.amount = Number(row[1]) || 0; record.date = formatDateSafe(row[2]); record.remarks = row[3] ? row[3].toString() : ""; record.facebookId = row[4] ? row[4].toString() : ""; record.transactionType = row[5] ? row[5].toString().toLowerCase() : "income"; record.name = record.remarks || record.facebookId || "Transaction"; }
    else if (type === 'investors') { record.name = row[1] ? row[1].toString() : ""; record.bankName = row[2] ? row[2].toString() : ""; record.bankNumber = row[3] ? row[3].toString() : ""; record.amount = Number(row[4]) || 0; record.dateInvested = formatDateSafe(row[5]); record.percentPerMonth = Number(row[6]) || 0; record.amountPerMonth = Number(row[7]) || 0; }
    else { record.name = row[1] ? row[1].toString().trim() : ""; record.amount = Number(row[2]) || 0; record.date = formatDateSafe(row[3]); record.remarks = row[4] ? row[4].toString() : ""; record.facebookId = row[5] ? row[5].toString().trim() : ""; record.contactNumber = row[6] ? row[6].toString().trim() : ""; record.endDate = formatDateSafe(row[7]); record.status = row[8] ? row[8].toString().toLowerCase().trim() : "active"; record.transactionType = row[9] ? row[9].toString().toLowerCase().trim() : "no data"; record.tab = row[10] ? row[10].toString() : "no data"; record.salesEntryType = row[11] ? row[11].toString() : ""; }
    return record;
  }).filter(function(r) { return r !== null; });
}

function processSignature(formObject) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SIGNATURES_SHEET_NAME);
  if (!sheet) { sheet = ss.insertSheet(SIGNATURES_SHEET_NAME); ensureHeaders(sheet, 'signatures'); }
  
  var id = formObject.id;
  var draftId = formObject.draftId;
  var name = formObject.signer_name;
  var address = formObject.signer_address;
  var sig = formObject.signature;
  var date = new Date();
  
  var term = formObject.term || "";
  var period = formObject.period || "";
  var amountPerDue = formObject.amount_per_due || "";
  var amount = formObject.amount || "";
  var startDate = formObject.start_date || "";
  var endDate = formObject.end_date || "";
  var type = formObject.type || "";
  
  var data = sheet.getDataRange().getValues();
  var found = false;
  for (var i = SKIP_ROWS; i < data.length; i++) {
    if (data[i][0] == id) {
      sheet.getRange(i + 1, 1, 1, 13).setValues([[id, name, address, date, sig, 'signed', term, period, amountPerDue, amount, startDate, endDate, type]]);
      found = true;
      break;
    }
  }
  if (!found) { safeAppend(sheet, [id, name, address, date, sig, 'signed', term, period, amountPerDue, amount, startDate, endDate, type]); }

  if (draftId) {
     var cSheet = ss.getSheetByName(CONTRACTS_SHEET_NAME);
     if (cSheet) {
        var cData = cSheet.getDataRange().getValues();
        for (var j = SKIP_ROWS; j < cData.length; j++) {
           if (cData[j][0] == draftId) {
              cSheet.deleteRow(j + 1);
              break;
           }
        }
     }
  }
  
  return { status: 'success' };
}

function cleanupOldContracts(ss) {
  var sheet = ss.getSheetByName(CONTRACTS_SHEET_NAME);
  if (!sheet) return;
  var data = sheet.getDataRange().getValues();
  var now = new Date().getTime();
  var sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
  for (var i = data.length - 1; i >= SKIP_ROWS; i--) {
    var date = new Date(data[i][3]);
    var status = data[i][4];
    if (status === "pending" && (now - date.getTime() > sevenDaysMs)) {
      sheet.deleteRow(i + 1);
    }
  }
}

function doGet(e) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  cleanupOldContracts(ss);
  
  // SUPPORT FOR GITHUB PAGES FETCHING
  if (e.parameter.mode === 'getDraft') {
     var draftId = e.parameter.draftId;
     var draftData = null;
     var cSheet = ss.getSheetByName(CONTRACTS_SHEET_NAME);
     if (cSheet) {
        var cData = cSheet.getDataRange().getValues();
        for(var i = SKIP_ROWS; i < cData.length; i++) {
           if(cData[i][0] == draftId) {
              if (cData[i][4] === "pending") {
                draftData = JSON.parse(cData[i][2]); 
              }
              break;
           }
        }
     }
     return ContentService.createTextOutput(JSON.stringify({ status: draftData ? "success" : "error", data: draftData }))
       .setMimeType(ContentService.MimeType.JSON);
  }

  if (e.parameter.mode === 'sign') {
    var draftId = e.parameter.draftId;
    var draftData = null;
    var isExpired = false;
    
    if (draftId) {
       var cSheet = ss.getSheetByName(CONTRACTS_SHEET_NAME);
       if (cSheet) {
          var cData = cSheet.getDataRange().getValues();
          for(var i = SKIP_ROWS; i < cData.length; i++) {
             if(cData[i][0] == draftId) {
                if (cData[i][4] === "signed") {
                  isExpired = true;
                } else {
                  draftData = JSON.parse(cData[i][2]); 
                }
                break;
             }
          }
       }
    }

    if (isExpired) {
       return HtmlService.createHtmlOutput(
          '<div style="font-family:sans-serif; text-align:center; padding:50px;">' +
          '<h1 style="color:#e11d48;">Link Expired</h1>' +
          '<p>This agreement has already been signed and submitted.</p>' +
          '</div>'
       ).setTitle("Link Expired");
    }

    if (!draftData) {
       return HtmlService.createHtmlOutput("<h1>Invalid or Expired Link</h1>").setTitle("Error");
    }

    var html = getSigningPageHTML();
    html = html.split('__SERVER_DATA_PLACEHOLDER__').join(JSON.stringify(draftData));
    html = html.split('__DRAFT_ID_PLACEHOLDER__').join('"' + draftId + '"');
    
    var output = HtmlService.createHtmlOutput(html)
      .setTitle("Digital Agreement")
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
      .addMetaTag('viewport', 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover');

    return output;
  }

  var configs = getTabConfigs(ss);
  var tabs = ss.getSheets().filter(function(s) { return !isSystemSheet(s.getName()); }).map(function(s) { return s.getName(); });
  var response = { 
    tabs: tabs, 
    tabTypes: configs.types, 
    currencyConfigs: configs.currencyConfigs, 
    rentTabPhotos: configs.rentTabPhotos,
    rentBannerSettings: configs.rentBannerSettings,
    appPin: configs.appPin,
    authorizedSignature: configs.authorizedSignature,
    fundHolderName: configs.fundHolderName,
    operatorName: configs.operatorName,
    lenderName: configs.lenderName,
    githubPagesUrl: configs.githubPagesUrl
  };
  
  var uSheet = ss.getSheetByName(USERS_SHEET_NAME);
  if (uSheet) response.users = getRecords(uSheet, 'users');

  var invSheet = ss.getSheetByName(INVESTORS_SHEET_NAME);
  if (invSheet) response.investors = getRecords(invSheet, 'investors');

  var hSheet = ss.getSheetByName(HISTORY_SHEET_NAME);
  if (hSheet) response.globalHistory = getRecords(hSheet, 'debt');

  var targetTab = e.parameter.tab;
  if (e.parameter.full === 'true') {
    response.allRecords = {};
    tabs.forEach(function(t) {
      try { 
        var sheet = ss.getSheetByName(t); 
        var type = configs.types[t];
        if (sheet) response.allRecords[t] = getRecords(sheet, type); 
      } catch(err) { response.allRecords[t] = []; }
    });
    var sigSheet = ss.getSheetByName(SIGNATURES_SHEET_NAME);
    if (sigSheet) {
      var sigs = getRecords(sigSheet, 'signatures');
      var sigMap = {};
      sigs.forEach(function(s) { sigMap[s.id] = s; });
      response.signatures = sigMap;
    }
    
    var contractSheet = ss.getSheetByName(CONTRACTS_SHEET_NAME);
    if (contractSheet) {
      var cData = contractSheet.getDataRange().getValues();
      var pendingIds = [];
      for (var i = SKIP_ROWS; i < cData.length; i++) {
        if (cData[i][2] && cData[i][4] === "pending") {
          try {
            var draftData = JSON.parse(cData[i][2]);
            if (draftData.id) {
              pendingIds.push(draftData.id.toString());
            }
          } catch(e) {}
        }
      }
      response.pendingDraftIds = pendingIds;
    }
  } else if (targetTab) {
    try { 
      var sheet = ss.getSheetByName(targetTab); 
      var type = e.parameter.type || configs.types[targetTab];
      if (!type && (targetTab.indexOf(" Incoming") !== -1 || targetTab.indexOf(" Outgoing") !== -1)) {
        type = 'supply_trans';
      }
      if (sheet) response.records = getRecords(sheet, type); 
    } catch(err) { response.records = []; }
  }
  
  var json = JSON.stringify(response);
  return ContentService.createTextOutput(json).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var postData = JSON.parse(e.postData.contents);
  var action = postData.action;

  if (action === "processSignature") {
     return ContentService.createTextOutput(JSON.stringify(processSignature(postData))).setMimeType(ContentService.MimeType.JSON);
  }

  if (action === "saveRentTabPhoto") {
    var sheet = ss.getSheetByName(CONFIG_SHEET_NAME);
    if (!sheet) { sheet = ss.insertSheet(CONFIG_SHEET_NAME); ensureHeaders(sheet, 'config'); }
    var key = "rent_photo_" + postData.tab;
    var data = sheet.getDataRange().getValues();
    var found = false;
    for (var i = 1; i < data.length; i++) {
      if (data[i][0] === key) { sheet.getRange(i + 1, 2).setValue(postData.photo); found = true; break; }
    }
    if (!found) sheet.appendRow([key, postData.photo]);
    return ContentService.createTextOutput(JSON.stringify({ status: "success" })).setMimeType(ContentService.MimeType.JSON);
  }

  if (action === "deleteRentTabPhoto") {
    var sheet = ss.getSheetByName(CONFIG_SHEET_NAME);
    if (sheet) {
      var key = "rent_photo_" + postData.tab;
      var data = sheet.getDataRange().getValues();
      for (var i = data.length - 1; i >= 0; i--) {
        if (data[i][0] === key) {
          sheet.deleteRow(i + 1);
        }
      }
    }
    return ContentService.createTextOutput(JSON.stringify({ status: "success" })).setMimeType(ContentService.MimeType.JSON);
  }

  if (action === "saveRentBannerSettings") {
    var sheet = ss.getSheetByName(CONFIG_SHEET_NAME);
    if (!sheet) { sheet = ss.insertSheet(CONFIG_SHEET_NAME); ensureHeaders(sheet, 'config'); }
    
    var settings = postData.settings;
    var qr1 = settings.qrCode1;
    var qr2 = settings.qrCode2;
    
    // Create copy for JSON storage (exclude large QRs)
    var jsonSettings = JSON.parse(JSON.stringify(settings));
    delete jsonSettings.qrCode1;
    delete jsonSettings.qrCode2;
    
    var key = "rent_banner_" + postData.tab;
    var val = JSON.stringify(jsonSettings);
    
    var data = sheet.getDataRange().getValues();
    var found = false;
    for (var i = 1; i < data.length; i++) {
      if (data[i][0] === key) { sheet.getRange(i + 1, 2).setValue(val); found = true; break; }
    }
    if (!found) sheet.appendRow([key, val]);
    
    // Save QR1
    if (qr1) {
        var k1 = "rent_qr1_" + postData.tab;
        var f1 = false;
        var d = sheet.getDataRange().getValues();
        for(var i=1; i<d.length; i++) {
            if(d[i][0] === k1) { sheet.getRange(i+1, 2).setValue(qr1); f1=true; break; }
        }
        if(!f1) sheet.appendRow([k1, qr1]);
    } else if (qr1 === null || qr1 === "") {
        var k1 = "rent_qr1_" + postData.tab;
        var d = sheet.getDataRange().getValues();
        for(var i=d.length-1; i>=1; i--) {
            if(d[i][0] === k1) { sheet.deleteRow(i+1); break; }
        }
    }
    
    // Save QR2
    if (qr2) {
        var k2 = "rent_qr2_" + postData.tab;
        var f2 = false;
        var d = sheet.getDataRange().getValues();
        for(var i=1; i<d.length; i++) {
            if(d[i][0] === k2) { sheet.getRange(i+1, 2).setValue(qr2); f2=true; break; }
        }
        if(!f2) sheet.appendRow([k2, qr2]);
    } else if (qr2 === null || qr2 === "") {
        var k2 = "rent_qr2_" + postData.tab;
        var d = sheet.getDataRange().getValues();
        for(var i=d.length-1; i>=1; i--) {
            if(d[i][0] === k2) { sheet.deleteRow(i+1); break; }
        }
    }
    
    return ContentService.createTextOutput(JSON.stringify({ status: "success" })).setMimeType(ContentService.MimeType.JSON);
  }

  if (action === "saveAccountConfigs") {
    var sheet = ss.getSheetByName(CONFIG_SHEET_NAME);
    if (!sheet) { sheet = ss.insertSheet(CONFIG_SHEET_NAME); ensureHeaders(sheet, 'config'); }
    var data = sheet.getDataRange().getValues();
    var configs = postData.configs;
    
    for (var key in configs) {
      var found = false;
      for (var i = 1; i < data.length; i++) {
        if (data[i][0] === key) { 
          sheet.getRange(i + 1, 2).setValue(configs[key]); 
          found = true; 
          break; 
        }
      }
      if (!found) {
        sheet.appendRow([key, configs[key]]);
      }
    }
    return ContentService.createTextOutput(JSON.stringify({ status: "success" })).setMimeType(ContentService.MimeType.JSON);
  }

  if (action === "saveContractDraft") {
    var sheet = ss.getSheetByName(CONTRACTS_SHEET_NAME);
    if (!sheet) { sheet = ss.insertSheet(CONTRACTS_SHEET_NAME); ensureHeaders(sheet, 'contracts'); }
    // OPTIMIZED: Use Base36 for much shorter IDs
    var draftId = Number(Date.now()).toString(36) + Math.floor(Math.random() * 100).toString(36);
    var personName = postData.data.name || "N/A";
    safeAppend(sheet, [draftId, personName, JSON.stringify(postData.data), new Date(), "pending"]);
    return ContentService.createTextOutput(JSON.stringify({ status: "success", draftId: draftId })).setMimeType(ContentService.MimeType.JSON);
  }

  if (action === "saveAuthorizedSignature") {
    var sheet = ss.getSheetByName(CONFIG_SHEET_NAME);
    if (!sheet) { sheet = ss.insertSheet(CONFIG_SHEET_NAME); ensureHeaders(sheet, 'config'); }
    var data = sheet.getDataRange().getValues();
    var found = false;
    for (var i = 1; i < data.length; i++) {
      if (data[i][0] === "authorizedSignature") { sheet.getRange(i + 1, 2).setValue(postData.signature); found = true; break; }
    }
    if (!found) sheet.appendRow(["authorizedSignature", postData.signature]);
    return ContentService.createTextOutput(JSON.stringify({ status: "success" })).setMimeType(ContentService.MimeType.JSON);
  }

  if (action === "saveMasterPin") {
    var sheet = ss.getSheetByName(CONFIG_SHEET_NAME);
    if (!sheet) { sheet = ss.insertSheet(CONFIG_SHEET_NAME); ensureHeaders(sheet, 'config'); }
    var data = sheet.getDataRange().getValues();
    var found = false;
    for (var i = 1; i < data.length; i++) {
      if (data[i][0] === "appPin") { sheet.getRange(i + 1, 2).setValue(postData.pin.toString()); found = true; break; }
    }
    if (!found) sheet.appendRow(["appPin", postData.pin.toString()]);
    return ContentService.createTextOutput(JSON.stringify({ status: "success" })).setMimeType(ContentService.MimeType.JSON);
  }

  if (action === "saveGlobalMetrics") {
    var mSheet = ss.getSheetByName(METRICS_SHEET_NAME);
    if (!mSheet) { mSheet = ss.insertSheet(METRICS_SHEET_NAME); ensureHeaders(mSheet, 'metrics'); }
    var m = postData.metrics; var d = new Date();
    mSheet.getRange(SKIP_ROWS + 1, 1, 20, 5).clearContent();
    var rows = [
      ["DEBT", "Overdue Total", m.debt.overdue, "PHP", d], ["DEBT", "Today Total", m.debt.today, "PHP", d], ["DEBT", "Total Principal", m.debt.total, "PHP", d],
      ["RENT", "Month Schedule", m.rent.monthSchedule, "QTY", d], ["RENT", "Year Schedule", m.rent.yearSchedule, "QTY", d], ["RENT", "Yearly Realized", m.rent.yearEarnings, "PHP", d],
      ["CASH", "Total Incoming", m.flow.incoming, "PHP", d], ["CASH", "Total Outgoing", m.flow.outgoing, "PHP", d], ["CASH", "Net Balance", m.flow.net, "PHP", d], ["CASH", "In-Bank Total", m.flow.current, "PHP", d],
      ["BIZ", "Capital Invested", m.business.capital, "PHP", d], ["BIZ", "Total Expenses", m.business.expenses, "PHP", d], ["BIZ", "Net Income", m.business.net, "PHP", d],
      ["SALES", "Cycle Capital", m.sales.capital, "PHP", d], ["SALES", "Total Sales", m.sales.sales, "PHP", d], ["SALES", "Total Expenses", m.sales.expenses, "PHP", d], ["SALES", "Net Revenue", m.sales.revenue, "PHP", d]
    ];
    mSheet.getRange(SKIP_ROWS + 1, 1, rows.length, 5).setValues(rows);
    return ContentService.createTextOutput(JSON.stringify({ status: "success" })).setMimeType(ContentService.MimeType.JSON);
  }

  if (action === "addRecords") {
    var sheet = ss.getSheetByName(postData.tab);
    var type = getTabConfigs(ss).types[postData.tab];
    
    var buildRow = function(r) {
      if (type === 'salary') return [r.id, r.date, r.endDate, r.amount, r.remarks];
      else if (type === 'business') return [r.id, r.businessEntryType, r.name, r.amount, r.date, r.remarks];
      else if (type === 'savings') return [r.id, r.transactionType, r.name, r.amount, r.date, r.status, r.remarks, r.actualAmount];
      else if (type === 'supply' || type === 'product') return [r.id, 'income', r.name, r.itemCode, r.amount, r.price, r.date, r.remarks, r.minAmount, r.maxAmount];
      else if (type === 'cashflow') return [r.id, r.amount, r.date, r.remarks, r.facebookId, r.transactionType, r.tab];
      else return [r.id, r.name, r.amount, r.date, r.remarks, r.facebookId, r.contactNumber, r.endDate, r.status, r.transactionType, r.tab, r.salesEntryType];
    };

    if (postData.insertAtStart === true && postData.records.length > 0) {
       var row = buildRow(postData.records[0]);
       sheet.insertRowAfter(SKIP_ROWS);
       sheet.getRange(SKIP_ROWS + 1, 1, 1, row.length).setValues([row]);
    } else if (postData.insertAfter && postData.records.length > 0) {
       var targetId = postData.insertAfter;
       var data = sheet.getDataRange().getValues();
       var foundIndex = -1;
       for (var i = SKIP_ROWS; i < data.length; i++) {
          if (data[i][0] == targetId) { foundIndex = i; break; }
       }
       var row = buildRow(postData.records[0]);
       if (foundIndex !== -1) {
          sheet.insertRowAfter(foundIndex + 1);
          sheet.getRange(foundIndex + 2, 1, 1, row.length).setValues([row]);
       } else {
          safeAppend(sheet, row);
       }
    } else {
       postData.records.forEach(function(r) { safeAppend(sheet, buildRow(r)); });
    }
    return ContentService.createTextOutput(JSON.stringify({ status: "success", records: getRecords(sheet, type) })).setMimeType(ContentService.MimeType.JSON);
  }

  if (action === "updateRecord") {
    var sheet = ss.getSheetByName(postData.tab);
    var type = getTabConfigs(ss).types[postData.tab];
    var r = postData.record;
    var data = sheet.getDataRange().getValues();
    for (var i = SKIP_ROWS; i < data.length; i++) {
      if (data[i][0] == r.id) {
        var row = [];
        if (type === 'salary') row = [r.id, r.date, r.endDate, r.amount, r.remarks];
        else if (type === 'business') row = [r.id, r.businessEntryType, r.name, r.amount, r.date, r.remarks];
        else if (type === 'savings') row = [r.id, r.transactionType, r.name, r.amount, r.date, r.status, r.remarks, r.actualAmount];
        else if (type === 'supply' || type === 'product') row = [r.id, r.transactionType || 'income', r.name, r.itemCode, r.amount, r.price, r.date, r.remarks, r.minAmount, r.maxAmount];
        else if (type === 'cashflow') row = [r.id, r.amount, r.date, r.remarks, r.facebookId, r.transactionType, r.tab];
        else row = [r.id, r.name, r.amount, r.date, r.remarks, r.facebookId, r.contactNumber, r.endDate, r.status, r.transactionType, r.tab, r.salesEntryType];
        sheet.getRange(i + 1, 1, 1, row.length).setValues([row]);
        break;
      }
    }
    return ContentService.createTextOutput(JSON.stringify({ status: "success", records: getRecords(sheet, type) })).setMimeType(ContentService.MimeType.JSON);
  }

  if (action === "deleteRecord") {
    var sheet = ss.getSheetByName(postData.tab);
    var data = sheet.getDataRange().getValues();
    var configs = getTabConfigs(ss);
    var tabType = configs.types[postData.tab] || 'debt';
    var deletedRecordName = "";
    var deletedRecordId = postData.id;
    
    for (var i = SKIP_ROWS; i < data.length; i++) {
      if (data[i][0] == deletedRecordId) {
        deletedRecordName = data[i][1] ? data[i][1].toString().trim() : "";
        if (postData.status) {
          var hSheet = ss.getSheetByName(HISTORY_SHEET_NAME);
          if (!hSheet) { hSheet = ss.insertSheet(HISTORY_SHEET_NAME); ensureHeaders(hSheet, 'debt'); }
          var row = data[i].slice(); 
          row[8] = postData.status; 
          safeAppend(hSheet, row);
        }
        sheet.deleteRow(i + 1); 
        break;
      }
    }

    var sigSheet = ss.getSheetByName(SIGNATURES_SHEET_NAME);
    if (sigSheet) {
      var sigData = sigSheet.getDataRange().getValues();
      var sigFoundIndex = -1;
      for (var j = SKIP_ROWS; j < sigData.length; j++) {
        if (sigData[j][0] == deletedRecordId) { sigFoundIndex = j; break; }
      }
      if (sigFoundIndex !== -1) {
        if (tabType === 'debt' && deletedRecordName !== "") {
          var newData = sheet.getDataRange().getValues();
          var successorId = "";
          for (var k = SKIP_ROWS; k < newData.length; k++) {
            if (newData[k][1] && newData[k][1].toString().trim() === deletedRecordName) {
              successorId = newData[k][0].toString();
              break;
            }
          }
          if (successorId !== "") {
            sigSheet.getRange(sigFoundIndex + 1, 1).setValue(successorId);
          } else {
            sigSheet.deleteRow(sigFoundIndex + 1);
          }
        } else {
          sigSheet.deleteRow(sigFoundIndex + 1);
        }
      }
    }
    return ContentService.createTextOutput(JSON.stringify({ status: "success" })).setMimeType(ContentService.MimeType.JSON);
  }

  if (action === "addTab") {
    var sheet = ss.insertSheet(postData.tab); ensureHeaders(sheet, postData.type);
    var cSheet = ss.getSheetByName(CONFIG_SHEET_NAME);
    if (!cSheet) { cSheet = ss.insertSheet(CONFIG_SHEET_NAME); ensureHeaders(cSheet, 'config'); }
    cSheet.appendRow(["type_" + postData.tab, postData.type]);
    return ContentService.createTextOutput(JSON.stringify({ status: "success" })).setMimeType(ContentService.MimeType.JSON);
  }

  if (action === "updateTab") {
    var oldTab = postData.oldTab;
    var newTab = postData.newTab;
    var sheet = ss.getSheetByName(oldTab); 
    if (sheet) sheet.setName(newTab);
    var cSheet = ss.getSheetByName(CONFIG_SHEET_NAME);
    if (cSheet) {
      var data = cSheet.getDataRange().getValues();
      var typeFound = false;
      for (var i = 0; i < data.length; i++) {
        var key = data[i][0] ? data[i][0].toString() : "";
        if (key === "type_" + oldTab) { 
            cSheet.getRange(i + 1, 1, 1, 2).setValues([["type_" + newTab, postData.newType]]); 
            typeFound = true;
        } else if (key === "currency_" + oldTab) {
            cSheet.getRange(i + 1, 1).setValue("currency_" + newTab);
        } else if (key === "rent_photo_" + oldTab) {
            cSheet.getRange(i + 1, 1).setValue("rent_photo_" + newTab);
        } else if (key === "rent_banner_" + oldTab) {
            cSheet.getRange(i + 1, 1).setValue("rent_banner_" + newTab);
        }
      }
      if (!typeFound) {
         cSheet.appendRow(["type_" + newTab, postData.newType]);
      }
    }
    return ContentService.createTextOutput(JSON.stringify({ status: "success" })).setMimeType(ContentService.MimeType.JSON);
  }

  if (action === "deleteTab") {
    var tabName = postData.tab;
    var sheet = ss.getSheetByName(tabName); 
    if (sheet) ss.deleteSheet(sheet);
    var cSheet = ss.getSheetByName(CONFIG_SHEET_NAME);
    if (cSheet) {
      var data = cSheet.getDataRange().getValues();
      for (var i = data.length - 1; i >= 0; i--) {
        var key = data[i][0] ? data[i][0].toString() : "";
        if (key === "type_" + tabName || key === "currency_" + tabName || key === "rent_photo_" + tabName || key === "rent_banner_" + tabName || key === "rent_qr1_" + tabName || key === "rent_qr2_" + tabName) {
           cSheet.deleteRow(i + 1);
        }
      }
    }
    return ContentService.createTextOutput(JSON.stringify({ status: "success" })).setMimeType(ContentService.MimeType.JSON);
  }

  if (action === "reorderTabs") {
    postData.tabs.forEach(function(t, idx) { var s = ss.getSheetByName(t); if (s) s.activate(); ss.moveActiveSheet(idx + 1); });
    return ContentService.createTextOutput(JSON.stringify({ status: "success" })).setMimeType(ContentService.MimeType.JSON);
  }

  if (action === "addUser" || action === "updateUser") {
    var uSheet = ss.getSheetByName(USERS_SHEET_NAME);
    if (!uSheet) { uSheet = ss.insertSheet(USERS_SHEET_NAME); ensureHeaders(uSheet, 'users'); }
    var u = postData.user; var data = uSheet.getDataRange().getValues(); var found = false;
    for (var i = SKIP_ROWS; i < data.length; i++) {
      if (data[i][0] == u.id) { uSheet.getRange(i + 1, 1, 1, 4).setValues([[u.id, u.username, u.password, JSON.stringify(u.restrictions)]]); found = true; break; }
    }
    if (!found) safeAppend(uSheet, [u.id, u.username, u.password, JSON.stringify(u.restrictions)]);
    return ContentService.createTextOutput(JSON.stringify({ status: "success" })).setMimeType(ContentService.MimeType.JSON);
  }

  if (action === "deleteUser") {
    var uSheet = ss.getSheetByName(USERS_SHEET_NAME); var data = uSheet.getDataRange().getValues();
    for (var i = SKIP_ROWS; i < data.length; i++) { if (data[i][0] == postData.id) { uSheet.deleteRow(i + 1); break; } }
    return ContentService.createTextOutput(JSON.stringify({ status: "success" })).setMimeType(ContentService.MimeType.JSON);
  }

  if (action === "addInvestor") {
    var invSheet = ss.getSheetByName(INVESTORS_SHEET_NAME);
    if (!invSheet) { invSheet = ss.insertSheet(INVESTORS_SHEET_NAME); ensureHeaders(invSheet, 'investors'); }
    var inv = postData.investor;
    safeAppend(invSheet, [inv.id, inv.name, inv.bankName, inv.bankNumber, inv.amount, inv.dateInvested, inv.percentPerMonth, inv.amountPerMonth]);
    return ContentService.createTextOutput(JSON.stringify({ status: "success", investors: getRecords(invSheet, 'investors') })).setMimeType(ContentService.MimeType.JSON);
  }

  if (action === "updateInvestor") {
    var sheet = ss.getSheetByName(INVESTORS_SHEET_NAME);
    var inv = postData.investor;
    var data = sheet.getDataRange().getValues();
    for (var i = SKIP_ROWS; i < data.length; i++) {
      if (data[i][0].toString() == inv.id.toString()) {
        sheet.getRange(i + 1, 2, 1, 7).setValues([[inv.name, inv.bankName, inv.bankNumber, inv.amount, inv.dateInvested, inv.percentPerMonth, inv.amountPerMonth]]);
        break;
      }
    }
    return ContentService.createTextOutput(JSON.stringify({ status: "success", investors: getRecords(sheet, 'investors') })).setMimeType(ContentService.MimeType.JSON);
  }

  if (action === "addSupplyTransaction") {
    var subTab = postData.tab + (postData.transaction.transactionType === 'income' ? " Incoming" : " Outgoing");
    var sSheet = ss.getSheetByName(subTab);
    if (!sSheet) { sSheet = ss.insertSheet(subTab); ensureHeaders(sSheet, 'supply_trans'); }
    var tr = postData.transaction;
    safeAppend(sSheet, [tr.id, tr.supplySource, tr.name, tr.amount, tr.date, tr.remarks]);
    var mainSheet = ss.getSheetByName(postData.tab); var mRec = postData.updatedRecord; var mData = mainSheet.getDataRange().getValues();
    for (var j = SKIP_ROWS; j < mData.length; j++) {
      if (mData[j][0] == mRec.id) { mainSheet.getRange(j + 1, 5).setValue(mRec.amount); mainSheet.getRange(j + 1, 7).setValue(mRec.date); break; }
    }
    return ContentService.createTextOutput(JSON.stringify({ status: "success", records: getRecords(mainSheet, 'supply') })).setMimeType(ContentService.MimeType.JSON);
  }

  if (action === "saveInitialBalance") {
    var sheet = ss.getSheetByName(postData.tab); if (sheet) sheet.getRange("A2").setValue(postData.balance);
    return ContentService.createTextOutput(JSON.stringify({ status: "success" })).setMimeType(ContentService.MimeType.JSON);
  }

  if (action === "bulkReplaceRecords") {
    var sheet = ss.getSheetByName(postData.tab);
    var type = postData.type || getTabConfigs(ss).types[postData.tab];
    if (!type && (postData.tab.indexOf(" Incoming") !== -1 || postData.tab.indexOf(" Outgoing") !== -1)) {
      type = 'supply_trans';
    }
    if (!sheet) {
      sheet = ss.insertSheet(postData.tab);
      ensureHeaders(sheet, type);
    } else {
      // Ensure headers are correct if the sheet already exists
      ensureHeaders(sheet, type);
    }
    var lastRow = sheet.getLastRow(); if (lastRow > SKIP_ROWS) sheet.deleteRows(SKIP_ROWS + 1, lastRow - SKIP_ROWS);
    postData.records.forEach(function(r) {
      var row = [];
      if (type === 'salary') row = [r.id, r.date, r.endDate, r.amount, r.remarks];
      else if (type === 'business') row = [r.id, r.businessEntryType, r.name, r.amount, r.date, r.remarks];
      else if (type === 'savings') row = [r.id, r.transactionType, r.name, r.amount, r.date, r.status, r.remarks, r.actualAmount];
      else if (type === 'supply' || type === 'product') row = [r.id, r.transactionType || 'income', r.name, r.itemCode, r.amount, r.price, r.date, r.remarks, r.minAmount, r.maxAmount];
      else if (type === 'supply_trans') row = [r.id, r.supplySource, r.name, r.amount, r.date, r.remarks];
      else if (type === 'cashflow') row = [r.id, r.amount, r.date, r.remarks, r.facebookId, r.transactionType, r.tab];
      else row = [r.id, r.name, r.amount, r.date, r.remarks, r.facebookId, r.contactNumber, r.endDate, r.status, r.transactionType, r.tab, r.salesEntryType];
      safeAppend(sheet, row);
    });
    return ContentService.createTextOutput(JSON.stringify({ status: "success" })).setMimeType(ContentService.MimeType.JSON);
  }

  if (action === "scrubPersonFromHistory") {
    var hSheet = ss.getSheetByName(HISTORY_SHEET_NAME);
    if (hSheet) {
      var data = hSheet.getDataRange().getValues();
      var targetName = postData.name.toLowerCase().trim();
      var exceptId = postData.exceptId;
      for (var i = data.length - 1; i >= SKIP_ROWS; i--) {
        var rowName = data[i][1] ? data[i][1].toString().toLowerCase().trim() : "";
        var rowId = data[i][0];
        if (rowName === targetName && rowId !== exceptId) {
           hSheet.deleteRow(i + 1);
        }
      }
    }
    return ContentService.createTextOutput(JSON.stringify({ status: "success" })).setMimeType(ContentService.MimeType.JSON);
  }

  if (action === "deleteHistoryById") {
    var hSheet = ss.getSheetByName(HISTORY_SHEET_NAME);
    if (hSheet) {
      var data = hSheet.getDataRange().getValues();
      for (var i = SKIP_ROWS; i < data.length; i++) {
        if (data[i][0] == postData.id) { hSheet.deleteRow(i + 1); break; }
      }
    }
    return ContentService.createTextOutput(JSON.stringify({ status: "success" })).setMimeType(ContentService.MimeType.JSON);
  }

  if (action === "bulkUpdateHistory") {
    var hSheet = ss.getSheetByName(HISTORY_SHEET_NAME);
    if (!hSheet) {
      hSheet = ss.insertSheet(HISTORY_SHEET_NAME);
      ensureHeaders(hSheet, 'debt');
    }
    var lastRow = hSheet.getLastRow(); if (lastRow > SKIP_ROWS) hSheet.deleteRows(SKIP_ROWS + 1, lastRow - SKIP_ROWS);
    postData.history.forEach(function(r) {
      var row = [r.id, r.name, r.amount, r.date, r.remarks, r.facebookId, r.contactNumber, r.endDate, r.status, r.transactionType, r.tab, r.salesEntryType];
      safeAppend(hSheet, row);
    });
    return ContentService.createTextOutput(JSON.stringify({ status: "success" })).setMimeType(ContentService.MimeType.JSON);
  }

  if (action === "updateUserPassword") {
    var uSheet = ss.getSheetByName(USERS_SHEET_NAME);
    if (uSheet) {
      var data = uSheet.getDataRange().getValues();
      var targetUser = postData.username.toLowerCase();
      for (var i = SKIP_ROWS; i < data.length; i++) {
        if (data[i][1].toString().toLowerCase() == targetUser) {
          uSheet.getRange(i + 1, 3).setValue(postData.newPassword);
          break;
        }
      }
    }
    return ContentService.createTextOutput(JSON.stringify({ status: "success" })).setMimeType(ContentService.MimeType.JSON);
  }

  if (action === "saveCurrencyConfig") {
    var cSheet = ss.getSheetByName(CONFIG_SHEET_NAME);
    if (!cSheet) { cSheet = ss.insertSheet(CONFIG_SHEET_NAME); ensureHeaders(cSheet, 'config'); }
    var key = "currency_" + postData.tab;
    var data = cSheet.getDataRange().getValues();
    var found = false;
    for (var i = 1; i < data.length; i++) {
      if (data[i][0] === key) { cSheet.getRange(i + 1, 2).setValue(JSON.stringify(postData.config)); found = true; break; }
    }
    if (!found) cSheet.appendRow([key, JSON.stringify(postData.config)]);
    return ContentService.createTextOutput(JSON.stringify({ status: "success" })).setMimeType(ContentService.MimeType.JSON);
  }

  if (action === "updateSignatureDetails") {
      var sheet = ss.getSheetByName(SIGNATURES_SHEET_NAME);
      if (sheet) {
          var data = sheet.getDataRange().getValues();
          for (var i = SKIP_ROWS; i < data.length; i++) {
              if (data[i][0] == postData.id) {
                  sheet.getRange(i + 1, 7, 1, 3).setValues([[postData.term, postData.period, postData.amountPerDue]]);
                  break;
              }
          }
      }
      return ContentService.createTextOutput(JSON.stringify({ status: "success" })).setMimeType(ContentService.MimeType.JSON);
  }
  
  if (action === "fixMissingIds") {
    var sheets = ss.getSheets();
    var fixedCount = 0;
    sheets.forEach(function(sheet) {
      if (isSystemSheet(sheet.getName()) && sheet.getName() !== HISTORY_SHEET_NAME && sheet.getName() !== INVESTORS_SHEET_NAME && sheet.getName() !== SIGNATURES_SHEET_NAME) return;
      var data = sheet.getDataRange().getValues();
      if (data.length <= SKIP_ROWS) return;
      for (var i = SKIP_ROWS; i < data.length; i++) {
        if (!data[i][0] || data[i][0].toString().trim() === "") {
          var newId = "fixed-" + Date.now() + "-" + Math.floor(Math.random() * 100).toString(36);
          sheet.getRange(i + 1, 1).setValue(newId);
          fixedCount++;
        }
      }
    });
    return ContentService.createTextOutput(JSON.stringify({ status: "success", count: fixedCount })).setMimeType(ContentService.MimeType.JSON);
  }

  return ContentService.createTextOutput(JSON.stringify({ status: "success" })).setMimeType(ContentService.MimeType.JSON);
}

function getSigningPageHTML() {
  return '<!DOCTYPE html>' + 
  '<html lang="en">' +
  '<head>' +
  '<base target="_top">' +
  '<meta charset="utf-8">' +
  '<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover">' +
  '<title>Nica.Lmk.Corp Agreement</title>' +
  '<style>' +
  '* { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }' +
  'html, body { width: 100%; height: 100%; overflow: hidden; margin: 0; padding: 0; }' +
  'body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background-color: #f8fafc; color: #1e293b; }' +
  '.container { height: 100%; display: flex; flex-direction: column; overflow-y: auto; padding: 0; box-sizing: border-box; }' +
  '.card { background: white; border-radius: 24px; padding: 24px; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1); margin: 20px auto; width: calc(100% - 40px); max-width: 450px; }' +
  'h1 { font-size: 18px; margin: 0 0 4px 0; color: #0f172a; font-weight: 800; }' +
  '.label { display: block; font-size: 9px; font-weight: 800; color: #64748b; text-transform: uppercase; margin-bottom: 4px; }' +
  'input { width: 100%; padding: 14px; border: 1px solid #e2e8f0; border-radius: 12px; font-size: 14px; margin-bottom: 12px; font-weight: 600; scroll-margin-top: 100px; }' +
  '.btn { display: block; width: 100%; padding: 20px; background: #0f172a; color: white; border: none; border-radius: 18px; cursor: pointer; font-weight: 800; font-size: 14px; text-transform: uppercase; letter-spacing: 0.05em; transition: transform 0.1s; }' +
  '.btn:active { transform: scale(0.98); }' +
  '.hidden { display: none !important; }' +
  '.full-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: white; z-index: 10000; display: flex; flex-direction: column; height: 100vh; width: 100vw; overflow: hidden; }' +
  '.overlay-header { padding: 8px 16px; border-bottom: 1px solid #f1f5f9; display: flex; justify-content: space-between; align-items: center; shrink: 0; background: white; }' +
  '.overlay-content { flex: 1; display: flex; flex-direction: column; padding: 0; position: relative; overflow: hidden; }' +
  '.overlay-footer { padding: 8px 16px; border-top: 1px solid #f1f5f9; background: #fff; shrink: 0; }' +
  'canvas { width: 100%; height: 100%; background: #fff; touch-action: none; display: block; border: 1px dashed #cbd5e1; border-radius: 0; }' +
  '#sigPadContainer { flex: 1; position: relative; background: #fdfdfd; border-radius: 0; overflow: hidden; min-height: 0; touch-action: none; display: flex; }' +
  '.warning-box { background: #fff1f2; border: 1px solid #fecdd3; padding: 10px 14px; border-radius: 12px; position: absolute; top: 15px; left: 50%; transform: translateX(-50%); z-index: 5; pointer-events: none; width: 90%; opacity: 0.95; box-shadow: 0 4px 12px rgba(225, 29, 72, 0.15); }' +
  '.warning-box-text { font-size: 11px; font-weight: 800; color: #e11d48; text-align: center; margin: 0; text-transform: uppercase; letter-spacing: 0.01em; }' +
  '#pad-btn-clear { position: absolute; bottom: 20px; left: 20px; z-index: 20; background: #f1f5f9; border: 1px solid #cbd5e1; padding: 12px 20px; border-radius: 12px; font-size: 11px; font-weight: 900; color: #64748b; uppercase; tracking: 0.1em; }' +
  '#pad-btn-submit { position: absolute; bottom: 20px; right: 20px; z-index: 20; background: #0f172a; border: none; padding: 12px 32px; border-radius: 12px; font-size: 11px; font-weight: 900; color: white; uppercase; tracking: 0.1em; box-shadow: 0 4px 12px rgba(0,0,0,0.3); }' +
  '#pad-btn-back { position: absolute; top: 20px; right: 20px; z-index: 20; background: rgba(255,255,255,0.8); border: 1px solid #e2e8f0; padding: 8px 16px; border-radius: 10px; font-size: 10px; font-weight: 800; color: #94a3b8; }' +
  '.particulars-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 12px; margin-bottom: 20px; }' +
  '.particular-row { display: flex; justify-content: space-between; margin-bottom: 6px; }' +
  '.particular-label { font-size: 8px; font-weight: 800; color: #94a3b8; text-transform: uppercase; }' +
  '.particular-value { font-size: 11px; font-weight: 700; color: #1e293b; text-align: right; }' +
  
  '@media screen and (orientation: portrait) {' +
  '  #signingOverlay { transform: rotate(90deg); transform-origin: center; width: 100vh !important; height: 100vw !important; top: 50%; left: 50%; translate: -50% -50%; }' +
  '}' +
  '</style></head><body>' +
  '<div class="container" id="main">' +
  '<div class="card">' +
  '<div style="text-align:center; margin-bottom:20px;">' +
  '<h1 style="font-size:24px; font-weight:900; color:#0f172a;">Nica.<span style="color:#db2777;">Lmk</span>.Corp</h1>' +
  '<p style="font-size:7px; font-weight:800; color:#94a3b8; letter-spacing:0.4em; text-transform:uppercase;">Infrastructure</p>' +
  '</div>' +
  '<h1>Digital Agreement</h1><h2 id="docTitle" style="font-size:12px; color:#64748b; margin-bottom:15px; font-weight:600;"></h2>' +
  
  '<div class="particulars-box" id="particularsBox">' +
  '  <div class="particular-row"><span class="particular-label" id="lblAmount">Total Amount</span><span class="particular-value" id="dispAmount"></span></div>' +
  '  <div class="particular-row" id="row1"><span class="particular-label" id="lbl1">Row 1</span><span class="particular-value" id="disp1"></span></div>' +
  '  <div class="particular-row" id="row2"><span class="particular-label" id="lbl2">Row 2</span><span class="particular-value" id="disp2"></span></div>' +
  '  <div class="particular-row" id="row3"><span class="particular-label" id="lbl3">Row 3</span><span class="particular-value" id="disp3"></span></div>' +
  '  <div class="particular-row" id="row4"><span class="particular-label" id="lbl4">Row 4</span><span class="particular-value" id="disp4"></span></div>' +
  '  <div class="particular-row" id="row5"><span class="particular-label" id="lbl5">Row 5</span><span class="particular-value" id="disp5"></span></div>' +
  '  <div class="particular-row" id="row6"><span class="particular-label" id="lbl6">Row 6</span><span class="particular-value" id="disp6"></span></div>' +
  '</div>' +

  '<div style="background-color: #eff6ff; border: 1px solid #dbeafe; border-radius: 12px; padding: 12px; margin-bottom: 20px;">' +
  '<p style="margin: 0; font-size: 11px; font-weight: 700; color: #1e40af; text-align: center;">Verify particulars and sign below.</p></div>' +
  
  '<div style="background-color: #fffbeb; border: 1px solid #fef3c7; border-radius: 12px; padding: 12px; margin-bottom: 20px;">' +
  '<p style="margin: 0; font-size: 10px; font-weight: 800; color: #92400e; text-align: center; text-transform: uppercase; line-height: 1.4;">' +
  'NOTICE: This document constitutes a binding public agreement and may be used for legal purposes if necessary. All details provided must be truthful and legally accurate.</p></div>' +

  '<span class="label">Full Name</span><input type="text" id="signerName" placeholder="Signer Full Name" onfocus="handleInputFocus(this)">' +
  '<span class="label">Address</span><input type="text" id="signerAddress" placeholder="Your Complete Address" onfocus="handleInputFocus(this)">' +
  '<button class="btn" style="background:#2563eb;" onclick="onReviewClicked()">Review & Sign</button>' +
  '<div style="height: 50vh; opacity: 0; pointer-events: none;">--- Keyboard Buffer Space ---</div>' + 
  '</div></div>' +
  '<div id="divTermsOverlay" class="full-overlay hidden"><div class="overlay-header">' +
  '<div><h1 style="font-size:16px;">Contract Terms</h1><p style="font-size:9px; color:#64748b;">Review and Agree</p></div>' +
  '<button onclick="onCloseTermsClicked()" style="background:none; border:none; color:#94a3b8; font-weight:bold; padding:10px;">Close</button>' +
  '</div><div class="overlay-content" style="overflow-y:auto; padding: 20px;"><div id="termsText" style="font-size:12px; line-height:1.5; white-space:pre-wrap;"></div></div>' +
  '<div class="overlay-footer"><button class="btn" onclick="onAgreeClicked()" style="background:#10b981;">I Agree &amp; Continue</button></div></div>' +
  '<div id="signingOverlay" class="full-overlay hidden">' +
  '  <div class="overlay-content">' +
  '    <div class="warning-box"><p class="warning-box-text">Sign exactly as shown on official ID. Falsification is illegal.</p></div>' +
  '    <div id="sigPadContainer">' +
  '       <canvas id="sigCanvas"></canvas>' +
  '       <button id="pad-btn-back" onclick="onBackToTermsClicked()">BACK</button>' +
  '       <button id="pad-btn-clear" onclick="onClearCanvasClicked()">CLEAR PAD</button>' +
  '       <button id="pad-btn-submit" onclick="onFinalizeClicked()">FINALIZE & SUBMIT</button>' +
  '    </div>' +
  '  </div>' +
  '</div>' +
  '<div id="success" class="hidden" style="text-align:center; padding:50px 20px;">' +
  '<div style="font-size:60px; margin-bottom:20px;">✅</div><h1>Success!</h1>' +
  '<p style="color:#64748b;">Agreement received. You may now close this page.</p></div>' +
  '<script>' +
  'var SERVER_DATA = __SERVER_DATA_PLACEHOLDER__; ' +
  'var DRAFT_ID = __DRAFT_ID_PLACEHOLDER__; ' +
  'var capturedName = ""; var capturedAddress = ""; ' +
  'var isDrawing = false; var pointerId = null;' +
  'var canvas = document.getElementById("sigCanvas"); var ctx = canvas.getContext("2d");' +
  
  'function handleInputFocus(el) { ' +
  '  setTimeout(function() { ' +
  '    el.scrollIntoView({ behavior: "smooth", block: "center" }); ' +
  '  }, 450); ' +
  '} ' +

  'function setRow(idx, label, value) { ' +
  '  var row = document.getElementById("row" + idx); ' +
  '  var lbl = document.getElementById("lbl" + idx); ' +
  '  var val = document.getElementById("disp" + idx); ' +
  '  if (label && value) { ' +
  '    row.classList.remove("hidden"); ' +
  '    lbl.innerText = label; ' +
  '    val.innerText = value; ' +
  '  } else { ' +
  '    row.classList.add("hidden"); ' +
  '  } ' +
  '} ' +

  'function getOrdinal(n) { ' +
  '  var s = ["th", "st", "nd", "rd"]; ' +
  '  var v = n % 100; ' +
  '  return s[(v - 20) % 10] || s[v] || s[0]; ' +
  '} ' +

  'function populateUI() { ' +
  '  if(!SERVER_DATA) return; ' +
  '  var type = SERVER_DATA.type || "debt"; ' +
  '  var title = type === "rent" ? "Rental Agreement" : (type === "investor" ? "Investment Agreement" : "Loan Agreement");' +
  '  document.getElementById("docTitle").innerText = title;' +
  '  var rawAmt = SERVER_DATA.amount || "0"; ' +
  '  var amt = Number(rawAmt.toString().replace(/[^0-9.]/g, "")) || 0; ' +
  '  document.getElementById("dispAmount").innerText = "₱" + amt.toLocaleString(); ' +
  '  document.getElementById("termsText").innerText = SERVER_DATA.terms_content || "Terms missing."; ' +

  '  var lblAmt = document.getElementById("lblAmount"); ' +

  '  if (type === "rent") { ' +
  '     lblAmt.innerText = "Rental Price"; ' +
  '     var sDate = new Date(SERVER_DATA.date); ' +
  '     var eDate = new Date(SERVER_DATA.end_date); ' +
  '     var diffDays = Math.ceil(Math.abs(eDate - sDate) / (1000 * 60 * 60 * 24)) + 1; ' +
  '     if (isNaN(diffDays)) diffDays = 1; ' +
  '     setRow(1, "Car Model", SERVER_DATA.car_model || "---"); ' +
  '     setRow(2, "Plate Number", SERVER_DATA.plate_number || "---"); ' +
  '     setRow(3, "Rental Dates", (SERVER_DATA.date || "---") + " to " + (SERVER_DATA.end_date || "---")); ' +
  '     setRow(4, "Rental Duration", diffDays + " Day" + (diffDays > 1 ? "s" : "")); ' +
  '     setRow(5, "Distance Limit", (diffDays * 300) + " km Total"); ' +
  '     setRow(6, "Driver Option", SERVER_DATA.driver_option === "with_driver" ? "With Driver (+₱1,000)" : "Self Drive"); ' +
  '  } else if (type === "investor") { ' +
  '     lblAmt.innerText = "Principal Amount"; ' +
  '     setRow(1, "Return Rate", (SERVER_DATA.rate || "0") + "% Per Month"); ' +
  '     setRow(2, "Date Invested", SERVER_DATA.date || "---"); ' +
  '     var d = new Date(SERVER_DATA.date); ' +
  '     var day = d.getDate(); ' +
  '     setRow(3, "Payout Day", "Every " + day + getOrdinal(day) + " of month"); ' +
  '     setRow(4, null, null); setRow(5, null, null); setRow(6, null, null); ' +
  '  } else { ' +
  '     lblAmt.innerText = "Loan Amount"; ' +
  '     setRow(1, "Term Type", SERVER_DATA.term || "---"); ' +
  '     setRow(2, "Period", SERVER_DATA.period || "---"); ' +
  '     setRow(3, "Amt Per Due", SERVER_DATA.amount_per_due ? "₱" + Number(SERVER_DATA.amount_per_due).toLocaleString() : "---"); ' +
  '     setRow(4, null, null); setRow(5, null, null); setRow(6, null, null); ' +
  '  } ' +

  '  document.getElementById("signerName").value = ""; ' +
  '  document.getElementById("signerAddress").value = ""; ' +
  '} ' +

  'function resizeCanvas() { ' +
  '  var ratio = Math.max(window.devicePixelRatio || 1, 1); ' +
  '  var container = document.getElementById("sigPadContainer"); ' +
  '  canvas.width = container.offsetWidth * ratio; ' +
  '  canvas.height = container.offsetHeight * ratio; ' +
  '  ctx.setTransform(1,0,0,1,0,0); ctx.scale(ratio, ratio); ' +
  '  ctx.lineCap="round"; ctx.lineJoin="round"; ctx.lineWidth=3; ctx.strokeStyle="#0000FF"; ' +
  '}' +
  'window.onresize = resizeCanvas;' +

  'function getCoords(e) { ' +
  '  var rect = canvas.getBoundingClientRect(); ' +
  '  var clientX = e.clientX, clientY = e.clientY; ' +
  '  if (window.innerHeight > window.innerWidth) { ' + 
  '    var visualX = clientY - rect.top; ' +
  '    var visualY = rect.right - clientX; ' +
  '    return { x: visualX, y: visualY }; ' +
  '  } ' + 
  '  return { x: clientX - rect.left, y: clientY - rect.top }; ' +
  '}' +

  'function startDraw(e) { if(!e.isPrimary || pointerId !== null) return; e.preventDefault(); isDrawing = true; pointerId = e.pointerId; if(canvas.setPointerCapture) canvas.setPointerCapture(e.pointerId); var coords = getCoords(e); ctx.beginPath(); ctx.moveTo(coords.x, coords.y); }' +
  'function draw(e) { if(!isDrawing || e.pointerId !== pointerId) return; e.preventDefault(); var coords = getCoords(e); ctx.lineTo(coords.x, coords.y); ctx.stroke(); }' +
  'function endDraw(e) { if(e.pointerId === pointerId) { isDrawing = false; pointerId = null; if(canvas.releasePointerCapture) canvas.releasePointerCapture(e.pointerId); } }' +
  
  'canvas.addEventListener("pointerdown", startDraw); canvas.addEventListener("pointermove", draw);' +
  'canvas.addEventListener("pointerup", endDraw); canvas.addEventListener("pointercancel", endDraw);' +

  'function onReviewClicked() { ' +
  '  capturedName = document.getElementById("signerName").value; ' +
  '  capturedAddress = document.getElementById("signerAddress").value; ' +
  '  if(!capturedName || !capturedAddress) { alert("Please fill up name and address."); return; } ' + 
  '  document.getElementById("divTermsOverlay").classList.remove("hidden"); ' +
  '}' +
  'function onCloseTermsClicked() { document.getElementById("divTermsOverlay").classList.add("hidden"); }' +
  'function onAgreeClicked() { document.getElementById("divTermsOverlay").classList.add("hidden"); document.getElementById("signingOverlay").classList.remove("hidden"); setTimeout(resizeCanvas, 150); }' +
  'function onBackToTermsClicked() { document.getElementById("signingOverlay").classList.add("hidden"); document.getElementById("divTermsOverlay").classList.remove("hidden"); }' +
  'function onClearCanvasClicked() { ctx.clearRect(0,0,canvas.width,canvas.height); }' +
  
  'function onFinalizeClicked() { ' +
  '  var tempCanvas = document.createElement("canvas");' +
  '  var maxDim = 300;' + 
  '  var scale = Math.min(maxDim / canvas.width, maxDim / canvas.height, 1);' +
  '  tempCanvas.width = canvas.width * scale;' +
  '  tempCanvas.height = canvas.height * scale;' +
  '  var tempCtx = tempCanvas.getContext("2d");' +
  '  tempCtx.fillStyle = "#FFFFFF";' +
  '  tempCtx.fillRect(0,0,tempCanvas.width,tempCanvas.height);' +
  '  tempCtx.drawImage(canvas, 0, 0, tempCanvas.width, tempCanvas.height);' +
  '  var sig = tempCanvas.toDataURL("image/jpeg", 0.4);' + 
  '  if(sig.length < 300) { alert("Signature required."); return; } ' + 
  '  var btn = document.getElementById("pad-btn-submit");' +
  '  btn.disabled = true; btn.innerText = "Submitting..."; ' +
  '  if (typeof google === "undefined" || !google.script) { alert("Cloud connection lost. Refresh page."); btn.disabled = false; return; }' +
  '  google.script.run.withSuccessHandler(function(){ ' +
  '    document.getElementById("signingOverlay").classList.add("hidden"); ' +
  '    document.getElementById("main").classList.add("hidden"); ' +
  '    document.getElementById("success").classList.remove("hidden"); ' +
  '  }).withFailureHandler(function(err){ ' +
  '    alert("Submission error: " + err); ' +
  '    btn.disabled = false; btn.innerText = "FINALIZE & SUBMIT";' +
  '  }).processSignature({ ' +
  '    id: SERVER_DATA.id, ' +
  '    draftId: DRAFT_ID, ' +
  '    signer_name: capturedName, ' +
  '    signer_address: capturedAddress, ' +
  '    signature: sig, ' +
  '    amount: SERVER_DATA.amount, ' +
  '    type: SERVER_DATA.type, ' +
  '    term: SERVER_DATA.type === "rent" ? (SERVER_DATA.driver_option || "self") : (SERVER_DATA.term || ""), ' +
  '    period: SERVER_DATA.period || "", ' +
  '    amount_per_due: SERVER_DATA.amount_per_due || "" ' +
  '  }); ' +
  '}' +
  'window.onload = function() { populateUI(); setTimeout(populateUI, 300); };' +
  '</script></body></html>';
}
`;

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin, initialScriptUrl, themeColor = '#db2777' }) => {
  const [mode, setMode] = useState<'select' | 'master' | 'user'>('select');
  const [scriptUrl, setScriptUrl] = useState(initialScriptUrl || '');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [pin, setPin] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isNewPin, setIsNewPin] = useState(false);
  const [isGreenGlow, setIsGreenGlow] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    setScriptUrl(initialScriptUrl || '');
  }, [initialScriptUrl]);

  const resetError = () => { setError(null); setIsNewPin(false); };

  const handleCopyScript = () => {
    navigator.clipboard.writeText(DEPLOYMENT_SCRIPT);
    setIsGreenGlow(true);
    setTimeout(() => setIsGreenGlow(false), 2000);
  };

  const handleMasterAuth = async () => {
    const url = scriptUrl.trim();
    if (!url) { setError('Script URL is required'); return; }
    setIsLoading(true);
    resetError();
    try {
      const res = await fetch(`${url}?tab=_TabConfigs_&_=${Date.now()}`);
      if (!res.ok) throw new Error(`HTTP Error ${res.status}`);
      const data = await res.json();
      if (data.status === 'error') throw new Error(data.message);
      
      const cloudPin = data.appPin;
      if (!cloudPin) {
        setIsNewPin(true);
        setIsLoading(false);
        return;
      }
      if (pin === cloudPin) {
        onLogin({ role: 'master', password: pin, isOffline: false }, url);
      } else if (!pin) {
        // Just checking pin existence
      } else {
        setError('Incorrect Master PIN');
      }
    } catch (e: any) {
      console.error(e);
      setError('Could not connect to Cloud. Check URL and Network.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreatePin = async () => {
    const url = scriptUrl.trim();
    if (pin.length < 4) { setError('PIN must be at least 4 digits'); return; }
    setIsLoading(true);
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'saveMasterPin', pin })
      });
      const data = await res.json();
      if (data.status === 'success') {
        onLogin({ role: 'master', password: pin, isOffline: false }, url);
      } else {
        throw new Error();
      }
    } catch (e) {
      setError('Failed to initialize security. Try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUserAuth = async () => {
    const url = scriptUrl.trim();
    if (!url) { setError('Script URL is required'); return; }
    if (!username || !password) { setError('Enter credentials'); return; }
    setIsLoading(true);
    resetError();
    try {
      const res = await fetch(`${url}?tab=_TabConfigs_&_=${Date.now()}`);
      if (!res.ok) throw new Error(`HTTP Error ${res.status}`);
      
      const data = await res.json();
      if (data.status === 'error') throw new Error(data.message);

      const users: AppUser[] = data.users || [];
      const found = users.find(u => u.username.toLowerCase() === username.toLowerCase() && u.password === password);
      if (found) {
        let allowed: string[] = [];
        let perms: Record<string, string[]> = {};
        if (found.restrictions && !Array.isArray(found.restrictions) && typeof found.restrictions === 'object') {
          const restrictionsObj = found.restrictions as { allowedTabs: string[], tabPermissions: Record<string, string[]> };
          allowed = restrictionsObj.allowedTabs || [];
          perms = restrictionsObj.tabPermissions || {};
        } else if (Array.isArray(found.restrictions)) {
          allowed = found.restrictions;
        }
        onLogin({ role: 'user', username: found.username, password: found.password, allowedTabs: allowed, tabPermissions: perms, isOffline: false }, url);
      } else {
        setError('Invalid Username or Password');
      }
    } catch (e: any) {
      console.error(e);
      if (e.message && (e.message.includes('JSON') || e.message.includes('Unexpected token'))) {
         setError('Database Error: Invalid Response format.');
      } else {
         setError('Authentication failed. Check Network.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleOfflineMode = () => {
    onLogin({ role: 'master', isOffline: true, password: '0609' }, '');
  };

  const handleKeyDown = (e: React.KeyboardEvent, action: () => void) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (e.target instanceof HTMLElement) e.target.blur();
      action();
    }
  };

  return (
    <div className="fixed inset-0 z-[10000] bg-slate-50 flex flex-col items-center justify-center p-6 overflow-hidden">
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[80%] h-[80%] blur-[120px] rounded-full opacity-10 animate-pulse" style={{ backgroundColor: themeColor }} />
        <div className="absolute bottom-[-10%] right-[-10%] w-[80%] h-[80%] blur-[120px] rounded-full opacity-10 animate-pulse" style={{ backgroundColor: themeColor, animationDelay: '1.5s' }} />
      </div>

      <div className="w-full max-sm relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="text-center mb-10"
        >
          <button onClick={handleCopyScript} className={`w-20 h-20 rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-xl border-4 border-white overflow-hidden relative group transition-all duration-500 ${isGreenGlow ? 'shadow-[0_0_40px_rgba(16,185,129,0.8)] scale-110' : 'shadow-slate-200/50'}`} style={{ backgroundColor: isGreenGlow ? '#10b981' : themeColor }} title="Click to copy deployment script">
            <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="text-white"><ShieldIcon /></div>
          </button>
          <h1 className="text-4xl font-black tracking-tighter mb-2 text-slate-900 drop-shadow-sm">Nica.<span className="animate-glow-text" style={{ color: themeColor, textShadow: `0 0 15px ${themeColor}44` }}>lmk</span>.Corp</h1>
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.4em] opacity-80">Infrastructure Division</p>
        </motion.div>

        {mode === 'select' && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.4 }}
            className="space-y-3"
          >
            <button onClick={() => setMode('master')} className="w-full group p-5 bg-white border border-slate-200 rounded-[2rem] flex items-center gap-4 hover:border-slate-300 transition-all active:scale-[0.98] shadow-lg shadow-slate-200/40">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg group-hover:rotate-6 transition-transform text-white" style={{ backgroundColor: themeColor }}><ShieldIcon /></div>
              <div className="text-left"><p className="text-slate-900 font-black text-lg leading-tight">Corporate Admin</p><p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-0.5">Cloud Sync & Users</p></div>
            </button>
            <button onClick={() => setMode('user')} className="w-full group p-5 bg-white border border-slate-200 rounded-[2rem] flex items-center gap-4 hover:border-slate-300 transition-all active:scale-[0.98] shadow-lg shadow-slate-200/40">
              <div className="w-14 h-14 bg-slate-800 text-white rounded-2xl flex items-center justify-center shadow-lg group-hover:-rotate-6 transition-transform"><UserIcon /></div>
              <div className="text-left"><p className="text-slate-900 font-black text-lg leading-tight">Corporate Staff</p><p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1.5">Shared Ledger Access</p></div>
            </button>
            <div className="py-2 flex items-center gap-4"><div className="h-px flex-1 bg-slate-200" /><span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Isolated Zone</span><div className="h-px flex-1 bg-slate-200" /></div>
            <button onClick={handleOfflineMode} className="w-full group p-5 bg-slate-100 border border-slate-200 rounded-[2rem] flex items-center gap-4 hover:bg-slate-200 transition-all active:scale-[0.98] shadow-sm">
              <div className="w-14 h-14 bg-white text-slate-400 rounded-2xl flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform"><CloudOffIcon size={24} /></div>
              <div className="text-left"><p className="text-slate-800 font-black text-lg leading-tight">Personal Ledger</p><p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1.5">Private Use • Strictly Offline</p></div>
            </button>
          </motion.div>
        )}

        {(mode === 'master' || mode === 'user') && (
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="bg-white rounded-[2.5rem] p-8 shadow-2xl shadow-slate-300/40 border border-slate-100"
          >
            <div className="flex justify-between items-center mb-8">
              <div><h2 className="text-xl font-black text-slate-900 leading-none">{mode === 'master' ? 'Enterprise Admin' : 'Staff Login'}</h2><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1.5">Cloud Authentication</p></div>
              <button onClick={() => { setMode('select'); resetError(); setShowPassword(false); }} className="text-[10px] font-black uppercase tracking-widest py-2 px-3 bg-slate-50 rounded-xl transition-all active:scale-90" style={{ color: themeColor }}>Back</button>
            </div>
            <div className="space-y-5">
              {!initialScriptUrl && (
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-1.5"><LinkIcon /> Corporate Endpoint</label>
                  <input type="password" placeholder="Enter Master URL" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold outline-none focus:ring-4 focus:ring-slate-500/5 focus:border-slate-400 transition-all" value={scriptUrl} onChange={e => setScriptUrl(e.target.value)} onKeyDown={e => handleKeyDown(e, mode === 'master' ? (isNewPin ? handleCreatePin : handleMasterAuth) : handleUserAuth)} />
                </div>
              )}
              {mode === 'master' ? (
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-1.5"><KeyIcon /> {isNewPin ? 'Create Master PIN' : 'Access Passcode'}</label>
                  <div className="relative">
                    <input type={showPassword ? "text" : "password"} inputMode="numeric" placeholder={isNewPin ? "Set 4-digit PIN" : "****"} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-center text-2xl font-black tracking-[0.5em] outline-none focus:ring-4 focus:ring-slate-500/5 focus:border-slate-400 shadow-inner pr-12" value={pin} onChange={e => setPin(e.target.value.replace(/\D/g, ''))} onKeyDown={e => handleKeyDown(e, isNewPin ? handleCreatePin : handleMasterAuth)} />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-600 active:scale-90 transition-transform">
                      {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                    </button>
                  </div>
                  {isNewPin && <p className="text-[9px] text-amber-600 font-bold uppercase tracking-widest text-center mt-3 bg-amber-50 py-2 rounded-xl border border-amber-100">New Cloud detected. Create a PIN.</p>}
                </div>
              ) : (
                <>
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Staff Username</label>
                    <input type="text" placeholder="Username" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500" value={username} onChange={e => setUsername(e.target.value)} onKeyDown={e => handleKeyDown(e, handleUserAuth)} />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Staff Password</label>
                    <div className="relative">
                      <input type={showPassword ? "text" : "password"} placeholder="Password" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 pr-12" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => handleKeyDown(e, handleUserAuth)} />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-600 active:scale-90 transition-transform">
                        {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                      </button>
                    </div>
                  </div>
                </>
              )}
              {error && <div className="p-3 bg-rose-50 border border-rose-100 rounded-2xl animate-shake"><p className="text-rose-600 text-[10px] font-black text-center uppercase tracking-tight">{error}</p></div>}
              <button onClick={mode === 'master' ? (isNewPin ? handleCreatePin : handleMasterAuth) : handleUserAuth} disabled={isLoading} className="w-full py-5 bg-slate-900 text-white font-black rounded-2xl shadow-xl active:scale-[0.98] transition-all text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-3 mt-4 relative overflow-hidden">{isLoading && <div className="absolute inset-0 bg-white/10 animate-pulse" />}{isLoading ? 'Verifying...' : isNewPin ? 'Save Master PIN' : 'Unlock Database'}</button>
            </div>
          </motion.div>
        )}
      </div>

      <div className="absolute bottom-10 flex flex-col items-center gap-2 opacity-40">
        <div className="h-0.5 w-10 bg-slate-300 rounded-full mb-1" />
        <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.5em]">Lmk.Corp Infrastructure v203.2</p>
      </div>

      <style>{`
        @keyframes shake { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(-5px); } 75% { transform: translateX(5px); } }
        .shake { animation: shake 0.2s ease-in-out 2; }
      `}</style>
    </div>
  );
};

export default LoginScreen;