import pyodbc
import logging

logging.basicConfig(level=logging.INFO)

def create_database():
    server = 'DESKTOP-GP2116L'
    database = 'master'
    new_db = 'WorkerSeatTracker'
    
    # Connection string for master database
    conn_str = f'DRIVER={{ODBC Driver 17 for SQL Server}};SERVER={server};DATABASE={database};Trusted_Connection=yes'
    
    try:
        # Connect to master
        conn = pyodbc.connect(conn_str, autocommit=True)
        cursor = conn.cursor()
        
        # Check if database exists
        cursor.execute(f"SELECT name FROM sys.databases WHERE name = '{new_db}'")
        if cursor.fetchone():
            logging.info(f"Database {new_db} already exists.")
        else:
            logging.info(f"Creating database {new_db}...")
            cursor.execute(f"CREATE DATABASE {new_db}")
            logging.info(f"Database {new_db} created successfully.")
            
        cursor.close()
        conn.close()
        return True
    except Exception as e:
        logging.error(f"Failed to create database: {e}")
        return False

if __name__ == "__main__":
    create_database()
