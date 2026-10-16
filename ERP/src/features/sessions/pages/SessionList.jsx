import React, { useState, useEffect, useCallback } from 'react'
import { Monitor, Smartphone, LogOut, RefreshCw, AlertTriangle, Shield, Trash2, ShieldAlert } from 'lucide-react'
import { useAppDispatch, useAppSelector } from '../../../app/hooks'
import { addAlert } from '../../notifications/notificationSlice'
import { 
  getMySessions, 
  getCompanySessions, 
  deleteSession, 
  deleteAdminSession, 
  deleteAllSessions 
} from '../../../api/sso/session'
import { confirmDialog } from '../../../utils/confirmDialog'
import Pagination from '../../../components/common/Pagination'

export default function SessionList() {
  const dispatch = useAppDispatch()
  
  const selectedCompany = useAppSelector((state) => state.company.selectedCompany)
  const currentUser = useAppSelector((state) => state.auth?.user ?? null)
  const isSuperAdmin = currentUser?.role === 'super_admin'

  const [mySessions, setMySessions] = useState([])
  const [companySessionsData, setCompanySessionsData] = useState({ sessions: [], totalPages: 1, totalCount: 0 })
  const companySessions = companySessionsData.sessions || []

  const [isLoadingMySessions, setIsLoadingMySessions] = useState(false)
  const [isLoadingCompanySessions, setIsLoadingCompanySessions] = useState(false)
  
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const [selectedSession, setSelectedSession] = useState(null)

  const fetchMySessions = useCallback(async () => {
    setIsLoadingMySessions(true)
    try {
      const data = await getMySessions()
      const sessionsArray = Array.isArray(data) ? data : data.sessions || []
      setMySessions(sessionsArray)
    } catch (error) {
      console.error('Failed to fetch my sessions', error)
    } finally {
      setIsLoadingMySessions(false)
    }
  }, [])

  const fetchCompanySessions = useCallback(async () => {
    if (!selectedCompany?.id || selectedCompany.id === 'all') return
    setIsLoadingCompanySessions(true)
    try {
      const data = await getCompanySessions(selectedCompany.id, { page, pageSize })
      const sessionsArray = Array.isArray(data) ? data : data.sessions || []
      const pagination = data._pageInfo || data.pagination || null
      const totalPages = pagination?.totalPages || data.totalPages || 1
      const totalCount = pagination?.totalCount || pagination?.totalElements || sessionsArray.length
      
      setCompanySessionsData({ sessions: sessionsArray, totalPages, totalCount })
    } catch (error) {
      console.error('Failed to fetch company sessions', error)
    } finally {
      setIsLoadingCompanySessions(false)
    }
  }, [selectedCompany?.id, page, pageSize])

  useEffect(() => {
    fetchMySessions()
    fetchCompanySessions()
  }, [fetchMySessions, fetchCompanySessions])

  const handleEndSession = async (session, isAdminAction = false) => {
    const prompt = isAdminAction 
      ? `Terminate user session for ${session.username}? The selected user will immediately lose access.`
      : `End this session? You will be logged out from this device.`
      
    if (await confirmDialog({ message: prompt })) {
      try {
        if (isAdminAction) {
          await deleteAdminSession(session.id)
        } else {
          await deleteSession(session.id)
        }
        dispatch(addAlert({ type: 'success', message: 'Session terminated successfully.' }))
        if (selectedSession?.id === session.id) setSelectedSession(null)
        fetchMySessions()
        fetchCompanySessions()
      } catch (error) {
        console.error("Terminate session error", error)
        dispatch(addAlert({ type: 'error', message: error?.response?.data?.message || 'Failed to terminate session.' }))
      }
    }
  }

  const handleDeleteAllSessions = async (force) => {
    const prompt = force
      ? `FORCE Terminate all sessions? This will aggressively sign out every active session across all devices.`
      : `Terminate all sessions? This will sign out every active session.`

    if (await confirmDialog({ message: prompt })) {
      try {
        await deleteAllSessions(force)
        dispatch(addAlert({ type: 'success', message: 'All sessions terminated successfully.' }))
        setSelectedSession(null)
        fetchMySessions()
        fetchCompanySessions()
      } catch (error) {
        console.error("Terminate all sessions error", error)
        dispatch(addAlert({ type: 'error', message: error?.response?.data?.message || 'Failed to terminate all sessions.' }))
      }
    }
  }

  const getStatusBadge = (session) => {
    if (!session.accessTokenValidTill) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-zinc-100 text-zinc-500 border border-zinc-200/60">
          Unknown
        </span>
      )
    }
    
    const validTill = new Date(session.accessTokenValidTill)
    const now = new Date()
    const diffMins = (validTill - now) / (1000 * 60)

    if (diffMins < 0) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200/60">
          Expired
        </span>
      )
    }
    if (diffMins < 30) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200/60">
          Expiring Soon
        </span>
      )
    }
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
        Active
      </span>
    )
  }

  const SessionRow = ({ session, isAdminView = false }) => {
    const isMobile = session.userAgent?.toLowerCase().includes('mobile')
    const isSelected = selectedSession?.id === session.id

    return (
      <tr 
        onClick={() => setSelectedSession(session)}
        className={`cursor-pointer transition-colors group select-none ${
          isSelected 
            ? 'bg-indigo-50/70 border-indigo-200' 
            : 'hover:bg-zinc-50/80'
        }`}
        style={{ minHeight: '64px' }}
      >
        {/* Device & User */}
        <td className="px-4 py-3.5">
          <div className="flex items-center gap-3 min-w-0">
            <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 border ${
              isMobile 
                ? 'bg-amber-50 text-amber-600 border-amber-100' 
                : 'bg-indigo-50 text-indigo-600 border-indigo-100'
            }`}>
              {isMobile ? <Smartphone size={16} /> : <Monitor size={16} />}
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-xs text-zinc-900 truncate" title={session.username || 'Unknown'}>
                {session.username || 'Unknown'}
              </p>
              <p className="text-[10px] font-mono text-zinc-400 truncate" title={session.moduleName || 'System'}>
                {session.moduleName || 'System'}
              </p>
            </div>
          </div>
        </td>

        {/* Network */}
        <td className="px-4 py-3.5">
          <div className="min-w-0">
            <p className="text-xs font-mono font-medium text-zinc-800 truncate" title={session.ipAddress || 'Unknown IP'}>
              {session.ipAddress || 'Unknown IP'}
            </p>
            <p 
              className="text-[10px] text-zinc-400 truncate max-w-full block overflow-hidden text-ellipsis whitespace-nowrap" 
              title={session.userAgent || 'Unknown Browser'}
            >
              {session.userAgent || 'Unknown Browser'}
            </p>
          </div>
        </td>

        {/* Login Time */}
        <td className="px-4 py-3.5">
          <p className="text-xs text-zinc-600 font-medium whitespace-nowrap">
            {session.createdAt ? new Date(session.createdAt).toLocaleString() : '—'}
          </p>
        </td>

        {/* Status */}
        <td className="px-4 py-3.5">
          {getStatusBadge(session)}
        </td>

        {/* Actions */}
        <td className="px-4 py-3.5 text-right">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              handleEndSession(session, isAdminView)
            }}
            className="w-8 h-8 rounded-lg inline-flex items-center justify-center border border-zinc-200 bg-white text-zinc-400 hover:text-rose-600 hover:bg-rose-50 hover:border-rose-200 transition-colors shadow-2xs"
            title="Terminate Session"
            aria-label="Terminate Session"
          >
            <LogOut size={14} />
          </button>
        </td>
      </tr>
    )
  }

  return (
    <div 
      className="w-full max-w-none px-6 sm:px-8 py-6 space-y-6 animate-fade-in pb-12"
      style={{ width: '100%', maxWidth: 'none' }}
    >
      {/* ── Page Header ── */}
      <div className="space-y-1">
        <h1 className="text-[22px] sm:text-[24px] font-bold text-zinc-900 tracking-tight">Session Management</h1>
        <p className="text-[13px] text-zinc-500">
          Monitor current live connections, device categories and trigger security audits
        </p>
      </div>

      {/* ── Main Two-Column Layout ── */}
      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_340px] 2xl:grid-cols-[minmax(0,1fr)_360px] gap-5 items-start">
        {/* ── Left Column: My Sessions & Company Sessions ── */}
        <div className="space-y-5 min-w-0">
          {/* My Sessions Card */}
          <div className="bg-white rounded-xl border border-zinc-200/90 shadow-2xs overflow-hidden">
            <div className="px-5 py-3.5 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/60">
              <div className="flex items-center gap-2">
                <Shield className="text-indigo-600" size={17} />
                <h3 className="font-bold text-xs uppercase tracking-wider text-zinc-700">My Sessions</h3>
              </div>
              <span className="text-[10px] font-semibold text-zinc-500 bg-zinc-100 px-2 py-0.5 rounded-full">
                {mySessions.length} Active
              </span>
            </div>
            
            <div className="overflow-x-auto min-w-0 max-w-full custom-scrollbar">
              <table className="w-full min-w-[620px] sm:min-w-full table-fixed divide-y divide-zinc-200 text-left border-collapse" style={{ width: '100%', tableLayout: 'fixed' }} aria-label="My Sessions Table">
                <thead className="bg-zinc-50 border-b border-zinc-200 sticky top-0 z-10">
                  <tr className="text-xs font-semibold text-zinc-600 uppercase tracking-wider select-none">
                    <th scope="col" className="w-[27%] min-w-[160px] px-4 py-3">Device & User</th>
                    <th scope="col" className="w-[25%] min-w-[140px] px-4 py-3">Network</th>
                    <th scope="col" className="w-[22%] min-w-[130px] px-4 py-3">Login Time</th>
                    <th scope="col" className="w-[16%] min-w-[100px] px-4 py-3">Status</th>
                    <th scope="col" className="w-[10%] min-w-[60px] px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {isLoadingMySessions ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center">
                        <div className="flex justify-center items-center gap-2 text-zinc-400 text-xs font-medium">
                          <RefreshCw className="animate-spin" size={14} /> Loading my sessions...
                        </div>
                      </td>
                    </tr>
                  ) : mySessions.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-zinc-400 text-xs font-medium">
                        No active sessions found.
                      </td>
                    </tr>
                  ) : (
                    mySessions.map(session => <SessionRow key={session.id} session={session} />)
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Company Sessions (For Admins) */}
          {(isSuperAdmin || selectedCompany?.id) && (
            <div className="bg-white rounded-xl border border-zinc-200/90 shadow-2xs overflow-hidden">
              <div className="px-5 py-3.5 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/60">
                <div className="flex items-center gap-2">
                  <Monitor className="text-indigo-600" size={17} />
                  <h3 className="font-bold text-xs uppercase tracking-wider text-zinc-700">Company Sessions</h3>
                </div>
                <span className="text-[10px] font-semibold text-zinc-500 bg-zinc-100 px-2 py-0.5 rounded-full">
                  {companySessionsData.totalCount || companySessions.length} Total
                </span>
              </div>

              <div className="overflow-x-auto min-w-0 max-w-full custom-scrollbar">
                <table className="w-full min-w-[620px] sm:min-w-full table-fixed divide-y divide-zinc-200 text-left border-collapse" style={{ width: '100%', tableLayout: 'fixed' }} aria-label="Company Sessions Table">
                  <thead className="bg-zinc-50 border-b border-zinc-200 sticky top-0 z-10">
                    <tr className="text-xs font-semibold text-zinc-600 uppercase tracking-wider select-none">
                      <th scope="col" className="w-[27%] min-w-[160px] px-4 py-3">Device & User</th>
                      <th scope="col" className="w-[25%] min-w-[140px] px-4 py-3">Network</th>
                      <th scope="col" className="w-[22%] min-w-[130px] px-4 py-3">Login Time</th>
                      <th scope="col" className="w-[16%] min-w-[100px] px-4 py-3">Status</th>
                      <th scope="col" className="w-[10%] min-w-[60px] px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {isLoadingCompanySessions ? (
                      <tr>
                        <td colSpan={5} className="p-8 text-center">
                          <div className="flex justify-center items-center gap-2 text-zinc-400 text-xs font-medium">
                            <RefreshCw className="animate-spin" size={14} /> Loading company sessions...
                          </div>
                        </td>
                      </tr>
                    ) : companySessions.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-8 px-4 text-center text-zinc-400 text-xs font-medium">
                          <div className="h-[75px] flex items-center justify-center">
                            {selectedCompany?.id === 'all' 
                              ? "Please select a company to view sessions." 
                              : "No active company sessions found."}
                          </div>
                        </td>
                      </tr>
                    ) : (
                      companySessions.map(session => (
                        <SessionRow key={session.id} session={session} isAdminView={true} />
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {companySessions.length > 0 && (
                <div className="p-4 border-t border-zinc-100 bg-white">
                  <Pagination 
                    page={page} 
                    totalPages={companySessionsData.totalPages} 
                    totalElements={companySessionsData.totalCount} 
                    pageSize={pageSize} 
                    onPageChange={setPage} 
                    onPageSizeChange={setPageSize} 
                    itemName="sessions" 
                  />
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Right Column: Session Details & Danger Zone ── */}
        <div className="space-y-5 min-w-0">
          {/* Session Details Panel */}
          <div className="bg-white rounded-xl border border-zinc-200/90 shadow-2xs p-5 space-y-4">
            <h3 className="font-bold text-xs uppercase tracking-wider text-zinc-700 border-b border-zinc-100 pb-2.5">
              Session Details
            </h3>
            
            {!selectedSession ? (
              <div className="min-h-[150px] flex flex-col items-center justify-center text-center p-6 text-zinc-400">
                <Monitor size={24} className="mb-2 text-zinc-300 stroke-[1.5]" />
                <span className="text-xs font-medium">Select a session to view details</span>
              </div>
            ) : (
              <div className="space-y-3.5 animate-fade-in text-xs">
                <div>
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1 block">User</label>
                  <div className="text-xs font-semibold text-zinc-900">{selectedSession.username || 'Unknown'}</div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1 block">Device & Browser</label>
                  <div className="text-xs font-mono font-medium text-zinc-800 break-words bg-zinc-50 border border-zinc-100 p-2 rounded-lg">
                    {selectedSession.userAgent || 'Unknown'}
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1 block">Network</label>
                  <div className="text-xs font-mono font-medium text-zinc-800">{selectedSession.ipAddress || 'Unknown IP'}</div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1 block">Module</label>
                  <div className="text-xs font-semibold text-zinc-800">{selectedSession.moduleName || 'System'}</div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1 block">Authentication</label>
                  <div className="text-[11px] text-zinc-600 space-y-1.5 bg-zinc-50/70 border border-zinc-100 p-2.5 rounded-lg">
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Login Time:</span>
                      <span className="font-medium text-zinc-700">{selectedSession.createdAt ? new Date(selectedSession.createdAt).toLocaleString() : '—'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Last Updated:</span>
                      <span className="font-medium text-zinc-700">{selectedSession.updatedAt ? new Date(selectedSession.updatedAt).toLocaleString() : '—'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Token Expiry:</span>
                      <span className="font-medium text-zinc-700">{selectedSession.accessTokenValidTill ? new Date(selectedSession.accessTokenValidTill).toLocaleString() : '—'}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-zinc-100">
                  <button
                    type="button"
                    onClick={() => handleEndSession(selectedSession, companySessions.find(s => s.id === selectedSession.id))}
                    className="w-full h-9 bg-rose-50 hover:bg-rose-100 border border-rose-200/70 text-rose-700 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-2 active:scale-95"
                  >
                    <LogOut size={14} /> Terminate Session
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Danger Zone Panel */}
          {isSuperAdmin && (
            <div className="bg-rose-50/40 rounded-xl border border-rose-200/80 shadow-2xs p-5 space-y-3.5">
              <div className="flex items-center gap-2 text-rose-800 border-b border-rose-200/60 pb-2.5">
                <ShieldAlert size={17} className="text-rose-600 shrink-0" />
                <h3 className="font-bold text-xs uppercase tracking-wider">Danger Zone</h3>
              </div>
              <p className="text-xs text-rose-700/80 leading-relaxed">
                Aggressive security actions. Use with extreme caution as this will impact active users.
              </p>
              <div className="space-y-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => handleDeleteAllSessions(false)}
                  className="w-full h-10 bg-white border border-rose-200 text-rose-700 hover:bg-rose-50 rounded-lg text-xs font-semibold transition-all shadow-2xs flex items-center justify-center gap-2 active:scale-95"
                >
                  <AlertTriangle size={15} /> Terminate All Sessions
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteAllSessions(true)}
                  className="w-full h-10 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold transition-all shadow-xs flex items-center justify-center gap-2 active:scale-95"
                >
                  <Trash2 size={15} /> Force Terminate All
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
