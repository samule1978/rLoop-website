define(["setTheStyle", "../lib/three.js/three", "../lib/three.js/orbitControls", "../lib/three.js/firstPersonControls", "../lib/three.js/projector", "../lib/three.js/canvasRenderer", "../lib/three.js/stereoEffect", "../lib/three.js/deviceOrientationControls", "../lib/three.js/stats.min"], function(setTheStyle, THREE, orbitControls, firstPersonControls, Projector, CanvasRenderer, StereoEffect, DeviceOrientationControls, stats) {
    var rloop = {
        mobile: undefined,
        camera: undefined,
        renderer: undefined,
        scene: undefined,
        content3D: undefined,
        frameID: undefined,
        textures: undefined,
        speedFactor: undefined,
        particles:undefined,
        bufferParticles:undefined,
        particlesOld:undefined,
        animating:undefined,
        animatingTween:undefined,

        whiteColor:undefined,

        animationStep:undefined,
        goForward:undefined,
        goBack:undefined,

        webglAvailable: undefined
    }

    /***private vars***/

    var camFOV = 45;
    var width, height;
    var camNear = 0.01;
    var camFar = 300;
    var controls;
    var controlsFPS;
    var container;

    var raycaster;
    var mouse;

    var clock;
    var cubeContainer = null;
    var cubeArray = [];

    var w = 20;
    var h = 15;

    var debugging = true;

    var imagesArray = [];
    var countLoading = 0;
    var t;
    var imageSteps = ['theraceison.png', 'hyperloop.png'];
    var loadedSteps = {};
    var imageAssets = [];
    /*** public function ***/

    rloop.PreInit = function(isMobile, data) {

        var scrollMagicController = new ScrollMagic();


        rloop.mobile = isMobile;

        rloop.scene = new THREE.Scene();
        container = document.getElementById("webGLContent");
        width = container.clientWidth;
        height = container.clientHeight;

        let imageAssets = [
            { name: 'step1', url:'theraceison.png'},
            { name: 'step2', url:'hyperloop.png'}
        ];

        this.textures = {};

        this.speedFactor = 0.03;
        this.particles = {};
        this.animating = false;
        this.animationStep = -1;
        this.goForward = 1;
        this.goBack = -1;
        this.animatingTween = false;
        this.whiteColor = new THREE.Color('rgb(255,255,255)');

        setTheStyle.set_layout();

        jq("#header").sticky({topSpacing:0, zIndex:10000});

        clock = new THREE.Clock();

        cubeContainer = new THREE.Object3D();
        rloop.scene.add(cubeContainer);

        addRenderer3D(container, width, height);
        //if (bokeh) initPostProcessing();
        addCamera3D();
        addImages();
        //addMaterials();
        addLight3D();
        ///addSkyBox();
        ///addButtons();
        addControls();
        //addTree()
        //initCubes();

        t = setInterval(function() {
            if (imageSteps.length == countLoading) {
                //console.log('steps loaded: ', loadedSteps);
                clearInterval(t);
                rloop.animationStep = 0;
                var partOobj = createGeometryFromInameData(loadedSteps[imageSteps[rloop.animationStep]].imgData, loadedSteps[imageSteps[rloop.animationStep]].img);
                rloop.particles = partOobj.particles;
                rloop.bufferParticles = partOobj.bParticles;
                rloop.bufferParticles.position.y = 0.3;                
                rloop.scene.add(rloop.bufferParticles);
                startAnimationStep(rloop.particles);
                //rloop.animating = true;
                //console.log('inscene now: ', rloop.scene);
                //displayImageInCubes(imagesArray[0]);
            }
        }, 500)

        addEvents();
        rloop.Animate();
    }

    rloop.Animate = function(a) {
        //console.log('a: ', a);
        if (debugging) stats.begin();

        rloop.renderer.render(rloop.scene, rloop.camera);

        TWEEN.update();

        if (rloop.animatingTween)
        {
            rloop.particles.geometry.verticesNeedUpdate = true;
            for (var i = 0, i3 = 0; i< rloop.particles.geometry.vertices.length; i++, i3+=3)
            {
                // var positions = rloop.bufferParticles.geometry.attributes.position.array;
                // positions[i*3 + 0] = rloop.particles.geometry.vertices[i].x;
                // positions[i*3 + 1] = rloop.particles.geometry.vertices[i].y;
                // positions[i*3 + 2] = rloop.particles.geometry.vertices[i].z;
                //color = rloop.particles.geometry.vertices[i].color;
                //positions[i3 + 0] = geometry.vertices[i].x;
                //positions[i3 + 1] = geometry.vertices[i].y;
                //positions[i3 + 2] = geometry.vertices[i].z;
            }

            rloop.bufferParticles.geometry.attributes.position.needsUpdate = true;
            rloop.bufferParticles.geometry.attributes.alpha.needsUpdate = true; // important!
        }

        if (rloop.animating)
        {
            //console.log('animating:')
            var countFinishedParticles = 0;
            for (var i = 0; i< rloop.particles.geometry.vertices.length; i++)
            {
                var part = rloop.particles.geometry.vertices[i];
                if (part.x == part.destination.x && part.y == part.destination.y && part.z == part.destination.z)
                {   
                    countFinishedParticles++;                    
                } else {

                    if (part.back)
                    {                        
                        //part.x += (part.destination.x - part.destination.x * strongEaseOut(part.x, part.destination.x)) * part.speed;
                        //part.y += ( part.destination.y - part.destination.y * strongEaseOut(part.y, part.destination.y)) * part.speed;
                        //part.z += (part.destination.z - part.destination.z * strongEaseOut(part.z, part.destination.z)) * part.speed;

                        part.x += (part.destination.x - part.x) * part.speed;
                        part.y += (part.destination.y - part.y) * part.speed;
                        part.z += (part.destination.z - part.z) * part.speed;
                        //console.log('particle: ', (part), ' particle dest: ', (part.destination))
                        if ((Math.abs(part.x) > Math.abs(part.destination.x))) 
                        //if (Math.abs(part.x - part.destination.x)<0.005)
                        {
                            part.x = part.destination.x;                        
                            //console.log('bigger x: ', part);
                        }
                        if ((Math.abs(part.y) > Math.abs(part.destination.y)))
                        //if (Math.abs(part.y - part.destination.y)<0.005)
                            part.y = part.destination.y;
                        if ((Math.abs(part.z) > Math.abs(part.destination.z))) 
                        //if (Math.abs(part.z - part.destination.z)<0.005)
                            part.z = part.destination.z;
                        // (part.destinationOld.x - part.x) * part.speed;
                        //part.y += (part.destinationOld.y - part.y) * part.speed;
                        //part.z += (part.destinationOld.z - part.z) * part.speed;
                    } else {
                        part.x += (part.destination.x - part.x) * part.speed;
                        part.y += (part.destination.y - part.y) * part.speed;
                        part.z += (part.destination.z - part.z) * part.speed;

                        //console.log('difference: ', part.x - part.destination.x)
                        if (Math.abs(part.x - part.destination.x)<0.005) part.x = part.destination.x;
                        if (Math.abs(part.y - part.destination.y)<0.005) part.y = part.destination.y;
                        if (Math.abs(part.z - part.destination.z)<0.005) part.z = part.destination.z;
                    }
                }
            }
            rloop.particles.geometry.verticesNeedUpdate = true;

            console.log('total finished particles: ', countFinishedParticles);
            if (countFinishedParticles == rloop.particles.geometry.vertices.length)
            {
                console.log('finished animation step: ', rloop.animationStep);
                rloop.animating = false;
                thisAnimationFinished(rloop.animationStep, rloop.goForward);
            }
        }

        if (debugging) stats.end();



        rloop.frameID = requestAnimationFrame(rloop.Animate);
    }

    //rloop
  // draw(20);


    /*** private functions ***/

    function addRenderer3D(cont, w, h) {
        // adding renderer
        rloop.webglAvailable = webglAvailable();
        //console.log('webGl available: ', rloop.webglAvailable);
        rloop.renderer = rloop.webglAvailable ? new THREE.WebGLRenderer({
            antialias: true,
            alpha: true,
            transparent: true
        }) : new THREE.CanvasRenderer({
            antialias: true,
            alpha: true
        });
        rloop.renderer.sortElements = true;
        rloop.renderer.setSize(w, h);
        rloop.renderer.domElement.id = 'webGL';

        rloop.renderer.setClearColor(0x000000, 0 );

        rloop.renderer.gammaInput = true;
        rloop.renderer.gammaOutput = true;

        cont.appendChild(rloop.renderer.domElement);
    }

    function addCamera3D() {
        //adding camera

        rloop.camera = new THREE.PerspectiveCamera(camFOV, width / height, camNear, camFar);
        rloop.camera.position.set(-0, 0, 32.5);
        //(0, 50, 10);
        rloop.scene.add(rloop.camera);
    }

    function addControls() {

        // adding controls

        raycaster = new THREE.Raycaster();
        mouse = new THREE.Vector2();


        controls = new THREE.OrbitControls(rloop.camera, rloop.renderer.domElement);

        controls.minDistance = 5;
        controls.maxDistance = 23;
        controls.enableDamping = true;
        controls.dampingFactor = 0.1;

        //controls.maxPolarAngle = 1.5 * Math.PI / 2;
        //controls.minPolarAngle =  0.4 * Math.PI / 2;

        controls.rotateSpeed = 0.1;
        controls.target = new THREE.Vector3(0, 0, 0);
        controls.target0 = new THREE.Vector3(0, 0, 0);
        controls.enableKeys = true;
        //controls.enablePan  =false;

        if (debugging) {
            //console.log('debug mode');
            controls.enablePan = true;
            controls.enableRotate = true;
            controls.enableZoom = true;

            controls.minDistance = 1;
            controls.maxDistance = Infinity;
            controls.minZoom = 0;
            controls.maxZoom = Infinity;
            addStats();
        }

        controls.autoRotate = true;
        controls.autoRotateSpeed = -0.055;

        controls.update();
    }

    function addImages() {
      

        for (var i=0;i<imageSteps.length;i++)
        {
            var loader = new THREE.ImageLoader();
            var url = 'img/steps/' + imageSteps[i];
            // load a image resource
            loader.stepi = i;
            loader.load(
                // resource URL
                url,
                // Function when resource is loaded
                function ( image ) {
                    // do something with it
                    var short = getShort(image.src);
                    loadedSteps[short] = {img: image, imgData: getImageData(image)};
                    //console.log('this step: ', image.src);
                    countLoading++;
                    // like drawing a part of it on a canvas                    
                },
                // Function called when download progresses
                function ( xhr ) {
                    //console.log( (xhr.loaded / xhr.total * 100) + '% loaded' );
                },
                // Function called when download errors
                function ( xhr ) {
                    console.log( 'An error happened' );
                }
            ); 
        }   


        
        // img.onload = function() {
        //     this.width = w;
        //     this.height = h;
        //     imagesArray.push(this);
        //     //document.body.appendChild(this);
        // };
        // img.src = url;
    }

    function addEvents() {
        return;
        document.addEventListener('wheel', function(event){

            var scrollLeft = window.pageXOffset || document.documentElement.scrollLeft,
            scrollTop = window.pageYOffset || document.documentElement.scrollTop;

            var ftomTop = document.getElementById('main').scrollTop;
            console.log('from Top: ', ftomTop,', deltay: ',event.deltaY, ' scrolltop: ', scrollTop);
            rloop.bufferParticles.initialPos = rloop.bufferParticles.position.clone();
            new TWEEN.Tween(rloop.bufferParticles.position)
                .to({y: rloop.bufferParticles.position.y + event.deltaY/33}, 500)
                //.easing( TWEEN.Easing.Cubic.InOut )
                .start();
        }, false);
    }



    function startAnimationStep () {
        rloop.animatingTween = true;
        var allparticles = rloop.particles;
        var countAnimations = 0;
        for (var i=0;i<allparticles.geometry.vertices.length;i++)
        {
            var part = allparticles.geometry.vertices[i];
            part.i = i;
            var raza = [180, 10, 5];
            var destOnCircle1 = {
                x: part.destination.x + raza[0] * Math.sin(Math.PI/2),
                y: part.destination.y + raza[0] * Math.cos(Math.PI/2),
                z: part.destination.z
            }

            var destOnCircle2 = {
                x: part.destination.x + raza[1] * Math.sin(-Math.PI/4),
                y: part.destination.y + raza[1] * Math.cos(-Math.PI/4),
                z: part.destination.z
            }

            var destOnCircle3 = {
                x: part.destination.x + raza[2] * Math.sin(-Math.PI/2+Math.PI/4),
                y: part.destination.y + raza[2] * Math.cos(-Math.PI/2+Math.PI/4),
                z: part.destination.z
            }

            var t = new TWEEN.Tween(part)
                //.to({x:})
                //.to({x:[ Math.random()*part.destination.x*8-part.destination.x*2, Math.random()*part.destination.x*6-part.destination.x*4, part.destination.x], y:[Math.random()*part.destination.y*8 - part.destination.y*16, Math.random()*part.destination.y*6 - part.destination.y*12,part.destination.y], z:[Math.random()*part.destination.z*15 - part.destination.z*5, Math.random()*part.destination.z*6 - part.destination.z*4,part.destination.z]}, part.speed * rloop.speedFactor * 3000000)
                .to({x: [destOnCircle1.x, destOnCircle2.x, destOnCircle3.x, part.destination.x], y: [destOnCircle1.y, destOnCircle2.y, destOnCircle3.y, part.destination.y], z: [destOnCircle1.z, destOnCircle2.z, destOnCircle3.z, part.destination.z]}, part.speed * 100000)
                .easing( TWEEN.Easing.Sinusoidal.InOut )
                .interpolation( TWEEN.Interpolation.Bezier )
                .onUpdate( function() {
                    var positions = rloop.bufferParticles.geometry.attributes.position.array;
                    positions[this.i*3 + 0] = rloop.particles.geometry.vertices[this.i].x;
                    positions[this.i*3 + 1] = rloop.particles.geometry.vertices[this.i].y;
                    positions[this.i*3 + 2] = rloop.particles.geometry.vertices[this.i].z;
                })
                .onComplete(function(){
                    countAnimations++;
                    if (countAnimations==allparticles.geometry.vertices.length)
                    {
                        //console.log('countAnimations: ', countAnimations)
                        rloop.animatingTween = false;
                        startAnimationStepOut(2000);
                    }
                    //rloop.particles.geometry.verticesNeedUpdate = true;
                })
                .start();
        }
    }

    function startAnimationStepOut (wait) {
        if (wait == undefined || wait == null) wait = 1000;
        var countAnimations = 0;
        var countNewAnimations = 0;
        rloop.animatingTween = true;
        rloop.animationStep++;
        //rloop.particlesOld = rloop.particles;
        //rloop.particles = null;
        var newParticles = createGeomFromImageData(loadedSteps[imageSteps[rloop.animationStep]].imgData, loadedSteps[imageSteps[rloop.animationStep]].img);
        var allparticles = rloop.particles;
        var newparticles = rloop.particles;
        //console.log('new particles geom: ', newParticles.vertices.length);
        //console.log('old particles geom: ', newparticles.geometry.vertices.length);
        var vertDifference = newParticles.vertices.length - rloop.particles.geometry.vertices.length;

        if (vertDifference<0)
        {
            var tempArr = getRandom(rloop.particles.geometry.vertices, Math.abs(vertDifference));
            console.log()
            for (var j=0;j<tempArr.length;j++)
            {
                var deleteThisParticle = tempArr[j];
                //deleteThisParticle
                deleteThisParticle.markedDelete = true;
                //console.log('marked;');
            }
            
        }
        //console.log('allparticles: ', allparticles)
        
        

        var opacTween = tweenOpacityTo('pre-block', 1, 500);
            //.start();

        for ( var par in allparticles.geometry.vertices )
        {
            var part = allparticles.geometry.vertices[par];
            var dest = {
                x: - Math.random() * 100 + 50,
                y: Math.random() * 30 - 15,
                z: Math.random() * 20 //+  //- 500;
            }
            //console.log('this par: ', par);
            part.i = par;
            part.opacity = 1;
            var alpha =( part.markedDelete) ? 0 : 1;
            var t = new TWEEN.Tween(part)
                .to({x:dest.x, y:dest.y, z:dest.z, opacity:alpha}, part.speed * 20000)
                .delay(wait)
                .easing( TWEEN.Easing.Cubic.InOut )
                .interpolation( TWEEN.Interpolation.Bezier )
                .onUpdate(function()
                {   
                    var positions = rloop.bufferParticles.geometry.attributes.position.array;
                    positions[this.i*3 + 0] = rloop.particles.geometry.vertices[this.i].x;
                    positions[this.i*3 + 1] = rloop.particles.geometry.vertices[this.i].y;
                    positions[this.i*3 + 2] = rloop.particles.geometry.vertices[this.i].z;
                    if (this.markedDelete) {
                        //console.log('this: ', allparticles.geometry);
                        rloop.bufferParticles.geometry.attributes.alpha.array[this.i] = this.opacity;
                        rloop.bufferParticles.geometry.attributes.alpha.needsUpdate = true;
                        //console.log('marked for deletion');
                        //allparticles.geometry.vertices.splice(allparticles.geometry.vertices.indexOf(this), 1)
                    }
                })
                .onComplete(function(){
                    countAnimations++;
                    if (this.markedDelete) {
                        //console.log('marked for deletion');
                        this.z = 500;
                        rloop.bufferParticles.geometry.attributes.position.array[this.i*3 + 2] = this.z;
                        //allparticles.geometry.vertices.splice(allparticles.geometry.vertices.indexOf(this), 1)
                    } else {
                        //console.log('countNewAnimations: ', countNewAnimations);
                        if (countNewAnimations<newParticles.vertices.length){
                            this.color = newParticles.vertices[countNewAnimations].color;
                            var t1 = new TWEEN.Tween(this)
                                .to({x:newParticles.vertices[countNewAnimations].x, y:newParticles.vertices[countNewAnimations].y, z:newParticles.vertices[countNewAnimations].z}, part.speed * 30000 )
                                .easing( TWEEN.Easing.Cubic.InOut )
                                .onUpdate(function() {
                                    var positions = rloop.bufferParticles.geometry.attributes.position.array;
                                    positions[this.i*3 + 0] = rloop.particles.geometry.vertices[this.i].x;
                                    positions[this.i*3 + 1] = rloop.particles.geometry.vertices[this.i].y;
                                    positions[this.i*3 + 2] = rloop.particles.geometry.vertices[this.i].z;
                                })
                                .onComplete(function() {
                                    countAnimations++;
                                    if ((this.color.r != rloop.whiteColor.r) || (this.color.g != rloop.whiteColor.g) || (this.color.b != rloop.whiteColor.b))
                                    {
                                       //console.log('other color: ',this.color, 'whiteColor: ',rloop.whiteColor);
                                        this.dummy = 1;
                                        var t2 = new TWEEN.Tween(this)
                                            .to({dummy:1}, Math.round(Math.random()*1000))
                                            .delay(Math.round(Math.random()*1000) + 1500)
                                            .onComplete(function()
                                            {
                                                var colors = rloop.bufferParticles.geometry.attributes.customColor.array;
                                                colors[this.i*3 + 0] = this.color.r;
                                                colors[this.i*3 + 1] = this.color.g;
                                                colors[this.i*3 + 2] = this.color.b;

                                                rloop.bufferParticles.geometry.attributes.customColor.needsUpdate = true;
                                            })
                                            .start();

                                    }
                                    
                                    if (countAnimations==(allparticles.geometry.vertices.length + newParticles.vertices.length))
                                    {
                                        //console.log('anim started at: ',countAnimations);
                                        var opacTw2 = tweenOpacityTo('post-block1', 1, 900).start();
                                        tweenOpacityTo('post-block2', 1, 1200).start();
                                        tweenOpacityTo('post-block3', 1, 1400).start();
                                        tweenOpacityTo('post-block4', 1, 1500).start();

                                        document.getElementById('body').style.overflow = 'visible';
                                    }
                                })
                                .interpolation( TWEEN.Interpolation.Bezier )
                                .start();    
                        }                        
                        countNewAnimations++;
                    }

                    if (countAnimations==allparticles.geometry.vertices.length)
                    {
                        opacTween.start();
                        //rloop.animatingTween = false;
                        //startAnimationStepOut(allparticles, 1000);
                    }

                    
                    //rloop.particles.geometry.verticesNeedUpdate = true;
                })
                .start();
        }
    }

    function tweenOpacityTo(divId, toOpacity, waitMili)
    {
        var opac = {o: 1 - toOpacity}
        var twEl = document.getElementById(divId);
        var opacTween = new TWEEN.Tween(opac).to({o:1}, rloop.particles.geometry.vertices[0].speed * 30000)
           .onUpdate(function(){
            //console.log('this: ', this);
            twEl.style.opacity = this.o;
        })
        .delay(waitMili)

        return opacTween;
    }

    function startColorTween()
    {

    }

    function createBufferGeometryParticlesFromImageData(imgData, img)
    {
        //var geometry = new THREE.BufferGeometry();
    }

    function createGeomFromImageData(imgData, img) {

        var geometry = new THREE.Geometry();
        for (var y = 0; y < imgData.height; y += 1)
        {
            for (var x = 0; x < imgData.width; x += 1)
            {   
                //console.log('checking[',x,'][',y,']: ', imgData.data[x*4  + y*4 * imgData.width])
                if (imgData.data[x*4  + y*4 * imgData.width] + imgData.data[x*4  + y*4 * imgData.width + 1] + imgData.data[x*4  + y*4 * imgData.width +2 ] > 0 ) {
                    var vert = new THREE.Vector3();
                    //vert.x = - Math.random() * 1000 + 500;
                    //vert.y = Math.random() * 1000 - 500;
                    //vert.z = Math.random() * 500 //- 500;


                    vert.destination = {
                        x: x - imgData.width / 2,
                        y: -y + imgData.height / 2,
                        z: 5
                    }
                    var xy = (y * 4) * imgData.width + x * 4;
                    vert.color = new THREE.Color('rgb(' + imgData.data[xy] + ', ' + imgData.data[xy+1] + ', ' + imgData.data[xy + 2] + ')');
                    console.log('vert color: ', vert.color);
                    console.log(imgData.data[xy], imgData.data[xy+1], imgData.data[xy+2]);
                    // vert.destination = {
                    //     x: x - imgData.width / 2,
                    //     y: -y + imgData.height / 2,
                    //     z: 0.05
                    // }

                    vert.x = vert.destination.x;
                    vert.y = vert.destination.y;
                    vert.z = vert.destination.z;

                    vert.speed = Math.random() / 200 + rloop.speedFactor;
                    geometry.vertices.push(vert);
                }
            }
        }

        return geometry;
    }
    

    function createGeometryFromInameData(imgData, img) {
        var geometry = new THREE.Geometry();
        
        var sprite = new THREE.TextureLoader().load("img/sprites/circleWhite.png");

        // uniforms
        
        uniforms = {
            color: { value: rloop.whiteColor },
            texture: { value: sprite }

        };

        var material = new THREE.PointsMaterial({
            size: 1.7,
            color: 0xFFFFFF,
            sizeAttenuation: true,
            transparent:true,
            //alphaTest: 0.1,
            map:sprite
        });

        var shaderMaterial = new THREE.ShaderMaterial({
            uniforms:       uniforms,
            vertexShader:   document.getElementById( 'vertexshaderP' ).textContent,
            fragmentShader: document.getElementById( 'fragmentshaderP' ).textContent,
            
            blending: THREE.AdditiveBlending,
            depthTest: false,
            depthWrite:false,
            transparent: true
            //transparent:    true,
            //alphaTest: 0.1
            //map: sprite
        })


        //console.log('got data: ', imgData, 'img: ', img);
        //var bufferGeometry = new THREE.BufferGeometry().fromGeometry( geometry );
        
        for (var y = 0; y < imgData.height; y += 1)
        {
            for (var x = 0; x < imgData.width; x += 1)
            {   
                //console.log('checking[',x,'][',y,']: ', imgData.data[x*4  + y*4 * imgData.width])
                if (imgData.data[x*4  + y*4 * imgData.width] > 0 ) {
                    var vert = new THREE.Vector3();
                    vert.x = - Math.random() * 1000 + 500;
                    vert.y = Math.random() * 1000 - 500;
                    vert.z = Math.random() * 500 //- 500;
                    var xy = (y * 4) * imgData.width + x * 4;
                    vert.color = new THREE.Color('rgb(' + imgData.data[xy] + ', ' + imgData.data[xy+1] + ', ' + imgData.data[xy + 2] + ')');
                    console.log(vert.color);
                    vert.destination = {
                        x: x - imgData.width / 2,
                        y: -y + imgData.height / 2,
                        z: 0.05
                    }

                    // vert.x = vert.destination.x;
                    // vert.y = vert.destination.y;
                    //vert.z = vert.destination.z;

                    vert.speed = Math.random() / 200 + rloop.speedFactor;                    
                    geometry.vertices.push(vert);
                    //attributes.alpha.value[ geometry.vertices.length-1 ] = 1;
                }
            }
        }
        var bufferGeometry = new THREE.BufferGeometry();
        var positions = new Float32Array(geometry.vertices.length * 3) ;
        var colors = new Float32Array(geometry.vertices.length * 3) ;
        var sizes = new Float32Array( geometry.vertices.length );
        //var color = new THREE.Color();

        for (var i = 0, i3 = 0; i< geometry.vertices.length; i++, i3+=3)
        {
            color = geometry.vertices[i].color;
            positions[i3 + 0] = geometry.vertices[i].x;
            positions[i3 + 1] = geometry.vertices[i].y;
            positions[i3 + 2] = geometry.vertices[i].z;

            colors[ i3 + 0 ] = color.r;
            colors[ i3 + 1 ] = color.g;
            colors[ i3 + 2 ] = color.b;
            
            sizes[ i ] = 1;
        }
        bufferGeometry.addAttribute( 'position', new THREE.BufferAttribute( positions, 3 ) );
        bufferGeometry.addAttribute( 'customColor', new THREE.BufferAttribute( colors, 3 ) );
        bufferGeometry.addAttribute( 'size', new THREE.BufferAttribute( sizes, 1 ) );
        console.log('geometry: ', bufferGeometry);
        //bufferGeometry.computeBoundingSphere();
        // add an attribute
        var numVertices = bufferGeometry.attributes.position.count;
        var alphas = new Float32Array( numVertices * 1 ); // 1 values per vertex

        for( var i = 0; i < numVertices; i ++ ) {   
            //console.log('added alpha');     
            alphas[ i ] = 1;// Math.random();
        }

        bufferGeometry.addAttribute( 'alpha', new THREE.BufferAttribute( alphas, 1 ) );
        
        bufferGeometry.attributes.customColor.needsUpdate = true;
        var particles = new THREE.Points(geometry, material);
        var bufferParticles = new THREE.Points(bufferGeometry, shaderMaterial);

        //console.log('particles: ', particles);
        return {
            particles:particles,
            bParticles: bufferParticles
        };        
    }

   
    function thisAnimationFinished(currentStep, direction)
    {
        //console.log('going to next animation: ')
        rloop.animationStep = currentStep + direction;

        switch (currentStep)
        {
            case 0:
                animateOut(currentStep);
                break;
            case 1:
                break;

        }
    }

    function animateOut(currentStep)
    {
        switch (currentStep)
        {
            case 0:
                for (var i = 0;i<rloop.particles.geometry.vertices.length;i++)
                {
                    var vert = rloop.particles.geometry.vertices[i];

                    vert.destinationOld = {
                        x: vert.destination.x+0.001,
                        y: vert.destination.y+0.001,
                        z: vert.destination.z+0.001
                    }
                    vert.destination = {
                        x: - Math.random() * 1000 + 500,
                        y: Math.random() * 1000 - 500,
                        z: Math.random() * 500
                    }
                    vert.speed = Math.random() / 200 + rloop.speedFactor;
                    vert.back = true;
                }
                rloop.animating = true;
                break;
        }
    }
    

    function addLight3D() {

        ambientLight = new THREE.AmbientLight(0xEEEEEE, 0.5)
            //rloop.scene.add(ambientLight);
        directionalLight = new THREE.SpotLight(0xffffff, 1);
        directionalLight.position.set(-185, 155, 150);
        directionalLight.castShadow = false;

        rloop.scene.add(directionalLight)

        //directionalLight.shadow.mapSize.width = 4024;
        //directionalLight.shadow.mapSize.height = 4024;
        //directionalLight.shadow.camera.near = 100;
        //directionalLight.shadow.camera.far = 200;
        //directionalLight.shadow.camera.fov = 70;
        //directionalLight.target.position.normalize();
        //directionalLight.target.position.set( 0, 0, 1000 );
        //directionalLight.target.position.set( 0, 0, 50 );
        //directionalLight.shadowMapVisible = true;        
        //simSphere.scene.add( directionalLight );
        //spotLight = new THREE.SpotLight( 0xffffff , 1);
        //spotLight.position.set(260, 280, 300 );
        //spotLight.castShadow = false;
        /*
        spotLight.shadow.mapSize.width = 4096;
        spotLight.shadow.mapSize.height = 4096;
        spotLight.shadow.camera.near = 100;
        spotLight.shadow.camera.far = 500;
        spotLight.shadow.camera.fov = 80;
        */
        //simSphere.scene.add( spotLight );
        var dirLight = new THREE.DirectionalLight(0xf2f2f2, 0.9);
        dirLight.position.set(100, 1000, 50);
        rloop.scene.add(dirLight);

        // var ambLight = new THREE.HemisphereLight(0xfef9f0, 0xFFFFFF, 0.1);
        // rloop.scene.add(ambLight);
    }

    function addStats() {
        //adding stats

        stats = new Stats();
        stats.showPanel(1);
        document.body.appendChild(stats.dom);
    }

    function getImageData(image) {
        var canvas = document.createElement("canvas");
        canvas.width = image.width;
        canvas.height = image.height;

        var ctx = canvas.getContext("2d");
        ctx.drawImage(image, 0, 0);

        return ctx.getImageData(0, 0, image.width, image.height);
    }  

    function getShort(longUrl) {
        for (var i=0;i<imageSteps.length;i++)
        {
            if (longUrl.indexOf(imageSteps[i]) >= 0)
                return imageSteps[i];
        }

    }

    /*** helper function ***/

    function webglAvailable() {
        //return false;
        try {
            var canvas = document.createElement("canvas");
            return !!
                window.WebGLRenderingContext &&
                (canvas.getContext("webgl") ||
                    canvas.getContext("experimental-webgl"));
        } catch (e) {
            return false;
        }
    }

    function strongEaseOut(t, d){
      return 1 - Math.pow(1 - (t / d), 2);
    }

    function getRandom(arr, n) {
        var result = new Array(n),
            len = arr.length,
            taken = new Array(len);
        if (n > len)
            throw new RangeError("getRandom: more elements taken than available");
        while (n--) {
            var x = Math.floor(Math.random() * len);
            result[n] = arr[x in taken ? taken[x] : x];
            taken[x] = --len;
        }
        return result;
    }

    return rloop;
});