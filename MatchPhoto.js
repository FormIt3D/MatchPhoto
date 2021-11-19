window.MatchPhoto = window.MatchPhoto || {};

/*** web/UI code - runs natively in the plugin process ***/

// initialize the UI
MatchPhoto.initializeUI = async function()
{
    // create an overall container for all objects that comprise the "content" of the plugin
    // everything except the footer
    let contentContainer = document.createElement('div');
    contentContainer.id = 'contentContainer';
    contentContainer.className = 'contentContainer'
    window.document.body.appendChild(contentContainer);

    // create the overall header
    let headerContainer = new FormIt.PluginUI.HeaderModule('Match Photo', 'Match a photo to the 3D scene.', 'headerContainer');
    contentContainer.appendChild(headerContainer.element);

    // separator and space
    contentContainer.appendChild(document.createElement('hr'));
    contentContainer.appendChild(document.createElement('p'));
}

MatchPhoto.updateUI = async function()
{

}

/*** application code - runs asynchronously from plugin process to communicate with FormIt ***/

MatchPhoto.stringAttributeKey = 'FormIt::Plugins::MatchPhoto';

MatchPhoto.updatePhotoObjectToMatchCamera = async function()
{
    let nEditingHistoryID = await FormIt.GroupEdit.GetEditingHistoryID();

    // first, check if a match photo object already exists in this history
    let aInstancesWithStringAttribute = await FormIt.PluginUtils.Application.getGroupInstancesByStringAttributeKey(nEditingHistoryID, MatchPhoto.stringAttributeKey);
    let bMatchPhotoObjectExists = aInstancesWithStringAttribute.length > 0;

    // if the match photo object exists, move it to face the camera
    if (bMatchPhotoObjectExists)
    {
        let cameraObjectInstanceID = aInstancesWithStringAttribute[0];
        let cameraObjectHistoryID = await WSM.APIGetGroupReferencedHistoryReadOnly(nEditingHistoryID, cameraObjectInstanceID);
        let cameraObjectInstanceTransf3d = await WSM.APIGetInstanceTransf3dReadOnly(nEditingHistoryID, cameraObjectInstanceID);

        // re-create the instance transform without any scaling
        let cameraObjectCoordinateSystem = await WSM.Transf3d.GetCoordinateSystem(cameraObjectInstanceTransf3d);
        let xDirNormalized = await WSM.Vector3d.GetNormalized(cameraObjectCoordinateSystem.xDir);
        let yDirNormalized = await WSM.Vector3d.GetNormalized(cameraObjectCoordinateSystem.yDir);
        let newInstanceTransform = await WSM.Transf3d.Transf3d(cameraObjectCoordinateSystem.origin, xDirNormalized, yDirNormalized);

        let cameraObjectInvertedTransform = await WSM.Geom.InvertTransform(newInstanceTransform);

        // get camera data
        let cameraForward = await FormIt.Cameras.GetCameraWorldForward();
        let cameraUp = await FormIt.Cameras.GetCameraWorldUp();
        let cameraPosition = await FormIt.Cameras.GetCameraWorldPosition();
        let cameraRight = await WSM.Vector3d.CrossProduct(cameraForward, cameraUp);
        cameraUp = await WSM.Vector3d.MultiplyByFactor(cameraUp, -1);
        let cameraTransform = await WSM.Transf3d.Transf3d(cameraPosition, cameraRight, cameraUp);

        // calculate the transform to get to the current camera
        let finalTransform = await WSM.Transf3d.Multiply(cameraTransform, cameraObjectInvertedTransform);

        // apply the transform to the camera object
        await WSM.APITransformObject(nEditingHistoryID, cameraObjectInstanceID, finalTransform);	
    }
    // otherwise, make it from scratch
    else
    {
        let cameraData = await FormIt.Cameras.GetCameraData();
    
        let viewportSize = await FormIt.Cameras.GetViewportSize();
        let aspectRatio = viewportSize.width / viewportSize.height;
    
        let matchPhotoObjectInstanceID = await ManageCameras.createCameraGeometryFromCameraData(nEditingHistoryID, cameraData, aspectRatio);

        await WSM.Utils.SetOrCreateStringAttributeForObject(nEditingHistoryID,
            matchPhotoObjectInstanceID, MatchPhoto.stringAttributeKey, "Test!");
    }

}


