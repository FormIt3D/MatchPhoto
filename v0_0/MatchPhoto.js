if (typeof MatchPhoto == 'undefined')
{
    MatchPhoto = {};
}

/*** web/UI code - runs natively in the plugin process ***/

MatchPhoto.initializeUI = function()
{
    // create an overall container for all objects that comprise the "content" of the plugin
    // everything except the footer
    let contentContainer = document.createElement('div');
    contentContainer.id = 'contentContainer';
    contentContainer.className = 'contentContainer'
    contentContainer.style.overflowY = 'scroll';
    window.document.body.appendChild(contentContainer);

    // create the header
    contentContainer.appendChild(new FormIt.PluginUI.HeaderModule('Match Photo', 'Match a photo to the 3D scene.').element);

    // add the module that tells customers using old clients that this plugin requires a newer version of FormIt
    contentContainer.appendChild(new FormIt.PluginUI.UnsupportedVersionModule('2023.0').element);

    // create the footer
    document.body.appendChild(new FormIt.PluginUI.FooterModule().element);
}