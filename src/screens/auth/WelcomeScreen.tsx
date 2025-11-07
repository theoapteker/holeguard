import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { theme } from '../../styles/theme';

type AuthStackParamList = {
  Welcome: undefined;
  SignUp: undefined;
  Login: undefined;
};

type WelcomeScreenProps = {
  navigation: NativeStackNavigationProp<AuthStackParamList, 'Welcome'>;
};

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.primary} />
      <View style={styles.content}>
        {/* Logo/Branding Section */}
        <View style={styles.brandingContainer}>
          <View style={styles.logoCircle}>
            <Text style={styles.logoEmoji}>🤽</Text>
          </View>
          <Text style={styles.appName}>WaterPolo Connect</Text>
          <Text style={styles.tagline}>
            Find games. Track stats.{'\n'}Build your water polo community.
          </Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionContainer}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => navigation.navigate('SignUp')}
            activeOpacity={0.8}
          >
            <Text style={styles.primaryButtonText}>Get Started</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => navigation.navigate('Login')}
            activeOpacity={0.8}
          >
            <Text style={styles.secondaryButtonText}>
              Already have an account? <Text style={styles.linkText}>Sign In</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.primary,
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.xl,
    paddingTop: theme.spacing.xxl,
    paddingBottom: theme.spacing.xl,
  },
  brandingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  logoEmoji: {
    fontSize: 64,
  },
  appName: {
    fontSize: theme.fontSize.xxxl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textLight,
    marginBottom: theme.spacing.md,
    textAlign: 'center',
  },
  tagline: {
    fontSize: theme.fontSize.lg,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    lineHeight: 28,
    marginTop: theme.spacing.sm,
  },
  actionContainer: {
    gap: theme.spacing.md,
  },
  primaryButton: {
    backgroundColor: theme.colors.textLight,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.xl,
    borderRadius: theme.borderRadius.lg,
    alignItems: 'center',
    ...theme.shadows.md,
  },
  primaryButtonText: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.primary,
  },
  secondaryButton: {
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.xl,
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontSize: theme.fontSize.md,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  linkText: {
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.textLight,
    textDecorationLine: 'underline',
  },
});
