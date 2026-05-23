import React, { useState } from 'react';
import { View, TextInput, Text, Pressable, StyleSheet, TextInputProps, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Radii, Spacing, Typography } from '@/constants/theme';

type InputProps = TextInputProps & {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  containerStyle?: ViewStyle;
  isPassword?: boolean;
};

export function Input({
  label,
  error,
  leftIcon,
  containerStyle,
  isPassword = false,
  ...props
}: InputProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [focused, setFocused] = useState(false);

  return (
    <View style={[styles.container, containerStyle]}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View style={[styles.inputWrapper, focused && styles.focused, error ? styles.errorBorder : null]}>
        {leftIcon ? <View style={styles.leftIcon}>{leftIcon}</View> : null}
        <TextInput
          style={[styles.input, leftIcon ? styles.inputWithIcon : null]}
          placeholderTextColor={Colors.placeholder}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          secureTextEntry={isPassword && !showPassword}
          {...props}
        />
        {isPassword ? (
          <Pressable onPress={() => setShowPassword((p) => !p)} style={styles.eyeBtn}>
            <Ionicons
              name={showPassword ? 'eye-off' : 'eye'}
              size={20}
              color={Colors.textSecondary}
            />
          </Pressable>
        ) : null}
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: Spacing.md },
  label: {
    fontSize: Typography.fontSizeSM,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
    fontWeight: Typography.fontWeightMedium,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.inputBg,
    borderRadius: Radii.md,
    borderWidth: 1.5,
    borderColor: 'transparent',
    height: 52,
  },
  focused: { borderColor: Colors.primary },
  errorBorder: { borderColor: Colors.error },
  leftIcon: { paddingLeft: Spacing.md },
  input: {
    flex: 1,
    paddingHorizontal: Spacing.md,
    fontSize: Typography.fontSizeMD,
    color: Colors.textPrimary,
  },
  inputWithIcon: { paddingLeft: Spacing.sm },
  eyeBtn: { padding: Spacing.md },
  error: {
    fontSize: Typography.fontSizeXS,
    color: Colors.error,
    marginTop: Spacing.xs,
  },
});
