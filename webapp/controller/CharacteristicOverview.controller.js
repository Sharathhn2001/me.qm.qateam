sap.ui.define(
  [
    "com/monsterenergy/qm/me/qm/qateam/controller/BaseController",
    "com/monsterenergy/qm/me/qm/qateam/js/Formatter",
    "sap/ui/model/json/JSONModel",
    "sap/ui/core/routing/History",
    "sap/m/MessageBox",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/m/ColumnListItem",
    "sap/m/VBox",
    "sap/m/Title",
    "sap/m/ObjectStatus",
    "sap/m/Text",
    "sap/m/Input",
    "sap/m/Button",
    "sap/m/TextArea",
    "sap/m/RadioButtonGroup",
    "sap/m/RadioButton",
    "sap/m/Dialog",
    "sap/m/ButtonType",
    "sap/m/BusyDialog",
    "sap/m/Label",
    "sap/m/MessageToast",
    "sap/m/SelectDialog",
    "sap/m/MessageItem",
    "sap/m/MessageView",
    "sap/m/Bar",
    "sap/ui/layout/form/SimpleForm",
    "sap/m/Toolbar",
    "sap/m/ToolbarSpacer",
    "sap/m/TableSelectDialog",
    "sap/m/Column",
    "sap/m/plugins/UploadSetwithTable",
    "sap/ui/core/BusyIndicator",
    "sap/ui/core/Icon",
    "sap/m/HBox",
    "sap/m/CheckBox",
    "sap/m/SegmentedButtonItem",
    "sap/m/DatePicker",
    "sap/m/TimePicker",
  ],
  function (BaseController, Formatter, JSONModel, History, MessageBox, Filter, FilterOperator,
    ColumnListItem, VBox, Title, ObjectStatus, Text, Input, Button, TextArea, RadioButtonGroup, RadioButton, Dialog,
    ButtonType, BusyDialog, Label, MessageToast, SelectDialog, MessageItem,
    MessageView, Bar, SimpleForm, Toolbar, ToolbarSpacer, TableSelectDialog, Column, UploadSetwithTable,
    BusyIndicator, Icon, HBox, CheckBox, SegmentedButtonItem, DatePicker, TimePicker,) {
    "use strict";

    return BaseController.extend("com.monsterenergy.qm.me.qm.qateam.controller.CharacteristicOverview", {
      formatter: Formatter,

      /**
       * Called when the worklist controller is instantiated.
       * @public
       */
      onInit: function () {
        /**
         * Provides runtime information for the device the UI5 app is running on as a JSONModel.
         * @returns {sap.ui.model.json.JSONModel} The device model.
         */

        // Model used to manipulate control states. The chosen values make sure,
        // detail page shows busy indication immediately so there is no break in
        // between the busy indication for loading the view's meta data

        var oDataModel = new JSONModel({
          Plant: "",
          Ebeln: "",
          Ebelp: "",
          Material: "",
          Batch: "",
          Formula: "",
          IsSubmitNew: ""
          // IsQMUser: false
        });
        oDataModel.setSizeLimit(100000);
        this.setModel(oDataModel, "DataModel");


        var oViewModel = new JSONModel({
          busy: false,
          delay: 0,
          screenMode: "view",
          isQMUser: false,
          rrEditable: true,
          CharEditable: true,
          InspPointFlag: "A",
          UdstatusEdit: false

        });
        oViewModel.setSizeLimit(100000);
        this.getRouter().getRoute("RouteCharacteristicOverview").attachPatternMatched(this._onObjectMatched, this);
        this.getView().setModel(oViewModel, "ViewModel"); // Use getView().setModel

        this.oResult = {
          status: "",
          fileName: ""
        };
        this.iUploadCount = 0;
        this.iUploadCountSuccess = 0;
        this.iUploadCountFailed = 0;
        this.iUploadCountTerminated = 0;
        this.aAttachementMsg = [];

        this.sInspPointFlag = "A";

        this._oResultsTable = this.getView().byId("charResultTable");
        this._oResultsTable.setModel(new JSONModel({
          InspLotCharReq: [],
          InspPoint: {},
          InspCharResults: [],
        }))

        this.fetchStatus();


        // this._getInspectionDetails();
      },

      /**
         * Event handler  for navigating back.
         * It there is a history entry we go one step back in the browser history
         * If not, it will replace the current entry of the browser history with the worklist route.
         * @public
         */
      onNavBack: function () {
        var oThis = this;
        var sPreviousHash = History.getInstance().getPreviousHash();

        if (sPreviousHash !== undefined) {
          history.go(-1);
        } else {
          oThis.getRouter().navTo("RouteHomePage", {}, true);
        }
      },

      /**
        * Binds the view to the object path.
        * @function
        * @param {sap.ui.base.Event} oEvent pattern match event in route 'object'
        * @private
        */
      /*
     _onObjectMatched: async function (oEvent) {
       var oArguments = oEvent.getParameter("arguments");
       var oAttachmentTable = this.getView().byId("table-uploadSet");
       var oAttachmentModel = oAttachmentTable.getModel("AttachementModel");

       this.sPlant = window.decodeURIComponent(oArguments.Plant);
       this.sMaterial = window.decodeURIComponent(oArguments.Material);
       this.sBatch = window.decodeURIComponent(oArguments.Batch);
       this.sSubmitterName = window.decodeURIComponent(oArguments.SubmitterName);
       this.sSubmitterEmail = window.decodeURIComponent(oArguments.SubmitterEmail);
       this.bIsSubmitNew = window.decodeURIComponent(oArguments.IsSubmitNew);

       if (this.bIsSubmitNew === "true") {
         this.getModel("ViewModel").setProperty("/screenMode", "edit");
       } else {
         this.getModel("ViewModel").setProperty("/screenMode", "view");
       }

       this.getModel("ViewModel").setProperty("/ShowSelectSample", true);
       this.getModel("ViewModel").setProperty("/ShowSaveNext", true);
       this.getModel("ViewModel").setProperty("/ShowRemarks", true);

       this.getView().byId("seg_button").removeAllItems();

       this.getModel("ViewModel").setProperty("/InspectionPointDesc", "");

       this._setEmptyDataToResultsTable();

       this.setDirtyState(false);

       await this._getInspectionDetails();


       if (oAttachmentModel) {
         oAttachmentModel.setData({});
         this.deselectAllItems();
       }
     },
     */
      _onObjectMatched: async function (oEvent) {
        var oArguments = oEvent.getParameter("arguments");
        var oAttachmentTable = this.getView().byId("table-uploadSet");
        var oAttachmentModel = oAttachmentTable.getModel("AttachementModel");

        this.sPlant = window.decodeURIComponent(oArguments.Plant);
        this.sEbeln = window.decodeURIComponent(oArguments.Ebeln);
        this.sEbelp = window.decodeURIComponent(oArguments.Ebelp);
        this.sMaterial = window.decodeURIComponent(oArguments.Material);
        this.sBatch = window.decodeURIComponent(oArguments.Batch);
        this.sFormula = window.decodeURIComponent(oArguments.Formula);
        // this.sSubmitterName = window.decodeURIComponent(oArguments.SubmitterName);
        //this.sSubmitterEmail = window.decodeURIComponent(oArguments.SubmitterEmail);
        this.bIsSubmitNew = window.decodeURIComponent(oArguments.IsSubmitNew);
        const isQMUserString = decodeURIComponent(oArguments.IsQMUser || "");
        const isQMUser = isQMUserString.toLowerCase() === "true";
        this.getModel("ViewModel").setProperty("/isQMUser", isQMUser);

        const oData = {
          Plant: this.sPlant,
          Ebeln: this.sEbeln,
          Ebelp: this.sEbelp,
          Material: this.sMaterial,
          Batch: this.sBatch,
          Formula: this.sFormula,
          IsSubmitNew: this.bIsSubmitNew
          // IsQMUser: isQMUser
        };

        const oDataModel = this.getModel("DataModel");
        oDataModel.setData(oData);


        if (this.bIsSubmitNew === "true") {
          this.getModel("ViewModel").setProperty("/screenMode", "edit");
        } else {
          this.getModel("ViewModel").setProperty("/screenMode", "view");
        }

        this.getModel("ViewModel").setProperty("/ShowSelectSample", true);
        this.getModel("ViewModel").setProperty("/ShowSaveNext", true);
        this.getModel("ViewModel").setProperty("/ShowRemarks", true);

        this.getView().byId("seg_button").removeAllItems();

        this.getModel("ViewModel").setProperty("/InspectionPointDesc", "");

        this._setEmptyDataToResultsTable();

        this.setDirtyState(false);

        await this._getInspectionDetails();
        await this._getIasDetails();


        if (oAttachmentModel) {
          oAttachmentModel.setData({});
          this.deselectAllItems();
        }
      },
      _setEmptyDataToResultsTable() {
        this._oResultsTable.getModel().setData({
          InspLotCharReq: [],
          InspPoint: {},
          InspCharResults: [],
        });
      },

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

              this.sFirstName = data.firstname || "";
              this.sLastName = data.lastname || "";
              this.sFullName = `${this.sFirstName} ${this.sLastName}`.trim();

              if (Array.isArray(data.email)) {
                this.sEmail = data.email[0] || "";
              } else if (typeof data.email === "string") {
                this.sEmail = data.email;
              } else {
                this.sEmail = "";
              }

              resolve({
                firstName: this.sFirstName,
                lastName: this.sLastName,
                fullName: this.sFullName,
                email: this.sEmail
              });

            }.bind(this),
            error: function (err) {
              reject(err);
            }
          });
        });
      },

      fetchStatus: async function () {
        BusyIndicator.show();

        try {
          let aFilters = [];


          if (this.sInspLot) {
            aFilters.push(new sap.ui.model.Filter("Prueflos", sap.ui.model.FilterOperator.EQ, this.sInspLot));
          }

          let oData = await this.readDataFromODataModel("/UserStatusF4Set", aFilters);

          if (oData.results && oData.results.length > 0) {
            const oJsonModel = new sap.ui.model.json.JSONModel({ results: oData.results });
            oJsonModel.setSizeLimit(1000000);
            this.getView().setModel(oJsonModel, "UserStatusData");
            return true;
          } else {
            return false;
          }
        } catch (error) {
          return false;
        } finally {
          BusyIndicator.hide();
        }
      },


      onStatusChange: function (oEvent) {
        this.setDirtyState(true);
      },


      onEditPress: function () {
        this.getModel("ViewModel").setProperty("/screenMode", "edit");
      },
      setDirtyState: function (bValue) {
        //set the DirtyState flag so that when user tries backNavigation, warning message is thrown
        // sap.ushell.Container.setDirtyFlag(bValue);
        this.getModel("ViewModel").setProperty("/IsDirty", bValue);
      },
      getDirtyState: function () {
        return sap.ushell.Container.getDirtyFlag();
      },

      _getInspectionDetails: async function () {
        var aFilters = [new Filter({ path: "Werk", operator: FilterOperator.EQ, value1: this.sPlant }),
        new Filter({ path: "Ebeln", operator: FilterOperator.EQ, value1: this.sEbeln }),
        new Filter({ path: "Ebelp", operator: FilterOperator.EQ, value1: this.sEbelp }),
        new Filter({ path: "Matnr", operator: FilterOperator.EQ, value1: this.sMaterial }),
        new Filter({ path: "Zzhbcformula", operator: FilterOperator.EQ, value1: this.sFormula }),
        new Filter({ path: "Charg", operator: FilterOperator.EQ, value1: this.sBatch })];
        var oInspDetails = { results: [] };

        BusyIndicator.show();
        try {
          oInspDetails = await this.readDataFromODataModel("/InspectionDetailsSet", aFilters);
        } catch (error) { }
        if (oInspDetails && oInspDetails.results.length > 0) {
          this.getView().setModel(new JSONModel(oInspDetails.results[0]), "InspectionDetailsModel");

          this.sInspLot = oInspDetails.results[0].Prueflos;

          var oStatusDesc = oInspDetails.results[0].Statusdesc;
          var bCharEditable = oStatusDesc === "Submitted (Final)" ? false : true;
          this.getModel("ViewModel").setProperty("/CharEditable", bCharEditable);

          var sCodeValText = oInspDetails.results[0].CodeValText;
          var sVbewertung = oInspDetails.results[0].VBEWERTUNG;
          // var bUdEdit = (!sCodeValText || sCodeValText.trim() === "" || sCodeValText === "Not valuated");
          var bUdEdit = (!sCodeValText || sCodeValText.trim() === "" || sCodeValText === "Not valued"
            || !sVbewertung || sVbewertung.trim() === "");

          this.getModel("ViewModel").setProperty("/UdstatusEdit", bUdEdit);


          this.getModel("ViewModel").setProperty("/InspLot", this.sInspLot);
          this.getModel("ViewModel").setProperty("/InspPointFlag", this.sInspPointFlag);
          await this._addSematicButtonItems();
        } else {
          this.getView().setModel(new JSONModel(oInspDetails), "InspectionDetailsModel");
        }
        BusyIndicator.hide();
        return new Promise((resolve) => resolve(oInspDetails));
      },
      _addSematicButtonItems: async function () {
        var oSegButton = this.getView().byId("seg_button");
        var aValues = await Promise.all([this._getInspectionOperationSeq(), this._getInspectionOperations()]);
        var oOperSeq = aValues[0];
        var oOper = aValues[1];
        var oFound = null;
        var aValidOperations = [];
        var iCounter = 0;

        if (oOperSeq && oOperSeq.results.length > 0) {
          this.getModel("ViewModel").setProperty("/OperationSeq", oOperSeq.results);
          this.getModel("ViewModel").setProperty("/Operations", oOper.results);

          for (var i = 0; i < oOperSeq.results.length; i++) {
            oFound = oOper.results.find(oResult => oResult.Inspoper === oOperSeq.results[i].Inspoper);
            if (!oFound) {
              continue;
            }
            if (iCounter === 0) {
              this.sOperation = oFound.Inspoper;
              this.getView().byId("generalSection").setTitle(oFound.TxtOper);
              this.getModel("ViewModel").setProperty("/Operation", this.sOperation);
            }
            iCounter++;
            aValidOperations.push(oFound);
            oSegButton.addItem(new SegmentedButtonItem({ text: oFound.TxtOper, key: oFound.Inspoper, tooltip: oFound.TxtOper }))
          }
          this.getModel("ViewModel").setProperty("/ValidOperations", aValidOperations);

          if (aValidOperations.length === 0) {
            MessageBox.error(this.getResourceBundle().getText("operNotFound"));
            this.getModel("ViewModel").setProperty("/ShowSelectSample", false);
            this.getModel("ViewModel").setProperty("/ShowSaveNext", false);
            this.bIsOpeationFound = false;
            this.getView().byId("generalSection").setVisible(false);
            this.getView().byId("commentsSection").setVisible(false);
            this.getView().byId("attachmentSection").setVisible(false);
            return;
          } else {
            this.getView().byId("generalSection").setVisible(true);
            this.getView().byId("commentsSection").setVisible(true);
            this.getView().byId("attachmentSection").setVisible(true);
          }
          this.bIsOpeationFound = true;
          await this._getInspPointSequence();
          await this._getInspectionPoints();
        } else {
          this.getModel("ViewModel").setProperty("/Operations", []);
        }
      },
      _getInspectionOperationSeq: async function () {
        var aFilters = [new Filter({ path: "Insplot", operator: FilterOperator.EQ, value1: this.sInspLot })];
        var oInspOperation = { results: [] };

        try {
          oInspOperation = await this.readDataFromODataModel("/InspOperSeqSet", aFilters);
        } catch (error) { }
        return new Promise((resolve) => resolve(oInspOperation));
      },
      _getInspectionOperations: async function () {
        var aFilters = [new Filter({ path: "Insplot", operator: FilterOperator.EQ, value1: this.sInspLot })];
        var oInspOperation = { results: [] };

        try {
          oInspOperation = await this.readDataFromODataModel("/InspOperSet", aFilters);
        } catch (error) { }
        return new Promise((resolve) => resolve(oInspOperation));
      },
      _getInspectionPoints: async function () {
        var oThis = this;
        var oInspPointSet = { results: [] };

        try {
          oInspPointSet = await this.readDataFromODataModel("/InspPointsSet",
            [new Filter({ path: "Insplot", operator: FilterOperator.EQ, value1: this.sInspLot }),
            new Filter({ path: "Inspoper", operator: FilterOperator.EQ, value1: this.sOperation }),
            new Filter({ path: "Flag", operator: FilterOperator.EQ, value1: "A" })
            ]);
        } catch (error) { }
        if (oInspPointSet && oInspPointSet.results.length > 0) {
          this.getView().byId("commentsSection").setVisible(true);
          this.getView().byId("attachmentSection").setVisible(true);
          this.sInspPoint = oInspPointSet.results[0].Insppoint;
          this.getModel("ViewModel").setProperty("/InspectionPointDesc", "");

          var oFound = oInspPointSet.results.find(function (oInspPoint) {
            return oInspPoint.Insppoint === oThis.sInspPoint;
          });

          if (oFound && this.aFieldSeq && this.aFieldSeq.length > 0) {
            this._formatInspPointDesc(oFound);
          } else {
            this.getView().getModel("ViewModel").setProperty("/InspectionPointDesc", "");
          }

          this.getModel("ViewModel").setProperty("/InspPoint", this.sInspPoint);
          this._fetchCharData();
          this._setAttachmentModel();
        } else {
          this.getView().byId("commentsSection").setVisible(false);
          this.getView().byId("attachmentSection").setVisible(false);
          this.getModel("ViewModel").setProperty("/InspectionPointDesc", "");
          this.getModel("ViewModel").setProperty("/screenMode", "edit");
          this._setEmptyDataToResultsTable();
          var oAttachmentModel = this.getView().byId("table-uploadSet").getModel("AttachementModel");

          if (oAttachmentModel) {
            oAttachmentModel.setData({});
            this.deselectAllItems();
          }
        }

        return new Promise((resolve) => resolve(oInspPointSet));
      },
      onSegButtonSelectionChange: async function (oEvent) {
        var oThis = this;
        var oSource = oEvent.getSource();
        var sSelectedKey = oEvent.getParameter("item").getKey();
        var oModel = this.getView().getModel("ViewModel");
        var iIndex = 0;

        if (oModel.getProperty("/IsDirty")) {
          MessageBox.show(this.getResourceBundle().getText("unSavedDataLostMsg"), {
            icon: MessageBox.Icon.QUESTION,
            title: this.getResourceBundle().getText("discardChanges"),
            actions: [this.getResourceBundle().getText("discardChanges"), this.getResourceBundle().getText("cancel")],
            initialFocus: this.getResourceBundle().getText("cancel"),
            onClose: function (oEvent) {
              if (oEvent === oThis.getResourceBundle().getText("discardChanges")) {
                refreshData();
              } else {
                oSource.setSelectedKey(oThis.sOperation);
              }
            }
          })
        } else {
          refreshData();
        }
        async function refreshData() {
          oThis.sOperation = sSelectedKey;
          iIndex = oModel.getProperty("/ValidOperations").findIndex(oOper => oOper.Inspoper === sSelectedKey);

          oThis.getView().byId("generalSection").setTitle(oModel.getProperty("/ValidOperations/" + iIndex + "/TxtOper"));
          if (iIndex === 0) {
            oThis.getModel("ViewModel").setProperty("/ShowSelectSample", true);
            oThis.getModel("ViewModel").setProperty("/ShowSaveNext", true);
            oThis.getModel("ViewModel").setProperty("/ShowSaveNext", true);
          } else {
            oThis.getModel("ViewModel").setProperty("/ShowSelectSample", false);
            oThis.getModel("ViewModel").setProperty("/ShowSaveNext", false);
          }

          oThis.getView().byId("commentsedit").setValue("");
          oThis.setDirtyState(false);
          BusyIndicator.show();
          await oThis._getInspectionPoints();
          BusyIndicator.hide();
        }
      },
      _fetchCharData: async function () {
        var oThis = this;
        var oViewModel = oThis.getModel("ViewModel");
        this._oResultsTable = this.getView().byId("charResultTable");

        BusyIndicator.show();
        var oPromise1 = new Promise(function (resolve, reject) {
          oThis.getModel().read("/InspLotCharReqSet", {
            filters: [new Filter({ path: "Insplot", operator: FilterOperator.EQ, value1: oThis.sInspLot }),
            new Filter({ path: "Inspoper", operator: FilterOperator.EQ, value1: oThis.sOperation })],
            success: function (oData) {
              resolve(oData);
            }, error: function (oError) {
              reject(oError);
            }
          })
        });
        var oPromise2 = new Promise(function (resolve, reject) {
          oThis.getModel().read("/InspPointsSet", {
            filters: [new Filter({ path: "Insplot", operator: FilterOperator.EQ, value1: oThis.sInspLot }),
            new Filter({ path: "Inspoper", operator: FilterOperator.EQ, value1: oThis.sOperation }),
            new Filter({ path: "Insppoint", operator: FilterOperator.EQ, value1: oThis.sInspPoint }),
            new Filter({ path: "Flag", operator: FilterOperator.EQ, value1: oThis.sInspPointFlag })],
            urlParameters: "$expand=InspLotSampleResultsSet",
            success: function (oData) {
              resolve(oData);
            }, error: function (oError) {
              reject(oError);
            }
          })
        });
        var oPromise3 = new Promise(function (resolve, reject) {
          oThis.getModel().read("/CharResultSpecSet", {
            filters: [new Filter({ path: "Insplot", operator: FilterOperator.EQ, value1: oThis.sInspLot }),
            new Filter({ path: "Inspoper", operator: FilterOperator.EQ, value1: oThis.sOperation })],
            success: function (oData) {
              resolve(oData);
            }, error: function (oError) {
              reject(oError);
            }
          })
        });

        try {
          var aValues = await Promise.all([oPromise1, oPromise2, oPromise3]);
          var oBinding = oThis._oResultsTable.getBinding("items");
          var oInspPoint = aValues[1].results.length > 0 ? aValues[1].results[0] : {};
          var oCommentsSection = oThis.getView().byId("commentsSection");
          var aCharResults = [];
          var bIsCommentsAvailable = false;

          oInspPoint.InspLotSampleResultsSet.results.forEach(oItem => {
            if (oItem.MstrChar !== "COMMENTS") {
              aCharResults.push(oItem);
            } else {
              bIsCommentsAvailable = true;
              var oResult = aValues[0].results.find(oResult => oResult.MstrChar === "COMMENTS");
              if (oResult && oResult.Obligatory === "X") {
                oThis.IsCommentsRequired = true;
                oThis.getView().byId("commnetslbl").setRequired(true);
              } else {
                oThis.IsCommentsRequired = false;
                oThis.getView().byId("commnetslbl").setRequired(false);
              }
              oThis.getView().byId("commentsta").setValue(oItem.Longtext);
            }
          })
          if (bIsCommentsAvailable) {
            oCommentsSection.setVisible(true);
          } else {
            oCommentsSection.setVisible(false);
          }
          var oCharResultSpec = aValues[2].results;
          if (!oBinding) {
            var oCharModel = new JSONModel({
              InspLotCharReq: aValues[0].results,
              InspPoint: oInspPoint,
              InspCharResults: aCharResults,
              CharResultSpec: oCharResultSpec,
            });
            oThis._oResultsTable.setModel(oCharModel);
            oThis._generateCharResultTable(oCharModel);
          } else {
            oThis._oResultsTable.getModel().setData({
              InspLotCharReq: aValues[0].results,
              InspPoint: oInspPoint,
              InspCharResults: aCharResults,
              CharResultSpec: oCharResultSpec,
            })
          }
          var iIndex = oViewModel.getProperty("/ValidOperations").findIndex(oOper => oOper.Inspoper === oThis.sOperation);
          if (iIndex === 0) {
            oViewModel.setProperty("/ShowRemarks", true);
          } else {
            oViewModel.setProperty("/ShowRemarks", false);
          }

          BusyIndicator.hide();
        } catch (error) {
          oThis._setEmptyDataToResultsTable();
          BusyIndicator.hide();
        }
      },

      _generateCharResultTable: function (oCharModel) {
        var oThis = this;

        this._oResultsTable.bindItems({
          path: "/InspCharResults",
          templateShareable: true,
          factory: function (index, context) {
            var oCharac = context.getObject();
            var aCharReq = oCharModel.getProperty("/InspLotCharReq");
            var aCharResSpec = oCharModel.getProperty("/CharResultSpec");
            var aValidOpearations = oThis.getView().getModel("ViewModel").getProperty("/ValidOperations");
            var oColumn1 = null;
            var oColumn2 = null;
            var oColumn4 = null;
            var oColumn5 = null;
            var oColumn7 = null;
            var oCharDetails = null;
            var oCharResultSpec = null;

            oCharDetails = aCharReq.find(function (oCharReq) {
              return (oCharReq.Insplot === oCharac.Insplot &&
                oCharReq.Inspoper === oCharac.Inspoper &&
                oCharReq.Inspchar === oCharac.Inspchar);
            });
            oCharResultSpec = aCharResSpec.find(function (oCharResSpec) {
              return (oCharResSpec.Insplot === oCharac.Insplot &&
                oCharResSpec.Inspoper === oCharac.Inspoper &&
                oCharResSpec.Inspchar === oCharac.Inspchar);
            });
            var fnTitleFormat = function (sValue) {
              sValue = sValue.toLowerCase();
              var aValue = sValue.split(" ");
              for (var i = 0; i < aValue.length; i++) {
                aValue[i] = aValue[i].charAt(0).toUpperCase() + aValue[i].slice(1);
              }
              return aValue.join(" ");
            }

            oColumn5 = new VBox({
              items: [
                new ObjectStatus({
                  text: {
                    path: "Evaluation", formatter: function (sValue) {
                      if (sValue && sValue === "A") {
                        return "Accepted";
                      } else if (sValue && sValue === "R") {
                        return "Rejected";
                      } else if (sValue && sValue === "F") {
                        return "Failed";
                      } else {
                        return "";
                      }
                    }
                  },
                  inverted: true,
                  state: {
                    path: "Evaluation", formatter: function (sValue) {
                      if (sValue && sValue === "A") {
                        return "Success";
                      } else if (sValue && sValue === "R") {
                        return "Error";
                      } else if (sValue && sValue === "F") {
                        return "Error";
                      } else {
                        return "None";
                      }
                    }
                  }
                })]
            });
            var iIndex = aValidOpearations.findIndex(oValidOper => oValidOper.Inspoper === oThis.sOperation);
            if (iIndex === 0) {
              oColumn7 = new Input({
                editable: (oCharDetails.MstrChar === "SUB_NAME" || oCharDetails.MstrChar === "SUB_MAIL") ? false :
                  "{= ${ViewModel>/screenMode} === 'edit' ? ${ViewModel>/CharEditable} === true : false }", value: "{Remark}", maxLength: 40, change: function (oEvent) {
                    //  editable: "{= ${ViewModel>/screenMode} === 'edit' ? ${ViewModel>/CharEditable} === true ? true : false : false}", /*value: "{Longtext}" */value: "{Remark}", maxLength:"40", change: function (oEvent) {
                    var oSource = oEvent.getSource();
                    var oContext = oEvent.getSource().getBindingContext();
                    var oSelectedObj = oContext.getObject();
                    var sValue = oSource.getValue();
                    var regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

                    oThis.setDirtyState(true);
                    oSelectedObj.IsModified = true;
                    // oSelectedObj.Remark = oSelectedObj.Longtext.length > 40 ? oSelectedObj.Longtext.substr(0, 39) : oSelectedObj.Longtext;

                    if (oSource.getType() === "Email") {
                      if (!regex.test(sValue)) {
                        oSource.setValue("");
                        oSource.setValueState("Error");
                        oSource.setValueStateText(oThis.getResourceBundle().getText("invalidEmail"));
                      } else {
                        oSource.setValueState("None");
                      }
                    } else {
                      if (oSource.getValue()) {
                        oSource.setValueState("None");
                      }
                    }
                  }
              });
              if (oCharDetails.MstrChar === "SUB_NAME" && /* !oCharac.Longtext */ !oCharac.Remark && this.sFullName) {
                oCharModel.setProperty(context.getPath() + "/Remark", this.sFullName);
                //oCharModel.setProperty(context.getPath() + "/Longtext", oThis.sSubmitterName);
                oCharac.IsModified = true;
                if (oColumn7 && oColumn7.setEditable) {
                  oColumn7.setEditable(false);
                }
                //oThis.setDirtyState(true);
              }
              if (oCharDetails.MstrChar === "COUNTRY") {
                oColumn7.setShowValueHelp(true);
                oColumn7.attachValueHelpRequest(function (oEvent) {
                  oThis.onCountryOfSaleValueHelpRequested(oEvent);
                });
              }
              if (oCharDetails.MstrChar === "SUB_MAIL" && /* !oCharac.Longtext */ !oCharac.Remark && this.sEmail) {
                oCharModel.setProperty(context.getPath() + "/Remark", this.sEmail);
                //oCharModel.setProperty(context.getPath() + "/Longtext", oThis.sSubmitterEmail);
                oCharac.IsModified = true;
                //oThis.setDirtyState(true);
              }
              /*
              if (oCharDetails.MstrChar === "PPR_WORK" && !oCharac.Longtext) {
                oCharModel.setProperty(context.getPath() + "/Remark", oThis.formatter.dateFormatter(new Date()));
                oCharModel.setProperty(context.getPath() + "/Longtext", oThis.formatter.dateFormatter(new Date()));
                oCharac.IsModified = true;
                //oThis.setDirtyState(true);
              }
                */

              if (oCharDetails && oCharDetails.CharDescr.toLowerCase().includes("date") === true) {
                oColumn7 = new DatePicker({
                  value: /*"{Longtext}" */"{Remark}", displayFormat: "dd.MM.yyyy", valueFormat: "MM.dd.yyyy",
                  editable: "{= ${ViewModel>/screenMode} === 'edit' ? ${ViewModel>/CharEditable} === true ? true : false : false}", change: function (oEvent) {
                    var oContext = oEvent.getSource().getBindingContext();
                    var oSelectedObj = oContext.getObject();

                    oThis.setDirtyState(true);
                    oSelectedObj.IsModified = true;

                    // oSelectedObj.Remark = oSelectedObj.Longtext.length > 40 ? oSelectedObj.Longtext.substr(0, 39) : oSelectedObj.Longtext;

                  }
                });
              } else if (oCharDetails && oCharDetails.CharDescr.toLowerCase().includes("email") === true) {
                oColumn7.setType("Email");
              }
            } else {
              oColumn7 = new TextArea({
                editable: "{= ${ViewModel>/screenMode} === 'edit' ? ${ViewModel>/CharEditable} === true ? true : false : false}",
                value: /*"{Longtext}" */"{Remark}", maxLength: 40, width: "100%", height: "100%", growing: false, change: function (oEvent) {
                  oThis.setDirtyState(true);
                  var oContext = oEvent.getSource().getBindingContext();
                  var oSelectedObj = oContext.getObject();
                  oSelectedObj.IsModified = true;
                  //oSelectedObj.Remark = oSelectedObj.Longtext.length > 40 ? oSelectedObj.Longtext.substr(0, 39) : oSelectedObj.Longtext;


                }
              });
            }

            if (oCharac.Indicator === "HI" || oCharac.Indicator === "HH" || oCharac.Indicator === "I/HH") {

              if (oCharDetails) {
                oColumn1 = new HBox({
                  items: [
                    new Title({ text: oCharDetails.CharDescr, wrapping: true }),
                    new Label({ text: "", required: oCharDetails.Obligatory === "X" ? true : false })]
                });
                oColumn2 = new VBox({
                  items: [
                    new ObjectStatus({
                      title: oThis.getResourceBundle().getText("inspect"),
                      text: Number(oCharDetails.Scope)
                    }),
                    new ObjectStatus({
                      title: oThis.getResourceBundle().getText("inspected"),
                      text: "{ValidVals}"
                    })]
                });
                if ((oCharac.Indicator === "HI" || oCharac.Indicator === "HH" || oCharac.Indicator === "I/HH") && oCharDetails.CharType === "01") {
                  var oInput4 = null;
                  var ObjStatus4 = null;
                  if (!(oCharDetails.LwTolLmt || oCharDetails.UpTolLmt)) {
                    oInput4 = new Input({
                      value: "{MeanValue}", maxLength: 22, editable: "{= ${ViewModel>/screenMode} === 'edit' ? ${ViewModel>/CharEditable} === true ? (${Indicator} === 'HH' || ${Indicator} === 'I/HH') ? true : false : false: false}", change: async function (oEvent) {
                        var oIp = oEvent.getSource();
                        var sValue = oIp.getValue().trim();
                        var oContext1 = oIp.getBindingContext();
                        var oModel = oContext1.getModel();
                        var oSelectedObj1 = oContext1.getObject();

                        oThis.setDirtyState(true);
                        oSelectedObj1.IsModified = true;

                        if (!sValue) {
                          oSelectedObj1.Evaluation = "";
                          oSelectedObj1.Resvalue = "";
                          oSelectedObj1.MeanValue = "";
                          oContext1.getModel().refresh();
                          return;
                        }

                        try {
                          var oNumFormat = await oThis.readDataFromODataModel("/InputCheckSet", [new Filter({ path: "Input", operator: FilterOperator.EQ, value1: sValue })]);

                          if (oNumFormat.results[0].IsValid) {
                            oSelectedObj1.Resvalue = oNumFormat.results[0].Input;
                            oSelectedObj1.MeanValue = oNumFormat.results[0].Input;
                            oSelectedObj1.Evaluation = "A";
                            oModel.refresh();
                          } else {
                            oSelectedObj1.Resvalue = "";
                            oSelectedObj1.MeanValue = "";
                            oSelectedObj1.Evaluation = "";
                            oModel.refresh();
                            MessageToast.show(oThis.getResourceBundle().getText("numValueOnly"));
                            return;
                          }
                        } catch (error) {
                          oSelectedObj1.Resvalue = "";
                          oSelectedObj1.MeanValue = "";
                          oSelectedObj1.Evaluation = "";
                          oModel.refresh();
                          return;
                        }
                      }
                    });

                  } else {
                    oInput4 = new Input({
                      value: "{MeanValue}", maxLength: 22, editable: "{= ${ViewModel>/screenMode} === 'edit' ? ${ViewModel>/CharEditable} === true ? (${Indicator} === 'HH' || ${Indicator} === 'I/HH') ? true : false : false: false}", change: async function (oEvent) {
                        oThis.setDirtyState(true);
                        var oSource = oEvent.getSource();
                        var sEnteredValue = oSource.getValue().trim();
                        var oContext = oSource.getBindingContext();
                        var oModel = oContext.getModel();
                        var oSelectedObj = oContext.getObject();
                        var oNumFormat = { results: [] };
                        oSelectedObj.IsModified = true;

                        if (!sEnteredValue) {
                          oSelectedObj.Evaluation = "";
                          oSelectedObj.Resvalue = sEnteredValue;
                          oSelectedObj.MeanValue = sEnteredValue;
                          oModel.refresh();
                          return;
                        }

                        try {
                          oNumFormat = await oThis.readDataFromODataModel("/InputCheckSet", [new Filter({ path: "Input", operator: FilterOperator.EQ, value1: sEnteredValue }),
                          new Filter({ path: "LwTolLmt", operator: FilterOperator.EQ, value1: oCharDetails.LwTolLmt.trim() }),
                          new Filter({ path: "UpTolLmt", operator: FilterOperator.EQ, value1: oCharDetails.UpTolLmt.trim() })]);

                          if (oNumFormat.results[0].IsValid) {
                            oSelectedObj.Resvalue = oNumFormat.results[0].Input;
                            oSelectedObj.MeanValue = oNumFormat.results[0].Input;
                            oSelectedObj.Evaluation = oNumFormat.results[0].Evaluation;
                            oModel.refresh();
                            return;
                          } else {
                            oSelectedObj.Resvalue = "";
                            oSelectedObj.MeanValue = "";
                            oSelectedObj.Evaluation = "";
                            oModel.refresh();
                            MessageToast.show(oThis.getResourceBundle().getText("numValueOnly"));
                            return;
                          }
                        } catch (error) {
                          oSelectedObj.Resvalue = "";
                          oSelectedObj.MeanValue = "";
                          oSelectedObj.Evaluation = "";
                          oModel.refresh();
                        }
                      }
                    })
                  }

                  oColumn4 = new VBox({
                    items: [oInput4]
                  });
                }
                if ((oCharac.Indicator === "I/HH" || oCharac.Indicator === "HH" || oCharac.Indicator === "HI") && oCharDetails.CharType === "02") {
                  var sText = oThis.getResourceBundle().getText("decInsp");
                  if (oCharResultSpec && oCharResultSpec.CodegroupDesc) {
                    sText = fnTitleFormat(oCharResultSpec.CodegroupDesc);
                  }

                  oColumn4 = new VBox({
                    items: [
                      new Input({
                        value: "{Code1}", editable: "{= ${ViewModel>/screenMode} === 'edit' ?  ${ViewModel>/CharEditable} === true ? (${Indicator} === 'HH' || ${Indicator} === 'I/HH') ? true : false : false: false}", maxLength: 4, valueHelpOnly: false, showValueHelp: true, valueHelpRequest: async function (oEvent) {
                          var oSource = oEvent.getSource();
                          var sCharID = oSource.getBindingContext().getObject().Inspchar;
                          var aCharResultF4 = [];

                          try {
                            aCharResultF4 = await oThis.readDataFromODataModel("/CharResultF4Set",
                              [new Filter({ path: "Insplot", operator: FilterOperator.EQ, value1: oThis.sInspLot }),
                              new Filter({ path: "Inspoper", operator: FilterOperator.EQ, value1: oThis.sOperation }),
                              new Filter({ path: "Inspchar", operator: FilterOperator.EQ, value1: sCharID })]);
                          } catch (error) {
                            return;
                          }

                          var sTitle = oThis.getResourceBundle().getText("charRes");
                          if (aCharResultF4 && aCharResultF4.results && aCharResultF4.results.length > 0 && aCharResultF4.results[0].CodegroupDesc) {
                            sTitle = fnTitleFormat(aCharResultF4.results[0].CodegroupDesc);
                          }
                          var oSelectDialog = new SelectDialog({
                            title: sTitle,
                            items: {
                              path: "CharResultF4>/results",
                              template: new sap.m.StandardListItem({
                                title: "{CharResultF4>Code}",
                                description: "{CharResultF4>Codedesc}",
                                active: true, highlight: {
                                  path: "CharResultF4>CodeValuation", formatter: function (sState) {
                                    if (sState) {
                                      if (sState === "A") {
                                        return sap.ui.core.MessageType.Success;
                                      } else if (sState === "R") {
                                        return sap.ui.core.MessageType.Error;
                                      } else if (sState === "F") {
                                        return sap.ui.core.MessageType.Error;
                                      }
                                      return sap.ui.core.MessageType.None;
                                    }
                                    return sap.ui.core.MessageType.None;
                                  }
                                }
                              })
                            },
                            liveChange: function (oEvt) {
                              //TODO
                            },
                            search: function (oEvt) {
                              //TODO
                            },
                            confirm: function (oEvt) {
                              var oSelectedItem = oEvt.getParameters().selectedItem;
                              var oObject = oSelectedItem.getBindingContext("CharResultF4").getObject();
                              var oInputBindingContext = oSource.getBindingContext();
                              var OSelObj = oInputBindingContext.getObject();

                              oThis.setDirtyState(true);

                              OSelObj.Code1Res = oObject.Code;
                              OSelObj.Code1 = oObject.Code;
                              OSelObj.CodeGrp1 = oObject.Codegroup;
                              OSelObj.Evaluation = oObject.CodeValuation;
                              if (!oObject.CodeValuation) {
                                OSelObj.Evaluation = "A"
                              }
                              OSelObj.IsModified = true;

                              oInputBindingContext.getModel().refresh();
                            },
                            cancel: function () {
                              //TODO
                            }
                          });
                          oSelectDialog.setModel(new JSONModel(aCharResultF4), "CharResultF4");
                          oSelectDialog.open();
                        },
                        change: async function (oEvent) {
                          var sValue = oEvent.getSource().getValue();
                          var oSource = oEvent.getSource();
                          var oContext = oSource.getBindingContext();
                          var oSelectedObj = oContext.getObject();
                          var sCharID = oSelectedObj.Inspchar;
                          var aCharResultF4 = [];

                          oThis.setDirtyState(true);
                          oSelectedObj.IsModified = true;
                          try {
                            aCharResultF4 = await oThis.readDataFromODataModel("/CharResultF4Set",
                              [new Filter({ path: "Insplot", operator: FilterOperator.EQ, value1: oThis.sInspLot }),
                              new Filter({ path: "Inspoper", operator: FilterOperator.EQ, value1: oThis.sOperation }),
                              new Filter({ path: "Inspchar", operator: FilterOperator.EQ, value1: sCharID })]);
                          } catch (error) {
                            return;
                          }
                          var oFind = aCharResultF4.results.find(function (oF4) {
                            return sValue.toUpperCase() === oF4.Code.toUpperCase();
                          });

                          if (!oFind) {
                            oSelectedObj.Code1Res = "";
                            oSelectedObj.Code1 = "";
                            oSelectedObj.CodeGrp1 = "";
                            oSelectedObj.Evaluation = "";
                            MessageToast.show(oThis.getResourceBundle().getText("invalidResult"));
                            oContext.getModel().refresh();
                            return;
                          }

                          oSelectedObj.Code1Res = oFind.Code;
                          oSelectedObj.Code1 = oFind.Code;
                          oSelectedObj.CodeGrp1 = oFind.Codegroup;
                          oSelectedObj.Evaluation = oFind.CodeValuation;
                          if (!oFind.CodeValuation) {
                            oSelectedObj.Evaluation = "A"
                          }
                          oContext.getModel().refresh();
                        }
                      })
                    ]
                  });
                }

                var oColListItem = new ColumnListItem({
                  cells: [oColumn1, oColumn2, oColumn4, oColumn5, oColumn7]
                });

                return oColListItem;
              }
            } else if (oCharac.Indicator === "I") {
              if (oCharDetails.CharType === "01") {
                oColumn4 = new VBox({
                  items: [
                    new Input({
                      value: "{Resvalue}", editable: "{= ${ViewModel>/screenMode} === 'edit' ? ${ViewModel>/CharEditable} === true ? true : false : false }", maxLength: 22, change: async function (oEvent) {
                        oThis.setDirtyState(true);
                        var oIp = oEvent.getSource();
                        var sEnteredValue = oEvent.getSource().getValue().trim();
                        var iEnteredValue = Number(sEnteredValue);
                        var oContext = oEvent.getSource().getBindingContext();
                        var oModel = oContext.getModel();
                        var oSelectedObj = oContext.getObject();
                        var aAllItems = [];

                        oSelectedObj.IsModified = true;

                        var oCharReq = oModel.getProperty("/InspLotCharReq").find(function (oReq) {
                          if (oReq.Inspchar === oSelectedObj.Inspchar) {
                            return true;
                          }
                        });

                        if (oCharReq.LwTolLmt && oCharReq.UpTolLmt && sEnteredValue) {
                          try {
                            var oNumFormat = await oThis.readDataFromODataModel("/InputCheckSet", [new Filter({ path: "Input", operator: FilterOperator.EQ, value1: sEnteredValue }),
                            new Filter({ path: "LwTolLmt", operator: FilterOperator.EQ, value1: oCharDetails.LwTolLmt.trim() }),
                            new Filter({ path: "UpTolLmt", operator: FilterOperator.EQ, value1: oCharDetails.UpTolLmt.trim() })]);

                            if (oNumFormat.results[0].IsValid) {
                              oSelectedObj.Resvalue = oNumFormat.results[0].Input;
                              oSelectedObj.MeanValue = oNumFormat.results[0].Input;
                              oSelectedObj.Evaluation = oNumFormat.results[0].Evaluation;
                              oModel.refresh();
                            } else {
                              oSelectedObj.Resvalue = "";
                              oSelectedObj.MeanValue = "";
                              oSelectedObj.Evaluation = "";
                              sEnteredValue = ""
                              oModel.refresh();
                            }
                          } catch (error) {
                            oSelectedObj.Resvalue = "";
                            oSelectedObj.MeanValue = "";
                            oSelectedObj.Evaluation = "";
                            sEnteredValue = "";
                            oModel.refresh();
                          }
                        } else if (!(oCharReq.LwTolLmt && oCharReq.UpTolLmt) && sEnteredValue) {
                          try {
                            oNumFormat = await oThis.readDataFromODataModel("/InputCheckSet", [new Filter({ path: "Input", operator: FilterOperator.EQ, value1: sEnteredValue })]);

                            if (oNumFormat.results[0].IsValid) {
                              oSelectedObj.Resvalue = oNumFormat.results[0].Input;
                              oSelectedObj.MeanValue = oNumFormat.results[0].Input;
                              oSelectedObj.Evaluation = "A";
                              oModel.refresh();
                            } else {
                              oSelectedObj.Resvalue = "";
                              oSelectedObj.MeanValue = "";
                              oSelectedObj.Evaluation = "";
                              sEnteredValue = "";
                              oModel.refresh();
                            }
                          } catch (error) {
                            oSelectedObj.Resvalue = "";
                            oSelectedObj.MeanValue = "";
                            oSelectedObj.Evaluation = "";
                            sEnteredValue = "";
                            oModel.refresh();
                          }
                        } else {
                          oSelectedObj.Evaluation = "";
                          oHeader.Evaluation = "";
                          sEnteredValue = "";
                        }

                        if (oSelectedObj.Indicator === "I") {
                          var oHeader = oModel.getProperty("/InspCharResults").find(function (oItem) {
                            if (oItem.Indicator === "HI" && oItem.Inspchar === oSelectedObj.Inspchar) {
                              return true;
                            }
                          });
                          /*var oCharReq = oModel.getProperty("/InspLotCharReq").find(function (oReq) {
                            if (oReq.Inspchar === oSelectedObj.Inspchar) {
                              return true;
                            }
                          });*/

                          aAllItems = oModel.getProperty("/InspCharResults").filter(function (oItem) {
                            if (oItem.Indicator === "I" && oItem.Inspchar === oSelectedObj.Inspchar) {
                              return true;
                            }
                          });
                          if (aAllItems && aAllItems.length > 0) {
                            var aResValues = [];
                            var iSum = 0;
                            var dMeanValue = 0;
                            var sEvalution = "A";
                            var iValidItemsCount = 0;
                            aAllItems.forEach(element => {
                              //var sVal = Number(element.Resvalue.trim());
                              if (element.Resvalue.trim()) {
                                aResValues.push(element.Resvalue.trim());
                                //iSum += sVal;
                                iValidItemsCount += 1;
                              }
                            });

                            if (aResValues.length > 0) {
                              try {
                                oNumFormat = await oThis.readDataFromODataModel("/InputCheckSet", [new Filter({ path: "MeanInput", operator: FilterOperator.EQ, value1: aResValues.join(";") }),
                                new Filter({ path: "LwTolLmt", operator: FilterOperator.EQ, value1: oCharDetails.LwTolLmt.trim() }),
                                new Filter({ path: "UpTolLmt", operator: FilterOperator.EQ, value1: oCharDetails.UpTolLmt.trim() })]);

                                if (oNumFormat.results[0].IsValid) {
                                  dMeanValue = oNumFormat.results[0].Mean;
                                  sEvalution = oNumFormat.results[0].Evaluation;
                                }
                              } catch (error) {
                              }
                            }

                            if (oHeader) {
                              oHeader.IsModified = true;
                              /*var iMeanValue = 0;
                              if (iSum != 0) {
                                iMeanValue = iSum / iValidItemsCount;
                              }
                              if (iMeanValue >= Number(oCharReq.LwTolLmt.trim()) && iMeanValue <= Number(oCharReq.UpTolLmt.trim())) {
                                oHeader.Evaluation = "A";
                              } else {
                                oHeader.Evaluation = "R";
                              }*/
                              oHeader.Evaluation = sEvalution;
                              oHeader.Resvalue = "" + dMeanValue
                              oHeader.MeanValue = "" + dMeanValue
                              aAllItems.forEach(element => {
                                if (element.Resvalue) {
                                  element.IsModified = true;
                                }
                              });

                              /*if (oCharReq.LwTolLmt && oCharReq.UpTolLmt && sEnteredValue) {
                                if (iEnteredValue >= Number(oCharReq.LwTolLmt.trim()) && iEnteredValue <= Number(oCharReq.UpTolLmt.trim())) {
                                  oSelectedObj.Evaluation = "A";
                                } else {
                                  oSelectedObj.Evaluation = "R";
                                }
                              } else {
                                oSelectedObj.Evaluation = "";
                                oHeader.Evaluation = "";
                              }*/

                              if (!(oCharReq.LwTolLmt && oCharReq.UpTolLmt) && sEnteredValue) {
                                var NoSpecDecisionDialog2 = new Dialog({
                                  title: oThis.getResourceBundle().getText("decision"),
                                  content: [new RadioButtonGroup({
                                    selectedIndex: 0, buttons: [
                                      new RadioButton({ text: oThis.getResourceBundle().getText("accepted"), valueState: sap.ui.core.ValueState.Success }),
                                      new RadioButton({ text: oThis.getResourceBundle().getText("rejected"), valueState: sap.ui.core.ValueState.Error }),
                                    ]
                                  })],
                                  beginButton: new Button({
                                    type: "Emphasized",
                                    text: oThis.getResourceBundle().getText("ok"),
                                    press: function (oEvent) {
                                      var iIndex = oEvent.getSource().getParent().getContent()[0].getSelectedIndex();
                                      if (iIndex === 0) {
                                        oIp.getBindingContext().getObject().Evaluation = "A";
                                      } else {
                                        oIp.getBindingContext().getObject().Evaluation = "R";
                                      }
                                      oEvent.getSource().getParent().getBindingContext().getModel().refresh();
                                      NoSpecDecisionDialog2.close();
                                      HeaderValuation();
                                    }.bind(this)
                                  }),
                                  escapeHandler: function (oPromise) {
                                    oPromise.reject();
                                  }
                                })
                                NoSpecDecisionDialog2.setBindingContext(oContext);
                                NoSpecDecisionDialog2.open();
                              }
                              function HeaderValuation() {
                                var bAllValid = true;
                                for (var i = 0; i < aAllItems.length; i++) {
                                  if (!aAllItems[i].Resvalue) {
                                    bAllValid = false;
                                  }
                                }

                                if (bAllValid) {
                                  var NoSpecDecisionDialog3 = new Dialog({
                                    title: oThis.getResourceBundle().getText("decisionHdr"),
                                    content: [new RadioButtonGroup({
                                      selectedIndex: 0, buttons: [
                                        new RadioButton({ text: oThis.getResourceBundle().getText("accepted"), valueState: sap.ui.core.ValueState.Success }),
                                        new RadioButton({ text: oThis.getResourceBundle().getText("rejected"), valueState: sap.ui.core.ValueState.Error }),
                                      ]
                                    })],
                                    beginButton: new Button({
                                      type: "Emphasized",
                                      text: oThis.getResourceBundle().getText("ok"),
                                      press: function (oEvent) {
                                        var iIndex = oEvent.getSource().getParent().getContent()[0].getSelectedIndex();
                                        oHeader = oModel.getProperty("/InspCharResults").find(function (oItem) {
                                          return oItem.Indicator === "HI" && oItem.Inspchar === oSelectedObj.Inspchar;
                                        });
                                        oHeader.IsModified = true;
                                        if (iIndex === 0) {
                                          oHeader.Evaluation = "A";
                                        } else {
                                          oHeader.Evaluation = "R";
                                        }
                                        oEvent.getSource().getParent().getBindingContext().getModel().refresh();
                                        NoSpecDecisionDialog3.close();
                                      }.bind(this)
                                    }),
                                    escapeHandler: function (oPromise) {
                                      oPromise.reject();
                                    }
                                  })
                                  NoSpecDecisionDialog3.setBindingContext(oContext);
                                  NoSpecDecisionDialog3.open();
                                } else {
                                  oHeader.Evaluation = "";
                                  oHeader.IsModified = true;
                                }
                                oContext.getModel().refresh();
                              }
                              oModel.refresh();
                            }
                          }
                        }
                      }
                    })
                  ]
                });
              } else if (oCharDetails.CharType === "02") {
                oColumn4 = new VBox({
                  items: [
                    new Input({
                      value: "{Code1Res}", maxLength: 4, valueHelpOnly: false, showValueHelp: true, editable: "{= ${ViewModel>/screenMode} === 'edit' ?  ${ViewModel>/CharEditable} === true ? true : false : false}", valueHelpRequest: async function (oEvent) {
                        var oSource = oEvent.getSource();
                        var sCharID = oSource.getBindingContext().getObject().Inspchar;
                        var aCharResultF4 = [];

                        try {
                          aCharResultF4 = await oThis.readDataFromODataModel("/CharResultF4Set",
                            [new Filter({ path: "Insplot", operator: FilterOperator.EQ, value1: oThis.sInspLot }),
                            new Filter({ path: "Inspoper", operator: FilterOperator.EQ, value1: oThis.sOperation }),
                            new Filter({ path: "Inspchar", operator: FilterOperator.EQ, value1: sCharID })]);
                        } catch (error) {
                          return;
                        }
                        var sTitle = oThis.getResourceBundle().getText("charRes");
                        if (aCharResultF4 && aCharResultF4.results && aCharResultF4.results.length > 0 && aCharResultF4.results[0].CodegroupDesc) {
                          sTitle = fnTitleFormat(aCharResultF4.results[0].CodegroupDesc);
                        }
                        var oSelectDialog = new SelectDialog({
                          title: sTitle,
                          items: {
                            path: "CharResultF4>/results",
                            template: new sap.m.StandardListItem({
                              title: "{CharResultF4>Code}",
                              description: "{CharResultF4>Codedesc}",
                              active: true,
                              highlight: {
                                path: "CharResultF4>CodeValuation", formatter: function (sState) {
                                  if (sState) {
                                    if (sState === "A") {
                                      return sap.ui.core.MessageType.Success;
                                    } else if (sState === "R") {
                                      return sap.ui.core.MessageType.Error
                                    } else if (sState === "F") {
                                      return sap.ui.core.MessageType.Error
                                    }
                                    return sap.ui.core.MessageType.None;
                                  }
                                  return sap.ui.core.MessageType.None;
                                }
                              }
                            })
                          },
                          liveChange: function (oEvt) {
                            //TODO
                          },
                          search: function (oEvt) {
                            //TODO
                          },
                          confirm: function (oEvt) {
                            var oSelectedItem = oEvt.getParameters().selectedItem;
                            var oObject = oSelectedItem.getBindingContext("CharResultF4").getObject();
                            var oInputBindingContext = oSource.getBindingContext();
                            var oContext1 = oSource.getBindingContext();
                            var OSelObj = oInputBindingContext.getObject();

                            oThis.setDirtyState(true);

                            OSelObj.Code1Res = oObject.Code;
                            OSelObj.Code1 = oObject.Code;
                            OSelObj.CodeGrp1 = oObject.Codegroup;
                            OSelObj.Evaluation = oObject.CodeValuation;
                            OSelObj.IsModified = true;

                            var bAllValid = true;
                            var aAllItems = [];
                            var oModel = oContext1.getModel();
                            var oHeader = oModel.getProperty("/InspCharResults").find(function (oItem) {
                              if (oItem.Indicator === "HI" && oItem.Inspchar === OSelObj.Inspchar) {
                                return true;
                              }
                            });

                            aAllItems = oModel.getProperty("/InspCharResults").filter(function (oItem) {
                              if (oItem.Indicator === "I" && oItem.Inspchar === OSelObj.Inspchar) {
                                return true;
                              }
                            });

                            for (var i = 0; i < aAllItems.length; i++) {
                              if (!aAllItems[i].Code1Res) {
                                bAllValid = false;
                              }
                            }

                            if (bAllValid) {
                              oHeader.Evaluation = "A";
                              oHeader.IsModified = true;
                              oHeader.Code1 = OSelObj.Code1;
                              oHeader.Code1Res = OSelObj.Code1;
                              oHeader.CodeGrp1 = OSelObj.CodeGrp1;
                            } else {
                              oHeader.Evaluation = "";
                              oHeader.IsModified = true;
                              oHeader.Code1 = "";
                              oHeader.Code1Res = "";
                              oHeader.CodeGrp1 = "";
                            }


                            oInputBindingContext.getModel().refresh();
                          },
                          cancel: function () {
                            //TODO
                          }
                        });
                        oSelectDialog.setModel(new JSONModel(aCharResultF4), "CharResultF4");
                        oSelectDialog.open();
                      },
                      change: async function (oEvent) {
                        var oContext1 = oEvent.getSource().getBindingContext();
                        var sValue = oEvent.getSource().getValue();
                        var oSource = oEvent.getSource();
                        var oContext = oSource.getBindingContext();
                        var oSelectedObj = oContext.getObject();
                        var sCharID = oSelectedObj.Inspchar;
                        var aCharResultF4 = [];

                        oThis.setDirtyState(true);
                        oSelectedObj.IsModified = true;
                        try {
                          aCharResultF4 = await oThis.readDataFromODataModel("/CharResultF4Set",
                            [new Filter({ path: "Insplot", operator: FilterOperator.EQ, value1: oThis.sInspLot }),
                            new Filter({ path: "Inspoper", operator: FilterOperator.EQ, value1: oThis.sOperation }),
                            new Filter({ path: "Inspchar", operator: FilterOperator.EQ, value1: sCharID })]);
                        } catch (error) {
                          return;
                        }
                        var oFind = aCharResultF4.results.find(function (oF4) {
                          return sValue.toUpperCase() === oF4.Code.toUpperCase();
                        });
                        var bAllValid = true;
                        var aAllItems = [];
                        var oModel = oContext1.getModel();
                        var oHeader = oModel.getProperty("/InspCharResults").find(function (oItem) {
                          if (oItem.Indicator === "HI" && oItem.Inspchar === oSelectedObj.Inspchar) {
                            return true;
                          }
                        });

                        aAllItems = oModel.getProperty("/InspCharResults").filter(function (oItem) {
                          if (oItem.Indicator === "I" && oItem.Inspchar === oSelectedObj.Inspchar) {
                            return true;
                          }
                        });

                        if (!oFind) {
                          oSelectedObj.Code1Res = "";
                          oSelectedObj.Code1 = "";
                          oSelectedObj.CodeGrp1 = "";
                          oSelectedObj.Evaluation = "";
                          MessageToast.show(oThis.getResourceBundle().getText("invalidResult"));
                          oHeader.Evaluation = "";
                          oHeader.Code1 = "";
                          oHeader.Code1Res = "";
                          oHeader.CodeGrp1 = "";
                          oHeader.IsModified = true;
                          oContext.getModel().refresh();
                          return;
                        }

                        oSelectedObj.Code1Res = oFind.Code;
                        oSelectedObj.Code1 = oFind.Code;
                        oSelectedObj.CodeGrp1 = oFind.Codegroup;
                        oSelectedObj.Evaluation = oFind.CodeValuation;

                        for (var i = 0; i < aAllItems.length; i++) {
                          if (!aAllItems[i].Code1Res) {
                            bAllValid = false;
                          }
                        }

                        if (bAllValid) {
                          oHeader.Evaluation = "A";
                          oHeader.Code1 = oSelectedObj.Code1;
                          oHeader.Code1Res = oSelectedObj.Code1Res;
                          oHeader.CodeGrp1 = oSelectedObj.CodeGrp1;
                          oHeader.IsModified = true;
                        } else {
                          oHeader.Evaluation = "";
                          oHeader.Code1 = "";
                          oHeader.Code1Res = "";
                          oHeader.CodeGrp1 = "";
                          oHeader.IsModified = true;
                        }
                        oContext.getModel().refresh();
                      }
                    })
                  ]
                });
              }
              var oColListItem = new ColumnListItem({
                cells: [new Text(), new Text(), oColumn4, oColumn5, oColumn7]
              });

              return oColListItem;
            }
          }.bind(this)
        });
      },
      onCancelPress: function () {
        var oThis = this;
        var oModel = this.getModel("ViewModel");

        if (oModel.getProperty("/IsDirty")) {
          MessageBox.show(this.getResourceBundle().getText("unSavedDataLostMsg"), {
            icon: MessageBox.Icon.QUESTION,
            title: this.getResourceBundle().getText("discardChanges"),
            actions: [this.getResourceBundle().getText("discardChanges"), this.getResourceBundle().getText("cancel")],
            initialFocus: this.getResourceBundle().getText("cancel"),
            onClose: function (oEvent) {
              if (oEvent === oThis.getResourceBundle().getText("discardChanges")) {
                refreshData();
              }
            }
          })
        } else {
          refreshData();
        }
        function refreshData() {
          oThis.setDirtyState(false);
          oThis.getView().byId("commentsedit").setValue("");
          oThis.getView().getModel("ViewModel").setProperty("/screenMode", "view");
          if (oThis.sInspPoint) {
            oThis._fetchCharData();
          }
        }
      },
      _ValidateOpeartion1000MIC: function () {
        var oThis = this;
        var oCommentsTA = oThis.getView().byId("commentsta");
        var oCharModel = this._oResultsTable.getModel();
        var aCharReq = oCharModel.getProperty("/InspLotCharReq");
        var aCharResults = oCharModel.getProperty("/InspPoint/InspLotSampleResultsSet/results");
        var oCommentsTA = this.getView().byId("commentsedit");
        var bIsValid = true;

        this._oResultsTable.getItems().forEach(oItem => {
          var oCharac = oItem.getBindingContext().getObject();
          var oInspLotSampleResult = aCharReq.find(function (oCharReq) {
            return (oCharReq.Insplot === oCharac.Insplot &&
              oCharReq.Inspoper === oCharac.Inspoper &&
              oCharReq.Inspchar === oCharac.Inspchar);
          })

          if (oInspLotSampleResult && oInspLotSampleResult.Obligatory === "X" && /*!oCharac.Longtext*/ !oCharac.Remark) {
            oItem.getCells()[4].setValueState("Error");
            oItem.getCells()[4].setValueStateText(oThis.getResourceBundle().getText("enterValue"));
            bIsValid = false;
          }
        });
        var oComments = aCharResults.find(oResult => oResult.MstrChar === "COMMENTS");
        var oCharReq = aCharReq.find(oResult => oResult.MstrChar === "COMMENTS");
        if (oCommentsTA.getValue()) {
          oComments.IsModified = true;
        }
        if (!bIsValid) {
          MessageToast.show(oThis.getResourceBundle().getText("fillMandatory"));
        }
        return bIsValid;

      },
      _ValidateOtherOpeartions: function () {
        var oThis = this;
        var oCharModel = this._oResultsTable.getModel();
        var aCharReq = oCharModel.getProperty("/InspLotCharReq");
        //var aCharResSpec = oCharModel.getProperty("/CharResultSpec");
        var aCharResults = oCharModel.getProperty("/InspPoint/InspLotSampleResultsSet/results");
        var oCommentsTA = this.getView().byId("commentsedit");
        var bIsValid = true;
        var bIsOutOfScope = false;

        this._oResultsTable.getItems().forEach(oItem => {
          var oCharac = oItem.getBindingContext().getObject();
          var oCharDetails = aCharReq.find(function (oCharReq) {
            return (oCharReq.Insplot === oCharac.Insplot &&
              oCharReq.Inspoper === oCharac.Inspoper &&
              oCharReq.Inspchar === oCharac.Inspchar);
          })

          if (oCharDetails && oCharDetails.Obligatory === "X" && !((oCharDetails && oCharDetails.CharType === "01" && ((oCharac.Indicator === "I" && oCharac.Resvalue) || (oCharac.Indicator !== "I" && oCharac.MeanValue))) ||
            (oCharDetails && oCharDetails.CharType === "02" && (oCharac.Code1 || oCharac.Code1Res)))) {
            oItem.getCells()[2].getItems()[0].setValueState("Error");
            oItem.getCells()[2].getItems()[0].setValueStateText(this.getResourceBundle().getText("enterResults"));
            bIsValid = false;
          } else {
            oItem.getCells()[2].getItems()[0].setValueState("None");
          }
          if (oCharac.IsModified && (oCharDetails && oCharDetails.CharType === "01" && ((oCharac.Indicator === "I" && oCharac.Resvalue) || (oCharac.Indicator !== "I" && oCharac.MeanValue))) ||
            (oCharDetails && oCharDetails.CharType === "02" && (oCharac.Code1 || oCharac.Code1Res))) {
            if (oCharac.Evaluation === "R") {
              oItem.getCells()[2].getItems()[0].setValueState("Error");
              oItem.getCells()[2].getItems()[0].setValueStateText(this.getResourceBundle().getText("outofSpec"));
              bIsOutOfScope = true;
            } else {
              oItem.getCells()[2].getItems()[0].setValueState("None");
            }
          }
        })
        var oComments = aCharResults.find(oResult => oResult.MstrChar === "COMMENTS");
        //var oCharReq = aCharReq.find(oResult => oResult.MstrChar === "COMMENTS");

        if (oCommentsTA.getValue()) {
          oCommentsTA.setValueState("None");
          oComments.IsModified = true;
        }

        if (bIsValid && !bIsOutOfScope) {
          return new Promise(resolve => resolve(true));

        } else if (bIsValid && bIsOutOfScope) {
          return new Promise(resolve => {
            var oSubmitDialog = new Dialog({
              type: "Message",
              title: oThis.getResourceBundle().getText("confirm"),
              content: [
                new Label({
                  text: oThis.getResourceBundle().getText("outofSpecMsg"),
                  labelFor: "submissionNote"
                }),
                new HBox({
                  items: [new CheckBox({
                    text: oThis.getResourceBundle().getText("iAgree"), select: function (oEvent) {
                      if (oEvent.getSource().getSelected()) {
                        oSubmitDialog.getBeginButton().setEnabled(true);
                      } else {
                        oSubmitDialog.getBeginButton().setEnabled(false);
                      }
                    }
                  })]
                })
              ],
              beginButton: new Button({
                type: "Emphasized",
                text: oThis.getResourceBundle().getText("submit"),
                enabled: false,
                press: function () {
                  oSubmitDialog.close();
                  resolve(true);
                }.bind(this)
              }),
              endButton: new Button({
                text: oThis.getResourceBundle().getText("cancel"),
                press: function () {
                  oSubmitDialog.close();
                  resolve(false);
                }.bind(this)
              })
            });
            oSubmitDialog.open();
          })
        } else {
          MessageToast.show(oThis.getResourceBundle().getText("fillMandatory"));
          return new Promise(resolve => resolve(false));
        }
      },
      onSavePress: async function () {
        var oThis = this;
        var oCharDetails = null;
        oThis.submitSelectedStatus();
        var oViewModel = this.getView().getModel("ViewModel");
        var oCharModel = this._oResultsTable.getModel();
        var oInspPoint = oCharModel.getProperty("/InspPoint");
        var aCharReq = oCharModel.getProperty("/InspLotCharReq");
        var oBusyDialog = new BusyDialog({ title: oThis.getResourceBundle().getText("charResultSaving"), text: oThis.getResourceBundle().getText("wait") });
        var bIsModified = false;
        var bIsValid = true;

        if (!oViewModel.getProperty("/IsDirty")) {
          MessageToast.show(oThis.getResourceBundle().getText("noChanges"));
          return;
        }

        var iIndex = oViewModel.getProperty("/ValidOperations").findIndex(oOper => oOper.Inspoper === oThis.sOperation);
        if (iIndex === 0) {
          bIsValid = oThis._ValidateOpeartion1000MIC();
        } else {
          bIsValid = await oThis._ValidateOtherOpeartions();
        }
        if (!bIsValid) {
          return;
        }

        delete oInspPoint.__metadata;
        oInspPoint.InspLotSampleResultsSet.results.forEach(function (oChar) {
          delete oChar.__metadata;
        })

        var oInspPointCopy = Object.assign({}, oInspPoint);
        this.sSaveButtonType = oThis.getResourceBundle().getText("save");
        oInspPointCopy.InspLotSampleResultsSet = [];

        oInspPoint.InspLotSampleResultsSet.results.forEach(function (oCharac) {
          if (oCharac.IsModified === true) {
            bIsModified = true;
            oCharDetails = aCharReq.find(function (oCharReq) {
              return (oCharReq.Insplot === oCharac.Insplot &&
                oCharReq.Inspoper === oCharac.Inspoper &&
                oCharReq.Inspchar === oCharac.Inspchar);
            });
            if (iIndex === 0) {
              if (oCharac.MstrChar !== "COMMENTS") {
                /*if (oCharac.Longtext)*/if (oCharac.Remark) {
                  var oCopyChar = Object.assign({}, oCharac);
                  delete oCopyChar.IsModified;
                  oInspPointCopy.InspLotSampleResultsSet.push(oCopyChar);
                }
              }
            } else {
              if (oCharac.MstrChar !== "COMMENTS") {
                if ((oCharDetails && oCharDetails.CharType === "01" && ((oCharac.Indicator === "I" && oCharac.Resvalue) || (oCharac.Indicator !== "I" && oCharac.MeanValue))) ||
                  (oCharDetails && oCharDetails.CharType === "02" && (oCharac.Code1 || oCharac.Code1Res))) {
                  var oCopyChar = Object.assign({}, oCharac);
                  delete oCopyChar.IsModified;
                  oInspPointCopy.InspLotSampleResultsSet.push(oCopyChar);
                }
              }
            }
            if (oCharac.MstrChar === "COMMENTS") {
              var oCopyChar = Object.assign({}, oCharac);
              var sLongText = oThis.sFullName + " " + oThis.formatter.dateFormatter(new Date()) +
                " " + oThis.formatter.formatTime(new Date()) + " - " +
                oThis.getView().byId("commentsedit").getValue();
              oCopyChar.Longtext = sLongText;
              if (sLongText) {
                oCopyChar.Remark = sLongText.length > 40 ? sLongText.substr(0, 39) : sLongText;
              }
              delete oCopyChar.IsModified;
              oInspPointCopy.InspLotSampleResultsSet.push(oCopyChar);
            }
          }
        })
        if (oInspPointCopy.InspLotSampleResultsSet.length > 0) {
          oBusyDialog.open();
          this.getModel().create("/InspPointsSet", oInspPointCopy, {
            success: function (oData) {
              oThis.getView().byId("commentsedit").setValue("");
              MessageBox.success(oThis.getResourceBundle().getText("charSaved"));
              oThis.setDirtyState(false);
              oThis.getView().getModel("ViewModel").setProperty("/screenMode", "view");
              oThis._fetchCharData();
              oBusyDialog.close();
            },
            error: function (oError) {
              oBusyDialog.close();
            }
          });
        } else {
          MessageToast.show(oThis.getResourceBundle().getText("noChanges"));
          oThis.setDirtyState(false);
          oThis.getView().getModel("ViewModel").setProperty("/screenMode", "view");
          if (bIsModified) {
            oThis._fetchCharData();
          }
        }
      },
      onSaveCopyPress: async function (oEvent) {
        var oThis = this;
        var oCharDetails = null;
        oThis.submitSelectedStatus();
        var oViewModel = this.getView().getModel("ViewModel");
        var oCharModel = this._oResultsTable.getModel();
        var oInspPoint = oCharModel.getProperty("/InspPoint");
        var aCharReq = oCharModel.getProperty("/InspLotCharReq");
        var oBusyDialog = new BusyDialog({ title: oThis.getResourceBundle().getText("charResultSaving"), text: oThis.getResourceBundle().getText("wait") });
        var bIsValid = true;

        if (!oViewModel.getProperty("/IsDirty")) {
          MessageToast.show(oThis.getResourceBundle().getText("noChanges"));
          return;
        }

        var iIndex = oViewModel.getProperty("/ValidOperations").findIndex(oOper => oOper.Inspoper === oThis.sOperation);
        if (iIndex === 0) {
          bIsValid = oThis._ValidateOpeartion1000MIC();
        } else {
          bIsValid = await oThis._ValidateOtherOpeartions();
        }
        if (!bIsValid) {
          return;
        }

        delete oInspPoint.__metadata;
        oInspPoint.InspLotSampleResultsSet.results.forEach(function (oChar) {
          delete oChar.__metadata;
        })

        var oInspPointCopy = Object.assign({}, oInspPoint);
        this.sSaveButtonType = oEvent.getSource().getText();
        this.aCharsCopy = [];

        oInspPointCopy.InspLotSampleResultsSet = [];

        oInspPoint.InspLotSampleResultsSet.results.forEach(function (oCharac) {
          oThis.aCharsCopy.push(Object.assign({}, oCharac));
          if (oCharac.IsModified === true) {
            oCharDetails = aCharReq.find(function (oCharReq) {
              return (oCharReq.Insplot === oCharac.Insplot &&
                oCharReq.Inspoper === oCharac.Inspoper &&
                oCharReq.Inspchar === oCharac.Inspchar);
            });
            if (iIndex === 0) {
              if (oCharac.MstrChar !== "COMMENTS") {
                /* if (oCharac.Longtext) */
                if (oCharac.Remark) {
                  var oCopyChar = Object.assign({}, oCharac);
                  delete oCopyChar.IsModified;
                  oInspPointCopy.InspLotSampleResultsSet.push(oCopyChar);
                }
              } else {
                var oCopyChar = Object.assign({}, oCharac);
                var sLongText = this.sFullName + " " + oThis.formatter.dateFormatter(new Date()) +
                  " " + oThis.formatter.formatTime(new Date()) + " - " +
                  oThis.getView().byId("commentsedit").getValue();
                oCopyChar.Longtext = sLongText;
                if (sLongText) {
                  oCopyChar.Remark = sLongText.length > 40 ? sLongText.substr(0, 39) : sLongText;
                }
                delete oCopyChar.IsModified;
                oInspPointCopy.InspLotSampleResultsSet.push(oCopyChar);
              }
            } else {
              if ((oCharDetails && oCharDetails.CharType === "01" && ((oCharac.Indicator === "I" && oCharac.Resvalue) || (oCharac.Indicator !== "I" && oCharac.MeanValue))) ||
                (oCharDetails && oCharDetails.CharType === "02" && (oCharac.Code1 || oCharac.Code1Res))) {
                var oCopyChar = Object.assign({}, oCharac);
                delete oCopyChar.IsModified;
                oInspPointCopy.InspLotSampleResultsSet.push(oCopyChar);
              }
              if (oCharac.MstrChar === "COMMENTS") {
                var sLongText = this.sFullName + " " + oThis.formatter.dateFormatter(new Date()) +
                  " " + oThis.formatter.formatTime(new Date()) + " - " +
                  oThis.getView().byId("commentsedit").getValue();
                var oCopyChar = Object.assign({}, oCharac);
                oCopyChar.Longtext = sLongText;
                if (sLongText) {
                  oCopyChar.Remark = sLongText.length > 40 ? sLongText.substr(0, 39) : sLongText;
                }
                delete oCopyChar.IsModified;
                oInspPointCopy.InspLotSampleResultsSet.push(oCopyChar);
              }
            }
          }
        })
        if (oInspPointCopy.InspLotSampleResultsSet.length > 0) {
          oBusyDialog.open();
          this.getModel().create("/InspPointsSet", oInspPointCopy, {
            success: function (oData) {
              oBusyDialog.close();
              MessageBox.success(oThis.getResourceBundle().getText("charSaved"), {
                onClose: function () {
                  oThis.setDirtyState(false);

                  if (oThis.sSaveButtonType === oThis.getResourceBundle().getText("saveCopy")) {
                    oThis.InspPointAddFrom = "save&copy";
                  } else {
                    oThis.InspPointAddFrom = "save&next";
                  }

                  if (iIndex === 0) {
                    oThis._generateInspPointScreenSeq();
                  } else {
                    oThis.onSampleListPress();
                  }
                }
              });
            },
            error: function (oError) {
              oBusyDialog.close();
            }
          });
        } else {
          oThis.setDirtyState(false);
          oThis._fetchCharData();
        }
      },

      submitSelectedStatus: function () {
        var that = this;
        var oComboBox = this.byId("statusComboBox");
        var oSelectedItem = oComboBox.getSelectedItem();

        var selectedKey = oComboBox.getSelectedKey();
        var selectedText = selectedKey ? oComboBox.getSelectedItem().getText() : "";


        var statusUpdate = {
          "Stsma": "ZQM_CDS",
          "Prueflos": this.sInspLot,
          "Status": selectedKey,
          "Statusdesc": selectedText,
        };


        if (oSelectedItem) {
          statusUpdate.Status = oSelectedItem.getKey();
          statusUpdate.Statusdesc = oSelectedItem.getText();
        }

        var appId = that.getOwnerComponent().getManifestEntry("sap.app").id;
        var appPath = appId.replaceAll(".", "/");
        var basePath = sap.ui.require.toUrl(appPath) + "/sap/opu/odata/sap/ZQM_BTP_INSP_DATA_UPLOAD_SRV/";

        BusyIndicator.show(0);

        $.ajax({
          url: basePath + "SampleType_F4Set",
          method: "GET",
          headers: {
            "X-CSRF-Token": "Fetch"
          },
          success: function (result, xhr, data) {
            var token = data.getResponseHeader("X-CSRF-Token");
            if (!token) {
              BusyIndicator.hide();
              MessageBox.error("Failed to fetch CSRF token.");
              return;
            }


            $.ajax({
              url: basePath + "UserStatusF4Set",
              method: "POST",
              contentType: "application/json",
              headers: {
                "X-CSRF-Token": token
              },
              data: JSON.stringify(statusUpdate),
              success: function () {
                BusyIndicator.hide();

              },
              error: function (e) {
                BusyIndicator.hide();
                var errorMessage = e.responseText ? JSON.parse(e.responseText).error.message.value : "Unknown error occurred.";
                MessageBox.error(errorMessage, {
                  title: "Error"
                });
              }
            });
          },
          error: function (e) {
            BusyIndicator.hide();
          }
        });
      },



      _setAttachmentModel: function (sMessage) {
        var oThis = this;
        var sServiceUrl = this.getOwnerComponent().getModel().sServiceUrl;
        var oAttachmentTable = this.getView().byId("table-uploadSet");
        var oAttachmentModel = oAttachmentTable.getModel("AttachementModel");
        var sOperation = this.sOperation;

        this.iUploadCount = 0;
        this.iUploadCountSuccess = 0;
        this.iUploadCountFailed = 0;
        this.iUploadCountTerminated = 0;
        this.aAttachementMsg = [];

        var sAttachmentId = this.sInspLot + sOperation + this.sInspPoint;

        if (!oAttachmentModel) {
          oAttachmentModel = new JSONModel({});
          oAttachmentTable.setModel(oAttachmentModel, "AttachementModel");
        }

        this.getModel().read("/Attachment_ListSet", {
          filters: [new Filter({ path: "ObjectId", operator: FilterOperator.EQ, value1: sAttachmentId })],
          success: function (oData) {
            var oAttachments = { items: [] };

            for (var i = 0; i < oData.results.length; i++) {
              var oAttachment = {};
              for (var j in oData.results[i]) {
                oAttachment[j] = oData.results[i][j];
              }
              delete oAttachment.__metadata;
              oAttachment.url = sServiceUrl + "/Attachment_ContentSet(OBJECT_ID='" +
                oData.results[i].ObjectId + "',ARC_DOC_ID='" + oData.results[i].ArcDocId + "')/$value";
              oAttachment.uploadState = "Complete";
              oAttachment.previewable = true;
              oAttachment.selected = false;

              oAttachments.items.push(oAttachment);
            }
            oAttachmentModel.setData(oAttachments);
            oThis.byId("attachmentTitle").setText(oThis.getAttachmentTitleText());
            if (sMessage) {
              MessageToast.show(sMessage);
            }
            oAttachmentTable.setBusy(false);
          }, error: function (oError) {
            oAttachmentTable.setBusy(false);
          }
        })
      },
      onPluginActivated: function (oEvent) {
        var sAppId = this.getOwnerComponent().getManifestEntry("/sap.app/id");
        var sAppPath = sAppId.replaceAll(".", "/");
        var aAppModulePath = jQuery.sap.getModulePath(sAppPath);

        this.oUploadPluginInstance = oEvent.getParameter("oPlugin");
        this.oUploadPluginInstance.setUploadUrl(aAppModulePath + "/sap/opu/odata/sap/ZQM_BTP_INSP_DATA_UPLOAD_SRV/Attachment_ContentSet");
      },
      getIconSrc: function (mediaType, thumbnailUrl) {
        return UploadSetwithTable.getIconForFileType(mediaType, thumbnailUrl);
      },
      openPreview: function (oEvent) {
        var oSource = oEvent.getSource();
        var oBindingContext = oSource.getBindingContext("AttachementModel");
        if (oBindingContext && this.oUploadPluginInstance) {
          this.oUploadPluginInstance.openFilePreview(oBindingContext);
        }
      },
      getFileSizeWithUnits: function (iFileSize) {
        return UploadSetwithTable.getFileSizeWithUnits(iFileSize);
      },

      onFilenameLengthExceed: function () {
        MessageToast.show(this.getResourceBundle().getText("fileLenExceed"));
        this._setAttachmentModel();
      },

      onFileSizeExceed: function () {
        MessageToast.show(this.getResourceBundle().getText("fileSizeExceed"));
        this._setAttachmentModel();
      },

      onTypeMissmatch: function () {
        MessageToast.show(this.getResourceBundle().getText("typeMisMatch"));
        this._setAttachmentModel();
      },

      onAttahmentPress: function (oEvent) {
        var oContext = oEvent.getSource().getBindingContext("AttachementModel");
        this.oUploadPluginInstance.download(oContext, true)
      },
      onItemValidationHandler: function (oEvent) {
        this.byId("table-uploadSet").setBusy(true);

        this.iUploadCount = oEvent.iTotalItemsForUpload;
        return new Promise(resolve => resolve(oEvent.oItem));
      },

      onBeforeUploadStarts: function (oEvent) {

        var sFileName = oEvent.getParameter("item").getProperty("fileName");
        var sOperation = this.sOperation;

        var oCustomerHeaderToken = new sap.ui.core.Item({
          key: "x-csrf-token",
          text: this.getModel().getSecurityToken()
        });
        var oCustomerHeaderSlug = new sap.ui.core.Item({
          key: "slug",
          text: sFileName + ";" + this.sInspLot + sOperation + this.sInspPoint
        });

        oEvent.getParameter("item").addHeaderField(oCustomerHeaderToken);
        oEvent.getParameter("item").addHeaderField(oCustomerHeaderSlug);
      },

      onUploadCompleted: function (oEvent) {
        var oTable = this.byId("table-uploadSet");
        var iResponseStatus = oEvent.getParameter("status");
        var sFileName = oEvent.getParameter("item").mProperties.fileName;

        if (iResponseStatus === 200 || iResponseStatus === 201) {
          this.iUploadCountSuccess += 1;
          this.aAttachementMsg.push({
            type: 'Success',
            title: this.getResourceBundle().getText("uploadSuccess"),
            subtitle: "Attachment '" + sFileName + "' uploaded successfully",
            //description: "Attachment '" + sFileName + "' uploaded successfully"
          });

          this.oResult.status = "UPLOADSUCCESS";
        } else {
          this.iUploadCountFailed += 1;
          this.aAttachementMsg.push({
            type: 'Error',
            title: 'Upload Failed',
            subtitle: "Attachment '" + sFileName + "' upload failed",
            //description: "Attachment '" + sFileName + "' upload failed"
          });
          this.oResult.status = "UPLOADFAILURE";
        }
        if (this.iUploadCount === this.iUploadCountSuccess + this.iUploadCountFailed + this.iUploadCountTerminated) {
          this.oResult.status = "UPLOADCOMPLETED";
          this.oResult.fileName = "";

          //oTable.setBusy(false);
          this.showAttachmentResposeMessage();
          this.deselectAllItems();
          this._setAttachmentModel();
        }
      },

      onUploadTerminated: function (oEvent) {
        var oTable = this.byId("table-uploadSet");
        var sfileName = oEvent.getParameter("item").mProperties.fileName;

        this.iUploadCountTerminated += 1;
        this.oResult.status = "TERMINATED";

        this.aAttachementMsg.push({
          type: 'Error',
          title: 'Upload Terminated',
          subtitle: "Attachment '" + sfileName + "' upload terminated",
          //description: "Attachment '" + sfileName + "' upload terminated"
        });

        if (this.iUploadCount === this.iUploadCountSuccess + this.iUploadCountFailed + this.iUploadCountTerminated) {
          this.oResult.status = "UPLOADCOMPLETED";
          this.oResult.fileName = "";

          //oTable.setBusy(false);
          this.showAttachmentResposeMessage();
          this.deselectAllItems();
          this._setAttachmentModel();
        }
      },

      showAttachmentResposeMessage: function () {
        var oThis = this;
        var oMessageModel = new JSONModel(this.aAttachementMsg);
        var oMessageTemplate = new MessageItem({
          type: '{AttachmentRespModel>type}',
          title: '{AttachmentRespModel>title}',
          description: '{AttachmentRespModel>description}',
          subtitle: '{AttachmentRespModel>subtitle}'
        });
        var oMessageView = new MessageView({
          showDetailsPageHeader: false,
          itemSelect: function () {
            oBackButton.setVisible(true);
          },
          items: {
            path: "AttachmentRespModel>/",
            template: oMessageTemplate
          }
        }).setModel(oMessageModel, "AttachmentRespModel");

        var oBackButton = new Button({
          icon: "sap-icon://nav-back",
          visible: false,
          press: function () {
            oMessageView.navigateBack();
            this.setVisible(false);
          }
        });

        var oDialog = new Dialog({
          resizable: true,
          content: oMessageView,
          state: 'None',
          afterClose: function () {
            oThis._bMessageOpen = false;
            oDialog.destroy();
          },
          beginButton: new Button({
            press: function () {
              this.getParent().close();
            },
            text: oThis.getResourceBundle().getText("close")
          }),
          customHeader: new Bar({
            contentLeft: [oBackButton],
            contentMiddle: [
              new sap.m.Title({
                text: oThis.getResourceBundle().getText("attachements")
              })
            ]
          }),
          contentHeight: "50%",
          contentWidth: "50%",
          verticalScrolling: false
        });

        oDialog.open();
      },

      deselectAllItems: function () {
        var oTable = this.byId("table-uploadSet");
        var aItems = oTable.getItems();

        for (var i = 0; i < aItems.length; i++) {
          oTable.setSelectedItem(aItems[i], false);
        }

        this.byId('download').setEnabled(false);
        this.byId('delete').setEnabled(false);
      },

      getAttachmentTitleText: function () {
        var aItems = this.byId("table-uploadSet").getItems();
        return "Attachments (" + aItems.length + ")";
      },

      onSelectionChange: function (oEvent) {
        var oTable = oEvent.getSource();
        var aSelectedItems = oTable?.getSelectedContexts();

        if (aSelectedItems.length > 0) {
          this.byId('download').setEnabled(true);
          this.byId('delete').setEnabled(true);
        } else {
          this.byId('download').setEnabled(false);
          this.byId('delete').setEnabled(false);
        }
      },
      onDownloadPress: function (oEvent) {
        var oTable = this.byId("table-uploadSet");
        var oContexts = oTable.getSelectedContexts();
        if (oContexts && oContexts.length) {
          oContexts.forEach((oContext) => this.oUploadPluginInstance.download(oContext, true));
        }
        this.deselectAllItems();
      },
      onDeletePress: function (oEvent) {
        var oThis = this;
        var aPromise = [];
        var oSource = oEvent.getSource();
        var oTable = this.byId("table-uploadSet");
        var aContexts = oTable.getSelectedContexts();
        var aAttachLength = aContexts.length;

        if (aAttachLength > 0) {
          var sFileName = aContexts[0].getObject().Filename;
          MessageBox.show((aAttachLength > 1) ? oThis.getResourceBundle().getText("attachDeleteComfirm") : oThis.getResourceBundle().getText("singleAttachDeleteConfirm", sFileName), {
            icon: MessageBox.Icon.QUESTION,
            title: oThis.getResourceBundle().getText("deleteAttach"),
            actions: [oThis.getResourceBundle().getText("yes"), oThis.getResourceBundle().getText("no")],
            initialFocus: oThis.getResourceBundle().getText("no"),
            onClose: function (oEvent) {
              if (oEvent === oThis.getResourceBundle().getText("yes")) {
                deleteAttachments();
              }
            }
          })
        }
        function deleteAttachments() {
          oTable.setBusy(true);
          oTable.getSelectedItems().forEach(oItem => {
            var oObject = oItem.getBindingContext("AttachementModel").getObject();
            var sPath = "/Attachment_ListSet(ObjectId='" + oObject.ObjectId + "',ArcDocId='" + oObject.ArcDocId + "')";
            var oPromise = new Promise(function (resolve, reject) {
              oThis.getView().getModel().remove(sPath, {
                success: function (oData) {
                  resolve(oData);
                },
                error: function (oError) {
                  reject(oError);
                }
              });
            })
            aPromise.push(oPromise);
          });
          Promise.all(aPromise).then(function (aValues) {
            oSource.setEnabled(false);
            oThis.byId("download").setEnabled(false);
            oThis.deselectAllItems();
            //oTable.setBusy(false);
            oThis._setAttachmentModel((aAttachLength > 1) ? oThis.getResourceBundle().getText("attachsDeleted") : oThis.getResourceBundle().getText("attachDeleted"));

          }).catch(function (oError) {
            oTable.setBusy(false);
          })
        }
      },
      onItemDeletePress: function (oEvent) {
        var oThis = this;
        var oTable = this.getView().byId("table-uploadSet");
        var oSource = oEvent.getSource();
        var oContext = oSource.getBindingContext("AttachementModel");
        var oObject = oContext.getObject();
        var sFileName = oObject.Filename;
        var sPath = "/Attachment_ListSet(ObjectId='" + oObject.ObjectId + "',ArcDocId='" + oObject.ArcDocId + "')";

        MessageBox.show(oThis.getResourceBundle().getText("singleAttachDeleteConfirm", sFileName), {
          icon: MessageBox.Icon.QUESTION,
          title: oThis.getResourceBundle().getText("deleteAttachment"),
          actions: [oThis.getResourceBundle().getText("yes"), oThis.getResourceBundle().getText("no")],
          initialFocus: oThis.getResourceBundle().getText("no"),
          onClose: function (oEvent) {
            if (oEvent === oThis.getResourceBundle().getText("yes")) {
              oTable.setBusy(true);

              oThis.getView().getModel().remove(sPath, {
                success: function () {
                  oThis.deselectAllItems();
                  oThis._setAttachmentModel(oThis.getResourceBundle().getText("attachDeleted"));
                  oTable.setBusy(false);
                },
                error: function (oError) {
                  oTable.setBusy(false);
                }
              });
            }
          }
        })
      },
      _generateInspPointScreenSeq: async function () {
        try {
          var aInspPointReq = await this.readDataFromODataModel("/InspPointSet",
            [new Filter({ path: "Insplot", operator: FilterOperator.EQ, value1: this.sInspLot }),
            new Filter({ path: "Inspoper", operator: FilterOperator.EQ, value1: this.sOperation })
            ]);
        } catch (error) {
          return;
        }
        var oInspPointReq = null;
        var aFieldSeq = [];

        if (!(aInspPointReq && aInspPointReq.results && aInspPointReq.results.length > 0)) {
          MessageBox.error(this.getResourceBundle().getText("sampleSeqNotMaint"));
          return;
        }
        oInspPointReq = aInspPointReq.results[0];
        if (oInspPointReq.Userc1Ord) {
          aFieldSeq.push({ order: oInspPointReq.Userc1Ord, label: oInspPointReq.Userc1Txt, key: "Userc1" });
        }
        if (oInspPointReq.Userc2Ord) {
          aFieldSeq.push({ order: oInspPointReq.Userc2Ord, label: oInspPointReq.Userc2Txt, key: "Userc2" });
        }
        if (oInspPointReq.Usern1Ord) {
          aFieldSeq.push({ order: oInspPointReq.Usern1Ord, label: oInspPointReq.Usern1Txt, key: "Usern1" });
        }
        if (oInspPointReq.Usern2Ord) {
          aFieldSeq.push({ order: oInspPointReq.Usern2Ord, label: oInspPointReq.Usern2Txt, key: "Usern2" });
        }
        if (oInspPointReq.Userd1Ord) {
          aFieldSeq.push({ order: oInspPointReq.Userd1Ord, label: oInspPointReq.Userd1Txt, key: "Userd1" });
        }
        if (oInspPointReq.Usert1Ord) {
          aFieldSeq.push({ order: oInspPointReq.Usert1Ord, label: oInspPointReq.Usert1Txt, key: "Usert1" });
        }

        aFieldSeq.sort((a, b) => a.order - b.order);
        this._generateInspectionPointScreen(aFieldSeq);
      },
      _generateInspectionPointScreen: function (aFieldSeq) {
        var oThis = this;
        var oReqFields = {};
        var dNewDate = new Date();
        var oForm = new SimpleForm({
          editable: true,
          layout: "ResponsiveGridLayout"
        });

        var oToolbar = new Toolbar({
          content: [new ToolbarSpacer(),
          new Button({
            text: oThis.getResourceBundle().getText("inspPointList"),
            type: "Emphasized",
            press: function (oEvent) {
              oThis._getInspectionPointsValueHelpDialog(aFieldSeq);
            }
          })
          ]
        });

        for (var i = 0; i < aFieldSeq.length; i++) {
          oForm.addContent(new Label({ text: aFieldSeq[i].label, required: true }));
          if (aFieldSeq[i].key === "Userd1") {
            oReqFields[aFieldSeq[i].key] = dNewDate;
            oForm.addContent(new DatePicker({ dateValue: "{InspectionPointModel>/fields/" + aFieldSeq[i].key + "}", displayFormat: "{ViewModel>/dateFormat}" }));
          } else if (aFieldSeq[i].key === "Usert1") {
            oReqFields[aFieldSeq[i].key] = sap.ui.core.format.DateFormat.getDateInstance({ pattern: "PTHH'H'mm'M'ss'S" }).format(dNewDate);
            oForm.addContent(new TimePicker({
              value: "{InspectionPointModel>/fields/" + aFieldSeq[i].key + "}",
              valueFormat: "PTHH'H'mm'M'ss'S",
              displayFormat: "{ViewModel>/timeFormat}"
            }));
          } else {
            var oInput = null;
            oReqFields[aFieldSeq[i].key] = "";
            if (aFieldSeq[i].label === oThis.getResourceBundle().getText("sampType")) {
              oInput = new Input({
                value: "{InspectionPointModel>/fields/" + aFieldSeq[i].key + "}", maxLength: 18, showValueHelp: true,
                valueHelpRequest: function (oEvent) { oThis.onSampleTypeValueHelpRequested(oEvent) }, change: async function (oEvent) {
                  var oIp = oEvent.getSource();
                  var sValue = oIp.getValue();
                  if (sValue) {
                    try {
                      var aSampleType = await oThis.readDataFromODataModel("/SampleType_F4Set");
                      if (aSampleType && aSampleType.results.length > 0) {
                        var oFound = aSampleType.results.find(function (oST) {
                          return sValue.toUpperCase() === oST.SampleType.toUpperCase()
                        })
                        if (oFound) {
                          oIp.setValue(oFound.SampleType);
                        } else {
                          oIp.setValue("");
                          MessageToast.show(oThis.getResourceBundle().getText("invalidSampleTyp"));
                        }
                      } else {
                        oIp.setValue("");
                        MessageToast.show(oThis.getResourceBundle().getText("invalidSampleTyp"));
                      }
                    } catch (error) {
                      return;
                    }
                  }

                }
              });
            } else {
              oInput = new Input({ value: "{InspectionPointModel>/fields/" + aFieldSeq[i].key + "}", maxLength: 18 });
            }

            if (aFieldSeq[i].key === "Userc1") {
              oInput.setMaxLength(18);
            }
            if (aFieldSeq[i].key === "Userc2") {
              oInput.setMaxLength(10);
            }
            if (aFieldSeq[i].key === "Usern1") {
              oInput.setMaxLength(10);
            }
            if (aFieldSeq[i].key === "Usern2") {
              oInput.setMaxLength(3);
            }
            oForm.addContent(oInput);
          }
        }
        //oForm.setToolbar(oToolbar);
        this.InspPointCreateDialog = new Dialog({
          title: oThis.getResourceBundle().getText("Select Sample"),
          content: oForm,
          beginButton: new Button({
            type: "Emphasized",
            text: oThis.getResourceBundle().getText("select"),
            press: function () {
              oThis._onCreateInspPointPress();
            }.bind(this)
          }),
          endButton: new Button({
            text: oThis.getResourceBundle().getText("cancel"),
            press: function () {
              this.InspPointCreateDialog.getModel("InspectionPointModel").setProperty("/fields", {});
              this.InspPointCreateDialog.close();

            }.bind(this)
          }),
          escapeHandler: function (oPromise) {
            oThis.InspPointCreateDialog.getModel("InspectionPointModel").setProperty("/fields", {});
            oThis.setDirtyState(false);
            oThis._fetchCharData();
            oPromise.resolve();
          }
        }).setModel(new JSONModel({ fields: oReqFields }), "InspectionPointModel");

        //to get access to the global model
        this.getView().addDependent(this.InspPointCreateDialog);

        this.InspPointCreateDialog.open();
      },
      /*
      
            _getInspectionPointsValueHelpDialog: async function (aFieldSeq) {
              var oThis = this;
      
              var aInspPointSet = await this.readDataFromODataModel("/InspPointsSet", [
                new sap.ui.model.Filter({ path: "Insplot", operator: sap.ui.model.FilterOperator.EQ, value1: this.sInspLot }),
                new sap.ui.model.Filter({ path: "Inspoper", operator: sap.ui.model.FilterOperator.EQ, value1: this.sOperation }),
                new sap.ui.model.Filter({ path: "Flag", operator: sap.ui.model.FilterOperator.EQ, value1: "A" })
              ]);
      
              if (!aInspPointSet || !Array.isArray(aInspPointSet.results) || aInspPointSet.results.length === 0) {
                sap.m.MessageToast.show("No inspection points found.");
                return;
              }
      
              aInspPointSet.results.forEach(r => { if (r) r._editable = false; });
      
              var aSampleType = [];
              try {
                var aSampleTypeData = await this.readDataFromODataModel("/SampleType_F4Set");
                if (aSampleTypeData && aSampleTypeData.results) {
                  aSampleType = aSampleTypeData.results.map(item => ({ SampleType: item.SampleType }));
                }
              } catch (err) {
                sap.m.MessageToast.show("Failed to load Sample Types");
              }
      
              var oInspectionPointModel = new sap.ui.model.json.JSONModel({
                InsPoints: aInspPointSet.results,
                SampleTypes: aSampleType
              });
              this.getView().setModel(oInspectionPointModel, "InspectionPointModel");
      
              if (!this._oInspPointDialog) {
                this._oInspPointDialog = new sap.m.Dialog({
                  title: this.getResourceBundle().getText("sampType"),
                  contentWidth: "70%",
                  contentHeight: "60%",
                  resizable: true,
                  draggable: true,
                  content: [
                    new sap.m.Table("inspPointTable", {
                      mode: "SingleSelectMaster",
                      columns: aFieldSeq.map(col => new sap.m.Column({ header: new sap.m.Label({ text: col.label }) }))
                        .concat([new sap.m.Column({ header: new sap.m.Label({ text: "Action" }) })]),
                      itemPress: function (oEvent) {
                        var oContext = oEvent.getParameter("listItem").getBindingContext("InspectionPointModel");
                        if (!oContext) return;
                        var oSelectedInspPoint = oContext.getObject();
      
                        if (oThis.sInspPoint === oSelectedInspPoint.Insppoint) return;
      
                        if (oThis.getModel("ViewModel").getProperty("/IsDirty")) {
                          sap.m.MessageBox.show(oThis.getResourceBundle().getText("unSavedDataLostMsg"), {
                            icon: sap.m.MessageBox.Icon.QUESTION,
                            title: oThis.getResourceBundle().getText("discardChanges"),
                            actions: [
                              oThis.getResourceBundle().getText("discardChanges"),
                              oThis.getResourceBundle().getText("cancel")
                            ],
                            initialFocus: oThis.getResourceBundle().getText("cancel"),
                            onClose: function (sAction) {
                              if (sAction === oThis.getResourceBundle().getText("discardChanges")) {
                                doSwitch(oSelectedInspPoint);
                              }
                            }
                          });
                        } else {
                          doSwitch(oSelectedInspPoint);
                        }
      
                        function doSwitch(oSelectedInspPoint) {
                          oThis.sInspPoint = oSelectedInspPoint.Insppoint;
                          oThis.getView().byId("commentsedit").setValue("");
                          oThis.setDirtyState(false);
      
                          if (oThis.aFieldSeq && oThis.aFieldSeq.length > 0) {
                            oThis._formatInspPointDesc(oSelectedInspPoint);
                          } else {
                            oThis.getModel("ViewModel").setProperty("/InspectionPointDesc", "");
                          }
      
                          if (oThis.InspPointAddFrom === "save&copy") {
                            oThis._validateAndCopyToNext();
                            oThis.InspPointAddFrom = "";
                          } else {
                            oThis._fetchCharData();
                          }
      
                          oThis._setAttachmentModel();
      
                          var oModel = oThis.getView().getModel("InspectionPointModel");
                          if (oModel) oModel.refresh();
      
                          oThis._oInspPointDialog.close();
                        }
                      }
                    })
                  ],
                  endButton: new sap.m.Button({
                    text: "Close",
                    press: function () { oThis._oInspPointDialog.close(); }
                  }),
                  afterClose: function () {
                    oThis._oInspPointDialog.destroy();
                    oThis._oInspPointDialog = null;
                  }
                });
      
                var oTable = sap.ui.getCore().byId("inspPointTable");
                oTable.bindItems({
                  path: "InspectionPointModel>/InsPoints",
                  template: new sap.m.ColumnListItem({
                    type: "Active",
                    cells: aFieldSeq.map(function (column) {
                      if (column.key === "Userc2") {
                        return new sap.m.ComboBox({
                          value: "{InspectionPointModel>" + column.key + "}",
                          editable: "{InspectionPointModel>_editable}",
                          filterSuggests: true,
                          showSecondaryValues: false,
                          valueHelpOnly: false,
                          items: {
                            path: "InspectionPointModel>/SampleTypes",
                            template: new sap.ui.core.Item({
                              key: "{InspectionPointModel>SampleType}",
                              text: "{InspectionPointModel>SampleType}"
                            })
                          },
                          liveChange: function (oEvt) {
                            var sValue = oEvt.getParameter("value");
                            var oContext = oEvt.getSource().getBindingContext("InspectionPointModel");
                            if (oContext && oContext.getObject()) {
                              oContext.getObject()[column.key] = sValue;
                            }
                          }
                        });
                      } else if (column.key === "Userc1") {
                        return new sap.m.Input({
                          value: "{InspectionPointModel>" + column.key + "}",
                          editable: "{InspectionPointModel>_editable}",
                          liveChange: function (oEvt) {
                            var sValue = oEvt.getParameter("value");
                            var oContext = oEvt.getSource().getBindingContext("InspectionPointModel");
                            if (oContext && oContext.getObject()) {
                              oContext.getObject()[column.key] = sValue;
                            }
                          }
                        });
                      } else {
      
                        return new sap.m.Text({ text: "{InspectionPointModel>" + column.key + "}" });
                      }
                    }).concat([
      
                      new sap.m.Button({
                        icon: "{= ${InspectionPointModel>_editable} ? 'sap-icon://save' : 'sap-icon://edit' }",
                        type: "Transparent",
                        press: async function (oEvent) {
                          var oRow = oEvent.getSource().getParent();
                          var oContext = oRow.getBindingContext("InspectionPointModel");
                          if (!oContext) return;
                          var oRowData = oContext.getObject();
      
                          var aAllRows = oThis.getView().getModel("InspectionPointModel").getProperty("/InsPoints");
      
                          var bDuplicate = aAllRows.some(function (row) {
                            if (row.Insppoint === oRowData.Insppoint) return false;
                            return row.Userc1 === oRowData.Userc1 && row.Userc2 === oRowData.Userc2;
                          });
      
                          if (bDuplicate) {
                            sap.m.MessageBox.warning("This combination of Sample Type and Syrup Batch Number already exists. Please enter new.");
                            return;
                          }
      
                          aAllRows.forEach(r => { if (r !== oRowData) r._editable = false; });
                          oContext.getModel().refresh();
      
                          if (!oRowData._editable) {
      
                            oRowData._editable = true;
                            oRow.getCells().forEach(cell => {
                              if (cell.isA("sap.m.Input") || cell.isA("sap.m.ComboBox")) cell.setEditable(true);
                            });
                          } else {
      
                            try {
                              var sPath = "/InspPointsSet(Insplot='" + oRowData.Insplot +
                                "',Inspoper='" + oRowData.Inspoper +
                                "',Insppoint='" + oRowData.Insppoint + "')";
                              var oPayload = {
                                Userc1: oRowData.Userc1,
                                Userc2: oRowData.Userc2,
                                Flag: "A",
                                Insplot: oRowData.Insplot,
                                Inspoper: oRowData.Inspoper,
                                Insppoint: oRowData.Insppoint
                              };
                              await oThis.updateInspectionPoint(sPath, oPayload);
      
                              oRowData._editable = false;
                              oRow.getCells().forEach(cell => {
                                if (cell.isA("sap.m.Input") || cell.isA("sap.m.ComboBox")) cell.setEditable(false);
                              });
                              sap.m.MessageToast.show("Inspection Point updated successfully");
                            } catch (e) {
                              sap.m.MessageBox.error("Failed to update: " + e.message);
                            }
                          }
      
                          oContext.getModel().refresh();
                        }
                      })
                    ])
                  })
                });
      
                this.getView().addDependent(this._oInspPointDialog);
              }
      
              this._oInspPointDialog.open();
            },
            */



      // INC0077965 - Edit Inspection Point - Sharath
      _getInspectionPointsValueHelpDialog: async function (aFieldSeq) {
        var oThis = this;

        var aInspPointSet = await this.readDataFromODataModel("/InspPointsSet", [
          new sap.ui.model.Filter({ path: "Insplot", operator: sap.ui.model.FilterOperator.EQ, value1: this.sInspLot }),
          new sap.ui.model.Filter({ path: "Inspoper", operator: sap.ui.model.FilterOperator.EQ, value1: this.sOperation }),
          new sap.ui.model.Filter({ path: "Flag", operator: sap.ui.model.FilterOperator.EQ, value1: "A" })
        ]);

        if (!aInspPointSet || !Array.isArray(aInspPointSet.results) || aInspPointSet.results.length === 0) {
          sap.m.MessageToast.show("No inspection points found.");
          return;
        }

        aInspPointSet.results.forEach(r => { if (r) r._editable = false; });

        var aSampleType = [];
        try {
          var aSampleTypeData = await this.readDataFromODataModel("/SampleType_F4Set");
          if (aSampleTypeData && aSampleTypeData.results) {
            aSampleType = aSampleTypeData.results.map(item => ({ SampleType: item.SampleType }));
          }
        } catch (err) { }

        var oInspectionPointModel = new sap.ui.model.json.JSONModel({
          InsPoints: aInspPointSet.results,
          SampleTypes: aSampleType
        });
        this.getView().setModel(oInspectionPointModel, "InspectionPointModel");

        var bIsEditMode = this.getModel("ViewModel").getProperty("/screenMode") === "edit";

        if (!this._oInspPointDialog) {
          this._oInspPointDialog = new sap.m.Dialog({
            title: this.getResourceBundle().getText("Inspection Point"),
            contentWidth: "70%",
            contentHeight: "60%",
            resizable: true,
            draggable: true,
            content: [
              new sap.m.Table("inspPointTable", {
                mode: "SingleSelectMaster",
                columns: aFieldSeq.map(col => new sap.m.Column({ header: new sap.m.Label({ text: col.label }) }))
                  .concat([new sap.m.Column({ header: new sap.m.Label({ text: "Action" }) })]),
                itemPress: function (oEvent) {
                  var oContext = oEvent.getParameter("listItem").getBindingContext("InspectionPointModel");
                  if (!oContext) return;
                  var oSelectedInspPoint = oContext.getObject();

                  oThis.sInspPoint = oSelectedInspPoint.Insppoint;
                  oThis.getView().byId("commentsedit").setValue("");
                  oThis.setDirtyState(false);

                  if (oThis.aFieldSeq && oThis.aFieldSeq.length > 0) {
                    oThis._formatInspPointDesc(oSelectedInspPoint);
                  } else {
                    oThis.getModel("ViewModel").setProperty("/InspectionPointDesc", "");
                  }

                  if (oThis.InspPointAddFrom === "save&copy") {
                    oThis._validateAndCopyToNext();
                    oThis.InspPointAddFrom = "";
                  } else {
                    oThis._fetchCharData();
                  }

                  oThis._setAttachmentModel();
                  oInspectionPointModel.refresh();
                  oThis._oInspPointDialog.close();
                }
              })
            ],
            endButton: new sap.m.Button({
              text: "Close",
              press: function () { oThis._oInspPointDialog.close(); }
            }),
            afterClose: function () {
              oThis._oInspPointDialog.destroy();
              oThis._oInspPointDialog = null;
            }
          });

          var oTable = sap.ui.getCore().byId("inspPointTable");
          oTable.bindItems({
            path: "InspectionPointModel>/InsPoints",
            template: new sap.m.ColumnListItem({
              type: "Active",
              cells: aFieldSeq.map(function (column) {
                if (column.key === "Userc2") {
                  return new sap.m.ComboBox({
                    value: "{InspectionPointModel>" + column.key + "}",
                    editable: "{InspectionPointModel>_editable}",
                    items: {
                      path: "InspectionPointModel>/SampleTypes",
                      template: new sap.ui.core.Item({
                        key: "{InspectionPointModel>SampleType}",
                        text: "{InspectionPointModel>SampleType}"
                      })
                    },
                    liveChange: function (oEvt) {
                      var sValue = oEvt.getParameter("value");
                      var oContext = oEvt.getSource().getBindingContext("InspectionPointModel");
                      if (oContext && oContext.getObject()) {
                        oContext.getObject()[column.key] = sValue;
                      }
                    }
                  });
                } else if (column.key === "Userc1") {
                  return new sap.m.Input({
                    value: "{InspectionPointModel>" + column.key + "}",
                    editable: "{InspectionPointModel>_editable}",
                    liveChange: function (oEvt) {
                      var sValue = oEvt.getParameter("value");
                      var oContext = oEvt.getSource().getBindingContext("InspectionPointModel");
                      if (oContext && oContext.getObject()) {
                        oContext.getObject()[column.key] = sValue;
                      }
                    }
                  });
                } else {
                  return new sap.m.Text({ text: "{InspectionPointModel>" + column.key + "}" });
                }
              }).concat([
                new sap.m.HBox({
                  items: [
                    new sap.m.Button({
                      icon: "{= ${InspectionPointModel>_editable} ? 'sap-icon://save' : 'sap-icon://edit'}",
                      type: "Transparent",
                      visible: bIsEditMode && "{= ${InspectionPointModel>Inspoper} === '0010' || ${InspectionPointModel>Inspoper} === '0020'}",
                      press: async function (oEvent) {
                        var oRow = oEvent.getSource();
                        while (oRow && !oRow.isA("sap.m.ColumnListItem")) oRow = oRow.getParent();
                        if (!oRow) return;

                        var oContext = oRow.getBindingContext("InspectionPointModel");
                        if (!oContext) return;
                        var oRowData = oContext.getObject();
                        var aAllRows = oInspectionPointModel.getProperty("/InsPoints");

                        var bDuplicate = aAllRows.some(function (row) {
                          if (row.Insppoint === oRowData.Insppoint) return false;
                          return row.Userc1 === oRowData.Userc1 && row.Userc2 === oRowData.Userc2;
                        });

                        if (bDuplicate) {
                          sap.m.MessageBox.warning("This combination of Sample Type and Syrup Batch Number already exists.");
                          return;
                        }

                        aAllRows.forEach(r => { if (r !== oRowData) r._editable = false; });
                        oContext.getModel().refresh();

                        if (!oRowData._editable) {
                          oRowData._editable = true;
                          oRow.getCells().forEach(cell => {
                            if (cell.isA("sap.m.Input") || cell.isA("sap.m.ComboBox")) cell.setEditable(true);
                          });
                        } else {
                          try {
                            var sPath = "/InspPointsSet(Insplot='" + oRowData.Insplot +
                              "',Inspoper='" + oRowData.Inspoper +
                              "',Insppoint='" + oRowData.Insppoint + "')";
                            var oPayload = {
                              Userc1: oRowData.Userc1,
                              Userc2: oRowData.Userc2,
                              Flag: "A",
                              Insplot: oRowData.Insplot,
                              Inspoper: oRowData.Inspoper,
                              Insppoint: oRowData.Insppoint
                            };
                            await oThis.updateInspectionPoint(sPath, oPayload);

                            oRowData._editable = false;
                            oRow.getCells().forEach(cell => {
                              if (cell.isA("sap.m.Input") || cell.isA("sap.m.ComboBox")) cell.setEditable(false);
                            });
                            sap.m.MessageToast.show("Inspection Point updated successfully");
                          } catch (e) {
                            sap.m.MessageBox.error("Failed to update: " + e.message);
                          }
                        }

                        oContext.getModel().refresh();
                      }
                    }),
                    new sap.m.Button({
                      icon: "sap-icon://accept",
                      text: "Select",
                      type: "Emphasized",
                      press: function (oEvent) {
                        var oRow = oEvent.getSource();
                        while (oRow && !oRow.isA("sap.m.ColumnListItem")) oRow = oRow.getParent();
                        if (!oRow) return;

                        var oContext = oRow.getBindingContext("InspectionPointModel");
                        if (!oContext) return;
                        var oSelected = oContext.getObject();

                        oThis.sInspPoint = oSelected.Insppoint;
                        oThis.getView().byId("commentsedit").setValue("");
                        oThis.setDirtyState(false);

                        if (oThis.aFieldSeq && oThis.aFieldSeq.length > 0) oThis._formatInspPointDesc(oSelected);
                        else oThis.getModel("ViewModel").setProperty("/InspectionPointDesc", "");

                        if (oThis.InspPointAddFrom === "save&copy") {
                          oThis._validateAndCopyToNext();
                          oThis.InspPointAddFrom = "";
                        } else {
                          oThis._fetchCharData();
                        }

                        oThis._setAttachmentModel();
                        oInspectionPointModel.refresh();
                        oThis._oInspPointDialog.close();
                      }
                    })
                  ]
                })
              ])
            })
          });

          this.getView().addDependent(this._oInspPointDialog);
        }

        this._oInspPointDialog.open();
      },


      updateInspectionPoint: function (sPath, oPayload) {
        var oThis = this;
        return new Promise(function (resolve, reject) {
          oThis.getModel().update(sPath, oPayload, {
            success: function (oData) { resolve(oData); },
            error: function (oError) { reject(oError); },
            merge: false
          });
        });
      },

      _onCreateInspPointPress: function () {
        var oThis = this;
        var oModel = this.InspPointCreateDialog.getModel("InspectionPointModel");
        var oFields = oModel.getProperty("/fields");

        for (var i in oFields) {
          if (!oFields[i]) {
            MessageToast.show(oThis.getResourceBundle().getText("fillMandatory"));
            return;
          }
        }
        var oPayload = Object.assign({}, oFields);
        oPayload.Flag = "A";
        oPayload.Insplot = this.sInspLot;
        oPayload.Inspoper = this.sOperation;
        this.getModel().create("/InspPointsSet", oPayload, {
          success: function (oData) {
            oThis.InspPointCreateDialog.close();
            oModel.setProperty("/fields", {});
            oThis.sInspPoint = oData.Insppoint;
            oThis.getModel("ViewModel").setProperty("/InspPoint", oData.Insppoint);
            oThis.getView().byId("attachmentSection").setVisible(true);
            if (oThis.InspPointAddFrom === "save&copy") {
              oThis._copyInspCharData();
              oThis.InspPointAddFrom = "";
            } else {
              oThis.setDirtyState(false);
              oThis._fetchCharData();
            }
            oThis.getView().byId("commentsedit").setValue("");
            if (oData && oThis.aFieldSeq && oThis.aFieldSeq.length > 0) {
              oThis._formatInspPointDesc(oData);
            } else {
              oThis.getView().getModel("ViewModel").setProperty("/InspectionPointDesc", "");
            }
            oThis._setAttachmentModel();
          },
          error: function (oError) {

          }
        })
      },
      _validateAndCopyToNext: async function () {
        var oThis = this;
        try {
          await this._fetchCharData();
          var aInspCharResults = this._oResultsTable.getModel().getProperty("/InspCharResults");
          var oFound = aInspCharResults.find(oCharResult => ( /* oCharResult.Longtext */  oCharResult.Remark || oCharResult.Code1 || oCharResult.MeanValue || oCharResult.Resvalue));

          if (oFound) {
            MessageBox.show(oThis.getResourceBundle().getText("override"), {
              icon: MessageBox.Icon.QUESTION,
              title: oThis.getResourceBundle().getText("confirm"),
              actions: [oThis.getResourceBundle().getText("yes"), oThis.getResourceBundle().getText("no")],
              initialFocus: oThis.getResourceBundle().getText("no"),
              onClose: function (oEvent) {
                if (oEvent === oThis.getResourceBundle().getText("yes")) {
                  copyData();
                } else {
                  oThis.getModel("ViewModel").setProperty("/screenMode", "view");
                }
              }
            })
          } else {
            copyData();
          }
          function copyData() {
            var iIndex = oThis.getView().getModel("ViewModel").getProperty("/ValidOperations").findIndex(oOper => oOper.Inspoper === oThis.sOperation);
            if (oThis.sSaveButtonType === "Save & Copy to Next") {
              for (var i = 0; i < aInspCharResults.length; i++) {
                var oFound = oThis.aCharsCopy.find(function (oChar) {
                  return (aInspCharResults[i].Insplot === oChar.Insplot &&
                    aInspCharResults[i].Inspoper === oChar.Inspoper &&
                    aInspCharResults[i].Inspchar === oChar.Inspchar &&
                    aInspCharResults[i].Resno === oChar.Resno)
                });
                if (oFound) {
                  if (iIndex === 0) {
                    aInspCharResults[i].Remark = oFound.Remark;
                    aInspCharResults[i].Longtext = oFound.Longtext;
                    aInspCharResults[i].IsModified = true;
                  } else {
                    aInspCharResults[i].Resvalue = oFound.Resvalue;
                    aInspCharResults[i].CodeGrp1Res = oFound.CodeGrp1Res;
                    aInspCharResults[i].Evaluation = oFound.Evaluation;
                    aInspCharResults[i].MeanValue = oFound.MeanValue;
                    aInspCharResults[i].Code1 = oFound.Code1;
                    aInspCharResults[i].CodeGrp1 = oFound.CodeGrp1;
                    aInspCharResults[i].Remark = oFound.Remark;
                    aInspCharResults[i].Longtext = oFound.Longtext;
                    aInspCharResults[i].Code1Res = oFound.Code1Res;
                    aInspCharResults[i].IsModified = true;
                  }
                }
              }
              oThis.setDirtyState(true);
            } else {
              oThis.setDirtyState(false);
            }
            oThis.getModel("ViewModel").setProperty("/screenMode", "edit");
            oThis._oResultsTable.getModel().setProperty("/InspCharResults", aInspCharResults);
            oThis._oResultsTable.getModel().refresh(true);
            MessageToast.show(oThis.getResourceBundle().getText("resultsCopied"));
          }
        } catch (error) {

        }
      },
      _copyInspCharData: async function () {
        var oThis = this;
        var iIndex = oThis.getView().getModel("ViewModel").getProperty("/ValidOperations").findIndex(oOper => oOper.Inspoper === oThis.sOperation);
        try {
          await this._fetchCharData();
          this.getModel("ViewModel").setProperty("/screenMode", "edit");

          if (this.sSaveButtonType === "Save & Copy to Next") {

            var aInspCharResults = this._oResultsTable.getModel().getProperty("/InspCharResults");

            for (var i = 0; i < aInspCharResults.length; i++) {
              var oFound = this.aCharsCopy.find(function (oChar) {
                return (aInspCharResults[i].Insplot === oChar.Insplot &&
                  aInspCharResults[i].Inspoper === oChar.Inspoper &&
                  aInspCharResults[i].Inspchar === oChar.Inspchar &&
                  aInspCharResults[i].Resno === oChar.Resno)
              });
              if (oFound) {
                if (iIndex === 0) {
                  aInspCharResults[i].Remark = oFound.Remark;
                  aInspCharResults[i].Longtext = oFound.Longtext;
                  aInspCharResults[i].IsModified = true;
                } else {
                  aInspCharResults[i].Resvalue = oFound.Resvalue;
                  aInspCharResults[i].CodeGrp1Res = oFound.CodeGrp1Res;
                  aInspCharResults[i].Evaluation = oFound.Evaluation;
                  aInspCharResults[i].MeanValue = oFound.MeanValue;
                  aInspCharResults[i].Code1 = oFound.Code1;
                  aInspCharResults[i].CodeGrp1 = oFound.CodeGrp1;
                  aInspCharResults[i].Remark = oFound.Remark;
                  aInspCharResults[i].Longtext = oFound.Longtext;
                  aInspCharResults[i].Code1Res = oFound.Code1Res;
                  aInspCharResults[i].IsModified = true;
                }
              }
            }
            this.setDirtyState(true);
          } else {
            this.setDirtyState(false);
          }
          this._oResultsTable.getModel().setProperty("/InspCharResults", aInspCharResults);
          this._oResultsTable.getModel().refresh(true);
          MessageToast.show(oThis.getResourceBundle().getText("resultsCopied"));
        } catch (error) {

        }
      },
      onSampleTypeValueHelpRequested: async function (oEvent) {

        this._oSampleTypeIp = oEvent.getSource();

        try {
          if (!this._oSampleTypeValueHelpDialog) {
            this._oSampleTypeValueHelpDialog = await this.loadFragment({
              name: "com.monsterenergy.qm.me.qm.qateam.fragment.SampleTypeValueHelpDialog"
            });
            this._oSampleTypeValueHelpDialog.setModel(new JSONModel({}), "SampleTypeModel");
          }
        } catch (error) {
          return;
        }

        this._oSampleTypeValueHelpDialog.getModel("SampleTypeModel").setData({});
        this._oSampleTypeValueHelpDialog.open();

        try {
          var aSampleType = await this.readDataFromODataModel("/SampleType_F4Set");
          this._oSampleTypeValueHelpDialog.getModel("SampleTypeModel").setData(aSampleType);
        } catch (error) {
          return;
        }
      },
      onSampleTypeSearch: function (oEvent) {
        var sSearchQuery = oEvent.getParameter("value");
        var oBinding = oEvent.getSource().getBinding("items");
        var aFilter = [new Filter({ path: "SampleType", operator: FilterOperator.Contains, value1: sSearchQuery }),
        new Filter({ path: "SampleTypeDesc", operator: FilterOperator.Contains, value1: sSearchQuery })];
        if (sSearchQuery) {
          oBinding.filter([new Filter({ filters: aFilter, and: false })]);
        } else {
          oBinding.filter([]);
        }
      },
      onSampleTypeClose: function (oEvent) {
        var aSamples = []
        if (oEvent.getSource().getMultiSelect()) {
          oEvent.getParameter("selectedItems").forEach(oItem => aSamples.push(oItem.getTitle()));
          this._oSampleTypeIp.setValue(aSamples.join(","));
        } else {
          this._oSampleTypeIp.setValue(oEvent.getParameter("selectedItem").getTitle());
        }

        oEvent.getSource().getBinding("items").filter([]);
      },
      onSampleTypeCancel: function (oEvent) {
        oEvent.getSource().getBinding("items").filter([]);
      },
      onAddSamplePress: function (oEvent) {
        var oThis = this;
        var oModel = this.getModel("ViewModel");

        this.InspPointAddFrom = "sample";
        if (oModel.getProperty("/IsDirty")) {
          MessageBox.show(this.getResourceBundle().getText("unSavedDataLostMsg"), {
            icon: MessageBox.Icon.QUESTION,
            title: this.getResourceBundle().getText("discardChanges"),
            actions: [this.getResourceBundle().getText("discardChanges"), this.getResourceBundle().getText("cancel")],
            initialFocus: this.getResourceBundle().getText("cancel"),
            onClose: function (oEvent) {
              if (oEvent === oThis.getResourceBundle().getText("discardChanges")) {
                oThis._generateInspPointScreenSeq();
              }
            }
          })
        } else {
          this._generateInspPointScreenSeq();
        }
      },
      onSampleListPress: async function () {
        BusyIndicator.show();
        try {
          var aInspPointReq = await this.readDataFromODataModel("/InspPointSet",
            [new Filter({ path: "Insplot", operator: FilterOperator.EQ, value1: this.sInspLot }),
            new Filter({ path: "Inspoper", operator: FilterOperator.EQ, value1: this.sOperation })
            ]);
        } catch (error) {
          return;
        }
        var oInspPointReq = null;
        var aFieldSeq = [];

        if (!(aInspPointReq && aInspPointReq.results && aInspPointReq.results.length > 0)) {
          MessageBox.error(this.getResourceBundle().getText("inspPointReqNotFound"));
          return;
        }
        oInspPointReq = aInspPointReq.results[0];
        if (oInspPointReq.Userc1Ord) {
          aFieldSeq.push({ order: oInspPointReq.Userc1Ord, label: oInspPointReq.Userc1Txt, key: "Userc1" });
        }
        if (oInspPointReq.Userc2Ord) {
          aFieldSeq.push({ order: oInspPointReq.Userc2Ord, label: oInspPointReq.Userc2Txt, key: "Userc2" });
        }
        if (oInspPointReq.Usern1Ord) {
          aFieldSeq.push({ order: oInspPointReq.Usern1Ord, label: oInspPointReq.Usern1Txt, key: "Usern1" });
        }
        if (oInspPointReq.Usern2Ord) {
          aFieldSeq.push({ order: oInspPointReq.Usern2Ord, label: oInspPointReq.Usern2Txt, key: "Usern2" });
        }
        if (oInspPointReq.Userd1Ord) {
          aFieldSeq.push({ order: oInspPointReq.Userd1Ord, label: oInspPointReq.Userd1Txt, key: "Userd1" });
        }
        if (oInspPointReq.Usert1Ord) {
          aFieldSeq.push({ order: oInspPointReq.Usert1Ord, label: oInspPointReq.Usert1Txt, key: "Usert1" });
        }

        aFieldSeq.sort((a, b) => a.order - b.order);
        this._getInspectionPointsValueHelpDialog(aFieldSeq);
        BusyIndicator.hide();
      },
      onCommentsLiveChange: function (oEvent) {
        this.setDirtyState(true);
      },
      onMICCommentsChange: function (oEvent) {
        var sValue = oEvent.getSource().getValue();
        var oCharModel = this._oResultsTable.getModel();
        var aCharReq = oCharModel.getProperty("/InspLotCharReq");
        var aCharResults = oCharModel.getProperty("/InspPoint/InspLotSampleResultsSet/results");
        var oCommentsTA = this.getView().byId("commentsedit");


        var oComments = aCharResults.find(oResult => oResult.MstrChar === "COMMENTS");
        var oCharReq = aCharReq.find(oResult => oResult.MstrChar === "COMMENTS");
        if (oComments && oCharReq && oCharReq.Obligatory === "X" && !sValue) {
          oCommentsTA.setValueState("Error");
          oCommentsTA.setValueStateText(this.getResourceBundle().getText("enterComments"));
        } else if (sValue) {
          oCommentsTA.setValueState("None");
          oComments.IsModified = true;
        }
        this.setDirtyState(true);
      },
      onCommentsChange: function (oEvent) {
        var sValue = oEvent.getSource().getValue();
        var oUserStatusIp = this.getView().byId("userstatusip");

        if (sValue) {
          this.setDirtyState(true);
          if (oUserStatusIp.getVisible() && !oUserStatusIp.getValue()) {
            MessageToast.show(this.getResourceBundle().getText("enterUserStatus"));
          }
        } else {
          oUserStatusIp.setValue("");
        }

      },

      _getInspPointSequence: async function () {
        try {
          var aInspPointReq = await this.readDataFromODataModel("/InspPointSet",
            [new Filter({ path: "Insplot", operator: FilterOperator.EQ, value1: this.sInspLot }),
            new Filter({ path: "Inspoper", operator: FilterOperator.EQ, value1: this.sOperation })
            ]);
        } catch (error) {
        }
        var oInspPointReq = null;
        var aFieldSeq = [];

        if (!(aInspPointReq && aInspPointReq.results && aInspPointReq.results.length > 0)) {
          MessageBox.error(this.getResourceBundle().getText("inspPointReqNotFound"));
          this.aFieldSeq = aFieldSeq;
          return;
        }
        oInspPointReq = aInspPointReq.results[0];
        if (oInspPointReq.Userc1Ord) {
          aFieldSeq.push({ order: oInspPointReq.Userc1Ord, label: oInspPointReq.Userc1Txt, key: "Userc1" });
        }
        if (oInspPointReq.Userc2Ord) {
          aFieldSeq.push({ order: oInspPointReq.Userc2Ord, label: oInspPointReq.Userc2Txt, key: "Userc2" });
        }
        if (oInspPointReq.Usern1Ord) {
          aFieldSeq.push({ order: oInspPointReq.Usern1Ord, label: oInspPointReq.Usern1Txt, key: "Usern1" });
        }
        if (oInspPointReq.Usern2Ord) {
          aFieldSeq.push({ order: oInspPointReq.Usern2Ord, label: oInspPointReq.Usern2Txt, key: "Usern2" });
        }
        if (oInspPointReq.Userd1Ord) {
          aFieldSeq.push({ order: oInspPointReq.Userd1Ord, label: oInspPointReq.Userd1Txt, key: "Userd1" });
        }
        if (oInspPointReq.Usert1Ord) {
          aFieldSeq.push({ order: oInspPointReq.Usert1Ord, label: oInspPointReq.Usert1Txt, key: "Usert1" });
        }
        if (oInspPointReq.EquiOrd) {
          aFieldSeq.push({ order: oInspPointReq.EquiOrd, label: oInspPointReq.EquiTxt, key: "Equipment" });
        }

        aFieldSeq.sort((a, b) => a.order - b.order);
        this.aFieldSeq = aFieldSeq;
      },
      _formatInspPointDesc: function (oInspPoint) {
        var sInspDetails = [];
        for (var i = 0; i < this.aFieldSeq.length; i++) {
          /*if (this.aFieldSeq[i].label === "Cup Number" && oInspPoint[this.aFieldSeq[i].key] === "X") {
            continue;
          }*/
          if (this.aFieldSeq[i].key === "Userd1") {
            sInspDetails.push(this.aFieldSeq[i].label + ":" + this.formatter.dateFormatter(oInspPoint[this.aFieldSeq[i].key]));
          } else if (this.aFieldSeq[i].key === "Usert1") {
            sInspDetails.push(this.aFieldSeq[i].label + ":" + this.formatter.timeFormatter(oInspPoint[this.aFieldSeq[i].key]));
          } else {
            sInspDetails.push(this.aFieldSeq[i].label + ":" + oInspPoint[this.aFieldSeq[i].key]);
          }
        }
        this.getView().getModel("ViewModel").setProperty("/InspectionPointDesc", sInspDetails.join(" | "))
      },
      onCountryOfSaleValueHelpRequested: async function (oEvent) {
        var oCountry = null;
        this._oCountryOfSaleIp = oEvent.getSource();

        try {
          if (!this._oCountryOfSaleValueHelpDialog) {
            this._oCountryOfSaleValueHelpDialog = await this.loadFragment({
              name: "com.monsterenergy.qm.me.qm.qateam.fragment.CountryOfSaleValueHelpDialog"
            });
            this._oCountryOfSaleValueHelpDialog.open();
            oCountry = await this.readDataFromODataModel("/CountryOfSaleF4Set", []);
            this._oCountryOfSaleValueHelpDialog.setModel(new JSONModel(oCountry), "CountryF4");
          } else {
            this._oCountryOfSaleValueHelpDialog.open();
          }

        } catch (error) {
          return;
        }

      },
      onCountryOfSaleSearch: function (oEvent) {
        var sSearchQuery = oEvent.getParameter("value");
        var oBinding = oEvent.getSource().getBinding("items");
        var aFiltes = [new Filter({ path: "Land1", operator: FilterOperator.Contains, value1: sSearchQuery }),
        new Filter({ path: "Landx", operator: FilterOperator.Contains, value1: sSearchQuery })];

        if (sSearchQuery) {
          oBinding.filter([new Filter({ filters: aFiltes, and: false })]);
        } else {
          oBinding.filter([]);
        }
      },
      onCountryOfSaleClose: function (oEvent) {
        var aContexts = oEvent.getParameter("selectedContexts");
        var aCountry = [];

        if (aContexts && aContexts.length) {
          for (var i = 0; i < aContexts.length; i++) {
            var oObject = aContexts[i].getObject();
            aCountry.push(oObject.Land1);
          }
        }
        this._oCountryOfSaleIp.setValue(aCountry.join("/"));
        this._oCountryOfSaleIp.getBindingContext().getObject().Remark = aCountry.join("/").length > 40 ? aCountry.join("/").substr(0, 39) : aCountry.join("/");
        this._oCountryOfSaleIp.getBindingContext().getObject().IsModified = true;
        this.setDirtyState(true);
        oEvent.getSource().getBinding("items").filter([]);
      },
      onCountryOfSaleCancel: function (oEvent) {
        oEvent.getSource().getBinding("items").filter([]);
      },
    });
  }
);
