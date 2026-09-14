function Dashboard(){
  var _tab=useState("tickets"),tab=_tab[0],setTab=_tab[1];
  var _exp=useState(null),expanded=_exp[0],setExpanded=_exp[1];
  var _sc=useState("created"),sortCol=_sc[0],setSortCol=_sc[1];
  var _sd=useState(-1),sortDir=_sd[0],setSortDir=_sd[1];
  var _fs=useState("Triage"),filterStatus=_fs[0],setFilterStatus=_fs[1];
  var _sx=useState(""),searchText=_sx[0],setSearchText=_sx[1];
  var _tt=useState(null),triageTarget=_tt[0],setTriageTarget=_tt[1];
  var _iq=useState(null),inquiryTarget=_iq[0],setInquiryTarget=_iq[1];
  var _tr=useState(null),transcriptTarget=_tr[0],setTranscriptTarget=_tr[1];
  var _mt=useState(null),moveTarget=_mt[0],setMoveTarget=_mt[1];
  var _lr=useState(new Date().toLocaleTimeString()),lastReload=_lr[0],setLastReload=_lr[1];
  var _ts=useState([]),toasts=_ts[0],setToasts=_ts[1];
  var pushToast=useCallback(function(message,type,duration){
    var id=Date.now()+Math.random();
    setToasts(function(prev){return prev.concat([{id:id,message:message,type:type||"info"}])});
    setTimeout(function(){setToasts(function(prev){return prev.filter(function(t){return t.id!==id})})},duration||2000);
  },[]);
  var searchRef=React.useRef(null);
  var _sc=useState(false),scrolled=_sc[0],setScrolled=_sc[1];
  var _sh=useState(false),shortcutHelpOpen=_sh[0],setShortcutHelpOpen=_sh[1];
  var _rl=useState(false),reloading=_rl[0],setReloading=_rl[1];
  var _lt=useState([]),liveTickets=_lt[0],setLiveTickets=_lt[1];
  var _sa=useState("albert"),selectedAssignee=_sa[0],setSelectedAssignee=_sa[1];
  var _re=useState(null),reloadError=_re[0],setReloadError=_re[1];
  var _qdl=useState(null),quickDoneLoading=_qdl[0],setQuickDoneLoading=_qdl[1];
  var _qdd=useState({}),quickDoneDone=_qdd[0],setQuickDoneDone=_qdd[1];
  var _ot=useState(null),openToolsId=_ot[0],setOpenToolsId=_ot[1];

  // Close the tools menu when clicking anywhere outside any tools-wrap element.
  useEffect(function(){
    function onDocClick(e){ if(!e.target.closest||!e.target.closest('.tools-wrap')) setOpenToolsId(null); }
    document.addEventListener('click', onDocClick);
    return function(){ document.removeEventListener('click', onDocClick); };
  },[]);

  // User preferences (per-device, persisted in localStorage)
  var _dm=useState(function(){try{return localStorage.getItem('wocooDarkMode')==='1'}catch(e){return false}}),darkMode=_dm[0],setDarkMode=_dm[1];
  var _sc=useState(function(){try{return localStorage.getItem('wocooSlaColors')!=='0'}catch(e){return true}}),slaColorsEnabled=_sc[0],setSlaColorsEnabled=_sc[1];
  var DEFAULT_SHORTCUTS={focusSearch:"/",reload:"r",help:"?"};
  var _ks=useState(function(){try{var s=localStorage.getItem('wocooShortcuts');return s?Object.assign({},DEFAULT_SHORTCUTS,JSON.parse(s)):DEFAULT_SHORTCUTS}catch(e){return DEFAULT_SHORTCUTS}}),shortcuts=_ks[0],setShortcuts=_ks[1];
  var _cap=useState(null),capturingShortcut=_cap[0],setCapturingShortcut=_cap[1];
  useEffect(function(){try{localStorage.setItem('wocooShortcuts',JSON.stringify(shortcuts))}catch(e){}},[shortcuts]);
  function fmtKey(k){return(k&&k.length===1)?k.toUpperCase():(k||"")}
  var _ae=useState(function(){try{return localStorage.getItem('wocooAutoElig')==='1'}catch(e){return false}}),autoEligEnabled=_ae[0],setAutoEligEnabled=_ae[1];
  var _aei=useState(function(){try{var v=parseInt(localStorage.getItem('wocooAutoEligInterval'),10);return isNaN(v)?60:v}catch(e){return 60}}),autoEligIntervalMinutes=_aei[0],setAutoEligIntervalMinutes=_aei[1];
  var _aelr=useState(null),autoEligLastRun=_aelr[0],setAutoEligLastRun=_aelr[1];
  var _aer=useState(false),autoEligRunning=_aer[0],setAutoEligRunning=_aer[1];
  useEffect(function(){try{localStorage.setItem('wocooAutoElig',autoEligEnabled?'1':'0')}catch(e){}},[autoEligEnabled]);
  useEffect(function(){try{localStorage.setItem('wocooAutoEligInterval',String(autoEligIntervalMinutes))}catch(e){}},[autoEligIntervalMinutes]);
  var _aea=useState(function(){try{return localStorage.getItem('wocooAutoEligAssignee')||"albert"}catch(e){return"albert"}}),autoEligAssignee=_aea[0],setAutoEligAssignee=_aea[1];
  useEffect(function(){try{localStorage.setItem('wocooAutoEligAssignee',autoEligAssignee)}catch(e){}},[autoEligAssignee]);
  useEffect(function(){
    if(darkMode) document.body.classList.add('dark-mode'); else document.body.classList.remove('dark-mode');
    try{localStorage.setItem('wocooDarkMode',darkMode?'1':'0')}catch(e){}
  },[darkMode]);
  useEffect(function(){
    if(slaColorsEnabled) document.body.classList.add('sla-colors'); else document.body.classList.remove('sla-colors');
    try{localStorage.setItem('wocooSlaColors',slaColorsEnabled?'1':'0')}catch(e){}
  },[slaColorsEnabled]);

  var activeTickets=liveTickets.filter(function(t){return!["Done","Cancelled"].includes(t.statusGroup)});
  var triageTickets=liveTickets.filter(function(t){return t.statusGroup==="Triage"});
  var catCounts={},statusCounts={},triageCounts={};
  liveTickets.forEach(function(t){catCounts[t.category]=(catCounts[t.category]||0)+1;statusCounts[t.statusGroup]=(statusCounts[t.statusGroup]||0)+1;triageCounts[t.triageMethod]=(triageCounts[t.triageMethod]||0)+1});
  var maxCat=Math.max.apply(null,Object.values(catCounts).concat([1]));
  var maxSt=Math.max.apply(null,Object.values(statusCounts).concat([1]));
  var maxTri=Math.max.apply(null,Object.values(triageCounts).concat([1]));
  var statusFiltered=filterStatus==="all"?liveTickets:liveTickets.filter(function(t){return t.statusGroup===filterStatus});
  var searchQ=(searchText||"").toLowerCase().trim();
  var filtered=searchQ?statusFiltered.filter(function(t){return (t.id||"").toLowerCase().indexOf(searchQ)!==-1||(t.summary||"").toLowerCase().indexOf(searchQ)!==-1;}):statusFiltered;
  var sorted=filtered.slice().sort(function(a,b){var av=a[sortCol]||"",bv=b[sortCol]||"";return av<bv?-1*sortDir:av>bv?1*sortDir:0});
  var handleSort=function(col){if(sortCol===col)setSortDir(function(d){return d*-1});else{setSortCol(col);setSortDir(-1)}};

  var handleAssigneeChange=function(e){
    var val=e.target.value;
    setSelectedAssignee(val);setReloadError(null);
    setTriageTarget(null);setExpanded(null);
    setLiveTickets([]);  // Clear; live JIRA fetch will repopulate on Reload.
  };

  var handleReload=useCallback(function(){
    setReloading(true);setReloadError(null);
    setTriageTarget(null);setExpanded(null);
    var assigneeOpt=ASSIGNEES.find(function(a){return a.value===selectedAssignee});
    var isAll=selectedAssignee==="all";
    var assigneeName=isAll?"All Assignees":(assigneeOpt?assigneeOpt.name:"");
    var jql=isAll
      ?'project = WOCOO AND assignee in ('+ASSIGNEES.map(function(a){return"\""+a.name+"\""}).join(",")+') AND statusCategory != Done ORDER BY created DESC'
      :'project = WOCOO AND assignee = "'+assigneeName+'" AND statusCategory != Done ORDER BY created DESC';

    var fallbackToCache=function(prefix){
      setLiveTickets([]);
      setReloadError(prefix);
    };

    // ADF (Atlassian Document Format) → plain text
    var adfToText=function(node){
      if(!node)return"";
      if(typeof node==="string")return node;
      if(Array.isArray(node))return node.map(adfToText).join("");
      var out="";
      if(node.text)out+=node.text;
      if(node.content)out+=adfToText(node.content);
      if(node.type==="paragraph"||node.type==="heading")out+="\n";
      return out;
    };

    MagicTools.call("jira_search_tickets",{
      jql:jql,
      max_results:100,
      fields:"summary,status,priority,labels,created,description,issuetype,customfield_10334,customfield_11453,customfield_10316"
    }).then(function(parsed){
      // Defensive: handle either parsed JSON or MCP envelope ({content:[{type:"text",text:"...JSON..."}]})
      if(parsed&&parsed.content&&Array.isArray(parsed.content)){
        var rawTxt="";
        for(var ci=0;ci<parsed.content.length;ci++){
          if(parsed.content[ci]&&parsed.content[ci].text)rawTxt+=parsed.content[ci].text;
        }
        if(rawTxt){
          try{parsed=JSON.parse(rawTxt)}catch(e){
            var jm=rawTxt.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
            if(jm){try{parsed=JSON.parse(jm[0])}catch(e2){}}
          }
        }
      }
      if(!parsed)throw new Error("Empty/unparseable tool output");

      var issues=parsed.issues||parsed.tickets||parsed.results||(Array.isArray(parsed)?parsed:null);
      if(!Array.isArray(issues)){
        // Surface raw shape to help debug
        console.log("Unexpected jira_search_tickets response shape",parsed);
        throw new Error("Unexpected response shape — see console for raw payload");
      }

      if(issues.length===0){
        setLiveTickets([]);
        setReloadError("JIRA returned 0 tickets for "+assigneeName+" (JQL: "+jql+")");
        setLastReload(new Date().toLocaleTimeString());
        return;
      }

      var mapped=issues.map(function(it){
        var f=it.fields||it||{};
        // description: ADF or string
        var d=f.description;
        if(d&&typeof d==="object")d=adfToText(d);
        d=String(d==null?"":d).replace(/\s+/g," ").trim().substring(0,400);

        // type: try WOCOO ticket-type custom fields, else issuetype.name
        var typeVal=null;
        var tFields=["customfield_10334","customfield_11453","customfield_10316"];
        for(var ti=0;ti<tFields.length;ti++){
          var v=f[tFields[ti]];
          if(v){
            if(typeof v==="object"&&v.value)typeVal=v.value;
            else if(typeof v==="string")typeVal=v;
            if(typeVal)break;
          }
        }
        if(!typeVal)typeVal=f.issue_type||it.issue_type||(f.issuetype&&f.issuetype.name)||it.type||"Other";

        var status=(f.status&&f.status.name)||f.status||it.status||"";
        var priority=(f.priority&&f.priority.name)||f.priority||it.priority||"Medium";
        var labels=Array.isArray(f.labels)?f.labels.join(","):(f.labels||it.labels||"");
        var created=String(f.created||it.created||"").substring(0,10);

        return {
          id:it.ticket_id||it.key||it.id||"",
          summary:f.summary||it.summary||"",
          type:typeVal,
          status:status,
          priority:priority,
          labels:labels,
          created:created,
          description:d
        };
      }).filter(function(t){return t.id});

      if(mapped.length===0){
        fallbackToCache("Got "+issues.length+" issues but none could be mapped (check console)");
        pushToast("Reload returned 0 tickets","error");
      } else {
        setLiveTickets(enrichTickets(mapped));
        pushToast("Loaded "+mapped.length+" tickets","success",1000);
      }
      setLastReload(new Date().toLocaleTimeString());
    }).catch(function(e){
      fallbackToCache("Reload failed: "+e.message);
      setLastReload(new Date().toLocaleTimeString());
      pushToast("Reload failed: "+e.message,"error");
    }).finally(function(){
      setReloading(false);
    });
  },[selectedAssignee]);

  // Auto-fetch on initial mount and every time the assignee changes.
  useEffect(function(){ handleReload(); },[handleReload]);

  // Keyboard shortcuts: / focus search, R reload, Esc close modal/help, ? help overlay
  useEffect(function(){
    function onKey(e){
      var tag=(e.target&&e.target.tagName)||"";
      var typing=tag==="INPUT"||tag==="TEXTAREA"||tag==="SELECT"||(e.target&&e.target.isContentEditable);
      if(capturingShortcut){
        e.preventDefault();
        if(e.key==="Escape"){setCapturingShortcut(null);return;}
        if(e.key==="Shift"||e.key==="Control"||e.key==="Alt"||e.key==="Meta")return;
        var nk=e.key.length===1?e.key.toLowerCase():e.key;
        setShortcuts(function(prev){var nx=Object.assign({},prev);nx[capturingShortcut]=nk;return nx});
        setCapturingShortcut(null);
        return;
      }
      if(e.key==="Escape"){
        if(shortcutHelpOpen){setShortcutHelpOpen(false);return;}
        if(moveTarget){setMoveTarget(null);return;}
        if(triageTarget){setTriageTarget(null);return;}
        return;
      }
      if(typing)return;
      var k=e.key.length===1?e.key.toLowerCase():e.key;
      if(k===shortcuts.focusSearch){e.preventDefault();if(searchRef.current)searchRef.current.focus();return;}
      if(k===shortcuts.reload){e.preventDefault();handleReload();return;}
      if(k===shortcuts.help){e.preventDefault();setShortcutHelpOpen(function(v){return !v});return;}
    }
    window.addEventListener("keydown",onKey);
    return function(){window.removeEventListener("keydown",onKey)};
  },[handleReload,moveTarget,triageTarget,shortcutHelpOpen,shortcuts,capturingShortcut]);

  // Track scroll position for the floating reload button
  useEffect(function(){
    function onScroll(){setScrolled((window.scrollY||window.pageYOffset||0)>240)}
    window.addEventListener("scroll",onScroll,{passive:true});
    onScroll();
    return function(){window.removeEventListener("scroll",onScroll)};
  },[]);


  var quickMarkDone=function(ticketId){
    setQuickDoneLoading(ticketId);
    callBridgeViaIframe("transitionTicket",{ticketId:ticketId,transitionId:"251"},"transitionDone").then(function(){var u={};u[ticketId]=true;setQuickDoneDone(Object.assign({},quickDoneDone,u))}).catch(function(){}).finally(function(){setQuickDoneLoading(null)})
  };

  var isOvp=function(cat){return cat==="Credit Card: Overpayment / Negative Balance"};
  var isEligibility=function(t){return(t.summary||"").includes("Eligibility Confirmation")&&(t.type||"")==="Other"};

  var runAutoEligibility=useCallback(function(){
    if(autoEligRunning)return;
    var assigneeOpt=ASSIGNEES.find(function(a){return a.value===autoEligAssignee});
    if(!assigneeOpt){pushToast("Auto-eligibility: target assignee not set","error",2000);return}
    setAutoEligRunning(true);
    var jql='project = WOCOO AND assignee = "'+assigneeOpt.name+'" AND statusCategory != Done AND issuetype = "Other" AND summary ~ "Eligibility Confirmation" ORDER BY created DESC';
    MagicTools.call("jira_search_tickets",{jql:jql,max_results:100,fields:"summary,status,issuetype"}).then(function(parsed){
      if(parsed&&parsed.content&&Array.isArray(parsed.content)){var rawTxt="";for(var ci=0;ci<parsed.content.length;ci++){if(parsed.content[ci]&&parsed.content[ci].text)rawTxt+=parsed.content[ci].text}if(rawTxt){try{parsed=JSON.parse(rawTxt)}catch(e){var jm=rawTxt.match(/\{[\s\S]*\}|\[[\s\S]*\]/);if(jm){try{parsed=JSON.parse(jm[0])}catch(e2){}}}}}
      var issues=(parsed&&(parsed.issues||parsed.tickets))||[];
      var todo=issues.filter(function(it){var s=it.summary||(it.fields&&it.fields.summary)||"";var ty=it.issue_type||(it.fields&&it.fields.issuetype&&it.fields.issuetype.name)||"";return s.includes("Eligibility Confirmation")&&ty==="Other"}).map(function(it){return it.ticket_id||it.key||it.id}).filter(Boolean);
      if(todo.length===0){setAutoEligLastRun({ts:Date.now(),succ:0,total:0,fail:0,assignee:assigneeOpt.name});pushToast("Auto-eligibility: no tickets for "+assigneeOpt.name,"info",1800);setAutoEligRunning(false);return}
      var succ=0,fail=0;
      var jobs=todo.map(function(id){return callBridgeViaIframe("transitionTicket",{ticketId:id,transitionId:"251"},"transitionDone").then(function(){succ++;return id}).catch(function(){fail++;return null})});
      Promise.all(jobs).then(function(results){
        var doneIds=results.filter(Boolean);
        if(doneIds.length){setQuickDoneDone(function(prev){var nx=Object.assign({},prev);doneIds.forEach(function(id){nx[id]=true});return nx})}
        setAutoEligLastRun({ts:Date.now(),succ:succ,total:todo.length,fail:fail,assignee:assigneeOpt.name});
        pushToast("Auto-marked "+succ+"/"+todo.length+" eligibility tickets for "+assigneeOpt.name.split(" ")[0]+(fail?" ("+fail+" failed)":""),fail?"error":"success",2500);
        setAutoEligRunning(false);
      });
    }).catch(function(){
      setAutoEligLastRun({ts:Date.now(),succ:0,total:0,fail:0,assignee:assigneeOpt.name,error:true});
      pushToast("Auto-eligibility: JIRA query failed","error",2500);
      setAutoEligRunning(false);
    });
  },[autoEligRunning,autoEligAssignee,pushToast]);
  var runRef=React.useRef(runAutoEligibility);
  useEffect(function(){runRef.current=runAutoEligibility},[runAutoEligibility]);
  useEffect(function(){
    if(!autoEligEnabled)return;
    var iv=setInterval(function(){runRef.current()},Math.max(1,autoEligIntervalMinutes)*60*1000);
    return function(){clearInterval(iv)};
  },[autoEligEnabled,autoEligIntervalMinutes]);
  var isCCApp=function(cat){return cat==="CC Application Reset/Close"};
  var tabStyle=function(t){return{padding:"8px 18px",cursor:"pointer",background:"transparent",borderTop:"none",borderLeft:"none",borderRight:"none",borderBottom:tab===t?"2px solid #4f46e5":"2px solid transparent",color:tab===t?"#4f46e5":(darkMode?"#94a3b8":"#6b7280"),fontWeight:600,fontSize:13}};

  var assigneeName=selectedAssignee==="all"?"All Assignees":((ASSIGNEES.find(function(a){return a.value===selectedAssignee})||{}).name||"");

  return <div style={{fontFamily:"Inter,system-ui,sans-serif",background:darkMode?"#0f172a":"#fff",color:darkMode?"#e2e8f0":"#1f2937",minHeight:"100vh",padding:16}}>
    <div className="wocoo-toast-container">{toasts.map(function(t){return <div key={t.id} className={"wocoo-toast "+(t.type||"info")}>{t.message}</div>})}</div>
    {scrolled?<button onClick={handleReload} disabled={reloading} title={"Reload ("+fmtKey(shortcuts.reload)+")"} style={{position:"fixed",bottom:24,right:24,zIndex:4000,width:52,height:52,borderRadius:9999,background:reloading?(darkMode?"#334155":"#e5e7eb"):"#4f46e5",color:"#fff",border:"none",cursor:reloading?"wait":"pointer",fontWeight:700,fontSize:20,boxShadow:"0 6px 20px rgba(0,0,0,0.25)"}}>↻</button>:null}
    {shortcutHelpOpen?<div className="wocoo-modal-overlay" style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:4500,padding:20}} onClick={function(){setShortcutHelpOpen(false)}}><div className="wocoo-modal-content" style={{background:darkMode?"#1e293b":"#fff",color:darkMode?"#e2e8f0":"#1f2937",borderRadius:12,maxWidth:420,width:"100%",padding:20,border:"2px solid "+(darkMode?"#3730a3":"#4f46e5")}} onClick={function(e){e.stopPropagation()}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}><h3 style={{margin:0,fontSize:15}}>Keyboard shortcuts</h3><button onClick={function(){setShortcutHelpOpen(false)}} style={{background:"none",border:"none",fontSize:18,cursor:"pointer",color:darkMode?"#94a3b8":"#9ca3af"}}>✕</button></div>{[[shortcuts.focusSearch,"Focus search"],[shortcuts.reload,"Reload tickets"],["Esc","Close modal / help"],[shortcuts.help,"Show this help"]].map(function(p){return <div key={p[1]} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 0",borderBottom:"1px solid "+(darkMode?"#334155":"#f3f4f6"),fontSize:13}}><span>{p[1]}</span><kbd style={{padding:"2px 8px",border:"1px solid "+(darkMode?"#475569":"#d1d5db"),borderRadius:4,background:darkMode?"#0f172a":"#f9fafb",fontFamily:"monospace",fontSize:11,fontWeight:600}}>{fmtKey(p[0])}</kbd></div>})}</div></div>:null}
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16,flexWrap:"wrap",gap:8}}>
      <div>
        <h1 style={{margin:0,fontSize:22,color:darkMode?"#f1f5f9":"#111827"}}>🎟️ WOCOO Triage Dashboard</h1>
        <p style={{margin:"2px 0 0",fontSize:12,color:darkMode?"#64748b":"#9ca3af"}}>Cash & Card Operations · {assigneeName} · {lastReload}</p>
      </div>
      <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
        <div style={{background:darkMode?"#450a0a":"#fef2f2",border:"1px solid "+(darkMode?"#7f1d1d":"#fecaca"),borderRadius:10,padding:"8px 14px",textAlign:"center"}}><div style={{fontSize:24,fontWeight:700,color:darkMode?"#f87171":"#dc2626"}}>{triageTickets.length}</div><div style={{fontSize:10,color:darkMode?"#fca5a5":"#991b1b",textTransform:"uppercase",letterSpacing:1}}>To Triage</div></div>
        <div style={{background:darkMode?"#422006":"#fffbeb",border:"1px solid "+(darkMode?"#78350f":"#fde68a"),borderRadius:10,padding:"8px 14px",textAlign:"center"}}><div style={{fontSize:24,fontWeight:700,color:darkMode?"#fbbf24":"#d97706"}}>{activeTickets.length}</div><div style={{fontSize:10,color:darkMode?"#fcd34d":"#92400e",textTransform:"uppercase",letterSpacing:1}}>Active</div></div>
        <div style={{background:darkMode?"#1e1b4b":"#eef2ff",border:"1px solid "+(darkMode?"#3730a3":"#c7d2fe"),borderRadius:10,padding:"8px 14px",textAlign:"center"}}><div style={{fontSize:24,fontWeight:700,color:darkMode?"#a5b4fc":"#4f46e5"}}>{liveTickets.length}</div><div style={{fontSize:10,color:darkMode?"#c7d2fe":"#3730a3",textTransform:"uppercase",letterSpacing:1}}>Total</div></div>
        <select value={selectedAssignee} onChange={handleAssigneeChange} style={{padding:"8px 12px",border:"1px solid #d1d5db",borderRadius:10,fontSize:13,fontWeight:600,color:"#111827",background:"#fff",cursor:"pointer",minWidth:140,height:42}}><option value="all">All Assignees</option>{ASSIGNEES.map(function(a){return <option key={a.value} value={a.value}>{a.name}</option>})}</select>
        <button onClick={handleReload} disabled={reloading} style={{padding:"10px 18px",background:reloading?"#e5e7eb":"#4f46e5",color:reloading?"#6b7280":"#fff",border:"none",borderRadius:10,cursor:reloading?"wait":"pointer",fontWeight:600,fontSize:13}}>↻ {reloading?"…":"Reload"}</button>
      </div>
    </div>

    {reloadError?<div style={{marginBottom:12,padding:10,background:"#fffbeb",border:"1px solid #fde68a",borderRadius:8,fontSize:11,color:"#92400e"}}>{reloadError} <button onClick={function(){setReloadError(null)}} style={{marginLeft:8,background:"none",border:"none",color:"#92400e",cursor:"pointer",textDecoration:"underline",fontSize:10}}>x</button></div>:null}

    <div style={{display:"flex",borderBottom:"1px solid "+(darkMode?"#334155":"#e5e7eb"),marginBottom:16,gap:4}}>
      <button style={tabStyle("overview")} onClick={function(){setTab("overview")}}>Overview</button>
      <button style={tabStyle("tickets")} onClick={function(){setTab("tickets")}}>All Tickets ({liveTickets.length})</button>
      <button style={tabStyle("resolution")} onClick={function(){setTab("resolution")}}>Resolution Steps</button>
      <button style={tabStyle("settings")} onClick={function(){setTab("settings")}}>Settings</button>
    </div>

    {tab==="overview"?<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
      <div style={{background:darkMode?"#1e293b":"#fafafa",borderRadius:12,padding:16,border:"1px solid "+(darkMode?"#334155":"#e5e7eb"),gridColumn:"1/-1"}}><h3 style={{margin:"0 0 10px",fontSize:13,color:darkMode?"#94a3b8":"#6b7280",textTransform:"uppercase"}}>By Category</h3>{Object.entries(catCounts).sort(function(a,b){return b[1]-a[1]}).map(function(e){return <Bar key={e[0]} label={e[0]} value={e[1]} max={maxCat} color="#6366f1"/>})}</div>
      <div style={{background:darkMode?"#1e293b":"#fafafa",borderRadius:12,padding:16,border:"1px solid "+(darkMode?"#334155":"#e5e7eb")}}><h3 style={{margin:"0 0 10px",fontSize:13,color:darkMode?"#94a3b8":"#6b7280",textTransform:"uppercase"}}>By Status</h3>{Object.entries(statusCounts).sort(function(a,b){return b[1]-a[1]}).map(function(e){return <Bar key={e[0]} label={e[0]} value={e[1]} max={maxSt} color={statusColors[e[0]]}/>})}</div>
      <div style={{background:darkMode?"#1e293b":"#fafafa",borderRadius:12,padding:16,border:"1px solid "+(darkMode?"#334155":"#e5e7eb")}}><h3 style={{margin:"0 0 10px",fontSize:13,color:darkMode?"#94a3b8":"#6b7280",textTransform:"uppercase"}}>By Triage Method</h3>{Object.entries(triageCounts).sort(function(a,b){return b[1]-a[1]}).map(function(e){var cols={Escalated:"#d97706",Manual:"#4f46e5","Self-serve":"#16a34a"};return <Bar key={e[0]} label={e[0]} value={e[1]} max={maxTri} color={cols[e[0]]}/>})}</div>
    </div>:null}

    {tab==="tickets"?<div style={{background:darkMode?"#1e293b":"#fafafa",borderRadius:12,padding:16,border:"1px solid "+(darkMode?"#334155":"#e5e7eb")}}>
      <div style={{display:"flex",gap:8,marginBottom:12,flexWrap:"wrap",justifyContent:"space-between",alignItems:"center"}}>
        <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>{["Triage","Back Office","Pending","Done","Cancelled","all"].map(function(f){var active=filterStatus===f;return <button key={f} onClick={function(){setFilterStatus(f)}} style={{padding:"5px 12px",borderRadius:8,border:"1px solid "+(active?(darkMode?"#3730a3":"#4f46e5"):(darkMode?"#334155":"#d1d5db")),background:active?(darkMode?"#1e1b4b":"#eef2ff"):(darkMode?"#1e293b":"#fff"),color:active?(darkMode?"#c7d2fe":"#4f46e5"):(darkMode?"#94a3b8":"#6b7280"),cursor:"pointer",fontSize:11,fontWeight:600}}>{f==="all"?"All ("+liveTickets.length+")":f+" ("+(statusCounts[f]||0)+")"}</button>})}</div>
        <input ref={searchRef} type="text" value={searchText} onChange={function(e){setSearchText(e.target.value)}} placeholder={"🔍 Search ticket ID or summary…  (press "+fmtKey(shortcuts.focusSearch)+")"} style={{padding:"6px 12px",border:"1px solid "+(darkMode?"#334155":"#d1d5db"),borderRadius:8,fontSize:12,minWidth:280,background:darkMode?"#0f172a":"#fff",color:darkMode?"#e2e8f0":"#1f2937",outline:"none"}}/>
      </div>
      {triageTarget?<TriageWorkflow ticket={triageTarget} onClose={function(){setTriageTarget(null)}}/>:null}
      {moveTarget?<MoveModal ticket={moveTarget} assigneeName={(ASSIGNEES.find(function(a){return a.value===selectedAssignee})||{}).name||""} onClose={function(){setMoveTarget(null)}}/>:null}
      {inquiryTarget?<InquiryRemovalModal associate={(ASSIGNEES.find(function(a){return a.value===selectedAssignee})||{}).name||""} onClose={function(){setInquiryTarget(null)}}/>:null}
      {transcriptTarget?<TranscriptParserModal ticket={transcriptTarget} onClose={function(){setTranscriptTarget(null)}}/>:null}
      <div style={{maxHeight:"calc(100vh - 240px)",overflowY:"auto"}}><table style={{width:"100%",borderCollapse:"separate",borderSpacing:0,fontSize:12}}><thead><tr>{[["id","Ticket"],["type","Type"],["category","Category"],["statusGroup","Status"],["priority","Priority"],["triageMethod","Triage"],["created","Created"]].map(function(h){return <th key={h[0]} onClick={function(){handleSort(h[0])}} style={{position:"sticky",top:0,zIndex:2,background:darkMode?"#1e293b":"#fafafa",borderBottom:"2px solid "+(darkMode?"#334155":"#e5e7eb"),textAlign:"left",padding:"8px",color:darkMode?"#94a3b8":"#6b7280",cursor:"pointer",userSelect:"none",fontSize:11,fontWeight:600,boxShadow:"0 1px 0 "+(darkMode?"#334155":"#e5e7eb")}}>{h[1]} {sortCol===h[0]?(sortDir===1?"↑":"↓"):""}</th>})}<th style={{position:"sticky",top:0,zIndex:2,background:darkMode?"#1e293b":"#fafafa",borderBottom:"2px solid "+(darkMode?"#334155":"#e5e7eb"),textAlign:"center",padding:"8px",color:darkMode?"#94a3b8":"#6b7280",fontSize:11,fontWeight:600,boxShadow:"0 1px 0 "+(darkMode?"#334155":"#e5e7eb")}}>Action</th></tr></thead>
      <tbody>{reloading?Array.from({length:8}).map(function(_unused,i){return <tr key={"skel"+i} style={{borderBottom:"1px solid "+(darkMode?"#334155":"#e5e7eb")}}><td style={{padding:"8px"}}><span className="wocoo-skel" style={{width:90,height:14}}/></td><td style={{padding:"8px"}}><span className="wocoo-skel" style={{width:130,height:12}}/></td><td style={{padding:"8px"}}><span className="wocoo-skel" style={{width:160,height:12}}/></td><td style={{padding:"8px"}}><span className="wocoo-skel" style={{width:60,height:18,borderRadius:9999}}/></td><td style={{padding:"8px"}}><span className="wocoo-skel" style={{width:50,height:12}}/></td><td style={{padding:"8px"}}><span className="wocoo-skel" style={{width:60,height:16,borderRadius:4}}/></td><td style={{padding:"8px"}}><span className="wocoo-skel" style={{width:70,height:12}}/></td><td style={{padding:"6px 4px",textAlign:"center"}}><span className="wocoo-skel" style={{width:140,height:22,borderRadius:6}}/></td></tr>}):sorted.length===0?[<tr key="empty"><td colSpan={8} style={{padding:"48px 16px",textAlign:"center",color:darkMode?"#64748b":"#9ca3af"}}><div style={{fontSize:36,marginBottom:8}}>{searchText?"🔍":"🎉"}</div><div style={{fontSize:14,fontWeight:600,marginBottom:4,color:darkMode?"#cbd5e1":"#374151"}}>{searchText?"No tickets match":(filterStatus==="all"?"No tickets":"All clear!")}</div><div style={{fontSize:12}}>{searchText?"Try a different search term or clear the search.":(filterStatus==="all"?"":"No "+filterStatus+" tickets right now.")}</div></td></tr>]:sorted.map(function(t){
        var slaCls="",slaTitle="";
        if(t.statusGroup!=="Done"&&t.statusGroup!=="Cancelled"&&t.created){
          var ageDays=(Date.now()-new Date(t.created).getTime())/86400000;
          if(!isNaN(ageDays)&&ageDays>=0){
            slaTitle=(Math.floor(ageDays*10)/10)+" days old";
            if(ageDays>3) slaCls="sla-urgent";
            else if(ageDays>=1) slaCls="sla-warn";
          }
        }
        var rowClass="clickable "+(expanded===t.id?"expanded ":"")+slaCls;
        return <React.Fragment key={t.id}>
        <tr onClick={function(){setExpanded(expanded===t.id?null:t.id)}} className={rowClass} title={slaTitle||undefined} style={{borderBottom:"1px solid #e5e7eb",cursor:"pointer",background:expanded===t.id?"#eef2ff":"transparent"}}>
          <td style={{padding:"6px 8px"}}><span style={{display:"inline-flex",alignItems:"center",gap:6}}><a href={"https://wealthsimple.atlassian.net/browse/"+t.id} target="_blank" rel="noreferrer" style={{color:"#4f46e5",textDecoration:"none",fontWeight:500}} onClick={function(e){e.stopPropagation()}}>{t.id}</a><button onClick={function(e){e.stopPropagation();try{navigator.clipboard.writeText(t.id);pushToast("Copied "+t.id,"success")}catch(err){pushToast("Copy failed","error")}}} title={"Copy "+t.id} style={{border:"none",background:"transparent",cursor:"pointer",padding:"2px 4px",borderRadius:4,fontSize:11,color:darkMode?"#64748b":"#9ca3af",lineHeight:1}}>⎘</button></span></td>
          <td style={{padding:"6px 8px",fontSize:11,color:"#6b7280"}}>{t.type}</td>
          <td style={{padding:"6px 8px",fontSize:11,maxWidth:160,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{t.category}</td>
          <td style={{padding:"6px 8px"}}><StatusBadge status={t.status}/></td>
          <td style={{padding:"6px 8px"}}><PriorityBadge priority={t.priority}/></td>
          <td style={{padding:"6px 8px"}}><TriageBadge method={t.triageMethod}/></td>
          <td style={{padding:"6px 8px",fontSize:11,color:"#9ca3af"}}>{t.created}</td>
          <td style={{padding:"6px 4px",textAlign:"center"}} onClick={function(e){e.stopPropagation()}}>
            <div style={{display:"flex",gap:3,alignItems:"center",justifyContent:"center"}}>
              <button onClick={function(){setMoveTarget(t)}} title="Move ticket" style={{padding:"4px 10px",background:"#64748b",color:"#fff",border:"none",borderRadius:6,cursor:"pointer",fontSize:10,fontWeight:700}}>Move</button>
              {isOvp(t.category)?<button onClick={function(){setTriageTarget(t)}} style={{minWidth:84,boxSizing:"border-box",padding:"4px 10px",background:"#4f46e5",color:"#fff",border:"1px solid transparent",borderRadius:6,cursor:"pointer",fontSize:10,fontWeight:700}}>⚡ Triage</button>
              :isEligibility(t)?(quickDoneDone[t.id]?<span style={{minWidth:84,boxSizing:"border-box",padding:"4px 10px",display:"inline-block",textAlign:"center",fontSize:10,color:"#16a34a",fontWeight:700,border:"1px solid transparent"}}>✅</span>:<button onClick={function(){quickMarkDone(t.id)}} disabled={quickDoneLoading===t.id} style={{minWidth:84,boxSizing:"border-box",padding:"4px 10px",background:quickDoneLoading===t.id?"#d1d5db":"#16a34a",color:"#fff",border:"1px solid transparent",borderRadius:6,cursor:quickDoneLoading===t.id?"wait":"pointer",fontSize:10,fontWeight:700}}>{quickDoneLoading===t.id?"…":"✅ Done"}</button>)
              :<button onClick={function(){setExpanded(expanded===t.id?null:t.id)}} style={{minWidth:84,boxSizing:"border-box",padding:"4px 10px",background:"#f3f4f6",color:"#6b7280",border:"1px solid #d1d5db",borderRadius:6,cursor:"pointer",fontSize:10,fontWeight:600}}>📋 Steps</button>}
              <div className="tools-wrap" style={{position:"relative",display:"inline-block"}}>
                <button onClick={function(e){e.stopPropagation();setOpenToolsId(openToolsId===t.id?null:t.id)}} title="More actions" style={{padding:"4px 8px",background:openToolsId===t.id?"#6d28d9":"#7c3aed",color:"#fff",border:"none",borderRadius:6,cursor:"pointer",fontSize:10,fontWeight:700}}>Tools ▾</button>
                {openToolsId===t.id?<div style={{position:"absolute",right:0,top:"calc(100% + 4px)",background:"#fff",border:"1px solid #e5e7eb",borderRadius:8,boxShadow:"0 4px 16px rgba(0,0,0,0.18)",padding:4,minWidth:200,zIndex:1500,textAlign:"left"}}>
                  <button onClick={function(){setOpenToolsId(null);setTriageTarget(t)}} style={{display:"block",width:"100%",textAlign:"left",padding:"8px 12px",background:"none",border:"none",borderRadius:4,cursor:"pointer",fontSize:12,fontWeight:600,color:"#111827"}}>⚡ Overpayment Triage</button>
                  <a href="https://www.visa.ca/en_CA/support/consumer/travel-support/exchange-rate-calculator.html" target="_blank" rel="noreferrer" onClick={function(){setOpenToolsId(null)}} style={{display:"block",width:"100%",padding:"8px 12px",borderRadius:4,fontSize:12,fontWeight:600,color:"#111827",textDecoration:"none"}}>💱 Check FX (Visa)</a>
                  <button onClick={function(){setOpenToolsId(null);setInquiryTarget(t)}} style={{display:"block",width:"100%",textAlign:"left",padding:"8px 12px",background:"none",border:"none",borderRadius:4,cursor:"pointer",fontSize:12,fontWeight:600,color:"#111827"}}>🧾 Inquiry Removal</button>
                  <button onClick={function(){setOpenToolsId(null);setTranscriptTarget(t)}} style={{display:"block",width:"100%",textAlign:"left",padding:"8px 12px",background:"none",border:"none",borderRadius:4,cursor:"pointer",fontSize:12,fontWeight:600,color:"#111827"}}>🎙 Parse Transcript</button>
                </div>:null}
              </div>
            </div>
          </td>
        </tr>
        {expanded===t.id?<tr><td colSpan={8} style={{background:"#f9fafb",padding:12,borderBottom:"1px solid #e5e7eb"}}>
          <div style={{fontSize:12,marginBottom:4}}><strong>{t.summary}</strong></div>
          <div style={{fontSize:11,color:"#6b7280",marginBottom:8,fontStyle:"italic"}}>{t.description}</div>
          {RESOLUTION_STEPS[t.category]?<div style={{background:"#fff",borderRadius:8,padding:12,border:"1px solid #e5e7eb"}}>
            <div style={{fontSize:11,color:"#4f46e5",fontWeight:700}}>📋 {t.category}</div>
            <div style={{fontSize:10,color:"#9ca3af",marginBottom:6}}>{RESOLUTION_STEPS[t.category].source} · {RESOLUTION_STEPS[t.category].sla}</div>
            {RESOLUTION_STEPS[t.category].steps.map(function(s,i){return <div key={i} style={{fontSize:11,color:"#374151",marginBottom:3,lineHeight:1.6}}>{s}</div>})}
            <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
              <GuruLookup category={t.category} summary={t.summary} description={t.description} ticketId={t.id}/>
              {(t.category||"").toLowerCase().indexOf("credit card")!==-1||((t.type||"").toLowerCase().indexOf("credit card")!==-1)?<I2cCard ticket={t}/>:null}
              {(t.category||"").toLowerCase().indexOf("prepaid card")!==-1||((t.type||"").toLowerCase().indexOf("prepaid card")!==-1)?<KohoCard ticket={t}/>:null}
            </div>
          </div>
          :<div style={{fontSize:11,color:"#9ca3af"}}>No steps mapped.<div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}><GuruLookup category={t.category||t.type} summary={t.summary} description={t.description} ticketId={t.id}/></div></div>}
        </td></tr>:null}
      </React.Fragment>})}</tbody></table></div>
    </div>:null}

    {tab==="resolution"?<div style={{display:"flex",flexDirection:"column",gap:12}}>{Object.keys(RESOLUTION_STEPS).sort().map(function(cat){var r=RESOLUTION_STEPS[cat];var n=liveTickets.filter(function(t){return t.category===cat}).length;return <div key={cat} style={{background:"#fff",borderRadius:12,padding:16,border:"1px solid #e5e7eb"}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}><div><h3 style={{margin:0,fontSize:15}}>{cat}</h3><div style={{fontSize:11,color:"#9ca3af",marginTop:2}}>{r.source} · {r.sla}</div></div><span style={{background:"#eef2ff",color:"#4f46e5",padding:"3px 10px",borderRadius:9999,fontSize:11,fontWeight:600}}>{n}</span></div><div style={{borderTop:"1px solid #f3f4f6",paddingTop:10}}>{r.steps.map(function(s,i){return <div key={i} style={{fontSize:12,color:"#374151",marginBottom:5,lineHeight:1.6}}>{s}</div>})}<GuruLookup category={cat} summary="" description="" ticketId=""/></div></div>})}</div>:null}

    {tab==="settings"?<div style={{display:"flex",flexDirection:"column",gap:12,maxWidth:720}}>
      <div style={{background:"#fff",borderRadius:12,padding:16,border:"1px solid #e5e7eb"}}>
        <h3 style={{margin:"0 0 4px",fontSize:15}}>Appearance</h3>
        <p style={{margin:"0 0 14px",fontSize:11,color:"#9ca3af"}}>Per-device preferences. Stored in your browser only — won't sync to other devices or affect other viewers.</p>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:16,padding:"12px 14px",background:"#f9fafb",borderRadius:8,border:"1px solid #e5e7eb",marginBottom:10}}>
          <div>
            <div style={{fontSize:13,fontWeight:600}}>Dark mode</div>
            <div style={{fontSize:11,color:"#6b7280",marginTop:2,lineHeight:1.5}}>Use a dark color scheme across the dashboard.</div>
          </div>
          <button onClick={function(){setDarkMode(!darkMode)}} className={"dn-toggle"+(darkMode?" on":"")} aria-label="Toggle dark mode"><span className="dn-clouds"/><span className="dn-stars"/><span className="dn-knob"/></button>
        </div>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:16,padding:"12px 14px",background:"#f9fafb",borderRadius:8,border:"1px solid #e5e7eb"}}>
          <div>
            <div style={{fontSize:13,fontWeight:600}}>SLA aging colors</div>
            <div style={{fontSize:11,color:"#6b7280",marginTop:2,lineHeight:1.5}}>Tint ticket rows by age — amber for 1–3 days old, red for over 3 days. Done and Cancelled tickets are never tinted.</div>
          </div>
          <button onClick={function(){setSlaColorsEnabled(!slaColorsEnabled)}} className={"ws-toggle"+(slaColorsEnabled?" on":"")} aria-label="Toggle SLA aging colors"><span className="knob"/></button>
        </div>
      </div>
      <div style={{background:"#fff",borderRadius:12,padding:16,border:"1px solid #e5e7eb"}}>
        <h3 style={{margin:"0 0 4px",fontSize:15}}>Keyboard shortcuts</h3>
        <p style={{margin:"0 0 14px",fontSize:11,color:"#9ca3af"}}>Click a shortcut to remap it, then press any key. Press Esc while capturing to cancel.</p>
        {[["focusSearch","Focus search","Move cursor into the search box on the Triage tab"],["reload","Reload tickets","Refetch the current assignee's tickets"],["help","Show keyboard shortcuts help","Open the floating keyboard shortcuts overlay"]].map(function(s){var cur=shortcuts[s[0]];var cap=capturingShortcut===s[0];return <div key={s[0]} style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:16,padding:"12px 14px",background:"#f9fafb",borderRadius:8,border:"1px solid #e5e7eb",marginBottom:8}}><div><div style={{fontSize:13,fontWeight:600}}>{s[1]}</div><div style={{fontSize:11,color:"#6b7280",marginTop:2,lineHeight:1.5}}>{s[2]}</div></div><button onClick={function(){setCapturingShortcut(cap?null:s[0])}} style={{padding:"5px 14px",border:"1px solid "+(cap?"#4f46e5":"#d1d5db"),borderRadius:6,background:cap?"#eef2ff":"#fff",color:cap?"#4f46e5":"#1f2937",cursor:"pointer",fontFamily:"ui-monospace,monospace",fontSize:12,fontWeight:600,minWidth:130,textAlign:"center"}}>{cap?"Press any key…":fmtKey(cur)}</button></div>})}
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:16,padding:"12px 14px",background:"#f9fafb",borderRadius:8,border:"1px solid #e5e7eb",marginBottom:8,opacity:0.7}}><div><div style={{fontSize:13,fontWeight:600}}>Close modal / help</div><div style={{fontSize:11,color:"#6b7280",marginTop:2,lineHeight:1.5}}>Always Esc — not remappable.</div></div><kbd style={{padding:"5px 14px",border:"1px solid #d1d5db",borderRadius:6,background:"#fff",color:"#1f2937",fontFamily:"ui-monospace,monospace",fontSize:12,fontWeight:600,minWidth:130,textAlign:"center",display:"inline-block"}}>Esc</kbd></div>
        <button onClick={function(){setShortcuts(DEFAULT_SHORTCUTS);setCapturingShortcut(null)}} style={{padding:"6px 14px",border:"1px solid "+(darkMode?"#334155":"#d1d5db"),borderRadius:8,background:darkMode?"#1e293b":"#fff",color:darkMode?"#94a3b8":"#6b7280",cursor:"pointer",fontSize:11,fontWeight:600,marginTop:4}}>Reset to defaults</button>
      </div>
      <div style={{background:"#fff",borderRadius:12,padding:16,border:"1px solid #e5e7eb"}}>
        <h3 style={{margin:"0 0 4px",fontSize:15}}>Auto-mark Eligibility Confirmations as Done</h3>
        <p style={{margin:"0 0 14px",fontSize:11,color:"#9ca3af"}}>On a schedule, bulk-transition one assignee's Eligibility Confirmation tickets to Done. Only runs while this tab is open in your browser.</p>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:16,padding:"12px 14px",background:"#f9fafb",borderRadius:8,border:"1px solid #e5e7eb",marginBottom:8}}>
          <div>
            <div style={{fontSize:13,fontWeight:600}}>Target assignee</div>
            <div style={{fontSize:11,color:"#6b7280",marginTop:2,lineHeight:1.5}}>Only this person's Eligibility Confirmation tickets will be marked Done. Independent of the main assignee dropdown at the top of the dashboard.</div>
          </div>
          <select value={autoEligAssignee} onChange={function(e){setAutoEligAssignee(e.target.value)}} style={{padding:"5px 10px",border:"1px solid "+(darkMode?"#475569":"#d1d5db"),borderRadius:6,background:darkMode?"#0f172a":"#fff",color:darkMode?"#e2e8f0":"#1f2937",fontSize:12,fontWeight:600,minWidth:130}}>
            {ASSIGNEES.map(function(a){return <option key={a.value} value={a.value}>{a.name}</option>})}
          </select>
        </div>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:16,padding:"12px 14px",background:"#f9fafb",borderRadius:8,border:"1px solid #e5e7eb",marginBottom:8}}>
          <div>
            <div style={{fontSize:13,fontWeight:600}}>Scheduler enabled</div>
            <div style={{fontSize:11,color:"#6b7280",marginTop:2,lineHeight:1.5}}>{autoEligEnabled?("Will run every "+autoEligIntervalMinutes+" min for "+((ASSIGNEES.find(function(a){return a.value===autoEligAssignee})||{}).name||autoEligAssignee)+" while this tab is open."):"Off. Use Run now for one-shot."}</div>
          </div>
          <button onClick={function(){setAutoEligEnabled(!autoEligEnabled)}} className={"ws-toggle"+(autoEligEnabled?" on":"")} aria-label="Toggle auto-eligibility scheduler"><span className="knob"/></button>
        </div>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:16,padding:"12px 14px",background:"#f9fafb",borderRadius:8,border:"1px solid #e5e7eb",marginBottom:8}}>
          <div>
            <div style={{fontSize:13,fontWeight:600}}>Interval</div>
            <div style={{fontSize:11,color:"#6b7280",marginTop:2,lineHeight:1.5}}>How often the scheduler scans for eligibility tickets to mark Done.</div>
          </div>
          <select value={autoEligIntervalMinutes} onChange={function(e){setAutoEligIntervalMinutes(parseInt(e.target.value,10))}} style={{padding:"5px 10px",border:"1px solid "+(darkMode?"#475569":"#d1d5db"),borderRadius:6,background:darkMode?"#0f172a":"#fff",color:darkMode?"#e2e8f0":"#1f2937",fontSize:12,fontWeight:600,minWidth:130}}>
            {[[15,"Every 15 min"],[30,"Every 30 min"],[60,"Every hour"],[120,"Every 2 hours"],[240,"Every 4 hours"],[480,"Every 8 hours"]].map(function(o){return <option key={o[0]} value={o[0]}>{o[1]}</option>})}
          </select>
        </div>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:16,padding:"12px 14px",background:"#f9fafb",borderRadius:8,border:"1px solid #e5e7eb",marginBottom:8}}>
          <div>
            <div style={{fontSize:13,fontWeight:600}}>Last run</div>
            <div style={{fontSize:11,color:"#6b7280",marginTop:2,lineHeight:1.5}}>{autoEligLastRun?(new Date(autoEligLastRun.ts).toLocaleString()+" — "+autoEligLastRun.succ+"/"+autoEligLastRun.total+" marked"+(autoEligLastRun.fail?(" ("+autoEligLastRun.fail+" failed)"):"")+(autoEligLastRun.assignee?(" · "+autoEligLastRun.assignee):"")):"Never run this session."}</div>
          </div>
          <button onClick={function(){runAutoEligibility()}} disabled={autoEligRunning} style={{padding:"5px 14px",border:"1px solid "+(autoEligRunning?"#d1d5db":"#16a34a"),borderRadius:6,background:autoEligRunning?"#d1d5db":"#16a34a",color:"#fff",cursor:autoEligRunning?"wait":"pointer",fontSize:12,fontWeight:700,minWidth:110}}>{autoEligRunning?"Running…":"▶ Run now"}</button>
        </div>
        <div style={{marginTop:8,padding:"10px 12px",background:"#fef3c7",borderRadius:6,fontSize:11,color:"#78350f",border:"1px solid #fcd34d"}}>
          ⚠️ This auto-transitions every Eligibility Confirmation ticket assigned to the target person using the Done transition (id 251), queried fresh from JIRA each run. The scheduler only fires while this tab is open — close the tab or put your computer to sleep and the schedule pauses.
        </div>
      </div>
      <div style={{background:"#fff",borderRadius:12,padding:16,border:"1px solid #e5e7eb"}}>
        <h3 style={{margin:"0 0 4px",fontSize:15}}>About these settings</h3>
        <div style={{fontSize:12,color:"#6b7280",lineHeight:1.6}}>These preferences live in your browser's local storage. They don't sync across devices, won't affect other users of the dashboard, and will reset if you clear browser data for this site.</div>
      </div>
    </div>:null}


    <div style={{marginTop:20,padding:12,background:"#f9fafb",borderRadius:10,border:"1px solid #e5e7eb",fontSize:10,color:"#9ca3af",textAlign:"center"}}>JIRA WOCOO · Notion Wiki · BCC Triage Guide · Preset · Atlassian MCP · {assigneeName} · {new Date().toLocaleDateString()}</div>
  </div>
}

window._mainParsed = true;
ReactDOM.createRoot(document.getElementById('app')).render(<Dashboard />);
