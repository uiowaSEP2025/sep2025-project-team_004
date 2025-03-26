import AsyncStorage from "@react-native-async-storage/async-storage";

const API_URL = "http://127.0.0.1:8000/api/friends";


export const sendFriendRequest = async (username: string) => {
  try {
    const authToken = await AsyncStorage.getItem("authToken");
    if (!authToken) {
      throw new Error("User not authenticated");
    }

    // Search user by username
    const userResponse = await fetch(`http://127.0.0.1:8000/api/users/search/?username=${username}`, {
      method: "GET",
      headers: {
        "Authorization": `Token ${authToken}`,
        "Content-Type": "application/json",
      },
    });

    if (!userResponse.ok) {
      throw new Error("User search failed");
    }

    const userData = await userResponse.json();

    if (!userData.length || !userData[0].id) {
      throw new Error("Invalid user data");
    }

    const toUserId = userData[0].id;

    // Send Friend Request
    const response = await fetch(`${API_URL}/send/`, {
      method: "POST",
      headers: {
        "Authorization": `Token ${authToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ to_user_id: toUserId }), 
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Failed to send friend request");
    }

    return await response.json();
  } catch (error: any) {
    console.error("Error sending friend request:", error);
    throw error;
  }
};



export const getPendingRequests = async () => {
  try {
    const authToken = await AsyncStorage.getItem("authToken");
    if (!authToken) throw new Error("User not authenticated");

    const response = await fetch(`${API_URL}/pending/`, {
      method: "GET",
      headers: {
        "Authorization": `Token ${authToken}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      console.error("Failed to fetch pending requests:", await response.text());
      throw new Error("Failed to fetch pending requests");
    }

    const data = await response.json();
    return data; // return as-is if the server already filtered pending requests
  } catch (error) {
    console.error("Error fetching pending requests:", error);
    throw error;
  }
};

export const getAllFriends = async () => {
  try {
    const authToken = await AsyncStorage.getItem("authToken");
    if (!authToken) throw new Error("User not authenticated");

    const response = await fetch(`${API_URL}/friends/`, { // ✅ Use the correct endpoint
      method: "GET",
      headers: {
        "Authorization": `Token ${authToken}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      console.error("Failed to fetch friends:", await response.text());
      throw new Error("Failed to fetch friends");
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching friends:", error);
    throw error;
  }
};

export const acceptFriendRequest = async (requestId: number) => {
  try {
    const authToken = await AsyncStorage.getItem("authToken");
    if (!authToken) {
      throw new Error("User not authenticated");
    }


    const response = await fetch(`${API_URL}/accept/${requestId}/`, {
      method: "POST",
      headers: {
        "Authorization": `Token ${authToken}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error("Failed to accept friend request");
    }

    return await response.json();
  } catch (error) {
    console.error("Error accepting friend request:", error);
    throw error;
  }
};

export const rejectFriendRequest = async (requestId: number) => {
  try {
    const authToken = await AsyncStorage.getItem("authToken");
    if (!authToken) {
      throw new Error("User not authenticated");
    }

    const response = await fetch(`${API_URL}/reject/${requestId}/`, {
      method: "POST",
      headers: {
        "Authorization": `Token ${authToken}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error("Failed to reject friend request");
    }

    return await response.json();
  } catch (error) {
    console.error("Error rejecting friend request:", error);
    throw error;
  }
};