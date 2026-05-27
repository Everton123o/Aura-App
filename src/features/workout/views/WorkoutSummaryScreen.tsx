import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../../navigation/AppNavigator';
import { exerciseService } from '../../../services/exerciseService';
import { workoutService } from '../../../services/workoutService';
import { workoutSessionService, SavedSeriesRecord } from '../../../services/workoutSessionService';
import { Exercise, Workout } from '../../home/models/WorkoutTypes';

type NavProp = NativeStackNavigationProp<RootStackParamList>;
type RouteProp_ = RouteProp<RootStackParamList, 'WorkoutSummary'>;

type SeriesSummary = {
  series: number;
  today?: SavedSeriesRecord;
  previous?: SavedSeriesRecord;
};

type ExerciseSummary = {
  exercise: Exercise;
  rows: SeriesSummary[];
  todayVolume: number;
  previousVolume: number;
};

function formatDuration(startedAt?: number) {
  if (!startedAt) return '0 min';
  const minutes = Math.max(1, Math.round((Date.now() - startedAt) / 60000));
  return `${minutes} min`;
}

function getSeriesSummaries(exercise: Exercise, records: SavedSeriesRecord[]): SeriesSummary[] {
  return Array.from({ length: exercise.sets }, (_, index) => {
    const series = index + 1;
    const matches = records
      .filter(record => record.series === series)
      .sort((a, b) => b.executedAt.localeCompare(a.executedAt));

    return {
      series,
      today: matches[0],
      previous: matches[1],
    };
  });
}

function getVolume(record?: SavedSeriesRecord) {
  return record ? record.reps * record.weight : 0;
}

function formatSet(record?: SavedSeriesRecord) {
  if (!record) return '-';
  return `${record.reps} x ${record.weight}kg`;
}

function formatVolume(value: number) {
  return new Intl.NumberFormat('pt-BR').format(value);
}

export default function WorkoutSummaryScreen() {
  const navigation = useNavigation<NavProp>();
  const route = useRoute<RouteProp_>();
  const { workoutId, sessionStartedAt } = route.params;

  const [workout, setWorkout] = useState<Workout | null>(null);
  const [items, setItems] = useState<ExerciseSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        const [nextWorkout, exercises] = await Promise.all([
          workoutService.getById(workoutId),
          exerciseService.getExercises(workoutId),
        ]);

        const summaries = await Promise.all(
          exercises.map(async exercise => {
            const records = await workoutSessionService.getExerciseRecords(workoutId, exercise.id);
            const rows = getSeriesSummaries(exercise, records);
            return {
              exercise,
              rows,
              todayVolume: rows.reduce((total, row) => total + getVolume(row.today), 0),
              previousVolume: rows.reduce((total, row) => total + getVolume(row.previous), 0),
            };
          }),
        );

        if (!alive) return;
        setWorkout(nextWorkout);
        setItems(summaries);
      } catch {
        if (alive) {
          Alert.alert('Resumo indisponivel', 'Nao foi possivel carregar o resumo do treino.');
        }
      } finally {
        if (alive) setIsLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [workoutId]);

  const totals = useMemo(() => {
    const todayVolume = items.reduce((total, item) => total + item.todayVolume, 0);
    const previousVolume = items.reduce((total, item) => total + item.previousVolume, 0);
    const todayReps = items.reduce(
      (total, item) => total + item.rows.reduce((sum, row) => sum + (row.today?.reps ?? 0), 0),
      0,
    );
    const previousReps = items.reduce(
      (total, item) => total + item.rows.reduce((sum, row) => sum + (row.previous?.reps ?? 0), 0),
      0,
    );

    return { todayVolume, previousVolume, todayReps, previousReps };
  }, [items]);

  const volumeDiff = totals.todayVolume - totals.previousVolume;
  const repsDiff = totals.todayReps - totals.previousReps;
  const duration = formatDuration(sessionStartedAt);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await workoutService.complete(workoutId);
      navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
    } catch {
      Alert.alert('Erro', 'Nao foi possivel salvar a conclusao do treino.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <ActivityIndicator color={PRIMARY} size="large" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.workoutName}>{workout?.name || 'Treino'}</Text>
        <Text style={styles.title}>Resumo</Text>
        <Text style={styles.subtitle}>Hoje - {duration}</Text>

        <View style={styles.highlight}>
          <Text style={styles.highlightIcon}>{volumeDiff >= 0 ? '↑' : '↓'}</Text>
          <View style={styles.highlightCopy}>
            <Text style={styles.highlightTitle}>
              {volumeDiff >= 0 ? 'Voce evoluiu desde a ultima vez!' : 'Hoje ficou abaixo da ultima vez'}
            </Text>
            <Text style={styles.highlightText}>
              {volumeDiff >= 0 ? '+' : ''}{formatVolume(volumeDiff)} kg de volume total · {repsDiff >= 0 ? '+' : ''}{repsDiff} repeticoes
            </Text>
          </View>
        </View>

        <View style={styles.metricsRow}>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Volume hoje</Text>
            <Text style={styles.metricValue}>{formatVolume(totals.todayVolume)} <Text style={styles.metricUnit}>kg</Text></Text>
            <Text style={[styles.metricDelta, volumeDiff >= 0 ? styles.good : styles.bad]}>
              {volumeDiff >= 0 ? '↑' : '↓'} vs {formatVolume(totals.previousVolume)} kg
            </Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Duracao</Text>
            <Text style={styles.metricValue}>{duration.replace(' ', ' ')}</Text>
            <Text style={styles.metricSub}>treino atual</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Exercicios</Text>

        {items.map(item => {
          const diff = item.todayVolume - item.previousVolume;
          return (
            <View key={item.exercise.id} style={styles.exerciseCard}>
              <View style={styles.exerciseHeader}>
                <Text style={styles.exerciseName}>{item.exercise.name}</Text>
                <Text style={[styles.badge, diff > 0 ? styles.badgeGood : styles.badgeSame]}>
                  {diff > 0 ? `+${formatVolume(diff)}kg` : diff < 0 ? `${formatVolume(diff)}kg` : 'igual'}
                </Text>
              </View>

              <View style={styles.tableHeader}>
                <Text style={[styles.col, styles.seriesCol]}>serie</Text>
                <Text style={styles.col}>hoje</Text>
                <Text style={styles.col}>ultima vez</Text>
              </View>

              {item.rows.map(row => (
                <View key={row.series} style={styles.tableRow}>
                  <Text style={[styles.col, styles.seriesCol, styles.mutedText]}>{row.series}</Text>
                  <Text style={[styles.col, styles.todayText]}>{formatSet(row.today)}</Text>
                  <Text style={[styles.col, styles.previousText]}>{formatSet(row.previous)}</Text>
                </View>
              ))}
            </View>
          );
        })}

        <TouchableOpacity
          style={[styles.saveBtn, isSaving && styles.saveBtnOff]}
          onPress={handleSave}
          disabled={isSaving}
          activeOpacity={0.85}
        >
          {isSaving ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.saveBtnText}>Salvar treino</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const PRIMARY = '#4A6CF7';
const BG = '#FFFFFF';
const CARD = '#EEF2F8';
const TEXT = '#090A0E';
const MUTED = '#7D828A';
const GREEN = '#A8D95C';

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { paddingHorizontal: 24, paddingTop: 24, paddingBottom: 28 },
  workoutName: { color: MUTED, fontSize: 24, fontWeight: '800', marginBottom: 2 },
  title: { color: TEXT, fontSize: 31, fontWeight: '900', lineHeight: 34 },
  subtitle: { color: TEXT, fontSize: 18, fontWeight: '800', marginBottom: 24 },
  highlight: {
    backgroundColor: PRIMARY,
    borderRadius: 12,
    minHeight: 90,
    paddingHorizontal: 22,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.22,
    shadowRadius: 4,
    elevation: 5,
  },
  highlightIcon: { color: GREEN, fontSize: 46, fontWeight: '900', marginRight: 14, lineHeight: 52 },
  highlightCopy: { flex: 1 },
  highlightTitle: { color: '#FFFFFF', fontSize: 16, fontWeight: '900', marginBottom: 4 },
  highlightText: { color: '#DDE5FF', fontSize: 15, fontWeight: '800' },
  metricsRow: { flexDirection: 'row', gap: 10, marginTop: 32 },
  metricCard: {
    flex: 1,
    backgroundColor: CARD,
    borderRadius: 12,
    padding: 8,
    minHeight: 100,
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 3,
    elevation: 3,
  },
  metricLabel: { color: MUTED, fontSize: 20, fontWeight: '900' },
  metricValue: { color: TEXT, fontSize: 25, fontWeight: '900', marginTop: 2 },
  metricUnit: { fontSize: 16, fontWeight: '800' },
  metricDelta: { fontSize: 15, fontWeight: '700' },
  metricSub: { color: TEXT, fontSize: 15, fontWeight: '700' },
  good: { color: '#1E55FF' },
  bad: { color: '#E53935' },
  sectionTitle: { color: MUTED, fontSize: 25, fontWeight: '900', marginTop: 18, marginBottom: 16 },
  exerciseCard: {
    backgroundColor: CARD,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 54,
    marginBottom: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  exerciseHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  exerciseName: { color: TEXT, fontSize: 22, fontWeight: '900', flex: 1, paddingRight: 10 },
  badge: { overflow: 'hidden', borderRadius: 8, paddingHorizontal: 5, paddingVertical: 2, fontSize: 15, fontWeight: '900' },
  badgeGood: { backgroundColor: GREEN, color: '#6F8B30' },
  badgeSame: { backgroundColor: '#C7C9CD', color: TEXT },
  tableHeader: { flexDirection: 'row', paddingHorizontal: 22 },
  tableRow: { flexDirection: 'row', paddingHorizontal: 22, marginTop: 2 },
  col: { flex: 1, fontSize: 15, fontWeight: '900', color: MUTED },
  seriesCol: { flex: 0.65, textAlign: 'center' },
  mutedText: { color: MUTED },
  todayText: { color: TEXT },
  previousText: { color: MUTED },
  saveBtn: {
    alignSelf: 'center',
    minWidth: 188,
    backgroundColor: '#3454F4',
    borderRadius: 13,
    paddingVertical: 18,
    paddingHorizontal: 28,
    alignItems: 'center',
    marginTop: -10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  saveBtnOff: { opacity: 0.7 },
  saveBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '900' },
});
