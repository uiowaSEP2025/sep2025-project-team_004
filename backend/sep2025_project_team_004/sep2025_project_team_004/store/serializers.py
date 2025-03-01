from rest_framework import serializers
from .models import Product

class ProductSerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = "__all__"

    def get_image_url(self, obj):
        """Returns the full S3 URL for the image if available."""
        if obj.image:
            return obj.image.url
        return None