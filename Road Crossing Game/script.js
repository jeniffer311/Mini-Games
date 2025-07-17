import React, { useRef, useEffect } from "https://esm.sh/react";
import { createRoot } from "https://esm.sh/react-dom/client";
import { Canvas, useFrame, useThree } from "https://esm.sh/@react-three/fiber";
import { Bounds } from "https://esm.sh/@react-three/drei";
import * as THREE from "https://esm.sh/three";
import { create } from "https://esm.sh/zustand";

const minTileIndex = -8;
const maxTileIndex = 8;
const tilesPerRow = maxTileIndex - minTileIndex + 1;
const tileSize = 42;

const playerState = {
  currentRow: 0,
  currentTile: 0,
  movesQueue: [],
  ref: null };


function queueMove(direction) {
  const isValidMove = endsUpInValidPosition(
  { rowIndex: playerState.currentRow, tileIndex: playerState.currentTile },
  [...playerState.movesQueue, direction]);


  if (!isValidMove) return;

  playerState.movesQueue.push(direction);
}

function stepCompleted() {
  const direction = playerState.movesQueue.shift();

  if (direction === "forward") playerState.currentRow += 1;
  if (direction === "backward") playerState.currentRow -= 1;
  if (direction === "left") playerState.currentTile -= 1;
  if (direction === "right") playerState.currentTile += 1;

  if (playerState.currentRow === useMapStore.getState().rows.length - 10) {
    useMapStore.getState().addRows();
  }

  useGameStore.getState().updateScore(playerState.currentRow);
}

function setPlayerRef(ref) {
  playerState.ref = ref;
}

function resetPlayerStore() {
  playerState.currentRow = 0;
  playerState.currentTile = 0;
  playerState.movesQueue = [];

  if (!playerState.ref) return;
  playerState.ref.position.x = 0;
  playerState.ref.position.y = 0;
  playerState.ref.children[0].rotation.z = 0;
}

const useGameStore = create(set => ({
  status: "running",
  score: 0,
  updateScore: rowIndex => {
    set(state => ({ score: Math.max(rowIndex, state.score) }));
  },
  endGame: () => {
    set({ status: "over" });
  },
  reset: () => {
    useMapStore.getState().reset();
    resetPlayerStore();
    set({ status: "running", score: 0 });
  } }));


const useMapStore = create(set => ({
  rows: generateRows(20),
  addRows: () => {
    const newRows = generateRows(20);
    set(state => ({ rows: [...state.rows, ...newRows] }));
  },
  reset: () => set({ rows: generateRows(20) }) }));


function Game() {
  return (
    React.createElement("div", { className: "game" }, 
    React.createElement(Scene, null, 
    React.createElement(Player, null),
    React.createElement(Map, null)), 

    React.createElement(Score, null), 
    React.createElement(Controls, null), 
    React.createElement(Result, null)));


}

const Scene = ({ children }) => {
  return (
    React.createElement(Canvas, {
      orthographic: true,
      shadows: true,
      camera: {
        up: [0, 0, 1],
        position: [300, -300, 300] } },


    React.createElement("ambientLight", null),
    children));


};

function Controls() {
  useEventListeners();

  return (
    React.createElement("div", { id: "controls" }, 
    React.createElement("div", null, 
    React.createElement("button", { onClick: () => queueMove("forward") }, "\u25B2"), 
    React.createElement("button", { onClick: () => queueMove("left") }, "\u25C0"), 
    React.createElement("button", { onClick: () => queueMove("backward") }, "\u25BC"), 
    React.createElement("button", { onClick: () => queueMove("right") }, "\u25B6"))));



}

function Score() {
  const score = useGameStore(state => state.score);

  return React.createElement("div", { id: "score" }, score);
}

function Result() {
  const status = useGameStore(state => state.status);
  const score = useGameStore(state => state.score);
  const reset = useGameStore(state => state.reset);

  if (status === "running") return null;

  return (
    React.createElement("div", { id: "result-container" },
    React.createElement("div", { id: "result" }, 
    React.createElement("h1", null, "Game Over"), 
    React.createElement("p", null, "Your score: ", score), 
    React.createElement("button", { onClick: reset }, "Retry"))));



}

function Player() {
  const player = useRef(null);
  const lightRef = useRef(null);
  const camera = useThree(state => state.camera);

  usePlayerAnimation(player);

  useEffect(() => {
    if (!player.current) return;
    if (!lightRef.current) return;

    player.current.add(camera);
    lightRef.current.target = player.current;

    setPlayerRef(player.current);
  });

  return (
    React.createElement(Bounds, { fit: true, clip: true, observe: true, margin: 10 }, 
    React.createElement("group", { ref: player }, 
    React.createElement("group", null, 
    React.createElement("mesh", { position: [0, 0, 10], castShadow: true, receiveShadow: true }, 
    React.createElement("boxGeometry", { args: [15, 15, 20] }), 
    React.createElement("meshLambertMaterial", { color: 0xffffff, flatShading: true })),

    React.createElement("mesh", { position: [0, 0, 21], castShadow: true, receiveShadow: true }, 
    React.createElement("boxGeometry", { args: [2, 4, 2] }), 
    React.createElement("meshLambertMaterial", { color: 0xf0619a, flatShading: true }))),


    React.createElement(DirectionalLight, { ref: lightRef }))));



}

function DirectionalLight({ ref }) {
  return (
    React.createElement("directionalLight", {
      ref: ref,
      position: [-100, -100, 200],
      up: [0, 0, 1],
      castShadow: true,
      "shadow-mapSize": [2048, 2048],
      "shadow-camera-left": -400,
      "shadow-camera-right": 400,
      "shadow-camera-top": 400,
      "shadow-camera-bottom": -400,
      "shadow-camera-near": 50,
      "shadow-camera-far": 400 }));


}

function Map() {
  const rows = useMapStore(state => state.rows);

  return (
    React.createElement(React.Fragment, null,
    React.createElement(Grass, { rowIndex: 0 }), 
    React.createElement(Grass, { rowIndex: -1 }), 
    React.createElement(Grass, { rowIndex: -2 }), 
    React.createElement(Grass, { rowIndex: -3 }), 
    React.createElement(Grass, { rowIndex: -4 }),
    React.createElement(Grass, { rowIndex: -5 }), 
    React.createElement(Grass, { rowIndex: -6 }), 
    React.createElement(Grass, { rowIndex: -7 }), 
    React.createElement(Grass, { rowIndex: -8 }),

    rows.map((rowData, index) =>
    React.createElement(Row, { key: index, rowIndex: index + 1, rowData: rowData }))));



}

function Row({ rowIndex, rowData }) {
  switch (rowData.type) {
    case "forest":{
        return React.createElement(Forest, { rowIndex: rowIndex, rowData: rowData });
      }
    case "car":{
        return React.createElement(CarLane, { rowIndex: rowIndex, rowData: rowData });
      }
    case "truck":{
        return React.createElement(TruckLane, { rowIndex: rowIndex, rowData: rowData });
      }}

}

function Forest({ rowIndex, rowData }) {
  return (
    React.createElement(Grass, { rowIndex: rowIndex },
    rowData.trees.map((tree, index) =>
    React.createElement(Tree, { key: index, tileIndex: tree.tileIndex, height: tree.height }))));



}

function CarLane({ rowIndex, rowData }) {
  return (
    React.createElement(Road, { rowIndex: rowIndex },
    rowData.vehicles.map((vehicle, index) => 
    React.createElement(Car, {
      key: index,
      rowIndex: rowIndex,
      initialTileIndex: vehicle.initialTileIndex,
      direction: rowData.direction,
      speed: rowData.speed,
      color: vehicle.color }))));




}

function TruckLane({ rowIndex, rowData }) {
  return (
    React.createElement(Road, { rowIndex: rowIndex },
    rowData.vehicles.map((vehicle, index) => 
    React.createElement(Truck, {
      key: index,
      rowIndex: rowIndex,
      color: vehicle.color,
      initialTileIndex: vehicle.initialTileIndex,
      direction: rowData.direction,
      speed: rowData.speed }))));




}

function Grass({ rowIndex, children }) {
  return (
    React.createElement("group", { "position-y": rowIndex * tileSize }, 
    React.createElement("mesh", { receiveShadow: true }, 
    React.createElement("boxGeometry", { args: [tilesPerRow * tileSize, tileSize, 3] }), 
    React.createElement("meshLambertMaterial", { color: 0xbaf455, flatShading: true })), 

    React.createElement("mesh", { receiveShadow: true, "position-x": tilesPerRow * tileSize }, 
    React.createElement("boxGeometry", { args: [tilesPerRow * tileSize, tileSize, 3] }), 
    React.createElement("meshLambertMaterial", { color: 0x99c846, flatShading: true })), 
    React.createElement("mesh", { receiveShadow: true, "position-x": -tilesPerRow * tileSize }, 
    React.createElement("boxGeometry", { args: [tilesPerRow * tileSize, tileSize, 3] }), 
    React.createElement("meshLambertMaterial", { color: 0x99c846, flatShading: true })),

    children));


}

function Road({ rowIndex, children }) {
  return (
    React.createElement("group", { "position-y": rowIndex * tileSize }, 
    React.createElement("mesh", { receiveShadow: true }, 
    React.createElement("planeGeometry", { args: [tilesPerRow * tileSize, tileSize] }), 
    React.createElement("meshLambertMaterial", { color: 0x454a59, flatShading: true })),

    React.createElement("mesh", { receiveShadow: true, "position-x": tilesPerRow * tileSize }, 
    React.createElement("planeGeometry", { args: [tilesPerRow * tileSize, tileSize] }), 
    React.createElement("meshLambertMaterial", { color: 0x393d49, flatShading: true })), 

    React.createElement("mesh", { receiveShadow: true, "position-x": -tilesPerRow * tileSize }, 
    React.createElement("planeGeometry", { args: [tilesPerRow * tileSize, tileSize] }), 
    React.createElement("meshLambertMaterial", { color: 0x393d49, flatShading: true })),

    children));


}

function Tree({ tileIndex, height }) {
  return (
    React.createElement("group", { "position-x": tileIndex * tileSize }, 
    React.createElement("mesh", { "position-z": height / 2 + 20, castShadow: true, receiveShadow: true }, 
    React.createElement("boxGeometry", { args: [30, 30, height] }), 
    React.createElement("meshLambertMaterial", { color: 0x7aa21d, flatShading: true })), 

    React.createElement("mesh", { "position-z": 10, castShadow: true, receiveShadow: true }, 
    React.createElement("boxGeometry", { args: [15, 15, 20] }), 
    React.createElement("meshLambertMaterial", { color: 0x4d2926, flatShading: true }))));



}

function Car({ rowIndex, initialTileIndex, direction, speed, color }) {
  const car = useRef(null);
  useVehicleAnimation(car, direction, speed);
  useHitDetection(car, rowIndex);

  return (
    React.createElement("group", {
      "position-x": initialTileIndex * tileSize,
      "rotation-z": direction ? 0 : Math.PI,
      ref: car }, 

    React.createElement("mesh", { position: [0, 0, 12], castShadow: true, receiveShadow: true }, 
    React.createElement("boxGeometry", { args: [60, 30, 15] }), 
    React.createElement("meshLambertMaterial", { color: color, flatShading: true })), 

    React.createElement("mesh", { position: [-6, 0, 25.5], castShadow: true, receiveShadow: true }, 
    React.createElement("boxGeometry", { args: [33, 24, 12] }), 
    React.createElement("meshLambertMaterial", { color: 0xffffff, flatShading: true })), 

    React.createElement(Wheel, { x: -18 }), 
    React.createElement(Wheel, { x: 18 })));


}

function Truck({ rowIndex, initialTileIndex, direction, speed, color }) {
  const truck = useRef(null);
  useVehicleAnimation(truck, direction, speed);
  useHitDetection(truck, rowIndex);

  return (
    React.createElement("group", {
      "position-x": initialTileIndex * tileSize,
      "rotation-z": direction ? 0 : Math.PI,
      ref: truck }, 

    React.createElement("mesh", { position: [-15, 0, 25], castShadow: true, receiveShadow: true }, 
    React.createElement("boxGeometry", { args: [70, 35, 35] }), 
    React.createElement("meshLambertMaterial", { color: 0xb4c6fc, flatShading: true })), 

    React.createElement("mesh", { position: [35, 0, 20], castShadow: true, receiveShadow: true }, 
    React.createElement("boxGeometry", { args: [30, 30, 30] }), 
    React.createElement("meshLambertMaterial", { color: color, flatShading: true })), 

    React.createElement(Wheel, { x: -35 }), 
    React.createElement(Wheel, { x: 5 }), 
    React.createElement(Wheel, { x: 37 })));


}

function Wheel({ x }) {
  return (
    React.createElement("mesh", { position: [x, 0, 6] }, 
    React.createElement("boxGeometry", { args: [12, 33, 12] }), 
    React.createElement("meshLambertMaterial", { color: 0x333333, flatShading: true })));


}

function useVehicleAnimation(ref, direction, speed) {
  useFrame((state, delta) => {
    if (!ref.current) return;
    const vehicle = ref.current;

    const beginningOfRow = (minTileIndex - 2) * tileSize;
    const endOfRow = (maxTileIndex + 2) * tileSize;

    if (direction) {
      vehicle.position.x =
      vehicle.position.x > endOfRow ?
      beginningOfRow :
      vehicle.position.x + speed * delta;
    } else {
      vehicle.position.x =
      vehicle.position.x < beginningOfRow ?
      endOfRow :
      vehicle.position.x - speed * delta;
    }
  });
}

function useEventListeners() {
  useEffect(() => {
    const handleKeyDown = event => {
      if (event.key === "ArrowUp") {
        event.preventDefault();
        queueMove("forward");
      } else if (event.key === "ArrowDown") {
        event.preventDefault();
        queueMove("backward");
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        queueMove("left");
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        queueMove("right");
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);
}

function usePlayerAnimation(ref) {
  const moveClock = new THREE.Clock(false);

  useFrame(() => {
    if (!ref.current) return;
    if (!playerState.movesQueue.length) return;
    const player = ref.current;

    if (!moveClock.running) moveClock.start();

    const stepTime = 0.2; 
    const progress = Math.min(1, moveClock.getElapsedTime() / stepTime);

    setPosition(player, progress);
    setRotation(player, progress);

    if (progress >= 1) {
      stepCompleted();
      moveClock.stop();
    }
  });
}

function setPosition(player, progress) {
  const startX = playerState.currentTile * tileSize;
  const startY = playerState.currentRow * tileSize;
  let endX = startX;
  let endY = startY;

  if (playerState.movesQueue[0] === "left") endX -= tileSize;
  if (playerState.movesQueue[0] === "right") endX += tileSize;
  if (playerState.movesQueue[0] === "forward") endY += tileSize;
  if (playerState.movesQueue[0] === "backward") endY -= tileSize;

  player.position.x = THREE.MathUtils.lerp(startX, endX, progress);
  player.position.y = THREE.MathUtils.lerp(startY, endY, progress);
  player.children[0].position.z = Math.sin(progress * Math.PI) * 8;
}

function setRotation(player, progress) {
  let endRotation = 0;
  if (playerState.movesQueue[0] == "forward") endRotation = 0;
  if (playerState.movesQueue[0] == "left") endRotation = Math.PI / 2;
  if (playerState.movesQueue[0] == "right") endRotation = -Math.PI / 2;
  if (playerState.movesQueue[0] == "backward") endRotation = Math.PI;

  player.children[0].rotation.z = THREE.MathUtils.lerp(
  player.children[0].rotation.z,
  endRotation,
  progress);

}

function calculateFinalPosition(currentPosition, moves) {
  return moves.reduce((position, direction) => {
    if (direction === "forward")
    return {
      rowIndex: position.rowIndex + 1,
      tileIndex: position.tileIndex };

    if (direction === "backward")
    return {
      rowIndex: position.rowIndex - 1,
      tileIndex: position.tileIndex };

    if (direction === "left")
    return {
      rowIndex: position.rowIndex,
      tileIndex: position.tileIndex - 1 };

    if (direction === "right")
    return {
      rowIndex: position.rowIndex,
      tileIndex: position.tileIndex + 1 };

    return position;
  }, currentPosition);
}

function endsUpInValidPosition(currentPosition, moves) {
  const finalPosition = calculateFinalPosition(currentPosition, moves);

  if (
  finalPosition.rowIndex === -1 ||
  finalPosition.tileIndex === minTileIndex - 1 ||
  finalPosition.tileIndex === maxTileIndex + 1)
  {
    return false;
  }

  const finalRow = useMapStore.getState().rows[finalPosition.rowIndex - 1];
  if (
  finalRow &&
  finalRow.type === "forest" &&
  finalRow.trees.some(tree => tree.tileIndex === finalPosition.tileIndex))
  {
    return false;
  }

  return true;
}

function generateRows(amount) {
  const rows = [];
  for (let i = 0; i < amount; i++) {
    const rowData = generateRow();
    rows.push(rowData);
  }
  return rows;
}

function generateRow() {
  const type = randomElement(["car", "truck", "forest"]);
  if (type === "car") return generateCarLaneMetadata();
  if (type === "truck") return generateTruckLaneMetadata();
  return generateForesMetadata();
}

function randomElement(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function generateForesMetadata() {
  const occupiedTiles = new Set();
  const trees = Array.from({ length: 4 }, () => {
    let tileIndex;
    do {
      tileIndex = THREE.MathUtils.randInt(minTileIndex, maxTileIndex);
    } while (occupiedTiles.has(tileIndex));
    occupiedTiles.add(tileIndex);

    const height = randomElement([20, 45, 60]);

    return { tileIndex, height };
  });

  return { type: "forest", trees };
}

function generateCarLaneMetadata() {
  const direction = randomElement([true, false]);
  const speed = randomElement([125, 156, 188]);

  const occupiedTiles = new Set();

  const vehicles = Array.from({ length: 3 }, () => {
    let initialTileIndex;
    do {
      initialTileIndex = THREE.MathUtils.randInt(minTileIndex, maxTileIndex);
    } while (occupiedTiles.has(initialTileIndex));
    occupiedTiles.add(initialTileIndex - 1);
    occupiedTiles.add(initialTileIndex);
    occupiedTiles.add(initialTileIndex + 1);

    const color = randomElement([0xa52523, 0xbdb638, 0x78b14b]);

    return { initialTileIndex, color };
  });

  return { type: "car", direction, speed, vehicles };
}

function generateTruckLaneMetadata() {
  const direction = randomElement([true, false]);
  const speed = randomElement([125, 156, 188]);

  const occupiedTiles = new Set();

  const vehicles = Array.from({ length: 2 }, () => {
    let initialTileIndex;
    do {
      initialTileIndex = THREE.MathUtils.randInt(minTileIndex, maxTileIndex);
    } while (occupiedTiles.has(initialTileIndex));
    occupiedTiles.add(initialTileIndex - 2);
    occupiedTiles.add(initialTileIndex - 1);
    occupiedTiles.add(initialTileIndex);
    occupiedTiles.add(initialTileIndex + 1);
    occupiedTiles.add(initialTileIndex + 2);

    const color = randomElement([0xa52523, 0xbdb638, 0x78b14b]);

    return { initialTileIndex, color };
  });

  return { type: "truck", direction, speed, vehicles };
}

function useHitDetection(vehicle, rowIndex) {
  const endGame = useGameStore(state => state.endGame);

  useFrame(() => {
    if (!vehicle.current) return;
    if (!playerState.ref) return;

    if (
    rowIndex === playerState.currentRow ||
    rowIndex === playerState.currentRow + 1 ||
    rowIndex === playerState.currentRow - 1)
    {
      const vehicleBoundingBox = new THREE.Box3();
      vehicleBoundingBox.setFromObject(vehicle.current);

      const playerBoundingBox = new THREE.Box3();
      playerBoundingBox.setFromObject(playerState.ref);

      if (playerBoundingBox.intersectsBox(vehicleBoundingBox)) {
        endGame();
      }
    }
  });
}

const root = createRoot(document.getElementById("root"));
root.render(React.createElement(Game, null));