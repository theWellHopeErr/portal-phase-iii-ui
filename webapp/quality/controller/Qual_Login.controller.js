sap.ui.define([
	"sap/m/MessageToast",
	"sap/ui/core/mvc/Controller"
], function(MessageToast, Controller) {
	"use strict";

	return Controller.extend("Portal_Phase_III.quality.controller.Qual_Login", {
		onInit: function() {
			var oData = {
				loading: false
			};
			this.getView().setModel(new sap.ui.model.json.JSONModel(oData));
		},

		onLogin: function() {
			var plant = this.getView().byId("plant").getValue().toUpperCase();
			var password = this.getView().byId("password").getValue();
			if (plant === "" || password === "") {
				MessageToast.show("Both Plant and Password is required");
				return;
			}

			var oModel = this.getView().getModel();
			oModel.loading = true;
			this.getView().setModel(new sap.ui.model.json.JSONModel(oModel));

			var that = this;
			var sUri = "/sap/opu/odata/sap/ZSSR_QUAL_ODATA_SRV/";
			var ODataModel = new sap.ui.model.odata.v2.ODataModel(sUri, true, "abaper", "abap@123");
			ODataModel.read("/AuthSet(Username='" + plant + "',Password='" + password + "')", {
				method: "GET",
				success: function(oData, oResponse) {
					var oModel1 = that.getView().getModel();
					oModel1.loading = false;
					that.getView().setModel(new sap.ui.model.json.JSONModel(oModel1));
					var creds = {
						"plant": plant,
						"mrpCont": oResponse.data.MrpCont
					};
					var oStorage = jQuery.sap.storage(jQuery.sap.storage.Type.local);
					oStorage.put("creds", creds);

					MessageToast.show("Logged In Successfully");

					var oRouter = that.getOwnerComponent().getRouter();
					oRouter.navTo("Target_Qual_Home");
				},
				error: function(oData, oResponse) {
					var oModel1 = that.getView().getModel();
					oModel1.loading = false;
					that.getView().setModel(new sap.ui.model.json.JSONModel(oModel1));
					MessageToast.show("Invalid Credentials. Try Again.");
				}
			});
		}
	});
});