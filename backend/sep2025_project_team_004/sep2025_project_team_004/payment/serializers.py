# payment/serializers.py

from rest_framework import serializers
from .models import PaymentMethod

class PaymentMethodSerializer(serializers.ModelSerializer):
    # Accept raw 16-digit number on input, but don’t ever return it
    card_number = serializers.CharField(write_only=True, required=True)

    class Meta:
        model = PaymentMethod
        fields = [
            "id",
            "user",
            "stripe_payment_method_id",
            "card_number",         # accepted on input only
            "last4",               # stored in DB
            "expiration_date",
            "cardholder_name",
            "card_type",
            "created_at",
            "is_default",
        ]
        read_only_fields = [
            "id",
            "user",
            "last4",
            "created_at",
            "stripe_payment_method_id",
        ]
        extra_kwargs = {
            "user": {"read_only": True},
            "expiration_date": {"required": True},
            "card_type": {"required": True},
        }

    def validate_card_number(self, value):
        if not (value.isdigit() and len(value) == 16):
            raise serializers.ValidationError("Card number must be 16 digits.")
        return value

    def create(self, validated_data):
        # Pull out and process the raw number
        raw_number = validated_data.pop("card_number")
        # Only store the last 4 digits in the model
        validated_data["last4"] = raw_number[-4:]
        # Now call super() without ever re-adding 'card_number'
        return super().create(validated_data)
