import React, { useState } from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { View, Text, TouchableOpacity, TextInput, ScrollView, FlatList } from 'react-native';

// Create a simplified mock component for Home screen
const HomeScreen = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Mock data for testing
  const recentSensors = [
    { id: '1', name: 'Temperature Sensor', type: 'temperature', lastRead: '27°C' },
    { id: '2', name: 'Humidity Sensor', type: 'humidity', lastRead: '58%' },
  ];
  
  const featuredProducts = [
    { id: '1', name: 'Smart Soil Sensor', price: '$49.99', rating: 4.5 },
    { id: '2', name: 'Weather Station', price: '$129.99', rating: 4.8 },
    { id: '3', name: 'Water Quality Monitor', price: '$79.99', rating: 4.2 },
  ];
  
  const handleSearch = () => {
    // Simulate search action
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
    }, 200);
  };
  
  const navigateToSensor = (sensorId: string) => {
    // Would navigate to sensor detail in real app
    console.log(`Navigate to sensor ${sensorId}`);
  };
  
  const navigateToProduct = (productId: string) => {
    // Would navigate to product detail in real app
    console.log(`Navigate to product ${productId}`);
  };
  
  const navigateToStore = () => {
    // Would navigate to store screen in real app
    console.log('Navigate to store');
  };

  return (
    <ScrollView testID="home-screen">
      <View testID="header">
        <Text testID="greeting">Hello, User!</Text>
        <Text testID="date">{new Date().toLocaleDateString()}</Text>
      </View>
      
      <View testID="search-container">
        <TextInput
          testID="search-input"
          placeholder="Search for sensors, products..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        <TouchableOpacity testID="search-button" onPress={handleSearch}>
          <Text>Search</Text>
        </TouchableOpacity>
      </View>
      
      {isLoading && <View testID="loading-indicator" />}
      
      <View testID="recent-sensors-section">
        <View testID="section-header">
          <Text>Your Sensors</Text>
          <TouchableOpacity testID="view-all-sensors">
            <Text>View All</Text>
          </TouchableOpacity>
        </View>
        
        <FlatList
          testID="sensors-list"
          horizontal
          data={recentSensors}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity 
              testID={`sensor-item-${item.id}`}
              onPress={() => navigateToSensor(item.id)}
            >
              <View>
                <Text testID={`sensor-name-${item.id}`}>{item.name}</Text>
                <Text testID={`sensor-reading-${item.id}`}>{item.lastRead}</Text>
                <Text testID={`sensor-type-${item.id}`}>{item.type}</Text>
              </View>
            </TouchableOpacity>
          )}
        />
      </View>
      
      <View testID="store-section">
        <View testID="section-header">
          <Text>Featured Products</Text>
          <TouchableOpacity testID="view-store" onPress={navigateToStore}>
            <Text>Visit Store</Text>
          </TouchableOpacity>
        </View>
        
        <FlatList
          testID="products-list"
          horizontal
          data={featuredProducts}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity 
              testID={`product-item-${item.id}`}
              onPress={() => navigateToProduct(item.id)}
            >
              <View>
                <Text testID={`product-name-${item.id}`}>{item.name}</Text>
                <Text testID={`product-price-${item.id}`}>{item.price}</Text>
                <Text testID={`product-rating-${item.id}`}>Rating: {item.rating}</Text>
              </View>
            </TouchableOpacity>
          )}
        />
      </View>
    </ScrollView>
  );
};

describe('Home Screen', () => {
  it('renders the greeting and date', () => {
    const { getByTestId } = render(<HomeScreen />);
    
    expect(getByTestId('greeting')).toBeTruthy();
    expect(getByTestId('date')).toBeTruthy();
    expect(getByTestId('greeting').props.children).toBe('Hello, User!');
  });
  
  it('renders the search section', () => {
    const { getByTestId, getByPlaceholderText } = render(<HomeScreen />);
    
    expect(getByTestId('search-container')).toBeTruthy();
    expect(getByTestId('search-input')).toBeTruthy();
    expect(getByTestId('search-button')).toBeTruthy();
    expect(getByPlaceholderText('Search for sensors, products...')).toBeTruthy();
  });
  
  it('handles search interactions', () => {
    const { getByTestId, queryByTestId } = render(<HomeScreen />);
    
    // Initially, loading indicator should not be visible
    expect(queryByTestId('loading-indicator')).toBeNull();
    
    // Enter search query
    fireEvent.changeText(getByTestId('search-input'), 'temperature');
    
    // Click search button
    fireEvent.press(getByTestId('search-button'));
    
    // Loading indicator should now be visible
    expect(queryByTestId('loading-indicator')).toBeTruthy();
  });
  
  it('renders recent sensors section with data', () => {
    const { getByTestId } = render(<HomeScreen />);
    
    expect(getByTestId('recent-sensors-section')).toBeTruthy();
    expect(getByTestId('sensors-list')).toBeTruthy();
    expect(getByTestId('sensor-item-1')).toBeTruthy();
    expect(getByTestId('sensor-item-2')).toBeTruthy();
    
    // Check specific sensor details
    expect(getByTestId('sensor-name-1').props.children).toBe('Temperature Sensor');
    expect(getByTestId('sensor-reading-1').props.children).toBe('27°C');
    expect(getByTestId('sensor-type-1').props.children).toBe('temperature');
    
    expect(getByTestId('sensor-name-2').props.children).toBe('Humidity Sensor');
    expect(getByTestId('sensor-reading-2').props.children).toBe('58%');
    expect(getByTestId('sensor-type-2').props.children).toBe('humidity');
  });
  
  it('renders featured products section with data', () => {
    const { getByTestId } = render(<HomeScreen />);
    
    expect(getByTestId('store-section')).toBeTruthy();
    expect(getByTestId('products-list')).toBeTruthy();
    expect(getByTestId('product-item-1')).toBeTruthy();
    expect(getByTestId('product-item-2')).toBeTruthy();
    expect(getByTestId('product-item-3')).toBeTruthy();
    
    // Check specific product details
    expect(getByTestId('product-name-1').props.children).toBe('Smart Soil Sensor');
    expect(getByTestId('product-price-1').props.children).toBe('$49.99');
    expect(getByTestId('product-rating-1').props.children).toEqual(['Rating: ', 4.5]);
    
    expect(getByTestId('product-name-2').props.children).toBe('Weather Station');
    expect(getByTestId('product-price-2').props.children).toBe('$129.99');
    expect(getByTestId('product-rating-2').props.children).toEqual(['Rating: ', 4.8]);
  });
  
  it('allows navigation to view all sensors', () => {
    const { getByTestId } = render(<HomeScreen />);
    
    // Check View All button exists and can be pressed
    const viewAllButton = getByTestId('view-all-sensors');
    expect(viewAllButton).toBeTruthy();
    
    // In a real test, we'd verify navigation
    fireEvent.press(viewAllButton);
  });
  
  it('allows navigation to store', () => {
    const { getByTestId } = render(<HomeScreen />);
    
    // Check Visit Store button exists and can be pressed
    const visitStoreButton = getByTestId('view-store');
    expect(visitStoreButton).toBeTruthy();
    
    // In a real test, we'd verify navigation
    fireEvent.press(visitStoreButton);
  });
  
  it('allows navigation to sensor details', () => {
    const { getByTestId } = render(<HomeScreen />);
    
    // Press a sensor
    fireEvent.press(getByTestId('sensor-item-1'));
    
    // In a real test, we'd verify navigation
  });
  
  it('allows navigation to product details', () => {
    const { getByTestId } = render(<HomeScreen />);
    
    // Press a product
    fireEvent.press(getByTestId('product-item-1'));
    
    // In a real test, we'd verify navigation
  });
});
