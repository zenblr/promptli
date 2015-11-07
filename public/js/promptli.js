/**
 * Test Harness Javascript.
 */
//var access_token = null;
var timeli_initialized = false;
$(document).ready(function() {

    $.post("/login", function (data, status) {
        if (data && data.access_token) {
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
    }, "json")
        .fail(function (jqXHR, status, error) {
            alert("Initialization failed! "+error);
        });

    for (var name in APP.SDK) {
        if (APP.SDK.hasOwnProperty(name) && (typeof(APP.SDK[name]) != "function")) {
            $('.resources').append($('<option>', {
                value: name,
                text: name
            }));
        }
    }

    $('.resources').change(function() {
        $(".methods").empty();
        $('.methods').append($('<option>', {
            value: '0',
            text: 'Select Method'
        }));
        var res = $(this).val();
        for (var name in APP.SDK[res]) {
            if ((APP.SDK[res].hasOwnProperty(name)) &&  (typeof(APP.SDK[res][name]) == "function")) {
                $('.methods').append($('<option>', {
                    value: name,
                    text: name
                }));
            };
         }
    });

    $('.methods').change(function() {
        var method = $(this).val();
        var resource = $('.resources').val();
        if (method == '0') {
            return;
        }
        var args = getFunctionArguments(APP.SDK[resource][method]);
        if (args.length > 0) {
            $('.params').empty();
            var prefix = resource+'_'+method+'_';
            for (var i=0; i<args.length; i++) {
                if (args[i] == 'cb') {
                    continue;
                }
                var name = prefix+args[i];
                /*$('.params').append($('<label>'+args[i]+':  <input type="text" value="" name="'+name+'"></label>'));*/
                $('.params').append($('<label for="'+name+'">'+args[i]+'</label>'));
                $('.params').append($('<input type="text" value="" name="'+name+'">'));
                $('.params').append($('<br>'));
            }
            //$('.params').append($('<button class="go-button">Go</button>'));
            $('.go-box').show();
        }
    });

    $('.go-button').click(function() {
        $('.go-box').hide();
        var vals = [];
        $('.go-box input').each(function() {
            var val = $(this).val().trim();
            if (val != '') {
                vals.push((val.charAt(0) == '{' ? JSON.parse(val) : val));
            }
        });
        var resource = $('.resources').val();
        var method = $('.methods').val();
        vals.push(cb);
        APP.SDK[resource][method].apply(this, vals);
    });

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
        APP.SDK.Asset.add("meter100", "asia/mumbai", {description:"hello,world"}, function (e, r) {
            if (e == null) {
                logPara();
                logMsg(JSON.stringify(r));
            }
            else {
                logMsg(JSON.stringify(e));
            }
        });
    });

    $("#test-log").click(function() {
        getFunctionArguments(logMsg)
        /*for (var i in APP.SDK.Asset) {
            //logMsg(">> "+i+","+typeof(APP.SDK.Asset[i]));
            if ((APP.SDK.Asset.hasOwnProperty(i)) &&  (typeof(APP.SDK.Asset[i]) == "function")) {
                logMsg(i);
            };
        }
        logPara();*/
    });

    $("input[name=command]").keyup(function(e) {
        if (e.keyCode == 13) {
            logMsg($(this).val());
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

// Credit: http://jsfiddle.net/jstoolsmith/ntFST/

function getFunctionArguments(f) {
    var argRE = /^\s*function\s+(?:\w*\s*)?\((.*?)\)/;
    var m = f.toString().match(argRE);
    if ((m != null) && (m.length > 1)) {
        return m[1].trim().split(/\s*,\s*/);
    }
    return [];
}

function cb(e, r) {
    if (e == null) {
        logPara();
        logMsg(JSON.stringify(r));
    }
    else {
        logMsg(JSON.stringify(e));
    }
}

$(document).ajaxStart(function () {
    $('#busy').show();
});

$(document).ajaxStop(function () {
    $('#busy').hide();
});


