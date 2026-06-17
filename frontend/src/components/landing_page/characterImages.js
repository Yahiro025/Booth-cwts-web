// Maps a character id (see CHARACTERS in CharacterSelect.jsx) to its artwork.
//
// Two sets are exposed:
//   - PORTRAITS: large card art shown on the character-select carousel
//   - ICONS: small profile art shown on the game-select avatar circles
//
// Only characters with finished art appear here; callers fall back to a generic
// icon for any id that is missing, so adding new art is a one-line change and
// never breaks screens that read these maps.

import angerNeutral from '../../assets/anger/AngerNeutral.png'
import ennuiNeutral from '../../assets/ennui/EnnuiNeutral.png'
import angerIcon from '../../assets/anger/AngerIcon.png'
import ennuiIcon from '../../assets/ennui/EnnuiIcon.png'
import embarrassmentIcon from '../../assets/embarrasment/EmbarrassmentIcon.png'
import fearIcon from '../../assets/fear/fearIcon.png'
import anxietyNeutral from '../../assets/anxiety/AnxietyNeutral.png'
import fearNeutral from '../../assets/fear/fearNeutral.png'
import anxietyIcon from '../../assets/anxiety/AnxietyIcon.png'
import sadnessNeutral from '../../assets/sadness/sadnessNuetral.png'
import joyNeutral from '../../assets/joy/joyNuetral.png'
import joyIcon from '../../assets/joy/joyIcon.png'
import sadnessIcon from '../../assets/sadness/sadnessIcon.png'
import disgustNeutral from '../../assets/disgust/disgustNuetral.png'
import envyNeutral from '../../assets/envy/envyNuetral.png'
import disgustIcon from '../../assets/disgust/disgustIcon.png'
import envyIcon from '../../assets/envy/envyIcon.png'

export const CHARACTER_PORTRAITS = {
  anger: angerNeutral,
  ennui: ennuiNeutral,
  embarrassment: embarrassmentIcon,
  fear: fearNeutral,
  anxiety: anxietyNeutral,
  sadness: sadnessNeutral,
  joy: joyNeutral,
  disgust: disgustNeutral,
  envy: envyNeutral,
}

export const CHARACTER_ICONS = {
  anger: angerIcon,
  ennui: ennuiIcon,
  embarrassment: embarrassmentIcon,
  fear: fearIcon,
  anxiety: anxietyIcon,
  sadness: sadnessIcon,
  joy: joyIcon,
  disgust: disgustIcon,
  envy: envyIcon,
}

export function getCharacterPortrait(charId) {
  return CHARACTER_PORTRAITS[charId] ?? null
}

export function getCharacterIcon(charId) {
  return CHARACTER_ICONS[charId] ?? null
}
