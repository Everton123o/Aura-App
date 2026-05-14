import React from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRegisterViewModel } from '../viewmodels/useRegisterViewModel';
import { AuthInput, AuthButton } from '../../../components/AuthComponents';

interface Props { navigation: any }

export default function RegisterScreen({ navigation }: Props) {
  const vm = useRegisterViewModel();

  return (
    <LinearGradient colors={['#5B7BFF', '#3A5BEF']} style={s.gradient}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={s.flex}>
        <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
          <View style={s.card}>

            <View style={s.iconCircle}>
              <Ionicons name="barbell-outline" size={30} color="#fff" />
            </View>

            <Text style={s.title}>Create Account</Text>

            {vm.errors.general
              ? <Text style={s.generalError}>{vm.errors.general}</Text>
              : null}

            <AuthInput
              icon={<Ionicons name="person-outline" size={18} color="#999" />}
              placeholder="User name"
              value={vm.username}
              onChangeText={vm.setUsername}
              error={vm.errors.username}
            />
            <AuthInput
              icon={<Ionicons name="mail-outline" size={18} color="#999" />}
              placeholder="Email"
              value={vm.email}
              onChangeText={vm.setEmail}
              keyboardType="email-address"
              error={vm.errors.email}
            />
            <AuthInput
              icon={<Ionicons name="lock-closed-outline" size={18} color="#999" />}
              placeholder="Password"
              value={vm.password}
              onChangeText={vm.setPassword}
              secureTextEntry
              error={vm.errors.password}
            />
            <AuthInput
              icon={<Ionicons name="lock-closed-outline" size={18} color="#999" />}
              placeholder="Confirm Password"
              value={vm.confirmPassword}
              onChangeText={vm.setConfirmPassword}
              secureTextEntry
              error={vm.errors.confirmPassword}
            />

            <AuthButton
              label="Sign Up"
              onPress={() => vm.handleRegister(() => navigation.replace('Home'))}
              loading={vm.loading}
            />

            <View style={s.linkRow}>
              <Text style={s.linkText}>already have an account? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                <Text style={s.linkHighlight}>Login</Text>
              </TouchableOpacity>
            </View>

          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const s = StyleSheet.create({
  gradient:     { flex: 1 },
  flex:         { flex: 1 },
  scroll:       { flexGrow: 1, justifyContent: 'center', alignItems: 'center', padding: 28 },
  card:         { backgroundColor: '#fff', borderRadius: 20, padding: 28, width: '100%', maxWidth: 400, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 12, elevation: 6 },
  iconCircle:   { width: 64, height: 64, borderRadius: 32, backgroundColor: '#4A6CF7', alignSelf: 'center', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  title:        { fontSize: 26, fontWeight: '700', color: '#1a1a2e', textAlign: 'center', marginBottom: 24 },
  generalError: { fontSize: 12, color: '#e05555', textAlign: 'center', marginBottom: 12 },
  linkRow:      { flexDirection: 'row', justifyContent: 'center', marginTop: 20 },
  linkText:     { fontSize: 13, color: '#555' },
  linkHighlight:{ fontSize: 13, color: '#4A6CF7', fontWeight: '600' },
});