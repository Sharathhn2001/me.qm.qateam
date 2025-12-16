sap.ui.define([
    "com/monsterenergy/qm/me/qm/qateam/controller/BaseController",
    "com/monsterenergy/qm/me/qm/qateam/js/Formatter",
    "sap/ui/model/json/JSONModel",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/m/Token",
    "sap/ui/core/BusyIndicator",
    "sap/m/MessageToast",
    "sap/ui/core/Fragment",
    "sap/m/MessageBox",
    "sap/ui/Device"

], (BaseController, Formatter, JSONModel, Filter, FilterOperator, Token, BusyIndicator, MessageToast, Fragment, MessageBox, Device) => {
    "use strict";

    return BaseController.extend("com.monsterenergy.qm.me.qm.qateam.controller.HomePage", {
        formatter: Formatter,
        async onInit() {
            try {

                const oPlantDetails = await this._getIasDetails();
                this.name = [oPlantDetails.firstName, oPlantDetails.lastName].filter(Boolean).join(" ").trim();

                let rawEmail = oPlantDetails.email;
                if (Array.isArray(rawEmail)) {
                    this._userEmail = rawEmail.find(email => email) || "";
                } else {
                    this._userEmail = rawEmail || "";
                }

                this._isQMUser = String(oPlantDetails.isQMUser).toLowerCase() === "true";

                this.sPlant = "";
                this.sPlantName = "";


                //  this.sPlant = "3011";
                //this.sPlantName = "";

                if (!this._isQMUser) {
                    this.sPlant = oPlantDetails.Plant;
                    this.sPlantName = oPlantDetails.PlantName;

                    const oPlantInput = this.byId("plantInputname");
                    if (oPlantInput) {
                        oPlantInput.setValue(this.sPlant);
                    }
                } else {
                    this.waitForCondition(
                        () => this._userEmail.trim() !== "",
                        () => this.PlantF4()
                    );
                }

                var oViewModel = new JSONModel({
                    worklistTableTitle: this.getResourceBundle().getText("worklistTableTitle"),
                    tableNoDataText: this.getResourceBundle().getText("tableNoDataText"),
                    SubmitterName: "",
                    SubmitterEmail: "",
                    Plant: this.sPlant,
                    PlantName: this.sPlantName,
                    isQMUser: this._isQMUser,
                });
                oViewModel.setSizeLimit(100000);
                this.setModel(oViewModel, "ViewModel");

                var oDateRange = this.getView().byId("dateRangeSelection");
                if (oDateRange) {
                    var oneWeekAgo = new Date();
                    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
                    oDateRange.setDateValue(oneWeekAgo);
                    oDateRange.setSecondDateValue(new Date());
                }

                this._oMaterialMultiInput = this.getView().byId("materialMInput");
                if (this._oMaterialMultiInput) {
                    this._oMaterialMultiInput.addValidator(this._onMultiInputValidate);
                }

                this._oBatchMultiInput = this.getView().byId("batchMInput");
                if (this._oBatchMultiInput) {
                    this._oBatchMultiInput.addValidator(this._onMultiInputValidate);
                }

                this._oformulaMultiInput = this.getView().byId("formulaMInput");
                if (this._oformulaMultiInput) {
                    this._oformulaMultiInput.addValidator(this._onMultiInputValidate);
                }
                this.applyData = this.applyData.bind(this);
                this.fetchData = this.fetchData.bind(this);
                this.getFiltersWithValues = this.getFiltersWithValues.bind(this);

                this.oFilterBar = this.getView().byId("filterbar");
                this.oTable = this.getView().byId("table");

                if (this.oFilterBar) {
                    this.oFilterBar.registerFetchData(this.fetchData);
                    this.oFilterBar.registerApplyData(this.applyData);
                    this.oFilterBar.registerGetFiltersWithValues(this.getFiltersWithValues);
                    this.oFilterBar.fireFilterChange();
                }

                if (this.oTable) {
                    this.oTable.setShowOverlay(false);
                }

                if (!this._isQMUser) {
                    this.getMaterialF4();
                    this.getBatchF4([]);
                    this.getFormulaF4();
                    this.getPurchaseOrderF4();
                    this.getSampleTypeF4();
                    this.getSyrupBatchF4();
                }

            } catch (oError) {

            }
        },

        waitForCondition: function (checkFn, callback, interval = 200, maxAttempts = 50) {
            let attempts = 0;
            const wait = () => {
                if (checkFn()) {
                    callback();
                } else {
                    attempts++;
                    if (attempts < maxAttempts) {
                        setTimeout(wait, interval);
                    }
                }
            };
            wait();
        },

        getSubmitterInfo: async function () {
            BusyIndicator.show();

            try {
                if (!this._oSubmitterInfoDialog) {
                    this._oSubmitterInfoDialog = await this.loadFragment({
                        name: "com.monsterenergy.qm.me.qm.qateam.fragment.SubmitterNameEmailDialog"
                    });
                }
            } catch (error) {
                return;
            }

            this._oSubmitterInfoDialog.open();
            BusyIndicator.hide();
        },
        onSubmitterDetailSubmitPress: async function () {
            var oSubmitterModel = this.getView().getModel("ViewModel");
            var oCreateObject = oSubmitterModel.getData();
            var oSubmitterNameIp = this.getView().byId("submitter_name1");
            var oSubmitterEmailIp = this.getView().byId("submitter_email1");
            var bIsValid = true;

            if (!oCreateObject.SubmitterName) {
                oSubmitterNameIp.setValueState("Error");
                oSubmitterNameIp.setValueStateText(this.getResourceBundle().getText("enterSubName"));
                bIsValid = false;
            }
            if (!oCreateObject.SubmitterEmail) {
                oSubmitterEmailIp.setValueState("Error");
                oSubmitterEmailIp.setValueStateText(this.getResourceBundle().getText("enterSubEmail"));
                bIsValid = false;
            }

            if (!bIsValid) {
                MessageToast.show(this.getResourceBundle().getText("fillMandatory"));
                return;
            }
            this._oSubmitterInfoDialog.close();
        },
        onSubmitterEscape: function (oPromise) {
            oPromise.reject();
        },
        _onMultiInputValidate: function (oArgs) {
            if (oArgs.suggestionObject) {
                //var oObject = oArgs.suggestionObject.getBindingContext().getObject();
                if (oArgs.text) {
                    return new Token({ key: oArgs.text, text: oArgs.text });
                }
            } else if (oArgs.text) {
                var sValue = oArgs.text.trim();
                return new Token({ key: sValue, text: sValue });
            }

            return null;
        },

        /**
             * Event handler for Filterbar fetchData.
             * Fetches the Filterbar FilterItem Control values and Return FilterData
             * @returns {Object[]} aData, which having groupName, fieldName, fieldData.
             * @public
             */
        fetchData: function () {
            var aData = [];
            var aFilterItems = this.oFilterBar.getAllFilterItems();
            var oFilterItem = null;
            var oFilterData = null;

            for (var i = 0; i < aFilterItems.length; i++) {
                oFilterItem = aFilterItems[i];
                oFilterData = {
                    groupName: oFilterItem.getGroupName(),
                    fieldName: oFilterItem.getName(),
                    fieldData: this._getFilterBarControlValue(oFilterItem.getControl())
                };
                aData.push(oFilterData);
            }

            return aData;
        },

        /**
         * Event handler for Filterbar applyData.
         * Applies Filter values to Filterbar FilterItem COntrols.
         * @param {Object[]} aData, which having groupName, fieldName, fieldData.
         * @public
         */
        applyData: function (aData) {
            var oDataObject = null;
            var oControl = null;

            for (var i = 0; i < aData.length; i++) {
                oDataObject = aData[i];
                oControl = this.oFilterBar.determineControlByName(oDataObject.fieldName, oDataObject.groupName);
                this._setFilterBarControlValue(oControl, oDataObject.fieldData);
            }
        },

        /**
         * Event handler for Filterbar getFiltersWithValues method.
         * @returns {Object[]} Filter control and values.
         * @public
         */
        getFiltersWithValues: function () {
            var aFiltersWithValue = [];
            var aFilterGroupItems = this.oFilterBar.getFilterGroupItems();
            var oFilterGroupItem = null;
            var oControl = null;

            for (var i = 0; i < aFilterGroupItems.length; i++) {
                oFilterGroupItem = aFilterGroupItems[i];
                oControl = oFilterGroupItem.getControl();

                if (oControl && this._getFilterBarControlValue(oControl) && this._getFilterBarControlValue(oControl).length > 0) {
                    aFiltersWithValue.push(oFilterGroupItem);
                }
            }

            return aFiltersWithValue;
        },

        /**
         * Internal helper method to get the Filterbar FilterItem Control values 
         * @param {sap.ui.core.Control} FilterItem Control
         * @returns {String} sValue, Filter Value
         * @private
         */
        _getFilterBarControlValue: function (oControl) {
            var sValue = "";

            if (oControl instanceof sap.m.ComboBox) {
                sValue = oControl.getSelectedKey();
            } else if (oControl instanceof sap.m.MultiInput) {
                sValue = oControl.getTokens();
            } else if (oControl instanceof sap.m.DateRangeSelection) {
                sValue = oControl.getValue();
            } else if (oControl instanceof sap.m.Input) {
                sValue = oControl.getValue();
            } else if (oControl instanceof sap.m.Select) {
                sValue = oControl.getSelectedKey();
            }
            return sValue;
        },

        /**
        * Internal helper method to sets the Filterbar FilterItem Control values 
        * @param {sap.ui.core.Control, String} oControl, sValue FilterItem Control and its Value
        * @private
        */
        _setFilterBarControlValue: function (oControl, sValue) {
            if (oControl instanceof sap.m.ComboBox) {
                oControl.setSelectedKey(sValue);
            } else if (oControl instanceof sap.m.Select) {
                oControl.setSelectedKey(sValue);
            } else if (oControl instanceof sap.m.MultiInput) {
                oControl.setTokens(sValue);
            } else if (oControl instanceof sap.m.DateRangeSelection) {
                oControl.setValue(sValue);
            }
        },

        /**
         * Event handler for Filter Group Item Change Event.
         * Fires the Filterbar Filter change event
         * @param {sap.ui.base.Event} oEvent The Change Event
         * @public
         */
        onFilterGroupItemChange: function (oEvent) {
            this.oFilterBar.fireFilterChange(oEvent);
        },

        /**
         * Event handler for FilterBar FilterChange Event.
         * Calls _updateLabelsAndTable() function to add Overlay to Table
         * @public
         */
        onFilterChange: function (oEvent) {
            this._updateLabelsAndTable();
        },

        /**
         * Internal function to set Overlay to Header Table
         * @private
         */
        _updateLabelsAndTable: function () {
            this.oTable.setShowOverlay(true);
        },

        /**
         * Event handler for FilterBar Search Event.
         * Calls __createFiltersForHeaderTable() function to get Fiters For Header Table
         * Calls _filterHeaderTable() function to add Filter to Header Table
         * @public
         */
        onSearch: function () {
            var aTableFilters = [];

            aTableFilters = this._createFiltersForHeaderTable();

            this._filterHeaderTable(aTableFilters);

            this.oTable.setShowOverlay(false);
        },

        /**
         * Internal function to get Filters
         * @returns {sap.ui.model.Filter[]} aTableFilters Array of Filters
         * @private
         */
        _createFiltersForHeaderTable: function () {
            var aTableFilters = [];
            var oViewModel = this.getModel("ViewModel");
            //var oPlantMInput = this.getView().byId("plantMIput");
            var oPurchaseOrderMI = this.byId("PurchaseOrderInput");
            var oSampleTypeMI = this.byId("sampleTypeMInput");
            var oMaterialMInput = this.getView().byId("materialMInput");
            var oBatchMInput = this.getView().byId("batchMInput");
            var oFormulaMInput = this.getView().byId("formulaMInput");
            var oDateRange = this.getView().byId("dateRangeSelection");
            // var sSelectedKey = oStatusSelect.getSelectedKey();
            //var oMsgStrip = this.getView().byId("msgstrip");
            var dStartDate = oDateRange.getDateValue();
            var dEndDate = oDateRange.getSecondDateValue();
            //var aPlantTokens = oPlantMInput.getTokens();
            var aPurchaseOrderTokens = oPurchaseOrderMI.getTokens();
            var aSampleTypeTokens = oSampleTypeMI.getTokens();
            var aMaterialTokens = oMaterialMInput.getTokens();
            var aBatchTokens = oBatchMInput.getTokens();
            var aFormulaTokens = oFormulaMInput.getTokens();

            //var aPlantFilters = [];
            var aMaterialFilters = [];
            var aBatchFilters = [];
            var aFormulaFilters = [];

            if (this.sPlant) {
                aTableFilters.push(new Filter({ path: "Werk", operator: FilterOperator.EQ, value1: this.sPlant }));
            }

            if (dStartDate && dEndDate) {
                aTableFilters.push(new Filter({
                    filters: [
                        new Filter({ path: "CreateDt", operator: FilterOperator.GE, value1: dStartDate }),
                        new Filter({ path: "CreateDt", operator: FilterOperator.LE, value1: dEndDate })
                    ],
                    and: true
                }));
            }
            if (aPurchaseOrderTokens.length > 0) {
                let aPOFilters = [];

                aPurchaseOrderTokens.forEach(function (oToken) {
                    if (oToken.getKey()) {

                        const sEbeln = oToken.getKey();

                        //const sEbelp = oToken.getCustomData()[0]?.getValue() || "";

                        aPOFilters.push(new sap.ui.model.Filter({
                            filters: [
                                new sap.ui.model.Filter("Ebeln", sap.ui.model.FilterOperator.EQ, sEbeln),
                                // new sap.ui.model.Filter("Ebelp", sap.ui.model.FilterOperator.EQ, sEbelp)
                            ],
                            and: true
                        }));
                    }
                });

                if (aPOFilters.length > 0) {
                    aTableFilters.push(new sap.ui.model.Filter({ filters: aPOFilters, and: false }));
                }
            }

            if (aSampleTypeTokens.length > 0) {
                let aSampleFilters = [];

                aSampleTypeTokens.forEach(function (oToken) {
                    if (oToken.getKey()) {
                        aSampleFilters.push(
                            new sap.ui.model.Filter("Userc2", sap.ui.model.FilterOperator.EQ, oToken.getKey())
                        );
                    }
                });

                if (aSampleFilters.length > 0) {
                    aTableFilters.push(new sap.ui.model.Filter({ filters: aSampleFilters, and: false }));
                }
            }

            var aSyrupBatchTokens = this.byId("syrupBatchMInput").getTokens();

            if (aSyrupBatchTokens.length > 0) {
                let aSyrupFilters = [];

                aSyrupBatchTokens.forEach(function (oToken) {
                    if (oToken.getKey()) {
                        aSyrupFilters.push(
                            new sap.ui.model.Filter("Userc1", sap.ui.model.FilterOperator.EQ, oToken.getKey())
                        );
                    }
                });

                if (aSyrupFilters.length > 0) {
                    aTableFilters.push(new sap.ui.model.Filter({ filters: aSyrupFilters, and: false }));
                }
            }

            if (aMaterialTokens.length > 0) {
                for (var i = 0; i < aMaterialTokens.length; i++) {
                    if (aMaterialTokens[i].getKey()) {
                        aMaterialFilters.push(new Filter({ path: "Matnr", operator: FilterOperator.EQ, value1: aMaterialTokens[i].getKey() }));
                    }
                }

                if (aMaterialFilters.length > 0) {
                    aTableFilters.push(new Filter({ filters: aMaterialFilters, and: false }));
                }
            }

            if (aBatchTokens.length > 0) {
                for (var i = 0; i < aBatchTokens.length; i++) {
                    if (aBatchTokens[i].getKey()) {
                        aBatchFilters.push(new Filter({ path: "Charg", operator: FilterOperator.EQ, value1: aBatchTokens[i].getKey() }));
                    }
                }

                if (aBatchFilters.length > 0) {
                    aTableFilters.push(new Filter({ filters: aBatchFilters, and: false }));
                }
            }

            if (aFormulaTokens.length > 0) {
                for (var i = 0; i < aFormulaTokens.length; i++) {
                    if (aFormulaTokens[i].getKey()) {
                        aFormulaFilters.push(new Filter({ path: "Zzhbcformula", operator: FilterOperator.EQ, value1: aFormulaTokens[i].getKey() }));
                    }
                }

                if (aFormulaFilters.length > 0) {
                    aTableFilters.push(new Filter({ filters: aFormulaFilters, and: false }));
                }
            }

            var oStatusCombo = this.byId("statusCombo");
            var sStatusKey = oStatusCombo.getSelectedKey();
            var sStatusDesc = oStatusCombo.getSelectedItem();
            if (sStatusDesc) {
                const oItem = oStatusCombo.getSelectedItem();
                if (oItem) {
                    sStatusKey = oItem.getKey();
                }
            }

            if (sStatusDesc) {
                aTableFilters.push(
                    new sap.ui.model.Filter("Vbewertung", sap.ui.model.FilterOperator.EQ, sStatusKey)
                );
            }

            return aTableFilters;

        },
        /**
         * Internal Function to add Items, Filters and Sort to Header Table
         * @param {sap.ui.model.Filter[]} aTableFilters Array of Filters
         * @private
         */
        _filterHeaderTable: function (aTableFilters) {

            if (this.oTable.getBinding("items")) {
                this.oTable.getBinding("items").filter(aTableFilters);
            } else {

                this.oTable.bindAggregation("items", {
                    path: "/InspectionHeaderSet",
                    template: this.getView().byId("clmlistitem").clone().setVisible(true)
                });

                this.oTable.getBinding("items").filter(aTableFilters);
            }
        },

        PlantF4: async function () {
            const oView = this.getView();
            let oPlantF4Model = oView.getModel("PlantModel");
            let oPlantF4Data = {};

            const sUserEmail = (this._userEmail || "").toUpperCase();

            try {
                oPlantF4Data = await this.readDataFromODataModel("/Plant_User_F4Set", [
                    new Filter({ path: "UserId", operator: FilterOperator.EQ, value1: sUserEmail }),
                    new Filter({ path: "AppName", operator: FilterOperator.EQ, value1: "MECQCEMEA" })
                ]);
            } catch (err) {
                console.error("Error fetching Plant F4 data:", err);
            }

            if (oPlantF4Model) {
                oPlantF4Model.setData(oPlantF4Data);
            } else {
                oPlantF4Model = new JSONModel(oPlantF4Data);
                oPlantF4Model.setSizeLimit(100000);
                oView.setModel(oPlantF4Model, "PlantModel");
            }
        },


        onOpenDialogPlantValueHelpF4: function () {
            var oView = this.getView();
            this.PlantF4();
            if (!this._oDialog3) {
                Fragment.load({
                    id: oView.getId(),
                    name: "com.monsterenergy.qm.me.qm.qateam.fragment.MultiPlantValueHelpDialog",
                    controller: this
                }).then(function (oDialog3) {
                    this._oDialog3 = oDialog3;
                    oView.addDependent(this._oDialog3);
                    this._oDialog3.open();
                }.bind(this));
            } else {
                this._oDialog3.open();
            }
        },

        onPlantClose: function (oEvent) {
            const aSelectedItems = oEvent.getParameter("selectedItems") || [];
            const oMultiInput = this.byId("plantMIput");

            oMultiInput.removeAllTokens();

            if (aSelectedItems.length === 0) return;

            const oSelectedItem = aSelectedItems[0];
            const sWerks = oSelectedItem.getTitle();
            const sPlantName = oSelectedItem.getDescription();

            oMultiInput.addToken(new sap.m.Token({
                key: sWerks,
                text: `${sWerks} (${sPlantName})`
            }));

            this._applyPlantSelection(sWerks, sPlantName);
            this._enableMaterialInputs();
        },

        onPlantTokenChange: function () {
            const aTokens = this.byId("plantMIput").getTokens();
            if (aTokens.length === 0) return;

            const oToken = aTokens[0];
            const sWerks = oToken.getKey();
            const sText = oToken.getText();
            const match = /\(([^)]+)\)/.exec(sText);
            const sPlantName = match ? match[1] : "";

            this._applyPlantSelection(sWerks, sPlantName);
            this._enableMaterialInputs();
        },

        _enableMaterialInputs: function () {
            const oView = this.getView();
            oView.byId("materialMInput")?.setEnabled(true);
            oView.byId("batchMInput")?.setEnabled(true);
            oView.byId("formulaMInput")?.setEnabled(true);
        },

        _applyPlantSelection: function (sWerks, sPlantName) {
            this.sPlant = sWerks;
            this.sPlantName = sPlantName;

            this.getModel("ViewModel").setProperty("/Plant", sWerks);
            this.getModel("ViewModel").setProperty("/PlantName", sPlantName);

            const oPlantNameField = this.byId("plantName");
            if (oPlantNameField) {
                oPlantNameField.setValue(sPlantName);
            }

            this.getMaterialF4();
            this.getBatchF4([]);
            this.getFormulaF4();
        },

        _handleValueHelpSearchPlant: function (evt) {
            var aFilters = [];
            var sQuery = evt.getParameter("value");
            if (sQuery && sQuery.length > 0) {
                var oFilter1 = [new sap.ui.model.Filter("Werks", sap.ui.model.FilterOperator.Contains, sQuery),
                ];
                var allFilters = new sap.ui.model.Filter(oFilter1, false);
                aFilters.push(allFilters);
            }
            var oList = this.byId("plantDialog");
            var oBinding = oList.getBinding("items");
            oBinding.filter(aFilters);
        },

        getMaterialF4: async function () {
            var oMaterialF4Model = this.getView().getModel("MaterialF4Model");
            var oMaterialF4 = {};
            try {
                oMaterialF4 = await this.readDataFromODataModel("/Material_F4Set",
                    [new Filter({ path: "Werks", operator: FilterOperator.EQ, value1: this.sPlant })]);
            } catch (error) { }

            if (oMaterialF4Model) {
                oMaterialF4Model.setData(oMaterialF4);
            } else {
                oMaterialF4Model = new JSONModel(oMaterialF4);
                oMaterialF4Model.setSizeLimit(100000);
                this.getView().setModel(oMaterialF4Model, "MaterialF4Model");
            }
        },

        onMaterialTokenChange: function (oEvent) {
            var oParameters = oEvent.getParameters();
            var oSource = oEvent.getSource();
            var oMaterialF4Model = this.getView().getModel("MaterialF4Model");
            var aMaterials = [];

            /*if (oParameters.type === "removed") {
                this._oBatchMultiInput.removeAllTokens();
                this._oBatchMultiInput.setEditable(false);
                this._oformulaMultiInput.removeAllTokens();
                this._oformulaMultiInput.setEditable(false);
                return;
            }*/

            oParameters.addedTokens.forEach(oToken => {
                var oFound = oMaterialF4Model.getProperty("/results").find((oResult) => oToken.getKey() === oResult.Matnr);
                if (!oFound) {
                    oSource.removeToken(oToken);
                    MessageToast.show("Invalid Material");
                }
            })
            /*oSource.getTokens().forEach(oToken => aMaterials.push(oToken.getKey()));
             if (aMaterials.length > 0) {
                 this.getBatchF4(aMaterials);
                 this._oBatchMultiInput.setEditable(true);
             } else {
                 this._oBatchMultiInput.removeAllTokens();
                 this._oBatchMultiInput.setEditable(false);
                 this._oformulaMultiInput.removeAllTokens();
                 this._oformulaMultiInput.setEditable(false);
             }*/
            this.onFilterGroupItemChange(oEvent);
        },
        /**
            * Event handler for Material Valuehelp Request event
            * Opens Material Valuehelp Dialog
            * @public
            */
        onMaterialValueHelpRequested: async function (oEvent) {
            this._oMaterialSourceIp = oEvent.getSource();
            this.getMaterialF4();

            try {
                if (!this._oMaterialValueHelpDialog) {
                    this._oMaterialValueHelpDialog = await this.loadFragment({
                        name: "com.monsterenergy.qm.me.qm.qateam.fragment.MaterialValueHelpDialog"
                    });
                }
            } catch (error) {
                return;
            }
            if (this._oMaterialSourceIp instanceof sap.m.MultiInput) {
                this._oMaterialValueHelpDialog.setMultiSelect(true);
            } else {
                this._oMaterialValueHelpDialog.setMultiSelect(false);
            }

            this._oMaterialValueHelpDialog.open();
        },
        onMaterialLiveChange: function (oEvent) {
            this.getMaterialF4();
        },
        onMaterialSearch: function (oEvent) {
            var sSearchQuery = oEvent.getParameter("value");
            var oBinding = oEvent.getSource().getBinding("items");
            var oFilter = new Filter({
                filters: [
                    new Filter({ path: "Matnr", operator: FilterOperator.Contains, value1: sSearchQuery }),
                    new Filter({ path: "Maktx", operator: FilterOperator.Contains, value1: sSearchQuery }),
                ],
                and: false
            });

            if (sSearchQuery) {
                oBinding.filter([oFilter]);
            } else {
                oBinding.filter([]);
            }
        },

        onMaterialClose: function (oEvent) {
            var aContexts = oEvent.getParameter("selectedContexts");
            var aTokens = [];
            var aMaterials = [];

            if (aContexts && aContexts.length) {
                for (var i = 0; i < aContexts.length; i++) {
                    var oObject = aContexts[i].getObject();
                    aTokens.push(new Token({ key: oObject.Matnr, text: oObject.Matnr }));
                }
            }
            if (this._oMaterialSourceIp instanceof sap.m.MultiInput) {
                aTokens.forEach(oToken => this._oMaterialSourceIp.addToken(oToken));

                /*this._oMaterialSourceIp.getTokens().forEach(oToken => aMaterials.push(oToken.getKey()));
                if (aMaterials.length > 0) {
                    this.getBatchF4(aMaterials);
                    this._oBatchMultiInput.setEditable(true);
                }*/
                this.onFilterGroupItemChange(oEvent);
            } else if (aTokens.length > 0) {
                this._oMaterialSourceIp.setValue(aTokens[0].getKey());
                this._oMaterialSourceIp.setValueState("None");
                aMaterials.push(aTokens[0].getKey());

                var oBatchIp = this.getView().byId("create_batch");
                oBatchIp.setValue("");
                oBatchIp.setEditable(true);
                this._setSubmitDialogDefaultvalues();
                this.getBatchF4(aMaterials);
            }

            oEvent.getSource().getBinding("items").filter([]);
        },
        onMaterialCancel: function (oEvent) {
            oEvent.getSource().getBinding("items").filter([]);
        },
        getBatchF4: async function (aMaterials) {
            var oBatchF4Model = this.getView().getModel("BatchF4Model");
            var oBatchF4 = {};
            var aMaterialFilters = [];
            var aFilters = [];

            if (aMaterials && aMaterials.length > 0) {
                for (var i = 0; i < aMaterials.length; i++) {
                    aMaterialFilters.push(new Filter({ path: "Matnr", operator: FilterOperator.EQ, value1: aMaterials[i] }));
                }
            }
            if (this.sPlant) {
                aFilters.push(new Filter({ path: "Werks", operator: FilterOperator.EQ, value1: this.sPlant }));
            }
            if (aMaterialFilters.length > 0) {
                aFilters.push(new Filter({ filters: aMaterialFilters, and: false }));
            }
            try {
                oBatchF4 = await this.readDataFromODataModel("/BatchAll_F4Set", aFilters);
            } catch (error) { }

            if (oBatchF4Model) {
                oBatchF4Model.setData(oBatchF4);
            } else {
                oBatchF4Model = new JSONModel(oBatchF4);
                oBatchF4Model.setSizeLimit(100000);
                this.getView().setModel(oBatchF4Model, "BatchF4Model");
            }
        },
        onBatchTokenChange: function (oEvent) {
            var oParameters = oEvent.getParameters();
            var oSource = oEvent.getSource();
            var oBatchF4Model = this.getView().getModel("BatchF4Model");
            var aMaterials = [];
            var aBatch = [];

            /*if (oParameters.type === "removed") {
                this._oformulaMultiInput.removeAllTokens();
                this._oformulaMultiInput.setEditable(false);
                return;
            }*/

            oParameters.addedTokens.forEach(oToken => {
                var oFound = oBatchF4Model.getProperty("/results").find((oResult) => oToken.getKey() === oResult.Charg);
                if (!oFound) {
                    oSource.removeToken(oToken);
                    MessageToast.show("Invalid Batch");
                }
            })
            /*this._oMaterialMultiInput.getTokens().forEach(oToken => aMaterials.push(oToken.getKey()));
            oSource.getTokens().forEach(oToken => aBatch.push(oToken.getKey()));
            if (aMaterials.length > 0 && aBatch.length > 0) {
                this.getFormulaF4(aMaterials, aBatch);
                this._oformulaMultiInput.setEditable(true);
            } else {
                this._oformulaMultiInput.removeAllTokens();
                this._oformulaMultiInput.setEditable(false);
            }*/
            this.onFilterGroupItemChange(oEvent);
        },
        /**
        * Event handler for Material Valuehelp Request event
        * Opens Material Valuehelp Dialog
        * @public
        */
        onBatchValueHelpRequested: async function (oEvent) {
            var aMaterials = [];


            if (this._oMaterialSourceIp) {
                this._oMaterialSourceIp.getTokens().forEach(oToken => {
                    aMaterials.push(oToken.getKey());
                });
            }

            await this.getBatchF4(aMaterials);

            this._oBatchSourceIp = oEvent.getSource();

            try {
                if (!this._oBatchValueHelpDialog) {
                    this._oBatchValueHelpDialog = await this.loadFragment({
                        name: "com.monsterenergy.qm.me.qm.qateam.fragment.BatchValueHelpDialog"
                    });
                }
            } catch (error) {
                return;
            }

            if (this._oBatchSourceIp instanceof sap.m.MultiInput) {
                this._oBatchValueHelpDialog.setMultiSelect(true);
            } else {
                this._oBatchValueHelpDialog.setMultiSelect(false);
            }

            this._oBatchValueHelpDialog.open();
        },


        onBatchSearch: function (oEvent) {
            var sSearchQuery = oEvent.getParameter("value");
            var oBinding = oEvent.getSource().getBinding("items");

            if (sSearchQuery) {
                oBinding.filter([new Filter({ path: "Charg", operator: FilterOperator.Contains, value1: sSearchQuery })]);
            } else {
                oBinding.filter([]);
            }
        },

        onBatchClose: function (oEvent) {
            var aContexts = oEvent.getParameter("selectedContexts");
            var aTokens = [];
            var aMaterials = [];
            var aBatch = [];

            if (aContexts && aContexts.length) {
                for (var i = 0; i < aContexts.length; i++) {
                    var oObject = aContexts[i].getObject();
                    aTokens.push(new Token({ key: oObject.Charg, text: oObject.Charg }));
                }
            }
            if (this._oBatchSourceIp instanceof sap.m.MultiInput) {
                aTokens.forEach(oToken => this._oBatchSourceIp.addToken(oToken));

                /*this._oMaterialMultiInput.getTokens().forEach(oToken => aMaterials.push(oToken.getKey()));
                this._oBatchSourceIp.getTokens().forEach(oToken => aBatch.push(oToken.getKey()));
                if (aMaterials.length > 0 && aBatch.length > 0) {
                    this.getFormulaF4(aMaterials, aBatch);
                    this._oformulaMultiInput.setEditable(true);
                }*/
                this.onFilterGroupItemChange(oEvent);
            } else if (aTokens.length > 0) {
                this._oBatchSourceIp.setValue(aTokens[0].getKey());
                this._oBatchSourceIp.setValueState("None");
                //this._getInspectionDetails();
            }

            oEvent.getSource().getBinding("items").filter([]);
        },

        onBatchLiveChange: async function (oEvent) {

            var aMaterials = [];

            if (this._oMaterialSourceIp) {
                this._oMaterialSourceIp.getTokens().forEach(oToken => {
                    aMaterials.push(oToken.getKey());
                });
            }

            // const sValue = oEvent.getParameter("value") || "";

            await this.getBatchF4(aMaterials);
        },

        onBatchCancel: function (oEvent) {
            oEvent.getSource().getBinding("items").filter([]);
        },

        getFormulaF4: async function (aMaterials, aBatch) {
            var oFormulaF4Model = this.getView().getModel("FormulaF4Model");
            var oFormulaF4 = {};
            var aMaterialFilters = [];
            var sBatchFilters = [];
            var FormulaFilters = [];

            FormulaFilters.push(new Filter({ path: "Werk", operator: FilterOperator.EQ, value1: this.sPlant }));

            if (aMaterials && aMaterials.length > 0) {
                for (var i = 0; i < aMaterials.length; i++) {
                    aMaterialFilters.push(new Filter({ path: "Matnr", operator: FilterOperator.EQ, value1: aMaterials[i] }));
                }
                FormulaFilters.push(new Filter({ filters: aMaterialFilters, and: false }));
            }

            if (aBatch && aBatch.length > 0) {
                for (var i = 0; i < aBatch.length; i++) {
                    sBatchFilters.push(new Filter({ path: "Charg", operator: FilterOperator.EQ, value1: aBatch[i] }));
                }
                FormulaFilters.push(new Filter({ filters: sBatchFilters, and: false }));
            }

            try {
                oFormulaF4 = await this.readDataFromODataModel("/HBCFORMULASet", FormulaFilters);
            } catch (error) { }

            if (oFormulaF4Model) {
                oFormulaF4Model.setData(oFormulaF4);
            } else {
                oFormulaF4Model = new JSONModel(oFormulaF4);
                oFormulaF4Model.setSizeLimit(100000);
                this.getView().setModel(oFormulaF4Model, "FormulaF4Model");
            }
        },

        onFormulaTokenChange: function (oEvent) {
            var oParameters = oEvent.getParameters();
            var oSource = oEvent.getSource();
            var oFormulaF4Model = this.getView().getModel("FormulaF4Model");

            /*if (oParameters.type === "removed") {
                return;
            }*/

            oParameters.addedTokens.forEach(oToken => {
                var oFound = oFormulaF4Model.getProperty("/results").find((oResult) => oToken.getKey() === oResult.Zzhbcformula);
                if (!oFound) {
                    oSource.removeToken(oToken);
                    MessageToast.show("Invalid Formula");
                }
            })
            this.onFilterGroupItemChange(oEvent);
        },
        /**
        * Event handler for Material Valuehelp Request event
        * Opens Material Valuehelp Dialog
        * @public
        */
        onFormulaValueHelpRequested: async function (oEvent) {
            this._oFormulaSourceIp = oEvent.getSource();

            try {
                if (!this._oFormulaValueHelpDialog) {
                    this._oFormulaValueHelpDialog = await this.loadFragment({
                        name: "com.monsterenergy.qm.me.qm.qateam.fragment.FormulaValueHelpDialog"
                    });
                }
            } catch (error) {
                return;
            }

            this._oFormulaValueHelpDialog.open();
        },

        onFormulaSearch: function (oEvent) {
            var sSearchQuery = oEvent.getParameter("value");
            var oBinding = oEvent.getSource().getBinding("items");

            if (sSearchQuery) {
                oBinding.filter([new Filter({ path: "Zzhbcformula", operator: FilterOperator.Contains, value1: sSearchQuery })]);
            } else {
                oBinding.filter([]);
            }
        },

        onFormulaClose: function (oEvent) {
            var aContexts = oEvent.getParameter("selectedContexts");
            var aTokens = [];
            if (aContexts && aContexts.length) {
                for (var i = 0; i < aContexts.length; i++) {
                    var oObject = aContexts[i].getObject();
                    this._oFormulaSourceIp.addToken(new Token({ key: oObject.Zzhbcformula, text: oObject.Zzhbcformula }));
                    //aTokens.push(new Token({ key: oObject.Matnr, text: oObject.Matnr }));
                }
            }
            //this._oFormulaSourceIp.setTokens(aTokens);
            oEvent.getSource().getBinding("items").filter([]);
            this.onFilterGroupItemChange(oEvent);
        },

        onFormulaCancel: function (oEvent) {
            oEvent.getSource().getBinding("items").filter([]);
        },

        SyrupBatchValueHelp: function (oEvent) {
            this.getSyrupBatchF4();

            this._oSyrupBatchSourceIp = oEvent.getSource();

            if (!this._oSyrupBatchValueHelpDialog) {
                this.loadFragment({
                    name: "com.monsterenergy.qm.me.qm.qateam.fragment.SyrupBatchValueHelpDialog"
                }).then(function (oDialog) {
                    this._oSyrupBatchValueHelpDialog = oDialog;
                    this._oSyrupBatchValueHelpDialog.open();
                }.bind(this));
            } else {
                this._oSyrupBatchValueHelpDialog.open();
            }
        },

        getSyrupBatchF4: function () {
            var oView = this.getView();
            var oModel = oView.getModel("SyrupBatchModel");
            var aFilters = [];

            aFilters.push(new sap.ui.model.Filter("Werk", sap.ui.model.FilterOperator.EQ, this.sPlant));

            var oSampleInput = this.byId("sampleTypeMInput");
            var aTokens = oSampleInput ? oSampleInput.getTokens() : [];

            if (aTokens.length === 1) {
                aFilters.push(new sap.ui.model.Filter("Userc1", sap.ui.model.FilterOperator.EQ, aTokens[0].getKey()));
            } else if (aTokens.length > 1) {
                var aOrFilters = aTokens.map(function (t) {
                    return new sap.ui.model.Filter("Userc1", sap.ui.model.FilterOperator.EQ, t.getKey());
                });

                aFilters.push(new sap.ui.model.Filter({
                    filters: aOrFilters,
                    and: false
                }));
            }

            this.readDataFromODataModel("/SyrupBatchNoSet", aFilters)
                .then(function (oData) {

                    if (oModel) {
                        oModel.setData(oData);
                    } else {
                        var oNewModel = new sap.ui.model.json.JSONModel(oData);
                        oNewModel.setSizeLimit(100000);
                        oView.setModel(oNewModel, "SyrupBatchModel");
                    }

                }.bind(this))
                .catch(function (err) {
                    var oError = JSON.parse(err.responseText || "{}");
                    var sMsg = oError.error?.message?.value || "Unknown Error";
                    sap.m.MessageBox.error(sMsg, { title: "Error" });
                });
        },

        onSyrupBatchSearch: function (oEvent) {
            let sValue = oEvent.getParameter("value");
            let oBinding = oEvent.getSource().getBinding("items");

            oBinding.filter([
                new sap.ui.model.Filter({
                    path: "Userc1",
                    operator: sap.ui.model.FilterOperator.Contains,
                    value1: sValue
                })
            ]);
        },

        onSyrupBatchClose: function (oEvent) {
            const oSelectedItem = oEvent.getParameter("selectedItem");
            const oInput = this._oSyrupBatchSourceIp;

            if (!oSelectedItem || !oInput) return;

            const ctx = oSelectedItem.getBindingContext("SyrupBatchModel");

            oInput.addToken(new sap.m.Token({
                key: ctx.getProperty("Userc1"),
                text: ctx.getProperty("Userc1")
            }));
        },


        onSyrupBatchVHCancel: function () {
            this._oSyrupBatchValueHelpDialog.close();
        },

        getSampleTypeF4: async function () {
            const oModel = this.getView().getModel("SampleTypeF4Model");
            let oData = {};

            try {

                oData = await this.readDataFromODataModel("/SampleType_F4Set", []);
            } catch (Error) {
                const oError = JSON.parse(Error.responseText);
                sap.m.MessageBox.error(oError.error.message.value, { title: "Error" });
                return;
            }

            if (oModel) {
                oModel.setData(oData);
            } else {
                const oNewModel = new sap.ui.model.json.JSONModel(oData);
                oNewModel.setSizeLimit(100000);
                this.getView().setModel(oNewModel, "SampleTypeModel");
            }
        },

        onSampleTypeValueHelp: async function (oEvent) {
            this.getSampleTypeF4();
            this._oSampleTypeSourceIp = oEvent.getSource();

            try {
                if (!this._oSampleTypeValueHelpDialog) {
                    this._oSampleTypeValueHelpDialog = await this.loadFragment({
                        name: "com.monsterenergy.qm.me.qm.qateam.fragment.SampleTypeValueHelpDialog"
                    });
                }
            } catch (error) {
                return;
            }

            this._oSampleTypeValueHelpDialog.open();
        },

        onSampleTypeClose: function (oEvent) {
            const aContexts = oEvent.getParameter("selectedContexts");
            const oInput = this._oSampleTypeSourceIp;

            if (!aContexts?.length || !oInput) return;

            aContexts.forEach(ctx => {
                const oObj = ctx.getObject();

                oInput.addToken(
                    new sap.m.Token({
                        key: oObj.SampleType,
                        text: oObj.SampleTypeDesc
                    })
                );
            });

            oEvent.getSource().getBinding("items").filter([]);
        },

        onSampleTypeSearch: function (oEvent) {
            const sQuery = oEvent.getParameter("value");
            const oBinding = oEvent.getSource().getBinding("items");

            const oFilter = new Filter({
                filters: [
                    new Filter({ path: "SampleType", operator: FilterOperator.Contains, value1: sQuery }),
                    new Filter({ path: "SampleTypeDesc", operator: FilterOperator.Contains, value1: sQuery })
                ],
                and: false
            });

            oBinding.filter(sQuery ? [oFilter] : []);
        },

        getPurchaseOrderF4: async function () {
            var oPurchaseOrderF4Model = this.getView().getModel("PurchaseOrderF4Model");
            var oPurchaseOrderF4 = {};
            try {
                oPurchaseOrderF4 = await this.readDataFromODataModel("/PO_F4Set",
                    [
                        new Filter({ path: "Werks", operator: FilterOperator.EQ, value1: this.sPlant }),
                        new Filter({ path: "Distinct", operator: FilterOperator.EQ, value1: "X" })
                    ]);

            } catch (Error) {
                var oError = JSON.parse(Error.responseText);
                var sMessage = oError.error.message.value;
                sap.m.MessageBox.error(sMessage, {
                    title: "Error"
                });
            }

            if (oPurchaseOrderF4Model) {
                oPurchaseOrderF4Model.setData(oPurchaseOrderF4);
            } else {
                oPurchaseOrderF4Model = new JSONModel(oPurchaseOrderF4);
                oPurchaseOrderF4Model.setSizeLimit(100000);
                this.getView().setModel(oPurchaseOrderF4Model, "PurchaseOrderF4Model");
            }
        },

        onPurchaseOrderValueHelp: async function (oEvent) {
            this.getPurchaseOrderF4();
            this._oPurchaseOrderSourceIp = oEvent.getSource();

            try {
                if (!this._oPurchaseOrderValueHelpDialog) {
                    this._oPurchaseOrderValueHelpDialog = await this.loadFragment({
                        name: "com.monsterenergy.qm.me.qm.qateam.fragment.POF4"
                    });
                }
            } catch (error) {
                return;
            }
            /*  if (this.oPurchaseOrderSourceIp instanceof sap.m.MultiInput) {
                  this._oPurchaseOrderValueHelpDialog.setMultiSelect(true);
              } else {
                  this._oPurchaseOrderValueHelpDialog.setMultiSelect(false);
              }
             */
            this._oPurchaseOrderValueHelpDialog.open();
        },

        onPOEnter: function (oEvent) {
            const oInput = oEvent.getSource();
            const sText = oEvent.getParameter("value") || "";

            if (!sText) return;

            const parts = sText.split("-");
            const sEbeln = parts[0]?.trim();
            const sEbelp = parts[1]?.trim() || "";

            if (!sEbeln) return;

            const oToken = new sap.m.Token({
                key: sEbeln,
                text: sText,
                customData: [
                    new sap.ui.core.CustomData({
                        key: "Ebelp",
                        value: sEbelp
                    })
                ]
            });

            oInput.addToken(oToken);
            oInput.setValue("");
        },

        onPOLiveChange: function (oEvent) {
            this.getPurchaseOrderF4();
        },

        onPurchaseOrderClose: function (oEvent) {
            var aContexts = oEvent.getParameter("selectedContexts");
            var oInput = this._oPurchaseOrderSourceIp;

            if (aContexts?.length) {
                aContexts.forEach(ctx => {
                    var oObj = ctx.getObject();
                    oInput.addToken(new sap.m.Token({
                        key: oObj.Ebeln,
                        text: oObj.Ebeln + " - " + oObj.Ebelp,
                        customData: [
                            new sap.ui.core.CustomData({ key: "Ebelp", value: oObj.Ebelp })
                        ]
                    }));
                });
            }

            this.onFilterGroupItemChange(oEvent);
            oEvent.getSource().getBinding("items").filter([]);
        },

        onPurchaseOrderChange: function (oEvent) {
            const oInput = oEvent.getSource();
            let sValue = oInput.getValue().trim();
            if (!sValue) return;

            sValue = sValue.replace(/\/|-|\s+/g, " ").trim();
            const parts = sValue.split(" ");
            if (parts.length < 2) return;

            const sEbeln = parts[0];
            const sEbelp = parts[1];

            const oToken = new sap.m.Token({
                key: sEbeln,
                text: sEbeln + " / " + sEbelp,
                customData: [
                    new sap.ui.core.CustomData({ key: "Ebelp", value: sEbelp })
                ]
            });

            oInput.addToken(oToken);
            oInput.setValue("");
        },


        onPurchaseOrderSearch: function (oEvent) {
            var sSearchQuery = oEvent.getParameter("value");
            var oBinding = oEvent.getSource().getBinding("items");
            var oFilter = new Filter({
                filters: [
                    new Filter({ path: "Ebeln", operator: FilterOperator.Contains, value1: sSearchQuery }),
                    new Filter({ path: "Ebelp", operator: FilterOperator.Contains, value1: sSearchQuery }),
                ],
                and: false
            });

            if (sSearchQuery) {
                oBinding.filter([oFilter]);
            } else {
                oBinding.filter([]);
            }
        },

        onPurchaseOrderValueHelpRequested: function (oEvent) {
            this._oPOSourceIp = oEvent.getSource();
            const oView = this.getView();
            if (!this._oPOFragment) {
                this._oPOFragment = sap.ui.xmlfragment(
                    oView.getId(),
                    "com.monsterenergy.qm.me.qm.qateam.fragment.PurchaseOrderValueHelpDialog",
                    this
                );
                oView.addDependent(this._oPOFragment);
            }
            this.loadPOList();
            const oBinding = this._oPOFragment.getBinding("items");
            if (oBinding) oBinding.filter([]);
            this._oPOFragment.open();
        },

        loadPOList: function () {
            const oModel = this.getView().getModel();
            const oView = this.getView();
            let oPOModel = oView.getModel("POModel");
            if (!oPOModel) {
                oPOModel = new sap.ui.model.json.JSONModel();
                oPOModel.setSizeLimit(50000);
                oView.setModel(oPOModel, "POModel");
            }
            const aFilters = [new sap.ui.model.Filter("Werks", sap.ui.model.FilterOperator.EQ, this.sPlant)];
            oModel.read("/PO_F4Set", {
                filters: aFilters,
                success: function (oData) { oPOModel.setData(oData); },
                error: function () { oPOModel.setData({ results: [] }); }
            });
        },

        onPOSearch: function (oEvent) {
            const sQuery = oEvent.getParameter("value").trim();
            const oList = oEvent.getSource();
            const oBinding = oList.getBinding("items");

            if (!oBinding) {
                return;
            }

            if (!sQuery) {
                oBinding.filter([]);
                return;
            }

            const aSearchFields = ["Ebeln", "Ebelp", "Matnr", "Charg", "Maktx", "Werks", "Lifnr", "Menge"];

            const aFilters = aSearchFields.map(field =>
                new sap.ui.model.Filter(field, sap.ui.model.FilterOperator.Contains, sQuery)
            );

            const oCombinedFilter = new sap.ui.model.Filter({
                filters: aFilters,
                and: false
            });

            oBinding.filter([oCombinedFilter]);
        },

        formatPOValue: function (ebeln, ebelp) {
            if (!ebeln) return "";
            return ebelp ? `${ebeln} - ${ebelp}` : ebeln;
        },

        onPOSelect: function (oEvent) {
            const aContexts = oEvent.getParameter("selectedContexts");
            if (!aContexts?.length) return;
            const oSelected = aContexts[0].getObject();
            const oSubmitModel = this._oSubmitNewDialog.getModel("SubmitNewModel");
            this.sSelectedPO = oSelected.Ebeln;
            this.sSelectedPOItem = oSelected.Ebelp;
            oSubmitModel.setProperty("/Ebeln", oSelected.Ebeln);
            oSubmitModel.setProperty("/Ebelp", oSelected.Ebelp);
            oSubmitModel.setProperty("/Matnr", oSelected.Matnr);
            this.POFormulaF4();
            oSubmitModel.setProperty("/Charg", oSelected.Charg);
            oEvent.getSource().getBinding("items").filter([]);
        },

        onPurchaseOrderChangeInsp: function (oEvent) {
            const sValue = oEvent.getSource().getValue().trim();
            const oModel = this._oSubmitNewDialog.getModel("SubmitNewModel");
            const oPOModel = this.getView().getModel("POModel");
            if (!oPOModel) {
                MessageToast.show("PO list not loaded");
                return;
            }
            const aPOList = oPOModel.getProperty("/results") || [];

            if (!sValue) {
                oModel.setProperty("/Ebeln", "");
                oModel.setProperty("/Ebelp", "");
                oModel.setProperty("/Matnr", "");
                oModel.setProperty("/Charg", "");
                oModel.setProperty("/Zzhbcformula", "");
                return;
            }

            const oFound = aPOList.find(po => po.Ebeln === sValue);

            if (oFound) {
                oModel.setProperty("/Ebeln", oFound.Ebeln);
                oModel.setProperty("/Ebelp", oFound.Ebelp || "");
                oModel.setProperty("/Matnr", oFound.Matnr || "");
                oModel.setProperty("/Charg", oFound.Charg || "");
                oModel.setProperty("/Werk", this.sPlant);

                this.POFormulaF4();

            } else {
                oModel.setProperty("/Ebeln", "");
                oModel.setProperty("/Ebelp", "");
                oModel.setProperty("/Matnr", "");
                oModel.setProperty("/Charg", "");
                oModel.setProperty("/Zzhbcformula", "");

                MessageToast.show("Invalid Purchase Order");
            }
        },

        onBatchChange: function (oEvent) {
            const sBatch = oEvent.getParameter("value")?.trim() || "";
            const oFormulaModel = this.getView().getModel("FormulaModel");

            if (!sBatch) {
                oFormulaModel.setData({ results: [] });
                this.byId("idFormula").setSelectedKey("");
                return;
            }

            this.POFormulaF4(sBatch);
        },

        POFormulaF4: async function () {
            try {
                const sEbeln = this.sSelectedPO;
                const sEbelp = this.sSelectedPOItem;
                const sMaterial = this.byId("create_material").getValue();
                const sBatch = this.byId("create_batch").getValue();
                if (!sBatch) return;
                const sPlant = this.sPlant;
                if (!sEbeln || !sEbelp || !sMaterial || !sPlant) return;

                const aFilters = [
                    new Filter("Ebeln", FilterOperator.EQ, sEbeln),
                    new Filter("Ebelp", FilterOperator.EQ, sEbelp),
                    new Filter("Matnr", FilterOperator.EQ, sMaterial),
                    new Filter("Werk", FilterOperator.EQ, sPlant),
                    new Filter("Charg", FilterOperator.EQ, sBatch)
                ];

                const oResponse = await this.readDataFromODataModel("/ALLHBCFORMULASet", aFilters);
                const aResults = oResponse?.results || [];

                const oFormulaModel = this.getView().getModel("FormulaModel")
                    || new sap.ui.model.json.JSONModel();

                oFormulaModel.setData({ results: aResults });
                this.getView().setModel(oFormulaModel, "FormulaModel");

                const oCB = this.byId("idFormulaCB");
                oCB.setSelectedKey("");

                const oSubmitModel = this.getView().getModel("SubmitNewModel");
                oSubmitModel.setProperty("/Zzhbcformula", "");

                if (aResults.length === 1) {
                    const oSingle = aResults[0];

                    oCB.setSelectedKey(oSingle.Zzhbcformula);
                    oSubmitModel.setProperty("/Zzhbcformula", oSingle.Zzhbcformula);

                    this._setFormulaDetails(oSingle);
                }

            } catch (err) { }
        },

        _setFormulaDetails: function (oFormulaData) {
            if (!oFormulaData) return;

            var oSubmitModel = this.getView().getModel("SubmitNewModel");

            oSubmitModel.setProperty("/PLNAL", oFormulaData.PLNAL || "");
            oSubmitModel.setProperty("/PLNNR", oFormulaData.PLNNR || "");
            oSubmitModel.setProperty("/PLNTY", oFormulaData.PLNTY || "");
            oSubmitModel.setProperty("/Werk", oFormulaData.Werk || "");
            oSubmitModel.setProperty("/ZAEHL", oFormulaData.ZAEHL || "");
            oSubmitModel.setProperty("/ZKRIZ", oFormulaData.ZKRIZ || "");
            oSubmitModel.setProperty("/Zzhbcformula", oFormulaData.Zzhbcformula || "");
        },

        onFormulaChange: function (oEvent) {
            const oCB = oEvent.getSource();
            const sKey = oCB.getSelectedKey();
            const oSubmitModel = this.getView().getModel("SubmitNewModel");

            if (!sKey) {
                oSubmitModel.setProperty("/Zzhbcformula", "");
                return;
            }

            const oFormula = oCB.getSelectedItem()
                .getBindingContext("FormulaModel")
                .getObject();

            oSubmitModel.setProperty("/Zzhbcformula", oFormula.Zzhbcformula);
            this._setFormulaDetails(oFormula);
        },

        onSubmitNewPress: function () {
            const oView = this.getView();
            if (!this._oSubmitNewDialog) {
                this._oSubmitNewDialog = sap.ui.xmlfragment(
                    oView.getId(),
                    "com.monsterenergy.qm.me.qm.qateam.fragment.SubmitNewDialog",
                    this
                );
                oView.addDependent(this._oSubmitNewDialog);
            }
            let oSubmitModel = this.getView().getModel("SubmitNewModel");
            if (!oSubmitModel) {
                oSubmitModel = new sap.ui.model.json.JSONModel({});
                this.getView().setModel(oSubmitModel, "SubmitNewModel");
            }
            oSubmitModel.setData({ Ebeln: "", Ebelp: "", Matnr: "", Charg: "", Zzhbcformula: "" });
            this._oSubmitNewDialog.open();
        },

        onCancelPress: function () {
            if (this._oSubmitNewDialog) {
                this._oSubmitNewDialog.close();
            }
        },

        onFormulaChange: function (oEvent) {
            const oCB = oEvent.getSource();
            const sKey = oCB.getSelectedKey();
            const oSubmitModel = this.getView().getModel("SubmitNewModel");

            if (!sKey) {
                this.sSelectedFormula = "";
                oSubmitModel.setProperty("/Zzhbcformula", "");
                return;
            }

            const oFormula = oCB.getSelectedItem()
                .getBindingContext("FormulaModel")
                .getObject();

            this.sSelectedFormula = oFormula.Zzhbcformula;

            oSubmitModel.setProperty("/Zzhbcformula", oFormula.Zzhbcformula);

            this._setFormulaDetails(oFormula);
        },

        onSubmitPress: async function () {
            const oSubmitModel = this._oSubmitNewDialog.getModel("SubmitNewModel");
            const oSubmit = oSubmitModel.getData();
            if (!oSubmit.Ebeln || !oSubmit.Ebelp || !oSubmit.Matnr) {
                return MessageToast.show("Please select a valid PO with Item and Material");
            }
            // const oData = oModel.getData();
            BusyIndicator.show();

            // const oInspectionResult = await this._getInspectionDetails();
            /*
                        if (oInspectionResult) {
                            const sFormula =
                                this.sSelectedFormula ||
                                oData.Zzhbcformula ||
                                "NA";
                            this.getFormulaF4();
                            this._navToInspChars(
                                oData.Werk,
                                oData.Matnr,
                                // oData.Matkx,
                                oData.Charg,
                                true,
                                oData.Ebeln,
                                oData.Ebelp,
                                sFormula
                            );
                            this._oSubmitNewDialog.close();
                        } else {
                            MessageToast.show("Inspection Details Not Found");
                        }
            
                        BusyIndicator.hide();
                        */
            const sFormula =
                this.sSelectedFormula ||
                oSubmit.Zzhbcformula ||
                "NA";
            this._navToInspChars(
                oSubmit.Werk,
                oSubmit.Matnr,
                oSubmit.Charg,
                true,
                oSubmit.Ebeln,
                oSubmit.Ebelp,
                sFormula
            );
            this._oSubmitNewDialog.close();
            BusyIndicator.hide();
        },

        _getInspectionDetails: async function () {
            const oModel = this._oSubmitNewDialog.getModel("SubmitNewModel");
            const oData = oModel.getData();

            const aFilters = [
                new Filter("Werk", FilterOperator.EQ, this.sPlant)
            ];

            if (oData.Ebeln) aFilters.push(new Filter("Ebeln", FilterOperator.EQ, oData.Ebeln));
            if (oData.Ebelp) aFilters.push(new Filter("Ebelp", FilterOperator.EQ, oData.Ebelp));
            if (oData.Matnr) aFilters.push(new Filter("Matnr", FilterOperator.EQ, oData.Matnr));
            if (oData.Charg) aFilters.push(new Filter("Charg", FilterOperator.EQ, oData.Charg));
            if (oData.Zzhbcformula) aFilters.push(new Filter("Zzhbcformula", FilterOperator.EQ, oData.Zzhbcformula));

            let oResponse = { results: [] };

            try {
                oResponse = await this.readDataFromODataModel("/InspectionDetailsSet", aFilters);
            } catch (e) { }

            if (oResponse.results.length > 0) {
                const r = oResponse.results[0];
                //oModel.setProperty("/Zzhbcformula", r.Zzhbcformula);
                oModel.setProperty("/Atwrt", r.Atwrt);
                oModel.setProperty("/Hsdat", r.Hsdat);
                return r;
            }

            return null;
        },

        onItemPress: function (oEvent) {
            const oPressedItem = oEvent.getParameter("listItem") || oEvent.getSource();
            const oSelObj = oPressedItem.getBindingContext().getObject();

            this._navToInspChars(
                oSelObj.Werk,
                oSelObj.Matnr,
                oSelObj.Charg,
                false,
                oSelObj.Ebeln,
                oSelObj.Ebelp,
                oSelObj.Zzhbcformula
            );
        },

        _navToInspChars: function (sPlant, sMaterial, sBatch, bIsSubmitNew, sEbeln, sEbelp, sFormula) {
            const plant = sPlant || this.sPlant;

            if (!plant) {
                MessageBox.error("Plant is missing. Cannot navigate.");
                return;
            }

            let finalFormula = (sFormula && sFormula.trim()) || "NA";

            const oParams = {
                Plant: encodeURIComponent(plant),
                Material: encodeURIComponent(sMaterial || ""),
                Batch: encodeURIComponent(sBatch || ""),
                IsSubmitNew: encodeURIComponent(bIsSubmitNew),
                Ebeln: encodeURIComponent(sEbeln || ""),
                Ebelp: encodeURIComponent(sEbelp || ""),
                Formula: encodeURIComponent(finalFormula),
                IsQMUser: encodeURIComponent(this._isQMUser ? "true" : "false")
            };

            this.getRouter().navTo("RouteCharacteristicOverview", oParams);
        },

        /**
         * Event handler for Export to Excel button press.
         * Gets selected table items and calls the OData service to export data.
         * @public
         */
        onExportToExcelPress: function () {
            var oTable = this.getView().byId("table");
            var aSelectedItems = oTable.getSelectedItems();

            if (!aSelectedItems || aSelectedItems.length === 0) {
                MessageToast.show("Please select at least one record to export.");
                return;
            }

            // Limit maximum selections to 25 for performance
            if (aSelectedItems.length > 25) {
                MessageToast.show("Maximum 25 records can be exported at a time. Please select fewer records.");
                return;
            }

            // Extract Material and Batch from selected items
            var aBatchInputSet = [];
            for (var i = 0; i < aSelectedItems.length; i++) {
                var oSelectedItem = aSelectedItems[i];
                var oContext = oSelectedItem.getBindingContext();
                if (oContext) {
                    var oData = oContext.getObject();
                    if (oData.Matnr && oData.Charg) {
                        aBatchInputSet.push({
                            Material: oData.Matnr,
                            Batch: oData.Charg,
                            PO: oData.Ebeln || "",
                            POItem: oData.Ebelp || "",
                            Formula: oData.Zzhbcformula || ""
                        });
                    }
                }
            }

            if (aBatchInputSet.length === 0) {
                MessageToast.show("Selected records do not contain valid Material and Batch information.");
                return;
            }

            BusyIndicator.show();
            var oThis = this;
            var oDownloadModel = this.getOwnerComponent().getModel("downloadService");

            if (aBatchInputSet.length === 1) {
                // Generate unique RequestId 
                var sTimestamp = String(new Date().getTime()).slice(-6);
                var sRandom = Math.random().toString(36).substr(2, 4).toUpperCase();
                var sRequestId = sTimestamp + sRandom;

                var oPayload = {
                    RequestId: sRequestId,
                    ToBatchInputSet: aBatchInputSet
                };

                oDownloadModel.create("/BatchRequestSet", oPayload, {
                    success: function (oResponseData, oResponse) {
                        BusyIndicator.hide();
                        oThis.onExportExcel(oResponseData, null);
                    },
                    error: function (oError) {
                        BusyIndicator.hide();
                        var sErrorMessage = "Error exporting data to Excel.";
                        if (oError && oError.responseText) {
                            try {
                                var oErrorData = JSON.parse(oError.responseText);
                                if (oErrorData.error && oErrorData.error.message && oErrorData.error.message.value) {
                                    sErrorMessage = oErrorData.error.message.value;
                                }
                            } catch (e) {
                            }
                        }
                        MessageToast.show(sErrorMessage);
                    }
                });
            } else {
                oThis.onExportExcel(null, aBatchInputSet);
            }
        },

        /**
         * Loads ExcelJS library dynamically if not already loaded
         * @returns {Promise} Promise that resolves when ExcelJS is available
         * @private
         */
        _loadExcelJSLibrary: function () {
            return new Promise((resolve, reject) => {
                // Check if already loaded
                if (typeof window !== "undefined" && window.ExcelJS && typeof window.ExcelJS.Workbook !== "undefined") {
                    resolve(window.ExcelJS);
                    return;
                }

                sap.ui.require(["sap/ui/thirdparty/jquery"], ($) => {
                    const sCDNUrl = "https://cdn.jsdelivr.net/npm/exceljs/dist/exceljs.min.js";

                    $.getScript(sCDNUrl)
                        .done(() => {
                            // Wait a bit for the library to initialize
                            setTimeout(() => {
                                if (typeof window !== "undefined" && window.ExcelJS && typeof window.ExcelJS.Workbook !== "undefined") {
                                    resolve(window.ExcelJS);
                                } else {
                                    reject(new Error("ExcelJS library loaded but Workbook is not available"));
                                }
                            }, 100);
                        })
                        .fail((jqxhr, settings, exception) => {
                            console.error("ExcelJS load error:", exception);
                            reject(new Error("Failed to load ExcelJS from CDN: " + (exception || "Unknown error")));
                        });
                });
            });
        },

        /**
         * Generates a sanitized and unique sheet name from Material and Batch.
         * @param {String} sMaterial - Material number
         * @param {String} sBatch - Batch number
         * @param {Object} wb - ExcelJS Workbook instance
         * @returns {String} Sanitized sheet name
         * @private
         */
        _generateSheetName: function (sMaterial, sBatch, wb) {

            var sSanitizedMaterial = (sMaterial || "Material").toString().replace(/[*?:\\\/\[\]]/g, "_");
            var sSanitizedBatch = (sBatch || "Batch").toString().replace(/[*?:\\\/\[\]]/g, "_");

            var sSheetName = sSanitizedMaterial + "_" + sSanitizedBatch;


            if (sSheetName.length > 31) {
                var iMaxMaterial = Math.min(sSanitizedMaterial.length, 15);
                var iMaxBatch = Math.min(sSanitizedBatch.length, 15);
                sSheetName = sSanitizedMaterial.substring(0, iMaxMaterial) + "_" + sSanitizedBatch.substring(0, iMaxBatch);
                if (sSheetName.length > 31) {
                    sSheetName = sSheetName.substring(0, 31);
                }
            }

            // Ensure unique sheet name
            var sOriginalSheetName = sSheetName;
            var iSheetCounter = 1;
            while (wb.getWorksheet(sSheetName)) {
                var sBaseName = sOriginalSheetName.substring(0, Math.min(28, sOriginalSheetName.length));
                sSheetName = sBaseName + "_" + iSheetCounter;
                if (sSheetName.length > 31) {
                    sSheetName = sSheetName.substring(0, 31);
                }
                iSheetCounter++;
            }

            return sSheetName;
        },

        /**
         * Formats a date value to DD.MM.YYYY format.
         * Handles Date objects, date strings, and SAP date formats.
         * @param {Date|String|Object} vDate - The date value to format
         * @returns {String} Formatted date string in DD.MM.YYYY format, or empty string if invalid
         * @private
         */
        _formatDateToDDMMYYYY: function (vDate) {
            if (!vDate) {
                return "";
            }

            var oDate = null;

            // Handle Date object
            if (vDate instanceof Date) {
                oDate = vDate;
            }
            // Handle string dates (ISO format, etc.)
            else if (typeof vDate === "string" && vDate.trim() !== "") {
                // Try parsing as ISO date string
                oDate = new Date(vDate);
                // Check if date is valid
                if (isNaN(oDate.getTime())) {
                    // Try parsing as SAP date format (YYYYMMDD)
                    if (vDate.length === 8 && /^\d+$/.test(vDate)) {
                        var sYear = vDate.substring(0, 4);
                        var sMonth = vDate.substring(4, 6);
                        var sDay = vDate.substring(6, 8);
                        oDate = new Date(parseInt(sYear), parseInt(sMonth) - 1, parseInt(sDay));
                    } else {
                        // If still invalid, return original string
                        return vDate;
                    }
                }
            }
            // Handle SAP date object (if it has ms property)
            else if (vDate && typeof vDate === "object" && vDate.ms !== undefined) {
                oDate = new Date(vDate.ms);
            }
            // If already in DD.MM.YYYY format, return as is
            else if (typeof vDate === "string" && /^\d{2}\.\d{2}\.\d{4}$/.test(vDate)) {
                return vDate;
            }
            else {
                return String(vDate);
            }

            // Format to DD.MM.YYYY
            if (oDate && !isNaN(oDate.getTime())) {
                var iDay = oDate.getDate();
                var iMonth = oDate.getMonth() + 1;
                var iYear = oDate.getFullYear();
                var sDay = iDay < 10 ? "0" + iDay : String(iDay);
                var sMonth = iMonth < 10 ? "0" + iMonth : String(iMonth);
                return sDay + "." + sMonth + "." + iYear;
            }

            return String(vDate);
        },

        /**
         * Creates a single Excel sheet from response data.
         * @param {Object} wb - ExcelJS Workbook instance
         * @param {String} sSheetName - Name for the sheet
         * @param {Object} oResponseData - The response data from OData service
         * @private
         */
        _createExcelSheet: async function (wb, sSheetName, oResponseData) {
            // Extract data from OData response
            var aData = [];
            var sJsonResponse = null;

            // Check for JsonResponse property (which is a JSON string)
            if (oResponseData.JsonResponse) {
                sJsonResponse = oResponseData.JsonResponse;
            } else if (oResponseData.jsonResponse) {
                sJsonResponse = oResponseData.jsonResponse;
            } else if (oResponseData.d && oResponseData.d.JsonResponse) {
                sJsonResponse = oResponseData.d.JsonResponse;
            } else if (oResponseData.d && oResponseData.d.jsonResponse) {
                sJsonResponse = oResponseData.d.jsonResponse;
            }

            // Parse the JSON string if found
            if (sJsonResponse) {
                try {
                    if (typeof sJsonResponse === "string") {
                        aData = JSON.parse(sJsonResponse);
                    } else {
                        aData = sJsonResponse;
                    }
                } catch (e) {
                    console.error("JSON parse error:", e, "Response:", sJsonResponse);
                    return;
                }
            } else {
                // Fallback: check if response has results array or direct data
                var oResponseResults = oResponseData.results || (oResponseData.d && oResponseData.d.results) || [];

                if (Array.isArray(oResponseResults) && oResponseResults.length > 0) {
                    aData = oResponseResults;
                } else if (oResponseData && Object.keys(oResponseData).length > 0) {
                    aData = [oResponseData];
                } else if (oResponseData.d && oResponseData.d.results) {
                    aData = oResponseData.d.results;
                } else {
                    return;
                }
            }

            if (!aData || aData.length === 0) {
                return;
            }

            // Process each data item 
            var oData = aData[0];

            // Create worksheet
            const ws = wb.addWorksheet(sSheetName);

            // Two empty rows to match style
            ws.addRow([]);
            ws.addRow([]);

            // Header title row: "Header Details"
            var oHeaderTitleRow = ws.addRow(["", "Header Details"]);
            var iHeaderRowNum = oHeaderTitleRow.number; // should be 3
            ws.mergeCells("B" + iHeaderRowNum + ":D" + iHeaderRowNum);

            var oHeaderCell = ws.getCell("B" + iHeaderRowNum);
            oHeaderCell.font = { bold: true };
            oHeaderCell.alignment = { horizontal: "center", vertical: "middle" };
            oHeaderCell.fill = {
                type: "pattern",
                pattern: "solid",
                fgColor: { argb: "FFFF00" }
            };

            var sPOItem = oData["PO & Item"] || oData["POItem"] || oData["PO_Item"] || oData.POItem || "";
            var sPlant = oData.Plant || oData.Werk || "";
            var sMaterial = oData["Monster Material"] || oData.Material || oData.Matnr || "";
            var sBatch = oData.Batch || oData.Charg || "";
            var vManufactureDate = oData["Manufacture Date"] || oData.ManufactureDate || oData.Hsdat || "";
            var sManufactureDate = this._formatDateToDDMMYYYY(vManufactureDate);
            var sFormula = oData.Formula || oData.Zzhbcformula || "";
            var sGlobalMarketRegion = oData["Global Market Region"] || oData.GlobalMarketRegion || "";
            var sMarket = oData.Market || "";
            var sUDStatus = oData["UD Status"] || oData["UDStatus"] || oData["UD_Status"] || oData.UDStatus || oData.Vbewertung || "";

            ws.addRow(["", "PO & Item", sPOItem]);
            ws.addRow(["", "Plant", sPlant]);
            ws.addRow(["", "Monster Material", sMaterial]);
            ws.addRow(["", "Batch", sBatch]);
            ws.addRow(["", "Manufacture Date", sManufactureDate]);
            ws.addRow(["", "Formula", sFormula]);
            ws.addRow(["", "Global Market Region", sGlobalMarketRegion]);
            ws.addRow(["", "Market", sMarket]);
            ws.addRow(["", "UD Status", sUDStatus]);

            // Blank row between header and first operation block
            ws.addRow([]);

            // Loop all operations and create one block per operation
            var aOperations = oData.Operations || oData.operations || [];
            if (!aOperations.length) {
                return;
            }

            aOperations.forEach(function (oOperation, iIndex) {
                var sOperationText = oOperation["Operation text"] || oOperation.OperationText || oOperation.Operationtext || "";
                var aInspectionPoints = oOperation["Inspection Points"] || oOperation.InspectionPoints || oOperation.inspectionPoints || [];

                if (!aInspectionPoints.length) {
                    // If this operation has no inspection points, skip it
                    return;
                }

                if (iIndex > 0) {
                    ws.addRow([]);
                }

                // Sample columns = each "Sample Type/Syrup Batch"
                var aSamples = aInspectionPoints.map(function (ip) {
                    return ip["Sample Type/Syrup Batch"] || ip.SampleTypeSyrupBatch || ip.SampleType || "";
                });

                var aHeaderRow = ["", "Operation"];
                aSamples.forEach(function () {
                    aHeaderRow.push("Sample Type/Syrup Batch");
                });
                var oOpHeaderRow = ws.addRow(aHeaderRow);

                // Style header row
                oOpHeaderRow.font = { bold: true };
                oOpHeaderRow.eachCell(function (cell, colNumber) {
                    if (colNumber >= 2) {
                        cell.alignment = { horizontal: "center" };
                        cell.fill = {
                            type: "pattern",
                            pattern: "solid",
                            fgColor: { argb: "FFFF00" }
                        };
                    }
                });

                // Row: Operation text + sample codes
                var aSampleRow = ["", sOperationText];
                aSamples.forEach(function (sSample) {
                    aSampleRow.push(sSample);
                });
                ws.addRow(aSampleRow);

                ws.addRow([]);

                var oMicNameSet = new Set();
                aInspectionPoints.forEach(function (ip) {
                    var aMics = ip.MICs || ip.mics || ip.Mics || [];
                    aMics.forEach(function (mic) {
                        if (mic && (mic["MIC Name"] || mic.MICName || mic.MicName)) {
                            oMicNameSet.add(mic["MIC Name"] || mic.MICName || mic.MicName);
                        }
                    });
                });
                var aMicNames = Array.from(oMicNameSet);

                // For each MIC name create one row
                aMicNames.forEach(function (sMicName) {
                    var aRow = ["", sMicName];

                    aInspectionPoints.forEach(function (ip) {
                        var aMicList = ip.MICs || ip.mics || ip.Mics || [];
                        var oFound = aMicList.find(function (m) {
                            return (m["MIC Name"] || m.MICName || m.MicName) === sMicName;
                        });
                        aRow.push(oFound ? (oFound["MIC Value"] || oFound.MICValue || oFound.MicValue || "") : "");
                    });

                    ws.addRow(aRow);
                });
            });

            // Auto column widths
            ws.columns.forEach(function (col) {
                var maxLength = 10;
                col.eachCell({ includeEmpty: true }, function (cell) {
                    var val = cell.value == null ? "" : cell.value.toString();
                    if (val.length > maxLength) {
                        maxLength = val.length;
                    }
                });
                col.width = maxLength + 2;
            });
        },

        /**
         * Unified function to export inspection data to Excel file.
         * Handles both single and multiple selections.
         * @param {Object} oResponseData - The response data from OData service (for single selection)
         * @param {Array} aBatchInputSet - Array of Material/Batch objects (for multiple selection)
         * @public
         */
        onExportExcel: async function (oResponseData, aBatchInputSet) {
            try {
                // Load ExcelJS library dynamically
                var ExcelJS = await this._loadExcelJSLibrary();

                if (!ExcelJS || typeof ExcelJS.Workbook === "undefined") {
                    BusyIndicator.hide();
                    MessageToast.show("Failed to load ExcelJS library.");
                    return;
                }

                // Create workbook
                const wb = new ExcelJS.Workbook();
                var iProcessedCount = 0;
                var sFileName = "InspectionResults.xlsx";
                var sSuccessMessage = "Excel file downloaded successfully.";

                if (aBatchInputSet && aBatchInputSet.length > 0) {
                    // Multiple selection mode - send all items in a single request
                    var oDownloadModel = this.getOwnerComponent().getModel("downloadService");

                    // Generate unique RequestId for the single request
                    var sTimestamp = String(new Date().getTime()).slice(-6);
                    var sRandom = Math.random().toString(36).substr(2, 4).toUpperCase();
                    var sRequestId = sTimestamp + sRandom;

                    // Prepare payload with all Material/Batch combinations
                    var oPayload = {
                        RequestId: sRequestId,
                        ToBatchInputSet: aBatchInputSet
                    };

                    try {
                        // Single API call for all Material/Batch combinations
                        var oResponseData = await new Promise(function (resolve, reject) {
                            oDownloadModel.create("/BatchRequestSet", oPayload, {
                                success: function (oData, oResponse) {
                                    resolve(oData);
                                },
                                error: function (oError) {
                                    reject(oError);
                                }
                            });
                        });

                        // Extract and parse response data
                        var sJsonResponse = null;
                        if (oResponseData.JsonResponse) {
                            sJsonResponse = oResponseData.JsonResponse;
                        } else if (oResponseData.jsonResponse) {
                            sJsonResponse = oResponseData.jsonResponse;
                        } else if (oResponseData.d && oResponseData.d.JsonResponse) {
                            sJsonResponse = oResponseData.d.JsonResponse;
                        } else if (oResponseData.d && oResponseData.d.jsonResponse) {
                            sJsonResponse = oResponseData.d.jsonResponse;
                        }

                        var aAllData = [];
                        if (sJsonResponse) {
                            try {
                                if (typeof sJsonResponse === "string") {
                                    aAllData = JSON.parse(sJsonResponse);
                                } else {
                                    aAllData = sJsonResponse;
                                }
                            } catch (e) {
                                console.error("JSON parse error:", e);
                                BusyIndicator.hide();
                                MessageToast.show("Failed to parse response data.");
                                return;
                            }
                        } else {
                            // Fallback: check if response has results array
                            var oResponseResults = oResponseData.results || (oResponseData.d && oResponseData.d.results) || [];
                            if (Array.isArray(oResponseResults) && oResponseResults.length > 0) {
                                aAllData = oResponseResults;
                            } else if (oResponseData && Object.keys(oResponseData).length > 0) {
                                aAllData = [oResponseData];
                            }
                        }

                        // Ensure aAllData is an array
                        if (!Array.isArray(aAllData)) {
                            aAllData = [aAllData];
                        }

                        // Process each Material/Batch combination from the response
                        for (var i = 0; i < aAllData.length; i++) {
                            var oDataItem = aAllData[i];
                            if (!oDataItem) continue;

                            var sMaterial = oDataItem.Matnr || oDataItem.Material || "";

                            if (!sMaterial && oDataItem["Monster Material"]) {
                                var sMonsterMaterial = oDataItem["Monster Material"].toString();
                                var iDashIndex = sMonsterMaterial.indexOf(" - ");
                                if (iDashIndex > 0) {
                                    sMaterial = sMonsterMaterial.substring(0, iDashIndex).trim();
                                } else {
                                    sMaterial = sMonsterMaterial.trim();
                                }
                            }

                            var sBatch = oDataItem.Charg || oDataItem.Batch || "";


                            // If we can't find Material/Batch in data, use from input set
                            if (!sMaterial || !sBatch) {
                                var oBatchInput = aBatchInputSet[i];
                                if (oBatchInput) {
                                    sMaterial = oBatchInput.Material || sMaterial;
                                    sBatch = oBatchInput.Batch || sBatch;
                                }
                            }

                            // Generate sheet name from Material and Batch
                            var sSheetName = this._generateSheetName(sMaterial, sBatch, wb);

                            // Create sheet using the helper function
                            // Wrap the data item in a response-like structure
                            var oResponseForSheet = {
                                JsonResponse: JSON.stringify([oDataItem])
                            };

                            await this._createExcelSheet(wb, sSheetName, oResponseForSheet);
                            iProcessedCount++;
                        }

                        if (iProcessedCount === 0) {
                            BusyIndicator.hide();
                            MessageToast.show("Failed to export any data.");
                            return;
                        }

                        sSuccessMessage = "Excel file downloaded successfully with " + iProcessedCount + " sheet(s).";

                    } catch (oError) {
                        BusyIndicator.hide();
                        var sErrorMessage = "Error exporting data to Excel.";
                        if (oError && oError.responseText) {
                            try {
                                var oErrorData = JSON.parse(oError.responseText);
                                if (oErrorData.error && oErrorData.error.message && oErrorData.error.message.value) {
                                    sErrorMessage = oErrorData.error.message.value;
                                }
                            } catch (e) {
                                // Ignore parse errors
                            }
                        }
                        MessageToast.show(sErrorMessage);
                        console.error("Export error:", oError);
                        return;
                    }

                } else if (oResponseData) {
                    // Single selection mode
                    // Create sheet using the helper function
                    await this._createExcelSheet(wb, "Inspection Results", oResponseData);
                    iProcessedCount = 1;
                } else {
                    BusyIndicator.hide();
                    MessageToast.show("No data available to export.");
                    return;
                }

                // Download the file
                const buffer = await wb.xlsx.writeBuffer();
                const blob = new Blob([buffer], { type: "application/octet-stream" });
                const link = document.createElement("a");
                link.href = URL.createObjectURL(blob);
                link.download = sFileName;
                link.click();

                // Clean up
                URL.revokeObjectURL(link.href);
                BusyIndicator.hide();
                MessageToast.show(sSuccessMessage);

            } catch (oError) {
                BusyIndicator.hide();
                MessageToast.show("Error generating Excel file: " + (oError.message || "Unknown error"));
                console.error("Export error:", oError);
            }
        },



        //Excel template download for MASS Upload - Sharath
        onDownloadTemplate: function () {
            const oModel = this.getView().getModel();
            const oBusy = new sap.m.BusyDialog();
            oBusy.open();

            oModel.read("/UploadTemplateSet", {
                success: async (oData) => {
                    try {
                        const sJson = oData.results?.[0]?.JSON;
                        if (!sJson) {
                            sap.m.MessageToast.show("No template data found.");
                            oBusy.close();
                            return;
                        }

                        const aRows = JSON.parse(sJson);
                        if (!Array.isArray(aRows) || !aRows.length) {
                            sap.m.MessageBox.error("Invalid data.");
                            oBusy.close();
                            return;
                        }

                        const ExcelJS = await this._loadExcelJSLibrary();
                        const workbook = new ExcelJS.Workbook();
                        const sheet = workbook.addWorksheet("MassUpload_Template");

                        const headers = Object.keys(aRows[0]);
                        sheet.addRow(headers);
                        aRows.forEach(row => sheet.addRow(headers.map(h => row[h] || "")));
                        sheet.columns.forEach(col => col.width = 25);

                        const colors = {
                            HDR: "FFFFF9C4",
                            IP: "FFFFF9C4",
                            "0010": "FFBBDEFB",
                            "0020": "FFC8E6C9",
                            "0030": "FFFFE0B2",
                            "0040": "FFF8BBD0"
                        };

                        headers.forEach((_, i) => {
                            const colIndex = i + 1;
                            const row1Val = String(sheet.getRow(1).getCell(colIndex).value || "").trim();
                            const row2Val = String(sheet.getRow(2).getCell(colIndex).value || "").trim();
                            let fillColor = null;

                            if (/HDR|Header/i.test(row1Val) || /HDR|Header/i.test(row2Val)) fillColor = colors.HDR;
                            else if (/IP/i.test(row1Val) || /IP/i.test(row2Val)) fillColor = colors.IP;
                            else if (/0010|Items List/i.test(row1Val) || /0010|Items List/i.test(row2Val)) fillColor = colors["0010"];
                            else if (/0020|Syrup Inspection/i.test(row1Val) || /0020|Syrup Inspection/i.test(row2Val)) fillColor = colors["0020"];
                            else if (/0030|Final Product Inspection/i.test(row1Val) || /0030|Final Product Inspection/i.test(row2Val)) fillColor = colors["0030"];
                            else if (/0040|Micros Results/i.test(row1Val) || /0040|Micros Results/i.test(row2Val)) fillColor = colors["0040"];

                            if (fillColor) {
                                sheet.getColumn(colIndex).eachCell({ includeEmpty: true }, cell => {
                                    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: fillColor } };
                                });
                            }
                        });

                        const totalRows = sheet.rowCount;
                        const totalCols = sheet.columns.length;
                        const maxRows = Math.max(50, totalRows);

                        for (let r = 1; r <= maxRows; r++) {
                            const row = sheet.getRow(r);
                            for (let c = 1; c <= totalCols; c++) {
                                const cell = row.getCell(c);
                                if (r <= 4) cell.font = { ...cell.font, bold: true };
                                cell.border = {
                                    top: { style: "thin" },
                                    left: { style: "thin" },
                                    bottom: { style: "thin" },
                                    right: { style: "thin" }
                                };
                            }
                        }

                        const buffer = await workbook.xlsx.writeBuffer();
                        const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
                        const link = document.createElement("a");
                        link.href = URL.createObjectURL(blob);
                        link.download = "MassUpload_Template.xlsx";
                        link.click();
                        oBusy.close();

                    } catch (e) {
                        sap.m.MessageBox.error("Excel generation failed: " + (e.message || "Unknown error"));
                        oBusy.close();
                    }
                },
                error: (oError) => {
                    oBusy.close();
                    let sMessage = "Failed to fetch template data.";
                    try {
                        if (oError?.responseText) {
                            const oResponse = JSON.parse(oError.responseText);
                            sMessage = oResponse.error?.message?.value || oResponse.error?.message ||
                                oResponse.error?.innererror?.errordetails?.[0]?.message || sMessage;
                        } else if (oError?.message) {
                            sMessage = oError.message;
                        }
                    } catch {
                        sMessage = "backend error occurred.";
                    }
                    sap.m.MessageBox.error(sMessage);
                }
            });
        },

        /*
                onDownloadTemplate: function () {
                    const oModel = this.getView().getModel();
                    const oBusy = new sap.m.BusyDialog();
                    oBusy.open();
        
                    oModel.read("/UploadTemplateSet", {
                        success: (oData) => {
                            try {
                                const aResults = oData.results || [];
        
                                if (!aResults.length || !aResults[0].JSON) {
                                    sap.m.MessageToast.show("No template data found.");
                                    oBusy.close();
                                    return;
                                }
        
                                const aRows = JSON.parse(aResults[0].JSON);
        
                                if (!Array.isArray(aRows) || !aRows.length) {
                                    sap.m.MessageBox.error("Invalid Excel data.");
                                    oBusy.close();
                                    return;
                                }
        
                                const aColumns = Object.keys(aRows[0]).map((sKey) => ({
                                    label: sKey,
                                    property: sKey,
                                    width: 25
                                }));
        
                                const oSettings = {
                                    workbook: {
                                        columns: aColumns,
                                        context: {
                                            sheetName: "MassUpload_Template"
                                        }
                                    },
                                    dataSource: aRows,
                                    fileName: "MassUpload_Template.xlsx"
                                };
        
                                const oSheet = new sap.ui.export.Spreadsheet(oSettings);
        
                                oSheet.build()
                                    .then(() => {
                                        oSheet.destroy();
                                        oBusy.close();
                                    })
                                    .catch((err) => {
                                        console.error(err);
                                        sap.m.MessageBox.error("Excel generation failed.");
                                        oBusy.close();
                                    });
        
                            } catch (e) {
                                console.error(e);
                                sap.m.MessageBox.error("Error while creating Excel.");
                                oBusy.close();
                            }
                        },
                        error: (err) => {
                            console.error(err);
                            sap.m.MessageBox.error("Failed to fetch data.");
                            oBusy.close();
                        }
                    });
                },
                */

        //Mass Upload of Inspection Lot - Sharath
        MAX_FILE_SIZE_MB: 20,
        _oUploadDialog: null,
        _selectedFile: null,
        _fileBuffer: null,
        _jsonPayload: null,
        _selectedOperations: [],

        onOpenUploadDialog: function () {
            var oView = this.getView();

            if (!this._oUploadDialog) {
                sap.ui.core.Fragment.load({
                    id: oView.getId(),
                    name: "com.monsterenergy.qm.me.qm.qateam.fragment.Massupload",
                    controller: this
                }).then(function (oDialog) {
                    this._oUploadDialog = oDialog;
                    oView.addDependent(oDialog);
                    this._resetDialogState();
                    this.getOperation();
                    this._oUploadDialog.open();
                }.bind(this));
            } else {
                this._resetDialogState();
                this.getOperation();
                this._oUploadDialog.open();
            }
        },

        // Function to display the operation details in a checkbox – Sharath
        getOperation: async function () {
            var oVBox = this.byId("operationCheckBoxVBox");
            if (!oVBox) {
                return;
            }

            oVBox.removeAllItems();

            var aOperations = [];

            try {
                var oData = await this.readDataFromODataModel(
                    "/PlantBasedOperSet",
                    [
                        new sap.ui.model.Filter(
                            "Plant",
                            sap.ui.model.FilterOperator.EQ,
                            this.sPlant
                        )
                    ]
                );

                aOperations = oData && oData.results ? oData.results : [];

            } catch (err) {
                aOperations = [];
            }

            var aDefaultOps = ["0010", "0020", "0030"];

            aOperations.forEach(function (oOp) {
                var bSelected = aDefaultOps.indexOf(oOp.Inspoper) !== -1;

                oVBox.addItem(
                    new sap.m.CheckBox({
                        text: oOp.Inspoper + " - " + oOp.TxtOper,
                        selected: bSelected
                    })
                );
            });
        },


        // Handle the file size in MB for display – Sharath
        onFileChange: function (oEvent) {
            const oFile = oEvent.getParameter("files")?.[0];
            this._resetFileState();

            if (!oFile) {
                MessageBox.error("No file selected.");
                return;
            }

            const sizeMB = oFile.size / (1024 * 1024);
            this.byId("fileSizeText")?.setText(`File Size: ${sizeMB.toFixed(2)} MB`);

            if (sizeMB > this.MAX_FILE_SIZE_MB) {
                MessageBox.error(`File exceeds ${this.MAX_FILE_SIZE_MB} MB limit.`);
                return;
            }

            this._selectedFile = oFile;

            const reader = new FileReader();
            reader.onload = (e) => {
                this._fileBuffer = e.target.result;
            };
            reader.onerror = () => {
                MessageBox.error("Failed to read file.");
                this._resetFileState();
            };
            reader.readAsArrayBuffer(oFile);
        },

        // Validation and restriction on the number of InspLot/line items uploaded at one time – Sharath
        _validateUniqueMaterialBatch: function (data) {
            const header = data[0];

            const matIndex = header.indexOf("HDR|QALS-MATNR");
            const batchIndex = header.indexOf("HDR|QALS-CHARG");

            const unique = new Set();

            for (let i = 4; i < data.length; i++) {
                const row = data[i] || [];

                const material = String(row[matIndex] || "").trim();
                const batch = String(row[batchIndex] || "").trim();

                if (!material && !batch) {
                    continue;
                }

                unique.add(material + "__" + batch);

                if (unique.size > 50) {
                    const excess = unique.size - 50;

                    sap.m.MessageBox.warning(
                        `Only up to 50 unique Material – Batch combinations are allowed.\n` +
                        `You have added ${unique.size} combinations (${excess} more than allowed).`
                    );
                    return false;
                }
            }

            return true;
        },


        // Mass upload functionality – Sharath
        onMassUpload: function () {
            try {
                if (!this._selectedFile || !this._fileBuffer) {
                    return MessageBox.error("Please select a valid Excel file.");
                }

                const wb = XLSX.read(this._fileBuffer, { type: "array" });
                const sheet = wb.Sheets[wb.SheetNames[0]];
                const data = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });

                const isValid = this._validateUniqueMaterialBatch(data);
                if (!isValid) {
                    return;
                }


                this._buildPayloadFromExcel();
                this._sendPayloadToBackend();

            } catch (e) {
                MessageBox.error("Processing failed: " + e.message);
            }
        },

        _getSelectedOperations: function () {
            var oVBox = this.byId("operationCheckBoxVBox");
            if (!oVBox) {
                return [];
            }

            var aItems = oVBox.getItems();

            var aSelectedOps = [];

            aItems.forEach(function (oCheckBox) {
                if (oCheckBox.getSelected()) {

                    var sText = oCheckBox.getText();
                    var sKey = sText.split(" - ")[0];

                    aSelectedOps.push(sKey);
                }
            });

            return aSelectedOps;
        },

        _buildPayloadFromExcel: function () {

            const aSelectedOps = this._getSelectedOperations();
            if (!aSelectedOps.length) throw new Error("At least one operation must be selected.");

            const sOpe = aSelectedOps.join(",");

            const wb = XLSX.read(this._fileBuffer, { type: "array" });
            const sheet = wb.Sheets[wb.SheetNames[0]];
            const data = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });

            if (data.length < 2) throw new Error("Excel must contain header");

            const headers = data[0].map(h => String(h).trim());
            const rows = data.slice(2);

            const headerOps = headers.map(h => h ? h.split("|")[0].trim() : "");

            const selectedCols = headers.filter((h, i) => {
                const up = h.toUpperCase();
                const op = headerOps[i];
                if (up.startsWith("HDR|") || up.startsWith("IP|")) return true;
                return aSelectedOps.includes(op);
            });

            const items = rows
                .filter(r => r.some(c => c !== ""))
                .map(r => {
                    const o = {};
                    headers.forEach((h, i) => {
                        if (selectedCols.includes(h)) {

                            const cell = r[i];

                            o[h] = (cell === undefined || cell === null)
                                ? ""
                                : String(cell).trim();
                        }
                    });
                    return o;
                });

            this._jsonPayload = {
                Werk: this.sPlant,
                Name: this.name || "",
                Email: this._userEmail || "",
                Operations: sOpe,
                JSONRes: "",
                JSON: JSON.stringify({
                    TotalRecords: items.length,
                    Items: items
                })
            };
        },

        // Handle the mass upload success and display the dynamic response table – Sharath
        _sendPayloadToBackend: function () {
            var appId = this.getOwnerComponent().getManifestEntry("sap.app").id;
            var appPath = appId.replaceAll(".", "/");
            var basePath = sap.ui.require.toUrl(appPath) + "/sap/opu/odata/sap/ZQM_BTP_INSP_DATA_UPLOAD_SRV/";

            BusyIndicator.show(0);

            $.ajax({
                url: basePath + "UploadTemplateSet",
                method: "GET",
                headers: { "X-CSRF-Token": "Fetch" },

                success: (result, xhr, data) => {
                    var token = data.getResponseHeader("X-CSRF-Token");
                    if (!token) {
                        BusyIndicator.hide();
                        MessageBox.error("Failed to fetch CSRF token.");
                        return;
                    }
                    this._postUploadPayload(basePath, token);
                },

                error: () => {
                    BusyIndicator.hide();
                    MessageBox.error("Unable to fetch CSRF token.");
                }
            });
        },

        _postUploadPayload: function () {
            if (!this._jsonPayload) {
                BusyIndicator.hide();
                return;
            }

            const oModel = this.getView().getModel();
            BusyIndicator.show();

            oModel.create("/UploadTemplateSet", this._jsonPayload, {
                success: (data) => {
                    BusyIndicator.hide();
                    this._resetFileState();
                    this.onCloseDialog();

                    let jsonRes = data?.JSONRes;

                    if (jsonRes === null || jsonRes === "") {
                        MessageBox.success("Mass Upload Successful.");
                        return;
                    }

                    if (typeof jsonRes === "string") {
                        try { jsonRes = JSON.parse(jsonRes); } catch (e) {
                            MessageBox.success("Mass Upload Successful.");
                            return;
                        }
                    }

                    this._showSuccessTable(jsonRes);
                },

                error: (err) => {
                    BusyIndicator.hide();
                    MessageBox.error(this._extractODataError(err));
                }
            });
        },

        _extractODataError: function (err) {
            try {
                const body = err?.responseText || "";
                if (body.startsWith("<")) {
                    const xml = $.parseXML(body);
                    return $(xml).find("message").first().text() || "Backend error.";
                }
                const json = JSON.parse(body);
                return json.error?.message?.value || "Backend error.";
            } catch (e) {
                return "backend issue.";
            }
        },

        onCloseDialog: function () {
            this.byId("uploadDialog")?.close();
        },

        _showSuccessTable: function (jsonRes) {
            try {
                if (typeof jsonRes === "string") jsonRes = JSON.parse(jsonRes);

                const columns = Object.keys(jsonRes[0] || {});
                const oTable = new sap.m.Table({ fixedLayout: false });

                columns.forEach(col => {
                    oTable.addColumn(new sap.m.Column({
                        header: new sap.m.Label({ text: col })
                    }));
                });

                const oModel = new sap.ui.model.json.JSONModel(jsonRes);
                oTable.setModel(oModel);

                oTable.bindItems("/", new sap.m.ColumnListItem({
                    cells: columns.map(col => new sap.m.Text({ text: `{${col}}` }))
                }));

                const oScroll = new sap.m.ScrollContainer({
                    height: "100%",
                    width: "100%",
                    vertical: true,
                    horizontal: true,
                    content: [oTable]
                });

                const oDialog = new sap.m.Dialog({
                    title: "Upload Summary",
                    contentWidth: "900px",
                    contentHeight: "600px",
                    resizable: true,
                    draggable: true,
                    content: [oScroll],
                    buttons: [
                        new sap.m.Button({
                            text: "Download Excel",
                            type: "Emphasized",
                            press: () => this._downloadExcel(jsonRes)
                        }),
                        new sap.m.Button({
                            text: "Close",
                            press: function () { oDialog.close(); oDialog.destroy(); }
                        })
                    ]
                });

                oDialog.open();
            } catch (err) {
                MessageBox.error("Unable to display backend table.");
            }
        },

        _downloadExcel: function (data) {
            const ws = XLSX.utils.json_to_sheet(data);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Upload Summary");
            XLSX.writeFile(wb, "Upload_Summary.xlsx");
        },

        _resetDialogState: function () {
            this._selectedFile = null;
            this._fileBuffer = null;
            this._jsonPayload = null;

            this.byId("fileUploader")?.clear();
            this.byId("fileSizeText")?.setText("File Size: 0 MB");
        },

        _resetFileState: function () {
            this._selectedFile = null;
            this._fileBuffer = null;
        },


        onCloseDialog: function () {
            this.byId("uploadDialog")?.close();
        },

        // Handle sort order for table – Sharath
        handleSortButtonPressed: function () {
            this.getViewSettingsDialog(
                "com.monsterenergy.qm.me.qm.qateam.fragment.SortDialog"
            ).then(function (oDialog) {
                this._oViewSettingsDialog = oDialog;
                oDialog.open();
            }.bind(this));
        },

        getViewSettingsDialog: function (sDialogFragmentName) {
            this._mViewSettingsDialogs = this._mViewSettingsDialogs || {};

            if (!this._mViewSettingsDialogs[sDialogFragmentName]) {
                this._mViewSettingsDialogs[sDialogFragmentName] = Fragment.load({
                    id: this.getView().getId(),
                    name: sDialogFragmentName,
                    controller: this
                }).then(function (oDialog) {
                    if (Device.system.desktop) {
                        oDialog.addStyleClass("sapUiSizeCompact");
                    }
                    this.getView().addDependent(oDialog);
                    return oDialog;
                }.bind(this));
            }
            return this._mViewSettingsDialogs[sDialogFragmentName];
        },

        handleSortDialogConfirm: function (oEvent) {
            var oTable = this.byId("table");
            var oBinding = oTable.getBinding("items");
            var mParams = oEvent.getParameters();

            var sPath = mParams.sortItem.getKey();
            var bDescending = mParams.sortDescending;

            if (sPath === "None") {
                oBinding.sort([]);
                this.byId("sortbutton").setType("Transparent");
                return;
            }

            this.byId("sortbutton").setType("Emphasized");

            oTable.getColumns().forEach(function (oCol) {
                oCol.setSortIndicator("None");
            });

            var oColumn = this.byId(sPath);
            if (oColumn) {
                oColumn.setSortIndicator(
                    bDescending ? "Descending" : "Ascending"
                );
            }

            oBinding.sort([new sap.ui.model.Sorter(sPath, bDescending)]);

            if (this.oSmartVariantManagement) {
                this.oSmartVariantManagement.currentVariantSetModified(true);
            }
        },

        onSortChange: function (oEvent) {
            var oTable = this.byId("table");
            var oBinding = oTable.getBinding("items");
            var oItem = oEvent.getParameter("item");

            if (oItem.getSortOrder() === "None") {
                oBinding.sort([]);
            } else {
                oBinding.sort([
                    new sap.ui.model.Sorter(
                        oItem.getKey(),
                        oItem.getSortOrder() === "Descending"
                    )
                ]);
            }

            if (this.oSmartVariantManagement) {
                this.oSmartVariantManagement.currentVariantSetModified(true);
            }
        },

        onExit: function () {
            if (this._oViewSettingsDialog) {
                this._oViewSettingsDialog.destroy();
                this._oViewSettingsDialog = null;
            }
            this._mViewSettingsDialogs = {};
        }

    });
});