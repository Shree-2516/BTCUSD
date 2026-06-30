# Stage 1: Build the Vite React App
FROM node:18-alpine as build
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy source code and build
COPY . .
RUN npm run build

# Stage 2: Serve the app with Nginx
FROM nginx:alpine

# Copy the custom Nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy the build output to Nginx's html directory
COPY --from=build /app/dist /usr/share/nginx/html

# Expose port 80
EXPOSE 80

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]
