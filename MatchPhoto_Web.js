window.MatchPhoto = window.MatchPhoto || {};

/*** web/UI code - runs natively in the plugin process ***/

// temporary checkbox to disable camera changed message
MatchPhoto.enabledCheckboxID = 'EnableMatchPhotoCheckbox';

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

    let enabledCheckbox = new FormIt.PluginUI.CheckboxModule('Enabled?', 'enabledCheckbox', 'multiModuleContainer', MatchPhoto.enabledCheckboxID);
    contentContainer.appendChild(enabledCheckbox.element);
    document.getElementById(MatchPhoto.enabledCheckboxID).checked = false;
    document.getElementById(MatchPhoto.enabledCheckboxID).onclick = MatchPhoto.toggleSubscribeToCameraMessages;

    // create the footer
    document.body.appendChild(new FormIt.PluginUI.FooterModule().element);
}

// tell the client to subscribe to the kCameraChanged message 
// based on the checkbox toggle state
MatchPhoto.toggleSubscribeToCameraMessages = function()
{
    let isEnabled = document.getElementById(MatchPhoto.enabledCheckboxID).checked;

    var args = { "bToggle" : isEnabled };

    window.FormItInterface.CallMethod("MatchPhoto.subscribeToCameraChangedMessageByArgs", args, function(result)
    {

    });

    window.FormItInterface.CallMethod("MatchPhoto.subscribeToCameraStartedMessageByArgs", args, function(result)
    {

    });
}