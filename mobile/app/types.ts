// types.ts

export type RootStackParamList = {
    index: undefined;
    Details: { itemId: number; otherParam?: string };
    register: undefined;
    forgot: undefined;
    editProfile: undefined;
    Profile: undefined;
    home: undefined;
    "(tabs)": undefined;
    "payment-method": undefined;
    "add-payment": undefined;
    ResetPasswordScreen: {email: string, token: string},
    // Add other routes as needed
  };
  