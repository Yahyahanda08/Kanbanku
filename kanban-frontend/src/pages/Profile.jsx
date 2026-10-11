// ============================================================
//  ProfilePanel.jsx — Panel profil dengan SEMUA fitur berfungsi
//  Fitur:
//  - Foto profil: upload + preview + tombol Simpan
//  - Bio: edit inline + Simpan
//  - Visibilitas profil: public/private (tersimpan localStorage)
//  - Light Mode toggle
//  - Aktivitas: baca dari localStorage kanbanku_activity_*
//  - Pengaturan: toggle notif, privasi, bahasa (tersimpan localStorage)
//  - Ganti Akun / Kelola Akun
//  - Logout
// ============================================================

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import PropTypes from "prop-types";

const P = {
  dark:  { bg:"#1d2125", surface:"#22272b", hover:"#282e33", border:"rgba(255,255,255,.08)", text:"#b6c2cf", textBold:"#dee4ea", muted:"#738496", blue:"#579dff", blueBg:"rgba(87,157,255,.12)", green:"#4bce97", red:"#f87168", divider:"rgba(255,255,255,.1)" },
  light: { bg:"#ffffff", surface:"#f1f3f5", hover:"#e9ecef", border:"rgba(0,0,0,.06)",       text:"#374151", textBold:"#1f2937", muted:"#6c757d", blue:"#5b7cf6", blueBg:"rgba(91,124,246,.09)", green:"#16a34a", red:"#dc2626", divider:"rgba(0,0,0,.08)" },
};
function usePalette(dark) { return dark ? P.dark : P.light; }

const AVATAR_COLORS = ["#0747a6","#403294","#00875a","#bf2600","#ff8b00","#006644","#0052cc","#5e4db2"];
function avatarColor(name) {
  let h = 0;
  for (let i = 0; i < (name||"").length; i++) h = (h * 31 + name.charCodeAt(i)) & 0xffffffff;
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
}

// ── localStorage helpers ──────────────────────────────────────
const LS_BIO         = "kanbanku_profile_bio";
const LS_VISIBILITY  = "kanbanku_profile_visibility";
const LS_AVATAR      = "kanbanku_profile_avatar";      // base64 data URL
const LS_NOTIF_EMAIL = "kanbanku_setting_notif_email";
const LS_NOTIF_BROWSER = "kanbanku_setting_notif_browser";
const LS_SHOW_ACTIVITY = "kanbanku_setting_show_activity";
const LS_LANG        = "kanbanku_setting_lang";

function lsGet(key, def) { try { const v = localStorage.getItem(key); return v !== null ? JSON.parse(v) : def; } catch { return def; } }
function lsSet(key, val) { try { localStorage.setItem(key, JSON.stringify(val)); } catch { /* noop */ } }

function UserAvatar({ name, avatarUrl, size = 32, style = {} }) {
  const initials = (name || "?").split(" ").map(w=>w[0]).slice(0,2).join("").toUpperCase();
  if (avatarUrl) {
    return (
      <div style={{ width:size, height:size, borderRadius:"50%", overflow:"hidden", flexShrink:0, ...style }}>
        <img src={avatarUrl} alt={name} style={{ width:"100%", height:"100%", objectFit:"cover" }} />
      </div>
    );
  }
  return (
    <div style={{ width:size, height:size, borderRadius:"50%", background:avatarColor(name), display:"flex", alignItems:"center", justifyContent:"center", color:"white", fontSize:size*0.38, fontWeight:700, flexShrink:0, userSelect:"none", ...style }}>
      {initials}
    </div>
  );
}
UserAvatar.propTypes = { name:PropTypes.string, avatarUrl:PropTypes.string, size:PropTypes.number, style:PropTypes.object };

// ── AKTIVITAS ─────────────────────────────────────────────────
function ActivityPanel({ dark, user, onBack }) {
  const c = usePalette(dark);
  const [log] = useState(() => {
    try {
      const keys = Object.keys(localStorage).filter(k => k.startsWith("kanbanku_activity_"));
      return keys.flatMap(k => {
        try { return JSON.parse(localStorage.getItem(k)||"[]"); }
        catch { return []; }
      }).sort((a,b) => new Date(b.time)-new Date(a.time)).slice(0,50);
    } catch { return []; }
  });

  function timeAgo(d) {
    if (!d) return "";
    const s = (Date.now()-new Date(d))/1000;
    if(s<60) return "baru saja";
    if(s<3600) return `${Math.floor(s/60)} mnt lalu`;
    if(s<86400) return `${Math.floor(s/3600)} jam lalu`;
    return `${Math.floor(s/86400)} hari lalu`;
  }

  function fmtDate(d) {
    if (!d) return "";
    return new Date(d).toLocaleString("id-ID", { day:"numeric", month:"short", year:"numeric", hour:"2-digit", minute:"2-digit" });
  }

  return (
    <div>
      <div style={{ display:"flex", alignItems:"center", gap:10, padding:"12px 16px 10px", borderBottom:`1px solid ${c.divider}` }}>
        <button onClick={onBack} style={{ background:"transparent", border:"none", cursor:"pointer", color:c.muted, fontSize:16 }}>←</button>
        <span style={{ fontSize:13, fontWeight:700, color:c.textBold }}>Aktivitas Saya</span>
      </div>
      <div style={{ maxHeight:340, overflowY:"auto" }}>
        {!log.length ? (
          <div style={{ padding:"24px 16px", textAlign:"center", color:c.muted }}>
            <p style={{ fontSize:28, marginBottom:8 }}>📋</p>
            <p style={{ fontSize:13 }}>Belum ada aktivitas tercatat</p>
          </div>
        ) : log.map((a,i) => (
          <div key={i} style={{ display:"flex", gap:10, padding:"9px 16px", borderBottom:`1px solid ${c.divider}` }}>
            <div style={{ width:7, height:7, borderRadius:"50%", background:c.blue, flexShrink:0, marginTop:6 }} />
            <div style={{ flex:1, minWidth:0 }}>
              <p style={{ fontSize:12, color:c.text, lineHeight:1.4 }}>
                <b style={{ color:c.textBold }}>{a.user}</b> {a.action}
              </p>
              <div style={{ display:"flex", gap:8, marginTop:2 }}>
                <span style={{ fontSize:10, color:c.muted }}>{timeAgo(a.time)}</span>
                <span style={{ fontSize:10, color:c.muted, opacity:.5 }}>·</span>
                <span style={{ fontSize:10, color:c.muted }}>{fmtDate(a.time)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
ActivityPanel.propTypes = { dark:PropTypes.bool, user:PropTypes.object, onBack:PropTypes.func };

// ── PENGATURAN ────────────────────────────────────────────────
function SettingsPanel({ dark, onBack, user }) {
  const c = usePalette(dark);
  const [notifEmail,   setNotifEmail]   = useState(() => lsGet(LS_NOTIF_EMAIL, true));
  const [notifBrowser, setNotifBrowser] = useState(() => lsGet(LS_NOTIF_BROWSER, false));
  const [showActivity, setShowActivity] = useState(() => lsGet(LS_SHOW_ACTIVITY, true));
  const [lang,         setLang]         = useState(() => lsGet(LS_LANG, "id"));
  const [saved,        setSaved]        = useState(false);

  const handleSave = () => {
    lsSet(LS_NOTIF_EMAIL, notifEmail);
    lsSet(LS_NOTIF_BROWSER, notifBrowser);
    lsSet(LS_SHOW_ACTIVITY, showActivity);
    lsSet(LS_LANG, lang);
    // Aktifkan notifikasi browser jika diizinkan
    if (notifBrowser && Notification.permission !== "granted") {
      Notification.requestPermission();
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const Toggle = ({ val, set }) => (
    <button onClick={() => set(!val)} style={{ width:40, height:22, borderRadius:99, background:val?c.blue:"rgba(128,128,128,.3)", border:"none", cursor:"pointer", position:"relative", transition:"background .2s", flexShrink:0 }}>
      <span style={{ position:"absolute", top:3, left:val?20:3, width:16, height:16, borderRadius:"50%", background:"white", transition:"left .2s", boxShadow:"0 1px 4px rgba(0,0,0,.2)" }} />
    </button>
  );
  Toggle.propTypes = { val:PropTypes.bool, set:PropTypes.func };

  const Row = ({ label, desc, val, set }) => (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"10px 0", borderBottom:`1px solid ${c.divider}` }}>
      <div><p style={{ fontSize:13, color:c.textBold, fontWeight:500 }}>{label}</p>{desc&&<p style={{ fontSize:11, color:c.muted, marginTop:2 }}>{desc}</p>}</div>
      <Toggle val={val} set={set} />
    </div>
  );
  Row.propTypes = { label:PropTypes.string, desc:PropTypes.string, val:PropTypes.bool, set:PropTypes.func };

  return (
    <div>
      <div style={{ display:"flex", alignItems:"center", gap:10, padding:"12px 16px 10px", borderBottom:`1px solid ${c.divider}` }}>
        <button onClick={onBack} style={{ background:"transparent", border:"none", cursor:"pointer", color:c.muted, fontSize:16 }}>←</button>
        <span style={{ fontSize:13, fontWeight:700, color:c.textBold }}>Pengaturan Akun</span>
      </div>
      <div style={{ padding:"8px 16px 16px", maxHeight:340, overflowY:"auto" }}>
        <p style={{ fontSize:10, fontWeight:700, color:c.muted, textTransform:"uppercase", letterSpacing:.6, margin:"10px 0 4px" }}>Notifikasi</p>
        <Row label="Email"   desc="Kirim notifikasi ke emailmu"        val={notifEmail}   set={setNotifEmail} />
        <Row label="Browser" desc="Tampilkan notifikasi di browser"    val={notifBrowser} set={setNotifBrowser} />
        <p style={{ fontSize:10, fontWeight:700, color:c.muted, textTransform:"uppercase", letterSpacing:.6, margin:"14px 0 4px" }}>Privasi</p>
        <Row label="Tampilkan Aktivitas" desc="Izinkan orang lain melihat aktivitasmu" val={showActivity} set={setShowActivity} />
        <p style={{ fontSize:10, fontWeight:700, color:c.muted, textTransform:"uppercase", letterSpacing:.6, margin:"14px 0 6px" }}>Bahasa</p>
        <select value={lang} onChange={e=>setLang(e.target.value)} style={{ width:"100%", padding:"8px 10px", border:`1px solid ${c.divider}`, borderRadius:8, fontSize:13, background:c.surface, color:c.textBold, outline:"none", cursor:"pointer" }}>
          <option value="id">🇮🇩 Bahasa Indonesia</option>
          <option value="en">🇺🇸 English</option>
        </select>
        <p style={{ fontSize:11, color:c.muted, marginTop:10 }}>Akun: <b style={{ color:c.textBold }}>{user?.email}</b></p>
        <button onClick={handleSave}
          style={{ marginTop:14, width:"100%", padding:"9px", background:saved?c.green:c.blue, color:"white", border:"none", borderRadius:8, fontSize:13, fontWeight:700, cursor:"pointer", transition:"background .2s" }}>
          {saved ? "✓ Tersimpan!" : "Simpan Pengaturan"}
        </button>
      </div>
    </div>
  );
}
SettingsPanel.propTypes = { dark:PropTypes.bool, onBack:PropTypes.func, user:PropTypes.object };

// ── PROFIL SAYA ───────────────────────────────────────────────
function ProfileVisibilityPanel({ dark, user, onBack, onAvatarChange }) {
  const c = usePalette(dark);

  // Baca dari localStorage
  const [bio,          setBio]          = useState(() => lsGet(LS_BIO, ""));
  const [visibility,   setVisibility]   = useState(() => lsGet(LS_VISIBILITY, "public"));
  const [avatarPreview, setAvatarPreview] = useState(() => lsGet(LS_AVATAR, null)); // preview sebelum simpan
  const [avatarFile,   setAvatarFile]   = useState(null); // file object
  const [editBio,      setEditBio]      = useState(false);
  const [bioInput,     setBioInput]     = useState(() => lsGet(LS_BIO, ""));
  const [saved,        setSaved]        = useState(false);
  const [savedBio,     setSavedBio]     = useState(false);
  const fileRef = useRef();

  const handleFileChange = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setAvatarPreview(ev.target.result); // tampilkan preview
      setAvatarFile(f);
    };
    reader.readAsDataURL(f);
  };

  const handleSaveAvatar = () => {
    if (!avatarPreview) return;
    // Simpan base64 ke localStorage
    lsSet(LS_AVATAR, avatarPreview);
    // Notify parent (untuk update UI)
    if (onAvatarChange) onAvatarChange(avatarPreview);
    // Dispatch BOTH: StorageEvent (cross-tab) + custom event (same-tab)
    window.dispatchEvent(new StorageEvent("storage", {
      key: LS_AVATAR,
      newValue: JSON.stringify(avatarPreview),
    }));
    window.dispatchEvent(new CustomEvent("kanbanku_avatar_updated"));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    setAvatarFile(null);
  };

  const handleSaveBio = () => {
    lsSet(LS_BIO, bioInput);
    setBio(bioInput);
    setEditBio(false);
    setSavedBio(true);
    setTimeout(() => setSavedBio(false), 2000);
  };

  const handleSaveVisibility = (v) => {
    setVisibility(v);
    lsSet(LS_VISIBILITY, v);
  };

  return (
    <div>
      <div style={{ display:"flex", alignItems:"center", gap:10, padding:"12px 16px 10px", borderBottom:`1px solid ${c.divider}` }}>
        <button onClick={onBack} style={{ background:"transparent", border:"none", cursor:"pointer", color:c.muted, fontSize:16 }}>←</button>
        <span style={{ fontSize:13, fontWeight:700, color:c.textBold }}>Profil Saya</span>
      </div>

      <div style={{ padding:"16px", maxHeight:380, overflowY:"auto" }}>
        {/* ── Foto Profil ── */}
        <div style={{ marginBottom:16 }}>
          <p style={{ fontSize:11, fontWeight:700, color:c.muted, textTransform:"uppercase", letterSpacing:.5, marginBottom:10 }}>Foto Profil</p>
          <div style={{ display:"flex", gap:14, alignItems:"center" }}>
            <div style={{ position:"relative", flexShrink:0 }}>
              {/* Preview avatar — tampilkan foto yang diupload atau inisial */}
              {avatarPreview ? (
                <div style={{ width:64, height:64, borderRadius:"50%", overflow:"hidden", border:`2px solid ${c.blue}` }}>
                  <img src={avatarPreview} alt="preview" style={{ width:"100%", height:"100%", objectFit:"cover" }} />
                </div>
              ) : (
                <UserAvatar name={user?.name} size={64} />
              )}
              <button onClick={() => fileRef.current?.click()}
                style={{ position:"absolute", bottom:0, right:0, width:22, height:22, borderRadius:"50%", background:c.blue, border:`2px solid ${c.bg}`, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", color:"white", fontSize:11 }}
                title="Pilih foto">✎</button>
              <input ref={fileRef} type="file" accept="image/*" style={{ display:"none" }} onChange={handleFileChange} />
            </div>
            <div style={{ flex:1, minWidth:0 }}>
              <p style={{ fontSize:13, fontWeight:700, color:c.textBold, marginBottom:2 }}>{user?.name}</p>
              <p style={{ fontSize:11, color:c.muted, marginBottom:8 }}>{user?.email}</p>
              <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                <button onClick={() => fileRef.current?.click()}
                  style={{ fontSize:11, color:c.blue, background:"transparent", border:`1px solid ${c.blue}`, borderRadius:5, padding:"3px 10px", cursor:"pointer" }}>
                  Pilih Foto
                </button>
                {avatarPreview && avatarFile && (
                  <button onClick={handleSaveAvatar}
                    style={{ fontSize:11, color:"white", background:saved?"#16a34a":c.blue, border:"none", borderRadius:5, padding:"3px 10px", cursor:"pointer", fontWeight:700, transition:"background .2s" }}>
                    {saved ? "✓ Tersimpan!" : "Simpan Foto"}
                  </button>
                )}
                {saved && !avatarFile && (
                  <span style={{ fontSize:11, color:c.green, fontWeight:600 }}>✓ Foto tersimpan</span>
                )}
                {avatarPreview && (
                  <button onClick={() => {
                    setAvatarPreview(null); setAvatarFile(null);
                    lsSet(LS_AVATAR, null);
                    if(onAvatarChange) onAvatarChange(null);
                    window.dispatchEvent(new StorageEvent("storage", { key: LS_AVATAR, newValue: null }));
                    window.dispatchEvent(new CustomEvent("kanbanku_avatar_updated"));
                  }}
                    style={{ fontSize:11, color:c.muted, background:"transparent", border:`1px solid ${c.divider}`, borderRadius:5, padding:"3px 8px", cursor:"pointer" }}>
                    Hapus
                  </button>
                )}
              </div>
              {avatarFile && !saved && (
                <p style={{ fontSize:10, color:c.muted, marginTop:4 }}>⚠️ Klik "Simpan Foto" untuk menyimpan perubahan</p>
              )}
            </div>
          </div>
        </div>

        {/* Divider */}
        <div style={{ height:1, background:c.divider, marginBottom:14 }} />

        {/* ── Bio ── */}
        <div style={{ marginBottom:14 }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6 }}>
            <p style={{ fontSize:11, fontWeight:700, color:c.muted, textTransform:"uppercase", letterSpacing:.5 }}>Bio</p>
            {savedBio && <span style={{ fontSize:10, color:c.green, fontWeight:600 }}>✓ Tersimpan!</span>}
          </div>
          {editBio ? (
            <div>
              <textarea value={bioInput} onChange={e=>setBioInput(e.target.value)}
                placeholder="Ceritakan tentang dirimu..." rows={3}
                style={{ width:"100%", padding:"8px 10px", border:`1.5px solid ${c.blue}`, borderRadius:8, fontSize:12, background:c.surface, color:c.textBold, outline:"none", resize:"none", boxSizing:"border-box" }} />
              <div style={{ display:"flex", gap:6, marginTop:6 }}>
                <button onClick={handleSaveBio}
                  style={{ padding:"5px 14px", background:c.blue, color:"white", border:"none", borderRadius:6, fontSize:12, fontWeight:700, cursor:"pointer" }}>Simpan</button>
                <button onClick={() => { setBioInput(bio); setEditBio(false); }}
                  style={{ padding:"5px 10px", background:"transparent", border:`1px solid ${c.divider}`, borderRadius:6, fontSize:12, color:c.muted, cursor:"pointer" }}>Batal</button>
              </div>
            </div>
          ) : (
            <div onClick={() => setEditBio(true)}
              style={{ fontSize:12, color:bio?c.text:c.muted, fontStyle:bio?"normal":"italic", background:c.surface, padding:"8px 10px", borderRadius:8, cursor:"text", border:`1px solid ${c.divider}`, minHeight:44 }}>
              {bio || "Klik untuk menambah bio..."}
            </div>
          )}
        </div>

        {/* Divider */}
        <div style={{ height:1, background:c.divider, marginBottom:14 }} />

        {/* ── Visibilitas Profil ── */}
        <div>
          <p style={{ fontSize:11, fontWeight:700, color:c.muted, textTransform:"uppercase", letterSpacing:.5, marginBottom:8 }}>Visibilitas Profil</p>
          {["public","private"].map(v => (
            <button key={v} onClick={() => handleSaveVisibility(v)}
              style={{ width:"100%", display:"flex", alignItems:"center", gap:10, padding:"9px 12px", borderRadius:9, border:`1.5px solid ${visibility===v?c.blue:c.divider}`, background:visibility===v?c.blueBg:"transparent", cursor:"pointer", marginBottom:6, textAlign:"left", transition:"all .15s" }}
            >
              <span style={{ fontSize:16 }}>{v==="public"?"🌐":"🔒"}</span>
              <div style={{ flex:1 }}>
                <p style={{ fontSize:12, fontWeight:600, color:c.textBold }}>{v==="public"?"Publik":"Privat"}</p>
                <p style={{ fontSize:11, color:c.muted }}>{v==="public"?"Semua orang bisa melihat profil ini":"Hanya kamu yang bisa melihat profil ini"}</p>
              </div>
              {visibility===v && <span style={{ color:c.blue, fontWeight:700 }}>✓</span>}
            </button>
          ))}
          <p style={{ fontSize:10, color:c.muted, marginTop:6 }}>✓ Visibilitas tersimpan otomatis</p>
        </div>
      </div>
    </div>
  );
}
ProfileVisibilityPanel.propTypes = { dark:PropTypes.bool, user:PropTypes.object, onBack:PropTypes.func, onAvatarChange:PropTypes.func };

// ── KOMPONEN UTAMA ────────────────────────────────────────────
export default function ProfilePanel({ dark, user, onDarkChange, onLogout, anchorRef, onManageAccount }) {
  const c = usePalette(dark);
  const [panel,     setPanel]     = useState("main");
  const [showTheme, setShowTheme] = useState(false);
  const panelRef = useRef();
  const [pos, setPos] = useState({ top:52, right:8 });

  // Baca avatar dari localStorage (untuk tampil di header panel)
  const [avatarUrl, setAvatarUrl] = useState(() => lsGet(LS_AVATAR, null));

  const handleAvatarChange = (url) => {
    setAvatarUrl(url); // Update header panel langsung
  };

  // Listen perubahan avatar dari sub-panel
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === LS_AVATAR) {
        try { setAvatarUrl(e.newValue ? JSON.parse(e.newValue) : null); } catch { /* noop */ }
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  useEffect(() => {
    if (anchorRef?.current) {
      const rect = anchorRef.current.getBoundingClientRect();
      setPos({ top: rect.bottom + 6, right: Math.max(8, window.innerWidth - rect.right) });
    }
  }, [anchorRef]);

  useEffect(() => {
    const fn = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        // Jangan tutup jika klik di ThemeModal
        const themeModal = document.getElementById("theme-modal-overlay");
        if (themeModal && themeModal.contains(e.target)) return;
        onLogout?.("close");
      }
    };
    const timer = setTimeout(() => document.addEventListener("mousedown", fn), 100);
    return () => { clearTimeout(timer); document.removeEventListener("mousedown", fn); };
  }, [onLogout]);

  const menuItemsTop = [
    {
      label: "Profil Saya",
      icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
      action: () => setPanel("profile"),
    },
    {
      label: "Aktivitas",
      icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>,
      action: () => setPanel("activity"),
    },
    {
      label: "Pengaturan",
      icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93A10 10 0 1 0 21 12h-1"/></svg>,
      action: () => setPanel("settings"),
    },
  ];

  return createPortal(
    <>
      <div ref={panelRef} style={{ position:"fixed", top:pos.top, right:pos.right, width:300, zIndex:9998, background:c.bg, border:`1px solid ${c.divider}`, borderRadius:12, boxShadow:"0 16px 48px rgba(0,0,0,.35)", overflow:"hidden", animation:"profileDropIn .18s ease", fontFamily:"'DM Sans',sans-serif" }}>
        {panel==="main" && (
          <>
            {/* Header akun */}
            <div style={{ padding:"14px 16px", borderBottom:`1px solid ${c.divider}` }}>
              <p style={{ fontSize:10, fontWeight:700, color:c.muted, textTransform:"uppercase", letterSpacing:.7, marginBottom:10 }}>Akun</p>
              <div style={{ display:"flex", gap:12, alignItems:"center" }}>
                <UserAvatar name={user?.name} avatarUrl={avatarUrl} size={40} />
                <div style={{ flex:1, minWidth:0 }}>
                  <p style={{ fontSize:14, fontWeight:700, color:c.textBold, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{user?.name||"Pengguna"}</p>
                  <p style={{ fontSize:12, color:c.muted, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{user?.email||"email@contoh.com"}</p>
                </div>
              </div>
            </div>

            {/* Ganti Akun */}
            <button
              style={{ width:"100%", display:"flex", alignItems:"center", justifyContent:"center", padding:"9px 16px", background:"transparent", border:"none", borderBottom:`1px solid ${c.divider}`, cursor:"pointer", fontSize:13, fontWeight:600, color:c.textBold }}
              onMouseEnter={e=>(e.currentTarget.style.background=c.hover)}
              onMouseLeave={e=>(e.currentTarget.style.background="transparent")}
              onClick={() => alert("Fitur ganti akun belum tersedia")}
            >Ganti Akun</button>

            {/* Kelola Akun */}
            <button
              style={{ width:"100%", display:"flex", alignItems:"center", justifyContent:"center", padding:"9px 16px", background:"transparent", border:"none", borderBottom:`1px solid ${c.divider}`, cursor:"pointer", fontSize:13, color:c.textBold, gap:6 }}
              onMouseEnter={e=>(e.currentTarget.style.background=c.hover)}
              onMouseLeave={e=>(e.currentTarget.style.background="transparent")}
              onClick={() => { if (onManageAccount) { onManageAccount(); onLogout?.("close"); } else setPanel("profile"); }}
            >Kelola Akun ↗</button>

            <div style={{ padding:"8px 0" }}>
              {/* Menu: Profil, Aktivitas, Pengaturan */}
              {menuItemsTop.map((item, i) => (
                <button key={i} onClick={item.action}
                  style={{ width:"100%", display:"flex", alignItems:"center", gap:10, padding:"10px 16px", background:"transparent", border:"none", cursor:"pointer", textAlign:"left" }}
                  onMouseEnter={e=>(e.currentTarget.style.background=c.hover)}
                  onMouseLeave={e=>(e.currentTarget.style.background="transparent")}
                >
                  <span style={{ color:c.muted, flexShrink:0, display:"flex" }}>{item.icon}</span>
                  <span style={{ fontSize:13, color:c.textBold, flex:1 }}>{item.label}</span>
                  <span style={{ fontSize:11, color:c.muted }}>›</span>
                </button>
              ))}

              <div style={{ height:1, background:c.divider, margin:"6px 0" }} />

              {/* Light Mode toggle */}
              <div style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 16px" }}>
                <span style={{ color:c.muted, flexShrink:0, display:"flex" }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="5"/>
                    <line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
                    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
                    <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
                  </svg>
                </span>
                <span style={{ fontSize:13, color:c.textBold, flex:1 }}>Light Mode</span>
                <button
                  onClick={() => onDarkChange(!dark)}
                  style={{ width:42, height:24, borderRadius:99, background:!dark?c.blue:"rgba(128,128,128,.35)", border:"none", cursor:"pointer", position:"relative", transition:"background .25s", flexShrink:0, padding:0 }}
                >
                  <span style={{ position:"absolute", top:3, left:!dark?21:3, width:18, height:18, borderRadius:"50%", background:"white", transition:"left .25s", boxShadow:"0 1px 4px rgba(0,0,0,.25)", display:"block" }} />
                </button>
              </div>

              <div style={{ height:1, background:c.divider, margin:"6px 0" }} />

              {/* Logout */}
              <button
                onClick={() => onLogout?.("logout")}
                style={{ width:"100%", display:"flex", alignItems:"center", gap:10, padding:"10px 16px", background:"transparent", border:"none", cursor:"pointer", textAlign:"left" }}
                onMouseEnter={e=>(e.currentTarget.style.background="rgba(248,113,104,.1)")}
                onMouseLeave={e=>(e.currentTarget.style.background="transparent")}
              >
                <span style={{ color:c.red, flexShrink:0, display:"flex" }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                    <polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
                  </svg>
                </span>
                <span style={{ fontSize:13, color:c.red, flex:1, fontWeight:600 }}>Logout</span>
              </button>
            </div>
          </>
        )}

        {panel==="profile" && (
          <ProfileVisibilityPanel
            dark={dark}
            user={user}
            onBack={() => setPanel("main")}
            onAvatarChange={handleAvatarChange}
          />
        )}
        {panel==="activity" && <ActivityPanel dark={dark} user={user} onBack={() => setPanel("main")} />}
        {panel==="settings" && <SettingsPanel dark={dark} user={user} onBack={() => setPanel("main")} />}
      </div>

      <style>{`
        @keyframes profileDropIn { from{opacity:0;transform:translateY(-10px) scale(.97)} to{opacity:1;transform:none} }
      `}</style>
    </>,
    document.body
  );
}
ProfilePanel.propTypes = {
  dark:PropTypes.bool,
  user:PropTypes.object,
  onDarkChange:PropTypes.func,
  onLogout:PropTypes.func,
  anchorRef:PropTypes.object,
  onManageAccount:PropTypes.func,
};