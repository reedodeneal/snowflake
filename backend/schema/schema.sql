CREATE DATABASE "snowflake-backend";
CREATE TABLE IF NOT EXISTS user_value_hashes (
          username varchar(20) PRIMARY KEY,
          value_hash jsonb NOT NULL
)