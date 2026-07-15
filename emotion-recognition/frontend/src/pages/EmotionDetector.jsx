/**
 * src/pages/EmotionDetector.jsx
 * ──────────────────────────────
 * Webcam-based live emotion detection.
 * Captures a frame every 2 seconds, sends to backend, displays result.
 */

import React, { useRef, useState, useEffect, useCallback } from 'react';
import Webcam from 'react-webcam';
import api from '../utils/api';
import { getEmotionMeta } from '../utils/emotionUtils';
import Navbar from '../components/Navbar';
import toast from 'react-hot-toast';

const CAPTURE_INTERVAL_MS = 2000;

export default function EmotionDetector() {
  const webcamRef = useRef(null);
  const intervalRef = useRef(null);

  const [isRunning,  setIsRunning]  = useState(false);
  const [sessionId,  setSessionId]  = useState(null);
  const [result,     setResult]     = useState(null);   // latest detection
  const [history,    setHistory]    = useState([]);     // this-session history
  const [frameCount, setFrameCount] = useState(0);
  const [camReady,   setCamReady]   = useState(false);
  const [error,      setError]      = useState(null);

  /* ── Start / stop session ── */
  const startSession = useCallback(async () => {
    try {
      const res = await api.post('/emotion/session/start');
      setSessionId(res.data.session_id);
      setHistory([]);
      setFrameCount(0);
      setResult(null);
      setIsRunning(true);
      toast.success('Detection started!');
    } catch (e) {
      toast.error('Could not start session');
    }
  }, []);

  const stopSession = useCallback(async () => {
    setIsRunning(false);
    clearInterval(intervalRef.current);
    if (sessionId) {
      try {
        await api.post(`/emotion/session/${sessionId}/end`);
        toast.success('Session saved to your history');
      } catch {}
      setSessionId(null);
    }
  }, [sessionId]);

  /* ── Capture & detect loop ── */
  const capture = useCallback(async () => {
    if (!webcamRef.current || !sessionId) return;
    const screenshot = webcamRef.current.getScreenshot();
    if (!screenshot) return;

    setFrameCount(c => c + 1);

    try {
      const res = await api.post('/emotion/detect', {
        image:      screenshot,
        session_id: sessionId
      });
      const data = res.data;
      if (data.status === 'detected') {
        setResult(data);
        setHistory(prev => [data, ...prev].slice(0, 20));
      } else {
        setResult({ status: 'no_face' });
      }
    } catch (e) {
      console.error('Detection error:', e);
    }
  }, [sessionId]);

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(capture, CAPTURE_INTERVAL_MS);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [isRunning, capture]);

  /* ── Cleanup on unmount ── */
  useEffect(() => () => {
    clearInterval(intervalRef.current);
    if (sessionId) api.post(`/emotion/session/${sessionId}/end`).catch(() => {});
  }, [sessionId]);

  const meta = result?.emotion ? getEmotionMeta(result.emotion) : null;

  return (
    <div style={styles.page}>
      <Navbar />
      <div style={styles.container}>

        <h1 style={styles.pageTitle}>🎥 Live Emotion Detector</h1>
        <p style={styles.pageSub}>
          Position your face in the webcam. Detection runs every {CAPTURE_INTERVAL_MS / 1000}s.
        </p>

        <div style={styles.layout}>
          {/* ── Left: webcam + controls ── */}
          <div style={styles.camCol}>
            <div style={{
              ...styles.camBox,
              borderColor: isRunning ? (meta?.color || '#6C63FF') : 'rgba(255,255,255,0.1)',
              boxShadow: isRunning ? `0 0 40px ${meta?.color || '#6C63FF'}44` : 'none',
            }}>
              {error ? (
                <div style={styles.camError}>
                  <span style={{ fontSize: 40 }}>📷</span>
                  <p>{error}</p>
                </div>
              ) : (
                <Webcam
                  ref={webcamRef}
                  screenshotFormat="image/jpeg"
                  screenshotQuality={0.85}
                  videoConstraints={{ width: 640, height: 480, facingMode: 'user' }}
                  onUserMedia={() => setCamReady(true)}
                  onUserMediaError={e => setError('Camera access denied. Please allow camera permission.')}
                  style={styles.webcam}
                  mirrored
                />
              )}

              {/* Overlay badge */}
              {isRunning && result?.status === 'detected' && meta && (
                <div style={{ ...styles.overlayBadge, background: meta.color + 'EE' }}>
                  {meta.emoji} {result.emotion}
                  <span style={styles.confLabel}>{result.confidence?.toFixed(1)}%</span>
                </div>
              )}
              {isRunning && result?.status === 'no_face' && (
                <div style={{ ...styles.overlayBadge, background: 'rgba(0,0,0,0.8)' }}>
                  👤 No face detected
                </div>
              )}

              {/* Scanning animation */}
              {isRunning && <div style={styles.scanLine} />}
            </div>

            {/* Controls */}
            <div style={styles.controls}>
              {!isRunning ? (
                <button
                  onClick={startSession}
                  disabled={!camReady}
                  style={{ ...styles.btn, background: 'linear-gradient(135deg,#6C63FF,#00D2FF)', opacity: camReady ? 1 : 0.5 }}
                >
                  ▶ Start Detection
                </button>
              ) : (
                <button onClick={stopSession}
                  style={{ ...styles.btn, background: 'linear-gradient(135deg,#EF5350,#FF9800)' }}>
                  ⏹ Stop & Save
                </button>
              )}
            </div>

            {/* Frame counter */}
            <div style={styles.counters}>
              <div style={styles.counter}>
                <span style={styles.counterVal}>{frameCount}</span>
                <span style={styles.counterLabel}>Frames</span>
              </div>
              <div style={styles.counter}>
                <span style={styles.counterVal}>{history.length}</span>
                <span style={styles.counterLabel}>Detections</span>
              </div>
              <div style={styles.counter}>
                <span style={{ ...styles.counterVal, color: isRunning ? '#66BB6A' : '#EF5350' }}>
                  {isRunning ? '● LIVE' : '○ IDLE'}
                </span>
                <span style={styles.counterLabel}>Status</span>
              </div>
            </div>
          </div>

          {/* ── Right: result panel + scores + history ── */}
          <div style={styles.resultCol}>

            {/* Current result card */}
            <div style={{
              ...styles.resultCard,
              background: meta ? `linear-gradient(135deg, ${meta.color}22, rgba(255,255,255,0.04))` : 'rgba(255,255,255,0.04)',
              borderColor: meta?.color || 'rgba(255,255,255,0.1)',
            }}>
              {meta ? (
                <>
                  <div style={{ fontSize: 72 }}>{meta.emoji}</div>
                  <div style={{ fontSize: 28, fontWeight: 800, color: meta.color }}>{result.emotion}</div>
                  <div style={{ fontSize: 14, color: '#aaa' }}>
                    Confidence: <strong style={{ color: '#fff' }}>{result.confidence?.toFixed(1)}%</strong>
                  </div>
                </>
              ) : (
                <>
                  <div style={{ fontSize: 56 }}>🎭</div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: '#888' }}>
                    {isRunning ? 'Detecting…' : 'Start to detect'}
                  </div>
                  <div style={{ fontSize: 13, color: '#555', marginTop: 6 }}>
                    {isRunning ? 'Looking for a face…' : 'Press ▶ Start Detection'}
                  </div>
                </>
              )}
            </div>

            {/* Probability bars */}
            {result?.all_scores && (
              <div style={styles.scoresCard}>
                <h4 style={styles.scoresTitle}>All Emotion Scores</h4>
                {Object.entries(result.all_scores)
                  .sort((a, b) => b[1] - a[1])
                  .map(([emotion, score]) => {
                    const m = getEmotionMeta(emotion);
                    return (
                      <div key={emotion} style={styles.scoreRow}>
                        <span style={styles.scoreLabel}>{m.emoji} {emotion}</span>
                        <div style={styles.scoreBarBg}>
                          <div style={{
                            ...styles.scoreBarFill,
                            width: `${score}%`,
                            background: m.color,
                          }} />
                        </div>
                        <span style={styles.scoreVal}>{score.toFixed(1)}%</span>
                      </div>
                    );
                  })}
              </div>
            )}

            {/* Session history */}
            {history.length > 0 && (
              <div style={styles.sessionHistory}>
                <h4 style={styles.scoresTitle}>This Session</h4>
                <div style={styles.historyList}>
                  {history.slice(0, 8).map((h, i) => {
                    const m = getEmotionMeta(h.emotion);
                    return (
                      <div key={i} style={styles.histItem}>
                        <span style={{ ...styles.histBadge, background: m.color + '33', color: m.color }}>
                          {m.emoji} {h.emotion}
                        </span>
                        <span style={{ fontSize: 12, color: '#555' }}>{h.confidence?.toFixed(1)}%</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  page:      { minHeight: '100vh', background: '#0D0D1A', fontFamily: "'Segoe UI', sans-serif" },
  container: { maxWidth: 1300, margin: '0 auto', padding: '32px 24px' },
  pageTitle: { color: '#fff', fontSize: 28, fontWeight: 800, margin: 0 },
  pageSub:   { color: '#666', fontSize: 14, margin: '8px 0 32px' },

  layout:  { display: 'grid', gridTemplateColumns: '1fr 380px', gap: 32, alignItems: 'start' },
  camCol:  { display: 'flex', flexDirection: 'column', gap: 20 },
  resultCol: { display: 'flex', flexDirection: 'column', gap: 20 },

  camBox: {
    position: 'relative', borderRadius: 20, overflow: 'hidden',
    border: '2px solid', transition: 'border-color 0.5s, box-shadow 0.5s',
    background: '#111', aspectRatio: '4/3',
  },
  webcam:    { width: '100%', height: '100%', objectFit: 'cover', display: 'block' },
  camError:  {
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    justifyContent: 'center', height: '100%', color: '#888', gap: 12, padding: 32,
    textAlign: 'center',
  },
  overlayBadge: {
    position: 'absolute', bottom: 16, left: '50%', transform: 'translateX(-50%)',
    padding: '8px 24px', borderRadius: 40, color: '#fff', fontWeight: 700,
    fontSize: 18, display: 'flex', alignItems: 'center', gap: 10,
    backdropFilter: 'blur(8px)', whiteSpace: 'nowrap',
  },
  confLabel: { fontSize: 13, opacity: 0.85 },
  scanLine: {
    position: 'absolute', top: 0, left: 0, right: 0, height: 3,
    background: 'linear-gradient(90deg, transparent, #6C63FF, transparent)',
    animation: 'scanDown 2s linear infinite',
  },

  controls:   { display: 'flex', gap: 12 },
  btn: {
    flex: 1, padding: '16px', border: 'none', borderRadius: 14,
    color: '#fff', fontSize: 16, fontWeight: 700, cursor: 'pointer',
    letterSpacing: 0.3,
  },

  counters: { display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 },
  counter:  {
    background: 'rgba(255,255,255,0.05)', borderRadius: 14,
    padding: '16px 12px', textAlign: 'center',
    border: '1px solid rgba(255,255,255,0.06)',
  },
  counterVal:   { display: 'block', fontSize: 22, fontWeight: 800, color: '#fff' },
  counterLabel: { display: 'block', fontSize: 11, color: '#555', marginTop: 4 },

  resultCard: {
    borderRadius: 20, padding: '36px 28px', textAlign: 'center',
    border: '1px solid', display: 'flex', flexDirection: 'column',
    alignItems: 'center', gap: 10, color: '#fff',
    transition: 'all 0.5s ease',
  },

  scoresCard: {
    background: 'rgba(255,255,255,0.04)', borderRadius: 16, padding: '20px 18px',
    border: '1px solid rgba(255,255,255,0.07)',
  },
  scoresTitle: { margin: '0 0 16px', color: '#fff', fontSize: 14, fontWeight: 700 },
  scoreRow:    { display: 'grid', gridTemplateColumns: '90px 1fr 46px', alignItems: 'center', gap: 10, marginBottom: 10 },
  scoreLabel:  { fontSize: 12, color: '#ccc', whiteSpace: 'nowrap' },
  scoreBarBg:  { height: 8, background: 'rgba(255,255,255,0.07)', borderRadius: 4, overflow: 'hidden' },
  scoreBarFill:{ height: '100%', borderRadius: 4, transition: 'width 0.4s ease' },
  scoreVal:    { fontSize: 11, color: '#888', textAlign: 'right' },

  sessionHistory: {
    background: 'rgba(255,255,255,0.04)', borderRadius: 16, padding: '20px 18px',
    border: '1px solid rgba(255,255,255,0.07)',
  },
  historyList: { display: 'flex', flexDirection: 'column', gap: 8 },
  histItem:    { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  histBadge:   { padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600 },
};
