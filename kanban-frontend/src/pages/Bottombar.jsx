// ============================================================
//  BottomBar.jsx — Trello-style floating pill bottom nav
// ============================================================

import { useState } from "react";
import PropTypes from "prop-types";

const TABS = [
  {
    id: "board",
    label: "Board",
    icon: (active, color) => (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={active ? color : "currentColor"} strokeWidth={active ? 2.5 : 1.8} strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="9"/><rect x="14" y="3" width="7" height="5"/>
        <rect x="14" y="12" width="7" height="9"/><rect x="3" y="16" width="7" height="5"/>
      </svg>
    ),
  },
  {
    id: "timeline",
    label: "Timeline",
    icon: (active, color) => (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={active ? color : "currentColor"} strokeWidth={active ? 2.5 : 1.8} strokeLinecap="round" strokeLinejoin="round">
        <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
        <circle cx="7"  cy="6"  r="2" fill={active ? color : "none"}/>
        <circle cx="14" cy="12" r="2" fill={active ? color : "none"}/>
        <circle cx="10" cy="18" r="2" fill={active ? color : "none"}/>
      </svg>
    ),
  },
  {
    id: "calendar",
    label: "Kalender",
    icon: (active, color) => (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={active ? color : "currentColor"} strokeWidth={active ? 2.5 : 1.8} strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2"/>
        <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
        <line x1="3" y1="10" x2="21" y2="10"/>
        <circle cx="12" cy="16" r="1.5" fill={active ? color : "none"} stroke="none"/>
      </svg>
    ),
  },
  {
    id: "focus",
    label: "Fokus",
    icon: (active, color) => (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={active ? color : "currentColor"} strokeWidth={active ? 2.5 : 1.8} strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3"/><circle cx="12" cy="12" r="7"/>
        <line x1="12" y1="2"  x2="12" y2="5"/><line x1="12" y1="19" x2="12" y2="22"/>
        <line x1="2"  y1="12" x2="5"  y2="12"/><line x1="19" y1="12" x2="22" y2="12"/>
      </svg>
    ),
  },
  {
    id: "stats",
    label: "Statistik",
    icon: (active, color) => (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={active ? color : "currentColor"} strokeWidth={active ? 2.5 : 1.8} strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/>
        <line x1="6"  y1="20" x2="6"  y2="14"/><line x1="2" y1="20" x2="22" y2="20"/>
      </svg>
    ),
  },
];

export default function BottomBar({ dark, active, onChange, boardData }) {
  const [hovering,  setHovering]  = useState(null);
  const [showPanel, setShowPanel] = useState(false);

  const blue        = "#0052cc";
  const bg          = dark ? "rgba(15,23,42,0.96)"   : "rgba(255,255,255,0.96)";
  const bdr         = dark ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.10)";
  const text        = dark ? "#94a3b8"                : "#5e6c84";
  const activeText  = dark ? "#93c5fd"                : blue;
  const activeColor = dark ? "#3b82f6"                : blue;
  const activeBg    = dark ? "rgba(59,130,246,0.15)"  : "rgba(0,82,204,0.08)";

  const handleTab = (id) => {
    onChange?.(id);
    if (id !== "board") setShowPanel(true);
    else setShowPanel(false);
  };

  // Quick stats
  const totalCards = boardData?.columns?.reduce((acc, c) => acc + (c.tasks?.length || 0), 0) || 0;
  const doneKeys   = Object.keys(localStorage).filter(k => k.startsWith("kanbanku_completed_"));
  const totalDone  = doneKeys.reduce((acc, k) => {
    try { return acc + (JSON.parse(localStorage.getItem(k) || "[]").length || 0); }
    catch (_e) { return acc; }
  }, 0);

  const currentActive = active || "board";

  return (
    <>
      {/* ── PANEL (muncul di atas bar saat tab non-board aktif) ── */}
      {showPanel && currentActive !== "board" && (
        <div style={{
          position: "fixed", bottom: 72, left: "50%", transform: "translateX(-50%)",
          zIndex: 200, background: bg,
          border: `1px solid ${bdr}`,
          borderRadius: 16,
          boxShadow: dark
            ? "0 -4px 32px rgba(0,0,0,.5), 0 0 0 1px rgba(255,255,255,.06)"
            : "0 -4px 24px rgba(0,0,0,.12)",
          animation: "bottomPanelUp .2s ease",
          maxWidth: 520, width: "calc(100vw - 32px)",
          overflow: "hidden",
        }}>
          {currentActive === "timeline" && (
            <div style={{ padding: "16px 20px", display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: dark ? "#f1f5f9" : "#172b4d", marginBottom: 4 }}>📅 Timeline View</p>
                <p style={{ fontSize: 12, color: text }}>Visualisasi timeline akan tersedia segera. Fitur ini menampilkan seluruh card berdasarkan deadline dalam bentuk Gantt chart.</p>
              </div>
              <div style={{ fontSize: 40 }}>🚧</div>
            </div>
          )}
          {currentActive === "calendar" && (
            <div style={{ padding: "16px 20px", display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: dark ? "#f1f5f9" : "#172b4d", marginBottom: 4 }}>📆 Kalender Board</p>
                <p style={{ fontSize: 12, color: text }}>Tampilkan semua card yang memiliki deadline di kalender bulanan. Coming soon!</p>
              </div>
              <div style={{ fontSize: 40 }}>📆</div>
            </div>
          )}
          {currentActive === "focus" && (
            <div style={{ padding: "16px 20px" }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: dark ? "#f1f5f9" : "#172b4d", marginBottom: 8 }}>🎯 Mode Fokus</p>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {boardData?.columns?.flatMap(c => c.tasks || []).filter(t => !t.is_completed).slice(0, 3).map(task => (
                  <div key={task.id} style={{ padding: "6px 12px", borderRadius: 8, background: dark ? "#1e293b" : "#f8fafc", border: `1px solid ${bdr}`, fontSize: 12, color: dark ? "#e2e8f0" : "#334155", maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    ⚡ {typeof task.title === "string" ? task.title.replace(/<[^>]+>/g, "") : task.title}
                  </div>
                ))}
                {!boardData && <p style={{ fontSize: 12, color: text }}>Tidak ada task aktif</p>}
              </div>
            </div>
          )}
          {currentActive === "stats" && (
            <div style={{ padding: "14px 20px", display: "flex", gap: 12, flexWrap: "wrap" }}>
              {[
                { label: "Total Card", value: totalCards,                      icon: "🗂️", color: "#0052cc" },
                { label: "Selesai",    value: totalDone,                        icon: "✅", color: "#16a34a" },
                { label: "Kolom",      value: boardData?.columns?.length || 0, icon: "📋", color: "#7c3aed" },
                { label: "Anggota",    value: boardData?.members?.length || 1, icon: "👥", color: "#d97706" },
              ].map(s => (
                <div key={s.label} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", borderRadius: 10, background: dark ? "rgba(255,255,255,.05)" : "rgba(0,0,0,.04)", border: `1px solid ${bdr}` }}>
                  <span style={{ fontSize: 20 }}>{s.icon}</span>
                  <div>
                    <p style={{ fontSize: 18, fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.value}</p>
                    <p style={{ fontSize: 10, color: text, fontWeight: 600 }}>{s.label}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
          <button onClick={() => setShowPanel(false)} style={{ position: "absolute", top: 10, right: 12, background: "transparent", border: "none", cursor: "pointer", color: text, fontSize: 16 }}>✕</button>
        </div>
      )}

      {/* ── FLOATING PILL BOTTOM BAR ── */}
      <div style={{
        position: "fixed",
        bottom: 12,
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 201,
        background: bg,
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        border: `1px solid ${bdr}`,
        borderRadius: 999,
        boxShadow: dark
          ? "0 8px 32px rgba(0,0,0,.6), 0 0 0 1px rgba(255,255,255,.06)"
          : "0 8px 24px rgba(0,0,0,.14), 0 2px 8px rgba(0,0,0,.08)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "4px 6px",
        gap: 2,
        fontFamily: "'DM Sans',sans-serif",
        whiteSpace: "nowrap",
      }}>
        {TABS.map(tab => {
          const isActive = currentActive === tab.id;
          const isHov    = hovering === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => handleTab(tab.id)}
              onMouseEnter={() => setHovering(tab.id)}
              onMouseLeave={() => setHovering(null)}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 3,
                padding: "7px 14px",
                border: "none",
                background: isActive ? activeBg : "transparent",
                cursor: "pointer",
                borderRadius: 999,
                transition: "all .18s cubic-bezier(.4,0,.2,1)",
                color: isActive ? activeText : isHov ? (dark ? "#cbd5e1" : "#334155") : text,
                position: "relative",
                minWidth: 56,
              }}
            >
              {tab.icon(isActive, activeColor)}
              <span style={{
                fontSize: 10,
                fontWeight: isActive ? 700 : 500,
                letterSpacing: 0.2,
                lineHeight: 1,
              }}>
                {tab.label}
              </span>
              {/* Active dot */}
              {isActive && (
                <span style={{
                  position: "absolute",
                  bottom: 4,
                  left: "50%",
                  transform: "translateX(-50%)",
                  width: 4,
                  height: 4,
                  borderRadius: "50%",
                  background: activeColor,
                  boxShadow: `0 0 6px ${activeColor}`,
                }} />
              )}
            </button>
          );
        })}
      </div>

      <style>{`
        @keyframes bottomPanelUp {
          from { opacity:0; transform: translateX(-50%) translateY(12px); }
          to   { opacity:1; transform: translateX(-50%) translateY(0); }
        }
      `}</style>
    </>
  );
}

BottomBar.propTypes = {
  dark:      PropTypes.bool,
  active:    PropTypes.string,
  onChange:  PropTypes.func,
  boardData: PropTypes.object,
};