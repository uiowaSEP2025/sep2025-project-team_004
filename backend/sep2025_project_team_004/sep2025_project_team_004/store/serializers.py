from rest_framework import serializers
from .models import Product, Order, OrderItem, Review

class ProductSerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = "__all__"

    def get_image_url(self, obj):
        """Returns the full S3 URL for the image if available."""
        if obj.image:
            return obj.image.url
        return None

    
class OrderItemSerializer(serializers.ModelSerializer):
    product_id = serializers.IntegerField
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


from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Review

User = get_user_model()

class ReviewSerializer(serializers.ModelSerializer):
    # Declare the user field as a CharField (for input)
    user = serializers.CharField()  

    class Meta:
        model = Review
        fields = ['id', 'product', 'rating', 'comment', 'created_at', 'user']
        read_only_fields = ['id', 'created_at']

    def create(self, validated_data):
        # Pop the username from the validated data
        username = validated_data.pop('user', None)
        if not username:
            raise serializers.ValidationError({"user": "Username is required."})
        try:
            # Look up the User instance based on the username
            user = User.objects.get(username=username)
        except User.DoesNotExist:
            raise serializers.ValidationError({"user": "Invalid username."})
        validated_data['user'] = user
        return Review.objects.create(**validated_data)
