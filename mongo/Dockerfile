# Create proxy container for www.example.com
#
# docker build -t mongo .

FROM mongo:8-noble

MAINTAINER Luke Berndt <lukekb@gmail.com>

# Set timezone
 ENV TZ=America/New_York
 RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone

    
# Add main NGINX config
RUN mkdir -p /app
ADD totals.js /app
ADD init_test_db.js /app
ADD upgrade_db_admin.js /app
ADD permissions.js /app
ADD errors.js /app
ADD scripts /app/scripts
# A new, empty database gets the app's indexes on first start. This only runs
# when /data/db is empty, so it never touches an existing database.
ADD scripts/init-indexes.js /docker-entrypoint-initdb.d/10-indexes.js

ENV GLIBC_TUNABLES=glibc.pthread.rseq=0

WORKDIR /app
