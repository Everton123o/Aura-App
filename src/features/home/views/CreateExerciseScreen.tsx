import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Keyboard } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../../navigation/AppNavigator';
import { useCreateExerciseViewModel } from '../viewmodels/useCreateExerciseViewModel';

// ─── Types ────────────────────────────────────────────────────────────────────
type NavProp    = NativeStackNavigationProp<RootStackParamList>;
type RouteProp_ = RouteProp<RootStackParamList, 'CreateExercise'>;

// ─── Stepper ──────────────────────────────────────────────────────────────────
interface StepperProps {
  label: string;
  value: number;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  onChange: (val: number) => void;
}

function Stepper({ label, value, min = 0, max = 999, step = 1, unit, onChange }: StepperProps) {
  const [draft, setDraft] = useState(String(value));

  React.useEffect(() => {
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

  const decrement = () => updateValue(Math.max(min, value - step));
  const increment = () => updateValue(Math.min(max, value + step));

  return (
    <View style={stepperStyles.wrapper}>
      <Text style={stepperStyles.label}>{label}</Text>
      <View style={stepperStyles.row}>
        <TouchableOpacity
          style={[stepperStyles.btn, value <= min && stepperStyles.btnDisabled]}
          onPress={decrement}
          disabled={value <= min}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={[stepperStyles.btnText, value <= min && stepperStyles.btnTextDisabled]}>−</Text>
        </TouchableOpacity>

        <View style={stepperStyles.valueWrap}>
          <TextInput
            style={stepperStyles.value}
            value={draft}
            onChangeText={handleDraftChange}
            onBlur={commitDraft}
            onSubmitEditing={commitDraft}
            keyboardType="decimal-pad"
            selectTextOnFocus
          />
          {unit && <Text style={stepperStyles.unit}>{unit}</Text>}
        </View>

        <TouchableOpacity
          style={[stepperStyles.btn, value >= max && stepperStyles.btnDisabled]}
          onPress={increment}
          disabled={value >= max}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={[stepperStyles.btnText, value >= max && stepperStyles.btnTextDisabled]}>+</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────
export default function CreateExerciseScreen() {
  const navigation = useNavigation<NavProp>();
  const route      = useRoute<RouteProp_>();
  const { workoutId } = route.params;

  const { isLoading, error, handleSave } = useCreateExerciseViewModel(workoutId);

  const [name,   setName]   = useState('');
  const [sets,   setSets]   = useState(3);
  const [weight, setWeight] = useState(10);
  const [reps,   setReps]   = useState(10);
  const [nameFocused, setNameFocused] = useState(false);
  const [nameTouched, setNameTouched] = useState(false);

  const nameIsEmpty = name.trim() === '';
  const showNameErr = nameTouched && nameIsEmpty;
  const canSave     = !nameIsEmpty && !isLoading;

  const onSave = () => {
    setNameTouched(true);
    if (!canSave) return;
    handleSave({ name: name.trim(), sets, weight, reps });
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={8}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
        >

          {/* ── Back ── */}
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backBtn}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Text style={styles.backIcon}>‹</Text>
          </TouchableOpacity>

          {/* ── Title ── */}
          <Text style={styles.title}>Criar exercício</Text>

          {/* ── Form card ── */}
          <View style={styles.card}>

            {/* Nome */}
            <Text style={styles.fieldLabel}>NOME DO EXERCÍCIO</Text>
            <View style={[
              styles.inputWrap,
              nameFocused  && styles.inputFocused,
              showNameErr  && styles.inputError,
            ]}>
              <TextInput
                style={styles.input}
                placeholder="Ex: Supino reto"
                placeholderTextColor="#B0B7C8"
                value={name}
                onChangeText={t => { setName(t); setNameTouched(true); }}
                onFocus={() => setNameFocused(true)}
                onBlur={() => { setNameFocused(false); setNameTouched(true); }}
                autoCapitalize="words"
                returnKeyType="done"
                maxLength={60}
                editable={!isLoading}
              />
            </View>
            {showNameErr && (
              <Text style={styles.errorText}>Nome é obrigatório</Text>
            )}

            <View style={styles.divider} />

            {/* Steppers */}
            <Stepper
              label="Quantidade de séries"
              value={sets}
              min={1}
              max={20}
              onChange={setSets}
            />

            <View style={styles.stepperDivider} />

            <Stepper
              label="Peso (Kg)"
              value={weight}
              min={0}
              max={500}
              step={1}
              unit="kg"
              onChange={setWeight}
            />

            <View style={styles.stepperDivider} />

            <Stepper
              label="Repetições"
              value={reps}
              min={1}
              max={100}
              onChange={setReps}
            />

          </View>

          {/* API error */}
          {!!error && (
            <View style={styles.globalErrorBox}>
              <Text style={styles.globalErrorText}>⚠ {error}</Text>
            </View>
          )}

          <View style={styles.spacer} />

          {/* ── CTA ── */}
          <TouchableOpacity
            style={[styles.saveBtn, !canSave && styles.saveBtnDisabled]}
            onPress={onSave}
            disabled={!canSave}
            activeOpacity={0.85}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.saveBtnText}>Salvar</Text>
            )}
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─── Stepper Styles ───────────────────────────────────────────────────────────
const PRIMARY = '#4A6CF7';
const BG      = '#F7F8FC';
const CARD    = '#FFFFFF';
const BORDER  = '#E2E6F0';
const TEXT    = '#1A1D2E';
const MUTED   = '#8891A8';
const ERROR_C = '#E53935';

const stepperStyles = StyleSheet.create({
  wrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: TEXT,
    flex: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: BG,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: BORDER,
    overflow: 'hidden',
  },
  btn: {
    width: 40,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: CARD,
  },
  btnDisabled: { backgroundColor: BG },
  btnText:     { fontSize: 20, fontWeight: '600', color: PRIMARY, lineHeight: 24 },
  btnTextDisabled: { color: BORDER },
  valueWrap: {
    flexDirection: 'row',
    alignItems: 'baseline',
    minWidth: 56,
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  value: { fontSize: 18, fontWeight: '800', color: TEXT },
  unit:  { fontSize: 12, color: MUTED, marginLeft: 3, fontWeight: '500' },
});

// ─── Screen Styles ────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: BG },
  flex:   { flex: 1 },
  scroll: { flexGrow: 1, paddingHorizontal: 20, paddingBottom: 24 },

  // Back
  backBtn: {
    marginTop: 8,
    width: 38,
    height: 38,
    borderRadius: 11,
    backgroundColor: CARD,
    borderWidth: 1,
    borderColor: BORDER,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  backIcon: { fontSize: 17, color: TEXT, lineHeight: 21 },

  // Title
  title: {
    fontSize: 30,
    fontWeight: '800',
    color: TEXT,
    letterSpacing: -0.7,
    marginTop: 20,
    marginBottom: 24,
  },

  // Card
  card: {
    backgroundColor: CARD,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: BORDER,
    paddingHorizontal: 18,
    paddingVertical: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },

  // Labels
  fieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: MUTED,
    letterSpacing: 0.8,
    marginBottom: 10,
  },

  // Input
  inputWrap: {
    borderWidth: 1.5,
    borderColor: BORDER,
    borderRadius: 12,
    backgroundColor: BG,
    paddingHorizontal: 13,
    paddingVertical: Platform.OS === 'ios' ? 13 : 9,
  },
  inputFocused: { borderColor: PRIMARY, backgroundColor: '#EEF1FF' },
  inputError:   { borderColor: ERROR_C, backgroundColor: '#FFF5F5' },
  input:        { fontSize: 15, color: TEXT, fontWeight: '500' },
  errorText:    { fontSize: 12, color: ERROR_C, marginTop: 5, fontWeight: '600' },

  // Dividers
  divider:        { height: 1, backgroundColor: BORDER, marginVertical: 18 },
  stepperDivider: { height: 1, backgroundColor: BORDER, marginVertical: 14 },

  // Global error
  globalErrorBox: {
    marginTop: 12,
    backgroundColor: '#FFEBEE',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  globalErrorText: { fontSize: 13, color: ERROR_C, fontWeight: '500' },

  // CTA
  spacer:  { flex: 1, minHeight: 32 },
  saveBtn: {
    backgroundColor: PRIMARY,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: PRIMARY,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
    minHeight: 54,
  },
  saveBtnDisabled: { backgroundColor: '#B5C0F5', shadowOpacity: 0, elevation: 0 },
  saveBtnText:     { fontSize: 15, fontWeight: '700', color: '#fff', letterSpacing: 0.3 },
});
