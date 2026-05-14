import React from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  SafeAreaView, ActivityIndicator, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useHomeViewModel } from '../viewmodels/useHomeViewModel';
import { WorkoutCard, EmptyState, FloatingButton } from '../components/WorkoutComponents';

interface Props { navigation: any }

export default function HomeScreen({ navigation }: Props) {
  const { workouts, loading, error, deleteWorkout, refresh } = useHomeViewModel();
  const [refreshing, setRefreshing] = React.useState(false);

  async function onRefresh() {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }

  const totalMinutes = workouts.reduce((acc, w) => acc + w.estimatedDuration, 0);
  const totalHours   = Math.floor(totalMinutes / 60);

  return (
    <SafeAreaView style={s.safe}>

      {/* ── Header ── */}
      <View style={s.header}>
        <View style={s.headerTop}>
          <View style={s.logoRow}>
            <View style={s.logoCircle}>
              <Ionicons name="barbell-outline" size={18} color="#fff" />
            </View>
            <Text style={s.logoText}>Aura</Text>
          </View>
          <View style={s.avatar}>
            <Text style={s.avatarTxt}>VT</Text>
          </View>
        </View>
        <Text style={s.greeting}>Bom dia, Verto 👋</Text>
        <Text style={s.greetingSub}>Pronto para treinar hoje?</Text>
      </View>

      <ScrollView
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#4A6CF7" />
        }
      >
        {/* ── Stats ── */}
        <View style={s.statsRow}>
          <View style={s.stat}>
            <Text style={s.statNum}>{workouts.length}</Text>
            <Text style={s.statLbl}>Treinos</Text>
          </View>
          <View style={s.stat}>
            <Text style={s.statNum}>3</Text>
            <Text style={s.statLbl}>Esta semana</Text>
          </View>
          <View style={s.stat}>
            <Text style={s.statNum}>{totalHours}h</Text>
            <Text style={s.statLbl}>Tempo total</Text>
          </View>
        </View>

        {/* ── Lista de treinos ── */}
        <Text style={s.sectionLabel}>Meus treinos</Text>

        {loading ? (
          <ActivityIndicator color="#4A6CF7" style={{ marginTop: 40 }} />
        ) : error ? (
          <Text style={s.errorTxt}>{error}</Text>
        ) : workouts.length === 0 ? (
          <EmptyState onPress={() => navigation.navigate('NewWorkout')} />
        ) : (
          workouts.map(w => (
            <WorkoutCard
              key={w.id}
              workout={w}
              onStart={() => navigation.navigate('ExecuteWorkout', { workoutId: w.id })}
              onEdit={() => navigation.navigate('EditWorkout', { workoutId: w.id })}
              onDelete={() => deleteWorkout(w.id)}
            />
          ))
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* ── FAB ── */}
      <View style={s.fabWrap}>
        <FloatingButton onPress={() => navigation.navigate('NewWorkout')} />
      </View>

    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:        { flex: 1, backgroundColor: '#F7F8FC' },
  header:      { backgroundColor: '#fff', paddingHorizontal: 20, paddingTop: 12, paddingBottom: 16, borderBottomWidth: 0.5, borderBottomColor: '#E2E6F0' },
  headerTop:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  logoRow:     { flexDirection: 'row', alignItems: 'center', gap: 8 },
  logoCircle:  { width: 32, height: 32, borderRadius: 16, backgroundColor: '#4A6CF7', alignItems: 'center', justifyContent: 'center' },
  logoText:    { fontSize: 18, fontWeight: '700', color: '#4A6CF7' },
  avatar:      { width: 36, height: 36, borderRadius: 18, backgroundColor: '#EEF0FE', alignItems: 'center', justifyContent: 'center' },
  avatarTxt:   { fontSize: 12, fontWeight: '700', color: '#4A6CF7' },
  greeting:    { fontSize: 18, fontWeight: '700', color: '#1a1a2e' },
  greetingSub: { fontSize: 13, color: '#888', marginTop: 2 },
  scroll:      { padding: 20 },
  statsRow:    { flexDirection: 'row', gap: 10, marginBottom: 24 },
  stat:        { flex: 1, backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#E2E6F0', padding: 12, alignItems: 'center' },
  statNum:     { fontSize: 20, fontWeight: '700', color: '#4A6CF7' },
  statLbl:     { fontSize: 11, color: '#888', marginTop: 2 },
  sectionLabel:{ fontSize: 11, fontWeight: '700', color: '#888', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 },
  errorTxt:    { color: '#E05555', textAlign: 'center', marginTop: 20, fontSize: 13 },
  fabWrap:     { position: 'absolute', bottom: 28, left: 20, right: 20 },
});