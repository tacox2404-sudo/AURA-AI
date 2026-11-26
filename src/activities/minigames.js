// MINI GAMES PACK (owned by Activities): quick two-player games in the style of
// iMessage game apps, with our own look. Each one is registered as an activity, and
// MINIGAME_LIST is what the 🎲 Play menu shows.
//   Board games: chess.js, boardgames.js (checkers, dots & boxes, mancala, flip, sea battle)
//   Skill games: skillgames.js (hoops, darts)
//   Engines:     duel.js

import './minigames.css';
import { chessGame } from './chess.js';
import { checkersGame, dotsGame, mancalaGame, flipGame, seaBattleGame } from './boardgames.js';
import { hoopsGame, dartsGame } from './skillgames.js';

export const MINIGAMES = {
  chess: { title: 'Chess', icon: '♟️', open: chessGame },
  checkers: { title: 'Checkers', icon: '🔴', open: checkersGame },
  hoops: { title: 'Hoops', icon: '🏀', open: hoopsGame },
  darts: { title: 'Darts', icon: '🎯', open: dartsGame },
  dots: { title: 'Dots & Boxes', icon: '🔲', open: dotsGame },
  mancala: { title: 'Mancala', icon: '🫘', open: mancalaGame },
  flip: { title: 'Flip', icon: '⚫', open: flipGame },
  seabattle: { title: 'Sea Battle', icon: '🚢', open: seaBattleGame },
};

/** [id, label, short description] for the games menu. */
export const MINIGAME_LIST = [
  ['chess', '♟️ Chess', 'The classic, with check and checkmate'],
  ['checkers', '🔴 Checkers', 'Jump pieces, crown kings'],
  ['hoops', '🏀 Hoops', 'Swipe to shoot, beat their score'],
  ['darts', '🎯 Darts', 'Hit the bullseye, 6 darts each'],
  ['dots', '🔲 Dots & Boxes', 'Close boxes, steal the board'],
  ['mancala', '🫘 Mancala', 'Sow seeds, fill your store'],
  ['flip', '⚫ Flip', 'Trap and flip discs (Reversi)'],
  ['seabattle', '🚢 Sea Battle', 'Find and sink their fleet'],
];
