/**
 * Test Harness Javascript.
 */

var sdk = {
    'v1':{'domain':'volume.timeli.io', sdk:{}},
    'v2':{'domain':'volume.timeli-staging.com', sdk:{}}
}

var g = {};
var current_version = null;

$(document).ready(function() {

    var z = getResources(APP.SDK);
    z.forEach(function(v){
        $('.resources').append($('<option>', {
            value: v,
            text: v
        }));
    });
    /*for (var name in APP.SDK) {
        if (APP.SDK.hasOwnProperty(name) && (typeof(APP.SDK[name]) != "function")) {
            $('.resources').append($('<option>', {
                value: name,
                text: name
            }));
        }
    }*/
    $('.version').change(function() {
        var v = $(this).val();
        if (current_version != v) {
            login(v);
        }

        /*if (eval(v+'_initialized')) {
            return;
        }*/
        //var active = [];
        /*$('.version option').each(function() {
            var nv = $(this).val();
            if ((nv != '0') && (nv != v)) {
                if (eval(nv+'_initialized')) {
                    active.push(nv);
                }
            }*/
        //});
        //var msg = '';
        //if (active.length > 0) {
            //msg = ""+active.length+" other version(s) active. These will be reset when you switch to "+v;


                /*active.forEach(function(a) {
                   eval(a+'_initialized = false;');
                });*/

        // }
        //else {

        //}
    });

    $('.resources').change(function() {
        $(".methods").empty();
        $('.methods').append($('<option>', {
            value: '0',
            text: 'Select Method'
        }));
        var res = getSelectedResource($(this).val());
        for (var n in res) {
            if ((res.hasOwnProperty(n)) &&  (typeof(res[n]) == "function")) {
                $('.methods').append($('<option>', {
                    value: n,
                    text: n
                }));
            };
        }
    });

    /*$('.resources').change(function() {
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
*/
    $('.methods').change(function() {
        var method = $(this).val();
        if (method == '0') {
            return;
        }
        var resource = $('.resources').val();
        var res = getSelectedResource(resource);
        var args = getFunctionArguments(res[method]);
        if (args.length > 0) {
            $('.params').empty();
            var prefix = resource + '_' + method + '_';
            for (var i = 0; i < args.length; i++) {
                if (args[i] == 'cb') {
                    continue;
                }
                var name = prefix + args[i];
                $('.params').append($('<label for="' + name + '">' + args[i] + '</label>'));
                $('.params').append($('<input type="text" value="" name="' + name + '">'));
                $('.params').append($('<br>'));
            }
            //$('.params').append($('<button class="go-button">Go</button>'));
            $('.code-box').hide();
            $('.go-box').show();
        }
    });

    /*$('.methods').change(function() {
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
                /!*$('.params').append($('<label>'+args[i]+':  <input type="text" value="" name="'+name+'"></label>'));*!/
                $('.params').append($('<label for="'+name+'">'+args[i]+'</label>'));
                $('.params').append($('<input type="text" value="" name="'+name+'">'));
                $('.params').append($('<br>'));
            }
            //$('.params').append($('<button class="go-button">Go</button>'));
            $('.code-box').hide();
            $('.go-box').show();
        }
    });*/

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
        var text = $('textarea[name=code]').val().trim();
        var cmds = [];
        try {
            cmds = eval('[' + text + ']');
        }
        catch (error) {
            logError("[Error] "+error.message);
            return;
        }
        cmds.reverse();
        if (cmds.length > 0) {
            runScript(sdk[current_version].sdk.APP.SDK,cmds, null, 1, function (r) {
                if (r.error) {
                    logError(r.error);
                }
                else {
                    logMsg(typeof(r.val) != 'undefined' ? JSON.stringify(r.val) : "No return value");
                }
            });
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
        var resource = getSelectedResource($('.resources').val());
        var method = $('.methods').val();
        vals.push(generalcb);
        resource[method].apply(resource, vals);
    });

    $('.clear-transcript').click(function() {
        $('#log').empty().append('<p align="left"></p>');
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
                //logPara();
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

    showPopup($('<p>Please select version of system to test before any other action.</p>'));

});

function getSelectedResource(resource) {
    if (current_version == null) {
        return null;
    }
    var name = "sdk[current_version].sdk.APP.SDK";
    var objs = resource.split('.');
    for (var i = 0; i < objs.length; i++) {
        name += '["' + objs[i] + '"]';
    }
    return eval(name);
}


function logMsg(str) {
    logPara()
    $("#log p:last-child").html($("#log p:last-child").html()+str+"<br>");
    scroll();
}

function logError(str) {
    $("#log").append('<p align="left" style="color:red">'+str+'</p><br>');
    logPara();
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
        //logPara();
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

/*
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
*/



/*function executeStatement(code, ret, cb) {

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

}*/

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

function run(sdk, code, cb) {

    var p =  new Promise(

        function(resolve, reject) {

            var regex = /([^\.]+)\.([^\(]+)\((.*)\)/;
            var r = code.trim().match(regex);
            if (r == null) {
                reject(new Error("cannot parse statement"));
            }

            var resource = r[1].trim();
            var method = r[2].trim();
            var strargs = r[3].trim();

            if (typeof(sdk[resource]) != 'object') {
                reject(new Error('resource type "' + resource + '" is not known.'));
            }

            if (typeof(sdk[resource][method]) != 'function') {
                reject(new Error('method "' + method + '" does not exist for resource "' + resource + '"'));
            }

            try {
                args = eval('[' + strargs + ']');
            }
            catch (err) {
                reject(new Error('failed to parse arguments for method "' + method + '" of resource "' + resource + '"'));
            }

            var statement = resource + ' ' + method + ' ' + '(' + strargs + ')';

            args.push(function (e, r) {
                if (e == null) {
                    resolve(r);
                }
                else {
                    reject(new Error(e));
                }
            });

            sdk[resource][method].apply(this, args);
        }
    );

    p.then(function(val) {
        cb({result:val});
    }, function(error) {
        cb({error:error});
    });
}

function runScript(sdk, script, r, line, cb) {
    var s = null;
    if (script.length > 0) {
        s = script.pop();
    }
    if (s == null) {
        cb({val:r});
        return;
    }
    if (typeof(s) == 'string') {
        run(sdk, s, function(r) {
            if (r.error) {
               cb({error:'line number: '+line+': '+r.error.message});
                return;
            }
            runScript(sdk, script, r.result, ++line, cb);
            return;
        });
    }
    else if (typeof(s) == 'function') {
        var ret = s(r);
        runScript(sdk, script, ret, ++line, cb);
        return;
    }
    else {
        cb({error:'line number: '+line+': cannot parse'});
    }
}

function getResources(o) {
    var res = [];
    for (var name in o) {
        if (o.hasOwnProperty(name) && (typeof(o[name]) == "object")) {
            res.push(name);
            var r = getResources(o[name]);
            r.forEach(function(v) {
                res.push(name+'.'+v);
            });
        }
    }
    return res;
}



function login(ver) {
    if ($.isEmptyObject(sdk[ver].sdk)) {
        logMsg('[Error] Initialization attempted for unknown version!');
        return;
    }
    if (!sdk[ver].sdk.APP.SDK.initialized) {
        $.post("/login", {'version':ver}, function (data, status) {
            if (data) {
                if (data.access_token) {
                        sdk[ver].sdk.APP.SDK.init($, {
                            domain: sdk[ver]['domain'],
                            port: 443,
                            https: true,
                            client_token: data.access_token
                        },
                        function () {
                            current_version = ver;
                            logMsg("Version '"+ver+"' initialized!");
                        });
                }
                else {
                    logMsg("Initializaton of version '"+ver+"' failed: "+data.message);
                }
            }
        }, "json")
            .fail(function (jqXHR, status, error) {
                alert("Initialization of version '"+ver+"' failed! "+error);
            });
    }
    else {
        current_version = ver;
    }
}

function reloadSDK()
{
    $('script[src$="sdk.js"]').remove();
    $('head').append('<script src="js/sdk.js""></script>');
}
