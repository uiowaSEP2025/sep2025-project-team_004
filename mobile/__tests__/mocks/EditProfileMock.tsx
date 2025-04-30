import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { render } from '@testing-library/react-native';

export default function EditProfileMock() {
  // Get navigation from props or context in real usage
  const goBack = () => {
    // This is just for display, the real function will be injected during tests
    console.log('Going back...');
  };

  return (
    <View testID="edit-profile-container">
      <View testID="header">
        <TouchableOpacity
          testID="back-button"
          onPress={goBack}
        >
          <Text>Back</Text>
        </TouchableOpacity>
        <Text>Edit Profile</Text>
      </View>
      <View testID="form-container">
        <Text>testuser</Text>
        <Text>Test</Text>
        <Text>User</Text>
        <Text>1234567890</Text>
      </View>
      <TouchableOpacity
        testID="update-profile-button"
      >
        <Text>Update Profile</Text>
      </TouchableOpacity>
    </View>
  );
}

// Add a simple test to satisfy Jest
describe('EditProfileMock', () => {
  it('renders correctly', () => {
    const { getByTestId } = render(<EditProfileMock />);
    expect(getByTestId('edit-profile-container')).toBeTruthy();
  });
}); 