import React from 'react';
import {
  View, TextInput, Text, TouchableOpacity,
  ActivityIndicator, StyleSheet, TextInputProps,
} from 'react-native';

// ─── AuthInput ────────────────────────────────────────────────────────────────
interface AuthInputProps extends TextInputProps {
  icon: React.ReactNode;
  error?: string;
}

export function AuthInput({ icon, error, style, ...rest }: AuthInputProps) {
  return (
    <View style={s.wrapper}>
      <View style={s.row}>
        <View style={s.iconWrap}>{icon}</View>
        <TextInput
          style={[s.input, style]}
          placeholderTextColor="#999"
          autoCapitalize="none"
          {...rest}
        />
      </View>
      <View style={[s.underline, error ? s.underlineError : null]} />
      {error ? <Text style={s.errorText}>{error}</Text> : null}
    </View>
  );
}

// ─── AuthButton ───────────────────────────────────────────────────────────────
interface AuthButtonProps {
  label: string;
  onPress: () => void;
  loading?: boolean;
}

export function AuthButton({ label, onPress, loading }: AuthButtonProps) {
  return (
    <TouchableOpacity style={b.btn} onPress={onPress} disabled={loading} activeOpacity={0.8}>
      {loading
        ? <ActivityIndicator color="#fff" />
        : <Text style={b.label}>{label}</Text>}
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  wrapper:        { marginBottom: 18 },
  row:            { flexDirection: 'row', alignItems: 'center' },
  iconWrap:       { marginRight: 10 },
  input:          { flex: 1, fontSize: 14, color: '#222', paddingVertical: 6 },
  underline:      { height: 1, backgroundColor: '#ccc', marginTop: 2 },
  underlineError: { backgroundColor: '#e05555' },
  errorText:      { fontSize: 11, color: '#e05555', marginTop: 4 },
});

const b = StyleSheet.create({
  btn:   { backgroundColor: '#4A6CF7', borderRadius: 30, paddingVertical: 13, alignItems: 'center', marginTop: 10 },
  label: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
