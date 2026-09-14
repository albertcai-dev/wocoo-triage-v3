var ERROR_LOG_CATEGORIES = [
  "Missing or Insufficient Information",
  "Other Team Required",
  "Incorrect Request Type",
  "Unsupported Request",
  "Other"
];

var EOC_PROBLEM_AREAS = [
  {
    group: "Payment Card (recommended for WOCOO)",
    options: [
      "Payment Card - Issuance & Lifecycle",
      "Payment Card - Purchases and Declines",
      "Payment Card -  Rewards & ATM Fee Reimbursements",
      "Payment Card - Statements & Fees",
      "Payment Card - Uncategorized"
    ]
  },
  {
    group: "All other areas",
    options: [
      "Account Closure","Account creation","Account Opening Issue","Account ownership","Account status (open, pending, manual review)",
      "Advising","Agreements (Sign, resurface, update, W-8BEN)","Alt Investments - Private Credit","Alt Investments - Private Equity",
      "Alt Investments - Venture Fund","AML Scan","App Signup","Atlas Copilot","Atlas Infrastructure","Atlas Onboarding and Offboarding",
      "Balance Quantity Issue","Bank & Brokerage Linking (Plaid, Flinks, WST)","Banking - Auto-invest your paycheque","BART","Bill Pay",
      "Biometrics/Quick Access","Book Value/Cost Discrepancy","BoR Calc - Big Bang - Book Value Adjustment",
      "BoR Calc - BookValue - App vs Statement Discrepancy","BoR Calc - BookValue - Corporate Action",
      "BoR Calc - BookValue - Institutional Transfer","BoR Calc - BookValue - Internal Transfer",
      "BoR Calc - BookValue - Manual Correction in Ledger","BoR Calc - BookValue - New Holdings Experience",
      "BoR Calc - BookValue - Other","BoR Calc - BookValue - Trade Upgrade/Downgrade",
      "BoR Calc - NetDeposits - Manual Transaction","BoR Calc - NetDeposits - Other",
      "BoR Calc - Positions/Qty - App vs Statement Discrepancy","BoR Calc - Positions/Qty - New Holdings Experience",
      "BoR Calc - Positions/Qty - Other","BoR Kratos Issue","Business Chequing - Bugs",
      "Cash Account - Pre-Authorized Debits (PADs)","Cash account status - Deactivation, suspensions",
      "Cash Interest - Missed/Incorrect payout","Cash onboarding - Bugs, troubleshooting","Cash onboarding - Reopen account",
      "Corporate Actions","Corporate Info","Corporate Ownership","Corporate Save","Corporate Statements","Credit Risk",
      "Currency Conversion","Debit Card Funding","Direct Deposit","Dividend reinvestments","Dividends",
      "Earnings/Returns Discrepancy","EFT","Estate Beneficiaries","E-Transfers","External (Institutional) Account Transfers",
      "Financial Activity Model (FAM)","Financial Metric Related Upgrade/Downgrade Failure","Financial Risk - Restrictions",
      "Financial Risk - Suspicious Transaction","Financial Risk - Transaction Limits (including Instant EFT)",
      "Foreign Asset Reports","FPL/Stock Lending","Fraud Eng - Not listed","Global Activity Feed",
      "Graphs - Account (1D, 1W Only)","Growth Engagement R&D - Push & Email Notifications",
      "Home/Account/Identity Graph Data","Household Money Management","Identity Conflict",
      "Identity Merge / SIN Conflict (plz send to BOAO)","Identity Trust - Device Management",
      "Identity Trust - Identity Fraud","Identity Trust - Identity Restriction","Identity Trust - OTP Reset",
      "Identity Trust - Soft Deleted/Churned Users","Identity Verification (IDV)","IDV - FINTRAC/Comprehensive Status",
      "Impersonation","Inflight Activities","Internal Transfers","International Transfers","Login - Unified App","Login - Web",
      "Managed Investing - Not Listed","Management Fees","Margin","Margin Buying Power","Margin Call",
      "Marketing - Wealthsimple.com - CMS support","Marketing - Wealthsimple.com - Copy updates - High-priority",
      "Marketing - Wealthsimple.com - Copy updates - Nice to have","Marketing - Wealthsimple.com - Data update",
      "Marketing - Wealthsimple.com - Help center","Marketing - Wealthsimple.com - SEO",
      "Marketing - Wealthsimple.com - UI polish - High-priority","Marketing - Wealthsimple.com - UI polish - Nice to have",
      "Marketing - Wealthsimple.com - Vanity URLs","Misc Financial Metric Issue","Missing/Incorrect Transactions in Ledger",
      "Mobile - Accessibility Feature","Mobile Cheque Deposits","Monthly Statements","Net Deposits Discrepancy",
      "NLV/AUM/Hero Number Discrepancy","OAuth Applications","Option Trading","Options Trading AI",
      "Order bank draft, cash or cheques","Order Execution","Order flow","Order Gen","OTP Code not delivering",
      "OTP codes are invalid","P2P","Password Reset","Pending Deposits and Unsettled Trades (Holds)",
      "Personal info (KYC)","Portfolio line of credit (PLOC)","Portfolios - Account Status","Portfolios - Engineering Tasks",
      "Portfolios - Not Listed","Portfolios - Portfolio Questions","Portfolios - Risk Survey/Suitability/Reassessment",
      "Rates - Interest/Margin/Management Fee/Etc","Re-open accounts in Bulk","Recurring Investments",
      "RESP - Agreements","RESP - Beneficiaries","RESP - Grants","Rewards","Rewards - Premium",
      "Risk Survey (portfolio details)","Running Balances","Securities Data - Corporate Actions",
      "Securities Data - KTLO & Maintenance","Securities Data - Market Data","Securities Data - Options",
      "Securities Data - Pricing","Securities Experience - Discover Screen",
      "Securities Experience - Holdings List or Security Holdings Display","Securities Experience - KTLO & Maintenance",
      "Securities Experience - Price Alerts","Securities Experience - SDI Account Graphs Display",
      "Securities Experience - Security Details Page Display","Securities Experience - Security Graphs",
      "Securities Experience - Security Logos","Securities Experience - Security Search",
      "Securities Experience - Watchlist","Security Vulnerability","Shareholder Communications",
      "Signup - Email Confirmation","Tax Slips","Tiers","UK Client Tax Documents",
      "W4W (employees, contributions dates)","Web - Accessibility Feature","Web Signup","Wires",
      "WS Crypto - Not listed","WS Tax - Not listed"
    ]
  }
];

var MOVE_DESTINATIONS = {
  EOC: {
    name: "EOC",
    fullName: "Engineering On-Call",
    projectKey: "EOC",
    boardUrl: "https://wealthsimple.atlassian.net/jira/software/c/projects/EOC/boards/298",
    workType: "Task",
    statusAfterMove: "Untriaged",
    requiresProblemArea: true,
    apiEnabled: true,
    mcpRoute: "bridge",
    problemAreas: EOC_PROBLEM_AREAS,
    recommendedProblemArea: function(ticket) {
      if (ticket && ticket.category === "CC Application Reset/Close") {
        return "Payment Card - Issuance & Lifecycle";
      }
      return null;
    },
    fields: { summary: true, identityId: true, accountId: true, clientStatus: true }
  },
  PFO: {
    name: "PFO",
    fullName: "Physical Fulfillment Ops",
    projectKey: "PFO",
    boardUrl: "https://wealthsimple.atlassian.net/jira/software/c/projects/PFO",
    workTypeOptions: [
      "Credit Card: Delivery Issue","Prepaid Card: Delivery Issue","Cheques: Delivery Issue",
      "Drafts","Cheques: Stop Payment","Cash Delivery","Draft Reversal","Document Mailing/Signing","Cheque Delivery"
    ],
    apiEnabled: true,
    mcpRoute: "jira_move_ticket",
    apiSupportedWorkTypes: [
      "Credit Card: Delivery Issue","Prepaid Card: Delivery Issue","Cheques: Delivery Issue"
    ],
    recommendedWorkType: function(ticket) {
      var t = ((ticket && ticket.type) || "").toLowerCase();
      if (t.indexOf("credit card") !== -1) return "Credit Card: Delivery Issue";
      if (t.indexOf("prepaid card") !== -1) return "Prepaid Card: Delivery Issue";
      if (t.indexOf("cheque") !== -1) return "Cheques: Delivery Issue";
      return null;
    },
    fields: { summary: true, identityId: true }
  },
  CRED: {
    name: "CRED",
    fullName: "Credit Decisioning",
    projectKey: "CRED",
    boardUrl: "https://wealthsimple.atlassian.net/jira/software/c/projects/CRED/boards/800",
    workType: "Task",
    apiEnabled: true,
    mcpRoute: "jira_move_ticket",
    fields: { summary: true }
  },
  FRAUD: {
    name: "FRAUD",
    fullName: "Fraud Operation",
    projectKey: "FRAUD",
    boardUrl: "https://wealthsimple.atlassian.net/jira/software/c/projects/FRAUD/boards/292",
    workTypeOptions: ["Task","Other"],
    recommendedWorkType: function() { return "Task"; },
    apiEnabled: false,
    mcpRoute: null,
    fields: { summary: true, identityIdAsSuspiciousSlug: true, suspiciousUserSlugsNA: true }
  }
};

var BRIDGE_URL = "https://script.google.com/a/macros/wealthsimple.com/s/AKfycbzWtgcWj8MgRW-MV9Yf9O5cLgDdktBsMw7vno760EJTjTMQsQKrKg9sZK7LCA73XuA-rA/exec";
// ============ END MOVE MODAL CONSTANTS ============

// ============ MOVE MODAL HELPERS ============

function unwrapMcpResult(parsed) {
  if (parsed && parsed.content && Array.isArray(parsed.content)) {
    var raw = "";
    for (var i = 0; i < parsed.content.length; i++) {
      if (parsed.content[i] && parsed.content[i].text) raw += parsed.content[i].text;
    }
    if (raw) {
      try { return JSON.parse(raw); }
      catch (e) {
        var m = raw.match(/\{[\s\S]*\}/);
        if (m) { try { return JSON.parse(m[0]); } catch (e2) {} }
        return null;
      }
    }
  }
  return parsed;
}

function mapJiraTicketToEocShape(parsed) {
  parsed = unwrapMcpResult(parsed);
  if (!parsed) return null;
  var cf = parsed.custom_fields || {};
  var reporter = parsed.reporter;
  if (typeof reporter === "string") reporter = { displayName: reporter, accountId: null };
  if (!reporter) reporter = { displayName: "", accountId: null };
  return {
    summary: parsed.summary || "",
    description: parsed.description || "",
    identityId: cf.customfield_11458 || "",
    accountId: cf.customfield_14401 || cf.customfield_10082 || "",
    userTier: cf.customfield_11416 || cf.customfield_17272 || "",
    clientEmail: cf.customfield_10268 || "",
    reporter: reporter,
    category: null,
    type: null,
    priority: parsed.priority || ""
  };
}

function callEocBridge(payload) {
  var params = {
    wocooTicketId: payload.wocooTicketId,
    clientStatusTier: payload.clientStatusTier,
    problemAreaLabel: payload.problemAreaLabel
  };
  if (payload.accountIdOverride) params.accountIdOverride = payload.accountIdOverride;
  if (payload.identityIdOverride) params.identityIdOverride = payload.identityIdOverride;
  if (payload.operatorName) params.operatorName = payload.operatorName;
  return callBridgeViaIframe("moveToEoc", params, "moveDone").then(function(data) {
    return {
      success: true,
      sourceTicketId: data.sourceTicketId || payload.wocooTicketId,
      targetProject: data.targetProject || "EOC",
      targetIssueType: "Task",
      taskId: data.taskId || null,
      appliedFields: data.appliedFields || {
        clientStatus: payload.clientStatusTier,
        problemAreaLabel: payload.problemAreaLabel
      },
      note: (data.logRowNumber ? "✓ Logged to Moves sheet (row #" + data.logRowNumber + "). " : "") + (data.note || "Move accepted.")
    };
  });
}

function logTicketMoveErrorMcp(args) {
  return callBridgeViaIframe("logError", {
    wocooTicketId: args.wocooTicketId,
    errorCategory: args.errorCategory,
    errorDescription: args.errorDescription || "",
    loggerName: args.loggerName,
    workType: args.workType || ""
  }, "errorLogged");
}

function callBridgeViaIframe(actionName, params, messageAction) {
  return new Promise(function(resolve, reject) {
    if (!BRIDGE_URL) { reject(new Error("Bridge URL not configured.")); return; }
    var allParams = Object.assign({ action: actionName }, params);
    var qs = Object.keys(allParams).map(function(k) {
      return encodeURIComponent(k) + "=" + encodeURIComponent(allParams[k]);
    }).join("&");
    var iframe = document.createElement("iframe");
    iframe.style.display = "none";
    iframe.src = BRIDGE_URL + "?" + qs;
    var done = false, timeoutId = null;
    var cleanup = function() {
      if (done) return;
      done = true;
      window.removeEventListener("message", onMsg);
      if (iframe.parentNode) iframe.parentNode.removeChild(iframe);
      if (timeoutId) { clearTimeout(timeoutId); timeoutId = null; }
    };
    var onMsg = function(ev) {
      if (!ev.data || ev.data.action !== messageAction) return;
      cleanup();
      if (ev.data.error === "auth_required") {
        var authErr = new Error("JIRA authorization needed (one-time per agent). Open the consent page, approve access, then retry.");
        authErr.authUrl = ev.data.authUrl;
        reject(authErr);
        return;
      }
      if (ev.data.error) { reject(new Error(ev.data.error)); return; }
      resolve(ev.data);
    };
    window.addEventListener("message", onMsg);
    document.body.appendChild(iframe);
    timeoutId = setTimeout(function() {
      cleanup();
      reject(new Error("Bridge call timed out after 30s."));
    }, 30000);
  });
}

function postCommentViaBridge(ticketId, commentText) {
  return new Promise(function(resolve, reject) {
    if (!BRIDGE_URL) { reject(new Error("Bridge URL not configured.")); return; }
    var params = { action: "postComment", ticketId: ticketId, commentText: commentText };
    var qs = Object.keys(params).map(function(k) {
      return encodeURIComponent(k) + "=" + encodeURIComponent(params[k]);
    }).join("&");
    var iframe = document.createElement("iframe");
    iframe.style.display = "none";
    iframe.src = BRIDGE_URL + "?" + qs;
    var done = false, timeoutId = null;
    var cleanup = function() {
      if (done) return;
      done = true;
      window.removeEventListener("message", onMsg);
      if (iframe.parentNode) iframe.parentNode.removeChild(iframe);
      if (timeoutId) { clearTimeout(timeoutId); timeoutId = null; }
    };
    var onMsg = function(ev) {
      if (!ev.data || ev.data.action !== "commentPosted") return;
      cleanup();
      if (ev.data.error === "auth_required") {
        var authErr = new Error("JIRA authorization needed (one-time per agent). Open the consent page, approve access, then retry.");
        authErr.authUrl = ev.data.authUrl;
        reject(authErr);
        return;
      }
      if (ev.data.error) { reject(new Error(ev.data.error)); return; }
      resolve(ev.data);
    };
    window.addEventListener("message", onMsg);
    document.body.appendChild(iframe);
    timeoutId = setTimeout(function() {
      cleanup();
      reject(new Error("Comment post timed out (no response from bridge in 30s)."));
    }, 30000);
  });
}

// ============ i2c / KOHO DRAFT TEMPLATES + KOHO BRIDGE SEND ============
// Templates ported verbatim from the WOCOO Apps Script dashboard (getI2cDraft / getKohoDraft).
var KOHO_RECIPIENT = "wealthsimplesupport@koho.ca";

function getI2cDraft(t) {
  return {
    summary: "[" + (t.type || "Credit Card") + "] " + (t.summary || ""),
    description:
      "WOCOO Ticket: https://wealthsimple.atlassian.net/browse/" + t.id + "\n" +
      "Work Type: " + (t.type || "—") + "\n" +
      "Priority: " + (t.priority || "—") + "\n\n" +
      "Description:\n" + (t.description || "")
  };
}

function getKohoDraft(t) {
  return {
    subject: "[" + t.id + "] " + (t.summary || "Prepaid Card Inquiry"),
    body:
      "Hi Koho Support team,\n\n" +
      "We have a client inquiry regarding the following:\n\n" +
      "WOCOO Ticket: https://wealthsimple.atlassian.net/browse/" + t.id + "\n" +
      "Work Type: " + (t.type || "—") + "\n" +
      "Priority: " + (t.priority || "—") + "\n\n" +
      "Issue Description:\n" + (t.description || "") + "\n\n" +
      "Could you please investigate and let us know your findings?\n\n" +
      "Thank you,\nWealthsimple Cash & Card Operations"
  };
}

// Mirrors postCommentViaBridge: fires the Apps Script bridge via hidden iframe and
// resolves on the kohoEmailSent postMessage. The bridge calls GmailApp.sendEmail.
function sendKohoEmailViaBridge(ticketId, subject, body) {
  return new Promise(function(resolve, reject) {
    if (!BRIDGE_URL) { reject(new Error("Bridge URL not configured.")); return; }
    var params = { action: "sendKohoEmail", ticketId: ticketId, subject: subject, body: body };
    var qs = Object.keys(params).map(function(k) {
      return encodeURIComponent(k) + "=" + encodeURIComponent(params[k]);
    }).join("&");
    var iframe = document.createElement("iframe");
    iframe.style.display = "none";
    iframe.src = BRIDGE_URL + "?" + qs;
    var done = false, timeoutId = null;
    var cleanup = function() {
      if (done) return;
      done = true;
      window.removeEventListener("message", onMsg);
      if (iframe.parentNode) iframe.parentNode.removeChild(iframe);
      if (timeoutId) { clearTimeout(timeoutId); timeoutId = null; }
    };
    var onMsg = function(ev) {
      if (!ev.data || ev.data.action !== "kohoEmailSent") return;
      cleanup();
      if (ev.data.error) { reject(new Error(ev.data.error)); return; }
      resolve(ev.data);
    };
    window.addEventListener("message", onMsg);
    document.body.appendChild(iframe);
    timeoutId = setTimeout(function() {
      cleanup();
      reject(new Error("Koho email send timed out (no response from bridge in 30s)."));
    }, 30000);
  });
}

// ============ INQUIRY REMOVAL (TransUnion) — doc create + PDF email via bridge ============
var INQUIRY_REMOVAL_TEMPLATE_ID = "1wdfRDkRshpBTrGhrPX3-zrKlDVpmp4NXkumsFKvJkxQ";
var TRANSUNION_EMAIL = "TUCCustServ@transunion.com";

// Bridge action createInquiryDoc: copies the template into the associate's My Drive,
// prefills the letter fields, returns { docId, docUrl }.
function createInquiryDocViaBridge(f) {
  return callBridgeViaIframe("createInquiryDoc", {
    firstName: f.firstName || "",
    lastName: f.lastName || "",
    address: f.address || "",
    city: f.city || "",
    postalCode: f.postalCode || "",
    dob: f.dob || "",
    phone: f.phone || "",
    dateOfInquiry: f.dateOfInquiry || "",
    associate: f.associate || ""
  }, "inquiryDocCreated");
}

// Bridge action emailInquiryDoc: exports the doc as PDF and emails it to TransUnion.
// Returns { from, sentAt }.
function emailInquiryDocViaBridge(docId, associate, clientName) {
  return callBridgeViaIframe("emailInquiryDoc", {
    docId: docId,
    associate: associate || "",
    clientName: clientName || ""
  }, "inquiryEmailSent");
}

function logMoveViaMcp(args) {
  return callBridgeViaIframe("logMove", {
    sourceTicketId: args.sourceTicketId,
    destProject: args.destProject || "",
    destDetail: args.destDetail || "",
    operatorName: args.operatorName || "",
    notes: args.notes || ""
  }, "moveLogged");
}

// ============ END MOVE MODAL HELPERS ============

// ============ MOVE MODAL DISPATCH ============

function executeApiMove(args) {
  // args: { destination, ticketDetails, ticketId, clientStatusTier, problemAreaChoice, workTypeChoice, accountIdValue, onAuthRequired }
  var d = MOVE_DESTINATIONS[args.destination];

  if (args.destination === "EOC") {
    if (d.requiresProblemArea && !args.problemAreaChoice) return Promise.reject(new Error("Pick a Problem Area first."));
    if (!args.clientStatusTier) return Promise.reject(new Error("Pick a Client Status tier first."));
    if (!args.ticketDetails.identityId) return Promise.reject(new Error("Source ticket is missing Identity ID."));
    if (!args.ticketDetails.accountId && !args.accountIdValue) return Promise.reject(new Error("Source ticket is missing Account ID."));
    if (args.accountIdValue && !/^[CHWN][0-9A-Z]{7,}$/i.test(args.accountIdValue)) return Promise.reject(new Error("Account ID format is invalid."));

    return callEocBridge({
      action: "moveToEoc",
      wocooTicketId: args.ticketId,
      clientStatusTier: args.clientStatusTier,
      problemAreaLabel: args.problemAreaChoice,
      accountIdOverride: args.ticketDetails.accountId ? undefined : args.accountIdValue,
      operatorName: args.operatorName || ""
    }, args.onAuthRequired);
  }

  if (args.destination === "CRED") {
    // Routed through the OAuth bridge (per-agent), not jira_move_ticket — the MCP tool can't
    // remap the source workflow/status into CRED and was failing with a fields validation error.
    return callBridgeViaIframe("moveToCred", {
      wocooTicketId: args.ticketId,
      operatorName: args.operatorName || ""
    }, "moveDone").then(function(data) {
      return {
        success: true,
        sourceTicketId: data.sourceTicketId || args.ticketId,
        targetProject: "CRED",
        targetIssueType: "Task",
        taskId: data.taskId || null,
        appliedFields: data.appliedFields || { summary: args.ticketDetails.summary },
        note: (data.logRowNumber ? "✓ Logged to Moves sheet (row #" + data.logRowNumber + "). " : "") + (data.note || "Move accepted.")
      };
    });
  }

  if (args.destination === "PFO") {
    if (!args.ticketDetails.identityId) return Promise.reject(new Error("Source ticket is missing Identity ID."));
    var wt = args.workTypeChoice || (d.recommendedWorkType && d.recommendedWorkType(args.ticketDetails)) || d.workTypeOptions[0];
    if (d.apiSupportedWorkTypes && d.apiSupportedWorkTypes.indexOf(wt) === -1) {
      return Promise.reject(new Error("Work type \"" + wt + "\" is UI-only. Use JIRA Move from the ticket."));
    }
    // Routed through the OAuth bridge (per-agent), not jira_move_ticket — same reason as CRED;
    // PFO also needs the Identity ID mandatory field, which jira_move_ticket can't supply.
    return callBridgeViaIframe("moveToPfo", {
      wocooTicketId: args.ticketId,
      workType: wt,
      identityIdOverride: args.ticketDetails.identityId,
      operatorName: args.operatorName || ""
    }, "moveDone").then(function(data) {
      return {
        success: true,
        sourceTicketId: data.sourceTicketId || args.ticketId,
        targetProject: "PFO",
        targetIssueType: data.targetIssueType || wt,
        taskId: data.taskId || null,
        appliedFields: data.appliedFields || { summary: args.ticketDetails.summary, identityId: args.ticketDetails.identityId, workType: wt },
        note: (data.logRowNumber ? "✓ Logged to Moves sheet (row #" + data.logRowNumber + "). " : "") + (data.note || "Move accepted.")
      };
    });
  }

  return Promise.reject(new Error("Destination " + args.destination + " is UI-only — use JIRA Move from the ticket."));
}

// ============ END MOVE MODAL DISPATCH ============

// ============ MOVE MODAL COMPONENTS ============

function ProblemAreaTypeahead(props) {
  var destination = props.destination;
  var value = props.value;
  var onSelect = props.onSelect;
  var disabled = !!props.disabled;

  var _q = useState(value || ""), q = _q[0], setQ = _q[1];
  var _open = useState(false), open = _open[0], setOpen = _open[1];
  var _hl = useState(-1), hl = _hl[0], setHl = _hl[1];

  useEffect(function() { setQ(value || ""); }, [value]);

  var allOptions = [];
  destination.problemAreas.forEach(function(grp) {
    if (grp && grp.options) {
      grp.options.forEach(function(opt) { allOptions.push({ label: opt, group: grp.group }); });
    }
  });
  var ft = (q || "").toLowerCase().trim();
  var filtered = ft ? allOptions.filter(function(o) { return o.label.toLowerCase().indexOf(ft) !== -1; }) : allOptions.slice();

  function pick(idx) {
    if (idx < 0 || idx >= filtered.length) return;
    var picked = filtered[idx].label;
    setQ(picked);
    onSelect(picked);
    setOpen(false);
  }

  return (
    <div style={{ margin: "6px 0", display: "flex", alignItems: "flex-start" }}>
      <span style={{ color: "#6b7280", fontSize: 11, fontWeight: 600, paddingTop: 8 }}>Problem Area:</span>
      <div style={{ position: "relative", marginLeft: 6 }}>
        <input type="text" value={q} placeholder="Type to search… (157 options)"
          disabled={disabled}
          onFocus={function() { setOpen(true); }}
          onBlur={function() { setTimeout(function() { setOpen(false); setQ(value || ""); }, 150); }}
          onChange={function(e) { setQ(e.target.value); setHl(0); setOpen(true); }}
          onKeyDown={function(e) {
            if (e.key === "ArrowDown") { e.preventDefault(); setHl(function(p) { return p < filtered.length - 1 ? p + 1 : 0; }); }
            else if (e.key === "ArrowUp") { e.preventDefault(); setHl(function(p) { return p > 0 ? p - 1 : filtered.length - 1; }); }
            else if (e.key === "Enter") { e.preventDefault(); pick(hl); }
            else if (e.key === "Escape") { setOpen(false); e.target.blur(); }
          }}
          style={{ width: 360, padding: "6px 10px", border: "1px solid #d1d5db", borderRadius: 8, fontSize: 12 }} />
        {open ? (
          <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, minWidth: 360, maxHeight: 320, overflowY: "auto", background: "#fff", border: "1px solid #d1d5db", borderRadius: 8, zIndex: 50, boxShadow: "0 6px 20px rgba(0,0,0,0.18)" }}>
            {filtered.length === 0 ? (
              <div style={{ padding: 14, fontSize: 12, color: "#6b7280", fontStyle: "italic", textAlign: "center" }}>No matches for "{q}"</div>
            ) : filtered.map(function(opt, i) {
              var prev = i > 0 ? filtered[i - 1].group : null;
              var isHl = i === hl;
              return (
                <React.Fragment key={i}>
                  {opt.group && opt.group !== prev ? (
                    <div style={{ padding: "8px 12px 4px", fontSize: 10, fontWeight: 700, textTransform: "uppercase", color: "#9ca3af", background: "#f9fafb", letterSpacing: 0.5 }}>{opt.group}</div>
                  ) : null}
                  <div onMouseDown={function(e) { e.preventDefault(); pick(i); }}
                    style={{ padding: "7px 12px", fontSize: 12, cursor: "pointer", background: isHl ? "#eef2ff" : "#fff", color: isHl ? "#4f46e5" : "#1f2937" }}>{opt.label}</div>
                </React.Fragment>
              );
            })}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function LogErrorForm(props) {
  var _cat = useState(""), cat = _cat[0], setCat = _cat[1];
  var _asn = useState(props.loggerName || ""), asn = _asn[0], setAsn = _asn[1];
  var _desc = useState(""), desc = _desc[0], setDesc = _desc[1];
  var _st = useState("idle"), st = _st[0], setSt = _st[1];
  var _err = useState(null), err = _err[0], setErr = _err[1];
  var _res = useState(null), res = _res[0], setRes = _res[1];

  if (st === "logged") {
    return (
      <div style={{ padding: "14px 20px", background: "#f0fdf4", borderTop: "1px solid #bbf7d0" }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: "#16a34a" }}>✓ Logged to Errors sheet (row #{res.rowNumber})</div>
        <div style={{ fontSize: 11, color: "#166534", marginTop: 6 }}>Ticket Type: <strong>{res.ticketType}</strong> · Reporter: <strong>{res.reporter}</strong></div>
        <a href={res.sheetUrl} target="_blank" rel="noreferrer" style={{ display: "inline-block", marginTop: 8, padding: "6px 12px", background: "#16a34a", color: "#fff", borderRadius: 6, fontSize: 11, fontWeight: 600, textDecoration: "none" }}>Open sheet →</a>
      </div>
    );
  }

  var loading = st === "logging";

  return (
    <div style={{ padding: "14px 20px", borderTop: "2px solid #e5e7eb" }}>
      <strong>Step 4: Log to Errors Sheet <span style={{ color: "#6b7280", fontWeight: 400, fontSize: 11 }}>(Optional)</span></strong>
      <div style={{ fontSize: 11, color: "#6b7280", marginTop: 2, marginBottom: 10 }}>Tracks triage misroutes for team review. Skip if not applicable.</div>
      {err ? <div style={{ padding: 8, background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 6, color: "#991b1b", fontSize: 12, marginBottom: 10 }}>{err}</div> : null}
      <div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 6, fontSize: 12 }}>
        <span style={{ color: "#6b7280", fontSize: 11, fontWeight: 600 }}>Error Category:</span>
        <select value={cat} onChange={function(e) { setCat(e.target.value); }} disabled={loading} style={{ padding: "6px 10px", border: "1px solid #d1d5db", borderRadius: 6, fontSize: 12, minWidth: 260 }}>
          <option value="">— Select category —</option>
          {ERROR_LOG_CATEGORIES.map(function(c) { return <option key={c} value={c}>{c}</option>; })}
        </select>
      </div>
      <div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 6, fontSize: 12 }}>
        <span style={{ color: "#6b7280", fontSize: 11, fontWeight: 600 }}>Assignee:</span>
        <input type="text" value={asn} onChange={function(e) { setAsn(e.target.value); }} disabled={loading} style={{ padding: "6px 10px", border: "1px solid #d1d5db", borderRadius: 6, fontSize: 12 }} />
      </div>
      <textarea value={desc} onChange={function(e) { setDesc(e.target.value); }} disabled={loading} rows={3} placeholder="Add context that would help on review…" style={{ width: "100%", boxSizing: "border-box", padding: "6px 10px", border: "1px solid #d1d5db", borderRadius: 6, fontSize: 12, marginTop: 4 }} />
      <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
        <button disabled={loading || !cat || !asn} onClick={function() {
          setSt("logging"); setErr(null);
          logTicketMoveErrorMcp({
            wocooTicketId: props.wocooTicketId, errorCategory: cat, errorDescription: desc,
            loggerName: asn, workType: props.workType || ""
          }).then(function(r) { setRes(r); setSt("logged"); })
            .catch(function(e) { setErr(e.message); setSt("idle"); });
        }} style={{ padding: "8px 16px", background: (!cat || !asn) ? "#d1d5db" : "#16a34a", color: "#fff", border: "none", borderRadius: 8, cursor: (!cat || !asn) ? "not-allowed" : "pointer", fontWeight: 600, fontSize: 13 }}>{loading ? "Logging…" : "Log Error"}</button>
        <button onClick={props.onSkip} disabled={loading} style={{ padding: "8px 16px", background: "#fff", color: "#6b7280", border: "1px solid #d1d5db", borderRadius: 8, cursor: "pointer", fontWeight: 600, fontSize: 13 }}>Skip &amp; Close</button>
      </div>
    </div>
  );
}

function MoveModal(props) {
  var ticket = props.ticket;
  var onClose = props.onClose;
  var defaultDestination = props.defaultDestination || "EOC";
  var assigneeName = props.assigneeName || "";

  var _dest = useState(defaultDestination), destination = _dest[0], setDestination = _dest[1];
  var _td = useState(null), ticketDetails = _td[0], setTicketDetails = _td[1];
  var _wt = useState(null), workTypeChoice = _wt[0], setWorkTypeChoice = _wt[1];
  var _pa = useState(null), problemAreaChoice = _pa[0], setProblemAreaChoice = _pa[1];
  var _aid = useState(""), accountIdValue = _aid[0], setAccountIdValue = _aid[1];
  var _csTier = useState("Premium"), clientStatusTier = _csTier[0], setClientStatusTier = _csTier[1];
  var _status = useState("loading"), status = _status[0], setStatus = _status[1];
  var _err = useState(null), error = _err[0], setError = _err[1];
  var _result = useState(null), moveResult = _result[0], setResult = _result[1];
  var _authPending = useState(null), authPending = _authPending[0], setAuthPending = _authPending[1];

  useEffect(function() {
    setStatus("loading");
    MagicTools.call("jira_get_ticket", { ticket_id: ticket.id })
      .then(function(p) {
        var shape = mapJiraTicketToEocShape(p);
        if (shape) {
          shape.category = ticket.category;
          shape.type = ticket.type;
          shape.priority = ticket.priority;
        }
        setTicketDetails(shape);
        setAccountIdValue((shape && shape.accountId) || "");
        setStatus("configuring");
      })
      .catch(function(e) { setError("Fetch failed: " + e.message); setStatus("error"); });
  }, [ticket.id]);

  var d = MOVE_DESTINATIONS[destination];
  var locked = status === "confirming" || status === "executing";
  var jiraUrl = "https://wealthsimple.atlassian.net/browse/" + ticket.id;

  function handleAuthRequired(authUrl) {
    window.open(authUrl, "_blank", "noopener");
    setAuthPending(authUrl);
    setStatus("auth_pending");
    return new Promise(function() { /* resolves only on user retry — handled via Retry button */ });
  }

  function runMove() {
    setStatus("executing");
    setError(null);
    executeApiMove({
      destination: destination, ticketDetails: ticketDetails, ticketId: ticket.id,
      clientStatusTier: clientStatusTier, problemAreaChoice: problemAreaChoice,
      workTypeChoice: workTypeChoice, accountIdValue: accountIdValue,
      operatorName: assigneeName,
      onAuthRequired: handleAuthRequired
    }).then(function(res) {
      setResult(res); setStatus("success"); setAuthPending(null);
    }).catch(function(e) {
      if (e && e.authUrl) { handleAuthRequired(e.authUrl); return; }
      setError(e.message); setStatus("configuring");
    });
  }

  return (
    <div className="wocoo-modal-overlay" style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 20 }}>
      <div className="wocoo-modal-content" style={{ background: "#fff", borderRadius: 12, maxWidth: 760, width: "100%", maxHeight: "90vh", overflowY: "auto", border: "2px solid #4f46e5", color: "#1f2937" }} onClick={function(e) { e.stopPropagation(); }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 20px", borderBottom: "1px solid #e5e7eb" }}>
          <h2 style={{ margin: 0, fontSize: 16 }}>Move: <a href={"https://wealthsimple.atlassian.net/browse/" + ticket.id} target="_blank" rel="noreferrer" style={{ color: "#4f46e5", textDecoration: "none" }}>{ticket.id}</a></h2>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#9ca3af" }}>×</button>
        </div>

        {status === "loading" ? <div style={{ padding: 24, textAlign: "center", color: "#6b7280" }}>Fetching ticket details from JIRA…</div> : null}
        {error ? <div style={{ padding: "10px 20px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, margin: "10px 20px", color: "#991b1b", fontSize: 12 }}>{error}</div> : null}

        {status !== "loading" && ticketDetails ? (
          <React.Fragment>
            {/* Step 1: Destination */}
            <div style={{ padding: "14px 20px", background: "#fafafa", borderBottom: "1px solid #f3f4f6" }}>
              <strong>Step 1: Move To</strong>
              <div style={{ display: "flex", gap: 10, alignItems: "center", marginTop: 6, flexWrap: "wrap" }}>
                <select disabled={locked} value={destination}
                  onChange={function(e) { setDestination(e.target.value); setWorkTypeChoice(null); setProblemAreaChoice(null); setStatus("configuring"); setError(null); }}
                  style={{ padding: "8px 12px", border: "1px solid #d1d5db", borderRadius: 8, fontSize: 13, minWidth: 240 }}>
                  {Object.keys(MOVE_DESTINATIONS).map(function(k) {
                    var dd = MOVE_DESTINATIONS[k];
                    var tag = dd.apiEnabled ? " (API ✓)" : " (UI move)";
                    return <option key={k} value={k}>{dd.name} — {dd.fullName}{tag}</option>;
                  })}
                </select>
                <a href={d.boardUrl} target="_blank" rel="noreferrer" style={{ fontSize: 11, color: "#4f46e5", fontWeight: 600, textDecoration: "none" }}>Open {d.name} board →</a>
              </div>
            </div>

            {/* Step 2: Source */}
            <div style={{ padding: "14px 20px", borderBottom: "1px solid #f3f4f6", fontSize: 13 }}>
              <strong>Step 2: Source Ticket Details</strong>
              <div style={{ margin: "6px 0", lineHeight: 1.5, fontSize: 12 }}>
                <span style={{ color: "#6b7280", fontSize: 11, fontWeight: 600 }}>Summary: </span>
                <strong>{ticketDetails.summary || "—"}</strong>
              </div>
              {(d.fields && (d.fields.identityId || d.fields.identityIdAsSuspiciousSlug)) ? (
                <div style={{ margin: "6px 0", fontSize: 12 }}>
                  <span style={{ color: "#6b7280", fontSize: 11, fontWeight: 600 }}>{d.fields.identityIdAsSuspiciousSlug ? "Identity ID (→ Suspicious Identity Slug):" : "Identity ID:"} </span>
                  <code style={{ background: "#f3f4f6", padding: "2px 6px", borderRadius: 4, fontFamily: "monospace", fontSize: 11 }}>{ticketDetails.identityId || "Not found"}</code>
                </div>
              ) : null}
              {(d.fields && d.fields.accountId) ? (
                <div style={{ margin: "6px 0", fontSize: 12 }}>
                  <span style={{ color: "#6b7280", fontSize: 11, fontWeight: 600 }}>Account ID (W#/H#/C#): </span>
                  {ticketDetails.accountId
                    ? <span><code style={{ background: "#f3f4f6", padding: "2px 6px", borderRadius: 4, fontFamily: "monospace", fontSize: 11 }}>{ticketDetails.accountId}</code><span style={{ color: "#16a34a", marginLeft: 6, fontSize: 11, fontWeight: 600 }}>from JIRA</span></span>
                    : <input type="text" disabled={locked} value={accountIdValue}
                      onChange={function(e) { setAccountIdValue(e.target.value.toUpperCase()); }}
                      placeholder="e.g. WK5TPMJ32CAD"
                      style={{ fontFamily: "monospace", textTransform: "uppercase", width: 200, marginLeft: 6, padding: "6px 10px", border: "1px solid #d1d5db", borderRadius: 6, fontSize: 12 }} />}
                </div>
              ) : null}
              {(d.fields && d.fields.clientStatus) ? (
                <div style={{ margin: "6px 0", fontSize: 12 }}>
                  <span style={{ color: "#6b7280", fontSize: 11, fontWeight: 600 }}>Source Tier: </span><strong>{ticketDetails.userTier || "—"}</strong>
                </div>
              ) : null}
            </div>

            {/* Step 3: Values */}
            <div style={{ padding: "14px 20px", borderBottom: "1px solid #f3f4f6", fontSize: 13, background: "#fafafa" }}>
              <strong>Step 3: Values for {d.name}</strong>

              {destination === "EOC" ? (
                <div style={{ marginTop: 6 }}>
                  <span style={{ color: "#6b7280", fontSize: 11, fontWeight: 600 }}>Client Status:</span>
                  <div style={{ display: "flex", gap: 6, marginTop: 4, marginBottom: 8 }}>
                    {["Core", "Premium", "Generation"].map(function(tier) {
                      var active = clientStatusTier === tier;
                      return <button key={tier} disabled={locked} onClick={function() { setClientStatusTier(tier); }}
                        style={{ padding: "6px 14px", border: "1px solid #fde68a", background: active ? "#d97706" : "#fff", color: active ? "#fff" : "#d97706", borderRadius: 6, cursor: "pointer", fontSize: 12, fontWeight: 600 }}>{tier}</button>;
                    })}
                  </div>
                </div>
              ) : null}

              {d.workType && !d.workTypeOptions ? (
                <div style={{ margin: "6px 0", fontSize: 12 }}>
                  <span style={{ color: "#6b7280", fontSize: 11, fontWeight: 600 }}>Work Type: </span><strong>{d.workType}</strong>
                </div>
              ) : null}

              {d.workTypeOptions ? (
                <div style={{ margin: "6px 0", fontSize: 12 }}>
                  <span style={{ color: "#6b7280", fontSize: 11, fontWeight: 600 }}>Work Type: </span>
                  <select disabled={locked}
                    value={workTypeChoice || (d.recommendedWorkType && d.recommendedWorkType(ticketDetails)) || d.workTypeOptions[0]}
                    onChange={function(e) { setWorkTypeChoice(e.target.value); }}
                    style={{ padding: "6px 10px", border: "1px solid #d1d5db", borderRadius: 6, fontSize: 12, maxWidth: 340, marginLeft: 6 }}>
                    {d.workTypeOptions.map(function(wt) {
                      var apiOk = !d.apiSupportedWorkTypes || d.apiSupportedWorkTypes.indexOf(wt) !== -1;
                      var label = wt + (d.apiEnabled && !apiOk ? " (UI only)" : "");
                      return <option key={wt} value={wt}>{label}</option>;
                    })}
                  </select>
                </div>
              ) : null}

              {d.requiresProblemArea ? (
                <ProblemAreaTypeahead destination={d} disabled={locked}
                  value={problemAreaChoice || (d.recommendedProblemArea && d.recommendedProblemArea(ticketDetails)) || ""}
                  onSelect={setProblemAreaChoice} />
              ) : null}

              {destination === "CRED" ? (
                <div style={{ fontSize: 11, color: "#6b7280", marginTop: 4, fontStyle: "italic" }}>No additional fields required — summary copies from source.</div>
              ) : null}
            </div>

            {/* Action / Status sections */}
            {d.apiEnabled && status === "configuring" ? (
              <div style={{ padding: "14px 20px", display: "flex", gap: 10, justifyContent: "flex-end" }}>
                <button onClick={onClose} style={{ padding: "8px 16px", background: "#fff", color: "#6b7280", border: "1px solid #d1d5db", borderRadius: 8, cursor: "pointer", fontWeight: 600, fontSize: 13 }}>Cancel</button>
                <button onClick={function() { setStatus("confirming"); }} style={{ padding: "8px 16px", background: "#4f46e5", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 600, fontSize: 13 }}>Review &amp; Move via API</button>
              </div>
            ) : null}

            {status === "confirming" ? (
              <div style={{ padding: "14px 20px", background: "#fffbeb", borderTop: "1px solid #fde68a" }}>
                <strong style={{ color: "#92400e" }}>Move {ticket.id} to {d.name} with these values?</strong>
                <div style={{ fontSize: 11, color: "#92400e", marginTop: 4, lineHeight: 1.5 }}>Zendesk chat history is preserved automatically.</div>
                <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                  <button onClick={runMove} style={{ padding: "8px 16px", background: "#16a34a", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 600, fontSize: 13 }}>✓ Confirm Move</button>
                  <button onClick={function() { setStatus("configuring"); }} style={{ padding: "8px 16px", background: "#fff", color: "#6b7280", border: "1px solid #d1d5db", borderRadius: 8, cursor: "pointer", fontWeight: 600, fontSize: 13 }}>← Back to Edit</button>
                </div>
              </div>
            ) : null}

            {status === "executing" ? (
              <div style={{ padding: 24, textAlign: "center", color: "#4f46e5", fontWeight: 600 }}>Moving {ticket.id} to {d.name}…</div>
            ) : null}

            {status === "auth_pending" ? (
              <div style={{ padding: "14px 20px", background: "#fffbeb", borderTop: "1px solid #fde68a" }}>
                <strong style={{ color: "#92400e" }}>Atlassian authorization required</strong>
                <div style={{ fontSize: 12, color: "#92400e", marginTop: 6, lineHeight: 1.5 }}>
                  A new tab should have opened for you to authorize the bridge to access JIRA. Complete the consent there, then click Retry.
                </div>
                <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                  <button onClick={runMove} style={{ padding: "8px 16px", background: "#16a34a", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 600, fontSize: 13 }}>Retry move</button>
                  <a href={authPending} target="_blank" rel="noreferrer" style={{ padding: "8px 16px", background: "#fff", color: "#4f46e5", border: "1px solid #c7d2fe", borderRadius: 8, fontWeight: 600, fontSize: 13, textDecoration: "none" }}>Open auth tab again</a>
                  <button onClick={function() { setStatus("configuring"); setAuthPending(null); }} style={{ padding: "8px 16px", background: "#fff", color: "#6b7280", border: "1px solid #d1d5db", borderRadius: 8, cursor: "pointer", fontWeight: 600, fontSize: 13 }}>Cancel</button>
                </div>
              </div>
            ) : null}

            {status === "success" && moveResult ? (
              <div style={{ padding: 24, background: "#f0fdf4", borderTop: "1px solid #bbf7d0", textAlign: "center" }}>
                <div style={{ fontSize: 18, fontWeight: 700, color: "#16a34a", marginBottom: 8 }}>✓ Moved to {moveResult.targetProject}</div>
                <div style={{ fontSize: 12, color: "#166534" }}>{moveResult.note}</div>
              </div>
            ) : null}

            {!d.apiEnabled && status === "configuring" ? (
              <div style={{ padding: "12px 20px", background: "#fffbeb", borderTop: "1px solid #fde68a", fontSize: 11, color: "#92400e", lineHeight: 1.6 }}>
                Use JIRA's native Move to preserve Zendesk chat history. Open the ticket below, click ⋯ → Move → <strong>{d.fullName} ({d.projectKey})</strong>.
                <div style={{ marginTop: 10 }}>
                  <a href={jiraUrl} target="_blank" rel="noreferrer" style={{ padding: "8px 16px", background: "#d97706", color: "#fff", borderRadius: 8, textDecoration: "none", fontWeight: 600, fontSize: 12, display: "inline-block" }}>Open ticket in JIRA →</a>
                </div>
              </div>
            ) : null}

            {/* Step 4: Log to Errors sheet */}
            {(status === "success" || (!d.apiEnabled && status === "configuring")) ? (
              <LogErrorForm wocooTicketId={ticket.id} workType={ticket.type} loggerName={assigneeName} onSkip={onClose} />
            ) : null}
          </React.Fragment>
        ) : null}
      </div>
    </div>
  );
}

// ============ END MOVE MODAL COMPONENTS ============
var TIER_OPTIONS=[{label:"Premium",id:"13704"},{label:"Core",id:"13705"},{label:"Generation",id:"18270"}];

var RESOLUTION_STEPS={
  "Credit Card: Overpayment / Negative Balance":{source:"WOCOO Wiki + BCC Triage Guide",sla:"First touch <1 day · Ops SLA 3–5 days",steps:["1. Check acceptance criteria: Premium/Gen client, mis-input, overpayment >$1K.","2. Investigate in Preset dashboard — verify current principal balance.","3. IF honouring: Create REIM ticket.","4. Apply Admin Debit in i2c.","5. Confirm REIM settled → notify CX. Client expects funds in 2–3 days."]},
  "CC Application Reset/Close":{source:"WOCOO Wiki",sla:"First touch <1 day · Ops SLA 3–5 days",steps:["1. Pull Identity ID and description.","2. Create EOC Task: Payment Card - Issuance & Lifecycle.","3. Set Client Status and Account ID.","4. EOC team will action."]},
  "Credit Card: Fee Reversal / Closure":{source:"WOCOO Wiki",sla:"First touch <1 day · Ops SLA 3–5 days",steps:["1. Confirm: fee reversal only or + closure.","2. Check eligibility window.","3. If PT: redirect to FFR board.","4. Eligible: follow REIM process."]},
  "Prepaid Card: Declined Transactions":{source:"WOCOO Wiki",sla:"First touch <1 day · Ops SLA 3–5 days",steps:["1. Atlas → identify decline code.","2. Code 51: SQL + Balance Dashboard.","3. Code 63: Koho Admin $350 limit.","4. Code 57: Blocked countries.","5. Code 61: $5K daily."]},
  "Credit Card: Transactions (General)":{source:"WOCOO Wiki",sla:"First touch <1 day · Ops SLA 3–5 days",steps:["1. Pull details from Atlas + i2c.","2. Duplicates: verify in both.","3. Interest waive: check eligibility."]},
  "Cash: Bill Payment":{source:"WOCOO Wiki",sla:"First touch <1 day · Ops SLA 3–5 days",steps:["1. Pull details from Atlas.","2. Cancelled: check NSF.","3. WORS-related: redirect."]},
  "Cash: E-transfers":{source:"WOCOO Wiki",sla:"First touch <1 day · Ops SLA 3–5 days",steps:["1. Check Atlas for status.","2. Verify funds movement.","3. Auto-deposit, holds."]},
  "Credit Card: Digital Wallet":{source:"WOCOO Wiki",sla:"First touch <1 day · Ops SLA 3–5 days",steps:["1. Apple vs Google Wallet.","2. Card status in Atlas.","3. Physical card: expiry/CVV."]},
  "Credit Card: Statements":{source:"WOCOO Wiki",sla:"First touch <1 day · Ops SLA 3–5 days",steps:["1. Address: verify in Atlas.","2. Balance discrepancies: i2c + Atlas."]},
  "Credit Card: Rewards / Cashback":{source:"WOCOO Wiki",sla:"First touch <1 day · Ops SLA 3–5 days",steps:["1. Pull from i2c + Atlas.","2. Verify tier + rates."]},
  "Prepaid Card: Digital Wallet":{source:"WOCOO Wiki",sla:"First touch <1 day · Ops SLA 3–5 days",steps:["1. Koho Admin: card active?","2. Provisioning enabled?","3. Escalate to Koho."]},
  "Other / Eligibility Confirmation":{source:"WOCOO Wiki",sla:"First touch <1 day",steps:["1. Confirm in Atlas.","2. Done if confirmed.","3. Overflow: WORS/BOTI."]},
  "Cash: Cheques":{source:"WOCOO Wiki",sla:"First touch <1 day · Ops SLA 5 days",steps:["1. Unrecognized: cheque images.","2. Rejected: check reason.","3. Bounced: WORS."]},
  "Visa Airport Companion":{source:"WOCOO Wiki",sla:"First touch <1 day",steps:["1. Check known platform issues.","2. If known: comment + Done.","3. If not: verify card type (VIP) and >30 days."]},
  "Inquiry Removal":{source:"WOCOO Wiki",sla:"First touch <1 day",steps:["1. Confirm the reason: client applied for a WS Credit Card and is displeased with the credit limit offered (courtesy removal request).","2. Gather client info: name, address, city, postal code, DOB, phone, and date of inquiry (card application/open date).","3. Tools ▾ → 🧾 Inquiry Removal → fill the fields → Generate Document.","4. Review the generated letter in Google Docs; edit if anything needs adjusting.","5. Email to TransUnion → Confirm Send (PDF auto-attached, sent to TUCCustServ@transunion.com).","6. Comment on the ticket and move to Done."]},
};

