import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Platform } from 'react-native';
import type { GameWithCreator } from '../types/database.types';

interface MapViewProps {
  games: GameWithCreator[];
  userLocation: { latitude: number; longitude: number } | null;
  onGameSelect: (gameId: string) => void;
}

/**
 * MapView component for displaying games on a map.
 *
 * Note: This is a placeholder implementation. For a production app, you would integrate
 * a proper map library like:
 * - React Native: react-native-maps
 * - Web: react-leaflet, mapbox-gl-js, or Google Maps
 *
 * This implementation shows a simple visual representation of the games
 * and can be replaced with a full map integration.
 */
export const MapView: React.FC<MapViewProps> = ({ games, userLocation, onGameSelect }) => {
  const [selectedGame, setSelectedGame] = useState<string | null>(null);

  const gamesWithCoordinates = games.filter(game => game.latitude && game.longitude);

  return (
    <View style={styles.container}>
      {/* Map Placeholder */}
      <View style={styles.mapPlaceholder}>
        <Text style={styles.mapIcon}>🗺️</Text>
        <Text style={styles.mapTitle}>Map View</Text>
        <Text style={styles.mapSubtitle}>
          {gamesWithCoordinates.length} games with location data
        </Text>

        {/* Integration Instructions */}
        <View style={styles.instructions}>
          <Text style={styles.instructionsTitle}>To enable interactive maps:</Text>
          <Text style={styles.instructionsText}>
            1. For React Native: Install react-native-maps
          </Text>
          <Text style={styles.instructionsText}>
            2. For Web: Install react-leaflet or mapbox-gl
          </Text>
          <Text style={styles.instructionsText}>
            3. Configure map provider API keys
          </Text>
        </View>
      </View>

      {/* Games List (fallback) */}
      <ScrollView style={styles.gamesList}>
        <Text style={styles.gamesListTitle}>Games on Map:</Text>
        {gamesWithCoordinates.map((game) => (
          <View key={game.id} style={styles.gameItem}>
            <View style={styles.pin}>
              <Text style={styles.pinText}>📍</Text>
            </View>
            <View style={styles.gameInfo}>
              <Text style={styles.gameTitle}>{game.title}</Text>
              <Text style={styles.gameLocation}>{game.location}</Text>
              <Text style={styles.gameCoords}>
                {game.latitude?.toFixed(6)}, {game.longitude?.toFixed(6)}
              </Text>
            </View>
          </View>
        ))}

        {gamesWithCoordinates.length === 0 && (
          <Text style={styles.emptyText}>
            No games with location coordinates found
          </Text>
        )}
      </ScrollView>
    </View>
  );
};

/**
 * Example implementation with react-native-maps (commented out):
 *
 * import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
 *
 * export const GameMapView: React.FC<MapViewProps> = ({ games, userLocation, onGameSelect }) => {
 *   const gamesWithCoords = games.filter(g => g.latitude && g.longitude);
 *
 *   const initialRegion = userLocation || gamesWithCoords[0] || {
 *     latitude: 37.78825,
 *     longitude: -122.4324,
 *     latitudeDelta: 0.0922,
 *     longitudeDelta: 0.0421,
 *   };
 *
 *   return (
 *     <MapView
 *       provider={PROVIDER_GOOGLE}
 *       style={styles.map}
 *       initialRegion={initialRegion}
 *     >
 *       {userLocation && (
 *         <Marker
 *           coordinate={userLocation}
 *           title="Your Location"
 *           pinColor="blue"
 *         />
 *       )}
 *
 *       {gamesWithCoords.map((game) => (
 *         <Marker
 *           key={game.id}
 *           coordinate={{
 *             latitude: game.latitude!,
 *             longitude: game.longitude!,
 *           }}
 *           title={game.title}
 *           description={game.location}
 *           onPress={() => onGameSelect(game.id)}
 *         />
 *       ))}
 *     </MapView>
 *   );
 * };
 */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  mapPlaceholder: {
    height: 300,
    backgroundColor: '#e3f2fd',
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    padding: 20,
  },
  mapIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  mapTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
    marginBottom: 8,
  },
  mapSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
  },
  instructions: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    width: '100%',
    maxWidth: 400,
  },
  instructionsTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#333',
    marginBottom: 8,
  },
  instructionsText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  gamesList: {
    flex: 1,
    padding: 16,
  },
  gamesListTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 12,
  },
  gameItem: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  pin: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pinText: {
    fontSize: 24,
  },
  gameInfo: {
    flex: 1,
  },
  gameTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  gameLocation: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  gameCoords: {
    fontSize: 11,
    color: '#999',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 20,
  },
});
