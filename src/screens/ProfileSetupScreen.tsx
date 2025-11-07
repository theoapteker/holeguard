import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { Picker } from '@react-native-picker/picker';
import { supabase } from '../lib/supabase';
import type { PositionType, SkillLevelType } from '../types/database.types';
import { colors } from '../theme/colors';

interface ProfileSetupScreenProps {
  onComplete: () => void;
}

export default function ProfileSetupScreen({ onComplete }: ProfileSetupScreenProps) {
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Form fields
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [position, setPosition] = useState<PositionType | ''>('');
  const [skillLevel, setSkillLevel] = useState<SkillLevelType | ''>('');
  const [location, setLocation] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  const positions: { label: string; value: PositionType }[] = [
    { label: 'Goalie', value: 'goalie' },
    { label: 'Center', value: 'center' },
    { label: 'Driver', value: 'driver' },
    { label: 'Wing', value: 'wing' },
  ];

  const skillLevels: { label: string; value: SkillLevelType }[] = [
    { label: 'Beginner', value: 'beginner' },
    { label: 'Intermediate', value: 'intermediate' },
    { label: 'Advanced', value: 'advanced' },
    { label: 'Pro', value: 'pro' },
  ];

  const pickImage = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permissionResult.granted) {
        Alert.alert('Permission Required', 'Please allow access to your photos to upload a profile picture.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setAvatarUri(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  const uploadAvatar = async (): Promise<string | null> => {
    if (!avatarUri) return null;

    try {
      setUploading(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      const fileExt = avatarUri.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      // Fetch the image as a blob
      const response = await fetch(avatarUri);
      const blob = await response.blob();

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, blob, {
          contentType: `image/${fileExt}`,
          upsert: false,
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      setAvatarUrl(publicUrl);
      return publicUrl;
    } catch (error) {
      console.error('Error uploading avatar:', error);
      Alert.alert('Upload Error', 'Failed to upload avatar. You can add it later from settings.');
      return null;
    } finally {
      setUploading(false);
    }
  };

  const validateForm = (): boolean => {
    if (!username.trim()) {
      Alert.alert('Validation Error', 'Username is required');
      return false;
    }

    if (username.length < 3 || username.length > 30) {
      Alert.alert('Validation Error', 'Username must be between 3 and 30 characters');
      return false;
    }

    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      Alert.alert('Validation Error', 'Username can only contain letters, numbers, and underscores');
      return false;
    }

    if (!fullName.trim()) {
      Alert.alert('Validation Error', 'Full name is required');
      return false;
    }

    if (!position) {
      Alert.alert('Validation Error', 'Please select your position');
      return false;
    }

    if (!skillLevel) {
      Alert.alert('Validation Error', 'Please select your skill level');
      return false;
    }

    if (!location.trim()) {
      Alert.alert('Validation Error', 'Location is required');
      return false;
    }

    if (bio.length > 200) {
      Alert.alert('Validation Error', 'Bio must be 200 characters or less');
      return false;
    }

    return true;
  };

  const handleCompleteProfile = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      // Upload avatar if selected
      let finalAvatarUrl = avatarUrl;
      if (avatarUri && !avatarUrl) {
        finalAvatarUrl = await uploadAvatar();
      }

      // Save profile to database
      const { error } = await supabase
        .from('profiles')
        .insert({
          id: user.id,
          username: username.trim(),
          full_name: fullName.trim(),
          position: position as PositionType,
          skill_level: skillLevel as SkillLevelType,
          location: location.trim(),
          bio: bio.trim() || null,
          avatar_url: finalAvatarUrl,
        });

      if (error) {
        if (error.code === '23505') {
          Alert.alert('Username Taken', 'This username is already in use. Please choose another.');
          return;
        }
        throw error;
      }

      Alert.alert('Success', 'Profile created successfully!', [
        { text: 'OK', onPress: onComplete },
      ]);
    } catch (error) {
      console.error('Error creating profile:', error);
      Alert.alert('Error', 'Failed to create profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    Alert.alert(
      'Skip Profile Setup?',
      'You can complete your profile later from settings. Some features may be limited.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Skip', style: 'destructive', onPress: onComplete },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Complete Your Profile</Text>
          <Text style={styles.subtitle}>
            Let other players know who you are and how you play
          </Text>
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View style={styles.progressFill} />
            </View>
            <Text style={styles.progressText}>Step 1 of 1</Text>
          </View>
        </View>

        {/* Profile Card */}
        <View style={styles.card}>
          {/* Avatar Upload */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Profile Picture</Text>
            <TouchableOpacity
              style={styles.avatarContainer}
              onPress={pickImage}
              disabled={uploading}
            >
              {avatarUri ? (
                <Image source={{ uri: avatarUri }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Text style={styles.avatarPlaceholderText}>📷</Text>
                  <Text style={styles.avatarPlaceholderSubtext}>Tap to upload</Text>
                </View>
              )}
              {uploading && (
                <View style={styles.avatarLoading}>
                  <ActivityIndicator color={colors.white} />
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* Username */}
          <View style={styles.section}>
            <Text style={styles.label}>
              Username <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={styles.input}
              value={username}
              onChangeText={setUsername}
              placeholder="waterpolopro"
              autoCapitalize="none"
              autoCorrect={false}
              maxLength={30}
            />
            <Text style={styles.hint}>3-30 characters, letters, numbers, and underscores only</Text>
          </View>

          {/* Full Name */}
          <View style={styles.section}>
            <Text style={styles.label}>
              Full Name <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={styles.input}
              value={fullName}
              onChangeText={setFullName}
              placeholder="John Doe"
              autoCapitalize="words"
            />
          </View>

          {/* Position Selector */}
          <View style={styles.section}>
            <Text style={styles.label}>
              Position <Text style={styles.required}>*</Text>
            </Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={position}
                onValueChange={(value) => setPosition(value)}
                style={styles.picker}
              >
                <Picker.Item label="Select your position..." value="" />
                {positions.map((pos) => (
                  <Picker.Item key={pos.value} label={pos.label} value={pos.value} />
                ))}
              </Picker>
            </View>
          </View>

          {/* Skill Level Selector */}
          <View style={styles.section}>
            <Text style={styles.label}>
              Skill Level <Text style={styles.required}>*</Text>
            </Text>
            <View style={styles.skillLevelContainer}>
              {skillLevels.map((skill) => (
                <TouchableOpacity
                  key={skill.value}
                  style={[
                    styles.skillButton,
                    skillLevel === skill.value && styles.skillButtonActive,
                  ]}
                  onPress={() => setSkillLevel(skill.value)}
                >
                  <Text
                    style={[
                      styles.skillButtonText,
                      skillLevel === skill.value && styles.skillButtonTextActive,
                    ]}
                  >
                    {skill.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Location */}
          <View style={styles.section}>
            <Text style={styles.label}>
              Location <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={styles.input}
              value={location}
              onChangeText={setLocation}
              placeholder="San Francisco, CA"
              autoCapitalize="words"
            />
            <Text style={styles.hint}>City, State or Region</Text>
          </View>

          {/* Bio */}
          <View style={styles.section}>
            <Text style={styles.label}>
              Bio <Text style={styles.optional}>(optional)</Text>
            </Text>
            <TextInput
              style={[styles.input, styles.bioInput]}
              value={bio}
              onChangeText={setBio}
              placeholder="Tell us about yourself and your water polo journey..."
              multiline
              numberOfLines={4}
              maxLength={200}
              textAlignVertical="top"
            />
            <Text style={styles.characterCount}>{bio.length}/200</Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, styles.primaryButton]}
            onPress={handleCompleteProfile}
            disabled={loading || uploading}
          >
            {loading ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <Text style={styles.primaryButtonText}>Complete Profile</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.skipButton}
            onPress={handleSkip}
            disabled={loading || uploading}
          >
            <Text style={styles.skipButtonText}>Skip for now</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 20,
  },
  progressContainer: {
    marginTop: 12,
  },
  progressBar: {
    height: 4,
    backgroundColor: colors.gray[200],
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    width: '100%',
    backgroundColor: colors.primary,
  },
  progressText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 8,
    textAlign: 'right',
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  section: {
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  required: {
    color: colors.error,
  },
  optional: {
    color: colors.textSecondary,
    fontWeight: '400',
  },
  input: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: colors.text,
  },
  bioInput: {
    height: 100,
    paddingTop: 14,
  },
  hint: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 6,
  },
  characterCount: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 6,
    textAlign: 'right',
  },
  avatarContainer: {
    alignSelf: 'center',
    position: 'relative',
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  avatarPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.gray[100],
    borderWidth: 2,
    borderColor: colors.border,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarPlaceholderText: {
    fontSize: 32,
    marginBottom: 4,
  },
  avatarPlaceholderSubtext: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  avatarLoading: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pickerContainer: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    overflow: 'hidden',
  },
  picker: {
    height: Platform.OS === 'ios' ? 180 : 50,
  },
  skillLevelContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  skillButton: {
    flex: 1,
    minWidth: '45%',
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: 12,
    alignItems: 'center',
  },
  skillButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  skillButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  skillButtonTextActive: {
    color: colors.white,
  },
  buttonContainer: {
    marginTop: 24,
  },
  button: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 54,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.white,
  },
  skipButton: {
    marginTop: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  skipButtonText: {
    fontSize: 15,
    color: colors.textSecondary,
    fontWeight: '500',
  },
});
