### Project Setup

`cd client`  
`pnpm i`

`cd ../server`  
`pnpm i`

`cd ..`  
`docker compose up --build`

`cd server`  
`pnpm db:migrate`

Can manually edit data using
`pnpm db:studio`
