#!/bin/bash -ea

if [ -z "${ENVIRONMENT}" ]; then
  echo "No environment defined.  Exiting..."
  exit 1
fi

/usr/local/bin/crypttool -p ${SECRET} decrypt /opt/eng-growth/vars/${ENVIRONMENT}_secrets.env.enc
source /opt/eng-growth/vars/${ENVIRONMENT}_secrets.env

rm -rf /opt/eng-growth/vars/.*.env

cd /opt/eng-growth/ && python3 app.py