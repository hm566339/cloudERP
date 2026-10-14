import React, { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle2, RefreshCw } from 'lucide-react';
import { checkBackendHealth, clearHealthCheckCache } from '../../services/apiService';
import { createLogger } from '../../utils/logger';

const logger = createLogger('BACKEND_STATUS');

/**
 * BackendStatusIndicator component
 * Displays backend health status in the header
 * Shows visual indicator: green (healthy), red (unhealthy), spinning (checking)
 */
export default function BackendStatusIndicator() {
  const [status, setStatus] = useState('checking'); // 'checking' | 'healthy' | 'unhealthy'
  const [showTooltip, setShowTooltip] = useState(false);

  // Check backend health on mount and periodically
  useEffect(() => {
    const checkHealth = async () => {
      try {
        const isHealthy = await checkBackendHealth();
        setStatus(isHealthy ? 'healthy' : 'unhealthy');
      } catch (error) {
        logger.error('Health check error', { message: error.message });
        setStatus('unhealthy');
      }
    };

    checkHealth();

    // Check every 30 seconds
    const interval = setInterval(checkHealth, 30000);

    return () => clearInterval(interval);
  }, []);

  const handleRetry = async (e) => {
    e.preventDefault();
    setStatus('checking');
    clearHealthCheckCache();

    try {
      const isHealthy = await checkBackendHealth();
      setStatus(isHealthy ? 'healthy' : 'unhealthy');
      logger.info('Manual health check completed', { status: isHealthy ? 'healthy' : 'unhealthy' });
    } catch (error) {
      logger.error('Manual health check failed', { message: error.message });
      setStatus('unhealthy');
    }
  };

  const getIndicatorStyle = () => {
    switch (status) {
      case 'healthy':
        return {
          icon: <CheckCircle2 size={16} className="text-green-500" />,
          text: 'Backend Online',
          textColor: 'text-green-600',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
        };
      case 'unhealthy':
        return {
          icon: <AlertCircle size={16} className="text-red-500" />,
          text: 'Backend Offline',
          textColor: 'text-red-600',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
        };
      case 'checking':
      default:
        return {
          icon: <RefreshCw size={16} className="text-blue-500 animate-spin" />,
          text: 'Checking...',
          textColor: 'text-blue-600',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
        };
    }
  };

  const style = getIndicatorStyle();

  return (
    <div className="relative">
      <button
        className={`hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-colors ${style.bgColor} ${style.borderColor} hover:opacity-75`}
        onClick={handleRetry}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        disabled={status === 'checking'}
        title={style.text}
      >
        {style.icon}
        <span className={`text-xs font-medium ${style.textColor}`}>{style.text}</span>
      </button>

      {showTooltip && (
        <div className="absolute top-full mt-2 right-0 bg-zinc-900 text-white text-xs rounded-lg px-3 py-2 whitespace-nowrap z-50">
          {status === 'checking' && 'Checking backend health...'}
          {status === 'healthy' && 'Backend is responding normally'}
          {status === 'unhealthy' && 'Click to retry connection'}
        </div>
      )}
    </div>
  );
}
