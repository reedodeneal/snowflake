#!/bin/bash -ea

if [ -z "${ENVIRONMENT}" ]; then
  echo "No environment defined.  Exiting..."
  exit 1
fi

/usr/local/bin/crypttool -p ${SECRET} decrypt /opt/snowflake-backend/vars/${ENVIRONMENT}_secrets.env.enc
source /opt/snowflake-backend/vars/${ENVIRONMENT}_secrets.env

rm -rf /opt/snowflake-backend/vars/.*.env

cd /opt/snowflake-backend/ && python3 app.py