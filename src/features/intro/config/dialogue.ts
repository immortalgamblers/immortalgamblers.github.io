export type GabrielDialogueSlide = 'site-one' | 'site-two';

export interface GabrielDialogueCue {
  id: string;
  speaker: string;
  slide: GabrielDialogueSlide;
  start: number;
  end: number;
  text: string;
}

// Edit these timings to retime the subtitles and slide changes.
export const GABRIEL_DIALOGUE_START_DELAY_MS = 600;

export const GABRIEL_DIALOGUE_CUES: GabrielDialogueCue[] = [
  {
    id: 'gabriel-slide-1',
    speaker: 'Gabriel',
    slide: 'site-one',
    start: 0.45,
    end: 9.6,
    text:
      "…and then I broke into the house, and guess what I saw there? The stolen shop sign! Right on the floor! But anyway, I came here to ask you for something.",
  },
  {
    id: 'gabriel-slide-2',
    speaker: 'Gabriel',
    slide: 'site-two',
    start: 9.6,
    end: 37.385,
    text:
      'Ilai Maskera was recently murdered, but it seems like no one investigated the case well as we have absolutely no progress. So I think there may be something more to it than that. So, let me get back to the point. Could you try to research more information or find clues to help me out with the case? I can appoint an interrogation with the witness for you to get all the info you need. Just give me a call, whenever you will be ready. Thank you.',
  },
];
