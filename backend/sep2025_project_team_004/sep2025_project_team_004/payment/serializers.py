from rest_framework import serializers
from .models import PaymentMethod

class PaymentMethodSerializer(serializers.ModelSerializer):
    # Add card_number as a write-only field that's not in the model
    card_number = serializers.CharField(write_only=True, required=False)
    
    class Meta:
        model = PaymentMethod
        fields = ['id', 'user', 'stripe_payment_method_id', 'last4', 'expiration_date', 
                 'cardholder_name', 'card_type', 'created_at', 'is_default', 'card_number']
        extra_kwargs = {
            'user': {'read_only': True}, 
            'expiration_date': {"required": True}, 
            'card_type': {"required": True},
            'stripe_payment_method_id': {'required': False},
        }

    def validate_card_number(self, value):
        """Ensure card number is exactly 16 digits."""
        if not value.isdigit() or len(value) != 16:
            raise serializers.ValidationError("Card number must be 16 digits.")
        return value

    def create(self, validated_data):
        """Extract card_number for processing but don't store it in the model."""
        # Extract card_number if present
        card_number = validated_data.pop('card_number', None)
        
        # If card_number is provided, use it to set last4
        if card_number:
            validated_data['last4'] = card_number[-4:]
            
        # Create the payment method
        return super().create(validated_data)
