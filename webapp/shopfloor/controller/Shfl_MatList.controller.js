sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/ui/core/routing/History",
	"sap/m/MessageToast",
	"sap/ui/core/format/DateFormat",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator"
], function(Controller, History, MessageToast, DateFormat, Filter, FilterOperator) {
	"use strict";

	return Controller.extend("Portal_Phase_III.shopfloor.controller.Shfl_MatList", {
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
				MaterialList: [],
				OrderDetails: {},
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
			oDataModel.read("/MatListSet?$filter=Plant eq '" + plant + "'", {
				success: function(data) {
					if (data.results.length > 0) {
						var list = [];
						data.results.map(function(o) {
							list.push({
								"Material": o.Material ? isNaN(parseInt(o.Material, 10)) ? o.Material : parseInt(o.Material, 10).toString() : "-",
								"MatlDesc": o.MatlDesc
							});
						});
						var oModel = that.getView().getModel();
						oModel.MaterialList = list;
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
			var oStorage = jQuery.sap.storage(jQuery.sap.storage.Type.local);
			var creds = oStorage.get("creds");
			var context = oEvent.getParameters().rowBindingContext;

			sap.ui.core.BusyIndicator.show();
			var sUri = "/sap/opu/odata/sap/ZSSR_SHFL_ODATA_SRV/";
			var oDataModel = new sap.ui.model.odata.ODataModel({
				serviceUrl: sUri
			});
			var that = this;
			var plant = creds.plant;
			var matnr = context.getObject().Material;
			var MaterialList = that.getView().getModel().oData.MaterialList;
			oDataModel.read("/MatDetSet(MatNo='" + matnr + "',Plant='" + plant + "')", {
				success: function(data) {
					var oDateFormat = DateFormat.getDateInstance({
						pattern: "dd MMM yyyy"
					});

					var oModel = that.getView().getModel();
					var MrpList = {
						"MatNo": data.MatNo ? isNaN(parseInt(data.MatNo, 10)) ? data.MatNo : parseInt(data.MatNo, 10).toString() : "-", // Material No.
						"MrpDate": data.MrpDate ? oDateFormat.format(oDateFormat.parse(data.MrpDate.slice(0, 10))) : "-", // MRP date
						"MatlType": data.MatlType, // Material Type
						"BaseUomIso": data.BaseUomIso, // ISO code for unit of measurement
						"LlCode": data.LlCode, // Low-Level Code
						"MrpProcedure": data.MrpProcedure, // MRP procedure
						"PurGroup": data.PurGroup, // Purchasing Group
						"PlntStock": data.PlntStock, // Plant stock / only plant segment
						"Dayssupply": Math.abs(parseInt(data.Dayssupply, 10)).toString(), // Stock Days' Supply Without Receipts
						"Reqdayssupply": Math.abs(parseInt(data.Reqdayssupply, 10)).toString() //First Receipt Days' Supply
					};

					var MrpStockList = {
						"QualInspection": parseInt(data.QualInspection, 10).toString(), // Stock in Quality Inspection
						"Reservations": parseInt(data.Reservations, 10).toString(), // Reservations
						"PurOrders": parseInt(data.PurOrders, 10).toString(), // Purchase orders
						"PurReq": parseInt(data.PurReq, 10).toString(), // Purchase requisitions
						"PlndOrder": parseInt(data.PlndOrder, 10).toString(), // Planned orders
						"StkTrnfRel": parseInt(data.StkTrnfRel, 10).toString(), // Stock transfer release orders
						"TotalStck": parseInt(data.TotalStck, 10).toString(), // Warehouse stock / total (including special stor.locs)
						"FixedRecpt": parseInt(data.FixedRecpt, 10).toString(), // Total of promised receipts
						"PlReceipt": parseInt(data.PlReceipt, 10).toString(), // Total of planned receipts
						"FixedIssues": parseInt(data.FixedIssues, 10).toString() // Total of promised issues
					};

					oModel.MrpList = MrpList;
					oModel.MrpStockList = MrpStockList;
					oModel.MaterialList = MaterialList;

					that.getView().setModel(new sap.ui.model.json.JSONModel(oModel));
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

		_getDialog: function() {
			if (!this._oDialog) {
				this._oDialog = sap.ui.xmlfragment("Portal_Phase_III.shopfloor.view.Shfl_MatDetDialog", this);
				this.getView().addDependent(this._oDialog);
			}
			return this._oDialog;
		},

		openDetailsDialog: function() {
			this._getDialog().open();
		},

		closeDetailsDialog: function() {
			this._getDialog().close();
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