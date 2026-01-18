FROM node:latest AS base

ENV CONTAINER_USER node
ENV CONTAINER_GROUP node
ENV CONTAINER_UID 1000

ARG DEBIAN_FRONTEND=noninteractive
RUN apt-get update && apt-get install -y \
    software-properties-common \
    rsync \
    curl \
    gcc \
    g++ \
    sudo \
    build-essential \
    && apt-get update

RUN echo "$CONTAINER_USER ALL=(ALL) NOPASSWD: ALL" > /etc/sudoers.d/$CONTAINER_USER && \
    chmod 0440 /etc/sudoers.d/$CONTAINER_USER

WORKDIR /home/$CONTAINER_USER
RUN chown $CONTAINER_USER:$CONTAINER_GROUP -R /home/$CONTAINER_USER

USER $CONTAINER_USER

WORKDIR /home/$CONTAINER_USER
COPY --chown=$CONTAINER_USER:$CONTAINER_GROUP  . workout_tracking

SHELL [ "/bin/bash", "-c" ]
ENV SHELL=/bin/bash

FROM base as build_cpu
