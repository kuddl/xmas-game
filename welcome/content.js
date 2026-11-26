/**
 * Landing page content (#019, #023). Edit texts here, no code change needed.
 * - Add or remove entries in `blocks` to change the number of smashable blocks.
 * - `level` (optional): 0 = ground, 1 = ice ledge (level 2), 2 = high ice ledge (level 3).
 *   Without it, blocks alternate ground / level 2 / level 3 automatically.
 */
export const WELCOME = {
  intro: {
    kicker: 'FROM THE ARC TEAM',
    title: 'MERRY CHRISTMAS, MERKLE!',
    hint: 'SCROLL UP TO RUN', // reverse scroll; use e.g. 'SCROLL DOWN TO RUN' with scrollDirection 'normal'
  },

  // Buzzword blocks standing in the way. Click / tap / Enter smashes them open.
  blocks: [
    {
      word: 'XMAS',
      level: 0,
      title: 'HO HO HO, MERKLE!',
      text:
        'The ARC team says thank you: for the coffee, the calls and the occasional miracle. ' +
        'Merry Christmas to every single one of you!',
    },
    {
      word: 'BUDGET',
      title: 'BUDGET APPROVED*',
      text:
        'Our gift budget was approved after only three change requests. ' +
        'Sadly, it was spent on the estimation workshop. Please accept this game instead.',
      footnote: '*pending sign-off from finance',
    },
    {
      word: 'CAPACITY',
      title: 'SANTA IS 110% ALLOCATED',
      text:
        'Zero hours left on "Christmas", but we found a project code for eggnog. ' +
        "Don't forget to log it. Timesheets are due Friday. They're always due Friday.",
    },
    {
      word: 'DEADLINE',
      title: '3 STORY POINTS, THEY SAID',
      text:
        'This greeting was estimated at 3 story points. It is now 13. ' +
        'The deadline did not move. The scope did. Happy holidays, see you next sprint!',
    },
  ],

  // Flying meeting invites in the sky. Touching one with the cursor runner freezes it
  // for a moment and shows the message; clicking / tapping destroys the invite.
  flyers: [
    { word: 'BUDGET', message: 'OOPS! YOU BLEW THE BUDGET' },
    { word: 'AI TOKENS', message: 'OH NO, YOU RAN OUT OF AI TOKENS' },
    { word: 'ASAP', message: 'URGENT MEETING! EVERYTHING IS ASAP' },
    { word: 'SCOPE', message: 'SCOPE CREEP! PLEASE RE-ESTIMATE' },
    { word: 'TIMESHEET', message: 'TIMESHEET MISSING. HR HAS BEEN NOTIFIED' },
    { word: 'SYNC', message: 'DOUBLE-BOOKED: 3 SYNCS AT ONCE' },
  ],

  finale: {
    kicker: 'YOUR GIFT',
    title: 'PLAY THE CHRISTMAS PROJECT GAME',
    button: 'PRESS START',
    href: '/game/',
    // shown until every block is smashed ("{done}" / "{total}" are replaced)
    lockedTitle: 'SMASH ALL BLOCKS TO UNWRAP YOUR GIFT',
    lockedProgress: '{done} / {total} SMASHED',
  },

  effects: {
    freezeSeconds: 2, // runner frozen after touching a flyer
    santaEverySeconds: 18, // Santa's sleigh crosses the sky this often
  },

  // Layout of the run (CSS px, scaled down on small screens)
  layout: {
    beatSpacing: 0.4, // distance between beats, in viewport widths
    minBeatSpacingPx: 300,
    // 'reverse': the page starts at the bottom and runs forward while scrolling up
    // (finger / trackpad moves down). 'normal': forward while scrolling down.
    scrollDirection: 'reverse',
  },
};
