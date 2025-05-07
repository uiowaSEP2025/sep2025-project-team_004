import os
from celery import Celery
from celery.schedules import crontab
from dotenv import load_dotenv

# Load environment variables from .env file
dotenv_path = os.path.join(os.path.dirname(__file__), '..', '.env')
load_dotenv(dotenv_path=dotenv_path)

# Set the default Django settings module for the 'celery' program.
# os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.local') # Assuming no Django integration needed directly here

broker_url = os.getenv('CELERY_BROKER_URL')
result_backend = os.getenv('CELERY_RESULT_BACKEND')

if not broker_url:
    raise RuntimeError("CELERY_BROKER_URL environment variable is not set.")

app = Celery('sensor_data_processor',
             broker=broker_url,
             backend=result_backend,
             include=['sensor_data_processor.tasks'])

# Optional configuration, see the application user guide.
app.conf.update(
    result_expires=3600,
    task_serializer='json',
    accept_content=['json'],  # Ignore other content
    result_serializer='json',
    timezone='UTC',
    enable_utc=True,
)

# Define the beat schedule (runs every hour)
app.conf.beat_schedule = {
    'process-sensor-data-every-hour': {
        'task': 'sensor_data_processor.tasks.process_sensor_data',
        # 'schedule': crontab(minute=0), # Runs at the start of every hour
        # 'schedule': crontab(minute='*/1'), # Runs every minute for testing - CHANGE TO minute=0 for hourly
        'schedule': crontab(minute='*/10'), # Runs every 10 minutes
        # 'schedule': 30.0, # Runs every 30 seconds for quicker testing - REMOVE for hourly
    },
}


if __name__ == '__main__':
    app.start() 