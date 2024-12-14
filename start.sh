#!/bin/sh
# Start rsyslog
rsyslogd

# Get container name
CONTAINER_NAME=$(hostname)
# Update Zabbix agent config with the hostname
sed -i "s/Hostname=.*/Hostname=$CONTAINER_NAME/" /etc/zabbix/zabbix_agent2.conf
#Start Zabbix Agent 2
/usr/sbin/zabbix_agent2 &

# Start your app with PM2
pm2-runtime start dist/index.js --output /var/log/pm2/out.log --error /var/log/pm2/error.log
