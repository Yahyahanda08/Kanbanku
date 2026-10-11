import { useState, useRef, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'
import api from '../api/axios'
import PropTypes from 'prop-types'
import Boardmain from "./BoardMain";
// import BoardDetail from './boarddetail'
import ManageAccount from './ManageAccount'
import ProfilePanel from './Profile'

// ─── THEME ───────────────────────────────────────────────────────────────────
function useTheme(dark) {
  return {
    bg:           dark ? '#0f172a' : '#f8f9fa',
    surface:      dark ? '#1e293b' : '#ffffff',
    surfaceAlt:   dark ? '#0f172a' : '#f1f3f5',
    surfaceHover: dark ? '#273449' : '#e9ecef',
    text:         dark ? '#f1f5f9' : '#1f2937',
    muted:        dark ? '#94a3b8' : '#6c757d',
    border:       dark ? '#334155' : '#dee2e6',
    blue:         '#5b7cf6',
    blueBright:   '#4a6af4',
    blueLight:    dark ? 'rgba(91,124,246,.15)' : 'rgba(91,124,246,.09)',
    green:        '#16a34a',
    red:          '#dc2626',
    navBg:        dark ? 'rgba(15,23,42,0.85)' : 'rgba(255,255,255,0.85)',
  }
}

const CARD_COLORS = ['#16a34a','#d97706','#dc2626','#7c3aed','#0891b2','#db2777','#1565c0','#374151','#b45309','#0f766e']

// ─── DROPDOWN ────────────────────────────────────────────────────────────────
function Dropdown({ show, children, style = {} }) {
  return (
    <div style={{
      position:'absolute', zIndex:999,
      pointerEvents: show?'all':'none',
      opacity: show?1:0,
      transform: show?'translateY(0) scale(1)':'translateY(-12px) scale(0.97)',
      transition:'opacity 0.22s cubic-bezier(0.4,0,0.2,1),transform 0.22s cubic-bezier(0.4,0,0.2,1)',
      ...style,
    }}>{children}</div>
  )
}
Dropdown.propTypes = { show:PropTypes.bool, children:PropTypes.node, style:PropTypes.object }

// ─── NAV ICON BUTTON ─────────────────────────────────────────────────────────
function NavIconBtn({ onClick, title, children, refProp, active, dark }) {
  const t = useTheme(dark)
  return (
    <button ref={refProp} onClick={onClick} title={title} style={{
      background:active?t.blueLight:'transparent',border:'none',borderRadius:8,
      width:34,height:34,cursor:'pointer',display:'flex',alignItems:'center',
      justifyContent:'center',fontSize:16,color:active?t.blue:t.muted,
      transition:'all .18s',position:'relative',
    }}
      onMouseEnter={e=>{e.currentTarget.style.background=t.blueLight;e.currentTarget.style.color=t.blue}}
      onMouseLeave={e=>{e.currentTarget.style.background=active?t.blueLight:'transparent';e.currentTarget.style.color=active?t.blue:t.muted}}
    >{children}</button>
  )
}
NavIconBtn.propTypes = { onClick:PropTypes.func, title:PropTypes.string, children:PropTypes.node, refProp:PropTypes.oneOfType([PropTypes.func,PropTypes.object]), active:PropTypes.bool, dark:PropTypes.bool }

// ─── CREATE MODAL ────────────────────────────────────────────────────────────
function CreateModal({ dark, onClose, onCreateBoard }) {
  const t = useTheme(dark)
  const [mode, setMode] = useState(null)
  const [form, setForm] = useState({ name:'', description:'' })
  const ref = useRef()

  useEffect(() => {
    const fn = e => { if(ref.current && !ref.current.contains(e.target)) onClose() }
    document.addEventListener('mousedown', fn)
    return () => document.removeEventListener('mousedown', fn)
  }, [onClose])

  const templates = [
    { icon:'📋', title:'Project Management', desc:'Kelola project dari awal hingga selesai' },
    { icon:'🚀', title:'Scrum Board',         desc:'Sprint planning dan tracking agile' },
    { icon:'🐛', title:'Bug Tracking',         desc:'Catat dan selesaikan bug dengan sistematis' },
    { icon:'🎨', title:'Web Design Process',   desc:'Alur kerja desain dari wireframe ke launch' },
  ]

  return (
    <div style={{position:'fixed',inset:0,zIndex:800,background:'rgba(0,0,0,0.45)',display:'flex',alignItems:'flex-start',justifyContent:'center',paddingTop:80}}>
      <div ref={ref} style={{background:t.surface,borderRadius:16,width:'100%',maxWidth:480,boxShadow:'0 24px 64px rgba(0,0,0,0.3)',overflow:'visible',animation:'dropIn 0.25s cubic-bezier(0.4,0,0.2,1)',margin:'0 16px'}}>
        {!mode ? (
          <>
            <div style={{padding:'20px 24px 16px',borderBottom:`1px solid ${t.border}`,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <h3 style={{fontSize:15,fontWeight:700,color:t.text,fontFamily:"'Sora',sans-serif"}}>Buat Baru</h3>
              <button onClick={onClose} style={{background:'transparent',border:'none',color:t.muted,fontSize:18,cursor:'pointer'}}>✕</button>
            </div>
            <div style={{padding:16,display:'flex',flexDirection:'column',gap:10}}>
              {[
                {m:'board', icon:<svg width="18" height="18" viewBox="0 0 18 18" fill="none"><rect x="2" y="2" width="6" height="10" rx="2" fill="white"/><rect x="10" y="2" width="6" height="7" rx="2" fill="white" opacity=".7"/></svg>, bg:t.blue, title:'Buat Board', desc:'Board kosong siap dikustomisasi'},
                {m:'template', icon:'📄', bg:'#7c3aed', title:'Mulai dari Template', desc:'Pilih template yang sudah tersedia'},
              ].map(item=>(
                <button key={item.m} onClick={()=>setMode(item.m)} style={{display:'flex',alignItems:'center',gap:14,padding:'14px 16px',background:t.surfaceAlt,border:`1.5px solid ${t.border}`,borderRadius:12,cursor:'pointer',transition:'all 0.18s',textAlign:'left'}}
                  onMouseEnter={e=>{e.currentTarget.style.borderColor=t.blue;e.currentTarget.style.background=t.blueLight}}
                  onMouseLeave={e=>{e.currentTarget.style.borderColor=t.border;e.currentTarget.style.background=t.surfaceAlt}}
                >
                  <div style={{width:40,height:40,borderRadius:10,background:item.bg,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,fontSize:18}}>{item.icon}</div>
                  <div><p style={{fontSize:14,fontWeight:700,color:t.text,marginBottom:2}}>{item.title}</p><p style={{fontSize:12,color:t.muted}}>{item.desc}</p></div>
                </button>
              ))}
            </div>
          </>
        ) : mode==='board' ? (
          <>
            <div style={{padding:'20px 24px 16px',borderBottom:`1px solid ${t.border}`,display:'flex',alignItems:'center',gap:10}}>
              <button onClick={()=>setMode(null)} style={{background:'transparent',border:'none',color:t.muted,fontSize:18,cursor:'pointer'}}>←</button>
              <h3 style={{fontSize:15,fontWeight:700,color:t.text,fontFamily:"'Sora',sans-serif",flex:1}}>Buat Board Baru</h3>
              <button onClick={onClose} style={{background:'transparent',border:'none',color:t.muted,fontSize:18,cursor:'pointer'}}>✕</button>
            </div>
            <div style={{padding:'20px 24px 24px',display:'flex',flexDirection:'column',gap:12}}>
              <div>
                <label style={{fontSize:12,fontWeight:700,color:t.muted,display:'block',marginBottom:6,textTransform:'uppercase',letterSpacing:.5}}>Nama Board *</label>
                <input autoFocus value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="Contoh: Sprint Q2 2025"
                  style={{width:'100%',padding:'10px 14px',border:`1.5px solid ${t.border}`,borderRadius:10,fontSize:14,background:t.surfaceAlt,color:t.text,outline:'none',boxSizing:'border-box'}}
                  onFocus={e=>e.target.style.borderColor=t.blue} onBlur={e=>e.target.style.borderColor=t.border}
                  onKeyDown={e=>e.key==='Enter'&&form.name.trim()&&onCreateBoard(form)}
                />
              </div>
              <div>
                <label style={{fontSize:12,fontWeight:700,color:t.muted,display:'block',marginBottom:6,textTransform:'uppercase',letterSpacing:.5}}>Deskripsi</label>
                <textarea value={form.description} onChange={e=>setForm({...form,description:e.target.value})} placeholder="Deskripsi singkat..." rows={3}
                  style={{width:'100%',padding:'10px 14px',border:`1.5px solid ${t.border}`,borderRadius:10,fontSize:14,background:t.surfaceAlt,color:t.text,outline:'none',resize:'none',boxSizing:'border-box'}}
                  onFocus={e=>e.target.style.borderColor=t.blue} onBlur={e=>e.target.style.borderColor=t.border}
                />
              </div>
              <button onClick={()=>form.name.trim()&&onCreateBoard(form)} disabled={!form.name.trim()}
                style={{padding:'11px',background:t.blue,color:'white',border:'none',borderRadius:10,fontSize:14,fontWeight:700,cursor:'pointer',opacity:!form.name.trim()?0.5:1}}
              >Buat Board</button>
            </div>
          </>
        ) : (
          <>
            <div style={{padding:'20px 24px 16px',borderBottom:`1px solid ${t.border}`,display:'flex',alignItems:'center',gap:10}}>
              <button onClick={()=>setMode(null)} style={{background:'transparent',border:'none',color:t.muted,fontSize:18,cursor:'pointer'}}>←</button>
              <h3 style={{fontSize:15,fontWeight:700,color:t.text,fontFamily:"'Sora',sans-serif",flex:1}}>Pilih Template</h3>
              <button onClick={onClose} style={{background:'transparent',border:'none',color:t.muted,fontSize:18,cursor:'pointer'}}>✕</button>
            </div>
            <div style={{padding:16,display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
              {templates.map(tmpl=>(
                <button key={tmpl.title} onClick={()=>{setMode('board');setForm({name:tmpl.title,description:tmpl.desc})}}
                  style={{display:'flex',flexDirection:'column',alignItems:'flex-start',gap:8,padding:'14px',background:t.surfaceAlt,border:`1.5px solid ${t.border}`,borderRadius:12,cursor:'pointer',transition:'all 0.18s',textAlign:'left'}}
                  onMouseEnter={e=>{e.currentTarget.style.borderColor=t.blue;e.currentTarget.style.background=t.blueLight}}
                  onMouseLeave={e=>{e.currentTarget.style.borderColor=t.border;e.currentTarget.style.background=t.surfaceAlt}}
                >
                  <span style={{fontSize:24}}>{tmpl.icon}</span>
                  <div><p style={{fontSize:13,fontWeight:700,color:t.text,marginBottom:3}}>{tmpl.title}</p><p style={{fontSize:11,color:t.muted,lineHeight:1.4}}>{tmpl.desc}</p></div>
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
CreateModal.propTypes = { dark:PropTypes.bool, onClose:PropTypes.func, onCreateBoard:PropTypes.func }

// ─── MAIN BOARDS PAGE ─────────────────────────────────────────────────────────
export default function Boards({ dark, setDark }) {
  const { user, logout } = useAuth()
  const navigate         = useNavigate()
  const qc               = useQueryClient()
  const t                = useTheme(dark)

  const [activeBoardId, setActiveBoardId]       = useState(null)
  const [showManageAccount, setShowManageAccount] = useState(false)
  const [search, setSearch]                      = useState('')
  const [showCreate, setShowCreate]              = useState(false)
  const [showProfile, setShowProfile]            = useState(false)
  const [showAppMenu, setShowAppMenu]            = useState(false)
  const [showHelp, setShowHelp]                  = useState(false)
  const [showNotif, setShowNotif]                = useState(false)
  const [hoveredBoardId, setHoveredBoardId]      = useState(null)
  const [openMenuId, setOpenMenuId]              = useState(null)

  // ─── Avatar dari localStorage ───────────────────────────────
  const LS_AVATAR = 'kanbanku_profile_avatar'
  const readAvatar = () => {
    try { const r = localStorage.getItem(LS_AVATAR); if (!r) return null; try { return JSON.parse(r) } catch { return r } } catch { return null }
  }
  const [avatarUrl, setAvatarUrl] = useState(readAvatar)
  useEffect(() => {
    const sync = () => setAvatarUrl(readAvatar())
    window.addEventListener('storage', sync)
    window.addEventListener('kanbanku_avatar_updated', sync)
    return () => { window.removeEventListener('storage', sync); window.removeEventListener('kanbanku_avatar_updated', sync) }
  }, []) // eslint-disable-line

  // ─── Pinned boards ──────────────────────────────────────────
  const PIN_KEY = 'kanbanku_pinned_boards'
  const [pinnedIds, setPinnedIds] = useState(() => {
    try { return JSON.parse(localStorage.getItem(PIN_KEY) || '[]') } catch { return [] }
  })
  useEffect(() => {
    const sync = () => { try { setPinnedIds(JSON.parse(localStorage.getItem(PIN_KEY) || '[]')) } catch { /* noop */ } }
    window.addEventListener('storage', sync)
    return () => window.removeEventListener('storage', sync)
  }, [])

  // ─── Refs ───────────────────────────────────────────────────
  const profileBtnRef = useRef()
  const appMenuRef    = useRef()
  const helpRef       = useRef()
  const notifRef      = useRef()

  useEffect(() => {
    const fn = e => {
      if(appMenuRef.current && !appMenuRef.current.contains(e.target)) setShowAppMenu(false)
      if(helpRef.current    && !helpRef.current.contains(e.target))    setShowHelp(false)
      if(notifRef.current   && !notifRef.current.contains(e.target))   setShowNotif(false)
    }
    document.addEventListener('mousedown', fn)
    return () => document.removeEventListener('mousedown', fn)
  }, [])

  // ─── Queries & Mutations ────────────────────────────────────
  const { data: boards, isLoading } = useQuery({
    queryKey: ['boards'],
    queryFn:  () => api.get('/boards').then(r => r.data),
  })
  const createBoard = useMutation({
    mutationFn: data => api.post('/boards', data),
    onSuccess: () => { qc.invalidateQueries(['boards']); setShowCreate(false) },
  })
  const deleteBoard = useMutation({
    mutationFn: id => api.delete(`/boards/${id}`),
    onSuccess: () => qc.invalidateQueries(['boards']),
  })

  // ─── Helpers ────────────────────────────────────────────────
  const handleLogout = async () => { await logout(); navigate('/') }

  // FIX: handleProfileAction sekarang hanya menangani logout
  const handleProfileAction = (action) => {
    if (action === 'logout') handleLogout()
    else setShowProfile(false)
  }

  const togglePin = (id) => {
    const updated = pinnedIds.includes(id)
      ? pinnedIds.filter(x => x !== id)
      : [id, ...pinnedIds]
    setPinnedIds(updated)
    localStorage.setItem(PIN_KEY, JSON.stringify(updated))
  }

  const updateBoardName = (id, name) => {
    api.put(`/boards/${id}`, { name })
      .then(() => qc.invalidateQueries(['boards']))
  }

  // FIX: copyBoard sekarang menutup context menu
  const copyBoard = (board) => {
    createBoard.mutate({ name: board.name + ' (Copy)', description: board.description })
    setOpenMenuId(null)
  }

  // ─── Sort: pinned first ─────────────────────────────────────
  const filtered = (boards || [])
    .filter(b => b.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      const aPin = pinnedIds.includes(a.id) ? 0 : 1
      const bPin = pinnedIds.includes(b.id) ? 0 : 1
      return aPin - bPin
    })

  // ─── Card menu item style ───────────────────────────────────
  const menuItemStyle = {
    width: '100%',
    padding: '10px 12px',
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    textAlign: 'left',
    fontSize: 13,
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    color: t.text,
    borderRadius: 6,
    transition: 'background .15s',
  }

  return (
    <div style={{height:'100vh',display:'flex',flexDirection:'column',background:t.bg,fontFamily:"'DM Sans',sans-serif",transition:'background .3s,color .3s',overflow:'hidden'}}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&family=Sora:wght@700;800&display=swap" rel="stylesheet"/>

      {/* ─── NAVBAR ─── */}
      <nav style={{background:t.navBg,backdropFilter:'blur(16px)',WebkitBackdropFilter:'blur(16px)',borderBottom:`1px solid rgba(255,255,255,.08)`,padding:'0 16px',zIndex:200,transition:'background .3s',flexShrink:0}}>
        <div style={{display:'flex',alignItems:'center',height:56,gap:8}}>

          {/* App menu */}
          <div ref={appMenuRef} style={{position:'relative'}}>
            <button onClick={()=>setShowAppMenu(!showAppMenu)} style={{display:'flex',alignItems:'center',gap:8,background:'transparent',border:'none',cursor:'pointer',padding:'6px 8px',borderRadius:8,transition:'background .18s'}}
              onMouseEnter={e=>e.currentTarget.style.background=t.blueLight}
              onMouseLeave={e=>e.currentTarget.style.background='transparent'}
            >
              <div style={{width:28,height:28,background:t.blue,borderRadius:7,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                <svg width="15" height="15" viewBox="0 0 18 18" fill="none"><rect x="2" y="2" width="6" height="10" rx="2" fill="white"/><rect x="10" y="2" width="6" height="7" rx="2" fill="white" opacity=".7"/></svg>
              </div>
              <span style={{fontFamily:"'Sora',sans-serif",fontWeight:800,fontSize:15,color:t.blue,whiteSpace:'nowrap'}} className="hide-xs">KanbanKu</span>
              <svg width="11" height="11" viewBox="0 0 12 12" fill="none" style={{color:t.muted,transition:'transform .2s',transform:showAppMenu?'rotate(180deg)':'none'}}>
                <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            <Dropdown show={showAppMenu} style={{top:'calc(100% + 6px)',left:0,minWidth:200}}>
              <div style={{background:t.surface,border:`1px solid ${t.border}`,borderRadius:12,padding:8,boxShadow:'0 16px 40px rgba(0,0,0,0.18)'}}>
                {[
                  {icon:'🏠', label:'Home / Landing', action:()=>{navigate('/');setShowAppMenu(false)}},
                  {icon:'⚙️', label:'Pengaturan',      action:()=>setShowAppMenu(false)},
                ].map(item=>(
                  <button key={item.label} onClick={item.action} style={{width:'100%',display:'flex',alignItems:'center',gap:10,padding:'9px 12px',background:'transparent',border:'none',borderRadius:8,cursor:'pointer',fontSize:13,color:t.text,fontWeight:500,transition:'background .15s',textAlign:'left'}}
                    onMouseEnter={e=>e.currentTarget.style.background=t.surfaceHover}
                    onMouseLeave={e=>e.currentTarget.style.background='transparent'}
                  ><span style={{fontSize:15}}>{item.icon}</span>{item.label}</button>
                ))}
              </div>
            </Dropdown>
          </div>

          {/* Search */}
          <div style={{flex:1,maxWidth:360,position:'relative'}} className="search-wrapper">
            <span style={{position:'absolute',left:10,top:'50%',transform:'translateY(-50%)',color:t.muted,fontSize:13,pointerEvents:'none'}}>🔍</span>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Cari board..."
              style={{width:'100%',padding:'7px 12px 7px 30px',border:`1.5px solid ${t.border}`,borderRadius:9,fontSize:13,background:t.surfaceAlt,color:t.text,outline:'none',transition:'all .2s',boxSizing:'border-box'}}
              onFocus={e=>{e.target.style.borderColor=t.blue;e.target.style.background=t.surface}}
              onBlur={e=>{e.target.style.borderColor=t.border;e.target.style.background=t.surfaceAlt}}
            />
          </div>

          {/* Buat */}
          <button onClick={()=>setShowCreate(true)} style={{background:t.blue,color:'white',border:'none',borderRadius:8,padding:'7px 16px',fontSize:13,fontWeight:700,cursor:'pointer',transition:'all .18s',whiteSpace:'nowrap',flexShrink:0}}
            onMouseEnter={e=>{e.currentTarget.style.background=t.blueBright;e.currentTarget.style.transform='translateY(-1px)'}}
            onMouseLeave={e=>{e.currentTarget.style.background=t.blue;e.currentTarget.style.transform='none'}}
          >+ Buat</button>

          {/* Right icons */}
          <div style={{display:'flex',alignItems:'center',gap:2,marginLeft:'auto'}}>

            {/* Notifikasi */}
            <div ref={notifRef} style={{position:'relative'}}>
              <NavIconBtn onClick={()=>{setShowNotif(!showNotif);setShowProfile(false);setShowHelp(false)}} title="Notifikasi" active={showNotif} dark={dark}>
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                </svg>
                <span style={{position:'absolute',top:6,right:6,width:7,height:7,borderRadius:'50%',background:'#dc2626',border:`2px solid ${t.navBg}`}}/>
              </NavIconBtn>
              <Dropdown show={showNotif} style={{top:'calc(100% + 8px)',right:0,width:300}}>
                <div style={{background:t.surface,border:`1px solid ${t.border}`,borderRadius:12,overflow:'hidden',boxShadow:'0 16px 40px rgba(0,0,0,0.18)'}}>
                  <div style={{padding:'14px 16px 10px',borderBottom:`1px solid ${t.border}`,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                    <span style={{fontSize:14,fontWeight:700,color:t.text}}>Notifikasi</span>
                    <button onClick={()=>Notification.permission!=='granted'&&Notification.requestPermission()} style={{fontSize:11,color:t.blue,background:'transparent',border:'none',cursor:'pointer',fontWeight:600}}>Aktifkan</button>
                  </div>
                  <div style={{padding:'20px 16px',textAlign:'center',color:t.muted,fontSize:13}}>
                    <div style={{fontSize:32,marginBottom:8}}>🔔</div>Belum ada notifikasi
                  </div>
                </div>
              </Dropdown>
            </div>

            {/* Bantuan */}
            <div ref={helpRef} style={{position:'relative'}}>
              <NavIconBtn onClick={()=>{setShowHelp(!showHelp);setShowProfile(false);setShowNotif(false)}} title="Bantuan" active={showHelp} dark={dark}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
              </NavIconBtn>
              <Dropdown show={showHelp} style={{top:'calc(100% + 8px)',right:0,width:220}}>
                <div style={{background:t.surface,border:`1px solid ${t.border}`,borderRadius:12,padding:8,boxShadow:'0 16px 40px rgba(0,0,0,0.18)'}}>
                  {[{icon:'📖',label:'Dokumentasi'},{icon:'❓',label:'FAQ'},{icon:'💬',label:'Komunitas'},{icon:'📧',label:'Hubungi Kami'}].map(item=>(
                    <button key={item.label} style={{width:'100%',display:'flex',alignItems:'center',gap:10,padding:'9px 12px',background:'transparent',border:'none',borderRadius:8,cursor:'pointer',fontSize:13,color:t.text,fontWeight:500,transition:'background .15s',textAlign:'left'}}
                      onMouseEnter={e=>e.currentTarget.style.background=t.surfaceHover}
                      onMouseLeave={e=>e.currentTarget.style.background='transparent'}
                    ><span style={{fontSize:14}}>{item.icon}</span>{item.label}</button>
                  ))}
                </div>
              </Dropdown>
            </div>

            {/* Avatar → ProfilePanel */}
            <div style={{position:'relative',marginLeft:4}}>
              <button
                ref={profileBtnRef}
                onClick={()=>{setShowProfile(!showProfile);setShowHelp(false);setShowNotif(false)}}
                style={{
                  width:34,height:34,borderRadius:'50%',
                  background:avatarUrl?'transparent':t.blue,
                  border:showProfile?`2.5px solid ${t.blueBright}`:'2.5px solid transparent',
                  display:'flex',alignItems:'center',justifyContent:'center',
                  color:'white',fontSize:13,fontWeight:700,
                  cursor:'pointer',transition:'all .18s',flexShrink:0,
                  overflow:'hidden',padding:0,
                }}
                onMouseEnter={e=>e.currentTarget.style.borderColor=t.blueBright}
                onMouseLeave={e=>!showProfile&&(e.currentTarget.style.borderColor='transparent')}
              >
                {avatarUrl
                  ? <img src={avatarUrl} alt={user?.name} style={{width:'100%',height:'100%',objectFit:'cover'}}/>
                  : user?.name?.[0]?.toUpperCase()
                }
              </button>

              {showProfile && (
                <ProfilePanel
                  dark={dark}
                  user={user}
                  onDarkChange={setDark}
                  anchorRef={profileBtnRef}
                  onLogout={handleProfileAction}
                  onManageAccount={()=>{setShowProfile(false);setShowManageAccount(true)}}
                />
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* ─── CONTENT ─── */}
      <div style={{flex:1,display:'flex',overflow:activeBoardId?'hidden':'auto'}}>

        {showManageAccount ? (
          <div style={{flex:1,overflowY:'auto'}}>
            <ManageAccount dark={dark} user={user} onBack={()=>setShowManageAccount(false)}/>
          </div>

        ) : activeBoardId ? (
          <Boardmain boardId={activeBoardId} dark={dark} onBack={()=>setActiveBoardId(null)}/>

        ) : (
          <div style={{flex:1,overflowY:'auto'}}>
            <div style={{maxWidth:1100,margin:'0 auto',padding:'32px 20px'}}>

              {/* Header */}
              <div style={{marginBottom:28}}>
                <h1 style={{fontFamily:"'Sora',sans-serif",fontSize:22,fontWeight:800,color:t.text,marginBottom:4}}>Board Saya</h1>
                <p style={{fontSize:14,color:t.muted}}>Kelola semua project kamu dari sini</p>
              </div>

              {/* Loading skeleton */}
              {isLoading ? (
                <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))',gap:14}}>
                  {[1,2,3,4].map(i=>(
                    <div key={i} style={{background:t.surface,borderRadius:14,height:130,border:`1px solid ${t.border}`,animation:'pulse 1.5s ease infinite'}}/>
                  ))}
                </div>

              /* Empty state */
              ) : !filtered.length ? (
                <div style={{textAlign:'center',padding:'80px 0',color:t.muted}}>
                  <div style={{fontSize:52,marginBottom:16}}>📋</div>
                  <p style={{fontSize:16,fontWeight:600,color:t.text,marginBottom:8}}>
                    {search ? 'Board tidak ditemukan' : 'Belum ada board'}
                  </p>
                  <p style={{fontSize:14,marginBottom:24}}>
                    {search ? 'Coba kata kunci lain' : 'Klik "+ Buat" untuk memulai!'}
                  </p>
                  {!search && (
                    <button onClick={()=>setShowCreate(true)} style={{background:t.blue,color:'white',border:'none',borderRadius:10,padding:'10px 24px',fontSize:14,fontWeight:700,cursor:'pointer'}}>
                      + Buat Board Pertama
                    </button>
                  )}
                </div>

              /* Board grid */
              ) : (
                <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))',gap:14}}>

                  {/* Add new board card */}
                  <button onClick={()=>setShowCreate(true)}
                    style={{background:'transparent',border:`2px dashed ${t.border}`,borderRadius:14,padding:22,cursor:'pointer',transition:'all .2s',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:8,minHeight:130,fontFamily:"'DM Sans',sans-serif"}}
                    onMouseEnter={e=>{e.currentTarget.style.borderColor=t.blue;e.currentTarget.style.background=t.blueLight}}
                    onMouseLeave={e=>{e.currentTarget.style.borderColor=t.border;e.currentTarget.style.background='transparent'}}
                  >
                    <span style={{fontSize:28,color:t.muted}}>+</span>
                    <span style={{fontSize:13,fontWeight:600,color:t.muted}}>Buat Board Baru</span>
                  </button>

                  {/* FIX: Hapus duplikasi div — hanya satu card per board */}
                  {filtered.map((board, idx) => {
                    const isPinned = pinnedIds.includes(board.id)
                    return (
                      <div
                        key={board.id}
                        style={{
                          background:t.surface,
                          border:`1px solid ${isPinned?t.blue:t.border}`,
                          borderRadius:14,
                          cursor:'pointer',
                          transition:'all .2s',
                          animation:`fadeUp 0.4s ease ${idx*50}ms both`,
                          overflow:'visible',
                          position:'relative',
                        }}
                        onClick={()=>setActiveBoardId(board.id)}
                        onMouseEnter={()=>setHoveredBoardId(board.id)}
                        onMouseLeave={()=>{
                          setHoveredBoardId(null)
                          setOpenMenuId(null)
                        }}
                      >
                        {/* Color strip */}
                        <div style={{height:5,borderRadius:'14px 14px 0 0',background:`linear-gradient(90deg,${CARD_COLORS[idx%CARD_COLORS.length]},${CARD_COLORS[(idx+2)%CARD_COLORS.length]})`}}/>

                        {/* Hover action buttons */}
                        {hoveredBoardId === board.id && (
                          <div style={{position:'absolute',top:12,right:10,display:'flex',gap:5,zIndex:5}}>

                            {/* Pin / Unpin */}
                            <button
                              title={isPinned ? 'Lepas dari favorit' : 'Tandai sebagai favorit'}
                              onClick={e=>{e.stopPropagation();togglePin(board.id)}}
                              style={{width:26,height:26,borderRadius:6,border:'none',cursor:'pointer',background:isPinned?'#facc15':'rgba(0,0,0,0.45)',color:isPinned?'#78350f':'white',fontSize:13,display:'flex',alignItems:'center',justifyContent:'center'}}
                            >⭐</button>

                            {/* Context menu toggle */}
                            <button
                              title="Menu board"
                              onClick={e=>{e.stopPropagation();setOpenMenuId(openMenuId===board.id?null:board.id)}}
                              style={{width:26,height:26,borderRadius:6,border:'none',cursor:'pointer',background:'rgba(0,0,0,0.45)',color:'white',fontSize:16,display:'flex',alignItems:'center',justifyContent:'center',lineHeight:1}}
                            >⋯</button>
                          </div>
                        )}

                        {/* Context menu dropdown */}
                        {openMenuId === board.id && (
                          <div
                            onClick={e=>e.stopPropagation()}
                            style={{position:'absolute',top:42,right:10,width:164,background:t.surface,border:`1px solid ${t.border}`,borderRadius:10,boxShadow:'0 10px 30px rgba(0,0,0,.2)',zIndex:10,padding:4}}
                          >
                            <button
                              onClick={e=>{
                                e.stopPropagation()
                                const newName = prompt('Ubah nama board', board.name)
                                if (newName?.trim()) updateBoardName(board.id, newName.trim())
                                setOpenMenuId(null)
                              }}
                              style={menuItemStyle}
                              onMouseEnter={e=>e.currentTarget.style.background=t.surfaceHover}
                              onMouseLeave={e=>e.currentTarget.style.background='transparent'}
                            >✏️ Ubah Nama</button>

                            <button
                              onClick={e=>{
                                e.stopPropagation()
                                copyBoard(board)
                              }}
                              style={menuItemStyle}
                              onMouseEnter={e=>e.currentTarget.style.background=t.surfaceHover}
                              onMouseLeave={e=>e.currentTarget.style.background='transparent'}
                            >📋 Salin Board</button>

                            <button
                              onClick={e=>{
                                e.stopPropagation()
                                if (window.confirm(`Hapus "${board.name}"?`)) deleteBoard.mutate(board.id)
                                setOpenMenuId(null)
                              }}
                              style={{...menuItemStyle,color:t.red}}
                              onMouseEnter={e=>e.currentTarget.style.background='#fee2e2'}
                              onMouseLeave={e=>e.currentTarget.style.background='transparent'}
                            >🗑 Hapus</button>
                          </div>
                        )}

                        {/* Card body */}
                        <div style={{padding:'16px 18px'}}>
                          <h3 style={{fontFamily:"'Sora',sans-serif",fontSize:14,fontWeight:700,color:t.text,marginBottom:6,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                            {isPinned && <span style={{marginRight:5}}>📌</span>}
                            {board.name}
                          </h3>
                          {board.description && (
                            <p style={{fontSize:12,color:t.muted,lineHeight:1.5,marginBottom:12,overflow:'hidden',display:'-webkit-box',WebkitLineClamp:2,WebkitBoxOrient:'vertical'}}>
                              {board.description}
                            </p>
                          )}
                          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',paddingTop:10,borderTop:`1px solid ${t.border}`}}>
                            <span style={{fontSize:11,color:t.muted}}>{board.columns_count ?? 3} kolom</span>
                            <span style={{fontSize:11,fontWeight:600,color:t.blue}}>Buka →</span>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ─── MODALS ─── */}
      {showCreate && (
        <CreateModal dark={dark} onClose={()=>setShowCreate(false)} onCreateBoard={form=>createBoard.mutate(form)}/>
      )}

      <style>{`
        @keyframes dropIn{from{opacity:0;transform:translateY(-16px) scale(.97)}to{opacity:1;transform:translateY(0) scale(1)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
        *{box-sizing:border-box;margin:0;padding:0}
        @media(max-width:600px){.hide-xs{display:none!important}.search-wrapper{max-width:140px!important}}
        @media(max-width:400px){.search-wrapper{display:none!important}}
        ::-webkit-scrollbar{width:5px;height:5px}
        ::-webkit-scrollbar-track{background:transparent}
        ::-webkit-scrollbar-thumb{background:#94a3b844;border-radius:99px}
        ::-webkit-scrollbar-thumb:hover{background:#94a3b877}
      `}</style>
    </div>
  )
}
Boards.propTypes = { dark:PropTypes.bool, setDark:PropTypes.func }