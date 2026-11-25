// FUN LINES (owned by Social): taglines and silly loading messages, so waiting feels cozy.
// To add one, just add a line to a list. Keep it friendly and family safe.

export const TAGLINES = [
  'A cozy corner of the internet, built by you.',
  'Your people. Your place. Pillows included.',
  'Home is wherever your people log in.',
  'Long distance? Short walk to the sofa.',
  'Build it. Decorate it. Hang out in it.',
  'Because "see you soon" is better with a couch.',
];

const LOADING = [
  'Fluffing the pillows…',
  'Teaching the avatars to walk in a straight line…',
  'Watering the plants (they were thirsty)…',
  'Hiding the good snacks…',
  'Asking the sofa where it wants to live…',
  'Dusting off the Connect Four board…',
  'Lighting the candles (safely)…',
  'Untangling the string lights…',
  'Convincing the cat to share the sofa…',
  'Warming up the welcome mat…',
];

const KNOCK = [
  'Knock knock… 🚪',
  'Wiping your feet on the welcome mat… 🧽',
  'Ringing the doorbell… 🔔',
];

const pick = (list) => list[Math.floor(Math.random() * list.length)];
export const tagline = () => pick(TAGLINES);
export const loadingLine = () => pick(LOADING);
export const knockLine = () => pick(KNOCK);
