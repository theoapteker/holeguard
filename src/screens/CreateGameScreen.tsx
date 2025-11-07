import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Location from 'expo-location';
import { createClient } from '@supabase/supabase-js';
import type { Database, GameInsert, GameParticipantInsert } from '../types/database.types';
import type { SkillLevelType } from '../types/database.types';

// Initialize Supabase client
// Note: Replace with your actual Supabase URL and anon key
const supabase = createClient<Database>(
  process.env.EXPO_PUBLIC_SUPABASE_URL || '',
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || ''
);

interface CreateGameScreenProps {
  navigation: any; // Replace with proper navigation type from @react-navigation/native
}

interface FormErrors {
  title?: string;
  location?: string;
  poolAddress?: string;
  dateTime?: string;
  maxPlayers?: string;
}

const SKILL_LEVELS: { label: string; value: SkillLevelType | null }[] = [
  { label: 'Any Skill Level', value: null },
  { label: 'Beginner+', value: 'beginner' },
  { label: 'Intermediate+', value: 'intermediate' },
  { label: 'Advanced+', value: 'advanced' },
  { label: 'Pro Only', value: 'pro' },
];

export default function CreateGameScreen({ navigation }: CreateGameScreenProps) {
  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [poolAddress, setPoolAddress] = useState('');
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date(Date.now() + 86400000)); // Default to tomorrow
  const [selectedTime, setSelectedTime] = useState(new Date());
  const [maxPlayers, setMaxPlayers] = useState('12');
  const [skillLevel, setSkillLevel] = useState<SkillLevelType | null>(null);

  // UI state
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  // Get user's current location
  const handleUseMyLocation = async () => {
    try {
      setLoadingLocation(true);

      // Request location permissions
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== 'granted') {
        Alert.alert(
          'Permission Denied',
          'Location permission is required to use this feature.'
        );
        return;
      }

      // Get current location
      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      setLatitude(currentLocation.coords.latitude);
      setLongitude(currentLocation.coords.longitude);

      // Reverse geocode to get address
      const [address] = await Location.reverseGeocodeAsync({
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
      });

      if (address) {
        const formattedAddress = [
          address.streetNumber,
          address.street,
          address.city,
          address.region,
          address.postalCode,
        ]
          .filter(Boolean)
          .join(', ');

        if (formattedAddress) {
          setPoolAddress(formattedAddress);
        }

        if (address.city) {
          setLocation(address.city);
        }
      }

      Alert.alert('Success', 'Location obtained successfully!');
    } catch (error) {
      console.error('Error getting location:', error);
      Alert.alert('Error', 'Failed to get your location. Please enter it manually.');
    } finally {
      setLoadingLocation(false);
    }
  };

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!title.trim()) {
      newErrors.title = 'Title is required';
    } else if (title.length > 255) {
      newErrors.title = 'Title must be less than 255 characters';
    }

    if (!location.trim()) {
      newErrors.location = 'Location/pool name is required';
    }

    if (!poolAddress.trim()) {
      newErrors.poolAddress = 'Pool address is required';
    }

    const maxPlayersNum = parseInt(maxPlayers, 10);
    if (isNaN(maxPlayersNum) || maxPlayersNum < 1 || maxPlayersNum > 30) {
      newErrors.maxPlayers = 'Max players must be between 1 and 30';
    }

    // Combine date and time
    const gameDateTime = new Date(selectedDate);
    gameDateTime.setHours(selectedTime.getHours());
    gameDateTime.setMinutes(selectedTime.getMinutes());

    if (gameDateTime <= new Date()) {
      newErrors.dateTime = 'Game date and time must be in the future';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleCreateGame = async () => {
    if (!validateForm()) {
      Alert.alert('Validation Error', 'Please fix the errors in the form.');
      return;
    }

    try {
      setLoading(true);

      // Get current user
      const { data: { user }, error: authError } = await supabase.auth.getUser();

      if (authError || !user) {
        Alert.alert('Error', 'You must be logged in to create a game.');
        return;
      }

      // Combine date and time
      const gameDateTime = new Date(selectedDate);
      gameDateTime.setHours(selectedTime.getHours());
      gameDateTime.setMinutes(selectedTime.getMinutes());

      // Create game data
      const gameData: GameInsert = {
        created_by: user.id,
        title: title.trim(),
        description: description.trim() || null,
        location: location.trim(),
        pool_address: poolAddress.trim(),
        latitude,
        longitude,
        date_time: gameDateTime.toISOString(),
        max_players: parseInt(maxPlayers, 10),
        skill_level_required: skillLevel,
        status: 'open',
      };

      // Insert game into database
      const { data: newGame, error: gameError } = await supabase
        .from('games')
        .insert(gameData)
        .select()
        .single();

      if (gameError) {
        console.error('Error creating game:', gameError);
        Alert.alert('Error', 'Failed to create game. Please try again.');
        return;
      }

      // Auto-join host to the game
      const participantData: GameParticipantInsert = {
        game_id: newGame.id,
        player_id: user.id,
        status: 'confirmed',
      };

      const { error: participantError } = await supabase
        .from('game_participants')
        .insert(participantData);

      if (participantError) {
        console.error('Error joining game:', participantError);
        // Don't fail the whole operation if auto-join fails
        Alert.alert(
          'Game Created',
          'Game created successfully, but failed to auto-join. You can join manually from the game details.'
        );
      } else {
        Alert.alert(
          'Success!',
          `Your game "${title}" has been created and you've been added as a participant.`,
          [
            {
              text: 'OK',
              onPress: () => navigation.goBack(),
            },
          ]
        );
      }

      // Navigate back to home/feed
      navigation.goBack();
    } catch (error) {
      console.error('Unexpected error:', error);
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle date change
  const onDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setSelectedDate(selectedDate);
    }
  };

  // Handle time change
  const onTimeChange = (event: any, selectedTime?: Date) => {
    setShowTimePicker(Platform.OS === 'ios');
    if (selectedTime) {
      setSelectedTime(selectedTime);
    }
  };

  // Format date for display
  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Format time for display
  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Create Pickup Game</Text>
        <Text style={styles.subtitle}>
          Set up a new water polo game and invite players to join
        </Text>
      </View>

      {/* Game Details Section */}
      <View style={styles.section}>
        <Text style={styles.sectionHeader}>Game Details</Text>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>
            Game Title <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={[styles.input, errors.title && styles.inputError]}
            placeholder="e.g., Tuesday Night Pickup"
            value={title}
            onChangeText={setTitle}
            maxLength={255}
          />
          {errors.title && <Text style={styles.errorText}>{errors.title}</Text>}
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Description (Optional)</Text>
          <TextInput
            style={[styles.textArea, errors.description && styles.inputError]}
            placeholder="Add any additional details about the game..."
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>
      </View>

      {/* Location Section */}
      <View style={styles.section}>
        <Text style={styles.sectionHeader}>Location</Text>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>
            Pool/Location Name <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={[styles.input, errors.location && styles.inputError]}
            placeholder="e.g., Downtown Community Pool"
            value={location}
            onChangeText={setLocation}
          />
          {errors.location && <Text style={styles.errorText}>{errors.location}</Text>}
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>
            Pool Address <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={[styles.input, errors.poolAddress && styles.inputError]}
            placeholder="123 Main St, City, State"
            value={poolAddress}
            onChangeText={setPoolAddress}
            multiline
          />
          {errors.poolAddress && <Text style={styles.errorText}>{errors.poolAddress}</Text>}
        </View>

        <TouchableOpacity
          style={styles.locationButton}
          onPress={handleUseMyLocation}
          disabled={loadingLocation}
        >
          {loadingLocation ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Text style={styles.locationButtonText}>📍 Use My Location</Text>
            </>
          )}
        </TouchableOpacity>

        {latitude && longitude && (
          <Text style={styles.coordsText}>
            Coordinates: {latitude.toFixed(6)}, {longitude.toFixed(6)}
          </Text>
        )}
      </View>

      {/* Date & Time Section */}
      <View style={styles.section}>
        <Text style={styles.sectionHeader}>Date & Time</Text>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>
            Date <Text style={styles.required}>*</Text>
          </Text>
          <TouchableOpacity
            style={[styles.pickerButton, errors.dateTime && styles.inputError]}
            onPress={() => setShowDatePicker(true)}
          >
            <Text style={styles.pickerButtonText}>{formatDate(selectedDate)}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>
            Time <Text style={styles.required}>*</Text>
          </Text>
          <TouchableOpacity
            style={[styles.pickerButton, errors.dateTime && styles.inputError]}
            onPress={() => setShowTimePicker(true)}
          >
            <Text style={styles.pickerButtonText}>{formatTime(selectedTime)}</Text>
          </TouchableOpacity>
          {errors.dateTime && <Text style={styles.errorText}>{errors.dateTime}</Text>}
        </View>

        {showDatePicker && (
          <DateTimePicker
            value={selectedDate}
            mode="date"
            display="default"
            onChange={onDateChange}
            minimumDate={new Date()}
          />
        )}

        {showTimePicker && (
          <DateTimePicker
            value={selectedTime}
            mode="time"
            display="default"
            onChange={onTimeChange}
          />
        )}
      </View>

      {/* Game Settings Section */}
      <View style={styles.section}>
        <Text style={styles.sectionHeader}>Game Settings</Text>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>
            Max Players <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={[styles.input, errors.maxPlayers && styles.inputError]}
            placeholder="12"
            value={maxPlayers}
            onChangeText={setMaxPlayers}
            keyboardType="number-pad"
            maxLength={2}
          />
          <Text style={styles.helperText}>Must be between 1 and 30</Text>
          {errors.maxPlayers && <Text style={styles.errorText}>{errors.maxPlayers}</Text>}
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Skill Level Requirement</Text>
          <View style={styles.skillLevelContainer}>
            {SKILL_LEVELS.map((level) => (
              <TouchableOpacity
                key={level.label}
                style={[
                  styles.skillLevelButton,
                  skillLevel === level.value && styles.skillLevelButtonActive,
                ]}
                onPress={() => setSkillLevel(level.value)}
              >
                <Text
                  style={[
                    styles.skillLevelButtonText,
                    skillLevel === level.value && styles.skillLevelButtonTextActive,
                  ]}
                >
                  {level.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>

      {/* Create Button */}
      <TouchableOpacity
        style={[styles.createButton, loading && styles.createButtonDisabled]}
        onPress={handleCreateGame}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.createButtonText}>Create Game</Text>
        )}
      </TouchableOpacity>

      {/* Cancel Button */}
      <TouchableOpacity
        style={styles.cancelButton}
        onPress={() => navigation.goBack()}
        disabled={loading}
      >
        <Text style={styles.cancelButtonText}>Cancel</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    lineHeight: 22,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    paddingBottom: 8,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  required: {
    color: '#e74c3c',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
    color: '#1a1a1a',
  },
  textArea: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
    color: '#1a1a1a',
    minHeight: 100,
  },
  inputError: {
    borderColor: '#e74c3c',
  },
  errorText: {
    color: '#e74c3c',
    fontSize: 12,
    marginTop: 4,
  },
  helperText: {
    color: '#999',
    fontSize: 12,
    marginTop: 4,
  },
  locationButton: {
    backgroundColor: '#3498db',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  locationButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  coordsText: {
    fontSize: 12,
    color: '#27ae60',
    marginTop: 8,
    textAlign: 'center',
  },
  pickerButton: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#fff',
  },
  pickerButtonText: {
    fontSize: 16,
    color: '#1a1a1a',
  },
  skillLevelContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  skillLevelButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
  },
  skillLevelButtonActive: {
    backgroundColor: '#3498db',
    borderColor: '#3498db',
  },
  skillLevelButtonText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  skillLevelButtonTextActive: {
    color: '#fff',
  },
  createButton: {
    backgroundColor: '#27ae60',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#27ae60',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  createButtonDisabled: {
    backgroundColor: '#95a5a6',
    shadowOpacity: 0.1,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  cancelButton: {
    padding: 16,
    alignItems: 'center',
    marginTop: 12,
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
});
