# Generated by Django 5.0.12 on 2025-04-10 19:00

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0008_alter_user_friends'),
    ]

    operations = [
        migrations.AddField(
            model_name='user',
            name='stripe_customer_id',
            field=models.CharField(blank=True, max_length=255, null=True, verbose_name='Stripe Customer ID'),
        ),
    ]
