sap.ui.define([
    "sap/m/MessageToast",
    "sap/m/Dialog",
    "sap/m/Table",
    "sap/m/Column",
    "sap/m/Text",
    "sap/m/ColumnListItem",
    "sap/m/Button",
    "sap/ui/model/json/JSONModel",
    "sap/ui/export/Spreadsheet"
], function (MessageToast, Dialog, Table, Column, Text, ColumnListItem, Button, JSONModel, Spreadsheet) {
    'use strict';

    return {
        get_Results: function (oEvent) {

                var oModel = this.getView().getModel();
                var aContexts = this.extensionAPI.getSelectedContexts();
                var that = this;

                var aResults = [];
                var iCompleted = 0;

                this.getView().setBusy(true);
                for (let index = 0; index < aContexts.length; index++) {

                    var oData = aContexts[index].getObject();

                    var oPayload = {
                        schadnr: oData.schadnr
                    };

                    oModel.callFunction("/show_res", {
                        method: "POST",
                        urlParameters: oPayload,

                        success: function (oResult) {

                            var oResultData = oResult.results;

                            // store result
                            aResults.push(oResultData);

                            iCompleted++;

                            // when all calls finished
                            if (iCompleted === aContexts.length) {
                                that.getView().setBusy(false);
                                that._showResultPopup(aResults);

                            }

                        },

                        error: function () {
                            iCompleted++;

                            if (iCompleted === aContexts.length) {
                                that._showResultPopup(aResults);
                            }

                            MessageToast.show("Error calling backend");
                        }

                    });
                }
            },


            _showResultPopup: function (aData) {

                // Flatten nested arrays
                var aFlatData = aData.flat();

                var sthat = this;

                var oModel = new sap.ui.model.json.JSONModel();
                oModel.setData({ results: aFlatData });

                var oTable = new sap.m.Table({
                    columns: [
                        new sap.m.Column({
                            header: new sap.m.Text({ text: "Source Loss Number" }),
                            width: "10%" // smaller width
                        }),
                        new sap.m.Column({
                            header: new sap.m.Text({ text: "Target Loss Number" }),
                            width: "10%"
                        }),
                        new sap.m.Column({
                            header: new sap.m.Text({ text: "Process Ref Id" }),
                            width: "10%"
                        }),
                        new sap.m.Column({
                            header: new sap.m.Text({ text: "Status" }),
                            width: "10%"
                        }),
                        new sap.m.Column({
                            header: new sap.m.Text({ text: "Message" }),
                            width: "60%" // bigger width
                        })
                    ]
                });

                oTable.setModel(oModel);

                oTable.bindItems({
                    path: "/results",
                    template: new sap.m.ColumnListItem({
                        cells: [
                            new sap.m.Text({ text: "{Source_No}" }),
                            new sap.m.Text({ text: "{Target_No}" }),
                            new sap.m.Text({ text: "{Process_Id}" }),
                            new sap.m.Text({ text: "{Status}" }),
                            new sap.m.Text({ text: "{Message}" })
                        ]
                    })
                });

                var oDialog = new sap.m.Dialog({
                    title: "Claims Copy Logs",
                    content: [oTable],
                    buttons: [
                        new sap.m.Button({
                            text: "Export",
                            type: "Emphasized",
                            press: function () {
                                sthat._exportToExcel(aFlatData);
                            }
                        }),
                        new sap.m.Button({
                            text: "Close",
                            press: function () {
                                oDialog.close();
                            }
                        })
                    ],
                    afterClose: function () {
                        oDialog.destroy();
                    }
                });

                oDialog.open();
            },

            _exportToExcel: function (aData) {

                var aCols = [
                    { label: "Source Loss Number", property: "Source_No" },
                    { label: "Target Loss Number", property: "Target_No" },
                    { label: "Copy Ref Id", property: "Process_Id" },
                    { label: "Status", property: "Status" },
                    { label: "Message", property: "Message" }
                ];

                var oSettings = {
                    workbook: {
                        columns: aCols
                    },
                    dataSource: aData,
                    fileName: "Claims_Copy_Results.xlsx"
                };

                var oSheet = new sap.ui.export.Spreadsheet(oSettings);
                oSheet.build().finally(function () {
                    oSheet.destroy();
                });
            }

        };

});
