sap.ui.define([
    "com/monsterenergy/qm/me/qm/qateam/controller/BaseController",
    "com/monsterenergy/qm/me/qm/qateam/js/Formatter",
    "sap/ui/model/json/JSONModel",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/m/Token",
    "sap/ui/core/BusyIndicator",
    "sap/m/MessageToast",
    "sap/ui/core/Fragment"
], (BaseController, Formatter, JSONModel, Filter, FilterOperator, Token, BusyIndicator, MessageToast, Fragment) => {
    "use strict";

    return BaseController.extend("com.monsterenergy.qm.me.qm.qateam.controller.HomePage", {
        formatter: Formatter,
        async onInit() {
            try {
                // const oPlantDetails = await this._getIasDetails();

                // let rawEmail = oPlantDetails.email;
                // if (Array.isArray(rawEmail)) {
                //     this._userEmail = rawEmail.find(email => email) || "";
                // } else {
                //     this._userEmail = rawEmail || "";
                // }

                // this._isQMUser = String(oPlantDetails.isQMUser).toLowerCase() === "true";

                // this.sPlant = "";
                // this.sPlantName = "";

                this.sPlant = "3011";
                this.sPlantName = "";

                // if (!this._isQMUser) {
                //     this.sPlant = oPlantDetails.Plant;
                //     this.sPlantName = oPlantDetails.PlantName;

                //     const oPlantInput = this.byId("plantInputname");
                //     if (oPlantInput) {
                //         oPlantInput.setValue(this.sPlant);
                //     }
                // } else {
                //     this.waitForCondition(
                //         () => this._userEmail.trim() !== "",
                //         () => this.PlantF4()
                //     );
                // }

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
                    this.getSubmitterInfo();
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
            var oMaterialMInput = this.getView().byId("materialMInput");
            var oBatchMInput = this.getView().byId("batchMInput");
            var oFormulaMInput = this.getView().byId("formulaMInput");
            var oDateRange = this.getView().byId("dateRangeSelection");
            var oStatusSelect = this.getView().byId("statusCombo");
            var sSelectedKey = oStatusSelect.getSelectedKey();
            //var oMsgStrip = this.getView().byId("msgstrip");

            var dStartDate = oDateRange.getDateValue();
            var dEndDate = oDateRange.getSecondDateValue();
            //var aPlantTokens = oPlantMInput.getTokens();
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

            if (sSelectedKey) {
                aTableFilters.push(new Filter({ path: "Status", operator: FilterOperator.EQ, value1: sSelectedKey }));
            }

            return aTableFilters;

        },
        /**
         * Internal Function to add Items, Filters and Sort to Header Table
         * @param {sap.ui.model.Filter[]} aTableFilters Array of Filters
         * @private
         */
        _filterHeaderTable: function (aTableFilters) {
            // Checks wether Table already having Items, if Items found add Filters to that.
            if (this.oTable.getBinding("items")) {
                this.oTable.getBinding("items").filter(aTableFilters);
            } else {
                // Binds Items Aggregation to Header Table
                this.oTable.bindAggregation("items", {
                    path: "/InspectionHeaderSet",
                    template: this.getView().byId("clmlistitem").clone().setVisible(true)
                });
                // Adding Filters and Sort to Items.
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
                oBatchF4 = await this.readDataFromODataModel("/Batch_F4Set", aFilters);
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
        onSubmitNewPress: async function () {
            var oViewModelData = this.getView().getModel("ViewModel").getData();
            BusyIndicator.show();

            try {
                if (!this._oSubmitNewDialog) {
                    this._oSubmitNewDialog = await this.loadFragment({
                        name: "com.monsterenergy.qm.me.qm.qateam.fragment.SubmitNewDialog"
                    });
                    this._oSubmitNewDialog.setModel(new JSONModel({}), "SubmitNewModel");
                }
            } catch (error) {
                return;
            }

            this.getView().byId("create_batch").setEditable(false);
            this.getView().byId("create_material").setValueState("None");
            this.getView().byId("create_batch").setValueState("None");
            this.getView().byId("submitter_name").setValueState("None");
            this.getView().byId("submitter_email").setValueState("None");

            this._oSubmitNewDialog.getModel("SubmitNewModel").setData({
                Matnr: "",
                Werk: this.sPlant,
                Charg: "",
                Userc2: "",
                Zzhbcformula: "",
                Atwrt: "",
                Hsdat: "",
                SubmitterName: oViewModelData.SubmitterName,
                SubmitterEmail: oViewModelData.SubmitterEmail,
            });
            this._oSubmitNewDialog.open();
            BusyIndicator.hide();
        },
        /*getBatchForFilterArea: function () {
            var aTokens = this._oMaterialMultiInput.getTokens();
            var oBatchModel = this.getView().getModel("BatchF4Model");
            var sMaterial = [];
            if (aTokens.length === 0) {
                if (oBatchModel) {
                    oBatchModel.setData({ results: [] });
                }
                return;
            }
            aTokens.forEach(oToken => sMaterial.push(oToken.getKey()));
            this.getBatchF4(sMaterial);
        },*/
        onSubmitPress: async function () {
            var oSubmitNewModel = this._oSubmitNewDialog.getModel("SubmitNewModel");
            var oCreateObject = oSubmitNewModel.getData();
            var oMaterialIp = this.getView().byId("create_material");
            var oBatchIp = this.getView().byId("create_batch");
            var oSubmitterNameIp = this.getView().byId("submitter_name");
            var oSubmitterEmailIp = this.getView().byId("submitter_email");
            var bIsValid = true;

            if (!oCreateObject.Matnr) {
                oMaterialIp.setValueState("Error");
                oMaterialIp.setValueStateText(this.getResourceBundle().getText("enterMaterial"));
                bIsValid = false;
            }

            if (!oCreateObject.Charg) {
                oBatchIp.setValueState("Error");
                oBatchIp.setValueStateText(this.getResourceBundle().getText("enterBatch"));
                bIsValid = false;
            }

            if (!bIsValid) {
                MessageToast.show(this.getResourceBundle().getText("fillMandatory"));
                return;
            }
            BusyIndicator.show();
            var oInspectionDetails = await this._getInspectionDetails();
            if (oInspectionDetails.results.length > 0) {
                this.getBatchF4();
                //this.getBatchForFilterArea();
                this._navToInspChars(oCreateObject.Werk, oCreateObject.Matnr, oCreateObject.Charg,
                    oCreateObject.SubmitterName, oCreateObject.SubmitterEmail, true);
                this._oSubmitNewDialog.close();
            } else {
                MessageToast.show(this.getResourceBundle().getText("inspDetNotFound"));
            }
            BusyIndicator.hide();
        },
        onCancelPress: function () {
            this.getBatchF4();
            this._oSubmitNewDialog.getModel("SubmitNewModel").setData({});
            this._oSubmitNewDialog.close();
        },
        onMaterialValueChange: async function (oEvent) {
            var oSource = oEvent.getSource();
            var sValue = oSource.getValue();
            var oBatchIp = this.getView().byId("create_batch");
            var oMaterialF4Model = this.getView().getModel("MaterialF4Model");

            oBatchIp.setValue("");
            oBatchIp.setEditable(false);
            this._setSubmitDialogDefaultvalues();

            if (!sValue) {
                oSource.setValueState("Error");
                oSource.setValueStateText(this.getResourceBundle().getText("enterMaterial"));
                return;
            }

            var oFound = oMaterialF4Model.getProperty("/results").find((oResult) => sValue === oResult.Matnr);
            if (!oFound) {
                oSource.setValue("");
                oSource.setValueState("Error");
                oSource.setValueStateText(this.getResourceBundle().getText("invalidMaterial"));
                return;
            } else {
                oSource.setValueState("None");
            }

            oBatchIp.setEditable(true);

            this.getBatchF4([sValue]);
        },
        onBatchValueChange: async function (oEvent) {
            var oSource = oEvent.getSource();
            var sValue = oSource.getValue();
            var oBatchF4Model = this.getView().getModel("BatchF4Model");

            this._setSubmitDialogDefaultvalues();

            if (!sValue) {
                oSource.setValueState("Error");
                oSource.setValueStateText(this.getResourceBundle().getText("enterBatch"));
                return;
            }

            var oFound = oBatchF4Model.getProperty("/results").find((oResult) => sValue === oResult.Charg);
            if (!oFound) {
                oSource.setValue("");
                oSource.setValueState("Error");
                oSource.setValueStateText(this.getResourceBundle().getText("invalidBatch"));
                return;
            } else {
                oSource.setValueState("None");
            }

            //this._getInspectionDetails();
        },
        onSubmitterNameChange: function (oEvent) {
            var oSource = oEvent.getSource();
            var sName = oSource.getValue();

            if (!sName) {
                oSource.setValueState("Error");
                oSource.setValueStateText(this.getResourceBundle().getText("enterSubName"));
            } else {
                oSource.setValueState("None");
            }
        },
        onEmailChange: function (oEvent) {
            var oSource = oEvent.getSource();
            var sMail = oSource.getValue();
            var regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

            if (!regex.test(sMail)) {
                oSource.setValue("");
                oSource.setValueState("Error");
                oSource.setValueStateText(this.getResourceBundle().getText("invalidEmail"));
            } else {
                oSource.setValueState("None");
            }
        },
        _setSubmitDialogDefaultvalues: function () {
            var oSumbitModel = this._oSubmitNewDialog.getModel("SubmitNewModel");
            oSumbitModel.setProperty("/Zzhbcformula", "");
            oSumbitModel.setProperty("/Atwrt", "");
            oSumbitModel.setProperty("/Hsdat", "");
        },
        _getInspectionDetails: async function () {
            var oSumbitModel = this._oSubmitNewDialog.getModel("SubmitNewModel");
            var oData = oSumbitModel.getData();
            var aFilters = [new Filter({ path: "Werk", operator: FilterOperator.EQ, value1: oData.Werk }),
            new Filter({ path: "Matnr", operator: FilterOperator.EQ, value1: oData.Matnr }),
            new Filter({ path: "Charg", operator: FilterOperator.EQ, value1: oData.Charg })];
            var oInspDetails = { results: [] };


            try {
                oInspDetails = await this.readDataFromODataModel("/InspectionDetailsSet", aFilters);
            } catch (error) { }

            if (oInspDetails && oInspDetails.results.length > 0) {
                oSumbitModel.setProperty("/Zzhbcformula", oInspDetails.results[0].Zzhbcformula);
                oSumbitModel.setProperty("/Atwrt", oInspDetails.results[0].Atwrt);
                oSumbitModel.setProperty("/Hsdat", oInspDetails.results[0].Hsdat);
            }
            return new Promise(resolve => resolve(oInspDetails));
        },
        /*
        onItemPress: async function (oEvent) {
            var oViewModelData = this.getView().getModel("ViewModel").getData();
            var oSelectedContext = oEvent.getSource().getSelectedItem().getBindingContext();
            var oSelcetedObject = oSelectedContext.getObject();
            this._navToInspChars(oSelcetedObject.Werk, oSelcetedObject.Matnr, oSelcetedObject.Charg, oViewModelData.SubmitterName, oViewModelData.SubmitterEmail, false);
        },
        _navToInspChars: function (sPlant, sMaterial, sBatch, sSubmitterName, sSubmitterEmail, bIsSubmitNew) {
            var oObj = {
                Plant: window.encodeURIComponent(sPlant),
                Material: window.encodeURIComponent(sMaterial),
                Batch: window.encodeURIComponent(sBatch),
                SubmitterName: window.encodeURIComponent(sSubmitterName),
                SubmitterEmail: window.encodeURIComponent(sSubmitterEmail),
                IsSubmitNew: window.encodeURIComponent(bIsSubmitNew),
            }
            this.getRouter().navTo("RouteCharacteristicOverview", oObj);
        },
        */

        onItemPress: async function (oEvent) {
            var oViewModelData = this.getView().getModel("ViewModel").getData();
            // In MultiSelect mode, get the pressed item directly from the event
            var oPressedItem = oEvent.getParameter("listItem") || oEvent.getSource();
            var oSelectedContext = oPressedItem.getBindingContext();
            var oSelcetedObject = oSelectedContext.getObject();

            var sSubmitterName = this._isQMUser ? "none" : oViewModelData.SubmitterName || "none";
            var sSubmitterEmail = this._isQMUser ? "none" : oViewModelData.SubmitterEmail || "none";

            this._navToInspChars(oSelcetedObject.Werk, oSelcetedObject.Matnr, oSelcetedObject.Charg, sSubmitterName, sSubmitterEmail, false);
        },
        _navToInspChars: function (sPlant, sMaterial, sBatch, sSubmitterName, sSubmitterEmail, bIsSubmitNew) {
            var oObj = {
                Plant: window.encodeURIComponent(sPlant),
                Material: window.encodeURIComponent(sMaterial),
                Batch: window.encodeURIComponent(sBatch),
                SubmitterName: window.encodeURIComponent(sSubmitterName),
                SubmitterEmail: window.encodeURIComponent(sSubmitterEmail),
                IsSubmitNew: window.encodeURIComponent(bIsSubmitNew),
                IsQMUser: encodeURIComponent(this._isQMUser === true ? "true" : "false")
            }
            this.getRouter().navTo("RouteCharacteristicOverview", oObj);
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
                            Batch: oData.Charg
                        });
                    }
                }
            }

            if (aBatchInputSet.length === 0) {
                MessageToast.show("Selected records do not contain valid Material and Batch information.");
                return;
            }

            // Call OData service - using download service model from manifest
            BusyIndicator.show();
            var oThis = this;
            var oDownloadModel = this.getOwnerComponent().getModel("downloadService");

            // If single selection, use existing flow
            if (aBatchInputSet.length === 1) {
                // Generate unique RequestId (max 10 characters)
                var sTimestamp = String(new Date().getTime()).slice(-6);
                var sRandom = Math.random().toString(36).substr(2, 4).toUpperCase();
                var sRequestId = sTimestamp + sRandom;

                // Prepare payload
                var oPayload = {
                    RequestId: sRequestId,
                    ToBatchInputSet: aBatchInputSet
                };

                oDownloadModel.create("/BatchRequestSet", oPayload, {
                    success: function (oResponseData, oResponse) {
                        BusyIndicator.hide();
                        // Call Excel export function with the response data
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
                                // Use default error message
                            }
                        }
                        MessageToast.show(sErrorMessage);
                    }
                });
            } else {
                // Multiple selections - create separate sheet for each Material/Batch
                oThis.onExportExcel(null, aBatchInputSet);
            }
        },

        /**
         * Loads ExcelJS library dynamically if not already loaded
         * @returns {Promise} Promise that resolves when ExcelJS is available
         * @private
         */
        _loadExcelJSLibrary: function () {
            return new Promise(function (resolve, reject) {
                // Check if already loaded
                if (typeof window !== "undefined" && window.ExcelJS && typeof window.ExcelJS.Workbook !== "undefined") {
                    resolve(window.ExcelJS);
                    return;
                }
               
                var sCDNUrl = "https://cdnjs.cloudflare.com/ajax/libs/exceljs/4.3.0/exceljs.min.js";
                var oScript = document.createElement("script");
                oScript.src = sCDNUrl;
                oScript.async = true;

                oScript.onload = function () {
                    // Wait a bit for the library to initialize
                    setTimeout(function () {
                        if (typeof window !== "undefined" && window.ExcelJS && typeof window.ExcelJS.Workbook !== "undefined") {
                            resolve(window.ExcelJS);
                        } else {
                            reject(new Error("ExcelJS library loaded but Workbook is not available"));
                        }
                    }, 100);
                };

                oScript.onerror = function () {
                    reject(new Error("Failed to load ExcelJS from CDN"));
                };

                document.head.appendChild(oScript);
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
            // Excel sheet names cannot contain: * ? : \ / [ ]
            // Also limited to 31 characters
            var sSanitizedMaterial = (sMaterial || "Material").toString().replace(/[*?:\\\/\[\]]/g, "_");
            var sSanitizedBatch = (sBatch || "Batch").toString().replace(/[*?:\\\/\[\]]/g, "_");
            
            var sSheetName = sSanitizedMaterial + "_" + sSanitizedBatch;
            
            // Excel sheet names are limited to 31 characters
            if (sSheetName.length > 31) {
                // Try to keep both Material and Batch, but truncate if needed
                var iMaxMaterial = Math.min(sSanitizedMaterial.length, 15);
                var iMaxBatch = Math.min(sSanitizedBatch.length, 15);
                sSheetName = sSanitizedMaterial.substring(0, iMaxMaterial) + "_" + sSanitizedBatch.substring(0, iMaxBatch);
                // If still too long, truncate further
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

            // Process each data item (assuming first item for now, can be extended for multiple)
            var oData = aData[0];

            // Create worksheet
            const ws = wb.addWorksheet(sSheetName);

            // Two empty rows to match style
            ws.addRow([]);
            ws.addRow([]);

            // Header title row: "Header Details"
            var oHeaderTitleRow = ws.addRow(["", "Header Details"]);
            var iHeaderRowNum = oHeaderTitleRow.number; // should be 3
            ws.mergeCells("B" + iHeaderRowNum + ":F" + iHeaderRowNum);

            var oHeaderCell = ws.getCell("B" + iHeaderRowNum);
            oHeaderCell.font = { bold: true };
            oHeaderCell.alignment = { horizontal: "center", vertical: "middle" };
            oHeaderCell.fill = {
                type: "pattern",
                pattern: "solid",
                fgColor: { argb: "FFFF00" }
            };

            
            var sPlant = oData.Plant || oData.Werk || "";
            var sMaterial = oData["Monster Material"] || oData.Material || oData.Matnr || "";
            var sBatch = oData.Batch || oData.Charg || "";
            var sManufactureDate = oData["Manufacture Date"] || oData.ManufactureDate || oData.Hsdat || "";
            var sFormula = oData.Formula || oData.Zzhbcformula || "";
            var sGlobalMarketRegion = oData["Global Market Region"] || oData.GlobalMarketRegion || "";
            var sMarket = oData.Market || "";

            ws.addRow(["", "Plant", sPlant]);
            ws.addRow(["", "Monster Material", sMaterial]);
            ws.addRow(["", "Batch", sBatch]);
            ws.addRow(["", "Manufacture Date", sManufactureDate]);
            ws.addRow(["", "Formula", sFormula]);
            ws.addRow(["", "Global Market Region", sGlobalMarketRegion]);
            ws.addRow(["", "Market", sMarket]);

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

                // Add a gap between operation blocks, but not before the first one
                if (iIndex > 0) {
                    ws.addRow([]);
                }

                // Sample columns = each "Sample Type/Syrup Batch"
                var aSamples = aInspectionPoints.map(function (ip) {
                    return ip["Sample Type/Syrup Batch"] || ip.SampleTypeSyrupBatch || ip.SampleType || "";
                });

                // Row: Operation + repeated "Sample Type/Syrup Batch"
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

                // Optional blank row before MIC rows for this operation
                ws.addRow([]);

                // Collect all unique MIC names for this operation dynamically
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
                    // Multiple selection mode
                    var oDownloadModel = this.getOwnerComponent().getModel("downloadService");

                    // Process each Material/Batch combination
                    for (var i = 0; i < aBatchInputSet.length; i++) {
                        var oBatchInput = aBatchInputSet[i];
                        
                        // Generate unique RequestId for each request
                        var sTimestamp = String(new Date().getTime() + i).slice(-6);
                        var sRandom = Math.random().toString(36).substr(2, 4).toUpperCase();
                        var sRequestId = sTimestamp + sRandom;

                        // Prepare payload for single Material/Batch
                        var oPayload = {
                            RequestId: sRequestId,
                            ToBatchInputSet: [oBatchInput]
                        };

                        // Call OData service for this Material/Batch
                        try {
                            var oResponseDataForBatch = await new Promise(function (resolve, reject) {
                                oDownloadModel.create("/BatchRequestSet", oPayload, {
                                    success: function (oData, oResponse) {
                                        resolve(oData);
                                    },
                                    error: function (oError) {
                                        reject(oError);
                                    }
                                });
                            });

                            // Generate sheet name from Material and Batch
                            var sSheetName = this._generateSheetName(oBatchInput.Material, oBatchInput.Batch, wb);

                            // Create sheet using the helper function
                            await this._createExcelSheet(wb, sSheetName, oResponseDataForBatch);
                            iProcessedCount++;

                        } catch (oError) {
                            console.error("Error processing Material/Batch:", oBatchInput, oError);
                            // Continue with next item even if one fails
                        }
                    }

                    if (iProcessedCount === 0) {
                        BusyIndicator.hide();
                        MessageToast.show("Failed to export any data.");
                        return;
                    }

                    sSuccessMessage = "Excel file downloaded successfully with " + iProcessedCount + " sheet(s).";

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

    });
});