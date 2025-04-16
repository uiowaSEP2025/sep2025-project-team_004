// types.ts

export type RootStackParamList = {
  index: undefined;
  Details: { itemId: number; otherParam?: string };
  register: undefined;
  forgot: undefined;
  editProfile: undefined;
  profile: undefined;
  home: undefined;
  "(tabs)": undefined;
  "payment-method": undefined;
  "add-payment": undefined;
  store: undefined;
  ResetPasswordScreen: {email: string, token: string},
  "my-orders": undefined;
  "settings": undefined;
  "my-reviews": undefined;
  "admin-orders": undefined;
  // Add other routes as needed
};
