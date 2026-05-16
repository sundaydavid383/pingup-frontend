const NotificationSkeleton = () => {
  return (
    <>
      <style>{`
        @keyframes gn-shimmer {
          0%   { background-position: -400px 0; }
          100% { background-position:  400px 0; }
        }
        .gn-sk {
          background: linear-gradient(90deg, #f1f3f4 25%, #e8eaed 50%, #f1f3f4 75%);
          background-size: 800px 100%;
          animation: gn-shimmer 1.4s ease-in-out infinite;
          border-radius: 6px;
        }
      `}</style>

      <div style={{
        background: '#fff',
        borderRadius: 16,
        boxShadow: '0 1px 3px rgba(0,0,0,.12)',
        overflow: 'hidden',
        fontFamily: "'Google Sans Text', sans-serif",
      }}>
        {/* fake header */}
        <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid #f1f3f4', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div className="gn-sk" style={{ width: 140, height: 22 }} />
          <div className="gn-sk" style={{ width: 100, height: 32, borderRadius: 20 }} />
        </div>

        {/* fake tabs */}
        <div style={{ display: 'flex', gap: 0, padding: '0 24px', borderBottom: '1px solid #e8eaed' }}>
          {[80, 90, 75, 65, 85, 90].map((w, i) => (
            <div key={i} style={{ padding: '16px 16px 14px' }}>
              <div className="gn-sk" style={{ width: w, height: 14 }} />
            </div>
          ))}
        </div>

        {/* fake items */}
        <div style={{ padding: '8px 0' }}>
          {[1, 2, 3, 4].map((_, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'flex-start', gap: 14,
              padding: '14px 24px',
              borderLeft: i === 0 ? '3px solid #1a73e8' : '3px solid transparent',
              background: i === 0 ? '#e8f0fe22' : 'transparent',
            }}>
              <div className="gn-sk" style={{ width: 40, height: 40, borderRadius: '50%', flexShrink: 0 }} />
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div className="gn-sk" style={{ width: '72%', height: 14 }} />
                <div className="gn-sk" style={{ width: '40%', height: 12 }} />
              </div>
              {i === 0 && <div className="gn-sk" style={{ width: 8, height: 8, borderRadius: '50%', marginTop: 6 }} />}
            </div>
          ))}
        </div>
      </div>
    </>
  );
};

export default NotificationSkeleton;