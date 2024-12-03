import * as THREE from 'three'

// import image from './public/img.jpeg'

function clamp(number, min, max) {
  return Math.max(min, Math.min(number, max));
}
class Sketch {
  constructor(options =  {dom: null, image: {imageUrl: null, height: null, width: null}, shaders: {vertex: null, fragment: null}, setting: {relaxation: 0.90, strength: 0.13, mouse: 0.5}},)
  {
    this.dom = options.dom
    this.imageUrl = options.image.imageUrl
    this.WIDTH = this.dom.offsetWidth
    this.HEIGHT = this.dom.offsetHeight
    this.vertexShader = options.shaders.vertex
    this.fragmentShader = options.shaders.fragment
    this.imageAspectRatio = options.image.height/options.image.width
    this.texture = {
      dataTexture: null,
      width: 100,
      height: 50
    }
    this.relaxation = options.setting.relaxation
    this.mouse_ = options.setting.mouse
    this.strength = options.setting.strength
    this.uniforms = {
      uTexture: {value: new THREE.TextureLoader().load(this.imageUrl)},
      uDataTexture: {value: null},
      uResolution: {value: new THREE.Vector4()}

    }
    this.mouse = {
      x:0,
      y:0,
      prevX: 0,
      prevY: 0,
      velX: 0,
      velY: 0,
      gridX: 0,
      gridY: 0,
      isOver: false

    }

    this.scene = new THREE.Scene()
    this.camera = new  THREE.OrthographicCamera(1/-2, 1/2, 1/2, 1/-2, -1000, 1000)
    this.camera.position.set(0, 0, 2)
    this.scene.add(this.camera)

    // resizing image 
    let a1, a2;
    if(this.HEIGHT/this.WIDTH > this.imageAspectRatio)
    {
      a1 = (this.WIDTH/this.HEIGHT) * this.imageAspectRatio
      a2 = 1
    } else {
      a1 = 1
      a2 = (this.HEIGHT/this.WIDTH) / this.imageAspectRatio
    }
    
    this.uniforms.uResolution.value.x = this.WIDTH
    this.uniforms.uResolution.value.y = this.HEIGHT
    this.uniforms.uResolution.value.z = a1
    this.uniforms.uResolution.value.w = a2

    this.activateMouseEvent()
    this.addObject()
    this.generateDataTexture()
    this.render()
    this.animate()
    
  }


  addObject()
  {
    this.generateDataTexture()
    this.geometry = new THREE.PlaneGeometry(1, 1, 1)
    this.material = new THREE.ShaderMaterial({
      uniforms: this.uniforms,
      vertexShader: this.vertexShader,
      fragmentShader: this.fragmentShader
    })
    this.plane = new THREE.Mesh(this.geometry, this.material)

    this.scene.add(this.plane)
  }
  
  generateDataTexture()
  {


    const size = this.texture.width * this.texture.height;
    const data = new Float32Array( 4 * size );

    for ( let i = 0; i < size; i++ ) {
	    const stride = i * 4;
	    data[ stride ] = Math.random()*255 -125;
	    data[ stride + 1 ] = Math.random()*255 -125;
	    data[ stride + 2 ] = 0;
	    data[ stride + 3 ] = 1;
 }

    this.texture.dataTexture = new THREE.DataTexture( data, this.texture.width, this.texture.height, THREE.RGBAFormat, THREE.FloatType );
    this.texture.dataTexture.flipY = true
    this.texture.dataTexture.needsUpdate = true;
    this.uniforms.uDataTexture.value = this.texture.dataTexture
}

  activateMouseEvent()
  {
    this.dom.addEventListener('mousemove', (e) => {
      // console.log(e)
      this.mouse.x = e.offsetX/this.WIDTH
      this.mouse.y = e.offsetY/this.HEIGHT
      
      this.mouse.velX = this.mouse.x-this.mouse.prevX
      this.mouse.velY = this.mouse.y-this.mouse.prevY

      // this.mouse.velX += 0.5
      // this.mouse.velY += 0.5

      this.mouse.prevX = this.mouse.x
      this.mouse.prevY = this.mouse.y


      this.mouse.gridX = Math.round(e.offsetX/(this.WIDTH/this.texture.width))
      this.mouse.gridY = Math.round(e.offsetY/(this.HEIGHT/this.texture.height))
    })
    this.dom.addEventListener('mouseenter', (e) => {
      this.mouse.isOver = true
    })
    this.dom.addEventListener('mouseleave', (e) => {
      this.mouse.isOver = false
    })
    
  }
  updateDataTexture()
  {
    let data = this.texture.dataTexture.image.data;
    for(let i = 0; i < data.length; i+=4) {
      data[i] *= this.relaxation
      data[i+1] *= this.relaxation
    }

    let mouseX = (this.mouse.x*this.texture.width),
        mouseY = ((this.mouse.y)*this.texture.height)
    let aspect = this.WIDTH/this.HEIGHT;
    let distance = (x1, y1, x2, y2) => {
        return (((x2-x1)**2)/aspect + ((y2-y1)**2))
    }

    let threshold_distance = this.texture.width * this.mouse_

    if(this.mouse.isOver)
    {
      for(let i = 0; i < this.texture.height; i++)
      {
        for(let j = 0; j < this.texture.width; j++)
        {
          const d = Math.sqrt(distance(mouseX, mouseY, j, i))
          if(d < (threshold_distance))
          {
            let power = threshold_distance/d
            power = clamp(power, 0, 10)
            let loc = 4* (parseInt(i*this.texture.width) + j);
            data[parseInt(loc)] += this.strength* 100*this.mouse.velX * power
            data[parseInt(loc) + 1] -= this.strength * 100*this.mouse.velY * power
            console.log(data[loc])
          }
        }
      }
    }
    

    this.mouse.velX *=this.relaxation
    this.mouse.velY *= this.relaxation
    this.texture.dataTexture.needsUpdate = true
  } 



  render()
  {
    this.renderer = new THREE.WebGL1Renderer()
    this.renderer.setSize(this.WIDTH, this.HEIGHT)
    this.dom.appendChild(this.renderer.domElement)
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(this.WIDTH, this.HEIGHT);
    this.renderer.setClearColor(0xeeeeee, 1);
    this.renderer.physicallyCorrectLights = true;
    // this.renderer.outputEncoding = THREE.sRGBEncoding;
  }
  animate()
  {
    this.updateDataTexture()
    requestAnimationFrame(this.animate.bind(this))
    this.renderer.render(this.scene, this.camera)
  }

}


async function loadShaders(vUrl, fUrl) {
  const loader = new THREE.FileLoader()
  const vertex = await loader.loadAsync(vUrl)
  const fragment = await loader.loadAsync(fUrl)

  return {vertex, fragment}
}

loadShaders('/shaders/vertex.glsl', '/shaders/fragment.glsl').then((data) => {
  const app = new Sketch({
    dom: document.querySelector('.canvas-container'),
    image: {
      imageUrl: '/public/img1.jpg',
      height: 2048,
      width: 2048
    },
    shaders: {
      vertex: data.vertex,
      fragment: data.fragment
    },
    setting: {
      relaxation: 0.90,
      strength: 0.15,
      mouse: 0.13
    }
  })
  console.log(app)
})



