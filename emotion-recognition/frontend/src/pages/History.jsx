/**
 * src/pages/History.jsx
 * ──────────────────────
 * Full paginated history of all emotion detections with filter by emotion.
 */

import React, { useEffect, useState, useCallback } from 'react';
import api from '../utils/api';
import { getEmotionMeta, ALL_EMOTIONS } from '../utils/emotionUtils';
import Navbar from '../components/Navbar';

const PER_PAGE = 15;

export default function History() {
  const [records,  setRecords]  = useState([]);
  const [total,    setTotal]    = useState(0);
  const [page,     setPage]     = useState(1);
  const [emotion,  setEmotion]  = useState('');
  const [loading,  setLoading]  = useState(true);

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: PER_PAGE });
      if (emotion) params.set('emotion', emotion);
      const res = await api.get(`/emotion/history?${params}`);
      setRecords(res.data.records);
      setTotal(res.data.total);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [page, emotion]);

  useEffect(() => { fetchHistory(); }, [fetchHistory]);

  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));

  return (
    <div style={styles.page}>
      <Navbar />
      <div style={styles.container}>

        <div style={styles.header}>
          <div>
            <h1 style={styles.title}>Detection History</h1>
            <p style={styles.sub}>{total.toLocaleString()} total records</p>
          </div>

          {/* Emotion filter */}
          <div style={styles.filterWrap}>
            <label style={styles.filterLabel}>Filter by emotion:</label>
            <select
              value={emotion}
              onChange={e => { setEmotion(e.target.value); setPage(1); }}
              style={styles.select}
            >
              <option value="">All emotions</option>
              {ALL_EMOTIONS.map(e => (
                <option key={e} value={e}>{getEmotionMeta(e).emoji} {e}</option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <div style={styles.loadingWrap}>
            <div style={styles.spinner} />
          </div>
        ) : records.length === 0 ? (
          <div style={styles.empty}>
            <div style={{ fontSize: 64 }}>🔍</div>
            <p>No records found{emotion ? ` for "${emotion}"` : ''}.</p>
          </div>
        ) : (
          <>
            <div style={styles.tableWrap}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    {['#', 'Emotion', 'Confidence', 'All Scores', 'Date & Time'].map(h => (
                      <th key={h} style={styles.th}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {records.map((r, i) => {
                    const meta = getEmotionMeta(r.detected_emotion);
                    return (
                      <tr key={r.id} style={styles.tr}>
                        <td style={{ ...styles.td, color: '#555', fontSize: 12 }}>
                          {(page - 1) * PER_PAGE + i + 1}
                        </td>
                        <td style={styles.td}>
                          <span style={{ ...styles.badge, background: meta.color + '22', color: meta.color }}>
                            {meta.emoji} {r.detected_emotion}
                          </span>
                        </td>
                        <td style={styles.td}>
                          <ConfidenceBar value={r.confidence_score} color={meta.color} />
                        </td>
                        <td style={styles.td}>
                          <MiniScores scores={r.all_scores} />
                        </td>
                        <td style={{ ...styles.td, color: '#777', fontSize: 13 }}>
                          {new Date(r.detected_at).toLocaleString()}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div style={styles.pagination}>
              <button onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1} style={styles.pageBtn}>← Prev</button>
              <span style={styles.pageInfo}>
                Page {page} of {totalPages}
              </span>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages} style={styles.pageBtn}>Next →</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

const ConfidenceBar = ({ value, color }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
    <div style={{ width: 80, height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 3, overflow: 'hidden' }}>
      <div style={{ width: `${value}%`, height: '100%', background: color, borderRadius: 3 }} />
    </div>
    <span style={{ fontSize: 12, color: '#aaa' }}>{value}%</span>
  </div>
);

const MiniScores = ({ scores }) => {
  if (!scores) return <span style={{ color: '#555', fontSize: 12 }}>—</span>;
  const top3 = Object.entries(scores).sort((a, b) => b[1] - a[1]).slice(0, 3);
  return (
    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
      {top3.map(([e, s]) => {
        const m = getEmotionMeta(e);
        return (
          <span key={e} style={{ fontSize: 10, color: m.color, background: m.color + '18', padding: '2px 6px', borderRadius: 10 }}>
            {m.emoji} {s.toFixed(0)}%
          </span>
        );
      })}
    </div>
  );
};

const styles = {
  page:      { minHeight: '100vh', background: '#0D0D1A', fontFamily: "'Segoe UI', sans-serif" },
  container: { maxWidth: 1100, margin: '0 auto', padding: '32px 24px' },
  header:    { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 28, flexWrap: 'wrap', gap: 16 },
  title:     { margin: 0, fontSize: 26, fontWeight: 800, color: '#fff' },
  sub:       { margin: '6px 0 0', color: '#666', fontSize: 14 },
  filterWrap:{ display: 'flex', alignItems: 'center', gap: 12 },
  filterLabel: { color: '#888', fontSize: 13 },
  select: {
    background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: 10, padding: '9px 14px', color: '#fff', fontSize: 14, cursor: 'pointer', outline: 'none',
  },
  tableWrap: { overflowX: 'auto', borderRadius: 18, border: '1px solid rgba(255,255,255,0.07)' },
  table:     { width: '100%', borderCollapse: 'collapse', minWidth: 700 },
  th:        { color: '#555', fontSize: 12, fontWeight: 600, padding: '14px 16px', textAlign: 'left', background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.07)' },
  tr:        { borderBottom: '1px solid rgba(255,255,255,0.04)', transition: 'background 0.15s' },
  td:        { padding: '14px 16px', color: '#ddd', fontSize: 14 },
  badge:     { padding: '4px 12px', borderRadius: 20, fontSize: 13, fontWeight: 600 },
  pagination:{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 24, marginTop: 28 },
  pageBtn: {
    background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 10, padding: '9px 20px', color: '#ccc', cursor: 'pointer', fontSize: 14,
  },
  pageInfo:  { color: '#888', fontSize: 14 },
  loadingWrap: { display: 'flex', justifyContent: 'center', padding: '80px 0' },
  spinner: {
    width: 40, height: 40, borderRadius: '50%',
    border: '3px solid rgba(108,99,255,0.2)', borderTop: '3px solid #6C63FF',
    animation: 'spin 0.8s linear infinite',
  },
  empty: { textAlign: 'center', color: '#555', padding: '80px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 },
};
