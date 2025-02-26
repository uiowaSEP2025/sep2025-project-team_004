from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()

class PaymentMethod(models.Model):
    CARD = 'Card'
    PAYMENT_CHOICES = [
        (CARD, 'Card'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="payment_methods")
    payment_type = models.CharField(max_length=10, choices=PAYMENT_CHOICES, default=CARD)
    card_type = models.CharField(max_length=10, blank=True, null=True)
    card_number = models.CharField(max_length=16, unique=True, blank=True, null=True)
    last4 = models.CharField(max_length=4, blank=True, null=True)
    expiration_date = models.CharField(max_length=5, blank=True, null=True)  # MM/YY format
    cardholder_name = models.CharField(max_length=255, blank=True, null=True)
    billing_address = models.TextField(blank=True, null=True)
    is_default = models.BooleanField(default=False) 
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.payment_type} - ****{self.card_number[-4:] if self.card_number else 'N/A'}"
