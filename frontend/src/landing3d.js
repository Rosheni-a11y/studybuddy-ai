import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'

export function startScene(canvas) {
  let renderer
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true })
  } catch {
    return null
  }

  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.05
  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFShadowMap

  const scene = new THREE.Scene()
  const pmrem = new THREE.PMREMGenerator(renderer)
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture
  scene.environmentIntensity = 0.9

  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100)

  scene.add(new THREE.HemisphereLight(0xfff6ee, 0xd9c9b8, 0.7))
  const key = new THREE.DirectionalLight(0xfff3e6, 1.7)
  key.position.set(-3, 5, 4)
  key.castShadow = true
  key.shadow.mapSize.set(1024, 1024)
  key.shadow.radius = 6
  key.shadow.bias = -0.0005
  key.shadow.camera.left = -4
  key.shadow.camera.right = 4
  key.shadow.camera.top = 4
  key.shadow.camera.bottom = -4
  scene.add(key)
  const rim = new THREE.DirectionalLight(0xfff0e6, 1.2)
  rim.position.set(4, 2, -4)
  scene.add(rim)
  const fill = new THREE.PointLight(0xff9aa8, 2.2, 6)
  fill.position.set(-3.2, 1.2, 0.6)
  scene.add(fill)

  const phys = (color, rough = 0.45, coat = 0.4) =>
    new THREE.MeshPhysicalMaterial({
      color,
      roughness: rough,
      clearcoat: coat,
      clearcoatRoughness: 0.3,
    })
  const mCover = phys(0xec8a70)
  const mCoverLight = phys(0xf8bfcc)
  const mPage = phys(0xfbf1de, 0.6, 0.15)
  const mPeach = phys(0xf7b894, 0.5, 0.3)
  const mMint = phys(0xf5a3b8, 0.45, 0.4)
  const mDark = phys(0x3d2630, 0.55, 0.2)
  const mPedestal = new THREE.MeshStandardMaterial({ color: 0x3a2418, roughness: 0.9 })
  const mGold = new THREE.MeshStandardMaterial({
    color: 0xf6a77a,
    emissive: 0xf6a77a,
    emissiveIntensity: 0.6,
    roughness: 0.4,
  })
  const mPinkSpark = new THREE.MeshStandardMaterial({
    color: 0xf58fa8,
    emissive: 0xf58fa8,
    emissiveIntensity: 0.6,
    roughness: 0.4,
  })

  const shadowed = (mesh) => {
    mesh.castShadow = true
    mesh.receiveShadow = true
    return mesh
  }

  const faceCanvas = document.createElement('canvas')
  faceCanvas.width = 1024
  faceCanvas.height = 724
  const fctx = faceCanvas.getContext('2d')
  const faceTex = new THREE.CanvasTexture(faceCanvas)
  faceTex.colorSpace = THREE.SRGBColorSpace
  faceTex.anisotropy = 4
  let faceMode = 'normal'
  let blink = 0
  let lastFaceKey = ''

  const drawFace = () => {
    const key2 = faceMode + blink.toFixed(2)
    if (key2 === lastFaceKey) return
    lastFaceKey = key2
    const c = fctx
    c.clearRect(0, 0, 1024, 724)
    c.fillStyle = '#fbf1de'
    c.fillRect(0, 0, 1024, 724)
    c.strokeStyle = '#efb9c6'
    c.lineWidth = 11
    c.lineCap = 'round'
    for (let i = 0; i < 3; i++) {
      const y = 120 + i * 40
      c.beginPath()
      c.moveTo(100, y + 14)
      c.quadraticCurveTo(250, y - 10, 450, y + 10)
      c.stroke()
      c.beginPath()
      c.moveTo(574, y + 10)
      c.quadraticCurveTo(770, y - 10, 924, y + 14)
      c.stroke()
    }
    c.strokeStyle = '#ecdcc2'
    c.lineWidth = 6
    c.beginPath()
    c.moveTo(512, 40)
    c.lineTo(512, 700)
    c.stroke()
    c.fillStyle = 'rgba(244,150,175,0.65)'
    c.beginPath()
    c.ellipse(335, 470, 62, 38, 0, 0, Math.PI * 2)
    c.fill()
    c.beginPath()
    c.ellipse(689, 470, 62, 38, 0, 0, Math.PI * 2)
    c.fill()
    c.fillStyle = '#3d2630'
    c.strokeStyle = '#3d2630'
    c.lineWidth = 16
    const eye = (x, y) => {
      if (faceMode === 'happy') {
        c.beginPath()
        c.arc(x, y + 14, 36, Math.PI * 1.1, Math.PI * 1.9)
        c.stroke()
        return
      }
      const ry = 40 * (1 - blink * 0.9)
      c.beginPath()
      c.ellipse(x, y, 34, ry, 0, 0, Math.PI * 2)
      c.fill()
      if (blink < 0.5) {
        c.fillStyle = '#fff'
        c.beginPath()
        c.arc(x - 9, y - 12, 9, 0, Math.PI * 2)
        c.fill()
        c.fillStyle = '#3d2630'
      }
    }
    eye(405, 385)
    eye(619, 385)
    c.beginPath()
    c.lineWidth = 12
    if (faceMode === 'happy') c.arc(512, 440, 52, 0.15 * Math.PI, 0.85 * Math.PI)
    else c.arc(512, 462, 30, 0.2 * Math.PI, 0.8 * Math.PI)
    c.stroke()
    faceTex.needsUpdate = true
  }
  drawFace()

  const rig = new THREE.Group()
  scene.add(rig)

  const pedestal = shadowed(new THREE.Mesh(new RoundedBoxGeometry(2.9, 1.3, 2.2, 4, 0.08), mPedestal))
  pedestal.position.y = -1.95
  rig.add(pedestal)

  const char = new THREE.Group()
  char.position.y = 0.05
  rig.add(char)

  const coverBack = shadowed(new THREE.Mesh(new RoundedBoxGeometry(2.5, 1.95, 0.22, 4, 0.09), mCover))
  coverBack.position.z = -0.14
  char.add(coverBack)
  const outline = shadowed(new THREE.Mesh(new RoundedBoxGeometry(2.66, 2.11, 0.2, 4, 0.12), mDark))
  outline.position.z = -0.2
  char.add(outline)
  const coverRim = shadowed(new THREE.Mesh(new RoundedBoxGeometry(2.38, 1.83, 0.14, 4, 0.07), mCoverLight))
  coverRim.position.z = -0.02
  char.add(coverRim)
  const pageL = shadowed(new THREE.Mesh(new RoundedBoxGeometry(1.14, 1.62, 0.14, 4, 0.05), mPage))
  pageL.position.set(-0.58, 0, 0.03)
  char.add(pageL)
  const pageR = shadowed(new THREE.Mesh(new RoundedBoxGeometry(1.14, 1.62, 0.14, 4, 0.05), mPage))
  pageR.position.set(0.58, 0, 0.03)
  char.add(pageR)

  const faceMat = new THREE.MeshBasicMaterial({ map: faceTex, toneMapped: false })
  const face = new THREE.Mesh(new THREE.PlaneGeometry(2.28, 1.61), faceMat)
  face.position.z = 0.105
  char.add(face)

  for (const s of [-1, 1]) {
    const foot = shadowed(new THREE.Mesh(new THREE.SphereGeometry(0.3, 24, 16), mPeach))
    foot.scale.set(1, 0.6, 1.1)
    foot.position.set(s * 0.6, -1.02, 0.12)
    char.add(foot)
  }

  const makeArm = (side) => {
    const arm = new THREE.Group()
    arm.position.set(side * 1.28, 0.05, 0.02)
    const upper = shadowed(new THREE.Mesh(new THREE.CapsuleGeometry(0.1, 0.45, 8, 16), mPeach))
    upper.position.set(side * 0.18, -0.12, 0.05)
    upper.rotation.z = side * 0.9
    arm.add(upper)
    const hand = shadowed(new THREE.Mesh(new THREE.SphereGeometry(0.2, 24, 16), mPeach))
    hand.position.set(side * 0.4, -0.3, 0.1)
    arm.add(hand)
    char.add(arm)
    return { arm, hand }
  }
  const armL = makeArm(-1)
  const armR = makeArm(1)

  const pencil = new THREE.Group()
  const pBody = shadowed(new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 1.0, 20), mMint))
  pencil.add(pBody)
  const pCone = shadowed(new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.2, 20), mPeach))
  pCone.position.y = -0.6
  pCone.rotation.x = Math.PI
  pencil.add(pCone)
  const pTip = new THREE.Mesh(new THREE.ConeGeometry(0.024, 0.07, 12), mDark)
  pTip.position.y = -0.7
  pTip.rotation.x = Math.PI
  pencil.add(pTip)
  const pEnd = shadowed(new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.075, 0.12, 20), mCoverLight))
  pEnd.position.y = 0.56
  pencil.add(pEnd)
  pencil.position.set(0.08, 0.2, 0.08)
  pencil.rotation.set(0.15, 0, -0.55)
  armR.hand.add(pencil)

  const sparkles = []
  for (let i = 0; i < 9; i++) {
    const m = new THREE.Mesh(new THREE.OctahedronGeometry(0.08, 0), i % 2 ? mPinkSpark : mGold)
    m.scale.set(1, 1.7, 1)
    const a = (i / 9) * Math.PI * 2
    const r = 1.9 + (i % 3) * 0.35
    sparkles.push({ m, a, r, y: -0.6 + ((i * 37) % 10) * 0.16, s: 0.7 + (i % 4) * 0.2 })
    rig.add(m)
  }

  const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)
  const lerp = (a, b, t) => a + (b - a) * t
  let sp = 0
  let px = 0
  let py = 0
  let mx = 0
  let my = 0
  const onMove = (e) => {
    mx = (e.clientX / window.innerWidth) * 2 - 1
    my = (e.clientY / window.innerHeight) * 2 - 1
  }
  window.addEventListener('pointermove', onMove)

  const resize = () => {
    const w = window.innerWidth
    const h = window.innerHeight
    renderer.setSize(w, h, false)
    camera.aspect = w / h
    camera.updateProjectionMatrix()
  }
  resize()
  window.addEventListener('resize', resize)

  let nextBlink = 2.5
  let blinkT = -1
  const t0 = performance.now()
  let raf = 0

  const tick = () => {
    raf = requestAnimationFrame(tick)
    const t = (performance.now() - t0) / 1000
    const w = window.innerWidth
    const mobile = w < 900

    const target = Math.max(0, Math.min(2, window.scrollY / window.innerHeight))
    sp += (target - sp) * 0.08
    px += (mx - px) * 0.06
    py += (my - py) * 0.06

    const k = ease(Math.min(1, sp))
    const aspect = w / window.innerHeight
    const zMul = mobile ? Math.max(1.3, 1.1 / aspect + 0.7) : Math.max(1, 1.75 / aspect)
    const camZ = lerp(11.2, 9.0, k) * zMul
    const visW = 2 * camZ * Math.tan((15 * Math.PI) / 180) * aspect
    const camY = lerp(1.0, 0.4, k)
    const lookY = lerp(0.1, 0.0, k)
    const rigX = mobile ? 0 : visW * lerp(0.035, 0.17, k)
    const bodyYaw = lerp(-0.42, -0.14, k) + px * 0.12
    const headYaw = lerp(-0.5, -0.05, k) + px * 0.3
    const headPitch = lerp(0.14, 0.03, k) + py * 0.12
    const headRoll = lerp(0.18, 0, k)

    camera.position.set(px * 0.25, camY - py * 0.1, camZ)
    camera.lookAt(0, lookY, 0)
    rig.position.x = rigX
    rig.rotation.y = bodyYaw
    char.rotation.set(
      headPitch + Math.sin(t * 0.9) * 0.02,
      headYaw,
      headRoll + Math.sin(t * 0.7) * 0.02,
    )
    char.position.y = 0.05 + Math.sin(t * 1.4) * 0.03

    armL.arm.rotation.z = Math.sin(t * 1.4 + 1) * 0.07
    armR.arm.rotation.z = Math.sin(t * 1.4) * 0.07 - 0.05

    faceMode = sp > 1.55 ? 'happy' : 'normal'
    if (t > nextBlink && blinkT < 0) blinkT = t
    if (blinkT >= 0) {
      const u = (t - blinkT) / 0.18
      blink = u < 1 ? (u < 0.5 ? u * 2 : (1 - u) * 2) : 0
      if (u >= 1) {
        blinkT = -1
        blink = 0
        nextBlink = t + 2.5 + Math.random() * 3
      }
    }
    drawFace()

    sparkles.forEach((s, i) => {
      const a = s.a + t * 0.25 * s.s
      s.m.position.set(Math.cos(a) * s.r, s.y + Math.sin(t * 1.2 + i) * 0.1, Math.sin(a) * s.r * 0.6)
      const sc = 0.7 + Math.sin(t * 2 + i * 1.7) * 0.35
      s.m.scale.set(sc, sc * 1.7, sc)
      s.m.rotation.y = t + i
    })

    renderer.render(scene, camera)
  }
  tick()

  return () => {
    cancelAnimationFrame(raf)
    window.removeEventListener('pointermove', onMove)
    window.removeEventListener('resize', resize)
    renderer.dispose()
    pmrem.dispose()
    faceTex.dispose()
  }
}
