// Renders a clickable one-time-consent error for any bridge auth_required response.
// Each agent authorizes the Apps Script bridge against JIRA once; after approving they retry the same action.
function authErrorNode(authUrl,retryLabel){return <span>JIRA authorization needed (one-time per agent). <a href={authUrl} target="_blank" rel="noreferrer" style={{fontWeight:700,textDecoration:"underline",color:"inherit"}}>Open the consent page</a>, approve access, then {retryLabel||"retry"}.</span>}

function buildDailySummaryMsg(tickets,assigneeName){var a=tickets.filter(function(t){return!["Done","Cancelled"].includes(getStatusGroup(t.status||""))});var s=a.slice().sort(function(a,b){return(a.created||"").localeCompare(b.created||"")});var today=new Date().toLocaleDateString("en-CA");var tc=a.filter(function(t){return getStatusGroup(t.status||"")==="Triage"}).length;var bc=a.filter(function(t){return getStatusGroup(t.status||"")==="Back Office"}).length;var pc=a.filter(function(t){return getStatusGroup(t.status||"")==="Pending"}).length;var msg="🎟️ *WOCOO Daily Triage Summary — "+today+"*"+(assigneeName?" · "+assigneeName:"")+"\n\n📊 *"+a.length+" active* | 🔴 "+tc+" Triage | 🟡 "+bc+" Back Office | 🔵 "+pc+" Pending\n\n";if(s.length===0)msg+="✅ All clear!\n";else{msg+="*Tickets:*\n";s.forEach(function(t,i){var d=Math.floor((Date.now()-new Date(t.created).getTime())/86400000);msg+=(i+1)+". <https://wealthsimple.atlassian.net/browse/"+t.id+"|"+t.id+"> — "+(t.summary||"").substring(0,50)+"\n    "+t.priority+" · "+getStatusGroup(t.status||"")+" · "+d+"d old\n"})}msg+="\n_Sent from WOCOO Triage Dashboard_";return msg}

// ============ UI BADGES ============
function StatusBadge(p){var g=getStatusGroup(p.status),c=statusColors[g]||"#6b7280";return <span style={{display:"inline-block",padding:"2px 8px",borderRadius:9999,fontSize:11,fontWeight:600,background:c+"18",color:c,border:"1px solid "+c+"33"}}>{g}</span>}
function PriorityBadge(p){var c=priorityColors[p.priority]||"#6b7280";return <span style={{fontSize:11,fontWeight:700,color:c}}>{p.priority}</span>}
function TriageBadge(p){var cs={Escalated:"#d97706",Manual:"#4f46e5","Self-serve":"#16a34a"};var c=cs[p.method]||"#6b7280";return <span style={{display:"inline-block",padding:"1px 7px",borderRadius:4,fontSize:10,fontWeight:600,background:c+"14",color:c,border:"1px solid "+c+"30"}}>{p.method}</span>}
function Bar(p){var pct=p.max>0?(p.value/p.max)*100:0;return <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:5}}><div style={{width:200,fontSize:12,color:"#4b5563",textAlign:"right",flexShrink:0,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{p.label}</div><div style={{flex:1,background:"#f3f4f6",borderRadius:6,height:22,position:"relative"}}><div style={{width:pct+"%",background:p.color||"#6366f1",borderRadius:6,height:"100%",minWidth:p.value>0?2:0,opacity:0.85}}/><span style={{position:"absolute",right:8,top:2,fontSize:11,color:"#1f2937",fontWeight:600}}>{p.value}</span></div></div>}

// ============ GURU LOOKUP (MagicAI model-only — no Guru card grounding) ============
function GuruLookup(props){var cat=props.category||"",sum=props.summary||"",desc=props.description||"",tid=props.ticketId||"";var _l=useState(false),loading=_l[0],setLoading=_l[1];var _r=useState(null),result=_r[0],setResult=_r[1];var _e=useState(null),error=_e[0],setError=_e[1];var _x=useState(false),xpanded=_x[0],setXpanded=_x[1];var _c=useState(false),copied=_c[0],setCopied=_c[1];var _s=useState(""),status=_s[0],setStatus=_s[1];var hdrs={"Content-Type":"application/json"};
  var extractText=function(data){return(data.content||[]).map(function(b){if(b.type==="text")return b.text;if(b.type==="mcp_tool_result"&&b.content)return b.content.map(function(c){return c.text||""}).join("");return""}).join("\n")};
  var GURU_AGENT_ID="8a6cf4be-cde7-4cb5-9ca9-dc5eac498e40";
  var WOCOO_PAGE_ID="10e41167-bd96-8010-83ef-e77f28c60d68"; // JIRA Ticketing (WOCOO Board) — Notion source of truth
  var parseJson=function(data){return(typeof data==="string")?(function(){try{return JSON.parse(data.match(/\{[\s\S]*\}/)[0])}catch(e){return{suggested_response:String(data),internal_notes:"",key_points:[]}}})():data};
  // Unwrap a MagicTools/MCP result (which may be {content:[{text}]}) into a plain object.
  var unwrapMcp=function(d){
    if(d&&typeof d==="object"&&!Array.isArray(d)&&!d.content)return d;
    var txt=(d&&d.content)?extractText(d):(typeof d==="string"?d:"");
    if(!txt)return(d&&typeof d==="object")?d:null;
    try{return JSON.parse(txt)}catch(e){var m=txt.match(/\{[\s\S]*\}/);if(m){try{return JSON.parse(m[0])}catch(e2){}}return null}
  };
  // Reduce a notion-fetch payload to just the readable page body (drop ancestor-path/properties/tags/preamble).
  var cleanNotion=function(txt){
    txt=(txt||"").toString();
    var m=txt.match(/<content>([\s\S]*?)<\/content>/);
    if(m)txt=m[1];
    return txt.replace(/<ancestor-path>[\s\S]*?<\/ancestor-path>/g,"").replace(/<properties>[\s\S]*?<\/properties>/g,"").replace(/Here is the result of[^\n]*/g,"").replace(/<[^>]*>/g," ").replace(/[ \t]+/g," ").replace(/\n{3,}/g,"\n\n").trim();
  };
  var formatGrounded=function(notion,guruCards){
    setStatus("Formatting…");
    var ground=(notion&&notion.text)?"WOCOO BOARD (Notion — authoritative source of truth for this team):\n"+notion.text+"\n\n":"";
    var cardList=(guruCards||[]).map(function(c,i){return(i+1)+". "+(c.title||"")+(c.url?" — "+c.url:"")}).join("\n");
    var sources=[].concat((notion&&notion.sources)||[]);
    return MagicAI.chat({
      system:"You are advising a Wealthsimple Cash & Card Operations associate (INTERNAL, NOT client-facing). The associate actions the ticket and communicates back to the CX reporter, who then communicates with the client. PRIMARY source of truth is the WOCOO BOARD content provided. If WOCOO is silent on something, you may supplement with general Wealthsimple credit/prepaid/cash ops knowledge, but never contradict the WOCOO board. For each Guru card title we provide, generate a SHORT one-line 'why this card' blurb explaining how it helps action this specific ticket — base it ONLY on the card title and the ticket; do NOT invent contents of the card. Respond ONLY with this JSON object (no markdown fences): {\"action_plan\":\"numbered, terse internal action plan for what the associate does to action this ticket — pull data from Atlas/Preset/i2c/KOHO Admin/etc., apply the right adjustment, create REIMB/EOC ticket, post comment, transition, etc. Each numbered step on its own line.\",\"tell_cx\":\"a short internal note the associate gives back to the CX reporter so CX can communicate to the client. Plain text, 1-3 sentences. Not addressed to the client directly.\",\"internal_notes\":\"checks/verifications across systems\",\"key_points\":[\"3-5 short bullets for handoff\"],\"guru_blurbs\":[\"one short why-this-card line per Guru card, in the same order as provided\"]}",
      messages:[{role:"user",content:"TICKET: "+tid+"\nCATEGORY: "+cat+"\nSUMMARY: "+sum+"\nDESCRIPTION: "+desc.substring(0,800)+"\n\n"+ground+(cardList?"GURU CARDS (titles only — surface as reference, do not quote contents):\n"+cardList+"\n\n":"")}],
      json:true,temperature:0.4,max_tokens:1800
    }).then(function(data){
      var p=parseJson(data)||{};
      var ap=(p.action_plan||"").toString().trim();
      var tc=(p.tell_cx||"").toString().trim();
      if(!ap)ap="Couldn't auto-draft a grounded action plan — review the linked source(s) below.";
      var blurbs=p.guru_blurbs||[];
      var guruSourcesWithBlurbs=(guruCards||[]).map(function(c,i){return{title:c.title||"Guru card",url:c.url||"",type:"guru",blurb:(blurbs[i]||"").toString().trim()}});
      sources=sources.concat(guruSourcesWithBlurbs);
      setResult({grounded:(notion&&notion.sources&&notion.sources.length>0)||guruSourcesWithBlurbs.length>0,action_plan:ap,tell_cx:tc,internal_notes:p.internal_notes||"",key_points:p.key_points||[],guru_sources:sources});
    });
  };
  var draftModelOnly=function(){
    setStatus("Drafting (model-only)…");
    return MagicAI.chat({
      system:"You are advising a Wealthsimple Cash & Card Operations associate (INTERNAL, NOT client-facing). The associate actions the ticket and communicates back to the CX reporter, who then communicates with the client. Without any retrieved grounding, draft a best-effort suggestion using general knowledge of Wealthsimple credit card, prepaid card, and cash account operations. Respond ONLY with this JSON object (no markdown fences): {\"action_plan\":\"numbered, terse internal action plan for what the associate does to action this ticket — pull data from Atlas/Preset/i2c/KOHO Admin/etc., apply the right adjustment, create REIMB/EOC ticket, post comment, transition, etc. Each numbered step on its own line.\",\"tell_cx\":\"a short internal note the associate gives back to the CX reporter so CX can communicate to the client. Plain text, 1-3 sentences. Not addressed to the client directly.\",\"internal_notes\":\"checks/verifications across systems\",\"key_points\":[\"3-5 short bullets for handoff\"]}",
      messages:[{role:"user",content:"TICKET: "+tid+"\nCATEGORY: "+cat+"\nSUMMARY: "+sum+"\nDESCRIPTION: "+desc.substring(0,800)}],
      json:true,temperature:0.4,max_tokens:1500
    }).then(function(data){
      var p=parseJson(data)||{};
      setResult({grounded:false,action_plan:(p.action_plan||"").toString().trim(),tell_cx:(p.tell_cx||"").toString().trim(),internal_notes:p.internal_notes||"",key_points:p.key_points||[],guru_sources:[]});
    });
  };
  var pollGuru=function(threadId,turnId,tries){
    return MagicTools.call("guru__guru_get_pending_answer",{chatThreadId:threadId,turnId:turnId}).then(function(d){
      var o=unwrapMcp(d)||{};
      if(o.status==="PENDING"&&tries>0){return new Promise(function(r){setTimeout(r,2000)}).then(function(){return pollGuru(threadId,turnId,tries-1)})}
      return o;
    });
  };
  var getNotionGrounding=function(query){
    if(typeof MagicTools==="undefined")return Promise.resolve({text:"",sources:[]});
    return MagicTools.call("notion__notion-search",{query:query,query_type:"internal",page_url:WOCOO_PAGE_ID,page_size:5,max_highlight_length:200}).then(function(d){
      var o=unwrapMcp(d)||{};
      var results=(o.results||[]).filter(function(r){return r&&r.type==="page"&&r.id&&r.id.replace(/-/g,"")!==WOCOO_PAGE_ID.replace(/-/g,"")});
      var top=results.slice(0,2);
      if(top.length===0)return{text:"",sources:[]};
      setStatus("Reading WOCOO board…");
      return Promise.all(top.map(function(r){
        return MagicTools.call("notion__notion-fetch",{id:r.id}).then(function(fd){
          var fo=unwrapMcp(fd)||{};
          return"## "+(r.title||"WOCOO page")+"\n"+cleanNotion(fo.text).substring(0,1500);
        }).catch(function(){return"## "+(r.title||"WOCOO page")+"\n"+(r.highlight||"")});
      })).then(function(chunks){
        return{text:chunks.join("\n\n"),sources:top.map(function(r){return{title:r.title||"WOCOO page",url:r.url||"",type:"wocoo"}})};
      });
    }).catch(function(){return{text:"",sources:[]}});
  };
  // Guru is now used only to surface relevant card titles + links (no prose grounding).
  var getGuruCards=function(question){
    if(typeof MagicTools==="undefined")return Promise.resolve([]);
    return MagicTools.call("guru__guru_answer_generation",{question:question,agentId:GURU_AGENT_ID}).then(function(d){
      var o=unwrapMcp(d)||{};
      if(o.status==="PENDING"&&o.chatThreadId&&o.turnId)return pollGuru(o.chatThreadId,o.turnId,8);
      return o;
    }).then(function(o){
      return(o&&o.sources)?o.sources.map(function(s){return{title:s.title||s.id||"Guru card",url:s.url||""}}):[];
    }).catch(function(){return[]});
  };
  // Strip noise from the description so search queries stay short and topical.
  var cleanDesc=function(d){
    d=(d||"").toString();
    return d
      .replace(/identity-[A-Za-z0-9_-]+/g,"")
      .replace(/credit-transaction-[A-Za-z0-9_-]+/g,"")
      .replace(/\b\d{6,}[-\d*]*\b/g," ")
      .replace(/\*+/g," ")
      .replace(/[^A-Za-z0-9 ,.$]/g," ")
      .replace(/\s+/g," ")
      .trim();
  };
  var shortHintFromDesc=function(d){
    var c=cleanDesc(d);
    if(!c)return"";
    // first sentence-ish fragment up to ~80 chars
    var firstStop=c.search(/[.,]/);
    var slice=(firstStop>10&&firstStop<160)?c.substring(0,firstStop):c.substring(0,80);
    return slice.trim();
  };
  var handleLookup=function(){
    setLoading(true);setError(null);setResult(null);setXpanded(true);setStatus("Searching WOCOO board + Guru…");
    if(typeof MagicAI==="undefined"){setError("MagicAI not available on this site");setLoading(false);setStatus("");return}
    // Title-led short query — empirically pulls the right WOCOO subpage (e.g. "Conversion Rate/FX transactions"); long compound queries pull generic pages.
    var hint=shortHintFromDesc(desc);
    var sumIsVague=(sum||"").trim().length<22;
    var notionQuery=(sum||"").trim();
    if(sumIsVague&&cat)notionQuery=(notionQuery+" "+cat).trim();
    if(hint&&(notionQuery+" "+hint).length<150)notionQuery=(notionQuery+". "+hint).trim();
    var guruQuery="Which Wealthsimple internal Guru cards should a Cash & Card Operations associate consult to action this ticket? "+notionQuery;
    Promise.all([getNotionGrounding(notionQuery),getGuruCards(guruQuery)]).then(function(arr){
      var notion=arr[0]||{text:"",sources:[]};
      var guruCards=arr[1]||[];
      if(!notion.text&&guruCards.length===0)return draftModelOnly();
      return formatGrounded(notion,guruCards);
    }).catch(function(){return draftModelOnly()}).catch(function(e){setError(e&&e.message?e.message:String(e))}).finally(function(){setLoading(false);setStatus("")});
  };
  // Per-section editing + copy state (mirrors i2c/Koho pattern)
  var _ap=useState(""),actionPlan=_ap[0],setActionPlan=_ap[1];
  var _tc=useState(""),tellCx=_tc[0],setTellCx=_tc[1];
  var _cAp=useState(false),copiedAp=_cAp[0],setCopiedAp=_cAp[1];
  var _cTc=useState(false),copiedTc=_cTc[0],setCopiedTc=_cTc[1];
  useEffect(function(){if(result){setActionPlan(result.action_plan||"");setTellCx(result.tell_cx||"")}},[result]);
  var copyTo=function(text,setFlag){if(navigator.clipboard)navigator.clipboard.writeText(text).then(function(){setFlag(true);setTimeout(function(){setFlag(false)},1500)})};
  var ta={width:"100%",boxSizing:"border-box",fontFamily:"inherit",fontSize:12,padding:10,resize:"vertical",border:"1px solid #e5e7eb",borderRadius:6,lineHeight:1.6,background:"#fff"};
  var copyBtn=function(active){return{padding:"3px 10px",background:active?"#16a34a":"#7c3aed",color:"#fff",border:"none",borderRadius:6,cursor:"pointer",fontSize:10,fontWeight:600}};
  var sectionHdr={display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6};
  return <div style={{marginTop:8}}><div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}><button onClick={handleLookup} disabled={loading} style={{padding:"6px 14px",background:loading?"#d1d5db":"#7c3aed",color:"#fff",border:"none",borderRadius:8,cursor:loading?"wait":"pointer",fontWeight:600,fontSize:12}}>{loading?"🔍 "+(status||"Loading..."):"🔍 Ask Guru"}</button>{result?<button onClick={function(){setXpanded(!xpanded)}} style={{background:"none",border:"none",cursor:"pointer",fontSize:11,color:"#7c3aed",fontWeight:600}}>{xpanded?"▼ Hide":"▶ Show"}</button>:null}</div>{error?<div style={{marginTop:6,fontSize:11,color:"#dc2626"}}>⚠️ {error}</div>:null}{result&&xpanded?<div style={{background:"#f0f4ff",borderRadius:8,padding:12,border:"1px solid #c7d2fe",marginTop:8}}>
    <div style={{marginBottom:12}}>
      <div style={sectionHdr}><div style={{fontSize:12,fontWeight:700,color:"#7c3aed"}}>🛠 Action Plan (for the associate)</div><button onClick={function(){copyTo(actionPlan,setCopiedAp)}} style={copyBtn(copiedAp)}>{copiedAp?"✓ Copied":"📋 Copy"}</button></div>
      <textarea value={actionPlan} onChange={function(e){setActionPlan(e.target.value)}} rows={10} style={ta}/>
    </div>
    {tellCx||result.tell_cx?<div style={{marginBottom:12}}>
      <div style={sectionHdr}><div style={{fontSize:12,fontWeight:700,color:"#4f46e5"}}>💬 What to Tell CX</div><button onClick={function(){copyTo(tellCx,setCopiedTc)}} style={copyBtn(copiedTc)}>{copiedTc?"✓ Copied":"📋 Copy"}</button></div>
      <textarea value={tellCx} onChange={function(e){setTellCx(e.target.value)}} rows={4} style={ta}/>
    </div>:null}
    {result.internal_notes?<div style={{marginBottom:12}}><div style={{fontSize:12,fontWeight:700,color:"#d97706",marginBottom:4}}>📝 Internal Notes</div><div style={{background:"#fffbeb",borderRadius:6,padding:10,border:"1px solid #fde68a",fontSize:11,lineHeight:1.6,color:"#78350f",whiteSpace:"pre-wrap"}}>{result.internal_notes}</div></div>:null}
    {result.key_points&&result.key_points.length>0?<div style={{marginBottom:12}}><div style={{fontSize:12,fontWeight:700,color:"#4f46e5",marginBottom:4}}>📌 Key Points</div><div style={{background:"#fff",borderRadius:6,padding:10,border:"1px solid #e5e7eb"}}>{result.key_points.map(function(kp,i){return <div key={i} style={{fontSize:11,color:"#374151",marginBottom:4}}>• {kp}</div>})}</div></div>:null}
    {result.guru_sources&&result.guru_sources.length>0?<div style={{marginTop:4,paddingTop:8,borderTop:"1px solid #c7d2fe"}}>
      <div style={{fontSize:10,fontWeight:700,marginBottom:3,color:result.grounded?"#16a34a":"#d97706"}}>{result.grounded?(function(){var n=result.guru_sources.filter(function(s){return s.type==="wocoo"}).length;var g=result.guru_sources.filter(function(s){return s.type==="guru"}).length;var parts=[];if(n)parts.push(n+" WOCOO page"+(n>1?"s":""));if(g)parts.push(g+" Guru card"+(g>1?"s":""));return "✓ Grounded in "+(parts.join(" + ")||(result.guru_sources.length+" source(s)"))})():"⚠ Model-only (not grounded)"}</div>
      {result.guru_sources.map(function(s,i){var icon=s.type==="wocoo"?"📘":(s.type==="guru"?"📚":"");return <div key={i} style={{fontSize:10,color:"#7c3aed",marginBottom:3}}>{s.url?<a href={s.url} target="_blank" rel="noreferrer" style={{color:"#7c3aed",textDecoration:"underline",fontWeight:600}}>{icon} {s.title}</a>:<span style={{fontWeight:600}}>{icon} {s.title||s.id}</span>}{s.blurb?<div style={{fontSize:10,color:"#374151",marginLeft:14,marginTop:1,fontStyle:"italic"}}>{s.blurb}</div>:null}</div>})}
    </div>:null}
  </div>:null}</div>
}

// ============ i2c SERVICE DESK CARD (copy-paste only) ============
function I2cCard(props){
  var t=props.ticket;
  var draft=getI2cDraft(t);
  var _s=useState(draft.summary),summary=_s[0],setSummary=_s[1];
  var _d=useState(draft.description),desc=_d[0],setDesc=_d[1];
  var _cs=useState(false),copiedS=_cs[0],setCopiedS=_cs[1];
  var _cd=useState(false),copiedD=_cd[0],setCopiedD=_cd[1];
  var copy=function(text,setFlag){if(navigator.clipboard)navigator.clipboard.writeText(text).then(function(){setFlag(true);setTimeout(function(){setFlag(false)},1500)})};
  var ta={width:"100%",boxSizing:"border-box",fontFamily:"inherit",fontSize:12,padding:8,resize:"vertical",border:"1px solid #e5e7eb",borderRadius:6};
  var copyBtn={fontSize:10,padding:"3px 10px",background:"#fff",color:"#6b7280",border:"1px solid #d1d5db",borderRadius:6,cursor:"pointer",fontWeight:600};
  var lbl={display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4};
  var lblText={fontSize:11,color:"#6b7280",fontWeight:600};
  return <div style={{width:"100%",marginTop:10,background:"#fff",borderRadius:8,padding:12,border:"1px solid #e5e7eb"}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
      <div style={{fontSize:12,fontWeight:700,color:"#dc2626"}}>🎫 i2c Service Desk</div>
      <a href="https://tracking.i2cinc.com/servicedesk/customer/portal/2/create/17" target="_blank" rel="noreferrer" style={{display:"inline-block",padding:"6px 14px",background:"#dc2626",color:"#fff",borderRadius:8,textDecoration:"none",fontWeight:600,fontSize:11}}>Open i2c Form</a>
    </div>
    <div style={{marginBottom:10}}>
      <div style={lbl}><label style={lblText}>Suggested Summary</label><button onClick={function(){copy(summary,setCopiedS)}} style={copyBtn}>{copiedS?"Copied":"Copy"}</button></div>
      <textarea value={summary} onChange={function(e){setSummary(e.target.value)}} rows={2} style={ta}/>
    </div>
    <div>
      <div style={lbl}><label style={lblText}>Suggested Description</label><button onClick={function(){copy(desc,setCopiedD)}} style={copyBtn}>{copiedD?"Copied":"Copy"}</button></div>
      <textarea value={desc} onChange={function(e){setDesc(e.target.value)}} rows={8} style={Object.assign({},ta,{lineHeight:1.5})}/>
    </div>
  </div>;
}

// ============ KOHO EMAIL CARD (one-click send via Apps Script bridge) ============
function KohoCard(props){
  var t=props.ticket;
  var draft=getKohoDraft(t);
  var _s=useState(draft.subject),subject=_s[0],setSubject=_s[1];
  var _b=useState(draft.body),body=_b[0],setBody=_b[1];
  var _st=useState("idle"),st=_st[0],setSt=_st[1]; // idle|confirming|sending|sent|error
  var _res=useState(null),res=_res[0],setRes=_res[1];
  var _err=useState(null),err=_err[0],setErr=_err[1];
  var _cs=useState(false),copiedS=_cs[0],setCopiedS=_cs[1];
  var _cb=useState(false),copiedB=_cb[0],setCopiedB=_cb[1];
  var copy=function(text,setFlag){if(navigator.clipboard)navigator.clipboard.writeText(text).then(function(){setFlag(true);setTimeout(function(){setFlag(false)},1500)})};
  var send=function(){
    setSt("sending");setErr(null);
    sendKohoEmailViaBridge(t.id,subject,body).then(function(data){setRes(data);setSt("sent")}).catch(function(e){setErr(e&&e.message?e.message:String(e));setSt("error")});
  };
  if(st==="sent"){
    var sentTime="";try{sentTime=res&&res.sentAt?new Date(res.sentAt).toLocaleString():""}catch(e){sentTime=(res&&res.sentAt)||"—"}
    return <div style={{width:"100%",marginTop:10,background:"#f0fdf4",borderRadius:8,padding:14,border:"1px solid #bbf7d0"}}>
      <div style={{fontSize:13,fontWeight:700,color:"#16a34a",marginBottom:6}}>✓ Email sent to Koho</div>
      <div style={{fontSize:11,color:"#166534",lineHeight:1.6}}>To: <strong>{(res&&res.recipient)||KOHO_RECIPIENT}</strong><br/>From: <strong>{(res&&res.from)||"—"}</strong><br/>At: <strong>{sentTime||"—"}</strong></div>
      <div style={{fontSize:11,color:"#166534",marginTop:8,fontStyle:"italic"}}>A copy is in the Gmail Sent folder.</div>
    </div>;
  }
  var locked=st==="confirming"||st==="sending";
  var ta={width:"100%",boxSizing:"border-box",fontFamily:"inherit",fontSize:12,padding:8,resize:"vertical",border:"1px solid #e5e7eb",borderRadius:6,opacity:locked?0.6:1};
  var copyBtn={fontSize:10,padding:"3px 10px",background:"#fff",color:"#6b7280",border:"1px solid #d1d5db",borderRadius:6,cursor:"pointer",fontWeight:600};
  var lbl={display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4};
  var lblText={fontSize:11,color:"#6b7280",fontWeight:600};
  return <div style={{width:"100%",marginTop:10,background:"#fff",borderRadius:8,padding:12,border:"1px solid #e5e7eb"}}>
    <div style={{marginBottom:10}}>
      <div style={{fontSize:12,fontWeight:700,color:"#7c3aed"}}>✉️ Koho Email (Prepaid Card)</div>
      <div style={{fontSize:10,color:"#9ca3af",marginTop:2}}>To: {KOHO_RECIPIENT} · Sends via the Apps Script bridge</div>
    </div>
    <div style={{marginBottom:10}}>
      <div style={lbl}><label style={lblText}>Email Subject</label><button onClick={function(){copy(subject,setCopiedS)}} style={copyBtn}>{copiedS?"Copied":"Copy"}</button></div>
      <textarea value={subject} onChange={function(e){setSubject(e.target.value)}} rows={2} disabled={locked} style={ta}/>
    </div>
    <div style={{marginBottom:10}}>
      <div style={lbl}><label style={lblText}>Email Body</label><button onClick={function(){copy(body,setCopiedB)}} style={copyBtn}>{copiedB?"Copied":"Copy"}</button></div>
      <textarea value={body} onChange={function(e){setBody(e.target.value)}} rows={8} disabled={locked} style={Object.assign({},ta,{lineHeight:1.5})}/>
    </div>
    {st==="error"?<div style={{background:"#fef2f2",border:"1px solid #fecaca",borderRadius:6,padding:8,marginBottom:10,fontSize:11,color:"#991b1b"}}>Send failed: {err||"unknown error"}</div>:null}
    {st==="confirming"?
      <div style={{background:"#fffbeb",borderRadius:6,padding:10,border:"1px solid #fde68a"}}>
        <div style={{fontSize:12,fontWeight:600,color:"#92400e",marginBottom:8}}>Send this email to {KOHO_RECIPIENT}?</div>
        <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
          <button onClick={send} style={{padding:"6px 14px",background:"#16a34a",color:"#fff",border:"none",borderRadius:8,cursor:"pointer",fontWeight:600,fontSize:12}}>✓ Confirm Send</button>
          <button onClick={function(){setSt("idle")}} style={{padding:"6px 14px",background:"#fff",color:"#6b7280",border:"1px solid #d1d5db",borderRadius:8,cursor:"pointer",fontWeight:600,fontSize:12}}>Back to Edit</button>
        </div>
      </div>
    :st==="sending"?
      <button disabled style={{padding:"6px 14px",background:"#d1d5db",color:"#fff",border:"none",borderRadius:8,fontWeight:600,fontSize:12,cursor:"wait"}}>Sending…</button>
    :
      <button onClick={function(){setSt("confirming");setErr(null)}} style={{padding:"6px 14px",background:"#4f46e5",color:"#fff",border:"none",borderRadius:8,cursor:"pointer",fontWeight:600,fontSize:12}}>Review &amp; Send Email</button>
    }
  </div>;
}

// ============ TRANSCRIPT PARSER MODAL (Zendesk call re-diarization) ============
function TranscriptParserModal(props){
  var ticket=props.ticket,onClose=props.onClose;
  var _txt=useState(""),txt=_txt[0],setTxt=_txt[1];
  var _st=useState("idle"),st=_st[0],setSt=_st[1]; // idle|parsing|done|error
  var _res=useState(null),res=_res[0],setRes=_res[1];
  var _err=useState(null),err=_err[0],setErr=_err[1];
  var _cSum=useState(false),copiedSum=_cSum[0],setCopiedSum=_cSum[1];
  var _cKey=useState(false),copiedKey=_cKey[0],setCopiedKey=_cKey[1];
  var _cTr=useState(false),copiedTr=_cTr[0],setCopiedTr=_cTr[1];

  var canParse=txt.trim().length>0&&st!=="parsing";
  var tooLong=txt.length>12000;

  var copyTo=function(text,setFlag){if(navigator.clipboard)navigator.clipboard.writeText(text).then(function(){setFlag(true);setTimeout(function(){setFlag(false)},1500)})};
  var turnsToPlainText=function(turns){return(turns||[]).map(function(t){return(t.speaker||"?")+": "+(t.text||"")}).join("\n\n")};
  var keyFactsToPlainText=function(kf){return(kf||[]).map(function(k){return"• "+k}).join("\n")};

  var parse=function(){
    setSt("parsing");setErr(null);setRes(null);
    if(typeof MagicAI==="undefined"){setErr("MagicAI not available on this site");setSt("error");return}
    MagicAI.chat({
      system:"You are given a Zendesk call transcript that incorrectly labels everything as one speaker (e.g. #SPEAKER_01). Re-diarize it by inferring turn boundaries from conversational cues (questions vs answers, names addressed, who introduces themselves as the agent, who describes the issue as the client). The Agent is a Wealthsimple Cash & Card Operations support agent; the Client is the customer.\n\nRules:\n- Preserve the wording VERBATIM — do not paraphrase, summarize, translate, or drop content from the body of the call.\n- If a speaker continues across multiple sentences, keep them as one turn.\n- If the source ambiguously merges two speakers mid-sentence (e.g. \"...about it? Yes.\"), split cleanly between the question and the answer.\n- Output JSON only, no markdown fences.\n\nRespond ONLY with this JSON object: {\"summary\":\"3-5 sentence summary of what the call was about and where it ended up\",\"key_facts\":[\"short bullets: client name, card type, merchant, error codes, decisions, action items\"],\"turns\":[{\"speaker\":\"Agent\",\"text\":\"...\"},{\"speaker\":\"Client\",\"text\":\"...\"}]}",
      messages:[{role:"user",content:"TICKET: "+(ticket&&ticket.id||"")+"\nTICKET SUMMARY: "+(ticket&&ticket.summary||"")+"\n\nTRANSCRIPT:\n"+txt}],
      json:true,temperature:0.1,max_tokens:8000
    }).then(function(data){
      var p=(typeof data==="string")?(function(){try{return JSON.parse(data.match(/\{[\s\S]*\}/)[0])}catch(e){return null}})():data;
      if(!p||!Array.isArray(p.turns)||p.turns.length===0){setErr("Couldn't parse the transcript. The model didn't return valid turn data. Try shortening the transcript or splitting it into chunks.");setSt("error");return}
      setRes({summary:(p.summary||"").toString(),key_facts:Array.isArray(p.key_facts)?p.key_facts:[],turns:p.turns});
      setSt("done");
    }).catch(function(e){setErr(e&&e.message?e.message:String(e));setSt("error")});
  };

  var overlay={position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000,padding:20};
  var card={background:"#fff",borderRadius:12,maxWidth:780,width:"100%",maxHeight:"90vh",overflowY:"auto",border:"2px solid #4f46e5",color:"#1f2937"};
  var sec={padding:"14px 20px",borderBottom:"1px solid #f3f4f6"};
  var copyBtn=function(active){return{padding:"3px 10px",background:active?"#16a34a":"#7c3aed",color:"#fff",border:"none",borderRadius:6,cursor:"pointer",fontSize:10,fontWeight:600}};
  var ta={width:"100%",boxSizing:"border-box",fontFamily:"inherit",fontSize:12,padding:10,resize:"vertical",border:"1px solid #d1d5db",borderRadius:6,lineHeight:1.5};
  var sectionHdr={display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6};

  return <div style={overlay} onClick={function(e){if(e.target===e.currentTarget)onClose()}}>
    <div style={card} onClick={function(e){e.stopPropagation()}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"14px 20px",borderBottom:"1px solid #e5e7eb"}}>
        <h2 style={{margin:0,fontSize:16}}>🎙 Parse Transcript: <span style={{color:"#4f46e5"}}>{ticket&&ticket.id}</span></h2>
        <button onClick={onClose} style={{background:"none",border:"none",fontSize:20,cursor:"pointer",color:"#9ca3af"}}>×</button>
      </div>
      {err?<div style={{margin:"10px 20px",background:"#fef2f2",border:"1px solid #fecaca",borderRadius:8,padding:8,fontSize:12,color:"#991b1b"}}>{err}</div>:null}

      <div style={sec}>
        <div style={{fontSize:11,color:"#6b7280",marginBottom:4}}>Paste the Zendesk transcript here (e.g. the text under <code>#SPEAKER_01:</code>). It will be re-diarized into Agent / Client turns.</div>
        <textarea value={txt} onChange={function(e){setTxt(e.target.value)}} rows={8} placeholder="#SPEAKER_01: Hello? Hello, am I speaking to..." style={ta} disabled={st==="parsing"}/>
        {tooLong?<div style={{fontSize:11,color:"#92400e",marginTop:6}}>⚠ Long transcript ({txt.length.toLocaleString()} chars). May take longer or get truncated. If it fails, try parsing in two halves.</div>:null}
        <div style={{marginTop:10,display:"flex",gap:8,flexWrap:"wrap"}}>
          <button onClick={parse} disabled={!canParse} style={{padding:"8px 16px",background:canParse?"#4f46e5":"#d1d5db",color:"#fff",border:"none",borderRadius:8,cursor:canParse?"pointer":"not-allowed",fontWeight:600,fontSize:13}}>{st==="parsing"?"Parsing transcript…":(res?"Re-Parse":"Parse Transcript")}</button>
          <button onClick={function(){setTxt("");setRes(null);setErr(null);setSt("idle")}} disabled={st==="parsing"} style={{padding:"8px 16px",background:"#fff",color:"#6b7280",border:"1px solid #d1d5db",borderRadius:8,cursor:"pointer",fontWeight:600,fontSize:13}}>Clear</button>
        </div>
      </div>

      {res?<React.Fragment>
        <div style={sec}>
          <div style={sectionHdr}><div style={{fontSize:12,fontWeight:700,color:"#7c3aed"}}>📞 Call Summary</div><button onClick={function(){copyTo(res.summary,setCopiedSum)}} style={copyBtn(copiedSum)}>{copiedSum?"✓ Copied":"📋 Copy"}</button></div>
          <div style={{background:"#f9fafb",border:"1px solid #e5e7eb",borderRadius:6,padding:10,fontSize:12,lineHeight:1.6,whiteSpace:"pre-wrap"}}>{res.summary||<em style={{color:"#9ca3af"}}>(none)</em>}</div>
        </div>

        {res.key_facts&&res.key_facts.length>0?<div style={sec}>
          <div style={sectionHdr}><div style={{fontSize:12,fontWeight:700,color:"#d97706"}}>🔑 Key Facts</div><button onClick={function(){copyTo(keyFactsToPlainText(res.key_facts),setCopiedKey)}} style={copyBtn(copiedKey)}>{copiedKey?"✓ Copied":"📋 Copy"}</button></div>
          <div style={{background:"#fffbeb",border:"1px solid #fde68a",borderRadius:6,padding:10}}>
            {res.key_facts.map(function(k,i){return <div key={i} style={{fontSize:11,color:"#78350f",marginBottom:4,lineHeight:1.5}}>• {k}</div>})}
          </div>
        </div>:null}

        <div style={sec}>
          <div style={sectionHdr}><div style={{fontSize:12,fontWeight:700,color:"#4f46e5"}}>🗣 Diarized Transcript</div><button onClick={function(){copyTo(turnsToPlainText(res.turns),setCopiedTr)}} style={copyBtn(copiedTr)}>{copiedTr?"✓ Copied":"📋 Copy"}</button></div>
          <div style={{background:"#fff",border:"1px solid #e5e7eb",borderRadius:6,padding:10,maxHeight:420,overflowY:"auto"}}>
            {res.turns.map(function(t,i){var isAgent=(t.speaker||"").toLowerCase()==="agent";var color=isAgent?"#4f46e5":"#d97706";var bg=isAgent?"#eef2ff":"#fffbeb";var border=isAgent?"#c7d2fe":"#fde68a";return <div key={i} style={{marginBottom:8,padding:8,background:bg,border:"1px solid "+border,borderRadius:6}}><div style={{fontSize:10,fontWeight:700,color:color,marginBottom:3,textTransform:"uppercase",letterSpacing:0.5}}>{isAgent?"Agent":"Client"}</div><div style={{fontSize:12,color:"#1f2937",lineHeight:1.6,whiteSpace:"pre-wrap"}}>{t.text}</div></div>})}
          </div>
        </div>
      </React.Fragment>:null}

      <div style={{padding:"14px 20px",display:"flex",justifyContent:"flex-end"}}>
        <button onClick={onClose} style={{padding:"8px 16px",background:"#fff",color:"#6b7280",border:"1px solid #d1d5db",borderRadius:8,cursor:"pointer",fontWeight:600,fontSize:13}}>Close</button>
      </div>
    </div>
  </div>;
}

// ============ INQUIRY REMOVAL MODAL (TransUnion credit-inquiry removal letter) ============
function InquiryRemovalModal(props){
  var onClose=props.onClose;
  var _f=useState({firstName:"",lastName:"",address:"",city:"",postalCode:"",dob:"",phone:"",dateOfInquiry:"",associate:props.associate||""}),f=_f[0],setF=_f[1];
  var _st=useState("form"),st=_st[0],setSt=_st[1]; // form|generating|generated|confirming|sending|sent|error
  var _doc=useState(null),doc=_doc[0],setDoc=_doc[1];
  var _res=useState(null),res=_res[0],setRes=_res[1];
  var _err=useState(null),err=_err[0],setErr=_err[1];
  var set=function(k,v){setF(function(p){var n=Object.assign({},p);n[k]=v;return n})};
  var clientName=((f.firstName||"")+" "+(f.lastName||"")).trim();
  var canGenerate=f.firstName.trim()&&f.lastName.trim()&&f.associate.trim();
  var generate=function(){
    setSt("generating");setErr(null);
    createInquiryDocViaBridge(f).then(function(d){
      if(!d.docId){setErr("Bridge returned no document id.");setSt("error");return}
      var url=d.docUrl||("https://docs.google.com/document/d/"+d.docId+"/edit");
      setDoc({docId:d.docId,docUrl:url});setSt("generated");
      try{window.open(url,"_blank","noopener")}catch(e){}
    }).catch(function(e){setErr(e&&e.message?e.message:String(e));setSt("error")});
  };
  var sendEmail=function(){
    setSt("sending");setErr(null);
    emailInquiryDocViaBridge(doc.docId,f.associate,clientName).then(function(d){setRes(d);setSt("sent")}).catch(function(e){setErr(e&&e.message?e.message:String(e));setSt("error")});
  };
  var overlay={position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000,padding:20};
  var card={background:"#fff",borderRadius:12,maxWidth:640,width:"100%",maxHeight:"90vh",overflowY:"auto",border:"2px solid #4f46e5",color:"#1f2937"};
  var sec={padding:"14px 20px",borderBottom:"1px solid #f3f4f6"};
  var lblText={display:"block",fontSize:11,color:"#6b7280",fontWeight:600,marginBottom:3};
  var inp={width:"100%",boxSizing:"border-box",padding:"6px 10px",border:"1px solid #d1d5db",borderRadius:6,fontSize:12};
  var fieldsDef=[["firstName","First Name"],["lastName","Last Name"],["address","Address"],["city","City"],["postalCode","Postal Code"],["dob","Date of Birth"],["phone","Phone Number"],["dateOfInquiry","Date of Inquiry"],["associate","Associate"]];
  var locked=st==="generating"||st==="sending"||st==="confirming";
  return <div style={overlay} onClick={function(e){if(e.target===e.currentTarget)onClose()}}>
    <div style={card} onClick={function(e){e.stopPropagation()}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"14px 20px",borderBottom:"1px solid #e5e7eb"}}>
        <h2 style={{margin:0,fontSize:16}}>🧾 Inquiry Removal Request</h2>
        <button onClick={onClose} style={{background:"none",border:"none",fontSize:20,cursor:"pointer",color:"#9ca3af"}}>×</button>
      </div>
      {err?<div style={{margin:"10px 20px",background:"#fef2f2",border:"1px solid #fecaca",borderRadius:8,padding:8,fontSize:12,color:"#991b1b"}}>{err}</div>:null}

      <div style={sec}>
        <strong style={{display:"block",marginBottom:8,fontSize:13}}>Letter Fields</strong>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
          {fieldsDef.map(function(fd){var k=fd[0],label=fd[1];var full=(k==="address");return <div key={k} style={full?{gridColumn:"1 / -1"}:null}>
            <label style={lblText}>{label}</label>
            <input type="text" value={f[k]} disabled={locked||st==="sent"} onChange={function(e){set(k,e.target.value)}} placeholder={label} style={inp}/>
          </div>})}
        </div>
      </div>

      {st!=="sent"?<div style={sec}>
        {!doc?
          <button onClick={generate} disabled={!canGenerate||locked} style={{padding:"8px 16px",background:(!canGenerate||locked)?"#d1d5db":"#4f46e5",color:"#fff",border:"none",borderRadius:8,cursor:(!canGenerate||locked)?"not-allowed":"pointer",fontWeight:600,fontSize:13}}>{st==="generating"?"Generating…":"Generate Document"}</button>
        :
          <div style={{fontSize:12,color:"#166534"}}>✓ Document created — <a href={doc.docUrl} target="_blank" rel="noreferrer" style={{color:"#4f46e5",fontWeight:600}}>open the doc</a> to review/edit before emailing.</div>
        }
        {!canGenerate&&!doc?<div style={{fontSize:11,color:"#9ca3af",marginTop:6}}>First name, last name, and associate are required.</div>:null}
      </div>:null}

      {doc&&st!=="sent"?<div style={sec}>
        <strong style={{display:"block",marginBottom:6,fontSize:13}}>Email to TransUnion</strong>
        <div style={{fontSize:11,color:"#6b7280",lineHeight:1.6,marginBottom:8}}>To: <strong>{TRANSUNION_EMAIL}</strong> · Subject: <strong>Inquiry Removal Request</strong> · Attaches the doc as PDF · Sends as you.</div>
        {st==="confirming"?
          <div style={{background:"#fffbeb",borderRadius:6,padding:10,border:"1px solid #fde68a"}}>
            <div style={{fontSize:12,fontWeight:600,color:"#92400e",marginBottom:8}}>Send the PDF to {TRANSUNION_EMAIL}?</div>
            <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
              <button onClick={sendEmail} style={{padding:"6px 14px",background:"#16a34a",color:"#fff",border:"none",borderRadius:8,cursor:"pointer",fontWeight:600,fontSize:12}}>✓ Confirm Send</button>
              <button onClick={function(){setSt("generated")}} style={{padding:"6px 14px",background:"#fff",color:"#6b7280",border:"1px solid #d1d5db",borderRadius:8,cursor:"pointer",fontWeight:600,fontSize:12}}>Back</button>
            </div>
          </div>
        :st==="sending"?
          <button disabled style={{padding:"8px 16px",background:"#d1d5db",color:"#fff",border:"none",borderRadius:8,fontWeight:600,fontSize:13,cursor:"wait"}}>Sending…</button>
        :
          <button onClick={function(){setSt("confirming");setErr(null)}} style={{padding:"8px 16px",background:"#7c3aed",color:"#fff",border:"none",borderRadius:8,cursor:"pointer",fontWeight:600,fontSize:13}}>📧 Email to TransUnion</button>
        }
      </div>:null}

      {st==="sent"?<div style={{padding:20,background:"#f0fdf4",borderTop:"1px solid #bbf7d0",textAlign:"center"}}>
        <div style={{fontSize:16,fontWeight:700,color:"#16a34a"}}>✓ Sent to TransUnion</div>
        <div style={{fontSize:12,color:"#166534",marginTop:6}}>To: {TRANSUNION_EMAIL}{res&&res.from?" · From: "+res.from:""}</div>
        <div style={{marginTop:10}}><a href={doc?doc.docUrl:"#"} target="_blank" rel="noreferrer" style={{color:"#4f46e5",fontWeight:600,fontSize:12}}>Open the doc</a></div>
        <button onClick={onClose} style={{marginTop:12,padding:"8px 16px",background:"#4f46e5",color:"#fff",border:"none",borderRadius:8,cursor:"pointer",fontWeight:600,fontSize:13}}>Close</button>
      </div>:null}

      {st!=="sent"?<div style={{padding:"14px 20px",display:"flex",justifyContent:"flex-end"}}>
        <button onClick={onClose} style={{padding:"8px 16px",background:"#fff",color:"#6b7280",border:"1px solid #d1d5db",borderRadius:8,cursor:"pointer",fontWeight:600,fontSize:13}}>Cancel</button>
      </div>:null}
    </div>
  </div>;
}

// ============ EOC TRIAGE WORKFLOW (Atlassian → MCPLocker) ============
function EOCTriageWorkflow(props){var ticket=props.ticket,onClose=props.onClose;var _st=useState(0),step=_st[0],setStep=_st[1];var _ld=useState(false),loading=_ld[0],setLoading=_ld[1];var _er=useState(null),error=_er[0],setError=_er[1];var _iid=useState(null),identityId=_iid[0],setIdentityId=_iid[1];var _ds=useState(ticket.description||""),desc=_ds[0],setDesc=_ds[1];var _cs=useState("17688"),clientStatus=_cs[0],setClientStatus=_cs[1];var _ai=useState(""),accountId=_ai[0],setAccountId=_ai[1];var _md=useState(false),moveDone=_md[0],setMoveDone=_md[1];var sec={background:"#f9fafb",borderRadius:8,padding:12,border:"1px solid #e5e7eb",marginBottom:10};var btn={padding:"8px 16px",background:"#4f46e5",color:"#fff",border:"none",borderRadius:8,cursor:"pointer",fontWeight:600,fontSize:12};var btnOff=Object.assign({},btn,{background:"#d1d5db",cursor:"not-allowed"});var btnGo=Object.assign({},btn,{background:"#16a34a"});var chk=<span style={{color:"#16a34a",fontWeight:700}}>✓</span>;
  var fetchTicket=useCallback(function(){
    setLoading(true);setError(null);
    var localIid=extractIdentityId(ticket.description);
    setIdentityId(localIid);
    setDesc(ticket.description||"");
    setStep(1);
    setLoading(false);
  },[ticket]);
  var statusLabel=EOC_CLIENT_STATUS.find(function(s){return s.id===clientStatus});var jiraUrl="https://wealthsimple.atlassian.net/browse/"+ticket.id;
  return <div style={{background:"#fff",border:"2px solid #d97706",borderRadius:12,padding:16,margin:"8px 0",maxWidth:720}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}><h3 style={{margin:0,fontSize:15}}>🔄 Move to EOC: {ticket.id}</h3><button onClick={onClose} style={{background:"none",border:"none",fontSize:18,cursor:"pointer",color:"#9ca3af"}}>✕</button></div>{error?<div style={{background:"#fef2f2",border:"1px solid #fecaca",borderRadius:6,padding:8,marginBottom:8,fontSize:12,color:"#991b1b"}}>⚠️ {error}</div>:null}<div style={sec}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}><strong style={{fontSize:13}}>Step 1: Pull Ticket Details</strong>{step>=1?chk:<button onClick={fetchTicket} disabled={loading} style={loading?btnOff:btn}>{loading?"Fetching…":"Fetch Ticket"}</button>}</div>{step>=1?<div style={{marginTop:8,fontSize:12,background:"#fff",padding:8,borderRadius:6,border:"1px solid #e5e7eb"}}><div>Identity ID: <strong style={{color:"#4f46e5"}}>{identityId||"Not found"}</strong></div><div style={{marginTop:4,fontSize:11,color:"#6b7280",fontStyle:"italic"}}>{(desc||"").substring(0,200)}</div><GuruLookup category="CC Application Reset/Close" summary={ticket.summary} description={desc} ticketId={ticket.id}/></div>:null}</div>{step>=1&&!moveDone?<div style={sec}><strong style={{fontSize:13}}>Step 2: Move Ticket to EOC in JIRA</strong><div style={{marginTop:6,fontSize:12,color:"#6b7280"}}>Use JIRA's built-in Move to preserve Zendesk chats.</div><div style={{marginTop:8,background:"#fff",borderRadius:6,padding:10,border:"1px solid #e5e7eb"}}><div style={{fontSize:12,fontWeight:600,marginBottom:8}}>Fields:</div><div style={{marginBottom:6}}><div style={{fontSize:11,color:"#6b7280"}}>Issue Type: <strong>Task</strong></div></div><div style={{marginBottom:6}}><div style={{fontSize:11,color:"#6b7280"}}>Status: <strong>Untriaged</strong></div></div><div style={{marginBottom:6}}><div style={{fontSize:11,color:"#6b7280"}}>Client Status:</div><div style={{display:"flex",gap:6,marginTop:2}}>{EOC_CLIENT_STATUS.map(function(tier){var isA=clientStatus===tier.id;return <button key={tier.id} onClick={function(){setClientStatus(tier.id)}} style={{padding:"4px 12px",borderRadius:6,fontSize:11,fontWeight:600,cursor:"pointer",background:isA?"#d97706":"#fff",color:isA?"#fff":"#d97706",border:"1px solid #fde68a"}}>{tier.label}</button>})}</div></div><div style={{marginBottom:6}}><div style={{fontSize:11,color:"#6b7280"}}>Account ID:</div><input type="text" value={accountId} onChange={function(e){setAccountId(e.target.value.toUpperCase())}} placeholder="e.g. WK5TPMJ32CAD" style={{padding:"6px 10px",border:"1px solid #d1d5db",borderRadius:6,fontSize:12,width:"100%",boxSizing:"border-box",fontFamily:"monospace"}}/></div><div style={{fontSize:11,color:"#6b7280"}}>Problem Area: <strong>Payment Card - Issuance & Lifecycle</strong></div><div style={{marginTop:4,fontSize:11,color:"#6b7280"}}>Identity: <strong style={{fontFamily:"monospace",userSelect:"all"}}>{identityId||"—"}</strong></div></div><div style={{marginTop:10,display:"flex",gap:8,flexWrap:"wrap"}}><a href={jiraUrl} target="_blank" rel="noreferrer" style={{display:"inline-block",padding:"8px 16px",background:"#d97706",color:"#fff",borderRadius:8,textDecoration:"none",fontWeight:600,fontSize:12}}>🔗 Open in JIRA</a><button onClick={function(){setMoveDone(true)}} style={btnGo}>✓ Move Complete</button></div></div>:null}{moveDone?<div style={{background:"#f0fdf4",borderRadius:8,padding:12,border:"1px solid #bbf7d0",textAlign:"center"}}><div style={{fontSize:16,fontWeight:700,color:"#16a34a"}}>✅ Moved to EOC</div><div style={{fontSize:12,color:"#166534",marginTop:4}}>{ticket.id} → EOC · {statusLabel?statusLabel.label:"—"}</div></div>:null}</div>
}

// ============ FRAUD ROUTING (overpayments above the threshold) ============
// Overpayments over this amount are escalated to Fraud Operation instead of
// being reimbursed. FRAUD is an MCP "limited" project (create/link are blocked
// for MCP tools), so the create + link both run through the Apps Script bridge.
var FRAUD_AMOUNT_THRESHOLD = 10000;
var FRAUD_PROJECT_KEY = "FRAUD";
var FRAUD_ISSUE_TYPE_ID = "10002"; // Task
// customfield_10414 "Fraud Detection Method" is required on FRAUD Task/Other.
// Set this to the exact option label Fraud Ops uses; the bridge resolves the
// label to an option ID via createmeta at create time.
var FRAUD_DETECTION_METHOD_LABEL = "Credit Card";
var FRAUD_LINK_TYPE = "relates to"; // FRAUD {link} WOCOO
var FRAUD_BACK_OFFICE_TRANSITION_ID = "121"; // WOCOO "Request reviewed" -> Back Office

// Pull any linked FRAUD-nnnn keys off a fetched WOCOO ticket payload. FRAUD is an
// MCP "limited" project so we never read the FRAUD issue itself — only the link
// stubs the WOCOO payload carries. MCPLocker normalises issuelinks inconsistently
// across tool versions, so try the known shapes and fall back to a regex sweep of
// the links blob only (NOT the whole ticket — the description can mention a FRAUD
// key without one being linked).
function extractLinkedFraudKeys(d,f){
  var blob=(f&&(f.issuelinks||f.issue_links))||(d&&(d.issuelinks||d.issue_links||d.links))||null;
  if(!blob)return [];
  var keys={};
  var push=function(k){if(k&&/^FRAUD-\d+$/i.test(String(k).trim()))keys[String(k).trim().toUpperCase()]=1;};
  if(Array.isArray(blob)){
    for(var i=0;i<blob.length;i++){
      var L=blob[i]||{};
      var cands=[L.inwardIssue,L.inward_issue,L.outwardIssue,L.outward_issue,L.issue,L.linked_issue,L.linkedIssue];
      for(var j=0;j<cands.length;j++){if(cands[j])push(cands[j].key||cands[j].id||cands[j]);}
      push(L.key);
    }
  }
  if(!Object.keys(keys).length){
    var txt="";try{txt=JSON.stringify(blob);}catch(e){txt=String(blob);}
    var m=txt.match(/FRAUD-\d+/gi)||[];
    for(var n=0;n<m.length;n++)push(m[n]);
  }
  return Object.keys(keys);
}

// ============ MAIN OVERPAYMENT TRIAGE WORKFLOW (Atlassian → MCPLocker) ============
function TriageWorkflow(props){var ticket=props.ticket,onClose=props.onClose;
  var _smr=useState(false),showManualReimbInput=_smr[0],setShowManualReimbInput=_smr[1];var _mrk=useState(""),manualReimbKey=_mrk[0],setManualReimbKey=_mrk[1];var _fti=useState(null),fraudTicketId=_fti[0],setFraudTicketId=_fti[1];var _smf=useState(false),showManualFraudInput=_smf[0],setShowManualFraudInput=_smf[1];var _mfk=useState(""),manualFraudKey=_mfk[0],setManualFraudKey=_mfk[1];var _dm=useState(FRAUD_DETECTION_METHOD_LABEL),detectionMethod=_dm[0],setDetectionMethod=_dm[1];var _lfk=useState([]),linkedFraudKeys=_lfk[0],setLinkedFraudKeys=_lfk[1];var _fby=useState(false),fraudBypass=_fby[0],setFraudBypass=_fby[1];var _sfb=useState(false),showFraudBypassInput=_sfb[0],setShowFraudBypassInput=_sfb[1];var _bfk=useState(""),bypassFraudKey=_bfk[0],setBypassFraudKey=_bfk[1];
  var _st=useState(0),step=_st[0],setStep=_st[1];var _ld=useState(false),loading=_ld[0],setLoading=_ld[1];var _er=useState(null),error=_er[0],setError=_er[1];var _fd=useState(ticket.description||""),fetchedDesc=_fd[0],setFetchedDesc=_fd[1];var _iid=useState(extractIdentityId(ticket.description)),identityId=_iid[0],setIdentityId=_iid[1];var _am=useState(extractAmount(ticket.description)),amount=_am[0],setAmount=_am[1];var _ai=useState(""),accountId=_ai[0],setAccountId=_ai[1];var _ri=useState(null),reimTicketId=_ri[0],setReimTicketId=_ri[1];var _cp=useState(false),commentPosted=_cp[0],setCommentPosted=_cp[1];var _bv=useState(false),balanceVerified=_bv[0],setBalanceVerified=_bv[1];var _tm=useState(false),ticketMoved=_tm[0],setTicketMoved=_tm[1];var _sa=useState(false),showAmountAdjust=_sa[0],setShowAmountAdjust=_sa[1];var _aa=useState(null),adjustedAmount=_aa[0],setAdjustedAmount=_aa[1];var _ad=useState(false),adminDebitDone=_ad[0],setAdminDebitDone=_ad[1];var _mi=useState(""),manualIdentityId=_mi[0],setManualIdentityId=_mi[1];var _ma=useState(""),manualAmount=_ma[0],setManualAmount=_ma[1];var _so=useState(false),showAmountOverride=_so[0],setShowAmountOverride=_so[1];var _ut=useState(null),userTier=_ut[0],setUserTier=_ut[1];var _ui=useState(null),userTierId=_ui[0],setUserTierId=_ui[1];var _se=useState(false),showTierEdit=_se[0],setShowTierEdit=_se[1];var _ct=useState(""),commentText=_ct[0],setCommentText=_ct[1];var _ec=useState(false),editingComment=_ec[0],setEditingComment=_ec[1];var _dt=useState(""),declineText=_dt[0],setDeclineText=_dt[1];var _dp=useState(false),declinePosted=_dp[0],setDeclinePosted=_dp[1];var _rp=useState(""),reporter=_rp[0],setReporter=_rp[1];var _mapp=useState(null),manualApprover=_mapp[0],setManualApprover=_mapp[1];var _sae=useState(false),showApproverEdit=_sae[0],setShowApproverEdit=_sae[1];var _sae2=useState(false),showApproverEdit2=_sae2[0],setShowApproverEdit2=_sae2[1];var _ce=useState(""),clientEmail=_ce[0],setClientEmail=_ce[1];var _ec=useState(false),emailCopied=_ec[0],setEmailCopied=_ec[1];
  var isCCOvpType=(ticket.type||"").toLowerCase().indexOf("credit card: overpayment")!==-1;var approver=manualApprover||(amount&&amount>=5000?APPROVERS.amanda:APPROVERS.luke);var meetsMinimum=amount&&amount>=1000;var overFraudThreshold=!!(amount&&amount>FRAUD_AMOUNT_THRESHOLD);
  // A FRAUD ticket was already raised on a PRIOR pass (auto-detected link, or manual
  // bypass) => the >$10k gate is satisfied, so run the normal REIMB path. Deliberately
  // ignores fraudTicketId: a FRAUD ticket created in THIS session must still finish the
  // escalation path (comment -> Back Office), not fall through to a reimbursement.
  var priorFraudKey=(linkedFraudKeys[0]||(fraudBypass&&bypassFraudKey.trim().toUpperCase())||null);
  var fraudAlreadyExists=!!(linkedFraudKeys.length||fraudBypass);
  var isFraudPath=overFraudThreshold&&!fraudAlreadyExists;var fraudSummary="Suspected fraud — credit card overpayment of "+fmtAmt(amount)+" ("+ticket.id+")";var accountIdValid=ACCOUNT_ID_RE.test(accountId);var presetUrl="https://8a26d867.wealthsimple-aws-mpc.app.preset.io/superset/dashboard/5790/?native_filters_key=oC5oWi8scg3klJL4tQV7iek7_rpp1Y0F0BiDXhwAh3H1WzLbrFAA7MAw91A60PJn";
  var sec={background:"#f9fafb",borderRadius:8,padding:12,border:"1px solid #e5e7eb",marginBottom:10};var btn={padding:"8px 16px",background:"#4f46e5",color:"#fff",border:"none",borderRadius:8,cursor:"pointer",fontWeight:600,fontSize:12};var btnOff=Object.assign({},btn,{background:"#d1d5db",cursor:"not-allowed"});var btnGo=Object.assign({},btn,{background:"#16a34a"});var chk=<span style={{color:"#16a34a",fontWeight:700}}>✓</span>;

  var fetchTicket=useCallback(function(){
    setLoading(true);setError(null);
    var fieldsSpec="summary,description,issuetype,status,priority,labels,created,reporter,issuelinks,customfield_11458,customfield_11416,customfield_24151,customfield_10082,customfield_24357";
    MagicTools.call("jira_get_ticket",{ticket_id:ticket.id,fields:fieldsSpec}).then(function(raw){
      var d=raw;
      if(d&&d.content&&Array.isArray(d.content)){
        var txt="";for(var i=0;i<d.content.length;i++){if(d.content[i]&&d.content[i].text)txt+=d.content[i].text;}
        if(txt){try{d=JSON.parse(txt);}catch(e){var jm=txt.match(/\{[\s\S]*\}|\[[\s\S]*\]/);if(jm){try{d=JSON.parse(jm[0]);}catch(e2){}}}}
      }
      var f=(d&&(d.fields||d))||{};
      var cf=(d&&d.custom_fields)||{};
      var descStr=f.description||d.description||ticket.description||"";
      if(descStr&&typeof descStr==="object")descStr="";
      descStr=String(descStr).replace(/\s+/g," ").trim();
      var fIid=cf.customfield_11458||f.customfield_11458||d.customfield_11458||null;
      if(!fIid)fIid=extractIdentityId(descStr);
      var tierField=cf.customfield_11416||f.customfield_11416||d.customfield_11416;
      var fTier=null,fTierId=null;
      if(tierField){if(typeof tierField==="object"){fTier=tierField.value||null;fTierId=tierField.id||null;}else{fTier=tierField;}}
      var reimAmt=(typeof cf.customfield_24151==="number")?cf.customfield_24151:((typeof f.customfield_24151==="number")?f.customfield_24151:((typeof d.customfield_24151==="number")?d.customfield_24151:null));
      var fAmt=reimAmt||extractAmount(descStr);
      var fAcct=cf.customfield_10082||f.customfield_10082||d.customfield_10082||null;
      if(fAcct){fAcct=String(fAcct).trim().toUpperCase();if(/^(W Account|H Account|TBD|N\/A)/i.test(fAcct)||fAcct.length<4)fAcct=null;}
      var rep=f.reporter||d.reporter||null;
      var repName=rep?(rep.displayName||rep.display_name||""):"";
      setLinkedFraudKeys(extractLinkedFraudKeys(d,f));
      setIdentityId(fIid);
      if(fAmt)setAmount(fAmt);
      if(fTier)setUserTier(fTier);
      if(fTierId)setUserTierId(fTierId);
      if(fAcct)setAccountId(fAcct);
      if(repName)setReporter(repName);
      var fEmail=cf.customfield_24357||f.customfield_24357||d.customfield_24357||"";
      if(fEmail&&typeof fEmail==="string")setClientEmail(fEmail);
      setFetchedDesc(descStr);
      setDeclineText("Hi {{REPORTER_MENTION}}, unfortunately because this overpayment transfer request is under $1,000 I am unable to action. We typically only action overpayments above $1,000. You can let the customer know that \"While we are unable to process refunds to your cash account, please note that this balance will be applied to future purchases on the card.\"");
      setStep(1);
    }).catch(function(e){
      // Fallback: use cached ticket data
      setIdentityId(extractIdentityId(ticket.description));
      var localAmt=extractAmount(ticket.description);
      if(localAmt)setAmount(localAmt);
      setFetchedDesc(ticket.description||"");
      setError("Could not fetch live ticket details ("+e.message+"). Using cached data.");
      setStep(1);
    }).finally(function(){setLoading(false)});
  },[ticket]);

  var createReimTicket=useCallback(function(){
    if(!accountIdValid){setError("Account ID must start with C/H/W/N + 7+ chars.");return;}
    if(!BRIDGE_URL){setError("Bridge URL not configured.");return;}
    setLoading(true);setError(null);
    var d="Hi team, can we please reimburse this client ("+identityId+") for "+fmtAmt(amount)+"? Reference: https://wealthsimple.atlassian.net/browse/"+ticket.id;
    var params={action:"createReimb",wocooTicketId:ticket.id,identityId:identityId,amount:String(amount),accountId:accountId,approverAccountId:approver.accountId,approverName:approver.name,userTier:userTier||"Premium",description:d};
    var qs=Object.keys(params).map(function(k){return encodeURIComponent(k)+"="+encodeURIComponent(params[k]);}).join("&");
    var iframe=document.createElement("iframe");
    iframe.style.display="none";
    iframe.src=BRIDGE_URL+"?"+qs;
    var done=false,timeoutId=null;
    var cleanup=function(){if(done)return;done=true;window.removeEventListener("message",onMsg);if(iframe.parentNode)iframe.parentNode.removeChild(iframe);if(timeoutId){clearTimeout(timeoutId);timeoutId=null;}};
    var onMsg=function(ev){
      if(!ev.data||ev.data.action!=="reimbCreated")return;
      cleanup();
      setLoading(false);
      if(ev.data.error==="auth_required"){setError(authErrorNode(ev.data.authUrl,"click “Create REIMB Ticket” again"));return;}
      if(ev.data.error){setError("REIMB create failed: "+ev.data.error);return;}
      var key=ev.data.reimbKey;
      if(!key){setError("Bridge succeeded but no REIMB key returned.");return;}
      setReimTicketId(key);
      setCommentText("Hi {{REPORTER_MENTION}}, a reimbursement ticket has been created https://wealthsimple.atlassian.net/browse/"+key+"  You can mention to the client to expect to see the overpayment amount of "+fmtAmt(amount)+" back in their chequing account within the next 2-3 business days.");
      setStep(5);
    };
    window.addEventListener("message",onMsg);
    document.body.appendChild(iframe);
    timeoutId=setTimeout(function(){cleanup();setLoading(false);var bridgeUrl=BRIDGE_URL+"?"+qs;setShowManualReimbInput(true);setError(<span>REIMB create timed out — bridge sent no response. <a href={bridgeUrl} target="_blank" rel="noreferrer" style={{color:"#991b1b",fontWeight:700,textDecoration:"underline"}}>Open bridge in new tab</a> to see the actual result, then paste the REIMB key below. If the Apps Script code was just changed, redeploy first: Deploy → Manage deployments → Edit → New version → Deploy.</span>);},30000);
  },[ticket,identityId,amount,accountId,approver,accountIdValid,userTier,reporter]);

  var finishFraud=useCallback(function(key){
    setFraudTicketId(key);
    setCommentText("Hi {{REPORTER_MENTION}}, a fraud ticket has been created as the overpayment is above $10k, will proceed with the request once fraud approves https://wealthsimple.atlassian.net/browse/"+key);
    setShowManualFraudInput(false);
    setError(null);
    setStep(6);
  },[amount]);

  var createFraudTicket=useCallback(function(){
    if(!detectionMethod||!detectionMethod.trim()){setError("Fraud Detection Method is required — set the option label before creating.");return;}
    if(!identityId){setError("Identity ID is required for a FRAUD ticket.");return;}
    if(!BRIDGE_URL){setError("Bridge URL not configured.");return;}
    setLoading(true);setError(null);
    var d="Hi team, have a large overpayment transfer request I would like some investigation into to see if there's any suspicious activity, client made a payment of "+fmtAmt(amount)+".\n\nIdentity: "+identityId+"\nAmount: "+fmtAmt(amount)+"\nCash account: "+(accountId||"not provided")+"\nUser tier: "+(userTier||"Premium")+"\nSource ticket: https://wealthsimple.atlassian.net/browse/"+ticket.id;
    var params={action:"createFraud",wocooTicketId:ticket.id,projectKey:FRAUD_PROJECT_KEY,issueTypeId:FRAUD_ISSUE_TYPE_ID,identityId:identityId,amount:String(amount),accountId:accountId||"",userTier:userTier||"Premium",detectionMethod:detectionMethod.trim(),linkType:FRAUD_LINK_TYPE,summary:fraudSummary,description:d};
    callBridgeViaIframe("createFraud",params,"fraudCreated").then(function(data){
      var key=data&&data.fraudKey;
      if(!key){setError("Bridge succeeded but no FRAUD key returned.");setShowManualFraudInput(true);return;}
      if(data.linkError)setError("FRAUD "+key+" created, but the link to "+ticket.id+" failed: "+data.linkError+" — link it by hand in JIRA.");
      finishFraud(key);
    }).catch(function(e){
      var qs=Object.keys(params).map(function(k){return encodeURIComponent(k)+"="+encodeURIComponent(params[k]);}).join("&");
      var bridgeUrl=BRIDGE_URL+"?"+qs;
      setShowManualFraudInput(true);
      if(e&&e.authUrl){setError(authErrorNode(e.authUrl,"click “Create FRAUD Ticket” again"));return;}
      setError(<span>FRAUD create failed: {e.message}. <a href={bridgeUrl} target="_blank" rel="noreferrer" style={{color:"#991b1b",fontWeight:700,textDecoration:"underline"}}>Open bridge in new tab</a> to see the actual result, then paste the FRAUD key below. If the Apps Script code was just changed, redeploy first: Deploy → Manage deployments → Edit → New version → Deploy.</span>);
    }).finally(function(){setLoading(false)});
  },[ticket,identityId,amount,accountId,userTier,detectionMethod,fraudSummary,finishFraud]);

  var postComment=useCallback(function(){setLoading(true);setError(null);postCommentViaBridge(ticket.id,commentText).then(function(){setCommentPosted(true);setStep(8)}).catch(function(e){setError(e&&e.authUrl?authErrorNode(e.authUrl,"click “Post” again"):"Comment failed: "+e.message)}).finally(function(){setLoading(false)})},[ticket,commentText,isFraudPath]);

  var postDeclineComment=useCallback(function(){setLoading(true);setError(null);postCommentViaBridge(ticket.id,declineText).then(function(){setDeclinePosted(true)}).catch(function(e){setError(e&&e.authUrl?authErrorNode(e.authUrl,"click “Decline & Comment” again"):"Decline failed: "+e.message)}).finally(function(){setLoading(false)})},[ticket,declineText]);

  var moveTicketDone=useCallback(function(){setLoading(true);setError(null);callBridgeViaIframe("transitionTicket",{ticketId:ticket.id,transitionId:"251"},"transitionDone").then(function(){setTicketMoved(true);setStep(9)}).catch(function(e){setError("Transition failed: "+e.message)}).finally(function(){setLoading(false)})},[ticket]);

  var moveTicketBackOffice=useCallback(function(){setLoading(true);setError(null);callBridgeViaIframe("transitionTicket",{ticketId:ticket.id,transitionId:FRAUD_BACK_OFFICE_TRANSITION_ID},"transitionDone").then(function(){setTicketMoved(true);setStep(9)}).catch(function(e){setError("Transition to Back Office failed: "+e.message)}).finally(function(){setLoading(false)})},[ticket]);

  return <div style={{background:"#fff",border:"2px solid #4f46e5",borderRadius:12,padding:16,margin:"8px 0",maxWidth:720}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}><h3 style={{margin:0,fontSize:15}}>🔧 Auto-Triage: <a href={"https://wealthsimple.atlassian.net/browse/"+ticket.id} target="_blank" rel="noreferrer" style={{color:"#4f46e5",textDecoration:"none"}}>{ticket.id}</a></h3><button onClick={onClose} style={{background:"none",border:"none",fontSize:18,cursor:"pointer",color:"#9ca3af"}}>✕</button></div>
    {error?<div style={{background:"#fef2f2",border:"1px solid #fecaca",borderRadius:6,padding:8,marginBottom:8,fontSize:12,color:"#991b1b"}}>⚠️ {error} <button onClick={function(){setError(null)}} style={{marginLeft:8,background:"none",border:"none",color:"#991b1b",cursor:"pointer",textDecoration:"underline",fontSize:11}}>dismiss</button></div>:null}
    <div style={sec}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}><strong style={{fontSize:13}}>Step 1: Pull Ticket from JIRA</strong>{step>=1?chk:<button onClick={fetchTicket} disabled={loading} style={loading?btnOff:btn}>{loading?"Fetching…":"Fetch Ticket"}</button>}</div>{step>=1?<div style={{marginTop:8,fontSize:12,background:"#fff",padding:8,borderRadius:6,border:"1px solid #e5e7eb"}}><div>Identity ID: {identityId?<strong style={{color:"#4f46e5"}}>{identityId}</strong>:<span style={{color:"#d97706"}}>Not found</span>}</div>{!identityId?<div style={{marginTop:4}}><input type="text" value={manualIdentityId} onChange={function(e){setManualIdentityId(e.target.value)}} placeholder="Enter Identity ID" style={{padding:"4px 8px",border:"1px solid #d1d5db",borderRadius:6,fontSize:11,width:260,fontFamily:"monospace"}}/><button onClick={function(){if(manualIdentityId.trim())setIdentityId(manualIdentityId.trim())}} disabled={!manualIdentityId.trim()} style={Object.assign({},btn,{fontSize:11,padding:"4px 10px",marginLeft:6})}>Set</button></div>:null}<div style={{marginTop:4}}>Amount: <strong style={{color:"#dc2626"}}>{amount&&!isNaN(amount)?fmtAmt(amount):"Not found"}</strong>{isCCOvpType&&amount?<span style={{fontSize:10,color:"#4f46e5",marginLeft:6}}>(JIRA field)</span>:null}{!showAmountOverride?<button onClick={function(){setShowAmountOverride(true)}} style={{marginLeft:8,background:"none",border:"none",color:"#d97706",cursor:"pointer",fontSize:11,fontWeight:600,textDecoration:"underline"}}>✏️ Override</button>:null}</div>{showAmountOverride?<div style={{marginTop:4,padding:8,background:"#fffbeb",borderRadius:6,border:"1px solid #fde68a"}}><div style={{display:"flex",gap:6,alignItems:"center"}}><span>$</span><input type="number" step="0.01" value={manualAmount} onChange={function(e){setManualAmount(e.target.value)}} placeholder="1000.00" style={{padding:"4px 8px",border:"1px solid #fde68a",borderRadius:6,fontSize:12,width:120,fontFamily:"monospace"}}/><button onClick={function(){if(manualAmount&&parseFloat(manualAmount)>0){setAmount(parseFloat(manualAmount));setShowAmountOverride(false)}}} style={Object.assign({},btn,{background:"#d97706",fontSize:11,padding:"4px 10px"})}>Set</button></div></div>:null}<div style={{marginTop:4,fontSize:11,color:"#6b7280",fontStyle:"italic"}}>{(fetchedDesc||"").substring(0,200)}</div></div>:null}</div>
    {step>=1?<div style={sec}><strong style={{fontSize:13}}>Step 2: Acceptance Criteria</strong><div style={{marginTop:6,fontSize:12}}><div style={{marginBottom:4}}>{meetsMinimum?"✓":"⚠"} Amount ≥ $1,000: <strong>{fmtAmt(amount)}</strong>{!meetsMinimum&&amount?<span style={{color:"#d97706",marginLeft:4}}>(exception required)</span>:null}</div><div style={{marginBottom:4}}>✓ Tier: <strong>{userTier||"Unknown"}</strong></div><div>ℹ Approver: <strong>{approver.name}</strong> ({amount&&amount>=5000?"≥$5K":"<$5K"}) {!showApproverEdit2?<button onClick={function(){setShowApproverEdit2(true)}} style={{marginLeft:8,background:"none",border:"none",color:"#d97706",cursor:"pointer",fontSize:11,fontWeight:600,textDecoration:"underline"}}>✏️ Override</button>:null}</div>{showApproverEdit2?<div style={{marginTop:4,padding:8,background:"#fffbeb",borderRadius:6,border:"1px solid #fde68a"}}><div style={{display:"flex",gap:6}}>{[APPROVERS.luke,APPROVERS.amanda].map(function(a){return <button key={a.accountId} onClick={function(){setManualApprover(a);setShowApproverEdit2(false)}} style={{padding:"4px 12px",borderRadius:6,fontSize:11,fontWeight:600,cursor:"pointer",background:approver.accountId===a.accountId?"#d97706":"#fff",color:approver.accountId===a.accountId?"#fff":"#d97706",border:"1px solid #fde68a"}}>{a.name}</button>})}</div></div>:null}</div>{!meetsMinimum&&amount&&step===1&&!declinePosted?<div style={{marginTop:10,background:"#fffbeb",borderRadius:8,padding:12,border:"1px solid #fde68a"}}><div style={{fontSize:12,fontWeight:600,color:"#92400e",marginBottom:6}}>📝 Decline Comment:</div><textarea value={declineText} onChange={function(e){setDeclineText(e.target.value)}} rows={5} style={{width:"100%",boxSizing:"border-box",padding:10,border:"1px solid #fde68a",borderRadius:6,fontSize:12,lineHeight:1.6,resize:"vertical",background:"#fff"}}/></div>:null}{declinePosted?<div style={{marginTop:8,fontSize:12,color:"#16a34a",fontWeight:600}}>✓ Decline comment posted</div>:null}{step===1?<div style={{display:"flex",gap:8,marginTop:8,flexWrap:"wrap"}}>{!meetsMinimum&&amount&&!declinePosted?<button onClick={postDeclineComment} disabled={loading} style={loading?btnOff:{padding:"8px 16px",background:"#dc2626",color:"#fff",border:"none",borderRadius:8,cursor:"pointer",fontWeight:600,fontSize:12}}>{loading?"Posting…":"✉️ Decline & Comment"}</button>:null}<button onClick={function(){setStep(2)}} style={Object.assign({},btn,{background:meetsMinimum?"#4f46e5":"#d97706"})}>{meetsMinimum?"Criteria Met → Continue":"Proceed as Exception → Continue"}</button></div>:null}</div>:null}
    {step>=2?<div style={sec}><strong style={{fontSize:13}}>Step 3: Verify Balance in MCP/Preset</strong><div style={{marginTop:8,display:"flex",gap:8,flexWrap:"wrap"}}><a href={presetUrl} target="_blank" rel="noreferrer" style={{display:"inline-block",padding:"8px 14px",background:"#eef2ff",color:"#4f46e5",borderRadius:8,textDecoration:"none",fontWeight:600,fontSize:12,border:"1px solid #c7d2fe"}}>📊 Open Preset</a><a href={"https://atlas.wealthsimple.com/identity/"+(identityId||"")+"/overview/?ticketId="+ticket.id} target="_blank" rel="noreferrer" style={{display:"inline-block",padding:"8px 14px",background:"#f0fdf4",color:"#16a34a",borderRadius:8,textDecoration:"none",fontWeight:600,fontSize:12,border:"1px solid #bbf7d0"}}>🔍 Open Atlas</a><a href="https://wealthsimplecs.mycardplace.com/customerservice/wealthsimplelogin.jsp" target="_blank" rel="noreferrer" style={{display:"inline-block",padding:"8px 14px",background:"#fffbeb",color:"#d97706",borderRadius:8,textDecoration:"none",fontWeight:600,fontSize:12,border:"1px solid #fde68a"}}>💳 Open MCP</a></div>{identityId?<div style={{marginTop:6,fontSize:11,color:"#6b7280"}}>Filter by: <code style={{background:"#f3f4f6",padding:"2px 6px",borderRadius:4,fontFamily:"monospace",userSelect:"all"}}>{identityId}</code></div>:null}{!balanceVerified?<div style={{marginTop:8}}><div style={{display:"flex",gap:8,flexWrap:"wrap"}}><button onClick={function(){setBalanceVerified(true);setStep(3)}} style={btn}>✓ Verified</button><button onClick={function(){setShowAmountAdjust(true)}} style={Object.assign({},btn,{background:"#d97706"})}>✏️ Balance Differs</button></div>{showAmountAdjust?<div style={{marginTop:8,padding:10,background:"#fff",borderRadius:6,border:"1px solid #fde68a"}}><div style={{display:"flex",gap:8,alignItems:"center"}}><span>-$</span><input type="number" step="0.01" value={adjustedAmount===null?"":adjustedAmount} onChange={function(e){setAdjustedAmount(e.target.value===""?null:parseFloat(e.target.value))}} style={{padding:"6px 10px",border:"1px solid #fde68a",borderRadius:6,fontSize:12,width:140,fontFamily:"monospace"}}/><button onClick={function(){if(adjustedAmount>0){setAmount(adjustedAmount);setBalanceVerified(true);setShowAmountAdjust(false);setStep(3)}}} style={Object.assign({},btn,{background:"#d97706"})}>Use this amount</button></div></div>:null}</div>:null}{balanceVerified?<div style={{marginTop:4,fontSize:12,color:"#16a34a"}}>✓ Balance verified</div>:null}</div>:null}
    {step>=3&&isFraudPath?<div style={Object.assign({},sec,{borderColor:"#fecaca",background:"#fef2f2"})}><strong style={{fontSize:13,color:"#991b1b"}}>Step 4: Create FRAUD Ticket</strong><div style={{marginTop:4,fontSize:11,color:"#991b1b",fontWeight:600}}>Amount is over {fmtAmt(FRAUD_AMOUNT_THRESHOLD)} — routing to Fraud Operation instead of REIMB. No reimbursement, no admin debit.</div><div style={{marginTop:6,fontSize:12,background:"#fff",padding:10,borderRadius:6,border:"1px solid #e5e7eb"}}><div>Summary: <strong>{fraudSummary}</strong></div><div>Project: <strong>{FRAUD_PROJECT_KEY}</strong> · Issue type: <strong>Task</strong></div><div>Identity: <strong>{identityId||"—"}</strong> · Amount: <strong style={{color:"#dc2626"}}>{fmtAmt(amount)}</strong> · Tier: <strong>{userTier||"Premium"}</strong></div><div>Link: <strong>FRAUD {FRAUD_LINK_TYPE} {ticket.id}</strong></div><div style={{marginTop:6}}><label style={{fontSize:11,color:"#6b7280"}}>Fraud Detection Method * (customfield_10414 option label)</label><div style={{display:"flex",gap:6,alignItems:"center",marginTop:2}}><input type="text" value={detectionMethod} onChange={function(e){setDetectionMethod(e.target.value)}} placeholder="exact option label from Fraud Ops" style={{flex:1,padding:"6px 10px",border:"1px solid "+(detectionMethod.trim()?"#bbf7d0":"#fecaca"),borderRadius:6,fontSize:12,boxSizing:"border-box"}}/>{detectionMethod.trim()?<span style={{color:"#16a34a",fontSize:12,fontWeight:700}}>✓</span>:<span style={{color:"#dc2626",fontSize:10}}>Required</span>}</div>{!FRAUD_DETECTION_METHOD_LABEL?<div style={{marginTop:4,fontSize:10,color:"#92400e"}}>No default set — fill <code>FRAUD_DETECTION_METHOD_LABEL</code> in app-workflows.js to stop typing this each time.</div>:null}</div></div>{!fraudTicketId?<div style={{display:"flex",gap:8,flexWrap:"wrap",alignItems:"center"}}><button onClick={createFraudTicket} disabled={loading||!detectionMethod.trim()||!identityId} style={loading||!detectionMethod.trim()||!identityId?btnOff:Object.assign({},btn,{background:"#dc2626"})}>{loading?"Creating…":"✓ Create FRAUD Ticket"}</button><button onClick={function(){setShowFraudBypassInput(true);setError(null)}} disabled={loading} style={{padding:"8px 14px",background:"#fff",color:"#b45309",border:"1px solid #fcd34d",borderRadius:8,cursor:loading?"not-allowed":"pointer",fontWeight:600,fontSize:12}}>↷ Fraud ticket already exists → REIMB</button></div>:null}{!fraudTicketId&&showFraudBypassInput?<div style={{marginTop:8,padding:8,background:"#fffbeb",border:"1px solid #fde68a",borderRadius:6}}><div style={{fontSize:11,fontWeight:600,color:"#78350f",marginBottom:6}}>Skip the fraud step: a FRAUD ticket was already raised on this overpayment. Paste its key (optional — used in the audit banner only) and continue on the normal REIMB path.</div><div style={{display:"flex",gap:6}}><input value={bypassFraudKey} onChange={function(e){setBypassFraudKey(e.target.value.toUpperCase())}} placeholder="FRAUD-12345 (optional)" style={{flex:1,padding:"6px 10px",border:"1px solid #fcd34d",borderRadius:6,fontSize:12,fontFamily:"monospace",boxSizing:"border-box"}}/><button onClick={function(){var k=bypassFraudKey.trim();if(k&&!/^FRAUD-\d+$/i.test(k)){setError("Enter a valid FRAUD key like FRAUD-12345, or leave it blank.");return;}setFraudBypass(true);setShowFraudBypassInput(false);setError(null);}} style={{padding:"6px 12px",background:"#d97706",color:"#fff",border:"none",borderRadius:6,cursor:"pointer",fontSize:11,fontWeight:700}}>Proceed to REIMB</button><button onClick={function(){setShowFraudBypassInput(false)}} style={{padding:"6px 12px",background:"#fff",color:"#6b7280",border:"1px solid #d1d5db",borderRadius:6,cursor:"pointer",fontSize:11,fontWeight:600}}>Cancel</button></div></div>:null}{!fraudTicketId&&showManualFraudInput?<div style={{marginTop:8,padding:8,background:"#fffbeb",border:"1px solid #fde68a",borderRadius:6}}><div style={{fontSize:11,fontWeight:600,color:"#78350f",marginBottom:6}}>Manual fallback: if the bridge new-tab succeeded, paste the FRAUD key here to continue.</div><div style={{display:"flex",gap:6}}><input value={manualFraudKey} onChange={function(e){setManualFraudKey(e.target.value.toUpperCase())}} placeholder="FRAUD-12345" style={{flex:1,padding:"6px 10px",border:"1px solid #fcd34d",borderRadius:6,fontSize:12,boxSizing:"border-box"}}/><button onClick={function(){var k=manualFraudKey.trim();if(!/^FRAUD-\d+$/i.test(k)){setError("Enter a valid FRAUD key like FRAUD-12345");return;}finishFraud(k.toUpperCase());}} style={{padding:"6px 12px",background:"#d97706",color:"#fff",border:"none",borderRadius:6,fontWeight:600,fontSize:12,cursor:"pointer"}}>Continue</button></div></div>:null}{fraudTicketId?<div style={{marginTop:6,fontSize:12}}>✓ Created <a href={"https://wealthsimple.atlassian.net/browse/"+fraudTicketId} target="_blank" rel="noreferrer" style={{color:"#dc2626",fontWeight:600}}>{fraudTicketId}</a> · linked {FRAUD_LINK_TYPE} {ticket.id}</div>:null}</div>:null}
    {step>=3&&!isFraudPath?<div style={sec}><strong style={{fontSize:13}}>Step 4: Create REIMB Ticket</strong>{overFraudThreshold&&fraudAlreadyExists?<div style={{marginTop:6,padding:8,background:"#fffbeb",border:"1px solid #fde68a",borderRadius:6,fontSize:11,color:"#78350f",fontWeight:600}}>⚠️ {fmtAmt(amount)} is over {fmtAmt(FRAUD_AMOUNT_THRESHOLD)}, but {priorFraudKey?<a href={"https://wealthsimple.atlassian.net/browse/"+priorFraudKey} target="_blank" rel="noreferrer" style={{color:"#b45309",fontWeight:700}}>{priorFraudKey}</a>:"a FRAUD ticket"} was already raised{linkedFraudKeys.length?" (auto-detected from the ticket's links)":" (skipped manually by you)"} — continuing on the normal reimbursement path.{fraudBypass?<button onClick={function(){setFraudBypass(false);setBypassFraudKey("")}} style={{marginLeft:8,background:"none",border:"none",color:"#b45309",cursor:"pointer",fontSize:11,fontWeight:600,textDecoration:"underline"}}>undo</button>:null}</div>:null}<div style={{marginTop:6,fontSize:12,background:"#fff",padding:10,borderRadius:6,border:"1px solid #e5e7eb"}}><div>Summary: <strong>Reimbursement for {ticket.id}</strong></div><div>Identity: <strong>{identityId}</strong> · Amount: <strong style={{color:"#dc2626"}}>{fmtAmt(amount)}</strong> · Approver: <strong>{approver.name}</strong> {!showApproverEdit?<button onClick={function(){setShowApproverEdit(true)}} style={{marginLeft:8,background:"none",border:"none",color:"#d97706",cursor:"pointer",fontSize:11,fontWeight:600,textDecoration:"underline"}}>✏️ Override</button>:null}</div>{showApproverEdit?<div style={{marginTop:4,padding:8,background:"#fffbeb",borderRadius:6,border:"1px solid #fde68a"}}><div style={{display:"flex",gap:6}}>{[APPROVERS.luke,APPROVERS.amanda].map(function(a){return <button key={a.accountId} onClick={function(){setManualApprover(a);setShowApproverEdit(false)}} style={{padding:"4px 12px",borderRadius:6,fontSize:11,fontWeight:600,cursor:"pointer",background:approver.accountId===a.accountId?"#d97706":"#fff",color:approver.accountId===a.accountId?"#fff":"#d97706",border:"1px solid #fde68a"}}>{a.name}</button>})}</div></div>:null}<div>Tier: <strong>{userTier||"Premium"}</strong> {!showTierEdit?<button onClick={function(){setShowTierEdit(true)}} style={{background:"none",border:"none",color:"#4f46e5",cursor:"pointer",fontSize:11,textDecoration:"underline"}}>✏️</button>:null}</div>{showTierEdit?<div style={{marginTop:4,display:"flex",gap:6}}>{TIER_OPTIONS.map(function(tier){return <button key={tier.id} onClick={function(){setUserTier(tier.label);setUserTierId(tier.id);setShowTierEdit(false)}} style={{padding:"4px 12px",borderRadius:6,fontSize:11,fontWeight:600,cursor:"pointer",background:(userTierId||"13704")===tier.id?"#4f46e5":"#fff",color:(userTierId||"13704")===tier.id?"#fff":"#4f46e5",border:"1px solid #c7d2fe"}}>{tier.label}</button>})}</div>:null}<div style={{marginTop:6}}><label style={{fontSize:11,color:"#6b7280"}}>Cash Account ID *{isCCOvpType&&accountId?<span style={{color:"#4f46e5",marginLeft:4}}>(pre-filled — editable)</span>:null}</label><div style={{display:"flex",gap:6,alignItems:"center",marginTop:2}}><input type="text" value={accountId} onChange={function(e){setAccountId(e.target.value.toUpperCase())}} placeholder="e.g. WK292CZ38CAD" style={{flex:1,padding:"6px 10px",border:"1px solid "+(isCCOvpType&&accountId?"#c7d2fe":"#d1d5db"),borderRadius:6,fontSize:12,boxSizing:"border-box",fontFamily:"monospace",background:isCCOvpType&&accountId?"#eef2ff":"#fff"}}/>{accountIdValid?<span style={{color:"#16a34a",fontSize:12,fontWeight:700}}>✓</span>:null}{accountId&&!accountIdValid?<span style={{color:"#dc2626",fontSize:10}}>Invalid</span>:null}</div></div></div>{!reimTicketId?<button onClick={createReimTicket} disabled={loading||!accountIdValid} style={loading||!accountIdValid?btnOff:btnGo}>{loading?"Creating…":"✓ Create REIMB Ticket"}</button>:null}{!reimTicketId&&showManualReimbInput?<div style={{marginTop:8,padding:8,background:"#fffbeb",border:"1px solid #fde68a",borderRadius:6}}><div style={{fontSize:11,fontWeight:600,color:"#78350f",marginBottom:6}}>Manual fallback: if the bridge new-tab succeeded, paste the REIMB key here to continue.</div><div style={{display:"flex",gap:6}}><input value={manualReimbKey} onChange={function(e){setManualReimbKey(e.target.value.toUpperCase())}} placeholder="REIMB-12345" style={{flex:1,padding:"6px 10px",border:"1px solid #fcd34d",borderRadius:6,fontSize:12,fontFamily:"monospace",boxSizing:"border-box"}}/><button onClick={function(){var k=manualReimbKey.trim();if(!/^REIMB-\d+$/i.test(k)){setError("Enter a valid REIMB key like REIMB-12345");return;}setReimTicketId(k);setCommentText("Hi {{REPORTER_MENTION}}, a reimbursement ticket has been created https://wealthsimple.atlassian.net/browse/"+k+"  You can mention to the client to expect to see the overpayment amount of "+fmtAmt(amount)+" back in their chequing account within the next 2-3 business days.");setStep(5);setShowManualReimbInput(false);setError(null);}} style={{padding:"6px 12px",background:"#d97706",color:"#fff",border:"none",borderRadius:6,cursor:"pointer",fontSize:11,fontWeight:700}}>Use this key</button></div></div>:null}{reimTicketId?<div style={{marginTop:6,fontSize:12,color:"#16a34a"}}>✓ Created: <a href={"https://wealthsimple.atlassian.net/browse/"+reimTicketId} target="_blank" rel="noreferrer" style={{color:"#4f46e5",fontWeight:600}}>{reimTicketId}</a></div>:null}</div>:null}
    {step>=5&&!isFraudPath?<div style={sec}><strong style={{fontSize:13}}>Step 5: Admin Debit in i2c</strong>{!adminDebitDone?<div style={{marginTop:8}}><div style={{background:"#fff",borderRadius:6,padding:10,border:"1px solid #e5e7eb",fontSize:11,lineHeight:1.7}}><div>1. Open i2c: <a href="https://wealthsimplecs.mycardplace.com/customerservice/wealthsimplelogin.jsp" target="_blank" rel="noreferrer" style={{color:"#4f46e5"}}>🔗 Open i2c</a></div><div>2. Administrative Services tab</div><div>3. Admin Debit — <strong style={{color:"#dc2626"}}>{fmtAmt(amount)}</strong></div></div><button onClick={function(){setAdminDebitDone(true);setStep(6)}} style={Object.assign({},btnGo,{marginTop:8})}>✓ Admin Debit Applied</button></div>:null}{adminDebitDone?<div style={{marginTop:4,fontSize:12,color:"#16a34a"}}>✓ Admin Debit of {fmtAmt(amount)} applied</div>:null}</div>:null}
    {step>=6?<div style={sec}><strong style={{fontSize:13}}>Step 6: Post Comment on {ticket.id}</strong>{!commentPosted?<div style={{marginTop:6}}>{!editingComment?<div style={{fontSize:12,background:"#fff",padding:10,borderRadius:6,border:"1px solid #e5e7eb",whiteSpace:"pre-wrap",lineHeight:1.6}}>{commentText}</div>:null}{editingComment?<textarea value={commentText} onChange={function(e){setCommentText(e.target.value)}} rows={6} style={{width:"100%",boxSizing:"border-box",padding:10,border:"1px solid #c7d2fe",borderRadius:6,fontSize:12,lineHeight:1.6,resize:"vertical"}}/>:null}<div style={{display:"flex",gap:8,marginTop:8}}>{!editingComment?<button onClick={function(){setEditingComment(true)}} style={Object.assign({},btn,{background:"#d97706"})}>✏️ Edit</button>:null}{editingComment?<button onClick={function(){setEditingComment(false)}} style={btn}>✓ Done</button>:null}{!editingComment&&step===6?<button onClick={function(){setStep(7)}} style={btn}>Review → Approve</button>:null}</div></div>:null}{commentPosted?<div style={{marginTop:4,fontSize:12,color:"#16a34a"}}>✓ Comment posted</div>:null}</div>:null}
    {step===7&&!commentPosted?<div style={Object.assign({},sec,{borderColor:"#fde68a",background:"#fffbeb"})}><strong style={{fontSize:13,color:"#92400e"}}>⚠️ Post this comment?</strong><div style={{marginTop:8,display:"flex",gap:8}}><button onClick={postComment} disabled={loading} style={loading?btnOff:btnGo}>{loading?"Posting…":"✓ Post"}</button><button onClick={function(){setStep(6)}} style={Object.assign({},btn,{background:"#fff",color:"#6b7280",border:"1px solid #d1d5db"})}>← Back</button></div></div>:null}
    {step>=8?<div style={sec}><strong style={{fontSize:13}}>{isFraudPath?"Step 8: Move to Back Office":"Step 8: Move to Done"}</strong>{!ticketMoved&&step===8?<button onClick={isFraudPath?moveTicketBackOffice:moveTicketDone} disabled={loading} style={loading?btnOff:btnGo}>{loading?"…":(isFraudPath?"✓ Move to Back Office":"✓ Move to Done")}</button>:null}{ticketMoved?<div style={{marginTop:4,fontSize:12,color:"#16a34a"}}>{isFraudPath?"✓ Moved to Back Office":"✓ Done"}</div>:null}</div>:null}
    {step>=9?<div style={{background:"#f0fdf4",borderRadius:8,padding:12,border:"1px solid #bbf7d0",textAlign:"center"}}><div style={{fontSize:16,fontWeight:700,color:"#16a34a"}}>{isFraudPath?"✅ Escalated to Fraud":"✅ Triage Complete"}</div><div style={{fontSize:12,color:"#166534",marginTop:4}}>{isFraudPath?<span>{fraudTicketId} · linked {FRAUD_LINK_TYPE} {ticket.id} · Comment · {ticket.id} → Back Office</span>:<span>{reimTicketId} · Admin Debit · Comment · {ticket.id} Done</span>}</div></div>:null}
  </div>
}

// ============ MAIN DASHBOARD ============
