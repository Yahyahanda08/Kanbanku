// ============================================================
//  ManageAccount.jsx — Halaman kelola akun pengguna
//  Mirip Atlassian Profile and Visibility
//  Data disimpan di localStorage: kanbanku_account_*
// ============================================================

import { useState, useRef, useEffect } from "react";
import PropTypes from "prop-types";
import api from "../api/axios";

const LS_PREFIX = "kanbanku_account_";
function lsGet(key, def) { try { const v = localStorage.getItem(LS_PREFIX + key); return v !== null ? JSON.parse(v) : def; } catch { return def; } }
function lsSet(key, val) { try { localStorage.setItem(LS_PREFIX + key, JSON.stringify(val)); } catch { /* noop */ } }

const VISIBILITY_OPTIONS = ["Anyone", "Only you", "Organization members"];

function useTheme(dark) {
  return {
    bg:           dark ? "#0f172a" : "#f8f9fa",
    surface:      dark ? "#1e293b" : "#ffffff",
    surfaceAlt:   dark ? "#111827" : "#f1f3f5",
    surfaceHover: dark ? "#1e3a5f" : "#e9ecef",
    text:         dark ? "#f1f5f9" : "#1f2937",
    muted:        dark ? "#94a3b8" : "#6c757d",
    border:       dark ? "#334155" : "#dee2e6",
    blue:         "#5b7cf6",
    blueBright:   "#4a6af4",
    blueLight:    dark ? "rgba(91,124,246,.15)" : "rgba(91,124,246,.09)",
    red:          "#dc2626",
    green:        "#16a34a",
    navBg:        dark ? "rgba(8,14,26,0.98)" : "rgba(255,255,255,0.97)",
  };
}

// ── Avatar Circle ─────────────────────────────────────────────
function AvatarCircle({ name, avatarUrl, size = 80 }) {
  const colors = ["#0747a6","#403294","#00875a","#bf2600","#0052cc","#5e4db2"];
  let h = 0;
  for (let i = 0; i < (name||"").length; i++) h = (h * 31 + name.charCodeAt(i)) & 0xffffffff;
  const bg = colors[Math.abs(h) % colors.length];
  const initials = (name||"?").split(" ").map(w=>w[0]).slice(0,2).join("").toUpperCase();

  if (avatarUrl) return (
    <div style={{ width:size, height:size, borderRadius:"50%", overflow:"hidden", flexShrink:0 }}>
      <img src={avatarUrl} alt={name} style={{ width:"100%", height:"100%", objectFit:"cover" }} />
    </div>
  );
  return (
    <div style={{ width:size, height:size, borderRadius:"50%", background:bg, display:"flex", alignItems:"center", justifyContent:"center", color:"white", fontSize:size*0.35, fontWeight:700, flexShrink:0 }}>
      {initials}
    </div>
  );
}
AvatarCircle.propTypes = { name:PropTypes.string, avatarUrl:PropTypes.string, size:PropTypes.number };

// ── Visibility Select ─────────────────────────────────────────
function VisibilitySelect({ value, onChange, dark, t }) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      style={{ padding:"5px 10px", border:`1px solid ${t.border}`, borderRadius:7, fontSize:12, background:t.surfaceAlt, color:t.text, cursor:"pointer", outline:"none", minWidth:120 }}
    >
      {VISIBILITY_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
    </select>
  );
}
VisibilitySelect.propTypes = { value:PropTypes.string, onChange:PropTypes.func, dark:PropTypes.bool, t:PropTypes.object };

// ── Editable Field ────────────────────────────────────────────
function EditableField({ label, value, onChange, placeholder, t, multiline = false }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef();

  useEffect(() => { if (editing) inputRef.current?.focus(); }, [editing]);
  useEffect(() => { setDraft(value); }, [value]);

  const save = () => {
    onChange(draft);
    setEditing(false);
  };

  const cancel = () => {
    setDraft(value);
    setEditing(false);
  };

  return (
    <div style={{ flex:1 }}>
      {editing ? (
        <div>
          {multiline ? (
            <textarea
              ref={inputRef}
              value={draft}
              onChange={e => setDraft(e.target.value)}
              rows={3}
              style={{ width:"100%", padding:"8px 10px", border:`1.5px solid ${t.blue}`, borderRadius:8, fontSize:14, background:t.surface, color:t.text, outline:"none", resize:"vertical", boxSizing:"border-box", fontFamily:"inherit" }}
            />
          ) : (
            <input
              ref={inputRef}
              value={draft}
              onChange={e => setDraft(e.target.value)}
              onKeyDown={e => { if(e.key==="Enter") save(); if(e.key==="Escape") cancel(); }}
              style={{ width:"100%", padding:"8px 10px", border:`1.5px solid ${t.blue}`, borderRadius:8, fontSize:14, background:t.surface, color:t.text, outline:"none", boxSizing:"border-box" }}
            />
          )}
          <div style={{ display:"flex", gap:8, marginTop:8 }}>
            <button onClick={save} style={{ padding:"6px 16px", background:t.blue, color:"white", border:"none", borderRadius:7, fontSize:13, fontWeight:700, cursor:"pointer" }}>Simpan</button>
            <button onClick={cancel} style={{ padding:"6px 12px", background:"transparent", border:`1px solid ${t.border}`, borderRadius:7, fontSize:13, color:t.muted, cursor:"pointer" }}>Batal</button>
          </div>
        </div>
      ) : (
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <span style={{ fontSize:14, color: draft ? t.text : t.muted, fontStyle: draft ? "normal" : "italic", flex:1 }}>
            {draft || placeholder}
          </span>
          <button
            onClick={() => setEditing(true)}
            style={{ padding:"4px 12px", background:"transparent", border:`1px solid ${t.border}`, borderRadius:6, fontSize:12, color:t.muted, cursor:"pointer", whiteSpace:"nowrap", flexShrink:0 }}
            onMouseEnter={e => { e.currentTarget.style.borderColor=t.blue; e.currentTarget.style.color=t.blue; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor=t.border; e.currentTarget.style.color=t.muted; }}
          >Edit</button>
        </div>
      )}
    </div>
  );
}
EditableField.propTypes = { label:PropTypes.string, value:PropTypes.string, onChange:PropTypes.func, placeholder:PropTypes.string, t:PropTypes.object, multiline:PropTypes.bool };

// ── Row dengan label + field + visibility ─────────────────────
function ProfileRow({ label, fieldKey, fields, setFields, t, dark, placeholder, showVisibility = true, multiline = false }) {
  return (
    <div style={{ padding:"16px 0", borderBottom:`1px solid ${t.border}`, display:"flex", flexDirection:"column", gap:10 }}>
      <div style={{ display:"flex", alignItems:"flex-start", gap:12, flexWrap:"wrap" }}>
        <div style={{ minWidth:180, flexShrink:0 }}>
          <p style={{ fontSize:13, fontWeight:600, color:t.text, marginBottom:2 }}>{label}</p>
        </div>
        <EditableField
          label={label}
          value={fields[fieldKey]?.value || ""}
          onChange={v => setFields(prev => ({ ...prev, [fieldKey]: { ...prev[fieldKey], value: v } }))}
          placeholder={placeholder}
          t={t}
        />
        {showVisibility && (
          <VisibilitySelect
            value={fields[fieldKey]?.visibility || "Anyone"}
            onChange={v => setFields(prev => ({ ...prev, [fieldKey]: { ...prev[fieldKey], visibility: v } }))}
            dark={dark}
            t={t}
          />
        )}
      </div>
    </div>
  );
}
ProfileRow.propTypes = { label:PropTypes.string, fieldKey:PropTypes.string, fields:PropTypes.object, setFields:PropTypes.func, t:PropTypes.object, dark:PropTypes.bool, placeholder:PropTypes.string, showVisibility:PropTypes.bool, multiline:PropTypes.bool };

// ── MAIN COMPONENT ────────────────────────────────────────────
export default function ManageAccount({ dark, user, onBack }) {
  const t = useTheme(dark);
  const fileRef = useRef();

  // Baca avatar dari localStorage
  const LS_AVATAR = "kanbanku_profile_avatar";
  const readAvatar = () => {
    try { const r = localStorage.getItem(LS_AVATAR); if (!r) return null; try { return JSON.parse(r); } catch { return r; } } catch { return null; }
  };
  const [avatarUrl, setAvatarUrl] = useState(readAvatar);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [avatarSaved, setAvatarSaved] = useState(false);

  // Profile fields
  const [fields, setFields] = useState(() => ({
    fullName:    { value: lsGet("fullName",    user?.name || ""), visibility: lsGet("vis_fullName",    "Anyone") },
    publicName:  { value: lsGet("publicName",  user?.name || ""), visibility: lsGet("vis_publicName",  "Anyone") },
    pronouns:    { value: lsGet("pronouns",    ""),               visibility: lsGet("vis_pronouns",    "Anyone") },
    jobTitle:    { value: lsGet("jobTitle",    ""),               visibility: lsGet("vis_jobTitle",    "Anyone") },
    department:  { value: lsGet("department",  ""),               visibility: lsGet("vis_department",  "Anyone") },
    organization:{ value: lsGet("organization",""),               visibility: lsGet("vis_organization","Anyone") },
    basedIn:     { value: lsGet("basedIn",     ""),               visibility: lsGet("vis_basedIn",     "Anyone") },
    workingWith: { value: lsGet("workingWith", ""),               visibility: lsGet("vis_workingWith", "Anyone") },
  }));

  // Photo visibility
  const [photoVisibility, setPhotoVisibility] = useState(() => lsGet("vis_photo", "Anyone"));

  // Auto-save fields ke localStorage saat berubah
  useEffect(() => {
    Object.entries(fields).forEach(([key, data]) => {
      lsSet(key, data.value);
      lsSet("vis_" + key, data.visibility);
    });
  }, [fields]);

  useEffect(() => { lsSet("vis_photo", photoVisibility); }, [photoVisibility]);

  // Local time
  const [localTime, setLocalTime] = useState("");
  useEffect(() => {
    const update = () => {
      const now = new Date();
      const time = now.toLocaleTimeString("en-US", { hour:"numeric", minute:"2-digit", hour12:true });
      const offset = -now.getTimezoneOffset() / 60;
      const sign = offset >= 0 ? "+" : "-";
      setLocalTime(`${time} (GMT${sign}${String(Math.abs(offset)).padStart(2,"0")}:00)`);
    };
    update();
    const interval = setInterval(update, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleFileChange = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = ev => setAvatarPreview(ev.target.result);
    reader.readAsDataURL(f);
  };

  const handleSavePhoto = () => {
  if (!avatarPreview) return;
  try { localStorage.setItem(LS_AVATAR, JSON.stringify(avatarPreview)); } catch {}
  
  // Kirim foto dan visibility ke server
  api.put('/users/profile', {
    avatar: avatarPreview,
    photo_visibility: photoVisibility,
  }).catch(() => { /* silent fail */ });
  
  setAvatarUrl(avatarPreview);
  setAvatarPreview(null);
  window.dispatchEvent(new CustomEvent("kanbanku_avatar_updated"));
  setAvatarSaved(true);
  setTimeout(() => setAvatarSaved(false), 2000);
};

  const handleRemovePhoto = () => {
    try { localStorage.removeItem(LS_AVATAR); } catch { /* noop */ }
    setAvatarUrl(null);
    setAvatarPreview(null);
    window.dispatchEvent(new CustomEvent("kanbanku_avatar_updated"));
  };

  const Section = ({ title, children }) => (
    <div style={{ background:t.surface, borderRadius:12, border:`1px solid ${t.border}`, marginBottom:20, overflow:"hidden" }}>
      <div style={{ padding:"16px 24px", borderBottom:`1px solid ${t.border}`, background:t.surfaceAlt }}>
        <h3 style={{ fontSize:15, fontWeight:700, color:t.text }}>{title}</h3>
      </div>
      <div style={{ padding:"0 24px" }}>
        {children}
      </div>
    </div>
  );
  Section.propTypes = { title:PropTypes.string, children:PropTypes.node };


  const [showChangePassword, setShowChangePassword] = useState(false);
const [pwCurrent, setPwCurrent] = useState("");
const [pwNew,     setPwNew]     = useState("");
const [pwConfirm, setPwConfirm] = useState("");
const [pwMsg,     setPwMsg]     = useState(null);

const handleChangePassword = async () => {
  if (!pwCurrent || !pwNew || !pwConfirm) {
    setPwMsg({ ok:false, text:"Semua field harus diisi." });
    return;
  }
  if (pwNew !== pwConfirm) {
    setPwMsg({ ok:false, text:"Password baru tidak cocok." });
    return;
  }
  if (pwNew.length < 8) {
    setPwMsg({ ok:false, text:"Password minimal 8 karakter." });
    return;
  }
  try {
    await api.put("/users/change-password", { current_password: pwCurrent, new_password: pwNew });
    setPwMsg({ ok:true, text:"✅ Password berhasil diubah!" });
    setPwCurrent(""); setPwNew(""); setPwConfirm("");
    setTimeout(() => { setShowChangePassword(false); setPwMsg(null); }, 2000);
  } catch (e) {
    setPwMsg({ ok:false, text:`❌ ${e.response?.data?.message || "Password salah atau gagal diubah."}` });
  }
};

  return (
    <div style={{ minHeight:"100vh", background:t.bg, fontFamily:"'DM Sans',sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&family=Sora:wght@700;800&display=swap" rel="stylesheet" />

      {/* ── NAVBAR ── */}
      <nav style={{ background:t.navBg, backdropFilter:"blur(16px)", borderBottom:`1px solid ${t.border}`, padding:"0 24px", height:56, display:"flex", alignItems:"center", gap:12, position:"sticky", top:0, zIndex:100 }}>
        <button onClick={onBack}
          style={{ background:"transparent", border:"none", cursor:"pointer", color:t.muted, fontSize:18, padding:"4px 8px", borderRadius:6, display:"flex", alignItems:"center", gap:6 }}
          onMouseEnter={e => { e.currentTarget.style.color=t.blue; e.currentTarget.style.background=t.blueLight; }}
          onMouseLeave={e => { e.currentTarget.style.color=t.muted; e.currentTarget.style.background="transparent"; }}
        >←</button>
        <h1 style={{ fontSize:15, fontWeight:700, color:t.text, fontFamily:"'Sora',sans-serif" }}>Kelola Akun</h1>
      </nav>

      {/* ── CONTENT ── */}
      <div style={{ maxWidth:760, margin:"0 auto", padding:"32px 20px" }}>

        {/* Page title */}
        <div style={{ marginBottom:28 }}>
          <h2 style={{ fontSize:22, fontWeight:800, color:t.text, fontFamily:"'Sora',sans-serif", marginBottom:8 }}>Profile and visibility</h2>
          <p style={{ fontSize:14, color:t.muted, lineHeight:1.6 }}>
            Manage your personal information, and control which information other people see and apps may access.{" "}
            <a href="#" style={{ color:t.blue }}>Learn more about your profile and visibility ↗</a>
            {" "}or{" "}
            <a href="#" style={{ color:t.blue }}>view our privacy policy ↗</a>.
          </p>
        </div>

        {/* ── Photo Section ── */}
        <Section title="Profile photo and header image">
          {/* Header / Banner */}
          <div style={{ margin:"20px 0 0", height:120, background:`linear-gradient(135deg, ${t.blue}33, #7c3aed33)`, borderRadius:10, position:"relative", overflow:"hidden", border:`1px solid ${t.border}` }}>
            <div style={{ position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center" }}>
              <span style={{ fontSize:12, color:t.muted }}>Header image (coming soon)</span>
            </div>
          </div>

          {/* Avatar + controls */}
          <div style={{ display:"flex", gap:20, alignItems:"flex-end", marginTop:-30, marginBottom:20, paddingLeft:20 }}>
            <div style={{ position:"relative", flexShrink:0 }}>
              <AvatarCircle name={user?.name} avatarUrl={avatarPreview || avatarUrl} size={80} />
              <button onClick={() => fileRef.current?.click()}
                style={{ position:"absolute", bottom:0, right:0, width:26, height:26, borderRadius:"50%", background:t.blue, border:`2px solid ${t.surface}`, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", color:"white", fontSize:13 }}
                title="Ganti foto">✎</button>
              <input ref={fileRef} type="file" accept="image/*" style={{ display:"none" }} onChange={handleFileChange} />
            </div>
            <div style={{ paddingBottom:4, display:"flex", gap:8, flexWrap:"wrap", alignItems:"center" }}>
              <button onClick={() => fileRef.current?.click()}
                style={{ padding:"6px 14px", background:t.blue, color:"white", border:"none", borderRadius:7, fontSize:13, fontWeight:600, cursor:"pointer" }}>
                Upload foto
              </button>
              {avatarPreview && (
                <button onClick={handleSavePhoto}
                  style={{ padding:"6px 14px", background:avatarSaved?"#16a34a":t.blue, color:"white", border:"none", borderRadius:7, fontSize:13, fontWeight:700, cursor:"pointer" }}>
                  {avatarSaved ? "✓ Tersimpan!" : "Simpan Foto"}
                </button>
              )}
              {(avatarUrl || avatarPreview) && (
                <button onClick={handleRemovePhoto}
                  style={{ padding:"6px 14px", background:"transparent", border:`1px solid ${t.border}`, borderRadius:7, fontSize:13, color:t.muted, cursor:"pointer" }}>
                  Hapus foto
                </button>
              )}
            </div>
          </div>

          {/* Photo visibility */}
          <div style={{ padding:"14px 0", borderTop:`1px solid ${t.border}`, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <p style={{ fontSize:13, color:t.muted }}>Who can see your profile photo?</p>
            <VisibilitySelect value={photoVisibility} onChange={setPhotoVisibility} dark={dark} t={t} />
          </div>
        </Section>

        {/* ── About You Section ── */}
        <Section title="About you">
          <div style={{ padding:"10px 0", borderBottom:`1px solid ${t.border}`, display:"flex", justifyContent:"flex-end" }}>
            <p style={{ fontSize:12, color:t.muted }}>Who can see this?</p>
          </div>
          <ProfileRow label="Full name"     fieldKey="fullName"     fields={fields} setFields={setFields} t={t} dark={dark} placeholder="Your full name" />
          <ProfileRow label="Public name"   fieldKey="publicName"   fields={fields} setFields={setFields} t={t} dark={dark} placeholder="Your public name" />
          <ProfileRow label="Pronouns"      fieldKey="pronouns"     fields={fields} setFields={setFields} t={t} dark={dark} placeholder="Add pronouns" />
          <ProfileRow label="Job title"     fieldKey="jobTitle"     fields={fields} setFields={setFields} t={t} dark={dark} placeholder="Your job title" />
          <ProfileRow label="Department"    fieldKey="department"   fields={fields} setFields={setFields} t={t} dark={dark} placeholder="Your department" />
          <ProfileRow label="Organization"  fieldKey="organization" fields={fields} setFields={setFields} t={t} dark={dark} placeholder="Your organization" />
          <ProfileRow label="Based in"      fieldKey="basedIn"      fields={fields} setFields={setFields} t={t} dark={dark} placeholder="Your location" />

          {/* Local time — read only */}
          <div style={{ padding:"16px 0", borderBottom:`1px solid ${t.border}`, display:"flex", alignItems:"center", gap:12, flexWrap:"wrap" }}>
            <div style={{ minWidth:180 }}>
              <p style={{ fontSize:13, fontWeight:600, color:t.text }}>Local time</p>
            </div>
            <span style={{ fontSize:14, color:t.muted, flex:1 }}>{localTime}</span>
            <VisibilitySelect value="Anyone" onChange={() => {}} dark={dark} t={t} />
          </div>

          {/* Working with you */}
          <div style={{ padding:"16px 0", borderBottom:`1px solid ${t.border}`, display:"flex", flexDirection:"column", gap:10 }}>
            <div style={{ display:"flex", alignItems:"flex-start", gap:12, flexWrap:"wrap" }}>
              <div style={{ minWidth:180, flexShrink:0 }}>
                <p style={{ fontSize:13, fontWeight:600, color:t.text, marginBottom:2 }}>Working with you</p>
                <p style={{ fontSize:11, color:t.muted }}>Help others understand when and how to collaborate with you</p>
              </div>
              <EditableField
                value={fields.workingWith?.value || ""}
                onChange={v => setFields(prev => ({ ...prev, workingWith: { ...prev.workingWith, value: v } }))}
                placeholder="Describe how to work with you..."
                t={t}
                multiline
              />
              <VisibilitySelect value={fields.workingWith?.visibility || "Anyone"} onChange={v => setFields(prev => ({ ...prev, workingWith: { ...prev.workingWith, visibility: v } }))} dark={dark} t={t} />
            </div>
          </div>
        </Section>

        {/* ── Contact Section ── */}
        <Section title="Contact">
          <div style={{ padding:"10px 0", borderBottom:`1px solid ${t.border}`, display:"flex", justifyContent:"flex-end" }}>
            <p style={{ fontSize:12, color:t.muted }}>Who can see this?</p>
          </div>
          {/* Email — read only */}
          <div style={{ padding:"16px 0", display:"flex", alignItems:"center", gap:12, flexWrap:"wrap" }}>
            <div style={{ minWidth:180 }}>
              <p style={{ fontSize:13, fontWeight:600, color:t.text }}>Email address</p>
            </div>
            <span style={{ fontSize:14, color:t.text, flex:1 }}>{user?.email || "email@contoh.com"}</span>
            <VisibilitySelect value="Anyone" onChange={() => {}} dark={dark} t={t} />
          </div>
        </Section>
        {/* ── Account Actions Section ── */}
<Section title="Account actions">
  {/* Change password */}
  <div style={{ padding:"16px 0", borderBottom:`1px solid ${t.border}` }}>
    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
      <div>
        <p style={{ fontSize:13, fontWeight:600, color:t.text }}>Password</p>
        <p style={{ fontSize:12, color:t.muted }}>Change your account password</p>
      </div>
      <button
        onClick={() => setShowChangePassword(true)}
        style={{ padding:"6px 14px", border:`1px solid ${t.border}`, borderRadius:7, fontSize:13, background:"transparent", color:t.text, cursor:"pointer" }}
      >Change password</button>
    </div>
    {showChangePassword && (
      <div style={{ marginTop:12, display:"flex", flexDirection:"column", gap:8, maxWidth:360 }}>
        <input type="password" placeholder="Current password"
          value={pwCurrent} onChange={e => setPwCurrent(e.target.value)}
          style={{ padding:"8px 10px", border:`1.5px solid ${t.border}`, borderRadius:8, fontSize:13, background:t.surface, color:t.text, outline:"none" }}
          onFocus={e => e.target.style.borderColor=t.blue}
          onBlur={e => e.target.style.borderColor=t.border}
        />
        <input type="password" placeholder="New password"
          value={pwNew} onChange={e => setPwNew(e.target.value)}
          style={{ padding:"8px 10px", border:`1.5px solid ${t.border}`, borderRadius:8, fontSize:13, background:t.surface, color:t.text, outline:"none" }}
          onFocus={e => e.target.style.borderColor=t.blue}
          onBlur={e => e.target.style.borderColor=t.border}
        />
        <input type="password" placeholder="Confirm new password"
          value={pwConfirm} onChange={e => setPwConfirm(e.target.value)}
          style={{ padding:"8px 10px", border:`1.5px solid ${t.border}`, borderRadius:8, fontSize:13, background:t.surface, color:t.text, outline:"none" }}
          onFocus={e => e.target.style.borderColor=t.blue}
          onBlur={e => e.target.style.borderColor=t.border}
        />
        {pwMsg && <p style={{ fontSize:12, color:pwMsg.ok?t.green:t.red }}>{pwMsg.text}</p>}
        <div style={{ display:"flex", gap:8 }}>
          <button onClick={handleChangePassword}
            style={{ padding:"7px 16px", background:t.blue, color:"white", border:"none", borderRadius:7, fontSize:13, fontWeight:700, cursor:"pointer" }}>
            Simpan
          </button>
          <button onClick={() => { setShowChangePassword(false); setPwCurrent(""); setPwNew(""); setPwConfirm(""); setPwMsg(null); }}
            style={{ padding:"7px 12px", background:"transparent", border:`1px solid ${t.border}`, borderRadius:7, fontSize:13, color:t.muted, cursor:"pointer" }}>
            Batal
          </button>
        </div>
      </div>
    )}
  </div>

  {/* Delete account */}
  <div style={{ padding:"16px 0" }}>
    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
      <div>
        <p style={{ fontSize:13, fontWeight:600, color:t.red }}>Delete account</p>
        <p style={{ fontSize:12, color:t.muted }}>Permanently delete your account and all data</p>
      </div>
      <button
        onClick={() => { if(window.confirm("Yakin hapus akun? Tindakan ini tidak bisa dibatalkan.")) { api.delete("/users/me").then(() => { localStorage.clear(); window.location.href = "/login"; }).catch(() => alert("Gagal hapus akun.")); }}}
        style={{ padding:"6px 14px", border:`1px solid ${t.red}`, borderRadius:7, fontSize:13, background:"transparent", color:t.red, cursor:"pointer" }}
      >Delete account</button>
    </div>
  </div>
</Section>

        {/* Auto-save notice */}
        <div style={{ textAlign:"center", padding:"8px 0 32px", color:t.muted, fontSize:12 }}>
          ✓ Semua perubahan tersimpan otomatis
        </div>
      </div>

      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width:5px }
        ::-webkit-scrollbar-track { background:transparent }
        ::-webkit-scrollbar-thumb { background:#94a3b844; border-radius:99px }
        a { text-decoration: none; }
        a:hover { text-decoration: underline; }
      `}</style>
    </div>
  );
}

ManageAccount.propTypes = {
  dark:    PropTypes.bool,
  user:    PropTypes.object,
  onBack:  PropTypes.func,
};