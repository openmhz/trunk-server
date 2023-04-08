# Create proxy container for www.example.com
#
# docker build -t mongo .

FROM mongo:5.0

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

# Add crontab file in the cron directory
#ADD crontab /etc/cron.d/trim-cron

# Give execution rights on the cron job
#RUN chmod 0644 /etc/cron.d/trim-cron

# Run the command on container startup
#CMD cron
WORKDIR /app
