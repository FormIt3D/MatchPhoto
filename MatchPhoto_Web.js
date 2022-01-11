window.MatchPhoto = window.MatchPhoto || {};

/*** web/UI code - runs natively in the plugin process ***/

// IDs of elements that need to be modified or updated
MatchPhoto.enabledCheckboxID = 'EnableMatchPhotoCheckbox';
MatchPhoto.newMatchPhotoMaterialNameInputID = 'NewMatchPhotoMaterialNameInput';
MatchPhoto.existingMatchPhotoListContainerID = 'existingMatchPhotoListContainer';

// initialize the UI
MatchPhoto.initializeUI = function()
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

    // new match photo section
    let createNewMatchPhotoSubheader = new FormIt.PluginUI.HeaderModule('Create New Match Photo', '', 'headerContainer');
    contentContainer.appendChild(createNewMatchPhotoSubheader.element);

    let newMatchPhotoMaterialNameInput = new FormIt.PluginUI.TextInputModule('Material Name for Photo:', 'newMatchPhotoMaterialNameInputModule', 'inputModuleContainerTop', MatchPhoto.newMatchPhotoMaterialNameInputID);
    contentContainer.appendChild(newMatchPhotoMaterialNameInput.element);

    let enabledCheckbox = new FormIt.PluginUI.CheckboxModule('Enabled?', 'enabledCheckbox', 'multiModuleContainer', MatchPhoto.enabledCheckboxID);
    contentContainer.appendChild(enabledCheckbox.element);
    document.getElementById(MatchPhoto.enabledCheckboxID).checked = false;
    document.getElementById(MatchPhoto.enabledCheckboxID).onclick = MatchPhoto.toggleStartStopNewMatchPhoto;

    // existing match photos section
    let manageExistingMatchPhotosSubheader = new FormIt.PluginUI.HeaderModule('Manage Existing Photos', '', 'headerContainer');
    contentContainer.appendChild(manageExistingMatchPhotosSubheader.element);

    let existingMatchPhotoListContainer = new FormIt.PluginUI.ScrollableListContainer('No Match Photos found!');
    existingMatchPhotoListContainer.element.id = MatchPhoto.existingMatchPhotoListContainerID;
    contentContainer.appendChild(existingMatchPhotoListContainer.element);

    // create the footer
    document.body.appendChild(new FormIt.PluginUI.FooterModule().element);
}

MatchPhoto.populateListWithExistingMatchPhotos = function(listContainerID)
{
    // get the list container
    let listContainer = document.getElementById(MatchPhoto.existingMatchPhotoListContainerID);


}

// start a new match photo using the material name in the field
MatchPhoto.toggleStartStopNewMatchPhoto = function()
{
    let isEnabled = document.getElementById(MatchPhoto.enabledCheckboxID).checked;

    let photoObjectName = document.getElementById(MatchPhoto.newMatchPhotoMaterialNameInputID).value;

    let args = { "bToggle" : isEnabled, "photoObjectName" : photoObjectName };

    // initialize the match photo object
    window.FormItInterface.CallMethod("MatchPhoto.initializeMatchPhotoObject", args, function(result)
    {

    });

    // start or stop subscribing to the camera changed message
    window.FormItInterface.CallMethod("MatchPhoto.toggleSubscribeToCameraChangedMessage", args, function(result)
    {

    });
}