FROM node:argon


COPY . /srv

RUN apt-get update
RUN apt-get install php5-cli -y

COPY .docker/php.ini /etc/php5/cli/php.ini

RUN useradd -ms /bin/rbash phpuser

WORKDIR /srv

CMD node server
