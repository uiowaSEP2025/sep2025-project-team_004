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

type SortOption = 'recent' | 'highest' | 'critical';

export default function ProductReviewsScreen() {
  const router = useRouter();
  const { productId, productName } = useLocalSearchParams();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [pageNum, setPageNum] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [initialLoading, setInitialLoading] = useState(true);
  const [totalReviews, setTotalReviews] = useState(0);
  const [sortOption, setSortOption] = useState<SortOption>('recent');

  const fetchReviews = async (page = 1, sort: SortOption = 'recent') => {
    if (!productId) return;
    
    setLoading(true);
    
    try {
      let url = `${API_BASE_URL}/api/store/products/${productId}/reviews/?page=${page}`;
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error('Failed to fetch reviews');
      }
      
      const data = await response.json();
      
      let sortedResults = [...(data.results || data)];
      
      if (sort === 'highest') {
        sortedResults = sortedResults.sort((a, b) => b.rating - a.rating);
      } else if (sort === 'critical') {
        sortedResults = sortedResults.sort((a, b) => a.rating - b.rating);
      }
      
      if (page === 1) {
        setReviews(sortedResults);
      } else {
        setReviews(prev => [...prev, ...sortedResults]);
      }
      
      // Set total count if available
      if (data.count) {
        setTotalReviews(data.count);
      }
      
      if (data.next) {
        setHasMore(true);
        setPageNum(page);
      } else {
        setHasMore(false);
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
      setReviews([]);
    } finally {
      setLoading(false);
      setInitialLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews(1, sortOption);
  }, [productId, sortOption]);

  const handleSortChange = (option: SortOption) => {
    if (option !== sortOption) {
      setSortOption(option);
      setPageNum(1);
      setHasMore(true);
    }
  };

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
  
  const handleLoadMore = () => {
    if (hasMore && !loading) {
      fetchReviews(pageNum + 1, sortOption);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity testID="back-button" onPress={() => router.back()} style={styles.backButton}>
          <Feather name="arrow-left" size={24} color="black" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{productName} - Reviews</Text>
      </View>
      
      <View style={styles.filterContainer}>
        <TouchableOpacity 
          style={[styles.filterButton, sortOption === 'recent' && styles.activeFilterButton]}
          onPress={() => handleSortChange('recent')}
        >
          <Text style={[styles.filterButtonText, sortOption === 'recent' && styles.activeFilterText]}>
            Most Recent
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.filterButton, sortOption === 'highest' && styles.activeFilterButton]}
          onPress={() => handleSortChange('highest')}
        >
          <Text style={[styles.filterButtonText, sortOption === 'highest' && styles.activeFilterText]}>
            Highest Rated
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.filterButton, sortOption === 'critical' && styles.activeFilterButton]}
          onPress={() => handleSortChange('critical')}
        >
          <Text style={[styles.filterButtonText, sortOption === 'critical' && styles.activeFilterText]}>
            Most Critical
          </Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.paginationInfo}>
        <Text>Showing {reviews.length} of {totalReviews} reviews</Text>
      </View>

      {initialLoading ? (
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
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.2}
          ListFooterComponent={() =>
            loading && !initialLoading ? (
              <View style={styles.footerLoading}>
                <ActivityIndicator size="small" color="#000" />
                <Text style={styles.footerText}>Loading more reviews...</Text>
              </View>
            ) : hasMore ? (
              <TouchableOpacity 
                style={styles.loadMoreButton}
                onPress={() => fetchReviews(pageNum + 1, sortOption)}
              >
                <Text>Load More Reviews</Text>
              </TouchableOpacity>
            ) : (
              <Text style={styles.noMoreReviews}>No more reviews to load</Text>
            )
          }
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
  filterContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: '#f9f9f9',
  },
  filterButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: '#eee',
    minWidth: 105,
    alignItems: 'center',
  },
  activeFilterButton: {
    backgroundColor: '#007bff',
  },
  filterButtonText: {
    fontSize: 12,
    color: '#333',
  },
  activeFilterText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  paginationInfo: {
    padding: 10,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
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
  footerLoading: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  footerText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#666',
  },
  loadMoreButton: {
    padding: 15,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    alignItems: 'center',
    marginVertical: 10,
  },
  noMoreReviews: {
    textAlign: 'center',
    padding: 15,
    color: '#666',
  },
}); 