FROM rust:1.88

WORKDIR /home/tjctgrader/coderunner

COPY . .

RUN apt-get update && \
    apt-get install -y \
        flex \
        bison \
        build-essential \
        protobuf-compiler \
        libprotobuf-dev \
        libnl-3-dev \
        libnl-route-3-dev \
        default-jdk
RUN cargo install --locked watchexec-cli

RUN cd nsjail && make && cd ..

COPY dev/*.cfg /home/tjctgrader/coderunner/nsjail/configs/

EXPOSE 8080

CMD ["watchexec", "-r", "--debounce", "1s", "cargo", "run"]
