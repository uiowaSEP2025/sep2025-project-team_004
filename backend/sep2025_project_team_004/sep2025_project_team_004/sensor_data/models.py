from django.db import models
from django.utils import timezone # Import timezone if needed for default timestamps

class SensorReading(models.Model):
    """Stores individual sensor readings."""
    timestamp = models.DateTimeField(default=timezone.now, db_index=True) # Added default, ensure timezone support is enabled in Django settings
    sensor_id = models.CharField(max_length=50, db_index=True)
    temperature = models.FloatField(null=True, blank=True)
    pressure = models.FloatField(null=True, blank=True)
    humidity = models.FloatField(null=True, blank=True)
    vcc = models.IntegerField(null=True, blank=True)

    class Meta:
        db_table = 'sensor_readings' # Explicitly set table name
        ordering = ['-timestamp'] # Optional: Default ordering
        indexes = [
            models.Index(fields=['sensor_id', 'timestamp']),
        ]

    def __str__(self):
        return f"{self.sensor_id} at {self.timestamp}"

class WeeklySensorAverage(models.Model):
    """Stores calculated weekly averages for each sensor."""
    sensor_id = models.CharField(max_length=50)
    year = models.IntegerField()
    week_number = models.IntegerField()
    avg_temperature = models.FloatField(null=True, blank=True)
    avg_pressure = models.FloatField(null=True, blank=True)
    avg_humidity = models.FloatField(null=True, blank=True)
    avg_vcc = models.FloatField(null=True, blank=True) # Average of integer might be float
    datapoints = models.PositiveIntegerField(default=0) # Use PositiveIntegerField for counts
    calculation_timestamp = models.DateTimeField() # Timestamp of the last update

    class Meta:
        db_table = 'weekly_sensor_averages' # Explicitly set table name
        # Define the composite primary key
        unique_together = ('sensor_id', 'year', 'week_number')
        ordering = ['sensor_id', 'year', 'week_number'] # Optional: Default ordering

    def __str__(self):
        return f"{self.sensor_id} - {self.year}W{self.week_number:02d}" 