import { useState, useEffect } from 'react'
import { useAuth } from '../lib/AuthContext'
import { useNavigate, Link } from 'react-router-dom'
import PropTypes from 'prop-types'
import { getUser } from '../api/axios'

export default function Login({ dark }) {
  const { login } = useAuth()
  const navigate  = useNavigate()
  const [form, setForm]       = useState({ email: '', password: '' })
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
  }

  // const handleSubmit = async (e) => {
  //   e.preventDefault()
  //   setLoading(true); setError('')
  //   try {
  //     await login(form.email, form.password)
  //     navigate('/boards')
  //   } catch (err) {
  //     setError(err.response?.data?.message || 'Email atau password salah')
  //   } finally { setLoading(false) }
  // }

const handleSubmit = async (e) => {
  e.preventDefault()
  setLoading(true)
  setError('')

  try {
    await login(form.email, form.password)

    // 🔥 WAJIB: test apakah session kebaca
    const user = await getUser()
    console.log('USER LOGIN:', user)

    navigate('/boards')
  } catch (err) {
    console.log(err)
    setError(err.response?.data?.message || 'Email atau password salah')
  } finally {
    setLoading(false)
  }
}





  return (
    <div style={{ minHeight:'100vh', background:t.bg, display:'flex', alignItems:'center', justifyContent:'center', padding:20, fontFamily:"'DM Sans',sans-serif", transition:'background .3s' }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&family=Sora:wght@700;800&display=swap" rel="stylesheet"/>

      {/* Background decorative elements */}
      <div style={{ position:'fixed', inset:0, overflow:'hidden', pointerEvents:'none', zIndex:0 }}>
        <div style={{ position:'absolute', top:-120, right:-80, width:400, height:400, borderRadius:'50%', background:`radial-gradient(circle, ${t.blue}18, transparent 70%)` }}/>
        <div style={{ position:'absolute', bottom:-100, left:-60, width:300, height:300, borderRadius:'50%', background:`radial-gradient(circle, ${t.blue}12, transparent 70%)` }}/>
      </div>

      <div style={{
        width:'100%', maxWidth:420, position:'relative', zIndex:1,
        opacity: mounted?1:0, transform: mounted?'translateY(0)':'translateY(24px)',
        transition:'opacity .5s ease, transform .5s ease',
      }}>
        {/* Logo */}
        <div style={{ textAlign:'center', marginBottom:32 }}>
          <div style={{ display:'inline-flex', alignItems:'center', gap:10, marginBottom:8 }}>
            <div style={{ width:40, height:40, background:t.blue, borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center', boxShadow:`0 8px 24px ${t.blue}44` }}>
              <svg width="22" height="22" viewBox="0 0 18 18" fill="none">
                <rect x="2" y="2" width="6" height="10" rx="2" fill="white"/>
                <rect x="10" y="2" width="6" height="7" rx="2" fill="white" opacity=".7"/>
              </svg>
            </div>
            <span style={{ fontFamily:"'Sora',sans-serif", fontWeight:800, fontSize:22, color:t.blue }}>KanbanKu</span>
          </div>
          <p style={{ fontSize:13, color:t.muted }}>Project management yang simpel dan powerful</p>
        </div>

        {/* Card */}
        <div style={{ background:t.surface, borderRadius:20, padding:'32px 32px 28px', boxShadow: dark?'0 24px 64px rgba(0,0,0,.4)':'0 24px 64px rgba(21,101,192,.1)', border:`1px solid ${t.border}` }}>
          <h1 style={{ fontFamily:"'Sora',sans-serif", fontSize:22, fontWeight:800, color:t.text, marginBottom:6 }}>Masuk</h1>
          

          {error && (
            <div style={{ background:'#fee2e2', border:'1px solid #fca5a5', borderRadius:10, padding:'10px 14px', marginBottom:18, display:'flex', alignItems:'center', gap:8 }}>
              <span style={{ fontSize:14 }}>⚠️</span>
              <span style={{ fontSize:13, color:t.red, fontWeight:500 }}>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:16 }}>
            {/* Email */}
            <div>
              <label style={{ fontSize:12, fontWeight:700, color:t.muted, display:'block', marginBottom:6, textTransform:'uppercase', letterSpacing:.5 }}>Email</label>
              <input type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})}
                placeholder="nama@email.com" required autoComplete="email"
                style={{ width:'100%', padding:'11px 14px', border:`1.5px solid ${t.border}`, borderRadius:10, fontSize:14, background:t.bg, color:t.text, outline:'none', boxSizing:'border-box', transition:'border-color .2s' }}
                onFocus={e=>e.target.style.borderColor=t.blue} onBlur={e=>e.target.style.borderColor=t.border}
              />
            </div>

            {/* Password */}
            <div>
              <label style={{ fontSize:12, fontWeight:700, color:t.muted, display:'block', marginBottom:6, textTransform:'uppercase', letterSpacing:.5 }}>Password</label>
              <div style={{ position:'relative' }}>
                <input type={showPass?'text':'password'} value={form.password} onChange={e=>setForm({...form,password:e.target.value})}
                  placeholder="••••••••" required autoComplete="current-password"
                  style={{ width:'100%', padding:'11px 42px 11px 14px', border:`1.5px solid ${t.border}`, borderRadius:10, fontSize:14, background:t.bg, color:t.text, outline:'none', boxSizing:'border-box', transition:'border-color .2s' }}
                  onFocus={e=>e.target.style.borderColor=t.blue} onBlur={e=>e.target.style.borderColor=t.border}
                />
                <button type="button" onClick={()=>setShowPass(!showPass)}
                  style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', background:'transparent', border:'none', cursor:'pointer', color:t.muted, fontSize:16, padding:2 }}>
                  {showPass ? '🙈' : '👁'}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button type="submit" disabled={loading}
              style={{ padding:'12px', background: loading?t.muted:t.blue, color:'white', border:'none', borderRadius:10, fontSize:14, fontWeight:700, cursor: loading?'not-allowed':'pointer', transition:'all .2s', marginTop:4, boxShadow:`0 4px 16px ${t.blue}33` }}
              onMouseEnter={e=>!loading&&(e.currentTarget.style.background=t.blueBright)}
              onMouseLeave={e=>!loading&&(e.currentTarget.style.background=t.blue)}
            >
              {loading ? (
                <span style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
                  <span style={{ width:14, height:14, border:'2px solid white', borderTopColor:'transparent', borderRadius:'50%', display:'inline-block', animation:'spin 1s linear infinite' }}/>
                  Memproses...
                </span>
              ) : 'Masuk ke KanbanKu →'}
            </button>
          </form>

          <div style={{ marginTop:20, textAlign:'center' }}>
            <span style={{ fontSize:13, color:t.muted }}>Belum punya akun? </span>
            <Link to="/register" style={{ fontSize:13, color:t.blue, fontWeight:700, textDecoration:'none' }}
              onMouseEnter={e=>e.target.style.textDecoration='underline'}
              onMouseLeave={e=>e.target.style.textDecoration='none'}
            >Daftar Gratis</Link>
          </div>
        </div>

        {/* Footer note */}
        <p style={{ textAlign:'center', fontSize:12, color:t.muted, marginTop:20 }}>
          Gratis selamanya · Tidak perlu kartu kredit
        </p>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg) } }
        * { box-sizing: border-box; margin: 0; padding: 0 }
      `}</style>
    </div>
  )
}

Login.propTypes = { dark: PropTypes.bool }