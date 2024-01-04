import express from 'express';
const Route = express.Router();
const admin = require('./admin');
const client = require('./client');
const transaction = require('./transaction');
const booq = require('./booq');
const fred = require('./nft');
const superFred = require('./superFred');
const tvt = require('./tvt');

for (const property in admin) {
  Route.use('/admin', admin[property]);
}

for (const property in client) {
  Route.use('/client', client[property]);
}
for (const property in transaction) {
  Route.use('/transaction', transaction[property]);
}
for (const property in booq) {
  Route.use('/booq', booq[property]);
}
for (const property in fred) {
  Route.use('/fred', fred[property]);
}
for (const property in superFred) {
  Route.use('/superFred', superFred[property]);
}
for (const property in tvt) {
  Route.use('/tvt', tvt[property]);
}

export default Route;