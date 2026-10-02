import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// Prevent mouse wheel from changing number inputs globally
document.addEventListener('wheel', function(event) {
  if (document.activeElement.type === 'number') {
    document.activeElement.blur();
  }
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <>
    <App />
  </>
)
