// ============================================================
//  BoardMain.jsx — Komponen Utama Board (PERMISSION FIXED)
// ============================================================

import {
  useState, useRef, useEffect, useCallback, useLayoutEffect, useMemo,
} from "react";
import { createPortal } from "react-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../lib/AuthContext";
import api from "../api/axios";
import PropTypes from "prop-types";
import {
  DndContext, PointerSensor,
  useSensor, useSensors, DragOverlay, KeyboardSensor, rectIntersection,
} from "@dnd-kit/core";
import {
  SortableContext, horizontalListSortingStrategy, arrayMove,
} from "@dnd-kit/sortable";
import BottomBar from "./Bottombar";
import { useRealtimeBoard } from "../hooks/useRealtimeBoard";

import {
  useTheme,
  stripHtml, timeAgo, fmtDate,
  CARD_COLORS, PRIORITY_CONFIG,
  TaskCard, SortableColumn,
} from "./BoardDetail";

// ─────────────────────────────────────────────────────────────
//  FONT PREFERENCE
// ─────────────────────────────────────────────────────────────
const FONT_PREF_KEY = "kanbanku_format_font";
function getSavedFont() {
  try { return localStorage.getItem(FONT_PREF_KEY) || "DM Sans"; } catch { return "DM Sans"; }
}
function saveFont(f) {
  try { localStorage.setItem(FONT_PREF_KEY, f); } catch { /* noop */ }
}

// ─────────────────────────────────────────────────────────────
//  FORMAT STATE READER
// ─────────────────────────────────────────────────────────────
function getFormatState() {
  const s = {
    bold:false, italic:false, underline:false, strike:false,
    fontSize:"14", fontFamily:"DM Sans", color:"",
    align:"left", ulList:false, olList:false,
  };
  try {
    s.bold      = document.queryCommandState("bold");
    s.italic    = document.queryCommandState("italic");
    s.underline = document.queryCommandState("underline");
    s.strike    = document.queryCommandState("strikeThrough");
    s.ulList    = document.queryCommandState("insertUnorderedList");
    s.olList    = document.queryCommandState("insertOrderedList");
    s.align     = document.queryCommandState("justifyCenter") ? "center"
                : document.queryCommandState("justifyRight")  ? "right" : "left";
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      let node = sel.anchorNode;
      if (node?.nodeType === 3) node = node.parentElement;
      let cur = node;
      let gotSize = false, gotFont = false, gotColor = false;
      while (cur && cur.nodeType === 1 && cur.contentEditable !== "true") {
        const ist = cur.style;
        if (!gotSize  && ist.fontSize)   { s.fontSize   = String(Math.round(parseFloat(ist.fontSize))); gotSize  = true; }
        if (!gotFont  && ist.fontFamily) { s.fontFamily  = ist.fontFamily.split(",")[0].replace(/['"]/g,"").trim(); gotFont  = true; }
        if (!gotColor && ist.color)      { s.color       = ist.color; gotColor = true; }
        cur = cur.parentElement;
      }
      if (!gotSize || !gotFont || !gotColor) {
        let cur2 = node;
        while (cur2 && cur2.nodeType === 1 && cur2.contentEditable !== "true") {
          const cs = window.getComputedStyle(cur2);
          if (!gotSize  && cs.fontSize)   { s.fontSize  = String(Math.round(parseFloat(cs.fontSize))); gotSize  = true; }
          if (!gotFont  && cs.fontFamily) { const ff = cs.fontFamily.split(",")[0].replace(/['"]/g,"").trim(); if (ff) { s.fontFamily = ff; gotFont = true; } }
          if (!gotColor && cs.color && cs.color !== "rgb(0, 0, 0)") { s.color = cs.color; gotColor = true; }
          cur2 = cur2.parentElement;
        }
      }
      if ((!gotSize || !gotFont) && node?.nodeType === 1) {
        const cs = window.getComputedStyle(node);
        if (!gotSize  && cs.fontSize)   s.fontSize   = String(Math.round(parseFloat(cs.fontSize)));
        if (!gotFont  && cs.fontFamily) s.fontFamily = cs.fontFamily.split(",")[0].replace(/['"]/g,"").trim() || "DM Sans";
        if (!gotColor && cs.color)      s.color      = cs.color;
      }
      if (!gotFont && node?.nodeType === 1) {
        let p = node;
        while (p && p.contentEditable !== "true") {
          if (p.tagName === "SPAN" && p.style?.fontFamily) {
            s.fontFamily = p.style.fontFamily.split(",")[0].replace(/['"]/g,"").trim();
            break;
          }
          p = p.parentElement;
        }
      }
    }
  } catch { /* queryCommand not available */ }
  return s;
}

// ─────────────────────────────────────────────────────────────
//  ONLINE INDICATOR
// ─────────────────────────────────────────────────────────────
function OnlineIndicator({ users, currentUserId }) {
  const others = (users || []).filter(u => String(u.id) !== String(currentUserId));
  if (!others.length) return null;
  return (
    <div style={{ display:"flex", alignItems:"center", gap:4, marginRight:4 }}>
      <span style={{ width:8, height:8, borderRadius:"50%", background:"#16a34a", boxShadow:"0 0 0 2px rgba(22,163,74,0.3)", animation:"pulse-green 2s ease infinite", flexShrink:0 }} />
      <span style={{ fontSize:11, color:"#16a34a", fontWeight:600, whiteSpace:"nowrap" }}>{others.length} online</span>
    </div>
  );
}
OnlineIndicator.propTypes = { users:PropTypes.array, currentUserId:PropTypes.oneOfType([PropTypes.string,PropTypes.number]) };

// ─────────────────────────────────────────────────────────────
//  REALTIME TOAST
// ─────────────────────────────────────────────────────────────
function RealtimeToast({ toast, dark }) {
  const t = useTheme(dark);
  if (!toast) return null;
  return (
    <div style={{ position:"fixed", bottom:80, left:"50%", transform:"translateX(-50%)", zIndex:9999, background:dark?"#1e293b":"#ffffff", border:`1px solid ${dark?"#334155":"#dee2e6"}`, borderLeft:"4px solid #16a34a", borderRadius:10, padding:"10px 16px", boxShadow:"0 8px 24px rgba(0,0,0,0.2)", display:"flex", alignItems:"center", gap:10, fontSize:13, color:t.text, animation:"slideUpToast 0.3s ease", whiteSpace:"nowrap", maxWidth:"90vw", overflow:"hidden", textOverflow:"ellipsis" }}>
      <span style={{ fontSize:16 }}>👥</span>
      <span><b>{toast.user}</b> {toast.action}</span>
    </div>
  );
}
RealtimeToast.propTypes = { toast:PropTypes.object, dark:PropTypes.bool };

// ─────────────────────────────────────────────────────────────
//  VIEWER OVERLAY — tampil di atas board jika viewer mencoba drag
// ─────────────────────────────────────────────────────────────
function ViewerBadge({ dark }) {
  const t = useTheme(dark);
  return (
    <div style={{
      position:"fixed", bottom:72, left:"50%", transform:"translateX(-50%)",
      zIndex:9998, background:dark?"#1e293b":"#fff8e1",
      border:`1px solid ${dark?"#334155":"#fbbf24"}`,
      borderLeft:"4px solid #f59e0b",
      borderRadius:10, padding:"8px 16px",
      boxShadow:"0 4px 16px rgba(0,0,0,0.15)",
      display:"flex", alignItems:"center", gap:8,
      fontSize:12, color:dark?"#fde68a":"#92400e",
      fontWeight:600, pointerEvents:"none",
    }}>
      <span>👁</span>
      <span>Anda hanya bisa melihat board ini (mode Viewer)</span>
    </div>
  );
}
ViewerBadge.propTypes = { dark:PropTypes.bool };

// ─────────────────────────────────────────────────────────────
//  ACCESS DENIED SCREEN
// ─────────────────────────────────────────────────────────────
function AccessDeniedScreen({ dark, onBack }) {
  const t = useTheme(dark);
  return (
    <div style={{
      flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center",
      background:t.boardBg, fontFamily:"'DM Sans',sans-serif", padding:32, textAlign:"center",
    }}>
      <div style={{ fontSize:64, marginBottom:16 }}>🚫</div>
      <h2 style={{ fontSize:22, fontWeight:800, color:t.text, marginBottom:8, fontFamily:"'Sora',sans-serif" }}>
        Akses Ditolak
      </h2>
      <p style={{ fontSize:14, color:t.muted, maxWidth:360, lineHeight:1.7, marginBottom:24 }}>
        Anda tidak memiliki akses ke board ini. Mungkin akses Anda telah dicabut oleh pemilik board,
        atau Anda belum diundang ke board ini.
      </p>
      <button
        onClick={onBack}
        style={{ padding:"10px 24px", background:t.blue, color:"white", border:"none", borderRadius:9, fontSize:14, fontWeight:700, cursor:"pointer" }}
        onMouseEnter={e => (e.currentTarget.style.background=t.blueBright)}
        onMouseLeave={e => (e.currentTarget.style.background=t.blue)}
      >
        ← Kembali ke Beranda
      </button>
    </div>
  );
}
AccessDeniedScreen.propTypes = { dark:PropTypes.bool, onBack:PropTypes.func };

// ─────────────────────────────────────────────────────────────
//  FONT DROPDOWN
// ─────────────────────────────────────────────────────────────
function FontDropdown({ value, fonts, t, onSelect }) {
  const [open, setOpen] = useState(false);
  const ref = useRef();
  useEffect(() => {
    if (!open) return;
    const fn = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, [open]);
  return (
    <div ref={ref} style={{ position:"relative" }}>
      <button onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); setOpen(v => !v); }} style={{ width:"100%", padding:"7px 10px", border:`1px solid ${open?t.blue:t.border}`, borderRadius:8, fontSize:12, background:t.surfaceAlt, color:t.text, cursor:"pointer", display:"flex", justifyContent:"space-between", alignItems:"center", textAlign:"left" }}>
        <span style={{ fontFamily:value }}>{value}</span>
        <span style={{ fontSize:9, color:t.muted }}>{open?"▲":"▼"}</span>
      </button>
      {open && (
        <div style={{ position:"absolute", top:"calc(100% + 4px)", left:0, right:0, background:t.surface, border:`1px solid ${t.border}`, borderRadius:8, boxShadow:"0 8px 24px rgba(0,0,0,.25)", zIndex:9999, maxHeight:220, overflowY:"auto" }}>
          {fonts.map(f => (
            <button key={f} onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); onSelect(f); setOpen(false); }} style={{ width:"100%", padding:"8px 12px", background:value===f?t.blueLight:"transparent", border:"none", cursor:"pointer", textAlign:"left", fontSize:13, fontFamily:f, color:value===f?t.blue:t.text, fontWeight:value===f?600:400 }}>{f}</button>
          ))}
        </div>
      )}
    </div>
  );
}
FontDropdown.propTypes = { value:PropTypes.string, fonts:PropTypes.array, t:PropTypes.object, onSelect:PropTypes.func };

// ─────────────────────────────────────────────────────────────
//  FORMAT SIDEBAR
// ─────────────────────────────────────────────────────────────
function FormatSidebar({ dark, show, onClose }) {
  const t = useTheme(dark);
  const [fmt, setFmt] = useState({ bold:false, italic:false, underline:false, strike:false, fontSize:"14", fontFamily:getSavedFont(), align:"left", ulList:false, olList:false });
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [linkUrl, setLinkUrl] = useState("https://");
  const [linkText, setLinkText] = useState("");
  const lastActiveEl = useRef(null);
  const lastRange = useRef(null);

  useEffect(() => {
    if (!show) return;
    const findCE = (node) => { let n = node; while (n) { if (n.nodeType === 1 && n.contentEditable === "true") return n; n = n.parentElement; } return null; };
    const syncFmt = () => {
      const sel = window.getSelection();
      if (!sel || sel.rangeCount === 0) return;
      const range = sel.getRangeAt(0);
      const ce = findCE(range.commonAncestorContainer);
      if (!ce) return;
      if (!ce.dataset?.cardEdit && ce.getAttribute("data-card-edit") !== "true") return;
      lastActiveEl.current = ce;
      lastRange.current = range.cloneRange();
      setFmt(getFormatState());
      const selected = sel.toString().trim();
      if (selected) setLinkText(selected);
    };
    const onDocMouseDown = (e) => {
      const ce = findCE(e.target);
      if (ce) {
        requestAnimationFrame(() => requestAnimationFrame(() => {
          const sel = window.getSelection();
          if (sel && sel.rangeCount > 0) {
            const range = sel.getRangeAt(0);
            const activeCE = findCE(range.commonAncestorContainer);
            if (activeCE) { lastActiveEl.current = activeCE; lastRange.current = range.cloneRange(); setFmt(getFormatState()); }
          }
        }));
      }
    };
    document.addEventListener("selectionchange", syncFmt);
    document.addEventListener("keyup", syncFmt);
    document.addEventListener("mousedown", onDocMouseDown, true);
    document.addEventListener("mouseup", syncFmt);
    return () => {
      document.removeEventListener("selectionchange", syncFmt);
      document.removeEventListener("keyup", syncFmt);
      document.removeEventListener("mousedown", onDocMouseDown, true);
      document.removeEventListener("mouseup", syncFmt);
    };
  }, [show]);

  const restoreAndFocus = () => {
    if (!lastActiveEl.current) return false;
    if (!document.contains(lastActiveEl.current)) return false;
    lastActiveEl.current.focus();
    if (lastRange.current) {
      try { const sel = window.getSelection(); sel.removeAllRanges(); sel.addRange(lastRange.current.cloneRange()); lastRange.current = lastRange.current.cloneRange(); }
      catch { try { const sel = window.getSelection(); sel.removeAllRanges(); const r = document.createRange(); r.selectNodeContents(lastActiveEl.current); r.collapse(false); sel.addRange(r); lastRange.current = r.cloneRange(); } catch { /* noop */ } }
    }
    return true;
  };

  const dispatchSave = () => {
    requestAnimationFrame(() => {
      setFmt(getFormatState());
      if (lastActiveEl.current) lastActiveEl.current.dispatchEvent(new Event("formatSave", { bubbles:true }));
    });
  };

  const execAndSave = (cmd, val) => {
    if (!restoreAndFocus()) return;
    try { document.execCommand(cmd, false, val || null); } catch { /* noop */ }
    requestAnimationFrame(() => {
      if (lastActiveEl.current && document.activeElement !== lastActiveEl.current) lastActiveEl.current.focus();
      const sel = window.getSelection();
      if (sel && sel.rangeCount > 0) lastRange.current = sel.getRangeAt(0).cloneRange();
      setFmt(getFormatState());
      if (lastActiveEl.current) lastActiveEl.current.dispatchEvent(new Event("formatSave", { bubbles:true }));
    });
  };

  const applySize = (px) => {
    if (!restoreAndFocus()) return;
    const sel = window.getSelection();
    if (sel && !sel.isCollapsed) {
      document.execCommand("fontSize", false, "7");
      (lastActiveEl.current || document).querySelectorAll('font[size="7"]').forEach((el) => {
        const span = document.createElement("span"); span.style.fontSize = px + "px"; span.innerHTML = el.innerHTML; el.parentNode.replaceChild(span, el);
      });
    } else if (lastActiveEl.current) {
      const span = document.createElement("span"); span.style.fontSize = px + "px"; span.textContent = "\u200B";
      const s = window.getSelection();
      if (s?.rangeCount) { const r = s.getRangeAt(0); r.insertNode(span); r.setStartAfter(span); r.collapse(true); s.removeAllRanges(); s.addRange(r); }
    }
    requestAnimationFrame(() => { setFmt((s) => ({ ...s, fontSize:String(px) })); if (lastActiveEl.current) lastActiveEl.current.dispatchEvent(new Event("formatSave", { bubbles:true })); });
  };

  const applyFont = (f) => {
    if (!lastActiveEl.current) return;
    lastActiveEl.current.focus();
    if (lastRange.current) {
      try { const sel = window.getSelection(); sel.removeAllRanges(); sel.addRange(lastRange.current.cloneRange()); }
      catch { try { const sel = window.getSelection(); sel.removeAllRanges(); const r = document.createRange(); r.selectNodeContents(lastActiveEl.current); r.collapse(false); sel.addRange(r); lastRange.current = r.cloneRange(); } catch { /* noop */ } }
    }
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;
    if (!sel.isCollapsed) {
      const range = sel.getRangeAt(0);
      try {
        const spanEl = document.createElement("span"); spanEl.style.fontFamily = f; range.surroundContents(spanEl);
        const newRange = document.createRange(); newRange.selectNodeContents(spanEl); sel.removeAllRanges(); sel.addRange(newRange); lastRange.current = newRange.cloneRange();
      } catch {
        try { document.execCommand("fontName", false, f); lastActiveEl.current.querySelectorAll("font[face]").forEach(el => { const sp = document.createElement("span"); sp.style.fontFamily = el.getAttribute("face") || f; sp.innerHTML = el.innerHTML; el.parentNode.replaceChild(sp, el); }); try { const r = lastRange.current?.cloneRange(); if (r) { sel.removeAllRanges(); sel.addRange(r); } } catch { /* noop */ } } catch { /* noop */ }
      }
    } else {
      try { document.execCommand("fontName", false, f); lastActiveEl.current.querySelectorAll("font[face]").forEach(el => { const sp = document.createElement("span"); sp.style.fontFamily = el.getAttribute("face") || f; sp.innerHTML = el.innerHTML; el.parentNode.replaceChild(sp, el); }); }
      catch { const span = document.createElement("span"); span.style.fontFamily = f; span.textContent = "\u200B"; const s = window.getSelection(); if (s?.rangeCount) { const r = s.getRangeAt(0); r.insertNode(span); const r2 = document.createRange(); r2.setStartAfter(span); r2.collapse(true); s.removeAllRanges(); s.addRange(r2); lastRange.current = r2.cloneRange(); } }
    }
    lastActiveEl.current.dispatchEvent(new Event("formatSave", { bubbles:true }));
    requestAnimationFrame(() => setFmt(getFormatState()));
  };

  const applyColor = (col) => {
    if (!restoreAndFocus()) return;
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;
    if (!sel.isCollapsed) {
      const savedRange = sel.getRangeAt(0).cloneRange();
      let spanEl = null;
      try { document.execCommand("foreColor", false, col); }
      catch { try { spanEl = document.createElement("span"); spanEl.style.color = col; sel.getRangeAt(0).surroundContents(spanEl); } catch { /* noop */ } }
      requestAnimationFrame(() => {
        if (lastActiveEl.current && document.activeElement !== lastActiveEl.current) lastActiveEl.current.focus();
        if (spanEl && spanEl.parentNode) { const nr = document.createRange(); nr.selectNodeContents(spanEl); sel.removeAllRanges(); sel.addRange(nr); lastRange.current = nr.cloneRange(); }
        else { try { const r = savedRange.cloneRange(); sel.removeAllRanges(); sel.addRange(r); lastRange.current = r; } catch { /* noop */ } }
        setFmt(getFormatState());
        if (lastActiveEl.current) lastActiveEl.current.dispatchEvent(new Event("formatSave", { bubbles:true }));
      });
    } else { dispatchSave(); }
  };

  const applyHi = (col) => {
    if (!restoreAndFocus()) return;
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0 || sel.isCollapsed) return;
    try { document.execCommand("backColor", false, col); }
    catch { try { const span = document.createElement("span"); span.style.backgroundColor = col === "transparent" ? "" : col; sel.getRangeAt(0).surroundContents(span); } catch { /* noop */ } }
    dispatchSave();
  };

  const applyList = (type) => {
    if (!restoreAndFocus()) return;
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;
    const range = sel.getRangeAt(0);
    let node = range.commonAncestorContainer;
    if (node.nodeType === 3) node = node.parentElement;
    const existingList = node.closest?.("ul, ol");
    if (existingList) {
      const frag = document.createDocumentFragment();
      existingList.querySelectorAll("li").forEach(li => { const p = document.createElement("p"); p.innerHTML = li.innerHTML; frag.appendChild(p); });
      existingList.parentNode.replaceChild(frag, existingList);
      dispatchSave(); setFmt(s => ({ ...s, ulList:false, olList:false })); return;
    }
    const listEl = document.createElement(type); listEl.style.marginLeft = "20px"; listEl.style.paddingLeft = "16px";
    const selectedText = sel.toString();
    if (selectedText) {
      const li = document.createElement("li");
      try { li.appendChild(range.extractContents()); } catch { li.textContent = selectedText; }
      listEl.appendChild(li);
      try { range.deleteContents(); range.insertNode(listEl); } catch { if (lastActiveEl.current) lastActiveEl.current.appendChild(listEl); }
    } else {
      const li = document.createElement("li"); li.innerHTML = "<br>"; listEl.appendChild(li);
      try { range.insertNode(listEl); const newRange = document.createRange(); newRange.setStart(li, 0); newRange.collapse(true); sel.removeAllRanges(); sel.addRange(newRange); lastRange.current = newRange.cloneRange(); } catch { /* noop */ }
    }
    dispatchSave(); setFmt(s => ({ ...s, ulList:type==="ul", olList:type==="ol" }));
  };

  const insertLink = () => {
    if (!restoreAndFocus()) return;
    const url = linkUrl.trim(); const text = linkText.trim();
    if (!url || url === "https://") return;
    const sel = window.getSelection();
    if (sel && !sel.isCollapsed) {
      try { const a = document.createElement("a"); a.href = url; a.target = "_blank"; a.rel = "noopener noreferrer"; a.style.color = "#4f6ef7"; a.style.textDecoration = "underline"; a.style.cursor = "pointer"; sel.getRangeAt(0).surroundContents(a); }
      catch { document.execCommand("createLink", false, url); lastActiveEl.current?.querySelectorAll("a").forEach(a => { a.style.color = "#4f6ef7"; a.style.textDecoration = "underline"; a.style.cursor = "pointer"; a.target = "_blank"; a.rel = "noopener noreferrer"; }); }
    } else {
      const a = document.createElement("a"); a.href = url; a.target = "_blank"; a.rel = "noopener noreferrer"; a.textContent = text || url; a.style.color = "#4f6ef7"; a.style.textDecoration = "underline"; a.style.cursor = "pointer";
      if (sel?.rangeCount) { const r = sel.getRangeAt(0); r.deleteContents(); r.insertNode(a); r.setStartAfter(a); r.collapse(true); sel.removeAllRanges(); sel.addRange(r); }
    }
    lastActiveEl.current?.dispatchEvent(new Event("formatSave", { bubbles:true }));
    setShowLinkInput(false); setLinkUrl("https://"); setLinkText("");
  };

  const removeLink = () => { if (!restoreAndFocus()) return; try { document.execCommand("unlink", false, null); } catch { /* noop */ } dispatchSave(); };

  const FONTS = ["DM Sans","Sora","Georgia","Courier New","Arial","Verdana","Times New Roman"];
  const SIZES = [8,10,12,13,14,16,18,20,24,28,32,36,48,72];
  const COLORS = ["#000000","#172b4d","#dc2626","#d97706","#16a34a","#1565c0","#7c3aed","#db2777","#0891b2","#94a3b8","#ffffff","#6b7280"];
  const HI = ["#fef08a","#bbf7d0","#fecaca","#bfdbfe","#f5d0fe","#fed7aa"];

  const FmtBtn = ({ active, onAction, children, style={}, title="" }) => (
    <button title={title} onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); onAction(); }}
      style={{ padding:"6px 10px", border:`1px solid ${active?t.blue:t.border}`, borderRadius:7, background:active?t.blueLight:t.surfaceAlt, color:active?t.blue:t.text, fontSize:12, cursor:"pointer", transition:"all .12s", ...style }}
      onMouseEnter={(e) => { e.currentTarget.style.background=t.blueLight; e.currentTarget.style.borderColor=t.blue; e.currentTarget.style.color=t.blue; }}
      onMouseLeave={(e) => { e.currentTarget.style.background=active?t.blueLight:t.surfaceAlt; e.currentTarget.style.borderColor=active?t.blue:t.border; e.currentTarget.style.color=active?t.blue:t.text; }}
    >{children}</button>
  );
  FmtBtn.propTypes = { active:PropTypes.bool, onAction:PropTypes.func, children:PropTypes.node, style:PropTypes.object, title:PropTypes.string };

  const SectionTitle = ({ label }) => (<p style={{ fontSize:10, fontWeight:700, color:t.muted, textTransform:"uppercase", letterSpacing:.6, marginBottom:6, marginTop:2 }}>{label}</p>);
  SectionTitle.propTypes = { label:PropTypes.string };

  return (
    <div style={{ position:"fixed", right:show?0:-285, top:52, bottom:0, width:275, zIndex:300, background:t.surface, borderLeft:`1px solid ${t.border}`, boxShadow:show?"-8px 0 32px rgba(0,0,0,.2)":"none", transition:"right .28s cubic-bezier(.4,0,.2,1)", display:"flex", flexDirection:"column", overflow:"hidden" }} onMouseDown={(e) => e.preventDefault()}>
      <div style={{ padding:"12px 16px 10px", borderBottom:`1px solid ${t.border}`, display:"flex", justifyContent:"space-between", alignItems:"center", flexShrink:0 }}>
        <span style={{ fontSize:13, fontWeight:700, color:t.text }}>✦ Format Teks</span>
        <button onMouseDown={(e) => { e.preventDefault(); onClose(); }} style={{ background:"transparent", border:"none", cursor:"pointer", color:t.muted, fontSize:16 }}>✕</button>
      </div>
      <div style={{ padding:"12px 14px", flex:1, overflowY:"auto", display:"flex", flexDirection:"column", gap:12 }}>
        <div>
          <SectionTitle label="Jenis Font" />
          <FontDropdown value={fmt.fontFamily || "DM Sans"} fonts={FONTS} t={t}
            onSelect={(f) => {
              saveFont(f);
              const sel = window.getSelection();
              if (sel && sel.rangeCount > 0) {
                lastRange.current = sel.getRangeAt(0).cloneRange();
                let node = sel.getRangeAt(0).commonAncestorContainer;
                while (node) { if (node.nodeType === 1 && node.contentEditable === "true") { lastActiveEl.current = node; break; } node = node.parentElement; }
              }
              applyFont(f); setFmt(prev => ({ ...prev, fontFamily:f }));
            }}
          />
        </div>
        <div>
          <SectionTitle label={`Ukuran Font — ${fmt.fontSize||14}px`} />
          <div style={{ display:"flex", gap:6, alignItems:"center", marginBottom:7 }}>
            <input type="number" min={6} max={96} value={fmt.fontSize||14} onMouseDown={(e) => e.stopPropagation()} onChange={(e) => applySize(+e.target.value)} style={{ width:52, padding:"6px 8px", border:`1.5px solid ${t.border}`, borderRadius:7, fontSize:12, background:t.surfaceAlt, color:t.text, outline:"none", textAlign:"center" }} />
            <input type="range" min={6} max={72} value={+fmt.fontSize||14} onMouseDown={(e) => e.stopPropagation()} onChange={(e) => applySize(+e.target.value)} style={{ flex:1, accentColor:t.blue }} />
          </div>
          <div style={{ display:"flex", gap:4, flexWrap:"wrap" }}>
            {SIZES.map(s => (<button key={s} onMouseDown={(e) => { e.preventDefault(); applySize(s); }} style={{ padding:"3px 7px", borderRadius:5, border:`1px solid ${+fmt.fontSize===s?t.blue:t.border}`, background:+fmt.fontSize===s?t.blueLight:"transparent", color:+fmt.fontSize===s?t.blue:t.muted, fontSize:11, cursor:"pointer" }}>{s}</button>))}
          </div>
        </div>
        <div>
          <SectionTitle label="Gaya Teks" />
          <div style={{ display:"flex", gap:5, flexWrap:"wrap" }}>
            <FmtBtn active={fmt.bold}      title="Bold"          onAction={() => execAndSave("bold")}          style={{ fontWeight:800 }}>B</FmtBtn>
            <FmtBtn active={fmt.italic}    title="Italic"        onAction={() => execAndSave("italic")}        style={{ fontStyle:"italic" }}>I</FmtBtn>
            <FmtBtn active={fmt.underline} title="Underline"     onAction={() => execAndSave("underline")}     style={{ textDecoration:"underline" }}>U</FmtBtn>
            <FmtBtn active={fmt.strike}    title="Strikethrough" onAction={() => execAndSave("strikeThrough")} style={{ textDecoration:"line-through" }}>S̶</FmtBtn>
          </div>
        </div>
        <div>
          <SectionTitle label="Heading" />
          <div style={{ display:"flex", gap:5, flexWrap:"wrap" }}>
            {[{l:"H1",v:"h1"},{l:"H2",v:"h2"},{l:"H3",v:"h3"},{l:"Normal",v:"p"}].map(b => (<FmtBtn key={b.v} active={false} onAction={() => execAndSave("formatBlock", b.v)} style={{ fontWeight:b.v!=="p"?700:400 }}>{b.l}</FmtBtn>))}
          </div>
        </div>
        <div>
          <SectionTitle label="Perataan" />
          <div style={{ display:"flex", gap:5 }}>
            <FmtBtn active={fmt.align==="left"}   title="Kiri"   onAction={() => execAndSave("justifyLeft")}   style={{ flex:1, fontSize:11 }}>⬅ Kiri</FmtBtn>
            <FmtBtn active={fmt.align==="center"} title="Tengah" onAction={() => execAndSave("justifyCenter")} style={{ flex:1, fontSize:11 }}>⬛ Tengah</FmtBtn>
            <FmtBtn active={fmt.align==="right"}  title="Kanan"  onAction={() => execAndSave("justifyRight")}  style={{ flex:1, fontSize:11 }}>➡ Kanan</FmtBtn>
          </div>
        </div>
        <div>
          <SectionTitle label="List" />
          <div style={{ display:"flex", gap:6 }}>
            <FmtBtn active={fmt.ulList} title="Bullet List"   onAction={() => applyList("ul")} style={{ flex:1 }}>• Bullet</FmtBtn>
            <FmtBtn active={fmt.olList} title="Numbered List" onAction={() => applyList("ol")} style={{ flex:1 }}>1. Nomor</FmtBtn>
          </div>
        </div>
        <div>
          <SectionTitle label="Insert Link" />
          <div style={{ display:"flex", gap:5, marginBottom:showLinkInput?8:0 }}>
            <FmtBtn active={showLinkInput} title="Tambah link" onAction={() => setShowLinkInput(v=>!v)} style={{ flex:1, fontSize:11 }}>🔗 Tambah Link</FmtBtn>
            <FmtBtn active={false} title="Hapus link" onAction={removeLink} style={{ flex:1, fontSize:11 }}>✕ Hapus Link</FmtBtn>
          </div>
          {showLinkInput && (
            <div style={{ background:t.surfaceAlt, border:`1px solid ${t.border}`, borderRadius:9, padding:"10px 12px", display:"flex", flexDirection:"column", gap:8 }}>
              <div>
                <p style={{ fontSize:10, fontWeight:700, color:t.muted, marginBottom:4, textTransform:"uppercase", letterSpacing:.5 }}>Teks (opsional)</p>
                <input value={linkText} onChange={e => setLinkText(e.target.value)} onMouseDown={e => e.stopPropagation()} placeholder="Teks yang tampil..." style={{ width:"100%", padding:"6px 9px", border:`1.5px solid ${t.border}`, borderRadius:7, fontSize:12, background:t.surface, color:t.text, outline:"none", boxSizing:"border-box" }} onFocus={e => (e.target.style.borderColor=t.blue)} onBlur={e => (e.target.style.borderColor=t.border)} />
              </div>
              <div>
                <p style={{ fontSize:10, fontWeight:700, color:t.muted, marginBottom:4, textTransform:"uppercase", letterSpacing:.5 }}>URL</p>
                <input value={linkUrl} onChange={e => setLinkUrl(e.target.value)} onMouseDown={e => e.stopPropagation()} placeholder="https://..." onKeyDown={e => { if(e.key==="Enter"){e.preventDefault();insertLink();} e.stopPropagation(); }} style={{ width:"100%", padding:"6px 9px", border:`1.5px solid ${t.border}`, borderRadius:7, fontSize:12, background:t.surface, color:t.text, outline:"none", boxSizing:"border-box" }} onFocus={e => (e.target.style.borderColor=t.blue)} onBlur={e => (e.target.style.borderColor=t.border)} />
              </div>
              <button onMouseDown={e => { e.preventDefault(); insertLink(); }} style={{ padding:"7px", background:t.blue, color:"white", border:"none", borderRadius:7, fontSize:12, fontWeight:700, cursor:"pointer" }}>🔗 Sisipkan Link</button>
            </div>
          )}
        </div>
        <div>
          <SectionTitle label="Warna Teks" />
          <div style={{ display:"flex", gap:5, flexWrap:"wrap" }}>
            {COLORS.map(c => (<button key={c} onMouseDown={(e) => { e.preventDefault(); applyColor(c); }} title={c} style={{ width:26, height:26, borderRadius:"50%", background:c, border:`3px solid ${t.border}`, cursor:"pointer", transition:"transform .15s", flexShrink:0 }} onMouseEnter={e => (e.currentTarget.style.transform="scale(1.3)")} onMouseLeave={e => (e.currentTarget.style.transform="scale(1)")} />))}
            <button onMouseDown={e => { e.preventDefault(); applyColor("#000000"); }} title="Reset warna" style={{ width:26, height:26, borderRadius:"50%", background:"linear-gradient(135deg,#000 50%,#fff 50%)", border:`2px solid ${t.border}`, cursor:"pointer", flexShrink:0 }} />
          </div>
        </div>
        <div>
          <SectionTitle label="Sorot / Highlight" />
          <div style={{ display:"flex", gap:5, flexWrap:"wrap", alignItems:"center" }}>
            {HI.map(c => (<button key={c} onMouseDown={(e) => { e.preventDefault(); applyHi(c); }} title={c} style={{ width:26, height:26, borderRadius:6, background:c, border:`2px solid ${t.border}`, cursor:"pointer", transition:"transform .15s", flexShrink:0 }} onMouseEnter={e => (e.currentTarget.style.transform="scale(1.3)")} onMouseLeave={e => (e.currentTarget.style.transform="scale(1)")} />))}
            <button onMouseDown={e => { e.preventDefault(); applyHi("transparent"); }} style={{ padding:"3px 8px", borderRadius:6, border:`1px solid ${t.border}`, background:t.surfaceAlt, color:t.muted, fontSize:11, cursor:"pointer" }}>✕ Hapus</button>
          </div>
        </div>
      </div>
    </div>
  );
}
FormatSidebar.propTypes = { dark:PropTypes.bool, show:PropTypes.bool, onClose:PropTypes.func };

// ─────────────────────────────────────────────────────────────
//  COMMENT MENU PORTAL
// ─────────────────────────────────────────────────────────────
function CommentMenuPortal({ dark, pos, comment, onDelete, onClose, isOwner }) {
  const t = useTheme(dark);
  const menuRef = useRef();
  useEffect(() => {
    const handler = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) onClose(); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);
  return createPortal(
    <div ref={menuRef} style={{ position:"fixed", top:pos.top, left:pos.left, width:160, zIndex:99999, background:t.surface, border:`1px solid ${t.border}`, borderRadius:10, boxShadow:"0 8px 28px rgba(0,0,0,.3)", padding:"4px 0", animation:"dropIn .13s ease" }}>
      <button onMouseDown={(e) => { e.preventDefault(); navigator.clipboard?.writeText(comment.body); onClose(); }} style={{ width:"100%", display:"flex", alignItems:"center", gap:8, padding:"8px 14px", background:"transparent", border:"none", cursor:"pointer", textAlign:"left", fontSize:12, color:t.text }} onMouseEnter={(e) => (e.currentTarget.style.background=t.surfaceHover)} onMouseLeave={(e) => (e.currentTarget.style.background="transparent")}><span>📋</span> Salin teks</button>
      {isOwner && (<button onMouseDown={(e) => { e.preventDefault(); onDelete(); onClose(); }} style={{ width:"100%", display:"flex", alignItems:"center", gap:8, padding:"8px 14px", background:"transparent", border:"none", cursor:"pointer", textAlign:"left", fontSize:12, color:t.red }} onMouseEnter={(e) => (e.currentTarget.style.background="rgba(220,38,38,.1)")} onMouseLeave={(e) => (e.currentTarget.style.background="transparent")}><span>🗑</span> Hapus</button>)}
    </div>,
    document.body
  );
}
CommentMenuPortal.propTypes = { dark:PropTypes.bool, pos:PropTypes.object, comment:PropTypes.object, onDelete:PropTypes.func, onClose:PropTypes.func, isOwner:PropTypes.bool };

// ─────────────────────────────────────────────────────────────
//  CARD MODAL
// ─────────────────────────────────────────────────────────────
function CardModal({ task, dark, onClose, columnName, allColumns, onMoveCard, canEdit }) {
  const t = useTheme(dark);
  const { user } = useAuth();
  const qc = useQueryClient();
  const [comment, setComment] = useState("");
  const [tab, setTab] = useState("comments");
  const [showMove, setShowMove] = useState(false);
  const [desc, setDesc] = useState(task?.description || "");
  const [editDesc, setEditDesc] = useState(false);
  const [priority, setPriority] = useState(task?.priority || "medium");
  const [showPrio, setShowPrio] = useState(false);
  const [dueDate, setDueDate] = useState(task?.due_date ? task.due_date.substring(0,10) : "");
  const [editDue, setEditDue] = useState(false);
  const [commentMenu, setCommentMenu] = useState(null);
  const descRef = useRef();
  const pConf = PRIORITY_CONFIG[priority] || PRIORITY_CONFIG.medium;
  const isOverdue = dueDate && new Date(dueDate) < new Date();

  const COMMENTS_KEY = `kanban_comments_task_${task?.id}`;
  const [localComments, setLocalComments] = useState(() => {
    try { const s = localStorage.getItem(COMMENTS_KEY); return s ? JSON.parse(s) : []; } catch { return []; }
  });

  const allComments = (() => {
    const serverComments = task?.comments || [];
    const serverIds = new Set(serverComments.map(c => String(c.id)));
    const onlyLocal = localComments.filter(c => !serverIds.has(String(c.id)));
    return [...serverComments, ...onlyLocal].sort((a,b) => new Date(b.created_at) - new Date(a.created_at));
  })();

  const saveLocalComments = useCallback((comments) => {
    setLocalComments(comments);
    try { localStorage.setItem(COMMENTS_KEY, JSON.stringify(comments)); } catch { /* noop */ }
  }, [COMMENTS_KEY]);

  const updateTask = useMutation({
    mutationFn:(d) => api.put(`/tasks/${task.id}`,d),
    onSuccess:() => qc.invalidateQueries(["board-detail"]),
  });

  const handleAddComment = useCallback(() => {
    if (!comment.trim()) return;
    const body = comment.trim();
    setComment("");
    const optimistic = { id:`local_${Date.now()}_${Math.random()}`, body, user:{ id:user?.id, name:user?.name }, created_at:new Date().toISOString(), _local:true };
    saveLocalComments([optimistic, ...localComments]);
    api.post(`/tasks/${task.id}/comments`, { body })
      .then((res) => { setLocalComments(prev => { const next = [res.data, ...prev.filter(c => c.id !== optimistic.id)]; try { localStorage.setItem(COMMENTS_KEY, JSON.stringify(next)); } catch { /* noop */ } return next; }); qc.invalidateQueries(["board-detail"]); })
      .catch(() => { /* local comment persists */ });
  }, [comment, user, task, localComments, saveLocalComments, COMMENTS_KEY, qc]);

  const handleDeleteComment = useCallback((c) => {
    saveLocalComments(localComments.filter(lc => String(lc.id) !== String(c.id)));
    if (!c._local && !String(c.id).startsWith("local_")) { api.delete(`/comments/${c.id}`).then(() => qc.invalidateQueries(["board-detail"])).catch(()=>{}); }
  }, [localComments, saveLocalComments, qc]);

  const openCommentMenu = (e, commentItem) => {
    e.preventDefault(); e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    let left = rect.right + 4;
    if (left + 160 > window.innerWidth - 8) left = rect.left - 164;
    setCommentMenu({ pos:{ top:rect.top, left }, commentItem });
  };

  useLayoutEffect(() => { if (editDesc) descRef.current?.focus(); }, [editDesc]);
  if (!task) return null;

  return (
    <div className="card-modal-outer" style={{ position:"fixed", inset:0, zIndex:900, background:"rgba(0,0,0,.6)", display:"flex", alignItems:"flex-start", justifyContent:"center", padding:"40px 16px", overflowY:"auto" }} onClick={onClose}>
      <div className="card-modal-wrap" style={{ background:t.surface, borderRadius:14, width:"100%", maxWidth:720, boxShadow:"0 32px 80px rgba(0,0,0,.4)", animation:"dropIn .2s ease", overflow:"hidden" }} onClick={(e) => e.stopPropagation()}>
        <div style={{ height:8, background:pConf.color }} />

        {/* Viewer notice strip */}
        {!canEdit && (
          <div style={{ background:dark?"rgba(245,158,11,.12)":"#fffbeb", borderBottom:`1px solid ${dark?"rgba(245,158,11,.25)":"#fde68a"}`, padding:"7px 20px", display:"flex", alignItems:"center", gap:8, fontSize:12, color:dark?"#fde68a":"#92400e" }}>
            <span>👁</span>
            <span>Anda hanya dapat melihat card ini. Hubungi pemilik board untuk mendapat akses edit.</span>
          </div>
        )}

        <div style={{ padding:"14px 20px 0", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <span style={{ fontSize:11, fontWeight:700, padding:"3px 10px", borderRadius:6, background:t.blueLight, color:t.blue }}>📌 {columnName}</span>
          <button onClick={onClose} style={{ background:"transparent", border:"none", cursor:"pointer", color:t.muted, fontSize:20, padding:"4px 8px", borderRadius:6 }}>✕</button>
        </div>
        <div className="card-modal-grid" style={{ display:"grid", gridTemplateColumns:"1fr 210px" }}>
          <div style={{ padding:"16px 20px 28px" }}>
            <h2 style={{ fontSize:19, fontWeight:800, color:t.text, marginBottom:6, fontFamily:"'Sora',sans-serif" }} dangerouslySetInnerHTML={{ __html:task.title }} />
            <div style={{ display:"flex", gap:14, marginBottom:14, flexWrap:"wrap" }}>
              <span style={{ fontSize:11, color:t.muted }}>Dibuat: <b style={{ color:t.text }}>{fmtDate(task.created_at)}</b></span>
            </div>
            <div style={{ display:"flex", gap:7, marginBottom:18, flexWrap:"wrap", alignItems:"center" }}>
              <div style={{ position:"relative" }}>
                {/* Priority button — only clickable if canEdit */}
                <button
                  onClick={() => canEdit && setShowPrio(!showPrio)}
                  style={{ fontSize:11, fontWeight:700, padding:"4px 10px", borderRadius:6, background:dark?pConf.darkBg:pConf.bg, color:pConf.color, border:`1.5px solid ${pConf.color}44`, cursor:canEdit?"pointer":"default" }}
                >
                  ⚡ {pConf.label} {canEdit && "▾"}
                </button>
                {showPrio && canEdit && (
                  <div style={{ position:"absolute", top:30, left:0, background:t.surface, border:`1px solid ${t.border}`, borderRadius:10, padding:6, zIndex:50, boxShadow:"0 8px 24px rgba(0,0,0,.2)", minWidth:120 }}>
                    {Object.entries(PRIORITY_CONFIG).map(([k,v]) => (<button key={k} onClick={() => { setPriority(k); setShowPrio(false); updateTask.mutate({priority:k}); }} style={{ width:"100%", padding:"7px 10px", background:priority===k?(dark?v.darkBg:v.bg):"transparent", border:"none", borderRadius:6, fontSize:12, color:v.color, fontWeight:700, cursor:"pointer", textAlign:"left" }}>⚡ {v.label}</button>))}
                  </div>
                )}
              </div>
              {editDue && canEdit ? (
                <input type="date" value={dueDate} autoFocus onChange={(e) => setDueDate(e.target.value)} onBlur={() => { setEditDue(false); updateTask.mutate({due_date:dueDate||null}); }} style={{ padding:"3px 8px", border:`1.5px solid ${t.blue}`, borderRadius:6, fontSize:11, background:t.surfaceAlt, color:t.text, outline:"none" }} />
              ) : (
                <button
                  onClick={() => canEdit && setEditDue(true)}
                  style={{ fontSize:11, fontWeight:600, padding:"4px 10px", borderRadius:6, background:isOverdue?"#fee2e2":t.blueLight, color:isOverdue?t.red:t.blue, border:"none", cursor:canEdit?"pointer":"default" }}
                >
                  📅 {dueDate ? new Date(dueDate).toLocaleDateString("id-ID",{day:"numeric",month:"long",year:"numeric"}) : (canEdit ? "Set Deadline" : "Belum ada deadline")}
                </button>
              )}
            </div>
            <div style={{ marginBottom:20 }}>
              <p style={{ fontSize:11, fontWeight:700, color:t.muted, textTransform:"uppercase", letterSpacing:.8, marginBottom:8 }}>≡ Deskripsi</p>
              {editDesc && canEdit ? (
                <div>
                  <textarea ref={descRef} value={desc} onChange={(e) => setDesc(e.target.value)} rows={4} placeholder="Tulis deskripsi..." style={{ width:"100%", padding:"10px 14px", border:`1.5px solid ${t.blue}`, borderRadius:8, fontSize:13, background:t.surfaceAlt, color:t.text, outline:"none", resize:"vertical", boxSizing:"border-box", fontFamily:"'DM Sans',sans-serif", lineHeight:1.6 }} />
                  <div style={{ display:"flex", gap:6, marginTop:6 }}>
                    <button onClick={() => { setEditDesc(false); if(desc!==task.description) updateTask.mutate({description:desc}); }} style={{ padding:"6px 14px", background:t.blue, color:"white", border:"none", borderRadius:7, fontSize:12, fontWeight:700, cursor:"pointer" }}>Simpan</button>
                    <button onClick={() => { setEditDesc(false); setDesc(task.description||""); }} style={{ padding:"6px", background:"transparent", border:"none", fontSize:12, color:t.muted, cursor:"pointer" }}>Batal</button>
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => canEdit && setEditDesc(true)}
                  style={{ fontSize:13, color:desc?t.text:t.muted, lineHeight:1.7, background:t.surfaceAlt, padding:"12px 14px", borderRadius:8, border:`1px solid ${t.border}`, minHeight:60, cursor:canEdit?"text":"default", fontStyle:desc?"normal":"italic" }}
                >
                  {desc || (canEdit ? "Klik untuk menambah deskripsi..." : "Tidak ada deskripsi.")}
                </div>
              )}
            </div>
            <div style={{ borderBottom:`1px solid ${t.border}`, display:"flex", gap:2, marginBottom:14 }}>
              {["comments","activity"].map((tb) => (<button key={tb} onClick={() => setTab(tb)} style={{ padding:"7px 14px", background:"transparent", border:"none", cursor:"pointer", fontSize:12, fontWeight:tab===tb?700:500, color:tab===tb?t.blue:t.muted, borderBottom:`2px solid ${tab===tb?t.blue:"transparent"}`, marginBottom:-1, transition:"all .15s" }}>{tb==="comments"?"💬 Komentar":"📋 Aktivitas"}</button>))}
            </div>
            {tab==="comments" && (
              <>
                {/* Comment box — viewer can comment too (read-only board but commenting is allowed) */}
                <div style={{ display:"flex", gap:10, marginBottom:14 }}>
                  <div style={{ width:28, height:28, borderRadius:"50%", background:t.blue, display:"flex", alignItems:"center", justifyContent:"center", color:"white", fontSize:11, fontWeight:700, flexShrink:0 }}>{user?.name?.[0]?.toUpperCase()}</div>
                  <div style={{ flex:1 }}>
                    <textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Tulis komentar..." rows={2} style={{ width:"100%", padding:"9px 12px", border:`1.5px solid ${t.border}`, borderRadius:8, fontSize:13, background:t.surfaceAlt, color:t.text, outline:"none", resize:"none", boxSizing:"border-box" }} onFocus={(e) => (e.target.style.borderColor=t.blue)} onBlur={(e) => (e.target.style.borderColor=t.border)} onKeyDown={(e) => { if(e.key==="Enter"&&!e.shiftKey&&comment.trim()){e.preventDefault();handleAddComment();} }} />
                    {comment.trim() && (<div style={{ display:"flex", gap:6, marginTop:6 }}><button onClick={handleAddComment} style={{ padding:"6px 14px", background:t.blue, color:"white", border:"none", borderRadius:7, fontSize:12, fontWeight:700, cursor:"pointer" }}>Kirim</button><button onClick={() => setComment("")} style={{ padding:"6px", background:"transparent", border:"none", fontSize:12, color:t.muted, cursor:"pointer" }}>Batal</button></div>)}
                  </div>
                </div>
                {!allComments.length ? <p style={{ fontSize:12, color:t.muted, fontStyle:"italic" }}>Belum ada komentar</p> : allComments.map((c) => (
                  <div key={String(c.id)} style={{ display:"flex", gap:10, marginBottom:14 }}>
                    <div style={{ width:28, height:28, borderRadius:"50%", background:"#1e3a8a", display:"flex", alignItems:"center", justifyContent:"center", color:"#93c5fd", fontSize:10, fontWeight:700, flexShrink:0 }}>{c.user?.name?.[0]?.toUpperCase()}</div>
                    <div style={{ flex:1 }}>
                      <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:3 }}>
                        <span style={{ fontSize:12, fontWeight:700, color:t.text }}>{c.user?.name}</span>
                        <span style={{ fontSize:11, color:t.muted }}>{timeAgo(c.created_at)}</span>
                        {(c._local || String(c.id).startsWith("local_")) && (<span style={{ fontSize:10, padding:"1px 5px", borderRadius:3, background:"rgba(217,119,6,.15)", color:"#d97706" }}>lokal</span>)}
                        <div style={{ marginLeft:"auto" }}>
                          <button onClick={(e) => openCommentMenu(e, c)} title="Opsi komentar" style={{ background:"transparent", border:"none", cursor:"pointer", color:t.muted, fontSize:16, padding:"2px 6px", borderRadius:5, display:"flex", alignItems:"center", lineHeight:1 }} onMouseEnter={(e) => { e.currentTarget.style.background=t.surfaceHover; e.currentTarget.style.color=t.text; }} onMouseLeave={(e) => { e.currentTarget.style.background="transparent"; e.currentTarget.style.color=t.muted; }}>⋯</button>
                        </div>
                      </div>
                      <p style={{ fontSize:12, color:t.text, background:t.surfaceAlt, padding:"8px 12px", borderRadius:8, border:`1px solid ${t.border}`, lineHeight:1.5 }}>{c.body}</p>
                    </div>
                  </div>
                ))}
              </>
            )}
            {tab==="activity" && (
              <div>
                {!allComments.length && <p style={{ fontSize:12, color:t.muted, fontStyle:"italic" }}>Belum ada aktivitas</p>}
                {allComments.map((c) => (<div key={String(c.id)} style={{ display:"flex", gap:10, marginBottom:12 }}><div style={{ width:26, height:26, borderRadius:"50%", background:t.blueLight, display:"flex", alignItems:"center", justifyContent:"center", color:t.blue, fontSize:10, fontWeight:700, flexShrink:0 }}>{c.user?.name?.[0]?.toUpperCase()}</div><div><span style={{ fontSize:12, fontWeight:700, color:t.text }}>{c.user?.name} </span><span style={{ fontSize:12, color:t.muted }}>berkomentar • {timeAgo(c.created_at)}</span></div></div>))}
              </div>
            )}
          </div>
          <div className="card-modal-sidebar" style={{ borderLeft:`1px solid ${t.border}`, padding:"20px 14px", background:t.surfaceAlt }}>
            <p style={{ fontSize:10, fontWeight:700, color:t.muted, textTransform:"uppercase", letterSpacing:.8, marginBottom:12 }}>Detail</p>
            <div style={{ marginBottom:12 }}>
              <p style={{ fontSize:11, color:t.muted, marginBottom:5, fontWeight:600 }}>Ditugaskan ke</p>
              {task.assignee ? (<div style={{ display:"flex", alignItems:"center", gap:7 }}><div style={{ width:26, height:26, borderRadius:"50%", background:t.blue, display:"flex", alignItems:"center", justifyContent:"center", color:"white", fontSize:10, fontWeight:700 }}>{task.assignee.name?.[0]?.toUpperCase()}</div><span style={{ fontSize:12, color:t.text }}>{task.assignee.name}</span></div>) : <span style={{ fontSize:11, color:t.muted }}>Belum ada</span>}
            </div>
            <div style={{ marginBottom:12 }}>
              <p style={{ fontSize:11, color:t.muted, marginBottom:5, fontWeight:600 }}>Prioritas</p>
              <span style={{ fontSize:11, fontWeight:700, padding:"3px 9px", borderRadius:5, background:dark?pConf.darkBg:pConf.bg, color:pConf.color }}>{pConf.label}</span>
            </div>
            {dueDate && (<div style={{ marginBottom:12 }}><p style={{ fontSize:11, color:t.muted, marginBottom:5, fontWeight:600 }}>Deadline</p><p style={{ fontSize:11, color:isOverdue?t.red:t.text, fontWeight:600 }}>📅 {new Date(dueDate).toLocaleDateString("id-ID",{day:"numeric",month:"short",year:"numeric"})}</p></div>)}
            <div style={{ marginBottom:12 }}><p style={{ fontSize:10, color:t.muted, marginBottom:3, fontWeight:600 }}>Komentar</p><p style={{ fontSize:13, color:t.text, fontWeight:700 }}>💬 {allComments.length}</p></div>
            {/* Move button — only for canEdit */}
            {canEdit && (
              <div>
                <p style={{ fontSize:10, fontWeight:700, color:t.muted, textTransform:"uppercase", letterSpacing:.8, marginBottom:8 }}>Aksi</p>
                <button onClick={() => setShowMove(!showMove)} style={{ width:"100%", padding:"7px 10px", background:t.surface, border:`1px solid ${t.border}`, borderRadius:7, fontSize:12, color:t.text, cursor:"pointer", textAlign:"left", marginBottom:6 }}>↗️ Pindahkan</button>
                {showMove && (<div style={{ background:t.surface, border:`1px solid ${t.border}`, borderRadius:8, padding:6, marginBottom:6 }}>{allColumns?.filter((c) => c.name!==columnName).map((col) => (<button key={col.id} onClick={() => { onMoveCard(task.id,col.id); onClose(); }} style={{ width:"100%", padding:"6px 10px", background:"transparent", border:"none", borderRadius:6, fontSize:12, color:t.text, cursor:"pointer", textAlign:"left" }}>→ {col.name}</button>))}</div>)}
              </div>
            )}
          </div>
        </div>
      </div>
      {commentMenu && (<CommentMenuPortal dark={dark} pos={commentMenu.pos} comment={commentMenu.commentItem} isOwner={commentMenu.commentItem.user?.id===user?.id || commentMenu.commentItem._local || String(commentMenu.commentItem.id).startsWith("local_")} onDelete={() => handleDeleteComment(commentMenu.commentItem)} onClose={() => setCommentMenu(null)} />)}
    </div>
  );
}
CardModal.propTypes = { task:PropTypes.object, dark:PropTypes.bool, onClose:PropTypes.func, columnName:PropTypes.string, allColumns:PropTypes.array, onMoveCard:PropTypes.func, canEdit:PropTypes.bool };

// ─────────────────────────────────────────────────────────────
//  SHARE MODAL
// ─────────────────────────────────────────────────────────────
function ShareModal({ boardId, dark, onClose, members, canInvite }) {
  const t = useTheme(dark);
  const qc = useQueryClient();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("member");
  const [msg, setMsg] = useState({ text:"", ok:true });
  const [copied, setCopied] = useState(false);
  const [roleMenuId, setRoleMenuId] = useState(null);
  const [dropdownPos, setDropdownPos] = useState({ top:0, right:0 });
  const [localRoleOverrides, setLocalRoleOverrides] = useState({});
  const shareLink = `${window.location.origin}/boards/${boardId}`;

  const invite = async () => {
    if (!email.trim()) return;
    setMsg({ text:"", ok:true });
    try {
      await api.post(`/boards/${boardId}/invite`, { email:email.trim(), role });
      setMsg({ text:"✅ Undangan berhasil dikirim!", ok:true });
      setEmail(""); qc.invalidateQueries(["board-detail"]);
    } catch (e) {
      setMsg({ text:`❌ ${e.response?.data?.message||"Email tidak ditemukan atau sudah anggota."}`, ok:false });
    }
  };

  const updateRole = async (memberId, newRole) => {
    setRoleMenuId(null);
    setLocalRoleOverrides(prev => ({ ...prev, [memberId]: newRole }));
    try {
      await api.put(`/boards/${boardId}/members/${memberId}/role`, { role: newRole });
      await qc.invalidateQueries({ queryKey: ["board-detail", boardId] });
    } catch {
      setLocalRoleOverrides(prev => { const n = {...prev}; delete n[memberId]; return n; });
    }
  };

  const removeMember = async (memberId) => {
    if (!window.confirm("Hapus akses anggota ini dari board?")) return;
    setRoleMenuId(null);
    try {
      await api.delete(`/boards/${boardId}/members/${memberId}`);
      await qc.invalidateQueries({ queryKey:["board-detail", boardId] });
    } catch { /* noop */ }
  };

  const ROLE_LABELS = { owner:"👑 Owner", member:"✏️ Editor", viewer:"👁 Viewer" };

  return (
    <div style={{ position:"fixed", inset:0, zIndex:900, background:"rgba(0,0,0,.5)", display:"flex", alignItems:"center", justifyContent:"center", padding:20 }} onClick={onClose}>
      <div style={{ background:t.surface, borderRadius:16, width:"100%", maxWidth:480, boxShadow:"0 24px 64px rgba(0,0,0,.3)", animation:"dropIn .22s ease", overflow:"hidden" }} onClick={(e) => e.stopPropagation()}>
        <div style={{ padding:"18px 20px", borderBottom:`1px solid ${t.border}`, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <h3 style={{ fontSize:15, fontWeight:700, color:t.text }}>Bagikan Board</h3>
          <button onClick={onClose} style={{ background:"transparent", border:"none", cursor:"pointer", color:t.muted, fontSize:18 }}>✕</button>
        </div>
        <div style={{ padding:20 }}>
          <div style={{ marginBottom:18 }}>
            <p style={{ fontSize:11, fontWeight:700, color:t.muted, textTransform:"uppercase", letterSpacing:.5, marginBottom:8 }}>🔗 Link Board</p>
            <div style={{ display:"flex", gap:8 }}>
              <div style={{ flex:1, padding:"9px 12px", background:t.surfaceAlt, border:`1px solid ${t.border}`, borderRadius:9, fontSize:12, color:t.muted, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{shareLink}</div>
              <button onClick={() => { navigator.clipboard.writeText(shareLink); setCopied(true); setTimeout(()=>setCopied(false),2000); }} style={{ padding:"9px 16px", background:copied?t.green:t.blue, color:"white", border:"none", borderRadius:9, fontSize:12, fontWeight:700, cursor:"pointer", whiteSpace:"nowrap" }}>{copied?"✓ Disalin!":"Salin"}</button>
            </div>
          </div>
          <div style={{ height:1, background:t.border, marginBottom:18 }} />

          {/* Invite form — hanya owner */}
          {canInvite && (
            <div style={{ marginBottom:16 }}>
              <p style={{ fontSize:11, fontWeight:700, color:t.muted, textTransform:"uppercase", letterSpacing:.5, marginBottom:8 }}>👥 Undang Anggota</p>
              <div style={{ display:"flex", gap:8, marginBottom:8 }}>
                <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="contoh@email.com" onKeyDown={(e) => e.key==="Enter"&&invite()} style={{ flex:1, padding:"9px 12px", border:`1.5px solid ${t.border}`, borderRadius:9, fontSize:13, background:t.surfaceAlt, color:t.text, outline:"none" }} onFocus={(e) => (e.target.style.borderColor=t.blue)} onBlur={(e) => (e.target.style.borderColor=t.border)} />
                <select value={role} onChange={(e) => setRole(e.target.value)} style={{ padding:"9px 10px", border:`1.5px solid ${t.border}`, borderRadius:9, fontSize:12, background:t.surfaceAlt, color:t.text, outline:"none", cursor:"pointer" }}>
                  <option value="member">✏️ Editor</option>
                  <option value="viewer">👁 Viewer</option>
                </select>
                <button onClick={invite} style={{ padding:"9px 14px", background:t.blue, color:"white", border:"none", borderRadius:9, fontSize:13, fontWeight:700, cursor:"pointer" }}>Kirim</button>
              </div>
              {msg.text && <p style={{ fontSize:12, color:msg.ok?t.green:t.red }}>{msg.text}</p>}
            </div>
          )}

          {members?.length > 0 && (
            <div>
              <p style={{ fontSize:11, fontWeight:700, color:t.muted, textTransform:"uppercase", letterSpacing:.5, marginBottom:8 }}>Anggota ({members.length})</p>
              <div style={{ maxHeight:220, overflowY:"auto", overflowX:"visible" }}>
                {members.map((m, i) => {
                  const currentRole = localRoleOverrides[m.id] || m.pivot?.role || "member";
                  const isOwnerMember = currentRole === "owner";
                  const menuOpen = roleMenuId === m.id;
                  return (
                    <div key={m.id} style={{ display:"flex", alignItems:"center", gap:10, padding:"8px 0", borderBottom:`1px solid ${t.border}`, position:"relative" }}>
                      <div style={{ width:32, height:32, borderRadius:"50%", background:CARD_COLORS[i%CARD_COLORS.length], display:"flex", alignItems:"center", justifyContent:"center", color:"white", fontSize:12, fontWeight:700, flexShrink:0 }}>{m.name?.[0]?.toUpperCase()}</div>
                      <div style={{ flex:1, minWidth:0 }}>
                        <p style={{ fontSize:13, fontWeight:600, color:t.text, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{m.name}</p>
                        <p style={{ fontSize:11, color:t.muted, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{m.email}</p>
                      </div>
                      <div style={{ position:"relative", flexShrink:0 }}>
                        <button
                          onClick={(e) => {
                            if (isOwnerMember || !canInvite) return;
                            if (menuOpen) { setRoleMenuId(null); return; }
                            const rect = e.currentTarget.getBoundingClientRect();
                            const spaceBelow = window.innerHeight - rect.bottom;
                            const dropH = 180;
                            setDropdownPos({ top:Math.max(8, spaceBelow<dropH+8?rect.top-dropH-4:rect.bottom+4), right:window.innerWidth-rect.right });
                            setRoleMenuId(m.id);
                          }}
                          style={{ display:"flex", alignItems:"center", gap:4, padding:"4px 10px", background:isOwnerMember?t.blueLight:t.surfaceAlt, border:`1px solid ${menuOpen?t.blue:t.border}`, borderRadius:8, fontSize:11, fontWeight:600, color:isOwnerMember?t.blue:t.text, cursor:(isOwnerMember||!canInvite)?"default":"pointer", transition:"all .15s" }}
                        >
                          {ROLE_LABELS[currentRole] || currentRole}
                          {(!isOwnerMember && canInvite) && <span style={{ fontSize:9, color:t.muted }}>▾</span>}
                        </button>
                        {menuOpen && canInvite && (
                          <>
                            <div style={{ position:"fixed", inset:0, zIndex:9997 }} onMouseDown={() => setRoleMenuId(null)} />
                            <div style={{ position:"fixed", right:dropdownPos.right, top:dropdownPos.top, width:170, background:t.surface, border:`1px solid ${t.border}`, borderRadius:10, boxShadow:"0 8px 28px rgba(0,0,0,.3)", zIndex:9998, padding:"4px 0", overflow:"hidden" }}>
                              {[{ value:"owner", label:"Owner", desc:"Akses penuh" },{ value:"member", label:"Member", desc:"Edit board & card" },{ value:"viewer", label:"Viewer", desc:"Hanya lihat" }].map(opt => (
                                <button key={opt.value} onClick={() => updateRole(m.id, opt.value)} style={{ width:"100%", display:"flex", alignItems:"center", justifyContent:"space-between", padding:"9px 14px", background:"transparent", border:"none", cursor:"pointer", textAlign:"left" }} onMouseEnter={e => (e.currentTarget.style.background=t.surfaceHover)} onMouseLeave={e => (e.currentTarget.style.background="transparent")}>
                                  <div>
                                    <p style={{ fontSize:13, fontWeight:currentRole===opt.value?700:500, color:currentRole===opt.value?t.blue:t.text }}>{opt.label}</p>
                                    <p style={{ fontSize:11, color:t.muted, marginTop:1 }}>{opt.desc}</p>
                                  </div>
                                  {currentRole===opt.value && <span style={{ color:t.blue, fontSize:14, fontWeight:700 }}>✓</span>}
                                </button>
                              ))}
                              <div style={{ height:1, background:t.border, margin:"4px 0" }} />
                              <button onClick={() => removeMember(m.id)} style={{ width:"100%", padding:"9px 14px", background:"transparent", border:"none", cursor:"pointer", textAlign:"left" }} onMouseEnter={e => (e.currentTarget.style.background=t.surfaceHover)} onMouseLeave={e => (e.currentTarget.style.background="transparent")}><p style={{ fontSize:13, fontWeight:500, color:t.red }}>Remove from board</p></button>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
ShareModal.propTypes = { boardId:PropTypes.number, dark:PropTypes.bool, onClose:PropTypes.func, members:PropTypes.array, canInvite:PropTypes.bool };

// ─────────────────────────────────────────────────────────────
//  MEMBER AVATARS
// ─────────────────────────────────────────────────────────────
function MemberAvatars({ members, currentUserId, dark, boardId, isShared }) {
  const [activePopup, setActivePopup] = useState(null);
  const [popupPos, setPopupPos] = useState({ top:0, left:0 });
  const [showActivity, setShowActivity] = useState(false);
  const [activityMember, setActivityMember] = useState(null);
  const containerRef = useRef();

  const getMemberActivity = (memberName) => {
    try {
      const keys = Object.keys(localStorage).filter(k => k.startsWith("kanbanku_activity_"));
      return keys.flatMap(k => { try { return JSON.parse(localStorage.getItem(k)||"[]"); } catch { return []; } }).filter(a => a.user === memberName).sort((a, b) => new Date(b.time) - new Date(a.time)).slice(0, 30);
    } catch { return []; }
  };

  const timeAgoLocal = (d) => {
    if (!d) return "";
    const s = (Date.now() - new Date(d)) / 1000;
    if (s < 60) return "baru saja";
    if (s < 3600) return `${Math.floor(s/60)} mnt lalu`;
    if (s < 86400) return `${Math.floor(s/3600)} jam lalu`;
    return `${Math.floor(s/86400)} hari lalu`;
  };

  const fmtDateLocal = (d) => {
    if (!d) return "";
    return new Date(d).toLocaleString("id-ID", { day:"numeric", month:"short", year:"numeric", hour:"2-digit", minute:"2-digit" });
  };

  const openPopup = (e, member) => {
    const rect = e.currentTarget.getBoundingClientRect();
    let left = rect.left - 10;
    if (left + 240 > window.innerWidth - 8) left = window.innerWidth - 248;
    setPopupPos({ top:rect.bottom + 8, left:Math.max(8, left) });
    setShowActivity(false); setActivityMember(null);
    setActivePopup(activePopup?.id === member.id ? null : member);
  };

  useEffect(() => {
    if (!activePopup) return;
    const fn = (e) => {
      const popupEl = document.querySelector("[data-member-popup]");
      if (popupEl && popupEl.contains(e.target)) return;
      if (containerRef.current && !containerRef.current.contains(e.target)) { setActivePopup(null); setShowActivity(false); setActivityMember(null); }
    };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, [activePopup]);

  const otherMembers = members.filter(m => String(m.id) !== String(currentUserId));
  if (!otherMembers.length) return null;

  return (
    <div ref={containerRef} className="kb-members-row" style={{ display:"flex", marginRight:2, position:"relative" }}>
      {otherMembers.slice(0, 5).map((m, i) => {
        const photoVisible = !m.photo_visibility || m.photo_visibility === "Anyone" || (m.photo_visibility === "Organization members" && isShared);
        return (
          <div key={m.id} onClick={(e) => openPopup(e, m)} title={`${m.name} · ${m.pivot?.role || "member"}`}
            style={{ width:28, height:28, borderRadius:"50%", background:CARD_COLORS[i%CARD_COLORS.length], border:activePopup?.id===m.id?"2.5px solid white":"2px solid rgba(255,255,255,.3)", display:"flex", alignItems:"center", justifyContent:"center", color:"white", fontSize:10, fontWeight:700, marginLeft:i>0?-8:0, cursor:"pointer", transition:"border .15s, transform .15s", zIndex:i, position:"relative", overflow:"hidden" }}
            onMouseEnter={e => { e.currentTarget.style.transform="scale(1.15)"; e.currentTarget.style.zIndex="10"; }}
            onMouseLeave={e => { e.currentTarget.style.transform="scale(1)"; e.currentTarget.style.zIndex=String(i); }}
          >
            {photoVisible && m.avatar_url ? <img src={m.avatar_url} alt={m.name} style={{ width:"100%", height:"100%", objectFit:"cover", borderRadius:"50%" }} /> : m.name?.[0]?.toUpperCase()}
          </div>
        );
      })}
      {otherMembers.length > 5 && (<div style={{ width:28, height:28, borderRadius:"50%", background:"rgba(148,163,184,0.3)", border:"2px solid rgba(255,255,255,.3)", display:"flex", alignItems:"center", justifyContent:"center", color:"white", fontSize:9, fontWeight:700, marginLeft:-8 }}>+{otherMembers.length - 5}</div>)}
      {activePopup && createPortal(
        <div data-member-popup="true" style={{ position:"fixed", top:popupPos.top, left:popupPos.left, width:240, zIndex:99999, background:dark?"#1d2125":"#ffffff", border:`1px solid ${dark?"rgba(255,255,255,.1)":"rgba(0,0,0,.1)"}`, borderRadius:12, boxShadow:"0 16px 48px rgba(0,0,0,.35)", overflow:"hidden", animation:"dropIn .18s ease", fontFamily:"'DM Sans',sans-serif" }}>
          <div style={{ padding:"16px", display:"flex", gap:12, alignItems:"center", borderBottom:`1px solid ${dark?"rgba(255,255,255,.08)":"rgba(0,0,0,.08)"}` }}>
            <div style={{ width:44, height:44, borderRadius:"50%", background:CARD_COLORS[members.findIndex(m=>m.id===activePopup.id) % CARD_COLORS.length], display:"flex", alignItems:"center", justifyContent:"center", color:"white", fontSize:18, fontWeight:700, flexShrink:0 }}>{activePopup.name?.[0]?.toUpperCase()}</div>
            <div style={{ minWidth:0 }}>
              <p style={{ fontSize:14, fontWeight:700, color:dark?"#dee4ea":"#172b4d", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{activePopup.name}</p>
              <p style={{ fontSize:11, color:dark?"#738496":"#626f86", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{activePopup.email}</p>
              <span style={{ fontSize:10, padding:"1px 6px", borderRadius:99, background:dark?"rgba(87,157,255,.15)":"#e8f0fe", color:dark?"#579dff":"#0052cc", fontWeight:600, display:"inline-block", marginTop:3 }}>{activePopup.pivot?.role || "member"}</span>
            </div>
          </div>
          {!showActivity ? (
            <>
              <button style={{ width:"100%", display:"flex", alignItems:"center", gap:10, padding:"10px 16px", background:"transparent", border:"none", cursor:"pointer", textAlign:"left", fontSize:13, color:dark?"#b6c2cf":"#44546f" }} onMouseEnter={e => (e.currentTarget.style.background=dark?"#282e33":"#f1f2f4")} onMouseLeave={e => (e.currentTarget.style.background="transparent")} onClick={() => setActivePopup(null)}><span style={{ fontSize:14 }}>👤</span> Lihat Profil</button>
              <button style={{ width:"100%", display:"flex", alignItems:"center", gap:10, padding:"10px 16px", background:"transparent", border:"none", cursor:"pointer", textAlign:"left", fontSize:13, color:dark?"#b6c2cf":"#44546f" }} onMouseEnter={e => (e.currentTarget.style.background=dark?"#282e33":"#f1f2f4")} onMouseLeave={e => (e.currentTarget.style.background="transparent")} onClick={() => { setActivityMember(activePopup); setShowActivity(true); }}><span style={{ fontSize:14 }}>📋</span> Lihat Aktivitas</button>
            </>
          ) : (
            <div>
              <div style={{ display:"flex", alignItems:"center", gap:8, padding:"10px 16px", borderTop:`1px solid ${dark?"rgba(255,255,255,.08)":"rgba(0,0,0,.08)"}` }}>
                <button onClick={() => setShowActivity(false)} style={{ background:"transparent", border:"none", cursor:"pointer", color:dark?"#738496":"#626f86", fontSize:15, padding:0, display:"flex", alignItems:"center" }}>←</button>
                <span style={{ fontSize:12, fontWeight:700, color:dark?"#dee4ea":"#172b4d" }}>Aktivitas {activityMember?.name}</span>
              </div>
              <div style={{ maxHeight:240, overflowY:"auto", padding:"4px 0" }}>
                {(() => {
                  const logs = getMemberActivity(activityMember?.name);
                  if (!logs.length) return (<div style={{ padding:"20px 16px", textAlign:"center", color:dark?"#738496":"#626f86" }}><p style={{ fontSize:24, marginBottom:6 }}>📋</p><p style={{ fontSize:12 }}>Belum ada aktivitas tercatat</p></div>);
                  return logs.map((a, idx) => (
                    <div key={idx} style={{ padding:"8px 16px", borderBottom:`1px solid ${dark?"rgba(255,255,255,.05)":"rgba(0,0,0,.05)"}`, display:"flex", gap:10, alignItems:"flex-start" }}>
                      <div style={{ width:7, height:7, borderRadius:"50%", background:dark?"#579dff":"#0052cc", flexShrink:0, marginTop:5 }} />
                      <div style={{ flex:1, minWidth:0 }}>
                        <p style={{ fontSize:12, color:dark?"#b6c2cf":"#44546f", lineHeight:1.4, marginBottom:2 }}><b style={{ color:dark?"#dee4ea":"#172b4d" }}>{a.user}</b> {a.action}</p>
                        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                          <span style={{ fontSize:10, color:dark?"#738496":"#626f86" }}>{timeAgoLocal(a.time)}</span>
                          <span style={{ fontSize:10, color:dark?"rgba(115,132,150,.6)":"rgba(98,111,134,.5)" }}>·</span>
                          <span style={{ fontSize:10, color:dark?"rgba(115,132,150,.6)":"rgba(98,111,134,.5)" }}>{fmtDateLocal(a.time)}</span>
                        </div>
                      </div>
                    </div>
                  ));
                })()}
              </div>
            </div>
          )}
        </div>,
        document.body
      )}
    </div>
  );
}
MemberAvatars.propTypes = { members:PropTypes.array, currentUserId:PropTypes.oneOfType([PropTypes.number,PropTypes.string]), dark:PropTypes.bool, boardId:PropTypes.oneOfType([PropTypes.number,PropTypes.string]), isShared:PropTypes.bool };

// ─────────────────────────────────────────────────────────────
//  ARCHIVE PANEL
// ─────────────────────────────────────────────────────────────
function ArchivePanel({ dark, boardId, t, onRestore }) {
  const [archives, setArchives] = useState(() => { try { return JSON.parse(localStorage.getItem(`kanbanku_archive_${boardId}`) || "[]"); } catch { return []; } });
  const deleteArchive = (idx) => { const next = archives.filter((_, i) => i !== idx); setArchives(next); try { localStorage.setItem(`kanbanku_archive_${boardId}`, JSON.stringify(next)); } catch { /* noop */ } };
  return (
    <div style={{ flex:1, display:"flex", flexDirection:"column" }}>
      <div style={{ padding:"10px 16px 8px", borderBottom:`1px solid ${t.border}` }}><p style={{ fontSize:12, color:t.muted }}>{archives.length === 0 ? "Belum ada kolom yang diarsipkan." : `${archives.length} kolom diarsipkan`}</p></div>
      <div style={{ flex:1, overflowY:"auto" }}>
        {archives.map((arch, idx) => (
          <div key={idx} style={{ padding:"12px 16px", borderBottom:`1px solid ${t.border}`, display:"flex", flexDirection:"column", gap:8 }}>
            <div style={{ minWidth:0 }}>
              <p style={{ fontSize:13, fontWeight:700, color:t.text, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>📋 {arch.name}</p>
              <p style={{ fontSize:11, color:t.muted, marginTop:2 }}>{arch.tasks?.length || 0} card • Diarsipkan {fmtDate(arch.archivedAt)}</p>
            </div>
            {arch.tasks?.slice(0, 2).map((task, ti) => (<div key={ti} style={{ fontSize:11, color:t.muted, padding:"4px 8px", background:t.surfaceAlt, borderRadius:5, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{typeof task.title === "string" ? task.title.replace(/<[^>]+>/g, "").slice(0, 40) : "—"}</div>))}
            {(arch.tasks?.length || 0) > 2 && <p style={{ fontSize:11, color:t.muted, fontStyle:"italic" }}>+{arch.tasks.length - 2} card lainnya...</p>}
            <div style={{ display:"flex", gap:6 }}>
              <button onClick={() => { onRestore(arch); deleteArchive(idx); }} style={{ flex:1, padding:"6px 10px", background:t.blue, color:"white", border:"none", borderRadius:7, fontSize:12, fontWeight:700, cursor:"pointer" }} onMouseEnter={e => (e.currentTarget.style.background=t.blueBright)} onMouseLeave={e => (e.currentTarget.style.background=t.blue)}>↩ Kembalikan</button>
              <button onClick={() => { if(window.confirm(`Hapus arsip "${arch.name}" permanen?`)) deleteArchive(idx); }} style={{ padding:"6px 10px", background:t.surfaceAlt, color:t.muted, border:`1px solid ${t.border}`, borderRadius:7, fontSize:12, cursor:"pointer" }} onMouseEnter={e => (e.currentTarget.style.color=t.red)} onMouseLeave={e => (e.currentTarget.style.color=t.muted)}>🗑</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
ArchivePanel.propTypes = { dark:PropTypes.bool, boardId:PropTypes.number, t:PropTypes.object, onRestore:PropTypes.func };

// ─────────────────────────────────────────────────────────────
//  MORE MENU
// ─────────────────────────────────────────────────────────────
function MoreMenu({ dark, onClose, activityLog, onBgChange, isPinned, onTogglePin, boardId, boardName, onRestoreArchive, canEdit }) {
  const t = useTheme(dark);
  const [tab, setTab] = useState("menu");
  const fileRef = useRef();

  // Menu items — some are edit-only
  const menuItems = [
    { icon:"/history_lightmode.png", iconDark:"/history.png",         label:"Aktivitas",         desc:"Log semua aktivitas",           action:()=>setTab("activity"), alwaysShow:true },
    { icon:"/photo-albumlight.png",  iconDark:"/photo-albumdark.png", label:"Change Background", desc:"Ubah gambar/warna latar",        action:()=>setTab("bg"),       alwaysShow:false },
    { icon:"/star-light.png",        iconDark:"/star-dark.png",       label:isPinned?"⭐ Lepas Pin":"Tandai Board", desc:isPinned?"Hapus dari daftar penting":"Pin board ke posisi teratas", action:()=>{ onTogglePin(); onClose(); }, alwaysShow:true },
    { icon:"/settings-light.png",    iconDark:"/settings-dark.png",   label:"Pengaturan Board",  desc:"Kelola preferensi board",       action:()=>setTab("settings"), alwaysShow:false },
    { icon:"📦",                      iconDark:"📦",                   label:"Kolom Terarsip",    desc:"Lihat & kembalikan kolom arsip", action:()=>setTab("archive"),  alwaysShow:false },
  ];

  // Filter: viewer only sees alwaysShow items
  const visibleItems = canEdit ? menuItems : menuItems.filter(i => i.alwaysShow);

  return (
    <>
      <div style={{ position:"fixed", inset:0, zIndex:149 }} onClick={onClose} />
      <div style={{ position:"fixed", right:0, top:52, bottom:0, width:280, background:t.surface, borderLeft:`1px solid ${t.border}`, zIndex:150, display:"flex", flexDirection:"column", boxShadow:"-8px 0 32px rgba(0,0,0,.18)", animation:"slideInRight .22s ease" }}>
        <div style={{ padding:"13px 16px", borderBottom:`1px solid ${t.border}`, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          {tab !== "menu" && <button onClick={() => setTab("menu")} style={{ background:"transparent", border:"none", cursor:"pointer", color:t.muted, fontSize:16, padding:"2px 6px" }}>←</button>}
          <span style={{ fontSize:13, fontWeight:700, color:t.text, flex:1, textAlign:tab!=="menu"?"center":"left" }}>{tab==="menu"?"Menu":tab==="activity"?"Aktivitas":tab==="bg"?"Background Board":tab==="settings"?"Pengaturan Board":"Kolom Terarsip"}</span>
          <button onClick={onClose} style={{ background:"transparent", border:"none", cursor:"pointer", color:t.muted, fontSize:18 }}>✕</button>
        </div>
        {tab === "menu" && (
          <div style={{ flex:1, overflowY:"auto", padding:"6px 0" }}>
            {visibleItems.map((item) => (
              <button key={item.label} onClick={item.action} style={{ width:"100%", display:"flex", alignItems:"center", gap:12, padding:"10px 16px", background:"transparent", border:"none", cursor:"pointer", textAlign:"left" }} onMouseEnter={(e) => (e.currentTarget.style.background=t.surfaceHover)} onMouseLeave={(e) => (e.currentTarget.style.background="transparent")}>
                <div style={{ width:20, display:"flex", justifyContent:"center" }}>{(() => { const iconSrc = (item.iconDark && dark) ? item.iconDark : item.icon; if (typeof iconSrc === "string" && iconSrc.includes(".")) return <img src={iconSrc} alt="" style={{ width:18 }} />; return <span style={{ fontSize:16 }}>{iconSrc}</span>; })()}</div>
                <div><p style={{ fontSize:13, fontWeight:600, color:t.text, marginBottom:1 }}>{item.label}</p><p style={{ fontSize:11, color:t.muted }}>{item.desc}</p></div>
              </button>
            ))}
          </div>
        )}
        {tab === "activity" && (
          <div style={{ flex:1, overflowY:"auto", padding:"12px 16px" }}>
            {!activityLog?.length ? <p style={{ fontSize:12, color:t.muted, textAlign:"center", paddingTop:20 }}>Belum ada aktivitas</p> : activityLog.map((a) => (
              <div key={a.id} style={{ display:"flex", gap:10, marginBottom:14 }}>
                <div style={{ width:28, height:28, borderRadius:"50%", background:t.blueLight, display:"flex", alignItems:"center", justifyContent:"center", color:t.blue, fontSize:10, fontWeight:700, flexShrink:0 }}>{a.user?.[0]?.toUpperCase()||"?"}</div>
                <div><p style={{ fontSize:12, color:t.text, lineHeight:1.4 }}><b>{a.user}</b> {a.action}</p><p style={{ fontSize:10, color:t.muted, marginTop:2 }}>{fmtDate(a.time)}</p></div>
              </div>
            ))}
          </div>
        )}
        {tab === "archive" && canEdit && (<ArchivePanel dark={dark} boardId={boardId} t={t} onRestore={(archived) => { if (onRestoreArchive) { onRestoreArchive(archived); setTab("menu"); } }} />)}
        {tab === "settings" && canEdit && (
          <div style={{ flex:1, padding:"12px 16px", overflowY:"auto" }}>
            <p style={{ fontSize:12, color:t.muted, marginBottom:12 }}>Pengaturan untuk board <b style={{ color:t.text }}>{boardName}</b></p>
            {[{ label:"Notifikasi aktivitas", desc:"Dapat notif saat ada perubahan", key:`kanbanku_board_notif_${boardId}` },{ label:"Auto-simpan urutan", desc:"Simpan urutan kolom & card otomatis", key:`kanbanku_board_autosave_${boardId}` },{ label:"Tampilkan completed", desc:"Tampilkan card yang sudah selesai", key:`kanbanku_board_show_done_${boardId}` }].map(opt => {
              const val = (() => { try { return JSON.parse(localStorage.getItem(opt.key) ?? "true"); } catch { return true; } })();
              return (
                <div key={opt.key} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"10px 0", borderBottom:`1px solid ${t.border}` }}>
                  <div><p style={{ fontSize:13, color:t.text, fontWeight:500 }}>{opt.label}</p><p style={{ fontSize:11, color:t.muted }}>{opt.desc}</p></div>
                  <button onClick={() => { localStorage.setItem(opt.key, JSON.stringify(!val)); onClose(); setTimeout(()=>window.location.reload(),100); }} style={{ width:38, height:22, borderRadius:99, background:val?t.blue:"rgba(128,128,128,.3)", border:"none", cursor:"pointer", position:"relative", flexShrink:0, transition:"background .2s" }}><span style={{ position:"absolute", top:3, left:val?18:3, width:16, height:16, borderRadius:"50%", background:"white", transition:"left .2s", boxShadow:"0 1px 4px rgba(0,0,0,.2)" }} /></button>
                </div>
              );
            })}
            <p style={{ fontSize:11, color:t.muted, marginTop:12 }}>ID Board: {boardId}</p>
          </div>
        )}
        {tab === "bg" && canEdit && (
          <div style={{ flex:1, padding:16, display:"flex", flexDirection:"column", gap:12 }}>
            <p style={{ fontSize:12, color:t.muted, lineHeight:1.6 }}>Pilih gambar atau warna untuk background board.</p>
            <input ref={fileRef} type="file" accept="image/*" style={{ display:"none" }} onChange={(e) => { const f=e.target.files?.[0]; if(f){onBgChange(URL.createObjectURL(f));setTab("menu");onClose();}}} />
            <button onClick={() => fileRef.current?.click()} style={{ padding:"11px", background:t.blue, color:"white", border:"none", borderRadius:9, fontSize:13, fontWeight:700, cursor:"pointer" }}>🖼️ Upload Gambar dari Laptop</button>
            <button onClick={() => { onBgChange(null); setTab("menu"); onClose(); }} style={{ padding:"9px", background:"transparent", border:`1px solid ${t.border}`, borderRadius:9, fontSize:13, color:t.muted, cursor:"pointer" }}>✕ Reset Background</button>
            <div>
              <p style={{ fontSize:11, fontWeight:700, color:t.muted, marginBottom:8, textTransform:"uppercase", letterSpacing:.5 }}>Pilih Warna</p>
              <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
                {["#0d1929","#1e293b","#14532d","#164e63","#4c1d95","#7f1d1d","#78350f","#1e3a5f","#0f172a","#1a2e05"].map((c) => (<button key={c} onClick={() => { onBgChange(c); setTab("menu"); onClose(); }} style={{ width:36, height:36, borderRadius:8, background:c, border:`2px solid ${t.border}`, cursor:"pointer", transition:"transform .15s" }} onMouseEnter={(e) => (e.currentTarget.style.transform="scale(1.1)")} onMouseLeave={(e) => (e.currentTarget.style.transform="scale(1)")} />))}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
MoreMenu.propTypes = { dark:PropTypes.bool, onClose:PropTypes.func, activityLog:PropTypes.array, onBgChange:PropTypes.func, isPinned:PropTypes.bool, onTogglePin:PropTypes.func, boardId:PropTypes.number, boardName:PropTypes.string, onRestoreArchive:PropTypes.func, canEdit:PropTypes.bool };

// ─────────────────────────────────────────────────────────────
//  BOARD MAIN
// ─────────────────────────────────────────────────────────────
export default function BoardMain({ boardId, dark, onBack }) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const t = useTheme(dark);

  const [activeTask, setActiveTask] = useState(null);
  const [activeTaskCol, setActiveTaskCol] = useState("");
  const [showShare, setShowShare] = useState(false);
  const [showMore, setShowMore] = useState(false);
  const [showFormat, setShowFormat] = useState(false);
  const [addingCol, setAddingCol] = useState(false);
  const [newColName, setNewColName] = useState("");
  const [clipboard, setClipboard] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [showNotif, setShowNotif] = useState(false);
  const [activeTab, setActiveTab] = useState("board");
  const [activeDragData, setActiveDragData] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [realtimeToast, setRealtimeToast] = useState(null);
  const [showViewerBadge, setShowViewerBadge] = useState(false);

  const notifRef = useRef();
  const canvasRef = useRef();
  const lastLocalDrag = useRef(0);
  const toastTimerRef = useRef(null);
  const viewerBadgeTimer = useRef(null);
  const unreadCount = notifications.filter(n => !n.read).length;

  const LS_AVATAR = "kanbanku_profile_avatar";
  const readAvatar = () => { try { const raw = localStorage.getItem(LS_AVATAR); if (!raw) return null; try { return JSON.parse(raw); } catch { return raw; } } catch { return null; } };
  const [avatarUrl, setAvatarUrl] = useState(readAvatar);
  useEffect(() => {
    const sync = () => setAvatarUrl(readAvatar());
    window.addEventListener("storage", sync);
    window.addEventListener("kanbanku_avatar_updated", sync);
    return () => { window.removeEventListener("storage", sync); window.removeEventListener("kanbanku_avatar_updated", sync); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const PIN_KEY = "kanbanku_pinned_boards";
  const [isPinned, setIsPinned] = useState(() => { try { return JSON.parse(localStorage.getItem(PIN_KEY)||"[]").includes(boardId); } catch { return false; } });
  const togglePin = () => {
    try { const pins = JSON.parse(localStorage.getItem(PIN_KEY)||"[]"); const next = isPinned ? pins.filter(id => id !== boardId) : [...pins, boardId]; localStorage.setItem(PIN_KEY, JSON.stringify(next)); setIsPinned(!isPinned); } catch { /* noop */ }
  };

  const LOG_KEY = `kanbanku_activity_${boardId}`;
  const [activityLog, setActivityLog] = useState(() => { try { const s = localStorage.getItem(LOG_KEY); return s ? JSON.parse(s) : []; } catch { return []; } });

  const { data: serverActivity } = useQuery({
    queryKey: ["board-activity", boardId],
    queryFn: () => api.get(`/boards/${boardId}/activity`).then(r => r.data || []),
    enabled: !!boardId,
    refetchInterval: 15000,
  });

  const mergedActivity = useMemo(() => {
    const serverIds = new Set((serverActivity || []).map(a => String(a.id)));
    const localOnly = activityLog.filter(a => !serverIds.has(String(a.id)));
    return [...(serverActivity || []), ...localOnly].sort((a, b) => new Date(b.time||b.created_at) - new Date(a.time||a.created_at)).slice(0, 200);
  }, [serverActivity, activityLog]);

  const BG_KEY = `kanbanku_board_bg_${boardId}`;
  const [boardBg, setBoardBgState] = useState(() => { try { return localStorage.getItem(BG_KEY) || null; } catch { return null; } });
  const setBoardBg = useCallback((val) => { setBoardBgState(val); try { if(val) localStorage.setItem(BG_KEY,val); else localStorage.removeItem(BG_KEY); } catch { /* noop */ } }, [BG_KEY]);

  const COMPLETED_KEY = `kanbanku_completed_${boardId}`;
  const [completedIds, setCompletedIds] = useState(() => { try { const s = localStorage.getItem(COMPLETED_KEY); return s ? new Set(JSON.parse(s)) : new Set(); } catch { return new Set(); } });
  const saveCompletedIds = useCallback((newSet) => { setCompletedIds(newSet); try { localStorage.setItem(COMPLETED_KEY, JSON.stringify([...newSet])); } catch { /* noop */ } }, [COMPLETED_KEY]);

  const COL_ORDER_KEY = `kanbanku_col_order_${boardId}`;
  const [persistedColOrder, setPersistedColOrder] = useState(() => { try { const s = localStorage.getItem(COL_ORDER_KEY); return s ? JSON.parse(s) : null; } catch { return null; } });
  const saveColOrder = useCallback((colIds) => { setPersistedColOrder(colIds); try { localStorage.setItem(COL_ORDER_KEY, JSON.stringify(colIds)); } catch { /* noop */ } }, [COL_ORDER_KEY]);

  const CARD_ORDER_KEY = `kanbanku_card_order_${boardId}`;
  const [persistedCardOrder, setPersistedCardOrder] = useState(() => { try { const s = localStorage.getItem(CARD_ORDER_KEY); return s ? JSON.parse(s) : {}; } catch { return {}; } });
  const saveAllCardOrders = useCallback((colsSnapshot) => {
    const next = {};
    (colsSnapshot || []).forEach(col => { if (col.tasks?.length) next[col.id] = col.tasks.map(tk => tk.id); });
    setPersistedCardOrder(next);
    try { localStorage.setItem(CARD_ORDER_KEY, JSON.stringify(next)); } catch { /* noop */ }
  }, [CARD_ORDER_KEY]);

  const pushNotif = useCallback((msg) => { if (Notification.permission === "granted") new Notification("KanbanKu", { body:msg, icon:"/favicon.ico" }); }, []);

  const log = useCallback((action) => {
    const entry = { id:Date.now(), user:user?.name||"?", action, time:new Date().toISOString() };
    setActivityLog(prev => { const next = [entry, ...prev].slice(0, 200); try { localStorage.setItem(LOG_KEY, JSON.stringify(next)); } catch { /* noop */ } return next; });
    setNotifications(p => [{ ...entry, read:false }, ...p.slice(0,49)]);
    pushNotif(`${user?.name||"?"} ${action}`);
    api.post(`/boards/${boardId}/activity`, { action, user_name:user?.name }).catch(()=>{});
  }, [user, pushNotif, LOG_KEY, boardId]);

  useRealtimeBoard({
    boardId,
    currentUserId: user?.id,
    onNotification: (notif) => {
      setNotifications(prev => [notif, ...prev.slice(0, 49)]);
      if (notif._realtime) { clearTimeout(toastTimerRef.current); setRealtimeToast(notif); toastTimerRef.current = setTimeout(() => setRealtimeToast(null), 3500); }
    },
    onActivityLog: (entry) => { setActivityLog(prev => { const next = [entry, ...prev].slice(0, 200); try { localStorage.setItem(LOG_KEY, JSON.stringify(next)); } catch { /* noop */ } return next; }); },
    onPresenceChange: (users) => { setOnlineUsers(Array.isArray(users) ? users : []); },
  });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint:{ distance:3 } }),
    useSensor(KeyboardSensor),
  );

  const { data:board, isLoading } = useQuery({
    queryKey: ["board-detail", boardId],
    queryFn: () => api.get(`/boards/${boardId}`).then(r => r.data),
    enabled: !!boardId,
    refetchOnWindowFocus: false,
    refetchInterval: false,
    staleTime: Infinity,
  });

  useEffect(() => { if ("Notification" in window && Notification.permission === "default") Notification.requestPermission(); }, []);

  useEffect(() => {
    if (!showNotif) return;
    const fn = (e) => { if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotif(false); };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, [showNotif]);

  useEffect(() => {
    const fn = (e) => {
      if ((e.ctrlKey||e.metaKey) && e.key==="v" && clipboard && board?.columns?.length) {
        if (!canEdit) return; // viewer cannot paste
        const col = board.columns[0];
        api.post(`/columns/${col.id}/tasks`, { title:`${clipboard.title} (salinan)`, priority:clipboard.priority||"medium", description:clipboard.description||"" }).then(() => { qc.invalidateQueries(["board-detail"]); log(`menyalin card "${clipboard.title}"`); });
      }
    };
    document.addEventListener("keydown", fn);
    return () => document.removeEventListener("keydown", fn);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clipboard, board, qc, log]);

  const addColumn = useMutation({
    mutationFn: (name) => api.post(`/boards/${boardId}/columns`, { name }),
    onSuccess: () => { qc.invalidateQueries(["board-detail"]); setAddingCol(false); setNewColName(""); },
  });

  const moveTask = useMutation({
    mutationFn: ({ taskId, columnId, position }) => api.put(`/tasks/${taskId}/move`, { column_id:columnId, position }).catch(()=>{}),
    onMutate: async ({ taskId, columnId, position }) => {
      await qc.cancelQueries({ queryKey:["board-detail", boardId] });
      const previous = qc.getQueryData(["board-detail", boardId]);
      let newColsSnapshot = null;
      qc.setQueryData(["board-detail", boardId], (old) => {
        if (!old) return old;
        let movedTask = null;
        const colsWithoutTask = old.columns.map(col => { const idx = (col.tasks||[]).findIndex(tk => tk.id === taskId); if (idx !== -1) { movedTask = col.tasks[idx]; return { ...col, tasks:col.tasks.filter(tk => tk.id !== taskId) }; } return col; });
        if (!movedTask) return old;
        const newCols = colsWithoutTask.map(col => { if (col.id !== columnId) return col; const newTasks = [...(col.tasks||[])]; newTasks.splice(Math.min(position, newTasks.length), 0, movedTask); return { ...col, tasks:newTasks }; });
        newColsSnapshot = newCols;
        return { ...old, columns:newCols };
      });
      if (newColsSnapshot) saveAllCardOrders(newColsSnapshot);
      return { previous };
    },
    onError: (_, __, ctx) => { if (ctx?.previous) qc.setQueryData(["board-detail", boardId], ctx.previous); },
    onSuccess: () => { /* silent */ },
  });

  const deleteTask = useMutation({
    mutationFn: (taskId) => api.delete(`/tasks/${taskId}`),
    onSuccess: () => qc.invalidateQueries(["board-detail"]),
  });

  const reorderCols = useMutation({
    mutationFn: ({ bId, colIds }) => api.put(`/boards/${bId}/columns/reorder`, { columns:colIds }),
    onMutate: async ({ colIds }) => {
      await qc.cancelQueries({ queryKey:["board-detail", boardId] });
      const previous = qc.getQueryData(["board-detail", boardId]);
      qc.setQueryData(["board-detail", boardId], (old) => { if (!old) return old; const colMap = Object.fromEntries(old.columns.map(c => [c.id,c])); return { ...old, columns:colIds.map(id => colMap[id]).filter(Boolean) }; });
      saveColOrder(colIds);
      return { previous };
    },
    onError: (_, __, ctx) => { if (ctx?.previous) qc.setQueryData(["board-detail", boardId], ctx.previous); },
  });

  const handleToggleComplete = useCallback((taskId, done) => {
    const newSet = new Set(completedIds);
    if (done) newSet.add(taskId); else newSet.delete(taskId);
    saveCompletedIds(newSet);
    api.put(`/tasks/${taskId}`, { is_completed:done }).catch(()=>{});
    const title = board?.columns?.flatMap(c=>c.tasks||[]).find(tk=>tk.id===taskId)?.title || "card";
    log(done ? `menandai "${stripHtml(title)}" sebagai selesai` : `membatalkan selesai pada "${stripHtml(title)}"`);
  }, [board, completedIds, saveCompletedIds, log]);

  const orderedBoard = useCallback(() => {
    if (!board) return board;
    let cols = board.columns || [];
    const justDragged = (Date.now() - lastLocalDrag.current) < 5000;
    if (justDragged && persistedColOrder?.length) {
      const colMap = Object.fromEntries(cols.map(c => [c.id, c]));
      const ordered = persistedColOrder.map(id => colMap[id]).filter(Boolean);
      const persistedSet = new Set(persistedColOrder);
      cols = [...ordered, ...cols.filter(c => !persistedSet.has(c.id))];
    }
    if (justDragged && persistedCardOrder && Object.keys(persistedCardOrder).length) {
      cols = cols.map(col => {
        const savedOrder = persistedCardOrder[col.id];
        if (!savedOrder?.length) return col;
        const taskMap = Object.fromEntries((col.tasks || []).map(tk => [tk.id, tk]));
        const ordered = savedOrder.map(id => taskMap[id]).filter(Boolean);
        const orderedIds = new Set(savedOrder);
        return { ...col, tasks: [...ordered, ...(col.tasks || []).filter(tk => !orderedIds.has(tk.id))] };
      });
    }
    return { ...board, columns: cols };
  }, [board, persistedColOrder, persistedCardOrder]);

  const handleMoveCard = useCallback((taskId, toColId) => {
    const cb = orderedBoard();
    const toCol = cb?.columns?.find(c=>c.id===toColId);
    moveTask.mutate({ taskId, columnId:toColId, position:toCol?.tasks?.length||0 });
    const name = cb?.columns?.flatMap(c=>c.tasks||[]).find(tk=>tk.id===taskId)?.title || "card";
    log(`memindahkan "${stripHtml(name)}" → ${toCol?.name}`);
  }, [orderedBoard, moveTask, log]);

  // ── Show viewer badge briefly when viewer tries to drag ──
  const flashViewerBadge = useCallback(() => {
    setShowViewerBadge(true);
    clearTimeout(viewerBadgeTimer.current);
    viewerBadgeTimer.current = setTimeout(() => setShowViewerBadge(false), 2800);
  }, []);

  const handleDragStart = useCallback((event) => {
    // Block drag for viewers
    if (!canEdit) { flashViewerBadge(); return; }
    const id = String(event.active.id);
    const cb = orderedBoard();
    if (id.startsWith("col-")) {
      const colId = Number(id.replace("col-",""));
      setActiveDragData({ type:"column", column:cb?.columns?.find(c=>c.id===colId) });
    } else {
      const taskId = Number(id.replace("card-",""));
      let foundTask = null, foundColIdx = 0;
      cb?.columns?.forEach((col,idx) => { const task = col.tasks?.find(tk=>tk.id===taskId); if (task) { foundTask=task; foundColIdx=idx; } });
      setActiveDragData({ type:"card", task:foundTask, colIndex:foundColIdx });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderedBoard, flashViewerBadge]);

  const handleDragEnd = useCallback((event) => {
    if (!canEdit) { setActiveDragData(null); return; }
    lastLocalDrag.current = Date.now();
    const { active, over } = event;
    setActiveDragData(null);
    if (!over || active.id===over.id) return;
    const activeId = String(active.id);
    const overId = String(over.id);
    const cb = orderedBoard();

    if (activeId.startsWith("col-")) {
      const fromColId = Number(activeId.replace("col-", ""));
      if (!overId.startsWith("col-")) return;
      const toColId = Number(overId.replace("col-", ""));
      if (!toColId || fromColId === toColId) return;
      const cols = cb?.columns || [];
      const oldIdx = cols.findIndex(c => c.id === fromColId);
      const newIdx = cols.findIndex(c => c.id === toColId);
      if (oldIdx === -1 || newIdx === -1) return;
      const reordered = arrayMove(cols, oldIdx, newIdx);
      reorderCols.mutate({ bId: boardId, colIds: reordered.map(c => c.id) });
      log(`memindahkan kolom "${cols[oldIdx].name}" ke posisi ${newIdx + 1}`);
      return;
    }

    const taskId = Number(activeId.replace("card-", ""));
    let fromCol = null;
    cb?.columns?.forEach(col => { if (col.tasks?.find(tk => tk.id === taskId)) fromCol = col; });
    if (!fromCol) return;

    let toCol = null, toPosition = 0;
    if (overId.startsWith("col-")) {
      toCol = cb?.columns?.find(c => c.id === Number(overId.replace("col-", "")));
      toPosition = toCol?.tasks?.length || 0;
    } else if (overId.startsWith("droppable-col-")) {
      toCol = cb?.columns?.find(c => c.id === Number(overId.replace("droppable-col-", "")));
      toPosition = toCol?.tasks?.length || 0;
    } else {
      const overTaskId = Number(overId.replace("card-", ""));
      cb?.columns?.forEach(col => { if (col.tasks?.find(tk => tk.id === overTaskId)) toCol = col; });
      if (!toCol) return;
      const tasks = toCol.tasks || [];
      const overIdx = tasks.findIndex(tk => tk.id === overTaskId);
      toPosition = overIdx === -1 ? tasks.length : overIdx;
      if (fromCol.id === toCol.id) { const fromIdx = tasks.findIndex(tk => tk.id === taskId); if (fromIdx !== -1) toPosition = overIdx; }
    }
    if (!toCol) return;
    moveTask.mutate({ taskId, columnId: toCol.id, position: toPosition });
    if (fromCol.id !== toCol.id) {
      const taskTitle = fromCol.tasks?.find(tk => tk.id === taskId)?.title || "card";
      log(`memindahkan "${stripHtml(taskTitle)}" dari "${fromCol.name}" → "${toCol.name}"`);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderedBoard, boardId, moveTask, reorderCols, log]);

  const handleRestoreArchive = (archived) => {
    if (!archived) return;
    addColumn.mutate(archived.name, {
      onSuccess: (res) => {
        const newColId = res?.data?.id;
        if (!newColId) return;
        (archived.tasks||[]).forEach(task => { api.post(`/columns/${newColId}/tasks`, { title:task.title, priority:task.priority||"medium", description:task.description||"" }).catch(()=>{}); });
        qc.invalidateQueries(["board-detail"]);
        log(`mengembalikan kolom "${archived.name}" dari arsip`);
      },
    });
  };

  const displayBoard = orderedBoard();
  const members = displayBoard?.members || [];
  const allColumns = displayBoard?.columns || [];
  const isShared = members.length > 1;

  // ── Role-based permissions ──────────────────────────────────
  const currentUserRole = (() => {
    if (!displayBoard || !user) return "viewer";
    if (displayBoard.owner_id === user.id) return "owner";
    const member = displayBoard.members?.find(m => String(m.id) === String(user.id));
    return member?.pivot?.role || "viewer";
  })();

  // Access guard — if user is not in member list AND not owner, they have no access
  const hasAccess = (() => {
    if (!displayBoard || !user) return true; // still loading
    if (displayBoard.owner_id === user.id) return true;
    const member = displayBoard.members?.find(m => String(m.id) === String(user.id));
    return !!member; // must be explicitly in members list
  })();

  const canEdit = currentUserRole === "owner" || currentUserRole === "member";
  const isOwner = currentUserRole === "owner";
  // Editor can view share modal but cannot invite — only owner can invite/remove
  const canShare = canEdit; // editor & owner can open share modal
  // Only owner can invite/remove members
  const canInvite = isOwner;

  const boardBgStyle = boardBg
    ? (boardBg.startsWith("#")||boardBg.startsWith("rgb")) ? { background:boardBg } : { backgroundImage:`url(${boardBg})`, backgroundSize:"cover", backgroundPosition:"center" }
    : { background:t.boardBg };

  if (isLoading || !boardId)
    return (
      <div style={{ position:"fixed", inset:0, zIndex:9999, display:"flex", alignItems:"center", justifyContent:"center", background:t.boardBg }}>
        <div style={{ color:t.muted, fontSize:14, display:"flex", flexDirection:"column", alignItems:"center", gap:12 }}>
          <div style={{ width:32, height:32, borderRadius:"50%", border:`3px solid ${t.blue}`, borderTopColor:"transparent", animation:"spin 1s linear infinite" }} />
          Memuat board...
        </div>
      </div>
    );

  // ── Access denied screen ────────────────────────────────────
  if (!hasAccess) {
    return <AccessDeniedScreen dark={dark} onBack={onBack} />;
  }

  return (
    <div style={{ flex:1, minHeight:0, display:"flex", flexDirection:"column", overflow:"hidden", position:"relative", fontFamily:"'DM Sans',sans-serif", ...boardBgStyle }}>
      {/* ── NAVBAR ── */}
      <div style={{ padding:"0 16px", background:dark?"rgba(15,23,42,0.97)":"rgba(255,255,255,0.97)", backdropFilter:"blur(12px)", WebkitBackdropFilter:"blur(12px)", borderBottom:`1px solid ${t.border}`, display:"flex", alignItems:"center", justifyContent:"space-between", height:52, flexShrink:0, gap:8, position:"relative", zIndex:10 }}>
        <div style={{ display:"flex", alignItems:"center", gap:10, minWidth:0 }}>
          <button onClick={onBack} style={{ background:"transparent", border:"none", cursor:"pointer", color:t.muted, fontSize:18, padding:"4px 6px", borderRadius:6, display:"flex", alignItems:"center", flexShrink:0 }} onMouseEnter={(e) => { e.currentTarget.style.color=t.blue; e.currentTarget.style.background=t.blueLight; }} onMouseLeave={(e) => { e.currentTarget.style.color=t.muted; e.currentTarget.style.background="transparent"; }}>←</button>
          <h2 className="kb-nav-title-text" style={{ fontSize:15, fontWeight:800, color:t.text, fontFamily:"'Sora',sans-serif", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", maxWidth:200 }}>{displayBoard?.name}</h2>
          {/* {isShared ? (
            // <span className="kb-nav-badge" style={{ fontSize:11, padding:"2px 8px", borderRadius:5, background:"rgba(22,163,74,.15)", color:"#16a34a", fontWeight:600, whiteSpace:"nowrap" }}>👥 Shared · {members.length} anggota</span>
          ) : (
            <span className="kb-nav-badge" style={{ fontSize:11, padding:"2px 8px", borderRadius:5, background:t.blueLight, color:t.blue, fontWeight:600, whiteSpace:"nowrap" }}>🔒 Private</span>
          )} */}
          {/* Viewer role badge in navbar */}
          {!canEdit && (
            <span className="kb-nav-badge" style={{ fontSize:11, padding:"2px 8px", borderRadius:5, background:dark?"rgba(245,158,11,.15)":"#fffbeb", color:dark?"#fde68a":"#92400e", fontWeight:600, whiteSpace:"nowrap", border:`1px solid ${dark?"rgba(245,158,11,.3)":"#fde68a"}` }}>
              👁 View Only
            </span>
          )}
          {clipboard && canEdit && (<span style={{ fontSize:11, padding:"2px 8px", borderRadius:5, background:"rgba(217,119,6,.15)", color:"#d97706", fontWeight:600, display:"flex", alignItems:"center", gap:4, whiteSpace:"nowrap" }}>📋 Ctrl+V<button onClick={() => setClipboard(null)} style={{ background:"transparent", border:"none", cursor:"pointer", color:"#d97706", fontSize:13, padding:0 }}>✕</button></span>)}
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:6, flexShrink:0 }}>
          <OnlineIndicator users={onlineUsers} currentUserId={user?.id} />
          <MemberAvatars members={members} currentUserId={user?.id} dark={dark} boardId={boardId} isShared={isShared} />
          <div title={`${user?.name} (${user?.email})`} style={{ width:30, height:30, borderRadius:"50%", overflow:"hidden", flexShrink:0, cursor:"default", border:"2px solid rgba(255,255,255,.3)", background:avatarUrl?"transparent":`linear-gradient(135deg,${t.blue},#7c3aed)`, display:"flex", alignItems:"center", justifyContent:"center", color:"white", fontSize:12, fontWeight:700 }}>
            {avatarUrl ? <img src={avatarUrl} alt={user?.name} style={{ width:"100%", height:"100%", objectFit:"cover" }} /> : user?.name?.[0]?.toUpperCase()}
          </div>
          <div ref={notifRef} style={{ position:"relative" }}>
            <button onClick={() => { setShowNotif(!showNotif); setShowMore(false); setShowFormat(false); }} style={{ background:showNotif?t.blueLight:"transparent", border:`1px solid ${showNotif?t.blue:t.border}`, borderRadius:8, width:36, height:36, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", color:showNotif?t.blue:t.muted, transition:"all .18s", position:"relative" }} onMouseEnter={(e) => { e.currentTarget.style.background=t.blueLight; e.currentTarget.style.color=t.blue; e.currentTarget.style.borderColor=t.blue; }} onMouseLeave={(e) => { e.currentTarget.style.background=showNotif?t.blueLight:"transparent"; e.currentTarget.style.color=showNotif?t.blue:t.muted; e.currentTarget.style.borderColor=showNotif?t.blue:t.border; }}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
              {unreadCount > 0 && (<span style={{ position:"absolute", top:4, right:4, width:16, height:16, borderRadius:"50%", background:t.red, color:"white", fontSize:9, fontWeight:700, display:"flex", alignItems:"center", justifyContent:"center" }}>{unreadCount>9?"9+":unreadCount}</span>)}
            </button>
            {showNotif && createPortal(
              <div style={{ position:"fixed", top:notifRef.current?notifRef.current.getBoundingClientRect().bottom+8:60, right:8, width:320, background:t.surface, border:`1px solid ${t.border}`, borderRadius:14, boxShadow:"0 16px 40px rgba(0,0,0,.3)", zIndex:99999, overflow:"hidden", animation:"dropIn .18s ease" }}>
                <div style={{ padding:"14px 16px 10px", borderBottom:`1px solid ${t.border}`, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                  <span style={{ fontSize:14, fontWeight:700, color:t.text }}>🔔 Notifikasi</span>
                  {notifications.some(n => !n.read) && (<button onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); setNotifications(prev => prev.map(n => ({ ...n, read:true }))); }} style={{ fontSize:11, color:t.blue, background:"transparent", border:"none", cursor:"pointer", fontWeight:600 }}>Tandai semua dibaca</button>)}
                </div>
                {!notifications.length ? (
                  <div style={{ padding:"24px 16px", textAlign:"center", color:t.muted }}><div style={{ fontSize:32, marginBottom:8 }}>🔔</div><p style={{ fontSize:13 }}>Belum ada notifikasi</p></div>
                ) : (
                  <div style={{ maxHeight:360, overflowY:"auto" }}>
                    {notifications.map(n => (
                      <div key={n.id} onClick={() => setNotifications(p=>p.map(x=>x.id===n.id?{...x,read:true}:x))} style={{ padding:"10px 16px", borderBottom:`1px solid ${t.border}`, cursor:"pointer", background:n.read?"transparent":t.blueLight }} onMouseEnter={(e) => (e.currentTarget.style.background=t.surfaceHover)} onMouseLeave={(e) => (e.currentTarget.style.background=n.read?"transparent":t.blueLight)}>
                        <div style={{ display:"flex", gap:10, alignItems:"flex-start" }}>
                          <div style={{ width:26, height:26, borderRadius:"50%", background:t.blue, display:"flex", alignItems:"center", justifyContent:"center", color:"white", fontSize:10, fontWeight:700, flexShrink:0 }}>{n.user?.[0]?.toUpperCase()}</div>
                          <div style={{ flex:1 }}><p style={{ fontSize:12, color:t.text, lineHeight:1.4 }}><b>{n.user}</b> {n.action}</p><p style={{ fontSize:10, color:t.muted, marginTop:2 }}>{timeAgo(n.time)}</p></div>
                          {!n.read && <span style={{ width:8, height:8, borderRadius:"50%", background:t.blue, flexShrink:0, marginTop:4 }} />}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>,
              document.body
            )}
          </div>

          {/* Format button — hidden for viewer */}
          {canEdit && (
            <button className="kb-format-btn" onMouseDown={(e) => e.preventDefault()} onClick={() => { setShowFormat(!showFormat); setShowMore(false); setShowNotif(false); }} style={{ display:"flex", alignItems:"center", gap:5, padding:"5px 10px", background:showFormat?t.blueLight:"transparent", border:`1px solid ${showFormat?t.blue:t.border}`, borderRadius:6, fontSize:13, fontWeight:600, color:showFormat?t.blue:t.muted, cursor:"pointer" }} onMouseEnter={(e) => { e.currentTarget.style.background=t.blueLight; e.currentTarget.style.borderColor=t.blue; e.currentTarget.style.color=t.blue; }} onMouseLeave={(e) => { if(!showFormat){e.currentTarget.style.background="transparent";e.currentTarget.style.borderColor=t.border;e.currentTarget.style.color=t.muted;} }}><b>A</b><span className="kb-format-label"> Format</span></button>
          )}

          {/* Share button — visible for editor & owner, but viewer sees read-only version */}
          <button
            className="kb-share-btn"
            onClick={() => setShowShare(true)}
            style={{ display:"flex", alignItems:"center", gap:5, background:canShare?t.blue:t.surfaceAlt, color:canShare?"white":t.muted, border:canShare?"none":`1px solid ${t.border}`, borderRadius:6, padding:"8px 14px", fontSize:13, fontWeight:700, cursor:"pointer" }}
            onMouseEnter={(e) => { if(canShare){e.currentTarget.style.background=t.blueBright;e.currentTarget.style.transform="translateY(-1px)";} }}
            onMouseLeave={(e) => { if(canShare){e.currentTarget.style.background=t.blue;e.currentTarget.style.transform="none";} }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>
            <span className="share-label">{canShare ? "Bagikan" : "Anggota"}</span>
          </button>

          <button className="kb-more-btn" onClick={() => { setShowMore(v=>!v); setShowFormat(false); setShowNotif(false); }} style={{ display:"flex", alignItems:"center", gap:4, padding:"5px 10px", background:showMore?t.blueLight:"transparent", border:`1px solid ${showMore?t.blue:t.border}`, borderRadius:6, fontSize:13, fontWeight:600, color:showMore?t.blue:t.muted, cursor:"pointer" }} onMouseEnter={(e) => { e.currentTarget.style.background=t.blueLight; e.currentTarget.style.borderColor=t.blue; e.currentTarget.style.color=t.blue; }} onMouseLeave={(e) => { if(!showMore){e.currentTarget.style.background="transparent";e.currentTarget.style.borderColor=t.border;e.currentTarget.style.color=t.muted;} }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>
            <span>Lainnya</span>
          </button>
        </div>
      </div>

      {/* ── KANBAN CANVAS ── */}
      <DndContext
        sensors={sensors}
        collisionDetection={rectIntersection}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        autoScroll={{ enabled: canEdit, speed:8 }}
      >
        <SortableContext items={allColumns.map(c=>`col-${c.id}`)} strategy={horizontalListSortingStrategy}>
          <div ref={canvasRef} className="kb-canvas" style={{ flex:1, minHeight:0, paddingLeft:24, paddingRight:24, width:"100%", minWidth:0, boxSizing:"border-box" }}>
            {allColumns.map((col, idx) => (
              <SortableColumn
                key={col.id} column={col} dark={dark} colIndex={idx} allColumns={allColumns}
                canEdit={canEdit}
                onTaskClick={(task, colName) => { setActiveTask(task); setActiveTaskCol(colName); }}
                onMoveCard={canEdit ? handleMoveCard : () => {}}
                onCopyCard={canEdit ? (task) => { setClipboard(task); log(`menyalin card "${stripHtml(task.title)}"`); } : () => {}}
                onDeleteCard={canEdit ? (taskId) => { deleteTask.mutate(taskId); log("menghapus sebuah card"); } : () => {}}
                onToggleComplete={canEdit ? handleToggleComplete : () => {}}
                completedIds={completedIds}
                boardId={boardId}
                onLog={log}
              />
            ))}
            {/* Add list button — only for editor/owner */}
            {canEdit && (
              <div className="kb-add-list-btn" style={{ width:272, flexShrink:0, alignSelf:"flex-start" }}>
                {addingCol ? (
                  <div style={{ background:dark?"rgba(15,25,41,.97)":"rgba(255,255,255,.97)", backdropFilter:"blur(8px)", border:`2px solid ${t.blue}`, borderRadius:10, padding:12 }}>
                    <input autoFocus value={newColName} onChange={(e) => setNewColName(e.target.value)} placeholder="Nama kolom baru..."
                      onKeyDown={(e) => { if(e.key==="Enter"&&newColName.trim()) addColumn.mutate(newColName); if(e.key==="Escape") setAddingCol(false); }}
                      style={{ width:"100%", padding:"8px 10px", border:`1px solid ${t.border}`, borderRadius:7, fontSize:13, background:t.surfaceAlt, color:t.text, outline:"none", marginBottom:8, boxSizing:"border-box" }}
                      onFocus={(e) => (e.target.style.borderColor=t.blue)} onBlur={(e) => (e.target.style.borderColor=t.border)}
                    />
                    <div style={{ display:"flex", gap:6 }}>
                      <button onClick={() => newColName.trim()&&addColumn.mutate(newColName)} style={{ flex:1, padding:"7px", background:t.blue, color:"white", border:"none", borderRadius:7, fontSize:13, fontWeight:700, cursor:"pointer" }}>Tambah</button>
                      <button onClick={() => setAddingCol(false)} style={{ padding:"7px 12px", background:"transparent", border:`1px solid ${t.border}`, borderRadius:7, fontSize:13, color:t.muted, cursor:"pointer" }}>✕</button>
                    </div>
                  </div>
                ) : (
                  <button onClick={() => setAddingCol(true)}
                    style={{ width:"100%", padding:"10px 14px", background:dark?"rgba(15,25,41,0.7)":"rgba(235,236,240,0.9)", border:"none", borderRadius:10, fontSize:13, fontWeight:500, color:dark?"rgba(148,163,184,0.9)":t.muted, cursor:"pointer", transition:"all .18s", fontFamily:"'DM Sans',sans-serif", display:"flex", alignItems:"center", gap:8, whiteSpace:"nowrap" }}
                    onMouseEnter={(e) => { e.currentTarget.style.background=dark?"rgba(26,39,68,0.9)":"rgba(255,255,255,0.8)"; e.currentTarget.style.color=t.text; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background=dark?"rgba(15,25,41,0.7)":"rgba(235,236,240,0.9)"; e.currentTarget.style.color=dark?"rgba(148,163,184,0.9)":t.muted; }}
                  >
                    <span style={{ fontSize:18 }}>+</span> Add another list
                  </button>
                )}
              </div>
            )}
          </div>
        </SortableContext>

        <DragOverlay>
          {activeDragData?.type==="card" && activeDragData.task && (
            <div style={{ opacity:0.9, pointerEvents:"none", width:260 }}>
              <TaskCard task={activeDragData.task} dark={dark} colIndex={activeDragData.colIndex} allColumns={allColumns} isDragging={true} onClick={()=>{}} onToggleComplete={()=>{}} onMove={()=>{}} onCopy={()=>{}} onDelete={()=>{}} completedIds={completedIds} />
            </div>
          )}
          {activeDragData?.type==="column" && activeDragData.column && (
            <div style={{ opacity:0.9, pointerEvents:"none", width:272 }}>
              <div style={{ background:t.colBg, borderRadius:10, padding:"10px 14px", border:`2px solid ${t.blue}` }}>
                <span style={{ fontSize:13, fontWeight:700, color:t.text }}>{activeDragData.column.name}</span>
                <span style={{ marginLeft:8, fontSize:11, color:t.muted }}>{activeDragData.column.tasks?.length||0} card</span>
              </div>
            </div>
          )}
        </DragOverlay>
      </DndContext>

      {/* Format sidebar — only for editor/owner */}
      {canEdit && <FormatSidebar dark={dark} show={showFormat} onClose={() => setShowFormat(false)} />}

      {showMore && <MoreMenu dark={dark} onClose={() => setShowMore(false)} activityLog={mergedActivity} onBgChange={setBoardBg} isPinned={isPinned} onTogglePin={togglePin} boardId={boardId} boardName={displayBoard?.name} onRestoreArchive={handleRestoreArchive} canEdit={canEdit} />}

      {activeTask && (
        <CardModal
          task={activeTask} dark={dark} columnName={activeTaskCol} allColumns={allColumns}
          onMoveCard={canEdit ? handleMoveCard : () => {}}
          onClose={() => setActiveTask(null)}
          canEdit={canEdit}
        />
      )}

      {showShare && (
        <ShareModal
          boardId={boardId} dark={dark} members={members}
          canInvite={canInvite}
          onClose={() => setShowShare(false)}
        />
      )}

      <RealtimeToast toast={realtimeToast} dark={dark} />

      {/* Viewer badge — shows briefly when viewer tries to drag */}
      {showViewerBadge && <ViewerBadge dark={dark} />}

      <BottomBar dark={dark} active={activeTab} onChange={(id) => setActiveTab(id)} boardData={displayBoard} />

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&family=Sora:wght@700;800&display=swap');
        @keyframes dropIn       { from{opacity:0;transform:translateY(-12px) scale(.96)} to{opacity:1;transform:none} }
        @keyframes cardMenuIn   { from{opacity:0;transform:translateX(-8px) scale(.97)}  to{opacity:1;transform:none} }
        @keyframes slideInRight { from{transform:translateX(100%)} to{transform:translateX(0)} }
        @keyframes slideUpToast { from{opacity:0;transform:translateX(-50%) translateY(12px)} to{opacity:1;transform:translateX(-50%) translateY(0)} }
        @keyframes spin         { to{transform:rotate(360deg)} }
        @keyframes pulse-green  { 0%,100%{box-shadow:0 0 0 2px rgba(22,163,74,0.3)} 50%{box-shadow:0 0 0 5px rgba(22,163,74,0)} }
        * { box-sizing:border-box }
        [contenteditable]:focus { outline:2px solid #0052cc; border-radius:4px; outline-offset:1px }
        [data-card-edit="true"] { user-select:text !important; -webkit-user-select:text !important; cursor:text !important; }
        .kb-card-view-title a { color:#0052cc !important; text-decoration:underline !important; cursor:pointer !important; }
        .kb-card-view-title a:hover { color:#1976d2 !important; }
        [data-card-edit="true"] a { color:#0052cc !important; text-decoration:underline !important; }
        .kb-card-view-title ul  { list-style-type:disc    !important; margin-left:20px; padding-left:8px; line-height:1.8; }
        .kb-card-view-title ol  { list-style-type:decimal !important; margin-left:20px; padding-left:8px; line-height:1.8; }
        .kb-card-view-title li  { font-size:13px; display:list-item !important; }
        [data-card-edit="true"] ul { list-style-type:disc    !important; margin-left:20px; padding-left:8px; }
        [data-card-edit="true"] ol { list-style-type:decimal !important; margin-left:20px; padding-left:8px; }
        [data-card-edit="true"] li { display:list-item !important; font-size:13px; line-height:1.8; }
        .kb-canvas { flex:1; overflow-x:auto; overflow-y:hidden; padding:16px 20px 0; display:flex; gap:10px; align-items:flex-start; width:100%; min-width:0; box-sizing:border-box; -webkit-overflow-scrolling:touch; padding-bottom:100px !important; }
        .kb-canvas::-webkit-scrollbar { height:7px; }
        .kb-canvas::-webkit-scrollbar-track { background:transparent; }
        .kb-canvas::-webkit-scrollbar-thumb { background:rgba(100,116,139,.35); border-radius:4px; }
        [data-card-area]::-webkit-scrollbar { width:5px; }
        [data-card-area]::-webkit-scrollbar-track { background:transparent; }
        [data-card-area]::-webkit-scrollbar-thumb { background:rgba(128,128,128,0.3); border-radius:3px; }
        [data-card-area]::-webkit-scrollbar-thumb:hover { background:rgba(128,128,128,0.5); }
        .kb-col-wrapper { flex-shrink:0; }
        @media (max-width:1024px) { .kb-col-wrapper { width:256px !important; } .kb-add-list-btn { width:256px !important; } }
        @media (max-width:768px) {
          .kb-col-wrapper { width:220px !important; } .kb-add-list-btn { width:220px !important; }
          .kb-nav-title-text { max-width:100px !important; } .kb-nav-badge { display:none !important; }
          .kb-format-btn { padding:5px 8px !important; } .kb-format-label { display:none !important; }
          .kb-more-btn span { display:none !important; }
          .kb-share-btn .share-label { display:none !important; } .kb-share-btn { padding:5px 10px !important; }
        }
        @media (max-width:480px) { .kb-format-btn { padding:4px 7px !important; font-size:12px !important; } .kb-more-btn { padding:4px 7px !important; } }
        @media (max-width:380px) { .kb-format-btn { display:none !important; } }
        @media (max-width:560px) { .kb-canvas { padding:12px 20px 0; gap:8px; } .kb-col-wrapper { width:85vw !important; min-width:240px !important; } .kb-add-list-btn { width:85vw !important; } .kb-members-row { display:none !important; } }
        @media (max-width:380px) { .kb-col-wrapper { width:92vw !important; } }
        .card-modal-grid { display:grid; grid-template-columns:1fr 210px; }
        @media (max-width:640px) {
          .card-modal-grid { grid-template-columns:1fr !important; }
          .card-modal-sidebar { display:none !important; }
          .card-modal-wrap { margin:0 !important; border-radius:14px 14px 0 0 !important; position:fixed !important; bottom:0 !important; left:0 !important; right:0 !important; max-width:100% !important; max-height:90vh !important; overflow-y:auto !important; }
          .card-modal-outer { align-items:flex-end !important; padding:0 !important; }
        }
      `}</style>
    </div>
  );
}
BoardMain.propTypes = { boardId:PropTypes.number, dark:PropTypes.bool, onBack:PropTypes.func };