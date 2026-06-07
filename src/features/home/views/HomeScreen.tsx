import React from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../auth/contexts/AuthContext';
import { useHomeViewModel } from '../viewmodels/useHomeViewModel';
import { EmptyState, FloatingButton, WorkoutCard } from '../components/WorkoutComponents';

interface Props { navigation: any }

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Bom dia';
  if (hour < 18) return 'Boa tarde';
  return 'Boa noite';
}

function getFirstName(name: string) {
  return name.trim().split(/\s+/)[0] || 'Usuário';
}

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const initials = parts.slice(0, 2).map(part => part[0]?.toUpperCase()).join('');
  return initials || 'US';
}

export default function HomeScreen({ navigation }: Props) {
  const { user, logout } = useAuth();
  const { workouts, loading, error, deleteWorkout, refresh } = useHomeViewModel();
  const [refreshing, setRefreshing] = React.useState(false);

  useFocusEffect(
    React.useCallback(() => {
      refresh();
    }, [refresh]),
  );

  async function onRefresh() {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }

  function confirmDeleteWorkout(workoutId: string) {
    Alert.alert('Excluir treino?', 'Esta ação não pode ser desfeita.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: async () => {
          await deleteWorkout(workoutId);
          Alert.alert('Sucesso', 'Treino excluído com sucesso.');
        },
      },
    ]);
  }

  const userName = user?.username || 'Usuário';
  return (
    <SafeAreaView style={s.safe}>
      <View style={s.header}>
          <View style={s.headerTop}>
            <View style={s.logoRow}>
            <Image
              source={require('../../../img/ChatGPT Image 17 de abr. de 2026, 17_58_30 (1).png')}
              style={s.logoCircle}
              resizeMode="cover"
            />
            <Text style={s.logoText}>Aura</Text>
          </View>
          <TouchableOpacity style={s.avatar} onPress={logout} activeOpacity={0.75}>
            <Text style={s.avatarTxt}>{getInitials(userName)}</Text>
          </TouchableOpacity>
        </View>
        <Text style={s.greeting}>{getGreeting()}, {getFirstName(userName)}</Text>
        <Text style={s.greetingSub}>Pronto para treinar hoje?</Text>
      </View>

      <ScrollView
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#4A6CF7" />
        }
      >
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
              onStart={() => navigation.navigate('ChooseExercise', { workoutId: w.id })}
              onEdit={() => navigation.navigate('EditWorkout', { workoutId: w.id })}
              onDelete={() => confirmDeleteWorkout(w.id)}
            />
          ))
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

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
  logoCircle:  { width: 32, height: 32, borderRadius: 16, backgroundColor: '#fff' },
  logoText:    { fontSize: 18, fontWeight: '700', color: '#4A6CF7' },
  avatar:      { width: 36, height: 36, borderRadius: 18, backgroundColor: '#EEF0FE', alignItems: 'center', justifyContent: 'center' },
  avatarTxt:   { fontSize: 12, fontWeight: '700', color: '#4A6CF7' },
  greeting:    { fontSize: 18, fontWeight: '700', color: '#1a1a2e' },
  greetingSub: { fontSize: 13, color: '#888', marginTop: 2 },
  scroll:      { padding: 20 },
  sectionLabel:{ fontSize: 11, fontWeight: '700', color: '#888', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 },
  errorTxt:    { color: '#E05555', textAlign: 'center', marginTop: 20, fontSize: 13 },
  fabWrap:     { position: 'absolute', bottom: 28, left: 20, right: 20 },
});
