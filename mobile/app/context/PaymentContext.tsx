import React, { createContext, useContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import { Alert } from "react-native";
const API_BASE_URL =
  Constants.expoConfig?.hostUri?.split(":").shift() ?? "localhost";

interface PaymentContextType {
  cards: any[];
  loadCards: () => Promise<void>;
  addCard: (newCard: any) => Promise<void>;
  setDefaultPayment: (cardId: number) => Promise<void>;
  deletePaymentMethod: (cardId: number) => Promise<void>;
}

const PaymentContext = createContext<PaymentContextType | undefined>(undefined);

export const usePayment = () => {
  const context = useContext(PaymentContext);
  if (!context) {
    throw new Error("usePayment must be used within a PaymentProvider");
  }
  return context;
};

// Provider Component
export const PaymentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cards, setCards] = useState<any[]>([]);

  const loadCards = async () => {
    try {
      const authToken = await AsyncStorage.getItem("authToken");
      if (!authToken) {
        console.error("User not authenticated.");
        return;
      }

      const response = await fetch(`http://${API_BASE_URL}:8000/api/payment/payment-methods/`, {
        method: "GET",
        headers: {
          "Authorization": `Token ${authToken}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) throw new Error("Failed to fetch payment methods.");

      const data = await response.json();
      setCards(data);
    } catch (error) {
      console.error("Error loading payment methods:", error);
    }
  };

  const addCard = async (newCard: any) => {
    try {
      const authToken = await AsyncStorage.getItem("authToken");
      if (!authToken) {
        console.error("User not authenticated.");
        return;
      }

      setCards((prevCards) => [...prevCards, newCard]);

      const response = await fetch(`http://${API_BASE_URL}:8000/api/payment/payment-methods/`, {
        method: "POST",
        headers: {
          "Authorization": `Token ${authToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newCard),
      });

      if (!response.ok) throw new Error("Failed to add payment method.");

      const addedCard = await response.json();

    } catch (error) {
      console.error("Error adding payment method:", error);
    }
  };

  // Set a default payment method
  const setDefaultPayment = async (cardId: number) => {
    try {
      const authToken = await AsyncStorage.getItem("authToken");
      if (!authToken) {
        console.error("User not authenticated.");
        return;
      }
      setCards((prevCards) =>
        prevCards.map((card) => ({
          ...card,
          is_default: card.id === cardId,
        }))
      );

      const response = await fetch(`http://${API_BASE_URL}:8000/api/payment/set-default/${cardId}/`, {
        method: "POST",
        headers: {
          "Authorization": `Token ${authToken}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) throw new Error("Failed to set default payment method.");

      
    } catch (error) {
      console.error("Error setting default payment method:", error);
    }
    loadCards(); 
  };

  const deletePaymentMethod = async (cardId: number) => {
    try {
      const authToken = await AsyncStorage.getItem("authToken");
      if (!authToken) {
        console.error("User not authenticated.");
        return;
      }
        
      setCards((prevCards) => prevCards.filter((card) => card.id !== cardId));

      const response = await fetch(`http://${API_BASE_URL}:8000/api/payment/delete/${cardId}/`, {
        method: "DELETE",
        headers: {
          "Authorization": `Token ${authToken}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) throw new Error("Failed to delete payment method.");

      
    } catch (error) {
      console.error("Error deleting payment method:", error);
    }
    loadCards();  
  };

  useEffect(() => {
    loadCards();
  }, []);

  return (
    <PaymentContext.Provider value={{ cards, loadCards, addCard, setDefaultPayment, deletePaymentMethod }}>
      {children}
    </PaymentContext.Provider>
  );
};
