import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import type { RootStackParamList } from '../../../navigation/AppNavigator';
import { exerciseService } from '../../../services/exerciseService';
import { workoutService } from '../../../services/workoutService';
import { Exercise } from '../models/WorkoutTypes';

const PRIMARY = '#4A6CF7';
const BG = '#F7F8FC';
const CARD = '#FFFFFF';
const BORDER = '#E2E6F0';
const TEXT = '#1A1D2E';
const MUTED = '#8891A8';
const ERROR_C = '#E53935';
const PRIMARY_LIGHT = '#EEF1FF';

type Props = NativeStackScreenProps<RootStackParamList, 'EditWorkout'>;

export default function EditWorkoutScreen({ route, navigation }: Props) {
  const { workoutId } = route.params;

  const [workoutName, setWorkoutName] = useState('');
  const [editingName, setEditingName] = useState(false);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [workout, exList] = await Promise.all([
        workoutService.getById(workoutId),
        exerciseService.getExercises(workoutId),
      ]);
      setWorkoutName(workout?.name ?? '');
      setExercises(exList);
    } catch {
      Alert.alert('Erro', 'Não foi possível carregar o treino.');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  }, [workoutId, navigation]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData]),
  );

  const handleSave = async () => {
    if (!workoutName.trim()) {
      Alert.alert('Atenção', 'O nome do treino não pode ser vazio.');
      return;
    }
    try {
      setSaving(true);
      await workoutService.update(workoutId, {
        name: workoutName.trim(),
      });
      Alert.alert('Sucesso', 'Treino salvo com sucesso.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch {
      Alert.alert('Erro', 'Não foi possível salvar as alterações.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteExercise = (exercise: Exercise) => {
    Alert.alert('Remover exercício', `Deseja remover "${exercise.name}" deste treino?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
          text: 'Remover',
          style: 'destructive',
          onPress: async () => {
            try {
              await exerciseService.deleteExercise(workoutId, exercise.id);
              setExercises(prev => prev.filter(e => e.id !== exercise.id));
            } catch {
            Alert.alert('Erro', 'Não foi possível remover o exercício.');
          }
        },
      },
    ]);
  };

  const handleDeleteWorkout = async () => {
    try {
      setDeleting(true);
      await workoutService.delete(workoutId);
      setDeleteModalVisible(false);
      navigation.navigate('Home');
    } catch {
      Alert.alert('Erro', 'Não foi possível excluir o treino.');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={PRIMARY} />
      </View>
    );
  }

  const totalSeries = exercises.reduce((sum, e) => sum + e.sets, 0);

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Editar treino</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.nameBlock}>
          {editingName ? (
            <TextInput
              style={styles.nameInput}
              value={workoutName}
              onChangeText={setWorkoutName}
              autoFocus
              onBlur={() => setEditingName(false)}
              returnKeyType="done"
              onSubmitEditing={() => setEditingName(false)}
              maxLength={50}
            />
          ) : (
            <TouchableOpacity style={styles.nameDisplay} onPress={() => setEditingName(true)} activeOpacity={0.7}>
              <View style={styles.nameTextWrap}>
                <Text style={styles.nameValue} numberOfLines={1}>
                  {workoutName || 'Sem nome'}
                </Text>
                <Text style={styles.nameSub}>Toque para renomear</Text>
              </View>
              <Text style={styles.pencilIcon}>✎</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statPill}>
            <Text style={styles.statVal}>{exercises.length}</Text>
            <Text style={styles.statLbl}>exercícios</Text>
          </View>
          <View style={styles.statPill}>
            <Text style={styles.statVal}>{totalSeries}</Text>
            <Text style={styles.statLbl}>séries</Text>
          </View>
        </View>

        <View style={styles.divider} />
        <Text style={styles.sectionLabel}>Exercícios</Text>

        {exercises.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>Nenhum exercício ainda</Text>
          </View>
        ) : (
          exercises.map(exercise => (
            <TouchableOpacity
              key={exercise.id}
              style={styles.exerciseCard}
              onLongPress={() => handleDeleteExercise(exercise)}
              onPress={() =>
                navigation.navigate('EditExercise', {
                  workoutId,
                  exerciseId: exercise.id,
                })
              }
              activeOpacity={0.75}
            >
              <View style={styles.exerciseDot} />
              <View style={styles.exerciseInfo}>
                <Text style={styles.exerciseName}>{exercise.name}</Text>
                <Text style={styles.exerciseMeta}>
                  {exercise.sets} séries · {exercise.reps} reps · {exercise.weight}kg
                </Text>
              </View>
              <View style={styles.exerciseActions}>
                <View style={styles.actionEdit}>
                  <Text style={styles.actionEditIcon}>✎</Text>
                </View>
                <TouchableOpacity
                  style={styles.actionDel}
                  onPress={() => handleDeleteExercise(exercise)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons name="trash-outline" size={13} color={ERROR_C} />
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          ))
        )}

        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => navigation.navigate('CreateExercise', { workoutId })}
          activeOpacity={0.7}
        >
          <Text style={styles.addBtnText}>+ Adicionar exercício</Text>
        </TouchableOpacity>
      </ScrollView>
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.btnPrimary, saving && styles.btnDisabled]}
          onPress={handleSave}
          disabled={saving}
          activeOpacity={0.85}
        >
          {saving ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.btnPrimaryText}>Salvar alterações</Text>
          )}
        </TouchableOpacity>
        <TouchableOpacity style={styles.btnDanger} onPress={() => setDeleteModalVisible(true)} activeOpacity={0.8}>
          <Text style={styles.btnDangerText}>Excluir treino</Text>
        </TouchableOpacity>
      </View>

      <Modal visible={deleteModalVisible} transparent animationType="slide" onRequestClose={() => setDeleteModalVisible(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => !deleting && setDeleteModalVisible(false)}>
          <View style={styles.modalSheet}>
            <View style={styles.modalDrag} />
            <Text style={styles.modalTitle}>Excluir treino?</Text>
            <Text style={styles.modalSub}>
              Esta ação não pode ser desfeita. O treino e todos os exercícios serão removidos permanentemente.
            </Text>
            <TouchableOpacity
              style={[styles.btnDangerFilled, deleting && styles.btnDisabled]}
              onPress={handleDeleteWorkout}
              disabled={deleting}
              activeOpacity={0.85}
            >
              {deleting ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.btnDangerFilledText}>Sim, excluir</Text>}
            </TouchableOpacity>
            <TouchableOpacity style={styles.btnCancel} onPress={() => setDeleteModalVisible(false)} disabled={deleting} activeOpacity={0.8}>
              <Text style={styles.btnCancelText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: BG },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: BG },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 56 : 20,
    paddingBottom: 12,
    paddingHorizontal: 16,
    backgroundColor: CARD,
    borderBottomWidth: 0.5,
    borderBottomColor: BORDER,
  },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: BG, justifyContent: 'center', alignItems: 'center' },
  backIcon: { fontSize: 24, color: TEXT, lineHeight: 28 },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 16, fontWeight: '700', color: TEXT },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 8, gap: 10 },
  nameBlock: { backgroundColor: PRIMARY_LIGHT, borderWidth: 1, borderColor: '#D5D7F5', borderRadius: 14 },
  nameDisplay: { flexDirection: 'row', alignItems: 'center', padding: 12, gap: 8 },
  nameTextWrap: { flex: 1 },
  nameValue: { fontSize: 15, fontWeight: '700', color: TEXT },
  nameSub: { fontSize: 11, color: PRIMARY, marginTop: 2 },
  pencilIcon: { fontSize: 17, color: PRIMARY },
  nameInput: { padding: 12, fontSize: 15, fontWeight: '700', color: TEXT, borderColor: PRIMARY, borderWidth: 1.5, borderRadius: 14 },
  statsRow: { flexDirection: 'row', gap: 8 },
  statPill: { flex: 1, backgroundColor: CARD, borderWidth: 1, borderColor: BORDER, borderRadius: 10, padding: 8, alignItems: 'center' },
  statVal: { fontSize: 18, fontWeight: '700', color: PRIMARY },
  statLbl: { fontSize: 10, color: MUTED, marginTop: 2, textTransform: 'uppercase', letterSpacing: 0.5 },
  divider: { height: 0.5, backgroundColor: BORDER },
  sectionLabel: { fontSize: 11, fontWeight: '600', color: MUTED, textTransform: 'uppercase', letterSpacing: 0.8 },
  exerciseCard: { backgroundColor: CARD, borderWidth: 1, borderColor: BORDER, borderRadius: 12, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 10 },
  exerciseDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: PRIMARY },
  exerciseInfo: { flex: 1 },
  exerciseName: { fontSize: 13, fontWeight: '600', color: TEXT },
  exerciseMeta: { fontSize: 11, color: MUTED, marginTop: 2 },
  exerciseActions: { flexDirection: 'row', gap: 6 },
  actionEdit: { width: 30, height: 30, borderRadius: 8, backgroundColor: PRIMARY_LIGHT, justifyContent: 'center', alignItems: 'center' },
  actionEditIcon: { fontSize: 15, color: PRIMARY },
  actionDel: { width: 30, height: 30, borderRadius: 8, backgroundColor: '#FFE8E8', justifyContent: 'center', alignItems: 'center' },
  emptyState: { backgroundColor: CARD, borderRadius: 12, padding: 24, alignItems: 'center' },
  emptyText: { fontSize: 13, color: MUTED },
  addBtn: { borderWidth: 1.5, borderColor: '#C5C8F0', borderStyle: 'dashed', borderRadius: 12, padding: 10, alignItems: 'center' },
  addBtnText: { fontSize: 13, color: PRIMARY, fontWeight: '500' },
  footer: { backgroundColor: CARD, borderTopWidth: 0.5, borderTopColor: BORDER, padding: 16, gap: 8, paddingBottom: Platform.OS === 'ios' ? 32 : 16 },
  btnPrimary: { backgroundColor: PRIMARY, borderRadius: 12, paddingVertical: 13, alignItems: 'center', justifyContent: 'center', shadowColor: PRIMARY, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  btnPrimaryText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  btnDisabled: { opacity: 0.6 },
  btnDanger: { borderWidth: 1, borderColor: '#F5C0C0', borderRadius: 12, paddingVertical: 11, alignItems: 'center' },
  btnDangerText: { color: ERROR_C, fontSize: 13, fontWeight: '600' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  modalSheet: { backgroundColor: CARD, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: Platform.OS === 'ios' ? 36 : 20, gap: 10 },
  modalDrag: { width: 36, height: 4, backgroundColor: BORDER, borderRadius: 2, alignSelf: 'center', marginBottom: 6 },
  modalTitle: { fontSize: 16, fontWeight: '700', color: TEXT, textAlign: 'center' },
  modalSub: { fontSize: 12, color: MUTED, textAlign: 'center', lineHeight: 18 },
  btnDangerFilled: { backgroundColor: ERROR_C, borderRadius: 12, paddingVertical: 13, alignItems: 'center' },
  btnDangerFilledText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  btnCancel: { backgroundColor: BG, borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  btnCancelText: { color: TEXT, fontSize: 14, fontWeight: '600' },
});
