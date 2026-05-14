import React from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ActivityIndicator, TextInput, TextInputProps,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Workout } from '../models/WorkoutTypes';

const BLUE   = '#4A6CF7';
const BORDER = '#E2E6F0';
const MUTED  = '#888888';
const DANGER = '#E05555';

// ─── PrimaryButton ────────────────────────────────────────────────────────────
interface PrimaryButtonProps {
  label: string;
  onPress: () => void;
  loading?: boolean;
  style?: any;
}
export function PrimaryButton({ label, onPress, loading, style }: PrimaryButtonProps) {
  return (
    <TouchableOpacity style={[pb.btn, style]} onPress={onPress} disabled={loading} activeOpacity={0.85}>
      {loading
        ? <ActivityIndicator color="#fff" />
        : <Text style={pb.lbl}>{label}</Text>}
    </TouchableOpacity>
  );
}
const pb = StyleSheet.create({
  btn: { backgroundColor: BLUE, borderRadius: 12, paddingVertical: 14, alignItems: 'center', shadowColor: BLUE, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 8, elevation: 4 },
  lbl: { color: '#fff', fontWeight: '700', fontSize: 15 },
});

// ─── Input ────────────────────────────────────────────────────────────────────
interface InputProps extends TextInputProps {
  label: string;
  error?: string;
}
export function Input({ label, error, style, ...rest }: InputProps) {
  return (
    <View style={inp.wrapper}>
      <Text style={inp.label}>{label}</Text>
      <TextInput
        style={[inp.field, error ? inp.fieldError : null, style]}
        placeholderTextColor={MUTED}
        autoCapitalize="none"
        {...rest}
      />
      {error ? <Text style={inp.error}>{error}</Text> : null}
    </View>
  );
}
const inp = StyleSheet.create({
  wrapper:    { marginBottom: 16 },
  label:      { fontSize: 11, fontWeight: '700', color: MUTED, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 },
  field:      { backgroundColor: '#fff', borderWidth: 1, borderColor: BORDER, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, color: '#1a1a2e' },
  fieldError: { borderColor: DANGER },
  error:      { fontSize: 11, color: DANGER, marginTop: 4 },
});

// ─── ChipSelector ─────────────────────────────────────────────────────────────
interface ChipSelectorProps {
  label: string;
  options: string[];
  selected: string;
  onSelect: (v: string) => void;
  error?: string;
}
export function ChipSelector({ label, options, selected, onSelect, error }: ChipSelectorProps) {
  return (
    <View style={cs.wrapper}>
      <Text style={cs.label}>{label}</Text>
      <View style={cs.row}>
        {options.map(opt => (
          <TouchableOpacity
            key={opt}
            style={[cs.chip, selected === opt && cs.chipActive]}
            onPress={() => onSelect(opt)}
            activeOpacity={0.8}
          >
            <Text style={[cs.chipTxt, selected === opt && cs.chipTxtActive]}>{opt}</Text>
          </TouchableOpacity>
        ))}
      </View>
      {error ? <Text style={cs.error}>{error}</Text> : null}
    </View>
  );
}
const cs = StyleSheet.create({
  wrapper:       { marginBottom: 16 },
  label:         { fontSize: 11, fontWeight: '700', color: MUTED, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 },
  row:           { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip:          { paddingVertical: 6, paddingHorizontal: 14, borderRadius: 20, borderWidth: 1, borderColor: BORDER, backgroundColor: '#fff' },
  chipActive:    { backgroundColor: BLUE, borderColor: BLUE },
  chipTxt:       { fontSize: 13, color: MUTED, fontWeight: '600' },
  chipTxtActive: { color: '#fff' },
  error:         { fontSize: 11, color: DANGER, marginTop: 4 },
});

// ─── WorkoutCard ──────────────────────────────────────────────────────────────
interface WorkoutCardProps {
  workout: Workout;
  onStart?: () => void;
  onEdit?:  () => void;
  onDelete: () => void;
}
export function WorkoutCard({ workout, onStart, onEdit, onDelete }: WorkoutCardProps) {
  return (
    <View style={wc.card}>
      <View style={wc.top}>
        <Text style={wc.name}>{workout.name}</Text>
        <View style={wc.badge}>
          <Text style={wc.badgeTxt}>{workout.exerciseCount} ex</Text>
        </View>
      </View>
      <Text style={wc.detail}>
        {workout.muscleGroup} · {workout.division} · ~{workout.estimatedDuration} min
      </Text>
      <View style={wc.actions}>
        {onStart ? (
          <TouchableOpacity style={[wc.btn, wc.btnPrimary]} onPress={onStart} activeOpacity={0.85}>
            <Ionicons name="play" size={12} color="#fff" />
            <Text style={wc.btnPrimaryTxt}>Iniciar</Text>
          </TouchableOpacity>
        ) : null}
        {onEdit ? (
          <TouchableOpacity style={[wc.btn, wc.btnOutline]} onPress={onEdit} activeOpacity={0.85}>
            <Ionicons name="create-outline" size={13} color={MUTED} />
            <Text style={wc.btnOutlineTxt}>Editar</Text>
          </TouchableOpacity>
        ) : null}
        <TouchableOpacity style={[wc.btn, wc.btnDanger]} onPress={onDelete} activeOpacity={0.85}>
          <Ionicons name="trash-outline" size={13} color={DANGER} />
        </TouchableOpacity>
      </View>
    </View>
  );
}
const wc = StyleSheet.create({
  card:          { backgroundColor: '#fff', borderRadius: 14, borderWidth: 1, borderColor: BORDER, padding: 14, marginBottom: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 },
  top:           { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  name:          { fontSize: 15, fontWeight: '700', color: '#1a1a2e' },
  badge:         { backgroundColor: '#EEF0FE', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2 },
  badgeTxt:      { fontSize: 11, fontWeight: '700', color: BLUE },
  detail:        { fontSize: 12, color: MUTED, marginBottom: 10 },
  actions:       { flexDirection: 'row', gap: 8 },
  btn:           { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, paddingVertical: 7, borderRadius: 8 },
  btnPrimary:    { flex: 1, backgroundColor: BLUE },
  btnPrimaryTxt: { fontSize: 12, fontWeight: '700', color: '#fff' },
  btnOutline:    { flex: 1, borderWidth: 1, borderColor: BORDER },
  btnOutlineTxt: { fontSize: 12, fontWeight: '600', color: MUTED },
  btnDanger:     { paddingHorizontal: 10, borderWidth: 1, borderColor: '#FFD5D5', backgroundColor: '#FFF5F5' },
});

// ─── EmptyState ───────────────────────────────────────────────────────────────
interface EmptyStateProps { onPress: () => void }
export function EmptyState({ onPress }: EmptyStateProps) {
  return (
    <View style={es.wrap}>
      <View style={es.iconWrap}>
        <Ionicons name="barbell-outline" size={32} color={BLUE} />
      </View>
      <Text style={es.title}>Nenhum treino criado ainda</Text>
      <Text style={es.sub}>Crie seu primeiro treino e comece a evoluir</Text>
      <TouchableOpacity style={es.btn} onPress={onPress} activeOpacity={0.85}>
        <Text style={es.btnTxt}>+ Criar primeiro treino</Text>
      </TouchableOpacity>
    </View>
  );
}
const es = StyleSheet.create({
  wrap:     { backgroundColor: '#fff', borderRadius: 16, borderWidth: 1, borderColor: BORDER, padding: 32, alignItems: 'center', marginTop: 12 },
  iconWrap: { width: 64, height: 64, backgroundColor: '#EEF0FE', borderRadius: 32, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  title:    { fontSize: 16, fontWeight: '700', color: '#1a1a2e', marginBottom: 6, textAlign: 'center' },
  sub:      { fontSize: 13, color: MUTED, textAlign: 'center', marginBottom: 20, lineHeight: 20 },
  btn:      { backgroundColor: BLUE, paddingVertical: 12, paddingHorizontal: 24, borderRadius: 10 },
  btnTxt:   { fontSize: 14, fontWeight: '700', color: '#fff' },
});

// ─── FloatingButton ───────────────────────────────────────────────────────────
interface FloatingButtonProps { onPress: () => void }
export function FloatingButton({ onPress }: FloatingButtonProps) {
  return (
    <TouchableOpacity style={fb.btn} onPress={onPress} activeOpacity={0.85}>
      <Ionicons name="add" size={20} color="#fff" />
      <Text style={fb.txt}>Planejar novo treino</Text>
    </TouchableOpacity>
  );
}
const fb = StyleSheet.create({
  btn: { backgroundColor: BLUE, borderRadius: 14, paddingVertical: 14, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, shadowColor: BLUE, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 6 },
  txt: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
