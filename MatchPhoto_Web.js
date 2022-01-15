window.MatchPhoto = window.MatchPhoto || {};

/*** web/UI code - runs natively in the plugin process ***/

MatchPhoto.bIsMatchPhotoModeActive = false;

// IDs of elements that need to be referenced or modified
MatchPhoto.inactiveMatchPhotoModeContainerID = 'inactiveMatchPhotoModeContainer';
MatchPhoto.activeMatchPhotoModeContainerID = 'activeMatchPhotoModeContainer';
MatchPhoto.enabledCheckboxID = 'enableMatchPhotoCheckbox';
MatchPhoto.newMatchPhotoMaterialNameInputID = 'newMatchPhotoMaterialNameInput';
MatchPhoto.existingMatchPhotoMaterialNameFormID = 'existingMatchPhotoNameForm';

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

    // create the overall header for the inactive mode
    let headerContainer = new FormIt.PluginUI.HeaderModule('Match Photo', 'Match a photo to the 3D scene.', 'headerContainer');
    contentContainer.appendChild(headerContainer.element);

    // separator and space
    contentContainer.appendChild(document.createElement('hr'));
    contentContainer.appendChild(document.createElement('p'));

    // create a container for all UI elements that should show
    // when Match Photo mode is inactive
    let inactiveMatchPhotoModeContainer = document.createElement('div');
    inactiveMatchPhotoModeContainer.id = MatchPhoto.inactiveMatchPhotoModeContainerID;
    contentContainer.appendChild(inactiveMatchPhotoModeContainer);

    // new match photo section
    let createNewMatchPhotoSubheader = new FormIt.PluginUI.HeaderModule('Create New Match Photo', '', 'headerContainer');
    inactiveMatchPhotoModeContainer.appendChild(createNewMatchPhotoSubheader.element);

    let newMatchPhotoMaterialNameInput = new FormIt.PluginUI.TextInputModule('Material Name for Photo:', 'newMatchPhotoMaterialNameInputModule', 'inputModuleContainerTop', MatchPhoto.newMatchPhotoMaterialNameInputID);
    inactiveMatchPhotoModeContainer.appendChild(newMatchPhotoMaterialNameInput.element);

    let startNewMatchPhotoButton = new FormIt.PluginUI.Button('Start New Match Photo', function()
    {
        let photoObjectName = document.getElementById(MatchPhoto.newMatchPhotoMaterialNameInputID).value;

        MatchPhoto.startMatchPhotoMode(photoObjectName);
    });
    inactiveMatchPhotoModeContainer.appendChild(startNewMatchPhotoButton.element);

    let enabledCheckbox = new FormIt.PluginUI.CheckboxModule('Enabled?', 'enabledCheckbox', 'multiModuleContainer', MatchPhoto.enabledCheckboxID);
    inactiveMatchPhotoModeContainer.appendChild(enabledCheckbox.element);
    document.getElementById(MatchPhoto.enabledCheckboxID).checked = false;
    document.getElementById(MatchPhoto.enabledCheckboxID).onclick = function()
    {
        let photoObjectName = document.getElementById(MatchPhoto.newMatchPhotoMaterialNameInputID).value;

        MatchPhoto.toggleStartStopMatchPhotoMode(photoObjectName);
    };

    // existing match photos section
    let manageExistingMatchPhotosSubheader = new FormIt.PluginUI.HeaderModule('Manage Existing Photos', '', 'headerContainer');
    inactiveMatchPhotoModeContainer.appendChild(manageExistingMatchPhotosSubheader.element);

    MatchPhoto.existingMatchPhotoListContainer = new FormIt.PluginUI.ListContainer('No Match Photos found!');
    MatchPhoto.existingMatchPhotoListContainer.element.id = MatchPhoto.existingMatchPhotoListContainerID;
    MatchPhoto.existingMatchPhotoListContainer.setListHeight(300);
    inactiveMatchPhotoModeContainer.appendChild(MatchPhoto.existingMatchPhotoListContainer.element);

    // create a container for all the UI elements that should show
    // when Match Photo mode is active
    let activeMatchPhotoModeContainer = document.createElement('div');
    activeMatchPhotoModeContainer.id = MatchPhoto.activeMatchPhotoModeContainerID;
    contentContainer.appendChild(activeMatchPhotoModeContainer);

    // active match photo section
    let activeMatchPhotoSubheader = new FormIt.PluginUI.HeaderModule('Active Match Photo', '', 'headerContainer');
    activeMatchPhotoModeContainer.appendChild(activeMatchPhotoSubheader.element);

    let endMatchPhotoModeButton = new FormIt.PluginUI.Button('End Match Photo', function()
    {
        let photoObjectName = document.getElementById(MatchPhoto.newMatchPhotoMaterialNameInputID).value;

        MatchPhoto.endMatchPhotoMode(photoObjectName);
    });
    activeMatchPhotoModeContainer.appendChild(endMatchPhotoModeButton.element);

    // create the footer
    document.body.appendChild(new FormIt.PluginUI.FooterModule().element);

    MatchPhoto.toggleActiveOrInactiveMatchPhotoModeUI();
    MatchPhoto.populateExistingMatchPhotosList();
}

MatchPhoto.createExistingMatchPhotoListItem = function(matchPhotoObjectName)
{
    let matchPhotoListItemContainer = new FormIt.PluginUI.ExpandableListItem(matchPhotoObjectName);

    // set the expandable content container height
    matchPhotoListItemContainer.setContentContainerHeight(120);

    // the second (last) element is the expandable content container
    let expandableContentContainer = matchPhotoListItemContainer.element.lastChild;
    
    // add the name input
    let nameInputID = matchPhotoObjectName.replace(/\s/g, '') + 'InputID';
    let photoObjectNameInputModule = new FormIt.PluginUI.TextInputModule('Material Name:', MatchPhoto.existingMatchPhotoMaterialNameFormID, 'inputModuleContainer', nameInputID, function(){});

    expandableContentContainer.appendChild(photoObjectNameInputModule.element);
    
    photoObjectNameInputModule.getInput().value = matchPhotoObjectName;

    // add a multi-module for the manage buttons to arrange horizontally
    let multiModuleContainer = new FormIt.PluginUI.MultiModuleContainer().element;
    expandableContentContainer.appendChild(multiModuleContainer);

    // create the manage buttons

    // edit
    let editButton = new FormIt.PluginUI.Button('Edit Match Photo', function()
    {
        let args = { "photoObjectName" : matchPhotoObjectName };

        window.FormItInterface.CallMethod("MatchPhoto.updateCameraToMatchPhotoObject", args, function(result)
        {

        }); 
    });
    editButton.element.style.marginRight = 10;
    multiModuleContainer.appendChild(editButton.element);

    // delete
    let deleteButton = new FormIt.PluginUI.Button('Delete Match Photo', function()
    {       
        let args = { "photoObjectName" : matchPhotoObjectName };

        window.FormItInterface.CallMethod("MatchPhoto.deleteMatchPhotoObject", args, function(result)
        {

            MatchPhoto.populateExistingMatchPhotosList();

        }); 
    });
    deleteButton.element.style.marginRight = 10;
    multiModuleContainer.appendChild(deleteButton.element);

    return matchPhotoListItemContainer.element;
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

// toggle the active or inactive container UI depending on the flag
MatchPhoto.toggleActiveOrInactiveMatchPhotoModeUI = function()
{
    if (MatchPhoto.bIsMatchPhotoModeActive)
    {
        document.getElementById(MatchPhoto.activeMatchPhotoModeContainerID).className = 'show';
        document.getElementById(MatchPhoto.inactiveMatchPhotoModeContainerID).className = 'hide';
    }
    else
    {
        document.getElementById(MatchPhoto.activeMatchPhotoModeContainerID).className = 'hide';
        document.getElementById(MatchPhoto.inactiveMatchPhotoModeContainerID).className = 'show';
    }
}

// start a match photo session the material name in the field
MatchPhoto.startMatchPhotoMode = function(matchPhotoObjectName)
{
    MatchPhoto.bIsMatchPhotoModeActive = true;

    MatchPhoto.toggleActiveOrInactiveMatchPhotoModeUI();

    let args = { "bIsMatchPhotoModeActive" : MatchPhoto.bIsMatchPhotoModeActive, "matchPhotoObjectName" : matchPhotoObjectName };

    // initialize the match photo object
    window.FormItInterface.CallMethod("MatchPhoto.initializeMatchPhotoObject", args, function(result)
    {

    });

    // start or stop subscribing to the camera changed message
    window.FormItInterface.CallMethod("MatchPhoto.toggleSubscribeToCameraChangedMessage", args, function(result)
    {

    });
}

// end a match photo session
MatchPhoto.endMatchPhotoMode = function(matchPhotoObjectName)
{
    MatchPhoto.bIsMatchPhotoModeActive = false;

    MatchPhoto.toggleActiveOrInactiveMatchPhotoModeUI();

    let args = { "bIsMatchPhotoModeActive" : MatchPhoto.bIsMatchPhotoModeActive, "matchPhotoObjectName" : matchPhotoObjectName };

    // start or stop subscribing to the camera changed message
    window.FormItInterface.CallMethod("MatchPhoto.toggleSubscribeToCameraChangedMessage", args, function(result)
    {

    });

    MatchPhoto.populateExistingMatchPhotosList();
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