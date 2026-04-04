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
import SceneMusic from '@assets/sounds/music/Investigatore Pietra.mp3';
import BarAmbience from '@assets/sounds/звук бара.mp3';
import LampAmbienceSound from '@assets/sounds/работающая лампа (эмбиент).mp3';
import GabrielPicksUpPhoneSound from '@assets/sounds/Гавриил взял телефон.mp3';
import PietraPicksUpPhoneSound from '@assets/sounds/Пиетра взял телефон.mp3';
import PhoneRingSound from '@assets/sounds/Звук гудков.mp3';
import GabrielDialogue from '@assets/sounds/voices/гавриил/Диалог.mp3';
import GabrielReplyAlrightSound from '@assets/sounds/voices/гавриил/Alright, let me get everything ready before you come.mp3';
import GabrielReplyAsYouWishSound from '@assets/sounds/voices/гавриил/As you wish.mp3';
import GabrielOnPhoneSound from '@assets/sounds/voices/гавриил/Gabriel is on the phone.mp3';
import GabrielReplyNoProblemSound from '@assets/sounds/voices/гавриил/No problem.mp3';
import GabrielReplySureSound from '@assets/sounds/voices/гавриил/Sure.mp3';
import GabrielReplyUhHuhSound from '@assets/sounds/voices/гавриил/Uh-uh, will be done soon.mp3';
import LeyaWitnessDialogueSound from '@assets/sounds/voices/лея/озвучка леи.mp3';

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
