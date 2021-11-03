sap.ui.define([
	"sap/ui/core/UIComponent",
	"sap/ui/Device",
	"Portal_Phase_III/model/models"
], function(UIComponent, Device, models) {
	"use strict";

	return UIComponent.extend("Portal_Phase_III.Component", {

		metadata: {
			manifest: "json"
		},

		/**
		 * The component is initialized by UI5 automatically during the startup of the app and calls the init method once.
		 * @public
		 * @override
		 */
		init: function() {
			// call the base component's init function
			UIComponent.prototype.init.apply(this, arguments);

			// set the device model
			this.setModel(models.createDeviceModel(), "device");
			this.getRouter().initialize();

			// this.renderRecastChatbot();
		},
		renderRecastChatbot: function() {
			if (!document.getElementById("cai-webchat")) {
				var s = document.createElement("script");
				s.setAttribute("id", "cai-webchat");
				s.setAttribute("src", "https://cdn.cai.tools.sap/webchat/webchat.js");
				document.body.appendChild(s);
			}
			s.setAttribute("channelId", "0d8f91c0-9806-47ed-aada-51aab3ed0d77");
			s.setAttribute("token", "7486c468c7776e3375f4602ead94e26f");
		}
	});
});