import React, { useEffect } from 'react';

export function Dialog({ open, onOpenChange, children }) {
  useEffect(() => {
    function onKeyDown(e) {
      if (e.key === 'Escape' && open) onOpenChange(false);
    }
    if (open) document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open, onOpenChange]);

  if (!open) return null;
  return (
    <div style={{ position: 'fixed', zIndex: 1000, top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => onOpenChange(false)}>
      <div style={{ background: 'white', borderRadius: 8, minWidth: 320, maxWidth: 480, width: '100%', boxShadow: '0 2px 16px rgba(0,0,0,0.2)', padding: 24, position: 'relative' }} onClick={e => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}

export function DialogContent({ children }) {
  return <div>{children}</div>;
}

export function DialogTitle({ children }) {
  return <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 8 }}>{children}</h2>;
}

export function DialogDescription({ children }) {
  return <div style={{ color: '#555', marginBottom: 16 }}>{children}</div>;
}

export function DialogFooter({ children }) {
  return <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>{children}</div>;
} 