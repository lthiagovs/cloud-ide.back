FROM node:18-alpine

WORKDIR /app

# Instala dependências globais
RUN npm install -g @nestjs/cli

# Copia package files
COPY package*.json ./

# Instala dependências
RUN npm install

# Copia código fonte
COPY . .

# Expõe porta
EXPOSE 3000

# Força modo development diretamente
CMD ["npx", "nest", "start", "--watch"]