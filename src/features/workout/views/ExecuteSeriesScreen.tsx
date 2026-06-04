// src/features/workout/views/ExecuteSeriesScreen.tsx
import React, { useEffect, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Modal, ActivityIndicator, TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../../navigation/AppNavigator';
import { workoutSessionService } from '../../../services/workoutSessionService';

// ─── Types ────────────────────────────────────────────────────────────────────
type NavProp    = NativeStackNavigationProp<RootStackParamList>;
type RouteProp_ = RouteProp<RootStackParamList, 'ExecuteSeries'>;

// ─── Stepper (inline) ─────────────────────────────────────────────────────────
function Stepper({
  label, value, min = 0, max = 999, step = 1,
  onChange,
}: {
  label: string; value: number; min?: number; max?: number; step?: number;
  onChange: (v: number) => void;
}) {
  const [draft, setDraft] = useState(String(value));

  useEffect(() => {
    setDraft(String(value));
  }, [value]);

  const updateValue = (next: number) => {
    const rounded = Math.round(next * 10) / 10;
    onChange(rounded);
    setDraft(String(rounded));
  };

  const commitDraft = () => {
    const parsed = Number(draft.replace(',', '.'));
    if (!Number.isFinite(parsed)) {
      setDraft(String(value));
      return;
    }
    updateValue(Math.min(max, Math.max(min, parsed)));
  };

  const handleDraftChange = (text: string) => {
    setDraft(text);
    if (!text.trim() || text === ',' || text === '.') return;
    const parsed = Number(text.replace(',', '.'));
    if (Number.isFinite(parsed)) {
      onChange(Math.min(max, Math.max(min, parsed)));
    }
  };

  return (
    <View style={stepStyles.wrap}>
      <Text style={stepStyles.label}>{label}</Text>
      <View style={stepStyles.row}>
        <TouchableOpacity
          style={[stepStyles.btn, value <= min && stepStyles.btnOff]}
          onPress={() => onChange(Math.max(min, value - step))}
          disabled={value <= min}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={[stepStyles.btnTxt, value <= min && stepStyles.btnTxtOff]}>−</Text>
        </TouchableOpacity>
        <TextInput
          style={stepStyles.value}
          value={draft}
          onChangeText={handleDraftChange}
          onBlur={commitDraft}
          onSubmitEditing={commitDraft}
          keyboardType="decimal-pad"
          selectTextOnFocus
        />
        <TouchableOpacity
          style={[stepStyles.btn, value >= max && stepStyles.btnOff]}
          onPress={() => onChange(Math.min(max, value + step))}
          disabled={value >= max}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={[stepStyles.btnTxt, value >= max && stepStyles.btnTxtOff]}>+</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const stepStyles = StyleSheet.create({
  wrap:  { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '700', color: '#1A1D2E', marginBottom: 10, textAlign: 'center' },
  row:   {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#F7F8FC', borderRadius: 14, borderWidth: 1.5,
    borderColor: '#E2E6F0', overflow: 'hidden',
  },
  btn:      { width: 52, height: 52, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF' },
  btnOff:   { backgroundColor: '#F7F8FC' },
  btnTxt:   { fontSize: 22, fontWeight: '600', color: '#4A6CF7', lineHeight: 26 },
  btnTxtOff:{ color: '#E2E6F0' },
  value:    { flex: 1, fontSize: 26, fontWeight: '800', color: '#1A1D2E', textAlign: 'center' },
});

// ─── Screen ───────────────────────────────────────────────────────────────────
export default function ExecuteSeriesScreen() {
  const navigation = useNavigation<NavProp>();
  const route      = useRoute<RouteProp_>();
  const {
    workoutId,
    exerciseId,
    exerciseName,
    totalSets,
    currentSeries,
    defaultReps = 10,
    defaultWeight = 0,
    completedExerciseIds = [],
    sessionStartedAt,
  } = route.params;

  // Estado do modal de registro
  const [modalVisible, setModalVisible] = useState(false);
  const [reps,         setReps]         = useState(defaultReps);
  const [weight,       setWeight]       = useState(defaultWeight);
  const [lastRecord,   setLastRecord]   = useState<{ reps: number; weight: number } | null>(null);
  const [isLoadingLast,setIsLoadingLast]= useState(true);
  const [isSaving,     setIsSaving]     = useState(false);
  const [saveError,    setSaveError]    = useState('');

  useEffect(() => {
    let alive = true;

    (async () => {
      setIsLoadingLast(true);
      try {
        const record = await workoutSessionService.getLastRecord(workoutId, exerciseId, currentSeries);
        if (!alive) return;
        setLastRecord(record);
        if (record) {
          setReps(record.reps);
          setWeight(record.weight);
        } else {
          setReps(defaultReps);
          setWeight(defaultWeight);
        }
      } catch {
        if (!alive) return;
        setLastRecord(null);
        setReps(defaultReps);
        setWeight(defaultWeight);
      } finally {
        if (alive) setIsLoadingLast(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [workoutId, exerciseId, currentSeries, defaultReps, defaultWeight]);

  const lastPerformance = isLoadingLast
    ? 'Carregando...'
    : lastRecord
      ? `${lastRecord.reps} reps - ${lastRecord.weight}Kg`
      : `${defaultReps} reps - ${defaultWeight}Kg`;

  const handleConcluirSerie = () => setModalVisible(true);

  const handleSaveSerie = async () => {
    setIsSaving(true);
    setSaveError('');
    try {
      await workoutSessionService.saveSeriesRecord({
        workoutId, exerciseId, series: currentSeries, reps, weight,
      });
      setModalVisible(false);

      const isLastSeries = currentSeries >= totalSets;

      if (isLastSeries) {
        // Todas as séries do exercício concluídas → vai pro descanso e depois volta pra escolha
        navigation.navigate('RestTimer', {
          workoutId, exerciseId, exerciseName,
          totalSets, currentSeries,
          defaultReps,
          defaultWeight,
          completedExerciseIds,
          sessionStartedAt,
        });
      } else {
        // Vai pro descanso e depois volta pra próxima série
        navigation.navigate('RestTimer', {
          workoutId, exerciseId, exerciseName,
          totalSets, currentSeries,
          defaultReps,
          defaultWeight,
          completedExerciseIds,
          sessionStartedAt,
        });
      }
    } catch (error: any) {
      setSaveError(error?.message || 'Nao foi possivel registrar a serie.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>

      {/* ── Back ── */}
      <TouchableOpacity
        onPress={() => navigation.goBack()}
        style={styles.backBtn}
        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
      >
        <Text style={styles.backIcon}>‹</Text>
      </TouchableOpacity>

      {/* ── Exercise name ── */}
      <Text style={styles.exerciseName}>{exerciseName}</Text>
      <Text style={styles.seriesLabel}>Série</Text>

      {/* ── Series number ── */}
      <View style={styles.seriesNumberWrap}>
        <Text style={styles.seriesNumber}>{currentSeries}</Text>
      </View>

      {/* ── Last performance ── */}
      <View style={styles.lastPerf}>
        <Text style={styles.lastPerfLabel}>última vez:</Text>
        <Text style={styles.lastPerfValue}>{lastPerformance}</Text>
      </View>

      <View style={styles.spacer} />

      {/* ── CTA ── */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.concludeBtn}
          onPress={handleConcluirSerie}
          activeOpacity={0.85}
        >
          <Text style={styles.concludeBtnText}>Concluir Série</Text>
        </TouchableOpacity>
        <Text style={styles.seriesCounter}>
          {currentSeries} de {totalSets} séries
        </Text>
      </View>

      {/* ── Modal: Registrar série ── */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={modal.overlay}>
          <TouchableOpacity
            style={modal.backdrop}
            onPress={() => setModalVisible(false)}
            activeOpacity={1}
          />
          <View style={modal.sheet}>
            <View style={modal.handle} />
            <Text style={modal.title}>Registrar série</Text>

            <Stepper label="Repetições" value={reps}   min={1} max={100} onChange={setReps}   />
            <Stepper label="Peso (Kg)"  value={weight} min={0} max={500} step={1} onChange={setWeight} />

            {!!saveError && (
              <Text style={modal.errorText}>{saveError}</Text>
            )}

            <TouchableOpacity
              style={[modal.saveBtn, isSaving && modal.saveBtnLoading]}
              onPress={handleSaveSerie}
              disabled={isSaving}
              activeOpacity={0.85}
            >
              {isSaving
                ? <ActivityIndicator color="#fff" size="small" />
                : <Text style={modal.saveBtnText}>Salvar</Text>
              }
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

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
  safe:   { flex: 1, backgroundColor: BG },
  spacer: { flex: 1 },

  backBtn: {
    marginTop: 12, marginLeft: 20,
    width: 38, height: 38, borderRadius: 11,
    backgroundColor: CARD, borderWidth: 1, borderColor: BORDER,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 3, elevation: 2,
    alignSelf: 'flex-start',
  },
  backIcon: { fontSize: 17, color: TEXT },

  exerciseName: {
    fontSize: 28, fontWeight: '800', color: TEXT,
    textAlign: 'center', marginTop: 28, letterSpacing: -0.5,
  },
  seriesLabel: {
    fontSize: 18, fontWeight: '700', color: TEXT,
    textAlign: 'center', marginTop: 4,
  },

  seriesNumberWrap: {
    alignSelf: 'center', marginTop: 24,
    width: 140, height: 140, borderRadius: 70,
    backgroundColor: CARD, borderWidth: 2, borderColor: BORDER,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: PRIMARY, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15, shadowRadius: 16, elevation: 6,
  },
  seriesNumber: { fontSize: 72, fontWeight: '800', color: PRIMARY, lineHeight: 84 },

  lastPerf: { alignItems: 'center', marginTop: 28 },
  lastPerfLabel: { fontSize: 12, color: MUTED, marginBottom: 4 },
  lastPerfValue: { fontSize: 22, fontWeight: '700', color: TEXT },

  footer: {
    paddingHorizontal: 20, paddingTop: 12, paddingBottom: 8,
    borderTopWidth: 1, borderTopColor: BORDER, backgroundColor: CARD,
  },
  concludeBtn: {
    backgroundColor: PRIMARY, borderRadius: 14, paddingVertical: 15,
    alignItems: 'center',
    shadowColor: PRIMARY, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 5,
  },
  concludeBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },
  seriesCounter:   { fontSize: 12, color: MUTED, textAlign: 'center', marginTop: 8 },
});

const modal = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.45)' },
  sheet: {
    backgroundColor: CARD, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingHorizontal: 24, paddingTop: 16, paddingBottom: 32,
    shadowColor: '#000', shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12, shadowRadius: 16, elevation: 12,
  },
  handle: {
    width: 40, height: 4, borderRadius: 2, backgroundColor: BORDER,
    alignSelf: 'center', marginBottom: 20,
  },
  title: {
    fontSize: 22, fontWeight: '800', color: TEXT,
    textAlign: 'center', marginBottom: 24, letterSpacing: -0.4,
  },
  saveBtn: {
    backgroundColor: PRIMARY, borderRadius: 14, paddingVertical: 15,
    alignItems: 'center', marginTop: 8,
    shadowColor: PRIMARY, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 5,
  },
  saveBtnLoading: { opacity: 0.7 },
  saveBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },
  errorText: {
    color: '#E53935',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 10,
  },
});
