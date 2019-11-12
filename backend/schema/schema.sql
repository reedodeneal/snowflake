CREATE DATABASE "snowflake-backend";
CREATE TABLE IF NOT EXISTS user_data (
          username varchar(20) PRIMARY KEY,
          json jsonb NOT NULL
)