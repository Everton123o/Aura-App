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
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../navigation/AppNavigator';
import { useNewWorkoutViewModel } from '../viewmodels/useNewWorkoutViewModel';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'NewWorkout'>;

export default function NewWorkoutScreen() {
  const navigation = useNavigation<NavigationProp>();
  const {
    name,
    setName,
    loading,
    errors,
    handleCreate,
  } = useNewWorkoutViewModel();

  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [nameTouched, setNameTouched] = useState(false);

  const showNameError = (nameTouched && name.trim() === '') || !!errors.name;

  function handleProceed() {
    setNameTouched(true);
    handleCreate(() => navigation.goBack());
  }

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
          showsVerticalScrollIndicator={false}
        >
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backBtn}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            activeOpacity={0.75}
          >
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>

          <Text style={styles.title}>Novo treino</Text>
          <Text style={styles.subtitle}>Depois você adiciona os exercícios</Text>

          <View style={styles.card}>
            <Text style={styles.fieldLabel}>Nome do treino</Text>
            <View
              style={[
                styles.inputWrap,
                focusedField === 'name' && styles.inputFocused,
                showNameError && styles.inputErrorBorder,
              ]}
            >
              <TextInput
                style={styles.input}
                placeholder="Ex: Treino A - Push"
                placeholderTextColor="#B0B7C8"
                value={name}
                onChangeText={text => {
                  setName(text);
                  setNameTouched(true);
                }}
                onFocus={() => setFocusedField('name')}
                onBlur={() => {
                  setFocusedField(null);
                  setNameTouched(true);
                }}
                autoCapitalize="words"
                returnKeyType="next"
                maxLength={60}
                editable={!loading}
              />
            </View>

            {showNameError ? (
              <Text style={styles.errorText}>{errors.name || 'Nome é obrigatório'}</Text>
            ) : (
              <Text style={styles.charCount}>{name.length}/60</Text>
            )}

          </View>

          {errors.general ? (
            <View style={styles.globalErrorBox}>
              <Text style={styles.globalErrorText}>{errors.general}</Text>
            </View>
          ) : null}

          <View style={styles.spacer} />

          <TouchableOpacity
            style={[styles.cta, loading && styles.ctaDisabled]}
            onPress={handleProceed}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.ctaText}>Adicionar exercícios →</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const PRIMARY = '#4A6CF7';
const BG = '#F7F8FC';
const CARD = '#FFFFFF';
const BORDER = '#E2E6F0';
const TEXT = '#1A1D2E';
const MUTED = '#8891A8';
const ERROR_C = '#E53935';

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },
  flex: { flex: 1 },
  scroll: { flexGrow: 1, paddingHorizontal: 20, paddingBottom: 24 },
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
  title: {
    fontSize: 30,
    fontWeight: '800',
    color: TEXT,
    letterSpacing: -0.7,
    marginTop: 20,
    marginBottom: 4,
  },
  subtitle: { fontSize: 14, color: MUTED, marginBottom: 24 },
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
  fieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: MUTED,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  inputWrap: {
    borderWidth: 1.5,
    borderColor: BORDER,
    borderRadius: 12,
    backgroundColor: BG,
    paddingHorizontal: 13,
    paddingVertical: Platform.OS === 'ios' ? 13 : 9,
  },
  inputFocused: { borderColor: PRIMARY, backgroundColor: '#EEF1FF' },
  inputErrorBorder: { borderColor: ERROR_C, backgroundColor: '#FFF5F5' },
  input: { fontSize: 15, color: TEXT, fontWeight: '500' },
  charCount: { fontSize: 11, color: MUTED, textAlign: 'right', marginTop: 5 },
  errorText: { fontSize: 12, color: ERROR_C, marginTop: 5, fontWeight: '600' },
  globalErrorBox: {
    marginTop: 12,
    backgroundColor: '#FFEBEE',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  globalErrorText: { fontSize: 13, color: ERROR_C, fontWeight: '500' },
  spacer: { flex: 1, minHeight: 32 },
  cta: {
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
  ctaDisabled: { backgroundColor: '#B5C0F5', shadowOpacity: 0, elevation: 0 },
  ctaText: { fontSize: 15, fontWeight: '700', color: '#fff', letterSpacing: 0.3 },
});
