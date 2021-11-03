sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/ui/core/routing/History",
	"sap/m/MessageToast",
	"sap/ui/core/format/DateFormat",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"sap/ui/core/Fragment"
], function(Controller, History, MessageToast, DateFormat, Filter, FilterOperator, Fragment) {
	"use strict";

	return Controller.extend("Portal_Phase_III.ehsm.controller.Ehsm_IncidentList", {
		onInit: function() {
			var oStorage = jQuery.sap.storage(jQuery.sap.storage.Type.local);
			var creds = oStorage.get("creds");
			if (!creds) {
				var oRouter = this.getOwnerComponent().getRouter();
				oRouter.navTo("Target_Ehsm_Login");
				MessageToast.show("Unauthorized", 5000);
				return;
			}
			var date = new Date();
			var oData = {
				editable: false,
				globalFilter: "",
				availabilityFilterOn: false,
				cellFilterOn: false,
				plant: creds.plant,
				date: date.getDate() + "-" + (date.getMonth() + 1) + "-" + date.getFullYear()
			};
			this._oGlobalFilter = null;
			this.getView().setModel(new sap.ui.model.json.JSONModel(oData));

			sap.ui.core.BusyIndicator.show();

			var sUri = "/sap/opu/odata/sap/ZSSR_EHSM_ODATA_SRV/";
			var oDataModel = new sap.ui.model.odata.ODataModel({
				serviceUrl: sUri
			});
			var that = this;
			var plant = creds.plant;
			oDataModel.read("/IncidListSet?$filter=Plant eq '" + plant + "'", {
				success: function(data) {
					if (data.results.length > 0) {
						var list = [];
						data.results.map(function(o) {
							list.push({
								"Recn": parseInt(o.Recn, 10).toString(),
								"Iatype": o.Iatype ? o.Iatype : "-",
								"Evdesc": o.Evdesc ? o.Evdesc : "-",
								"Dmtype": o.Dmtype ? o.Dmtype : "-",
								"Equnr": isNaN(parseInt(o.Equnr, 10)) ? o.Equnr : parseInt(o.Equnr, 10).toString(),
								"Invresult": o.Invresult ? o.Invresult : "-"
							});
						});
						that.getView().setModel(new sap.ui.model.json.JSONModel({
							"list": list
						}), "IncidentModel");
					} else {
						var err = "No Incidents found for this Plant";
						window.console.error(err);
						MessageToast.show(err);
					}
					sap.ui.core.BusyIndicator.hide();
				},
				error: function(err) {
					window.console.error(err);
					MessageToast.show("Something went wrong");
					sap.ui.core.BusyIndicator.hide();
				}
			});
		},
		dialogAfterclose: function(oEvent) {
			if (this._oDialog) {
				this._oDialog.destroy();
				this._oDialog = null;
			}
		},

		_filter: function() {
			var oFilter = null;
			if (this._oGlobalFilter) {
				oFilter = this._oGlobalFilter;
			}
			this.byId("table").getBinding().filter(oFilter, "Application");
		},
		filterGlobally: function(oEvent) {
			var sQuery = oEvent.getParameter("query");
			this._oGlobalFilter = null;

			if (sQuery) {
				this._oGlobalFilter = new Filter([
					new Filter("Recn", FilterOperator.Contains, sQuery),
					new Filter("Iatype", FilterOperator.Contains, sQuery),
					new Filter("Evdesc", FilterOperator.Contains, sQuery),
					new Filter("Dmtype", FilterOperator.Contains, sQuery),
					new Filter("Equnr", FilterOperator.Contains, sQuery),
					new Filter("Invresult", FilterOperator.Contains, sQuery)
				], false);
			}

			this._filter();
		},

		_getCreateDialog: function() {
			if (!this._oDialog) {
				this._oDialog = sap.ui.xmlfragment("Portal_Phase_III.ehsm.view.Ehsm_IncidentCreateDialog", this);
				this.getView().addDependent(this._oDialog);
			}
			return this._oDialog;
		},
		openCreateDialog: function() {
			var incidentList = this.getView().getModel("IncidentModel").oData.list;
			this.getView().setModel(new sap.ui.model.json.JSONModel({
				"list": incidentList,
				"details": {}
			}), "IncidentModel");
			this._getCreateDialog().open();
		},
		closeCreateDialog: function() {
			this._getCreateDialog().close();
		},
		createIncident: function() {
			var oInput = this.getView().getModel("IncidentModel").oData.details;
			if (!oInput.Crnam) {
				oInput.Crnam = "SSR";
			}
			if (oInput.Valfr) {
				oInput.Valfr = "/Date(" + new Date(oInput.Valfr).getTime() + ")/";
			}
			if (oInput.Valto) {
				oInput.Valto = "/Date(" + new Date(oInput.Valto).getTime() + ")/";
			}
			oInput.Iaplant = "SA01";

			var that = this;
			var sUri = "/sap/opu/odata/sap/ZSSR_EHSM_ODATA_SRV/";
			var oDataModel = new sap.ui.model.odata.v2.ODataModel(sUri, true, "abaper", "abap@123");
			oDataModel.create("/IncidCreateSet", oInput, {
				method: "POST",
				success: function(oCreatedEntry) {
					MessageToast.show("Incident Record Created with No: " + parseInt(oCreatedEntry.RecNo, 10));
					that.closeCreateDialog();
				},
				error: function(oError) {
					window.console.error(oError);
					MessageToast.show(oError.statusText);
				}
			});
		},

		onSelect: function(oEvent) {
			var context = oEvent.getParameters().rowBindingContext;
			var index = parseInt(context.sPath.split("/")[2], 10);
			var incidentList = this.getView().getModel("IncidentModel").oData.list;

			sap.ui.core.BusyIndicator.show();
			var sUri = "/sap/opu/odata/sap/ZSSR_EHSM_ODATA_SRV/";
			var oDataModel = new sap.ui.model.odata.ODataModel({
				serviceUrl: sUri
			});
			var that = this;
			var recn = incidentList[index].Recn;
			oDataModel.read("/IncidDetSet(RecNo='" + recn + "')", {
				success: function(data) {
					var oDateFormat = DateFormat.getDateInstance({
						pattern: "dd-MMM-yyyy"
					});
					var details = {
						"Recn": parseInt(data.Recn, 10).toString(),
						"Iatype": data.Iatype ? data.Iatype : "-",
						"Evdesc": data.Evdesc ? data.Evdesc : "-",
						"Dmtype": data.Dmtype ? data.Dmtype : "-",
						"Equnr": isNaN(parseInt(data.Equnr, 10)) ? data.Equnr : parseInt(data.Equnr, 10).toString(),
						"Invresult": data.Invresult ? data.Invresult : "-",
						"Eqdesc": data.Eqdesc ? data.Eqdesc : "-",
						"Valfr": data.Valfr ? oDateFormat.format(oDateFormat.parse(data.Valfr.slice(0, 10))) : "-",
						"Valto": data.Valto ? oDateFormat.format(oDateFormat.parse(data.Valto.slice(0, 10))) : "-",
						"Crdat": data.Crdat ? oDateFormat.format(oDateFormat.parse(data.Crdat.slice(0, 10))) : "-",
						"Crnam": data.Crnam ? data.Crnam : "-"
					};
					that.getView().setModel(new sap.ui.model.json.JSONModel({
						"list": incidentList,
						"details": details
					}), "IncidentModel");
					sap.ui.core.BusyIndicator.hide();
					that.openDetailsDialog();
				},
				error: function(err) {
					window.console.error(err);
					MessageToast.show("Something went wrong");
					sap.ui.core.BusyIndicator.hide();
				}
			});
		},
		_getDetailsDialog: function() {
			if (!this._oDialog) {
				this._oDialog = sap.ui.xmlfragment("Portal_Phase_III.ehsm.view.Ehsm_IncidentDetDialog", this);
				this.getView().addDependent(this._oDialog);
			}
			return this._oDialog;
		},
		openDetailsDialog: function() {
			this._getDetailsDialog().open();
			this.showDisplay();
		},
		closeDetailsDialog: function() {
			this._getDetailsDialog().close();
		},

		showDisplay: function() {
			var oData = this.getView().getModel().oData;
			oData.editable = false;
			this.getView().setModel(new sap.ui.model.json.JSONModel(oData));
			this._showFormFragment("Display");
		},
		showEdit: function() {
			var oData = this.getView().getModel().oData;
			oData.editable = true;
			this.getView().setModel(new sap.ui.model.json.JSONModel(oData));
			this._showFormFragment("Edit");
		},
		updateIncident: function() {
			var oInput = this.getView().getModel("IncidentModel").oData.details;
			oInput.Crdat = null;
			if (oInput.Valfr && oInput.Valfr !== "-") {
				oInput.Valfr = "/Date(" + new Date(oInput.Valfr).getTime() + ")/";
			} else {
				oInput.Valfr = null;
			}
			if (oInput.Valto && oInput.Valto !== "-") {
				oInput.Valto = "/Date(" + new Date(oInput.Valto).getTime() + ")/";
			} else {
				oInput.Valto = null;
			}
			var that = this;
			var sUri = "/sap/opu/odata/sap/ZSSR_EHSM_ODATA_SRV/";
			var oDataModel = new sap.ui.model.odata.v2.ODataModel(sUri, {
				defaultUpdateMethod: "PUT"
			}, true, "abaper", "abap@123");
			oDataModel.update("/IncidUpdateSet(Recn='" + oInput.Recn + "')", oInput, {
				method: "PUT",
				context: "null",
				urlParameters: null,
				async: true,
				success: function(oData) {
					var oDateFormat = DateFormat.getDateInstance({
						pattern: "dd-MMM-yyyy"
					});
					var incidentList = that.getView().getModel("IncidentModel").oData.list;
					var details = that.getView().getModel("IncidentModel").oData.details;
					if (details.Valto) {
						details.Valto = oDateFormat.format(new Date(parseInt(details.Valto.slice(6, 19), 10)));
					}
					if (details.Valfr) {
						details.Valfr = oDateFormat.format(new Date(parseInt(details.Valfr.slice(6, 19), 10)));
					}
					that.getView().setModel(new sap.ui.model.json.JSONModel({
						"list": incidentList,
						"details": details
					}), "IncidentModel");
					that.showDisplay();
					MessageToast.show("Record Updated");
				},
				error: function(oError) {
					window.console.error(JSON.parse(oError.responseText));
					MessageToast.show("Something went wrong.");
				}
			});
		},

		_getFormFragment: function(sFragmentName) {
			sap.ui.getCore().getElementById("dialog-incident-det")._formFragments = {};
			var oDialog = sap.ui.getCore().getElementById("dialog-incident-det");
			var pFormFragment = oDialog._formFragments[sFragmentName];

			if (!pFormFragment) {
				pFormFragment = Fragment.load({
					id: "dialog-incident-det",
					name: "Portal_Phase_III.ehsm.view.Ehsm_Incident" + sFragmentName,
					controller: this
				});
				oDialog._formFragments[sFragmentName] = pFormFragment;
			}

			return pFormFragment;
		},
		_showFormFragment: function(sFragmentName) {
			var oDialog = sap.ui.getCore().getElementById("dialog-incident-det");
			oDialog.destroyContent();
			this._getFormFragment(sFragmentName).then(function(oVBox) {
				oDialog.insertContent(oVBox);
			});
		},

		goBack: function(Evt) {
			var oHistory = History.getInstance();
			var sPreviousHash = oHistory.getPreviousHash();
			if (sPreviousHash !== undefined) {
				window.history.go(-1);
			} else {
				sap.ui.core.UIComponent.getRouterFor(this).navTo("Target_Ehsm_Home", true);
			}
		},
		logout: function() {
			// if (document.getElementById("cai-webchat-div")) {
			// 	document.getElementById("cai-webchat-div").style.display = "none";
			// }
			var oStorage = jQuery.sap.storage(jQuery.sap.storage.Type.local);
			oStorage.clear();
			var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			oRouter.navTo("Target_Landing", true);
		}
	});
});