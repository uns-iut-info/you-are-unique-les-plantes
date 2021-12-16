import { useState } from 'react'
import Player from './Player'
import '../styles/Ui.scss'

export default function Ui() {
  const [state, setstate] = useState([
    { name: 'Joueur 1', color: 'red' },
    { name: 'Joueur 2', color: 'green' },
    { name: 'Joueur 3', color: 'blue' },
    { name: 'Joueur 4', color: 'purple' },
  ])

  return (
    <div className="Ui">
      <h1>Choisissez vos abilités</h1>
      <div className="players">
        {state.map((player, index) => (
          <Player controls={index === 0} name={player.name} color={player.color} key={index} />
        ))}
      </div>
    </div>
  )
}
