FROM python:3.5-stretch
MAINTAINER Reed Odeneal <reed.odeneal@icg360.com>

RUN apt-get -y update && \
	apt-get -y install \
	python-psycopg2 \
	libpq-dev \
	wget

RUN wget -O /usr/local/bin/crypttool \
    https://raw.githubusercontent.com/icg360/sempl/master/crypttool
RUN chmod +x /usr/local/bin/crypttool

RUN mkdir -p /opt/snowflake-backend/vars/
ADD vars /opt/snowflake-backend/vars/

ADD start.sh /opt/snowflake-backend/
RUN chmod +x /opt/snowflake-backend/start.sh

ADD snowflake-backend.tar /opt/snowflake-backend/
RUN pip3 install /opt/snowflake-backend/

CMD ["/opt/snowflake-backend/start.sh"]