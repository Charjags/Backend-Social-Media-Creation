const express = require('express');
const { Client } = require('pg');
  
const app = express();
const PORT = 3000;

const client = new Client({
    user:'postgres',
    host: 'localhost',
    database: 'startup',
    password: 'cjags100',
    port: 5432,
  });
  
  client.connect();

  

  
app.listen(PORT, (error) =>{
    if(!error)
        console.log("Server is Successfully Running, and App is listening on port "+ PORT)
    else 
        console.log("Error occurred, server can't start", error);
    }
);