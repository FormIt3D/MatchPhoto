var MatchPhoto = MatchPhoto || {};

/*** application code - runs asynchronously from plugin process to communicate with FormIt ***/

MatchPhoto.stringAttributeKey = 'FormIt::Plugins::MatchPhoto';
MatchPhoto.camerasContainerLayerName = 'Cameras - Match Photo';

MatchPhoto.updatePhotoObjectToMatchCamera = function()
{
    var nEditingHistoryID = FormIt.GroupEdit.GetEditingHistoryID();

    // first, check if a match photo object already exists in this history
    var aInstancesWithStringAttribute = FormIt.PluginUtils.Application.getGroupInstancesByStringAttributeKey(nEditingHistoryID, MatchPhoto.stringAttributeKey);
    var bMatchPhotoObjectExists = aInstancesWithStringAttribute.length > 0;

    // if the match photo object exists, move it to face the camera
    if (bMatchPhotoObjectExists)
    {
        var cameraObjectInstanceID = aInstancesWithStringAttribute[0];
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

