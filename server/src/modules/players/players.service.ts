export type Player = {
  id: string;
  username: string;
  country: string;
  score: number;
};

const players: Player[] = [
  {
    id: "player-1",
    username: "DragonSlayer",
    country: "TR",
    score: 9800
  },
  {
    id: "player-2",
    username: "ShadowHunter",
    country: "US",
    score: 9200
  },
  {
    id: "player-3",
    username: "PixelQueen",
    country: "DE",
    score: 8700
  }
];

export function getPlayers() {
  return players;
}

export function getPlayerById(id: string) {
  return players.find((player) => player.id === id);
}