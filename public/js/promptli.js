/**
 * Test Harness Javascript.
 */
//var access_token = null;
var timeli_initialized = false;
$(document).ready(function() {
    $("#sdk-authenticate").click(function() {
        $.post("/login", function (data, status) {
            if (data && data.access_token) {
                //access_token = data.access_token;
                APP.SDK.init($, {
                        domain: "hari.timeli.io",
                        port: 443,
                        https: true,
                        client_token: data.access_token
                    },
                    function () {
                        timeli_initialized = true;
                        logMsg("Initialization Completed!");
                    });

            }
            /*
            var s = '';
            for (var key in data) {
                if (data.hasOwnProperty(key)) {
                    s += '['+key+'='+data[key]+']\n';
                }
            }
            s += '[status='+status+']\n';
            alert(s);
            */
        }, "json")
            .fail(function (jqXHR, status, error) {
                alert("Initialization failed! "+error);
            })
    });
    /*
    $("#sdk-asset").click(function() {
        if (access_token == null) {
            alert("You must authenticate first!");
            return false;
        }
        console.log("Going to call init!");
        APP.SDK.init($, {
                domain: "hari.timeli.io",
                port: 443,
                https: true,
                client_token: access_token
            },
            function () {
                APP.SDK.Asset.get(function (e, r) {
                    console.log(e, r);
                });
            });
    });
    */
    $("#sdk-asset").click(function() {
        if (!timeli_initialized) {
            alert("You must initialize the SDK first!");
            return false;
        }
        APP.SDK.Asset.get(function (e, r) {
            if (e == null) {
                logPara();
                logMsg(JSON.stringify(r));
            }
            else {
                logMsg(e);
            }
        });
    });

    var line = 0;
    $("#test-log").click(function() {
        logMsg("Testing the logging function...line: "+line);
        line++;
        if (line%5 == 0) {
            logPara();
        }
    });
});

function logMsg(str) {
    $("#log p:last-child").html($("#log p:last-child").html()+str+"<br>");
    scroll();
}

function logPara() {
    $("#log").append('<p align="left"></p>');
}

function scroll(){
    var d = document.getElementById("log");
    d.scrollTop = d.scrollHeight;
}


