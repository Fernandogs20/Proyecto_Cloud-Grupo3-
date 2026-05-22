FROM python:3.10
RUN apt-get update && apt-get install -y openssh-client
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .