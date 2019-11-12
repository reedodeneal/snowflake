FROM python:3.7.5
MAINTAINER Reed Odeneal <reed.odeneal@icg360.com>

RUN apt-get -y update && \
	apt-get -y install \
	python-psycopg2 \
	libpq-dev \
	wget

RUN wget -O /usr/local/bin/crypttool \
    https://raw.githubusercontent.com/icg360/sempl/master/crypttool
RUN chmod +x /usr/local/bin/crypttool

RUN mkdir -p /opt/eng-growth/vars/
ADD vars /opt/eng-growth/vars/

ADD start.sh /opt/eng-growth/
RUN chmod +x /opt/eng-growth/start.sh

ADD build.tar /opt/eng-growth/
RUN pip3 install /opt/eng-growth/

CMD ["/opt/eng-growth/start.sh"]