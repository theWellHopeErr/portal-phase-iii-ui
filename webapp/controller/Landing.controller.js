sap.ui.define([
	"sap/ui/core/mvc/Controller"
], function(Controller) {
	"use strict";

	return Controller.extend("Portal_Phase_III.controller.Landing", {
		goToSHFL: function() {
			var oRouter = this.getOwnerComponent().getRouter();
			oRouter.navTo("Target_Shfl_Login");
		},
		goToEHSM: function() {
			var oRouter = this.getOwnerComponent().getRouter();
			oRouter.navTo("Target_Ehsm_Login");
		},
		goToQUAL: function() {
			var oRouter = this.getOwnerComponent().getRouter();
			oRouter.navTo("Target_Qual_Login");
		}
	});
});