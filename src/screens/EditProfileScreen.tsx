/**
 * EditProfileScreen - Edit user's own profile
 *
 * Features:
 * - Form to update all profile fields
 * - Avatar upload with image picker
 * - Real-time validation
 * - Save/Cancel buttons
 * - Loading states
 * - Error handling
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { supabase } from '../services/supabase';
import type {
  Profile,
  ProfileUpdate,
  PositionType,
  SkillLevelType,
} from '../types/database.types';

interface EditProfileScreenProps {
  route?: {
    params?: {
      profile?: Profile;
    };
  };
  navigation?: any;
}

interface FormData {
  username: string;
  full_name: string;
  position: PositionType | null;
  skill_level: SkillLevelType | null;
  location: string;
  bio: string;
  avatar_url: string;
}

interface ValidationErrors {
  username?: string;
  full_name?: string;
  position?: string;
  skill_level?: string;
  location?: string;
  bio?: string;
}

const POSITION_OPTIONS: { value: PositionType; label: string }[] = [
  { value: 'goalie', label: 'Goalie' },
  { value: 'driver', label: 'Driver' },
  { value: 'wing', label: 'Wing' },
  { value: 'center', label: 'Center' },
];

const SKILL_LEVEL_OPTIONS: { value: SkillLevelType; label: string }[] = [
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
  { value: 'pro', label: 'Pro' },
];

export default function EditProfileScreen({ route, navigation }: EditProfileScreenProps) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [formData, setFormData] = useState<FormData>({
    username: '',
    full_name: '',
    position: null,
    skill_level: null,
    location: '',
    bio: '',
    avatar_url: '',
  });
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        throw new Error('No authenticated user');
      }

      // Fetch profile
      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;

      setProfile(profileData);
      setFormData({
        username: profileData.username,
        full_name: profileData.full_name,
        position: profileData.position,
        skill_level: profileData.skill_level,
        location: profileData.location || '',
        bio: profileData.bio || '',
        avatar_url: profileData.avatar_url || '',
      });
    } catch (error) {
      console.error('Error loading profile:', error);
      Alert.alert('Error', 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: ValidationErrors = {};

    // Username validation
    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
    } else if (!/^[a-zA-Z0-9_]{3,30}$/.test(formData.username)) {
      newErrors.username = 'Username must be 3-30 characters (alphanumeric and underscore only)';
    }

    // Full name validation
    if (!formData.full_name.trim()) {
      newErrors.full_name = 'Full name is required';
    } else if (formData.full_name.trim().length < 2) {
      newErrors.full_name = 'Full name must be at least 2 characters';
    }

    // Bio validation (optional but has max length)
    if (formData.bio && formData.bio.length > 500) {
      newErrors.bio = 'Bio must be less than 500 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setSaving(true);

      if (!profile) {
        throw new Error('No profile loaded');
      }

      const updateData: ProfileUpdate = {
        username: formData.username.trim(),
        full_name: formData.full_name.trim(),
        position: formData.position,
        skill_level: formData.skill_level,
        location: formData.location.trim() || null,
        bio: formData.bio.trim() || null,
        avatar_url: formData.avatar_url || null,
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', profile.id)
        .select()
        .single();

      if (error) {
        // Check for unique constraint violation
        if (error.code === '23505' && error.message.includes('username')) {
          setErrors({ username: 'Username already taken' });
          return;
        }
        throw error;
      }

      Alert.alert('Success', 'Profile updated successfully', [
        {
          text: 'OK',
          onPress: () => navigation?.goBack(),
        },
      ]);
    } catch (error) {
      console.error('Error saving profile:', error);
      Alert.alert('Error', 'Failed to save profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    Alert.alert(
      'Discard Changes?',
      'Are you sure you want to discard your changes?',
      [
        { text: 'Keep Editing', style: 'cancel' },
        {
          text: 'Discard',
          style: 'destructive',
          onPress: () => navigation?.goBack(),
        },
      ]
    );
  };

  const handleAvatarUpload = async () => {
    try {
      setUploadingAvatar(true);

      // Note: In a real app, you would use react-native-image-picker or expo-image-picker
      // For now, we'll show a placeholder implementation
      Alert.alert(
        'Avatar Upload',
        'This feature requires integration with:\n\n' +
        '• expo-image-picker for selecting images\n' +
        '• Supabase Storage for uploading\n\n' +
        'Implementation example:\n' +
        '1. Pick image with ImagePicker\n' +
        '2. Upload to Supabase Storage bucket "avatars"\n' +
        '3. Get public URL\n' +
        '4. Update avatar_url field',
        [
          { text: 'OK' }
        ]
      );

      // Example implementation (commented out):
      /*
      // Import: import * as ImagePicker from 'expo-image-picker';

      // Request permissions
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission denied', 'Camera roll permission is required');
        return;
      }

      // Pick image
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const image = result.assets[0];

        // Convert to blob
        const response = await fetch(image.uri);
        const blob = await response.blob();

        // Upload to Supabase Storage
        const fileExt = image.uri.split('.').pop();
        const fileName = `${profile?.id}-${Date.now()}.${fileExt}`;
        const filePath = `avatars/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(filePath, blob, {
            contentType: `image/${fileExt}`,
            upsert: true,
          });

        if (uploadError) throw uploadError;

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('avatars')
          .getPublicUrl(filePath);

        // Update form data
        setFormData({ ...formData, avatar_url: publicUrl });
      }
      */
    } catch (error) {
      console.error('Error uploading avatar:', error);
      Alert.alert('Error', 'Failed to upload avatar');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleRemoveAvatar = () => {
    Alert.alert(
      'Remove Avatar',
      'Are you sure you want to remove your avatar?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => setFormData({ ...formData, avatar_url: '' }),
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView style={styles.scrollView} keyboardShouldPersistTaps="handled">
        {/* Avatar Section */}
        <View style={styles.avatarSection}>
          <View style={styles.avatarContainer}>
            {formData.avatar_url ? (
              <Image source={{ uri: formData.avatar_url }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarPlaceholderText}>
                  {formData.full_name.charAt(0).toUpperCase() || '?'}
                </Text>
              </View>
            )}
          </View>
          <View style={styles.avatarButtons}>
            <TouchableOpacity
              style={styles.avatarButton}
              onPress={handleAvatarUpload}
              disabled={uploadingAvatar}
            >
              {uploadingAvatar ? (
                <ActivityIndicator size="small" color="#007AFF" />
              ) : (
                <Text style={styles.avatarButtonText}>
                  {formData.avatar_url ? 'Change Photo' : 'Upload Photo'}
                </Text>
              )}
            </TouchableOpacity>
            {formData.avatar_url && (
              <TouchableOpacity
                style={[styles.avatarButton, styles.avatarButtonDanger]}
                onPress={handleRemoveAvatar}
              >
                <Text style={styles.avatarButtonTextDanger}>Remove</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Form Fields */}
        <View style={styles.form}>
          {/* Username */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>
              Username <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={[styles.input, errors.username && styles.inputError]}
              value={formData.username}
              onChangeText={(text) => {
                setFormData({ ...formData, username: text });
                if (errors.username) {
                  setErrors({ ...errors, username: undefined });
                }
              }}
              placeholder="username123"
              autoCapitalize="none"
              autoCorrect={false}
            />
            {errors.username && (
              <Text style={styles.errorText}>{errors.username}</Text>
            )}
          </View>

          {/* Full Name */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>
              Full Name <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={[styles.input, errors.full_name && styles.inputError]}
              value={formData.full_name}
              onChangeText={(text) => {
                setFormData({ ...formData, full_name: text });
                if (errors.full_name) {
                  setErrors({ ...errors, full_name: undefined });
                }
              }}
              placeholder="John Doe"
              autoCapitalize="words"
            />
            {errors.full_name && (
              <Text style={styles.errorText}>{errors.full_name}</Text>
            )}
          </View>

          {/* Position */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Position</Text>
            <View style={styles.optionsContainer}>
              {POSITION_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.optionButton,
                    formData.position === option.value && styles.optionButtonActive,
                  ]}
                  onPress={() => setFormData({ ...formData, position: option.value })}
                >
                  <Text
                    style={[
                      styles.optionButtonText,
                      formData.position === option.value && styles.optionButtonTextActive,
                    ]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            {formData.position && (
              <TouchableOpacity
                style={styles.clearButton}
                onPress={() => setFormData({ ...formData, position: null })}
              >
                <Text style={styles.clearButtonText}>Clear</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Skill Level */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Skill Level</Text>
            <View style={styles.optionsContainer}>
              {SKILL_LEVEL_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.optionButton,
                    formData.skill_level === option.value && styles.optionButtonActive,
                  ]}
                  onPress={() => setFormData({ ...formData, skill_level: option.value })}
                >
                  <Text
                    style={[
                      styles.optionButtonText,
                      formData.skill_level === option.value && styles.optionButtonTextActive,
                    ]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            {formData.skill_level && (
              <TouchableOpacity
                style={styles.clearButton}
                onPress={() => setFormData({ ...formData, skill_level: null })}
              >
                <Text style={styles.clearButtonText}>Clear</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Location */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Location</Text>
            <TextInput
              style={styles.input}
              value={formData.location}
              onChangeText={(text) => setFormData({ ...formData, location: text })}
              placeholder="San Francisco, CA"
              autoCapitalize="words"
            />
          </View>

          {/* Bio */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Bio</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={formData.bio}
              onChangeText={(text) => {
                setFormData({ ...formData, bio: text });
                if (errors.bio) {
                  setErrors({ ...errors, bio: undefined });
                }
              }}
              placeholder="Tell us about yourself..."
              multiline
              numberOfLines={4}
              maxLength={500}
              textAlignVertical="top"
            />
            <Text style={styles.characterCount}>
              {formData.bio.length} / 500
            </Text>
            {errors.bio && (
              <Text style={styles.errorText}>{errors.bio}</Text>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={[styles.button, styles.cancelButton]}
          onPress={handleCancel}
          disabled={saving}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, styles.saveButton]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.saveButtonText}>Save Changes</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F7FA',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  avatarSection: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 32,
    paddingHorizontal: 24,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E8ECF1',
  },
  avatarContainer: {
    marginBottom: 16,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: '#007AFF',
  },
  avatarPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarPlaceholderText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  avatarButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  avatarButton: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#007AFF',
    backgroundColor: '#FFFFFF',
  },
  avatarButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
  },
  avatarButtonDanger: {
    borderColor: '#EF4444',
  },
  avatarButtonTextDanger: {
    fontSize: 14,
    fontWeight: '600',
    color: '#EF4444',
  },
  form: {
    padding: 24,
  },
  fieldContainer: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  required: {
    color: '#EF4444',
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1F2937',
  },
  inputError: {
    borderColor: '#EF4444',
  },
  textArea: {
    minHeight: 100,
    paddingTop: 12,
  },
  errorText: {
    fontSize: 14,
    color: '#EF4444',
    marginTop: 4,
  },
  characterCount: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 4,
    textAlign: 'right',
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
  },
  optionButtonActive: {
    borderColor: '#007AFF',
    backgroundColor: '#007AFF',
  },
  optionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  optionButtonTextActive: {
    color: '#FFFFFF',
  },
  clearButton: {
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  clearButtonText: {
    fontSize: 14,
    color: '#6B7280',
    textDecorationLine: 'underline',
  },
  actionButtons: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E8ECF1',
  },
  button: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#F3F4F6',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  saveButton: {
    backgroundColor: '#007AFF',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
