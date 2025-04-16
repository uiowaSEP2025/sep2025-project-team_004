// app/my-reviews.tsx
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  TextInput,
  Keyboard,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import Constants from 'expo-constants';
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import showMessage from '@/hooks/useAlert';

const API_BASE_URL =
  process.env.EXPO_PUBLIC_DEV_FLAG === 'true'
    ? `http://${Constants.expoConfig?.hostUri?.split(':').shift() ?? 'localhost'}:8000`
    : process.env.EXPO_PUBLIC_BACKEND_URL;

export default function MyReviewsScreen() {
  const [reviews, setReviews] = useState<any[]>([]);
  const router = useRouter();
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingReview, setEditingReview] = useState<any | null>(null);
  const [editRating, setEditRating] = useState(0);
  const [editComment, setEditComment] = useState(''); 
  const { useToast } = showMessage();

  useEffect(() => {
    const fetchReviews = async () => {
      const token = await AsyncStorage.getItem('authToken');
      const res = await fetch(`${API_BASE_URL}/api/store/reviews/my/`, {
        headers: { Authorization: `Token ${token}` },
      });
      const data = await res.json();
      setReviews(data);
    };
    fetchReviews();
  }, []);

  const renderStars = (rating: number, onChange?: (value: number) => void) => (
    <View style={{ flexDirection: 'row', marginVertical: 6 }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <TouchableOpacity
          key={i}
          onPress={() => onChange?.(i)}
          disabled={!onChange}
        >
          <MaterialIcons
            name={i <= rating ? 'star' : 'star-border'}
            size={24}
            color="gold"
          />
        </TouchableOpacity>
      ))}
    </View>
  );

  const handleDelete = (id: number) => {
    Alert.alert('Confirm Delete', 'Are you sure you want to delete this review?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          const token = await AsyncStorage.getItem('authToken');
          const res = await fetch(`${API_BASE_URL}/api/store/reviews/${id}/`, {
            method: 'DELETE',
            headers: { Authorization: `Token ${token}` },
          });
          if (res.ok) {
            setReviews((prev) => prev.filter((r) => r.id !== id));
          } else {
            Alert.alert('Error', 'Failed to delete review.');
          }
        },
      },
    ]);
  };

  return (
    
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <MaterialIcons name="arrow-back" size={24} color="#303030" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Reviews</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 20 }}>
        {reviews.map((review) => (
          <View key={review.id} style={styles.card}>
            <Text style={styles.productName}>Product name: {review.product_name}</Text>
            {renderStars(review.rating)}
            <Text style={styles.comment}>{review.comment}</Text>
            <View style={styles.buttonRow}>
              <TouchableOpacity style={styles.button}
              onPress={() => {
                setEditingReview(review);
                setEditRating(review.rating);
                setEditComment(review.comment);
                setEditModalVisible(true);
              }}
              >
                <Text style={styles.buttonText}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, { backgroundColor: '#d9534f' }]}
                onPress={() => handleDelete(review.id)}
              >
                <Text style={styles.buttonText}>Delete</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.divider} />
          </View>
        ))}
      </ScrollView>
      {editModalVisible && editingReview && (
  <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.modalOverlay}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
    >
      <View style={styles.modalBox}>
        <Text style={styles.modalTitle}>Edit Review</Text>

        {renderStars(editRating, setEditRating)}

        <TextInput
          style={styles.input}
          placeholder="Update your comment"
          multiline
          maxLength={255}
          value={editComment}
          onChangeText={setEditComment}
        />

        <TouchableOpacity
          style={styles.submitButton}
          onPress={async () => {
            const token = await AsyncStorage.getItem('authToken');
            const res = await fetch(`${API_BASE_URL}/api/store/reviews/${editingReview.id}/update/`, {
              method: 'PUT',
              headers: {
                Authorization: `Token ${token}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                rating: editRating,
                comment: editComment,
                product: editingReview.product,
              }),
            });

            if (res.ok) {
              const updated = await res.json();
              setReviews(prev =>
                prev.map(r => (r.id === updated.id ? updated : r))
              );
              setEditModalVisible(false);
              useToast("Success", "Your review has been updated");
            } else {
              Alert.alert('Error', 'Failed to update review.');
            }
          }}
        >
          <Text style={styles.buttonText}>Save</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setEditModalVisible(false)}
          style={{ marginTop: 10 }}
        >
          <Text style={[styles.buttonText, { color: '#007AFF', textAlign: 'center' }]}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  </TouchableWithoutFeedback>
)}

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  headerTitle: {
    flex: 1,
    fontFamily: 'Merriweather',
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 20,
    color: '#303030',
    textAlign: 'center',
  },
  card: {
    padding: 16,
    marginHorizontal: 20,
    marginTop: 16,
    backgroundColor: '#fff',
    borderRadius: 8,
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#232323',
    marginBottom: 6,
  },
  comment: {
    fontSize: 14,
    color: '#444',
    marginVertical: 10,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  button: {
    backgroundColor: '#232323',
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 5,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
  },
  divider: {
    height: 2,
    backgroundColor: '#f0f0f0',
    marginTop: 16,
    borderRadius: 6,
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBox: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    width: '85%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    padding: 10,
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: 10,
  },
  submitButton: {
    backgroundColor: '#232323',
    paddingVertical: 10,
    borderRadius: 6,
    alignItems: 'center',
  },
  
});
