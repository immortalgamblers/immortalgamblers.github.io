import ClickMeImage from '@assets/Click-me.png';
import InterrogationLightsImage from '@assets/Lights_Interrogatoon.png';
import LeyaImage from '@assets/Leya.png';
import PhoneIdleImage from '@assets/Phone_1.png';
import PhoneAnsweredImage from '@assets/Phone_2.png';
import SiteOneImage from '@assets/Site_one.png';
import SiteTwoImage from '@assets/Site_two.png';
import Type1Sound from '@assets/sounds/Type1.mp3';
import Type2Sound from '@assets/sounds/Type2.mp3';
import Type3Sound from '@assets/sounds/Type3.mp3';
import SceneMusic from '@assets/sounds/music/Investigatore Pietra.wav';
import BarAmbience from '@assets/sounds/звук бара.wav';
import LampAmbienceSound from '@assets/sounds/работающая лампа (эмбиент).wav';
import GabrielPicksUpPhoneSound from '@assets/sounds/Гавриил взял телефон.wav';
import PietraPicksUpPhoneSound from '@assets/sounds/Пиетра взял телефон.wav';
import PhoneRingSound from '@assets/sounds/Звук гудков.wav';
import GabrielDialogue from '@assets/sounds/voices/гавриил/Диалог.wav';
import GabrielReplyAlrightSound from '@assets/sounds/voices/гавриил/Alright, let me get everything ready before you come.wav';
import GabrielReplyAsYouWishSound from '@assets/sounds/voices/гавриил/As you wish.wav';
import GabrielOnPhoneSound from '@assets/sounds/voices/гавриил/Gabriel is on the phone.wav';
import GabrielReplyNoProblemSound from '@assets/sounds/voices/гавриил/No problem.wav';
import GabrielReplySureSound from '@assets/sounds/voices/гавриил/Sure.wav';
import GabrielReplyUhHuhSound from '@assets/sounds/voices/гавриил/Uh-uh, will be done soon.wav';
import LeyaWitnessDialogueSound from '@assets/sounds/voices/лея/озвучка леи.wav';

export const INTRO_IMAGES = {
  clickMe: ClickMeImage,
  interrogationLights: InterrogationLightsImage,
  leya: LeyaImage,
  siteOne: SiteOneImage,
  siteTwo: SiteTwoImage,
  phoneIdle: PhoneIdleImage,
  phoneAnswered: PhoneAnsweredImage,
};

export const INTRO_AUDIO = {
  typeSounds: [Type1Sound, Type2Sound, Type3Sound],
  sceneMusic: SceneMusic,
  barAmbience: BarAmbience,
  lampAmbience: LampAmbienceSound,
  pietraPhonePickup: PietraPicksUpPhoneSound,
  phoneRing: PhoneRingSound,
  gabrielPhonePickup: GabrielPicksUpPhoneSound,
  gabrielDialogue: GabrielDialogue,
  gabrielOnPhone: GabrielOnPhoneSound,
  gabrielPhoneResponses: [
    {
      source: GabrielReplyAlrightSound,
      text: 'Alright, let me get everything ready before you come',
    },
    {
      source: GabrielReplyAsYouWishSound,
      text: 'As you wish',
    },
    {
      source: GabrielReplyNoProblemSound,
      text: 'No problem',
    },
    {
      source: GabrielReplySureSound,
      text: 'Sure',
    },
    {
      source: GabrielReplyUhHuhSound,
      text: 'Uh-uh, will be done soon',
    },
  ],
  leyaWitnessDialogue: LeyaWitnessDialogueSound,
};
