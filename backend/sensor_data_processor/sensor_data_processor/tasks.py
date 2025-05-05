import os
import random
import datetime
import psycopg2
from psycopg2 import sql # Import sql module for safe identifier quoting
from celery import shared_task
from dotenv import load_dotenv
import logging

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Load environment variables
dotenv_path = os.path.join(os.path.dirname(__file__), '..', '.env')
load_dotenv(dotenv_path=dotenv_path)

DATABASE_URL = os.getenv('DATABASE_URL')

SENSOR_IDS = ["usda-air-w00"] # add more sensors here

def get_db_connection():
    """Establishes a connection to the PostgreSQL database."""
    if not DATABASE_URL:
        logger.error("DATABASE_URL environment variable is not set.")
        raise ValueError("Database URL is not configured.")
    try:
        # Setting autocommit=False to manage transactions explicitly
        conn = psycopg2.connect(DATABASE_URL)
        logger.debug("Database connection established.")
        return conn
    except psycopg2.OperationalError as e:
        logger.error(f"Error connecting to database: {e}")
        raise

def generate_sensor_data():
    """Generates a single simulated sensor reading."""
    # Ensure timestamp is timezone-aware (UTC)
    ts = datetime.datetime.now(datetime.timezone.utc)
    return {
        "time": ts, # Keep as datetime object for easier processing
        "pressure": round(random.uniform(980.0, 1020.0), 7),
        "humidity": round(random.uniform(40.0, 60.0), 8),
        "sensor": random.choice(SENSOR_IDS),
        "temperature": round(random.uniform(15.0, 25.0), 8),
        "vcc": random.randint(4000, 4300)
    }

def calculate_incremental_average(current_avg, current_datapoints, new_value):
    """Safely calculates the new average, handling potential None values."""
    if new_value is None:
        return current_avg # If new value is None, average doesn't change
    if current_datapoints == 0 or current_avg is None:
        return new_value # This is the first valid value
    return (current_avg * current_datapoints + new_value) / (current_datapoints + 1)


@shared_task
def process_sensor_data():
    """Generates sensor data, inserts it, and updates historical weekly averages incrementally."""
    logger.info("Starting process_sensor_data task...")
    conn = None
    try:
        conn = get_db_connection()

        # 1. Generate Data
        data = generate_sensor_data()
        sensor_id = data['sensor']
        timestamp = data['time'] # Use the datetime object
        # Convert timestamp to ISO format string ONLY for insertion if needed,
        # but keep the object for calculations
        timestamp_str = timestamp.isoformat()

        # Use ISO calendar for year and week number
        year, week_num, _ = timestamp.isocalendar()

        # 2. Insert Raw Data
        insert_sql = """
        INSERT INTO sensor_readings (timestamp, sensor_id, temperature, pressure, humidity, vcc)
        VALUES (%s, %s, %s, %s, %s, %s);
        """
        with conn.cursor() as cur:
            cur.execute(insert_sql, (
                timestamp, # Insert datetime object directly
                sensor_id,
                data['temperature'],
                data['pressure'],
                data['humidity'],
                data['vcc']
            ))
        # Do not commit yet, part of the larger transaction

        logger.info(f"Inserted data for sensor {sensor_id} at {timestamp_str}")

        # 3. Update Weekly Average Incrementally within a transaction
        with conn.cursor() as cur:
            # Lock the row for update, or prepare for insert
            select_for_update_sql = """
            SELECT avg_temperature, avg_pressure, avg_humidity, avg_vcc, datapoints
            FROM weekly_sensor_averages
            WHERE sensor_id = %s AND year = %s AND week_number = %s
            FOR UPDATE;
            """
            cur.execute(select_for_update_sql, (sensor_id, year, week_num))
            existing_avg = cur.fetchone()

            calculation_time = datetime.datetime.now(datetime.timezone.utc)

            if existing_avg:
                # Record exists, update it
                current_avg_temp, current_avg_press, current_avg_hum, current_avg_vcc, current_dp = existing_avg

                # Calculate new averages, handling None for potentially missing new values
                new_avg_temp = calculate_incremental_average(current_avg_temp, current_dp, data['temperature'])
                new_avg_press = calculate_incremental_average(current_avg_press, current_dp, data['pressure'])
                new_avg_hum = calculate_incremental_average(current_avg_hum, current_dp, data['humidity'])
                new_avg_vcc = calculate_incremental_average(current_avg_vcc, current_dp, data['vcc']) # VCC assumed not null

                new_dp = current_dp + 1

                update_sql = """
                UPDATE weekly_sensor_averages
                SET avg_temperature = %s, avg_pressure = %s, avg_humidity = %s, avg_vcc = %s,
                    datapoints = %s, calculation_timestamp = %s
                WHERE sensor_id = %s AND year = %s AND week_number = %s;
                """
                cur.execute(update_sql, (
                    new_avg_temp, new_avg_press, new_avg_hum, new_avg_vcc,
                    new_dp, calculation_time,
                    sensor_id, year, week_num
                ))
                logger.info(f"Updated weekly average for sensor {sensor_id}, year {year}, week {week_num}. Datapoints: {new_dp}")

            else:
                # Record doesn't exist, insert it (first data point for this week)
                # Initial averages are just the current data points
                insert_avg_sql = """
                INSERT INTO weekly_sensor_averages
                    (sensor_id, year, week_number,
                     avg_temperature, avg_pressure, avg_humidity, avg_vcc,
                     datapoints, calculation_timestamp)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s);
                """
                cur.execute(insert_avg_sql, (
                    sensor_id, year, week_num,
                    data['temperature'], data['pressure'], data['humidity'], data['vcc'],
                    1, calculation_time # Start with 1 datapoint
                ))
                logger.info(f"Inserted new weekly average for sensor {sensor_id}, year {year}, week {week_num}.")

            # Commit the transaction including the raw data insert and the average update/insert
            conn.commit()
            logger.debug("Transaction committed.")

        logger.info("process_sensor_data task finished successfully.")

    except (Exception, psycopg2.Error) as error:
        logger.error(f"Error in process_sensor_data task: {error}")
        if conn:
            logger.info("Rolling back transaction due to error.")
            conn.rollback()
    finally:
        if conn:
            conn.close()
            logger.debug("Database connection closed.") 