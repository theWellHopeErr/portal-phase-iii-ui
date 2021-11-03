sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/ui/core/routing/History",
	"sap/m/MessageToast",
	"sap/ui/core/format/DateFormat"
], function(Controller, History, MessageToast, DateFormat) {
	"use strict";

	return Controller.extend("Portal_Phase_III.ehsm.controller.Ehsm_RiskAsmtList", {
		onInit: function() {
			var oStorage = jQuery.sap.storage(jQuery.sap.storage.Type.local);
			var creds = oStorage.get("creds");
			if (!creds) {
				var oRouter = this.getOwnerComponent().getRouter();
				oRouter.navTo("Target_Ehsm_Login");
				MessageToast.show("Unauthorized", 5000);
				return;
			}
			var oData = {
				agent: ""
			};
			this.getView().setModel(new sap.ui.model.json.JSONModel(oData));
		},

		onSearch: function() {
			var oDateFormat = DateFormat.getDateInstance({
				pattern: "dd-MMM-yyyy"
			});
			var sUri = "/sap/opu/odata/sap/ZSSR_EHSM_ODATA_SRV/";
			var oDataModel = new sap.ui.model.odata.ODataModel({
				serviceUrl: sUri
			});
			var that = this;
			var agent = this.getView().getModel().oData.agent.toUpperCase();
			oDataModel.read("RiskAsmtSet?$filter=Agent eq '" + agent + "'", {
				success: function(data) {
					if (data.results.length > 0) {
						var list = [];
						data.results.map(function(o) {
							list.push({
								"Recn": parseInt(o.Recn, 10),
								"Eptype": o.Eptype,
								"Erstatus": o.Erstatus,
								"Severe": o.Severe,
								"Crdat": o.Crdat ? oDateFormat.format(oDateFormat.parse(o.Crdat.slice(0, 10))) : "-",
								"Crnam": o.Crnam,
								"Rem": o.Rem,
								"Ratingcat": o.Ratingcat
							});
						});
						that.getView().setModel(new sap.ui.model.json.JSONModel({
							"list": list
						}), "RiskAsmtModel");
					} else {
						var err = "No Incidents found for this Plant";
						window.console.error(err);
						MessageToast.show(err);
					}
					sap.ui.core.BusyIndicator.hide();
				},
				error: function(err) {
					window.console.log(err);
					MessageToast.show("Something went wrong");
					sap.ui.core.BusyIndicator.hide();
				}
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