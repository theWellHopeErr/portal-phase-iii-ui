sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/ui/core/routing/History",
	"sap/m/MessageToast",
	"sap/ui/core/format/DateFormat",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"sap/m/Dialog"
], function(Controller, History, MessageToast, DateFormat, Filter, FilterOperator, Dialog) {
	"use strict";

	return Controller.extend("Portal_Phase_III.shopfloor.controller.Shfl_PlnOrdList", {
		onInit: function() {
			var oStorage = jQuery.sap.storage(jQuery.sap.storage.Type.local);
			var creds = oStorage.get("creds");
			if (!creds) {
				var oRouter = this.getOwnerComponent().getRouter();
				oRouter.navTo("Target_Shfl_Login");
				MessageToast.show("Unauthorized", 5000);
				return;
			}
			var oData = {
				"OrderList": [],
				globalFilter: "",
				availabilityFilterOn: false,
				cellFilterOn: false
			};
			this._oGlobalFilter = null;
			this.getView().setModel(new sap.ui.model.json.JSONModel(oData));

			sap.ui.core.BusyIndicator.show();

			var sUri = "/sap/opu/odata/sap/ZSSR_SHFL_ODATA_SRV/";
			var oDataModel = new sap.ui.model.odata.ODataModel({
				serviceUrl: sUri
			});
			var that = this;
			var plant = creds.plant;
			var mrpCtrl = creds.mrpCont;
			oDataModel.read("/PlnOrdListSet?$filter=Plant eq '" + plant + "' and MrpCtrler eq '" + mrpCtrl + "'", {
				success: function(data) {
					var oDateFormat = DateFormat.getDateInstance({
						pattern: "dd MMM yyyy"
					});
					if (data.results.length > 0) {
						var list = [];
						data.results.map(function(o) {
							list.push({
								"PlannedorderNum": parseInt(o.PlannedorderNum, 10).toString(),
								"Material": isNaN(parseInt(o.Material, 10)) ? o.Material : parseInt(o.Material, 10).toString(),
								"OrderType": o.OrderType,
								"ProcurementType": o.ProcurementType,
								"TotalPlordQty": parseInt(o.TotalPlordQty, 10).toString(),
								"OrderStartDate": o.OrderStartDate ? oDateFormat.format(oDateFormat.parse(o.OrderStartDate.slice(0, 10))) : "",
								"OrderFinDate": o.OrderFinDate ? oDateFormat.format(oDateFormat.parse(o.OrderFinDate.slice(0, 10))) : "",
								"ReservNo": parseInt(o.ReservNo, 10).toString(),
								"ObjectType": o.ObjectType
							});
						});
						var oModel = that.getView().getModel();
						oModel.OrderList = list;
						that.getView().setModel(new sap.ui.model.json.JSONModel(oModel));
					} else {
						var err = "No Orders found for this Plant";
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
					new Filter("PlannedorderNum", FilterOperator.Contains, sQuery),
					new Filter("Material", FilterOperator.Contains, sQuery),
					new Filter("OrderType", FilterOperator.Contains, sQuery),
					new Filter("ProcurementType", FilterOperator.Contains, sQuery),
					new Filter("TotalPlordQty", FilterOperator.Contains, sQuery),
					new Filter("OrderStartDate", FilterOperator.Contains, sQuery),
					new Filter("OrderFinDate", FilterOperator.Contains, sQuery),
					new Filter("ReservNo", FilterOperator.Contains, sQuery),
					new Filter("ObjectType", FilterOperator.Contains, sQuery)
				], false);
			}

			this._filter();
		},

		_getCreateDialog: function() {
			if (!this._oDialog) {
				this._oDialog = sap.ui.xmlfragment("Portal_Phase_III.shopfloor.view.Shfl_CreateOrderDialog", this);
				this.getView().addDependent(this._oDialog);
			}
			return this._oDialog;
		},
		openCreateDialog: function() {
			this._getCreateDialog().setModel(new sap.ui.model.json.JSONModel({
				values: [{
					"Value": "LA",
					"Desc": "LA - Stock Order"
				}, {
					"Value": "KD",
					"Desc": "KD - Individual Customer Order"
				}, {
					"Value": "KB",
					"Desc": "KB - Standard Purchase Order I"
				}, {
					"Value": "LB",
					"Desc": "LB - Standard Purchase Order II"
				}, {
					"Value": "PR",
					"Desc": "PR - Project Order"
				}]
			}));
			this._getCreateDialog().open();
		},
		closeCreateDialog: function() {
			this._getCreateDialog().close();
		},
		createOrder: function() {
			console.log(sap.ui.getCore().byId("PldordProfile").getValue());
			if (!sap.ui.getCore().byId("PldordProfile").getValue() ||
				!sap.ui.getCore().byId("MaterialField").getValue() ||
				!sap.ui.getCore().byId("TotalPlordQty").getValue()) {
				sap.ui.getCore().byId("dialog-message").setVisible(true);
				return;
			}
			var oDateFormat = DateFormat.getDateInstance({
				pattern: "dd MMM yyyy"
			});
			var oStorage = jQuery.sap.storage(jQuery.sap.storage.Type.local);
			var creds = oStorage.get("creds");

			var oInput = {
				"PldordProfile": sap.ui.getCore().byId("PldordProfile").getValue().slice(0, 2).toUpperCase(),
				"Material": sap.ui.getCore().byId("MaterialField").getValue(),
				"TotalPlordQty": sap.ui.getCore().byId("TotalPlordQty").getValue()
			};
			oInput.PlanPlant = creds.plant;
			oInput.ProdPlant = creds.plant;
			var OrderStartDate = sap.ui.getCore().byId("OrderStartDate").getValue();
			var OrderFinDate = sap.ui.getCore().byId("OrderFinDate").getValue();
			if (OrderStartDate) {
				oInput.OrderStartDate = "/Date(" + oDateFormat.parse(OrderStartDate).getTime() + ")/";
			} else {
				var date = new Date();
				oInput.OrderStartDate = "/Date(" + date.getTime() + ")/";
			}
			if (OrderFinDate) {
				oInput.OrderFinDate = "/Date(" + oDateFormat.parse(OrderFinDate).getTime() + ")/";
			}

			window.console.log(oInput);
			sap.ui.core.BusyIndicator.show();
			sap.ui.getCore().byId("create-btn").setBusy(true);

			var that = this;
			var sUri = "/sap/opu/odata/sap/ZSSR_QUAL_ODATA_SRV/";
			var oDataModel = new sap.ui.model.odata.v2.ODataModel(sUri, true, "abaper", "abap@123");
			oDataModel.create("/PlnOrdCreateSet", oInput, {
				method: "POST",
				dataType: "json",
				contentType: "application/json, charset=utf-8",
				success: function(data) {
					if (data.PlannedorderNum)

					{
						MessageToast.show("Planned Order Created with No: " + data.PlannedorderNum);
						sap.ui.core.BusyIndicator.hide();
						sap.ui.getCore().byId("create-btn").setBusy(false);
						that._getCreateDialog().close();
					} else {
						MessageToast.show("Something went wrong. Try again.");
						sap.ui.core.BusyIndicator.hide();
						sap.ui.getCore().byId("create-btn").setBusy(false);
					}
				},
				error: function(oError) {
					var error = JSON.parse(oError.responseText);
					window.console.error(error);
					MessageToast.show(error.error.message.value);
					sap.ui.core.BusyIndicator.hide();
					sap.ui.getCore().byId("create-btn").setBusy(false);
				}
			});
		},

		onSelect: function(oEvent) {
			var context = oEvent.getParameters().rowBindingContext;

			sap.ui.core.BusyIndicator.show();
			var sUri = "/sap/opu/odata/sap/ZSSR_SHFL_ODATA_SRV/";
			var oDataModel = new sap.ui.model.odata.ODataModel({
				serviceUrl: sUri
			});
			var that = this;
			var orderNo = context.getObject().PlannedorderNum;
			var OrderList = that.getView().getModel().oData.OrderList;
			oDataModel.read("/PlnOrdDetSet?$filter=Plannedorder eq '" + orderNo + "'", {
				success: function(data) {
					var oDateFormat = DateFormat.getDateInstance({
						pattern: "dd MMM yyyy"
					});
					if (data.results.length > 0) {
						var list = [];
						data.results.map(function(o) {
							list.push({
								"Material": o.Material ? isNaN(parseInt(o.Material, 10)) ? o.Material : parseInt(o.Material, 10).toString() : "-",
								"BomItemNumber": parseInt(o.BomItemNumber, 10),
								"ItemCat": o.ItemCat,
								"MatlDesc": o.MatlDesc,
								"ReqQuan": Math.abs(parseInt(o.ReqQuan, 10)),
								"ReqDate": o.ReqDate ? oDateFormat.format(oDateFormat.parse(o.ReqDate.slice(0, 10))) : "-",
								"BaseUom": o.BaseUom,
								"MrpType": o.MrpType
							});
						});
						var oModel = that.getView().getModel();
						oModel.ComponentList = list;
						oModel.OrderList = OrderList;
						that.getView().setModel(new sap.ui.model.json.JSONModel(oModel));
						that.openDetailsDialog();
					} else {
						var err = "No Orders found for this Plant";
						var oModel1 = that.getView().getModel();
						oModel1.ComponentList = [];
						oModel1.OrderList = OrderList;
						that.getView().setModel(new sap.ui.model.json.JSONModel(oModel1));
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
		_getDetailsDialog: function() {
			if (!this._oDialog) {
				this._oDialog = sap.ui.xmlfragment("Portal_Phase_III.shopfloor.view.Shfl_PlnOrdDetDialog", this);
				this.getView().addDependent(this._oDialog);
			}
			return this._oDialog;
		},
		openDetailsDialog: function() {
			this._getDetailsDialog().open();
		},
		closeDetailsDialog: function() {
			this._getDetailsDialog().close();
		},

		goBack: function(Evt) {
			var oHistory = History.getInstance();
			var sPreviousHash = oHistory.getPreviousHash();
			if (sPreviousHash !== undefined) {
				window.history.go(-1);
			} else {
				sap.ui.core.UIComponent.getRouterFor(this).navTo("Target_Shfl_Home", true);
			}
		},
		logout: function() {
			var oStorage = jQuery.sap.storage(jQuery.sap.storage.Type.local);
			oStorage.clear();
			var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			oRouter.navTo("Target_Landing", true);
		}
	});
});