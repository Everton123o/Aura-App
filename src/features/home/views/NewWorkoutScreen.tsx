import React from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  SafeAreaView, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useNewWorkoutViewModel } from '../viewmodels/useNewWorkoutViewModel';
import { Input, ChipSelector, PrimaryButton } from '../components/WorkoutComponents';

interface Props { navigation: any }

export default function NewWorkoutScreen({ navigation }: Props) {
  const vm = useNewWorkoutViewModel();

  return (
    <SafeAreaView style={s.safe}>

      {/* ── Header ── */}
      <View style={s.header}>
        <View style={s.headerInner}>
          <Text style={s.backBtn} onPress={() => navigation.goBack()}>←</Text>
          <Text style={s.title}>Novo treino</Text>
          <View style={{ width: 32 }} />
        </View>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={s.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {vm.errors.general ? (
            <Text style={s.generalError}>{vm.errors.general}</Text>
          ) : null}

          <Input
            label="Nome do treino"
            placeholder="Ex: Treino A - Peito"
            value={vm.name}
            onChangeText={vm.setName}
            error={vm.errors.name}
          />

          <ChipSelector
            label="Divisão"
            options={vm.divisions}
            selected={vm.division}
            onSelect={vm.setDivision}
            error={vm.errors.division}
          />

          <ChipSelector
            label="Grupo muscular"
            options={vm.muscleGroups}
            selected={vm.muscleGroup}
            onSelect={vm.setMuscleGroup}
            error={vm.errors.muscleGroup}
          />

          <Input
            label="Duração estimada (min)"
            placeholder="Ex: 45"
            value={vm.duration}
            onChangeText={vm.setDuration}
            keyboardType="numeric"
          />

          <Input
            label="Observações (opcional)"
            placeholder="Anotações sobre o treino..."
            value={vm.notes}
            onChangeText={vm.setNotes}
            multiline
            numberOfLines={3}
            style={{ height: 80, textAlignVertical: 'top' }}
          />

          <PrimaryButton
            label="Criar treino"
            onPress={() => vm.handleCreate(() => navigation.goBack())}
            loading={vm.loading}
            style={{ marginTop: 8 }}
          />

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:         { flex: 1, backgroundColor: '#F7F8FC' },
  header:       { backgroundColor: '#fff', borderBottomWidth: 0.5, borderBottomColor: '#E2E6F0' },
  headerInner:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14 },
  backBtn:      { fontSize: 22, color: '#1a1a2e', width: 32 },
  title:        { fontSize: 17, fontWeight: '700', color: '#1a1a2e' },
  scroll:       { padding: 20, paddingBottom: 40 },
  generalError: { fontSize: 13, color: '#E05555', textAlign: 'center', marginBottom: 16 },
});