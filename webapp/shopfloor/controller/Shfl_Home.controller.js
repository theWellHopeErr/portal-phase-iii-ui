sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/m/MessageToast"
], function(Controller, MessageToast) {
	"use strict";

	return Controller.extend("Portal_Phase_III.shopfloor.controller.Shfl_Home", {
		onInit: function() {
			var oStorage = jQuery.sap.storage(jQuery.sap.storage.Type.local);
			var creds = oStorage.get("creds");
			if (!creds) {
				var oRouter = this.getOwnerComponent().getRouter();
				oRouter.navTo("Target_Shfl_Login");
				MessageToast.show("Unauthorized", 5000);
				return;
			}
		},

		goToPlnOrd: function() {
			var oRouter = this.getOwnerComponent().getRouter();
			oRouter.navTo("Target_Shfl_PlnOrdList");
		},

		goToProdOrd: function() {
			var oRouter = this.getOwnerComponent().getRouter();
			oRouter.navTo("Target_Shfl_ProdOrdList");
		},

		goToMatLog: function() {
			var oRouter = this.getOwnerComponent().getRouter();
			oRouter.navTo("Target_Shfl_MatList");
		},

		logout: function() {
			var oStorage = jQuery.sap.storage(jQuery.sap.storage.Type.local);
			oStorage.clear();
			var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			oRouter.navTo("Target_Landing", true);
		}
	});
});