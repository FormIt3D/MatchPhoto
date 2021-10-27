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
    let stringAttributeResult = await FormIt.PluginUtils.Application.getGroupInstancesByStringAttributeKey(nEditingHistoryID, MatchPhoto.stringAttributeKey);
    let bMatchPhotoObjectExists = stringAttributeResult.length > 0;

    // if the match photo object exists, move it to face the camera
    if (bMatchPhotoObjectExists)
    {
        let matchPhotoObjectInstanceID = stringAttributeResult[0];
        let matchPhotoObjectHistoryID = await WSM.APIGetGroupReferencedHistoryReadOnly(nEditingHistoryID, matchPhotoObjectInstanceID);

        // get the LCS of the photo object history ID
        let matchPhotoObjectLCS = await WSM.APIGetLocalCoordinateSystemReadOnly(matchPhotoObjectHistoryID);

        console.log("Match photo object LCS: " + JSON.stringify(matchPhotoObjectLCS) + " Current camera data: " + JSON.stringify(await FormIt.Cameras.GetCameraData()));

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


