FROM node:8.11

# Prepare non-root user and folders
RUN useradd --system --user-group --create-home app && \
    mkdir /app && chown app:app /app
RUN npm install -g nodemon

# Install dependency outside of the app volume
COPY package.json /opt/
RUN cd /opt && npm install
ENV NODE_PATH=/opt/node_modules

# Copy current directory to container
COPY . /app

USER app
WORKDIR /app

EXPOSE 4040
CMD ["npm", "start"]
