sap.ui.define([],
    function () {
        "use strict";

        return {
            date: function (dDate) {
                if (dDate) {
                    return dDate.getDate() + "/" + (dDate.getMonth() + 1) + "/" + dDate.getFullYear();
                }
            },
            
            formatTime: function (dDate) {
                var sHours = dDate.getHours() > 9 ? dDate.getHours() : "0" + dDate.getHours();
                var sMinutes = dDate.getMinutes() > 9 ? dDate.getMinutes() : "0" + dDate.getMinutes();
                var sSeconds = dDate.getSeconds() > 9 ? dDate.getSeconds() : "0" + dDate.getSeconds();

                return sHours + ":" + sMinutes + ":" + sSeconds;
            },

            time: function (oTime) {
                if (oTime) {
                    var oTimeFormat = sap.ui.core.format.DateFormat.getTimeInstance({ pattern: "HH':'mm':'ss'" });
                    var TZOffsetMs = new Date(0).getTimezoneOffset() * 60 * 1000;
                    return oTimeFormat.format(new Date(oTime.ms + TZOffsetMs));
                }
            },

            timeFormatter: function (oTime) {
                if (!oTime || oTime.ms === 0) {
                    return "";
                }

                var sPattern;
                // get time format of current user
                var sTimeFormat = sap.ui.getCore().getConfiguration().getFormatSettings().getLegacyTimeFormat();

                switch (sTimeFormat) {
                    case "0":
                        sPattern = "HH:mm:ss";
                        break;
                    case "1":
                    case "2":
                        sPattern = "hh:mm:ss a";
                        break;
                    case "3":
                    case "4":
                        sPattern = "KK:mm:ss a";
                        break;
                    default:
                        sPattern = "HH:mm:ss";
                }

                var oTimeFormat = sap.ui.core.format.DateFormat.getTimeInstance({
                    pattern: sPattern
                });
                var TZOffsetMs = new Date(0).getTimezoneOffset() * 60 * 1000;
                var sFormatedTime = oTimeFormat.format(new Date(oTime.ms + TZOffsetMs));

                // convert AM/PM part to lower case for these time formaters. By default, the AM/PM part is in upper case.
                if (sTimeFormat === "2" || sTimeFormat === "4") {
                    sFormatedTime = sFormatedTime.toLowerCase();
                }

                return sFormatedTime;
            },
            dateFormatter: function (oDate) {
                if (!oDate) {
                    return "";
                }
                if (typeof oDate === "string") {
                    return oDate;
                }
                var sPattern;
                // get date format of current user
                var sDateFormat = sap.ui.getCore().getConfiguration().getFormatSettings().getLegacyDateFormat();

                switch (sDateFormat) {
                    case "1":
                        sPattern = "dd.MM.yyyy";
                        break;
                    case "2":
                        sPattern = "MM/dd/yyyy";
                        break;
                    case "3":
                        sPattern = "MM-dd-yyyy";
                        break;
                    case "4":
                        sPattern = "yyyy.MM.dd";
                        break;
                    case "5":
                        sPattern = "yyyy/MM/dd";
                        break;
                    case "6":
                        sPattern = "yyyy-MM-dd";
                        break;
                    case "7":
                    case "8":
                    case "9":
                    case "A":
                    case "B":
                    case "C":
                    default:
                        sPattern = "MM/dd/yyyy";
                }

                var oDateFormat = sap.ui.core.format.DateFormat.getDateInstance({
                    pattern: sPattern
                });
                var sFormatedDate = "";
                var TZOffsetMs = oDate.getTimezoneOffset() * 60 * 1000;
                sFormatedDate = oDateFormat.format(new Date(oDate.getTime() + TZOffsetMs));
                if (oDate) {
                    sFormatedDate = oDateFormat.format(oDate);
                }

                return sFormatedDate;
            },

            dateTimeFormatter: function (dDate, tTime) {
                if (dDate && tTime) {
                    return this.formatter.dateFormatter(dDate) + " " + this.formatter.timeFormatter(tTime);
                } else if (dDate) {
                    return this.formatter.dateFormatter(dDate);
                }
                return "";
            },
            VendorFormat: function (sVendor, sVendorDesc) {
                if (sVendor) {
                    return sVendor + " - " + sVendorDesc;
                }
            },
            UserStatusFormat: function (sUser, sUserDesc) {
                if (sUser && sUserDesc) {
                    return sUser + " - " + sUserDesc;
                }
            }
        };
    });