// ============================================================
//  BoardDetail.jsx — Card & Column Components
//  Berisi: konstanta, helpers, TaskCard, SortableTaskCard,
//          CardMenuPortal, AddCardForm, CardDropArea,
//          KanbanColumn, SortableColumn
// ============================================================

import {
  useState, useRef, useEffect, useCallback, useLayoutEffect,
} from "react";
import { createPortal } from "react-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../api/axios";
import PropTypes from "prop-types";
import {
  useDroppable,
} from "@dnd-kit/core";
import {
  SortableContext, verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

// ─────────────────────────────────────────────────────────────
//  TEMA
// ─────────────────────────────────────────────────────────────
export function useTheme(dark) {
  return {
    bg:           dark ? "#0f172a"                  : "#f8f9fa",
    surface:      dark ? "#1e293b"                  : "#ffffff",
    surfaceAlt:   dark ? "#111827"                  : "#f1f3f5",
    surfaceHover: dark ? "#1e3a5f"                  : "#e9ecef",
    text:         dark ? "#f1f5f9"                  : "#1f2937",
    muted:        dark ? "#94a3b8"                  : "#6c757d",
    border:       dark ? "#334155"                  : "#dee2e6",
    blue:         "#5b7cf6",
    blueBright:   dark ? "#7090f8"                  : "#4a6af4",
    blueLight:    dark ? "rgba(91,124,246,.15)"     : "rgba(91,124,246,.09)",
    green:        "#16a34a",
    red:          "#dc2626",
    colBg:        dark ? "#0f1929"                  : "#edf0f2",
    boardBg:      dark ? "#080e1a"                  : "#e2e5e9",
    navBg:        dark ? "rgba(8,14,26,0.98)"       : "rgba(255,255,255,0.97)",
    cardBg:       dark ? "#1a2744"                  : "#ffffff",
    cardBorder:   dark ? "#2d4070"                  : "#dee2e6",
  };
}

// ─────────────────────────────────────────────────────────────
//  KONSTANTA
// ─────────────────────────────────────────────────────────────
export const CARD_COLORS = [
  "#16a34a","#d97706","#dc2626","#7c3aed",
  "#0891b2","#db2777","#1565c0","#374151",
  "#b45309","#0f766e",
];

export const CARD_BG_OPTS = [
  { label:"Hijau",   value:"#16a34a" },
  { label:"Kuning",  value:"#d97706" },
  { label:"Merah",   value:"#dc2626" },
  { label:"Ungu",    value:"#7c3aed" },
  { label:"Biru",    value:"#0891b2" },
  { label:"Pink",    value:"#db2777" },
  { label:"Navy",    value:"#1565c0" },
  { label:"Abu",     value:"#374151" },
  { label:"Coklat",  value:"#b45309" },
  { label:"Teal",    value:"#0f766e" },
  { label:"Default", value:null      },
];

export const PRIORITY_CONFIG = {
  low:    { label:"Low",    color:"#16a34a", bg:"#dcfce7", darkBg:"#14532d33" },
  medium: { label:"Medium", color:"#d97706", bg:"#fef3c7", darkBg:"#78350f33" },
  high:   { label:"High",   color:"#dc2626", bg:"#fee2e2", darkBg:"#7f1d1d33" },
};

// ─────────────────────────────────────────────────────────────
//  HELPERS
// ─────────────────────────────────────────────────────────────
export function stripHtml(html) {
  if (!html) return "";
  const tmp = document.createElement("div");
  tmp.innerHTML = html;
  return tmp.innerText || tmp.textContent || "";
}

export function timeAgo(d) {
  if (!d) return "";
  const s = (Date.now() - new Date(d)) / 1000;
  if (s < 60)    return "baru saja";
  if (s < 3600)  return `${Math.floor(s / 60)} mnt lalu`;
  if (s < 86400) return `${Math.floor(s / 3600)} jam lalu`;
  return `${Math.floor(s / 86400)} hari lalu`;
}

export function fmtDate(d) {
  if (!d) return "";
  return new Date(d).toLocaleDateString("id-ID", {
    day:"numeric", month:"short", year:"numeric",
    hour:"2-digit", minute:"2-digit",
  });
}

// ─────────────────────────────────────────────────────────────
//  ADD CARD FORM
// ─────────────────────────────────────────────────────────────
export function AddCardForm({ columnId, dark, onClose }) {
  const t  = useTheme(dark);
  const qc = useQueryClient();
  const [title, setTitle] = useState("");
  const ref = useRef();
  useLayoutEffect(() => { ref.current?.focus(); }, []);
  const create = useMutation({
    mutationFn: (data) => api.post(`/columns/${columnId}/tasks`, data),
    onSuccess: async () => { await qc.refetchQueries({ queryKey:["board-detail"] }); onClose(); },
    onError: (err) => alert("Error: " + (err?.response?.data?.message || "Gagal menambah card.")),
  });
  const submit = () => { if (!title.trim()||create.isPending) return; create.mutate({ title:title.trim(), priority:"medium" }); };
  return (
    <div style={{ background:dark?t.surface:"#ffffff", border:`1.5px solid ${t.blue}`, borderRadius:8, padding:"8px 10px", marginBottom:6, boxShadow:`0 2px 8px ${t.blue}18` }}>
      <textarea ref={ref} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Masukkan teks card..." rows={2}
        onKeyDown={(e) => { if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();submit();} if(e.key==="Escape")onClose(); }}
        style={{ width:"100%", padding:"7px 9px", border:`1px solid ${t.border}`, borderRadius:7, fontSize:13, background:t.surfaceAlt, color:t.text, outline:"none", resize:"none", boxSizing:"border-box", marginBottom:7, fontFamily:"'DM Sans',sans-serif", lineHeight:1.4 }}
        onFocus={(e) => (e.target.style.borderColor=t.blue)} onBlur={(e) => (e.target.style.borderColor=t.border)}
      />
      <div style={{ display:"flex", gap:6 }}>
        <button onClick={submit} disabled={!title.trim()||create.isPending}
          style={{ padding:"6px 14px", background:t.blue, color:"white", border:"none", borderRadius:7, fontSize:12, fontWeight:700, cursor:"pointer", opacity:!title.trim()?0.5:1 }}
        >{create.isPending?"Menambah...":"Tambah Card"}</button>
        <button onClick={onClose} style={{ background:"transparent", border:"none", cursor:"pointer", color:t.muted, fontSize:20, padding:"2px 6px", borderRadius:6 }}>✕</button>
      </div>
    </div>
  );
}
AddCardForm.propTypes = { columnId:PropTypes.number, dark:PropTypes.bool, onClose:PropTypes.func };

// ─────────────────────────────────────────────────────────────
//  CARD MENU PORTAL
// ─────────────────────────────────────────────────────────────
export function CardMenuPortal({ dark, pos, task, allColumns, onDetail, onEdit, onMove, onCopy, onDelete, onClose, qc }) {
  const t = useTheme(dark);
  const [showBg,  setShowBg]  = useState(false);
  const [showDue, setShowDue] = useState(false);
  const menuRef = useRef();

  useEffect(() => {
    const handler = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) onClose(); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  useEffect(() => {
    const onResize = () => onClose();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [onClose]);

  const MI = ({ icon, label, onClick, hasArrow=false }) => (
    <button onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); onClick(); }}
      style={{ width:"100%", display:"flex", alignItems:"center", gap:10, padding:"8px 16px", background:"transparent", border:"none", cursor:"pointer", textAlign:"left" }}
      onMouseEnter={(e) => (e.currentTarget.style.background=t.surfaceHover)}
      onMouseLeave={(e) => (e.currentTarget.style.background="transparent")}
    >
      <span style={{ fontSize:14, width:18, textAlign:"center" }}>{icon}</span>
      <span style={{ fontSize:13, color:t.text, flex:1, fontWeight:500 }}>{label}</span>
      {hasArrow && <span style={{ fontSize:9, color:t.muted }}>▶</span>}
    </button>
  );
  MI.propTypes = { icon:PropTypes.string, label:PropTypes.string, onClick:PropTypes.func, hasArrow:PropTypes.bool };

  return createPortal(
    <div ref={menuRef} style={{ position:"fixed", top:pos.top, left:pos.left, width:234, zIndex:99999, background:t.surface, border:`1px solid ${t.border}`, borderRadius:12, boxShadow:"0 12px 48px rgba(0,0,0,.4)", animation:"cardMenuIn .13s ease", display:"flex", flexDirection:"column", maxHeight:Math.min(560, Math.max(300, window.innerHeight-pos.top-16)), overflow:"hidden" }}>
      <div style={{ padding:"10px 16px", borderBottom:`1px solid ${t.border}`, display:"flex", justifyContent:"space-between", alignItems:"center", background:t.surfaceAlt, flexShrink:0 }}>
        <span style={{ fontSize:11, fontWeight:700, color:t.muted, textTransform:"uppercase", letterSpacing:.6 }}>Aksi Card</span>
        <button onMouseDown={(e) => { e.preventDefault(); onClose(); }} style={{ background:"transparent", border:"none", cursor:"pointer", color:t.muted, fontSize:16 }}>✕</button>
      </div>
      <div style={{ overflowY:"auto", flex:1, paddingTop:4, paddingBottom:6 }} onWheel={(e) => e.stopPropagation()}>
        <MI icon="✎"  label="Lihat Detail" onClick={() => { onDetail(); onClose(); }} />
        <MI icon="✏️" label="Edit Label"   onClick={() => { onEdit();   onClose(); }} />
        <div style={{ height:1, background:t.border, margin:"4px 0" }} />
        <p style={{ fontSize:10, color:t.muted, padding:"6px 16px 2px", fontWeight:700, textTransform:"uppercase", letterSpacing:.6 }}>Ubah</p>
        <MI icon="🎨" label="Warna Background" onClick={() => setShowBg(v=>!v)} hasArrow={showBg} />
        {showBg && (
          <div style={{ padding:"4px 16px 10px", display:"flex", flexWrap:"wrap", gap:6 }}>
            {CARD_BG_OPTS.map((opt) => (
              <button key={opt.value||"null"}
                onMouseDown={(e) => { e.preventDefault(); api.put(`/tasks/${task.id}`,{bg_color:opt.value}).then(()=>qc.invalidateQueries(["board-detail"])); onClose(); }}
                title={opt.label}
                style={{ width:26, height:26, borderRadius:6, background:opt.value||"transparent", border:"2px solid rgba(128,128,128,.25)", cursor:"pointer", backgroundImage:!opt.value?"repeating-linear-gradient(45deg,#aaa 0,#aaa 2px,white 0,white 7px)":"none", transition:"transform .12s" }}
                onMouseEnter={(e) => (e.currentTarget.style.transform="scale(1.2)")}
                onMouseLeave={(e) => (e.currentTarget.style.transform="scale(1)")}
              />
            ))}
          </div>
        )}
        <MI icon="📅" label="Set Deadline" onClick={() => setShowDue(v=>!v)} hasArrow={showDue} />
        {showDue && (
          <div style={{ padding:"4px 16px 10px" }}>
            <input type="date" defaultValue={task.due_date?task.due_date.substring(0,10):""}
              onClick={(e) => e.stopPropagation()}
              onChange={(e) => { api.put(`/tasks/${task.id}`,{due_date:e.target.value||null}).then(()=>qc.invalidateQueries(["board-detail"])); onClose(); }}
              style={{ width:"100%", padding:"7px 9px", border:`1.5px solid ${t.border}`, borderRadius:7, fontSize:12, background:t.surfaceAlt, color:t.text, outline:"none", boxSizing:"border-box" }}
            />
          </div>
        )}
        <div style={{ height:1, background:t.border, margin:"4px 0" }} />
        <p style={{ fontSize:10, color:t.muted, padding:"6px 16px 2px", fontWeight:700, textTransform:"uppercase", letterSpacing:.6 }}>Pindahkan ke Kolom</p>
        {allColumns?.map((col) => (
          <MI key={col.id} icon="→" label={col.name} onClick={() => { onMove(task.id,col.id); onClose(); }} />
        ))}
        <div style={{ height:1, background:t.border, margin:"4px 0" }} />
        <MI icon="⧉" label="Salin Card"  onClick={() => { onCopy(task); onClose(); }} />
        <MI icon="🗑" label="Hapus Card" onClick={() => { if(window.confirm(`Hapus card "${task.title}"?`)) onDelete(task.id); onClose(); }} />
      </div>
    </div>,
    document.body,
  );
}
CardMenuPortal.propTypes = { dark:PropTypes.bool, pos:PropTypes.object, task:PropTypes.object, allColumns:PropTypes.array, onDetail:PropTypes.func, onEdit:PropTypes.func, onMove:PropTypes.func, onCopy:PropTypes.func, onDelete:PropTypes.func, onClose:PropTypes.func, qc:PropTypes.object };

// ─────────────────────────────────────────────────────────────
//  TASK CARD
// ─────────────────────────────────────────────────────────────
export function TaskCard({ task, dark, onClick, isDragging, allColumns, onMove, onCopy, onDelete, onToggleComplete, completedIds, dragHandleListeners, dragHandleAttributes }) {
  const t      = useTheme(dark);
  const qc     = useQueryClient();
  const [hov,   setHov]   = useState(false);
  const [menu,  setMenu]  = useState(null);
  const [edit,  setEdit]  = useState(false);
  const [title, setTitle] = useState(task.title || "");
  const cardRef      = useRef();
  const editRef      = useRef();
  const saveTimerRef = useRef(null);

  const pConf   = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.medium;
  const overdue = task.due_date && new Date(task.due_date) < new Date();
  const done    = completedIds ? completedIds.has(task.id) : !!task.is_completed;

  useEffect(() => { setTitle(task.title || ""); }, [task.title]);

  useLayoutEffect(() => {
    if (!edit || !editRef.current) return;
    const el = editRef.current;
    if (!el.innerHTML || el.innerHTML === "<br>") {
      el.innerHTML = title;
    }
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0 || !el.contains(sel.anchorNode)) {
      try {
        el.focus();
        const range = document.createRange();
        range.selectNodeContents(el);
        range.collapse(false);
        sel?.removeAllRanges();
        sel?.addRange(range);
      } catch { /* noop */ }
    }
  }, [edit]); // eslint-disable-line

  const doSave = useCallback(() => {
    if (!editRef.current) return;
    const html  = editRef.current.innerHTML || "";
    const plain = editRef.current.innerText?.trim() || "";
    if (!plain) return;
    setTitle(html);
    if (html !== task.title) {
      api.put(`/tasks/${task.id}`, { title:html })
        .then(() => qc.invalidateQueries(["board-detail"]))
        .catch(() => { /* noop */ });
    }
  }, [task, qc]);

  const saveEdit = useCallback(() => { doSave(); setEdit(false); }, [doSave]);

  useEffect(() => {
    if (!edit) return;
    const el = editRef.current;
    if (!el) return;
    const onFormatSave = () => { clearTimeout(saveTimerRef.current); doSave(); };
    const onInput      = () => { clearTimeout(saveTimerRef.current); saveTimerRef.current = setTimeout(doSave, 600); };
    el.addEventListener("formatSave", onFormatSave);
    el.addEventListener("input", onInput);
    return () => {
      el.removeEventListener("formatSave", onFormatSave);
      el.removeEventListener("input", onInput);
      clearTimeout(saveTimerRef.current);
    };
  }, [edit, doSave]);

  const openMenu = (e) => {
    e.stopPropagation();
    const r = cardRef.current.getBoundingClientRect();
    const mw=234, mh=400, gap=10;
    let left = r.right + gap;
    if (left + mw > window.innerWidth - 8) left = r.left - mw - gap;
    left = Math.max(8, left);
    let top = Math.min(r.top, window.innerHeight - mh - 8);
    top = Math.max(8, top);
    setMenu({ top, left });
  };

  return (
    <div style={{ position:"relative", marginBottom:5 }}>
      <div
        ref={cardRef}
        onMouseEnter={() => setHov(true)}
        onMouseLeave={() => setHov(false)}
        style={{
          background: done ? (dark?"rgba(20,83,45,0.25)":"#f0fdf4") : (dark?t.cardBg:"#ffffff"),
          border: `1px solid ${done?"rgba(22,163,74,0.3)":hov||menu||edit?t.blue:(dark?t.cardBorder:"rgba(0,0,0,0.12)")}`,
          borderRadius:8, opacity:isDragging?0.5:1, position:"relative",
          boxShadow: isDragging
            ? (dark?"0 8px 24px rgba(0,0,0,0.6)":"0 8px 20px rgba(0,0,0,0.2)")
            : (hov||edit)
              ? (dark?`0 4px 16px rgba(0,0,0,0.55), 0 0 0 1px ${t.blue}55`:`0 4px 10px rgba(0,82,204,0.12), 0 0 0 1px ${t.blue}22`)
              : (dark?"0 2px 6px rgba(0,0,0,0.4)":"0 1px 2px rgba(0,0,0,0.07)"),
          transition:"border-color .12s, box-shadow .15s",
        }}
      >
        {/* Drag handle */}
        {hov && !edit && !isDragging && (
          <div
            {...(dragHandleListeners || {})}
            {...(dragHandleAttributes || {})}
            style={{ position:"absolute", top:8, left:6, cursor:"grab", color:t.muted, fontSize:12, userSelect:"none", touchAction:"none", display:"flex", flexDirection:"column", gap:2, zIndex:3 }}
            onClick={(e) => e.stopPropagation()}
            title="Drag untuk memindahkan"
          >
            <span style={{ display:"block", width:12, textAlign:"center", lineHeight:1, letterSpacing:2 }}>⠿</span>
          </div>
        )}

        <div
          style={{ padding:"10px 12px 10px 24px", display:"flex", gap:8, alignItems:"flex-start" }}
          onClick={() => { if (edit || menu) return; onClick(); }}
        >
          {/* Mark complete */}
          <button
            onClick={(e) => { e.stopPropagation(); onToggleComplete(task.id, !done); }}
            title={done ? "Tandai belum selesai" : "Tandai selesai"}
            style={{ flexShrink:0, marginTop:2, width:16, height:16, borderRadius:"50%", border:`2px solid ${done?"#16a34a":(hov?"#94a3b8":"transparent")}`, background:done?"#16a34a":"transparent", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", transition:"all .2s", padding:0, opacity:done||hov?1:0 }}
            onMouseEnter={(e) => { if(!done){e.currentTarget.style.borderColor="#16a34a";e.currentTarget.style.background="rgba(22,163,74,0.15)";}}}
            onMouseLeave={(e) => { if(!done){e.currentTarget.style.borderColor=hov?"#94a3b8":"transparent";e.currentTarget.style.background="transparent";}}}
          >
            {done && <svg width="9" height="9" viewBox="0 0 10 10" fill="none"><path d="M1.5 5L3.5 7.5L8.5 2.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
          </button>

          <div style={{ flex:1, minWidth:0 }}>
            {edit ? (
              <div
                ref={editRef}
                contentEditable
                suppressContentEditableWarning
                spellCheck={false}
                data-card-edit="true"
                onBlur={saveEdit}
                onKeyDown={(e) => {
                  if ((e.ctrlKey||e.metaKey) && e.key === "a") {
                    e.preventDefault(); e.stopPropagation();
                    const range = document.createRange();
                    range.selectNodeContents(e.currentTarget);
                    const sel = window.getSelection();
                    sel.removeAllRanges(); sel.addRange(range);
                    return;
                  }
                  if (e.key === "Enter" && (e.ctrlKey||e.metaKey)) { e.preventDefault(); saveEdit(); return; }
                  if (e.key === "Enter") { e.stopPropagation(); return; }
                  if (e.key === "Escape") { setEdit(false); return; }
                  e.stopPropagation();
                }}
                onClick={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
                style={{ fontSize:13, fontWeight:500, color:t.text, lineHeight:1.6, padding:"6px 8px", outline:`2px solid ${t.blue}`, borderRadius:6, background:t.surfaceAlt, cursor:"text", minHeight:52, wordBreak:"break-word", userSelect:"text", WebkitUserSelect:"text", fontFamily:"'DM Sans',sans-serif", pointerEvents:"all", whiteSpace:"pre-wrap" }}
              />
            ) : (
              <div
                className="kb-card-view-title"
                onDoubleClick={(e) => { e.stopPropagation(); setEdit(true); }}
                onClick={(e) => {
                  const anchor = e.target.closest("a");
                  if (anchor && anchor.href) { e.stopPropagation(); window.open(anchor.href, "_blank", "noopener,noreferrer"); return; }
                }}
                style={{ fontSize:13, fontWeight:500, color:t.text, lineHeight:1.6, minHeight:18, wordBreak:"break-word", cursor:"default", userSelect:"text", WebkitUserSelect:"text", whiteSpace:"pre-wrap" }}
                dangerouslySetInnerHTML={{ __html:title }}
              />
            )}

            {/* Description icon */}
            {task.description && (
              <span
                title="This card has a description."
                style={{ display:"inline-flex", alignItems:"center", marginTop:4, marginBottom:2, cursor:"pointer", fontSize:14, lineHeight:1, color:t.muted, opacity:0.55, userSelect:"none", transition:"opacity .15s, color .15s" }}
                onMouseEnter={(e) => { e.currentTarget.style.opacity="0.85"; e.currentTarget.style.color=t.blue; }}
                onMouseLeave={(e) => { e.currentTarget.style.opacity="0.55"; e.currentTarget.style.color=t.muted; }}
                onClick={(e) => e.stopPropagation()}
              >≡</span>
            )}

            {/* Badges */}
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:4, flexWrap:"wrap", marginTop:task.description?4:6 }}>
              <div style={{ display:"flex", gap:4, flexWrap:"wrap", alignItems:"center" }}>
                {done ? (
                  <span style={{ fontSize:10, fontWeight:700, padding:"2px 6px", borderRadius:4, background:"#dcfce7", color:"#16a34a" }}>✓ Selesai</span>
                ) : (
                  <span style={{ fontSize:10, fontWeight:600, padding:"2px 6px", borderRadius:4, background:dark?pConf.darkBg:pConf.bg, color:pConf.color }}>{pConf.label}</span>
                )}
                {task.due_date && (
                  <span style={{ fontSize:10, padding:"2px 6px", borderRadius:4, background:overdue&&!done?"#fee2e2":t.blueLight, color:overdue&&!done?t.red:t.blue }}>
                    📅{new Date(task.due_date).toLocaleDateString("id-ID",{day:"numeric",month:"short"})}
                  </span>
                )}
                {task.comments?.length > 0 && <span style={{ fontSize:10, color:t.muted }}>💬{task.comments.length}</span>}
              </div>
              {task.assignee && (
                <div title={task.assignee.name} style={{ width:20, height:20, borderRadius:"50%", background:t.blue, display:"flex", alignItems:"center", justifyContent:"center", color:"white", fontSize:9, fontWeight:700 }}>
                  {task.assignee.name?.[0]?.toUpperCase()}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Edit mode buttons */}
        {edit && (
          <div style={{ position:"absolute", top:6, right:6, display:"flex", gap:4, zIndex:10 }}>
            <button onMouseDown={(e) => { e.preventDefault(); saveEdit(); }} title="Simpan (Ctrl+Enter)"
              style={{ padding:"2px 8px", background:t.blue, color:"white", border:"none", borderRadius:5, fontSize:10, fontWeight:700, cursor:"pointer", lineHeight:1.6 }}
            >✓</button>
            <button onMouseDown={(e) => { e.preventDefault(); setEdit(false); setTitle(task.title||""); }} title="Batal (Escape)"
              style={{ padding:"2px 6px", background:t.surfaceAlt, color:t.muted, border:`1px solid ${t.border}`, borderRadius:5, fontSize:10, cursor:"pointer", lineHeight:1.6 }}
            >✕</button>
          </div>
        )}

        {/* Pencil icon on hover */}
        {hov && !isDragging && !edit && (
          <button
            onClick={(e) => { e.stopPropagation(); openMenu(e); }}
            style={{ position:"absolute", top:6, right:6, width:24, height:24, borderRadius:5, background:menu?t.blue:(dark?"rgba(26,39,68,0.95)":"rgba(241,245,249,0.95)"), border:`1px solid ${menu?t.blue:t.border}`, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", color:menu?"white":t.muted, fontSize:13, zIndex:2, transition:"all .15s" }}
            onMouseEnter={(e) => { if(!menu){e.currentTarget.style.background=t.blue;e.currentTarget.style.color="white";e.currentTarget.style.borderColor=t.blue;}}}
            onMouseLeave={(e) => { if(!menu){e.currentTarget.style.background=dark?"rgba(26,39,68,0.95)":"rgba(241,245,249,0.95)";e.currentTarget.style.color=t.muted;e.currentTarget.style.borderColor=t.border;}}}
          >
            <svg width="11" height="11" viewBox="0 0 16 16" fill="none">
              <path d="M11.5 2.5a1.5 1.5 0 0 1 2.12 2.12L5 13.24l-2.83.71.71-2.83L11.5 2.5z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        )}
      </div>

      {menu && (
        <CardMenuPortal dark={dark} pos={menu} task={task} allColumns={allColumns}
          onDetail={onClick}
          onEdit={() => { setMenu(null); setEdit(true); }}
          onMove={onMove} onCopy={onCopy} onDelete={onDelete}
          onClose={() => setMenu(null)} qc={qc}
        />
      )}
    </div>
  );
}
TaskCard.propTypes = {
  task:PropTypes.object, dark:PropTypes.bool, onClick:PropTypes.func, isDragging:PropTypes.bool,
  allColumns:PropTypes.array, onMove:PropTypes.func, onCopy:PropTypes.func, onDelete:PropTypes.func,
  colIndex:PropTypes.number, onToggleComplete:PropTypes.func, completedIds:PropTypes.object,
  dragHandleListeners:PropTypes.object, dragHandleAttributes:PropTypes.object,
};

// ─────────────────────────────────────────────────────────────
//  SORTABLE TASK CARD
// ─────────────────────────────────────────────────────────────
export function SortableTaskCard({ task, dark, onClick, allColumns, onMove, onCopy, onDelete, colIndex, onToggleComplete, completedIds }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: `card-${task.id}`,
    animateLayoutChanges: () => true,
  });
  const style = {
    transform: CSS.Translate.toString(transform),
    transition: transition || 'transform 200ms ease',
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 999 : "auto",
  };
  return (
    <div ref={setNodeRef} style={style}>
      <TaskCard
        task={task} dark={dark} onClick={onClick} allColumns={allColumns}
        onMove={onMove} onCopy={onCopy} onDelete={onDelete}
        colIndex={colIndex} isDragging={isDragging}
        onToggleComplete={onToggleComplete} completedIds={completedIds}
        dragHandleListeners={listeners} dragHandleAttributes={attributes}
      />
    </div>
  );
}

SortableTaskCard.propTypes = {
  task:PropTypes.object, dark:PropTypes.bool, onClick:PropTypes.func,
  allColumns:PropTypes.array, onMove:PropTypes.func, onCopy:PropTypes.func,
  onDelete:PropTypes.func, colIndex:PropTypes.number, onToggleComplete:PropTypes.func,
  completedIds:PropTypes.object,
};

// ─────────────────────────────────────────────────────────────
//  CARD DROP AREA
// ─────────────────────────────────────────────────────────────
export function CardDropArea({ column, dark, colIndex, allColumns, adding, setAdding, onTaskClick, onMoveCard, onCopyCard, onDeleteCard, t, onToggleComplete, completedIds }) {
  const tasks = column.tasks || [];
  // const { setNodeRef } = useDroppable({ id:`col-${column.id}` });
  const { setNodeRef } = useDroppable({ id:`droppable-col-${column.id}` });
  return (
    <div ref={setNodeRef} data-card-area="true"
      style={{ flex:"1 1 auto", overflowY:"auto", padding:"6px 8px 4px", background:"transparent", minHeight:20, minWidth:0, scrollbarWidth:"thin", scrollbarColor:dark?"rgba(148,163,184,0.3) transparent":"rgba(0,0,0,0.2) transparent" }}
    >
      {adding && <AddCardForm columnId={column.id} dark={dark} onClose={() => setAdding(false)} />}
      <SortableContext items={tasks.map((tk) => `card-${tk.id}`)} strategy={verticalListSortingStrategy}>
        {tasks.map((task) => (
          <SortableTaskCard
            key={task.id} task={task} dark={dark} colIndex={colIndex} allColumns={allColumns}
            onClick={() => onTaskClick(task, column.name)}
            onMove={onMoveCard} onCopy={onCopyCard} onDelete={onDeleteCard}
            onToggleComplete={onToggleComplete} completedIds={completedIds}
          />
        ))}
      </SortableContext>
      {!tasks.length && !adding && (
        <div style={{ textAlign:"center", padding:"24px 8px 8px", color:t.muted, fontSize:12, opacity:0.5, userSelect:"none" }}>Kosong</div>
      )}
    </div>
  );
}
CardDropArea.propTypes = {
  column:PropTypes.object, dark:PropTypes.bool, colIndex:PropTypes.number, allColumns:PropTypes.array,
  adding:PropTypes.bool, setAdding:PropTypes.func, onTaskClick:PropTypes.func, onMoveCard:PropTypes.func,
  onCopyCard:PropTypes.func, onDeleteCard:PropTypes.func, t:PropTypes.object, onToggleComplete:PropTypes.func,
  completedIds:PropTypes.object,
};

// ─────────────────────────────────────────────────────────────
//  KANBAN COLUMN
// ─────────────────────────────────────────────────────────────
export function KanbanColumn({ column, dark, colIndex, allColumns, onTaskClick, onMoveCard, onCopyCard, onDeleteCard, dragHandleProps, onToggleComplete, completedIds, boardId, onLog }) {
  const t  = useTheme(dark);
  const qc = useQueryClient();
  const [adding,   setAdding]   = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [colName,  setColName]  = useState(column.name);
  const [showDot,  setShowDot]  = useState(false);
  const [menuPos,  setMenuPos]  = useState({ top:0, left:0 });
  const dotBtnRef = useRef();
  const renRef    = useRef();
  const tasks     = column.tasks || [];
  const doneCount = tasks.filter(tk => completedIds ? completedIds.has(tk.id) : tk.is_completed).length;

  useEffect(() => { setColName(column.name); }, [column.name]);
  useLayoutEffect(() => { if (renaming) renRef.current?.focus(); }, [renaming]);

  const openColMenu = () => {
    if (!dotBtnRef.current) return;
    const rect  = dotBtnRef.current.getBoundingClientRect();
    const menuW = 210;
    let left = rect.right + 8;
    if (left + menuW > window.innerWidth - 8) left = rect.left - menuW - 8;
    left = Math.max(8, left);
    let top = rect.top;
    if (top + 300 > window.innerHeight - 8) top = window.innerHeight - 308;
    top = Math.max(8, top);
    setMenuPos({ top, left });
    setShowDot(v => !v);
  };

  const deleteCol = useMutation({
    mutationFn:() => api.delete(`/columns/${column.id}`),
    onSuccess:() => qc.invalidateQueries(["board-detail"]),
  });
  const renameCol = useMutation({
    mutationFn:(name) => api.put(`/columns/${column.id}`,{name}),
    onSuccess:() => qc.invalidateQueries(["board-detail"]),
  });

  const commitRename = () => {
    setRenaming(false);
    if (colName.trim() && colName.trim() !== column.name) renameCol.mutate(colName.trim());
    else setColName(column.name);
  };

  const MI = ({ icon, label, onClick }) => (
    <button onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); onClick(); }}
      style={{ width:"100%", display:"flex", alignItems:"center", gap:10, padding:"8px 14px", background:"transparent", border:"none", cursor:"pointer", textAlign:"left" }}
      onMouseEnter={(e) => (e.currentTarget.style.background=t.surfaceHover)}
      onMouseLeave={(e) => (e.currentTarget.style.background="transparent")}
    >
      <span style={{ fontSize:14, width:18, textAlign:"center" }}>{icon}</span>
      <span style={{ fontSize:13, color:t.text, fontWeight:500 }}>{label}</span>
    </button>
  );
  MI.propTypes = { icon:PropTypes.string, label:PropTypes.string, onClick:PropTypes.func };

  return (
    <div style={{ display:"flex", flexDirection:"column", maxHeight:"calc(100vh - 176px)", height:"auto", borderRadius:10, overflow:"hidden", width:"100%", background:dark?"#0f1929":"#f1f2f4", border:`1px solid ${dark?"rgba(255,255,255,0.07)":"rgba(0,0,0,0.10)"}`, boxShadow:dark?"0 2px 12px rgba(0,0,0,0.45)":"0 1px 3px rgba(0,0,0,0.10)" }}>
      {/* Column header */}
      <div
        {...(renaming ? {} : dragHandleProps)}
        style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"10px 12px 9px", background:"transparent", cursor:renaming?"default":"grab", userSelect:"none", flexShrink:0, borderBottom:`1px solid ${dark?"rgba(255,255,255,0.05)":"rgba(0,0,0,0.06)"}` }}
      >
        <div style={{ display:"flex", alignItems:"center", gap:7, flex:1, minWidth:0 }}>
          {renaming ? (
            <input ref={renRef} value={colName} onChange={(e) => setColName(e.target.value)}
              onBlur={commitRename}
              onKeyDown={(e) => { if(e.key==="Enter")commitRename(); if(e.key==="Escape"){setColName(column.name);setRenaming(false);} e.stopPropagation(); }}
              onClick={(e) => e.stopPropagation()}
              style={{ flex:1, padding:"2px 6px", border:`2px solid ${t.blue}`, borderRadius:5, fontSize:13, fontWeight:700, background:t.surface, color:t.text, outline:"none", minWidth:0, fontFamily:"'DM Sans',sans-serif" }}
            />
          ) : (
            <span onClick={(e) => { e.stopPropagation(); setRenaming(true); }} title="Klik untuk rename"
              style={{ fontSize:14, fontWeight:700, color:t.text, flex:1, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", cursor:"text", borderRadius:4, padding:"2px 4px", transition:"background .12s" }}
              onMouseEnter={(e) => { e.currentTarget.style.background=dark?"rgba(255,255,255,0.08)":"rgba(0,0,0,0.06)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background="transparent"; }}
            >{column.name}</span>
          )}
          <span style={{ fontSize:11, color:t.muted, borderRadius:99, padding:"1px 4px", fontWeight:700, flexShrink:0 }}>{tasks.length}</span>
          {doneCount > 0 && <span style={{ fontSize:10, color:"#16a34a", background:"#dcfce7", borderRadius:99, padding:"1px 6px", fontWeight:700, flexShrink:0 }}>✓{doneCount}</span>}
        </div>
        <button ref={dotBtnRef} onClick={(e) => { e.stopPropagation(); openColMenu(); }}
          style={{ background:"transparent", border:"none", cursor:"pointer", color:t.muted, fontSize:16, borderRadius:5, padding:"2px 6px", display:"flex", alignItems:"center", flexShrink:0, marginLeft:4 }}
          onMouseEnter={(e) => { e.currentTarget.style.background=t.blueLight; e.currentTarget.style.color=t.blue; }}
          onMouseLeave={(e) => { e.currentTarget.style.background="transparent"; e.currentTarget.style.color=t.muted; }}
        >⋯</button>
      </div>

      {/* Column menu portal */}
      {showDot && createPortal(
        <>
          <div style={{ position:"fixed", inset:0, zIndex:998 }} onMouseDown={() => setShowDot(false)} />
          <div style={{ position:"fixed", top:menuPos.top, left:menuPos.left, background:t.surface, border:`1px solid ${t.border}`, borderRadius:10, padding:"4px 0", minWidth:200, boxShadow:"0 8px 28px rgba(0,0,0,.25)", zIndex:99999 }}>
            <div style={{ padding:"6px 12px 8px", borderBottom:`1px solid ${t.border}`, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <span style={{ fontSize:12, fontWeight:700, color:t.muted }}>Aksi Kolom</span>
              <button onMouseDown={(e) => { e.preventDefault(); setShowDot(false); }} style={{ background:"transparent", border:"none", cursor:"pointer", color:t.muted, fontSize:14 }}>✕</button>
            </div>
            <MI icon="➕" label="Tambah Card"    onClick={() => { setAdding(true); setShowDot(false); }} />
            <MI icon="✏️" label="Rename Kolom"   onClick={() => { setRenaming(true); setShowDot(false); }} />
            <MI icon="⧉"  label="Salin Kolom"    onClick={() => {
              api.post(`/boards/${column.board_id || boardId}/columns`, { name:`${column.name} (salinan)` })
                .then(res => {
                  const newColId = res.data?.id;
                  if (!newColId) return;
                  (column.tasks || []).forEach(task => {
                    api.post(`/columns/${newColId}/tasks`, { title:task.title, priority:task.priority||"medium", description:task.description||"" }).catch(()=>{});
                  });
                  qc.invalidateQueries(["board-detail"]);
                  onLog?.(`menyalin kolom "${column.name}"`);
                }).catch(()=>{});
              setShowDot(false);
            }} />
            <MI icon="📦" label="Arsipkan Kolom" onClick={() => {
              if (window.confirm(`Arsipkan kolom "${column.name}"? Semua card akan tersimpan.`)) {
                const archived = { id:column.id, name:column.name, tasks:column.tasks||[], archivedAt:new Date().toISOString() };
                try {
                  const key = `kanbanku_archive_${boardId}`;
                  localStorage.setItem(key, JSON.stringify([archived, ...JSON.parse(localStorage.getItem(key)||"[]")]));
                } catch { /* noop */ }
                deleteCol.mutate();
                onLog?.(`mengarsipkan kolom "${column.name}"`);
              }
              setShowDot(false);
            }} />
            <div style={{ height:1, background:t.border, margin:"4px 0" }} />
            <MI icon="🗑" label="Hapus Kolom" onClick={() => { if(window.confirm(`Hapus kolom "${column.name}"?`)) deleteCol.mutate(); setShowDot(false); }} />
          </div>
        </>,
        document.body
      )}

      <CardDropArea
        column={column} dark={dark} colIndex={colIndex} allColumns={allColumns}
        adding={adding} setAdding={setAdding}
        onTaskClick={onTaskClick} onMoveCard={onMoveCard} onCopyCard={onCopyCard} onDeleteCard={onDeleteCard}
        onToggleComplete={onToggleComplete} completedIds={completedIds} t={t}
      />

      {/* Add card button */}
      {!adding && (
        <button onClick={() => setAdding(true)}
          style={{ width:"100%", padding:"8px 12px", flexShrink:0, background:"transparent", border:"none", borderRadius:"0 0 10px 10px", fontSize:13, fontWeight:500, color:t.muted, cursor:"pointer", transition:"background .15s, color .15s", fontFamily:"'DM Sans',sans-serif", display:"flex", alignItems:"center", gap:6, borderTop:`1px solid ${dark?"rgba(255,255,255,0.06)":"rgba(0,0,0,0.08)"}` }}
          onMouseEnter={(e) => { e.currentTarget.style.background=dark?"rgba(255,255,255,0.06)":"rgba(0,0,0,0.05)"; e.currentTarget.style.color=t.text; }}
          onMouseLeave={(e) => { e.currentTarget.style.background="transparent"; e.currentTarget.style.color=t.muted; }}
        >
          <span style={{ fontSize:18, lineHeight:1, fontWeight:300, opacity:0.7 }}>+</span>
          <span>Add a card</span>
        </button>
      )}
    </div>
  );
}
KanbanColumn.propTypes = {
  column:PropTypes.object, dark:PropTypes.bool, colIndex:PropTypes.number, allColumns:PropTypes.array,
  onTaskClick:PropTypes.func, onMoveCard:PropTypes.func, onCopyCard:PropTypes.func, onDeleteCard:PropTypes.func,
  dragHandleProps:PropTypes.object, onToggleComplete:PropTypes.func, completedIds:PropTypes.object,
  boardId:PropTypes.number, onLog:PropTypes.func,
};

// ─────────────────────────────────────────────────────────────
//  SORTABLE COLUMN
// ─────────────────────────────────────────────────────────────
export function SortableColumn({ column, dark, colIndex, allColumns, onTaskClick, onMoveCard, onCopyCard, onDeleteCard, onToggleComplete, completedIds, boardId, onLog }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: `col-${column.id}`,
    animateLayoutChanges: () => true,
  });
  const style = {
    transform: CSS.Translate.toString(transform),
    transition: transition || 'transform 200ms ease',
    opacity: isDragging ? 0.35 : 1,
    zIndex: isDragging ? 999 : "auto",
  };
  return (
    <div ref={setNodeRef} className="kb-col-wrapper" style={{ ...style, width:272, flexShrink:0, alignSelf:"flex-start" }}>
      <KanbanColumn
        column={column} dark={dark} colIndex={colIndex} allColumns={allColumns}
        dragHandleProps={{ ...attributes, ...listeners }}
        onTaskClick={onTaskClick} onMoveCard={onMoveCard} onCopyCard={onCopyCard} onDeleteCard={onDeleteCard}
        onToggleComplete={onToggleComplete} completedIds={completedIds}
        boardId={boardId} onLog={onLog}
      />
    </div>
  );
}

SortableColumn.propTypes = {
  column:PropTypes.object, dark:PropTypes.bool, colIndex:PropTypes.number, allColumns:PropTypes.array,
  onTaskClick:PropTypes.func, onMoveCard:PropTypes.func, onCopyCard:PropTypes.func, onDeleteCard:PropTypes.func,
  onToggleComplete:PropTypes.func, completedIds:PropTypes.object, boardId:PropTypes.number, onLog:PropTypes.func,
};