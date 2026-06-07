import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { doc, updateDoc } from 'firebase/firestore';
import { RootStackParamList } from '../../../navigation/AppNavigator';
import { auth, db } from '../../../constants/firebaseConfig';
import { exerciseService } from '../../../services/exerciseService';
import { Exercise } from '../models/WorkoutTypes';

const PRIMARY = '#4A6CF7';
const BG = '#F7F8FC';
const CARD = '#FFFFFF';
const BORDER = '#E2E6F0';
const TEXT = '#1A1D2E';
const MUTED = '#8891A8';
const PRIMARY_LIGHT = '#EEF1FF';

type Props = NativeStackScreenProps<RootStackParamList, 'EditExercise'>;

interface StepperProps {
  label: string;
  value: number;
  onDecrement: () => void;
  onIncrement: () => void;
  min?: number;
}

function Stepper({ label, value, onDecrement, onIncrement, min = 1 }: StepperProps) {
  return (
    <View style={s.stepperItem}>
      <Text style={s.stepperLabel}>{label}</Text>
      <View style={s.stepperControls}>
        <TouchableOpacity
          style={[s.stepperBtn, value <= min && s.stepperBtnDisabled]}
          onPress={onDecrement}
          disabled={value <= min}
        >
          <Text style={s.stepperBtnText}>-</Text>
        </TouchableOpacity>
        <Text style={s.stepperVal}>{value}</Text>
        <TouchableOpacity style={s.stepperBtn} onPress={onIncrement}>
          <Text style={s.stepperBtnText}>+</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function EditExerciseScreen({ route, navigation }: Props) {
  const { workoutId, exerciseId } = route.params;

  const [name, setName] = useState('');
  const [sets, setSets] = useState(3);
  const [reps, setReps] = useState(10);
  const [weight, setWeight] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [nameError, setNameError] = useState('');

  const loadExercise = useCallback(async () => {
    try {
      setLoading(true);
      const exercises = await exerciseService.getExercises(workoutId);
      const exercise = exercises.find(item => item.id === exerciseId);
      if (!exercise) throw new Error('Exercise not found');
      setName(exercise.name);
      setSets(exercise.sets);
      setReps(exercise.reps);
      setWeight(exercise.weight);
    } catch {
      Alert.alert('Erro', 'Não foi possível carregar o exercício.');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  }, [workoutId, exerciseId, navigation]);

  useEffect(() => {
    loadExercise();
  }, [loadExercise]);

  const handleSave = async () => {
    if (!name.trim()) {
      setNameError('Informe o nome do exercício.');
      return;
    }
    setNameError('');
    try {
      setSaving(true);
      const uid = auth.currentUser?.uid;
      if (!uid) throw new Error('Usuário não autenticado');
      await updateDoc(doc(db, 'users', uid, 'workouts', workoutId, 'exercises', exerciseId), {
        name: name.trim(),
        sets,
        reps,
        weight,
      });
      Alert.alert('Sucesso', 'Exercício salvo com sucesso.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch {
      Alert.alert('Erro', 'Não foi possível salvar as alterações.');
    } finally {
      setSaving(false);
    }
  };

  const decrement = (setter: React.Dispatch<React.SetStateAction<number>>, step = 1, min = 1) =>
    setter(v => Math.max(min, v - step));
  const increment = (setter: React.Dispatch<React.SetStateAction<number>>, step = 1) =>
    setter(v => v + step);

  if (loading) {
    return (
      <View style={s.centered}>
        <ActivityIndicator size="large" color={PRIMARY} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={s.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
          <Text style={s.backIcon}>‹</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>Editar exercício</Text>
        <View style={{ width: 36 }} />
      </View>

      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={s.sectionLabel}>Nome do exercício</Text>
        <View style={[s.inputWrap, nameError ? s.inputWrapError : null]}>
          <TextInput
            style={s.input}
            value={name}
            onChangeText={t => {
              setName(t);
              if (t.trim()) setNameError('');
            }}
            placeholder="Ex: Supino reto"
            placeholderTextColor={MUTED}
            maxLength={60}
          />
        </View>
        {!!nameError && <Text style={s.errorText}>{nameError}</Text>}

        <View style={s.divider} />
        <Text style={s.sectionLabel}>Configuração</Text>

        <Stepper
          label="Séries"
          value={sets}
          onDecrement={() => decrement(setSets, 1, 1)}
          onIncrement={() => increment(setSets)}
          min={1}
        />
        <Stepper
          label="Repetições"
          value={reps}
          onDecrement={() => decrement(setReps, 1, 1)}
          onIncrement={() => increment(setReps)}
          min={1}
        />
        <Stepper
          label="Peso (kg)"
          value={weight}
          onDecrement={() => decrement(setWeight, 2.5, 0)}
          onIncrement={() => increment(setWeight, 2.5)}
          min={0}
        />
      </ScrollView>
      </TouchableWithoutFeedback>

      <View style={s.footer}>
        <TouchableOpacity
          style={[s.btnPrimary, saving && s.btnDisabled]}
          onPress={handleSave}
          disabled={saving}
          activeOpacity={0.85}
        >
          {saving ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={s.btnPrimaryText}>Salvar alterações</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
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
  sectionLabel: { fontSize: 11, fontWeight: '600', color: MUTED, textTransform: 'uppercase', letterSpacing: 0.8 },
  divider: { height: 0.5, backgroundColor: BORDER },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: PRIMARY_LIGHT,
    borderWidth: 1.5,
    borderColor: PRIMARY,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  inputWrapError: { borderColor: '#E53935' },
  input: { flex: 1, fontSize: 14, fontWeight: '600', color: TEXT },
  errorText: { fontSize: 11, color: '#E53935', marginTop: -4 },
  stepperItem: {
    backgroundColor: CARD,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stepperLabel: { fontSize: 13, color: TEXT, fontWeight: '500' },
  stepperControls: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  stepperBtn: { width: 28, height: 28, borderRadius: 14, backgroundColor: PRIMARY, justifyContent: 'center', alignItems: 'center' },
  stepperBtnDisabled: { backgroundColor: '#B5C0F5' },
  stepperBtnText: { color: '#fff', fontSize: 18, fontWeight: '700', lineHeight: 22 },
  stepperVal: { fontSize: 16, fontWeight: '700', color: TEXT, minWidth: 28, textAlign: 'center' },
  footer: {
    backgroundColor: CARD,
    borderTopWidth: 0.5,
    borderTopColor: BORDER,
    padding: 16,
    paddingBottom: Platform.OS === 'ios' ? 32 : 16,
  },
  btnPrimary: {
    backgroundColor: PRIMARY,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: PRIMARY,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  btnPrimaryText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  btnDisabled: { opacity: 0.6 },
});
