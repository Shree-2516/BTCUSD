import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

const ExportCenterPage = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const selectedObj = reports.find(r => r.id == selectedReport);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const res = await fetch('/api/reports');
        const data = await res.json();
        setReports(data);
        if (data.length > 0) setSelectedReport(data[0].id);
      } catch (err) {
        console.error(err);
        toast.error('Failed to load reports');
      } finally {
        setLoading(false);
      }
    };
    fetchReports();
  }, []);

  const handleDownload = (format) => {
    if (!selectedReport) return toast.error('Please select a report first');
    // Using standard browser navigation to trigger a backend attachment download
    window.open(`/api/reports/${selectedReport}/export/${format}`, '_blank');
    toast.success(`Downloading ${format.toUpperCase()}...`);
  };

  const handlePrintPDF = () => {
    if (!selectedReport) return toast.error('Please select a report first');
    toast.success('Preparing Print Layout...');
    // A production app might open a specialized route for the print view.
    // For this prototype, we'll open the performance analytics page with a ?print=true param
    window.open(`/products/analytics/performance?id=${selectedReport}&print=true`, '_blank');
  };

  return (
    <div className="w-full text-slate-50">
      <div style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 'bold', margin: '0 0 8px 0' }}>Export Center</h2>
        <div style={{ color: '#94a3b8' }}>Download data arrays and format them as CSV, Excel, or structured PDFs.</div>
      </div>

      <div style={{
        backgroundColor: 'rgba(30, 41, 59, 0.4)',
        borderRadius: '16px',
        padding: '24px',
        border: '1px solid rgba(255, 255, 255, 0.05)',
        maxWidth: '800px'
      }}>
        <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '24px' }}>Export Generator</h3>
        
        {loading ? (
          <div className="text-gray-400">Loading reports...</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', color: '#cbd5e1' }}>Select Target Report</label>
              <div style={{ position: 'relative' }}>
                <div 
                  onClick={() => setIsOpen(!isOpen)}
                  style={{
                    width: '100%',
                    padding: '12px',
                    backgroundColor: 'rgba(15, 23, 42, 0.6)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px',
                    color: '#f8fafc',
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <span>{selectedObj ? `Report #${selectedObj.id} - ${selectedObj.strategy_name} (${selectedObj.created_at})` : '-- Select a Report --'}</span>
                  <span style={{ fontSize: '12px', color: '#94a3b8' }}>▼</span>
                </div>
                
                {isOpen && (
                  <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    marginTop: '4px',
                    backgroundColor: '#1e293b',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px',
                    maxHeight: '220px',
                    overflowY: 'auto',
                    zIndex: 50,
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.5)'
                  }}>
                    {reports.map(r => (
                      <div 
                        key={r.id}
                        onClick={() => { setSelectedReport(r.id); setIsOpen(false); }}
                        style={{
                          padding: '12px',
                          cursor: 'pointer',
                          borderBottom: '1px solid rgba(255,255,255,0.05)',
                          backgroundColor: selectedReport == r.id ? 'rgba(59, 130, 246, 0.2)' : 'transparent',
                          color: selectedReport == r.id ? '#60a5fa' : '#cbd5e1'
                        }}
                        onMouseEnter={(e) => {
                          if (selectedReport != r.id) e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)';
                        }}
                        onMouseLeave={(e) => {
                          if (selectedReport != r.id) e.currentTarget.style.backgroundColor = 'transparent';
                        }}
                      >
                        Report #{r.id} - {r.strategy_name} ({r.created_at})
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '8px', color: '#cbd5e1' }}>Export Formats</label>
              <div style={{ display: 'flex', gap: '16px' }}>
                <button 
                  onClick={() => handleDownload('csv')}
                  className="btn btn-secondary"
                  style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                  <span>📊</span> Download CSV
                </button>
                <button 
                  onClick={() => handleDownload('excel')}
                  className="btn btn-secondary"
                  style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                  <span>📈</span> Download Excel
                </button>
                <button 
                  onClick={handlePrintPDF}
                  className="btn btn-primary"
                  style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                  <span>📄</span> Generate PDF (Print)
                </button>
              </div>
            </div>
            
            <div style={{ marginTop: '16px', padding: '16px', backgroundColor: 'rgba(59, 130, 246, 0.1)', borderRadius: '8px', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
              <h4 style={{ color: '#60a5fa', fontWeight: 'bold', marginBottom: '8px' }}>ℹ️ Note on PDF Generation</h4>
              <p style={{ color: '#94a3b8', fontSize: '14px', lineHeight: '1.5' }}>
                The Generate PDF button opens a specialized print-friendly layout of the Analytics Studio. You can then use your browser's native "Save to PDF" functionality.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExportCenterPage;
