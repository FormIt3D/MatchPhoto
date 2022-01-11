var MatchPhoto = MatchPhoto || {};

/*** application code - runs asynchronously from plugin process to communicate with FormIt ***/
/*** the FormIt application-side JS engine only supports ES5 syntax, so use var here ***/

// the Match Photo container instance will always be in this history
MatchPhoto.photoContainerContextHistoryID = 0;

// the active match photo object (found using the matching string attribute value)
MatchPhoto.activeMatchPhotoObjectName = '';

// string attribute keys for photo objects and their containers
MatchPhoto.photoObjectContainerAttributeKey = 'FormIt::Plugins::MatchPhotoContainer';
MatchPhoto.photoObjectAttributeKey = 'FormIt::Plugins::MatchPhotoObject';

// the layer used to store photo objects and their container - so they can be locked
MatchPhoto.camerasContainerLayerName = 'Cameras - Match Photo';

// get or create the Match Photo container history ID
MatchPhoto.getOrCreateMatchPhotoContainerHistoryID = function(nContextHistoryID, stringAttributeKey)
{
    var aExistingInstanceIDs = FormIt.PluginUtils.Application.getGroupInstancesByStringAttributeKey(nContextHistoryID, stringAttributeKey);
    // if there isn't already a container instance, create it and return the history ID
    if (aExistingInstanceIDs.length == 0)
    {
        // create an empty group
        var matchPhotoContainerGroupID = WSM.APICreateGroup(nContextHistoryID, []);

        // create an empty history
        var matchPhotoContainerHistoryID = WSM.APIGetGroupReferencedHistoryReadOnly(nContextHistoryID, matchPhotoContainerGroupID);

        var matchPhotoContainerInstanceID = WSM.APIGetObjectsByTypeReadOnly(nContextHistoryID, matchPhotoContainerGroupID, WSM.nObjectType.nInstanceType)[0];

        // add the string attribute for the container
        WSM.Utils.SetOrCreateStringAttributeForObject(nContextHistoryID,
            matchPhotoContainerInstanceID, MatchPhoto.photoObjectContainerAttributeKey, "");

        //put the instance on a layer and lock the layer
        FormIt.Layers.AddLayer(0, MatchPhoto.camerasContainerLayerName, true);
        var layerID = FormIt.Layers.GetLayerID(MatchPhoto.camerasContainerLayerName);
        FormIt.Layers.SetLayerPickable(layerID, false);
        FormIt.Layers.AssignLayerToObjects(layerID, matchPhotoContainerInstanceID);

        return matchPhotoContainerHistoryID;
    }
    // there really should only be one container for Match Photo objects
    else if (aExistingInstanceIDs.length == 1)
    {
        return WSM.APIGetGroupReferencedHistoryReadOnly(nContextHistoryID, aExistingInstanceIDs[0], false);
    }
    // if there are more than one, return the first and log to the console
    else 
    {
        console.log("WARNING: There were more than one Match Photo container instance IDs found in the sketch!");

        return WSM.APIGetGroupReferencedHistoryReadOnly(nContextHistoryID, aExistingInstanceIDs[0], false);
    }
}

// this is called every frame when Match Photo mode is enabled
MatchPhoto.updateActivePhotoObjectToMatchCamera = function()
{
    // get the photo object container history ID
    var matchPhotoObjectContainerHistoryID = MatchPhoto.getOrCreateMatchPhotoContainerHistoryID(MatchPhoto.photoContainerContextHistoryID, MatchPhoto.photoObjectContainerAttributeKey);

    var cameraObjectInstanceID = MatchPhoto.getPhotoObjectInstanceID(matchPhotoObjectContainerHistoryID, MatchPhoto.activeMatchPhotoObjectName);

    // if the match photo object exists, move it to face the camera
    if (cameraObjectInstanceID != undefined)
    {
        var cameraObjectInstanceTransf3d = WSM.APIGetInstanceTransf3dReadOnly(matchPhotoObjectContainerHistoryID, cameraObjectInstanceID);

        // re-create the instance transform without any scaling
        var cameraObjectCoordinateSystem = WSM.Transf3d.GetCoordinateSystem(cameraObjectInstanceTransf3d);
        var xDirNormalized = WSM.Vector3d.GetNormalized(cameraObjectCoordinateSystem.xDir);
        var yDirNormalized = WSM.Vector3d.GetNormalized(cameraObjectCoordinateSystem.yDir);
        var newInstanceTransform = WSM.Transf3d.Transf3d(cameraObjectCoordinateSystem.origin, xDirNormalized, yDirNormalized);

        var cameraObjectInvertedTransform = WSM.Geom.InvertTransform(newInstanceTransform);

        // get camera data
        var cameraForward = FormIt.Cameras.GetCameraWorldForward();
        var cameraUp = FormIt.Cameras.GetCameraWorldUp();
        var cameraPosition = FormIt.Cameras.GetCameraWorldPosition();
        var cameraRight = WSM.Vector3d.CrossProduct(cameraForward, cameraUp);
        cameraUp = WSM.Vector3d.MultiplyByFactor(cameraUp, -1);
        var cameraTransform = WSM.Transf3d.Transf3d(cameraPosition, cameraRight, cameraUp);

        // calculate the transform to get to the current camera
        var finalTransform = WSM.Transf3d.Multiply(cameraTransform, cameraObjectInvertedTransform);

        // apply the transform to the camera object
        WSM.APITransformObject(matchPhotoObjectContainerHistoryID, cameraObjectInstanceID, finalTransform);	
    }
    // otherwise, make it from scratch
    else
    {
        var cameraData = FormIt.Cameras.GetCameraData();
    
        var viewportSize = FormIt.Cameras.GetViewportSize();
        var aspectRatio = viewportSize.width / viewportSize.height;
    
        var matchPhotoObjectInstanceID = ManageCameras.createCameraGeometryFromCameraData(matchPhotoObjectContainerHistoryID, cameraData, aspectRatio);

        WSM.Utils.SetOrCreateStringAttributeForObject(matchPhotoObjectContainerHistoryID,
            matchPhotoObjectInstanceID, MatchPhoto.photoObjectAttributeKey, MatchPhoto.activeMatchPhotoObjectName);

        //put the instance on a layer and lock the layer
        FormIt.Layers.AddLayer(0, MatchPhoto.camerasContainerLayerName, true);
        var layerID = FormIt.Layers.GetLayerID(MatchPhoto.camerasContainerLayerName);
        FormIt.Layers.SetLayerPickable(layerID, false);
        FormIt.Layers.AssignLayerToObjects(layerID, matchPhotoObjectInstanceID);
    }
}

// get camera object instance ID, if available
MatchPhoto.getPhotoObjectInstanceID = function(contextHistoryID, photoObjectAttributeValue)
{ 
    // get the photo object instance ID in the context history 
    // with the matching string attribute value
    var aInstancesWithStringAttributeValue = FormIt.PluginUtils.Application.getGroupInstancesByStringAttributeKeyAndValue(contextHistoryID, MatchPhoto.photoObjectAttributeKey, photoObjectAttributeValue);
    var cameraObjectInstanceID = aInstancesWithStringAttributeValue[0];

    return cameraObjectInstanceID;
}

// get a material id by searching for its name in the in-sketch list
MatchPhoto.getInSketchMaterialIDFromName = function(materialName)
{
    var allMaterialIDs = FormIt.MaterialProvider.GetMaterials(FormIt.LibraryType.SKETCH);

    for (var i = 0; i < allMaterialIDs.length; i++)
    {
        var thisName = FormIt.MaterialProvider.GetMaterialName(FormIt.LibraryType.SKETCH, allMaterialIDs[i]).Name;

        if (thisName == materialName)
        {    
            return allMaterialIDs[i];
        }
    }
}

MatchPhoto.paintActiveMatchPhotoObjectWithMaterial = function()
{
    // get the photo object container history ID
    var matchPhotoObjectContainerHistoryID = MatchPhoto.getOrCreateMatchPhotoContainerHistoryID(MatchPhoto.photoContainerContextHistoryID, MatchPhoto.photoObjectContainerAttributeKey);

    // paint the active photo object
    var cameraInstanceObjectID = MatchPhoto.getPhotoObjectInstanceID(matchPhotoObjectContainerHistoryID, MatchPhoto.activeMatchPhotoObjectName);

    var nPhotoContainerHistoryID = MatchPhoto.getOrCreateMatchPhotoContainerHistoryID(MatchPhoto.photoContainerContextHistoryID, MatchPhoto.photoObjectContainerAttributeKey);

    // get the nested history ID containing the camera plane face
    var nCameraPlaneHistoryID = ManageCameras.getCameraPlaneHistoryID(nPhotoContainerHistoryID, cameraInstanceObjectID);

    // assume that history contains just one face
    var nFaceID = WSM.APIGetAllObjectsByTypeReadOnly(nCameraPlaneHistoryID, WSM.nObjectType.nFaceType)[0];

    // create an object history ID to identify the face in the context of its history
    var objectHistoryID = WSM.ObjectHistoryID(nCameraPlaneHistoryID, nFaceID);

    // look for and apply the material to the camera object
    // (hard-coded for now)
    var materialName = MatchPhoto.activeMatchPhotoObjectName;
    var materialID = MatchPhoto.getInSketchMaterialIDFromName(materialName);

    // make sure the material is set to 2' x 2'
    // because of the way the camera object is made (-1 unit to 1 unit across origin),
    // the material must be this size to fit the camera plane
    var materialData = FormIt.MaterialProvider.GetMaterialData(FormIt.LibraryType.SKETCH, materialID);
    materialData.Data.Scale.x = 2;
    materialData.Data.Scale.y = 2;
    FormIt.MaterialProvider.SetMaterialData(FormIt.LibraryType.SKETCH, materialID, materialData.Data);

    // paint the face in the camera object
    FormIt.SketchMaterials.AssignMaterialToObjects(materialID, objectHistoryID);
}

// for new match photos, need to initialize them
// by creating the photo object and painting it with the correct material
MatchPhoto.initializeMatchPhotoObject = function(args)
{
    // set the active match photo object to the one listed in args
    MatchPhoto.activeMatchPhotoObjectName = args.photoObjectName;

    if (args.bToggle)
    {
        MatchPhoto.updateActivePhotoObjectToMatchCamera();
        MatchPhoto.paintActiveMatchPhotoObjectWithMaterial();
    }
}

/*** set up message listeners and execute functions based on FormIt messages ***/

MessagesPluginListener = {};
MessagesPluginListener.MsgHandler = function(msg, payload) { 

    MatchPhoto.updateActivePhotoObjectToMatchCamera();

};

if (!(MessagesPluginListener.hasOwnProperty("listener")))
{
    MessagesPluginListener.listener = FormIt.Messaging.NewMessageListener();
}

// subscribe or unsubscribe from the kCameraChanged message based on the web-side args
MatchPhoto.toggleSubscribeToCameraChangedMessage = function(args)
{
    if (args.bToggle)
    {
        MessagesPluginListener.listener["FormIt.Message.kCameraChanged"] = MessagesPluginListener.MsgHandler;
        MessagesPluginListener.listener.SubscribeMessage("FormIt.Message.kCameraChanged");

        MatchPhoto.updateActivePhotoObjectToMatchCamera();
    }
    else 
    {
        MessagesPluginListener.listener.UnsubscribeMessage("FormIt.Message.kCameraChanged");
    }
}
