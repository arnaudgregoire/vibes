/**
 * A loader for 3D model of diverse formats
 */

import * as THREE from 'three';
import * as OBJLoader from 'three-obj-loader';

OBJLoader(THREE);

function ModelLoader(view) {
    // Constructor
    this.view = view;
    this.model = null;
}

ModelLoader.prototype.loadOBJ = function loadOBJ(url, coord, rotateX, rotateY, rotateZ, scale, callback, menu) {
    // OBJ loader
    var loader = new THREE.OBJLoader();
    var promise = new Promise((resolve) => {
        loader.load(url, (obj) => {
            this._loadModel(obj, coord, rotateX, rotateY, rotateZ, scale);
            resolve();
        });
    });
    promise.then(() => callback(this.model, menu));
};

ModelLoader.prototype._loadModel = function loadModel(obj, coord, rotateX, rotateY, rotateZ, scale) {
    var objID = this.view.mainLoop.gfxEngine.getUniqueThreejsLayer();
    obj = this._placeModel(obj, coord, rotateX, rotateY, rotateZ, scale);

    // Set camera layer not to disturb the picking
    obj.traverse(obj => obj.layers.set(objID));
    this.view.camera.camera3D.layers.enable(objID);
    var lines = new THREE.Group();

    for (var i = 0; i < obj.children.length; i++) {
        // Material initialization
        var material = new THREE.MeshPhongMaterial({ color: 0xffffff });
        obj.children[i].material = material;
        obj.children[i].material.transparent = true;
        obj.children[i].castShadow = true;

        // Extract edges
        var edges = new THREE.EdgesGeometry(obj.children[i].geometry);
        var line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: 0xffffff }));
        line = this._placeModel(line, coord, rotateX, rotateY, rotateZ, scale);
        line.updateMatrixWorld();
        lines.add(line);
    }
    // Update coordinate of the object
    obj.updateMatrixWorld();
    this.view.scene.add(obj);
    this.view.scene.add(lines);
    this.view.notifyChange(true);
    this.model = [obj, lines];
};

ModelLoader.prototype._placeModel = function placeModel(obj, coord, rotateX, rotateY, rotateZ, scale) {
    // Set object position
    obj.position.copy(coord.as(this.view.referenceCrs).xyz());
    // Aligns up vector with geodesic normal
    obj.lookAt(obj.position.clone().add(coord.geodesicNormal));
    // User rotates building to align with ortho image
    obj.rotateX(rotateX);
    obj.rotateY(rotateY);
    obj.rotateZ(rotateZ);
    obj.scale.set(scale, scale, scale);
    return obj;
};

export default ModelLoader;