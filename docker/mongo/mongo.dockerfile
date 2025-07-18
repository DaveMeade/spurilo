FROM mongo

COPY ./data/* /data/db/
#COPY ./mongo/mongo/mongo-setup.sh /docker-entrypoint-initdb.d/mongo-setup.sh
#COPY .//mongo/JSON/esperanto_cards.json /docker-entrypoint-initdb.d/esperanto_cards.json

EXPOSE 27017