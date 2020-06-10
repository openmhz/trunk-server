# Create proxy container for www.example.com
#
# docker build -t nginx-proxy .

FROM nginx
ARG STAGE

MAINTAINER Luke Berndt <lukekb@gmail.com>

# Set timezone
RUN echo "America/New_York" > /etc/timezone \
 && dpkg-reconfigure -f noninteractive tzdata

# Install wget and install/updates certificates
RUN apt-get update \
 && apt-get install -y -q --no-install-recommends \
    ca-certificates \
    wget \
 && apt-get clean \
 && rm -r /var/lib/apt/lists/*

# Add main NGINX config
COPY *.conf /etc/nginx/
COPY htpasswd /etc/nginx/
COPY ${STAGE}/certs/ /etc/nginx/certs/

# Add virtual hosts
COPY ${STAGE}/vhosts/ /etc/nginx/conf.d/
