export interface Meme {
  src: string;
  alt: string;
  credit: string;
  license: string;
  source: string;
}

/** All images are public domain or CC BY, from Wikimedia Commons. */
export const MEMES: Meme[] = [
  { src: "/memes/lesrel.jpg", alt: "A gentleman in a red coat resting his chin on his hand in front of a chessboard", credit: "Adolphe-Alexandre Lesrel, An Interesting Problem", license: "Public domain", source: "https://commons.wikimedia.org/wiki/File:An_Interesting_Problem_(Adolphe-Alexandre_Lesrel).png" },
  { src: "/memes/wentzel.jpg", alt: "Two men at a chessboard, one holding his head", credit: "Gustav Wentzel, Chess Players (1886)", license: "Public domain", source: "https://commons.wikimedia.org/wiki/File:Gustav_Wentzel_-_Chess_players_-_NG.M.04330_-_National_Museum_of_Art,_Architecture_and_Design.jpg" },
  { src: "/memes/erb.jpg", alt: "Two bearded men over a chessboard, one with his hand on his forehead", credit: "Erno Erb, Chess Players", license: "Public domain", source: "https://commons.wikimedia.org/wiki/File:Erno_Erbs_chess_players.jpg" },
  { src: "/memes/northcote.jpg", alt: "A young man resting his chin on his hand while his opponent moves a piece", credit: "James Northcote, Chess Players", license: "Public domain", source: "https://commons.wikimedia.org/wiki/File:Chess_Players_by_James_Northcote_(1746-1831)_-_IMG_7288.JPG" },
  { src: "/memes/eakins.jpg", alt: "Two older men studying a chessboard while a third looks on", credit: "Thomas Eakins, The Chess Players (1876)", license: "Public domain", source: "https://commons.wikimedia.org/wiki/File:The_chess_players_thomas_eakins.jpeg" },
  { src: "/memes/deutsch.jpg", alt: "Two men playing chess in a tiled courtyard, one thinking with his hand at his mouth", credit: "Ludwig Deutsch, The Chess Players (1904)", license: "Public domain", source: "https://commons.wikimedia.org/wiki/File:Ludwig_Deutsch_-_The_Chess_Players,_1904.jpg" },
  { src: "/memes/park.jpg", alt: "Men at a park table, one holding his face while thinking", credit: "Immersed in Thought, photo by Alex Proimos", license: "CC BY 2.0", source: "https://commons.wikimedia.org/wiki/File:Immersed_in_Thought_(4517981978).jpg" },
];

export const MEME_CAPTIONS: { top: string; bottom: string }[] = [
  { top: "The coach has seen your move", bottom: "It needs a moment" },
  { top: "Calculating 37 candidate moves", bottom: "Will play the obvious one" },
  { top: "\"Interesting…\"", bottom: "Coach-speak for \"oh no\"" },
  { top: "Deep in thought", bottom: "Or buffering. Hard to tell." },
  { top: "Still the coach's move", bottom: "The pieces aren't going anywhere" },
  { top: "One does not simply", bottom: "Reply in under a second" },
  { top: "Thinking about your last move", bottom: "Also about lunch" },
  { top: "Every grandmaster started", bottom: "By waiting for their coach" },
  { top: "Analysing the position", bottom: "With feelings" },
  { top: "Patience is a chess skill", bottom: "You are practising it right now" },
];
