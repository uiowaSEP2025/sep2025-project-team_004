from rest_framework import serializers
from .models import PaymentMethod

class PaymentMethodSerializer(serializers.ModelSerializer):
    class Meta:
        model = PaymentMethod
        fields = ['id', 'user','stripe_payment_method_id', 'last4', 'expiration_date', 'cardholder_name', 'card_type', 'created_at', 'is_default']
        extra_kwargs = {'user': {'read_only': True}, 'expiration_date': {"required": True}, 'card_type': {"required": True}}

    def validate_card_number(self, value):
        """Ensure card number is exactly 16 digits."""
        if not value.isdigit() or len(value) != 16:
            raise serializers.ValidationError("Card number must be 16 digits.")
        return value

    def create(self, validated_data):
        """Mask the card number except for the last 4 digits before saving."""
        validated_data['last4'] = validated_data['card_number'][-4:]
        validated_data['card_number'] = '*' * 12 + validated_data['card_number'][-4:]
        return super().create(validated_data)
