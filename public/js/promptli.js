/**
 * Test Harness Javascript.
 */
//var access_token = null;
var timeli_initialized = false;
$(document).ready(function() {

    $.post("/login", function (data, status) {
        if (data) {
            if (data.access_token) {
                APP.SDK.init($, {
                        domain: "volume.timeli.io",
                        port: 443,
                        https: true,
                        client_token: data.access_token
                    },
                    function () {
                        timeli_initialized = true;
                        logMsg("Initialization Completed!");
                    });
            }
            else {
                logMsg("Initializaton failed: "+data.message);
            }
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
            $('.code-box').hide();
            $('.go-box').show();
        }
    });

    $('.code-button').click(function() {
        $('.go-box').hide();
        $('.code-box').show();
    });

    $('.clear-button').click(function() {
        $('textarea[name=code]').val('');
    });

    $('.close-button').click(function() {
        $('.code-box, .go-box').hide();
    });

    $('.save-button').click(function() {
        var ele = $('div.save').clone();
        ele.find('.popupsave').click(function() {
            var name = ele.find('input[name=name]').val();
            var content = $('textarea[name=code]').val();
            $.post("/save", {name:name, content:content}, function(resp) {
                if (resp.status == "success") {
                    ele.find('input').remove();
                    ele.find('.popupsave').remove();
                    ele.append("<p>Your test script has been saved as: '"+name+"'");
                    logMsg("Test script saved as: '"+name+"'");
                }
            }, "json");
        })
        showPopup(ele);
    });

    $('.get-button').click(function() {
        var ele = $('div.get').clone();
        ele.find('.popupget').click(function() {
            var name = ele.find('input[name=name]').val();
            $.get("/get", {name:name}, function(resp) {
                if (resp.status == "success") {
                    $('textarea[name=code]').val(resp.content);
                    ele.find('input').remove();
                    ele.find('.popupget').remove();
                    ele.append("<p>Your test script '"+name+"' has been fetched.");
                    logMsg("Test script '"+name+"' loaded.");
                }
            }, "json");
        })
        showPopup(ele);
    });

    $('.run-button').click(function() {
        var text = $('textarea[name=code]').val();
        try {
            runCode(text);
            //eval(text);
        }
        catch (e) {
            logMsg("[Error] "+ e.message);
        }
    });

    $('.go-button').click(function() {
        $('.show-box').hide();
        var vals = [];
        $('.go-box input').each(function() {
            var val = $(this).val().trim();
            if (val != '') {
                vals.push((val.charAt(0) == '{' ? JSON.parse(val) : val));
            }
        });
        var resource = $('.resources').val();
        var method = $('.methods').val();
        vals.push(generalcb);
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

function generalcb(e, r) {
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

function runCode(code) {
    var lines = code.split('\n');
    var lineno = 0;
    var errormsg = '';
    var nVar = {};

    lines.forEach(function(line, index, array) {
        lineno++;
        var z = line.split(/=(.+)?/);
        if (z.length ==1) { // no assignment
            executeStatement(z[0], false, function(ret) {
                logPara();
                if (!ret.run) {
                    logMsg('[Error] in line no: ['+lineno+'] - '+ret.msg);
                }
                else {
                    logMsg('> ' + ret.msg);
                }
            });
        }
        else if (z.length == 3) { // with assignment
            executeStatement(z[1], true, function(ret) {
                logPara();
                if (!ret.run) {
                    logMsg('[Error] in line no: ['+lineno+'] - '+ret.msg);
                }
                else {
                    logMsg('> ' + ret.msg);
                }
                nVar[z[0].trim()] = ret;
                logMsg(JSON.stringify(nVar[z[0].trim()]));
            });
        }
        else { // not sure what this can be
            logMsg('[Error] in line no: ['+lineno+'] - cannot parse statement.');
        }
    });
}



function executeStatement(code, ret, cb) {

    var p = code.trim().match(/^(.*)\((.*)\)/);
    if ((p == null) || (p.length != 3)) {
        cb({run:false, msg: "syntax error"});
        return;
    }
    var errormsg = '';

    // get resource and method
    var q = p[1].trim().split(' ');
    if (q.length != 2) {
        errormsg = 'either resource or method is not specified.';
        cb({run:false, msg: errormsg});
        return;
    }

    var resource = q[0].trim();
    var method = q[1].trim();

    if (typeof(APP.SDK[resource]) != 'object') {
        errormsg = 'resource type "'+resource+'" is not known.';
        cb({run:false, msg: errormsg});
        return;
    }

    if (typeof(APP.SDK[resource][method]) != 'function') {
        errormsg = 'method "'+method+'" does not exist for resource "'+resource+'"';
        cb({run:false, msg: errormsg});
        return;
    }

    var args = null;

    try {
        args = eval('[' + p[2].trim() + ']');
    }
    catch(err) {
        errormsg = 'error parsing arguments for method "'+method+'" of resource "'+resource+'"';
        cb({run:false, msg: errormsg});
    }
    var statement = resource + ' ' + method + ' ' + '('+p[2].trim()+')';
    if (!ret) {
        args.push(generalcb);
    }
    else {
        args.push(function(e, r) {
            if (e == null) {
                cb({run:true, msg:statement, value:r});
            }
            else {
                cb({run:false, msg:e, value:null});
            }
        });
    }
    APP.SDK[resource][method].apply(this, args);
    if (!ret) {
        cb({run: true, msg: statement});
    }

}

function showPopup(ele) {
    if (!ele) {
        return;
    }

    ele.find('.xbutton').click(function() {
        $.colorbox.close();
    });

    $.colorbox({
        html: ele,
        width: 500,
        height: 200
    });
}


