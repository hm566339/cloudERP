import React, { useState } from 'react';
import { X, AlertTriangle, Key, Copy, CheckCircle2 } from 'lucide-react';
import { rotateModuleSecret } from '../../../api/sso/module';
import { useAppDispatch } from '../../../app/hooks';
import { addAlert } from '../../notifications/notificationSlice';
import { copyToClipboard } from '../../../utils/clipboard';

export default function RotateSecretDialog({ isOpen, onClose, moduleData }) {
  const dispatch = useAppDispatch();
  const [isLoading, setIsLoading] = useState(false);
  const [newCredentials, setNewCredentials] = useState(null);

  if (!isOpen || !moduleData) return null;

  const handleRotate = async () => {
    setIsLoading(true);
    try {
      const result = await rotateModuleSecret(moduleData.id);
      setNewCredentials(result);
      dispatch(addAlert({ type: 'success', message: 'Secret rotated successfully' }));
    } catch (error) {
      dispatch(addAlert({ type: 'error', message: error?.response?.data?.message || 'Failed to rotate secret' }));
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = async (text, label) => {
    try {
      await copyToClipboard(text);
      dispatch(addAlert({ type: 'success', message: `${label} copied to clipboard` }));
    } catch (error) {
      dispatch(addAlert({ type: 'error', message: `Failed to copy ${label}` }));
    }
  };

  const handleClose = () => {
    setNewCredentials(null);
    onClose(!!newCredentials);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/40 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-scale-up">
        
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-zinc-100">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${newCredentials ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
              {newCredentials ? <CheckCircle2 size={20} /> : <AlertTriangle size={20} />}
            </div>
            <div>
              <h2 className="text-lg font-bold text-zinc-900">
                {newCredentials ? 'Credentials Rotated' : 'Rotate Client Secret'}
              </h2>
            </div>
          </div>
          {!newCredentials && (
            <button onClick={handleClose} className="p-2 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 rounded-lg transition-colors">
              <X size={20} />
            </button>
          )}
        </div>

        {/* Content */}
        <div className="p-6">
          {!newCredentials ? (
            <div className="space-y-4">
              <p className="text-sm text-zinc-600 leading-relaxed">
                You are about to rotate the Client Secret for the module <strong>"{moduleData.name}"</strong>.
              </p>
              <div className="p-4 bg-rose-50 border border-rose-100 rounded-xl">
                <h4 className="text-sm font-bold text-rose-800 flex items-center gap-2 mb-2">
                  <AlertTriangle size={16} /> Warning: Breaking Change
                </h4>
                <p className="text-xs text-rose-700 leading-relaxed">
                  Rotating the secret will immediately invalidate the existing secret. The application using this module will lose connection until it is updated with the new credentials.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4 animate-fade-in">
              <p className="text-sm text-zinc-600 mb-4">
                The secret has been successfully rotated. Please update your application with these new credentials.
              </p>
              
              <div className="p-4 bg-zinc-50 rounded-xl border border-zinc-200/60 space-y-4">
                <div>
                  <label className="text-[8px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">Client ID</label>
                  <div className="flex items-center justify-between gap-3">
                    <code className="text-sm font-mono font-semibold text-zinc-700 truncate">
                      {newCredentials.clientId}
                    </code>
                    <button onClick={() => handleCopy(newCredentials.clientId, 'Client ID')} className="p-1.5 text-zinc-400 hover:text-zinc-700 bg-white shadow-sm border border-zinc-200 rounded-md transition-colors shrink-0">
                      <Copy size={14} />
                    </button>
                  </div>
                </div>
                <div>
                  <label className="text-[8px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">New Client Secret</label>
                  <div className="flex items-center justify-between gap-3">
                    <code className="text-sm font-mono font-semibold text-zinc-700 truncate">
                      {newCredentials.clientSecret}
                    </code>
                    <button onClick={() => handleCopy(newCredentials.clientSecret, 'Client Secret')} className="p-1.5 text-zinc-400 hover:text-zinc-700 bg-white shadow-sm border border-zinc-200 rounded-md transition-colors shrink-0">
                      <Copy size={14} />
                    </button>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-amber-50 border border-amber-100 rounded-lg">
                <p className="text-xs font-medium text-amber-800 flex items-center gap-2">
                  <Key size={14} className="shrink-0" />
                  Save these credentials now. You will not be able to see the secret again.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-zinc-100 bg-zinc-50/50 flex justify-end gap-3">
          {!newCredentials ? (
            <>
              <button onClick={handleClose} disabled={isLoading} className="btn-secondary">
                Cancel
              </button>
              <button onClick={handleRotate} disabled={isLoading} className="btn-primary bg-rose-600 hover:bg-rose-700 border-rose-600 hover:border-rose-700 shadow-sm shadow-rose-200">
                {isLoading ? 'Rotating...' : 'Yes, Rotate Secret'}
              </button>
            </>
          ) : (
            <button onClick={handleClose} className="btn-primary w-full justify-center">
              I have saved the credentials
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
