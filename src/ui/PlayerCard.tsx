import { useEffect, useState } from 'react'
import { AddSquare, MinusSquare } from 'iconsax-react'
import '../styles/PlayerCard.scss'
import { getPlayerScreenPos, setPlayerColor } from '../3d/SelectScene'
import { Color3 } from '@babylonjs/core'

const MOUSE_POSES: { [key: string]: { x: number; y: number } } = {
  '0-0': { x: 30, y: 70 },
  '0-1': { x: 83, y: 70 },
  '0-2': { x: 137, y: 70 },
  '0-3': { x: 190, y: 70 },

  '1-0': { x: 35, y: 120 },
  '1-1': { x: 190, y: 120 },

  '2-0': { x: 35, y: 200 },
  '2-1': { x: 190, y: 200 },
}

const colors: { [key: string]: Color3 } = {
  red: new Color3(1, 0, 0),
  green: new Color3(0, 1, 0),
  blue: new Color3(0, 0, 1),
  purple: new Color3(0.45, 0, 0.45),
}

type PlayerProps = {
  name: string
  color: string
  connected: boolean
  gamepad?: any
  index: number
}
export default function PlayerCard({
  name: player_name,
  color: player_color,
  connected,
  gamepad,
  index,
}: PlayerProps) {
  // Player state
  const [name, setName] = useState(player_name)
  const [luck, setLuck] = useState(0.5)
  const [strength, setStrength] = useState(0.5)
  const [color, setColor] = useState(player_color)
  const [ready, setReady] = useState(false)
  const [action, setAction] = useState('none')

  // Card state
  const [shaking, setShaking] = useState(false)
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })

  const [cardPos, setCardPos] = useState({ top: -1000, left: 0 })

  useEffect(() => {

    getPlayerScreenPos(index, (pos: { top: number; left: number }) => {
      setCardPos(pos)
    })
  }, [])

  useEffect(() => {
    if (shaking) setTimeout(() => setShaking(false), 200)
  }, [shaking])

  useEffect(() => {
    if (connected) {
      const obs = gamepad.onButtonDownObservable.add((button: any) => {
        if (ready) {
          if (button === 1) setReady(false)
        } else {
          if (button === 0) handleEnter()
          if (button === 2) setReady(true)
        }
      })
      gamepad.onleftstickchanged((values: any) => {
        if (ready) return
        let mouvement
        if (values.x < -0.5) mouvement = 'left'
        else if (values.x > 0.5) mouvement = 'right'
        else if (values.y < -0.5) mouvement = 'up'
        else if (values.y > 0.5) mouvement = 'down'
        else mouvement = 'none'
        setAction(mouvement)
      })

      return () => {
        gamepad.onButtonDownObservable.remove(obs)
      }
    } else {
      reset()
    }
  }, [connected, mousePos, luck, strength, ready])

  useEffect(() => {
    if (gamepad) {
      setPlayerColor(gamepad.index, colors[color])
    }
  }, [gamepad, color])

  useEffect(() => {
    let new_x
    let new_y
    switch (action) {
      case 'up':
        new_y = mousePos.y - 1
        new_x = mousePos.x
        if (new_y == 0) new_x = mousePos.x == 0 ? 0 : 3
        if (new_y >= 0) setMousePos({ x: new_x, y: new_y })
        break
      case 'down':
        new_y = mousePos.y + 1
        new_x = mousePos.x
        if (mousePos.y == 0) new_x = mousePos.x < 2 ? 0 : 1
        if (new_y < 3) setMousePos({ x: new_x, y: new_y })
        break
      case 'left':
        new_x = mousePos.x - 1
        if (new_x >= 0) setMousePos({ x: new_x, y: mousePos.y })
        break
      case 'right':
        new_x = mousePos.x + 1
        if (mousePos.y == 0) {
          if (new_x < 4) setMousePos({ x: new_x, y: mousePos.y })
        } else {
          if (new_x < 2) setMousePos({ x: new_x, y: mousePos.y })
        }
        break
    }
  }, [action])

  function handleEnter() {
    const INC = 0.25
    const overflow = luck + strength + INC <= 1

    // Color
    if (mousePos.y == 0) {
      if (mousePos.x == 0) setColor('red')
      if (mousePos.x == 1) setColor('blue')
      if (mousePos.x == 2) setColor('green')
      if (mousePos.x == 3) setColor('purple')
    }

    // Luck
    if (mousePos.y == 1) {
      // Decrease
      if (mousePos.x == 0) setLuck(luck - INC > 0 ? luck - INC : 0)

      // Increase
      if (mousePos.x == 1) {
        if (overflow) setLuck(luck + INC < 1 ? luck + INC : 1)
        else setShaking(true)
      }
    }

    // Strength
    if (mousePos.y == 2) {
      // Decrease
      if (mousePos.x == 0) setStrength(strength - INC > 0 ? strength - INC : 0)

      // Increase
      if (mousePos.x == 1) {
        if (overflow) setStrength(strength + INC < 1 ? strength + INC : 1)
        else setShaking(true)
      }
    }
  }

  function getPosStyle() {
    const { x, y } = MOUSE_POSES[`${mousePos.y}-${mousePos.x}`]
    return {
      left: `${x}px`,
      top: `${y}px`,
    }
  }

  function reset() {
    setName(player_name)
    setLuck(0.5)
    setStrength(0.5)
    setColor(player_color)
    setReady(false)
    setAction('none')
  }
  return (
    <div
      className="player"
      style={{ top: cardPos.top + 50, left: cardPos.left }}
    >
      <div
        className={`${!connected ? 'waiting' : ''} ${color} ${
          shaking ? 'shaking' : ''
        }`}
      >
        {!ready && connected && (
          <img
            className="hand"
            src="hand.png"
            alt=""
            width="50"
            style={getPosStyle()}
          />
        )}
        <h2>{name}</h2>
        <div className="player-color">
          <div className="line">
            <div className="color red" />
            <div className="color blue" />
            <div className="color green" />
            <div className="color purple" />
          </div>
        </div>
        <div className="player-luck">
          <div className="line">
            <MinusSquare size="32" />
            <h3>Chance</h3>
            <AddSquare size="32" />
          </div>
          <div className="player-luck-bar">
            <div
              className="player-luck-bar-value"
              style={{ width: `${luck * 100}%` }}
            ></div>
          </div>
        </div>
        <div className="player-strength">
          <div className="line">
            <MinusSquare size="32" />
            <h3>Force</h3>
            <AddSquare size="32" />
          </div>
          <div className="player-strength-bar">
            <div
              className="player-strength-bar-value"
              style={{ width: `${strength * 100}%` }}
            ></div>
          </div>
        </div>
      </div>
      <button className={`${ready ? 'ready' : ''}`}>
        <div>
          <span>X</span> En attente
        </div>
        <div>
          <RunIcon />
          <span>Prêt</span>
          <span className="excl">!</span>
        </div>
      </button>
    </div>
  )
}

function RunIcon() {
  return (
    <svg
      version="1.0"
      xmlns="http://www.w3.org/2000/svg"
      width="572.000000pt"
      height="760.000000pt"
      viewBox="0 0 572.000000 760.000000"
      preserveAspectRatio="xMidYMid meet"
    >
      <g
        transform="translate(0.000000,760.000000) scale(0.100000,-0.100000)"
        fill="#000000"
        stroke="none"
      >
        <path
          d="M5000 7023 c-41 -14 -93 -33 -115 -43 -22 -10 -60 -24 -85 -30 -25
-7 -58 -19 -74 -27 -16 -8 -60 -24 -98 -34 -38 -11 -79 -26 -91 -33 -12 -7
-44 -19 -71 -25 -27 -7 -65 -20 -85 -30 -20 -10 -61 -24 -91 -31 -30 -7 -64
-18 -76 -25 -12 -8 -48 -21 -80 -31 -32 -9 -75 -24 -94 -34 -19 -9 -57 -23
-85 -29 -27 -7 -63 -19 -80 -27 -16 -7 -61 -24 -100 -38 -144 -49 -171 -59
-220 -78 -27 -11 -79 -29 -114 -39 -88 -26 -156 -74 -145 -104 13 -34 -17
-190 -47 -250 -35 -67 -105 -150 -153 -180 -41 -26 -109 -77 -118 -89 -20 -29
68 -236 101 -236 29 0 155 37 201 59 25 11 53 21 64 21 10 0 44 11 75 24 31
13 85 34 121 46 131 44 206 71 235 84 17 8 53 20 80 27 28 6 64 20 80 29 17
10 55 23 85 30 30 7 66 19 79 28 14 8 54 23 90 32 36 10 89 27 116 38 119 48
164 65 235 87 130 41 224 74 244 86 11 6 50 20 88 30 38 11 79 26 91 33 12 7
44 19 71 25 27 7 65 20 85 30 20 10 59 24 86 30 65 16 154 67 192 111 17 19
45 64 63 99 30 57 33 72 33 144 -1 73 -5 87 -39 151 -49 90 -104 140 -190 172
-86 31 -164 30 -264 -3z"
        />
        <path
          d="M1054 6900 c-166 -33 -337 -141 -427 -270 -62 -89 -98 -154 -108
-199 -5 -25 -19 -73 -30 -107 -29 -86 -23 -216 15 -344 16 -52 35 -102 42
-110 7 -9 22 -35 32 -59 19 -41 135 -181 151 -181 4 0 30 14 57 32 27 17 65
41 84 53 47 28 138 87 174 111 15 10 47 30 70 44 82 49 108 65 143 93 20 15
41 27 48 27 7 0 28 12 48 28 19 15 50 36 69 47 111 66 133 80 215 136 23 16
45 29 50 29 5 0 18 8 29 19 11 10 31 24 45 31 13 7 53 31 87 53 l64 41 -7 45
c-4 25 -13 57 -21 71 -8 14 -27 47 -42 73 -63 111 -185 221 -318 286 -73 36
-81 38 -190 56 -112 18 -166 17 -280 -5z"
        />
        <path
          d="M2688 6666 c-62 -21 -110 -48 -178 -98 -14 -10 -46 -29 -71 -42 -25
-14 -51 -32 -58 -40 -8 -9 -19 -16 -26 -16 -7 0 -29 -13 -50 -30 -21 -16 -44
-30 -51 -30 -7 0 -29 -13 -47 -30 -19 -16 -38 -30 -42 -30 -7 0 -118 -70 -141
-89 -6 -5 -29 -19 -50 -30 -36 -20 -73 -45 -134 -88 -13 -10 -38 -24 -53 -30
-16 -7 -42 -23 -57 -35 -15 -13 -51 -36 -80 -53 -28 -16 -66 -40 -83 -52 -18
-12 -52 -34 -77 -48 -25 -14 -63 -38 -86 -53 -63 -41 -104 -68 -157 -99 -27
-15 -63 -39 -82 -53 -19 -14 -57 -38 -85 -55 -28 -16 -66 -40 -83 -52 -18 -12
-48 -31 -67 -43 -19 -11 -62 -38 -95 -60 -33 -21 -78 -49 -99 -61 -22 -12 -46
-28 -54 -35 -7 -8 -17 -14 -21 -14 -4 0 -32 -21 -62 -46 -35 -31 -67 -71 -92
-116 -34 -64 -37 -76 -38 -153 -1 -75 3 -89 34 -151 42 -82 81 -121 162 -165
53 -28 70 -32 145 -33 80 -1 89 1 160 37 41 21 89 48 107 60 17 12 55 36 83
52 29 17 64 40 78 51 15 12 45 31 67 43 22 12 60 35 85 51 25 17 58 38 74 48
15 9 70 44 122 77 51 33 112 71 135 85 23 14 64 40 90 58 27 17 52 32 57 32 4
0 17 9 29 19 11 10 35 27 54 36 19 10 46 27 61 39 14 12 49 35 78 51 28 17 66
40 83 52 18 12 56 36 86 55 30 18 69 42 86 53 17 11 46 29 64 40 18 11 47 30
65 42 17 12 40 27 51 32 12 5 58 34 103 65 45 31 84 56 88 56 3 0 24 13 47 29
72 49 98 65 142 91 129 75 171 118 215 219 42 97 40 173 -8 273 -47 97 -116
156 -215 186 -94 27 -123 27 -209 -2z"
        />
        <path
          d="M2679 5674 c-7 -8 -33 -26 -58 -39 -25 -12 -55 -32 -65 -44 -11 -12
-25 -21 -31 -21 -7 0 -18 -7 -26 -16 -7 -8 -33 -26 -58 -39 -25 -12 -55 -32
-65 -44 -11 -12 -23 -21 -27 -21 -5 0 -28 -15 -53 -32 -24 -18 -58 -42 -77
-53 -18 -11 -43 -27 -55 -35 -26 -19 -135 -91 -172 -115 -120 -76 -161 -104
-216 -145 -19 -14 -55 -38 -82 -55 -26 -16 -57 -37 -69 -45 -11 -8 -36 -24
-54 -35 -19 -11 -53 -35 -77 -52 -25 -18 -48 -33 -52 -33 -5 0 -18 -9 -29 -19
-12 -11 -38 -29 -58 -40 -20 -11 -55 -35 -76 -55 -44 -39 -45 -36 15 -144 86
-153 105 -188 130 -237 25 -48 46 -86 120 -220 139 -250 154 -318 114 -525 -5
-30 -14 -60 -19 -66 -6 -7 -23 -38 -40 -70 -16 -33 -43 -79 -59 -104 -16 -25
-41 -65 -55 -90 -14 -25 -43 -72 -65 -105 -22 -33 -47 -76 -56 -95 -9 -19 -24
-44 -34 -55 -11 -11 -26 -37 -34 -57 -9 -20 -20 -39 -26 -43 -6 -4 -17 -22
-25 -42 -8 -19 -26 -48 -40 -65 -14 -16 -25 -34 -25 -39 0 -5 -15 -31 -33 -58
-17 -27 -45 -72 -62 -101 -38 -66 -83 -138 -105 -170 -10 -14 -27 -43 -39 -65
-12 -22 -37 -65 -56 -95 -19 -30 -46 -75 -60 -100 -14 -25 -43 -72 -65 -105
-21 -33 -56 -94 -76 -135 -36 -70 -38 -81 -38 -165 1 -77 4 -97 27 -142 15
-29 27 -58 27 -65 0 -7 13 -40 30 -73 16 -33 45 -98 65 -145 20 -47 45 -103
55 -125 24 -49 67 -155 88 -215 8 -25 23 -56 32 -70 10 -14 23 -43 30 -65 7
-22 19 -50 27 -63 8 -13 20 -40 28 -61 17 -48 86 -140 134 -179 77 -62 169
-103 257 -113 176 -22 325 29 441 149 34 35 67 78 74 96 7 17 21 43 31 58 51
74 47 341 -6 431 -14 24 -26 50 -26 57 0 7 -13 40 -29 74 -87 184 -102 237
-103 361 -1 110 16 177 67 265 24 41 56 95 70 120 14 25 39 65 55 90 16 25 43
70 60 100 17 30 57 98 90 150 33 52 69 113 81 135 12 22 32 53 45 68 13 16 24
34 24 41 0 7 14 30 30 51 17 21 30 44 30 51 0 7 11 26 25 42 14 17 25 34 25
39 0 5 16 32 35 59 19 27 35 54 35 61 0 6 27 38 59 72 43 43 70 62 96 67 53
10 111 -1 151 -28 40 -26 95 -105 114 -163 7 -22 19 -49 26 -61 8 -11 23 -46
34 -78 11 -33 24 -64 30 -71 6 -7 19 -38 30 -70 11 -32 26 -65 32 -73 12 -14
21 -35 81 -193 14 -37 35 -82 46 -100 12 -19 21 -41 21 -50 0 -9 12 -38 26
-65 14 -26 34 -69 44 -94 10 -25 35 -83 55 -130 20 -47 44 -105 52 -130 9 -25
24 -57 34 -71 10 -14 21 -38 25 -55 3 -16 17 -49 30 -74 13 -25 30 -63 38 -85
23 -64 84 -206 94 -218 5 -7 17 -36 26 -64 10 -29 21 -55 26 -58 5 -3 18 -34
30 -70 12 -36 25 -67 30 -70 5 -3 18 -34 30 -70 12 -36 25 -67 30 -70 5 -3 18
-34 30 -70 12 -36 25 -67 30 -70 5 -3 16 -29 25 -58 10 -28 24 -62 32 -75 8
-13 21 -41 28 -63 23 -65 123 -180 200 -231 60 -40 196 -80 271 -79 72 0 222
42 268 75 71 51 162 153 196 221 l35 70 0 155 c0 147 -1 158 -26 210 -61 125
-97 207 -108 242 -7 20 -18 42 -26 48 -7 6 -17 26 -21 43 -3 18 -19 57 -34 87
-46 92 -90 187 -90 195 0 8 -16 44 -96 210 -13 28 -24 54 -24 58 0 5 -16 43
-36 85 -20 42 -46 100 -59 127 -12 28 -37 79 -54 115 -17 36 -31 69 -31 74 0
5 -16 44 -36 85 -20 42 -46 99 -59 126 -12 28 -37 79 -54 115 -17 36 -31 70
-31 75 0 6 -14 39 -31 75 -17 36 -42 88 -54 115 -13 28 -39 84 -59 126 -20 41
-36 79 -36 83 0 4 -16 42 -36 84 -20 42 -44 95 -54 117 -10 22 -34 74 -53 115
-19 41 -38 86 -42 100 -4 14 -15 36 -25 50 -10 14 -21 36 -25 50 -7 25 -24 65
-89 201 -20 41 -36 80 -36 85 0 5 -12 34 -26 64 -15 30 -39 82 -54 115 -15 33
-44 94 -64 136 -20 41 -36 80 -36 85 0 5 -13 36 -29 69 -80 169 -91 193 -91
200 0 5 -16 43 -36 84 -20 42 -47 101 -61 131 -13 30 -37 81 -54 112 -16 31
-29 63 -29 70 0 7 -14 42 -31 78 -17 36 -42 88 -54 115 -13 28 -39 84 -59 126
-20 41 -36 79 -36 84 0 5 -16 43 -36 84 -51 107 -80 171 -94 209 -12 32 -53
62 -83 62 -8 0 -20 -7 -28 -16z"
        />
      </g>
    </svg>
  )
}
