/* global itowns, document, GuiTools */
// # Simple Globe viewer

// Define initial camera position
// Coordinate can be found on https://www.geoportail.gouv.fr/carte
// setting is "coordonnée geographiques en degres decimaux"

// Position near Gerbier mountain.
var positionOnGlobe = { longitude: 2.396387, latitude: 48.848701, altitude: 2000 };

// `viewerDiv` will contain iTowns' rendering area (`<canvas>`)
var viewerDiv = document.getElementById('viewerDiv');

// Instanciate iTowns GlobeView*
var globeView = new itowns.GlobeView(viewerDiv, positionOnGlobe);

// GUI initialization
var menuGlobe = new GuiTools('menuDiv');
var guiInitialized = false;
var layerFolder = menuGlobe.gui.addFolder('Layers');
var listLayers = [];
var listControllers = [];
var listLayerDelete = [];
var nbSymbolizer = 0;

var promiseElevation = [];

menuGlobe.view = globeView;

function addLayerCb(layer) {
    return globeView.addLayer(layer).then(function addGui(la) {
        if (la.type === 'color') {
            menuGlobe.addImageryLayerGUI(la);
        } else if (la.type === 'elevation') {
            menuGlobe.addElevationLayerGUI(la);
        }
    });
}
// Add one imagery layer to the scene
// This layer is defined in a json file but it could be defined as a plain js
// object. See Layer* for more info.
// itowns.Fetcher.json('./layers/JSONLayers/Ortho.json').then(addLayerCb);
itowns.Fetcher.json('./layers/JSONLayers/Ortho.json').then(addLayerCb);

// Add two elevation layers.
// These will deform iTowns globe geometry to represent terrain elevation.
promiseElevation.push(itowns.Fetcher.json('./layers/JSONLayers/WORLD_DTM.json').then(addLayerCb));
promiseElevation.push(itowns.Fetcher.json('./layers/JSONLayers/IGN_MNT_HIGHRES.json').then(addLayerCb));

// Object parameters, 48.848340,

var coord = new itowns.Coordinates('EPSG:4326', 2.396159, 48.848264, 50);
var rotateX = Math.PI/2;
var rotateY = 0;
var rotateZ = 0;
var scale = 150;

// Symbolizer
var initSymbolizer = function initSymbolizer(menuGlobe, complex) {
    // Merge elements of the list as one group
    var listObj = [];
    var listEdge = [];
    var obj;
    var edge;
    listLayers.forEach((layer) => {
        listObj.push(layer[0]);
        listEdge.push(layer[1]);
    })
    // Call Symbolizer
    nbSymbolizer++;
    var symbolizer = new itowns.Symbolizer(globeView, listObj, listEdge, menuGlobe, nbSymbolizer);
    window.addEventListener("keypress",checkKeyPress,false);
    function checkKeyPress(key){

        if ((key.keyCode == "56")||(key.keyCode == "113")) {
          symbolizer._xplus();
        }
        if ((key.keyCode == "50")||(key.keyCode == "115")){
          symbolizer._xmoins();
        }

        if ((key.keyCode == "52")||(key.keyCode == "97")){
          symbolizer._yplus();
        }
        if ((key.keyCode == "54")||(key.keyCode == "122")){
          symbolizer._ymoins();
        }

        if ((key.keyCode == "55")||(key.keyCode == "119")){
          symbolizer._zplus();
        }
        if ((key.keyCode == "51")||(key.keyCode == "120")){
          symbolizer._zmoins();
        }
      }

    if (complex) {
        symbolizer.initGui();
    }
    else {
        symbolizer.initGuiAll();
    }
   /* //Remove the layers from the list on the GUI
    listControllers.forEach((controller) => {
        menuGlobe.gui.__folders.Layers.remove(controller);
    })

    // Empty layer and controllers list;
    listLayers = [];
    listControllers = [];
    */
}

// Loader initialization
var loader = new itowns.ModelLoader(globeView);

// Read the file dropped and actually load the object
function readFile(file) {
    var reader = new FileReader();
    if(file.name.endsWith('.obj')){
        reader.addEventListener('load', () => {
            // Load object
            loader.loadOBJ(reader.result, coord, rotateX, rotateY, rotateZ, scale, handleLayer, menuGlobe);
        }, false);
        reader.readAsDataURL(file);
        return 0;
    }
    else if(file.name.endsWith('.gibes')){
        reader.addEventListener('load', () => {
            var json = JSON.parse(reader.result);
            listLayers.forEach((layer) => {
                // Position parameters
                var coordX = json.coordX;
                var coordY = json.coordY;
                var coordZ = json.coordZ;
                var rotateX = Math.PI * json.rotateX;
                var rotateY = Math.PI * json.rotateY;
                var rotateZ = Math.PI * json.rotateZ;
                var scale = json.scale;
                // Moving object
                var coord = new itowns.Coordinates('EPSG:4326', coordX, coordY, coordZ);
                loader._loadModel(layer[0], layer[1], coord, rotateX, rotateY, rotateZ, scale);
            })
        });
        reader.readAsText(file);
    }
    else{
        throw new loadFileException("fichier de type .obj attendu");
    }
}

// Layer management
function handleLayer(model, menuGlobe) {
    // Add a checkbox to the GUI, named after the layer
    console.log("gui ", menuGlobe.gui.__folders.Layers);

    var lFolder,lFolder1,deleteBtn;
    if(!guiInitialized){
       lFolder =  layerFolder.add({ symbolizer: () => {initSymbolizer(menuGlobe, false);    console.log("gui 2", menuGlobe.gui.__folders.Layers);
    } }, 'symbolizer').name('Stylize object...');
       lFolder1 = layerFolder.add({ symbolizer: () => {initSymbolizer(menuGlobe, true);console.log("gui 36", menuGlobe.gui.__folders.Layers) } }, 'symbolizer').name('Stylize parts...');
    }
   var name =model[0].materialLibraries[0].substring(0, model[0].materialLibraries[0].length - 4) ;
    var controller = layerFolder.add({ Layer: false }, 'Layer').name(name).onChange((checked) => {
        if(checked){
            // Add layer and controller to the list
            listLayers.push(model);
            listControllers.push(controller);
            if ( !listLayerDelete.includes(model)){
            listLayerDelete.push(model);
             deleteBtn=  layerFolder.add({ "delete": function(){
                var i = listLayers.indexOf(model);
                if(i != -1) {
                    listLayers.splice(i, 1);
                }
                menuGlobe.gui.__folders.Layers.remove(controller);
                menuGlobe.gui.__folders.Layers.remove(deleteBtn)

                globeView.scene.remove(model[0]);
                globeView.scene.remove(model[1]);
                globeView.notifyChange(true);

            }}, 'delete').name("delete "+name);
        }


        }
        else{
            var i = listLayerDelete.indexOf(model);
            if(i != -1) {
                listLayerDelete.splice(i, 1);
            }
            // Remove layer and controller from the list

            menuGlobe.gui.__folders.Layers.remove(deleteBtn);
            var i = listLayers.indexOf(model);
            if(i != -1) {
                listLayers.splice(i, 1);
            }
            var j = listControllers.indexOf(controller);
            if(j != -1) {
                listControllers.splice(j, 1);
            }
        }
    });

        guiInitialized = true;


}

// Drag and drop
function initListener() {
    document.addEventListener('drop', documentDrop, false);
        let prevDefault = e => e.preventDefault();
        document.addEventListener('dragenter', prevDefault, false);
        document.addEventListener('dragover', prevDefault, false);
        document.addEventListener('dragleave', prevDefault, false);
  }

function documentDrop(e) {
    e.preventDefault();
    var file = e.dataTransfer.files[0];
    readFile(file);
  }

window.onload = () => initListener();

// Listen for globe full initialisation event
globeView.addEventListener(itowns.GLOBE_VIEW_EVENTS.GLOBE_INITIALIZED, function init() {
    globeView.controls.setOrbitalPosition({ heading: 180, tilt: 60 });
});

function loadFileException(message) {
    this.message = message;
    this.name = "loadFileException";
 }

/*

var options = {
    buildings: { url: "./models/Buildings3D/", visible: true, },
    position: { x:651250, y:6861250, z:0 , CRS: 'EPSG:2154'},
};

// https://epsg.io/
itowns.proj4.defs("EPSG:2154","+proj=lcc +lat_1=49 +lat_2=44 +lat_0=46.5 +lon_0=3 +x_0=700000 +y_0=6600000 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs");

itowns.gfxEngine.setCamera(globeView.camera.camera3D);
itowns.gfxEngine.setScene(globeView.scene);

*/

/*
var coord1 = itowns.proj4(options.position.CRS, "EPSG:4326", [options.position.x, options.position.y])
var coord2 = new itowns.Coordinates("EPSG:4326", coord1[0], coord1[1], 40);
console.log('1', coord2.latitude(), coord2.longitude(), 40);
var coord3 = coord2.as('EPSG:4978');
console.log('2', coord3.x(), coord3.y(), coord3.z());
/*
itowns.gfxEngine.setZero(options.position);

if (!itowns.Cartography3D.isCartoInitialized()){
    itowns.Cartography3D.initCarto3D(options.buildings);
};

*/

/*
globeView.controls.setCameraTargetGeoPosition({longitude:60, latitude:40}, true);
*/
