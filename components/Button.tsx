import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  TextStyle,
  StyleProp
} from 'react-native';

interface ButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  isLoading?: boolean;
  disabled?: boolean;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}

const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  isLoading,
  disabled,
  onPress,
  style,
}) => {
  const getVariantStyles = (): { container: ViewStyle; text: TextStyle } => {
    switch (variant) {
      case 'primary':
        return {
          container: styles.primary,
          text: styles.primaryText,
        };
      case 'secondary':
        return {
          container: styles.secondary,
          text: styles.secondaryText,
        };
      case 'outline':
        return {
          container: styles.outline,
          text: styles.outlineText,
        };
      case 'ghost':
        return {
          container: styles.ghost,
          text: styles.ghostText,
        };
      default:
        return {
          container: styles.primary,
          text: styles.primaryText,
        };
    }
  };

  const variantStyles = getVariantStyles();

  return (
    <TouchableOpacity
      style={[
        styles.base,
        variantStyles.container,
        (isLoading || disabled) && styles.disabled,
        style
      ]}
      disabled={isLoading || disabled}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {isLoading ? (
        <ActivityIndicator color={variant === 'primary' ? '#fff' : '#5D4037'} size="small" />
      ) : (
        typeof children === 'string' ? (
          <Text style={[styles.text, variantStyles.text]}>{children}</Text>
        ) : (
          children
        )
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  text: {
    fontWeight: '600',
    fontSize: 14,
  },
  disabled: {
    opacity: 0.6,
  },
  // Primary
  primary: {
    backgroundColor: '#5D4037',
    shadowColor: '#5D4037',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryText: {
    color: '#fff',
  },
  // Secondary
  secondary: {
    backgroundColor: '#D7CCC8',
  },
  secondaryText: {
    color: '#3E2723',
  },
  // Outline
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#5D4037',
  },
  outlineText: {
    color: '#5D4037',
  },
  // Ghost
  ghost: {
    backgroundColor: 'transparent',
  },
  ghostText: {
    color: '#5D4037',
  },
});

export default Button;