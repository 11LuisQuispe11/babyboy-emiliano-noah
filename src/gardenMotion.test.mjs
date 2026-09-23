import test from 'node:test'
import assert from 'node:assert/strict'
import { getGardenShot, hostsInGarden } from './gardenMotion.mjs'
import { getRouteShot } from './sceneMotion.mjs'
const close = (a,b) => a.forEach((v,i)=>assert.ok(Math.abs(v-b[i]) < 1e-7, `${a} != ${b}`))

test('garden route connects scene two, panorama and final framing continuously', () => {
  for (const portrait of [false,true]) {
    const start=getGardenShot('travel',0,portrait), previous=getRouteShot('arrived',1,portrait)
    close(start.position,previous.position);close(start.target,previous.target);assert.equal(start.fov,previous.fov)
    for(const [a,b] of [['travel','panorama'],['panorama','reveal'],['reveal','ready']]) {
      const end=getGardenShot(a,1,portrait), next=getGardenShot(b,0,portrait)
      close(end.position,next.position);close(end.target,next.target);assert.equal(end.fov,next.fov)
    }
  }
})

test('route follows the entrance and left corridor, avoiding the entrance building', () => {
  for(let i=0;i<=1000;i++) {
    const [x,y,z]=getGardenShot('travel',i/1000).position
    assert.ok(Number.isFinite(x+y+z))
    assert.ok(!(x>=-2.12 && x<=2.96 && z>=6.81 && z<=10.94),'camera entered the building')
    if(z < 10.94 && z > 6.81) assert.ok(x >= -4.2 && x <= -2.6, 'camera left the corridor')
  }
})

test('panorama turns a full 360 degrees from a fixed garden-center position', () => {
  let previous=0,total=0
  for(let i=0;i<=1000;i++) {
    const shot=getGardenShot('panorama',i/1000)
    close(shot.position,[-1.2,2.1,3.5])
    const angle=Math.atan2(shot.target[0]+1.2,-(shot.target[2]-3.5))
    let diff=angle-previous
    if(diff < -Math.PI)diff+=Math.PI*2
    total+=diff;previous=angle
  }
  assert.ok(Math.abs(total-Math.PI*2)<1e-7)
  assert.equal(hostsInGarden('travel',1),false)
  assert.equal(hostsInGarden('panorama',0.49),false)
  assert.equal(hostsInGarden('panorama',0.5),true)
  assert.equal(hostsInGarden('ready',0),true)
})