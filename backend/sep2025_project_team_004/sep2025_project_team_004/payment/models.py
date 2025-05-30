from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()

class PaymentMethod(models.Model):
    CARD = 'Card'
    PAYMENT_CHOICES = [
        (CARD, 'Card'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="payment_methods")
    stripe_payment_method_id = models.CharField(max_length=255, unique=True, null=True, blank=True)
    card_type = models.CharField(max_length=10, blank=True, null=True)
    last4 = models.CharField(max_length=4, blank=True, null=True)
    expiration_date = models.CharField(max_length=5, blank=True, null=True)  # MM/YY format
    cardholder_name = models.CharField(max_length=255, blank=True, null=True)
    billing_address = models.TextField(blank=True, null=True)
    is_default = models.BooleanField(default=False) 
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.card_type} ****{self.last4}"
