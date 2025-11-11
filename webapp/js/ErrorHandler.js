sap.ui.define([
    "sap/ui/base/Object",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator"
], function (UI5Object, Filter, FilterOperator) {
    "use strict";

    return UI5Object.extend("com.monsterenergy.qm.me.qm.qateam.js.ErrorHandler", {

        constructor: function (oComponent) {
            var oMessageManager = sap.ui.getCore().getMessageManager();
            var oMessageModel = oMessageManager.getMessageModel();
            var oResourceBundle = oComponent.getModel("i18n").getResourceBundle();

            this._bMessageOpen = false;

            this.oMessageModelBinding = oMessageModel.bindList("/", undefined,
                [], new Filter("technical", FilterOperator.EQ, true));

            this.oMessageModelBinding.attachChange(function (oEvent) {
                var aContexts = oEvent.getSource().getContexts();
                var aMessages = [];
                var aErrorMessage = [];

                if (this._bMessageOpen || !aContexts.length) {
                    return;
                }

                // Extract and remove the technical messages
                aContexts.forEach(function (oContext) {
                    aMessages.push(oContext.getObject());
                });

                oMessageManager.removeMessages(aMessages);

                for (var i = 0; i < aMessages.length; i++) {
                    if (aMessages[i].message === "An exception was raised." ||
                        aMessages[i].message === "An exception was raised" ||
                        aMessages[i].type !== "Error") {
                        continue;
                    }
                    aErrorMessage.push({
                        type: 'Error',
                        title: 'Error Message',
                        subtitle: aMessages[i].message,
                        description: aMessages[i].message
                    });
                }
                this._showServiceError(aErrorMessage);
            }, this);
        },

        _showServiceError: function (aErrorMessage) {
            this._bMessageOpen = true;
            var oThis = this;
            var oMessageModel = new sap.ui.model.json.JSONModel(aErrorMessage);
            var oMessageTemplate = new sap.m.MessageItem({
                type: '{ErrorModel>type}',
                title: '{ErrorModel>title}',
                description: '{ErrorModel>description}',
                subtitle: '{ErrorModel>subtitle}'
            });
            var oMessageView = new sap.m.MessageView({
                showDetailsPageHeader: false,
                itemSelect: function () {
                    oBackButton.setVisible(true);
                },
                items: {
                    path: "ErrorModel>/",
                    template: oMessageTemplate
                }
            }).setModel(oMessageModel, "ErrorModel");
            var oBackButton = new sap.m.Button({
                icon: "sap-icon://nav-back",
                visible: false,
                press: function () {
                    oMessageView.navigateBack();
                    this.setVisible(false);
                }
            });

            var oDialog = new sap.m.Dialog({
                resizable: true,
                content: oMessageView,
                state: 'Error',
                afterClose: function () {
                    oThis._bMessageOpen = false;
                    oDialog.destroy();
                },
                beginButton: new sap.m.Button({
                    press: function () {
                        this.getParent().close();
                    },
                    text: "Close"
                }),
                customHeader: new sap.m.Bar({
                    contentLeft: [oBackButton],
                    contentMiddle: [
                        new sap.m.Title({
                            text: "Error"
                        })
                    ]
                }),
                contentHeight: "50%",
                contentWidth: "50%",
                verticalScrolling: false
            });

            oDialog.open();
        }
    });
});