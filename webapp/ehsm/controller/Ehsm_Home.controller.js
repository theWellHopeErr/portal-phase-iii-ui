sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/m/MessageToast"
], function(Controller, MessageToast) {
	"use strict";

	return Controller.extend("Portal_Phase_III.ehsm.controller.Ehsm_Home", {
		onInit: function() {
			// if (document.getElementById("cai-webchat-div")) {
			// 	document.getElementById("cai-webchat-div").style.display = "block";
			// }
			var oStorage = jQuery.sap.storage(jQuery.sap.storage.Type.local);
			var creds = oStorage.get("creds");
			if (!creds) {
				var oRouter = this.getOwnerComponent().getRouter();
				oRouter.navTo("Target_Ehsm_Login");
				MessageToast.show("Unauthorized", 5000);
				return;
			}

			this.getView().setModel(new sap.ui.model.json.JSONModel({
				main: "Fetching",
				description: "Weather Data...",
				busy: true
			}), "weather");
			var that = this;
			$.ajax({
				url: "https://api.openweathermap.org/data/2.5/weather?id=1264527&appid=d95378437400d190e76003b36aaebf73",
				success: function(sResult) {
					that.getView().setModel(new sap.ui.model.json.JSONModel({
						main: sResult.weather[0].main,
						description: sResult.weather[0].description,
						temp: parseInt(sResult.main.feels_like / 10, 10),
						humidity: sResult.main.humidity,
						icon: "https://openweathermap.org/img/wn/" + sResult.weather[0].icon + "@2x.png",
						busy: false
					}), "weather");
					if (sResult.main.feels_like >= 300) {
						MessageToast.show("Temperature is above 30°C");
					}
					if (sResult.main.feels_like < 100) {
						MessageToast.show("Temperature is below 30°C");
					}
				},
				error: function(error) {
					that.getView().setModel(new sap.ui.model.json.JSONModel({
						main: "Something went wrong.",
						busy: false
					}, "weather"));
					window.console.error(error);
				}
			});
		},

		goToIncidents: function() {
			var oRouter = this.getOwnerComponent().getRouter();
			oRouter.navTo("Target_Ehsm_IncidentList");
		},

		goToRiskAsmt: function() {
			var oRouter = this.getOwnerComponent().getRouter();
			oRouter.navTo("Target_Ehsm_RiskAsmtList");
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