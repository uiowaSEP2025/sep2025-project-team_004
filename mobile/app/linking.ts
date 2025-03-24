import { LinkingOptions } from "@react-navigation/native";
import { RootStackParamList } from "../types";

const linking: LinkingOptions<RootStackParamList> = {
  prefixes: [
    "exp+", 
    "myapp://", 
    "http://localhost:8081", 
  ],
  config: {
    screens: {
      ResetPasswordScreen: "ResetPasswordScreen",
    },
  },
};

export default linking;