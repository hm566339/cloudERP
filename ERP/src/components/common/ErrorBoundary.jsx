import React from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';
import { createLogger } from '../../utils/logger';

const logger = createLogger('ERROR_BOUNDARY');

/**
 * Error Boundary component
 * Catches React errors and displays a user-friendly error page
 * Prevents entire app from crashing due to component errors
 */
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorCount: 0,
    };
  }

  static getDerivedStateFromError(error) {
    const errorMsg = error?.message || error?.toString() || '';
    const isChunkLoadError = /Failed to fetch dynamically imported module|Importing a module script failed/i.test(errorMsg);
    
    return { 
      hasError: true,
      isChunkLoadError 
    };
  }

  componentDidCatch(error, errorInfo) {
    const errorMsg = error?.message || error?.toString() || '';
    const isChunkLoadError = /Failed to fetch dynamically imported module|Importing a module script failed/i.test(errorMsg);

    if (isChunkLoadError) {
      const hasReloaded = sessionStorage.getItem('chunk_reload_timestamp');
      const now = Date.now();
      
      // If we haven't reloaded in the last 10 seconds for this error
      if (!hasReloaded || (now - parseInt(hasReloaded)) > 10000) {
        sessionStorage.setItem('chunk_reload_timestamp', now.toString());
        logger.info('Chunk load error detected. Automatically reloading page to fetch new assets...');
        window.location.reload();
        return;
      }
    }

    logger.error('React Error Boundary caught error', {
      error: error.toString(),
      componentStack: errorInfo.componentStack,
    });

    this.setState((prevState) => ({
      error,
      errorInfo,
      errorCount: prevState.errorCount + 1,
    }));
  }

  handleReset = () => {
    logger.info('Error Boundary reset, attempting recovery');
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
    // Optionally reload page for complete recovery
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      const isDevelopment = import.meta.env.DEV;
      const isRecurring = this.state.errorCount > 3;

      if (this.state.isChunkLoadError && !isRecurring) {
        return (
          <div className="min-h-screen bg-zinc-50 flex flex-col items-center justify-center p-4">
             <div className="w-8 h-8 border-2 border-zinc-300 border-t-zinc-700 rounded-full animate-spin mb-4"></div>
             <p className="text-zinc-600 font-medium">Updating application...</p>
             <p className="text-zinc-400 text-sm mt-1">Fetching the latest version</p>
          </div>
        );
      }

      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <div className="w-full max-w-md">
            {/* Error Icon */}
            <div className="mb-6 flex justify-center">
              <div className="p-4 bg-red-50 rounded-full">
                <AlertTriangle size={32} className="text-red-600" />
              </div>
            </div>

            {/* Error Message */}
            <div className="text-center mb-6">
              <h1 className="text-2xl font-bold text-foreground mb-2">
                Something Went Wrong
              </h1>
              <p className="text-muted-foreground mb-4">
                {isRecurring
                  ? 'We&apos;re experiencing recurring issues. Please try refreshing the page.'
                  : 'An unexpected error occurred. Please try refreshing the page or contact support if the problem persists.'}
              </p>

              {/* Development Error Details */}
              {isDevelopment && this.state.error && (
                <div className="mt-4 p-4 bg-red-50 rounded-lg text-left">
                  <p className="text-xs font-mono text-red-600 mb-2">
                    <strong>Error:</strong>
                  </p>
                  <p className="text-xs font-mono text-red-600 mb-4 break-all">
                    {this.state.error.toString()}
                  </p>

                  {this.state.errorInfo && (
                    <>
                      <p className="text-xs font-mono text-red-600 mb-2">
                        <strong>Component Stack:</strong>
                      </p>
                      <pre className="text-xs font-mono text-red-600 bg-white p-2 rounded overflow-auto max-h-40">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={this.handleReset}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
              >
                <RotateCcw size={18} />
                Refresh Page
              </button>
              <button
                onClick={() => (window.location.href = '/')}
                className="flex-1 px-4 py-2 border border-input rounded-lg hover:bg-accent transition-colors font-medium text-foreground"
              >
                Go Home
              </button>
            </div>

            {/* Error Count */}
            {isRecurring && (
              <div className="mt-4 p-3 bg-warning/10 border border-warning rounded-lg text-center">
                <p className="text-xs text-warning-foreground">
                  Error occurred {this.state.errorCount} times
                </p>
              </div>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
