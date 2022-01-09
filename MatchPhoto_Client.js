var MatchPhoto = MatchPhoto || {};

/*** application code - runs asynchronously from plugin process to communicate with FormIt ***/
/*** the FormIt application-side JS engine only supports ES5 syntax, so use var here ***/

MatchPhoto.stringAttributeKey = 'FormIt::Plugins::MatchPhoto';
MatchPhoto.camerasContainerLayerName = 'Cameras - Match Photo'; // TODO: this should not be hard-coded

// this is called every frame when Match Photo mode is enabled
MatchPhoto.updatePhotoObjectToMatchCamera = function()
{
    var nEditingHistoryID = FormIt.GroupEdit.GetEditingHistoryID();

    var cameraObjectInstanceID = MatchPhoto.getPhotoObjectInstanceID(nEditingHistoryID);

    // if the match photo object exists, move it to face the camera
    if (cameraObjectInstanceID != undefined)
    {
        var cameraObjectHistoryID = WSM.APIGetGroupReferencedHistoryReadOnly(nEditingHistoryID, cameraObjectInstanceID);
        var cameraObjectInstanceTransf3d = WSM.APIGetInstanceTransf3dReadOnly(nEditingHistoryID, cameraObjectInstanceID);

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
        WSM.APITransformObject(nEditingHistoryID, cameraObjectInstanceID, finalTransform);	
    }
    // otherwise, make it from scratch
    else
    {
        var cameraData = FormIt.Cameras.GetCameraData();
    
        var viewportSize = FormIt.Cameras.GetViewportSize();
        var aspectRatio = viewportSize.width / viewportSize.height;
    
        var matchPhotoObjectInstanceID = ManageCameras.createCameraGeometryFromCameraData(nEditingHistoryID, cameraData, aspectRatio);

        WSM.Utils.SetOrCreateStringAttributeForObject(nEditingHistoryID,
            matchPhotoObjectInstanceID, MatchPhoto.stringAttributeKey, "Test!");

        //put the instance on a layer and lock the layer
        FormIt.Layers.AddLayer(0, MatchPhoto.camerasContainerLayerName, true);
        var layerID = FormIt.Layers.GetLayerID(MatchPhoto.camerasContainerLayerName);
        FormIt.Layers.SetLayerPickable(layerID, false);
        FormIt.Layers.AssignLayerToObjects(layerID, matchPhotoObjectInstanceID);
    }
}

// get camera object instance ID, if available
MatchPhoto.getPhotoObjectInstanceID = function(contextHistoryID)
{
    // first, check if a match photo object already exists in this history
    var aInstancesWithStringAttribute = FormIt.PluginUtils.Application.getGroupInstancesByStringAttributeKey(contextHistoryID, MatchPhoto.stringAttributeKey);
    var cameraObjectInstanceID = aInstancesWithStringAttribute[0];

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

// this is called on every camera operation start
MatchPhoto.paintMatchPhotoObjectWithMaterial = function(cameraObjectInstanceID)
{
    // get the nested history ID containing the camera plane face
    var nCameraPlaneHistoryID = ManageCameras.getPCameraPlaneHistoryID(cameraObjectInstanceID);

    // assume that history contains just one face
    var nFaceID = WSM.APIGetAllObjectsByTypeReadOnly(nCameraPlaneHistoryID, WSM.nObjectType.nFaceType)[0];

    // create an object history ID to identify the face in the context of its history
    var objectHistoryID = WSM.ObjectHistoryID(nCameraPlaneHistoryID, nFaceID);

    // look for and apply the material to the camera object
    // (hard-coded for now)
    var materialName = "simple test photo";
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

// set up the message listener
MessagesPluginListener = {};
MessagesPluginListener.MsgHandler = function(msg, payload) { 

    MatchPhoto.updatePhotoObjectToMatchCamera();

};
// Create a Message Listener that handles calling the subscribed message handlers.
if (!(MessagesPluginListener.hasOwnProperty("listener")))
{
    MessagesPluginListener.listener = FormIt.Messaging.NewMessageListener();
}

// subscribe to the cameraChanged message if the web-side arguments say so
MatchPhoto.subscribeToCameraChangedMessageByArgs = function(args)
{
    if (args.bToggle)
    {
        MessagesPluginListener.listener["FormIt.Message.kCameraChanged"] = MessagesPluginListener.MsgHandler;
        MessagesPluginListener.listener.SubscribeMessage("FormIt.Message.kCameraChanged");

        // update the photo object to match the camera
        // so the effect is immediate when the toggle is checked
        MatchPhoto.updatePhotoObjectToMatchCamera();
    }
    else 
    {
        MessagesPluginListener.listener.UnsubscribeMessage("FormIt.Message.kCameraChanged");
    }
}

// subscribe to the cameraChanged message if the web-side arguments say so
MatchPhoto.subscribeToCameraStartedMessageByArgs = function(args)
{
    if (args.bToggle)
    {
        MessagesPluginListener.listener["FormIt.Message.kCameraOperationStarted"] = MessagesPluginListener.MsgHandler;
        MessagesPluginListener.listener.SubscribeMessage("FormIt.Message.kCameraOperationStarted");

        // paint the active photo object
        var cameraInstanceObjectID = MatchPhoto.getPhotoObjectInstanceID(FormIt.GroupEdit.GetEditingHistoryID());
        MatchPhoto.paintMatchPhotoObjectWithMaterial(cameraInstanceObjectID);
    }
    else 
    {
        MessagesPluginListener.listener.UnsubscribeMessage("FormIt.Message.kCameraOperationStarted");
    }
}

