import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import PropTypes from 'prop-types'



const features = [
  { icon: '⚡', title: 'Kerja Lebih Cepat', desc: 'Drag & drop task antar kolom dengan mudah. Visualisasikan progress tim secara real-time.' },
  { icon: '/title', title: 'Kolaborasi Tim', desc: 'Undang anggota tim, assign task, dan pantau siapa mengerjakan apa — semua dalam satu tempat.' },
  { icon: '/push-notification.png', title: 'Notifikasi Cerdas', desc: 'Dapatkan reminder deadline otomatis via email. Tidak ada lagi task yang terlewat.' },
  { icon: '/check.png', title: 'Lacak Progress', desc: 'Lihat status setiap proyek dengan jelas. Dari To Do hingga Done dalam satu tampilan.' },
]

const steps = [
  { num: '01', title: 'Buat Board', desc: 'Mulai project baru hanya dalam hitungan detik.' },
  { num: '02', title: 'Tambah Task', desc: 'Isi kolom dengan task, deadline, dan assignee.' },
  { num: '03', title: 'Kelola Bersama', desc: 'Invite tim dan mulai berkolaborasi real-time.' },
]

const navLinks = [
  { label: 'Fitur', href: '#fitur', sub: true },
  { label: 'Cara Kerja', href: '#cara-kerja', sub: false },
  { label: 'Harga', href: '#harga', sub: false },
  { label: 'Tentang', href: '#tentang', sub: false },
  { label: 'Sumber Daya', href: '#', sub: true },
]

function useScrollReveal() {
  const ref = useRef(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setVisible(true) },
      { threshold: 0.15 }
    )
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [])
  return [ref, visible]
}

function RevealSection({ children, className = '', delay = 0 }) {
  const [ref, visible] = useScrollReveal()
  return (
    <div ref={ref} className={className} style={{
      opacity: visible ? 1 : 0,
      transform: visible ? 'translateY(0)' : 'translateY(28px)',
      transition: `opacity 0.7s ease ${delay}ms, transform 0.7s ease ${delay}ms`,
    }}>
      {children}
    </div>
  )
}
RevealSection.propTypes = { children: PropTypes.node, className: PropTypes.string, delay: PropTypes.number }

export default function Landing({ dark, setDark }) {
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [email, setEmail] = useState('')

  const blue = '#0052cc'
  const blueBright = '#1976d2'
  const bg = dark ? '#0f172a' : '#ffffff'
  const surface = dark ? '#1e293b' : '#ffffff'
  const text = dark ? '#f1f5f9' : '#172b4d'
  const muted = dark ? '#94a3b8' : '#5e6c84'
  const border = dark ? '#334155' : '#dfe1e6'
  const heroB = dark ? '#1e293b' : '#f4f5f7'
  const blueLight = dark ? '#1e3a8a33' : '#e8f0fe'

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', fn)
    return () => window.removeEventListener('scroll', fn)
  }, [])

  // Lock scroll saat menu mobile terbuka
  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [menuOpen])

  return (
    <div style={{ background: bg, color: text, minHeight: '100vh', fontFamily: "'DM Sans', sans-serif", transition: 'background .3s, color .3s' }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&family=Sora:wght@700;800&display=swap" rel="stylesheet" />

      {/* ═══ NAVBAR ═══ */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 300,
        background: scrolled ? (dark ? 'rgba(15,23,42,.97)' : 'rgba(255,255,255,.97)') : (dark ? '#0f172a' : '#fff'),
        backdropFilter: scrolled ? 'blur(12px)' : 'none',
        borderBottom: scrolled ? `1px solid ${border}` : `1px solid ${border}`,
        transition: 'all .3s',
      }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 60 }}>

          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }} onClick={() => navigate('/')}>
            <div style={{ width: 32, height: 32, background: blue, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <rect x="2" y="2" width="6" height="10" rx="2" fill="white"/>
                <rect x="10" y="2" width="6" height="7" rx="2" fill="white" opacity=".7"/>
              </svg>
            </div>
            <span style={{ fontFamily: "'Sora', sans-serif", fontWeight: 800, fontSize: 18, color: blue }}>KanbanKu</span>
          </div>

          {/* Desktop nav links — hidden on mobile */}
          <div className="dk-nav" style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {navLinks.map(n => (
              <a key={n.label} href={n.href} style={{ color: muted, fontSize: 14, fontWeight: 500, padding: '6px 12px', borderRadius: 6, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 3, transition: 'all .18s' }}
                onMouseEnter={e => { e.currentTarget.style.color = blue; e.currentTarget.style.background = blueLight }}
                onMouseLeave={e => { e.currentTarget.style.color = muted; e.currentTarget.style.background = 'transparent' }}
              >
                {n.label}
                {n.sub && <svg width="11" height="11" viewBox="0 0 12 12" fill="none"><path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
              </a>
            ))}
          </div>

          {/* Desktop right — hidden on mobile */}
          <div className="dk-right" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button onClick={() => setDark(!dark)} title={dark ? 'Light mode' : 'Dark mode'} style={{ background: blueLight, border: 'none', borderRadius: 8, width: 36, height: 36, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, transition: 'transform .2s' }}
              onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
            >{dark ? <img src="brightness (1).png" alt="light" style={{ width: 16 }} /> : <img src="night-mode.png" alt="dark" style={{ width: 16 }} />}</button>
            <button onClick={() => navigate('/login')} style={{ background: 'transparent', border: 'none', padding: '7px 14px', fontSize: 13, fontWeight: 600, color: text, cursor: 'pointer', borderRadius: 6, transition: 'all .18s' }}
              onMouseEnter={e => { e.currentTarget.style.color = blue; e.currentTarget.style.background = blueLight }}
              onMouseLeave={e => { e.currentTarget.style.color = text; e.currentTarget.style.background = 'transparent' }}
            >Masuk</button>
            <button onClick={() => navigate('/register')} style={{ background: blue, border: 'none', borderRadius: 6, padding: '8px 18px', fontSize: 13, fontWeight: 700, color: 'white', cursor: 'pointer', transition: 'all .18s' }}
              onMouseEnter={e => { e.currentTarget.style.background = blueBright; e.currentTarget.style.transform = 'translateY(-1px)' }}
              onMouseLeave={e => { e.currentTarget.style.background = blue; e.currentTarget.style.transform = 'none' }}
            >Mulai Gratis</button>
          </div>

          {/* Hamburger — mobile only, shown via CSS */}
          <button onClick={() => setMenuOpen(o => !o)} className="hbg-btn" style={{
            display: 'none', background: 'transparent', border: 'none', cursor: 'pointer',
            flexDirection: 'column', gap: 5, alignItems: 'center', justifyContent: 'center',
            width: 40, height: 40, padding: 8, flexShrink: 0,
          }}>
            <span style={{ display: 'block', width: 22, height: 2, background: text, borderRadius: 2, transition: 'transform .3s', transformOrigin: 'center', transform: menuOpen ? 'translateY(7px) rotate(45deg)' : 'none' }}/>
            <span style={{ display: 'block', width: 22, height: 2, background: text, borderRadius: 2, transition: 'opacity .2s', opacity: menuOpen ? 0 : 1 }}/>
            <span style={{ display: 'block', width: 22, height: 2, background: text, borderRadius: 2, transition: 'transform .3s', transformOrigin: 'center', transform: menuOpen ? 'translateY(-7px) rotate(-45deg)' : 'none' }}/>
          </button>
        </div>
      </nav>

      {/* ═══ MOBILE MENU — Full screen overlay, OUTSIDE navbar, Trello style ═══ */}
      <div style={{
        position: 'fixed', top: 61, left: 0, right: 0, bottom: 0, zIndex: 200,
        background: dark ? '#1e293b' : '#ffffff',
        transform: menuOpen ? 'translateX(0)' : 'translateX(100%)',
        transition: 'transform .35s cubic-bezier(.4,0,.2,1)',
        overflowY: 'auto',
        display: 'none', // shown via CSS on mobile
      }} className="mobile-menu">
        {navLinks.map(n => (
          <a key={n.label} href={n.href} onClick={() => setMenuOpen(false)} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '18px 24px', borderBottom: `1px solid ${border}`,
            color: text, textDecoration: 'none', fontSize: 16, fontWeight: 500, transition: 'background .15s',
          }}
            onMouseEnter={e => e.currentTarget.style.background = blueLight}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            {n.label}
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M6 4l4 4-4 4" stroke={muted} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </a>
        ))}
        <div style={{ padding: '20px 16px 12px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <button onClick={() => { navigate('/register'); setMenuOpen(false) }} style={{ width: '100%', padding: '14px', background: blue, color: 'white', border: 'none', borderRadius: 6, fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>Mulai Gratis</button>
          <button onClick={() => { navigate('/login'); setMenuOpen(false) }} style={{ width: '100%', padding: '13px', background: 'transparent', color: text, border: `1.5px solid ${border}`, borderRadius: 6, fontSize: 15, fontWeight: 600, cursor: 'pointer' }}>Masuk</button>
        </div>
        <div style={{ textAlign: 'center', paddingTop: 4, paddingBottom: 20 }}>
          <button onClick={() => setDark(!dark)} style={{ background: blueLight, border: 'none', borderRadius: 8, padding: '7px 18px', cursor: 'pointer', fontSize: 13, color: blue, fontWeight: 600 }}>
            {dark ? (
           
            <>
              <img src="brightness (1).png" alt="light" style={{ width: 16 }} />
              Light mode
            </>
          ) : (
            <>
              <img src="night-mode.png" alt="dark" style={{ width: 16 }} />
              Dark mode
            </>
          )} </button>
        </div>
      </div>

      {/* ═══ HERO ═══ */}
      <section style={{ paddingTop: 100, paddingBottom: 80, paddingLeft: 24, paddingRight: 24, maxWidth: 1100, margin: '0 auto' }}>
        <div className="hero-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 60, alignItems: 'center' }}>
          <div>
            <div style={{ display: 'inline-block', background: blueLight, color: blue, fontSize: 12, fontWeight: 700, padding: '5px 14px', borderRadius: 99, marginBottom: 20, animation: 'fadeUp .6s ease both' }}>✦ Project Management Tool</div>
            <h1 style={{ fontFamily: "'Sora', sans-serif", fontSize: 'clamp(34px,5vw,54px)', fontWeight: 800, lineHeight: 1.1, marginBottom: 20, animation: 'fadeUp .6s ease .1s both' }}>
              Atur, kelola, dan <span style={{ color: blue }}>selesaikan</span> task dari mana saja.
            </h1>
            <p style={{ fontSize: 17, color: muted, lineHeight: 1.7, marginBottom: 32, maxWidth: 480, animation: 'fadeUp .6s ease .2s both' }}>
              Tingkatkan produktivitas tim dengan board Kanban yang intuitif. Drag & drop, kolaborasi real-time, dan notifikasi cerdas — semua gratis.
            </p>
            <div style={{ display: 'flex', maxWidth: 420, animation: 'fadeUp .6s ease .3s both' }}>
              <input type="email" placeholder="Masukkan email kamu" value={email} onChange={e => setEmail(e.target.value)}
                style={{ flex: 1, padding: '12px 16px', fontSize: 14, border: `1.5px solid ${border}`, borderRight: 'none', borderRadius: '10px 0 0 10px', outline: 'none', background: surface, color: text, transition: 'border-color .2s' }}
                onFocus={e => e.target.style.borderColor = blue}
                onBlur={e => e.target.style.borderColor = border}
              />
              <button onClick={() => navigate('/register')} style={{ background: blue, color: 'white', border: 'none', padding: '12px 18px', borderRadius: '0 10px 10px 0', fontSize: 14, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap', transition: 'background .2s' }}
                onMouseEnter={e => e.currentTarget.style.background = blueBright}
                onMouseLeave={e => e.currentTarget.style.background = blue}
              >Daftar Gratis →</button>
            </div>
            <p style={{ fontSize: 12, color: muted, marginTop: 10, animation: 'fadeUp .6s ease .4s both' }}>Gratis selamanya • Tidak perlu kartu kredit</p>
          </div>

          {/* Mock Kanban board */}
          <div className="hero-visual" style={{ animation: 'fadeUp .7s ease .2s both' }}>
            <div style={{ background: heroB, borderRadius: 16, padding: 20, boxShadow: dark ? '0 25px 60px rgba(0,0,0,.5)' : '0 25px 60px rgba(0,82,204,.12)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                <span style={{ fontWeight: 700, fontSize: 14, color: text }}>🗂 Sprint Q1 2025</span>
                <span style={{ fontSize: 12, color: muted }}>3 kolom</span>
              </div>
              <div style={{ display: 'flex', gap: 10, overflowX: 'auto' }}>
                {[
                  { col: 'To Do', c: '#64748b', tasks: ['Setup database', 'Desain UI login'] },
                  { col: 'In Progress', c: '#0052cc', tasks: ['API boards', 'Drag & drop'] },
                  { col: 'Done', c: '#16a34a', tasks: ['Install Laravel', 'Setup Vite'] },
                ].map(({ col, c, tasks }) => (
                  <div key={col} style={{ flex: '0 0 130px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 8 }}>
                      <span style={{ width: 7, height: 7, borderRadius: '50%', background: c, display: 'inline-block' }}/>
                      <span style={{ fontSize: 11, fontWeight: 700, color: muted }}>{col}</span>
                    </div>
                    {tasks.map(t => (
                      <div key={t} style={{ background: surface, borderRadius: 8, padding: '8px 10px', marginBottom: 6, fontSize: 11, color: text, border: `1px solid ${border}`, cursor: 'grab', transition: 'transform .2s, box-shadow .2s' }}
                        onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = `0 4px 12px ${blue}20` }}
                        onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none' }}
                      >{t}</div>
                    ))}
                    <div style={{ background: blueLight, borderRadius: 8, padding: '6px 10px', fontSize: 11, color: blue, textAlign: 'center', cursor: 'pointer' }}>+ Tambah</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trusted by */}
      <section style={{ padding: '0 24px 60px', textAlign: 'center' }}>
        <p style={{ fontSize: 12, color: muted, marginBottom: 18, letterSpacing: 1.2, textTransform: 'uppercase', fontWeight: 700 }}>Dipercaya oleh tim-tim modern</p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 36, flexWrap: 'wrap', opacity: .4 }}>
          {['Startup A', 'Tech Corp', 'Dev Studio', 'Agency X', 'Fintech Y'].map(l => (
            <span key={l} style={{ fontSize: 14, fontWeight: 800, color: muted }}>{l}</span>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="fitur" style={{ padding: '80px 24px', background: dark ? '#111827' : '#f4f5f7' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <RevealSection style={{ textAlign: 'center', marginBottom: 52 }}>
            <span style={{ color: blue, fontSize: 12, fontWeight: 700, letterSpacing: 1.2, textTransform: 'uppercase' }}>Fitur Unggulan</span>
            <h2 style={{ fontFamily: "'Sora', sans-serif", fontSize: 'clamp(26px,4vw,38px)', fontWeight: 800, color: text, marginTop: 8 }}>Semua yang kamu butuhkan</h2>
          </RevealSection>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 18 }}>
            {features.map((f, i) => (
              <RevealSection key={f.title} delay={i * 80}>
                <div style={{ background: surface, borderRadius: 16, padding: 28, border: `1px solid ${border}`, transition: 'transform .25s, box-shadow .25s', height: '100%' }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = `0 12px 32px ${blue}18` }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none' }}
                >
                  <div style={{ fontSize: 28, marginBottom: 14 }}>
                    {f.icon.startsWith('/') ? (
                    <img src={f.icon} alt={f.title} style={{ width: 28, height: 28 }} />
                    ) : (
                      f.icon
                    )}
                  </div>
                  <h3 style={{ fontFamily: "'Sora', sans-serif", fontSize: 17, fontWeight: 700, color: text, marginBottom: 8 }}>{f.title}</h3>
                  <p style={{ fontSize: 14, color: muted, lineHeight: 1.6 }}>{f.desc}</p>
                </div>
              </RevealSection>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="cara-kerja" style={{ padding: '80px 24px', maxWidth: 1100, margin: '0 auto' }}>
        <RevealSection style={{ textAlign: 'center', marginBottom: 52 }}>
          <span style={{ color: blue, fontSize: 12, fontWeight: 700, letterSpacing: 1.2, textTransform: 'uppercase' }}>Cara Kerja</span>
          <h2 style={{ fontFamily: "'Sora', sans-serif", fontSize: 'clamp(26px,4vw,38px)', fontWeight: 800, color: text, marginTop: 8 }}>Mulai dalam 3 langkah</h2>
        </RevealSection>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 32 }}>
          {steps.map((s, i) => (
            <RevealSection key={s.num} delay={i * 100}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ width: 56, height: 56, borderRadius: '50%', background: blue, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Sora', sans-serif", fontWeight: 800, fontSize: 18, margin: '0 auto 16px' }}>{s.num}</div>
                <h3 style={{ fontFamily: "'Sora', sans-serif", fontSize: 18, fontWeight: 700, color: text, marginBottom: 8 }}>{s.title}</h3>
                <p style={{ fontSize: 14, color: muted, lineHeight: 1.6 }}>{s.desc}</p>
              </div>
            </RevealSection>
          ))}
        </div>
      </section>

      {/* Harga */}
      <section id="harga" style={{ padding: '80px 24px', background: dark ? '#111827' : '#f4f5f7', textAlign: 'center' }}>
        <RevealSection>
          <span style={{ color: blue, fontSize: 12, fontWeight: 700, letterSpacing: 1.2, textTransform: 'uppercase' }}>Harga</span>
          <h2 style={{ fontFamily: "'Sora', sans-serif", fontSize: 'clamp(26px,4vw,38px)', fontWeight: 800, color: text, marginTop: 8, marginBottom: 12 }}>Gratis Selamanya</h2>
          <p style={{ fontSize: 16, color: muted }}>Semua fitur tersedia tanpa biaya. Tidak perlu kartu kredit.</p>
        </RevealSection>
      </section>

      {/* CTA Tentang */}
      <section id="tentang" style={{ padding: '80px 24px', background: dark ? '#1e293b' : '#e8f0fe', textAlign: 'center' }}>
        <RevealSection>
          <h2 style={{ fontFamily: "'Sora', sans-serif", fontSize: 'clamp(26px,4vw,38px)', fontWeight: 800, color: text, marginBottom: 14 }}>Get started with KanbanKu today!</h2>
          <p style={{ fontSize: 16, color: muted, marginBottom: 28 }}>Gratis selamanya. Tidak perlu kartu kredit.</p>
          <button onClick={() => navigate('/register')} style={{ background: blue, color: 'white', border: 'none', padding: '14px 36px', borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: 'pointer', transition: 'all .2s' }}
  onMouseEnter={e => { e.currentTarget.style.background = blueBright; e.currentTarget.style.transform = 'translateY(-2px)' }}
  onMouseLeave={e => { e.currentTarget.style.background = blue; e.currentTarget.style.transform = 'none' }}
>
  Daftar Sekarang &gt;
</button>
        </RevealSection>
      </section>

      {/* ═══ FOOTER ═══ */}
      <footer style={{ background: '#1d2d4e', color: '#b8c7e0' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '56px 24px 0' }}>
          <div className="footer-desktop" style={{ display: 'grid', gridTemplateColumns: '1.5fr repeat(4, 1fr)', gap: 40, marginBottom: 48 }}>
            <div>
              <p style={{ fontSize: 10, color: '#7b93b5', fontWeight: 700, letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 6 }}>DIBUAT OLEH</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                <div style={{ width: 30, height: 30, background: blue, borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="16" height="16" viewBox="0 0 18 18" fill="none"><rect x="2" y="2" width="6" height="10" rx="2" fill="white"/><rect x="10" y="2" width="6" height="7" rx="2" fill="white" opacity=".7"/></svg>
                </div>
                <span style={{ color: 'white', fontFamily: "'Sora', sans-serif", fontWeight: 800, fontSize: 20 }}>KanbanKu</span>
              </div>
              <p style={{ fontSize: 13, lineHeight: 1.7, color: '#8eaacb', marginBottom: 20 }}>Tool manajemen project yang simpel, powerful, dan gratis untuk tim modern.</p>
              <button onClick={() => navigate('/login')} style={{ background: 'transparent', border: '1.5px solid #3a5278', borderRadius: 6, padding: '8px 18px', color: '#b8c7e0', fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all .2s' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#93c5fd'; e.currentTarget.style.color = '#93c5fd' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#3a5278'; e.currentTarget.style.color = '#b8c7e0' }}
              >Masuk</button>
            </div>
            {[
              { title: 'Tentang KanbanKu', items: [{ label: 'Apa itu KanbanKu?', sub: 'Tool di balik board produktivitas.' }, { label: 'Karir', sub: 'Bergabung bersama tim kami.' }, { label: 'Aplikasi', sub: 'Download untuk Desktop & Mobile.' }, { label: 'Hubungi Kami', sub: 'Butuh bantuan? Kami siap.' }] },
              { title: 'Fitur', items: [{ label: 'Boards' }, { label: 'Kolom & Task' }, { label: 'Kolaborasi Tim' }, { label: 'Notifikasi' }, { label: 'Integrasi' }] },
              { title: 'Solusi', items: [{ label: 'Tim Engineering' }, { label: 'Startup' }, { label: 'Remote Work' }, { label: 'Manajemen Proyek' }] },
              { title: 'Sumber Daya', items: [{ label: 'Dokumentasi' }, { label: 'Panduan Mulai' }, { label: 'Blog' }, { label: 'Komunitas' }] },
            ].map(col => (
              <div key={col.title}>
                <h4 style={{ color: 'white', fontSize: 13, fontWeight: 700, marginBottom: 16 }}>{col.title}</h4>
                {col.items.map(item => (
                  <div key={item.label} style={{ marginBottom: item.sub ? 14 : 9 }}>
                    <a href="#" style={{ color: '#b8c7e0', fontSize: 13, textDecoration: 'none', fontWeight: item.sub ? 600 : 400, transition: 'color .18s', display: 'block' }}
                      onMouseEnter={e => e.target.style.color = '#93c5fd'}
                      onMouseLeave={e => e.target.style.color = '#b8c7e0'}
                    >{item.label}</a>
                    {item.sub && <p style={{ fontSize: 12, color: '#7b93b5', marginTop: 2, lineHeight: 1.5 }}>{item.sub}</p>}
                  </div>
                ))}
              </div>
            ))}
          </div>

          {/* Mobile footer */}
          <div className="footer-mobile" style={{ display: 'none' }}>
            <div style={{ padding: '24px 0', borderBottom: '1px solid #2e4268', display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 28, height: 28, background: blue, borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="15" height="15" viewBox="0 0 18 18" fill="none"><rect x="2" y="2" width="6" height="10" rx="2" fill="white"/><rect x="10" y="2" width="6" height="7" rx="2" fill="white" opacity=".7"/></svg>
              </div>
              <span style={{ color: 'white', fontFamily: "'Sora', sans-serif", fontWeight: 800, fontSize: 20 }}>KanbanKu</span>
            </div>
            <div style={{ padding: '20px 0', borderBottom: '1px solid #2e4268', textAlign: 'center' }}>
              <button onClick={() => navigate('/login')} style={{ background: 'transparent', border: '1.5px solid #3a5278', borderRadius: 6, padding: '10px 32px', color: '#b8c7e0', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>Masuk</button>
            </div>
            {['Tentang KanbanKu', 'Fitur', 'Solusi', 'Sumber Daya'].map(title => (
              <div key={title} style={{ borderBottom: '1px solid #2e4268', padding: '16px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'white', fontSize: 15, fontWeight: 600 }}>{title}</span>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 5l4 4 4-4" stroke="#7b93b5" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </div>
            ))}
          </div>

          <div style={{ borderTop: '1px solid #2e4268', padding: '20px 0 28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, border: '1px solid #3a5278', borderRadius: 6, padding: '5px 12px', cursor: 'pointer' }}>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="5.5" stroke="#8eaacb" strokeWidth="1.2"/><path d="M7 1.5c0 0-2.5 2-2.5 5.5s2.5 5.5 2.5 5.5M7 1.5c0 0 2.5 2 2.5 5.5s-2.5 5.5-2.5 5.5M1.5 7h11" stroke="#8eaacb" strokeWidth="1.2"/></svg>
                <span style={{ fontSize: 13, color: '#b8c7e0' }}>Indonesia</span>
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 4l3 3 3-3" stroke="#8eaacb" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </div>
              <p style={{ fontSize: 12, color: '#7b93b5' }}>© 2025 KanbanKu · Dibuat di Indonesia</p>
            </div>
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              {['Kebijakan Privasi', 'Syarat Layanan', 'Cookie'].map(l => (
                <a key={l} href="#" style={{ fontSize: 12, color: '#7b93b5', textDecoration: 'none', transition: 'color .18s' }}
                  onMouseEnter={e => e.target.style.color = '#93c5fd'}
                  onMouseLeave={e => e.target.style.color = '#7b93b5'}
                >{l}</a>
              ))}
            </div>
          </div>
        </div>
      </footer>

      <style>{`
        @keyframes fadeUp { from{opacity:0;transform:translateY(22px)}to{opacity:1;transform:translateY(0)} }
        *{box-sizing:border-box;margin:0;padding:0}
        html{scroll-behavior:smooth}
        @media(max-width:768px){
          .hero-grid{grid-template-columns:1fr!important}
          .hero-visual{display:none!important}
          .dk-nav{display:none!important}
          .dk-right{display:none!important}
          .hbg-btn{display:flex!important}
          .mobile-menu{display:block!important}
          .footer-desktop{display:none!important}
          .footer-mobile{display:block!important}
        }
      `}</style>
    </div>
  )
}

Landing.propTypes = { dark: PropTypes.bool, setDark: PropTypes.func }