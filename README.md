# TriTogether - API

REST api for tritogether app. An open source triathlon training application.

[Swagger docs](https://tritogether-api.herokuapp.com/swagger-html)

[https://tritogether.net](https://tritogether.net)

[Trello Kanban](https://trello.com/b/LxZhBnJM/tritogether)

## Pre-reqs
- Docker
- Node

## Getting started
Create file `.env` using `.example.env` as a base and configure the database connection (postgres included already in the docker-compose).

Then run:
```
docker-compose up -d
npm run watch-server
```

```
npm run test:integration:local
```

## Frontend
This is just the API part, the frontend (ionic app) is located in another [repo](https://github.com/javieraviles/tritogether-client).

## How to create a DB migration
Either make the change in the DB and [generate the migration using TypeORM](https://github.com/typeorm/typeorm/blob/master/docs/migrations.md#generating-migrations), although this method looks a bit tricky to me and you have to configure the typeORM cli locally and hardcode a DB connection in a `ormconfig.json` file. This method might be worth in case generating the queries manually sounds very tricky to you.

What I would recommend is just creating a new `.ts` file in `src/migration` dir, generating the timestamp manually and writing the query yourself.

Migrations will be executed on application startup due to the configuration specified in the DB connection.

## Boilerplate details
For further information in how the different boilerplate components interact, please refer to [node-typescript-koa-rest](https://github.com/javieraviles/node-typescript-koa-rest) repo.

## Git usage
This project uses [Github Flow](https://guides.github.com/introduction/flow/).