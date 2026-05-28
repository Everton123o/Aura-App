// src/features/workout/views/RestTimerScreen.tsx
import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  TextInput, Platform, Animated, Easing,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../../navigation/AppNavigator';

// ─── Types ────────────────────────────────────────────────────────────────────
type NavProp    = NativeStackNavigationProp<RootStackParamList>;
type RouteProp_ = RouteProp<RootStackParamList, 'RestTimer'>;

const PRESETS = [
  { label: '30s',    value: 30  },
  { label: '1 min',  value: 60  },
  { label: '90s',    value: 90  },
  { label: '2 min',  value: 120 },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

// ─── Screen ───────────────────────────────────────────────────────────────────
export default function RestTimerScreen() {
  const navigation = useNavigation<NavProp>();
  const route      = useRoute<RouteProp_>();
  const {
    workoutId,
    exerciseId,
    exerciseName,
    totalSets,
    currentSeries,
    defaultReps,
    defaultWeight,
    completedExerciseIds = [],
    sessionStartedAt,
  } = route.params;

  // Phase: 'choose' | 'countdown'
  const [phase,        setPhase]        = useState<'choose' | 'countdown'>('choose');
  const [selectedTime, setSelectedTime] = useState<number | null>(null);
  const [customInput,  setCustomInput]  = useState('');
  const [timeLeft,     setTimeLeft]     = useState(0);
  const [totalTime,    setTotalTime]    = useState(0);
  const [isPaused,     setIsPaused]     = useState(false);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pulseAnim = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(1)).current;
  const timeScaleAnim = useRef(new Animated.Value(1)).current;

  // Countdown lógic
  useEffect(() => {
    if (phase !== 'countdown') return;
    if (isPaused) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }
    intervalRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(intervalRef.current!);
          goNext();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [phase, isPaused]);

  useEffect(() => {
    if (phase !== 'countdown' || isPaused) {
      pulseAnim.stopAnimation();
      return;
    }

    pulseAnim.setValue(0);
    const loop = Animated.loop(
      Animated.timing(pulseAnim, {
        toValue: 1,
        duration: 1400,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    );

    loop.start();
    return () => loop.stop();
  }, [phase, isPaused, pulseAnim]);

  useEffect(() => {
    if (phase !== 'countdown') return;

    const nextProgress = totalTime > 0 ? Math.max(0, timeLeft / totalTime) : 1;

    Animated.timing(progressAnim, {
      toValue: nextProgress,
      duration: 260,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();

    Animated.sequence([
      Animated.timing(timeScaleAnim, {
        toValue: 1.04,
        duration: 90,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(timeScaleAnim, {
        toValue: 1,
        duration: 140,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start();
  }, [phase, timeLeft, totalTime, progressAnim, timeScaleAnim]);

  const goNext = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    const isLastSeries = currentSeries >= totalSets;
    if (isLastSeries) {
      // Todas as séries desse exercício → volta pra escolha
      const nextCompleted = Array.from(new Set([...completedExerciseIds, exerciseId]));
      navigation.replace('ChooseExercise', { workoutId, completedExerciseIds: nextCompleted, sessionStartedAt });
    } else {
      // Próxima série
      navigation.replace('ExecuteSeries', {
        workoutId,
        exerciseId,
        exerciseName,
        totalSets,
        currentSeries: currentSeries + 1,
        defaultReps,
        defaultWeight,
        completedExerciseIds,
        sessionStartedAt,
      });
    }
  };

  const startCountdown = (seconds: number) => {
    setTimeLeft(seconds);
    setTotalTime(seconds);
    progressAnim.setValue(1);
    setPhase('countdown');
    setIsPaused(false);
  };

  const handlePreset = (value: number) => {
    setSelectedTime(value);
    setCustomInput('');
  };

  const handleStart = () => {
    const custom = parseInt(customInput, 10);
    const time   = customInput.trim() ? (isNaN(custom) ? selectedTime : custom) : selectedTime;
    if (!time || time <= 0) return;
    startCountdown(time);
  };

  const adjustTime = (delta: number) => {
    setTimeLeft(prev => {
      const next = Math.max(0, prev + delta);
      setTotalTime(current => Math.max(current, next));
      return next;
    });
  };

  const progress = totalTime > 0 ? timeLeft / totalTime : 1;
  const pulseScale = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.45],
  });
  const pulseOpacity = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.34, 0],
  });
  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 240],
  });

  // ─── CHOOSE PHASE ───────────────────────────────────────────────────────────
  if (phase === 'choose') {
    const canStart = selectedTime !== null || (customInput.trim() !== '' && !isNaN(parseInt(customInput)));
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.chooseContent}>
          <Text style={styles.chooseTitle}>Deseja iniciar{'\n'}descanso?</Text>
          <Text style={styles.chooseSubtitle}>Escolha o tempo do cronômetro</Text>

          {/* Presets grid */}
          <View style={styles.presetsGrid}>
            {PRESETS.map(p => (
              <TouchableOpacity
                key={p.value}
                style={[styles.presetBtn, selectedTime === p.value && styles.presetBtnActive]}
                onPress={() => handlePreset(p.value)}
                activeOpacity={0.8}
              >
                <Text style={[styles.presetLabel, selectedTime === p.value && styles.presetLabelActive]}>
                  {p.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Custom input */}
          <Text style={styles.customLabel}>Tempo personalizado (segundos)</Text>
          <View style={[styles.customInputWrap, customInput && styles.customInputActive]}>
            <TextInput
              style={styles.customInput}
              placeholder="Ex: 75"
              placeholderTextColor="#B0B7C8"
              value={customInput}
              onChangeText={t => { setCustomInput(t.replace(/[^0-9]/g, '')); setSelectedTime(null); }}
              keyboardType="number-pad"
              maxLength={4}
            />
          </View>
        </View>

        {/* Footer buttons */}
        <View style={styles.chooseFooter}>
          <TouchableOpacity
            style={[styles.startBtn, !canStart && styles.startBtnDisabled]}
            onPress={handleStart}
            disabled={!canStart}
            activeOpacity={0.85}
          >
            <Text style={styles.startBtnText}>Iniciar descanso</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.skipBtn} onPress={goNext} activeOpacity={0.75}>
            <Text style={styles.skipBtnText}>Pular descanso</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ─── COUNTDOWN PHASE ────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={[styles.safe, styles.countdownSafe]} edges={['top', 'bottom']}>
      <View style={styles.countdownContent}>

        <Text style={styles.countdownState}>{isPaused ? 'Pausado' : 'Descanso'}</Text>

        <View style={styles.timerStage}>
          <Animated.View
            style={[
              styles.pulseRing,
              {
                opacity: pulseOpacity,
                transform: [{ scale: pulseScale }],
              },
            ]}
          />
          <View style={styles.ringWrap}>
            <View style={styles.ringGlow} />
            <Animated.Text style={[styles.countdownTime, { transform: [{ scale: timeScaleAnim }] }]}>
              {formatTime(timeLeft)}
            </Animated.Text>
            <Text style={styles.progressPercent}>{Math.round(progress * 100)}%</Text>
          </View>
        </View>

        <View style={styles.timerProgressTrack}>
          <Animated.View style={[styles.timerProgressFill, { width: progressWidth }]} />
        </View>

        {/* Controls */}
        <View style={styles.controls}>
          {/* -15 */}
          <TouchableOpacity style={styles.controlBtn} onPress={() => adjustTime(-15)}>
            <Text style={styles.controlIcon}>↺</Text>
            <Text style={styles.controlLabel}>-15</Text>
          </TouchableOpacity>

          {/* Pause / Play */}
          <TouchableOpacity
            style={styles.pauseBtn}
            onPress={() => setIsPaused(p => !p)}
            activeOpacity={0.8}
          >
            <Text style={styles.pauseIcon}>{isPaused ? '▶' : '⏸'}</Text>
          </TouchableOpacity>

          {/* +15 */}
          <TouchableOpacity style={styles.controlBtn} onPress={() => adjustTime(15)}>
            <Text style={styles.controlIcon}>↻</Text>
            <Text style={styles.controlLabel}>+15</Text>
          </TouchableOpacity>
        </View>

      </View>

      {/* Skip */}
      <View style={styles.countdownFooter}>
        <TouchableOpacity style={styles.skipCountdownBtn} onPress={goNext} activeOpacity={0.85}>
          <Text style={styles.skipCountdownText}>Pular descanso</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const PRIMARY = '#4A6CF7';
const BG      = '#F7F8FC';
const CARD    = '#FFFFFF';
const BORDER  = '#E2E6F0';
const TEXT    = '#1A1D2E';
const MUTED   = '#8891A8';

const styles = StyleSheet.create({
  safe:            { flex: 1, backgroundColor: BG },
  countdownSafe:   { backgroundColor: '#0D1117' },

  // ── CHOOSE ──
  chooseContent: { flex: 1, paddingHorizontal: 24, paddingTop: 40 },
  chooseTitle: {
    fontSize: 30, fontWeight: '800', color: TEXT,
    textAlign: 'center', letterSpacing: -0.6, marginBottom: 8,
  },
  chooseSubtitle: { fontSize: 14, color: MUTED, textAlign: 'center', marginBottom: 32 },

  presetsGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 12,
    justifyContent: 'center', marginBottom: 28,
  },
  presetBtn: {
    width: '44%', paddingVertical: 18, borderRadius: 14,
    backgroundColor: CARD, borderWidth: 1.5, borderColor: BORDER,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 4, elevation: 2,
  },
  presetBtnActive:    { backgroundColor: PRIMARY, borderColor: PRIMARY },
  presetLabel:        { fontSize: 16, fontWeight: '700', color: TEXT },
  presetLabelActive:  { color: '#fff' },

  customLabel:      { fontSize: 12, color: MUTED, fontWeight: '600', marginBottom: 8, letterSpacing: 0.4 },
  customInputWrap:  {
    borderWidth: 1.5, borderColor: BORDER, borderRadius: 12,
    backgroundColor: BG, paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'ios' ? 13 : 9,
  },
  customInputActive: { borderColor: PRIMARY, backgroundColor: '#EEF1FF' },
  customInput:       { fontSize: 16, color: TEXT, fontWeight: '600' },

  chooseFooter: {
    paddingHorizontal: 20, paddingTop: 12, paddingBottom: 8,
    borderTopWidth: 1, borderTopColor: BORDER, backgroundColor: CARD, gap: 10,
  },
  startBtn: {
    backgroundColor: PRIMARY, borderRadius: 14, paddingVertical: 15,
    alignItems: 'center',
    shadowColor: PRIMARY, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 5,
  },
  startBtnDisabled: { backgroundColor: '#B5C0F5', shadowOpacity: 0, elevation: 0 },
  startBtnText:     { fontSize: 15, fontWeight: '700', color: '#fff' },
  skipBtn:          { borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  skipBtnText:      { fontSize: 14, fontWeight: '600', color: MUTED },

  // ── COUNTDOWN ──
  countdownContent: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  countdownState: {
    fontSize: 13,
    fontWeight: '800',
    color: 'rgba(255,255,255,0.62)',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 22,
  },
  timerStage: {
    width: 220,
    height: 220,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  pulseRing: {
    position: 'absolute',
    width: 156,
    height: 156,
    borderRadius: 78,
    borderWidth: 2,
    borderColor: 'rgba(74,108,247,0.9)',
    backgroundColor: 'rgba(74,108,247,0.12)',
  },
  countdownTime: {
    fontSize: 54, fontWeight: '800', color: '#FFFFFF',
    letterSpacing: 1.5,
  },

  ringWrap: {
    width: 172, height: 172, borderRadius: 86,
    backgroundColor: 'rgba(74,108,247,0.14)',
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: PRIMARY,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.45,
    shadowRadius: 24,
    elevation: 8,
  },
  ringGlow: {
    position: 'absolute',
    inset: 0,
    borderRadius: 86,
    borderWidth: 10,
    borderColor: 'rgba(74,108,247,0.18)',
  },
  progressPercent: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.58)',
    fontWeight: '800',
    marginTop: 6,
  },
  timerProgressTrack: {
    width: 240,
    height: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.12)',
    overflow: 'hidden',
    marginBottom: 42,
  },
  timerProgressFill: {
    height: 8,
    borderRadius: 8,
    backgroundColor: PRIMARY,
  },

  controls: { flexDirection: 'row', alignItems: 'center', gap: 32 },
  controlBtn: {
    alignItems: 'center', justifyContent: 'center',
    width: 56, height: 56,
  },
  controlIcon: { fontSize: 28, color: '#FFFFFF', lineHeight: 32 },
  controlLabel: { fontSize: 11, color: 'rgba(255,255,255,0.6)', fontWeight: '700', marginTop: 2 },

  pauseBtn: {
    width: 68, height: 68, borderRadius: 34,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
  pauseIcon: { fontSize: 26, color: '#FFFFFF' },

  countdownFooter: {
    paddingHorizontal: 20, paddingBottom: 16, paddingTop: 8,
  },
  skipCountdownBtn: {
    backgroundColor: PRIMARY, borderRadius: 14, paddingVertical: 15,
    alignItems: 'center',
    shadowColor: PRIMARY, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4, shadowRadius: 10, elevation: 6,
  },
  skipCountdownText: { fontSize: 15, fontWeight: '700', color: '#fff' },
});
