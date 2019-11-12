FROM node:13
MAINTAINER Reed Odeneal <reed.odeneal@icg360.com>

WORKDIR /usr/src/eng-growth
ADD build.tar .

RUN yarn && yarn export

EXPOSE 3000

ENV NODE_ENV="production"
CMD ["yarn", "start"]