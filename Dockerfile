FROM node:argon

# Create app directory
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

# Install app dependencies
COPY . /usr/src/app/
RUN npm install

# install services
RUN echo "Europe/Paris" > /etc/timezone && \
    dpkg-reconfigure tzdata && \
    apt-get -y update && \
    apt-get -y upgrade && \
    apt-get -y install \
        mongodb-server

# configure mongodb
RUN sed -i -- 's/^bind_ip = 127.0.0.1/bind_ip = 0.0.0.0/g' /etc/mongodb.conf
RUN mkdir -p /data/db

# expose ports
EXPOSE 27017
EXPOSE 28017
EXPOSE 3042
RUN chmod 755 /usr/src/app/start
CMD ["/usr/src/app/start"]
