window.MatchPhoto = window.MatchPhoto || {};

/*** web/UI code - runs natively in the plugin process ***/

// IDs of input elements that need to be referenced or updated
const filletRadiusInputID = 'filletRadiusInput';
const deleteVertexInputID = 'deleteVertexInput';

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

MatchPhoto.updatePhotoToMatchCamera = async function()
{

    let nHistoryID = await FormIt.GroupEdit.GetEditingHistoryID();

    let cameraData = await FormIt.Cameras.GetCameraData();

    ManageCameras.createCameraGeometryFromCameraData(nHistoryID, cameraData, 0) /* use current camera aspect ratio */
}


