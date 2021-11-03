sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/m/MessageToast",
	"sap/ui/core/format/DateFormat",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator"
], function(Controller, MessageToast, DateFormat, Filter, FilterOperator) {
	"use strict";

	return Controller.extend("Portal_Phase_III.quality.controller.Qual_UsageDecisionList", {
		onInit: function() {
			var oStorage = jQuery.sap.storage(jQuery.sap.storage.Type.local);
			var creds = oStorage.get("creds");
			if (!creds) {
				var oRouter = this.getOwnerComponent().getRouter();
				oRouter.navTo("Target_Qual_Login");
				MessageToast.show("Unauthorized", 5000);
				return;
			}

			var oData = {
				globalFilter: "",
				availabilityFilterOn: false,
				cellFilterOn: false
			};
			this._oGlobalFilter = null;
			this.getView().setModel(new sap.ui.model.json.JSONModel(oData));

			this.getOwnerComponent().getRouter().getRoute("Target_Qual_UsageDecisionList").attachMatched(this.onRouteMatched, this);
		},
		onRouteMatched: function(oEvent) {
			sap.ui.core.BusyIndicator.show();
			var sUri = "/sap/opu/odata/sap/ZSSR_QUAL_ODATA_SRV/";
			var oDataModel = new sap.ui.model.odata.ODataModel({
				serviceUrl: sUri
			});
			var that = this;
			oDataModel.read("/InspUdListSet?$filter=Plant eq 'SA01'", {
				success: function(data) {
					var oDateFormat = DateFormat.getDateInstance({
						pattern: "MMM dd, yyyy"
					});
					if (data.results.length > 0) {
						var list = [];
						data.results.map(function(o) {
							list.push({
								"CreatDat": oDateFormat.format(oDateFormat.parse(o.CreatDat.slice(0, 10))),
								"InspType": parseInt(o.InspType, 10).toString(),
								"Insplot": parseInt(o.Insplot, 10).toString(),
								"InsplotSize": parseInt(o.InsplotSize, 10).toString(),
								"Material": o.Material ? isNaN(parseInt(o.Material, 10)) ? o.Material : parseInt(o.Material, 10).toString() : "-",
								"SysStatus": o.SysStatus,
								"TxtMat": o.TxtMat,
								"Vendor": o.Vendor,
								"CodeValuation": o.CodeValuation,
								"QualityScore": o.QualityScore
							});
						});
						that.getView().setModel(new sap.ui.model.json.JSONModel({
							list: list
						}), "UdModel");
						sap.ui.core.BusyIndicator.hide();
					} else {
						window.console.log("Not Found");
					}
				},
				error: function(error) {
					window.console.log(error);
				}
			});
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
					new Filter("CreatDat", FilterOperator.Contains, sQuery),
					new Filter("InspType", FilterOperator.Contains, sQuery),
					new Filter("Insplot", FilterOperator.Contains, sQuery),
					new Filter("InsplotSize", FilterOperator.Contains, sQuery),
					new Filter("Material", FilterOperator.Contains, sQuery),
					new Filter("SysStatus", FilterOperator.Contains, sQuery),
					new Filter("TxtMat", FilterOperator.Contains, sQuery),
					new Filter("Vendor", FilterOperator.Contains, sQuery),
					new Filter("CodeValuation", FilterOperator.Contains, sQuery),
					new Filter("QualityScore", FilterOperator.Contains, sQuery)
				], false);
			}

			this._filter();
		},

		back: function() {
			sap.ui.core.UIComponent.getRouterFor(this).navTo("Target_Qual_ResultRecordsList", true);
		},
		logout: function() {
			var oStorage = jQuery.sap.storage(jQuery.sap.storage.Type.local);
			oStorage.clear();
			var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			oRouter.navTo("Target_Landing", true);
		}
	});
});