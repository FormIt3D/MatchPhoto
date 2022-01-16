window.MatchPhoto = window.MatchPhoto || {};

/*** web/UI code - runs natively in the plugin process ***/

MatchPhoto.bIsMatchPhotoModeActive = false;

// IDs of elements that need to be referenced or modified
MatchPhoto.inactiveMatchPhotoModeContainerID = 'inactiveMatchPhotoModeContainer';
MatchPhoto.activeMatchPhotoModeContainerID = 'activeMatchPhotoModeContainer';

MatchPhoto.layerVisibilityCheckbox = undefined;
MatchPhoto.layerVisibilityCheckboxID = 'enableMatchPhotoCheckbox';

MatchPhoto.newmatchPhotoMaterialNameInput = undefined;
MatchPhoto.newMatchPhotoMaterialNameInputID = 'newMatchPhotoMaterialNameInput';

MatchPhoto.activeMatchPhotoMaterialNameInput = undefined;
MatchPhoto.activeMatchPhotoMaterialNameInputID = 'activeMatchPhotoMaterialNameInput';

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
    let createNewMatchPhotoSubheader = new FormIt.PluginUI.HeaderModule('Create New', 'Start Match Photo Mode with the specified material used as a photograph overlaid on the screen.', 'headerContainer');
    inactiveMatchPhotoModeContainer.appendChild(createNewMatchPhotoSubheader.element);

    MatchPhoto.newMatchPhotoMaterialNameInput = new FormIt.PluginUI.TextInputModule('Material Name:', 'newMatchPhotoMaterialNameInputModule', 'inputModuleContainerTop', MatchPhoto.newMatchPhotoMaterialNameInputID);
    MatchPhoto.newMatchPhotoMaterialNameInput.getInput().setAttribute('placeholder', 'Enter material name to use as photo...');
    inactiveMatchPhotoModeContainer.appendChild(MatchPhoto.newMatchPhotoMaterialNameInput.element);

    let startNewMatchPhotoButton = new FormIt.PluginUI.ButtonWithTooltip('Create New Match Photo', 'Start Match Photo Mode with the specified material used as a photograph overlaid on the screen.', function()
    {
        MatchPhoto.startMatchPhotoMode(MatchPhoto.newMatchPhotoMaterialNameInput.getInput().value);
    });
    inactiveMatchPhotoModeContainer.appendChild(startNewMatchPhotoButton.element);

    // separator and space
    inactiveMatchPhotoModeContainer.appendChild(document.createElement('hr'));
    inactiveMatchPhotoModeContainer.appendChild(document.createElement('p'));

    // existing match photos section
    let manageExistingMatchPhotosSubheader = new FormIt.PluginUI.HeaderModule('Manage Existing', 'View, edit, and delete existing Match Photo objects in the current sketch.', 'headerContainer');
    inactiveMatchPhotoModeContainer.appendChild(manageExistingMatchPhotosSubheader.element);

    MatchPhoto.existingMatchPhotoListContainer = new FormIt.PluginUI.ListContainer('No Match Photo objects found.');
    MatchPhoto.existingMatchPhotoListContainer.element.id = MatchPhoto.existingMatchPhotoListContainerID;
    MatchPhoto.existingMatchPhotoListContainer.setListHeight(300);
    inactiveMatchPhotoModeContainer.appendChild(MatchPhoto.existingMatchPhotoListContainer.element);

    MatchPhoto.layerVisibilityCheckbox = new FormIt.PluginUI.CheckboxModule('Show Match Photo Objects', 'enabledCheckbox', 'multiModuleContainer', MatchPhoto.layerVisibilityCheckboxID);
    inactiveMatchPhotoModeContainer.appendChild(MatchPhoto.layerVisibilityCheckbox.element);
    MatchPhoto.layerVisibilityCheckbox.getInput().checked = false;
    document.getElementById(MatchPhoto.layerVisibilityCheckboxID).onclick = function()
    {
        MatchPhoto.layerVisibilityCheckboxOnClick();
    };

    // create a container for all the UI elements that should show
    // when Match Photo mode is active
    let activeMatchPhotoModeContainer = document.createElement('div');
    activeMatchPhotoModeContainer.id = MatchPhoto.activeMatchPhotoModeContainerID;
    contentContainer.appendChild(activeMatchPhotoModeContainer);

    // active match photo section
    let activeMatchPhotoSubheader = new FormIt.PluginUI.HeaderModule('Match Photo Mode Active', 'Adjust the FormIt camera or configure settings below for the Match Photo object on screen.', 'headerContainer');
    activeMatchPhotoModeContainer.appendChild(activeMatchPhotoSubheader.element);

    // create the name input so the Match Photo material can be changed
    MatchPhoto.activeMatchPhotoMaterialNameInput = new FormIt.PluginUI.TextInputModule('Material Name for Photo:', 'activeMatchPhotoMaterialNameInputModule', 'inputModuleContainerTop', MatchPhoto.newMatchPhotoMaterialNameInputID);
    activeMatchPhotoModeContainer.appendChild(MatchPhoto.activeMatchPhotoMaterialNameInput.element);

    // end the active match photo session
    let endMatchPhotoModeButton = new FormIt.PluginUI.Button('End Match Photo', function()
    {
        let photoObjectName = document.getElementById(MatchPhoto.newMatchPhotoMaterialNameInputID).value;

        MatchPhoto.endMatchPhotoMode(photoObjectName);
    });
    activeMatchPhotoModeContainer.appendChild(endMatchPhotoModeButton.element);

    // create the footer
    document.body.appendChild(new FormIt.PluginUI.FooterModule().element);

    MatchPhoto.toggleActiveOrInactiveMatchPhotoModeUI();
    MatchPhoto.synchronizeMatchPhotoVisibilityCheckboxWithLayerState();
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
    let photoObjectNameInputModule = new FormIt.PluginUI.TextInputModule('Material Name:', 'existingMatchPhotoNameForm', 'inputModuleContainer', nameInputID, function(){});
    photoObjectNameInputModule.getInput().value = matchPhotoObjectName;
    photoObjectNameInputModule.getInput().disabled = true; // only editable in Match Photo mode

    expandableContentContainer.appendChild(photoObjectNameInputModule.element);


    // add a multi-module for the manage buttons to arrange horizontally
    let multiModuleContainer = new FormIt.PluginUI.MultiModuleContainer().element;
    expandableContentContainer.appendChild(multiModuleContainer);

    // create the manage buttons

    // view
    let viewButton = new FormIt.PluginUI.ButtonWithTooltip('View', 'Set the camera to align with this Match Photo object, without entering Edit mode.', function()
    {
        let args = { "photoObjectName" : matchPhotoObjectName };

        window.FormItInterface.CallMethod("MatchPhoto.updateCameraToMatchPhotoObject", args, function(result)
        {
            // enable the visibility of Match Photo objects
            MatchPhoto.layerVisibilityCheckbox.getInput().checked = true;
            MatchPhoto.layerVisibilityCheckboxOnClick();
            
        }); 
    });
    viewButton.element.style.marginRight = 10;
    multiModuleContainer.appendChild(viewButton.element);

    // edit
    let editButton = new FormIt.PluginUI.ButtonWithTooltip('Edit', 'Start Match Photo Mode to adjust the camera position and settings for this Match Photo.', function()
    {
        let args = { "photoObjectName" : matchPhotoObjectName };

        // first, update the camera to match the existing object
        window.FormItInterface.CallMethod("MatchPhoto.updateCameraToMatchPhotoObject", args, function(result)
        {
            // then start Match Photo mode
            MatchPhoto.startMatchPhotoMode(photoObjectNameInputModule.getInput().value);

            // set the active Match Photo name input to this one
            MatchPhoto.activeMatchPhotoMaterialNameInput.getInput().value = photoObjectNameInputModule.getInput().value;
        }); 

    });
    editButton.element.style.marginRight = 10;
    multiModuleContainer.appendChild(editButton.element);

    // delete
    let deleteButton = new FormIt.PluginUI.ButtonWithTooltip('Delete', 'Delete this Match Photo object.', function()
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

// synchronize the visibility checkbox with the layer visibility state
MatchPhoto.synchronizeMatchPhotoVisibilityCheckboxWithLayerState = function()
{
    window.FormItInterface.CallMethod("MatchPhoto.getMatchPhotoLayerVisibilityState", { }, function(result)
    {
        MatchPhoto.layerVisibilityCheckbox.getInput().checked = JSON.parse(result);
    });
}

// toggle the Match Photo object layer on or off
MatchPhoto.toggleMatchPhotoLayerVisibility = function()
{
    let args = { "bIsChecked" : MatchPhoto.layerVisibilityCheckbox.getInput().checked };

    window.FormItInterface.CallMethod("MatchPhoto.setMatchPhotoLayerVisibilityByArgs", args, function(result)
    {

    });
}

// the function called when clicking the visibility checkbox
// can also be invoked by other functions to simulate clicking the checkbox
MatchPhoto.layerVisibilityCheckboxOnClick = function()
{
    let args = { "bIsChecked" : MatchPhoto.layerVisibilityCheckbox.getInput().checked };

    window.FormItInterface.CallMethod("MatchPhoto.setMatchPhotoLayerVisibilityByArgs", args, function(result)
    {

    }); 
}

// start a match photo session the material name in the field
MatchPhoto.startMatchPhotoMode = function(matchPhotoObjectName)
{
    let initialArgs = { "matchPhotoObjectName" : matchPhotoObjectName };

    // first, check if the given photo object name (material name) is valid
    window.FormItInterface.CallMethod("MatchPhoto.getIsMaterialNameValid", initialArgs, function(result)
    {
        // only proceed if the given material name is valid
        if (JSON.parse(result) == true)
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