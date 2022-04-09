window.MatchPhoto = window.MatchPhoto || {};

/*** web/UI code - runs natively in the plugin process ***/

MatchPhoto.bIsMatchPhotoModeActive = false;
MatchPhoto.lastUpdateTime = 0;
MatchPhoto.defaultCameraPlaneDistance = 5; // feet

// keep track of all known match photo object data in this session
MatchPhoto.allKnownMatchPhotoObjectNames = [];
MatchPhoto.allKnownMatchPhotoObjectLayerCheckboxModules = [];

// IDs of elements that need to be referenced or modified
MatchPhoto.inactiveMatchPhotoModeContainerID = 'inactiveMatchPhotoModeContainer';
MatchPhoto.activeMatchPhotoModeContainerID = 'activeMatchPhotoModeContainer';

MatchPhoto.newMatchPhotoMaterialSelectInput = undefined;
MatchPhoto.newMatchPhotoMaterialSelectInputID = 'newMatchPhotoMaterialSelectList';
MatchPhoto.defaultSelectInputOptionText = 'Choose a material to use as a photo...';

MatchPhoto.newMatchPhotoCameraPlaneDistanceInput = undefined;
MatchPhoto.newMatchPhotoCameraPlaneDistanceInputID = 'newMatchPhotoCameraPlaneDistanceInput';

MatchPhoto.activeMatchPhotoMaterialSelectInput = undefined;
MatchPhoto.activeMatchPhotoMaterialNameInput = undefined;

MatchPhoto.activeMatchPhotoCameraPlaneDistanceInput = undefined;
MatchPhoto.activeMatchPhotoCameraPlaneDistanceInputID = 'activeMatchPhotoMaterialNameInput';

MatchPhoto.existingMatchPhotoListContainer = undefined;
MatchPhoto.existingMatchPhotoListContainerID = 'existingMatchPhotoListContainer';

// initialize the UI
MatchPhoto.initializeUI = function()
{
    // clear the existing content if it exists
    if (document.getElementById('contentContainer'))
    {
        document.getElementById('contentContainer').parentElement.removeChild(document.getElementById('contentContainer'));
    }
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

    // the name select element
    MatchPhoto.newMatchPhotoMaterialSelectInput = new FormIt.PluginUI.SelectInputModule('Material:', MatchPhoto.defaultSelectInputOptionText);
    // populate the list with the available material names
    MatchPhoto.populateSelectElementWithInSketchMaterials(MatchPhoto.newMatchPhotoMaterialSelectInput); 
    inactiveMatchPhotoModeContainer.appendChild(MatchPhoto.newMatchPhotoMaterialSelectInput.element);

    // the camera plane distance input
    MatchPhoto.newMatchPhotoCameraPlaneDistanceInput = new FormIt.PluginUI.TextInputModule('Camera Plane Distance:', 'newMatchPhotoCameraPlaneDistanceInputModule', 'inputModuleContainer', MatchPhoto.newMatchPhotoCameraPlaneDistanceInputID, function()
        {
            MatchPhoto.populateInputWithConvertedValueString(MatchPhoto.newMatchPhotoCameraPlaneDistanceInput, MatchPhoto.newMatchPhotoCameraPlaneDistanceInput.getInput().value);
        });
    MatchPhoto.newMatchPhotoCameraPlaneDistanceInput.getInput().setAttribute('title', 'The distance from the camera that the photo will appear. Enter small numbers for foreground photos, larger numbers for background photos.');
    // set the default camera plane distance
    MatchPhoto.populateInputWithConvertedValueString(MatchPhoto.newMatchPhotoCameraPlaneDistanceInput, MatchPhoto.defaultCameraPlaneDistance);

    inactiveMatchPhotoModeContainer.appendChild(MatchPhoto.newMatchPhotoCameraPlaneDistanceInput.element);

    let startNewMatchPhotoButton = new FormIt.PluginUI.ButtonWithTooltip('Create New Match Photo', 'Start Match Photo Mode with the specified material used as a photograph overlaid on the screen.', function()
    {
        MatchPhoto.startMatchPhotoModeForNewObject(MatchPhoto.newMatchPhotoMaterialSelectInput.getInput().value, MatchPhoto.newMatchPhotoCameraPlaneDistanceInput.getInput().value);

        // synchronize the active Match Photo name and camera plane distance inputs with these
        MatchPhoto.activeMatchPhotoMaterialSelectInput.getInput().value = MatchPhoto.newMatchPhotoMaterialSelectInput.getInput().value;
        MatchPhoto.activeMatchPhotoCameraPlaneDistanceInput.getInput().value = MatchPhoto.newMatchPhotoCameraPlaneDistanceInput.getInput().value;
    });
    inactiveMatchPhotoModeContainer.appendChild(startNewMatchPhotoButton.element);

    // separator and space
    inactiveMatchPhotoModeContainer.appendChild(document.createElement('hr'));
    inactiveMatchPhotoModeContainer.appendChild(document.createElement('p'));

    // existing match photos section
    let manageExistingMatchPhotosSubheader = new FormIt.PluginUI.HeaderModule('Manage Existing', 'View, edit, and delete existing Match Photo objects in the current sketch.', 'headerContainer');
    inactiveMatchPhotoModeContainer.appendChild(manageExistingMatchPhotosSubheader.element);

    MatchPhoto.existingMatchPhotoListContainer = new FormIt.PluginUI.ListContainer('No Match Photo objects found.', 350);
    MatchPhoto.existingMatchPhotoListContainer.element.id = MatchPhoto.existingMatchPhotoListContainerID;
    inactiveMatchPhotoModeContainer.appendChild(MatchPhoto.existingMatchPhotoListContainer.element);

    // create a container for all the UI elements that should show
    // when Match Photo mode is active
    let activeMatchPhotoModeContainer = document.createElement('div');
    activeMatchPhotoModeContainer.id = MatchPhoto.activeMatchPhotoModeContainerID;
    contentContainer.appendChild(activeMatchPhotoModeContainer);

    // active match photo section
    let activeMatchPhotoSubheader = new FormIt.PluginUI.HeaderModule('Match Photo Mode Active', 'Adjust the FormIt camera or configure settings below for the Match Photo object on screen.', 'headerContainer');
    activeMatchPhotoModeContainer.appendChild(activeMatchPhotoSubheader.element);

    MatchPhoto.activeMatchPhotoMaterialSelectInput = new FormIt.PluginUI.SelectInputModule('Material:', MatchPhoto.defaultSelectInputOptionText, function()
    {
        MatchPhoto.tryRebuildPhotoObject(MatchPhoto.activeMatchPhotoMaterialSelectInput.existingInputValue, MatchPhoto.activeMatchPhotoMaterialSelectInput.getInput().value, MatchPhoto.activeMatchPhotoCameraPlaneDistanceInput.getInput().value);
    });

    MatchPhoto.populateSelectElementWithInSketchMaterials(MatchPhoto.activeMatchPhotoMaterialSelectInput);
    activeMatchPhotoModeContainer.appendChild(MatchPhoto.activeMatchPhotoMaterialSelectInput.element);

    // create the camera plane distance input so it can be changed
    MatchPhoto.activeMatchPhotoCameraPlaneDistanceInput = new FormIt.PluginUI.TextInputModule('Camera Plane Distance:', 'activeMatchPhotoCameraPlaneDistanceInputModule', 'inputModuleContainerTop', MatchPhoto.activeMatchPhotoCameraPlaneDistanceInputID, function()
    {
        MatchPhoto.populateInputWithConvertedValueString(MatchPhoto.activeMatchPhotoCameraPlaneDistanceInput, MatchPhoto.activeMatchPhotoCameraPlaneDistanceInput.getInput().value);

        MatchPhoto.rebuildMatchPhotoObject(MatchPhoto.activeMatchPhotoMaterialSelectInput.getInput().value, MatchPhoto.activeMatchPhotoMaterialSelectInput.getInput().value, MatchPhoto.activeMatchPhotoCameraPlaneDistanceInput.getInput().value);
    });
    activeMatchPhotoModeContainer.appendChild(MatchPhoto.activeMatchPhotoCameraPlaneDistanceInput.element);

    // reset the camera to the initial state
    let resetCameraChangesButton = new FormIt.PluginUI.Button('Reset Camera', function()
    {
        window.FormItInterface.CallMethod("MatchPhoto.resetCameraToInitialState", args, function(result)
        {

        }); 
    });
    resetCameraChangesButton.element.setAttribute('title', 'Discard camera changes made during this editing session, and revert to the original camera state.');
    activeMatchPhotoModeContainer.appendChild(resetCameraChangesButton.element);

    // end the active match photo session
    let endMatchPhotoModeButton = new FormIt.PluginUI.Button('Done Editing', function()
    {
        let photoObjectName = document.getElementById(MatchPhoto.newMatchPhotoMaterialSelectInput.getInput().value);

        MatchPhoto.newMatchPhotoMaterialSelectInput.getInput().value = MatchPhoto.defaultSelectInputOptionText;
        MatchPhoto.endMatchPhotoMode(photoObjectName);
    });
    activeMatchPhotoModeContainer.appendChild(endMatchPhotoModeButton.element);

    // create the footer
    document.body.appendChild(new FormIt.PluginUI.FooterModule().element);

    MatchPhoto.toggleActiveOrInactiveMatchPhotoModeUI();
    MatchPhoto.populateExistingMatchPhotosList();

}

// update the UI
MatchPhoto.updateUI = function()
{
    let now = new Date().getTime();

    // this function is called by various FormIt messages,
    // which could happen more often than expected
    // so don't update if we updated within 1 second ago
    // or if match photo mode is active
    if (now - MatchPhoto.lastUpdateTime < 1000 || MatchPhoto.bIsMatchPhotoModeActive)
    {
        return;
    }

    // update the dimension field with the current units
    let args = { "string" : MatchPhoto.newMatchPhotoCameraPlaneDistanceInput.getInput().value };
    window.FormItInterface.CallMethod("MatchPhoto.convertStringToLinearValue", args, function(result)
    {
        MatchPhoto.populateInputWithConvertedValueString(MatchPhoto.newMatchPhotoCameraPlaneDistanceInput, JSON.parse(result));
    }); 

    // update other UI elements
    MatchPhoto.populateExistingMatchPhotosList();
    MatchPhoto.populateSelectElementWithInSketchMaterials(MatchPhoto.newMatchPhotoMaterialSelectInput);
    MatchPhoto.populateSelectElementWithInSketchMaterials(MatchPhoto.activeMatchPhotoMaterialSelectInput);

    // mark the last run time
    MatchPhoto.lastUpdateTime = new Date().getTime();
}

MatchPhoto.createExistingMatchPhotoListItem = function(matchPhotoObjectName)
{
    let matchPhotoListItemContainer = new FormIt.PluginUI.ExpandableListItem(matchPhotoObjectName);
    matchPhotoListItemContainer.element.setAttribute('title', 'Click to expand and view options for this item.');

    // set the expandable content container height
    matchPhotoListItemContainer.setContentContainerHeight(220);

    // the second (last) element is the expandable content container
    let expandableContentContainer = matchPhotoListItemContainer.element.lastChild;
    
    // add the name input
    let nameInputID = matchPhotoObjectName.replace(/\s/g, '') + 'NameInput';
    let photoObjectNameInputModule = new FormIt.PluginUI.TextInputModule('Material Name:', 'existingMatchPhotoNameForm', 'inputModuleContainer', nameInputID);
    let photoObjectNameInput = photoObjectNameInputModule.getInput();
    photoObjectNameInput.value = matchPhotoObjectName;
    photoObjectNameInput.disabled = true; // only editable in Match Photo mode
    photoObjectNameInput.setAttribute('title', 'Click "Edit" to change the material name.');
    expandableContentContainer.appendChild(photoObjectNameInputModule.element);

    // add the camera plane distance input
    let cameraPlaneDistanceInputID = matchPhotoObjectName.replace(/\s/g, '') + 'CameraPlaneDistanceInput';
    let photoObjectCameraPlaneDistanceInputModule = new FormIt.PluginUI.TextInputModule('Camera Plane Distance:', 'existingMatchPhotoCameraPlaneDistanceForm', 'inputModuleContainer', cameraPlaneDistanceInputID);
    let photoObjectCameraPlaneDistanceInput = photoObjectCameraPlaneDistanceInputModule.getInput();
    photoObjectCameraPlaneDistanceInput.setAttribute('title', 'Click "Edit" to change the camera plane distance.');
    photoObjectCameraPlaneDistanceInput.disabled = true; // only editable in Match Photo mode
    // the camera plane distance must be retrieved from an attribute on the object
    let args = { "photoObjectName" : matchPhotoObjectName };
    window.FormItInterface.CallMethod("MatchPhoto.getCameraPlaneDistanceFromAttribute", args, function(result)
    {

        photoObjectCameraPlaneDistanceInput.value = JSON.parse(result);
        
    }); 
    expandableContentContainer.appendChild(photoObjectCameraPlaneDistanceInputModule.element);

    // add a multi-module for the manage buttons to arrange horizontally
    let multiModuleContainer = new FormIt.PluginUI.MultiModuleContainer().element;
    expandableContentContainer.appendChild(multiModuleContainer);

    // add the layer visibility toggle
    let layerVisibilityCheckboxModule = new FormIt.PluginUI.CheckboxModule('Visible?', 'enabledCheckbox', 'multiModuleContainer', 'enabledCheckbox');
    layerVisibilityCheckboxModule.element.firstChild.style.marginLeft = 0;
    MatchPhoto.allKnownMatchPhotoObjectLayerCheckboxModules.push(layerVisibilityCheckboxModule);

    // create the manage buttons

    // view
    let viewButton = new FormIt.PluginUI.ButtonWithTooltip('View', 'Set the camera to align with this Match Photo object, without entering Edit mode.', function()
    {
        let args = { "photoObjectName" : matchPhotoObjectName };

        window.FormItInterface.CallMethod("MatchPhoto.updateCameraToMatchPhotoObject", args, function(result)
        {
            // enable the visibility of this match photo object
            layerVisibilityCheckboxModule.getInput().checked = true;
        }); 
        
    });
    viewButton.element.style.marginRight = 10;
    viewButton.element.style.marginBottom = 5;
    multiModuleContainer.appendChild(viewButton.element);

    // edit
    let editButton = new FormIt.PluginUI.ButtonWithTooltip('Edit', 'Start Match Photo Mode to adjust the camera position and settings for this Match Photo.', function()
    {
        let args = { "photoObjectName" : matchPhotoObjectName };

        // first, update the camera to match the existing object
        window.FormItInterface.CallMethod("MatchPhoto.updateCameraToMatchPhotoObject", args, function(result)
        {
            // then start Match Photo mode
            MatchPhoto.startMatchPhotoModeForExistingObject(photoObjectNameInputModule.getInput().value, photoObjectCameraPlaneDistanceInputModule.getInput().value);

           // synchronize the active Match Photo name and camera plane distance inputs with these
            MatchPhoto.activeMatchPhotoMaterialSelectInput.getInput().value = photoObjectNameInputModule.getInput().value;
            MatchPhoto.activeMatchPhotoCameraPlaneDistanceInput.getInput().value = photoObjectCameraPlaneDistanceInputModule.getInput().value;

            // enable the visibility of this match photo object
            layerVisibilityCheckboxModule.getInput().checked = true;
        }); 

    });
    editButton.element.style.marginRight = 10;
    editButton.element.style.marginBottom = 5;
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
    deleteButton.element.style.marginBottom = 5;
    multiModuleContainer.appendChild(deleteButton.element);
    
    // append and configure the visibility toggle
    expandableContentContainer.appendChild(layerVisibilityCheckboxModule.element);
    layerVisibilityCheckboxModule.element.firstChild.onclick = function()
    {
        MatchPhoto.toggleMatchPhotoLayerVisibility(layerVisibilityCheckboxModule, matchPhotoObjectName);
    };

    // set the checkbox state to match the layer state of the corresponding match photo object
    MatchPhoto.synchronizeMatchPhotoVisibilityCheckboxWithLayerState(layerVisibilityCheckboxModule, matchPhotoObjectName);

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

MatchPhoto.populateSelectElementWithInSketchMaterials = function(selectElement)
{
    window.FormItInterface.CallMethod("MatchPhoto.getAllInSketchMaterialNames", { }, function(result)
    {
        selectElement.populateSelectList(JSON.parse(result));
    });
}

MatchPhoto.populateExistingMatchPhotosList = function()
{
    // get a list of photo object names from the FormIt side
    window.FormItInterface.CallMethod("MatchPhoto.getAllPhotoObjects", {}, function(result)
    {
        // first, clear the list if there are any items listed
        MatchPhoto.clearExistingMatchPhotosList();

        // store the list of known match photo object names
        // for other functions to access
        MatchPhoto.allKnownMatchPhotoObjectNames = [];
        MatchPhoto.allKnownMatchPhotoObjectLayerCheckboxModules = [];
        let parsedResult = JSON.parse(result);

        // sort the results alphabetically
        parsedResult.sort();

        // for each item in the array, create a list item in the container
        for (var i = 0; i < parsedResult.length; i++)
        {
            let listItemElement = MatchPhoto.createExistingMatchPhotoListItem(parsedResult[i]);
            MatchPhoto.existingMatchPhotoListContainer.element.appendChild(listItemElement);
            MatchPhoto.allKnownMatchPhotoObjectNames.push(parsedResult[i]);
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

// synchronize individual visibility checkbox with the layer visibility state
MatchPhoto.synchronizeMatchPhotoVisibilityCheckboxWithLayerState = function(checkboxModule, matchPhotoObjectName)
{
    let args = { "matchPhotoObjectName" : matchPhotoObjectName };

    window.FormItInterface.CallMethod("MatchPhoto.getMatchPhotoLayerVisibilityState", args, function(result)
    {
        checkboxModule.getInput().checked = JSON.parse(result);
    });
}

// synchronize all visibility checkboxes with the layer visibility state
MatchPhoto.synchronizeAllMatchPhotoVisibilityCheckboxesWithLayerState = function()
{
    for (var i = 0; i < MatchPhoto.allKnownMatchPhotoObjectNames.length; i++)
    {
        MatchPhoto.synchronizeMatchPhotoVisibilityCheckboxWithLayerState(MatchPhoto.allKnownMatchPhotoObjectLayerCheckboxModules[i], MatchPhoto.allKnownMatchPhotoObjectNames[i]);
    }
}

// the function called when clicking the visibility checkbox
// can also be invoked by other functions to simulate clicking the checkbox
MatchPhoto.toggleMatchPhotoLayerVisibility = function(checkboxElement, matchPhotoObjectName)
{
    let args = { "bIsChecked" : checkboxElement.getInput().checked, "matchPhotoObjectName" : matchPhotoObjectName };

    window.FormItInterface.CallMethod("MatchPhoto.setMatchPhotoLayerVisibilityByArgs", args, function(result)
    {

    }); 
}

// populate the given text input element with the string equivalent of the value
MatchPhoto.populateInputWithConvertedValueString = function(input, value)
{
    // if value is not a number, try converting to one
    if (!Number(value))
    {
        let args = { "string" : value };
        window.FormItInterface.CallMethod("MatchPhoto.convertStringToLinearValue", args, function(result)
        {
            let args = { "linearValue" : JSON.parse(result) };
            window.FormItInterface.CallMethod("MatchPhoto.convertLinearValueToString", args, function(result)
            {
                input.getInput().value = JSON.parse(result);   
            }); 
        }); 
    }
    else
    {
        value = Number(value) ? value : MatchPhoto.defaultCameraPlaneDistance;

        let args = { "linearValue" : value };
        window.FormItInterface.CallMethod("MatchPhoto.convertLinearValueToString", args, function(result)
        {
            input.getInput().value = JSON.parse(result);   
        }); 
    }

}

// start a Match Photo session using the specified material name
MatchPhoto.startMatchPhotoMode = function(matchPhotoObjectName, cameraPlaneDistance)
{
    MatchPhoto.bIsMatchPhotoModeActive = true;

    MatchPhoto.toggleActiveOrInactiveMatchPhotoModeUI();

    let args = { "bIsMatchPhotoModeActive" : MatchPhoto.bIsMatchPhotoModeActive, "matchPhotoObjectName" : matchPhotoObjectName, "cameraPlaneDistance" : cameraPlaneDistance };

    // initialize the match photo object
    window.FormItInterface.CallMethod("MatchPhoto.initializeMatchPhotoObject", args, function(result)
    {

    });

    // start or stop subscribing to the camera changed message
    window.FormItInterface.CallMethod("MatchPhoto.toggleSubscribeToCameraChangedMessage", args, function(result)
    {

    });
}

// start a Match Photo session for a new match photo
// with checks for valid material name and material name already in use
MatchPhoto.startMatchPhotoModeForNewObject = function(matchPhotoObjectName, cameraPlaneDistance)
{
    let args = { "matchPhotoObjectName" : matchPhotoObjectName };

    // first, check if the given photo object name (material name) is valid
    window.FormItInterface.CallMethod("MatchPhoto.getIsMaterialNameValid", args, function(result)
    {
        // only proceed if the given material name is valid
        if (JSON.parse(result) == true)
        {
            // then, check that the given material name isn't already in use
            window.FormItInterface.CallMethod("MatchPhoto.getIsMaterialNameAlreadyUsedForMatchPhoto", args, function(result)
            {
                // only proceed if the given material name not used
                if (JSON.parse(result) == false)
                {
                    MatchPhoto.startMatchPhotoMode(matchPhotoObjectName, cameraPlaneDistance);
                }
            });    
        }   
    });
}

// start a Match Photo session for an existing match photo object
// and get the updated material name if it's been renamed since this object was created
MatchPhoto.startMatchPhotoModeForExistingObject = function(matchPhotoObjectName, cameraPlaneDistance)
{    
    let args = { "matchPhotoObjectName" : matchPhotoObjectName };

    // get the material ID from the object attribute
    window.FormItInterface.CallMethod("MatchPhoto.getMaterialIDFromAttribute", args, function(result)
    {
        let args = { "originalMaterialName" : matchPhotoObjectName, "materialID" : JSON.parse(result) };

        // get the updated material name from the ID
        window.FormItInterface.CallMethod("MatchPhoto.updateMaterialNameAttributeFromID", args, function(result)
        {
            let newMaterialName = JSON.parse(result);

            // only proceed if the given material name is valid
            if (newMaterialName)
            {
                MatchPhoto.startMatchPhotoMode(newMaterialName, cameraPlaneDistance);
                MatchPhoto.activeMatchPhotoMaterialSelectInput.getInput().value = newMaterialName;
            }
            // otherwise, this material was probably deleted
            else
            {
                
            }
        });
    });
}

// while Match Photo mode is running, rebuild the active object with the given settings
// for example, specifying a new material or focal length
MatchPhoto.rebuildMatchPhotoObject = function(oldMatchPhotoObjectName, newMatchPhotoObjectName, cameraPlaneDistance)
{
    let deleteArgs = { "photoObjectName" : oldMatchPhotoObjectName };

    // find the match photo object and delete it
    window.FormItInterface.CallMethod("MatchPhoto.deleteMatchPhotoObject", deleteArgs, function(result)
    {

    });

    let initializeArgs = { "matchPhotoObjectName" : newMatchPhotoObjectName, "cameraPlaneDistance" : cameraPlaneDistance };

    // initialize the new Match Photo object
    window.FormItInterface.CallMethod("MatchPhoto.initializeMatchPhotoObject", initializeArgs, function(result)
    {

    });

    // for some reason, the first initialization results in the photo painted upside-down
    // so call the update function to fix this
    window.FormItInterface.CallMethod("MatchPhoto.createOrUpdateActivePhotoObjectToMatchCamera", { }, function(result)
    {

    });
}

// the function used when the user is done editing the name or focal length field
// first it checks whether the specified name is valid before continuing
MatchPhoto.tryRebuildPhotoObject = function(oldMatchPhotoObjectName, newMatchPhotoObjectName, cameraPlaneDistance)
{
    let args = { "matchPhotoObjectName" : newMatchPhotoObjectName };

    // first, check if the given photo object name (material name) is valid
    window.FormItInterface.CallMethod("MatchPhoto.getIsMaterialNameValid", args, function(result)
    {
        // only proceed if the given material name is valid
        if (JSON.parse(result) == true)
        {
            // then, check that the given material name isn't already in use
            // first, check if the given photo object name (material name) is valid
            window.FormItInterface.CallMethod("MatchPhoto.getIsMaterialNameAlreadyUsedForMatchPhoto", args, function(result)
            {
                // only proceed if the given material name not used
                if (JSON.parse(result) == false)
                {
                    MatchPhoto.rebuildMatchPhotoObject(oldMatchPhotoObjectName, newMatchPhotoObjectName, cameraPlaneDistance);
                }
                else
                {
                    MatchPhoto.activeMatchPhotoMaterialSelectInput.getInput().value = oldMatchPhotoObjectName;
                }
            });    
        }
        else
        {
            MatchPhoto.activeMatchPhotoMaterialSelectInput.getInput().value = oldMatchPhotoObjectName;
        } 
    });
}

// end a Match Photo session
MatchPhoto.endMatchPhotoMode = function(matchPhotoObjectName)
{
    MatchPhoto.bIsMatchPhotoModeActive = false;

    MatchPhoto.toggleActiveOrInactiveMatchPhotoModeUI();

    let args = { "bIsMatchPhotoModeActive" : MatchPhoto.bIsMatchPhotoModeActive, "matchPhotoObjectName" : matchPhotoObjectName, "cameraPlaneDistance" : MatchPhoto.activeMatchPhotoCameraPlaneDistanceInput.getInput().value };

    // start or stop subscribing to the camera changed message
    window.FormItInterface.CallMethod("MatchPhoto.toggleSubscribeToCameraChangedMessage", args, function(result)
    {

    });

    MatchPhoto.populateExistingMatchPhotosList();
}