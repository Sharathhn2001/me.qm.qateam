sap.ui.define([
    "sap/ui/core/UIComponent",
    "com/monsterenergy/qm/me/qm/qateam/model/models",
    "com/monsterenergy/qm/me/qm/qateam/js/ErrorHandler"
], (UIComponent, models, ErrorHandler) => {
    "use strict";

    return UIComponent.extend("com.monsterenergy.qm.me.qm.qateam.Component", {
        metadata: {
            manifest: "json",
            interfaces: [
                "sap.ui.core.IAsyncContentCreation"
            ]
        },

        init() {
            // call the base component's init function
            UIComponent.prototype.init.apply(this, arguments);

            // set the device model
            this.setModel(models.createDeviceModel(), "device");

            // initialize the error handler with the component
            this._oErrorHandler = new ErrorHandler(this);

            // enable routing
            this.getRouter().initialize();

            jQuery.getScript("https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js")
                .done(function () {
                    Log.info("XLSX library loaded");
                })
                .fail(function () {
                    Log.error("Failed to load XLSX library");
                });
        
        }
    });
});