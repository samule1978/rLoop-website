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

        tweensArray:undefined,

        webglAvailable: undefined,

        geometriesArray: undefined,
        idleWithParticles: undefined
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
    var imageSteps = ['theraceison.png', 'hyperloop.png', 'earthmap.png'];
    var loadedSteps = {};
    var imageAssets = [];

    var currentStage = 0;
    var scrollMagicController;
    var firstTextAnimationsNotComplete = true;

    var newGeometry;
    var shaderMaterial;
    var material;

    var prevValue = {
        width: 0,
        height: 0
    }

    var tweensContainer = [];
    var groupA; 

    /*** public function ***/


    rloop.PreInit = function(isMobile, data) {
        jq("#header").sticky({topSpacing:0, zIndex:10000});
        //jq("#coin").sticky({topSpacing:0, zIndex:10005});

        scrollMagicController = new ScrollMagic.Controller({
            globalSceneOptions: {
                triggerHook: 'onLeave',

            }
        });
        

        var slides = document.querySelectorAll("section.pageClass")
        for (var i=0; i<slides.length; i++) {
            new ScrollMagic.Scene({
                    triggerElement: slides[i]
                })
                .setPin(slides[i])
                .addIndicators() // add indicators (requires plugin)
                .on('enter', function (e){
                    //leavingScene( e );
                    
                    startScene( e );
                })
                .on('start' , function (e){
                    leavingScene ( e );
                })
                .on('progress', function (e) {
                    //progressInScene()
                })
                .on('update', function (e) {
                    var currentMoving = parseInt($(e.target.triggerElement()).attr('id').split('pag')[1]) - 1;
                    //console.log('current moving: ', currentMoving, 'current stage: ', currentStage)
                    if (currentMoving != currentStage) return;
                    sliderUpdate(e);
                    //console.log('leaving, ',e);
                } )
                .addTo(scrollMagicController);
        }
        scrollMagicController.enabled(false);

        rloop.mobile = isMobile;

        rloop.scene = new THREE.Scene();
        container = document.getElementById("webGLContent");
        width = container.clientWidth;
        height = container.clientHeight;

        let imageAssets = [
            { name: 'step1', url:'theraceison.png'},
            { name: 'step2', url:'hyperloop.png'},
            { name: 'step3', url:'earthmap.png'}
        ];

        this.textures = {};
        this.geometriesArray = [];
        this.speedFactor = 0.03;
        this.particles = {};
        this.animating = false;
        this.animationStep = 0;
        this.goForward = 1;
        this.goBack = -1;
        this.animatingTween = false;
        this.whiteColor = new THREE.Color('rgb(255,255,255)');
        this.idleWithParticles = false;

        groupA = new TWEEN.Group();

        setTheStyle.set_layout();

        prevValue.width = window.innerWidth;
        prevValue.height = window.innerHeight;

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
                generateAllGeometries();
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

        //addEvents();
        //onWindowResize();
        window.addEventListener( 'resize', onWindowResize, false );
        rloop.Animate();
    }

    
    function generateAllGeometries()
    {
        //// First Element is THE RACE IS ON
        var el = createGeomFromImageData(loadedSteps[imageSteps[0]].imgData);

        rloop.geometriesArray.push(el);

        //// SECOND ELEMENT IS    HYPERLOOPO
        el = createGeomFromImageData(loadedSteps[imageSteps[1]].imgData);
        rloop.geometriesArray.push(el);

        //// THIRD ELEMENT IS CIRCLE
        //createThreeCirclesGeometry ( spritesPerCircle, raza1, zDistance, xDistance, numberOfCircles, center, scaleFactor, firstScale, offset )
        var circleCenter = new THREE.Vector3(15, 0, 0);
        el = createThreeCirclesGeometry(70, 15, 5, 3, 4, circleCenter, 1.4, 1.5, Math.PI/140);
        rloop.geometriesArray.push(el);

        //// FOURTH ELEMENT IS MAP!!!
        el = createGeomFromImageData(loadedSteps[imageSteps[2]].imgData);
        rloop.geometriesArray.push(el);

        console.log('All geometries generated: ', rloop.geometriesArray);
    }
    var time = 0;
    rloop.Animate = function(a) {
        //console.log('a: ', a);
        if (debugging) stats.begin();

        

        TWEEN.update();
        groupA.update();

        if (rloop.animatingTween)
        {
            //if (rloop.bufferParticles) console.log('animating particles: ', rloop.bufferParticles.geometry.attributes.alpha.array[0])
            rloop.particles.geometry.verticesNeedUpdate = true;
            // for (var i = 0, i3 = 0; i< rloop.particles.geometry.vertices.length; i++, i3+=3)
            // {
                
            // }

            rloop.bufferParticles.geometry.attributes.position.needsUpdate = true;
            rloop.bufferParticles.geometry.attributes.alpha.needsUpdate = true; // important!
        }

        if (rloop.idleWithParticles)
        {
            time++;
            rloop.camera.position.x = Math.sin(time / 500) * 5;
            //console.log('camera moving?')
            rloop.camera.lookAt(rloop.bufferParticles.position);
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

            //console.log('total finished particles: ', countFinishedParticles);
            if (countFinishedParticles == rloop.particles.geometry.vertices.length)
            {
                //console.log('finished animation step: ', rloop.animationStep);
                rloop.animating = false;
                thisAnimationFinished(rloop.animationStep, rloop.goForward);
            }
        }

        rloop.renderer.render(rloop.scene, rloop.camera);
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
        rloop.renderer.domElement.id = 'webGLCanv';

        rloop.renderer.setClearColor(0x000000, 0 );

        rloop.renderer.gammaInput = true;
        rloop.renderer.gammaOutput = true;

        cont.appendChild(rloop.renderer.domElement);
    }

    function addCamera3D() {
        //adding camera

        rloop.camera = new THREE.PerspectiveCamera(camFOV, width / height, camNear, camFar);
        rloop.camera.position.set(-0, 0, 32.5);
        rloop.camera.rememberPosition = rloop.camera.position.clone();
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

    function startScene(event)
    {
        currentStage = parseInt($(event.target.triggerElement()).attr('id').split('pag')[1]) - 1;
        //console.log('leaving scene with event: ', event)
    }

    function leavingScene(event)
    {
        if (event.scrollDirection == 'REVERSE')
            currentStage = parseInt($(event.target.triggerElement()).attr('id').split('pag')[1]) - 2;
        //console.log('leaving scene with event: ', event)
    }

    function progressInScene( scene )
    {
        //console.log('progress in scene: ', scene)
    }

    function sliderUpdate ( event )
    {
        
        var sectionHeight = $(event.target.triggerElement())[0].clientHeight;
        //console.log('event: ', event, sectionHeight);
        //var currentStage = parseInt($(e.target.triggerElement()).attr('id').split('pag')[1]) - 1;
        var scrollPercentInStage = (event.scrollPos - sectionHeight*currentStage) / sectionHeight;

        console.log('current stage: ', currentStage, ' triggered by: ', $(event.target.triggerElement())[0].id)
        switch (currentStage)
        {
            case 0:
                //console.log(scrollPercentInStage)
                if (scrollPercentInStage<0.3)
                {
                    if (rloop.animationStep > 1 && rloop.animationStep <= 2)
                    {
                        rloop.animationStep = 1;
                        tweenOpacityTo('txtTitl', 0, 500).start();
                        tweenToGeometryFromRandom(rloop.geometriesArray[1]);
                        return;
                    }
                }

                if (scrollPercentInStage<0.7)
                {
                    if (rloop.animationStep > 2)
                    {
                        rloop.animationStep = 2;
                        executeAfterExitCircle();
                        tweenOpacityTo('mainTxt', 0, 0).start();
                        tweenToNewGeometry(rloop.geometriesArray[1]);
                        return;
                    }
                }

                if (scrollPercentInStage>0.4 && scrollPercentInStage<0.6) 
                {
                    if (rloop.animationStep < 2)
                    {
                        rloop.animationStep = 2;                      

                        tweenOpacityTo('txtTitl', 1, 500).start();
                        tweenToNewGeometry(rloop.geometriesArray[2]); 
                        return;                           
                    }                    
                }

                if (scrollPercentInStage>0.6)
                {
                    if (rloop.animationStep<2.1)
                    {
                        rloop.animationStep = 2.1;

                        rloop.bufferParticles.rotation.y = -Math.PI/14;
                        rloop.bufferParticles.position.y = 0;
                        rloop.camera.position = new THREE.Vector3(0,0,32)// rloop.camera.rememberPosition.clone();
                        rloop.camera.lookAt(new THREE.Vector3(0,0,0));
                        tweenOpacityTo('mainTxt', 1, 0).start();
                        tweenToGeometryFromRandom(rloop.geometriesArray[2],0, executeAfterLoadingCircle);
                        return;
                    }
                }
                break;


            case 1:
                if (scrollPercentInStage<0.3)
                {
                    if (rloop.animationStep > 2.1 && rloop.animationStep <= 3)
                    {
                        rloop.animationStep = 2.1;
                        tweenOpacityTo('txtTitl', 1, 100).start();
                        tweenOpacityTo('mainTxt', 1, 0).start();
                        tweenToGeometryFromRandom(rloop.geometriesArray[2],0, executeAfterLoadingCircle);
                        return;
                    }
                }

                if (scrollPercentInStage<0.7)
                {
                    if (rloop.animationStep > 3)
                    {
                        rloop.animationStep = 3;
                        tweenOpacityTo('mainTxt', 0, 0).start();
                        tweenToNewGeometry(rloop.geometriesArray[2]);
                        return;
                    }
                }                

                if (scrollPercentInStage>0.4 && scrollPercentInStage<0.6) 
                {
                    if (rloop.animationStep < 3)
                    {
                        console.log('here: ', rloop.animationStep)
                        rloop.animationStep = 3;
                        executeAfterExitCircle();
                        tweenOpacityTo('mainTxt', 0, 0).start();
                        tweenToNewGeometry(rloop.geometriesArray[3]); 
                        return;                           
                    }                    
                }

                if (scrollPercentInStage>0.6)
                {
                    if (rloop.animationStep<3.1)
                    {                        
                        rloop.animationStep = 3.1;
                        //console.log('do next step: ',rloop.animationStep);
                        tweenOpacityTo('txtTitl', 0, 100).start();
                        rloop.bufferParticles.rotation.y = -Math.PI/14;
                        rloop.bufferParticles.position.y = 0;
                        rloop.camera.position = rloop.camera.rememberPosition.clone();
                        rloop.camera.lookAt(new THREE.Vector3(0,0,0));

                        tweenToGeometryFromRandom(rloop.geometriesArray[3],0, null);
                        return;
                    }
                }
                break;
        }
    }

    function executeAfterLoadingCircle() {
        var coin = document.getElementById('coinContainer');
        var coinDiv = document.getElementById('coin');
        var putIn = document.getElementById('pag2');
        
        coinDiv.style.transform = 'rotateY( 180deg )';
        coinDiv.style.transform = 'rotateY( 0deg )';

        //tweenOpacityTo('mainTxt', 1, 500).start();
        //putIn.appendChild(coin);
    }

    function executeAfterExitCircle() {
        //var coin = document.getElementById('coinContainer');
        var coinDiv = document.getElementById('coin');
        //var putIn = document.getElementById('pag2');
        
        coinDiv.style.transform = 'rotateY( 180deg )';
        //coinDiv.style.transform = 'rotateY( 0deg )';

        //putIn.appendChild(coin);
    }

    function addWheelEventsAfterStep1() {
        //return;
        document.addEventListener('wheel', function(event){


            var scrollLeft = window.pageXOffset || document.documentElement.scrollLeft,
            scrollTop = window.pageYOffset || document.documentElement.scrollTop;

            //incepem animatia a doua
            if (scrollTop == 0 && event.deltaY>0)
            {

            }

            // var ftomTop = document.getElementById('main').scrollTop;
            // console.log('from Top: ', ftomTop,', deltay: ',event.deltaY, ' scrolltop: ', scrollTop);
            // rloop.bufferParticles.initialPos = rloop.bufferParticles.position.clone();
            // new TWEEN.Tween(rloop.bufferParticles.position)
            //     .to({y: rloop.bufferParticles.position.y + event.deltaY/33}, 500)
            //     //.easing( TWEEN.Easing.Cubic.InOut )
            //     .start();
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
                    //console.log('this: ', this._object)
                    positions[this._object.i*3 + 0] = rloop.particles.geometry.vertices[this._object.i].x;
                    positions[this._object.i*3 + 1] = rloop.particles.geometry.vertices[this._object.i].y;
                    positions[this._object.i*3 + 2] = rloop.particles.geometry.vertices[this._object.i].z;
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

    function tweenToGeometryFromRandom(newGeometry, wait, runAfterFinish)
    {
        TWEEN.removeAll();
        rloop.idleWithParticles = false;
        //WE ALREADY HAVE THE BUFFER GEOMETRY IF WE STOPPED THE ANIMATION EARLIER
        if (wait == undefined || wait == null) wait = 0;

        rloop.animatingTween = true;
        var allparticles = rloop.particles;
        var newParticles = newGeometry;

        var vertDifference = newParticles.vertices.length - allparticles.geometry.vertices.length;
        for (var q = 0; q< allparticles.geometry.vertices.length;q++)
        {
            allparticles.geometry.vertices[q].markedDelete = false;
        }
        if (vertDifference<0)                                       // we need less particles, mark them for deletion
        {
            var tempArr = getRandom(rloop.particles.geometry.vertices, Math.abs(vertDifference));
            console.log('temp array length: ', tempArr.length)
            for (var j=0;j<tempArr.length;j++)
            {
                var deleteThisParticle = tempArr[j];
                allparticles.geometry.vertices[tempArr[j].i].markedDelete = true;
               // deleteThisParticle.markedDelete = true;
            }
        } else {
            
            if (vertDifference>0){                               //we need more particles, mark for adding (add some neutral ones)
                addMoreParticles( vertDifference );
                updateTheBufferGeometryToMoreParticles( vertDifference );
            }
        }

        var countNewAnimations = 0;
        var countUnmarkedForDelete = 0;        

        var countAnimationsStarted = 0;
        var countAnimationsEnded = 0;
        for ( var par = 0; par < allparticles.geometry.vertices.length; par++ )
        {
            var part = allparticles.geometry.vertices[par];
            var dest = {
                x: - Math.random() * 100 + 50,
                y: Math.random() * 50 - 25,
                z: Math.random() * 30, //+  //- 500;
                alpha: Math.random() * 0.5,
                //alpha: ( part.markedDelete) ? 0 : 0.2,
                size: Math.random()
            }

            dest2 = {
                x:dest.x,
                y:dest.y,
                z:dest.z
            }
            part.i = par;
            part.dest2 = dest2;
            if (part.markedDelete)
            {
                part.dest2 = {
                    x: - Math.random() * 100 + 50,
                    y: Math.random() * 50 - 25,
                    z: Math.random() * 30, //+  //- 500;
                    alpha: 0 ,//( part.markedDelete) ? 0 : 0.2,
                    size: Math.random()
                }
            }

            if (!part.markedDelete && newParticles.vertices[countUnmarkedForDelete]) {

                dest2.x = newParticles.vertices[countUnmarkedForDelete].x;
                dest2.y = newParticles.vertices[countUnmarkedForDelete].y;
                dest2.z = newParticles.vertices[countUnmarkedForDelete].z;

                dest2.r = newParticles.vertices[countUnmarkedForDelete].color.r;
                dest2.g = newParticles.vertices[countUnmarkedForDelete].color.g;
                dest2.b = newParticles.vertices[countUnmarkedForDelete].color.b;
                dest2.size = newParticles.vertices[countUnmarkedForDelete].size;
                dest2.alpha = newParticles.vertices[countUnmarkedForDelete].alpha;
                part.dest2 = dest2;
                countUnmarkedForDelete++;
            }

            part.r = part.color.r;
            part.g = part.color.g;
            part.b = part.color.b;
            var t = new TWEEN.Tween(part)
                .to({x:part.dest2.x, y:part.dest2.y, z:part.dest2.z, alpha:part.dest2.alpha, size: part.dest2.size, r: part.dest2.r, g: part.dest2.g, b: part.dest2.b}, part.speed * 50000)
                .delay(wait)
                .easing( TWEEN.Easing.Cubic.InOut )
                .interpolation( TWEEN.Interpolation.Bezier )
                .onUpdate(function()
                {   
                    var positions = rloop.bufferParticles.geometry.attributes.position.array;
                    positions[this._object.i*3 + 0] = rloop.particles.geometry.vertices[this._object.i].x;
                    positions[this._object.i*3 + 1] = rloop.particles.geometry.vertices[this._object.i].y;
                    positions[this._object.i*3 + 2] = rloop.particles.geometry.vertices[this._object.i].z;

                    var colors = rloop.bufferParticles.geometry.attributes.customColor.array;
                    colors[this._object.i*3 + 0] = this._object.r;
                    colors[this._object.i*3 + 1] = this._object.g;
                    colors[this._object.i*3 + 2] = this._object.b;

                    rloop.bufferParticles.geometry.attributes.alpha.array[this._object.i] = this._object.alpha;
                    rloop.bufferParticles.geometry.attributes.size.array[this._object.i] = this._object.size;

                    rloop.bufferParticles.geometry.attributes.alpha.needsUpdate = true;
                    rloop.bufferParticles.geometry.attributes.size.needsUpdate = true;
                    rloop.bufferParticles.geometry.attributes.customColor.needsUpdate = true;

                    if (this._object.markedDelete) {
                        rloop.bufferParticles.geometry.attributes.alpha.array[this._object.i] = this._object.alpha;
                    }
                })
                .onComplete(function(){
                    countAnimationsEnded++;
                    if (countAnimationsStarted == countAnimationsEnded)
                    {
                        if (runAfterFinish) runAfterFinish();
                    }
                })
                .onStart(function(){
                    countAnimationsStarted++;
                })
                .start();
        }
    }

    function tweenToNewGeometry( newGeometry, wait )
    {
        //console.log('starting new animation:')
        TWEEN.removeAll();
        if (wait == undefined || wait == null) wait = 0;

        rloop.animatingTween = true;
        var allparticles = rloop.particles;
        var newParticles = newGeometry;

        var vertDifference = newParticles.vertices.length - allparticles.geometry.vertices.length;
        //console.log('vert difference: ', vertDifference);
        if (vertDifference<0)                                       // we need less particles, mark them for deletion
        {
            var tempArr = getRandom(rloop.particles.geometry.vertices, Math.abs(vertDifference));
            for (var j=0;j<tempArr.length;j++)
            {
                var deleteThisParticle = tempArr[j];
                allparticles.geometry.vertices[tempArr[j].i].markedDelete = true;
               // deleteThisParticle.markedDelete = true;
            }
            //console.log('marked again to delete: ', tempArr)
        } else {
            for (var q = 0; q< allparticles.geometry.vertices.length;q++)
            {
                allparticles.geometry.vertices[q].markedDelete = false;
            }
            if (vertDifference>0){                               //we need more particles, mark for adding (add some neutral ones)
                addMoreParticles( vertDifference );
                updateTheBufferGeometryToMoreParticles( vertDifference );
            }
        }

        var cc = 0;
        for ( var q=0;q< allparticles.geometry.vertices.length;q++ )
        {
            if (allparticles.geometry.vertices[q].markedDelete) cc++
        }
        //console.log('total logged for deletion in new geom: ', cc);

        //rloop.bufferParticles = updateNewBufferGeometryFromGeometry( newParticles )// new THREE.Points(updateNewBufferGeometryFromGeometry( rloop.particles ), shaderMaterial); 
        //rloop.bufferParticles = updateNewBufferGeometryFromGeometry ( newParticles )

        //ANIMATE ALL TO RANDOM
        var countNewAnimations = 0;
        var countUnmarkedForDelete = 0;
        for ( var par = 0; par < allparticles.geometry.vertices.length; par++ )
        {
            var part = allparticles.geometry.vertices[par];
            var dest = {
                x: - Math.random() * 100 + 50,
                y: Math.random() * 50 - 25,
                z: Math.random() * 30, //+  //- 500;
                alpha: Math.random() * 0.5,
                //alpha: ( part.markedDelete) ? 0 : 0.2,
                size: Math.random()
            }

            var dest2 = {
                x:dest.x,
                y:dest.y,
                z:dest.z
            }
            part.i = par;
            
            //console.log('eroare dupa: ', countUnmarkedForDelete);
            var t = new TWEEN.Tween(part)
                .to({x:dest.x, y:dest.y, z:dest.z, alpha:dest.alpha, size: dest.size}, part.speed * 60000)
                .delay(wait)
                .easing( TWEEN.Easing.Cubic.InOut )
                .interpolation( TWEEN.Interpolation.Bezier )
                .onUpdate(function()
                {   
                    //console.log('updating: ')
                    var positions = rloop.bufferParticles.geometry.attributes.position.array;
                    positions[this._object.i*3 + 0] = rloop.particles.geometry.vertices[this._object.i].x;
                    positions[this._object.i*3 + 1] = rloop.particles.geometry.vertices[this._object.i].y;
                    positions[this._object.i*3 + 2] = rloop.particles.geometry.vertices[this._object.i].z;

                    rloop.bufferParticles.geometry.attributes.alpha.array[this._object.i] = this._object.alpha;
                    rloop.bufferParticles.geometry.attributes.size.array[this._object.i] = this._object.size;

                    rloop.bufferParticles.geometry.attributes.alpha.needsUpdate = true;
                    rloop.bufferParticles.geometry.attributes.size.needsUpdate = true;

                    
                })
                .onComplete(function(){
                    rloop.idleWithParticles = true;
                    if (this.markedDelete) {
                        console.log('marked with delete!');
                        //rloop.bufferParticles.geometry.attributes.alpha.array[this.i] = this.alpha;
                    }
                })
                .onStart(function(){
                    if (this.markedDelete) {
                        console.log('marked with delete! at begining');
                        //rloop.bufferParticles.geometry.attributes.alpha.array[this.i] = this.alpha;
                    }
                })
                .start();
        }        
    }

    function addMoreParticles( howManyToAdd)
    {
        for (var i=0;i<howManyToAdd;i++)
        {
            var vert = new THREE.Vector3();
            vert.x = - Math.random() * 100 + 50;
            vert.y = Math.random() * 100 - 50;
            vert.z = Math.random() * 50 //- 500;
            vert.destination = {
                x: - Math.random() * 100 + 50,
                y: Math.random() * 30 - 15,
                z: Math.random() * 20 //+  //- 500;
            }
            vert.size = 1;
            vert.alpha = 0;
            //console.log('size:', vert.size)
            vert.color = new THREE.Color('rgb(255, 255, 255)');
            vert.speed = Math.random() / 200 + rloop.speedFactor;

            rloop.particles.geometry.vertices.push(vert);
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
        var vertDifference = newParticles.vertices.length - rloop.particles.geometry.vertices.length;
        //console.log('vertDifference: ',vertDifference);
        if (vertDifference<0)
        {
            var tempArr = getRandom(rloop.particles.geometry.vertices, Math.abs(vertDifference));
            for (var j=0;j<tempArr.length;j++)
            {
                var deleteThisParticle = tempArr[j];
                deleteThisParticle.markedDelete = true;
                //console.log('marked;');
            }
            
        }
        var cc = 0;
        for ( var q=0;q< allparticles.geometry.vertices.length;q++ )
        {
            if (allparticles.geometry.vertices[q].markedDelete) cc++
        }
        console.log('total logged for deletion: ', cc);
        var countFinalAnimationsStart = 0;
        var countFinalAnimationsEnd = 0;

        var opacTween1 = tweenOpacityTo('pre-block', 1, 500);
        for ( var par = 0; par < allparticles.geometry.vertices.length; par++ )
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
                .to({x:dest.x, y:dest.y, z:dest.z, alpha:alpha}, part.speed * 20000)
                .delay(wait)
                .easing( TWEEN.Easing.Cubic.InOut )
                .interpolation( TWEEN.Interpolation.Bezier )
                .onUpdate(function()
                {   
                    var positions = rloop.bufferParticles.geometry.attributes.position.array;
                    positions[this._object.i*3 + 0] = rloop.particles.geometry.vertices[this._object.i].x;
                    positions[this._object.i*3 + 1] = rloop.particles.geometry.vertices[this._object.i].y;
                    positions[this._object.i*3 + 2] = rloop.particles.geometry.vertices[this._object.i].z;
                    if (this._object.markedDelete) {
                        //console.log('this: ', allparticles.geometry);
                        rloop.bufferParticles.geometry.attributes.alpha.array[this._object.i] = this._object.alpha;
                        rloop.bufferParticles.geometry.attributes.alpha.needsUpdate = true;
                        //console.log('marked for deletion');
                        //allparticles.geometry.vertices.splice(allparticles.geometry.vertices.indexOf(this), 1)
                    }
                })
                .onComplete(function(){
                    countAnimations++;
                    if (this._object.markedDelete) {
                        console.log('marked for deletion');
                        this._object.z = 500;
                        rloop.bufferParticles.geometry.attributes.position.array[this._object.i*3 + 2] = this._object.z;
                        //allparticles.geometry.vertices.splice(allparticles.geometry.vertices.indexOf(this), 1)
                    } else {
                        //console.log('countNewAnimations: ', countNewAnimations);
                        if (countNewAnimations<newParticles.vertices.length){
                            this._object.color = newParticles.vertices[countNewAnimations].color;

                            var t1 = new TWEEN.Tween(this._object)
                                .to({x:newParticles.vertices[countNewAnimations].x, y:newParticles.vertices[countNewAnimations].y, z:newParticles.vertices[countNewAnimations].z}, part.speed * 30000 )
                                .easing( TWEEN.Easing.Cubic.InOut )
                                .onUpdate(function() {
                                    var positions = rloop.bufferParticles.geometry.attributes.position.array;
                                    positions[this._object.i*3 + 0] = rloop.particles.geometry.vertices[this._object.i].x;
                                    positions[this._object.i*3 + 1] = rloop.particles.geometry.vertices[this._object.i].y;
                                    positions[this._object.i*3 + 2] = rloop.particles.geometry.vertices[this._object.i].z;
                                })
                                .onComplete(function() {
                                    countAnimations++;
                                    var compare8uint = new Uint8Array(3);
                                    compare8uint[0] = this._object.color.r;
                                    compare8uint[1] = this._object.color.g;
                                    compare8uint[2] = this._object.color.b;
                                    var currentVertexColor = [
                                        rloop.bufferParticles.geometry.attributes.customColor.array[this._object.i*3],
                                        rloop.bufferParticles.geometry.attributes.customColor.array[this._object.i*3 +1],
                                        rloop.bufferParticles.geometry.attributes.customColor.array[this._object.i*3 +2]
                                    ]
                                    //if ((this.color.r != rloop.whiteColor.r) || (this.color.g != rloop.whiteColor.g) || (this.color.b != rloop.whiteColor.b))
                                    if ((compare8uint[0] != currentVertexColor[0]) || (compare8uint[1] != currentVertexColor[1]) || (compare8uint[2] != currentVertexColor[2]))
                                    {
                                        //console.log('new  color: ',compare8uint[0], 'current : ',rloop.bufferParticles.geometry.attributes.customColor.array[this.i*3], compare8uint[0] == rloop.bufferParticles.geometry.attributes.customColor.array[this.i*3]);
                                        this._object.dummy = 1;
                                        var t2 = new TWEEN.Tween(this._object)
                                            .to({dummy:1}, Math.round(Math.random()*1000))
                                            .delay(Math.round(Math.random()*1000) + 1500)
                                            .onComplete(function()
                                            {
                                                var colors = rloop.bufferParticles.geometry.attributes.customColor.array;
                                                colors[this._object.i*3 + 0] = this._object.color.r;
                                                colors[this._object.i*3 + 1] = this._object.color.g;
                                                colors[this._object.i*3 + 2] = this._object.color.b;

                                                rloop.bufferParticles.geometry.attributes.customColor.needsUpdate = true;
                                                countFinalAnimationsEnd++;
                                                if (countFinalAnimationsStart == countFinalAnimationsEnd) {
                                                    //  CONTINUE TOWARDS SECOND ANIMATION ( COIN )
                                                    //console.log('whats going on?', countFinalAnimationsEnd)
                                                    //rloop.animatingTween = false;
                                                    rloop.particles = new THREE.Points(newParticles, material);
                                                    //console.log('scene contains: ', rloop.scene);
                                                    rloop.scene.remove(rloop.bufferParticles);
                                                    rloop.bufferParticles.geometry.dispose();
                                                    rloop.bufferParticles = null;
                                                    rloop.bufferParticles = updateNewBufferGeometryFromGeometry( rloop.particles.geometry )// new THREE.Points(updateNewBufferGeometryFromGeometry( rloop.particles ), shaderMaterial); 
                                                    //console.log('rloop buffer particles new: ', rloop.bufferParticles)
                                                    rloop.scene.add(rloop.bufferParticles);
                                                    //console.log('scene contains 2: ', rloop.scene);
                                                    rloop.bufferParticles.position.y = 0.3;
                                                    //rloop.bufferParticles.geometry.attributes.position.needsUpdate = true;
                                                    //rloop.bufferParticles.geometry.attributes.customColor.needsUpdate = true;
                                                    //rloop.bufferParticles.geometry.attributes.alpha.needsUpdate = true;
                                                    //rloop.bufferParticles.geometry.attributes.size.needsUpdate = true;
                                                    //rloop.animatingTween = false;
                                                    //rloop.animatingTween = false;
                                                }
                                            })
                                            .start();
                                        countFinalAnimationsStart++;
                                    }
                                    //console.log('anim started at: ',countAnimations);
                                    if (countAnimations==(allparticles.geometry.vertices.length + newParticles.vertices.length))
                                    {
                                        //console.log('anim started at: ',countAnimations);
                                        var opacTw2 = tweenOpacityTo('post-block1', 1, 900).start();
                                        tweenOpacityTo('post-block2', 1, 1200).start();
                                        tweenOpacityTo('post-block3', 1, 1400).start();
                                        tweenOpacityTo('post-block4', 1, 1500).start();

                                        document.getElementById('main').style.height = '100vh';
                                        document.getElementById('main').style.display = 'block';
                                        scrollMagicController.enabled(true);
                                        addWheelEventsAfterStep1();

                                       
                                        //rloop.scene.add(rloop.bufferParticles);
                                        //console.log('after: ', rloop.bufferParticles.geometry.attributes.position.count);
                                        //document.getElementById('body').style.overflow = 'visible';
                                    }
                                    //console.log('count animations: ', countAnimations)
                                })
                                .interpolation( TWEEN.Interpolation.Bezier )
                                .start();    
                        }                        
                        countNewAnimations++;
                    }

                    if (countAnimations==allparticles.geometry.vertices.length)
                    {
                        opacTween1.start();
                        //rloop.animatingTween = false;
                        //startAnimationStepOut(allparticles, 1000);
                    }

                    
                    //rloop.particles.geometry.verticesNeedUpdate = true;
                })
                .start();
        }
    }

    // function tweenToNewGeometry( geometry )
    // {
    //     updateNewBufferGeometryFromGeometry(geometry)
    // }

    function tweenOpacityTo(divId, toOpacity, waitMili, speed)
    {
        if (speed == null || speed == undefined) speed = 400;
        var twEl = document.getElementById(divId);
        var opac = {o: twEl.style.opacity}
        if (opac.o == undefined || opac.o == null) opac.o = 1 - toOpacity;
        
        //opac.twEl = twEl;
        var opacTween = new TWEEN.Tween(opac, groupA).to({o:toOpacity}, speed)
           .onUpdate(function(){
            //console.log('this: ', this);
            twEl.style.opacity = this._object.o;
        })
        .delay(waitMili)

        return opacTween;
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

                    vert.x = vert.destination.x;
                    vert.y = vert.destination.y;
                    vert.z = vert.destination.z;
                    vert.alpha = 1;
                    vert.size = 1;
                    vert.speed = Math.random() / 200 + rloop.speedFactor;
                    geometry.vertices.push(vert);
                }
            }
        }

        return geometry;
    }

    function createThreeCirclesGeometry ( spritesPerCircle, raza1, zDistance, xDistance, numberOfCircles, center, sizeScale, firstScale, distort)
    {
        var geometry = new THREE.Geometry();
        for (var i = 0; i<numberOfCircles;i++)
        {
            for (var j = 0; j<spritesPerCircle; j++)
            {
                var vert = new THREE.Vector3();
                vert.x = - Math.random() * 1000 + 500;
                vert.y = Math.random() * 1000 - 500;
                vert.z = Math.random() * 500 //- 500;
                vert.destination = {
                    x: (center.x+xDistance/2) + (raza1 + xDistance*i) * Math.sin(2*j*Math.PI/spritesPerCircle + distort*i),
                    y: (center.y) + (raza1 + xDistance*i) * Math.cos(2*j*Math.PI/spritesPerCircle + distort*i),
                    z: (center.z) + (-zDistance*i)
                }
                vert.size = i > 0 ?  firstScale / (i * sizeScale) : firstScale;
                //console.log('size:', vert.size)
                vert.color = new THREE.Color('rgb(0, 252, 254)');
                vert.speed = Math.random() / 200 + rloop.speedFactor;
                vert.alpha = 1;

                vert.x = vert.destination.x;
                vert.y = vert.destination.y;
                vert.z = vert.destination.z;

                geometry.vertices.push(vert);                
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

        material = new THREE.PointsMaterial({
            size: 1.7,
            color: 0xFFFFFF,
            sizeAttenuation: true,
            transparent:true,
            //alphaTest: 0.1,
            map:sprite
        });

        shaderMaterial = new THREE.ShaderMaterial({
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
                    //console.log(vert.color);
                    vert.size = 1;
                    vert.destination = {
                        x: x - imgData.width / 2,
                        y: -y + imgData.height / 2,
                        z: 0.05
                    }
                    vert.alpha = 1;
                    // vert.x = vert.destination.x;
                    // vert.y = vert.destination.y;
                    //vert.z = vert.destination.z;

                    vert.speed = Math.random() / 200 + rloop.speedFactor;                    
                    geometry.vertices.push(vert);
                    //attributes.alpha.value[ geometry.vertices.length-1 ] = 1;
                }
            }
        }

        // /createThreeCirclesGeometry ( spritesPerCircle, raza1, zDistance, xDistance, numberOfCircles, center, scaleFactor, firstScale )
        //var testGeometry = createThreeCirclesGeometry(50, 15, 5, 2.5, 4, 0, 1.7, 1.2)
        //geometry = testGeometry;
        var bufferGeometry = new THREE.BufferGeometry();
        var positions = new Float32Array(geometry.vertices.length * 3) ;
        var colors = new Float32Array(geometry.vertices.length * 3) ;
        var sizes = new Float32Array( geometry.vertices.length );
        var alphas = new Float32Array( geometry.vertices.length * 1 ); // 1 values per vertex
        //var color = new THREE.Color();

        //console.log('before: ', geometry.vertices.length);
        
        //console.log('after: ', geometry.vertices.length);
        for (var i = 0, i3 = 0; i< geometry.vertices.length; i++, i3+=3)
        {
            color = geometry.vertices[i].color;
            positions[i3 + 0] = geometry.vertices[i].x;
            positions[i3 + 1] = geometry.vertices[i].y;
            positions[i3 + 2] = geometry.vertices[i].z;

            colors[ i3 + 0 ] = color.r;
            colors[ i3 + 1 ] = color.g;
            colors[ i3 + 2 ] = color.b;
            
            sizes[ i ] = geometry.vertices[i].size;
            alphas[ i ] = geometry.vertices[i].alpha;// Math.random();
        }
        bufferGeometry.addAttribute( 'position', new THREE.BufferAttribute( positions, 3 ) );
        bufferGeometry.addAttribute( 'customColor', new THREE.BufferAttribute( colors, 3 ) );
        bufferGeometry.addAttribute( 'size', new THREE.BufferAttribute( sizes, 1 ) );
        bufferGeometry.addAttribute( 'alpha', new THREE.BufferAttribute( alphas, 1 ) );
        //console.log('geometry: ', bufferGeometry);
        var numVertices = bufferGeometry.attributes.position.count;
        
        bufferGeometry.attributes.customColor.needsUpdate = true;
        var particles = new THREE.Points(geometry, material);
        var bufferParticles = new THREE.Points(bufferGeometry, shaderMaterial);

        //console.log('particles: ', particles);
        return {
            particles:particles,
            bParticles: bufferParticles
        };        
    }

    function updateTheBufferGeometryToMoreParticles ( morePosition )
    {
        var newBufferGeometry = new THREE.BufferGeometry();
        var positions = rloop.bufferParticles.geometry.attributes.position.array;
        var colors = rloop.bufferParticles.geometry.attributes.customColor.array;
        var sizes = rloop.bufferParticles.geometry.attributes.size.array;
        var alphas = rloop.bufferParticles.geometry.attributes.alpha.array;

        var positionsNew = new Float32Array((sizes.length + morePosition) * 3) ;
        var colorsNew = new Float32Array((sizes.length + morePosition) * 3) ;
        var sizesNew = new Float32Array((sizes.length + morePosition) );
        var alphasNew = new Float32Array( (sizes.length + morePosition) * 1 );

        for (var j = 0; j< sizesNew.length; j++)
        {
            colorsNew[ j*3 + 0 ] = 1;
            colorsNew[ j*3 + 1 ] = 1;
            colorsNew[ j*3 + 2 ] = 1;
        }

        for (var i = 0, i3 = 0;i<sizes.length; i++, i3+=3)
        {
            positionsNew[i3 + 0] = positions[i3];
            positionsNew[i3 + 1] = positions[i3 + 1];
            positionsNew[i3 + 2] = positions[i3 + 2];

            colorsNew[ i3 + 0 ] = colors[ i3 + 0 ]
            colorsNew[ i3 + 1 ] = colors[ i3 + 1 ]
            colorsNew[ i3 + 2 ] = colors[ i3 + 2 ]
            
            sizesNew[ i ] = sizes [ i ];
            alphasNew[ i ] = alphas [ i ];
        }

        newBufferGeometry.addAttribute( 'position', new THREE.BufferAttribute( positionsNew, 3 ) );
        newBufferGeometry.addAttribute( 'customColor', new THREE.BufferAttribute( colorsNew, 3 ) );
        newBufferGeometry.addAttribute( 'size', new THREE.BufferAttribute( sizesNew, 1 ) );
        newBufferGeometry.addAttribute( 'alpha', new THREE.BufferAttribute( alphasNew, 1 ) );
                
        newBufferGeometry.attributes.customColor.needsUpdate = true;
        newBufferGeometry.attributes.position.needsUpdate = true;
        newBufferGeometry.attributes.alpha.needsUpdate = true;
        newBufferGeometry.attributes.size.needsUpdate = true;

        //console.log('old geom: ', rloop.bufferParticles.geometry.attributes.size.array.length);
        //rloop.bufferParticles.geometry.dispose();
        rloop.bufferParticles.geometry.copy ( newBufferGeometry );
        //console.log('needed geom: ', newBufferGeometry.attributes.size.array.length)
        //console.log('new geom: ', rloop.bufferParticles.geometry.attributes.size.array.length)
    }
    
    function updateNewBufferGeometryFromGeometry( newGeometry ) {
        var bufferGeometry = new THREE.BufferGeometry();
        var positions = new Float32Array(newGeometry.vertices.length * 3) ;
        var colors = new Float32Array(newGeometry.vertices.length * 3) ;
        var sizes = new Float32Array( newGeometry.vertices.length );
        var alphas = new Float32Array( newGeometry.vertices.length * 1 ); // 1 values per vertex

        for (var i = 0, i3 = 0; i< newGeometry.vertices.length; i++, i3+=3)
        {
            color = newGeometry.vertices[i].color;
            positions[i3 + 0] = newGeometry.vertices[i].x;
            positions[i3 + 1] = newGeometry.vertices[i].y;
            positions[i3 + 2] = newGeometry.vertices[i].z;

            colors[ i3 + 0 ] = color.r;
            colors[ i3 + 1 ] = color.g;
            colors[ i3 + 2 ] = color.b;
            
            sizes[ i ] = newGeometry.vertices[i].size;
            alphas[ i ] = newGeometry.vertices[i].alpha;
        }
        bufferGeometry.addAttribute( 'position', new THREE.BufferAttribute( positions, 3 ) );
        bufferGeometry.addAttribute( 'customColor', new THREE.BufferAttribute( colors, 3 ) );
        bufferGeometry.addAttribute( 'size', new THREE.BufferAttribute( sizes, 1 ) );
        bufferGeometry.addAttribute( 'alpha', new THREE.BufferAttribute( alphas, 1 ) );

        var numVertices = bufferGeometry.attributes.position.count;
                
        bufferGeometry.attributes.customColor.needsUpdate = true;
        bufferGeometry.attributes.position.needsUpdate = true;
        bufferGeometry.attributes.alpha.needsUpdate = true;
        bufferGeometry.attributes.size.needsUpdate = true;

        //var particles = new THREE.Points(geometry, material);
        var bufferParticles = new THREE.Points(bufferGeometry, shaderMaterial);

        //console.log('particles: ', particles);
        return bufferParticles;
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

    function onWindowResize(){

        var maxWindowSize = window.innerHeight;// - 120// - widthJos;
        if (rloop.portrait) maxWindowSize = window.innerHeight * 0.80 ;
                
        var portrait = false;
        if(window.innerHeight > window.innerWidth){
            portrait = true;
        }
       
        var heightRatio = screen.availHeight / (600);//*window.devicePixelRatio);
        if (portrait) heightRatio = screen.availWidth / (500);

        if (heightRatio>1) heightRatio=1;

        rloop.portrait = portrait;

        if (rloop.mobile)
        {
            
        }

        var viewport = document.querySelector("meta[name=viewport]");
        viewport.setAttribute('content', 'width=device-width, initial-scale='+heightRatio+', maximum-scale=1.0, user-scalable=0');
        //hardcoded 0.8 heightRatio ca pare ca merge mai bine
        if (portrait) viewport.setAttribute('content', 'width=device-width, initial-scale='+0.8+', maximum-scale=1.0, user-scalable=0');

        container = document.getElementById("webGLContent");
        width = container.clientWidth;
        height = container.clientHeight;

        height = window.innerHeight;// - heightOffset;
        width = rloop.camera.aspect * height;
        width = window.innerWidth;
        height = width / rloop.camera.aspect;

        //document.getElementById("webGLCanv").style.height = height + 'px';           
        //document.getElementById("webGLCanv").style.width = width + 'px';

        if (rloop.mobile && rloop.portrait) 
        {
            height = height * 0.85;
            document.getElementById("webGLCanv").style.height = height + 'px';           
            document.getElementById("webGLCanv").style.width = width + 'px';
        }  
        
        //console.log('fromValue: ', prevValue, 'to value: ', width, height );

        rloop.renderer.setSize( width, height );

        if (prevValue.width != width || prevValue.height!=height)
        {
            //console.log('fromValue: ', prevValue, 'to value: ', width, height );
            var glTween = new TWEEN.Tween(prevValue)
                    .to({width: width, height: height}, 200)
                    .easing(TWEEN.Easing.Quadratic.Out)
                    .onUpdate(function(){
                        //document.getElementById("webGL").style.height = this.height+'px';
                        //document.getElementById("webGL").style.width = this.width+'px';
                        var th = {
                            width: parseInt(this.width),
                            height: parseInt(this.height)
                        }
                        //console.log('updating this: ', this);
                        rloop.camera.aspect = th.width / th.height;
                        rloop.camera.updateProjectionMatrix();
                        //simSphere.renderer.setSize( th.width, th.height );

                    })
                    .start();
        }

    }

    return rloop;
});