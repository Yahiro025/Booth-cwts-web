import PongGame from './pong/PongGame.jsx'
import ParkourGame from './parkour/ParkourGame.jsx'

const registry = [
  { id: 'pong', name: 'Pong', component: PongGame },
  { id: 'parkour', name: 'Parkour', component: ParkourGame },
]

export default registry
