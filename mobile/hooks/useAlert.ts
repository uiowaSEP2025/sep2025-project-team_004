import { Alert, Platform } from "react-native";
import Toast from "react-native-toast-message";

const showMessage = () => {
  const useAlert = (title: string, message?: string) => {
        Alert.alert(title, message);   
    }
  const useToast = (title: string, message?: string) => {
      Toast.show({
        type: "success",
        text1: title,
        text2: message || "",
        position: "top",
        topOffset: Platform.OS === "web" ? 20 : 70,
        visibilityTime: 4000,
        autoHide: true,
      });
    }
  return { useAlert, useToast };

};

export default showMessage;
