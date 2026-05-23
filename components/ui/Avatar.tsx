import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Image } from 'expo-image';
import { Colors, Typography } from '@/constants/theme';
import { getInitials } from '@/services/chatService';

type AvatarProps = {
  uri?: string | null;
  name?: string | null;
  size?: number;
  showOnline?: boolean;
  style?: ViewStyle;
};

const AVATAR_COLORS = [
  '#1A78C2', '#128C7E', '#9C27B0', '#E91E63',
  '#FF5722', '#009688', '#673AB7', '#3F51B5',
];

function getColorForName(name: string): string {
  const index = name.charCodeAt(0) % AVATAR_COLORS.length;
  return AVATAR_COLORS[index];
}

export function Avatar({ uri, name, size = 48, showOnline = false, style }: AvatarProps) {
  const initials = getInitials(name);
  const bgColor = getColorForName(name ?? '?');

  return (
    <View style={[styles.wrapper, style]}>
      {uri ? (
        <Image
          source={{ uri }}
          style={[styles.image, { width: size, height: size, borderRadius: size / 2 }]}
          contentFit="cover"
          transition={200}
        />
      ) : (
        <View
          style={[
            styles.placeholder,
            { width: size, height: size, borderRadius: size / 2, backgroundColor: bgColor },
          ]}
        >
          <Text style={[styles.initials, { fontSize: size * 0.36 }]}>{initials}</Text>
        </View>
      )}
      {showOnline ? <View style={[styles.onlineDot, { width: size * 0.26, height: size * 0.26, borderRadius: size * 0.13 }]} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { position: 'relative' },
  image: {},
  placeholder: { alignItems: 'center', justifyContent: 'center' },
  initials: { color: Colors.white, fontWeight: Typography.fontWeightBold },
  onlineDot: {
    position: 'absolute',
    bottom: 1,
    right: 1,
    backgroundColor: Colors.online,
    borderWidth: 2,
    borderColor: Colors.bgSurface,
  },
});
