sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/ui/core/routing/History",
	"sap/m/MessageToast",
	"sap/ui/core/format/DateFormat",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator"
], function(Controller, History, MessageToast, DateFormat, Filter, FilterOperator) {
	"use strict";

	return Controller.extend("Portal_Phase_III.shopfloor.controller.Shfl_ProdOrdList", {
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
				OrderList: [],
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
			oDataModel.read("/ProdOrdListSet?$filter=Plant eq '" + plant + "' and MrpCtrler eq '" + mrpCtrl + "'", {
				success: function(data) {
					var oDateFormat = DateFormat.getDateInstance({
						pattern: "dd MMM yyyy"
					});
					if (data.results.length > 0) {
						var list = [];
						data.results.map(function(o) {
							list.push({
								"OrderNumber": parseInt(o.OrderNumber, 10).toString(),
								"Material": o.Material ? isNaN(parseInt(o.Material, 10)) ? o.Material : parseInt(o.Material, 10).toString() : "-",
								"OrderType": o.OrderType,
								"TargetQuantity": parseInt(o.TargetQuantity, 10).toString(),
								"SystemStatus": o.SystemStatus.split(" ")[o.SystemStatus.split(" ").length - 1],
								"ReservationNumber": parseInt(o.ReservationNumber, 10).toString(),
								"RoutingNo": parseInt(o.RoutingNo, 10).toString(),
								"StartDate": o.StartDate ? oDateFormat.format(oDateFormat.parse(o.StartDate.slice(0, 10))) : "-",
								"FinishDate": o.FinishDate ? oDateFormat.format(oDateFormat.parse(o.FinishDate.slice(0, 10))) : "-",
								"SchedReleaseDate": o.SchedReleaseDate ? oDateFormat.format(oDateFormat.parse(o.SchedReleaseDate.slice(0, 10))) : "-",
								"ActualReleaseDate": o.ActualReleaseDate ? oDateFormat.format(oDateFormat.parse(o.ActualReleaseDate.slice(0, 10))) : "-"
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
					new Filter("OrderNumber", FilterOperator.Contains, sQuery),
					new Filter("Material", FilterOperator.Contains, sQuery),
					new Filter("OrderType", FilterOperator.Contains, sQuery),
					new Filter("TargetQuantity", FilterOperator.Contains, sQuery),
					new Filter("SystemStatus", FilterOperator.Contains, sQuery),
					new Filter("ReservationNumber", FilterOperator.Contains, sQuery),
					new Filter("RoutingNo", FilterOperator.Contains, sQuery),
					new Filter("StartDate", FilterOperator.Contains, sQuery),
					new Filter("FinishDate", FilterOperator.Contains, sQuery),
					new Filter("SchedReleaseDate", FilterOperator.Contains, sQuery),
					new Filter("ActualReleaseDate", FilterOperator.Contains, sQuery),
					new Filter("EnteredBy", FilterOperator.Contains, sQuery)
				], false);
			}

			this._filter();
		},

		onSelect: function(oEvent) {
			var context = oEvent.getParameters().rowBindingContext;

			sap.ui.core.BusyIndicator.show();
			var sUri = "/sap/opu/odata/sap/ZSSR_SHFL_ODATA_SRV/";
			var oDataModel = new sap.ui.model.odata.ODataModel({
				serviceUrl: sUri
			});
			var that = this;
			var orderNo = context.getObject().OrderNumber;
			var OrderList = that.getView().getModel().oData.OrderList;
			oDataModel.read("/ProdOrdDetSet?$filter=ProductionNo eq '" + orderNo + "'", {
				success: function(data) {
					var oDateFormat = DateFormat.getDateInstance({
						pattern: "dd MMM yyyy"
					});
					if (data.results.length > 0) {
						var list = [];
						data.results.map(function(o) {
							list.push({
								"OrderNumber": parseInt(o.OrderNumber, 10),
								"ReservationItem": o.ReservationItem,
								"Material": o.Material ? isNaN(parseInt(o.Material, 10)) ? o.Material : parseInt(o.Material, 10).toString() : "-",
								"MaterialDescription": o.MaterialDescription.toUpperCase(),
								"ProdPlant": o.ProdPlant,
								"ReqDate": o.ReqDate ? oDateFormat.format(oDateFormat.parse(o.ReqDate.slice(0, 10))) : "-",
								"ReqQuan": parseInt(o.ReqQuan, 10),
								"ItemCategory": o.ItemCategory,
								"SystemStatus": o.SystemStatus
							});
						});
						var oModel = that.getView().getModel();
						oModel.ComponentList = list;
						oModel.OrderList = OrderList;
						that.getView().setModel(new sap.ui.model.json.JSONModel(oModel));
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
					that.openDetailsDialog();
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
				this._oDialog = sap.ui.xmlfragment("Portal_Phase_III.shopfloor.view.Shfl_ProdOrdDetDialog", this);
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