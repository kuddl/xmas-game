/**
 * Landing page content (#019). Edit texts here, no code change needed.
 * Add or remove entries in `blocks` to change the number of smashable blocks.
 */
export const WELCOME = {
  intro: {
    kicker: 'FROM THE ARC TEAM',
    title: 'MERRY CHRISTMAS, MERKLE!',
    hint: 'SCROLL TO RUN',
  },

  // Buzzword blocks standing in the way. Click / tap / Enter smashes them open.
  blocks: [
    {
      word: 'XMAS',
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

  finale: {
    kicker: 'YOUR GIFT',
    title: 'PLAY THE CHRISTMAS PROJECT GAME',
    button: 'PRESS START',
    href: '/',
  },

  // Layout of the run (CSS px, scaled down on small screens)
  layout: {
    beatSpacing: 0.62, // distance between beats, in viewport widths
    minBeatSpacingPx: 380,
  },
};
