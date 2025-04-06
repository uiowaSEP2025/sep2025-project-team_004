from django.db import models

class Product(models.Model):
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    stock = models.IntegerField(default=0)
    image = models.ImageField(upload_to="store_images/", blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True, null=True)
    

    def __str__(self):
        return self.name
    
    
    
    def image_url(self):
        """Returns full image URL if stored on S3."""
        if self.image:
            return self.image.url  # Returns full URL if using S3 storage
        return "mobile/assets/images/react-logo.png"

    class Meta:
        app_label = "store" 

class Review(models.Model):
    product = models.ForeignKey(Product, related_name="new_reviews", on_delete=models.CASCADE)
    rating = models.PositiveSmallIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)]
    )
    comment = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Review for {self.product.name} - {self.rating} stars"

    class Meta:
        app_label = "store"