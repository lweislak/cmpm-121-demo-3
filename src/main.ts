import "./style.css";

const APP_NAME = "D3: Geocoin Carrier";
//const app = document.querySelector<HTMLDivElement>("#app")!;
document.title = APP_NAME;

// @deno-types="npm:@types/leaflet@^1.9.14"
// deno-lint-ignore no-unused-vars
import leaflet, { LatLngBounds } from "leaflet";

import "leaflet/dist/leaflet.css";
import "./style.css";
import "./leafletWorkaround.ts";
import luck from "./luck.ts";

import { Board } from "./board.ts";

const OAKES_CLASSROOM = leaflet.latLng(36.98949379578401, -122.06277128548504);
const GAMEPLAY_ZOOM_LEVEL = 19;
const TILE_DEGREES = 1e-4;
const NEIGHBORHOOD_SIZE = 8;
const CACHE_SPAWN_PROBABILITY = 0.1;
const board = new Board(TILE_DEGREES, NEIGHBORHOOD_SIZE);

const map = leaflet.map(document.getElementById("map")!, {
  center: OAKES_CLASSROOM,
  zoom: GAMEPLAY_ZOOM_LEVEL,
  minZoom: GAMEPLAY_ZOOM_LEVEL,
  maxZoom: GAMEPLAY_ZOOM_LEVEL,
  zoomControl: false,
  scrollWheelZoom: false,
});

// Populate the map with a background tile layer
leaflet
  .tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution:
      '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  })
  .addTo(map);

// Add a marker to represent the player
const playerMarker = leaflet.marker(OAKES_CLASSROOM);
playerMarker.bindTooltip("You are here");
playerMarker.addTo(map);

// Display the player's coins
const statusPanel = document.querySelector<HTMLDivElement>("#statusPanel")!;
statusPanel.innerHTML = "No coins yet";

interface Coin {
  readonly i: number;
  readonly j: number;
  readonly serial: number;
}

interface Inventory {
  playerCoins: Coin[];
}
const playerInventory: Inventory = { playerCoins: [] };

// Add caches to the map by cell numbers
function spawnCache(i: number, j: number) {
  const bounds = board.getCellBounds({ i, j });

  // Add a rectangle to the map to represent the cache
  const rect = leaflet.rectangle(bounds);
  rect.addTo(map);

  // Handle interactions with the cache
  rect.bindPopup(() => {
    const numCoins = Math.floor(luck([i, j, "initialValue"].toString()) * 5);
    const coins = getCoins(i, j, numCoins);

    const popupDiv = document.createElement("div");
    popupDiv.innerHTML = `
                <div>Location: (${i} : ${j}), Number of coins: <span id="value">${coins.length}</span></div>
                <button id="collect">Collect</button>
                <button id="deposit">Deposit</button>`;

    //Coins are clickable buttons
    /*
    coins.forEach((coin) => {
      //popupDiv.append(`<button id="coin">(${coin.i} : ${coin.j}) #${coin.serial}</button>`);
      const button = document.createElement("button");
      button.innerHTML = `(${coin.i} : ${coin.j}) #${coin.serial}`;
      popupDiv.appendChild(button);
      button.addEventListener("click", () => {
        if (coins.length > 0) {
          coins.splice(coins.indexOf(coin), 1);
          playerInventory.playerCoins.push(coin);
          updateStatusPanel();
        }
      });
    });
    */

    // Clicking the button decrements the cache's value and increments the player's coins
    popupDiv.querySelector<HTMLButtonElement>("#collect")!.addEventListener(
      "click",
      () => {
        if (coins.length > 0) {
          playerInventory.playerCoins.push(coins.pop()!);
          updateStatusPanel();
          updatePopup(coins);
        }
      },
    );

    // Clicking the button increments the cache's value and decrements the player's coins
    popupDiv.querySelector<HTMLButtonElement>("#deposit")!.addEventListener(
      "click",
      () => {
        if (playerInventory.playerCoins.length > 0) {
          coins.push(playerInventory.playerCoins.pop()!);
          updateStatusPanel();
          updatePopup(coins);
        }
      },
    );
    return popupDiv;
  });
}

//Return array of avaliable coins in cache
function getCoins(ci: number, cj: number, numCoins: number): Coin[] {
  const coins: Coin[] = [];
  Array.from({ length: numCoins }, (_, i) => {
    const coin: Coin = {
      i: ci,
      j: cj,
      serial: i,
    };
    coins.push(coin);
  });
  return coins;
}

//This is so janky
//Update display of coins in player's inventory
function updateStatusPanel() {
  let currInventory = "";
  if (playerInventory.playerCoins.length <= 0) currInventory = "No coins yet";
  playerInventory.playerCoins.forEach((coin) => {
    currInventory += `(${coin.i}, ${coin.j} #${coin.serial}) `;
  });
  statusPanel.innerHTML = currInventory;
}

function updatePopup(coins: Coin[]) {
  document.querySelector<HTMLSpanElement>("#value")!.innerHTML = coins.length
    .toString();
}

board.getCellsNearPoint(OAKES_CLASSROOM).forEach((cell) => {
  if (luck([cell.i, cell.j].toString()) < CACHE_SPAWN_PROBABILITY) {
    spawnCache(cell.i, cell.j);
  }
});
