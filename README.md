### Project Setup

`pnpm i -r`
`docker compose up --build`

`cd server`
`pnpm db:migrate`
`pnpm db:seed <your email>`

Can manually edit data using
`pnpm db:studio`
