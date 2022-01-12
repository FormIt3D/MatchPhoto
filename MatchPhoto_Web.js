window.MatchPhoto = window.MatchPhoto || {};

/*** web/UI code - runs natively in the plugin process ***/

// IDs of elements that need to be modified or updated
MatchPhoto.enabledCheckboxID = 'EnableMatchPhotoCheckbox';
MatchPhoto.newMatchPhotoMaterialNameInputID = 'NewMatchPhotoMaterialNameInput';

// the list of existing Match Photo objects
MatchPhoto.existingMatchPhotoListContainer = undefined;
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
    document.getElementById(MatchPhoto.enabledCheckboxID).onclick = function()
    {
        let photoObjectName = document.getElementById(MatchPhoto.newMatchPhotoMaterialNameInputID).value;

        MatchPhoto.toggleStartStopMatchPhotoMode(photoObjectName);
    };

    // existing match photos section
    let manageExistingMatchPhotosSubheader = new FormIt.PluginUI.HeaderModule('Manage Existing Photos', '', 'headerContainer');
    contentContainer.appendChild(manageExistingMatchPhotosSubheader.element);

    MatchPhoto.existingMatchPhotoListContainer = new FormIt.PluginUI.ScrollableListContainer('No Match Photos found!');
    MatchPhoto.existingMatchPhotoListContainer.element.id = MatchPhoto.existingMatchPhotoListContainerID;
    contentContainer.appendChild(MatchPhoto.existingMatchPhotoListContainer.element);

    // create the footer
    document.body.appendChild(new FormIt.PluginUI.FooterModule().element);

    // update the list of existing match photo objects
    MatchPhoto.populateExistingMatchPhotosList();
}

MatchPhoto.createExistingMatchPhotoListItem = function(matchPhotoObjectName)
{
    let matchPhotoListItemContainer = document.createElement('div');
    matchPhotoListItemContainer.className = 'listItemContainer';

    matchPhotoListItemContainer.innerHTML = matchPhotoObjectName;
    return matchPhotoListItemContainer;
}

MatchPhoto.clearExistingMatchPhotosList = function()
{
    // get the list container
    let listContainer = document.getElementById(MatchPhoto.existingMatchPhotoListContainerID);

    // the first child is the zero-state label, which shouldn't be deleted
    // so save it for restoring later
    let zeroStateChild = listContainer.firstChild;

    // remove all children
    while (listContainer.firstChild) {
        listContainer.removeChild(listContainer.lastChild);
      }

    // add the zero-state label back
    listContainer.appendChild(zeroStateChild);
}

MatchPhoto.populateExistingMatchPhotosList = function()
{
 
    // get a list of photo object names from the FormIt side
    window.FormItInterface.CallMethod("MatchPhoto.getAllPhotoObjects", {}, function(result)
    {
        // first, clear the list if there are any items listed
        MatchPhoto.clearExistingMatchPhotosList();

        let parsedResult = JSON.parse(result);

        // for each item in the array, create a list item in the container
        for (var i = 0; i < parsedResult.length; i++)
        {
            let listItemElement = MatchPhoto.createExistingMatchPhotoListItem(parsedResult[i]);
            MatchPhoto.existingMatchPhotoListContainer.element.appendChild(listItemElement);
        }

        // the list container has a zero-state message function
        // invoke this to show or hide the zero state message
        MatchPhoto.existingMatchPhotoListContainer.toggleZeroStateMessage();

        });
}

// start a new match photo using the material name in the field
MatchPhoto.toggleStartStopMatchPhotoMode = function(matchPhotoObjectName)
{
    let isEnabled = document.getElementById(MatchPhoto.enabledCheckboxID).checked;

    let args = { "bToggle" : isEnabled, "matchPhotoObjectName" : matchPhotoObjectName };

    // initialize the match photo object
    window.FormItInterface.CallMethod("MatchPhoto.initializeMatchPhotoObject", args, function(result)
    {

    });

    // start or stop subscribing to the camera changed message
    window.FormItInterface.CallMethod("MatchPhoto.toggleSubscribeToCameraChangedMessage", args, function(result)
    {

    });

    MatchPhoto.populateExistingMatchPhotosList();
}