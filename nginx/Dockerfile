FROM nginx:alpine

# Remove default configuration
RUN rm /etc/nginx/conf.d/default.conf

# Copy custom AgriHive AI Nginx configuration
COPY agrihive.conf /etc/nginx/conf.d/agrihive.conf

EXPOSE 80 443

CMD ["nginx", "-g", "daemon off;"]
