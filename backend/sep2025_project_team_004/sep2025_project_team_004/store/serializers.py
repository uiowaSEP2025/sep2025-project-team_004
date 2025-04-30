from rest_framework import serializers
from .models import Product, Order, OrderItem, Review
from django.db.models import Avg

class ReviewSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)

    class Meta:
        model = Review
        fields = ['id', 'product', 'product_name', 'rating', 'comment', 'created_at']
        read_only_fields = ['id', 'created_at']

class ProductSerializer(serializers.ModelSerializer):
    average_rating = serializers.SerializerMethodField()
    new_reviews = serializers.SerializerMethodField()
    review_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Product
        fields = "__all__"

    def get_image_url(self, obj):
        """Returns the full S3 URL for the image if available."""
        if obj.image:
            return obj.image.url
        return None
        
    def get_average_rating(self, obj):
        avg = obj.new_reviews.aggregate(Avg('rating'))['rating__avg']
        return avg

    def get_new_reviews(self, obj):
        reviews = obj.new_reviews.all().order_by('-created_at')[:3]  # Get 3 most recent reviews
        return ReviewSerializer(reviews, many=True).data
        
    def get_review_count(self, obj):
        return obj.new_reviews.count()

    
class OrderItemSerializer(serializers.ModelSerializer):
    product_id = serializers.IntegerField()
    product_name = serializers.CharField(source="product.name", read_only=True)
    product_price = serializers.DecimalField(source="product.price", read_only=True, max_digits=10, decimal_places=2)
    

    class Meta:
        model = OrderItem
        fields = ["product_id", "product_name", "product_price", "quantity"]

    def create(self, validated_data):
        product_id = validated_data.pop("product_id")
        validated_data["product"] = Product.objects.get(id=product_id)
        return OrderItem.objects.create(**validated_data)


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True)
    user = serializers.SerializerMethodField()

    class Meta:
        model = Order
        fields = [
            "id", "stripe_payment_method_id", "shipping_address", "city", "state", "zip_code",
            "total_price", "items", "created_at", "status", "tracking_number", "user"
        ]

    def get_user(self, obj):
        return {
            "first_name": obj.user.first_name,
            "last_name": obj.user.last_name,
            "email": obj.user.email
        }

    def create(self, validated_data):
        request = self.context.get('request')
        user = request.user if request else None
        items_data = validated_data.pop("items")
        order = Order.objects.create(user=user, **validated_data)
        for item in items_data:
            OrderItem.objects.create(order=order, **item)
        return order
