
import CustomSelect from '../../../components/common/CustomSelect';
import React, { useState, useEffect } from 'react'
import { Cog, Globe, CreditCard, Shield, Bell, Percent, Plus, X } from 'lucide-react'
import { useParams, useNavigate } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { settingsApi } from '../../../api/sso'
import { addAlert } from '../../notifications/notificationSlice'
import { useRBAC } from '../../../utils/rbac'

export default function SettingsPage() {
  const companyId = useParams().companyId || JSON.parse(localStorage.getItem("selected_company"))?.id || JSON.parse(localStorage.getItem("auth_user"))?.companyCode;
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { isAdmin } = useRBAC()
  const [settings, setSettings] = useState(null)
  const [activeTab, setActiveTab] = useState('general')
  const [newTaxSlab, setNewTaxSlab] = useState('')
  const [isError, setIsError] = useState(false)

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const data = await settingsApi.getCompanySettings(companyId)
        setSettings(data)
        setIsError(false)
      } catch (error) {
        console.error('API getCompanySettings failed.', error)
        setIsError(true)
      }
    }
    fetchSettings()
  }, [companyId])

  const handleSaveTaxSlabs = async (newSlabs) => {
    const updatedSettings = await settingsApi.updateCompanySettings(companyId, { taxSlabs: newSlabs })
    setSettings(updatedSettings)
    dispatch(addAlert({ type: 'success', message: 'Tax slabs updated successfully' }))
  }

  const handleAddTaxSlab = () => {
    const val = parseFloat(newTaxSlab)
    if (!isNaN(val) && settings) {
      if (settings.taxSlabs.includes(val)) {
        dispatch(addAlert({ type: 'error', message: 'Tax slab already exists' }))
        return
      }
      const newSlabs = [...settings.taxSlabs, val].sort((a, b) => a - b)
      handleSaveTaxSlabs(newSlabs)
      setNewTaxSlab('')
    }
  }

  const handleRemoveTaxSlab = (val) => {
    if (settings) {
      const newSlabs = settings.taxSlabs.filter(s => s !== val)
      handleSaveTaxSlabs(newSlabs)
    }
  }

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Company Settings</h1>
          <p className="page-subtitle">Manage configuration for your tenant workspace</p>
        </div>
      </div>

      {isError && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-center gap-3">
          <Shield size={20} className="text-red-500" />
          <p className="text-sm font-medium">Failed to load company settings. Please try again later.</p>
        </div>
      )}

      <div className="flex flex-col md:flex-row gap-6">
        <div className="w-full md:w-64 space-y-1">
          <button 
            onClick={() => setActiveTab('general')}
            className={`w-full flex items-center gap-3 px-4 py-2.5 font-semibold rounded-lg text-sm transition-colors text-left ${activeTab === 'general' ? 'bg-primary/10 text-primary' : 'text-zinc-600 hover:bg-zinc-100'}`}
          >
            <Cog size={16} /> General
          </button>
          
          {isAdmin && (
            <button 
              onClick={() => setActiveTab('tax')}
              className={`w-full flex items-center gap-3 px-4 py-2.5 font-semibold rounded-lg text-sm transition-colors text-left ${activeTab === 'tax' ? 'bg-primary/10 text-primary' : 'text-zinc-600 hover:bg-zinc-100'}`}
            >
              <Percent size={16} /> Tax Settings
            </button>
          )}

          <button onClick={() => {}} className="w-full flex items-center gap-3 px-4 py-2.5 text-zinc-600 hover:bg-zinc-100 rounded-lg text-sm font-medium transition-colors text-left">
            <Globe size={16} /> Localization
          </button>
          <button onClick={() => {}} className="w-full flex items-center gap-3 px-4 py-2.5 text-zinc-600 hover:bg-zinc-100 rounded-lg text-sm font-medium transition-colors text-left">
            <CreditCard size={16} /> Billing
          </button>
          <button onClick={() => navigate(`/company/${companyId}/settings/security`)} className="w-full flex items-center gap-3 px-4 py-2.5 text-zinc-600 hover:bg-zinc-100 rounded-lg text-sm font-medium transition-colors text-left">
            <Shield size={16} /> Security
          </button>
          <button onClick={() => navigate(`/company/${companyId}/settings/notifications`)} className="w-full flex items-center gap-3 px-4 py-2.5 text-zinc-600 hover:bg-zinc-100 rounded-lg text-sm font-medium transition-colors text-left">
            <Bell size={16} /> Notifications
          </button>
        </div>

        <div className="flex-1 card p-4">
          {activeTab === 'general' && (
            <>
              <h2 className="text-lg font-bold text-zinc-900 mb-4">General Settings</h2>
              
              <div className="space-y-6 max-w-lg">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-500">Company Name</label>
                  <input className="input-field" defaultValue={settings?.companyName || ''} />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-500">Support Email</label>
                  <input className="input-field" defaultValue={settings?.email || ''} />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-500">Timezone</label>
                  <CustomSelect className="input-field" defaultValue={settings?.timezone || 'IST (Indian Standard Time)'}>
                    <option>UTC (Coordinated Universal Time)</option>
                    <option>EST (Eastern Standard Time)</option>
                    <option>Asia/Kolkata</option>
                  </CustomSelect>
                </div>

                <div className="pt-4 border-t border-zinc-100">
                  <button className="btn-primary" onClick={() => dispatch(addAlert({type:'success', message:'Settings saved'}))}>Save Changes</button>
                </div>
              </div>
            </>
          )}

          {activeTab === 'tax' && isAdmin && (
            <>
              <h2 className="text-lg font-bold text-zinc-900 mb-4">Tax Configurations (Admin)</h2>
              <p className="text-sm text-zinc-500 mb-6">Configure GST tax slabs that will be available during invoice and bill generation.</p>
              
              <div className="max-w-md space-y-6">
                <div className="flex gap-2">
                  <input 
                    type="number" 
                    className="input-field" 
                    placeholder="Enter Tax % (e.g. 18)" 
                    value={newTaxSlab}
                    onChange={e => setNewTaxSlab(e.target.value)}
                  />
                  <button onClick={handleAddTaxSlab} className="btn-primary whitespace-nowrap"><Plus size={16} /> Add Slab</button>
                </div>

                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-zinc-700">Active Tax Slabs</h3>
                  {settings?.taxSlabs?.length === 0 && <p className="text-sm text-zinc-500">No tax slabs configured.</p>}
                  <div className="flex flex-wrap gap-3">
                    {settings?.taxSlabs?.map((slab, i) => (
                      <div key={i} className="flex items-center gap-2 bg-zinc-100 text-zinc-800 px-3 py-1.5 rounded-lg border border-zinc-200">
                        <span className="font-semibold">{slab}% GST</span>
                        <button onClick={() => handleRemoveTaxSlab(slab)} className="text-zinc-400 hover:text-red-500 transition-colors">
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

