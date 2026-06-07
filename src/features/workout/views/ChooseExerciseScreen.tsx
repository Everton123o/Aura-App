// src/features/workout/views/ChooseExerciseScreen.tsx
import React, { useEffect, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  FlatList, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../../navigation/AppNavigator';
import { exerciseService } from '../../../services/exerciseService';
import { Exercise } from '../../home/models/WorkoutTypes';

// ─── Types ────────────────────────────────────────────────────────────────────
type NavProp    = NativeStackNavigationProp<RootStackParamList>;
type RouteProp_ = RouteProp<RootStackParamList, 'ChooseExercise'>;

// ─── Screen ───────────────────────────────────────────────────────────────────
export default function ChooseExerciseScreen() {
  const navigation = useNavigation<NavProp>();
  const route      = useRoute<RouteProp_>();
  const { workoutId, completedExerciseId, completedExerciseIds } = route.params;

  const [exercises,  setExercises]  = useState<Exercise[]>([]);
  const [completed,  setCompleted]  = useState<Set<string>>(new Set());
  const [isLoading,  setIsLoading]  = useState(true);
  const [startTime]                 = useState(route.params.sessionStartedAt ?? Date.now());

  useEffect(() => {
    (async () => {
      const data = await exerciseService.getExercises(workoutId);
      setExercises(data);
      setIsLoading(false);
    })();
  }, [workoutId]);

  useEffect(() => {
    const ids = [...(completedExerciseIds ?? [])];
    if (completedExerciseId) ids.push(completedExerciseId);
    if (ids.length === 0) return;
    setCompleted(new Set(ids));
  }, [completedExerciseId, completedExerciseIds]);

  const handleFinish = () => {
    navigation.replace('WorkoutSummary', { workoutId, sessionStartedAt: startTime });
  };

  const completedCount = completed.size;
  const totalCount     = exercises.length;
  const progress       = totalCount > 0 ? completedCount / totalCount : 0;
  const allDone        = totalCount > 0 && completedCount >= totalCount;

  const renderItem = ({ item }: { item: Exercise }) => {
    const done = completed.has(item.id);
    return (
      <TouchableOpacity
        style={[styles.exerciseCard, done && styles.exerciseCardDone]}
        onPress={() => {
          if (done || allDone) return;
          navigation.navigate('ExecuteSeries', {
            workoutId,
            exerciseId:   item.id,
            exerciseName: item.name,
            totalSets:    item.sets,
            currentSeries: 1,
            defaultReps:   item.reps,
            defaultWeight: item.weight,
            completedExerciseIds: Array.from(completed),
            sessionStartedAt: startTime,
          });
        }}
        disabled={done || allDone}
        activeOpacity={0.8}
      >
        <View style={styles.cardLeft}>
          <Text style={[styles.exerciseName, done && styles.exerciseNameDone]}>{item.name}</Text>
          <Text style={[styles.exerciseMeta, done && styles.exerciseMetaDone]}>
            {item.sets} séries
          </Text>
        </View>
        {done && <Text style={styles.checkIcon}>✓</Text>}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      {/* ── Progress ── */}
      <View style={styles.progressHeader}>
        <Text style={styles.progressLabel}>
          {completedCount} de {totalCount} exercícios concluídos
        </Text>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${progress * 100}%` as any }]} />
        </View>
      </View>

      {/* ── Title ── */}
      <Text style={styles.title}>Escolha o Exercício</Text>
      <Text style={styles.subtitle}>
        {allDone ? 'Todos os exercicios foram concluidos' : 'Peito'}
      </Text>

      {/* ── List ── */}
      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={PRIMARY} size="large" />
        </View>
      ) : (
        <FlatList
          data={exercises}
          keyExtractor={i => i.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        />
      )}

      {/* ── Footer ── */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.finishBtn} onPress={handleFinish} activeOpacity={0.85}>
          <Text style={styles.finishBtnText}>
            {allDone ? 'Concluir treino' : 'Finalizar treino'}
          </Text>
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
  safe:   { flex: 1, backgroundColor: BG },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  progressHeader: { paddingHorizontal: 24, paddingTop: 16, paddingBottom: 8 },
  progressLabel:  { fontSize: 12, color: MUTED, fontWeight: '600', textAlign: 'center', marginBottom: 8 },
  progressTrack:  { height: 4, backgroundColor: BORDER, borderRadius: 4, overflow: 'hidden' },
  progressFill:   { height: 4, backgroundColor: PRIMARY, borderRadius: 4 },

  title:    { fontSize: 26, fontWeight: '800', color: TEXT, textAlign: 'center', marginTop: 18, letterSpacing: -0.5 },
  subtitle: { fontSize: 14, color: MUTED, textAlign: 'center', marginBottom: 20 },

  list: { paddingHorizontal: 20, paddingBottom: 8 },

  exerciseCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: CARD,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: BORDER,
    paddingVertical: 16,
    paddingHorizontal: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  exerciseCardDone: {
    borderColor: PRIMARY,
    backgroundColor: '#EEF1FF',
  },
  cardLeft:          { flex: 1 },
  exerciseName:      { fontSize: 15, fontWeight: '700', color: TEXT, marginBottom: 3 },
  exerciseNameDone:  { color: PRIMARY },
  exerciseMeta:      { fontSize: 12, color: MUTED, fontWeight: '500' },
  exerciseMetaDone:  { color: '#6B7FD4' },
  checkIcon:         { fontSize: 18, color: PRIMARY, fontWeight: '800' },

  footer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
    borderTopWidth: 1,
    borderTopColor: BORDER,
    backgroundColor: CARD,
  },
  finishBtn: {
    backgroundColor: PRIMARY,
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
    shadowColor: PRIMARY,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  finishBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },
});
