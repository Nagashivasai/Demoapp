FROM node:20-alpine3.17


RUN mkdir Demoapp

COPY package.json Demoapp/
#COPY package-locK.json /Demoapp/

COPY Server.js Demoapp/

RUN cd ..
WORKDIR /Demoapp/

RUN npm install

RUN npm install express mongoose body-parser bcrypt nodemailer

CMD ["npm","start"]