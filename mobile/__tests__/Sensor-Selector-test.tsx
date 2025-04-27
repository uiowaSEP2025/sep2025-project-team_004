import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

// Define sensor type for TypeScript
interface Sensor {
  id: string;
  name: string;
  type: string;
  location: string;
}

// Create a simple SensorSelector component for testing
const SensorSelector = () => {
  const [selectedSensor, setSelectedSensor] = React.useState<Sensor | null>(null);
  
  // Sample sensor data for testing
  const sensors: Sensor[] = [
    { id: '1', name: 'Temperature Sensor', type: 'temperature', location: 'Living Room' },
    { id: '2', name: 'Humidity Sensor', type: 'humidity', location: 'Bedroom' },
    { id: '3', name: 'Motion Detector', type: 'motion', location: 'Entrance' },
  ];

  return (
    <View testID="sensor-selector-container">
      <Text testID="page-title">Select a Sensor</Text>
      
      {selectedSensor && (
        <View testID="selected-sensor">
          <Text>Selected: {selectedSensor.name}</Text>
          <Text>Type: {selectedSensor.type}</Text>
          <Text>Location: {selectedSensor.location}</Text>
        </View>
      )}
      
      <View testID="sensors-list">
        {sensors.map(sensor => (
          <TouchableOpacity
            key={sensor.id}
            testID={`sensor-item-${sensor.id}`}
            onPress={() => setSelectedSensor(sensor)}
          >
            <View style={styles.sensorCard}>
              <Text testID={`sensor-name-${sensor.id}`}>{sensor.name}</Text>
              <Text testID={`sensor-type-${sensor.id}`}>{sensor.type}</Text>
              <Text testID={`sensor-location-${sensor.id}`}>{sensor.location}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

// Mock styles
const styles = StyleSheet.create({
  sensorCard: {
    padding: 16,
    marginVertical: 8,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  }
});

describe('SensorSelector', () => {
  it('renders the sensor selector page with title', () => {
    const { getByTestId } = render(<SensorSelector />);
    
    expect(getByTestId('sensor-selector-container')).toBeTruthy();
    expect(getByTestId('page-title')).toBeTruthy();
  });
  
  it('renders a list of sensors', () => {
    const { getByTestId } = render(<SensorSelector />);
    
    // Check if the sensors list exists
    expect(getByTestId('sensors-list')).toBeTruthy();
    
    // Check if sensor items exist
    expect(getByTestId('sensor-item-1')).toBeTruthy();
    expect(getByTestId('sensor-item-2')).toBeTruthy();
    expect(getByTestId('sensor-item-3')).toBeTruthy();
  });
  
  it('displays correct sensor information', () => {
    const { getByTestId, getByText } = render(<SensorSelector />);
    
    // Check sensor 1 details
    expect(getByTestId('sensor-name-1')).toBeTruthy();
    expect(getByTestId('sensor-type-1')).toBeTruthy();
    expect(getByTestId('sensor-location-1')).toBeTruthy();
    
    // Check text content
    expect(getByText('Temperature Sensor')).toBeTruthy();
    expect(getByText('temperature')).toBeTruthy();
    expect(getByText('Living Room')).toBeTruthy();
  });
  
  it('selects a sensor when pressed', () => {
    const { getByTestId, queryByTestId, getByText } = render(<SensorSelector />);
    
    // Initially, no sensor is selected
    expect(queryByTestId('selected-sensor')).toBeNull();
    
    // Press the first sensor
    fireEvent.press(getByTestId('sensor-item-1'));
    
    // Now a sensor should be selected and displayed
    expect(getByTestId('selected-sensor')).toBeTruthy();
    expect(getByText('Selected: Temperature Sensor')).toBeTruthy();
    expect(getByText('Type: temperature')).toBeTruthy();
    expect(getByText('Location: Living Room')).toBeTruthy();
  });
});
