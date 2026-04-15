import pyodbc
import sys

def check_db():
    server = 'DESKTOP-GP2116L'
    database = 'worker_seat_tracker'
    driver = '{ODBC Driver 17 for SQL Server}'
    
    # Connect to master to check/create database
    conn_str = f'DRIVER={driver};SERVER={server};DATABASE=master;Trusted_Connection=yes;'
    
    try:
        conn = pyodbc.connect(conn_str, autocommit=True)
        cursor = conn.cursor()
        
        # Check if database exists
        cursor.execute(f"SELECT name FROM sys.databases WHERE name = '{database}'")
        if not cursor.fetchone():
            print(f"Database '{database}' not found. Creating...")
            cursor.execute(f"CREATE DATABASE {database}")
            print(f"Database '{database}' created successfully.")
        else:
            print(f"Database '{database}' already exists.")
            
        conn.close()
        return True
    except Exception as e:
        print(f"Error connecting to SQL Server: {e}")
        return False

if __name__ == "__main__":
    if check_db():
        sys.exit(0)
    else:
        sys.exit(1)
