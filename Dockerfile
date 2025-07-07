# Usa Node.js 18 Alpine per essere leggero
FROM node:18-alpine

# Directory di lavoro nel container
WORKDIR /app

# Copia package.json e package-lock.json
COPY package*.json ./

# Installa le dipendenze
RUN npm install

# Copia tutto il codice sorgente
COPY . .

# Definisci gli argomenti di build per le variabili d'ambiente
ARG VITE_API_PROTOCOL=http
ARG VITE_API_HOST=salernocruises.it
ARG VITE_API_PORT=8001

# Imposta le variabili d'ambiente per il processo di build
ENV VITE_API_PROTOCOL=$VITE_API_PROTOCOL
ENV VITE_API_HOST=$VITE_API_HOST
ENV VITE_API_PORT=$VITE_API_PORT

# Build dell'applicazione per produzione
RUN npm run build

# Installa un server HTTP semplice globalmente
RUN npm install -g serve

# Espone la porta 8002
EXPOSE 8002

# Comando per servire l'app buildato sulla porta 8002
CMD ["serve", "-s", "dist", "-l", "8002"]
