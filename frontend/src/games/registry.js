import ParkourGame from './parkour/ParkourGame.jsx'
import BowlingGame from './bowling/BowlingGame.jsx'
import ShootingGame from './shooting-game/ShootingGame.jsx'
import TugOfWarGame from './tugofwar/TugOfWarGame.jsx'

const registry = [
  { id: 'parkour', name: 'Parkour', component: ParkourGame },
  { id: 'bowling', name: 'Bowling', component: BowlingGame },
  { id: 'shooting', name: 'Shooting Game', component: ShootingGame },
  { id: 'tugofwar', name: 'Tug of War', component: TugOfWarGame },
]

export default registry
