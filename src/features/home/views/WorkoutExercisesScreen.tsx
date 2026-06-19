import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../../navigation/AppNavigator';
import { useWorkoutExercisesViewModel } from '../viewmodels/useWorkoutExercisesViewModel';
import { Exercise } from '../models/WorkoutTypes';

// ─── Types ────────────────────────────────────────────────────────────────────
type NavProp   = NativeStackNavigationProp<RootStackParamList>;
type RouteProp_ = RouteProp<RootStackParamList, 'WorkoutExercises'>;

// ─── Screen ───────────────────────────────────────────────────────────────────
export default function WorkoutExercisesScreen() {
  const navigation = useNavigation<NavProp>();
  const route      = useRoute<RouteProp_>();
  const workoutId = route.params?.workoutId;

  if (!workoutId) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.center}>
          <Text style={styles.errorText}>Treino invalido. Volte e tente abrir novamente.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const { exercises, isLoading, error, deleteExercise, handleConclude } =
    useWorkoutExercisesViewModel(workoutId);

  const confirmDelete = (exercise: Exercise) => {
    Alert.alert(
      'Remover exercício',
      `Remover "${exercise.name}" do treino?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Remover',  style: 'destructive', onPress: () => deleteExercise(exercise.id) },
      ]
    );
  };

  const confirmExit = () => {
    Alert.alert(
      'Sair desta etapa?',
      'Ao sair, o treino será salvo do jeito que está.',
      [
        { text: 'Continuar', style: 'cancel' },
        { text: 'Sair mesmo assim', style: 'destructive', onPress: () => navigation.goBack() },
      ],
    );
  };

  const renderExercise = ({ item, index }: { item: Exercise; index: number }) => (
    <TouchableOpacity
      style={styles.exerciseCard}
      onPress={() => navigation.navigate('EditExercise', { workoutId, exerciseId: item.id })}
      onLongPress={() => confirmDelete(item)}
      activeOpacity={0.8}
    >
      <View style={styles.exerciseIndex}>
        <Text style={styles.exerciseIndexText}>{index + 1}</Text>
      </View>
      <View style={styles.exerciseInfo}>
        <Text style={styles.exerciseName}>{item.name}</Text>
        <Text style={styles.exerciseMeta}>
          {item.sets} séries • {item.reps} reps
          {item.weight > 0 ? ` • ${item.weight} kg` : ''}
        </Text>
      </View>
      <View style={styles.exerciseChevron}>
        <Text style={styles.chevronText}>✎</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>

      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={confirmExit}
          style={styles.backBtn}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Ionicons name="exit-outline" size={18} color={TEXT} />
        </TouchableOpacity>
        <Text style={styles.title}>Exercícios</Text>
        <View style={styles.headerRight}>
          {exercises.length > 0 && (
            <View style={styles.countBadge}>
              <Text style={styles.countBadgeText}>{exercises.length}</Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.divider} />

      {/* ── Content ── */}
      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={PRIMARY} size="large" />
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>⚠ {error}</Text>
        </View>
      ) : exercises.length === 0 ? (
        /* Empty state */
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>🏋️</Text>
          <Text style={styles.emptyTitle}>Nenhum exercício ainda</Text>
          <Text style={styles.emptySubtitle}>
            Toque em "+ Adicionar exercício" para começar a montar seu treino
          </Text>
        </View>
      ) : (
        <FlatList
          data={exercises}
          keyExtractor={item => item.id}
          renderItem={renderExercise}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      )}

      {/* ── Footer ── */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => navigation.navigate('CreateExercise', { workoutId })}
          activeOpacity={0.8}
        >
          <Text style={styles.addBtnText}>+ Adicionar exercício</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.concludeBtn, exercises.length === 0 && styles.concludeBtnDisabled]}
          onPress={handleConclude}
          disabled={exercises.length === 0}
          activeOpacity={0.85}
        >
          <Text style={styles.concludeBtnText}>Concluir</Text>
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
const ERROR_C = '#E53935';

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
    backgroundColor: CARD,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: BG,
    borderWidth: 1,
    borderColor: BORDER,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon:    { fontSize: 17, color: TEXT },
  title:       { flex: 1, fontSize: 22, fontWeight: '800', color: TEXT, textAlign: 'center', letterSpacing: -0.5 },
  headerRight: { width: 36, alignItems: 'flex-end' },
  countBadge:  {
    backgroundColor: PRIMARY,
    borderRadius: 10,
    minWidth: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  countBadgeText: { fontSize: 11, fontWeight: '800', color: '#fff' },

  divider: { height: 1, backgroundColor: BORDER },

  // List
  list: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
  separator: { height: 8 },

  // Exercise card
  exerciseCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: CARD,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: BORDER,
    paddingVertical: 14,
    paddingHorizontal: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  exerciseIndex: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: '#EEF1FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  exerciseIndexText: { fontSize: 13, fontWeight: '800', color: PRIMARY },
  exerciseInfo:  { flex: 1 },
  exerciseName:  { fontSize: 15, fontWeight: '700', color: TEXT, marginBottom: 3 },
  exerciseMeta:  { fontSize: 12, color: MUTED, fontWeight: '500' },
  exerciseChevron: { paddingLeft: 8 },
  chevronText:   { fontSize: 22, color: MUTED, lineHeight: 26 },

  // States
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  errorText: { fontSize: 14, color: ERROR_C, fontWeight: '600' },

  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  emptyIcon:     { fontSize: 48, marginBottom: 16 },
  emptyTitle:    { fontSize: 18, fontWeight: '700', color: TEXT, textAlign: 'center', marginBottom: 8 },
  emptySubtitle: { fontSize: 14, color: MUTED, textAlign: 'center', lineHeight: 20 },

  // Footer
  footer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
    borderTopWidth: 1,
    borderTopColor: BORDER,
    backgroundColor: CARD,
    gap: 10,
  },
  addBtn: {
    borderWidth: 1.5,
    borderColor: PRIMARY,
    borderRadius: 13,
    paddingVertical: 13,
    alignItems: 'center',
  },
  addBtnText: { fontSize: 14, fontWeight: '700', color: PRIMARY },

  concludeBtn: {
    backgroundColor: PRIMARY,
    borderRadius: 13,
    paddingVertical: 15,
    alignItems: 'center',
    shadowColor: PRIMARY,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  concludeBtnDisabled: { backgroundColor: '#B5C0F5', shadowOpacity: 0, elevation: 0 },
  concludeBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },
});
