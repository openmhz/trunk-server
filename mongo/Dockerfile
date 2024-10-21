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
ADD clean.js /app
ADD remove_old_systems.js /app

ENV GLIBC_TUNABLES=glibc.pthread.rseq=0

WORKDIR /app
