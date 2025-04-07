from django_celery_beat.models import PeriodicTask, IntervalSchedule

def setup_periodic_tasks():
    schedule_qs = IntervalSchedule.objects.filter(
        every=1,
        period=IntervalSchedule.MINUTES,
    )
    if schedule_qs.exists():
        schedule = schedule_qs.first()
    else:
        schedule, _ = IntervalSchedule.objects.get_or_create(
            every=1,
            period=IntervalSchedule.MINUTES,
        )

    PeriodicTask.objects.update_or_create(
        name='Refresh All Sensor Cache', 
        defaults={
            'interval': schedule,
            'task': 'sep2025_project_team_004.sensor_data.tasks.refresh_all_sensors',
        },
    )
