
/*-----------------------------------------------------------------------*
        * Controller Name   : BaseController.js
        * Description       :
        *  Base controller for the Production Data Submission application.
        *  This reusable base class en@oncapsulates common functionalities and utilities
        *  shared across all application controllers, promoting consistency
        *
        *   Key responsibilities include:
        *     • Accessing and managing view and component models.
        *     • Handling routing and navigation operations..
        *     • Providing i18n resource bundle access for localization.
        *     • Supporting OData interactions.
        *     • Providing generic value help (F4) dialog initialization and handling.
        *     
        *     
        * ObjectID          : Production Data Submission APP
        * Author            : Sharath H N
        * Date              : 
        * Business Contact  :Ajinkya Kharade
        *-----------------------------------------------------------------------*
        * Misc. Notes       : NA
        *-----------------------------------------------------------------------*
        * Modification History
        * 1) Request#       : REQ0032723
        *    Developer      : Sharath
        *    Date           :17/12/2025
        *    Incident       : N/A
        *    CMS            :
        *    Description    : Added logic to get user details from IAS 
        *-----------------------------------------------------------------------*
        */

sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/core/UIComponent",
    "sap/m/library"
], function (Controller, UIComponent, mobileLibrary) {
    "use strict";

    // shortcut for sap.m.URLHelper
    var URLHelper = mobileLibrary.URLHelper;

    return Controller.extend("com.monsterenergy.qm.me.qm.qateam.controller.BaseController", {
        /**
         * Convenience  method for accessing the router.
         * @public
         * @returns {sap.ui.core.routing.Router} the router for this component
         */
        getRouter: function () {
            return UIComponent.getRouterFor(this);
        },

        /**
         * Convenience method for getting the view model by name.
         * @public
         * @param {string} [sName] the model name
         * @returns {sap.ui.model.Model} the model instance
         */
        getModel: function (sName) {
            return this.getView().getModel(sName);
        },

        /**
         * Convenience method for setting the view model.
         * @public
         * @param {sap.ui.model.Model} oModel the model instance
         * @param {string} sName the model name
         * @returns {sap.ui.mvc.View} the view instance
         */
        setModel: function (oModel, sName) {
            return this.getView().setModel(oModel, sName);
        },

        /**
         * Getter for the resource bundle.
         * @public
         * @returns {sap.ui.model.resource.ResourceModel} the resourceModel of the component
         */
        getResourceBundle: function () {
            return this.getOwnerComponent().getModel("i18n").getResourceBundle();
        },


        /*
       _getIasDetails: function () {
            var appId = this.getOwnerComponent().getManifestEntry("/sap.app/id");
            var appPath = appId.replaceAll(".", "/");
            var url = jQuery.sap.getModulePath(appPath) + "/user-api/attributes";

            return new Promise(function (resolve, reject) {
                $.ajax({
                    url: url,
                    type: 'GET',
                    contentType: 'application/json',
                    success: function (data) {
                        var PlantCode = data.unique_Identifier || data[" unique_Identifier"];
                        PlantCode ? resolve({ Plant: PlantCode, PlantName: "" }) : reject("No plant code maintained. Contact Administrator.");
                    },
                    error: function () {
                        reject("Error fetching IAS data");
                    }
                });
            });
        },
*/

        _getIasDetails: function () {
            const appId = this.getOwnerComponent().getManifestEntry("/sap.app/id");
            const appPath = appId.replaceAll(".", "/");
            const appModulePath = jQuery.sap.getModulePath(appPath);
            const url = appModulePath + "/user-api/attributes";

            return new Promise((resolve, reject) => {
                $.ajax({
                    url: url,
                    type: 'GET',
                    contentType: 'application/json',
                    success: function (data) {
                        const oView = this.getView();
                        //++BOC- (REQ0032717)changes to extract the User details from IAS - Changes done on 17/12/2025 by Sharath
                        const firstName = data.firstname || "";
                        const lastName = data.lastname || "";
                        const email = Array.isArray(data.email) ? data.email[0] : data.email;
                        //++EOC
                        const groupList = Array.isArray(data.Groups)
                            ? data.Groups
                            : typeof data.Groups === "string"
                                ? data.Groups.split(",").map(s => s.trim())
                                : [];

                        const isQMUser = groupList.includes("BTP_QM_INT_QCEMEA");

                        if (isQMUser) {
                            oView.byId("plantFilterGroupItemMultiPlant")?.setVisible(true);
                            oView.byId("plantMIput")?.setVisible(true);
                            oView.byId("plantFilterGroupItemplantname")?.setVisible(false);
                            oView.byId("plantName")?.setVisible(false);
                            oView.byId("materialMInput")?.setEnabled(false);
                            oView.byId("batchMInput")?.setEnabled(false);
                            oView.byId("formulaMInput")?.setEnabled(false);
                            oView.byId("createButton")?.setVisible(false);

                            resolve({
                                isQMUser: true,
                                Plant: null,
                                PlantName: null,
                                email: data.email,
                                email: email, //++Added by sharath(REQ0032717)
                                firstName: firstName,// ++Added by sharath(REQ0032717)
                                lastName: lastName//++Added by sharath(REQ0032717)
                            });
                            return;
                        }

                        oView.byId("plantFilterGroupItemMultiPlant")?.setVisible(false);
                        oView.byId("plantMIput")?.setVisible(false);
                        oView.byId("plantFilterGroupItemplantname")?.setVisible(true);
                        oView.byId("plantName")?.setVisible(true);
                        oView.byId("createButton")?.setVisible(true);
                        oView.byId("materialMInput")?.setEnabled(true);
                        oView.byId("batchMInput")?.setEnabled(true);
                        oView.byId("formulaMInput")?.setEnabled(true);

                        const PlantCode = (data.unique_Identifier || data[" unique_Identifier"] || "").trim();
                        const PlantName = data.custom_plants_name?.trim() || "";

                        if (PlantCode) {
                            resolve({
                                isQMUser: false,
                                Plant: PlantCode,
                                PlantName: PlantName,
                                email: data.email,
                                email: email,//++Added by sharath on 17/12/2025 (REQ0032717)
                                firstName: firstName,//++Added by sharath on  17/12/2025 (REQ0032717)
                                lastName: lastName//++Added by Sharath on 17/12/2025 (REQ0032717)
                      
               
                            });
                        } else {
                            reject();
                        }
                    }.bind(this),
                    error: function () {
                        reject();
                    }
                });
            });
        },

        /**
         * Event handler when the share by E-Mail button has been clicked
         * @public
         */

        //Deprecated – not in use
        //  Reason: Email sharing functionality is no longer required
        //Deprecated by Sharath on 17/12/2025 (REQ0032717)
        /*
        onShareEmailPress: function () {
            var oViewModel = (this.getModel("objectView") || this.getModel("worklistView"));
            URLHelper.triggerEmail(
                null,
                oViewModel.getProperty("/shareSendEmailSubject"),
                oViewModel.getProperty("/shareSendEmailMessage")
            );
        },
        */
        readDataFromODataModel: function (sPath, aFilters) {
            var oThis = this;
            return new Promise(function (resolve, reject) {
                oThis.getOwnerComponent().getModel().read(sPath, {
                    filters: aFilters,
                    success: function (oData, oResopnse) {
                        resolve(oData);
                    },
                    error: function (oError, oResopnse) {
                        if (oResopnse !== null && oResopnse !== undefined && oResopnse.headers["sap-message"] !== null && oResopnse.headers["sap-message"] !== undefined) {
                            var sHdrMessage = oResopnse.headers["sap-message"];
                            var oHdrMessageObject = JSON.parse(sHdrMessage);
                            reject(oHdrMessageObject.message);
                        } else {
                            reject("Error in Server");
                        }
                    }
                })
            })
        }

    });
});