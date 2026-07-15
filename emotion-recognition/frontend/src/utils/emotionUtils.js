/**
 * src/utils/emotionUtils.js
 * ──────────────────────────
 * Emoji, color, and label mappings for emotion categories.
 */

export const EMOTION_META = {
  Happy:    { emoji: '😄', color: '#FFD700', bg: '#FFF9E6', label: 'Happy'    },
  Sad:      { emoji: '😢', color: '#4FC3F7', bg: '#E8F5FF', label: 'Sad'      },
  Angry:    { emoji: '😠', color: '#EF5350', bg: '#FEECEC', label: 'Angry'    },
  Fear:     { emoji: '😨', color: '#AB47BC', bg: '#F5EDFF', label: 'Fear'     },
  Surprise: { emoji: '😲', color: '#FF9800', bg: '#FFF3E0', label: 'Surprise' },
  Neutral:  { emoji: '😐', color: '#78909C', bg: '#F0F4F7', label: 'Neutral'  },
  Disgust:  { emoji: '🤢', color: '#66BB6A', bg: '#EDFAEE', label: 'Disgust'  },
  Calm:     { emoji: '😌', color: '#26C6DA', bg: '#E0FAFA', label: 'Calm'     },
};

export const getEmotionMeta = (emotion) =>
  EMOTION_META[emotion] || { emoji: '🙂', color: '#90A4AE', bg: '#F5F5F5', label: emotion };

export const ALL_EMOTIONS = Object.keys(EMOTION_META);

export const CHART_COLORS = ALL_EMOTIONS.map(e => EMOTION_META[e].color);
