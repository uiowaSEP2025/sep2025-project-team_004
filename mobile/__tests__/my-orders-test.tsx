import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import Order from '../app/my-orders';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialIcons } from '@expo/vector-icons';
import { NavigationContext } from '@react-navigation/native';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn().mockResolvedValue('dummy-token'),
  setItem: jest.fn(),
}));

// Mock vector icons to avoid font loading errors
jest.mock('@expo/vector-icons', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    MaterialIcons: (props: React.ComponentProps<typeof View>) => <View {...props} />,
  };
});

// Mock image assets
jest.mock('@/assets/images/back-arrow.png', () => 'back-arrow.png');

// Mock the useRouter hook from expo-router
jest.mock('expo-router', () => ({
  useRouter: jest.fn(),
}));

// Mock useFocusEffect from React Navigation
jest.mock('@react-navigation/native', () => {
  return {
    ...jest.requireActual('@react-navigation/native'),
    useFocusEffect: (callback: () => any) => {
      jest.requireActual('react').useEffect(() => {
        callback();
      }, [callback]);
    },
    NavigationContext: {
      Consumer: jest.requireActual('@react-navigation/native').NavigationContext.Consumer,
      Provider: jest.requireActual('@react-navigation/native').NavigationContext.Provider
    }
  };
});

// Mock the global fetch API
global.fetch = jest.fn();

// Sample mock data for orders
const mockOrdersData = {
  results: [
    {
      id: 1,
      status: 'out_for_delivery',
      created_at: '2023-01-15T10:00:00Z',
      total_price: '125.99',
      tracking_number: 'TRK123456',
      shipping_address: '123 Main St',
      city: 'Anytown',
      state: 'CA',
      zip_code: '12345',
      user: {
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
      },
      items: [
        {
          product_name: 'Product A',
          product_price: '75.99',
          quantity: 1,
          product_id: 101,
        },
      ],
    },
    {
      id: 2,
      status: 'out_for_delivery',
      created_at: '2023-02-20T14:30:00Z',
      total_price: '89.99',
      tracking_number: 'TRK789012',
      shipping_address: '456 Oak St',
      city: 'Somewhere',
      state: 'NY',
      zip_code: '67890',
      user: {
        first_name: 'Jane',
        last_name: 'Smith',
        email: 'jane@example.com',
      },
      items: [
        {
          product_name: 'Product B',
          product_price: '89.99',
          quantity: 1,
          product_id: 102,
        },
      ],
    },
    {
      id: 3,
      status: 'out_for_delivery',
      created_at: '2023-03-25T09:15:00Z',
      total_price: '149.99',
      tracking_number: 'TRK345678',
      shipping_address: '789 Pine St',
      city: 'Elsewhere',
      state: 'TX',
      zip_code: '54321',
      user: {
        first_name: 'Bob',
        last_name: 'Johnson',
        email: 'bob@example.com',
      },
      items: [
        {
          product_name: 'Product C',
          product_price: '149.99',
          quantity: 1,
          product_id: 103,
        },
      ],
    },
    {
      id: 4,
      status: 'processing',
      created_at: '2022-11-03T16:45:00Z',
      total_price: '199.99',
      tracking_number: null,
      shipping_address: '321 Elm St',
      city: 'Nowhere',
      state: 'FL',
      zip_code: '13579',
      user: {
        first_name: 'Alice',
        last_name: 'Williams',
        email: 'alice@example.com',
      },
      items: [
        {
          product_name: 'Product D',
          product_price: '199.99',
          quantity: 1,
          product_id: 104,
        },
      ],
    },
    {
      id: 5,
      status: 'processing',
      created_at: '2022-12-10T08:30:00Z',
      total_price: '59.99',
      tracking_number: null,
      shipping_address: '654 Maple St',
      city: 'Anyplace',
      state: 'WA',
      zip_code: '97531',
      user: {
        first_name: 'Carol',
        last_name: 'Brown',
        email: 'carol@example.com',
      },
      items: [
        {
          product_name: 'Product E',
          product_price: '59.99',
          quantity: 1,
          product_id: 105,
        },
      ],
    },
    {
      id: 6,
      status: 'cancelled',
      created_at: '2021-02-13T11:20:00Z',
      total_price: '39.99',
      tracking_number: null,
      shipping_address: '987 Birch St',
      city: 'Someplace',
      state: 'IL',
      zip_code: '24680',
      user: {
        first_name: 'David',
        last_name: 'Miller',
        email: 'david@example.com',
      },
      items: [
        {
          product_name: 'Product F',
          product_price: '39.99',
          quantity: 1,
          product_id: 106,
        },
      ],
    },
  ],
  next: null,
};

describe('Order Component', () => {
  const mockBack = jest.fn();
  const mockRouter = { back: mockBack };
  
  // Create a mock navigation context
  const navContext = {
    isFocused: () => true,
    addListener: jest.fn(() => jest.fn()),
  };

  const renderWithNavigation = (component: React.ReactElement) => {
    return render(
      <NavigationContext.Provider value={navContext as any}>
        {component}
      </NavigationContext.Provider>
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue('dummy-token');
    
    // Mock successful fetch response
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue(mockOrdersData),
    });
  });

  it('renders header and tabs correctly', async () => {
    const { getByText, getByTestId } = renderWithNavigation(<Order />);
    
    await waitFor(() => {
      expect(getByText('My orders')).toBeTruthy();
      expect(getByTestId('back-button')).toBeTruthy();
      expect(getByText('Out for Delivery')).toBeTruthy();
      expect(getByText('Processing')).toBeTruthy();
      expect(getByText('Canceled')).toBeTruthy();
    });
  });

  it('calls router.back when back button is pressed', async () => {
    const { getByTestId } = renderWithNavigation(<Order />);
    
    await waitFor(() => {
      expect(getByTestId('back-button')).toBeTruthy();
    });
    
    fireEvent.press(getByTestId('back-button'));
    expect(mockBack).toHaveBeenCalled();
  });

  it('displays Out for Delivery orders by default', async () => {
    const { getByText, getAllByText } = renderWithNavigation(<Order />);
    
    await waitFor(() => {
      // Check if the first "Out for Delivery" order is displayed
      expect(getByText('Order #1')).toBeTruthy();
      expect(getByText('1/15/2023')).toBeTruthy(); // Formatted date
      expect(getAllByText('Details').length).toBeGreaterThan(0);
    });
  });

  it('switches to Processing tab and displays Processing orders', async () => {
    const { getByText, getAllByText } = renderWithNavigation(<Order />);
    
    await waitFor(() => {
      expect(getByText('Processing')).toBeTruthy();
    });
    
    // Press the Processing tab
    fireEvent.press(getByText('Processing'));
    
    await waitFor(() => {
      // Check if the first "Processing" order is displayed (ID 4)
      expect(getByText('Order #4')).toBeTruthy();
      expect(getByText('11/3/2022')).toBeTruthy(); // Formatted date for order 4
    });
  });

  it('switches to Canceled tab and displays Canceled orders', async () => {
    const { getByText } = renderWithNavigation(<Order />);
    
    await waitFor(() => {
      expect(getByText('Canceled')).toBeTruthy();
    });
    
    // Press the Canceled tab
    fireEvent.press(getByText('Canceled'));
    
    await waitFor(() => {
      // Check if the first "Canceled" order is displayed (ID 6)
      expect(getByText('Order #6')).toBeTruthy();
      expect(getByText('2/13/2021')).toBeTruthy(); // Formatted date for order 6
    });
  });
  
  it('opens review modal when Review button is pressed', async () => {
    const { getByText, getAllByText } = renderWithNavigation(<Order />);
    
    await waitFor(() => {
      expect(getAllByText('Review').length).toBeGreaterThan(0);
    });
    
    fireEvent.press(getAllByText('Review')[0]);
    
    await waitFor(() => {
      expect(getByText('Review Product')).toBeTruthy();
      expect(getByText('Submit Review')).toBeTruthy();
      expect(getByText('Cancel')).toBeTruthy();
    });
  });
  
  it('opens order details modal when Details button is pressed', async () => {
    const { getByText, getAllByText, getByTestId } = renderWithNavigation(<Order />);
    
    await waitFor(() => {
      expect(getAllByText('Details').length).toBeGreaterThan(0);
    });
    
    fireEvent.press(getAllByText('Details')[0]);
    
    await waitFor(() => {
      // Update selectors to be more specific
      expect(getByText('Shipping Address:')).toBeTruthy();
      expect(getByText('Products:')).toBeTruthy();
    });
  });
});
