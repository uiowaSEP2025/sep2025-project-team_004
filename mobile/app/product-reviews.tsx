import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Feather, MaterialIcons } from '@expo/vector-icons';
import Constants from 'expo-constants';

const API_BASE_URL =
  process.env.EXPO_PUBLIC_DEV_FLAG === "true"
    ? `http://${Constants.expoConfig?.hostUri?.split(":").shift() ?? "localhost"}:8000`
    : process.env.EXPO_PUBLIC_BACKEND_URL;

interface Review {
  id: number;
  rating: number;
  comment: string;
  created_at: string;
}

export default function ProductReviewsScreen() {
  const router = useRouter();
  const { productId, productName } = useLocalSearchParams();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!productId) return;
    
    setLoading(true);
    fetch(`${API_BASE_URL}/api/store/products/${productId}/reviews/`)
      .then(response => {
        if (!response.ok) {
          throw new Error('Failed to fetch reviews');
        }
        return response.json();
      })
      .then(data => {
        setReviews(data);
        setLoading(false);
      })
      .catch(error => {
        console.error('Error fetching reviews:', error);
        setLoading(false);
        setReviews([]);
      });
  }, [productId]);

  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const halfStar = rating - fullStars >= 0.5;
    
    for (let i = 1; i <= 5; i++) {
      if (i <= fullStars) {
        stars.push(<MaterialIcons key={i} name="star" size={16} color="gold" />);
      } else if (i === fullStars + 1 && halfStar) {
        stars.push(<MaterialIcons key={i} name="star-half" size={16} color="gold" />);
      } else {
        stars.push(<MaterialIcons key={i} name="star-outline" size={16} color="gold" />);
      }
    }
    return (
      <View style={styles.starsContainer}>
        {stars}
      </View>
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity testID="back-button" onPress={() => router.back()} style={styles.backButton}>
          <Feather name="arrow-left" size={24} color="black" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{productName} - Reviews</Text>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator testID="loading-indicator" size="large" color="#000" />
        </View>
      ) : reviews.length === 0 ? (
        <View style={styles.emptyContainer} testID="empty-state">
          <Text style={styles.emptyText}>No reviews available for this product.</Text>
        </View>
      ) : (
        <FlatList
          testID="reviews-list"
          data={reviews}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <View style={styles.reviewCard} testID={`review-item-${item.id}`}>
              <View style={styles.reviewHeader}>
                {renderStars(item.rating)}
                <Text style={styles.reviewDate}>{formatDate(item.created_at)}</Text>
              </View>
              <Text style={styles.reviewComment}>{item.comment}</Text>
            </View>
          )}
          contentContainerStyle={styles.reviewsList}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: 50,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: {
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  reviewsList: {
    padding: 16,
  },
  reviewCard: {
    padding: 16,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#eee',
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  starsContainer: {
    flexDirection: 'row',
  },
  reviewDate: {
    fontSize: 12,
    color: '#666',
  },
  reviewComment: {
    fontSize: 14,
    color: '#333',
  },
}); 