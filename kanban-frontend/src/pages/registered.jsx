import { useState, useEffect } from 'react'
import { useAuth } from '../lib/AuthContext'
import { useNavigate, Link } from 'react-router-dom'
import PropTypes from 'prop-types'

export default function Register({ dark }) {
  const { register } = useAuth()
  const navigate      = useNavigate()
  const [form, setForm]       = useState({ name:'', email:'', password:'', password_confirmation:'' })
  const [error, setError]     = useState('')
  const [loading, setLoading] = useState(false)
  const [showPass, setShowPass] = useState(false)
  const [mounted, setMounted]  = useState(false)

  useEffect(() => { setTimeout(() => setMounted(true), 50) }, [])

  const t = {
    bg:      dark ? '#0f172a' : '#f0f4f8',
    surface: dark ? '#1e293b' : '#ffffff',
    text:    dark ? '#f1f5f9' : '#172b4d',
    muted:   dark ? '#94a3b8' : '#5e6c84',
    border:  dark ? '#334155' : '#dfe1e6',
    blue:    '#1565c0',
    blueBright: '#1976d2',
    blueLight: dark ? '#1e3a8a33' : '#e8f0fe',
    red:     '#dc2626',
    green:   '#16a34a',
  }

  // Password strength
  const pwStrength = (() => {
    const p = form.password
    if (!p) return { level:0, label:'', color:'' }
    let score = 0
    if (p.length >= 8) score++
    if (/[A-Z]/.test(p)) score++
    if (/[0-9]/.test(p)) score++
    if (/[^A-Za-z0-9]/.test(p)) score++
    if (score <= 1) return { level:1, label:'Lemah', color:'#dc2626' }
    if (score === 2) return { level:2, label:'Sedang', color:'#d97706' }
    if (score === 3) return { level:3, label:'Kuat', color:'#16a34a' }
    return { level:4, label:'Sangat Kuat', color:'#059669' }
  })()

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (form.password !== form.password_confirmation) { setError('Password tidak cocok'); return }
    if (form.password.length < 8) { setError('Password minimal 8 karakter'); return }
    setLoading(true); setError('')
    try {
      await register(form.name, form.email, form.password, form.password_confirmation)
      navigate('/boards')
    } catch (err) {
      setError(err.response?.data?.message || 'Registrasi gagal. Coba lagi.')
    } finally { setLoading(false) }
  }

  const inputStyle = {
    width:'100%', padding:'11px 14px', border:`1.5px solid ${t.border}`,
    borderRadius:10, fontSize:14, background:t.bg, color:t.text,
    outline:'none', boxSizing:'border-box', transition:'border-color .2s',
    fontFamily:"'DM Sans',sans-serif",
  }

  return (
    <div style={{ minHeight:'100vh', background:t.bg, display:'flex', alignItems:'center', justifyContent:'center', padding:20, fontFamily:"'DM Sans',sans-serif", transition:'background .3s' }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&family=Sora:wght@700;800&display=swap" rel="stylesheet"/>

      {/* Background blobs */}
      <div style={{ position:'fixed', inset:0, overflow:'hidden', pointerEvents:'none', zIndex:0 }}>
        <div style={{ position:'absolute', top:-100, left:-80, width:380, height:380, borderRadius:'50%', background:`radial-gradient(circle, ${t.blue}15, transparent 70%)` }}/>
        <div style={{ position:'absolute', bottom:-120, right:-60, width:320, height:320, borderRadius:'50%', background:`radial-gradient(circle, ${t.blue}10, transparent 70%)` }}/>
      </div>

      <div style={{
        width:'100%', maxWidth:440, position:'relative', zIndex:1,
        opacity: mounted?1:0, transform: mounted?'translateY(0)':'translateY(24px)',
        transition:'opacity .5s ease, transform .5s ease',
      }}>
        {/* Logo */}
        <div style={{ textAlign:'center', marginBottom:28 }}>
          <div style={{ display:'inline-flex', alignItems:'center', gap:10, marginBottom:8 }}>
            <div style={{ width:40, height:40, background:t.blue, borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center', boxShadow:`0 8px 24px ${t.blue}44` }}>
              <svg width="22" height="22" viewBox="0 0 18 18" fill="none">
                <rect x="2" y="2" width="6" height="10" rx="2" fill="white"/>
                <rect x="10" y="2" width="6" height="7" rx="2" fill="white" opacity=".7"/>
              </svg>
            </div>
            <span style={{ fontFamily:"'Sora',sans-serif", fontWeight:800, fontSize:22, color:t.blue }}>KanbanKu</span>
          </div>
          <p style={{ fontSize:13, color:t.muted }}>Mulai kelola project kamu secara gratis</p>
        </div>

        {/* Card */}
        <div style={{ background:t.surface, borderRadius:20, padding:'32px 32px 28px', boxShadow: dark?'0 24px 64px rgba(0,0,0,.4)':'0 24px 64px rgba(21,101,192,.1)', border:`1px solid ${t.border}` }}>
          <h1 style={{ fontFamily:"'Sora',sans-serif", fontSize:22, fontWeight:800, color:t.text, marginBottom:6 }}>Buat Akun</h1>
          <p style={{ fontSize:13, color:t.muted, marginBottom:24 }}>Gratis selamanya, tidak perlu kartu kredit 🎉</p>

          {error && (
            <div style={{ background:'#fee2e2', border:'1px solid #fca5a5', borderRadius:10, padding:'10px 14px', marginBottom:18, display:'flex', alignItems:'center', gap:8 }}>
              <span style={{ fontSize:14 }}>⚠️</span>
              <span style={{ fontSize:13, color:t.red, fontWeight:500 }}>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:14 }}>
            {/* Name */}
            <div>
              <label style={{ fontSize:12, fontWeight:700, color:t.muted, display:'block', marginBottom:6, textTransform:'uppercase', letterSpacing:.5 }}>Nama Lengkap</label>
              <input type="text" value={form.name} onChange={e=>setForm({...form,name:e.target.value})}
                placeholder="Nama kamu" required style={inputStyle}
                onFocus={e=>e.target.style.borderColor=t.blue} onBlur={e=>e.target.style.borderColor=t.border}
              />
            </div>

            {/* Email */}
            <div>
              <label style={{ fontSize:12, fontWeight:700, color:t.muted, display:'block', marginBottom:6, textTransform:'uppercase', letterSpacing:.5 }}>Email</label>
              <input type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})}
                placeholder="nama@email.com" required style={inputStyle}
                onFocus={e=>e.target.style.borderColor=t.blue} onBlur={e=>e.target.style.borderColor=t.border}
              />
            </div>

            {/* Password */}
            <div>
              <label style={{ fontSize:12, fontWeight:700, color:t.muted, display:'block', marginBottom:6, textTransform:'uppercase', letterSpacing:.5 }}>Password</label>
              <div style={{ position:'relative' }}>
                <input type={showPass?'text':'password'} value={form.password} onChange={e=>setForm({...form,password:e.target.value})}
                  placeholder="Minimal 8 karakter" required style={{...inputStyle, paddingRight:42}}
                  onFocus={e=>e.target.style.borderColor=t.blue} onBlur={e=>e.target.style.borderColor=t.border}
                />
                <button type="button" onClick={()=>setShowPass(!showPass)}
                  style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', background:'transparent', border:'none', cursor:'pointer', color:t.muted, fontSize:16 }}>
                  {showPass ? '🙈' : '👁'}
                </button>
              </div>
              {/* Password strength bar */}
              {form.password && (
                <div style={{ marginTop:8 }}>
                  <div style={{ display:'flex', gap:4, marginBottom:4 }}>
                    {[1,2,3,4].map(i=>(
                      <div key={i} style={{ flex:1, height:3, borderRadius:2, background: i<=pwStrength.level ? pwStrength.color : t.border, transition:'background .3s' }}/>
                    ))}
                  </div>
                  <span style={{ fontSize:11, color:pwStrength.color, fontWeight:600 }}>{pwStrength.label}</span>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label style={{ fontSize:12, fontWeight:700, color:t.muted, display:'block', marginBottom:6, textTransform:'uppercase', letterSpacing:.5 }}>Konfirmasi Password</label>
              <div style={{ position:'relative' }}>
                <input type={showPass?'text':'password'} value={form.password_confirmation} onChange={e=>setForm({...form,password_confirmation:e.target.value})}
                  placeholder="Ulangi password" required style={{...inputStyle, paddingRight:42, borderColor: form.password_confirmation && form.password!==form.password_confirmation ? t.red : t.border }}
                  onFocus={e=>e.target.style.borderColor=t.blue} onBlur={e=>e.target.style.borderColor=form.password_confirmation&&form.password!==form.password_confirmation?t.red:t.border}
                />
                {form.password_confirmation && (
                  <span style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', fontSize:16 }}>
                    {form.password===form.password_confirmation ? '✅' : '❌'}
                  </span>
                )}
              </div>
            </div>

            {/* Submit */}
            <button type="submit" disabled={loading}
              style={{ padding:'12px', background: loading?t.muted:t.blue, color:'white', border:'none', borderRadius:10, fontSize:14, fontWeight:700, cursor: loading?'not-allowed':'pointer', transition:'all .2s', marginTop:6, boxShadow:`0 4px 16px ${t.blue}33` }}
              onMouseEnter={e=>!loading&&(e.currentTarget.style.background=t.blueBright)}
              onMouseLeave={e=>!loading&&(e.currentTarget.style.background=t.blue)}
            >
              {loading ? (
                <span style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
                  <span style={{ width:14, height:14, border:'2px solid white', borderTopColor:'transparent', borderRadius:'50%', display:'inline-block', animation:'spin 1s linear infinite' }}/>
                  Membuat akun...
                </span>
              ) : 'Daftar Sekarang — Gratis →'}
            </button>
          </form>

          <div style={{ marginTop:20, textAlign:'center' }}>
            <span style={{ fontSize:13, color:t.muted }}>Sudah punya akun? </span>
            <Link to="/login" style={{ fontSize:13, color:t.blue, fontWeight:700, textDecoration:'none' }}
              onMouseEnter={e=>e.target.style.textDecoration='underline'}
              onMouseLeave={e=>e.target.style.textDecoration='none'}
            >Masuk</Link>
          </div>
        </div>

        {/* Features highlight */}
        <div style={{ display:'flex', gap:16, marginTop:20, justifyContent:'center', flexWrap:'wrap' }}>
          {['✅ Gratis selamanya', '🔒 Data aman', '⚡ Mudah digunakan'].map(f=>(
            <span key={f} style={{ fontSize:12, color:t.muted }}>{f}</span>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg) } }
        * { box-sizing: border-box; margin: 0; padding: 0 }
      `}</style>
    </div>
  )
}

Register.propTypes = { dark: PropTypes.bool }