FROM node:20

WORKDIR /home/tjctgrader/coderunner

COPY ./package*.json ./
RUN npm install


COPY . .

RUN apt-get update && \
    apt-get install -y \
        flex \
        bison \
        build-essential \
        protobuf-compiler \
        libprotobuf-dev \
        libnl-3-dev \
        libnl-route-3-dev

RUN cd nsjail && make && cd ..

COPY dev/archive.zip /tmp/archive.zip
RUN apt-get update && apt-get install -y unzip
COPY dev/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh
ENTRYPOINT ["/entrypoint.sh"]

RUN apt-get update && apt-get install -y default-jdk && rm -rf /var/lib/apt/lists/*

RUN mkdir -p /home/tjctgrader/coderunner/subcode
RUN touch /home/tjctgrader/coderunner/test.py
RUN touch /home/tjctgrader/coderunner/test.java
RUN touch /home/tjctgrader/coderunner/test.cpp

EXPOSE 8080

CMD ["npm", "run", "dev"]
