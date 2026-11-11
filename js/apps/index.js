// App registry: home-screen order and dock.
import market from './market.js';
import inventory from './inventory.js';
import { jobsApp, freeApp } from './work.js';
import { repairApp, legitApp, labApp, deliveryApp } from './workshop.js';
import { auctionApp, shopApp } from './trade.js';
import { profileApp, realtyApp, travelApp, mapApp, pawnApp } from './life.js';
import { bankApp, govApp, stocksApp, numbersApp, casinoApp } from './money.js';
import { businessApp } from './business.js';
import { questsApp, upgradesApp, newsApp, statsApp, ratingApp, settingsApp } from './misc.js';
import { appstoreApp, vpnApp, darkApp } from './appstore.js';
import { hwApp, buildApp, computerApp } from './pc_apps.js';

export const APPS = [
  appstoreApp, vpnApp, darkApp,
  market, bankApp, deliveryApp, casinoApp,
  settingsApp, auctionApp, repairApp, govApp,
  upgradesApp, shopApp, questsApp, travelApp,
  stocksApp, numbersApp, realtyApp, businessApp,
  jobsApp, labApp, freeApp, legitApp,
  mapApp, pawnApp, newsApp, ratingApp,
  statsApp, profileApp, inventory,
  hwApp, buildApp, computerApp,
];
export const DOCK = ['market', 'inventory', 'jobs', 'map'];
