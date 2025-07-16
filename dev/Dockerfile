FROM node:20

WORKDIR /home/tjctgrader/coderunner

COPY ./package*.json ./
RUN npm install


COPY . .

RUN chmod +x /home/tjctgrader/coderunner/dev/generate_problems.sh
RUN bash /home/tjctgrader/coderunner/dev/generate_problems.sh

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

RUN chmod +x /home/tjctgrader/coderunner/generate_subcode.sh
RUN bash /home/tjctgrader/coderunner/generate_subcode.sh

EXPOSE 8080

CMD ["npm", "run", "dev"]
