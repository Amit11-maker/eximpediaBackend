FROM node

WORKDIR /app

COPY package.json .

COPY package-lock.json .

ENV PATH /app/node_modules/.bin:$PATH

COPY . .

RUN npm i

EXPOSE 4300

CMD ["npm","start"]