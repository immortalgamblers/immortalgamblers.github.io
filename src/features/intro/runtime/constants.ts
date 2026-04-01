import type { SubtitleTone } from './types';

export const DEBUG_SPEED_MULTIPLIER = 10;
export const DEBUG_SPEED_CODES = new Set(['ShiftLeft', 'ShiftRight']);

export const GABRIEL_SPEAKER = 'Gabriel';
export const GABRIEL_ON_PHONE_TEXT = 'Gabriel is on the phone';
export const GABRIEL_SUBTITLE_TONE: SubtitleTone = 'gabriel';

export const LEYA_SPEAKER = 'Leya Fiore';
export const LEYA_SUBTITLE_TONE: SubtitleTone = 'leya';
export const LEYA_WITNESS_TEXT =
  "So, this happened around a week ago. Ilai and I used to work in different sectors of the radio studio, however I still talked to him from time to time as we had weekly united broadcasts. We even met a couple of times in a cafe away from the studio to talk about life. But one day he didn't show up in the studio. This lasted for one day, two days and when he didn't show up on the third one I started to get worried. I already knew where he lived so I came to his place to check up on him. I've been knocking for minutes but got no response. Then I looked through the window and the only things I could see were the blood stains and someone's hand, covered in blood. I immediately ran to the police office to tell them what had happened. When we came back to the place, a police officer broke the door so we could enter the house...and there we saw Ilai himself, with a gun wound in his chest. After that, they investigated the house for any clues and asked me to come back to the police office for an interrogation. I told them everything I knew and they let me go. And now I am here telling you the exact same thing I told them. I hope, at the very least, this helps the investigation...";

export const SUBTITLE_CHAR_DELAY_MIN = 28;
export const SUBTITLE_CHAR_DELAY_MAX = 90;
export const SUBTITLE_CHAR_DELAY_FALLBACK = 54;
export const SUBTITLE_HISTORY_RESET_THRESHOLD = 240;
