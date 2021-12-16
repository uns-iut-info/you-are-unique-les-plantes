import { useState, useEffect } from 'react'
import PlayerCard from './PlayerCard'
import '../styles/Ui.scss'
import { Color3, GamepadManager } from '@babylonjs/core'
import { setPlayerColor } from '../3d/SelectScene'

type UiPlayer = {
  name: string
  color: string
  connected: boolean
  gamepad?: any
}

export default function Ui() {
  const [state, setstate] = useState<UiPlayer[]>([
    { name: 'Joueur 1', color: 'red', connected: false },
    { name: 'Joueur 2', color: 'green', connected: false },
    { name: 'Joueur 3', color: 'blue', connected: false },
    { name: 'Joueur 4', color: 'purple', connected: false },
  ])

  useEffect(() => {
    const gamepadManager = new GamepadManager()
    gamepadManager.onGamepadConnectedObservable.add((gamepad) => {
      addPlayer(gamepad)
    })
    gamepadManager.onGamepadDisconnectedObservable.add((gamepad) => {
      removePlayer(gamepad)
    })
    return () => {
      gamepadManager.dispose()
    }
  }, [])

  function addPlayer(gamepad: any) {
    const { index } = gamepad
    console.log(`Joueur ${index + 1} connecté`)

    setstate((state) => {
      state[index].connected = true
      state[index].gamepad = gamepad
      return [...state]
    })
  }

  function removePlayer(gamepad: any) {
    const { index } = gamepad
    console.log(`Joueur ${index + 1} déconnecté`)
    setPlayerColor(index, new Color3(.3, .3, .3))

    setstate((state) => {
      state[index].connected = false
      state[index].gamepad = undefined
      return [...state]
    })
  }

  return (
    <div className="Ui">
      <h1>Choisissez vos habilités</h1>
      <div className="players">
        {state.map((player, index) => (
          <PlayerCard
            name={player.name}
            color={player.color}
            connected={player.connected}
            key={index}
            gamepad={player.gamepad}
            index={index}
          />
        ))}
      </div>
    </div>
  )
}
